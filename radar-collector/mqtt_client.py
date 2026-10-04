"""MQTT 客户端模块

生产环境下通过 MQTT 协议接入真实毫米波雷达设备。
"""

import json
import logging
import ssl
import time
from typing import Any, Callable, Optional

import paho.mqtt.client as mqtt

logger = logging.getLogger(__name__)

# MQTT Topic 模板
TOPIC_RADAR_DATA = "smartcare/{institution_id}/+/radar/data"


class RadarMQTTClient:
    """雷达 MQTT 客户端（生产环境）。

    订阅雷达数据 Topic，解析后转发到 Zabbix 和后端 API。
    """

    def __init__(
        self,
        broker: str,
        port: int = 1883,
        username: str = "",
        password: str = "",
        institution_id: str = "INST001",
        use_tls: bool = False,
        ca_cert_path: Optional[str] = None,
        on_radar_data: Optional[Callable[[dict[str, Any]], None]] = None,
    ) -> None:
        """初始化 MQTT 客户端。

        Args:
            broker: MQTT Broker 地址
            port: MQTT Broker 端口
            username: MQTT 用户名
            password: MQTT 密码
            institution_id: 机构ID，用于构建订阅 Topic
            use_tls: 是否启用 TLS
            ca_cert_path: CA 证书路径（TLS 时使用）
            on_radar_data: 收到雷达数据时的回调函数
        """
        self._broker = broker
        self._port = port
        self._username = username
        self._password = password
        self._institution_id = institution_id
        self._use_tls = use_tls
        self._ca_cert_path = ca_cert_path
        self._on_radar_data = on_radar_data

        self._topic = TOPIC_RADAR_DATA.format(institution_id=institution_id)

        # 创建 MQTT 客户端
        client_id = f"smartcare-radar-{int(time.time())}"
        self._client = mqtt.Client(
            client_id=client_id,
            protocol=mqtt.MQTTv311,
        )

        # 设置回调
        self._client.on_connect = self._on_connect
        self._client.on_disconnect = self._on_disconnect
        self._client.on_message = self._on_message

        # 设置认证
        if username:
            self._client.username_pw_set(username, password)

        # TLS 配置
        if use_tls:
            self._client.tls_set(
                ca_certs=ca_cert_path,
                cert_reqs=ssl.CERT_REQUIRED,
                tls_version=ssl.PROTOCOL_TLSv1_2,
            )

        # 自动重连配置
        self._client.reconnect_delay_set(min_delay=1, max_delay=30)

        logger.info(
            "RadarMQTTClient 初始化完成，Broker: %s:%d, Topic: %s, TLS: %s",
            broker, port, self._topic, use_tls,
        )

    def _on_connect(
        self,
        client: mqtt.Client,
        userdata: Any,
        flags: dict,
        rc: int,
        properties: Optional[mqtt.Properties] = None,
    ) -> None:
        """MQTT 连接成功回调。

        Args:
            client: MQTT 客户端实例
            userdata: 用户自定义数据
            flags: 连接标志
            rc: 连接返回码，0 表示成功
            properties: MQTTv5 属性
        """
        rc_messages = {
            0: "连接成功",
            1: "协议版本错误",
            2: "Client ID 被拒",
            3: "服务不可用",
            4: "用户名或密码错误",
            5: "未授权",
        }
        if rc == 0:
            logger.info("MQTT 连接成功: %s:%d", self._broker, self._port)
            client.subscribe(self._topic, qos=1)
            logger.info("已订阅 Topic: %s", self._topic)
        else:
            logger.error(
                "MQTT 连接失败: %s (rc=%d)", rc_messages.get(rc, "未知错误"), rc,
            )

    def _on_disconnect(
        self,
        client: mqtt.Client,
        userdata: Any,
        rc: int,
        properties: Optional[mqtt.Properties] = None,
    ) -> None:
        """MQTT 断开连接回调。

        Args:
            client: MQTT 客户端实例
            userdata: 用户自定义数据
            rc: 断开原因码
            properties: MQTTv5 属性
        """
        if rc != 0:
            logger.warning("MQTT 意外断开 (rc=%d)，将自动重连...", rc)
        else:
            logger.info("MQTT 正常断开")

    def _on_message(
        self,
        client: mqtt.Client,
        userdata: Any,
        msg: mqtt.MQTTMessage,
    ) -> None:
        """MQTT 消息接收回调。

        解析雷达 JSON 数据并调用回调函数处理。

        Args:
            client: MQTT 客户端实例
            userdata: 用户自定义数据
            msg: MQTT 消息对象
        """
        try:
            payload_str = msg.payload.decode("utf-8")
            data = json.loads(payload_str)
            logger.debug(
                "收到雷达数据: Topic=%s, elder_id=%s",
                msg.topic,
                data.get("elder_id", "unknown"),
            )

            if self._on_radar_data:
                self._on_radar_data(data)

        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            logger.error("解析 MQTT 消息 JSON 失败，Topic: %s, 错误: %s", msg.topic, exc)
        except Exception:
            logger.exception("处理 MQTT 消息时发生未预期异常")

    def connect(self) -> None:
        """连接到 MQTT Broker 并启动网络循环。"""
        try:
            logger.info("正在连接 MQTT Broker: %s:%d", self._broker, self._port)
            self._client.connect(self._broker, self._port, keepalive=60)
            self._client.loop_start()
            logger.info("MQTT 网络循环已启动")
        except Exception:
            logger.exception("MQTT 连接异常")
            raise

    def disconnect(self) -> None:
        """断开 MQTT 连接并停止网络循环。"""
        logger.info("正在断开 MQTT 连接...")
        self._client.loop_stop()
        self._client.disconnect()
        logger.info("MQTT 已断开")

    def is_connected(self) -> bool:
        """检查 MQTT 连接状态。

        Returns:
            已连接返回 True
        """
        return self._client.is_connected()
