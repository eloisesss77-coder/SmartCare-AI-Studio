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

# 登录
login = req("POST", "/auth/login", {"username": "admin", "password": "admin123"})
token = login["data"]["token"]
auth = {"Authorization": f"Bearer {token}"}

# 1. Dashboard overview
print("=== /dashboard/overview ===")
ov = req("GET", "/dashboard/overview", headers=auth)
d = ov.get("data", {})
print("totalElderly:", d.get("totalElderly"))
print("onlineDevices:", d.get("onlineDevices"))
print("activeAlerts:", d.get("activeAlerts"))
rooms = d.get("roomStatusList", [])
print(f"roomStatusList ({len(rooms)}):")
for r in rooms:
    print(f"  roomNo={r.get('roomNo')}, name={r.get('elderlyName')}, online={r.get('online')}, deviceOnline={r.get('deviceOnline')}")

# 2. Alert trend
print("\n=== /dashboard/alert-trend ===")
at = req("GET", "/dashboard/alert-trend", headers=auth)
trend = at.get("data", [])
print(f"trend数据: {len(trend)} 天")
for t in trend:
    print(f"  {t}")

# 3. Alert list
print("\n=== /alerts ===")
al = req("GET", "/alerts?page=1&pageSize=5", headers=auth)
alerts = al.get("data", {}).get("list", [])
print(f"最近告警: {len(alerts)} 条")
for a in alerts[:3]:
    print(f"  {a.get('elderName')} {a.get('roomNo')} {a.get('alertType')}")

# 4. Bind codes
print("\n=== /family/bind-codes ===")
bc = req("GET", "/family/bind-codes", headers=auth)
codes = bc.get("data", [])
print(f"绑定码: {len(codes)} 个")
for c in codes[:3]:
    print(f"  {c.get('bindCode')} -> {c.get('elderlyName')}({c.get('roomNo')})")
