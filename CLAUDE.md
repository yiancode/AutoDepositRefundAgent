# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**知识星球训练营自动押金退款系统** - 实现押金收取、打卡核对、自动退款的完整闭环。

| 版本 | 状态 | 技术栈 | 说明 |
|------|------|--------|------|
| **v1** | 当前开发 | Java 17 + Spring Boot 3.2 + PostgreSQL 15 + Vue 3 | 设计完成，准备开发 |
| **v0** | 已废弃 | Node.js + Express | `zsxq-api/`, `zsxq-web/` 仅供参考 |

### 核心架构

```
H5会员端 + Web管理后台 (Vue 3)
        ↓ HTTPS
Spring Boot (RESTful API + 定时任务 + Webhook)
        ↓
PostgreSQL + Redis + 腾讯云COS
        ↓
企业微信支付 + 知识星球API + 企业微信通知
```

### 数据库设计

19张表，详见 `docs/v1/design/数据库设计.md`:

**核心业务表**:
- `system_user` - 系统用户(管理员/教练/志愿者)
- `training_camp` - 训练营信息
- `camp_member` - 训练营会员关系
- `camp_member_relation` - 会员关联信息
- `planet_user` - 知识星球用户信息
- `wechat_user` - 企业微信用户信息
- `payment_record` - 支付记录
- `checkin_record` - 打卡记录
- `refund_record` - 退款记录

**管理和日志表**:
- `operation_log`, `system_config`, `notification_message`
- `planet_user_import_log`, `sync_log`
- 5张状态日志表: `*_status_log` (记录关键状态变更)

**初始化脚本**: `scripts/init-database.sql`

## 项目状态

| 组件 | 状态 | 说明 |
|------|------|------|
| **数据库** | ✅ 已完成 | 19张表, 初始化脚本 `scripts/init-database.sql` |
| **v1 后端** | ⏳ 待创建 | Java 17 + Spring Boot 3.2 |
| **v1 前端** | ⏳ 待创建 | Vue 3 (H5会员端 + Web管理后台) |
| **v0 代码** | ⚠️ 已废弃 | `zsxq-api/`, `zsxq-web/` 仅供参考学习 |

## 常用命令

### 数据库初始化

```bash
# 创建数据库
createdb camp_db

# 执行初始化脚本 (19张表 + 索引)
psql -U postgres -d camp_db -f scripts/init-database.sql

# 验证表结构
psql -U postgres -d camp_db -c "\dt"
```

### v1 后端 (backend/) - 待创建

```bash
cd backend
./gradlew bootRun                              # 启动 http://localhost:8080
./gradlew test                                 # 运行所有测试
./gradlew test --tests "*.CampServiceTest"    # 运行单个测试类
./gradlew build                                # 构建项目
./gradlew clean build                          # 清理并构建
```

### v1 前端 (frontend/) - 待创建

```bash
# H5会员端
cd frontend/h5-member
npm install
npm run dev         # http://localhost:5173
npm run build       # 生产环境构建
npm run test        # 运行测试

# Web管理后台
cd frontend/admin-web
npm install
npm run dev         # http://localhost:5174
npm run build       # 生产环境构建
npm run test        # 运行测试
```

### v0 后端 (zsxq-api/) - 仅供参考，已废弃

```bash
cd zsxq-api
npm install
npm run dev         # 开发模式 localhost:3013
npm test            # 运行测试 (Jest)
npm run lint        # 代码检查
npm run format      # 代码格式化
npm run pm2:start   # PM2 启动
```

### API 文档

- **v1**: `http://localhost:8080/doc.html` (Knife4j)
- **v0**: `http://localhost:3000/api-docs` (Swagger UI) - 已废弃

## 环境变量

```bash
# 数据库
DATABASE_URL=jdbc:postgresql://localhost:5432/camp_db
DATABASE_USERNAME=camp_user
DATABASE_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# 知识星球 (从浏览器 DevTools 获取)
ZSXQ_GROUP_ID=15555411412112
ZSXQ_X_TIMESTAMP=1730000000000
ZSXQ_AUTHORIZATION=XXXXXXXX-XXXX-...
ZSXQ_X_SIGNATURE=xxxxxxxx...

# 企业微信支付
WECHAT_PAY_MCH_ID=your_mch_id
WECHAT_PAY_API_KEY=your_api_key
```

## 关键文档

> **完整文档索引** → [docs/v1/README.md](docs/v1/README.md)

| 分类 | 核心文档 | 说明 |
|------|----------|------|
| 需求 | `docs/PRD.md` | 产品需求文档 |
| 设计 | `docs/v1/design/技术方案.md` | 系统整体设计（~2300行） |
| 设计 | `docs/v1/design/数据库设计.md` | 16张表 + 索引优化 |
| 设计 | `docs/v1/design/状态枚举定义.md` | **状态枚举唯一定义（SSOT）** |
| 接口 | `docs/v1/api/接口文档.md` | RESTful API 定义 |
| 开发 | `docs/v1/guides/dev-AI辅助敏捷开发计划.md` | Stage 划分 + AI 提示词 |
| 安全 | `docs/v1/security/支付安全增强方案.md` | 签名验证、幂等性、Ticket 机制 |
| 用户故事 | `docs/v1/user-stories/EP0*.md` | 6个 Epic 的用户故事 |

## 代码规范

### 开发前必读

1. **先读后写** - 读相关代码文件，理解现有模式
2. **读文档** - 阅读 `docs/v1/` 下的技术方案、数据库设计
3. **遵循分层** - Controller → Service → Mapper 严格分层
4. **同步测试** - 新功能必须有单元测试
5. **状态枚举** - 所有状态值必须引用 `docs/v1/design/状态枚举定义.md`

### 禁止事项

- Controller 层写业务逻辑
- 使用 System.out.println（用 Slf4j Logger）
- 硬编码常量（提取到枚举或配置）
- 跳过参数校验
- 修改或参考 `zsxq-api/` 和 `zsxq-web/`（v0 已废弃）

### Java 包结构

```
com.yourcompany.camp/
├── controller/     # REST 控制器
├── service/        # 业务逻辑接口
│   └── impl/       # Service 实现
├── mapper/         # MyBatis Mapper
├── entity/         # 实体类
├── dto/            # 数据传输对象
├── vo/             # 视图对象
├── config/         # 配置类
├── exception/      # 异常类
└── util/           # 工具类
```

### 命名规范

- **Entity**: `Camp`, `Member`, `Order`
- **Service**: `CampService` (接口) + `CampServiceImpl` (实现)
- **Controller**: `CampController`
- **Mapper**: `CampMapper`
- **测试**: `*Test.java` (JUnit 5 + Mockito 或 TestNG + Mockito,具体遵循全局配置)

### 代码风格

- **Java**: Google Style, 4空格缩进, Lombok, LocalDateTime
- **Vue**: 2空格, Composition API + `<script setup>`
- **Git**: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`)
- **测试**: JUnit 5 + Mockito

## 自定义指令

项目配置了 Claude Code 指令系统，详见 `.claude/commands/README.md`

| 指令 | 用途 |
|------|------|
| `/task-plan` | 规划新任务 |
| `/progress-save` / `/progress-load` | 保存/加载进度检查点 |
| `/test-backend` / `/test-frontend` | 运行测试 |
| `/bug-add` / `/bug-search` | Bug 经验管理 |
| `/review-file [path]` | 代码审查 |
| `/evaluate-next` | 评估下一个待评估文档并自动提交 |
| `/evaluate-parallel` | 并行评估多个文档（使用子代理） |

### 上下文管理工作流

```
1. 开始新功能 → /task-plan [功能描述]
2. 按计划逐步实现
3. 每完成重要里程碑 → /progress-save
4. 上下文过长 → /progress-save → /clear → /progress-load
5. 功能完成 → 删除进度文件，提交代码
```

## 注意事项

1. **知识星球凭证会过期** - 定期从浏览器 DevTools 更新环境变量
2. **PostgreSQL 15+** - 必须支持 JSONB 类型
3. **v0 vs v1 代码隔离** - 绝不混用，v0 仅供学习参考
4. **状态枚举 SSOT** - 所有状态值必须引用 `docs/v1/design/状态枚举定义.md`，该文档是单一数据源
5. **提交前检查**:
   - v1 Java: `./gradlew test && ./gradlew build`
   - v1 前端: `npm run lint && npm run test`

## v0 代码参考 (已废弃)

虽然 v0 已废弃，但可作为理解业务逻辑的参考:

### v0 后端结构 (zsxq-api/)
```
zsxq-api/
├── src/
│   ├── config/          # 配置 (Redis, Swagger)
│   ├── middlewares/     # 中间件 (错误处理, 限流, 超时, 验证)
│   ├── routes/          # 路由定义 (camps, users)
│   ├── services/        # 业务逻辑 (refund, zsxq, user)
│   └── utils/           # 工具类 (logger, response, sanitize, redis)
├── __tests__/           # 测试 (Jest)
│   ├── unit/            # 单元测试
│   └── integration/     # 集成测试
└── ecosystem.config.js  # PM2 配置
```

**参考价值**:
- `services/zsxq.service.js` - 知识星球 API 调用示例
- `services/refund.service.js` - 退款逻辑示例
- `middlewares/` - 中间件模式可参考
- `utils/logger.js` - 日志配置参考

### v0 前端结构 (zsxq-web/)
```
zsxq-web/
├── src/
│   ├── views/          # 页面组件
│   ├── components/     # 通用组件
│   ├── router/         # 路由配置
│   ├── utils/          # 工具函数
│   └── main.js         # 入口文件
└── vite.config.js      # Vite 配置
```
