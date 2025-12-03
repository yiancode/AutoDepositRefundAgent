# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**知识星球训练营自动押金退款系统**

### ⚠️ 重要提示

- **v0 (已废弃)**: ~~Node.js + Express.js + Vue 3~~ - `zsxq-api/`, `zsxq-web/` 目录仅供参考，不再开发
- **v0.2 (已废弃)**: ~~SQLite 存储方案~~ - 设计文档已归档
- **v1 (当前开发版本)**: Java + Spring Boot + PostgreSQL 完整系统 - **所有新开发都在 v1 基础上进行**

### 项目目录结构

```
AutoDepositRefundAgent/
├── zsxq-api/          # [废弃] v0 后端 (Node.js) - 仅供参考
├── zsxq-web/          # [废弃] v0 前端 (Vue 3) - 仅供参考
├── backend/           # [待创建] v1 后端 (Java + Spring Boot)
├── frontend/          # [待创建] v1 前端 (Vue 3)
│   ├── h5-member/     # H5 会员端
│   └── admin-web/     # Web 管理后台
├── docs/              # 项目文档
│   ├── v1/            # ⭐ v1 版本设计文档（当前）
│   └── v0.2/          # [归档] v0.2 版本设计
├── .bmad/             # BMAD 工作流配置
└── .claude/           # Claude Code 自定义指令
```

## v1 架构设计

### 技术栈

**后端**:
- Java 17+
- Spring Boot 3.2+
- MyBatis Plus 3.5+
- PostgreSQL 15+
- Redis 7.x

**前端**:
- Vue 3.3+
- Vite 5.x
- Element Plus 2.4+ (管理后台)
- Vant 4.x (H5 会员端)

### 核心架构

```
┌─────────────────────────────────────────┐
│  H5会员端 (Vue+Vant) + Web管理后台 (Vue+EP) │
└─────────────────────────────────────────┘
              ↓ HTTPS
┌─────────────────────────────────────────┐
│   Spring Boot 应用层                      │
│   RESTful API + 定时任务 + Webhook       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  PostgreSQL + Redis + 腾讯云COS          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  企业微信支付 + 知识星球API + 企业微信通知 │
└─────────────────────────────────────────┘
```

### 数据库设计

16 张表设计，详见 `docs/v1/数据库设计.md`:
- 核心业务表: camps, members, orders, refunds 等
- 状态日志表: 5 张 *_status_log 表记录所有关键变更

## v1 常用命令（待实现）

### 后端 (backend/)

```bash
cd backend

# 开发
./gradlew bootRun              # 启动后端服务 http://localhost:8080
./gradlew test                 # 运行所有测试
./gradlew test --tests "*.CampServiceTest"  # 运行单个测试类

# 构建
./gradlew build                # 构建项目
./gradlew clean build          # 清理后构建

# 数据库
psql -U postgres -d camp_db -f ../sql/init-database.sql  # 初始化数据库
```

### 前端 (frontend/)

```bash
# H5 会员端
cd frontend/h5-member
npm run dev              # 开发服务器
npm run build            # 生产构建
npm run test             # 运行测试

# Web 管理后台
cd frontend/admin-web
npm run dev              # 开发服务器
npm run build            # 生产构建
npm run test             # 运行测试
```

### API 文档

```bash
# 启动后端后访问
open http://localhost:8080/doc.html  # Knife4j 文档
```

## v1 环境配置

### 必需环境变量

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

## 自动化指令

项目配置了完整的 Claude Code 指令系统，详见 `.claude/commands/README.md`。

**核心指令**:

| 指令 | 用途 |
|------|------|
| `/task-plan` | 规划新任务，拆分为可执行步骤 |
| `/progress-save` | 保存开发进度检查点 |
| `/progress-load` | 加载历史进度 |
| `/test-backend` | 运行后端测试 |
| `/test-frontend` | 运行前端测试 |
| `/bug-add` | 记录 Bug 到经验库 |
| `/bug-search` | 搜索已知 Bug 解决方案 |
| `/review-file` | 审查指定文件的代码质量 |

其他指令：`/progress-compare`, `/bug-list`, `/bug-stats`, `/docs-api`, `/deploy-*` 等

## 关键文档

### v1 版本文档（当前开发）

| 文档 | 路径 | 说明 |
|------|------|------|
| 产品需求文档 | `docs/PRD.md` | 完整功能需求 |
| 技术方案 | `docs/v1/技术方案.md` | ⭐ 技术选型和架构设计 |
| 数据库设计 | `docs/v1/数据库设计.md` | ⭐ 16张表完整设计 |
| 接口文档 | `docs/v1/接口文档.md` | API 规范 |
| 开发计划 | `docs/v1/AI辅助敏捷开发计划.md` | 28天分阶段实施计划 |
| FastAuth方案 | `docs/v1/FastAuth接入方案.md` | OAuth 认证集成方案 |

### 归档文档（仅供参考）

| 文档 | 路径 | 说明 |
|------|------|------|
| v0.2 技术方案 | `docs/v0.2/混合方案技术设计.md` | [已废弃] SQLite 方案 |
| 进度检查点 | `docs/progress/checkpoints/` | 开发进度存档 |

## 代码质量约束（v1 版本）

### 实现新功能前必须

1. **先读后写**：先读相关代码文件，理解现有模式和架构
2. **读文档**：详细阅读 `docs/v1/` 下的技术方案、数据库设计、接口文档
3. **读测试**：理解现有测试模式，确保新代码有对应测试
4. **遵循分层**：严格遵守 Controller → Service → Mapper 分层架构
5. **同步测试**：新增功能必须同步编写单元测试和集成测试

### 禁止事项

- ❌ 不要在 Controller 层写业务逻辑，必须调用 Service
- ❌ 不要直接使用 System.out.println，使用 Slf4j Logger
- ❌ 不要硬编码常量，使用配置文件或常量类
- ❌ 不要跳过参数校验，使用 Spring Validation 注解
- ❌ 不要忽略异常处理，使用全局异常处理器
- ❌ 不要修改或参考 `zsxq-api/` 和 `zsxq-web/` 中的代码，这些是已废弃的 v0 版本

### Java 代码规范

- **命名规范**:
  - Entity: `Camp`, `Member`, `Order`
  - Service: `CampService`, `MemberService` (接口) + `CampServiceImpl` (实现)
  - Controller: `CampController`, `MemberController`
  - Mapper: `CampMapper`, `MemberMapper`
- **包结构**:
  ```
  com.yourcompany.camp/
  ├── controller/     # REST 控制器
  ├── service/        # 业务逻辑
  │   └── impl/       # Service 实现
  ├── mapper/         # MyBatis Mapper
  ├── entity/         # 实体类（对应数据库表）
  ├── dto/            # 数据传输对象
  ├── vo/             # 视图对象
  ├── config/         # 配置类
  ├── exception/      # 异常类
  └── util/           # 工具类
  ```
- **测试规范**: 使用 JUnit 5 + Mockito，测试类命名 `*Test.java`

## 上下文管理

### 会话原则

- **单一职责**：一个会话只做一个功能点或修复一个 bug
- **及时保存**：超过 15 轮对话必须 `/progress-save`
- **干净重启**：上下文过长时 `/progress-save` → `/clear` → `/progress-load`

### 推荐工作流

```
1. 开始新功能 → /task-plan [功能描述]
2. 按计划逐步实现，每完成一步验证
3. 每完成重要里程碑 → /progress-save
4. 上下文过长或次日继续 → /clear → /progress-load
5. 功能完成 → 删除进度文件，提交代码
```

### 恢复上下文的指令

```
读一下 docs/progress/checkpoints/ 最新的检查点文件，
然后读一下相关的源代码文件，继续未完成的工作。
```

## 注意事项

1. **v0 代码已废弃**：`zsxq-api/` 和 `zsxq-web/` 仅供参考，所有新开发都在 v1 基础上进行
2. **知识星球凭证会过期**：定期从浏览器 DevTools 更新认证 Headers
3. **端口分配**：后端 8080（v1），前端待定
4. **数据库版本**：PostgreSQL 15+，必须支持 JSONB 类型
5. **提交前检查**：
   - Java: `./gradlew test && ./gradlew build`
   - 前端: `npm run lint && npm run test`
6. **遵循 v1 文档**：实现功能前务必阅读 `docs/v1/` 下的相关文档

## 代码风格

### Java (v1 后端)
- Google Java Style Guide
- 4 空格缩进
- 使用 Lombok 减少样板代码
- 日期时间统一使用 `LocalDateTime`

### Vue (v1 前端)
- 2 空格缩进
- Vue 3 Composition API + `<script setup>`
- 组件命名: PascalCase
- 文件命名: kebab-case

### 通用规范
- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:` 等
- Git 分支命名: `feature/*`, `bugfix/*`, `hotfix/*`

## 技术方案编写准则

技术方案是"需求规格"而非"代码蓝图"，目标是对齐认知。

**核心要求**：
- 代码块不超过 15 行，只展示骨架
- 用文字描述重复模式和标准操作
- 检验标准：删掉代码后，设计意图是否仍清晰？

详细模板见 `docs/技术方案模板/`

---

## 附录：v0 版本参考信息（已废弃）

> ⚠️ **警告**: 以下内容仅供参考，`zsxq-api/` 和 `zsxq-web/` 目录中的代码已废弃，不再开发维护。

### v0 技术栈

- **后端**: Node.js + Express.js
- **前端**: Vue 3 + Element Plus
- **数据存储**: 无数据库，纯 API 代理 + 可选 Redis 缓存

### v0 常用命令（归档）

```bash
# 后端 (zsxq-api)
cd zsxq-api
npm run dev              # 开发 http://localhost:3013
npm test                 # 测试
npm run lint && npm run format  # 代码检查

# 前端 (zsxq-web)
cd zsxq-web
npm run dev              # 开发 http://localhost:5173
npm run build            # 构建
```

### v0 核心设计

**无数据库设计**：所有数据实时从知识星球 API 获取，不持久化。

**分层结构**：
```
routes/          → 路由定义 + 参数校验
services/        → 业务逻辑
middlewares/     → 错误处理、限流、超时
utils/           → 日志、响应格式化、Redis 缓存
```

### v0 知识星球 API 集成

认证需要从浏览器 DevTools 获取三个 Headers：
```env
ZSXQ_X_TIMESTAMP=1730000000000
ZSXQ_AUTHORIZATION=XXXXXXXX-XXXX-...
ZSXQ_X_SIGNATURE=xxxxxxxx...
```

**关键接口**：
- 训练营列表: `GET /v2/groups/{groupId}/checkins`
- 打卡排行榜: `GET /v2/groups/{groupId}/checkins/{checkinId}/ranking_list`

### v0 测试规范

- 单元测试: `*.unit.test.js`
- 集成测试: `*.integration.test.js`
- 覆盖率要求: 分支 50%，其他 80%