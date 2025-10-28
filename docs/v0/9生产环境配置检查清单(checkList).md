# 生产环境配置检查清单

> **用途**: 部署到宝塔服务器前的配置检查
> **最后更新**: 2025-10-28

---

## 🔴 紧急修复 - CORS 跨域问题

### 问题症状
- 前端访问后端 API 报错: `CORS 策略不允许该来源`
- 浏览器控制台显示跨域错误

### 解决方案
已在代码中添加生产域名到 CORS 白名单:
```javascript
// zsxq-api/src/index.js
const whitelist = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://zsxq.dc401.com',  // ✅ 生产域名
  'http://zsxq.dc401.com'     // ✅ HTTP 备用
];
```

---

## 📋 必需配置项检查

### 1. 知识星球 API 配置 (必需)

**错误日志**: `知识星球 API 返回失败`

**原因**: Cookie 过期或未配置

**获取方式**:
1. 浏览器登录 https://wx.zsxq.com
2. 打开 DevTools (F12) → Network
3. 刷新页面,找到 `checkins` 请求
4. 复制 Request Headers 中的以下字段:
   - `x-timestamp`
   - `authorization`
   - `x-signature`

**配置到 .env 文件**:
```env
ZSXQ_GROUP_ID=15555411412112
ZSXQ_X_TIMESTAMP=1730000000           # ⚠️ 从浏览器获取
ZSXQ_AUTHORIZATION=Bearer xxxxxxxxxx  # ⚠️ 从浏览器获取
ZSXQ_X_SIGNATURE=xxxxxxxxxx          # ⚠️ 从浏览器获取
```

---

## 🔧 生产环境 .env 配置

在服务器上创建 `/www/wwwroot/zsxq.dc401.com/zsxq-api/.env` 文件:

```bash
cd /www/wwwroot/zsxq.dc401.com/zsxq-api
vi .env
```

**完整配置内容**:
```env
#######################################################
# 基础配置
#######################################################
PORT=3013
NODE_ENV=production

#######################################################
# 知识星球 API 配置 (必需) ⚠️
#######################################################
ZSXQ_GROUP_ID=15555411412112
ZSXQ_X_TIMESTAMP=1730000000
ZSXQ_AUTHORIZATION=Bearer xxxxxxxxxx
ZSXQ_X_SIGNATURE=xxxxxxxxxx

#######################################################
# CORS 跨域配置 (可选)
#######################################################
# 如果不配置,则使用代码中的默认白名单
CORS_WHITELIST=https://zsxq.dc401.com,http://zsxq.dc401.com

#######################################################
# Redis 配置 (可选)
#######################################################
# 如果不配置 Redis,功能仍然可用,只是没有缓存
REDIS_HOST=110.40.131.220
REDIS_PORT=33828
REDIS_PASSWORD=dcyyds
REDIS_DB=0
CACHE_ENABLED=true
CACHE_TTL=86400

#######################################################
# API 限流配置 (可选)
#######################################################
API_RATE_LIMIT=50
API_CONCURRENCY=5
API_REQUEST_DELAY=200
```

---

## ✅ 快速修复步骤

### 步骤 1: 更新代码

```bash
# 本地提交修复代码
cd /Volumes/SSD/ssd-code/github/AutoDepositRefundAgent
git add zsxq-api/src/index.js
git commit -m "fix(backend): 修复生产环境 CORS 跨域问题"
git push origin main
```

### 步骤 2: 更新服务器代码

**方式 1: Git 拉取 (推荐)**
```bash
# SSH 登录服务器
cd /www/wwwroot/zsxq.dc401.com
git pull origin main
```

**方式 2: 手动上传**
- 上传修改后的 `zsxq-api/src/index.js` 文件

### 步骤 3: 配置环境变量

```bash
cd /www/wwwroot/zsxq.dc401.com/zsxq-api

# 创建 .env 文件
vi .env

# 粘贴上面的配置内容
# 按 i 进入编辑模式
# 按 ESC → 输入 :wq → 回车保存
```

**⚠️ 重要提醒**:
- 必须填入真实的知识星球 Cookie (从浏览器获取)
- 如果 Cookie 过期,需要重新获取并更新

### 步骤 4: 重启后端服务

```bash
cd /www/wwwroot/zsxq.dc401.com/zsxq-api

# 方式 1: 使用 PM2 重启
pm2 restart zsxq-api

# 方式 2: 重新部署
bash deploy.sh
```

### 步骤 5: 验证修复

```bash
# 1. 查看服务状态
pm2 list

# 2. 查看日志 (不应该再有 CORS 错误)
pm2 logs zsxq-api --lines 20

# 3. 测试健康检查
curl http://localhost:3013/health

# 4. 浏览器访问
# https://zsxq.dc401.com
```

---

## 🔍 日志检查

### 查看错误日志

```bash
# 实时查看日志
pm2 logs zsxq-api

# 查看错误日志
pm2 logs zsxq-api --err

# 查看最近 50 行日志
pm2 logs zsxq-api --lines 50

# 查看应用日志文件
tail -f /www/wwwroot/zsxq.dc401.com/zsxq-api/logs/app.log
tail -f /www/wwwroot/zsxq.dc401.com/zsxq-api/logs/error.log
```

### 正常日志示例

✅ **成功的日志**:
```
[INFO]: 服务启动成功，端口: 3013
[INFO]: 环境: production
[INFO]: CORS 白名单: https://zsxq.dc401.com,http://zsxq.dc401.com
```

❌ **错误的日志**:
```
[ERROR]: CORS 策略不允许该来源
[ERROR]: 知识星球 API 返回失败
```

---

## 🚨 常见错误和解决方案

### 错误 1: CORS 跨域错误
**症状**: `Error: CORS 策略不允许该来源`

**解决方案**:
1. ✅ 已在代码中添加生产域名
2. 重启后端服务: `pm2 restart zsxq-api`
3. 清除浏览器缓存,刷新前端页面

### 错误 2: 知识星球 API 返回失败
**症状**: `Error: 知识星球 API 返回失败`

**解决方案**:
1. 检查 .env 文件是否存在: `ls -la /www/wwwroot/zsxq.dc401.com/zsxq-api/.env`
2. 检查 Cookie 配置: `cat .env | grep ZSXQ`
3. 重新从浏览器获取最新 Cookie
4. 更新 .env 文件
5. 重启服务: `pm2 restart zsxq-api`

### 错误 3: 端口被占用
**症状**: `Error: listen EADDRINUSE: address already in use :::3013`

**解决方案**:
```bash
# 查找占用端口的进程
lsof -ti:3013

# 杀死进程
lsof -ti:3013 | xargs kill -9

# 重新启动
pm2 restart zsxq-api
```

### 错误 4: 依赖包缺失
**症状**: `Error: Cannot find module 'ioredis'`

**解决方案**:
```bash
cd /www/wwwroot/zsxq.dc401.com/zsxq-api
npm install
pm2 restart zsxq-api
```

---

## 📞 紧急联系方式

### 快速诊断命令

```bash
# 一键诊断脚本
cd /www/wwwroot/zsxq.dc401.com/zsxq-api

echo "========== 服务状态 =========="
pm2 list | grep zsxq-api

echo ""
echo "========== 端口监听 =========="
netstat -tlnp | grep 3013

echo ""
echo "========== 环境变量检查 =========="
if [ -f .env ]; then
  echo "✅ .env 文件存在"
  cat .env | grep -v "PASSWORD\|AUTHORIZATION\|SIGNATURE"
else
  echo "❌ .env 文件不存在!"
fi

echo ""
echo "========== 最近 10 条日志 =========="
pm2 logs zsxq-api --lines 10 --nostream

echo ""
echo "========== 健康检查 =========="
curl -s http://localhost:3013/health | jq .
```

---

## ✅ 配置完成检查清单

部署完成后,确认以下所有项目:

- [ ] `.env` 文件已创建并配置正确
- [ ] 知识星球 Cookie 已更新 (从浏览器获取)
- [ ] 后端服务已启动 (`pm2 list` 显示 `online`)
- [ ] 健康检查通过 (`curl http://localhost:3013/health`)
- [ ] 前端可以访问 (`https://zsxq.dc401.com`)
- [ ] CORS 错误已消失 (浏览器控制台无错误)
- [ ] 训练营列表可以加载
- [ ] 退款名单可以生成
- [ ] 导出功能正常工作

---

**配置完成后,问题应该解决!** 🎉

如仍有问题,请提供:
1. PM2 日志: `pm2 logs zsxq-api --lines 50 --nostream`
2. 环境变量: `cat .env | grep -v "PASSWORD\|AUTHORIZATION\|SIGNATURE"`
3. 服务状态: `pm2 list`
