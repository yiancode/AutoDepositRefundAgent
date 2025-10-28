# 环境变量配置指南

## 📋 配置文件说明

| 文件 | 用途 | 是否提交到 Git |
|------|------|----------------|
| `.env` | 实际配置文件 (包含敏感信息) | ❌ 不提交 (已在 .gitignore) |
| `.env.example` | 开发环境配置模板 | ✅ 提交 |
| `.env.production.example` | 生产环境配置模板 | ✅ 提交 |

## 🚀 快速开始

### 本地开发配置

1. **复制配置模板**
   ```bash
   cp .env.example .env
   ```

2. **获取知识星球 API 凭证**
   - 登录知识星球: https://wx.zsxq.com/
   - 打开浏览器 DevTools (F12)
   - 切换到 Network 标签
   - 刷新页面,找到任意 API 请求
   - 复制 Request Headers 中的以下字段:
     - `x-timestamp` → `ZSXQ_X_TIMESTAMP`
     - `authorization` → `ZSXQ_AUTHORIZATION`
     - `x-signature` → `ZSXQ_X_SIGNATURE`

3. **填写 `.env` 文件**
   ```env
   NODE_ENV=development
   ZSXQ_GROUP_ID=你的圈子ID
   ZSXQ_X_TIMESTAMP=从浏览器复制的值
   ZSXQ_AUTHORIZATION=从浏览器复制的值
   ZSXQ_X_SIGNATURE=从浏览器复制的值
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

### 生产环境配置

1. **复制生产配置模板**
   ```bash
   cp .env.production.example .env
   ```

2. **填写所有必需配置**
   ```env
   NODE_ENV=production

   # 知识星球 API (必需)
   ZSXQ_GROUP_ID=你的圈子ID
   ZSXQ_X_TIMESTAMP=从浏览器复制的值
   ZSXQ_AUTHORIZATION=从浏览器复制的值
   ZSXQ_X_SIGNATURE=从浏览器复制的值

   # CORS 白名单 (必需)
   CORS_WHITELIST=https://yourdomain.com,http://yourdomain.com

   # Redis (可选)
   REDIS_HOST=your_redis_host
   REDIS_PORT=6379
   REDIS_PASSWORD=your_redis_password
   ```

3. **启动生产服务器**
   ```bash
   npm start
   # 或使用 PM2
   npm run pm2:start
   ```

## 📝 配置项详解

### 基础配置

| 配置项 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `PORT` | 服务端口 | 3013 | ❌ |
| `NODE_ENV` | 运行环境 | development | ✅ |

**NODE_ENV 说明**:
- `development`: 开发环境,CORS 允许所有来源
- `production`: 生产环境,CORS 只允许白名单域名

### 知识星球 API 配置

| 配置项 | 说明 | 示例 | 必需 |
|--------|------|------|------|
| `ZSXQ_GROUP_ID` | 圈子 ID | 15555411412112 | ✅ |
| `ZSXQ_X_TIMESTAMP` | 请求时间戳 | 1730000000000 | ✅ |
| `ZSXQ_AUTHORIZATION` | 授权令牌 | XXXXXXXX-XXXX-... | ✅ |
| `ZSXQ_X_SIGNATURE` | 请求签名 | xxxxxxxxxx... | ✅ |

**重要提示**:
- 这些凭证会定期过期,过期后需要重新从浏览器获取
- 不要将真实凭证提交到 Git 仓库

### CORS 跨域配置

| 配置项 | 说明 | 示例 | 必需 |
|--------|------|------|------|
| `CORS_WHITELIST` | 允许访问的域名列表 | https://example.com,http://example.com | 生产环境必需 |

**环境差异**:
- **开发环境** (`NODE_ENV=development`):
  - 不需要配置 `CORS_WHITELIST`
  - 自动允许所有来源 (方便本地调试)

- **生产环境** (`NODE_ENV=production`):
  - 必须配置 `CORS_WHITELIST`
  - 只允许白名单中的域名访问
  - 多个域名用逗号分隔,不要有空格

**示例**:
```env
# 生产环境 CORS 配置
CORS_WHITELIST=https://zsxq.dc401.com,http://zsxq.dc401.com

# 如果需要同时支持本地测试
CORS_WHITELIST=http://localhost:5173,https://zsxq.dc401.com
```

### Redis 配置 (可选)

| 配置项 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `REDIS_HOST` | Redis 主机地址 | localhost | ❌ |
| `REDIS_PORT` | Redis 端口 | 6379 | ❌ |
| `REDIS_PASSWORD` | Redis 密码 | - | ❌ |
| `REDIS_DB` | Redis 数据库编号 | 0 | ❌ |
| `CACHE_ENABLED` | 是否启用缓存 | true | ❌ |
| `CACHE_TTL` | 缓存过期时间(秒) | 86400 | ❌ |

**说明**:
- 如果不配置 Redis,系统会跳过缓存功能,直接调用知识星球 API
- 设置 `CACHE_ENABLED=false` 可完全禁用缓存

### API 限流配置 (可选)

| 配置项 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `API_RATE_LIMIT` | 每分钟最大请求数 | 50 (生产) / 100 (开发) | ❌ |
| `API_CONCURRENCY` | 并发请求数 | 5 (生产) / 10 (开发) | ❌ |
| `API_REQUEST_DELAY` | 请求延迟(毫秒) | 200 (生产) / 100 (开发) | ❌ |

## 🔒 安全最佳实践

### 1. 绝不提交敏感信息

```bash
# ❌ 错误: 将 .env 添加到 Git
git add .env

# ✅ 正确: .env 已在 .gitignore 中,不会被提交
git add .env.example
git add .env.production.example
```

### 2. 定期更新凭证

知识星球 API 凭证会定期过期,建议:
- 遇到 401/403 错误时,立即重新获取凭证
- 生产环境定期(每周)更换凭证

### 3. 生产环境 CORS 配置

```env
# ❌ 错误: 生产环境不设置 CORS_WHITELIST
NODE_ENV=production
# 这会导致只允许代码中的默认域名

# ✅ 正确: 明确指定生产域名
NODE_ENV=production
CORS_WHITELIST=https://yourdomain.com
```

### 4. Redis 密码保护

```env
# ❌ 错误: 生产环境 Redis 不设置密码
REDIS_HOST=your_host
REDIS_PORT=6379

# ✅ 正确: 使用强密码
REDIS_HOST=your_host
REDIS_PORT=6379
REDIS_PASSWORD=your_strong_password_here
```

## 🛠️ 故障排查

### 问题 1: CORS 跨域错误

**症状**:
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**解决方案**:
1. 检查 `NODE_ENV` 设置
   - 开发环境: `NODE_ENV=development` (自动允许所有来源)
   - 生产环境: 确保 `CORS_WHITELIST` 包含前端域名

2. 重启服务器
   ```bash
   # nodemon 不会自动检测 .env 变化,需要手动重启
   # 方法 1: 触碰代码文件
   touch src/index.js

   # 方法 2: 重启进程
   npm run dev
   ```

### 问题 2: 知识星球 API 返回 401/403

**症状**:
```
Error: 知识星球 API 返回失败
```

**解决方案**:
1. 重新从浏览器获取凭证
2. 更新 `.env` 文件中的以下字段:
   - `ZSXQ_X_TIMESTAMP`
   - `ZSXQ_AUTHORIZATION`
   - `ZSXQ_X_SIGNATURE`
3. 重启服务器

### 问题 3: Redis 连接失败

**症状**:
```
Redis 连接失败
```

**解决方案**:
1. 检查 Redis 服务是否启动
   ```bash
   redis-cli ping  # 应该返回 PONG
   ```

2. 如果不需要缓存,可以禁用:
   ```env
   CACHE_ENABLED=false
   ```

## 📚 相关文档

- [README.md](../../../README.md) - 项目总览
- [CLAUDE.md](../../../CLAUDE.md) - 项目架构和开发指南
- [知识星球开放平台文档](https://zsxq.com/docs) - API 官方文档