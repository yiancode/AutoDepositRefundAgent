# BMAD-METHOD 新手完全教程

> **适用对象**：从未使用过 BMAD 的开发者
> **项目**：知识星球训练营自动押金退款系统 (AutoDepositRefundAgent)
> **版本**：v1.0
> **最后更新**：2025-12-12

---

## 目录

1. [什么是 BMAD？](#一什么是-bmad)
2. [项目当前状态评估](#二项目当前状态评估)
3. [环境准备](#三环境准备)
4. [BMAD Agent 介绍](#四bmad-agent-介绍)
5. [方式一：使用 Quick Flow 快速开发](#五方式一使用-quick-flow-快速开发)
6. [方式二：使用完整 BMad Method 开发](#六方式二使用完整-bmad-method-开发)
7. [方式三：直接使用项目 AI 提示词](#七方式三直接使用项目-ai-提示词)
8. [常见问题与解答](#八常见问题与解答)
9. [最佳实践建议](#九最佳实践建议)

---

## 一、什么是 BMAD？

### 1.1 BMAD 简介

**BMAD** (Build More, Architect Dreams) 是一个 AI 驱动的敏捷开发框架，提供：
- **21 个专业 AI Agent**（产品经理、架构师、开发者等）
- **50+ 引导式工作流**
- **4 阶段开发方法论**

### 1.2 BMAD 四阶段方法论

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ 1-Analysis  │ 2-Planning  │3-Solutioning│4-Implementation│
│   📊 分析   │   📝 规划   │  🏗️ 方案   │    ⚡ 实施    │
│             │             │             │              │
│ - 需求调研  │ - PRD编写   │ - 架构设计  │ - 编码开发   │
│ - 市场分析  │ - 用户故事  │ - UX设计    │ - 测试验证   │
│ - 产品brief │ - 技术规格  │ - 接口设计  │ - 代码审查   │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### 1.3 本项目状态

**重要发现**：本项目（AutoDepositRefundAgent）**已完成前三个阶段**！

| 阶段 | 状态 | 对应文档 |
|-----|------|---------|
| 1-Analysis | ✅ 完成 | `docs/PRD.md` |
| 2-Planning | ✅ 完成 | `docs/v1/user-stories/EP01-EP06.md` |
| 3-Solutioning | ✅ 完成 | `docs/v1/design/技术方案.md` 等 |
| 4-Implementation | ⏳ 待开始 | 本教程重点 |

**结论**：我们可以直接进入**实施阶段**！

---

## 二、项目当前状态评估

### 2.1 已有文档清单

```
docs/v1/
├── design/                    # 设计文档
│   ├── 技术方案.md            # 117KB - 完整技术方案
│   ├── 数据库设计.md          # 85KB - 16张表设计
│   ├── API设计规范.md         # API规范
│   ├── 状态枚举定义.md        # SSOT - 状态定义唯一来源
│   └── 前端路由设计.md
├── api/
│   └── 接口文档.md            # 76KB - RESTful API
├── user-stories/              # 6个Epic用户故事
│   ├── EP01-训练营管理.md
│   ├── EP02-会员报名与支付.md
│   ├── EP03-打卡数据同步.md
│   ├── EP04-身份匹配.md
│   ├── EP05-退款审核.md
│   └── EP06-统计报表.md
├── guides/
│   └── dev-AI辅助敏捷开发计划.md  # 44KB - 包含AI提示词
├── security/
│   ├── OAuth安全指南.md
│   └── 支付安全增强方案.md
└── diagrams/                  # 架构图、流程图
```

### 2.2 技术栈

```
后端：Java 17 + Spring Boot 3.2 + PostgreSQL 15 + Redis 7
前端：Vue 3 + Vant 4 (H5) + Element Plus (管理后台)
```

### 2.3 开发计划

项目已规划 **6 个 Stage**，共约 **27 天**：

| Stage | 目标 | 时长 |
|-------|------|------|
| Stage 0 | 环境搭建 + 项目骨架 | 2天 |
| Stage 1 | 支付闭环（核心） | 5天 |
| Stage 2 | 支付集成（混合方案） | 5天 |
| Stage 3 | 打卡同步 | 4天 |
| Stage 4 | 绑定超时 + 人工审核 | 3天 |
| Stage 5 | 退款流程 | 4天 |
| Stage 6 | 前端完善 + 系统管理 | 4天 |

---

## 三、环境准备

### 3.1 确认 BMAD 已安装

本项目已安装 BMAD，确认方法：

```bash
# 在终端执行
cd /Users/stinglong/code/github/AutoDepositRefundAgent
ls -la .bmad/
```

应该看到：
```
.bmad/
├── _cfg/          # 配置文件
├── bmb/           # BMad Builder 模块
├── bmm/           # BMad Method 模块（主要使用）
├── core/          # 核心框架
└── docs/          # BMAD 文档
```

### 3.2 查看 BMAD 配置

```bash
cat .bmad/bmm/config.yaml
```

输出：
```yaml
project_name: AutoDepositRefundAgent
user_skill_level: expert
user_name: yian
communication_language: Chinese
document_output_language: Chinese
output_folder: '{project-root}/docs'
```

### 3.3 可用的 Agent 列表

```bash
ls .bmad/bmm/agents/
```

可用 Agent：
```
analyst.md          # 分析师
architect.md        # 架构师
dev.md              # 开发者 ⭐ 推荐
pm.md               # 产品经理
quick-flow-solo-dev.md  # 快速开发专家 ⭐ 推荐
sm.md               # Scrum Master ⭐ 推荐
tea.md              # 测试架构师
tech-writer.md      # 技术文档专家
ux-designer.md      # UX设计师
```

---

## 四、BMAD Agent 介绍

### 4.1 推荐使用的 Agent

对于本项目（已完成规划，进入实施），推荐使用以下 Agent：

| Agent | 名称 | 适用场景 | 菜单命令 |
|-------|------|---------|---------|
| `quick-flow-solo-dev.md` | Barry (快速开发专家) | 快速开发单个功能 | `*create-tech-spec`, `*quick-dev` |
| `dev.md` | Amelia (开发者) | Story驱动开发 | `*develop-story`, `*code-review` |
| `sm.md` | Bob (Scrum Master) | Sprint规划和管理 | `*sprint-planning`, `*create-story` |

### 4.2 Agent 工作原理

```
┌──────────────────────────────────────────────────────────┐
│                    使用 Agent 的流程                      │
├──────────────────────────────────────────────────────────┤
│  1. 在 Claude/Cursor 中加载 Agent 文件                   │
│  2. Agent 自动读取配置 (config.yaml)                     │
│  3. Agent 显示菜单选项                                   │
│  4. 你选择一个命令（输入数字或命令名）                    │
│  5. Agent 执行对应的工作流                               │
│  6. 完成后返回菜单，等待下一个命令                       │
└──────────────────────────────────────────────────────────┘
```

---

## 五、方式一：使用 Quick Flow 快速开发

> **适用场景**：快速开发单个功能或任务，不需要完整的Sprint流程

### 步骤 1：打开 Claude Code

```bash
# 方法1：在终端中
cd /Users/stinglong/code/github/AutoDepositRefundAgent
claude

# 方法2：使用 Cursor IDE
# 打开项目文件夹，使用 Cursor 的 AI 功能
```

### 步骤 2：加载 Quick Flow Agent

在 Claude Code 对话框中输入：

```
请阅读并完全执行这个Agent文件的所有指令：
/Users/stinglong/code/github/AutoDepositRefundAgent/.bmad/bmm/agents/quick-flow-solo-dev.md
```

### 步骤 3：等待 Agent 激活

Agent 激活后会显示类似：

```
🚀 Hi yian! 我是 Barry，你的快速开发专家！

我已准备好帮你快速实现功能。以下是我的菜单：

[M] *menu - 重新显示菜单
[1] *create-tech-spec - 创建技术规格（第一步）
[2] *quick-dev - 执行端到端开发（核心）
[3] *code-review - 代码审查
[4] *party-mode - 召唤其他专家
[D] *dismiss - 退出

请输入数字或命令名：
```

### 步骤 4：创建技术规格（可选）

如果你要开发的任务还没有技术规格，输入：

```
1
```
或
```
*create-tech-spec
```

Agent 会引导你创建技术规格文档。

### 步骤 5：执行快速开发

输入：

```
2
```
或
```
*quick-dev
```

然后提供任务上下文：

```
我要开发 Stage 0 - 任务 0.1：后端项目骨架搭建

请参考以下文档：
- docs/v1/guides/dev-AI辅助敏捷开发计划.md（任务0.1部分）
- docs/v1/design/技术方案.md（4.2 技术选型）

验收标准：
1. ./gradlew bootRun 成功启动
2. 访问 http://localhost:8080/doc.html 显示 Knife4j 文档
3. 健康检查 /api/health 返回 200
```

### 步骤 6：按 Agent 指引完成开发

Agent 会：
1. 分析需求
2. 生成代码
3. 指导你创建文件
4. 运行测试验证

### 步骤 7：代码审查（推荐）

完成开发后，输入：

```
3
```
或
```
*code-review
```

进行代码质量检查。

### 步骤 8：退出 Agent

```
D
```
或
```
*dismiss
```

---

## 六、方式二：使用完整 BMad Method 开发

> **适用场景**：需要Sprint规划、Story管理的正式开发流程

### 步骤 1：加载 Scrum Master Agent

在 Claude Code 中输入：

```
请阅读并完全执行这个Agent文件的所有指令：
/Users/stinglong/code/github/AutoDepositRefundAgent/.bmad/bmm/agents/sm.md
```

### 步骤 2：等待 Agent 激活

```
🏃 你好 yian! 我是 Bob，你的 Scrum Master！

菜单选项：
[M] *menu - 重新显示菜单
[1] *sprint-planning - 生成Sprint计划
[2] *create-story - 创建Story草稿
[3] *validate-create-story - 验证Story
[4] *epic-retrospective - Epic回顾
[5] *correct-course - 纠偏（当实施偏离时）
[6] *party-mode - 召唤专家团队
[D] *dismiss - 退出

请输入数字或命令名：
```

### 步骤 3：执行 Sprint 规划

输入：

```
1
```
或
```
*sprint-planning
```

提供上下文：

```
请基于以下Epic文件生成Sprint计划：
- docs/v1/user-stories/EP01-训练营管理.md
- docs/v1/user-stories/EP02-会员报名与支付.md

本次Sprint重点是 Stage 0 和 Stage 1 的任务。
```

### 步骤 4：创建开发 Story

输入：

```
2
```
或
```
*create-story
```

提供上下文：

```
请为以下任务创建Story：
- 任务 0.1：后端项目骨架搭建

参考文档：
- docs/v1/guides/dev-AI辅助敏捷开发计划.md
- docs/v1/design/技术方案.md
```

Agent 会生成一个包含验收标准和任务拆分的 Story 文件。

### 步骤 5：切换到 Developer Agent 执行 Story

退出 SM Agent：
```
D
```

加载 Developer Agent：
```
请阅读并完全执行这个Agent文件的所有指令：
/Users/stinglong/code/github/AutoDepositRefundAgent/.bmad/bmm/agents/dev.md
```

### 步骤 6：执行开发

在 Developer Agent 菜单中输入：

```
1
```
或
```
*develop-story
```

指定 Story 文件：
```
请执行这个Story：
docs/sprint-artifacts/story-0.1-backend-skeleton.md
```

Agent 会按照 Story 中的任务列表逐个执行。

---

## 七、方式三：直接使用项目 AI 提示词

> **适用场景**：不想使用 Agent，直接让 AI 执行任务
> **推荐度**：⭐⭐⭐⭐⭐ 本项目最推荐的方式！

本项目在 `docs/v1/guides/dev-AI辅助敏捷开发计划.md` 中已经准备好了**完整的 AI 提示词模板**。

### 步骤 1：打开任务计划文档

```bash
# 查看文档
cat docs/v1/guides/dev-AI辅助敏捷开发计划.md
```

或在编辑器中打开该文件。

### 步骤 2：找到要执行的任务

例如，要执行 **Stage 0 - 任务 0.1**，找到文档中的：

```markdown
#### 🤖 AI 提示词（任务 0.1）
```

### 步骤 3：复制 AI 提示词

复制以下内容（示例）：

```markdown
我需要创建一个 Spring Boot 3.2+ 的后端项目骨架，请帮我完成以下任务：

【项目要求】
- 项目名称：camp-backend
- 基础包名：com.camp
- 端口：8080
- Java 版本：17
- 构建工具：Gradle

【依赖清单】（参考技术方案 4.2 技术选型）
1. Spring Boot Starter Web
2. Spring Boot Starter Security（暂时禁用，后续配置）
3. Spring Boot Starter Validation
4. MyBatis Plus 3.5.5+
5. PostgreSQL 驱动
6. Redis Spring Boot Starter
7. Lombok
8. Knife4j 4.x（API 文档）
9. OkHttp3（HTTP 客户端）
10. Hutool（工具类）

【目录结构】（参考技术方案 5.5.1 项目结构）
backend/
├── src/main/java/com/camp/
│   ├── CampApplication.java
│   ├── config/
│   ├── common/
│   ├── controller/
│   ├── service/
│   ├── mapper/
│   ├── entity/
│   ├── dto/
│   ├── enums/
│   ├── manager/
│   ├── schedule/
│   └── util/

【验收标准】
1. 运行 `./gradlew bootRun` 成功启动
2. 访问 http://localhost:8080/doc.html 显示 Knife4j 文档
3. 访问 http://localhost:8080/api/health 返回成功

请生成完整的代码，包括 build.gradle 和所有配置文件。
```

### 步骤 4：在 Claude Code 中执行

直接粘贴到 Claude Code 对话框中，AI 会：
1. 生成所有需要的代码文件
2. 创建配置文件
3. 指导你如何运行和验证

### 步骤 5：验证结果

按照提示词中的**验收标准**进行验证：

```bash
# 进入后端目录
cd backend

# 启动项目
./gradlew bootRun

# 在浏览器中访问
# http://localhost:8080/doc.html
# http://localhost:8080/api/health
```

### 步骤 6：继续下一个任务

重复步骤 2-5，执行下一个任务的 AI 提示词。

---

## 八、常见问题与解答

### Q1: Agent 加载后没有显示菜单怎么办？

**A**: 确保你使用的是完整的加载指令：

```
请阅读并完全执行这个Agent文件的所有指令：
[Agent文件的完整路径]
```

### Q2: Agent 说找不到 config.yaml 怎么办？

**A**: 检查配置文件是否存在：

```bash
cat /Users/stinglong/code/github/AutoDepositRefundAgent/.bmad/bmm/config.yaml
```

### Q3: 应该用哪种方式开发？

**A**: 根据你的情况选择：

| 情况 | 推荐方式 |
|-----|---------|
| 新手，想快速上手 | 方式三：直接使用 AI 提示词 |
| 开发单个独立功能 | 方式一：Quick Flow |
| 需要完整Sprint管理 | 方式二：完整 BMad Method |
| 项目已有详细提示词 | 方式三：直接使用 AI 提示词 ⭐ |

**本项目推荐**：方式三，因为 `dev-AI辅助敏捷开发计划.md` 已包含所有任务的详细 AI 提示词。

### Q4: 如何查看当前 Stage 的任务？

**A**:

```bash
# 打开任务计划
open docs/v1/guides/dev-AI辅助敏捷开发计划.md

# 或在终端查看
cat docs/v1/guides/dev-AI辅助敏捷开发计划.md | head -100
```

### Q5: 执行任务时需要参考哪些文档？

**A**: 常用文档速查：

| 开发内容 | 参考文档 |
|---------|---------|
| 任务详情 | `docs/v1/guides/dev-AI辅助敏捷开发计划.md` |
| 数据库表 | `docs/v1/design/数据库设计.md` |
| API接口 | `docs/v1/api/接口文档.md` |
| 状态枚举 | `docs/v1/design/状态枚举定义.md` |
| 整体架构 | `docs/v1/design/技术方案.md` |
| 用户故事 | `docs/v1/user-stories/EP0*.md` |

---

## 九、最佳实践建议

### 9.1 推荐的开发流程

```
1. 📖 先阅读任务计划
   → docs/v1/guides/dev-AI辅助敏捷开发计划.md

2. 🎯 确定当前Stage和任务
   → Stage 0 → 1 → 2 → 3 → 4 → 5 → 6

3. 📋 复制对应的AI提示词
   → 找到 "🤖 AI 提示词（任务 X.X）" 部分

4. 🚀 在 Claude Code 中执行
   → 粘贴提示词，让 AI 生成代码

5. ✅ 按验收标准验证
   → 运行测试，检查功能

6. 📝 更新进度
   → 在任务计划底部更新 Stage 进度

7. 🔄 重复，直到完成所有任务
```

### 9.2 遵循 SSOT 原则

**所有状态枚举值**必须引用唯一来源：

```
docs/v1/design/状态枚举定义.md
```

不要在代码中硬编码状态值，始终参考这个文档。

### 9.3 测试要求

每个任务完成后，确保：

- [ ] 单元测试通过
- [ ] 集成测试通过（如有）
- [ ] 代码风格检查通过
- [ ] 验收标准全部满足

### 9.4 文档更新

开发过程中，如果发现文档需要更新：

1. 先完成当前任务
2. 记录需要更新的内容
3. 在任务完成后统一更新文档

---

## 附录 A：快速命令参考

### A.1 BMAD Agent 加载命令

```bash
# Quick Flow Agent（快速开发）
请阅读并完全执行这个Agent文件的所有指令：
/Users/stinglong/code/github/AutoDepositRefundAgent/.bmad/bmm/agents/quick-flow-solo-dev.md

# Developer Agent（Story驱动开发）
请阅读并完全执行这个Agent文件的所有指令：
/Users/stinglong/code/github/AutoDepositRefundAgent/.bmad/bmm/agents/dev.md

# Scrum Master Agent（Sprint管理）
请阅读并完全执行这个Agent文件的所有指令：
/Users/stinglong/code/github/AutoDepositRefundAgent/.bmad/bmm/agents/sm.md

# Architect Agent（架构讨论）
请阅读并完全执行这个Agent文件的所有指令：
/Users/stinglong/code/github/AutoDepositRefundAgent/.bmad/bmm/agents/architect.md
```

### A.2 Agent 菜单命令

| Agent | 命令 | 功能 |
|-------|------|------|
| Quick Flow | `*create-tech-spec` | 创建技术规格 |
| Quick Flow | `*quick-dev` | 执行开发 |
| Quick Flow | `*code-review` | 代码审查 |
| Developer | `*develop-story` | 执行Story |
| Developer | `*code-review` | 代码审查 |
| SM | `*sprint-planning` | Sprint规划 |
| SM | `*create-story` | 创建Story |
| SM | `*correct-course` | 纠偏 |
| 所有 | `*menu` | 显示菜单 |
| 所有 | `*dismiss` | 退出Agent |

### A.3 项目文档路径

```bash
# 任务计划（含AI提示词）
docs/v1/guides/dev-AI辅助敏捷开发计划.md

# 技术方案
docs/v1/design/技术方案.md

# 数据库设计
docs/v1/design/数据库设计.md

# API接口
docs/v1/api/接口文档.md

# 状态枚举（SSOT）
docs/v1/design/状态枚举定义.md

# 用户故事
docs/v1/user-stories/EP01-训练营管理.md
docs/v1/user-stories/EP02-会员报名与支付.md
docs/v1/user-stories/EP03-打卡数据同步.md
docs/v1/user-stories/EP04-身份匹配.md
docs/v1/user-stories/EP05-退款审核.md
docs/v1/user-stories/EP06-统计报表.md
```

---

## 附录 B：Stage 开发检查清单

### Stage 0：环境搭建（2天）

- [ ] 任务 0.1：后端项目骨架搭建
  - [ ] Spring Boot 项目创建
  - [ ] 依赖配置
  - [ ] Knife4j 文档配置
  - [ ] 健康检查接口
- [ ] 任务 0.2：核心数据表创建
  - [ ] 4张核心表SQL脚本
  - [ ] 索引创建
  - [ ] 初始数据
- [ ] 任务 0.3：H5前端骨架搭建
  - [ ] Vue 3 + Vant 项目创建
  - [ ] Axios 封装

### Stage 1：支付闭环（5天）

- [ ] 任务 1.1：OAuth授权流程
- [ ] 任务 1.2：登录注册接口
- [ ] 任务 1.3：训练营CRUD接口
- [ ] 任务 1.4：状态自动更新定时任务
- [ ] 任务 1.5：微信公众号OAuth集成

### Stage 2-6：参考 `dev-AI辅助敏捷开发计划.md`

---

**文档版本**：v1.0
**创建日期**：2025-12-12
**维护者**：技术架构组
