#!/usr/bin/env python3
"""Zabbix 自动发现老人 Host 脚本

从后端 API 获取所有绑定雷达的老人信息，通过 Zabbix API 自动创建/更新 Host，
并关联 Template SmartCare mmWave Radar 模板。

使用方式:
    python discover_elderly.py --zabbix-url http://localhost:8080 \\
        --zabbix-user Admin --zabbix-pass zabbix \\
        --backend-url http://localhost:8000
"""

import argparse
import json
import logging
import os
import sys
from typing import Any, Optional

import requests

# ---------------------------------------------------------------------------
# 日志
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("discover-elderly")

# ---------------------------------------------------------------------------
# 常量
# ---------------------------------------------------------------------------
TEMPLATE_NAME = "Template SmartCare mmWave Radar"
HOST_GROUP_NAME = "SmartCare/Devices"
DEFAULT_TIMEOUT = 10

# ---------------------------------------------------------------------------
# Zabbix API 客户端
# ---------------------------------------------------------------------------


class ZabbixAPIClient:
    """Zabbix JSON-RPC API 客户端。"""

    def __init__(self, url: str, username: str, password: str, timeout: int = DEFAULT_TIMEOUT) -> None:
        """初始化 Zabbix API 客户端。

        Args:
            url: Zabbix 前端 URL
            username: Zabbix 用户名
            password: Zabbix 密码
            timeout: 请求超时
        """
        self._url = url.rstrip("/") + "/api_jsonrpc.php"
        self._username = username
        self._password = password
        self._timeout = timeout
        self._auth_token: Optional[str] = None
        self._request_id = 0

    def login(self) -> str:
        """登录 Zabbix API 并获取认证 Token。

        Returns:
            认证 Token
        """
        payload = {
            "jsonrpc": "2.0",
            "method": "user.login",
            "params": {
                "username": self._username,
                "password": self._password,
            },
            "id": self._get_request_id(),
        }

        result = self._call_api(payload)
        self._auth_token = result
        logger.info("Zabbix API 登录成功")
        return result

    def logout(self) -> None:
        """登出 Zabbix API。"""
        if not self._auth_token:
            return
        self._call_api({
            "jsonrpc": "2.0",
            "method": "user.logout",
            "params": [],
            "id": self._get_request_id(),
            "auth": self._auth_token,
        })
        self._auth_token = None
        logger.info("Zabbix API 已登出")

    def _get_request_id(self) -> int:
        self._request_id += 1
        return self._request_id

    def _call_api(self, payload: dict) -> Any:
        """调用 Zabbix JSON-RPC API。

        Args:
            payload: 请求负载

        Returns:
            API 响应 result 字段

        Raises:
            RuntimeError: API 返回错误时
        """
        try:
            response = requests.post(
                self._url,
                json=payload,
                timeout=self._timeout,
                headers={"Content-Type": "application/json-rpc"},
            )
            data = response.json()

            if "error" in data:
                error = data["error"]
                raise RuntimeError(
                    f"Zabbix API 错误: {error.get('message', error)} "
                    f"(code: {error.get('code', 'N/A')})"
                )

            return data["result"]

        except requests.exceptions.Timeout:
            raise RuntimeError("Zabbix API 请求超时")
        except requests.exceptions.ConnectionError as exc:
            raise RuntimeError(f"Zabbix API 连接失败: {exc}")

    # -----------------------------------------------------------------------
    # 业务方法
    # -----------------------------------------------------------------------

    def get_template_id(self, template_name: str) -> Optional[str]:
        """根据模板名称获取模板 ID。

        Args:
            template_name: 模板名称

        Returns:
            模板 ID，未找到返回 None
        """
        result = self._call_api({
            "jsonrpc": "2.0",
            "method": "template.get",
            "params": {
                "filter": {"host": template_name},
                "output": ["templateid", "name"],
            },
            "id": self._get_request_id(),
            "auth": self._auth_token,
        })

        if result:
            logger.info("找到模板: %s (ID: %s)", result[0]["name"], result[0]["templateid"])
            return result[0]["templateid"]

        logger.warning("未找到模板: %s", template_name)
        return None

    def get_or_create_host_group(self, group_name: str) -> str:
        """获取或创建主机组。

        Args:
            group_name: 组名

        Returns:
            主机组 ID
        """
        result = self._call_api({
            "jsonrpc": "2.0",
            "method": "hostgroup.get",
            "params": {
                "filter": {"name": group_name},
                "output": ["groupid", "name"],
            },
            "id": self._get_request_id(),
            "auth": self._auth_token,
        })

        if result:
            return result[0]["groupid"]

        # 创建组
        logger.info("创建主机组: %s", group_name)
        result = self._call_api({
            "jsonrpc": "2.0",
            "method": "hostgroup.create",
            "params": {"name": group_name},
            "id": self._get_request_id(),
            "auth": self._auth_token,
        })
        return result["groupids"][0]

    def get_host_by_name(self, host_name: str) -> Optional[dict]:
        """按名称查找 Host。

        Args:
            host_name: Host 名称

        Returns:
            Host 信息字典，未找到返回 None
        """
        result = self._call_api({
            "jsonrpc": "2.0",
            "method": "host.get",
            "params": {
                "filter": {"host": host_name},
                "output": ["hostid", "host", "name"],
                "selectMacros": "extend",
            },
            "id": self._get_request_id(),
            "auth": self._auth_token,
        })
        return result[0] if result else None

    def create_host(
        self,
        host_name: str,
        visible_name: str,
        template_id: str,
        group_id: str,
        macros: list[dict],
    ) -> str:
        """创建 Zabbix Host。

        Args:
            host_name: 技术名称
            visible_name: 显示名称
            template_id: 关联模板 ID
            group_id: 主机组 ID
            macros: 宏列表 [{"macro": "{$KEY}", "value": "val"}, ...]

        Returns:
            创建的 Host ID
        """
        logger.info("创建 Host: %s (%s)", host_name, visible_name)

        result = self._call_api({
            "jsonrpc": "2.0",
            "method": "host.create",
            "params": {
                "host": host_name,
                "name": visible_name,
                "groups": [{"groupid": group_id}],
                "templates": [{"templateid": template_id}],
                "macros": macros,
                "inventory_mode": 0,
                "status": 0,  # 启用
            },
            "id": self._get_request_id(),
            "auth": self._auth_token,
        })

        host_id = result["hostids"][0]
        logger.info("Host 创建成功: %s (ID: %s)", host_name, host_id)
        return host_id

    def update_host_macros(self, host_id: str, macros: list[dict]) -> None:
        """更新 Host 的宏。

        Args:
            host_id: Host ID
            macros: 宏列表
        """
        # 先删除现有宏
        existing = self._call_api({
            "jsonrpc": "2.0",
            "method": "usermacro.get",
            "params": {
                "hostids": [host_id],
                "output": ["hostmacroid"],
            },
            "id": self._get_request_id(),
            "auth": self._auth_token,
        })

        for macro_obj in existing:
            self._call_api({
                "jsonrpc": "2.0",
                "method": "usermacro.delete",
                "params": [macro_obj["hostmacroid"]],
                "id": self._get_request_id(),
                "auth": self._auth_token,
            })

        # 批量创建新宏
        for macro in macros:
            macro["hostid"] = host_id

        self._call_api({
            "jsonrpc": "2.0",
            "method": "usermacro.create",
            "params": macros,
            "id": self._get_request_id(),
            "auth": self._auth_token,
        })

        logger.info("Host %s 的宏已更新", host_id)


# ---------------------------------------------------------------------------
# 主逻辑
# ---------------------------------------------------------------------------


def _fetch_elderly_from_backend(backend_url: str, timeout: int = DEFAULT_TIMEOUT) -> list[dict]:
    """从后端 API 获取所有老人和雷达绑定信息。

    Args:
        backend_url: 后端 API 基础 URL
        timeout: 请求超时

    Returns:
        老人列表
    """
    api_url = f"{backend_url.rstrip('/')}/api/v1/elderly/devices"

    try:
        response = requests.get(api_url, timeout=timeout)
        if response.status_code != 200:
            logger.error("后端 API 返回异常: %d", response.status_code)
            return []

        data = response.json()
        elderly_list = data.get("data", data.get("results", []))

        logger.info("从后端获取到 %d 位老人的雷达绑定信息", len(elderly_list))
        return elderly_list

    except requests.exceptions.Timeout:
        logger.error("后端 API 请求超时")
        return []
    except Exception as exc:
        logger.error("后端 API 请求失败: %s", exc)
        return []


def discover_and_sync(
    zabbix_url: str,
    zabbix_user: str,
    zabbix_pass: str,
    backend_url: str,
) -> dict:
    """同步老人 Host 到 Zabbix。

    从后端 API 拉取老人→雷达绑定列表，自动在 Zabbix 中创建/更新 Host。

    Args:
        zabbix_url: Zabbix 前端 URL
        zabbix_user: Zabbix 用户名
        zabbix_pass: Zabbix 密码
        backend_url: 后端 API 基础 URL

    Returns:
        {"created": [...], "updated": [...], "errors": [...]}
    """
    zabbix = ZabbixAPIClient(zabbix_url, zabbix_user, zabbix_pass)

    try:
        zabbix.login()

        # 获取模板和组
        template_id = zabbix.get_template_id(TEMPLATE_NAME)
        if not template_id:
            return {"created": [], "updated": [], "errors": [f"模板 '{TEMPLATE_NAME}' 不存在，请先导入"]}

        group_id = zabbix.get_or_create_host_group(HOST_GROUP_NAME)

        # 获取老人列表
        elderly_list = _fetch_elderly_from_backend(backend_url)

        created: list[str] = []
        updated: list[str] = []
        errors: list[str] = []

        for elder in elderly_list:
            elder_id = elder.get("elder_id", elder.get("id", ""))
            elder_name = elder.get("elder_name", elder.get("name", elder_id))
            room_no = elder.get("room_no", elder.get("room", ""))

            if not elder_id:
                continue

            host_name = f"Elder-{elder_id}"
            visible_name = f"{elder_name} ({room_no})"

            macros = [
                {"macro": "{$ELDER_ID}", "value": elder_id},
                {"macro": "{$ELDER_NAME}", "value": elder_name},
                {"macro": "{$ROOM_NO}", "value": room_no},
            ]

            try:
                existing_host = zabbix.get_host_by_name(host_name)

                if existing_host:
                    # 更新宏
                    zabbix.update_host_macros(existing_host["hostid"], macros)
                    updated.append(host_name)
                    logger.info("更新 Host: %s", host_name)
                else:
                    # 创建
                    zabbix.create_host(
                        host_name=host_name,
                        visible_name=visible_name,
                        template_id=template_id,
                        group_id=group_id,
                        macros=macros,
                    )
                    created.append(host_name)

            except Exception as exc:
                error_msg = f"处理 {host_name} 失败: {exc}"
                logger.error(error_msg)
                errors.append(error_msg)

        return {
            "created": created,
            "updated": updated,
            "errors": errors,
        }

    finally:
        zabbix.logout()


def main() -> None:
    """主入口。"""
    parser = argparse.ArgumentParser(
        description="Zabbix 老人雷达 Host 自动发现"
    )
    parser.add_argument(
        "--zabbix-url",
        default=os.environ.get("ZABBIX_URL", "http://localhost:8080"),
        help="Zabbix 前端 URL",
    )
    parser.add_argument(
        "--zabbix-user",
        default=os.environ.get("ZABBIX_USER", "Admin"),
        help="Zabbix 用户名",
    )
    parser.add_argument(
        "--zabbix-pass",
        default=os.environ.get("ZABBIX_PASSWORD", ""),
        help="Zabbix 密码",
    )
    parser.add_argument(
        "--backend-url",
        default=os.environ.get("BACKEND_URL", "http://localhost:8000"),
        help="SmartCare 后端 API 基础 URL",
    )

    args = parser.parse_args()

    logger.info("=" * 50)
    logger.info("Zabbix 老人雷达 Host 自动发现")
    logger.info("=" * 50)

    result = discover_and_sync(
        zabbix_url=args.zabbix_url,
        zabbix_user=args.zabbix_user,
        zabbix_pass=args.zabbix_pass,
        backend_url=args.backend_url,
    )

    logger.info("创建 Host: %d", len(result["created"]))
    logger.info("更新 Host: %d", len(result["updated"]))
    logger.info("错误数量: %d", len(result["errors"]))

    if result["errors"]:
        for err in result["errors"]:
            logger.warning(err)

    # 输出 JSON 结果供脚本调用
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
