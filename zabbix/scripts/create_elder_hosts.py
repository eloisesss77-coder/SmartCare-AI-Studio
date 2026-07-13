#!/usr/bin/env python3
"""为每个老人自动创建 Zabbix Host 并链接雷达监控模板。

从 SmartCare 数据库 t_elderly 表读取老人信息，
通过 Zabbix API 创建 Host、设置宏、链接模板。

用法:
    python3 create_elder_hosts.py \
        --zabbix-url http://localhost:8080/api_jsonrpc.php \
        --zabbix-user Admin \
        --zabbix-pass 你的zabbix密码 \
        --db-host 127.0.0.1 \
        --db-user smartcare \
        --db-pass 你的smartcare密码 \
        --db-name smartcare
"""

import argparse
import json
import logging
import sys
from typing import Any

import pymysql
import requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("create-elder-hosts")

TEMPLATE_NAME = "Template SmartCare mmWave Radar"
TEMPLATE_GROUP_NAME = "SmartCare Elders"


# ---------------------------------------------------------------------------
# Zabbix API client
# ---------------------------------------------------------------------------
class ZabbixAPI:
    def __init__(self, url: str, user: str, password: str) -> None:
        self._url = url.rstrip("/")
        self._auth: str = ""
        self._req_id = 0
        self._login(user, password)

    def _call(self, method: str, params: dict[str, Any]) -> dict:
        self._req_id += 1
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
            "id": self._req_id,
        }
        if self._auth:
            payload["auth"] = self._auth
        resp = requests.post(self._url, json=payload, timeout=30)
        resp.raise_for_status()
        result = resp.json()
        if "error" in result:
            raise RuntimeError(f"Zabbix API 错误: {result['error']}")
        return result["result"]

    def _login(self, user: str, password: str) -> None:
        self._auth = ""
        result = self._call("user.login", {"username": user, "password": password})
        self._auth = str(result)
        logger.info("Zabbix API 登录成功")

    def get_template_id(self, name: str) -> str:
        result = self._call("template.get", {"filter": {"host": [name]}})
        if not result:
            raise RuntimeError(f"模板不存在: {name}")
        return result[0]["templateid"]

    def get_group_id(self, name: str) -> str:
        result = self._call("hostgroup.get", {"filter": {"name": [name]}})
        if not result:
            # 自动创建
            group_ids = self._call("hostgroup.create", {"name": name})
            logger.info("创建主机组: %s (id=%s)", name, group_ids["groupids"][0])
            return group_ids["groupids"][0]
        return result[0]["groupid"]

    def host_exists(self, host_name: str) -> bool:
        result = self._call("host.get", {"filter": {"host": [host_name]}})
        return len(result) > 0

    def create_host(
        self,
        host_name: str,
        visible_name: str,
        template_id: str,
        group_id: str,
        macros: dict[str, str],
    ) -> str:
        return self._call("host.create", {
            "host": host_name,
            "name": visible_name,
            "groups": [{"groupid": group_id}],
            "templates": [{"templateid": template_id}],
            "macros": [
                {"macro": k, "value": str(v)}
                for k, v in macros.items()
            ],
            "inventory_mode": 0,
        })["hostids"][0]

    def update_host_macros(self, host_name: str, macros: dict[str, str]) -> None:
        """已有 Host 则更新宏。"""
        hosts = self._call("host.get", {"filter": {"host": [host_name]}})
        if not hosts:
            return
        host_id = hosts[0]["hostid"]

        # 先删旧宏后建新宏
        old_macros = self._call("usermacro.get", {"hostids": [host_id]})
        for m in old_macros:
            self._call("usermacro.delete", [m["hostmacroid"]])

        for k, v in macros.items():
            self._call("usermacro.create", {
                "hostid": host_id,
                "macro": k,
                "value": str(v),
            })
        logger.info("更新 Host [%s] 宏: %s", host_name, macros)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    parser = argparse.ArgumentParser(description="为每个老人创建 Zabbix Host")
    parser.add_argument("--zabbix-url", default="http://localhost:8080/api_jsonrpc.php")
    parser.add_argument("--zabbix-user", default="Admin")
    parser.add_argument("--zabbix-pass", required=True)
    parser.add_argument("--db-host", default="127.0.0.1")
    parser.add_argument("--db-user", default="smartcare")
    parser.add_argument("--db-pass", required=True)
    parser.add_argument("--db-name", default="smartcare")
    args = parser.parse_args()

    # 1. 连接 SmartCare 数据库获取老人列表
    logger.info("连接数据库 %s@%s/%s ...", args.db_user, args.db_host, args.db_name)
    conn = pymysql.connect(
        host=args.db_host,
        user=args.db_user,
        password=args.db_pass,
        database=args.db_name,
        charset="utf8mb4",
    )
    with conn.cursor(pymysql.cursors.DictCursor) as cursor:
        cursor.execute("""
            SELECT e.id, e.name, e.room_no, e.status,
                   rd.device_sn
            FROM t_elderly e
            LEFT JOIN t_radar_device rd ON e.radar_device_id = rd.id
            WHERE e.status = 1
            ORDER BY e.id
        """)
        elders = cursor.fetchall()
    conn.close()

    if not elders:
        logger.warning("数据库中没有在册老人，先通过 SmartCare 前端添加老人")
        sys.exit(0)

    logger.info("从数据库读取到 %d 位老人", len(elders))
    for e in elders:
        logger.info("  id=%s  name=%s  room=%s  sn=%s", e["id"], e["name"], e["room_no"] or "-", e["device_sn"] or "-")

    # 2. 连接 Zabbix API
    logger.info("连接 Zabbix API: %s", args.zabbix_url)
    zapi = ZabbixAPI(args.zabbix_url, args.zabbix_user, args.zabbix_pass)

    template_id = zapi.get_template_id(TEMPLATE_NAME)
    group_id = zapi.get_group_id(TEMPLATE_GROUP_NAME)
    logger.info("模板 ID=%s, 主机组 ID=%s", template_id, group_id)

    # 3. 为每个老人创建 Host
    created = 0
    updated = 0
    for elder in elders:
        eid = str(elder["id"])
        host_name = f"Elder-{eid}"
        visible_name = f"{elder['name']}({eid}) - {elder['room_no'] or '未分配'}"

        macros = {
            "{$ELDER_ID}": eid,
            "{$ELDER_NAME}": elder["name"],
            "{$ROOM_NO}": elder["room_no"] or "",
            "{$DEVICE_SN}": elder["device_sn"] or "",
        }

        if zapi.host_exists(host_name):
            logger.info("Host 已存在，更新宏: %s", host_name)
            zapi.update_host_macros(host_name, macros)
            updated += 1
        else:
            host_id = zapi.create_host(
                host_name=host_name,
                visible_name=visible_name,
                template_id=template_id,
                group_id=group_id,
                macros=macros,
            )
            logger.info("创建 Host: %s (id=%s)", host_name, host_id)
            created += 1

    logger.info("=" * 50)
    logger.info("完成！创建: %d, 更新: %d, 总计: %d", created, updated, len(elders))
    logger.info("现在启动雷达采集器开始发送数据: systemctl start smartcare-radar")


if __name__ == "__main__":
    main()
