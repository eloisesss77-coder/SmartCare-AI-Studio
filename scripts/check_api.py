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

# 老人列表
eld = req("GET", "/elderly?page=1&pageSize=20", headers=auth)
elist = eld.get("data", {}).get("list", [])
print(f"老人总数: {eld.get('data',{}).get('total',0)}")
for e in elist:
    print(f"  id={e['id']} {e['name']} {e.get('roomNo','')}")

# familyId=1 绑定的老人
my = req("GET", "/family/my-elderly", headers={"X-Family-Id": "1"})
mlist = my.get("data", [])
print(f"\nfamilyId=1 绑定: {len(mlist)} 位老人")
for e in mlist:
    print(f"  {e['elderlyName']} ({e['roomNo']})")

# 验证 family 1 是否存在
print("\n--- 验证 family 表 ---")
try:
    r2 = req("GET", "/family/my-elderly", headers={"X-Family-Id": "99"})
    print("familyId=99:", r2)
except Exception as ex:
    print(f"familyId=99: {ex}")
