"""Zabbix Trapper 数据发送模块

将雷达感知数据封装为 Zabbix Trapper 协议格式并发送到 Zabbix Server。
"""

import json
import logging
import struct
import time
from typing import Any

logger = logging.getLogger(__name__)

# Zabbix Trapper 协议相关常量
ZBX_TCP_HEADER = b"ZBXD\x01"
ZBX_HEADER_LEN = 13  # 5 bytes header + 8 bytes data_len


class ZabbixSenderError(Exception):
    """Zabbix 发送异常。"""


class ZabbixDataSender:
    """Zabbix Trapper 数据发送器。

    通过 Zabbix Trapper 协议将雷达数据批量发送到 Zabbix Server。
    """

    # 服务在线心跳 key
    ONLINE_KEY_TEMPLATE = "elder.radar.online[{elder_id}]"

    # 雷达数据 Item Key 模板（必须与 Zabbix 模板中的 Item Key 一致）
    ITEM_KEY_TEMPLATES = {
        "main_data": "elder.radar.main_data[{elder_id}]",
        "fall_status": "elder.radar.fall_status[{elder_id}]",
        "heart_rate": "elder.radar.heart_rate[{elder_id}]",
        "breath_rate": "elder.radar.breath_rate[{elder_id}]",
        "activity_level": "elder.radar.activity_level[{elder_id}]",
        "in_bed": "elder.radar.in_bed[{elder_id}]",
        "online": "elder.radar.online[{elder_id}]",
    }

    def __init__(self, server: str = "localhost", port: int = 10051, max_retries: int = 3) -> None:
        """初始化 Zabbix 发送器。

        Args:
            server: Zabbix Server 地址
            port: Zabbix Trapper 端口，默认 10051
            max_retries: 发送失败最大重试次数
        """
        self._server = server
        self._port = port
        self._max_retries = max_retries
        logger.info("ZabbixDataSender 初始化完成，目标: %s:%d", server, port)

    def _build_host_name(self, elder_id: str) -> str:
        """构建 Zabbix Host 名称。

        Args:
            elder_id: 老人ID

        Returns:
            Zabbix Host 名称，格式: Elder-{elder_id}
        """
        return f"Elder-{elder_id}"

    def _build_item_key(self, template_key: str, elder_id: str) -> str:
        """根据模板和老人ID构建完整的 Item Key。

        Args:
            template_key: 模板中定义的 key 名称
            elder_id: 老人ID

        Returns:
            完整的 Item Key 字符串
        """
        return self.ITEM_KEY_TEMPLATES.get(template_key, template_key).format(
            elder_id=elder_id
        )

    def _pack_request(self, payload: dict) -> bytes:
        """将请求负载打包为 Zabbix Trapper 协议格式。

        Args:
            payload: 请求负载字典

        Returns:
            打包后的二进制数据
        """
        payload_json = json.dumps(payload, ensure_ascii=False)
        payload_bytes = payload_json.encode("utf-8")
        data_len = struct.pack("<Q", len(payload_bytes))
        return ZBX_TCP_HEADER + data_len + payload_bytes

    def _unpack_response(self, data: bytes) -> dict:
        """解析 Zabbix Server 返回的响应。

        Args:
            data: 原始响应数据

        Returns:
            解析后的响应字典
        """
        if len(data) < ZBX_HEADER_LEN:
            raise ZabbixSenderError(f"响应数据过短: {len(data)} bytes")

        body = data[ZBX_HEADER_LEN:]
        try:
            return json.loads(body.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            raise ZabbixSenderError(f"解析响应 JSON 失败: {exc}") from exc

    def send_radar_data(self, data: dict[str, Any]) -> bool:
        """将雷达数据发送到 Zabbix Server。

        将一条雷达数据拆分为多个 Zabbix Trapper Item 值并发送。

        Args:
            data: 雷达模拟器生成的完整数据

        Returns:
            发送成功返回 True，否则返回 False
        """
        elder_id = data["elder_id"]
        host_name = self._build_host_name(elder_id)
        radar_data = data.get("data", {})

        # 构建 Zabbix Trapper 请求
        request_data: list[dict] = []

        # 主数据（完整 JSON）
        request_data.append({
            "host": host_name,
            "key": self._build_item_key("main_data", elder_id),
            "value": json.dumps(data, ensure_ascii=False),
        })

        # 各指标分别发送
        metric_keys = ["fall_status", "heart_rate", "breath_rate", "activity_level", "in_bed"]
        for key in metric_keys:
            value = radar_data.get(key, "")
            request_data.append({
                "host": host_name,
                "key": self._build_item_key(key, elder_id),
                "value": str(value),
            })

        # 在线心跳
        request_data.append({
            "host": host_name,
            "key": self._build_item_key("online", elder_id),
            "value": "1",
        })

        # 打包并发送
        ts_now = int(time.time())
        request_payload = {
            "request": "sender data",
            "data": request_data,
            "clock": ts_now,
        }

        return self._send_with_retry(request_payload)

    def send_batch(self, data_list: list[dict[str, Any]]) -> tuple[int, int]:
        """批量发送多条雷达数据。

        Args:
            data_list: 雷达数据列表

        Returns:
            (成功数, 失败数) 的元组
        """
        success_count = 0
        fail_count = 0

        for data in data_list:
            if self.send_radar_data(data):
                success_count += 1
            else:
                fail_count += 1

        logger.info("批量发送完成，成功: %d, 失败: %d", success_count, fail_count)
        return success_count, fail_count

    def _send_with_retry(self, payload: dict) -> bool:
        """带重试机制的网络发送。

        Args:
            payload: Zabbix 请求负载

        Returns:
            发送成功返回 True，失败返回 False
        """
        import socket

        for attempt in range(1, self._max_retries + 1):
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(10)
                sock.connect((self._server, self._port))

                packed = self._pack_request(payload)
                sock.sendall(packed)

                response_data = sock.recv(4096)
                sock.close()

                response = self._unpack_response(response_data)

                if response.get("response") == "success":
                    info = response.get("info", "")
                    processed = info.split(";")[0].replace("processed:", "").strip() if info else "?"
                    logger.debug("Zabbix 发送成功，处理条目: %s", processed)
                    return True
                else:
                    logger.warning(
                        "Zabbix 响应异常（尝试 %d/%d）: %s",
                        attempt, self._max_retries, response,
                    )

            except (socket.timeout, ConnectionRefusedError, ConnectionError) as exc:
                logger.warning(
                    "Zabbix 连接失败（尝试 %d/%d）: %s",
                    attempt, self._max_retries, exc,
                )
            except (OSError, struct.error, ZabbixSenderError) as exc:
                logger.error(
                    "Zabbix 数据发送异常（尝试 %d/%d）: %s",
                    attempt, self._max_retries, exc,
                )
            finally:
                try:
                    sock.close()
                except Exception:
                    pass

            if attempt < self._max_retries:
                wait_time = attempt * 2
                logger.info("等待 %d 秒后重试...", wait_time)
                time.sleep(wait_time)

        logger.error("Zabbix 发送失败，已达最大重试次数 %d", self._max_retries)
        return False
