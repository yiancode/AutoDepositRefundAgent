# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📸 最后会话快照

**上次工作时间**: 2025-11-03 02:23
**会话快照文档**: [session-20251030-232243.md](docs/sessions/session-20251030-232243.md)

**快速回顾**:
- 当前阶段: v0 版本功能增强中
- 已完成: 退款名单分栏切换功能 (支持合格/不合格名单切换)
- 正在做: v0 版本功能完善和用户体验优化
- 下一步: 测试验证新功能,准备 v1 开发环境

---

## 项目概述

这是一个**知识星球训练营自动押金退款系统**,采用**双版本并行开发**策略:

- **v0 (简化版)**: Node.js + Express.js,无数据库,纯 API 代理,快速验证核心功能 (已完成)
- **v0.1 (增强版)**: ~~取消开发,直接跳到 v1~~
- **v1 (完整版)**: Java + Spring Boot + PostgreSQL,完整的生产级系统 (准备开始)

**当前状态**: v0 功能增强中,持续优化用户体验

**最后更新**: 2025-11-03 02:23
**最后提交**: f5c0b00 - feat(frontend): 新增打卡明细分栏切换功能

## 快速命令参考

### v0 版本 (当前开发重点)

#### 后端 (zsxq-api - Node.js + Express)
```bash
cd zsxq-api

# 开发环境启动 (热重载)
npm run dev              # 启动在 http://localhost:3013

# 生产环境启动
npm start                # 直接运行
npm run pm2:start        # PM2 进程管理启动
npm run pm2:stop         # 停止 PM2 进程
npm run pm2:restart      # 重启 PM2 进程
npm run pm2:logs         # 查看 PM2 日志

# 健康检查
curl http://localhost:3013/health
```

#### 前端 (zsxq-web - Vue 3 + Vite)
```bash
cd zsxq-web

# 开发环境
npm run dev              # 启动在 http://localhost:5173

# 生产构建
npm run build            # 输出到 dist/
npm run preview          # 预览生产构建
```

### v1 版本 (未开始)

#### 后端 (backend/ - Spring Boot)
```bash
cd backend

# 开发环境
mvn spring-boot:run      # 启动在 http://localhost:8080

# 测试
mvn test                 # 运行所有测试
mvn test -Dtest=ClassName  # 运行单个测试类

# 打包
mvn clean package        # 打包为 JAR
java -jar target/*.jar   # 运行 JAR
```

#### 前端 (frontend/)
```bash
# H5 会员端
cd frontend/h5-member
npm run dev              # 启动开发服务器

# Web 管理后台
cd frontend/admin-web
npm run dev              # 启动开发服务器
```

### 数据库操作 (v1)
```bash
# PostgreSQL (v1 版本使用)
psql -U postgres -d camp_db                    # 连接数据库
psql -U postgres -d camp_db -f sql/xxx.sql     # 执行 SQL 脚本
```

## 项目架构

### v0 版本架构 (当前)

**技术栈**: Node.js 18+ + Express.js 4.x + Vue 3 + Vite

**目标**: 快速实现退款名单生成,无数据库,纯内存计算

```
zsxq-api/                      # 后端 API (Express.js)
├── src/
│   ├── index.js               # 入口文件 (端口 3013)
│   ├── routes/
│   │   └── camps.js           # 训练营路由
│   ├── services/
│   │   ├── zsxq.service.js    # 知识星球 API 封装
│   │   └── refund.service.js  # 退款名单计算逻辑
│   ├── middlewares/
│   │   ├── auth.middleware.js    # API Key 鉴权
│   │   └── error.middleware.js   # 统一错误处理
│   ├── utils/
│   │   ├── logger.js          # Winston 日志
│   │   └── response.js        # 统一响应格式
│   └── config/
├── .env                       # 环境变量 (知识星球 Cookie)
├── logs/                      # 日志文件 (3 天保留)
└── ecosystem.config.js        # PM2 配置

zsxq-web/                      # 前端 (Vue 3 + Element Plus)
├── src/
│   ├── main.js                # 入口文件
│   ├── router/index.js        # 路由配置
│   ├── views/
│   │   ├── CampList.vue       # 训练营列表
│   │   └── RefundList.vue     # 退款名单页面
│   ├── api/camps.js           # API 封装
│   └── utils/
│       ├── request.js         # Axios 拦截器
│       └── export.js          # Excel/图片导出
└── vite.config.js             # Vite 配置 (代理 /api → 3013)
```

**关键设计决策**:
- **无数据库**: 所有数据实时从知识星球 API 获取
- **无状态服务**: 每次请求都重新计算,不持久化
- **前后端分离**: Vite 开发环境代理 `/api/*` 到 3013 端口
- **统一响应格式**: `{ code, message, data, timestamp }`

### v1 版本架构 (规划中)

**技术栈**: Java 17 + Spring Boot 3.2+ + PostgreSQL 15+ + Vue 3

**目标**: 生产级系统,支持支付、自动退款、权限管理

**后端分层架构**:
```
Controller (接口路由、参数校验)
    ↓
Service (业务逻辑、事务管理)
    ↓
Manager (第三方 API 封装: 企业微信支付、知识星球)
    ↓
Mapper (数据库访问 - MyBatis Plus)
```

**数据库设计**: 10 张核心表
- `training_camp`: 训练营基本信息
- `camp_member`: 会员与训练营关系 (核心表)
- `planet_user`: 知识星球用户信息
- `payment_record`: 支付流水记录
- `checkin_record`: 打卡记录
- `refund_record`: 退款记录
- `system_user`: 管理员账号
- `operation_log`: 操作审计日志
- `system_config`: 系统配置
- `camp_member_relation`: 训练营与教练/志愿者关系

## 核心业务逻辑

### 知识星球 API 集成 (v0 核心)

**认证方式**: HTTP Headers (Cookie)
```javascript
{
  'x-timestamp': process.env.ZSXQ_X_TIMESTAMP,
  'authorization': process.env.ZSXQ_AUTHORIZATION,
  'x-signature': process.env.ZSXQ_X_SIGNATURE
}
```

**关键接口**:
1. **获取训练营列表**: `GET /v2/groups/{groupId}/checkins`
   - 参数: `scope` (ongoing/over/closed), `count` (最多 100)
2. **获取打卡排行榜**: `GET /v2/groups/{groupId}/checkins/{checkinId}/ranking_list`
   - 参数: `type=accumulated`, `index` (分页索引)
   - **重要**: 需要自动翻页,单个训练营最多 200 人 (2 页)

**错误处理**:
- Cookie 过期 → 返回 403,提示更新配置
- API 异常 → 记录日志,返回 500

### 退款名单计算逻辑 (v0 核心)

**输入**:
- `checkinId`: 训练营 ID
- `requiredDays`: 完成要求天数 (例如 7 天)

**计算流程**:
1. 调用知识星球 API 获取打卡排行榜
2. 应用宽限天数: `实际打卡天数 = API返回天数 + GRACE_DAYS`
3. 遍历所有用户,判断 `实际打卡天数 >= requiredDays`
4. 标记 `is_qualified: true/false`
4. 统计: `total_count`, `qualified_count`, `qualified_rate`

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
    "unqualified_count": 14,
    "qualified_rate": 85.86,
    "qualified_names": "球球的副业探索路、Aaron、向阳..."
  }
}
```

### 智能匹配算法 (v1 专属)

系统通过多维度匹配会员身份 (支付记录 ↔ 知识星球用户):
- **星球ID匹配** → 置信度 100%
- **星球昵称匹配** → 置信度 66%
- **微信昵称匹配** → 置信度 33%
- **匹配失败** → 人工介入

## 环境变量配置

### v0 版本 (.env)

**必需配置**:
```env
# 服务端口
PORT=3013
NODE_ENV=development

# 知识星球 API (从浏览器 DevTools 获取)
ZSXQ_GROUP_ID=15555411412112
ZSXQ_X_TIMESTAMP=1730000000
ZSXQ_AUTHORIZATION=Bearer xxx
ZSXQ_X_SIGNATURE=xxx

# 打卡天数宽限配置 (可选)
GRACE_DAYS=1  # 宽限天数，默认1天
```

**获取知识星球 Cookie**:
1. 浏览器登录知识星球
2. 打开 DevTools → Network
3. 刷新页面,找到 `checkins` 请求
4. 复制 Request Headers 中的 `x-timestamp`, `authorization`, `x-signature`

### v1 版本 (application.yml)

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/camp_db
    username: postgres
    password: your_password

  redis:
    host: localhost
    port: 6379

# 企业微信支付配置
wework:
  mchid: xxx
  apikey: xxx

# 知识星球配置
zsxq:
  groupId: 15555411412112
  cookie: xxx
```

## 开发进度追踪

### 进度检查点系统

使用 JSON 格式记录开发检查点,支持版本追溯:

```bash
# 查看当前进度
cat docs/progress/checkpoints/index.md

# 查看最新检查点详情
cat docs/progress/checkpoints/checkpoint-20251027-072318.json

# 恢复到某个检查点
cd zsxq-api && git checkout 51b5a2f   # 后端
cd zsxq-web && git checkout 6ffb0ab   # 前端
```

**检查点内容**:
- Git 提交哈希
- 代码统计 (行数、文件数)
- 已完成任务
- 待办任务
- 环境配置
- 已知问题和解决方案

### Sprint 规划 (v0 版本)

| Sprint | 时间 | 核心目标 | 状态 | 完成时间 |
|--------|------|---------|------|----------|
| Sprint 0 | Day 0 (4h) | 环境搭建 + 项目骨架 | ✅ 100% | 2025-10-27 |
| Sprint 1 | Day 1 (4h) | 后端 API + 知识星球对接 | ✅ 100% | 2025-10-27 |
| Sprint 2 | Day 2 (8h) | 前端页面 + 数据展示 | ⏳ 待开始 | - |
| Sprint 3 | Day 3 (8h) | 导出功能 + 部署上线 | ⏳ 待开始 | - |

**Sprint 1 已完成任务**:
- ✅ Task 1.1: 实现知识星球 API 服务 (568 行代码)
- ✅ Task 1.2: 实现退款名单计算服务
- ✅ Task 1.3: 实现训练营路由接口（3 个 API）
- ✅ Task 1.4: 接口测试（健康检查通过）
- ✅ 文档编写: README.md + USAGE.md（532 行）

**当前任务** (Sprint 2):
- Task 2.1: 创建 zsxq-web 前端项目
- Task 2.2: 实现训练营列表页面
- Task 2.3: 实现退款名单页面
- Task 2.4: 对接后端 API

## 常见问题和解决方案

### v0 开发问题

**问题 1: Rollup Windows 依赖缺失**
```bash
# 错误: Cannot find module @rollup/rollup-win32-x64-msvc
# 解决方案:
cd zsxq-web
npm install @rollup/rollup-win32-x64-msvc
```

**问题 2: 知识星球 Cookie 过期**
- **症状**: API 返回 401 Unauthorized
- **解决方案**: 重新从浏览器获取 Cookie,更新 `.env` 文件

**问题 3: 前端跨域错误**
- **原因**: Vite 代理配置错误或后端未启动
- **检查**: `vite.config.js` 中 `proxy` 配置是否正确
- **验证**: 后端是否在 3013 端口运行

### v1 开发问题 (未开始)

**问题: PostgreSQL 连接失败**
```bash
# 检查 PostgreSQL 服务是否启动
# Windows: 服务管理器
# Linux: systemctl status postgresql
```

**问题: Redis 连接失败**
```bash
# 检查 Redis 服务是否启动
redis-cli ping   # 应该返回 PONG
```

## API 接口规范

### v0 版本 API

**Base URL**: `http://localhost:3013/api`

**统一响应格式**:
```json
{
  "code": 200,
  "message": "成功",
  "data": { ... },
  "timestamp": 1730000000000
}
```

**接口列表**:

1. **健康检查**
   - `GET /health`
   - 返回: `{ code: 200, message: '服务运行正常' }`

2. **获取训练营列表** (待实现)
   - `GET /api/camps?scope=over&count=100`
   - 参数: `scope` (ongoing/over/closed), `count` (数量)

3. **生成退款名单** (待实现)
   - `POST /api/camps/:checkinId/refund-list`
   - Body: `{ "required_days": 7 }`

### v1 版本 API (规划)

**Base URL**: `http://localhost:8080/api`

**URL 设计**:
- 管理端: `/api/admin/{resource}`
- H5 端: `/api/h5/{resource}`
- Webhook: `/api/webhook/{source}/{event}`

**认证方式**:
- 管理后台: JWT Token (Header: `Authorization: Bearer {token}`)
- H5 端: 游客模式 (查询进度时验证身份)
- Webhook: 签名验证

## 部署说明

### v0 生产部署

**后端部署** (PM2):
```bash
cd zsxq-api

# 安装依赖
npm install --production

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入真实配置

# 启动 PM2
npm run pm2:start

# 验证
curl http://localhost:3013/health
```

**前端部署** (Nginx):
```bash
cd zsxq-web

# 构建生产版本
npm run build

# 部署到 Nginx
cp -r dist/* /var/www/zsxq-web/

# Nginx 配置 (示例)
location /api {
  proxy_pass http://localhost:3013;
}

location / {
  root /var/www/zsxq-web;
  try_files $uri $uri/ /index.html;
}
```

### v1 生产部署 (未开始)

**后端部署** (SystemD):
```bash
# 打包
mvn clean package

# 运行
java -jar target/camp-backend-1.0.0.jar

# 或使用 SystemD 管理
systemctl start camp-backend
```

**数据库初始化**:
```bash
psql -U postgres -c "CREATE DATABASE camp_db;"
psql -U postgres -d camp_db -f sql/init-database.sql
```

## Git 提交规范

遵循 Conventional Commits:
- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档更新
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具配置

**示例**:
```bash
git commit -m "feat(api): 实现知识星球 API 服务

- 新增 ZsxqService.getCamps() 方法
- 实现 ZsxqService.getRankingList() 自动翻页
- 添加 Cookie 验证和错误处理
- 测试覆盖率: 85%"
```

## 重要文档索引

| 文档 | 路径 | 用途 |
|------|------|------|
| **产品需求文档** | `docs/PRD.md` | 完整的功能需求和业务流程 |
| **v0 开发计划** | `docs/v0/6AI敏捷开发计划-v0版本.md` | v0 版本详细任务清单 |
| **v0.1 技术方案** | `docs/v0.1/技术方案.md` | v0.1 企微退款功能完整设计 |
| **v0.1 README** | `docs/v0.1/README.md` | v0.1 版本概述和快速开始 |
| **v1 技术架构** | `docs/v1/技术架构设计.md` | v1 技术选型和架构设计 |
| **v1 数据库设计** | `docs/v1/数据库设计.md` | 10 张表的完整 SQL |
| **进度检查点** | `docs/progress/checkpoints/` | 开发进度快照 |
| **会话快照** | `docs/sessions/` | 上下文迁移快照 |

## 开发环境

- **操作系统**: Windows (win32)
- **Node.js**: 18+
- **PostgreSQL**: 15+ (v1)
- **Redis**: 7+ (v1)
- **Java**: 17+ (v1)
- **Maven**: 3.8+ (v1)

## 重要提醒

1. **敏感信息**: 绝不提交 `.env` 文件到 Git
2. **Cookie 过期**: 知识星球 Cookie 定期过期,需及时更新
3. **日志管理**: Winston 日志保留 3 天,定期清理 `logs/` 目录
4. **版本隔离**: v0 和 v1 是独立项目,不要混用依赖
5. **端口占用**: v0 后端 3013,前端 5173; v1 后端 8080
