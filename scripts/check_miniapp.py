"""诊断小程序实际调用的接口，定位"加载失败"根因"""
import urllib.request, json

BASE = "https://anban.org.cn/api/v1"

def req(method, path, data=None, headers=None, verbose=True):
    h = {"Content-Type": "application/json"}
    if headers:
        h.update(headers)
    body = json.dumps(data).encode() if data is not None else None
    r = urllib.request.Request(f"{BASE}{path}", data=body, headers=h, method=method)
    try:
        resp = urllib.request.urlopen(r)
        code = resp.getcode()
        text = resp.read().decode()
    except urllib.error.HTTPError as e:
        code = e.code
        text = e.read().decode()
    if verbose:
        print(f"[{method}] {path} -> {code}")
        print(f"    {text[:300]}")
    return code, text

print("=" * 60)
print("1. 家属注册（小程序 doLogin 调用的接口）")
print("=" * 60)
code, text = req("POST", "/family/register",
    {"openid": "test_openid_001", "nickname": "测试家属", "phone": ""})
family_id = None
if code == 200:
    family_id = json.loads(text)["data"]["familyId"]
    print(f"   familyId = {family_id}")

fh = {"X-Family-Id": str(family_id)}

print("\n" + "=" * 60)
print("2. 首页 my-elderly（小程序首页调用）")
print("=" * 60)
req("GET", "/family/my-elderly", headers=fh)

print("\n" + "=" * 60)
print("3. 老人详情 /family/elderly/{id}（小程序详情页调用，仅 X-Family-Id 认证）")
print("=" * 60)
# 先获取绑定的老人ID
code, text = req("GET", "/family/my-elderly", headers=fh, verbose=False)
elderly_id = None
if code == 200:
    data = json.loads(text).get("data", [])
    if data:
        elderly_id = data[0]["elderlyId"]
        print(f"   取第一个绑定老人 id={elderly_id}")
    else:
        print("   ⚠️ 没有绑定任何老人！请先在服务器执行 seed_test_data.sql")

if elderly_id:
    req("GET", f"/family/elderly/{elderly_id}", headers=fh)
    req("GET", f"/family/elderly/{elderly_id}/radar-data", headers=fh)
    req("GET", f"/family/elderly/{elderly_id}/daily-reports?days=7", headers=fh)

print("\n" + "=" * 60)
print("4. 告警列表 /family/alerts（小程序告警页调用）")
print("=" * 60)
req("GET", "/family/alerts?page=1&pageSize=10", headers=fh)

print("\n" + "=" * 60)
print("5. 告警详情 + 标记处理（小程序端）")
print("=" * 60)
code, text = req("GET", "/family/alerts?page=1&pageSize=1", headers=fh, verbose=False)
alert_id = None
if code == 200:
    data = json.loads(text).get("data") or {}
    lst = data.get("list", [])
    if lst:
        alert_id = lst[0]["id"]
        print(f"   取第一条告警 id={alert_id}")
if alert_id:
    req("GET", f"/family/alerts/{alert_id}", headers=fh)
    req("PUT", f"/family/alerts/{alert_id}/handle",
        {"handledStatus": 2, "handledBy": "家属", "handleRemark": "已阅"},
        headers=fh)
