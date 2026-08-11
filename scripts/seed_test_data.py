#!/usr/bin/env python3
"""向服务器插入测试假数据：老人 + 绑定码 + 家属注册绑定"""

import requests
import random

BASE = "https://anban.org.cn/api/v1"

# ---------- step 1: 管理员登录 ----------
print("1. 管理员登录...")
r = requests.post(f"{BASE}/auth/login", json={"username": "admin", "password": "123456"})
r.raise_for_status()
token = r.json()["data"]["token"]
headers = {"Authorization": f"Bearer {token}"}
print("   Token:", token[:20] + "...")

# ---------- step 2: 创建测试老人 ----------
ELDERLY_DATA = [
    {"name": "张建国", "age": 78, "gender": 1, "roomNo": "101", "medicalHistory": "高血压、糖尿病",
     "emergencyContact": "张小明", "emergencyPhone": "13800001111", "status": 1},
    {"name": "李秀兰", "age": 75, "gender": 2, "roomNo": "102", "medicalHistory": "冠心病",
     "emergencyContact": "李小红", "emergencyPhone": "13800002222", "status": 1},
    {"name": "王德发", "age": 82, "gender": 1, "roomNo": "103", "medicalHistory": "脑梗后遗症、高血压",
     "emergencyContact": "王大军", "emergencyPhone": "13800003333", "status": 1},
    {"name": "赵桂英", "age": 71, "gender": 2, "roomNo": "201", "medicalHistory": "骨质疏松",
     "emergencyContact": "赵小芳", "emergencyPhone": "13800004444", "status": 1},
]

elderly_ids = []
print("\n2. 创建测试老人...")
for e in ELDERLY_DATA:
    r = requests.post(f"{BASE}/elderly", json=e, headers=headers)
    if r.status_code == 201 or r.json().get("code") == 200:
        eid = r.json()["data"]["id"]
        elderly_ids.append(eid)
        print(f"   {e['name']} (id={eid}, {e['roomNo']}室)")
    else:
        print(f"   {e['name']} 创建失败: {r.text}")

# ---------- step 3: 生成绑定码 ----------
print("\n3. 生成绑定码...")
bind_codes = []
for eid in elderly_ids:
    r = requests.post(f"{BASE}/family/generate-bind-code",
                      json={"elderlyId": eid, "relation": "子女"}, headers=headers)
    if r.status_code == 200:
        data = r.json()["data"]
        bind_codes.append(data)
        print(f"   老人 id={eid} → 绑定码: {data['bindCode']} (过期: {data['expireAt']})")
    else:
        print(f"   老人 id={eid} 绑定码生成失败: {r.text}")

# ---------- step 4: 模拟小程序端家属注册 ----------
print("\n4. 模拟家属注册...")
device_id = f"test_device_{random.randint(10000, 99999)}"
r = requests.post(f"{BASE}/family/register", json={
    "openid": device_id,
    "nickname": "测试家属小明",
    "phone": "13900001111"
})
r.raise_for_status()
family_id = r.json()["data"]["familyId"]
print(f"   familyId = {family_id}, openid = {device_id}")

family_headers = {"X-Family-Id": str(family_id)}

# ---------- step 5: 使用绑定码绑定老人 ----------
print("\n5. 使用绑定码绑定所有老人...")
for bc in bind_codes:
    r = requests.post(f"{BASE}/family/use-bind-code",
                      json={"bindCode": bc["bindCode"], "relation": "子女"},
                      headers=family_headers)
    if r.status_code == 200:
        data = r.json()["data"]
        print(f"   绑定成功: {data['elderlyName']} ({data['roomNo']}室)")
    else:
        print(f"   绑定失败: {r.text}")

# ---------- step 6: 验证 ----------
print("\n6. 验证 my-elderly 接口...")
r = requests.get(f"{BASE}/family/my-elderly", headers=family_headers)
if r.status_code == 200:
    elderly_list = r.json()["data"]
    print(f"   共绑定 {len(elderly_list)} 位老人:")
    for e in elderly_list:
        print(f"     - {e['elderlyName']} ({e['roomNo']}室)")
else:
    print(f"   失败: {r.text}")

print(f"\n===== 完成 =====")
print(f"小程序测试时，将 deviceId 设为: {device_id}")
print(f"或在 app.tsx 中把 generateUUID 固定返回此值即可看到数据")
