import logging
import json
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session
import httpx

from app.models import AlertRecord, AlertRule, Elderly, RadarDevice, Family, FamilyElderly
from app.config import DINGTALK_WEBHOOK_URL, WECOM_WEBHOOK_URL, ALERT_WEBHOOK_URL
from app.services.wechat_service import send_alert_to_family

logger = logging.getLogger(__name__)


def check_alert_rules(db: Session, rule_type: str, value: float, elder_id: Optional[int] = None) -> list[AlertRule]:
    """根据规则检查是否需要告警"""
    query = db.query(AlertRule).filter(
        AlertRule.rule_type == rule_type,
        AlertRule.enabled == 1,
    )
    if elder_id:
        query = query.filter(
            (AlertRule.elder_id == elder_id) | (AlertRule.elder_id.is_(None))
        )
    else:
        query = query.filter(AlertRule.elder_id.is_(None))

    rules = query.all()
    matched = []

    for rule in rules:
        try:
            threshold = json.loads(rule.threshold_value)
        except json.JSONDecodeError:
            logger.warning(f"规则阈值JSON解析失败: rule_id={rule.id}, value={rule.threshold_value}")
            continue

        if rule_type == "fall" and threshold.get("fall_status") == 1:
            matched.append(rule)
        elif rule_type == "heart_rate":
            min_val = threshold.get("min", 0)
            max_val = threshold.get("max", 999)
            if value < min_val or value > max_val:
                matched.append(rule)
        elif rule_type == "breath_rate":
            min_val = threshold.get("min", 0)
            max_val = threshold.get("max", 999)
            if value < min_val or value > max_val:
                matched.append(rule)
        elif rule_type == "out_of_bed":
            max_minutes = threshold.get("max_minutes", 30)
            if value > max_minutes:
                matched.append(rule)

    return matched


def create_alert(
    db: Session,
    elder_id: Optional[int],
    device_id: Optional[int],
    alert_type: str,
    alert_level: str,
    alert_message: str,
    trigger_value: str = "",
    rule_id: Optional[int] = None,
) -> AlertRecord:
    """创建告警记录并发送通知"""
    alert = AlertRecord(
        elder_id=elder_id,
        device_id=device_id,
        alert_type=alert_type,
        alert_level=alert_level,
        alert_message=alert_message,
        trigger_value=trigger_value,
        rule_id=rule_id,
        handled_status=0,
        created_at=datetime.now(),
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    logger.info(f"创建告警: id={alert.id}, type={alert_type}, level={alert_level}, elder={elder_id}")

    # 通知分发
    if rule_id:
        rule = db.query(AlertRule).filter(AlertRule.id == rule_id).first()
        if rule and rule.notify_channels:
            notify(alert, rule.notify_channels, db)

    return alert


def notify(alert: AlertRecord, channels: str, db: Session) -> None:
    """多渠道通知分发"""
    channel_list = [c.strip() for c in channels.split(",") if c.strip()]

    # 构建通知内容
    elder_name = "未知"
    room_no = ""
    device_name = ""
    if alert.elder_id:
        elderly = db.query(Elderly).filter(Elderly.id == alert.elder_id).first()
        if elderly:
            elder_name = elderly.name
            room_no = elderly.room_no or ""
    if alert.device_id:
        device = db.query(RadarDevice).filter(RadarDevice.id == alert.device_id).first()
        if device:
            device_name = device.device_name

    alert_text = (
        f"【安伴 Guardian 告警】\n"
        f"告警类型: {alert.alert_type}\n"
        f"告警级别: {alert.alert_level}\n"
        f"告警内容: {alert.alert_message}\n"
        f"老人: {elder_name}\n"
        f"房间: {room_no}\n"
        f"设备: {device_name}\n"
        f"时间: {alert.created_at.strftime('%Y-%m-%d %H:%M:%S')}"
    )

    for channel in channel_list:
        try:
            if channel == "dingtalk":
                _send_dingtalk(alert_text)
            elif channel == "wecom":
                _send_wecom(alert_text)
            elif channel == "sms":
                _send_sms(alert, db)
            elif channel == "wechat":
                _send_wechat(alert, elder_name, room_no, db)
        except Exception as e:
            logger.error(f"通知发送失败 [channel={channel}]: {e}", exc_info=True)


def _send_dingtalk(text: str) -> None:
    """钉钉Webhook通知"""
    if not DINGTALK_WEBHOOK_URL:
        logger.warning("钉钉Webhook URL 未配置")
        return

    try:
        with httpx.Client(timeout=10) as client:
            resp = client.post(
                DINGTALK_WEBHOOK_URL,
                json={
                    "msgtype": "text",
                    "text": {"content": text},
                },
            )
            resp.raise_for_status()
            logger.info(f"钉钉通知发送成功: {resp.status_code}")
    except Exception as e:
        logger.error(f"钉钉通知发送失败: {e}")


def _send_wecom(text: str) -> None:
    """企业微信Webhook通知"""
    if not WECOM_WEBHOOK_URL:
        logger.warning("企业微信Webhook URL 未配置")
        return

    try:
        with httpx.Client(timeout=10) as client:
            resp = client.post(
                WECOM_WEBHOOK_URL,
                json={
                    "msgtype": "text",
                    "text": {"content": text},
                },
            )
            resp.raise_for_status()
            logger.info(f"企业微信通知发送成功: {resp.status_code}")
    except Exception as e:
        logger.error(f"企业微信通知发送失败: {e}")


def _send_sms(alert: AlertRecord, db: Session) -> None:
    """短信通知(通过Webhook)"""
    if not ALERT_WEBHOOK_URL:
        logger.warning("短信Webhook URL 未配置")
        return

    try:
        phone = ""
        if alert.elder_id:
            elderly = db.query(Elderly).filter(Elderly.id == alert.elder_id).first()
            if elderly:
                phone = elderly.emergency_phone or ""

        if not phone:
            logger.warning("未找到紧急联系电话, 跳过短信通知")
            return

        with httpx.Client(timeout=10) as client:
            resp = client.post(
                ALERT_WEBHOOK_URL,
                json={
                    "phone": phone,
                    "message": alert.alert_message,
                    "alert_id": alert.id,
                },
            )
            resp.raise_for_status()
            logger.info(f"短信通知发送成功: phone={phone}, alert_id={alert.id}")
    except Exception as e:
        logger.error(f"短信通知发送失败: {e}")


def _send_wechat(alert: AlertRecord, elder_name: str, room_no: str, db: Session) -> None:
    """微信订阅消息推送给家属"""
    if not alert.elder_id:
        logger.warning("告警未关联老人, 跳过微信推送")
        return

    # 查找该老人的所有绑定家属
    bindings = (
        db.query(FamilyElderly, Family)
        .join(Family, FamilyElderly.family_id == Family.id)
        .filter(
            FamilyElderly.elderly_id == alert.elder_id,
            Family.status == 1,
            Family.openid != "",
        )
        .all()
    )

    if not bindings:
        logger.info(f"老人 {elder_name} 没有绑定家属, 跳过微信推送")
        return

    alert_time = alert.created_at.strftime("%Y-%m-%d %H:%M:%S") if alert.created_at else ""

    for _, family in bindings:
        success = send_alert_to_family(
            openid=family.openid,
            alert_type=alert.alert_type,
            alert_level=alert.alert_level,
            alert_message=alert.alert_message,
            elder_name=elder_name,
            room_no=room_no,
            alert_time=alert_time,
            alert_id=alert.id,
        )
        if success:
            logger.info(f"微信推送成功: family={family.nickname}, alert_id={alert.id}")
        else:
            logger.warning(f"微信推送失败: family={family.nickname}, alert_id={alert.id}")
