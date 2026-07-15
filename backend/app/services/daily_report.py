"""健康日报服务：每天生成老人健康日报，推送给家属"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Family, FamilyElderly, Elderly, RadarData, AlertRecord

logger = logging.getLogger(__name__)

# 默认时区（东八区）
CN_TZ = timezone(timedelta(hours=8))


def _get_elderly_health_summary(db: Session, elderly_id: int) -> Optional[dict]:
    """
    汇总单个老人昨日的健康数据：
      - 平均心率、最低/最高心率
      - 平均呼吸率、最低/最高呼吸率
      - 总活动时长（minutes）
      - 昨日告警数
    """
    yesterday = datetime.now(CN_TZ).date() - timedelta(days=1)
    start_time = datetime.combine(yesterday, datetime.min.time())
    end_time = datetime.combine(datetime.now(CN_TZ).date(), datetime.min.time())

    records = (
        db.query(RadarData)
        .filter(
            RadarData.elder_id == elderly_id,
            RadarData.timestamp >= start_time,
            RadarData.timestamp < end_time,
        )
        .order_by(RadarData.timestamp)
        .all()
    )

    if not records:
        return None

    heart_rates = [r.heart_rate for r in records if r.heart_rate is not None]
    breath_rates = [r.breath_rate for r in records if r.breath_rate is not None]

    # 跌倒次数
    fall_count = sum(1 for r in records if r.fall_status == 1)

    # 昨日告警数
    alert_count = (
        db.query(AlertRecord)
        .filter(
            AlertRecord.elder_id == elderly_id,
            AlertRecord.created_at >= start_time,
            AlertRecord.created_at < end_time,
        )
        .count()
    )

    return {
        "elderly_id": elderly_id,
        "date": str(yesterday),
        "heart_rate_avg": round(sum(heart_rates) / len(heart_rates), 0) if heart_rates else None,
        "heart_rate_min": min(heart_rates) if heart_rates else None,
        "heart_rate_max": max(heart_rates) if heart_rates else None,
        "breath_rate_avg": round(sum(breath_rates) / len(breath_rates), 0) if breath_rates else None,
        "breath_rate_min": min(breath_rates) if breath_rates else None,
        "breath_rate_max": max(breath_rates) if breath_rates else None,
        "data_count": len(records),
        "fall_count": fall_count,
        "alert_count": alert_count,
    }


def _build_daily_report_text(elderly_name: str, health: dict) -> str:
    """构造日报推送文本"""
    lines = [
        f"【SmartCare 健康日报】",
        f"老人：{elderly_name} | 日期：{health['date']}",
        "━━━━━━━━━━━━━━━━━━",
    ]

    if health["heart_rate_avg"] is not None:
        status_hr = "正常" if 60 <= health["heart_rate_avg"] <= 100 else "⚠ 请注意"
        lines.append(
            f"心率：平均{health['heart_rate_avg']:.0f}bpm "
            f"（{health['heart_rate_min']}-{health['heart_rate_max']}）{status_hr}"
        )
    else:
        lines.append("心率：无数据")

    if health["breath_rate_avg"] is not None:
        status_br = "正常" if 12 <= health["breath_rate_avg"] <= 24 else "⚠ 请注意"
        lines.append(
            f"呼吸：平均{health['breath_rate_avg']:.0f}次/分钟 "
            f"（{health['breath_rate_min']}-{health['breath_rate_max']}）{status_br}"
        )
    else:
        lines.append("呼吸：无数据")

    lines.append(f"跌倒：昨日{health['fall_count']}次{' ⚠' if health['fall_count'] > 0 else ' ✅'}")
    lines.append(f"告警：昨日{health['alert_count']}条{' ⚠' if health['alert_count'] > 0 else ' ✅'}")

    lines.append("━━━━━━━━━━━━━━━━━━")
    lines.append("点击小程序查看详情")

    return "\n".join(lines)


def generate_daily_reports():
    """
    为所有已绑定家属的老人，生成昨日的健康日报，
    通过微信订阅消息推送给家属。

    此函数由 APScheduler 每天早 8:00 调用。
    """
    db: Session = SessionLocal()
    try:
        now = datetime.now(CN_TZ)
        logger.info(f"[日报] 开始生成健康日报 {now.strftime('%Y-%m-%d %H:%M:%S')}")

        # 获取所有绑定关系
        bindings = (
            db.query(FamilyElderly, Elderly, Family)
            .join(Elderly, FamilyElderly.elderly_id == Elderly.id)
            .join(Family, FamilyElderly.family_id == Family.id)
            .filter(Family.status == 1, Elderly.status == 1)
            .all()
        )

        if not bindings:
            logger.info("[日报] 无绑定关系，跳过")
            return

        success_count = 0
        skip_count = 0
        fail_count = 0

        for b in bindings:
            elderly = b.Elderly
            family = b.Family

            # 汇总健康数据
            health = _get_elderly_health_summary(db, elderly.id)
            if health is None:
                skip_count += 1
                continue

            # 构造推送文本
            report_text = _build_daily_report_text(elderly.name, health)

            # 推送微信订阅消息
            try:
                _push_wechat_daily_report(
                    openid=family.openid,
                    elderly_name=elderly.name,
                    date=health["date"],
                    hr_avg=f"{health['heart_rate_avg']:.0f}" if health["heart_rate_avg"] is not None else "--",
                    br_avg=f"{health['breath_rate_avg']:.0f}" if health["breath_rate_avg"] is not None else "--",
                    alert_count=str(health["alert_count"]),
                    fall_count=str(health["fall_count"]),
                )
                success_count += 1
                logger.info(
                    f"[日报] 推送成功 family_id={family.id}, "
                    f"elderly={elderly.name}, openid={family.openid[:6]}***"
                )
            except Exception as push_err:
                fail_count += 1
                logger.error(f"[日报] 推送失败 family_id={family.id}: {push_err}")

        logger.info(
            f"[日报] 完成 - 成功{success_count}, 无数据跳过{skip_count}, 失败{fail_count}"
        )

    except Exception as e:
        logger.error(f"[日报] 生成过程异常: {e}", exc_info=True)
    finally:
        db.close()


def _push_wechat_daily_report(
    openid: str,
    elderly_name: str,
    date: str,
    hr_avg: str,
    br_avg: str,
    alert_count: str,
    fall_count: str,
):
    """
    通过微信订阅消息推送健康日报。
    依赖 wechat_service 的 access_token 管理和 send_subscribe_message。
    """
    try:
        from app.services.wechat_service import send_subscribe_message
        from app.config import WECHAT_TEMPLATE_HEALTH

        if not WECHAT_TEMPLATE_HEALTH:
            logger.warning("[日报] 未配置 WECHAT_TEMPLATE_HEALTH，跳过微信推送")
            return

        send_subscribe_message(
            openid=openid,
            template_id=WECHAT_TEMPLATE_HEALTH,
            data={
                "thing1": {"value": elderly_name},             # 老人姓名
                "date2": {"value": date},                      # 日期
                "thing3": {"value": f"均{hr_avg}bpm"},         # 心率
                "thing4": {"value": f"均{br_avg}次/分"},       # 呼吸
                "number5": {"value": alert_count},             # 告警数
                "thing6": {"value": f"跌倒{fall_count}次"},    # 跌倒
            },
        )
    except ImportError:
        logger.warning("[日报] wechat_service 未就绪，微信推送跳过")
    except Exception as e:
        raise  # 向上抛出，由调用方记录
