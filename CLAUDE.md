# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 快速参考

### 当前状态
- 📍 **阶段**：阶段零（环境搭建）准备阶段
- 📁 **位置**：D:\code\webwork\AutoDepositRefundAgent
- 💻 **环境**：Windows (win32)
- 📝 **文档**：完整的 PRD、架构设计、数据库设计已就绪

### 常用命令（阶段零完成后可用）

#### 后端开发
```bash
cd backend
mvn spring-boot:run              # 启动后端服务
mvn test                         # 运行所有测试
mvn test -Dtest=ClassName        # 运行单个测试类
mvn clean package                # 打包为 JAR
```

#### 前端开发
```bash
# H5 会员端
cd frontend/h5-member
npm run dev                      # 启动开发服务器
npm run build                    # 生产构建
npm run lint                     # 代码检查

# Web 管理后台
cd frontend/admin-web
npm run dev                      # 启动开发服务器
npm run build                    # 生产构建
npm run lint                     # 代码检查
```

#### 数据库操作
```bash
psql -U postgres -d camp_db                    # 连接数据库
psql -U postgres -d camp_db -f sql/xxx.sql     # 执行 SQL 脚本
```

### 触发阶段零任务
当用户说以下指令时，开始执行阶段零任务：
- "开始阶段零"
- "开始环境搭建"
- "创建项目骨架"
- "初始化项目"

### 🎯 Claude Code 专用指令

本项目配置了一套完整的自动化指令系统，帮助 AI 更高效地管理项目开发。

#### 📍 核心指令

| 指令 | 说明 | 使用场景 |
|------|------|----------|
| `/context-transfer` | 上下文迁移 | Token 即将耗尽时保存会话状态 |
| `/commit` | 智能提交 | 自动分析变更、生成提交信息、更新文档 |
| `/progress` | 查看进度 | 显示项目整体进度和统计 |
| `/progress-save` | 保存检查点 | 保存当前开发进度快照 |
| `/bug-add` | 记录 Bug | 添加 Bug 到经验库，避免重复踩坑 |
| `/bug-search` | 搜索 Bug | 根据关键词搜索已知问题 |
| `/review` | 代码审查 | 自动检查代码质量和规范 |
| `/test` | 运行测试 | 运行测试并生成覆盖率报告 |
| `/refactor` | 代码重构 | 交互式代码重构 |
| `/docs-api` | 生成文档 | 自动生成 API 文档 |
| `/deploy-dev` | 部署开发环境 | 自动化部署到开发环境 |

#### 📝 所有可用指令

**上下文管理**:
- `/context-transfer` - 保存会话快照

**进度管理**:
- `/progress` - 查看整体进度
- `/progress-save [描述]` - 保存进度检查点
- `/progress-load [ID]` - 加载历史检查点
- `/progress-compare` - 对比进度变化

**Git 提交**:
- `/commit` - 智能提交

**Bug 管理**:
- `/bug-add` - 记录 Bug
- `/bug-search <关键词>` - 搜索 Bug
- `/bug-list [分类]` - 列出 Bug 清单
- `/bug-stats` - Bug 统计分析

**代码审查**:
- `/review` - 审查当前变更
- `/review-file <路径>` - 审查指定文件

**测试**:
- `/test` - 运行所有测试
- `/test-backend` - 运行后端测试
- `/test-frontend` - 运行前端测试

**其他工具**:
- `/refactor` - 代码重构
- `/docs-api` - 生成 API 文档
- `/deploy-dev` / `/deploy-test` / `/deploy-prod` - 部署

详细用法请查看 `.claude/commands/` 目录下的对应 `.md` 文件。

#### 🔄 典型工作流

```
1. 开始开发任务
   ↓
2. 编写代码
   ↓
3. /review (代码审查)
   ↓
4. /test (运行测试)
   ↓
5. /commit (提交代码)  ← 自动更新进度、生成提交信息
   ↓
6. /bug-add (如果遇到问题)
   ↓
7. /progress (查看整体进度)
   ↓
8. /context-transfer (Token 即将耗尽时)
```

#### 💡 智能特性

1. **自动化工作流**: `/commit` 会自动触发代码审查和测试
2. **进度跟踪**: 所有提交自动更新 `docs/开发进度.md`
3. **Bug 记忆**: 遇到的问题自动记录，避免重复踩坑
4. **上下文恢复**: 新会话可以快速恢复工作状态
5. **质量保障**: 提交前自动检查代码质量和测试覆盖率

#### 🎓 新手提示

如果您是第一次使用这些指令：
1. 输入 `/progress` 查看当前项目状态
2. 输入 `/commit` 体验智能提交流程
3. 输入 `/bug-search "关键词"` 搜索已知问题
4. 在 Token 快用完时输入 `/context-transfer` 保存工作状态

---

## 项目概述

这是一个**知识星球训练营自动押金退款系统**，用于自动化管理训练营的押金收取、打卡统计和退款流程。系统采用前后端分离架构，支持每月5-10个训练营同时运行，单个训练营最多1000人参与。

**核心业务流程**：
1. 会员通过H5扫码报名 → 企业微信支付押金 → 获得群二维码
2. 每日01:00自动同步知识星球打卡数据 → 计算退款资格
3. 项目结束后生成退款列表 → 管理员审核 → 自动执行退款

## 项目状态

🟡 **需求分析完成，准备进入开发阶段（阶段零）**

**已完成**：
- ✅ 需求分析完成（PRD.md - 70+页完整文档）
- ✅ 技术架构设计完成（技术架构设计.md）
- ✅ 数据库设计完成（10张核心表 + 完整SQL）
- ✅ 实施计划完成（30天分4阶段详细任务）
- ✅ 前端开发规范和指南完成
- ✅ Git 仓库初始化完成

**待开始（阶段零任务）**：
- ⚪ 后端项目骨架创建（backend/ 目录当前不存在）
- ⚪ 前端项目骨架创建（frontend/ 目录当前不存在）
- ⚪ 数据库脚本生成（sql/ 目录当前不存在）
- ⚪ 本地开发环境配置

**当前目录结构**：
```
AutoDepositRefundAgent/          # ← 当前工作目录
├── docs/                         # ✅ 完整的设计文档
├── prompts/                      # ✅ AI 提示词历史
├── mettings/                     # ✅ 会议记录
├── static/                       # ✅ 静态资源
├── .claude/                      # ✅ Claude Code 配置
├── backend/                      # ⚪ 待创建
├── frontend/                     # ⚪ 待创建
└── sql/                          # ⚪ 待创建
```

## 技术架构

### 后端技术栈
- **语言**：Java 17+
- **框架**：Spring Boot 3.2+ / Spring Security 6.x / MyBatis Plus 3.5+
- **数据库**：PostgreSQL 15+
- **缓存**：Redis 7.x
- **认证**：JWT Token
- **文档**：Knife4j 4.x

### 前端技术栈
- **框架**：Vue 3.3+ / Vite 5.x / Pinia 2.x
- **H5 UI**：Vant 4.x（会员端）
- **后台 UI**：Element Plus 2.4+（管理后台）
- **图表**：ECharts 5.x

### 后端分层架构
```
Controller（接口路由、参数校验）
    ↓
Service（业务逻辑、事务管理）
    ↓
Manager（第三方API封装：企业微信支付、知识星球API）
    ↓
Mapper（数据库访问）
```

## 项目结构

```
AutoDepositRefundAgent/
├── docs/                          # 完整的设计文档
│   ├── PRD.md                     # 产品需求文档（70+页）
│   ├── v1/
│   │   ├── 技术架构设计.md         # 技术架构和项目结构
│   │   └── 数据库设计.md           # 10张表的完整设计+SQL
│   ├── 分阶段实施计划.md           # 30天开发计划
│   ├── 前端开发入门指南.md         # Vue 3学习路径
│   └── 前端开发规范.md             # 前端代码规范
├── backend/                       # 后端项目（待创建）
│   └── src/main/java/com/camp/
│       ├── controller/            # 控制器层
│       ├── service/               # 业务逻辑层
│       ├── manager/               # 第三方API封装
│       ├── mapper/                # 数据访问层
│       ├── entity/                # 实体类
│       ├── dto/                   # 数据传输对象
│       ├── vo/                    # 视图对象
│       ├── config/                # 配置类
│       └── common/                # 公共类
├── frontend/                      # 前端项目（待创建）
│   ├── h5-member/                 # H5会员端（Vue 3 + Vant）
│   └── admin-web/                 # Web管理后台（Vue 3 + Element Plus）
└── sql/                           # 数据库脚本（待创建）
```

## 核心业务概念

### 10张核心数据表
1. **training_camp**：训练营基本信息（名称、押金、日期、打卡要求）
2. **camp_member**：会员与训练营关系（匹配状态、打卡统计、退款资格）⭐ 核心表
3. **planet_user**：知识星球用户信息（用于匹配）
4. **payment_record**：支付流水记录（企业微信支付订单）
5. **checkin_record**：打卡记录（从知识星球同步）
6. **refund_record**：退款记录（审核状态、退款状态）
7. **system_user**：管理员/教练/志愿者账号
8. **operation_log**：操作审计日志
9. **system_config**：系统配置（知识星球Cookie、企业微信密钥）
10. **camp_member_relation**：训练营与教练/志愿者关系

### 智能匹配算法
系统通过多维度匹配会员身份（支付记录 ↔ 知识星球用户）：
- **星球ID匹配** → 置信度100%
- **星球昵称匹配** → 置信度66%
- **微信昵称匹配** → 置信度33%
- **匹配失败** → 人工介入

### 核心Service层设计
- **CampService**：训练营CRUD、生成H5链接
- **PaymentService**：创建支付订单、处理Webhook回调、定时轮询
- **CheckinService**：同步打卡数据（定时任务）、计算退款资格
- **MatchService**：自动匹配算法、手动匹配
- **RefundService**：生成退款列表、审核、执行退款、失败重试
- **NotificationService**：企业微信通知（应用消息、群机器人）

### 定时任务
1. **打卡同步**：每天01:00同步前一天打卡数据
2. **退款触发**：每天02:00检查结束的训练营，生成退款列表
3. **提醒通知**：每天10:00发送未进群提醒、项目即将结束提醒
4. **支付轮询**：每小时同步企业微信支付记录（兜底）

## 开发计划（30天）

**阶段零**（Day 0-2）：环境搭建和基础框架
- 创建Spring Boot项目骨架
- 创建Vue 3前端项目（H5 + 后台）
- 初始化PostgreSQL数据库
- 配置Redis、MyBatis Plus、Knife4j

**阶段一**（Day 3-16）：核心功能MVP
- Day 3-4: 用户认证和权限（JWT + Spring Security）
- Day 5-6: 训练营管理（CRUD + 文件上传）
- Day 7-8: H5会员端（列表、报名、二维码）
- Day 9-10: 企业微信支付集成（Webhook + 轮询）
- Day 11-12: 知识星球API集成（定时同步打卡）
- Day 13: 会员匹配算法
- Day 14-16: 退款审核和执行

**阶段二**（Day 17-23）：数据统计和优化
- 打卡进度查询（H5）
- 统计报表（ECharts图表）
- 企业微信通知集成

**阶段三**（Day 24-30）：系统管理和安全
- 用户管理、操作日志
- 接口防刷（Redis限流）
- 敏感数据加密
- 性能优化、部署上线

## 关键设计决策

### 为什么是半自动化退款？
- **自动判断**：系统计算是否满足退款条件（打卡天数≥要求）
- **人工审核**：管理员最终确认，确保100%准确（处理边界情况）
- **自动执行**：审核通过后自动调用企业微信退款API

### 为什么需要匹配算法？
企业微信支付记录和知识星球打卡记录是两个独立系统的数据，需要通过"星球ID + 昵称 + 微信名"进行匹配，识别同一个人。

### 为什么用PostgreSQL而不是MySQL？
- 更好的JSON支持（存储打卡数据、配置等）
- 强大的全文搜索
- 更好的并发性能
- 完善的事务支持

### 异常处理策略
每个关键环节都有容错机制：
- 支付回调丢失 → 定时轮询兜底
- 打卡同步失败 → 通知管理员
- 退款失败 → 自动重试1次 → 仍失败则人工处理
- API异常 → 降级方案（手动导入）

## API接口规范

### URL设计
- 管理端：`/api/admin/{resource}`
- H5端：`/api/h5/{resource}`
- Webhook：`/api/webhook/{source}/{event}`

### 统一响应格式
```json
{
  "code": 200,
  "message": "成功",
  "data": {},
  "timestamp": 1234567890
}
```

### 认证方式
- 管理后台：JWT Token（Header: `Authorization: Bearer {token}`）
- H5端：游客模式（查询进度时验证身份）
- Webhook：签名验证

## 本地开发环境

### 环境要求
- **Java**: 17+
- **Node.js**: 18+
- **PostgreSQL**: 15+
- **Redis**: 7+
- **Maven**: 3.8+

**⚠️ 开发环境说明**：
- 当前项目在 **Windows (win32)** 环境下开发
- 所有命令行操作使用 PowerShell 或 Git Bash
- Windows 环境下的 PostgreSQL 和 Redis 建议使用：
  - PostgreSQL：官方 Windows 安装包
  - Redis：Windows 移植版或通过 WSL2 安装
- Maven 建议配置阿里云镜像加速依赖下载

### 快速启动（阶段零完成后）

#### 1. 数据库初始化
```bash
# 创建数据库（Windows 环境下）
# 方式1：使用 psql 命令行
psql -U postgres -c "CREATE DATABASE camp_db;"

# 方式2：使用 pgAdmin 图形界面创建数据库

# 执行初始化脚本
psql -U postgres -d camp_db -f sql/init-database.sql
```

#### 2. 启动后端
```bash
# 进入后端目录
cd backend

# 构建项目（首次运行或依赖变更时）
mvn clean install

# 启动后端服务
mvn spring-boot:run

# 访问 API 文档
# http://localhost:8080/doc.html

# Windows 环境下运行 JAR 包（生产模式）
# mvn clean package
# java -jar target/camp-backend-1.0.0.jar
```

#### 3. 启动前端

**H5会员端**：
```bash
cd frontend/h5-member
npm install                # 安装依赖
npm run dev                # 启动开发服务器
npm run build              # 生产构建
npm run lint               # 代码检查
```

**Web管理后台**：
```bash
cd frontend/admin-web
npm install                # 安装依赖
npm run dev                # 启动开发服务器
npm run build              # 生产构建
npm run lint               # 代码检查
```

### 测试命令（阶段零完成后）
```bash
# 后端单元测试
cd backend
mvn test                   # 运行所有测试
mvn test -Dtest=TestClass  # 运行单个测试类

# 前端单元测试
cd frontend/h5-member
npm run test               # 运行测试
```

## 当前待办事项（阶段零任务）

⚠️ **注意**：项目当前处于**规划完成**阶段，后端/前端代码尚未创建。

### 阶段零任务清单

当用户说"开始阶段零"、"开始环境搭建"或"初始化项目"时，按照以下顺序执行任务：

#### 任务 1：创建后端项目骨架（优先级：高）
**目标**：创建可运行的 Spring Boot 项目
- [ ] 使用 Spring Initializr 生成项目骨架（在 backend/ 目录）
- [ ] 配置 pom.xml 依赖：
  - Spring Boot 3.2+
  - Spring Security 6.x
  - MyBatis Plus 3.5+
  - PostgreSQL 驱动
  - Redis
  - JWT
  - Knife4j 4.x
  - Lombok
  - OkHttp3
- [ ] 创建分层目录结构（参考 docs/v1/技术架构设计.md）
- [ ] 配置 application.yml（数据源、Redis、端口 8080）
- [ ] 配置 application-dev.yml 和 application-prod.yml

**交付物**：backend/ 目录，可运行的 Spring Boot 项目

**验收标准**：
- `mvn spring-boot:run` 能正常启动
- 访问 http://localhost:8080/doc.html 能看到 API 文档

#### 任务 2：初始化数据库脚本（优先级：高）
**目标**：生成完整的数据库初始化脚本
- [ ] 创建 sql/ 目录
- [ ] 生成 init-database.sql（参考 docs/v1/数据库设计.md）
  - 10张核心表的建表语句
  - 索引创建
  - 触发器（自动更新 updated_at）
- [ ] 生成 seed-data.sql（初始数据）
  - 默认管理员账号（admin/admin123）
  - 系统配置初始值
  - 测试数据（可选）

**交付物**：sql/ 目录，完整的 SQL 脚本

**验收标准**：
- 能够成功执行 SQL 脚本创建数据库
- 数据库包含 10 张表和必要的索引

#### 任务 3：创建前端项目骨架（优先级：中）
**目标**：创建两个前端项目（H5 + Web 管理后台）

**3.1 H5 会员端**（frontend/h5-member/）
- [ ] 使用 Vite 创建 Vue 3 项目
- [ ] 安装依赖：Vant 4.x、Vue Router、Pinia、Axios
- [ ] 配置路由（src/router/）
- [ ] 配置状态管理（src/stores/）
- [ ] 配置 Axios 拦截器（src/utils/request.js）
- [ ] 创建基础布局和页面框架

**3.2 Web 管理后台**（frontend/admin-web/）
- [ ] 使用 Vite 创建 Vue 3 项目
- [ ] 安装依赖：Element Plus、Vue Router、Pinia、Axios、ECharts
- [ ] 配置路由和权限守卫
- [ ] 配置状态管理
- [ ] 配置 Axios 拦截器
- [ ] 创建基础布局（侧边栏、头部、主内容区）

**交付物**：frontend/ 目录，两个可运行的前端项目

**验收标准**：
- `npm run dev` 能正常启动两个项目
- H5 端能访问基础页面
- 管理后台能看到登录页和基础布局

#### 任务 4：配置基础功能（优先级：中）
**目标**：配置开发环境的基础设施
- [ ] 后端配置 Knife4j API 文档
- [ ] 后端配置 CORS 跨域
- [ ] 后端配置统一异常处理
- [ ] 后端配置统一响应格式（Result<T>）
- [ ] 后端配置 logback-spring.xml
- [ ] 前端配置环境变量（.env.development / .env.production）
- [ ] 前端配置代理（解决开发环境跨域）

**交付物**：完善的配置文件

**验收标准**：
- API 文档可访问
- 前后端联调无跨域问题
- 日志正常输出

### 预计完成时间
- **Day 1 上午**：任务 1（后端项目骨架）
- **Day 1 下午**：任务 2（数据库脚本）
- **Day 2 上午**：任务 3（前端项目骨架）
- **Day 2 下午**：任务 4（基础功能配置）

### 参考文档
执行阶段零任务时，请参考以下文档：
- `docs/v1/技术架构设计.md` - 完整的技术架构和项目结构
- `docs/v1/数据库设计.md` - 10张表的完整 SQL 和字段说明
- `docs/分阶段实施计划.md` - 阶段零的详细任务清单
- `docs/前端开发规范.md` - 前端代码规范和目录结构

## 开发规范

### 核心开发原则(⚠️ 必须遵守)

#### 1. 文档先行原则
- **【强制】** 开发任何新功能前,必须先编写 API 文档
- **【强制】** API 文档必须包含: 接口路径、请求参数、响应格式、错误码
- **【强制】** 前端组件必须先编写组件文档(Props、Events、Slots)

**示例**:
```javascript
/**
 * 获取训练营列表
 *
 * @route GET /api/admin/camps
 * @param {string} status - 状态筛选: active/finished
 * @returns {Object} 训练营列表
 * @throws {400} 参数错误
 * @throws {401} 未授权
 */
```

#### 2. 测试驱动开发(TDD)原则
- **【强制】** 核心业务逻辑必须先写测试用例,再写实现代码
- **【推荐】** 测试覆盖率要求: 核心业务 ≥ 80%,整体项目 ≥ 70%

**TDD 流程**:
```
1. 编写测试用例(Red) → 测试失败
   ↓
2. 编写最小实现代码(Green) → 测试通过
   ↓
3. 重构优化代码(Refactor) → 测试仍然通过
```

**示例**:
```javascript
// 1. 先写测试
describe('RefundService', () => {
  it('应该正确计算合格人数', () => {
    const result = refundService.calculate(data, 7);
    expect(result.qualified_count).toBe(85);
  });
});

// 2. 再写实现
calculate(data, requiredDays) {
  return data.filter(u => u.days >= requiredDays).length;
}
```

#### 3. 职责单一原则
- **【强制】** Controller 只负责路由和参数校验,不包含业务逻辑
- **【强制】** Service 只负责业务逻辑,不直接调用第三方API
- **【强制】** Manager 只负责封装第三方API,不包含业务逻辑

```
Controller → 参数校验、调用Service
Service → 业务逻辑、事务管理
Manager → 第三方API封装
```

---

### Git提交规范
遵循Conventional Commits：
- `feat`: 新功能
- `fix`: 修复Bug
- `docs`: 文档更新
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具配置

**提交信息格式**:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**示例**:
```bash
feat(api): 添加训练营CRUD接口

- 新增 POST /api/admin/camps 创建接口
- 新增 GET /api/admin/camps 列表接口
- 支持分页和状态筛选

Closes #123
```

---

### 后端代码规范

#### 命名规范
- **变量**: 小驼峰命名法 `userName`
- **类名**: 大驼峰命名法 `CampService`
- **常量**: 全大写+下划线 `MAX_RETRY_COUNT`
- **布尔变量**: 使用 is/has/should 前缀 `isValid`

#### 异常处理
- **【强制】** 使用统一的错误处理中间件/拦截器
- **【强制】** 错误信息必须语义化,明确指出问题
- **【推荐】** 自定义业务异常类

**示例**:
```java
// ✅ 正确: 明确的错误信息
if (!requiredDays || requiredDays <= 0) {
  throw new ValidationException("required_days 必须为正整数");
}

// ❌ 错误: 模糊的错误信息
if (!requiredDays) {
  throw new Exception("参数错误");
}
```

#### 日志规范
- **error**: 系统错误,需要立即处理
- **warn**: 警告信息,需要关注
- **info**: 重要业务信息
- **debug**: 调试信息(仅开发环境)

**【强制】** 日志必须包含关键信息:
```java
logger.info("生成退款名单完成", {
  camp_id: campId,
  required_days: requiredDays,
  qualified_count: qualifiedCount,
  duration: Date.now() - startTime
});
```

---

### 前端代码规范

#### Vue 3 编码规范
- **【强制】** 优先使用 Composition API
- **【强制】** 组件名必须多个单词 `StatisticsCard`
- **【强制】** Props 必须声明类型和默认值
- **【强制】** Events 必须显式声明

**示例**:
```vue
<script setup>
const props = defineProps({
  totalCount: {
    type: Number,
    required: true,
    validator: (value) => value >= 0
  },
  title: {
    type: String,
    default: '未命名训练营'
  }
});

const emit = defineEmits(['refresh', 'delete']);
</script>
```

#### 样式规范
- **【强制】** 组件样式必须使用 `scoped`
- **【推荐】** 使用 BEM 命名规范
- **【推荐】** 使用 CSS 变量统一管理颜色

#### 性能优化
- **【强制】** v-for 必须绑定唯一 key
- **【推荐】** 使用 computed 替代方法(有缓存)
- **【推荐】** 大组件使用懒加载
- **【推荐】** 数据量>100 使用虚拟滚动

---

### 数据库规范
- 表名和字段名：小写+下划线
- 主键统一使用`id`（BIGSERIAL）
- 必备字段：`created_at`、`updated_at`、`deleted_at`（软删除）
- 金额字段：DECIMAL(10,2)

---

### 安全规范
- **【强制】** 禁止在代码中硬编码敏感信息(使用环境变量)
- **【强制】** 禁止在日志中输出敏感信息
- **【强制】** 所有外部输入必须校验
- **【强制】** 敏感数据必须加密存储(AES-256)

---

### 代码审查清单

#### 功能性
- [ ] 代码是否实现了需求?
- [ ] 边界条件是否处理?
- [ ] 错误处理是否完善?

#### 可读性
- [ ] 命名是否语义化?
- [ ] 注释是否充分?
- [ ] 代码逻辑是否清晰?

#### 测试
- [ ] 是否有单元测试?
- [ ] 测试覆盖率是否达标?
- [ ] 测试用例是否充分?

#### 安全性
- [ ] 输入是否校验?
- [ ] 敏感信息是否加密?
- [ ] SQL注入/XSS 是否防护?

## 重要文档链接

详细的设计文档位于`docs/`目录：

| 文档 | 路径 | 说明 |
|------|------|------|
| **产品需求文档** | `docs/PRD.md` | 完整的功能需求和业务流程（70+页） |
| **技术架构设计** | `docs/v1/技术架构设计.md` | 技术选型、项目结构、接口设计 |
| **数据库设计** | `docs/v1/数据库设计.md` | 10张表的完整SQL和ER图 |
| **分阶段实施计划** | `docs/分阶段实施计划.md` | 30天详细任务分解和验收标准 |
| **前端开发入门指南** | `docs/前端开发入门指南.md` | 专为后端程序员设计的Vue学习路径 |
| **前端开发规范** | `docs/前端开发规范.md` | 前端代码规范和最佳实践 |

### 文档阅读建议
1. **开始开发前**：先阅读 PRD.md 了解业务需求
2. **技术设计**：阅读 技术架构设计.md 和 数据库设计.md
3. **开发排期**：参考 分阶段实施计划.md
4. **前端开发**：阅读 前端开发入门指南.md 和 前端开发规范.md

## 外部服务集成

### 企业微信支付
- **创建订单**：调用企业微信支付API
- **Webhook回调**：验证签名 → 更新支付状态 → 创建会员记录
- **退款**：调用退款API，失败重试1次
- **轮询兜底**：每小时同步支付记录

### 知识星球API
- **认证方式**：Cookie（配置在system_config表）
- **获取打卡数据**：返回用户列表、每个用户的打卡次数和时间
- **定时同步**：每天01:00执行

### 企业微信通知
- **应用消息**：通知管理员（同步失败、退款失败等）
- **群机器人**：通知会员（退款成功）

## 性能要求

- H5页面首屏加载时间 < 2秒
- 管理后台响应时间 < 1秒
- 支付回调处理时间 < 3秒
- 支持单个训练营1000人同时报名
- 系统可用性：12小时/天 × 7天/周

## 安全要求

- JWT Token认证
- 基于角色的访问控制（RBAC）：超级管理员、管理员、教练、志愿者
- Redis限流：同一IP每分钟最多100次请求
- 敏感数据AES-256加密（企业微信密钥、知识星球Cookie）
- Webhook签名验证
- SQL注入防护（MyBatis Plus参数化查询）
- 操作审计日志（记录所有敏感操作）

---

## 故障排查

### 常见问题

#### 后端启动问题

**问题 1：PostgreSQL 连接失败**
```
Caused by: org.postgresql.util.PSQLException: Connection refused
```
**解决方案**：
- 检查 PostgreSQL 服务是否启动（Windows: 服务管理器）
- 检查 application.yml 中的数据库配置
- 确认数据库 `camp_db` 已创建
- 检查防火墙设置

**问题 2：Redis 连接失败**
```
Unable to connect to Redis
```
**解决方案**：
- Windows: 确认 Redis 服务已启动
- 检查 application.yml 中的 Redis 配置（默认 localhost:6379）
- 尝试使用 `redis-cli` 测试连接

**问题 3：Maven 依赖下载慢**
**解决方案**：
- 配置阿里云 Maven 镜像（修改 ~/.m2/settings.xml）
- 使用 VPN 或代理

#### 前端启动问题

**问题 1：`npm install` 失败**
**解决方案**：
- 切换到国内镜像：`npm config set registry https://registry.npmmirror.com`
- 清除缓存：`npm cache clean --force`
- 删除 node_modules 和 package-lock.json 重试

**问题 2：前端跨域问题**
```
Access to XMLHttpRequest at 'http://localhost:8080' from origin 'http://localhost:5173' has been blocked by CORS
```
**解决方案**：
- 检查后端 CORS 配置
- 检查前端 vite.config.js 中的 proxy 配置
- 确保前端请求的 API 地址正确

#### 数据库问题

**问题：SQL 脚本执行失败**
**解决方案**：
- 检查 PostgreSQL 版本是否为 15+
- 确保以 postgres 用户执行脚本
- 检查脚本中的语法错误
- 逐个表创建，定位具体错误

### 开发环境检查清单

执行以下命令检查环境是否就绪：

```bash
# 检查 Java 版本
java -version    # 应该显示 17 或更高

# 检查 Maven 版本
mvn -version     # 应该显示 3.8 或更高

# 检查 Node.js 版本
node -v          # 应该显示 v18 或更高

# 检查 npm 版本
npm -v

# 检查 PostgreSQL 版本
psql --version   # 应该显示 15 或更高

# 测试 PostgreSQL 连接
psql -U postgres -c "SELECT version();"

# 检查 Redis 是否运行（Windows 环境）
# 方式1：使用 redis-cli
redis-cli ping   # 应该返回 PONG

# 方式2：检查服务状态
# 打开"服务"管理器，查找 Redis 服务
```

### 日志位置

- **后端日志**：`backend/logs/app.log`
- **前端控制台**：浏览器开发者工具 Console
- **数据库日志**：PostgreSQL 日志目录（通常在安装目录下）

### 获取帮助

如遇到无法解决的问题：
1. 查看 `docs/` 目录下的相关文档
2. 检查项目 Issues（如有 GitHub 仓库）
3. 查看完整的错误堆栈信息
4. 记录复现步骤，便于排查

---

## 附录：项目文档索引

| 类型 | 文档路径 | 用途 |
|------|---------|------|
| **需求** | `docs/PRD.md` | 产品需求文档，了解业务需求 |
| **架构** | `docs/v1/技术架构设计.md` | 技术选型、分层架构、API设计 |
| **数据库** | `docs/v1/数据库设计.md` | 10张表的完整设计和SQL |
| **计划** | `docs/分阶段实施计划.md` | 30天详细开发计划 |
| **前端规范** | `docs/前端开发规范.md` | 前端代码规范和最佳实践 |
| **前端入门** | `docs/前端开发入门指南.md` | Vue 3 学习路径（适合后端） |
| **会议记录** | `mettings/` | 项目会议纪要 |
| **提示词** | `prompts/` | AI 对话历史和需求分析 |
