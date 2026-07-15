import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import APP_NAME, APP_VERSION, APP_DEBUG
from app.database import engine, Base
from app.routers import elderly, radar, alerts, dashboard, auth, users, family, devices

# 配置日志
logging.basicConfig(
    level=logging.DEBUG if APP_DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# WebSocket 连接管理器
active_ws_connections: list[WebSocket] = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    logger.info(f"启动 {APP_NAME} v{APP_VERSION}")
    # 启动时自动创建数据库表
    Base.metadata.create_all(bind=engine)
    logger.info("数据库表创建/检查完成")
    yield
    logger.info(f"{APP_NAME} 正在关闭")


app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="SmartCare 智慧养老监控系统后端API",
    lifespan=lifespan,
)

# CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(elderly.router)
app.include_router(radar.router)
app.include_router(alerts.router)
app.include_router(dashboard.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(family.router)
app.include_router(devices.router)


# ---------------------------------------------------------------
# 健康检查
# ---------------------------------------------------------------

@app.get("/api/health")
def health_check():
    """健康检查接口"""
    return {"status": "ok", "service": APP_NAME, "version": APP_VERSION}


# ---------------------------------------------------------------
# WebSocket: 实时告警推送
# ---------------------------------------------------------------

@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    """WebSocket 端点用于实时推送告警"""
    await websocket.accept()
    active_ws_connections.append(websocket)
    logger.info(f"WebSocket 客户端已连接, 当前连接数: {len(active_ws_connections)}")

    try:
        while True:
            # 保持连接，接收客户端消息(ping/pong)
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        logger.info("WebSocket 客户端断开连接")
    except Exception as e:
        logger.error(f"WebSocket 异常: {e}")
    finally:
        if websocket in active_ws_connections:
            active_ws_connections.remove(websocket)
        logger.info(f"WebSocket 连接已移除, 当前连接数: {len(active_ws_connections)}")


async def broadcast_alert(alert_data: dict) -> None:
    """向所有连接的 WebSocket 客户端广播告警"""
    import json
    disconnected = []
    for ws in active_ws_connections:
        try:
            await ws.send_text(json.dumps(alert_data))
        except Exception:
            disconnected.append(ws)
    for ws in disconnected:
        active_ws_connections.remove(ws)
