# SmartCare 智慧养老监控系统 — 云服务器部署指南

> 适用操作系统：**Ubuntu 22.04 LTS**

---

## 目录

1. [零、安全加固（部署前必做）](#零安全加固)
2. [一、服务器要求](#一服务器要求)
3. [二、安装 Docker 环境](#二安装-docker-环境)
4. [三、上传项目文件到服务器](#三上传项目文件到服务器)
5. [四、部署步骤](#四部署步骤)
6. [五、启动雷达数据采集器](#五启动雷达数据采集器)
7. [六、安装 Zabbix 6.4 LTS](#六安装-zabbix-64-lts)
8. [七、项目结构说明](#七项目结构说明)
9. [八、API 接口速查](#八api-接口速查)
10. [九、常用运维命令](#九常用运维命令)
11. [十、安全检查清单（定期执行）](#十安全检查清单定期执行)

---

## 零、安全加固

> **部署前必须先完成本节，否则服务器可能被挖矿/蠕虫入侵！**

### 0.1 首次登录后立即修改 SSH

```bash
# 备份原始配置
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

# 禁用 root 密码登录，改用密钥
# 1) 本地生成密钥对(Windows: ssh-keygen -t ed25519)
# 2) 将公钥写入服务器:
#    ssh-copy-id root@你的IP
#    或手动: mkdir -p ~/.ssh && echo "你的公钥" >> ~/.ssh/authorized_keys
# 3) 验证密钥登录成功后执行:

sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
systemctl restart sshd
```

### 0.2 配置防火墙 UFW

```bash
# 安装防火墙
apt install -y ufw

# 默认拒绝所有入站
ufw default deny incoming
ufw default allow outgoing

# 仅开放必要端口
ufw allow 22/tcp        # SSH
ufw allow 80/tcp        # SmartCare 前端(必需)
ufw allow 8080/tcp      # Zabbix Web UI(仅管理用，可临时关闭)
# 注意: 8000 端口仅绑定 127.0.0.1，不对外开放

ufw --force enable
ufw status verbose       # 确认规则生效
```

### 0.3 生成强密码

```bash
# 使用 openssl 生成随机密码（务必记住！）
echo "SmartCare MySQL 密码: $(openssl rand -base64 16)"
echo "Zabbix MySQL 密码:   $(openssl rand -base64 16)"
echo "MySQL root 密码:    $(openssl rand -base64 16)"

# 示例输出:
# SmartCare MySQL 密码: a8K2mP9xV3qL7wR5
# Zabbix MySQL 密码:   yB4nF6jH1sW8cT0d
# MySQL root 密码:    zX5vN2pK9mR6hJ3w
```

**把这三个密码保存到安全的地方，后面配置全部使用这些强密码！**

---

## 一、服务器要求

| 项目 | 最低配置 | 推荐配置 |
|------|----------|----------|
| CPU | 2核 | 4核+ |
| 内存 | 4GB | 8GB+ |
| 磁盘 | 40GB | 100GB SSD |
| 系统 | Ubuntu 22.04 LTS |
| 开放端口 | SSH(22) + 前端(80) + Zabbix(8080) |

---

## 二、安装 Docker 环境

```bash
# 一键安装 Docker
curl -fsSL https://get.docker.com | bash -s docker
systemctl enable docker && systemctl start docker

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 验证
docker --version
docker-compose --version
```

---

## 三、上传项目文件到服务器

```powershell
# Windows PowerShell 本地执行:
# 方式一：从项目根目录
scp -r "d:\网训科技\SmartCare-AI-Studio\03-Projects\smartcare-monitor" root@118.178.98.48:/opt/

# 方式二：先 cd 进去再传
cd "d:\网训科技\SmartCare-AI-Studio\03-Projects"
scp -r smartcare-monitor root@118.178.98.48:/opt/
```

---

## 四、部署步骤

### 4.1 安装 MySQL 8.0（宿主机直接安装）

```bash
apt install -y mysql-server

# 安全初始化
mysql_secure_installation
# 回答: 设置强密码 → Y(移除匿名) → Y(禁远程root) → Y(删test库) → Y(重载)

# 使 MySQL 仅监听本地(!!!安全关键!!!)
# 确认 bind-address 为 127.0.0.1:
grep "^bind-address" /etc/mysql/mysql.conf.d/mysqld.cnf
# 如果不是，修改:
sed -i 's/^bind-address.*/bind-address = 127.0.0.1/' /etc/mysql/mysql.conf.d/mysqld.cnf
systemctl restart mysql
```

#### 创建数据库和用户（使用 0.3 生成的强密码）

```bash
# 用 root 登录 MySQL
mysql -uroot -p << 'EOF'
-- SmartCare 数据库
CREATE DATABASE smartcare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 用户仅允许本地连接(!!!安全关键，不要用 %!!!)
CREATE USER 'smartcare'@'localhost' IDENTIFIED BY '你的smartcare强密码';
CREATE USER 'smartcare'@'172.18.0.%' IDENTIFIED BY '你的smartcare强密码';

GRANT ALL PRIVILEGES ON smartcare.* TO 'smartcare'@'localhost';
GRANT ALL PRIVILEGES ON smartcare.* TO 'smartcare'@'172.18.0.%';

-- Zabbix 数据库
CREATE DATABASE zabbix CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
CREATE USER 'zabbix'@'localhost' IDENTIFIED BY '你的zabbix强密码';
GRANT ALL PRIVILEGES ON zabbix.* TO 'zabbix'@'localhost';
SET GLOBAL log_bin_trust_function_creators = 1;

FLUSH PRIVILEGES;
EOF

# 永久启用 log_bin_trust_function_creators
egrep "^log_bin_trust_function_creators" /etc/mysql/mysql.conf.d/mysqld.cnf || \
  echo "log_bin_trust_function_creators = 1" >> /etc/mysql/mysql.conf.d/mysqld.cnf

# 确保 MySQL 使用 mysql_native_password 认证(pymysql兼容)
mysql -uroot -p << 'EOF'
ALTER USER 'smartcare'@'localhost' IDENTIFIED WITH mysql_native_password BY '你的smartcare强密码';
ALTER USER 'smartcare'@'172.18.0.%' IDENTIFIED WITH mysql_native_password BY '你的smartcare强密码';
ALTER USER 'zabbix'@'localhost' IDENTIFIED WITH mysql_native_password BY '你的zabbix强密码';
FLUSH PRIVILEGES;
EOF
```

#### 导入初始数据

```bash
mysql -usmartcare -p smartcare < /opt/smartcare-monitor/sql/init.sql
```

#### 导入 Zabbix 表结构

```bash
zcat /usr/share/zabbix-sql-scripts/mysql/server.sql.gz | mysql -uzabbix -p zabbix
```

### 4.2 配置环境变量（密码不写入文件，从 .env 读取）

```bash
cd /opt/smartcare-monitor

cat > .env << 'EOF'
# SmartCare 数据库连接(注意替换密码!)
SMARTCARE_DB_URL=mysql+pymysql://smartcare:你的smartcare强密码@host.docker.internal:3306/smartcare

# Zabbix 集成
ZABBIX_SERVER=127.0.0.1
ZABBIX_API_URL=http://127.0.0.1/zabbix/api_jsonrpc.php
ZABBIX_USER=Admin
ZABBIX_PASSWORD=你的新密码

# 告警通知 Webhook(可选)
ALERT_WEBHOOK_URL=
EOF

# 设置权限，禁止其他用户读取 .env
chmod 600 .env
```

> `.env` 文件包含数据库密码，已在 `.gitignore` 中，不会提交到 Git。

### 4.3 安装 Node.js 并构建前端

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 验证版本(node>=18, npm>=9)
node --version
npm --version

cd /opt/smartcare-monitor/frontend
npm install
npm run build
```

### 4.4 启动服务

```bash
cd /opt/smartcare-monitor
docker compose up -d --build
```

验证：

```bash
docker compose ps                               # 看 frontend+backend 状态
docker compose logs backend --tail 10           # 确认无错误
curl http://127.0.0.1:8000/api/health           # {"status":"ok"}
curl -I http://127.0.0.1:80                     # HTTP/1.1 200

# 确认 8000 端口未暴露公网(返回值应只有 127.0.0.1)
ss -tlnp | grep 8000
# 应显示: LISTEN 0 4096 127.0.0.1:8000 ...
```

### 4.5 浏览器访问

打开 `http://你的服务器IP` 即可看到监控大屏。

---

## 五、启动雷达数据采集器

### 5.1 修改配置文件（匹配数据库真实老人 ID）

```bash
cd /opt/smartcare-monitor/radar-collector

# 先查看数据库里有哪些老人
mysql -usmartcare -p -e "SELECT id, name, room_no FROM smartcare.t_elderly;"

# 根据实际数据修改 config.yaml 中的 elderly 列表(id 必须是数据库真实主键)
vim config.yaml
```

### 5.2 安装依赖并启动

```bash
pip3 install -r requirements.txt

# 前台测试运行（确认无报错）
python3 main.py
# Ctrl+C 停止

# 后台运行
nohup python3 main.py > /tmp/radar.log 2>&1 &
```

### 5.3 配置 systemd 服务（生产推荐）

```bash
cat > /etc/systemd/system/smartcare-radar.service << 'EOF'
[Unit]
Description=SmartCare Radar Collector
After=network.target docker.service mysql.service

[Service]
Type=simple
WorkingDirectory=/opt/smartcare-monitor/radar-collector
ExecStart=/usr/bin/python3 /opt/smartcare-monitor/radar-collector/main.py
Restart=always
RestartSec=10
User=nobody
NoNewPrivileges=yes

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now smartcare-radar
systemctl status smartcare-radar

# 查看日志
journalctl -u smartcare-radar -f
```

---

## 六、安装 Zabbix 6.4 LTS

### 6.1 安装 Zabbix 仓库和组件

```bash
wget https://repo.zabbix.com/zabbix/6.4/ubuntu/pool/main/z/zabbix-release/zabbix-release_6.4-1+ubuntu22.04_all.deb
dpkg -i zabbix-release_6.4-1+ubuntu22.04_all.deb
apt update
apt install -y zabbix-server-mysql zabbix-frontend-php zabbix-nginx-conf zabbix-sql-scripts zabbix-agent

# 安装中文支持
apt install -y language-pack-zh-hans
locale-gen zh_CN.UTF-8
```

### 6.2 配置 Zabbix Server

```bash
vim /etc/zabbix/zabbix_server.conf
```

修改以下行（取消注释并填值）：

```ini
DBHost=127.0.0.1
DBName=zabbix
DBUser=zabbix
DBPassword=你的zabbix强密码
ListenPort=10051
```

### 6.3 配置 Zabbix PHP-FPM

```bash
cat > /etc/zabbix/php-fpm.conf << 'EOF'
[zabbix]
user = www-data
group = www-data

listen = /var/run/php/zabbix.sock
listen.owner = www-data
listen.allowed_clients = 127.0.0.1

pm = dynamic
pm.max_children = 50
pm.start_servers = 5
pm.min_spare_servers = 5
pm.max_spare_servers = 35
pm.max_requests = 200

php_value[session.save_handler] = files
php_value[session.save_path]    = /var/lib/php/sessions/

php_value[max_execution_time] = 300
php_value[max_input_time] = 300
php_value[memory_limit] = 256M
php_value[post_max_size] = 32M
php_value[upload_max_filesize] = 16M
php_value[max_input_vars] = 10000
php_value[date.timezone] = Asia/Shanghai
EOF

# 复制到 FPM pool 目录
cp /etc/zabbix/php-fpm.conf /etc/php/8.1/fpm/pool.d/zabbix.conf
```

### 6.4 配置 Zabbix Nginx

```bash
cat > /etc/zabbix/nginx.conf << 'EOF'
server {
    listen          8080;
    server_name     _;

    root    /usr/share/zabbix;
    index   index.php;

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    location ~ \.php$ {
        fastcgi_pass    unix:/var/run/php/zabbix.sock;
        fastcgi_index   index.php;
        fastcgi_param   SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include         fastcgi_params;
    }
}
EOF

# 确保 Nginx 不占用 80(80 给 SmartCare 前端)
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/zabbix/nginx.conf /etc/nginx/sites-enabled/zabbix

# 确保 PHP session 目录可写
chmod 733 /var/lib/php/sessions/
chown www-data:www-data /var/lib/php/sessions/
```

### 6.5 重启所有 Zabbix 相关服务

```bash
systemctl restart php8.1-fpm nginx zabbix-server zabbix-agent
systemctl enable php8.1-fpm nginx zabbix-server zabbix-agent
systemctl status zabbix-server      # 确认 active
```

### 6.6 Zabbix Web UI 初始化

1. 浏览器访问 `http://你的IP:8080`
2. 按向导完成（数据库连接使用 `zabbix` 用户和你设置的强密码）
3. 登录后切换中文：右上角头像 → **User settings** → Language → **Chinese (zh_CN)**
4. 修改 Admin 默认密码：管理 → 用户 → Admin → 更改密码 → **设一个强密码**

### 6.7 配置 SmartCare Webhook 告警

**管理 → 报警媒介类型 → 创建媒介类型：**

| 字段 | 值 |
|------|-----|
| 名称 | `SmartCare Alert` |
| 类型 | `Webhook` |

**参数（5个）：**

| 名称 | 值 |
|------|-----|
| `alert_subject` | `{ALERT.SUBJECT}` |
| `alert_message` | `{ALERT.MESSAGE}` |
| `alert_severity` | `{EVENT.SEVERITY}` |
| `host_name` | `{HOST.NAME}` |
| `api_url` | `http://127.0.0.1:8000/api/v1/alerts` |

**脚本**：粘贴 `zabbix/webhook-alert.js` 全部内容（在本地 `d:\网训科技\SmartCare-AI-Studio\03-Projects\smartcare-monitor\zabbix\webhook-alert.js`）。

**管理 → 动作 → 创建动作：**
- 名称: `SmartCare 雷达告警`
- 条件: 触发器严重性 >= 警告
- 操作: 发送消息（媒介类型选 SmartCare Alert）

### 6.8 导入 SmartCare 雷达监控模板

Zabbix Web UI → **配置 → 模板 → 导入** → 选择 `/opt/smartcare-monitor/zabbix/template-smartcare-radar.yaml`

### 6.9 验证 Zabbix 与 SmartCare 联通

```bash
# Zabbix Server 运行状态
systemctl status zabbix-server

# SmartCare 后端状态
curl http://127.0.0.1:8000/api/health

# 本地测试 Webhook 连通
curl -X POST http://127.0.0.1:8000/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '{"source":"zabbix","alert_type":"test","alert_level":1,"alert_message":"联通测试"}'
# 应返回: {"code":200,"message":"告警创建成功"}
```

---

## 七、项目结构说明

```
smartcare-monitor/
├── docker-compose.yml          # 服务编排
├── .env                        # 环境变量(密码, 勿提交Git)
├── DEPLOY.md                   # 本部署文档
│
├── backend/                    # FastAPI 后端
│   └── app/
│       ├── main.py             # 入口
│       ├── models.py           # ORM 模型(6张表)
│       ├── schemas.py          # Pydantic 模型
│       ├── routers/            # API 路由
│       └── services/           # 业务逻辑
│
├── frontend/                   # React 前端
│   ├── nginx.conf              # Nginx 反向代理配置
│   └── src/pages/             # 4个页面
│
├── radar-collector/            # 雷达数据采集器
│   ├── config.yaml             # 采集器配置(设备/老人映射)
│   └── main.py                 # 入口
│
├── zabbix/                     # Zabbix 集成
│   ├── template-smartcare-radar.yaml  # 监控模板
│   ├── webhook-alert.js               # Webhook 脚本
│   └── scripts/
│
└── sql/
    └── init.sql                # 数据库初始化
```

---

## 八、API 接口速查

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| WS | `/ws/alerts` | WebSocket 实时告警 |
| GET | `/api/v1/dashboard/stats` | Dashboard 汇总 |
| GET | `/api/v1/dashboard/alert-trend?days=7` | 告警趋势 |
| GET | `/api/v1/elderly?page=1&pageSize=10` | 老人列表 |
| POST | `/api/v1/elderly` | 新增老人 |
| GET | `/api/v1/elderly/{id}` | 老人详情 |
| GET | `/api/v1/elderly/{id}/radar-data` | 老人最新雷达数据 |
| POST | `/api/v1/radar/data` | **接收雷达数据** (采集器用) |
| GET | `/api/v1/radar/devices?page=1&pageSize=10` | 雷达设备列表 |
| GET | `/api/v1/radar/data/history?elderId=1&hours=24` | 雷达数据历史 |
| GET | `/api/v1/alerts?page=1&pageSize=10` | 告警列表 |
| POST | `/api/v1/alerts` | **接收 Zabbix Webhook 告警** |
| PUT | `/api/v1/alerts/{id}/handle` | 处理告警 |
| POST | `/api/v1/alerts/rules` | 新增告警规则 |

---

## 九、常用运维命令

```bash
cd /opt/smartcare-monitor

# ---- 服务管理 ----
docker compose ps                                       # 查看容器状态
docker compose restart backend                          # 重启后端
docker compose logs -f backend --tail=50                # 实时日志
docker compose up -d --build backend                    # 改代码后重建

# ---- 前端更新 ----
cd frontend && npm run build && cd ..
docker restart smartcare-frontend

# ---- 数据库 ----
mysql -usmartcare -p smartcare                          # 登录SmartCare库
mysql -uzabbix -p zabbix                                # 登录Zabbix库

# ---- 采集器 ----
systemctl status smartcare-radar                        # 采集器状态
journalctl -u smartcare-radar -f                        # 采集器实时日志

# ---- Zabbix ----
systemctl status zabbix-server
tail -f /var/log/zabbix/zabbix_server.log
```

---

## 十、安全检查清单（定期执行）

```bash
# 1. 确认 8000 端口未暴露公网
ss -tlnp | grep 8000
# 正确输出应包含 "127.0.0.1:8000"

# 2. 确认 MySQL 仅监听本地
ss -tlnp | grep 3306
# 正确输出应包含 "127.0.0.1:3306"

# 3. 确认 UFW 防火墙运行中
ufw status verbose

# 4. 检查可疑进程
ps aux | grep -v grep | grep -E "miner|xmrig|crypto|stratum|worm"

# 5. 检查 crontab 异常
crontab -l
grep -r "curl\|wget\|base64.*|.*sh" /var/spool/cron/ 2>/dev/null

# 6. 检查异常网络连接
ss -tlnp | grep -vE "22|80|8080|10051|127.0.0.1"

# 7. 检查 Docker 容器日志是否有异常访问
docker compose logs backend --tail 200 | grep -E "4[0-9]{2}|5[0-9]{2}"

# 8. 定期更新系统
apt update && apt upgrade -y  # 建议每周执行
```

### 安全红线（绝对不能犯）

| 错误做法 | 正确做法 |
|----------|----------|
| MySQL `bind-address = 0.0.0.0` | `bind-address = 127.0.0.1` |
| MySQL 用户 `@'%'` | `@'localhost'` + `@'172.18.0.%'`(仅Docker) |
| 密码 `123456`、`root123` | `openssl rand -base64 16` 生成强密码 |
| 8000 端口对外开放 | `127.0.0.1:8000:8000` 仅本地 |
| 不启用防火墙 | `ufw enable` 仅开22/80/8080 |
| 密码写在 docker-compose.yml | 从 `.env` 文件读取，`chmod 600` |
| 用 weakpassword 做密码 | 最少16位混合大小写+数字+符号 |
