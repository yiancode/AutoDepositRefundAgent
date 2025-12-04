# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**知识星球训练营自动押金退款系统** - 实现押金收取、打卡核对、自动退款的完整闭环。

### 当前状态

- **v1 (当前开发版本)**: Java + Spring Boot + PostgreSQL - 设计完成，准备开发
- **v0 (已废弃)**: `zsxq-api/`, `zsxq-web/` 目录仅供参考，不再维护

### 目录结构

```
AutoDepositRefundAgent/
├── backend/           # [待创建] v1 后端 (Java + Spring Boot)
├── frontend/          # [待创建] v1 前端 (Vue 3)
│   ├── h5-member/     # H5 会员端 (Vant)
│   └── admin-web/     # Web 管理后台 (Element Plus)
├── docs/              # 项目文档
│   └── v1/            # ⭐ v1 版本设计文档
├── zsxq-api/          # [废弃] v0 后端
├── zsxq-web/          # [废弃] v0 前端
└── .claude/commands/  # Claude Code 自定义指令
```

## v1 技术架构

### 技术栈

| 层级 | 技术选型 |
|------|----------|
| **后端** | Java 17+ / Spring Boot 3.2+ / MyBatis Plus 3.5+ |
| **数据库** | PostgreSQL 15+ (JSONB) / Redis 7.x |
| **前端** | Vue 3.3+ / Vite 5.x |
| **UI组件** | Element Plus (管理端) / Vant 4.x (H5端) |

### 系统架构

```
H5会员端 + Web管理后台
        ↓ HTTPS
Spring Boot (RESTful API + 定时任务 + Webhook)
        ↓
PostgreSQL + Redis + 腾讯云COS
        ↓
企业微信支付 + 知识星球API + 企业微信通知
```

### 数据库设计

16张表，详见 `docs/v1/数据库设计.md`:
- 核心业务表: `training_camp`, `camp_member`, `payment_record`, `refund_record`
- 状态日志表: 5张 `*_status_log` 表记录关键变更

## 常用命令

### v0 后端 (zsxq-api/) - 已废弃,仅供参考

```bash
cd zsxq-api
npm install                   # 安装依赖
npm run dev                   # 开发模式 (nodemon)
npm start                     # 生产模式
npm test                      # 运行测试 (Jest)
npm run lint                  # 代码检查
npm run format                # 代码格式化
```

**注意**: v0 使用 Node.js + Express + Jest,v1 将改用 Java + Spring Boot

### v1 后端 (backend/) - 待创建

```bash
cd backend
./gradlew bootRun                              # 启动 http://localhost:8080
./gradlew test                                 # 运行所有测试
./gradlew test --tests "*.CampServiceTest"    # 运行单个测试类
./gradlew build                                # 构建项目
```

### v1 前端 (frontend/) - 待创建

```bash
cd frontend/h5-member && npm run dev    # H5会员端 http://localhost:5173
cd frontend/admin-web && npm run dev    # Web管理后台 http://localhost:5174
```

### API 文档

- **v0**: `http://localhost:3000/api-docs` (Swagger UI) - 已废弃
- **v1**: `http://localhost:8080/doc.html` (Knife4j) - 待创建

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

| 文档 | 路径 |
|------|------|
| 产品需求文档 | `docs/PRD.md` |
| 技术方案 | `docs/v1/技术方案.md` |
| 数据库设计 | `docs/v1/数据库设计.md` |
| 接口文档 | `docs/v1/接口文档.md` |
| 开发计划 | `docs/v1/AI辅助敏捷开发计划.md` |

## 代码规范

### 实现前必须

1. **先读后写** - 读相关代码文件，理解现有模式
2. **读文档** - 阅读 `docs/v1/` 下的技术方案、数据库设计
3. **遵循分层** - Controller → Service → Mapper 严格分层
4. **同步测试** - 新功能必须有单元测试

### 禁止事项

- ❌ Controller 层写业务逻辑
- ❌ 使用 System.out.println（用 Slf4j Logger）
- ❌ 硬编码常量
- ❌ 跳过参数校验
- ❌ 修改或参考 `zsxq-api/` 和 `zsxq-web/`

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

- Java: Google Style, 4空格缩进, Lombok, LocalDateTime
- Vue: 2空格, Composition API + `<script setup>`
- Git: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`)

## 自动化指令

项目配置了 Claude Code 指令系统，详见 `.claude/commands/README.md`

**常用指令**:
- `/task-plan` - 规划新任务
- `/progress-save` / `/progress-load` - 保存/加载进度
- `/test-backend` / `/test-frontend` - 运行测试
- `/bug-add` / `/bug-search` - Bug 经验管理
- `/review-file` - 代码审查

## 上下文管理

### 工作流

```
1. 开始新功能 → /task-plan [功能描述]
2. 按计划逐步实现
3. 每完成重要里程碑 → /progress-save
4. 上下文过长 → /progress-save → /clear → /progress-load
5. 功能完成 → 删除进度文件，提交代码
```

### 恢复上下文

```
读一下 docs/progress/checkpoints/ 最新的检查点文件，
然后读相关的源代码文件，继续未完成的工作。
```

## 注意事项

1. **知识星球凭证会过期** - 定期从浏览器 DevTools 更新环境变量
2. **PostgreSQL 15+** - v1 必须支持 JSONB 类型
3. **v0 vs v1 代码隔离** - 绝不混用,v0 仅供学习参考
4. **提交前检查**:
   - v1 Java: `./gradlew test && ./gradlew build`
   - v1 前端: `npm run lint && npm run test`
   - v0 (参考): `cd zsxq-api && npm test`
5. **测试框架** - v1 使用 JUnit 5 + Mockito 或 TestNG + Mockito (遵循全局 ~/.claude/CLAUDE.md 配置)
