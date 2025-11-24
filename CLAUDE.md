# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**知识星球训练营自动押金退款系统** - 采用双版本并行开发策略:

- **v0 (已完成)**: Node.js + Express.js,无数据库,纯 API 代理,快速验证核心功能
- **v1 (设计中)**: Java + Spring Boot + PostgreSQL,完整的生产级系统

**当前状态**: v0 版本已完成基础功能,v1 版本前端设计完成,正在进行技术方案设计

**关键特性**:
- v0 无数据库、无状态服务 - 所有数据实时从知识星球 API 获取
- 实时计算退款名单,不持久化数据
- 前后端分离架构

## 快速开始

### v0 后端 (zsxq-api - Node.js + Express)

```bash
cd zsxq-api

# 开发环境 (热重载)
npm run dev              # 启动在 http://localhost:3013

# 测试
npm test                 # 运行所有测试
npm run test:watch       # 监听模式
npm run test:unit        # 单元测试
npm run test:integration # 集成测试

# 代码质量
npm run lint             # ESLint 检查
npm run lint:fix         # 自动修复
npm run format           # Prettier 格式化

# 生产环境
npm start                # 直接运行
npm run pm2:start        # PM2 启动
npm run pm2:stop         # PM2 停止
npm run pm2:restart      # PM2 重启
npm run pm2:logs         # PM2 日志

# 健康检查
curl http://localhost:3013/health

# API 文档
open http://localhost:3013/api-docs
```

### v0 前端 (zsxq-web - Vue 3 + Vite)

```bash
cd zsxq-web

npm run dev              # 开发环境 (http://localhost:5173)
npm run build            # 生产构建
npm run preview          # 预览生产构建
```

### v1 版本 (未开始)

```bash
# 后端 (Spring Boot)
cd backend
mvn spring-boot:run      # 启动 (http://localhost:8080)
mvn test                 # 运行测试
mvn test -Dtest=ClassName  # 运行单个测试类
mvn clean package        # 打包 JAR

# 前端
cd frontend/h5-member    # H5 会员端
cd frontend/admin-web    # Web 管理后台
npm run dev

# 数据库
psql -U postgres -d camp_db
psql -U postgres -d camp_db -f sql/xxx.sql
```

## 项目架构

### v0 版本 (当前)

**技术栈**: Node.js 18+ + Express.js 4.x + Vue 3 + Vite

**核心设计**:
- 无数据库 - 实时从知识星球 API 获取数据
- 无状态服务 - 每次请求重新计算
- 前后端分离 - Vite 代理 `/api/*` → 3013 端口
- 统一响应格式: `{ code, message, data, timestamp }`

**目录结构**:
```
zsxq-api/
├── src/
│   ├── index.js                  # 入口文件 (端口 3013)
│   ├── routes/                   # 路由层
│   │   ├── camps.js              # 训练营路由
│   │   └── users.js              # 用户路由
│   ├── services/                 # 业务逻辑层
│   │   ├── zsxq.service.js       # 知识星球 API 封装
│   │   ├── refund.service.js     # 退款名单计算
│   │   └── user.service.js       # 用户信息缓存
│   ├── middlewares/              # 中间件
│   │   ├── error.middleware.js   # 错误处理
│   │   ├── rate-limit.middleware.js  # 限流
│   │   ├── timeout.middleware.js     # 超时控制
│   │   └── validation.middleware.js  # 参数校验
│   ├── utils/                    # 工具函数
│   │   ├── logger.js             # Winston 日志
│   │   ├── response.js           # 响应格式化
│   │   ├── redis.js              # Redis 工具
│   │   └── sanitize.js           # 数据清洗
│   └── config/                   # 配置文件
│       ├── swagger.js            # API 文档配置
│       ├── redis.config.js       # Redis 配置
│       └── constants.js          # 常量定义
├── .env                          # 环境变量 (知识星球凭证)
├── ecosystem.config.js           # PM2 配置
└── logs/                         # 日志目录

zsxq-web/
├── src/
│   ├── main.js
│   ├── router/index.js
│   ├── views/
│   ├── api/camps.js              # API 封装
│   └── utils/
│       ├── request.js            # Axios 拦截器
│       └── export.js             # 导出功能
└── vite.config.js                # Vite 配置
```

### v1 版本 (规划)

**技术栈**: Java 17 + Spring Boot 3.2+ + PostgreSQL 15+ + Vue 3

**分层架构**:
```
Controller → Service → Manager → Mapper
(路由)     (业务)    (API封装)  (数据访问)
```

**数据库**: 10 张核心表 (详见 `docs/v1/数据库设计.md`)

## 核心业务逻辑

### 知识星球 API 集成

**认证方式**: HTTP Headers (从浏览器获取)
```javascript
headers: {
  'x-timestamp': process.env.ZSXQ_X_TIMESTAMP,
  'authorization': process.env.ZSXQ_AUTHORIZATION,
  'x-signature': process.env.ZSXQ_X_SIGNATURE
}
```

**关键接口**:
1. **获取训练营列表**: `GET /v2/groups/{groupId}/checkins`
2. **获取打卡排行榜**: `GET /v2/groups/{groupId}/checkins/{checkinId}/ranking_list`
   - **重要**: 需自动翻页,单个训练营最多 200 人 (每页 100 人)

**错误处理**:
- Cookie 过期 → 403,提示更新 `.env`
- API 异常 → 记录日志,返回 500

### 退款名单计算逻辑

**输入**: `checkinId`, `requiredDays`

**计算流程**:
1. 调用知识星球 API 获取打卡排行榜
2. 应用宽限天数: `实际打卡天数 = API返回天数 + GRACE_DAYS`
3. 判断资格: `实际打卡天数 >= requiredDays`
4. 返回名单 + 统计数据

**输出格式**:
```json
{
  "refund_list": [
    {
      "planet_user_id": 88455815452182,
      "planet_nickname": "球球的副业探索路",
      "checkined_days": 10,
      "required_days": 7,
      "is_qualified": true
    }
  ],
  "statistics": {
    "total_count": 99,
    "qualified_count": 85,
    "qualified_rate": 85.86
  }
}
```

## 环境配置

### v0 环境变量 (.env)

**必需配置**:
```env
# 基础配置
PORT=3013
NODE_ENV=development

# 知识星球 API (从浏览器 DevTools → Network → Request Headers 复制)
ZSXQ_GROUP_ID=15555411412112
ZSXQ_X_TIMESTAMP=1730000000000
ZSXQ_AUTHORIZATION=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
ZSXQ_X_SIGNATURE=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 打卡天数宽限 (可选,默认1天)
GRACE_DAYS=1
```

**可选配置 (Redis 缓存)**:
```env
# Redis 配置 - 如不配置则跳过缓存功能
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password  # 可选
REDIS_DB=0                    # 默认 0
CACHE_ENABLED=true            # 启用/禁用缓存
CACHE_TTL=86400               # 缓存过期时间(秒)
```

**获取知识星球凭证**:
1. 浏览器登录 https://wx.zsxq.com/
2. 打开 DevTools → Network
3. 刷新页面,找到任意 API 请求
4. 复制 Request Headers 中的 `x-timestamp`, `authorization`, `x-signature`

### v1 配置 (application.yml)

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/camp_db
    username: postgres
    password: your_password
  redis:
    host: localhost
    port: 6379

wework:
  mchid: xxx
  apikey: xxx

zsxq:
  groupId: 15555411412112
  cookie: xxx
```

## API 接口

### v0 API

**Base URL**: `http://localhost:3013/api`

**响应格式**:
```json
{
  "code": 200,
  "message": "成功",
  "data": {...},
  "timestamp": 1730000000000
}
```

**核心接口**:
1. `GET /health` - 健康检查
2. `GET /api/camps?scope=over&count=100` - 训练营列表
3. `POST /api/camps/:checkinId/refund-list` - 生成退款名单
4. `GET /api/users/:userId/info` - 用户信息 (带缓存)

### v1 API (规划)

**Base URL**: `http://localhost:8080/api`

**URL 规范**:
- 管理端: `/api/admin/{resource}`
- H5 端: `/api/h5/{resource}`
- Webhook: `/api/webhook/{source}/{event}`

**认证**: JWT Token (`Authorization: Bearer {token}`)

## 部署

### v0 生产部署

**后端** (PM2):
```bash
cd zsxq-api
npm install --production
cp .env.example .env  # 编辑填入真实配置
npm run pm2:start
curl http://localhost:3013/health  # 验证
```

**前端** (Nginx):
```bash
cd zsxq-web
npm run build
cp -r dist/* /var/www/zsxq-web/
```

**Nginx 配置**:
```nginx
location /api {
  proxy_pass http://localhost:3013;
}

location / {
  root /var/www/zsxq-web;
  try_files $uri $uri/ /index.html;
}
```

### v1 部署 (未开始)

```bash
# 后端
mvn clean package
java -jar target/camp-backend-1.0.0.jar

# 数据库初始化
psql -U postgres -c "CREATE DATABASE camp_db;"
psql -U postgres -d camp_db -f sql/init-database.sql
```

## 常见问题

### v0 开发问题

**1. 知识星球 Cookie 过期**
- 症状: API 返回 401 Unauthorized
- 解决: 重新从浏览器获取凭证,更新 `.env` 文件

**2. 前端跨域错误**
- 检查: 后端是否在 3013 端口运行
- 检查: `vite.config.js` 中 proxy 配置

**3. Redis 连接失败**
- 可选依赖,不影响核心功能
- 禁用缓存: 设置 `CACHE_ENABLED=false` 或不配置 Redis 相关环境变量

**4. PM2 日志查看**
```bash
npm run pm2:logs          # 实时日志
cat logs/pm2-error.log    # 错误日志
cat logs/pm2-out.log      # 输出日志
cat logs/combined.log     # Winston 综合日志
```

### v1 开发问题

```bash
# PostgreSQL 检查
systemctl status postgresql  # Linux
# Windows: 服务管理器

# Redis 检查
redis-cli ping  # 应返回 PONG
```

## Git 提交规范

遵循 Conventional Commits:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具配置

**示例**:
```bash
git commit -m "feat(api): 实现知识星球 API 服务

- 新增 ZsxqService.getCamps() 方法
- 实现自动翻页功能
- 添加错误处理"
```

## 重要文档

| 文档 | 路径 | 用途 |
|------|------|------|
| **产品需求** | `docs/PRD.md` | 完整功能需求 |
| **v0 开发计划** | `docs/v0/6AI敏捷开发计划-v0版本.md` | v0 任务清单 |
| **v0.1 方案** | `docs/v0.1/技术方案.md` | 企微退款设计 |
| **v1 架构** | `docs/v1/技术架构设计.md` | v1 技术选型 |
| **v1 数据库** | `docs/v1/数据库设计.md` | 表结构设计 |
| **进度快照** | `docs/progress/checkpoints/` | 开发检查点 |
| **会话快照** | `docs/sessions/session-20251030-232243.md` | 上下文迁移 |

## 开发环境

- **操作系统**: macOS (darwin)
- **Node.js**: 18+
- **PostgreSQL**: 15+ (v1)
- **Redis**: 7+ (v0 可选, v1 必需)
- **Java**: 17+ (v1)
- **Maven**: 3.8+ (v1)

## 重要提醒

1. **敏感信息**: 绝不提交 `.env` 到 Git
2. **Cookie 过期**: 知识星球凭证定期过期,需及时更新
3. **日志管理**: Winston 日志保留 3 天,定期清理 `logs/`
4. **版本隔离**: v0 和 v1 独立开发,不要混用依赖
5. **端口占用**: v0 后端 3013,前端 5173; v1 后端 8080
6. **Redis 可选**: v0 版本 Redis 是可选依赖,不配置不影响核心功能