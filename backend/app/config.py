import os
from dotenv import load_dotenv

load_dotenv()

# 数据库连接
DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://smartcare:CHANGE_ME@host.docker.internal:3306/smartcare"
)

# Zabbix 配置
ZABBIX_SERVER: str = os.getenv("ZABBIX_SERVER", "127.0.0.1")
ZABBIX_API_URL: str = os.getenv("ZABBIX_API_URL", "http://127.0.0.1/zabbix/api_jsonrpc.php")
ZABBIX_USER: str = os.getenv("ZABBIX_USER", "Admin")
ZABBIX_PASSWORD: str = os.getenv("ZABBIX_PASSWORD", "zabbix")

# 告警通知配置
ALERT_WEBHOOK_URL: str = os.getenv("ALERT_WEBHOOK_URL", "")
DINGTALK_WEBHOOK_URL: str = os.getenv("DINGTALK_WEBHOOK_URL", "")
WECOM_WEBHOOK_URL: str = os.getenv("WECOM_WEBHOOK_URL", "")

# 应用配置
APP_NAME: str = "SmartCare Monitor API"
APP_VERSION: str = "1.0.0"
APP_DEBUG: bool = os.getenv("APP_DEBUG", "false").lower() == "true"

# 异常检测阈值
HEART_RATE_MIN: int = int(os.getenv("HEART_RATE_MIN", "40"))
HEART_RATE_MAX: int = int(os.getenv("HEART_RATE_MAX", "120"))
BREATH_RATE_MIN: int = int(os.getenv("BREATH_RATE_MIN", "10"))
BREATH_RATE_MAX: int = int(os.getenv("BREATH_RATE_MAX", "30"))
OUT_OF_BED_MAX_MINUTES: int = int(os.getenv("OUT_OF_BED_MAX_MINUTES", "30"))

# 告警去重时间窗口（秒）
ALERT_DEDUP_WINDOW: int = int(os.getenv("ALERT_DEDUP_WINDOW", "300"))

# 微信小程序配置
WECHAT_APPID: str = os.getenv("WECHAT_APPID", "")
WECHAT_SECRET: str = os.getenv("WECHAT_SECRET", "")
# 微信订阅消息模板ID（按告警类型区分）
WECHAT_TEMPLATE_ALERT: str = os.getenv("WECHAT_TEMPLATE_ALERT", "")       # 通用告警通知模板
WECHAT_TEMPLATE_HEALTH: str = os.getenv("WECHAT_TEMPLATE_HEALTH", "")     # 健康数据日报模板

# JWT 认证配置
JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "smartcare-jwt-secret-change-in-production")
JWT_ALGORITHM: str = "HS256"
JWT_EXPIRE_MINUTES: int = 120
