#!/bin/bash

#######################################################
# 宝塔部署脚本 - 前端 (zsxq-web)
# 用途: 在宝塔服务器上构建和部署 Vue 3 前端
# 使用方法: bash deploy.sh
#######################################################

set -e  # 遇到错误立即退出

echo "=========================================="
echo "开始部署前端应用..."
echo "=========================================="

# 1. 安装依赖
echo ""
echo "📦 步骤 1/3: 安装 npm 依赖..."
npm install

# 2. 构建生产版本
echo ""
echo "🏗️  步骤 2/3: 构建生产版本..."
npm run build

# 检查构建是否成功
if [ ! -d "dist" ]; then
  echo "❌ 错误: 构建失败,未找到 dist 目录"
  exit 1
fi

echo "✅ 构建成功! 产物位于: dist/"

# 3. 统计构建产物
echo ""
echo "📊 步骤 3/3: 构建产物统计..."
echo "文件数量: $(find dist -type f | wc -l)"
echo "总大小: $(du -sh dist | cut -f1)"

echo ""
echo "=========================================="
echo "✅ 部署完成!"
echo "=========================================="
echo ""
echo "📁 构建产物目录: $(pwd)/dist"
echo ""
echo "📋 Nginx 配置指向:"
echo "  root /www/wwwroot/zsxq.dc401.com/zsxq-web/dist;"
echo ""
echo "🔗 访问地址:"
echo "  https://zsxq.dc401.com"
echo ""
echo "⚠️  注意事项:"
echo "  1. 确保 Nginx 已配置反向代理: /api -> http://127.0.0.1:3013"
echo "  2. 确保后端服务已启动: pm2 list | grep zsxq-api"
echo "  3. 如需重新构建,请删除 dist 目录后再次运行脚本"
echo ""
echo "🎉 部署脚本执行完毕!"
