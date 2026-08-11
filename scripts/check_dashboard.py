import urllib.request, json

BASE = "https://anban.org.cn/api/v1"

def req(method, path, data=None, headers=None):
    h = {"Content-Type": "application/json"}
    if headers:
        h.update(headers)
    body = json.dumps(data).encode() if data else None
    r = urllib.request.Request(f"{BASE}{path}", data=body, headers=h, method=method)
    resp = urllib.request.urlopen(r)
    return json.loads(resp.read())

# login
login = req("POST", "/auth/login", {"username": "admin", "password": "admin123"})
token = login["data"]["token"]
auth = {"Authorization": f"Bearer {token}"}

# dashboard overview
ov = req("GET", "/dashboard/overview", headers=auth)
d = ov.get("data", {})
print("=== Dashboard Overview ===")
print(f"totalElderly: {d.get('totalElderly')}")
print(f"onlineDevices: {d.get('onlineDevices')}")
print(f"activeAlerts: {d.get('activeAlerts')}")
print(f"fallCountToday: {d.get('fallCountToday')}")
rooms = d.get("roomStatusList", [])
print(f"roomStatusList 数量: {len(rooms)}")
for r in rooms:
    print(f"  {r.get('roomNo')} - {r.get('elderName')} online={r.get('online')}")

# 再试一次：确认返回一致
ov2 = req("GET", "/dashboard/overview", headers=auth)
d2 = ov2.get("data", {})
rooms2 = d2.get("roomStatusList", [])
print(f"\n第二次请求 roomStatusList: {len(rooms2)} 个")
for r in rooms2:
    print(f"  {r.get('roomNo')} - {r.get('elderName')}")
