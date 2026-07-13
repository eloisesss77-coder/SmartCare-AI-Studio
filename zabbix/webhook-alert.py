#!/usr/bin/env python3
"""Zabbix Action Webhook 告警脚本

接收 Zabbix 告警事件，解析后通过多渠道发送通知，并调用后端 API 创建告警记录。

使用方式（Zabbix Media Type / Webhook）:
    此脚本由 Zabbix Server 在触发 Action 时调用，通过标准输入接收 JSON。
"""

import json
import logging
import os
import sys
from datetime import datetime
from typing import Any, Optional

import requests

# ---------------------------------------------------------------------------
# 日志配置
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] SmartCare-Webhook - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    stream=sys.stderr,
)
logger = logging.getLogger("smartcare-webhook")

# ---------------------------------------------------------------------------
# 告警消息模板
# ---------------------------------------------------------------------------
ALERT_EMOJI_MAP = {
    "Disaster": "🔴",
    "High": "🟠",
    "Average": "🟡",
    "Warning": "🔵",
    "Information": "ℹ️",
    "Not classified": "⚪",
}

ALERT_CN_MAP = {
    "Disaster": "灾难",
    "High": "严重",
    "Average": "一般",
    "Warning": "警告",
    "Information": "信息",
    "Not classified": "未分类",
}

ALERT_TEMPLATE = """{emoji} {severity_cn}告警：{elder_name} {alert_title}
📍 房间：{room_no}
⏰ 时间：{alert_time}
📊 等级：{severity}
{detail}
---
请立即前往查看！"""


def _load_configuration() -> dict:
    """从环境变量加载 Webhook 配置。"""
    return {
        "backend_api_base": os.environ.get("BACKEND_API_BASE", "http://localhost:8000"),
        "backend_api_timeout": int(os.environ.get("BACKEND_API_TIMEOUT", "10")),
        "dingtalk_webhook_url": os.environ.get("DINGTALK_WEBHOOK_URL", ""),
        "wechat_webhook_url": os.environ.get("WECHAT_WEBHOOK_URL", ""),
        "sms_gateway_url": os.environ.get("SMS_GATEWAY_URL", ""),
        "sms_gateway_key": os.environ.get("SMS_GATEWAY_KEY", ""),
        "app_push_url": os.environ.get("APP_PUSH_URL", ""),
    }


def _parse_zabbix_event(input_data: dict) -> dict:
    """解析 Zabbix 告警事件 JSON。

    Args:
        input_data: Zabbix 传入的原始事件数据

    Returns:
        结构化的告警信息
    """
    event_type = input_data.get("event_type", "")

    if event_type == "problem":
        event = input_data
    elif event_type == "trigger":
        event = {
            "host_name": input_data.get("host_name", "unknown"),
            "trigger_name": input_data.get("trigger_name", "Unknown"),
            "trigger_severity": input_data.get("trigger_severity", "Not classified"),
            "opdata": input_data.get("opdata", ""),
            "event_time": input_data.get("event_time", datetime.now().isoformat()),
            "trigger_tags": input_data.get("trigger_tags", {}),
        }
    else:
        # 直接使用原始数据
        event = input_data

    severity = event.get("trigger_severity", "Not classified")
    trigger_name = event.get("trigger_name", event.get("name", "未知告警"))
    host_name = event.get("host_name", "unknown")

    # 从 Tags 中提取老人和房间信息
    tags = event.get("tags", event.get("trigger_tags", {}))
    if isinstance(tags, list):
        tags_dict = {}
        for t in tags:
            tags_dict[t.get("tag", "")] = t.get("value", "")
        tags = tags_dict

    elder_id = tags.get("elder", "")
    room_no = tags.get("room", "")
    elder_name = host_name.replace("Elder-", "")

    alert_time = event.get("event_time", datetime.now().isoformat())
    try:
        dt = datetime.fromisoformat(str(alert_time).replace("Z", "+00:00"))
        alert_time_str = dt.strftime("%Y-%m-%d %H:%M:%S")
    except (ValueError, TypeError):
        alert_time_str = str(alert_time)

    return {
        "event_type": "problem",
        "host_name": host_name,
        "elder_id": elder_id,
        "elder_name": elder_name,
        "room_no": room_no,
        "trigger_name": trigger_name,
        "severity": severity,
        "severity_cn": ALERT_CN_MAP.get(severity, severity),
        "alert_time": alert_time_str,
        "opdata": event.get("opdata", event.get("description", "")),
        "detail": event.get("description", event.get("opdata", "")),
        "event_id": event.get("event_id", event.get("id", "")),
    }


def _notify_backend_api(alert_info: dict, config: dict) -> bool:
    """调用后端 API 创建告警记录。

    Args:
        alert_info: 告警信息
        config: Webhook 配置

    Returns:
        成功返回 True
    """
    api_url = f"{config['backend_api_base']}/api/v1/alerts"
    payload = {
        "source": "zabbix",
        "event_id": alert_info["event_id"],
        "elder_id": alert_info["elder_id"],
        "elder_name": alert_info["elder_name"],
        "room_no": alert_info["room_no"],
        "alert_type": alert_info["trigger_name"],
        "severity": alert_info["severity"],
        "alert_time": alert_info["alert_time"],
        "detail": alert_info["detail"],
    }

    try:
        response = requests.post(
            api_url,
            json=payload,
            timeout=config["backend_api_timeout"],
        )
        if response.status_code in (200, 201):
            logger.info("后端告警记录创建成功: %s", alert_info["event_id"])
            return True
        else:
            logger.warning("后端 API 返回异常: %d, %s", response.status_code, response.text[:200])
            return False
    except requests.exceptions.Timeout:
        logger.error("后端 API 请求超时")
        return False
    except Exception as exc:
        logger.error("后端 API 请求失败: %s", exc)
        return False


def _notify_dingtalk(alert_info: dict, webhook_url: str, timeout: int = 10) -> bool:
    """通过钉钉机器人发送告警通知。

    Args:
        alert_info: 告警信息
        webhook_url: 钉钉 Webhook 地址
        timeout: 请求超时

    Returns:
        成功返回 True
    """
    emoji = ALERT_EMOJI_MAP.get(alert_info["severity"], "⚪")

    text = ALERT_TEMPLATE.format(
        emoji=emoji,
        severity_cn=alert_info["severity_cn"],
        elder_name=alert_info["elder_name"],
        alert_title=alert_info["trigger_name"],
        room_no=alert_info["room_no"],
        alert_time=alert_info["alert_time"],
        severity=alert_info["severity"],
        detail=alert_info["detail"],
    )

    payload = {
        "msgtype": "markdown",
        "markdown": {
            "title": f"{alert_info['severity_cn']}告警: {alert_info['elder_name']}",
            "text": text,
        },
    }

    try:
        response = requests.post(webhook_url, json=payload, timeout=timeout)
        if response.status_code == 200 and response.json().get("errcode") == 0:
            logger.info("钉钉通知发送成功")
            return True
        else:
            logger.warning("钉钉通知发送失败: %s", response.text[:200])
            return False
    except requests.exceptions.Timeout:
        logger.error("钉钉通知请求超时")
        return False
    except Exception as exc:
        logger.error("钉钉通知发送异常: %s", exc)
        return False


def _notify_wechat_work(alert_info: dict, webhook_url: str, timeout: int = 10) -> bool:
    """通过企业微信机器人发送告警通知。

    Args:
        alert_info: 告警信息
        webhook_url: 企业微信 Webhook 地址
        timeout: 请求超时

    Returns:
        成功返回 True
    """
    text = ALERT_TEMPLATE.format(
        emoji=ALERT_EMOJI_MAP.get(alert_info["severity"], ""),
        severity_cn=alert_info["severity_cn"],
        elder_name=alert_info["elder_name"],
        alert_title=alert_info["trigger_name"],
        room_no=alert_info["room_no"],
        alert_time=alert_info["alert_time"],
        severity=alert_info["severity"],
        detail=alert_info["detail"],
    )

    payload = {
        "msgtype": "markdown",
        "markdown": {
            "content": text,
        },
    }

    try:
        response = requests.post(webhook_url, json=payload, timeout=timeout)
        if response.status_code == 200 and response.json().get("errcode") == 0:
            logger.info("企业微信通知发送成功")
            return True
        else:
            logger.warning("企业微信通知发送失败: %s", response.text[:200])
            return False
    except requests.exceptions.Timeout:
        logger.error("企业微信通知请求超时")
        return False
    except Exception as exc:
        logger.error("企业微信通知发送异常: %s", exc)
        return False


def _notify_sms_gateway(alert_info: dict, config: dict, timeout: int = 10) -> bool:
    """通过短信网关发送告警。

    Args:
        alert_info: 告警信息
        config: 包含 SMS 网关配置
        timeout: 请求超时

    Returns:
        成功返回 True
    """
    gateway_url = config.get("sms_gateway_url", "")
    if not gateway_url:
        logger.info("未配置短信网关，跳过")
        return True

    sms_text = (
        f"{ALERT_EMOJI_MAP.get(alert_info['severity'], '')}"
        f"{alert_info['severity_cn']}告警：{alert_info['elder_name']} {alert_info['trigger_name']}"
        f"，房间{alert_info['room_no']}，请立即查看！"
    )

    payload = {
        "key": config["sms_gateway_key"],
        "content": sms_text,
        "phone": os.environ.get("ALERT_PHONE", ""),
    }

    try:
        response = requests.post(gateway_url, json=payload, timeout=timeout)
        if response.status_code == 200:
            logger.info("短信通知发送成功")
            return True
        else:
            logger.warning("短信通知发送失败: %s", response.text[:200])
            return False
    except Exception as exc:
        logger.error("短信通知发送异常: %s", exc)
        return False


def _notify_app_push(alert_info: dict, push_url: str, timeout: int = 10) -> bool:
    """通过 APP Push 发送告警（预留接口）。

    Args:
        alert_info: 告警信息
        push_url: APP Push 服务 URL
        timeout: 请求超时

    Returns:
        成功返回 True
    """
    if not push_url:
        logger.info("未配置 APP Push，跳过")
        return True

    payload = {
        "elder_id": alert_info["elder_id"],
        "elder_name": alert_info["elder_name"],
        "room_no": alert_info["room_no"],
        "alert_type": alert_info["trigger_name"],
        "severity": alert_info["severity"],
        "alert_time": alert_info["alert_time"],
        "detail": alert_info["detail"],
    }

    try:
        response = requests.post(push_url, json=payload, timeout=timeout)
        if response.status_code in (200, 201):
            logger.info("APP Push 发送成功")
            return True
        else:
            logger.warning("APP Push 发送失败: %d", response.status_code)
            return False
    except Exception as exc:
        logger.error("APP Push 发送异常: %s", exc)
        return False


def process_alert(input_data: dict) -> dict:
    """处理一条 Zabbix 告警。

    解析事件 → 通知后端 API → 多渠道消息推送。

    Args:
        input_data: Zabbix 事件 JSON

    Returns:
        处理结果
    """
    logger.info("收到 Zabbix 告警事件")

    try:
        alert_info = _parse_zabbix_event(input_data)
        logger.info(
            "解析告警: 老人=%s, 房间=%s, 类型=%s, 等级=%s",
            alert_info["elder_name"],
            alert_info["room_no"],
            alert_info["trigger_name"],
            alert_info["severity"],
        )
    except Exception as exc:
        logger.exception("解析 Zabbix 事件失败")
        return {"status": "error", "message": f"事件解析失败: {exc}"}

    # 加载配置
    config = _load_configuration()

    # 记录到后端
    _notify_backend_api(alert_info, config)

    # 多渠道通知
    results = {}

    if config.get("dingtalk_webhook_url"):
        results["dingtalk"] = _notify_dingtalk(
            alert_info, config["dingtalk_webhook_url"]
        )

    if config.get("wechat_webhook_url"):
        results["wechat"] = _notify_wechat_work(
            alert_info, config["wechat_webhook_url"]
        )

    if config.get("sms_gateway_url"):
        results["sms"] = _notify_sms_gateway(alert_info, config)

    if config.get("app_push_url"):
        results["app_push"] = _notify_app_push(alert_info, config["app_push_url"])

    logger.info("告警处理完成，渠道结果: %s", results)

    return {
        "status": "success",
        "alert_info": {
            "elder_name": alert_info["elder_name"],
            "room_no": alert_info["room_no"],
            "severity": alert_info["severity"],
        },
        "channels": results,
    }


def main() -> None:
    """Webhook 脚本主入口。

    从 stdin 读取 Zabbix 传入的 JSON 事件并处理。
    """
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        # 测试模式
        test_event = {
            "event_type": "problem",
            "host_name": "Elder-E001",
            "trigger_name": "张奶奶 跌倒告警 - 301",
            "trigger_severity": "Disaster",
            "event_time": datetime.now().isoformat(),
            "description": "雷达检测到张奶奶疑似跌倒",
            "tags": [
                {"tag": "elder", "value": "E001"},
                {"tag": "room", "value": "301"},
                {"tag": "type", "value": "fall"},
            ],
        }
        result = process_alert(test_event)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return

    try:
        raw_data = sys.stdin.read()
        if not raw_data.strip():
            logger.error("stdin 无输入数据")
            sys.exit(1)

        input_data = json.loads(raw_data)
        result = process_alert(input_data)

        # 向 Zabbix 输出结果
        print(json.dumps(result, ensure_ascii=False))

    except json.JSONDecodeError as exc:
        logger.error("JSON 解析失败: %s", exc)
        print(json.dumps({"status": "error", "message": f"JSON 解析失败: {exc}"}))
        sys.exit(1)
    except Exception as exc:
        logger.exception("Webhook 处理异常")
        print(json.dumps({"status": "error", "message": str(exc)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
