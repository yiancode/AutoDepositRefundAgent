# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**知识星球训练营自动押金退款系统** - 渐进式开发:

- **v0 (当前)**: Node.js + Express.js + Vue 3，无数据库，纯 API 代理
- **v0.2 (设计完成)**: 新增 SQLite 存储支付映射，生成微信批量退款 CSV
- **v1 (规划)**: Java + Spring Boot + PostgreSQL 完整系统

## 常用命令

### 后端 (zsxq-api)

```bash
cd zsxq-api
npm run dev              # 开发 http://localhost:3013
npm test                 # 全部测试（含覆盖率）
npm run test:unit        # 单元测试
npm run test:integration # 集成测试
npm test -- --testPathPattern="refund"  # 运行单个测试文件
npm run lint && npm run format  # 代码检查和格式化
npm run lint:fix             # 自动修复 lint 问题
npm run pm2:start        # 生产启动
```

### 前端 (zsxq-web)

```bash
cd zsxq-web
npm run dev              # 开发 http://localhost:5173
npm run build            # 生产构建
npm run test             # 测试 (vitest)
npm run test:ui          # 带 UI 的测试
```

### 健康检查

```bash
curl http://localhost:3013/health
open http://localhost:3013/api-docs  # Swagger 文档
```

### 开发环境初始化

```bash
bash docs/config/env/setup-dev-env.sh  # 安装依赖 + 运行测试 + 格式化
```

## 架构设计

### v0 核心设计决策

**无数据库设计**：所有数据实时从知识星球 API 获取，不持久化。这样做的原因：
- 快速验证核心功能
- 避免数据同步问题
- 简化部署和运维

**分层结构**：
```
routes/          → 路由定义 + 参数校验
services/        → 业务逻辑
  zsxq.service.js    # 知识星球 API 封装 (自动翻页)
  refund.service.js  # 退款名单计算
middlewares/     → 错误处理、限流、超时
utils/           → 日志、响应格式化、Redis 缓存
```

**响应格式**：
```json
{ "code": 200, "message": "成功", "data": {...}, "timestamp": 1730000000 }
```

### 知识星球 API 集成

认证需要从浏览器 DevTools 获取三个 Headers：
```env
ZSXQ_X_TIMESTAMP=1730000000000
ZSXQ_AUTHORIZATION=XXXXXXXX-XXXX-...
ZSXQ_X_SIGNATURE=xxxxxxxx...
```

**关键接口**：
- 训练营列表: `GET /v2/groups/{groupId}/checkins`
- 打卡排行榜: `GET /v2/groups/{groupId}/checkins/{checkinId}/ranking_list`
  - 注意：需自动翻页，单营最多 200 人（每页 100）

### 退款计算逻辑

```
实际打卡天数 = API返回天数 + GRACE_DAYS (默认1天)
资格判断 = 实际打卡天数 >= required_days
```

## 测试规范

- 单元测试: `*.unit.test.js`
- 集成测试: `*.integration.test.js`
- 覆盖率要求: 分支 50%，其他 80%

## 环境配置

**必需** (.env):
```env
PORT=3013
ZSXQ_GROUP_ID=15555411412112
ZSXQ_X_TIMESTAMP=xxx
ZSXQ_AUTHORIZATION=xxx
ZSXQ_X_SIGNATURE=xxx
GRACE_DAYS=1
```

**可选** (Redis 缓存):
```env
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_ENABLED=true
```

## 自动化指令

项目配置了完整的 Claude Code 指令系统，详见 `.claude/commands/README.md`。

**常用指令**:

| 指令 | 用途 |
|------|------|
| `/task-plan` | 规划新任务，拆分为可执行步骤 |
| `/progress-save` | 保存开发进度检查点（含恢复指令） |
| `/progress-load` | 加载历史进度 |
| `/progress-compare` | 对比两个时间点的进度变化 |
| `/bug-add` | 记录 Bug 到经验库 |
| `/bug-search` | 搜索已知 Bug 解决方案 |
| `/bug-list` | 按分类列出 Bug 清单 |
| `/bug-stats` | Bug 统计分析报告 |
| `/test-backend` | 运行后端测试 |
| `/test-frontend` | 运行前端测试 |
| `/review-file` | 审查指定文件的代码质量 |
| `/docs-api` | 生成 API 文档 |
| `/deploy-dev` | 部署到开发环境 |
| `/deploy-test` | 部署到测试环境 |
| `/deploy-prod` | 部署到生产环境 |

## 关键文档

| 文档 | 路径 |
|------|------|
| 产品需求 | `docs/PRD.md` |
| v0.2 技术方案 | `docs/v0.2/混合方案技术设计.md` |
| v1 数据库设计 | `docs/v1/数据库设计.md` |
| 进度检查点 | `docs/progress/checkpoints/` |

## 代码质量约束

### 实现新功能前必须

1. **先读后写**：先读相关 service 文件，理解现有模式
2. **读测试**：先读 `__tests__` 目录下同名测试文件
3. **遵循格式**：新代码必须使用统一响应格式（`utils/response.js`）
4. **同步测试**：新增 service 方法必须同步写单元测试

### 禁止事项

- ❌ 不要在 routes 层写业务逻辑，必须调用 service
- ❌ 不要直接 `console.log`，使用 `utils/logger`
- ❌ 不要硬编码常量，放入 `config/constants.js`
- ❌ 不要跳过参数校验，使用 Joi schema
- ❌ 不要忽略错误处理，使用全局错误中间件模式

### 代码参考模式

| 场景 | 参考文件 |
|------|----------|
| 新增 API 接口 | `routes/camps.js` |
| 新增业务逻辑 | `services/refund.service.js` |
| 新增工具函数 | `utils/sanitize.js` |
| 路由参数校验 | `middlewares/validation.middleware.js` |
| Redis 缓存 | `utils/redis.js` |
| 新增单元测试 | `__tests__/unit/refund.service.unit.test.js` |
| 新增集成测试 | `__tests__/integration/camps.api.integration.test.js` |
| 新增 Vue 页面 | `zsxq-web/src/views/RefundList.vue` |
| 前端 API 调用 | `zsxq-web/src/api/camps.js` |

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

1. **Cookie 会过期**：知识星球凭证定期失效，API 返回 401/403 时需更新 `.env`
2. **Redis 可选**：v0 版本不配置 Redis 不影响核心功能
3. **端口分配**：后端 3013，前端 5173
4. **提交前**：运行 `npm run lint && npm run format`

## 代码风格

- Prettier: 2 空格、单引号、分号、LF
- 后端命名: `*.service.js`, `*.middleware.js`
- Vue 组件: PascalCase, `<script setup>`
- Conventional Commits: `feat:`, `fix:`, `docs:` 等

## 技术方案编写准则

### 核心原则

技术方案是"需求规格"而非"代码蓝图"。目标是对齐认知，而非提前写代码。

### 代码示例规则

**只在以下场景使用代码：**
- 接口签名/契约定义
- 容易产生歧义的核心算法逻辑
- 与现有系统的关键集成点

**代码格式要求：**
- 只展示骨架，不写完整实现
- 单个代码块不超过 15 行
- 用注释说明意图，而非实现细节

**用文字替代代码的场景：**
- 重复模式（如：所有DTO遵循XX规范）
- 标准CRUD操作
- 常规异常处理逻辑

### 方案结构模板

```markdown
## 背景与目标
[2-3句话，说清楚为什么做、做什么]

## 核心设计
[文字描述设计思路，必要时附1-2个关键代码片段]

## 接口定义
[仅方法签名 + 关键注释，无实现]

## 约束与边界
[技术约束、性能要求、异常处理策略等，纯文字]

## 风险与依赖
[需要协调的事项]
```

### 禁止事项

- ❌ 贴超过 20 行的代码块
- ❌ 展示多个相似的重复代码
- ❌ 在方案中写具体实现逻辑
- ❌ 用代码描述可以用一句话说清的事情

### 检验标准

方案完成后自问：**如果删掉所有代码，核心设计意图是否仍然清晰？**