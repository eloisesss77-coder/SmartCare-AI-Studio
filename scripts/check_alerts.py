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

login = req("POST", "/auth/login", {"username": "admin", "password": "admin123"})
token = login["data"]["token"]
auth = {"Authorization": f"Bearer {token}"}

# 告警详情 - 看创建时间
al = req("GET", "/alerts?page=1&pageSize=10", headers=auth)
alerts = al.get("data", {}).get("list", [])
print("=== 告警列表（含时间）===")
for a in alerts:
    print(f"  id={a.get('id')} elder_id未知 createdAt={a.get('createdAt')} type={a.get('alertType')} elderName={a.get('elderName')}")

# 查单个告警详情确认elderId
print("\n=== 告警详情 ===")
if alerts:
    first_id = alerts[0]['id']
    ad = req("GET", f"/alerts/{first_id}", headers=auth)
    print(json.dumps(ad.get("data", {}), indent=2, ensure_ascii=False)[:500])
