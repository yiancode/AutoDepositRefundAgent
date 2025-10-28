#!/bin/bash

# 知识星球退款系统 - 开发环境配置脚本
# 安装开发依赖、运行测试、格式化代码

echo "========================================="
echo "知识星球退款系统 - 开发环境配置"
echo "========================================="
echo ""

# 检查 npm 权限
echo "步骤 0/3: 检查 npm 权限..."
NPM_CACHE_DIR=$(npm config get cache)
if [ ! -w "$NPM_CACHE_DIR" ]; then
  echo "❌ npm 缓存目录没有写入权限"
  echo ""
  echo "请先手动执行以下命令修复权限:"
  echo "  sudo chown -R \$(whoami) ~/.npm"
  echo ""
  echo "修复后重新运行此脚本:"
  echo "  bash setup-dev-env.sh"
  echo ""
  exit 1
fi
echo "✅ npm 权限检查通过"
echo ""

# 1. 安装后端 ESLint + Prettier
echo "步骤 1/3: 安装后端开发依赖 (ESLint + Prettier)..."
cd /Users/stinglong/code/github/AutoDepositRefundAgent/zsxq-api

if npm install --save-dev \
  eslint@^8.57.0 \
  prettier@^3.2.5 \
  eslint-config-prettier@^9.1.0 \
  eslint-plugin-prettier@^5.1.3; then
  echo "✅ 后端依赖安装完成"
else
  echo "❌ 依赖安装失败"
  exit 1
fi
echo ""

# 2. 运行单元测试
echo "步骤 2/3: 运行单元测试..."
if npm run test:unit; then
  echo "✅ 单元测试完成"
else
  echo "⚠️  单元测试失败,请检查代码"
fi
echo ""

# 3. 格式化代码
echo "步骤 3/3: 格式化代码..."
if npm run format; then
  echo "✅ 代码格式化完成"
else
  echo "⚠️  代码格式化失败,请检查配置"
fi
echo ""

echo "========================================="
echo "✅ 开发环境配置完成!"
echo "========================================="
echo ""
echo "可用命令:"
echo "  npm run test:unit      - 运行单元测试"
echo "  npm run lint           - 检查代码风格"
echo "  npm run lint:fix       - 自动修复代码风格"
echo "  npm run format         - 格式化代码"
echo ""
