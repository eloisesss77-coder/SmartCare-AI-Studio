#!/bin/bash
# ==============================================================================
# SmartCare Zabbix 一键配置脚本
#
# 功能:
#   1. 通过 Zabbix API 导入雷达监控模板
#   2. 创建老人 Host 并关联模板
#   3. 配置 Action（告警动作，触发 Webhook）
#   4. 配置 Media Type（Webhook 类型）
#
# 使用方式:
#   chmod +x setup_zabbix.sh
#   ./setup_zabbix.sh
#
# 环境变量（可通过 export 设置，或直接修改下方默认值）:
#   ZABBIX_URL       - Zabbix 前端 URL (默认: http://localhost:8080)
#   ZABBIX_USER      - Zabbix 用户名 (默认: Admin)
#   ZABBIX_PASSWORD  - Zabbix 密码
#   BACKEND_URL      - SmartCare 后端 API 基础 URL (默认: http://localhost:8000)
#   WEBHOOK_SCRIPT   - Webhook 脚本路径 (默认: ../webhook-alert.py)
# ==============================================================================

set -euo pipefail

# ------------------------------------------------------------------
# 配置项
# ------------------------------------------------------------------
ZABBIX_URL="${ZABBIX_URL:-http://localhost:8080}"
ZABBIX_USER="${ZABBIX_USER:-Admin}"
ZABBIX_PASSWORD="${ZABBIX_PASSWORD:-}"
BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
WEBHOOK_SCRIPT="${WEBHOOK_SCRIPT:-$(dirname "$0")/../webhook-alert.py}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TEMPLATE_FILE="${PROJECT_DIR}/template-smartcare-radar.yaml"

# -------------------------------------------------------
# 辅助函数
# -------------------------------------------------------

log_info() {
    echo "[INFO]  $(date '+%H:%M:%S') $*"
}

log_error() {
    echo "[ERROR] $(date '+%H:%M:%S') $*" >&2
}

_zabbix_api() {
    local method="$1"
    local params="${2:-{}}"

    local response
    response=$(curl -s -X POST "${ZABBIX_URL}/api_jsonrpc.php" \
        -H "Content-Type: application/json-rpc" \
        -d "{
            \"jsonrpc\": \"2.0\",
            \"method\": \"${method}\",
            \"params\": ${params},
            \"id\": 1,
            \"auth\": \"${AUTH_TOKEN}\"
        }" 2>/dev/null)

    local error
    error=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error',''))" 2>/dev/null || true)

    if [[ -n "$error" && "$error" != "None" ]]; then
        log_error "Zabbix API 错误 (${method}): ${error}"
    fi

    echo "$response"
}

# -------------------------------------------------------
# 步骤 1: 登录 Zabbix
# -------------------------------------------------------
log_info "╔══════════════════════════════════════════════╗"
log_info "║  SmartCare Zabbix 一键配置                    ║"
log_info "╚══════════════════════════════════════════════╝"
log_info ""
log_info "Zabbix URL : ${ZABBIX_URL}"
log_info "Backend    : ${BACKEND_URL}"
log_info ""

log_info ">>> 步骤 1/5: 登录 Zabbix API"

LOGIN_RESPONSE=$(curl -s -X POST "${ZABBIX_URL}/api_jsonrpc.php" \
    -H "Content-Type: application/json-rpc" \
    -d "{
        \"jsonrpc\": \"2.0\",
        \"method\": \"user.login\",
        \"params\": {
            \"username\": \"${ZABBIX_USER}\",
            \"password\": \"${ZABBIX_PASSWORD}\"
        },
        \"id\": 1
    }" 2>/dev/null)

AUTH_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['result'])" 2>/dev/null)

if [[ -z "$AUTH_TOKEN" ]]; then
    log_error "Zabbix 登录失败，请检查用户名和密码"
    log_error "响应: ${LOGIN_RESPONSE}"
    exit 1
fi

log_info "  ✓ 登录成功，Token: ${AUTH_TOKEN:0:12}..."

# -------------------------------------------------------
# 步骤 2: 导入监控模板
# -------------------------------------------------------
log_info ""
log_info ">>> 步骤 2/5: 导入监控模板"

if [[ ! -f "$TEMPLATE_FILE" ]]; then
    log_error "模板文件不存在: ${TEMPLATE_FILE}"
    exit 1
fi

# 读取模板 YAML 并转换为 JSON
TEMPLATE_CONTENT=$(cat "$TEMPLATE_FILE")

# 检查模板是否已存在
EXISTING_TEMPLATE=$(_zabbix_api "template.get" "{
    \"filter\": {\"host\": [\"Template SmartCare mmWave Radar\"]},
    \"output\": [\"templateid\"]
}")

EXISTING_COUNT=$(echo "$EXISTING_TEMPLATE" | python3 -c "import sys,json; r=json.load(sys.stdin).get('result',[]); print(len(r))" 2>/dev/null)

if [[ "$EXISTING_COUNT" != "0" ]]; then
    log_info "  ⚠ 模板已存在，跳过导入"
else
    # 使用 Zabbix configuration.import API 导入 YAML
    IMPORT_RESULT=$(_zabbix_api "configuration.import" "{
        \"format\": \"yaml\",
        \"rules\": {
            \"template_groups\": {\"createMissing\": true},
            \"templates\": {\"createMissing\": true, \"updateExisting\": true},
            \"items\": {\"createMissing\": true, \"updateExisting\": true},
            \"triggers\": {\"createMissing\": true, \"updateExisting\": true},
            \"discoveryRules\": {\"createMissing\": true, \"updateExisting\": true}
        },
        \"source\": $(python3 -c "import json; print(json.dumps(open('${TEMPLATE_FILE}').read()))" 2>/dev/null)
    }")

    IMPORT_STATUS=$(echo "$IMPORT_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',False))" 2>/dev/null)

    if [[ "$IMPORT_STATUS" == "True" ]]; then
        log_info "  ✓ 模板导入成功"
    else
        log_error "  模板导入失败"
        log_error "  响应: ${IMPORT_RESULT}"
    fi
fi

# -------------------------------------------------------
# 步骤 3: 创建 Webhook Media Type
# -------------------------------------------------------
log_info ""
log_info ">>> 步骤 3/5: 配置 Webhook Media Type"

EXISTING_MEDIA=$(_zabbix_api "mediatype.get" "{
    \"filter\": {\"name\": \"SmartCare Alert Webhook\"},
    \"output\": [\"mediatypeid\"]
}")

MEDIA_COUNT=$(echo "$EXISTING_MEDIA" | python3 -c "import sys,json; r=json.load(sys.stdin).get('result',[]); print(len(r))" 2>/dev/null)

if [[ "$MEDIA_COUNT" != "0" ]]; then
    log_info "  ⚠ Media Type 已存在，跳过创建"
else
    # 注意: Webhook Media Type 需要复杂的参数配置，此处提供基本信息
    # 实际使用时建议在 Zabbix WEB UI 中手动配置或通过更详细的 API 调用
    CREATE_MEDIA=$(_zabbix_api "mediatype.create" "{
        \"name\": \"SmartCare Alert Webhook\",
        \"type\": 4,
        \"parameters\": [
            {\"name\": \"script\", \"value\": \"${WEBHOOK_SCRIPT}\"},
            {\"name\": \"timeout\", \"value\": \"30\"}
        ],
        \"description\": \"SmartCare 智能养老告警 Webhook\",
        \"status\": 0,
        \"message_templates\": [
            {
                \"eventsource\": 0,
                \"recovery\": 0,
                \"subject\": \"SmartCare 告警通知\",
                \"message\": \"{ALERT.MESSAGE}\"
            }
        ]
    }")

    MEDIA_ID=$(echo "$CREATE_MEDIA" | python3 -c "import sys,json; r=json.load(sys.stdin).get('result',{}); print(r.get('mediatypeids',[''])[0])" 2>/dev/null)

    if [[ -n "$MEDIA_ID" ]]; then
        log_info "  ✓ Webhook Media Type 创建成功 (ID: ${MEDIA_ID})"
    else
        log_info "  ⚠ Media Type 创建可能需要调整，请到 Zabbix WEB UI 中手动配置 Webhook"
    fi
fi

# -------------------------------------------------------
# 步骤 4: 配置告警 Action
# -------------------------------------------------------
log_info ""
log_info ">>> 步骤 4/5: 配置告警 Action"

EXISTING_ACTION=$(_zabbix_api "action.get" "{
    \"filter\": {\"name\": \"SmartCare 雷达告警通知\"},
    \"output\": [\"actionid\"]
}")

ACTION_COUNT=$(echo "$EXISTING_ACTION" | python3 -c "import sys,json; r=json.load(sys.stdin).get('result',[]); print(len(r))" 2>/dev/null)

if [[ "$ACTION_COUNT" != "0" ]]; then
    log_info "  ⚠ Action 已存在，跳过创建"
else
    # 创建 Action（需要配置条件和操作，此处提供基础框架）
    CREATE_ACTION=$(_zabbix_api "action.create" "{
        \"name\": \"SmartCare 雷达告警通知\",
        \"eventsource\": 0,
        \"status\": 0,
        \"esc_period\": \"10m\",
        \"def_shortdata\": \"{TRIGGER.NAME}: {TRIGGER.STATUS}\",
        \"def_longdata\": \"{TRIGGER.NAME}\r\n\r\nHost: {HOST.NAME}\r\nSeverity: {TRIGGER.SEVERITY}\r\nTime: {EVENT.TIME}\r\n\r\n{TRIGGER.DESCRIPTION}\",
        \"filter\": {
            \"evaltype\": 0,
            \"conditions\": [
                {
                    \"conditiontype\": 24,
                    \"operator\": 0,
                    \"value2\": \"\",
                    \"formulaid\": \"A\"
                }
            ]
        },
        \"operations\": [
            {
                \"operationtype\": 0,
                \"esc_period\": \"0\",
                \"esc_step_from\": 1,
                \"esc_step_to\": 1,
                \"evaltype\": 0,
                \"opmessage_grp\": [{\"usrgrpid\": \"7\"}],
                \"opmessage\": {
                    \"default_msg\": 1,
                    \"mediatypeid\": \"\"
                }
            }
        ]
    }")

    ACTION_ID=$(echo "$CREATE_ACTION" | python3 -c "import sys,json; r=json.load(sys.stdin).get('result',{}); print(r.get('actionids',[''])[0])" 2>/dev/null)

    if [[ -n "$ACTION_ID" ]]; then
        log_info "  ✓ Action 创建成功 (ID: ${ACTION_ID})"
    else
        log_info "  ⚠ Action 创建可能需要进一步配置，请到 Zabbix WEB UI 中完成设置"
    fi
fi

# -------------------------------------------------------
# 步骤 5: 自动发现老人 Host
# -------------------------------------------------------
log_info ""
log_info ">>> 步骤 5/5: 自动发现老人 Host"

DISCOVER_SCRIPT="${SCRIPT_DIR}/discover_elderly.py"

if [[ -f "$DISCOVER_SCRIPT" ]]; then
    python3 "$DISCOVER_SCRIPT" \
        --zabbix-url "$ZABBIX_URL" \
        --zabbix-user "$ZABBIX_USER" \
        --zabbix-pass "$ZABBIX_PASSWORD" \
        --backend-url "$BACKEND_URL"
else
    log_info "  ⚠ discover_elderly.py 不存在，跳过自动发现"
    log_info "  请手动运行: python3 discover_elderly.py --help"
fi

# -------------------------------------------------------
# 清理：登出
# -------------------------------------------------------
curl -s -X POST "${ZABBIX_URL}/api_jsonrpc.php" \
    -H "Content-Type: application/json-rpc" \
    -d "{
        \"jsonrpc\": \"2.0\",
        \"method\": \"user.logout\",
        \"params\": [],
        \"id\": 1,
        \"auth\": \"${AUTH_TOKEN}\"
    }" > /dev/null 2>&1 || true

log_info ""
log_info "╔══════════════════════════════════════════════╗"
log_info "║  配置完成                                    ║"
log_info "╚══════════════════════════════════════════════╝"
log_info ""
log_info "后续步骤:"
log_info " 1. 检查 Zabbix WEB UI → Configuration → Templates"
log_info " 2. 检查 Zabbix WEB UI → Configuration → Hosts"
log_info " 3. 配置 Webhook Media Type 关联 Action"
log_info " 4. 启动雷达采集服务: python3 radar-collector/main.py"
log_info ""
