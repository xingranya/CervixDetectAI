# Docker 容器化部署指南

本文档详细说明了如何将 CervixDetectAI 项目（前端+后端）打包为单一 Docker 容器进行部署，以及如何与现有服务共存并最终切换。

## 1. 部署架构原理

- **模式**：后端托管前端 (All-in-One Container)
  - 容器内部运行 Node.js 服务 (端口 4000)。
  - Node.js 既提供 API 接口，也托管构建好的前端静态文件 (SPA)。
- **外部访问**：
  - 用户通过 Nginx (443) -> Docker 容器映射端口 (8080)。
- **数据持久化**：
  - 上传文件 (`uploads`) 和 报告 (`reports`) 目录挂载到宿主机，防止容器重启数据丢失。
  - 数据库直接连接宿主机的 MySQL。

## 2. 核心文件说明

项目根目录已自动生成以下适配文件：

- `Dockerfile`: 定义了构建流程（先构建前端，再复制到后端镜像中）。
- `.dockerignore`: 排除 `node_modules` 等不需要打包的大文件。
- `server/index.js`: 已修改逻辑，当检测到 `dist/spa` 存在时自动开启静态托管。

## 3. 部署步骤

### 第一步：构建镜像

在项目根目录（`E:\HTML+CSS\CervixDetectAI` 或服务器对应目录）执行：

```bash
docker build -t cervix-app:v1 .
```

### 第二步：启动容器

使用以下命令启动容器。我们通过环境变量覆盖了开发配置，适配生产环境。

**注意**：请根据实际情况修改数据库密码或其他敏感信息。

```bash
docker run -d \
  --name cervix-container \
  -p 8080:4000 \
  --add-host=host.docker.internal:host-gateway \
  -e DB_HOST=host.docker.internal \
  -e DB_USER=root \
  -e DB_PASSWORD=xingran8 \
  -e EPAY_NOTIFY_URL=https://hpvsc.icu/api/payment/notify \
  -e EPAY_RETURN_URL=https://hpvsc.icu/api/payment/return \
  -e FRONTEND_RESULT_URL=https://hpvsc.icu/#/payment/result \
  -v $(pwd)/server/uploads:/app/server/uploads \
  -v $(pwd)/server/reports:/app/server/reports \
  --restart always \
  cervix-app:v1
```

**关键参数详解：**
- `-p 8080:4000`: 将容器的 4000 端口映射到宿主机的 8080 端口。
- `--add-host=host.docker.internal:host-gateway`: **关键**，允许容器内部通过 `host.docker.internal` 访问宿主机 IP（解决连接宿主机 MySQL 问题）。
- `-e DB_HOST=host.docker.internal`: 覆盖 `.env` 中的 `localhost`，强制连接宿主机数据库。
- `-e EPAY_...`: **修正支付回调地址**。将本地开发地址 (`localhost:4000`) 修正为线上域名 (`https://hpvsc.icu`)，确保支付回调能被易支付服务器访问到。
- `-v ...`: 挂载目录，确保上传的图片和生成的 PDF 报告保存在宿主机，容器删除后数据不丢失。

### 第三步：验证服务

此时旧服务（9001/4000）依然在运行。你可以通过新端口测试 Docker 服务：

1. 访问 `http://<服务器IP>:8080`，确认前端页面能打开。
2. 尝试登录，确认能连接数据库。
3. 访问 `http://<服务器IP>:8080/api/health`，应返回 `{"status":"ok"}`。

### 第四步：切换 Nginx 流量（正式上线）

测试无误后，修改 Nginx 配置文件（通常位于 `/www/server/panel/vhost/nginx/hpvsc.icu.conf`），将流量指向 Docker 容器。

```nginx
server {
    listen 443 ssl;
    server_name hpvsc.icu;
    # ... SSL 证书配置保持不变 ...

    # === 修改 location / 部分 ===
    location / {
        proxy_pass http://127.0.0.1:8080;  # 转发到 Docker 映射的端口

        # 必须的代理头信息
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

修改完成后，重载 Nginx：
```bash
nginx -s reload
```

现在，访问 `https://hpvsc.icu` 就已经是运行在 Docker 容器中的新版服务了。

## 4. 常用运维命令

- **查看日志**：
  ```bash
  docker logs -f cervix-container
  ```
- **停止容器**：
  ```bash
  docker stop cervix-container
  ```
- **删除容器**（不会删除挂载的数据）：
  ```bash
  docker rm cervix-container
  ```
- **更新版本**：
  1. `git pull` 拉取新代码
  2. `docker build -t cervix-app:v2 .` 构建新镜像
  3. `docker stop cervix-container` && `docker rm cervix-container`
  4. 使用相同的 `docker run` 命令启动新容器（修改镜像名为 `cervix-app:v2`）

## 5. 故障排查

- **数据库连接失败**：
  检查容器日志。如果提示 `ECONNREFUSED`，确认 `--add-host` 参数是否添加，且 MySQL 用户允许从非 localhost 连接（通常 root 用户默认只允许 localhost，可能需要创建一个允许 `%` 或指定 IP 的数据库用户）。
- **文件上传 403/500**：
  检查宿主机的 `server/uploads` 目录权限，确保 Docker 容器内的用户有写入权限。
