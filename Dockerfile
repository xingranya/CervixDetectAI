# ==============================
# 阶段 1: 构建前端 (Builder)
# ==============================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# 复制前端依赖配置
COPY package*.json ./

# 安装前端依赖
RUN npm install

# 复制前端源码
COPY . .

# 构建 Quasar 应用 (产物在 dist/spa)
RUN npm run build

# ==============================
# 阶段 2: 设置运行环境 (Runner)
# ==============================
FROM node:20-alpine

WORKDIR /app

# 安装必要的系统库 (如果使用了 Canvas/Sharp 需要)
# RUN apk add --no-cache python3 make g++

# 1. 准备后端
WORKDIR /app/server
COPY server/package*.json ./

# 安装后端依赖 (仅生产依赖)
RUN npm install --production

# 复制后端源码
COPY server/ .

# 2. 从阶段 1 复制构建好的前端文件到对应位置
# 将 dist/spa 复制到 /app/dist/spa，保持与 server 相对路径一致
WORKDIR /app
COPY --from=frontend-builder /app/dist ./dist

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=4000

# 数据库默认配置 (MySQL)
# 在 docker-compose 或运行命令中覆盖这些值
ENV DB_HOST=host.docker.internal
ENV DB_PORT=3306
ENV DB_NAME=cervix_detect_ai
ENV DB_USER=root
ENV DB_PASSWORD=xingran8

# 创建必要的目录
RUN mkdir -p /app/server/uploads /app/server/reports

# 暴露端口
EXPOSE 4000

# 启动命令
WORKDIR /app/server
CMD ["node", "index.js"]
