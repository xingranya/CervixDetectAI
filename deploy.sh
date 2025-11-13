#!/bin/bash
# 自动部署脚本

echo "🚀 开始部署 CervixDetectAI..."

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
DEPLOY_DIR="/var/www/cervixdetectai"
BRANCH="main"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ 请使用 sudo 运行此脚本${NC}"
    exit 1
fi

# 1. 拉取最新代码
echo -e "${YELLOW}📥 拉取最新代码...${NC}"
cd $DEPLOY_DIR || exit
git pull origin $BRANCH

# 2. 安装前端依赖
echo -e "${YELLOW}📦 安装前端依赖...${NC}"
npm install

# 3. 构建前端
echo -e "${YELLOW}🔨 构建前端...${NC}"
npm run build

# 4. 安装后端依赖
echo -e "${YELLOW}📦 安装后端依赖...${NC}"
cd server
npm install

# 5. 数据库迁移（如果需要）
echo -e "${YELLOW}💾 检查数据库...${NC}"
# node scripts/migrate.js

# 6. 重启PM2服务
echo -e "${YELLOW}🔄 重启后端服务...${NC}"
cd ..
pm2 restart ecosystem.config.js

# 7. 重载Nginx
echo -e "${YELLOW}🔄 重载Nginx...${NC}"
nginx -t && nginx -s reload

echo -e "${GREEN}✅ 部署完成！${NC}"
echo -e "${GREEN}前端: http://your-domain.com${NC}"
echo -e "${GREEN}后端API: http://your-domain.com/api${NC}"

# 显示服务状态
pm2 status
