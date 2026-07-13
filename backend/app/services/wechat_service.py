"""微信小程序服务：access_token 管理 + 订阅消息推送"""
import logging
import time
from typing import Optional

import httpx

from app.config import WECHAT_APPID, WECHAT_SECRET, WECHAT_TEMPLATE_ALERT

logger = logging.getLogger(__name__)

# 内存缓存 access_token
_cached_token: Optional[str] = None
_token_expires_at: float = 0


def _get_access_token() -> str:
    """获取/刷新微信 access_token（自动缓存，过期前自动刷新）"""
    global _cached_token, _token_expires_at

    # 提前 5 分钟刷新
    if _cached_token and time.time() < _token_expires_at - 300:
        return _cached_token

    if not WECHAT_APPID or not WECHAT_SECRET:
        logger.warning("微信小程序 AppID 或 Secret 未配置，无法获取 access_token")
        return ""

    try:
        with httpx.Client(timeout=10) as client:
            resp = client.get(
                "https://api.weixin.qq.com/cgi-bin/token",
                params={
                    "grant_type": "client_credential",
                    "appid": WECHAT_APPID,
                    "secret": WECHAT_SECRET,
                },
            )
            data = resp.json()
            if "access_token" in data:
                _cached_token = data["access_token"]
                _token_expires_at = time.time() + data.get("expires_in", 7200)
                logger.info(f"微信 access_token 刷新成功，有效期 {data.get('expires_in')}s")
                return _cached_token
            else:
                logger.error(f"获取 access_token 失败: {data}")
                return ""
    except Exception as e:
        logger.error(f"请求微信 access_token 异常: {e}")
        return ""


def send_subscribe_message(
    openid: str,
    template_id: str,
    data: dict,
    page: str = "",
) -> bool:
    """
    发送微信订阅消息

    Args:
        openid: 接收者 openid
        template_id: 订阅消息模板 ID
        data: 模板数据，格式如 {"thing1": {"value": "xxx"}, "time2": {"value": "2024-01-01"}}
        page: 点击消息跳转的小程序页面路径（可选）

    Returns:
        是否发送成功
    """
    access_token = _get_access_token()
    if not access_token:
        logger.error("无可用 access_token，无法发送订阅消息")
        return False

    payload = {
        "touser": openid,
        "template_id": template_id,
        "page": page,
        "data": data,
        "miniprogram_state": "formal",  # formal=正式版, trial=体验版, developer=开发版
    }

    try:
        with httpx.Client(timeout=10) as client:
            resp = client.post(
                f"https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token={access_token}",
                json=payload,
            )
            result = resp.json()
            if result.get("errcode") == 0:
                logger.info(f"订阅消息发送成功: openid={openid}")
                return True
            else:
                logger.warning(f"订阅消息发送失败: {result}")
                return False
    except Exception as e:
        logger.error(f"发送订阅消息异常: {e}")
        return False


def send_alert_to_family(
    openid: str,
    alert_type: str,
    alert_level: str,
    alert_message: str,
    elder_name: str,
    room_no: str,
    alert_time: str,
    alert_id: int,
) -> bool:
    """
    向家属推送告警通知

    根据告警类型选择模板并构造推送数据
    """
    template_id = WECHAT_TEMPLATE_ALERT
    if not template_id:
        logger.warning("微信告警模板 ID 未配置，跳过推送")
        return False

    level_labels = {"info": "提示", "warning": "一般", "critical": "重要", "emergency": "紧急"}
    type_labels = {"fall": "跌倒检测", "heart_rate": "心率异常", "breath_rate": "呼吸异常",
                   "inactivity": "久未活动", "offline": "设备离线"}

    # 构造订阅消息 data（字段名取决于你在微信后台配置的模板）
    msg_data = {
        "thing1": {"value": elder_name[:20]},                              # 老人姓名
        "thing2": {"value": type_labels.get(alert_type, alert_type)[:20]},  # 告警类型
        "thing3": {"value": f"{level_labels.get(alert_level, alert_level)} - {alert_message}"[:20]},
        "thing4": {"value": room_no[:20]},                                  # 房间号
        "time5": {"value": alert_time[:20]},                                # 告警时间
    }

    page = f"pages/alert/detail?id={alert_id}"

    return send_subscribe_message(openid, template_id, msg_data, page)
