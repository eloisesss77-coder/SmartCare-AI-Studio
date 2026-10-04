#!/usr/bin/env python3
"""
通过 Zabbix API 创建 SmartCare 毫米波雷达监控模板。
无需手动导入 YAML，直接调用 API 创建模板、监控项、触发器。
"""

import json
import os
import requests
import sys

ZABBIX_URL = os.environ.get("ZABBIX_URL", "http://localhost:8080/api_jsonrpc.php")
ZABBIX_USER = os.environ.get("ZABBIX_USER", "Admin")
ZABBIX_PASS = os.environ.get("ZABBIX_PASSWORD", "")

TEMPLATE_NAME = "Template SmartCare mmWave Radar"
GROUP_NAME = "Applications"  # 用已有组，避免新组权限问题

auth_token = None
request_id = 0


def api_call(method, params):
    global request_id
    request_id += 1
    payload = {
        "jsonrpc": "2.0",
        "method": method,
        "params": params,
        "auth": auth_token,
        "id": request_id,
    }
    r = requests.post(ZABBIX_URL, json=payload, timeout=30)
    result = r.json()
    if "error" in result:
        print(f"  [ERROR] {method}: {json.dumps(result['error'], ensure_ascii=False)}")
        return None
    return result.get("result")


def create_template():
    """查找已有模板（不调用 template.create，因为 Zabbix 6.4 API 有已知问题）。

    用户需要先在 Zabbix Web UI 手动创建空模板：
        1. Configuration → Templates → Create template
        2. Template name: Template SmartCare mmWave Radar
        3. Template groups: Applications
        4. 点击 Add 即可
    """
    global auth_token
    # 1. 登录
    auth = api_call("user.login", {"username": ZABBIX_USER, "password": ZABBIX_PASS})
    if not auth:
        print("登录 Zabbix 失败")
        sys.exit(1)
    auth_token = auth
    print(f"已登录 Zabbix (token: {auth_token[:8]}...)")

    # 2. 查找模板（仅 get，不 create）
    existing = api_call("template.get", {
        "filter": {"host": TEMPLATE_NAME},
        "selectGroups": "extend",
    })
    if existing:
        template_id = existing[0]["templateid"]
        print(f"找到已有模板: {TEMPLATE_NAME} (id={template_id})")
        return template_id

    # 模板不存在，提示用户手动创建
    print()
    print("=" * 60)
    print(f"模板 '{TEMPLATE_NAME}' 不存在！")
    print()
    print("请在 Zabbix Web UI 手动创建空模板（10 秒操作）：")
    print("  1. Configuration → Templates → Create template")
    print(f"  2. Template name: {TEMPLATE_NAME}")
    print(f"  3. Template groups: {GROUP_NAME}")
    print("  4. 点击 Add 保存")
    print()
    print("创建完成后重新运行本脚本。")
    print("=" * 60)
    api_call("user.logout", [])
    sys.exit(1)


def create_macros(template_id):
    """创建/更新用户宏（已有的用 update，新的用 create）"""
    macros = [
        {"macro": "{$ELDER_ID}", "value": "1", "description": "老人ID"},
        {"macro": "{$ELDER_NAME}", "value": "", "description": "老人姓名"},
        {"macro": "{$ROOM_NO}", "value": "", "description": "房间号"},
        {"macro": "{$DEVICE_SN}", "value": "", "description": "设备序列号"},
        {"macro": "{$HEART_RATE_LOW}", "value": "50", "description": "心率过低(bpm)"},
        {"macro": "{$HEART_RATE_HIGH}", "value": "120", "description": "心率过高(bpm)"},
        {"macro": "{$BREATH_RATE_LOW}", "value": "8", "description": "呼吸过低(rpm)"},
        {"macro": "{$BREATH_RATE_HIGH}", "value": "30", "description": "呼吸过高(rpm)"},
        {"macro": "{$OFFLINE_TIMEOUT}", "value": "5m", "description": "离线超时"},
    ]

    # 先获取模板上已有的宏
    existing = api_call("usermacro.get", {
        "hostids": [template_id],
        "output": ["macro", "hostmacroid"],
    })
    existing_map = {}
    if existing:
        for e in existing:
            existing_map[e["macro"]] = e["hostmacroid"]

    created = 0
    updated = 0
    for m in macros:
        if m["macro"] in existing_map:
            api_call("usermacro.update", {
                "hostmacroid": existing_map[m["macro"]],
                "value": m["value"],
                "description": m["description"],
            })
            updated += 1
        else:
            api_call("usermacro.create", {**m, "hostid": template_id})
            created += 1
    print(f"用户宏: 新建 {created} 个, 更新 {updated} 个")


def _get_item_by_key(template_id, key_):
    """根据 key_ 查找模板上已有的监控项，返回 itemid 或 None。"""
    result = api_call("item.get", {
        "hostids": [template_id],
        "filter": {"key_": key_},
        "output": ["itemid"],
    })
    if result and len(result) > 0:
        return result[0]["itemid"]
    return None


def _get_or_create_item(template_id, item_def):
    """幂等创建监控项：已存在则返回已有ID，不存在则创建。"""
    key_ = item_def["key_"]
    existing_id = _get_item_by_key(template_id, key_)
    if existing_id:
        print(f"  [跳过] 监控项已存在: {key_}")
        return existing_id

    result = api_call("item.create", item_def)
    if result:
        new_id = result["itemids"][0]
        print(f"  [创建] 监控项: {key_} (id={new_id})")
        return new_id
    return None


def create_main_item(template_id):
    """创建主数据 Trapper 监控项"""
    return _get_or_create_item(template_id, {
        "hostid": template_id,
        "name": "雷达主数据",
        "key_": "elder.radar.main_data[{$ELDER_ID}]",
        "type": 2,         # Trapper
        "value_type": 4,   # Text
        "history": "7d",
        "description": "完整雷达感知数据 JSON",
        "delay": "0",
    })


def create_dependent_items(template_id, master_item_id):
    """创建从属监控项"""
    items = [
        {
            "name": "跌倒状态",
            "key_": "elder.radar.fall_status[{$ELDER_ID}]",
            "value_type": 3,   # Unsigned
            "history": "90d",
            "description": "0=正常 1=跌倒",
            "preprocessing": [
                {"type": 12, "params": "$.data.fall_status", "error_handler": "0"}
            ],
        },
        {
            "name": "心率",
            "key_": "elder.radar.heart_rate[{$ELDER_ID}]",
            "value_type": 0,   # Float
            "units": "bpm",
            "history": "90d",
            "trends": "365d",
            "preprocessing": [
                {"type": 12, "params": "$.data.heart_rate", "error_handler": "0"}
            ],
        },
        {
            "name": "呼吸率",
            "key_": "elder.radar.breath_rate[{$ELDER_ID}]",
            "value_type": 0,
            "units": "rpm",
            "history": "90d",
            "trends": "365d",
            "preprocessing": [
                {"type": 12, "params": "$.data.breath_rate", "error_handler": "0"}
            ],
        },
        {
            "name": "活动量指数",
            "key_": "elder.radar.activity_level[{$ELDER_ID}]",
            "value_type": 0,
            "units": "%",
            "history": "90d",
            "trends": "365d",
            "preprocessing": [
                {"type": 12, "params": "$.data.activity_level", "error_handler": "0"}
            ],
        },
        {
            "name": "在床状态",
            "key_": "elder.radar.in_bed[{$ELDER_ID}]",
            "value_type": 3,
            "history": "90d",
            "description": "0=离床 1=在床",
            "preprocessing": [
                {"type": 12, "params": "$.data.in_bed", "error_handler": "0"}
            ],
        },
        {
            "name": "体态",
            "key_": "elder.radar.body_posture[{$ELDER_ID}]",
            "value_type": 1,   # Char
            "history": "90d",
            "description": "standing/sitting/lying/walking",
            "preprocessing": [
                {"type": 12, "params": "$.data.body_posture", "error_handler": "0"}
            ],
        },
    ]

    item_ids = []
    for item in items:
        full_item = {
            **item,
            "hostid": template_id,
            "type": 18,         # Dependent item
            "master_itemid": master_item_id,
            "delay": "0",
        }
        item_id = _get_or_create_item(template_id, full_item)
        if item_id:
            item_ids.append(item_id)
    print(f"从属监控项: {len(item_ids)} 个")
    return item_ids


def create_online_item(template_id):
    """创建在线状态 Trapper 监控项"""
    return _get_or_create_item(template_id, {
        "hostid": template_id,
        "name": "雷达设备在线",
        "key_": "elder.radar.online[{$ELDER_ID}]",
        "type": 2,
        "value_type": 3,
        "history": "7d",
        "description": "1=在线 0=离线",
        "delay": "0",
    })


def create_triggers(template_id):
    """创建触发器（幂等：已存在同描述则跳过）"""
    # 先查模板上已有触发器
    existing_triggers = api_call("trigger.get", {
        "hostids": [template_id],
        "output": ["description", "triggerid"],
    })
    existing_descs = set()
    if existing_triggers:
        for t in existing_triggers:
            existing_descs.add(t["description"])

    triggers = [
        {
            "description": "跌倒告警: {$ELDER_NAME} 房间 {$ROOM_NO}",
            "expression": f"last(/{TEMPLATE_NAME}/elder.radar.fall_status[{{$ELDER_ID}}])=1",
            "priority": 5,
            "comments": "发生跌倒！请立即前往查看！",
            "manual_close": 1,
            "status": 0,
            "tags": [
                {"tag": "elder", "value": "{$ELDER_ID}"},
                {"tag": "type", "value": "fall"},
            ],
        },
        {
            "description": "心率过低: {$ELDER_NAME} 房间 {$ROOM_NO}",
            "expression": f"last(/{TEMPLATE_NAME}/elder.radar.heart_rate[{{$ELDER_ID}}])<{{$HEART_RATE_LOW}}",
            "priority": 4,
            "comments": "心率过低告警",
            "manual_close": 1,
            "status": 0,
            "tags": [
                {"tag": "elder", "value": "{$ELDER_ID}"},
                {"tag": "type", "value": "heart_rate_low"},
            ],
        },
        {
            "description": "心率过高: {$ELDER_NAME} 房间 {$ROOM_NO}",
            "expression": f"last(/{TEMPLATE_NAME}/elder.radar.heart_rate[{{$ELDER_ID}}])>{{$HEART_RATE_HIGH}}",
            "priority": 4,
            "comments": "心率过高告警",
            "manual_close": 1,
            "status": 0,
            "tags": [
                {"tag": "elder", "value": "{$ELDER_ID}"},
                {"tag": "type", "value": "heart_rate_high"},
            ],
        },
        {
            "description": "呼吸过低: {$ELDER_NAME} 房间 {$ROOM_NO}",
            "expression": f"last(/{TEMPLATE_NAME}/elder.radar.breath_rate[{{$ELDER_ID}}])<{{$BREATH_RATE_LOW}}",
            "priority": 4,
            "comments": "呼吸率过低告警",
            "manual_close": 1,
            "status": 0,
            "tags": [
                {"tag": "elder", "value": "{$ELDER_ID}"},
                {"tag": "type", "value": "breath_low"},
            ],
        },
        {
            "description": "设备离线: {$ELDER_NAME} 房间 {$ROOM_NO}",
            "expression": f"nodata(/{TEMPLATE_NAME}/elder.radar.online[{{$ELDER_ID}}],{{$OFFLINE_TIMEOUT}})=1",
            "priority": 2,
            "comments": "设备离线超过阈值",
            "manual_close": 1,
            "status": 0,
            "tags": [
                {"tag": "elder", "value": "{$ELDER_ID}"},
                {"tag": "type", "value": "offline"},
            ],
        },
    ]

    created = 0
    skipped = 0
    for t in triggers:
        if t["description"] in existing_descs:
            skipped += 1
        else:
            api_call("trigger.create", t)
            created += 1
    print(f"触发器: 新建 {created} 个, 跳过 {skipped} 个")


def main():
    print("=" * 60)
    print("通过 Zabbix API 创建 SmartCare 雷达监控模板")
    print("=" * 60)

    template_id = create_template()
    create_macros(template_id)
    main_id = create_main_item(template_id)
    create_dependent_items(template_id, main_id)
    create_online_item(template_id)
    create_triggers(template_id)

    # 登出
    api_call("user.logout", [])
    print("\n" + "=" * 60)
    print("模板创建完成！")
    print("模板: " + TEMPLATE_NAME)
    print("模板组: " + GROUP_NAME)
    print(f"模板ID: {template_id}")
    print("=" * 60)


if __name__ == "__main__":
    main()
