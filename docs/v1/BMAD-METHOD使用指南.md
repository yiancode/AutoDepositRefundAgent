# BMAD Method 使用指南

> **适用项目**：AutoDepositRefundAgent（知识星球训练营自动押金退款系统）
> **适用人群**：编程初学者、BMAD-METHOD 首次使用者
> **创建日期**：2024-12-04

---

## 目录

- [第一部分：理解基本概念](#第一部分理解基本概念)
- [第二部分：项目分析](#第二部分项目分析)
- [第三部分：开始使用](#第三部分开始使用详细步骤)
- [第四部分：命令速查表](#第四部分所有可用命令速查表)
- [第五部分：具体执行计划](#第五部分项目具体执行计划)
- [第六部分：实际操作演示](#第六部分实际操作演示)
- [第七部分：常见问题解答](#第七部分常见问题解答)

---

## 第一部分：理解基本概念

### 什么是 BMAD Method？

把它想象成一个**智能项目经理团队**：

```
┌─────────────────────────────────────────────────────────────┐
│                    你的 AI 团队                              │
│                                                             │
│  👤 Analyst   → 帮你分析项目、推荐工作流                      │
│  👤 PM        → 帮你写需求文档、拆分用户故事                   │
│  👤 Architect → 帮你设计系统架构                             │
│  👤 SM        → 管理开发进度、创建每个故事                    │
│  👤 DEV       → 实际写代码                                   │
│  👤 UX        → 设计用户界面                                 │
└─────────────────────────────────────────────────────────────┘
```

### 工作流程是什么？

就像做菜有步骤一样，软件开发也有步骤：

```
第1步：分析   →  第2步：规划   →  第3步：设计   →  第4步：开发
(了解要做什么)   (写需求文档)    (画架构图)     (写代码)
```

### BMAD 的三个轨道

| 轨道 | 适用场景 | 所需文档 | 启动时间 |
|------|----------|----------|----------|
| **⚡ Quick Flow** | Bug修复、小功能（1-15个故事）| tech-spec | < 5分钟 |
| **📋 BMad Method** | 产品、平台（10-50+个故事）| PRD + 架构 + UX | < 15分钟 |
| **🏢 Enterprise** | 合规性、大规模（30+个故事）| 完整治理套件 | < 30分钟 |

---

## 第二部分：项目分析

### 项目现状

| 项目信息 | 状态 |
|---------|------|
| 项目名称 | 知识星球训练营自动押金退款系统 |
| 项目类型 | **全新项目**（Greenfield） |
| 复杂度 | 中等（6个Stage，约40个故事）|
| 已有文档 | ✅ PRD、技术方案、数据库设计、接口文档 |
| BMAD 安装 | ✅ 已安装（`.bmad/` 目录）|
| Claude Code 配置 | ✅ 已配置（`.claude/commands/bmad/`）|
| 代码状态 | ❌ 还未开始写 |

### 推荐轨道：📋 BMad Method

**推荐理由：**
1. 这是完整的产品开发，不是简单bug修复
2. 有多个功能模块（支付、打卡、退款等）
3. 需要前后端协调开发
4. 已有完善的技术文档可复用

### 配置状态检查

| 检查项 | 状态 | 说明 |
|--------|------|------|
| BMAD 安装 | ✅ 完成 | `.bmad/` 目录存在 |
| Claude Code 命令 | ✅ 完成 | `.claude/commands/bmad/` 目录存在 |
| 代理配置 | ✅ 完成 | 9个代理可用 |
| 工作流配置 | ✅ 完成 | 17个工作流可用 |

---

## 第三部分：开始使用（详细步骤）

### 🎬 第1步：初始化项目工作流

**在 Claude Code 中输入：**
```
/bmad/bmm/workflows/workflow-init
```

**这个命令会：**
1. 分析你的项目情况
2. 让你描述项目目标
3. 推荐适合的开发轨道
4. 创建 `bmm-workflow-status.yaml` 文件来跟踪进度

**对话示例：**
```
你：/bmad/bmm/workflows/workflow-init

AI：我来帮你初始化项目工作流。请告诉我：
    1. 你的项目是什么？
    2. 这是新项目还是现有代码？
    3. 大概的规模和复杂度？

你：这是一个知识星球训练营自动押金退款系统，全新项目，
    包含会员H5端和管理后台，预计6个开发阶段，
    我已经有完整的技术方案文档在 docs/v1/ 目录下

AI：根据你的描述，我推荐使用 "BMad Method" 轨道...
```

---

### 🎬 第2步：理解你的开发流程

由于你**已经有完整的技术文档**，你的流程会比标准流程简单：

```
标准流程：分析 → 规划(PRD) → 设计(架构) → 拆分故事 → 开发
                  ↓           ↓
你的情况：  ✅ 已完成    ✅ 已完成（docs/v1/）

你需要做的：验证文档 → 拆分故事 → 开发
```

---

### 🎬 第3步：创建史诗和用户故事

你的 v1 方案已经有了 6 个 Stage，需要用 BMAD 的方式来管理它们。

**在 Claude Code 中输入：**
```
/bmad/bmm/workflows/create-epics-and-stories
```

**这会将你的 6 个 Stage 转换为 BMAD 格式的史诗(Epic)和故事(Story)：**

```
Stage 0 → Epic 0: 环境搭建
  ├── Story 0.1: 后端项目骨架搭建
  ├── Story 0.2: 核心数据表创建
  └── Story 0.3: H5前端骨架搭建

Stage 1 → Epic 1: 基础框架
  ├── Story 1.1: JWT认证基础设施
  ├── Story 1.2: 登录注册接口
  ├── Story 1.3: 训练营CRUD接口
  └── ...

（以此类推）
```

---

### 🎬 第4步：开始 Sprint 规划

**在 Claude Code 中输入：**
```
/bmad/bmm/workflows/sprint-planning
```

**这会：**
1. 创建 `sprint-status.yaml` 文件
2. 列出所有待开发的故事
3. 让你选择第一个 Sprint 要完成哪些故事

---

### 🎬 第5步：开发第一个故事

**步骤 5.1 - 创建故事详情：**
```
/bmad/bmm/workflows/create-story
```

**步骤 5.2 - 开发故事：**
```
/bmad/bmm/workflows/dev-story
```

**步骤 5.3 - 代码审查（可选）：**
```
/bmad/bmm/workflows/code-review
```

---

## 第四部分：所有可用命令速查表

### 🤖 代理命令（加载AI专家）

| 命令 | 用途 | 什么时候用 |
|------|------|-----------|
| `/bmad/bmm/agents/analyst` | 分析师 | 项目初始化、分析问题 |
| `/bmad/bmm/agents/pm` | 产品经理 | 写需求、拆故事 |
| `/bmad/bmm/agents/architect` | 架构师 | 设计系统架构 |
| `/bmad/bmm/agents/sm` | Scrum Master | 管理Sprint、创建故事 |
| `/bmad/bmm/agents/dev` | 开发者 | 写代码 |
| `/bmad/bmm/agents/ux-designer` | UX设计师 | 设计界面 |
| `/bmad/bmm/agents/tea` | 测试架构师 | 设计测试方案 |
| `/bmad/bmm/agents/tech-writer` | 技术文档工程师 | 写文档 |
| `/bmad/bmm/agents/quick-flow-solo-dev` | 快速开发者 | 小功能快速开发 |

### 📋 工作流命令（执行任务）

| 命令 | 用途 | 阶段 |
|------|------|------|
| `/bmad/bmm/workflows/workflow-init` | 初始化项目 | 开始 |
| `/bmad/bmm/workflows/workflow-status` | 查看当前进度 | 随时 |
| `/bmad/bmm/workflows/create-epics-and-stories` | 创建史诗和故事 | 规划 |
| `/bmad/bmm/workflows/implementation-readiness` | 实施就绪检查 | 规划后 |
| `/bmad/bmm/workflows/sprint-planning` | Sprint规划 | 开发前 |
| `/bmad/bmm/workflows/create-story` | 创建故事详情 | 开发时 |
| `/bmad/bmm/workflows/dev-story` | 开发故事 | 开发时 |
| `/bmad/bmm/workflows/code-review` | 代码审查 | 开发后 |
| `/bmad/bmm/workflows/correct-course` | 调整计划 | 需要时 |
| `/bmad/bmm/workflows/retrospective` | 回顾总结 | Sprint结束 |
| `/bmad/bmm/workflows/create-tech-spec` | 创建技术规格 | Quick Flow |
| `/bmad/bmm/workflows/quick-dev` | 快速开发 | Quick Flow |
| `/bmad/bmm/workflows/document-project` | 项目文档化 | 随时 |

### 🎨 图表工作流

| 命令 | 用途 |
|------|------|
| `/bmad/bmm/workflows/create-excalidraw-diagram` | 创建通用图表 |
| `/bmad/bmm/workflows/create-excalidraw-flowchart` | 创建流程图 |
| `/bmad/bmm/workflows/create-excalidraw-dataflow` | 创建数据流图 |
| `/bmad/bmm/workflows/create-excalidraw-wireframe` | 创建线框图 |

---

## 第五部分：项目具体执行计划

### 🗓️ 推荐的开发顺序

```
第1天：项目初始化
├── 运行 workflow-init（10分钟）
├── 运行 create-epics-and-stories（30分钟）
└── 运行 sprint-planning（20分钟）

第2-3天：Stage 0 - 环境搭建
├── create-story → dev-story（Story 0.1 后端骨架）
├── create-story → dev-story（Story 0.2 数据库）
└── create-story → dev-story（Story 0.3 H5骨架）

第4-8天：Stage 1 - 基础框架
├── JWT认证
├── 登录注册
├── 训练营CRUD
└── 微信OAuth

第9-13天：Stage 2 - 支付集成
├── 微信支付SDK封装
├── 创建支付订单
├── 支付回调处理
└── 用户绑定

第14-17天：Stage 3 - 打卡同步
├── 知识星球API封装
├── 打卡同步定时任务
└── 打卡统计

第18-20天：Stage 4 - 匹配算法
├── 混合匹配服务
└── 匹配管理接口

第21-24天：Stage 5 - 退款流程
├── 退款名单生成
├── 退款审核
├── 退款执行
└── 通知服务

第25-28天：Stage 6 - 前端开发
├── H5训练营页面
├── H5支付绑定页面
├── 管理后台训练营管理
├── 管理后台退款审核
└── 统计报表
```

### Stage 与 BMAD 概念对照表

| 你的文档概念 | BMAD 概念 | 说明 |
|-------------|-----------|------|
| Stage | Epic（史诗）| 一个大的功能模块 |
| 任务 | Story（用户故事）| 可独立开发和测试的最小单元 |
| AI提示词 | Story 描述 | 开发时的详细指导 |
| 验收标准 | 完成定义(DoD) | 判断故事是否完成 |

---

## 第六部分：实际操作演示

### 示例：如何开发 Story 0.1（后端骨架）

**第1步 - 新建对话，创建故事：**
```
/bmad/bmm/workflows/create-story

然后告诉AI：
"请帮我创建 Story 0.1：后端项目骨架搭建
参考文档：docs/v1/AI辅助敏捷开发计划.md 中的任务 0.1"
```

**第2步 - 新建对话，开发故事：**
```
/bmad/bmm/workflows/dev-story

然后告诉AI：
"请开发 Story 0.1
技术要求：
- Spring Boot 3.2+
- Gradle 构建
- 包含 Knife4j API文档
参考：docs/v1/AI辅助敏捷开发计划.md 任务 0.1 的提示词"
```

**第3步 - 验证结果：**
```bash
cd backend
./gradlew bootRun
# 访问 http://localhost:8080/doc.html 验证
```

**第4步 - 代码审查（可选）：**
```
/bmad/bmm/workflows/code-review

告诉AI：
"请审查 Story 0.1 的代码实现"
```

---

### 示例：如何查看当前进度

**随时可以运行：**
```
/bmad/bmm/workflows/workflow-status
```

**AI会告诉你：**
- 当前在哪个阶段
- 下一步应该做什么
- 哪些故事已完成/进行中/待开始

---

## 第七部分：常见问题解答

### Q1：我已经有技术方案了，还需要运行 workflow-init 吗？

**答：** 需要。workflow-init 会创建 BMAD 的进度跟踪文件，让你能使用后续的工作流。但你可以跳过分析阶段，直接告诉它你已有文档。

### Q2：我的 6 个 Stage 怎么对应 BMAD 的概念？

**对应关系：**
```
你的 Stage = BMAD 的 Epic（史诗）
你的任务 = BMAD 的 Story（用户故事）
```

### Q3：每个工作流必须用新对话吗？

**答：** 强烈建议。因为：
- AI 有上下文限制
- 新对话确保AI不会"混淆"
- 每个工作流的输出会保存到文件，下个工作流能读取

### Q4：如果中途出错了怎么办？

**答：** 运行 `/bmad/bmm/workflows/correct-course` 来调整计划。

### Q5：工作流生成的文件保存在哪里？

**答：** 通常保存在 `docs/` 目录下：
- `bmm-workflow-status.yaml` - 工作流状态
- `sprint-status.yaml` - Sprint状态
- `epics/` - 史诗文件
- `stories/` - 故事文件

### Q6：可以跳过某些工作流吗？

**答：** 可以，但建议：
- `workflow-init` - 不要跳过，这是基础
- `create-epics-and-stories` - 不要跳过，这决定了开发顺序
- `sprint-planning` - 建议执行，帮助管理进度
- `code-review` - 可选，但建议执行以保证代码质量

### Q7：如何利用已有的 AI 提示词？

**答：** 你的 `docs/v1/AI辅助敏捷开发计划.md` 中已经有详细的 AI 提示词，可以在 `dev-story` 时直接引用：
```
/bmad/bmm/workflows/dev-story

"请按照 docs/v1/AI辅助敏捷开发计划.md 中任务 X.X 的提示词来开发"
```

---

## 附录：快速开始清单

### 首次使用检查清单

- [ ] 确认 `.bmad/` 目录存在
- [ ] 确认 `.claude/commands/bmad/` 目录存在
- [ ] 运行 `/bmad/bmm/workflows/workflow-init`
- [ ] 运行 `/bmad/bmm/workflows/create-epics-and-stories`
- [ ] 运行 `/bmad/bmm/workflows/sprint-planning`

### 每日开发流程

1. 查看状态：`/bmad/bmm/workflows/workflow-status`
2. 创建故事：`/bmad/bmm/workflows/create-story`
3. 开发故事：`/bmad/bmm/workflows/dev-story`
4. 代码审查：`/bmad/bmm/workflows/code-review`
5. 更新状态：故事完成后自动更新

### 关键文档位置

| 文档 | 路径 |
|------|------|
| 技术方案 | `docs/v1/技术方案.md` |
| 数据库设计 | `docs/v1/数据库设计.md` |
| 接口文档 | `docs/v1/接口文档.md` |
| 开发计划 | `docs/v1/AI辅助敏捷开发计划.md` |
| FastAuth方案 | `docs/v1/FastAuth接入方案.md` |
| 用户故事 | `docs/v1/user-stories/` |

---

## 🚀 现在开始！

**你的第一个命令应该是：**

```
/bmad/bmm/workflows/workflow-init
```

然后告诉 AI：

> "这是一个知识星球训练营自动押金退款系统，全新项目。我已经有完整的技术文档在 docs/v1/ 目录下，包括技术方案、数据库设计、接口文档和开发计划。请帮我初始化 BMad Method 工作流。"

---

**祝你开发顺利！** 🎉
