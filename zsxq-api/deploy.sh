#!/bin/bash

#######################################################
# 宝塔部署脚本 - 后端 (zsxq-api)
# 用途: 在宝塔服务器上部署 Node.js 后端服务
# 使用方法: bash deploy.sh
#######################################################

set -e  # 遇到错误立即退出

echo "=========================================="
echo "开始部署后端服务..."
echo "=========================================="

# 1. 安装依赖
echo ""
echo "📦 步骤 1/4: 安装 npm 依赖..."
npm install --production

# 2. 检查环境变量
echo ""
echo "🔍 步骤 2/4: 检查环境变量配置..."
if [ ! -f .env ]; then
  echo "❌ 错误: 未找到 .env 文件"
  echo "请复制 .env.example 并配置知识星球 Cookie:"
  echo "  cp .env.example .env"
  echo "  vi .env"
  exit 1
fi

# 检查必需的环境变量
if ! grep -q "ZSXQ_X_TIMESTAMP" .env || ! grep -q "ZSXQ_AUTHORIZATION" .env; then
  echo "❌ 错误: .env 文件缺少必需配置"
  echo "请确保包含以下配置项:"
  echo "  - ZSXQ_X_TIMESTAMP"
  echo "  - ZSXQ_AUTHORIZATION"
  echo "  - ZSXQ_X_SIGNATURE"
  exit 1
fi

echo "✅ 环境变量检查通过"

# 3. 停止旧服务 (如果存在)
echo ""
echo "🛑 步骤 3/4: 停止旧服务..."
if pm2 list | grep -q "zsxq-api"; then
  pm2 stop zsxq-api
  pm2 delete zsxq-api
  echo "✅ 已停止旧服务"
else
  echo "ℹ️  未发现运行中的服务"
fi

# 4. 启动新服务
echo ""
echo "🚀 步骤 4/4: 启动新服务..."
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "=========================================="
echo "✅ 部署完成!"
echo "=========================================="
echo ""
echo "📊 服务状态:"
pm2 list

echo ""
echo "📋 查看日志:"
echo "  实时日志: pm2 logs zsxq-api"
echo "  错误日志: pm2 logs zsxq-api --err"
echo ""

echo "🔗 健康检查:"
echo "  curl http://localhost:3013/health"
echo ""

# 等待服务启动
sleep 2

# 健康检查
echo "🏥 执行健康检查..."
if curl -s http://localhost:3013/health | grep -q "服务运行正常"; then
  echo "✅ 健康检查通过 - 服务运行正常"
else
  echo "⚠️  警告: 健康检查失败,请检查日志"
  echo "  pm2 logs zsxq-api --lines 50"
fi

echo ""
echo "🎉 部署脚本执行完毕!"
