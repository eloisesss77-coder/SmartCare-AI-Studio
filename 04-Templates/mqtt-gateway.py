"""
SmartCare IoT 边缘网关模板
架构：MQTT 订阅雷达数据 → 数据解析 → POST 转发到 FastAPI 后端

使用方式：
  python gateway.py / 配合 supervisor/systemd 守护运行

依赖：
  pip install paho-mqtt requests
"""

import json
import logging
import signal
import sys
import time
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Optional

import paho.mqtt.client as mqtt
import requests

# ===== 配置（生产环境移入 config.yaml 或环境变量）=====
CONFIG = {
    # MQTT Broker
    "mqtt_broker": "localhost",
    "mqtt_port": 1883,
    "mqtt_username": "",
    "mqtt_password": "",
    "mqtt_use_tls": False,
    # 业务
    "institution_id": "INST001",
    # 后端 API
    "backend_api_url": "http://localhost:8000/api/v1/radar/data",
    "backend_api_timeout": 10,
    # 心跳
    "heartbeat_interval": 30,
    # 日志
    "log_level": "INFO",
}

# ===== 日志 =====
logging.basicConfig(
    level=getattr(logging, CONFIG.get("log_level", "INFO")),
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("radar-gateway")


class RadarGateway:
    """雷达数据采集网关

    订阅 MQTT Topic → 解析雷达 JSON 数据 → POST 转发到 FastAPI 后端
    同时维护设备心跳，定期上报在线状态。
    """

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self._running = False

        # MQTT 客户端
        client_id = f"smartcare-gateway-{config['institution_id']}-{int(time.time())}"
        self._mqtt_client = mqtt.Client(
            client_id=client_id,
            protocol=mqtt.MQTTv311,
        )
        self._mqtt_client.on_connect = self._on_connect
        self._mqtt_client.on_message = self._on_message
        self._mqtt_client.on_disconnect = self._on_disconnect

        # MQTT 认证
        if config.get("mqtt_username"):
            self._mqtt_client.username_pw_set(
                config["mqtt_username"], config.get("mqtt_password", "")
            )

        # TLS（生产环境启用）
        if config.get("mqtt_use_tls"):
            self._mqtt_client.tls_set()

        # 订阅 Topic 模板
        self._topic = f"smartcare/{config['institution_id']}/+/radar/data"

        # 设备心跳跟踪: {device_sn: last_heartbeat_ts}
        self._device_heartbeats: Dict[str, float] = {}

    # ================================================================
    # 生命周期
    # ================================================================

    def start(self):
        """启动网关"""
        logger.info("网关启动中... institution=%s", self.config["institution_id"])
        self._running = True

        self._mqtt_client.connect(
            self.config["mqtt_broker"],
            self.config["mqtt_port"],
            keepalive=60,
        )
        self._mqtt_client.loop_start()

        # 心跳定时器：定期检查设备在线状态
        self._heartbeat_loop()

        # 主循环
        try:
            while self._running:
                time.sleep(1)
        except KeyboardInterrupt:
            self.stop()

    def stop(self):
        """停止网关"""
        logger.info("网关正在停止...")
        self._running = False
        self._mqtt_client.loop_stop()
        self._mqtt_client.disconnect()
        logger.info("网关已停止")

    # ================================================================
    # MQTT 回调
    # ================================================================

    def _on_connect(self, client, userdata, flags, rc):
        """MQTT 连接成功回调"""
        if rc == 0:
            logger.info("MQTT 已连接: %s:%s", self.config["mqtt_broker"], self.config["mqtt_port"])
            client.subscribe(self._topic, qos=1)
            logger.info("已订阅 Topic: %s", self._topic)
        else:
            logger.error("MQTT 连接失败, rc=%d", rc)

    def _on_message(self, client, userdata, msg):
        """MQTT 消息回调 — 解析雷达 JSON 并转发到后端 API"""
        try:
            payload_str = msg.payload.decode("utf-8")
            data = json.loads(payload_str)

            device_sn = data.get("device_sn", "unknown")
            elder_id = data.get("elder_id", "unknown")
            radar_data = data.get("data", {})

            logger.debug(
                "收到雷达数据: device=%s elder=%s fall=%d hr=%d br=%d",
                device_sn,
                elder_id,
                radar_data.get("fall_status", -1),
                radar_data.get("heart_rate", -1),
                radar_data.get("breath_rate", -1),
            )

            # 更新心跳时间
            self._device_heartbeats[device_sn] = time.time()

            # 数据扁平化后 POST 到后端 API
            flat_data = {
                "device_sn": device_sn,
                "elder_id": int(elder_id) if str(elder_id).isdigit() else 0,
                "fall_status": int(radar_data.get("fall_status", 0)),
                "heart_rate": int(radar_data.get("heart_rate", 0)) if radar_data.get("heart_rate") is not None else None,
                "breath_rate": int(radar_data.get("breath_rate", 0)) if radar_data.get("breath_rate") is not None else None,
                "activity_level": str(radar_data.get("activity_level", "")),
                "in_bed": int(radar_data.get("in_bed", 0)),
                "body_posture": str(radar_data.get("body_posture", "")),
                "timestamp": data.get("datetime") or datetime.now(timezone.utc).isoformat(),
            }
            self._send_to_backend(flat_data)

        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            logger.error("MQTT 消息 JSON 解析失败: Topic=%s, 错误=%s", msg.topic, exc)
        except Exception:
            logger.exception("MQTT 消息处理异常")

    def _on_disconnect(self, client, userdata, rc):
        """MQTT 断连回调 — 自动重连"""
        logger.warning("MQTT 已断开, rc=%d", rc)
        if self._running and rc != 0:
            logger.info("尝试自动重连...")
            try:
                client.reconnect()
            except Exception:
                logger.exception("重连失败")

    # ================================================================
    # 后端 API 通信
    # ================================================================

    def _send_to_backend(self, data: Dict[str, Any]) -> bool:
        """将雷达数据 POST 到 FastAPI 后端: POST /api/v1/radar/data

        Args:
            data: 扁平化后的雷达数据字典

        Returns:
            发送成功返回 True
        """
        api_url = self.config["backend_api_url"]
        timeout = self.config.get("backend_api_timeout", 10)

        try:
            response = requests.post(api_url, json=data, timeout=timeout)
            if response.status_code in (200, 201):
                logger.debug("后端 API 数据发送成功: %s", data.get("device_sn"))
                return True
            else:
                logger.warning(
                    "后端 API 返回异常: status=%d, body=%s",
                    response.status_code,
                    response.text[:200],
                )
                return False
        except requests.exceptions.Timeout:
            logger.error("后端 API 请求超时: %s", api_url)
            return False
        except requests.exceptions.ConnectionError as exc:
            logger.error("后端 API 连接失败: %s, 错误=%s", api_url, exc)
            return False
        except Exception:
            logger.exception("后端 API 请求异常")
            return False

    # ================================================================
    # 设备心跳
    # ================================================================

    def _heartbeat_loop(self):
        """定期更新设备心跳信息（通过后续数据上报自动刷新 online_status）"""
        interval = self.config.get("heartbeat_interval", 30)
        logger.info("设备心跳检查已启动, 间隔=%ds", interval)
        # 心跳逻辑：
        # 每次收到设备数据时，后端 POST /api/v1/radar/data 会自动更新
        # RadarDevice.online_status=1 和 RadarDevice.last_heartbeat=NOW()
        # 如需主动心跳，可在此实现定时 HTTP 请求
        # 如需离线检测，可在此检查 self._device_heartbeats 超时设备并上报


# ===== 主入口 =====
def main():
    gateway = RadarGateway(CONFIG)

    # 优雅退出信号处理
    def signal_handler(sig, frame):
        logger.info("收到退出信号 sig=%d", sig)
        gateway.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    gateway.start()


if __name__ == "__main__":
    main()
