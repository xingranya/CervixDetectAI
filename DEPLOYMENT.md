# CervixDetectAI 生产环境部署指南

本文档提供详细的生产环境部署步骤和配置说明。

## 目录

- [服务器要求](#服务器要求)
- [部署步骤](#部署步骤)
- [配置说明](#配置说明)
- [监控维护](#监控维护)
- [性能优化](#性能优化)
- [安全建议](#安全建议)
- [故障排查](#故障排查)

## 服务器要求

### 硬件要求

- **CPU**: 2核心以上推荐
- **内存**: 4GB以上（建议8GB）
- **硬盘**: 20GB以上可用空间（SSD推荐）
- **带宽**: 5Mbps以上

### 软件要求

- **操作系统**: Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- **Node.js**: 20.x 或更高版本
- **MySQL**: 5.7+ 或 8.0+
- **Nginx**: 1.18+ 或更高版本
- **PM2**: 最新版本（进程管理器）
- **Git**: 用于代码拉取

## 部署步骤

### 1. 安装必要软件

#### 1.1 更新系统

```bash
sudo apt update && sudo apt upgrade -y
```

#### 1.2 安装Node.js 20.x

```bash
# 添加NodeSource仓库
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# 安装Node.js
sudo apt install -y nodejs

# 验证安装
node --version  # 应显示 v20.x.x
npm --version
```

#### 1.3 安装MySQL

```bash
# 安装MySQL服务器
sudo apt install -y mysql-server

# 运行安全配置脚本
sudo mysql_secure_installation

# 启动MySQL服务
sudo systemctl start mysql
sudo systemctl enable mysql
```

#### 1.4 安装Nginx

```bash
# 安装Nginx
sudo apt install -y nginx

# 启动Nginx服务
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 1.5 安装PM2

```bash
# 全局安装PM2
sudo npm install -g pm2

# 验证安装
pm2 --version
```

#### 1.6 安装Git

```bash
sudo apt install -y git
```

### 2. 创建数据库

```bash
# 登录MySQL
sudo mysql -u root -p

# 在MySQL命令行中执行
CREATE DATABASE cervix_detect_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'cervixuser'@'localhost' IDENTIFIED BY 'your_strong_password_here';
GRANT ALL PRIVILEGES ON cervix_detect_ai.* TO 'cervixuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**安全建议**：使用强密码，包含大小写字母、数字和特殊字符，长度至少16位。

### 3. 克隆项目代码

```bash
# 创建部署目录
sudo mkdir -p /var/www/cervixdetectai
sudo chown -R $USER:$USER /var/www/cervixdetectai

# 克隆代码
cd /var/www
git clone <your-repository-url> cervixdetectai
cd cervixdetectai
```

### 4. 配置环境变量

#### 4.1 前端环境变量

```bash
# 复制模板文件
cp .env.production .env

# 编辑配置
nano .env
```

修改 `.env` 内容（替换为实际域名）：

```env
VITE_API_BASE_URL=https://your-domain.com/api
```

#### 4.2 后端环境变量

```bash
# 复制模板文件
cd server
cp .env.production .env

# 编辑配置
nano .env
```

修改 `server/.env` 内容（填入实际值）：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=cervixuser
DB_PASSWORD=your_strong_password_here
DB_NAME=cervix_detect_ai

# JWT密钥（必须使用强随机字符串）
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-random-string
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars-random-string

# 服务器配置
PORT=3000
NODE_ENV=production

# 阿里云短信配置（可选）
ALIYUN_ACCESS_KEY_ID=your_access_key_id
ALIYUN_ACCESS_KEY_SECRET=your_access_key_secret
ALIYUN_SMS_SIGN_NAME=your_sms_sign_name
ALIYUN_SMS_TEMPLATE_CODE=100001

# CORS允许的域名
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

**生成随机密钥**：

```bash
# 生成JWT密钥
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 5. 初始化数据库

```bash
# 确保在 server 目录
cd /var/www/cervixdetectai/server

# 安装依赖
npm install

# 运行初始化脚本
node scripts/init-database.js
```

脚本会创建以下内容：
- 所有数据表（users, patients, studies等）
- 表关联关系
- 默认管理员账户（admin@cervixdetectai.com / admin123456）

**安全提示**：首次登录后立即修改管理员密码！

### 6. 构建前端

```bash
# 回到项目根目录
cd /var/www/cervixdetectai

# 安装前端依赖
npm install

# 构建生产版本
npm run build
```

构建产物位于 `dist/spa` 目录。

### 7. 配置Nginx

#### 7.1 复制配置文件

```bash
# 复制Nginx配置
sudo cp nginx.conf /etc/nginx/sites-available/cervixdetectai

# 编辑配置文件
sudo nano /etc/nginx/sites-available/cervixdetectai
```

#### 7.2 修改域名

将配置文件中的 `your-domain.com` 替换为实际域名：

```nginx
server_name api.your-domain.com;
```

#### 7.3 启用站点

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/cervixdetectai /etc/nginx/sites-enabled/

# 删除默认站点（可选）
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

### 8. 启动后端服务

#### 8.1 使用PM2启动

```bash
# 确保在项目根目录
cd /var/www/cervixdetectai

# 使用PM2启动
pm2 start ecosystem.config.js

# 查看服务状态
pm2 status
```

#### 8.2 设置开机自启

```bash
# 生成启动脚本
pm2 startup

# 按照提示运行命令（类似下面的命令）
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u your-user --hp /home/your-user

# 保存PM2进程列表
pm2 save
```

#### 8.3 验证服务

```bash
# 查看日志
pm2 logs cervix-detect-api

# 查看详细信息
pm2 info cervix-detect-api

# 实时监控
pm2 monit
```

### 9. 配置SSL证书（推荐）

使用 Let's Encrypt 免费SSL证书：

#### 9.1 安装Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

#### 9.2 获取证书

```bash
# 自动配置SSL
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 按照提示操作
# 1. 输入邮箱
# 2. 同意服务条款
# 3. 选择是否分享邮箱
# 4. 选择 2（重定向HTTP到HTTPS）
```

#### 9.3 测试自动续期

```bash
# 测试证书续期
sudo certbot renew --dry-run

# 证书会自动续期，无需手动操作
```

### 10. 创建必要目录

```bash
# 创建uploads和reports目录
mkdir -p /var/www/cervixdetectai/server/uploads
mkdir -p /var/www/cervixdetectai/server/reports
mkdir -p /var/www/cervixdetectai/logs

# 设置权限
chmod 755 /var/www/cervixdetectai/server/uploads
chmod 755 /var/www/cervixdetectai/server/reports
```

## 配置说明

### Nginx配置详解

```nginx
# 前端静态文件路径
root /var/www/cervixdetectai/dist/spa;

# API代理
location /api/ {
    proxy_pass http://localhost:3000/api/;
    # 设置必要的代理头
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# 文件上传大小限制
client_max_body_size 20M;
```

### PM2配置详解

`ecosystem.config.js` 配置说明：

```javascript
{
  instances: 'max',     // 使用所有CPU核心
  exec_mode: 'cluster', // 集群模式
  max_memory_restart: '1G', // 内存超过1G自动重启
  autorestart: true,    // 自动重启
}
```

## 监控维护

### 查看日志

```bash
# PM2日志
pm2 logs cervix-detect-api           # 实时日志
pm2 logs cervix-detect-api --lines 100  # 最近100行

# Nginx访问日志
sudo tail -f /var/log/nginx/access.log

# Nginx错误日志
sudo tail -f /var/log/nginx/error.log

# MySQL日志
sudo tail -f /var/log/mysql/error.log
```

### PM2常用命令

```bash
pm2 status                  # 查看所有进程状态
pm2 restart cervix-detect-api  # 重启服务
pm2 stop cervix-detect-api     # 停止服务
pm2 delete cervix-detect-api   # 删除服务
pm2 monit                   # 实时监控CPU和内存
pm2 logs --lines 200        # 查看最近200行日志
```

### 数据库备份

创建自动备份脚本 `/usr/local/bin/backup-cervixdb.sh`：

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="cervix_detect_ai"
DB_USER="cervixuser"
DB_PASS="your_password"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
mysqldump -u $DB_USER -p"$DB_PASS" $DB_NAME > $BACKUP_DIR/${DB_NAME}_$DATE.sql

# 压缩备份文件
gzip $BACKUP_DIR/${DB_NAME}_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Database backup completed: ${DB_NAME}_$DATE.sql.gz"
```

设置定时备份：

```bash
# 赋予执行权限
sudo chmod +x /usr/local/bin/backup-cervixdb.sh

# 添加到crontab（每天凌晨2点备份）
sudo crontab -e

# 添加以下行
0 2 * * * /usr/local/bin/backup-cervixdb.sh
```

## 性能优化

### MySQL优化

编辑 `/etc/mysql/mysql.conf.d/mysqld.cnf`：

```ini
[mysqld]
# 连接数
max_connections = 200

# InnoDB缓冲池大小（建议为系统内存的50-70%）
innodb_buffer_pool_size = 2G

# 日志文件大小
innodb_log_file_size = 256M

# 查询缓存
query_cache_size = 64M
query_cache_type = 1
```

重启MySQL：

```bash
sudo systemctl restart mysql
```

### Nginx优化

编辑 `/etc/nginx/nginx.conf`：

```nginx
# 工作进程数（自动检测CPU核心数）
worker_processes auto;

# 每个进程的最大连接数
events {
    worker_connections 1024;
}

http {
    # 启用gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript;
    
    # 文件上传大小限制
    client_max_body_size 20M;
    
    # 长连接超时
    keepalive_timeout 65;
}
```

### PM2集群模式

项目已配置集群模式，会自动使用所有CPU核心，无需额外配置。

## 安全建议

### 1. 防火墙配置

```bash
# 启用UFW防火墙
sudo ufw enable

# 允许SSH
sudo ufw allow 22/tcp

# 允许HTTP和HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 检查状态
sudo ufw status
```

### 2. 数据库安全

- 只允许本地连接（默认配置）
- 使用强密码（至少16位，包含大小写字母、数字、特殊字符）
- 定期备份数据库
- 禁用root远程登录

### 3. 密钥安全

- JWT密钥使用64位以上随机字符串
- 定期更换密钥
- 密钥不要提交到Git仓库

### 4. Nginx安全头

已在配置文件中包含：

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

### 5. 系统更新

```bash
# 定期更新系统
sudo apt update && sudo apt upgrade -y

# 更新Node.js依赖
cd /var/www/cervixdetectai
npm audit fix
```

## 故障排查

### 前端无法访问

**症状**：访问域名显示404或无法访问

**排查步骤**：

```bash
# 1. 检查Nginx状态
sudo systemctl status nginx

# 2. 检查Nginx配置
sudo nginx -t

# 3. 检查前端构建文件
ls -la /var/www/cervixdetectai/dist/spa

# 4. 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log
```

### 后端API报错

**症状**：API请求返回500错误或无响应

**排查步骤**：

```bash
# 1. 检查PM2状态
pm2 status

# 2. 查看后端日志
pm2 logs cervix-detect-api --lines 50

# 3. 重启后端服务
pm2 restart cervix-detect-api

# 4. 检查端口占用
sudo netstat -tlnp | grep 3000
```

### 数据库连接失败

**症状**：后端日志显示数据库连接错误

**排查步骤**：

```bash
# 1. 检查MySQL状态
sudo systemctl status mysql

# 2. 测试数据库连接
mysql -u cervixuser -p cervix_detect_ai

# 3. 检查环境变量
cat server/.env | grep DB_

# 4. 查看MySQL错误日志
sudo tail -f /var/log/mysql/error.log
```

### SSL证书问题

**症状**：HTTPS无法访问或证书过期

**排查步骤**：

```bash
# 1. 检查证书状态
sudo certbot certificates

# 2. 手动续期
sudo certbot renew

# 3. 测试证书配置
sudo nginx -t
```

## 更新部署

使用自动部署脚本：

```bash
# 赋予执行权限
chmod +x deploy.sh

# 运行部署脚本
sudo ./deploy.sh
```

脚本会自动执行：
1. 拉取最新代码
2. 安装依赖
3. 构建前端
4. 重启后端服务
5. 重载Nginx

## 访问地址

部署完成后，通过以下地址访问：

- **前端应用**: `https://your-domain.com`
- **后端API**: `https://your-domain.com/api`
- **默认管理员账户**:
  - 邮箱: `admin@cervixdetectai.com`
  - 密码: `admin123456`（首次登录后请立即修改）

## 技术支持

如遇到部署问题，请检查：

1. 服务器系统版本和软件版本是否符合要求
2. 所有环境变量是否正确配置
3. 数据库是否正常运行
4. 防火墙端口是否正确开放
5. 域名DNS解析是否正确

更多问题请查看项目 [GitHub Issues](https://github.com/xingranya/cervixdetectai/issues)。
