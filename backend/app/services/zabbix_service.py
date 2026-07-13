import logging
import json
from typing import Optional

from app.config import ZABBIX_SERVER, ZABBIX_API_URL, ZABBIX_USER, ZABBIX_PASSWORD
from app.models import RadarData

logger = logging.getLogger(__name__)


def send_to_zabbix(radar_data: RadarData) -> None:
    """
    使用 zabbix_sender 或 API 方式将雷达数据发送到 Zabbix Server。
    支持通过 pyzabbix 或原始 TCP socket 发送。
    """
    try:
        host_name = f"radar-device-{radar_data.device_id}"

        # 构造 key-value 数据
        data_payload = {
            "host": host_name,
            "key": "smartcare.radar.fall_status",
            "value": str(radar_data.fall_status),
        }

        # 尝试使用 pyzabbix sender
        try:
            from pyzabbix import ZabbixSender, ZabbixMetric

            metrics = [
                ZabbixMetric(host_name, "smartcare.radar.fall_status", str(radar_data.fall_status)),
                ZabbixMetric(host_name, "smartcare.radar.heart_rate",
                             str(radar_data.heart_rate) if radar_data.heart_rate is not None else "0"),
                ZabbixMetric(host_name, "smartcare.radar.breath_rate",
                             str(radar_data.breath_rate) if radar_data.breath_rate is not None else "0"),
                ZabbixMetric(host_name, "smartcare.radar.in_bed", str(radar_data.in_bed)),
            ]

            sender = ZabbixSender(ZABBIX_SERVER)
            result = sender.send(metrics)
            logger.info(f"Zabbix sender 响应: {result}")

            if result.failed > 0:
                logger.warning(f"Zabbix sender 部分失败: failed={result.failed}")

        except ImportError:
            logger.warning("pyzabbix 不可用, 尝试使用原始 socket 方式发送")

            # 使用原始 socket 方式发送
            _send_via_socket(host_name, radar_data)

    except Exception as e:
        logger.error(f"发送数据到 Zabbix 失败: {e}", exc_info=True)


def _send_via_socket(host_name: str, radar_data: RadarData) -> None:
    """通过原始 TCP socket 发送 zabbix trapper 数据"""
    import socket
    import struct
    import time

    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        sock.connect((ZABBIX_SERVER, 10051))

        # 构造 zabbix trapper 协议数据
        payload = {
            "request": "sender data",
            "data": [
                {"host": host_name, "key": "smartcare.radar.fall_status", "value": str(radar_data.fall_status)},
                {"host": host_name, "key": "smartcare.radar.heart_rate",
                 "value": str(radar_data.heart_rate) if radar_data.heart_rate is not None else "0"},
                {"host": host_name, "key": "smartcare.radar.breath_rate",
                 "value": str(radar_data.breath_rate) if radar_data.breath_rate is not None else "0"},
                {"host": host_name, "key": "smartcare.radar.in_bed", "value": str(radar_data.in_bed)},
            ],
            "clock": int(time.time()),
        }

        json_data = json.dumps(payload).encode("utf-8")
        header = b"ZBXD\x01" + struct.pack("<Q", len(json_data))
        sock.sendall(header + json_data)

        # 读取响应头
        resp_header = sock.recv(13)
        if len(resp_header) >= 13 and resp_header[:4] == b"ZBXD":
            resp_len = struct.unpack("<Q", resp_header[5:13])[0]
            resp_data = sock.recv(resp_len)
            logger.info(f"Zabbix socket 响应: {resp_data.decode('utf-8', errors='replace')[:200]}")

        sock.close()
    except Exception as e:
        logger.error(f"Zabbix socket 发送失败: {e}")


def get_zabbix_problems(limit: int = 50) -> list[dict]:
    """通过 Zabbix API 获取当前告警/problems"""
    try:
        from pyzabbix import ZabbixAPI

        zapi = ZabbixAPI(ZABBIX_API_URL)
        zapi.login(ZABBIX_USER, ZABBIX_PASSWORD)

        problems = zapi.problem.get(
            output="extend",
            selectAcknowledges="extend",
            recent=True,
            sortfield=["eventid"],
            sortorder="DESC",
            limit=limit,
        )

        logger.info(f"从 Zabbix 获取到 {len(problems)} 个告警")
        return problems

    except ImportError:
        logger.warning("pyzabbix 不可用, 无法获取 Zabbix problems")
        return []
    except Exception as e:
        logger.error(f"获取 Zabbix problems 失败: {e}")
        return []


def acknowledge_event(event_id: str, message: str = "已处理") -> bool:
    """确认 Zabbix 告警事件"""
    try:
        from pyzabbix import ZabbixAPI

        zapi = ZabbixAPI(ZABBIX_API_URL)
        zapi.login(ZABBIX_USER, ZABBIX_PASSWORD)

        result = zapi.event.acknowledge(
            eventids=[event_id],
            message=message,
            action=1,  # 1 = close problem
        )

        logger.info(f"Zabbix 事件确认成功: event_id={event_id}, result={result}")
        return True

    except ImportError:
        logger.warning("pyzabbix 不可用, 无法确认 Zabbix 事件")
        return False
    except Exception as e:
        logger.error(f"确认 Zabbix 事件失败: {e}")
        return False
