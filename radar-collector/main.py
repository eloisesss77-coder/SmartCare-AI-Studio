"""Radar Collector 主入口

启动雷达数据采集服务：创建模拟器、Zabbix Sender，定时采集并上报数据。
"""

import logging
import os
import signal
import sys
import time
from pathlib import Path
from typing import Any, Optional

import requests
import yaml

from radar_simulator import RadarSimulator
from zabbix_sender import ZabbixDataSender

# ---------------------------------------------------------------------------
# 日志配置
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("radar-collector")

# ---------------------------------------------------------------------------
# 全局运行状态
# ---------------------------------------------------------------------------
_running = True


def _signal_handler(signum: int, frame: Any) -> None:
    """信号处理函数，实现优雅退出。"""
    global _running
    logger.info("收到退出信号 (signal=%d)，正在停止服务...", signum)
    _running = False


def _load_config(config_path: str) -> dict:
    """加载 YAML 配置文件。

    Args:
        config_path: 配置文件路径

    Returns:
        配置字典

    Raises:
        FileNotFoundError: 配置文件不存在
        yaml.YAMLError: YAML 解析错误
    """
    path = Path(config_path)
    if not path.exists():
        raise FileNotFoundError(f"配置文件不存在: {config_path}")

    with open(path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    logger.info("已加载配置文件: %s", config_path)
    return config


def _send_to_backend_api(data: dict, api_url: str, timeout: int = 10) -> bool:
    """将雷达数据发送到后端 API。

    Args:
        data: 雷达数据
        api_url: 后端 API URL
        timeout: 请求超时时间（秒）

    Returns:
        发送成功返回 True
    """
    try:
        response = requests.post(api_url, json=data, timeout=timeout)
        if response.status_code in (200, 201):
            logger.debug("后端 API 数据发送成功: %s/%s", data.get("elder_id"), data.get("room_no"))
            return True
        else:
            logger.warning(
                "后端 API 返回异常状态码: %d, body=%s",
                response.status_code,
                response.text[:200],
            )
            return False
    except requests.exceptions.Timeout:
        logger.error("后端 API 请求超时: %s", api_url)
        return False
    except requests.exceptions.ConnectionError as exc:
        logger.error("后端 API 连接失败: %s, 错误: %s", api_url, exc)
        return False
    except Exception:
        logger.exception("后端 API 请求异常")
        return False


def run_simulator_mode(config: dict) -> None:
    """以模拟器模式运行雷达采集服务。

    Args:
        config: 服务配置字典
    """
    sim_cfg = config.get("simulator", {})
    elderly_cfg = config.get("elderly", [])
    zabbix_cfg = config.get("zabbix", {})
    api_cfg = config.get("backend_api", {})

    interval = sim_cfg.get("interval", 5)
    fall_probability = sim_cfg.get("fall_probability", 0.02)

    # 初始化组件
    simulator = RadarSimulator(
        elderly_list=elderly_cfg,
        fall_probability=fall_probability,
    )
    sender = ZabbixDataSender(
        server=zabbix_cfg.get("server", "localhost"),
        port=zabbix_cfg.get("port", 10051),
    )
    api_url = api_cfg.get("url", "http://localhost:8000/api/v1/radar/data")

    logger.info("模拟器模式启动成功，共 %d 位老人，采集间隔: %ds", len(elderly_cfg), interval)

    while _running:
        for elder in elderly_cfg:
            if not _running:
                break

            elder_id = elder["id"]
            room_no = elder["room"]

            try:
                # 生成模拟数据
                data = simulator.generate_data(elder_id, room_no)
                logger.info(
                    "采集雷达数据: %s/%s | 跌倒=%d 心率=%d 呼吸=%d 在床=%d 活动量=%d 体态=%s",
                    elder_id,
                    elder.get("name", ""),
                    data["data"]["fall_status"],
                    data["data"]["heart_rate"],
                    data["data"]["breath_rate"],
                    data["data"]["in_bed"],
                    data["data"]["activity_level"],
                    data["data"]["body_posture"],
                )

                # 发送到 Zabbix
                send_ok = sender.send_radar_data(data)
                if not send_ok:
                    logger.warning("Zabbix 发送失败: %s/%s", elder_id, room_no)

                # 发送到后端 API（扁平化数据结构）
                flat_data = {
                    "device_sn": data.get("device_sn", ""),
                    "elder_id": int(data.get("elder_id", 0)),
                    "fall_status": int(data.get("data", {}).get("fall_status", 0)),
                    "heart_rate": int(data.get("data", {}).get("heart_rate", 0)),
                    "breath_rate": int(data.get("data", {}).get("breath_rate", 0)),
                    "activity_level": str(data.get("data", {}).get("activity_level", "")),
                    "in_bed": int(data.get("data", {}).get("in_bed", 0)),
                    "body_posture": str(data.get("data", {}).get("body_posture", "")),
                    "timestamp": data.get("datetime"),
                }
                _send_to_backend_api(flat_data, api_url)

            except Exception:
                logger.exception("处理老人 %s 数据时发生异常", elder_id)

        # 等待下一次采集周期
        if _running:
            time.sleep(interval)

    logger.info("模拟器模式已停止")


def run_production_mode(config: dict) -> None:
    """以生产模式运行雷达采集服务（通过 MQTT 接入真实雷达）。

    Args:
        config: 服务配置字典
    """
    from mqtt_client import RadarMQTTClient

    mqtt_cfg = config.get("mqtt", {})
    zabbix_cfg = config.get("zabbix", {})
    api_cfg = config.get("backend_api", {})
    svc_cfg = config.get("service", {})

    sender = ZabbixDataSender(
        server=zabbix_cfg.get("server", "localhost"),
        port=zabbix_cfg.get("port", 10051),
    )
    api_url = api_cfg.get("url", "http://localhost:8000/api/v1/radar/data")

    def handle_radar_data(data: dict) -> None:
        """MQTT 收到雷达数据时的回调处理。"""
        try:
            elder_id = data.get("elder_id", "unknown")
            room_no = data.get("room_no", "unknown")
            radar_data = data.get("data", {})

            logger.info(
                "收到真实雷达数据: %s/%s | 跌倒=%d 心率=%d 呼吸=%d",
                elder_id,
                room_no,
                radar_data.get("fall_status", -1),
                radar_data.get("heart_rate", -1),
                radar_data.get("breath_rate", -1),
            )

            send_ok = sender.send_radar_data(data)
            if not send_ok:
                logger.warning("Zabbix 发送失败: %s/%s", elder_id, room_no)

            flat_data = {
                "device_sn": data.get("device_sn", ""),
                "elder_id": int(data.get("elder_id", 0)),
                "fall_status": int(radar_data.get("fall_status", 0)),
                "heart_rate": int(radar_data.get("heart_rate", 0)),
                "breath_rate": int(radar_data.get("breath_rate", 0)),
                "activity_level": str(radar_data.get("activity_level", "")),
                "in_bed": int(radar_data.get("in_bed", 0)),
                "body_posture": str(radar_data.get("body_posture", "")),
                "timestamp": data.get("datetime"),
            }
            _send_to_backend_api(flat_data, api_url)

        except Exception:
            logger.exception("处理 MQTT 雷达数据时发生异常")

    mqtt_client = RadarMQTTClient(
        broker=mqtt_cfg.get("broker", "localhost"),
        port=mqtt_cfg.get("port", 1883),
        username=mqtt_cfg.get("username", ""),
        password=mqtt_cfg.get("password", ""),
        institution_id=svc_cfg.get("institution_id", "INST001"),
        use_tls=mqtt_cfg.get("use_tls", False),
        ca_cert_path=mqtt_cfg.get("ca_cert_path"),
        on_radar_data=handle_radar_data,
    )

    try:
        mqtt_client.connect()
        logger.info("生产模式启动成功，等待 MQTT 雷达数据...")

        while _running:
            time.sleep(1)

    finally:
        mqtt_client.disconnect()
        logger.info("生产模式已停止")


def main() -> None:
    """主入口函数。"""
    # 注册信号处理
    signal.signal(signal.SIGINT, _signal_handler)
    signal.signal(signal.SIGTERM, _signal_handler)

    # 获取配置文件路径
    config_path = os.environ.get("RADAR_CONFIG_PATH", "config.yaml")

    try:
        config = _load_config(config_path)
    except (FileNotFoundError, yaml.YAMLError) as exc:
        logger.critical("加载配置文件失败: %s", exc)
        sys.exit(1)

    svc_cfg = config.get("service", {})
    mode = svc_cfg.get("mode", "simulator")
    svc_name = svc_cfg.get("name", "SmartCare Radar Collector")

    logger.info("=" * 60)
    logger.info("%s 启动", svc_name)
    logger.info("运行模式: %s", mode)
    logger.info("=" * 60)

    try:
        if mode == "production":
            run_production_mode(config)
        else:
            run_simulator_mode(config)
    except KeyboardInterrupt:
        logger.info("收到键盘中断")
    except Exception:
        logger.exception("服务运行异常")
    finally:
        logger.info("%s 已退出", svc_name)


if __name__ == "__main__":
    main()
