"""设备数据处理与联动动作"""
import json
import logging
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models import DeviceGeneric, AlertRecord
from app.services.alert_service import create_alert

logger = logging.getLogger(__name__)


def handle_device_data(
    device: DeviceGeneric,
    data: dict,
    timestamp: Optional[datetime],
    db: Session,
) -> None:
    """
    处理设备上报的原始数据，判断是否需要触发告警/联动动作

    不同类型设备的处理逻辑：
    - sos_button:   任何按下事件 → 立即创建 emergency 告警
    - smoke_detector: smoke_ppm > 500 → critical 告警
    - gas_detector:  gas_lel >= 10 → critical 告警; >= 20 → 自动关阀
    - door_magnet:   door_status=open & duration > 600s → warning 告警
    """
    if not isinstance(data, dict):
        return

    category = device.device_category

    if category == "sos_button":
        _handle_sos(device, data, timestamp, db)

    elif category == "smoke_detector":
        _handle_smoke(device, data, timestamp, db)

    elif category == "gas_detector":
        _handle_gas(device, data, timestamp, db)

    elif category == "door_magnet":
        _handle_door(device, data, timestamp, db)

    else:
        # radar/infrared/camera 数据由各自专属路由处理
        pass


def _handle_sos(device: DeviceGeneric, data: dict, timestamp: Optional[datetime], db: Session):
    """处理 SOS 呼叫按钮事件"""
    event = data.get("event", "")
    location = data.get("location", device.room_no or "未知位置")

    if event in ("button_pressed", "cord_pulled"):
        create_alert(
            db=db,
            elder_id=device.elder_id,
            device_id=device.id,
            alert_type="manual_sos",
            alert_level="emergency",
            alert_message=f"老人主动求救！位置: {location}",
            trigger_value=f"event={event}",
        )
        logger.critical(f"SOS求救: device={device.device_sn}, location={location}")


def _handle_smoke(device: DeviceGeneric, data: dict, timestamp: Optional[datetime], db: Session):
    """处理烟雾报警"""
    smoke_ppm = data.get("smoke_ppm", 0)

    if smoke_ppm >= 500:
        create_alert(
            db=db,
            elder_id=device.elder_id,
            device_id=device.id,
            alert_type="smoke_alarm",
            alert_level="critical",
            alert_message=f"烟雾浓度超标！{device.room_no or '厨房'}烟雾浓度 {smoke_ppm}ppm",
            trigger_value=f"smoke_ppm={smoke_ppm}",
        )
        logger.critical(f"烟雾报警: device={device.device_sn}, ppm={smoke_ppm}")


def _handle_gas(device: DeviceGeneric, data: dict, timestamp: Optional[datetime], db: Session):
    """处理煤气泄漏"""
    gas_lel = data.get("gas_lel", 0)
    gas_type = data.get("gas_type", "unknown")

    if gas_lel >= 20:
        # critical 浓度 → emergency 告警 + 自动关阀
        create_alert(
            db=db,
            elder_id=device.elder_id,
            device_id=device.id,
            alert_type="gas_leak",
            alert_level="emergency",
            alert_message=f"煤气泄漏！{device.room_no or '厨房'}可燃气体浓度 {gas_lel}%LEL，已自动关阀",
            trigger_value=f"gas_lel={gas_lel}",
        )
        # 下发关阀指令
        from app.services.device_action import send_device_command
        send_device_command(device, {"action": "close_valve"})
        logger.critical(f"煤气泄漏: device={device.device_sn}, LEL={gas_lel}%, 已自动关阀")

    elif gas_lel >= 10:
        create_alert(
            db=db,
            elder_id=device.elder_id,
            device_id=device.id,
            alert_type="gas_leak",
            alert_level="critical",
            alert_message=f"煤气浓度异常！{device.room_no or '厨房'}可燃气体浓度 {gas_lel}%LEL，请立即检查",
            trigger_value=f"gas_lel={gas_lel}",
        )
        logger.critical(f"煤气浓度异常: device={device.device_sn}, LEL={gas_lel}%")


def _handle_door(device: DeviceGeneric, data: dict, timestamp: Optional[datetime], db: Session):
    """处理门磁事件"""
    door_status = data.get("door_status", "")
    duration = data.get("duration_seconds", 0)

    if door_status == "open" and duration > 600:
        create_alert(
            db=db,
            elder_id=device.elder_id,
            device_id=device.id,
            alert_type="door_open_long",
            alert_level="warning",
            alert_message=f"{device.room_no or '大门'}长时间未关闭（{duration // 60}分钟），请检查",
            trigger_value=f"duration={duration}s",
        )
        logger.warning(f"门磁长时间未关: device={device.device_sn}, duration={duration}s")


def send_device_command(device: DeviceGeneric, command: dict) -> bool:
    """
    向设备下发指令

    TODO: 对接实际 NB-IoT 平台 API 或 MQTT 指令下发通道
    当前版本：记录日志，返回成功（对接阶段替换为真实下发逻辑）
    """
    logger.info(
        f"[CMD] 下发指令: device={device.device_sn}, "
        f"category={device.device_category}, command={json.dumps(command)}"
    )

    # ============================================================
    # 实际下发需要在这里对接：
    # 1. NB-IoT 设备：调用运营商 IoT 平台 API
    #    e.g. POST https://iot-api.ctwing.cn/v1/commands
    # 2. Zigbee/WiFi 设备：通过 MQTT 下发
    #    e.g. mqtt_client.publish(f"cmd/{device.device_sn}", json.dumps(command))
    # ============================================================

    # 更新设备配置（如关阀状态）
    if command.get("action") == "close_valve":
        try:
            config = json.loads(device.extra_config or "{}")
            config["valve_status"] = "closed"
            device.extra_config = json.dumps(config)
        except json.JSONDecodeError:
            pass
    elif command.get("action") == "open_valve":
        try:
            config = json.loads(device.extra_config or "{}")
            config["valve_status"] = "open"
            device.extra_config = json.dumps(config)
        except json.JSONDecodeError:
            pass

    return True
