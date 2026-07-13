import logging
import json
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.models import RadarData, AlertRecord, AlertRule, Elderly
from app.config import (
    HEART_RATE_MIN, HEART_RATE_MAX,
    BREATH_RATE_MIN, BREATH_RATE_MAX,
    OUT_OF_BED_MAX_MINUTES,
    ALERT_DEDUP_WINDOW,
)
from app.services.alert_service import create_alert, check_alert_rules
from app.services.zabbix_service import send_to_zabbix

logger = logging.getLogger(__name__)


def process_radar_data(db: Session, radar_data: RadarData) -> None:
    """处理雷达数据: 异常检测 -> 告警 -> 上报Zabbix"""
    try:
        anomalies = detect_anomaly(radar_data)

        if anomalies:
            for anomaly in anomalies:
                check_and_create_alert(db, radar_data, anomaly)

        # 上报 Zabbix
        send_to_zabbix(radar_data)

    except Exception as e:
        logger.error(f"处理雷达数据异常 [device={radar_data.device_id}]: {e}", exc_info=True)


def detect_anomaly(radar_data: RadarData) -> list[dict]:
    """异常检测"""
    anomalies = []

    # 跌倒检测
    if radar_data.fall_status == 1:
        anomalies.append({
            "type": "fall",
            "severity": "emergency",
            "message": "检测到老人跌倒!",
            "value": str(radar_data.fall_status),
        })

    # 心率异常
    if radar_data.heart_rate is not None:
        if radar_data.heart_rate < HEART_RATE_MIN:
            anomalies.append({
                "type": "heart_rate",
                "severity": "critical",
                "message": f"心率过低: {radar_data.heart_rate} 次/分钟",
                "value": str(radar_data.heart_rate),
            })
        elif radar_data.heart_rate > HEART_RATE_MAX:
            anomalies.append({
                "type": "heart_rate",
                "severity": "critical",
                "message": f"心率过高: {radar_data.heart_rate} 次/分钟",
                "value": str(radar_data.heart_rate),
            })

    # 呼吸异常
    if radar_data.breath_rate is not None:
        if radar_data.breath_rate < BREATH_RATE_MIN:
            anomalies.append({
                "type": "breath_rate",
                "severity": "warning",
                "message": f"呼吸率过低: {radar_data.breath_rate} 次/分钟",
                "value": str(radar_data.breath_rate),
            })
        elif radar_data.breath_rate > BREATH_RATE_MAX:
            anomalies.append({
                "type": "breath_rate",
                "severity": "warning",
                "message": f"呼吸率过高: {radar_data.breath_rate} 次/分钟",
                "value": str(radar_data.breath_rate),
            })

    return anomalies


def check_and_create_alert(db: Session, radar_data: RadarData, anomaly: dict) -> None:
    """检查规则并创建告警"""
    try:
        # 获取匹配的告警规则
        rules = (
            db.query(AlertRule)
            .filter(
                AlertRule.rule_type == anomaly["type"],
                AlertRule.enabled == 1,
            )
            .all()
        )

        matched_rule = None
        for rule in rules:
            if rule.elder_id and rule.elder_id != radar_data.elder_id:
                continue
            matched_rule = rule
            break

        # 告警去重
        if radar_data.elder_id:
            duplicate = (
                db.query(AlertRecord)
                .filter(
                    AlertRecord.elder_id == radar_data.elder_id,
                    AlertRecord.alert_type == anomaly["type"],
                    AlertRecord.handled_status == 0,
                    AlertRecord.created_at >= datetime.now() - timedelta(seconds=ALERT_DEDUP_WINDOW),
                )
                .first()
            )
            if duplicate:
                logger.info(f"告警去重: elder={radar_data.elder_id}, type={anomaly['type']}, 距上次告警不足{ALERT_DEDUP_WINDOW}秒")
                return

        # 创建告警
        create_alert(
            db=db,
            elder_id=radar_data.elder_id,
            device_id=radar_data.device_id,
            alert_type=anomaly["type"],
            alert_level=anomaly.get("severity", "warning"),
            alert_message=anomaly["message"],
            trigger_value=anomaly["value"],
            rule_id=matched_rule.id if matched_rule else None,
        )

    except Exception as e:
        logger.error(f"创建告警失败: {e}", exc_info=True)
