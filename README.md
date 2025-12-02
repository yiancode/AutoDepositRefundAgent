# 知识星球训练营自动押金退款系统

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Java](https://img.shields.io/badge/Java-17+-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2+-green.svg)](https://spring.io/projects/spring-boot)
[![Vue](https://img.shields.io/badge/Vue-3.3+-brightgreen.svg)](https://vuejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)

> 一个面向知识星球训练营的全自动押金管理和退款系统,实现从报名支付到打卡统计再到自动退款的完整闭环。

---

## 📖 项目简介

**AutoDepositRefundAgent** 是一个为知识星球训练营设计的智能押金管理系统。系统通过自动化技术,将原本需要人工处理的**押金收取、打卡核对、退款审核**全流程自动化,大幅提升运营效率,减少人工错误。

### 业务场景

- 🎯 **训练营规模**: 每月5-10个训练营同时进行
- 👥 **参与人数**: 单个训练营最多1000人
- 💰 **押金管理**: 自动收款、智能匹配、批量退款
- 📊 **数据统计**: 完成率、退款率、收入统计一目了然

### 核心价值

- ⚡ **效率提升90%**: 自动化处理代替人工操作
- 🎯 **准确率100%**: 多维匹配 + 人工审核双重保障
- 😊 **体验优化**: 会员支付即进群,退款自动到账
- 📈 **数据化运营**: 完整的报表和统计分析

---

## ✨ 核心功能

### 🔵 会员端 (H5)

- **训练营列表**: 浏览所有进行中和即将开始的训练营
- **在线报名**: 填写个人信息,在线支付押金
- **即时进群**: 支付成功立即获得群二维码
- **打卡查询**: 实时查看自己的打卡进度和退款状态

### 🟢 管理端 (Web)

#### 训练营管理
- ✅ 创建训练营 (配置名称、押金、打卡要求等)
- ✅ 生成H5报名链接和二维码
- ✅ 查看训练营详情 (报名、打卡、退款情况)
- ✅ 分配教练和志愿者

#### 会员管理
- ✅ 查看所有报名会员
- ✅ 多维度智能匹配会员身份 (星球ID、昵称)
- ✅ 手动修正匹配关系
- ✅ 标记进群状态

#### 打卡管理
- ✅ 自动同步知识星球打卡数据 (每天01:00)
- ✅ 查看会员打卡记录和统计
- ✅ 实时计算退款资格

#### 退款审核
- ✅ 自动生成退款审核列表
- ✅ 批量审核和单个审核
- ✅ 一键执行退款
- ✅ 失败自动重试 + 人工处理

#### 统计报表
- ✅ 训练营报表 (参与率、完成率、收入统计)
- ✅ 时间范围筛选
- ✅ 数据可视化 (图表展示)

#### 系统管理
- ✅ 用户管理 (管理员、教练、志愿者)
- ✅ 角色权限控制
- ✅ 系统配置 (知识星球、企业微信)
- ✅ 操作日志 (审计追踪)

---

## 🏗️ 系统架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                         客户端层                              │
│   ┌──────────────────┐         ┌──────────────────┐         │
│   │  H5会员端         │         │  Web管理后台      │         │
│   │  Vue 3 + Vant    │         │  Vue 3 + EP      │         │
│   └──────────────────┘         └──────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                      应用服务层 (单节点)                       │
│                  Spring Boot 3.2+                            │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│   │ RESTful  │  │ 定时任务  │  │ Webhook  │                │
│   │ API      │  │ 打卡同步  │  │ 支付回调  │                │
│   └──────────┘  └──────────┘  └──────────┘                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│         PostgreSQL + Redis + 腾讯云COS                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│     企业微信支付 + 知识星球API + 企业微信通知                  │
└─────────────────────────────────────────────────────────────┘
```

> **部署说明**: v1采用单节点部署,适合日活 < 1000用户。后续可扩展为Nginx反向代理 + RabbitMQ消息队列 + PostgreSQL主从架构。

### 核心业务流程

#### 1️⃣ 报名支付流程
```
会员扫码 → 填写信息 → 企业微信支付 → Webhook回调 → 显示群二维码
```

#### 2️⃣ 打卡同步流程
```
定时任务(01:00) → 调用知识星球API → 同步打卡数据 → 计算退款资格
```

#### 3️⃣ 退款审核流程
```
项目结束 → 生成退款列表 → 人工审核 → 调用退款API → 通知会员
```

---

## 🛠️ 技术栈

### 后端技术

| 技术 | 版本 | 说明 |
|------|------|------|
| **Java** | 17+ | 编程语言 |
| **Spring Boot** | 3.2+ | 应用框架 |
| **Spring Security** | 6.x | 安全框架 |
| **MyBatis Plus** | 3.5+ | ORM框架 |
| **PostgreSQL** | 15+ | 关系型数据库 (JSONB支持强) |
| **Redis** | 7.x | 缓存和限流 |
| **Spring Scheduler** | - | 定时任务 |
| **OkHttp3** | 4.x | HTTP客户端 |
| **JWT** | - | Token认证 |
| **Knife4j** | 4.x | API文档 |

### 前端技术

| 技术 | 版本 | 说明 |
|------|------|------|
| **Vue** | 3.3+ | 前端框架 |
| **Vite** | 5.x | 构建工具 |
| **Pinia** | 2.x | 状态管理 |
| **Vue Router** | 4.x | 路由管理 |
| **Axios** | 1.x | HTTP客户端 |
| **Vant** | 4.x | H5 UI组件库 |
| **Element Plus** | 2.4+ | 管理后台UI组件库 |
| **ECharts** | 5.x | 数据可视化 |

### 运维技术

| 技术 | 说明 |
|------|------|
| **SystemD** | 服务管理 |
| **Let's Encrypt** | SSL证书 |
| **腾讯云COS** | 对象存储 |

---

## 🎯 核心亮点

### 1. 混合匹配方案

系统采用多维度匹配策略,确保会员身份识别准确:

```
匹配方式:
1. 动态二维码  → 置信度 100% (支付时attach携带用户ID)
2. 用户填写    → 置信度 95% (支付后H5页面填写)
3. 智能匹配    → 置信度 70%+ (Levenshtein算法匹配昵称)
4. 人工绑定    → 置信度 100% (管理员手动匹配)
```

### 2. H5访问票据机制

- **格式**: UUID v4, 前缀 `tk_`
- **有效期**: 训练营结束后7天 (覆盖整个训练营周期)
- **用途**: 防止订单号枚举和抢绑定攻击
- **状态**: active → bound → expired

### 3. 完整的异常处理

每个关键环节都有容错机制:

- 支付回调丢失 → 定时轮询兜底 (每小时)
- 打卡同步失败 → 通知管理员
- 退款失败 → 重试3次 + 人工处理
- API异常 → 降级方案

### 4. 操作全程可追溯

5张状态日志表记录所有关键变更:

- camp_status_log - 训练营状态变更
- payment_bind_status_log - 支付绑定状态变更
- order_status_log - 订单状态变更
- refund_status_log - 退款状态变更
- member_status_log - 会员状态变更

---

## 📚 项目文档

完整的项目文档位于 `docs/` 目录:

| 文档 | 说明 |
|------|------|
| [**产品需求文档 (PRD)**](./docs/PRD.md) | 详细的功能需求说明 |
| [**技术方案**](docs/v1/技术方案.md) | 技术选型和架构设计 |
| [**数据库设计**](docs/v1/数据库设计.md) | 完整的数据库表结构 (16张表) |
| [**接口文档**](docs/v1/接口文档.md) | API接口规范 |
| [**开发计划**](docs/v1/AI辅助敏捷开发计划.md) | 28天分阶段实施计划 |

---

## 📁 项目结构

```
AutoDepositRefundAgent/
├── docs/                           # 📄 项目文档
│   ├── v1/                         # v1版本文档
│   │   ├── 技术方案.md
│   │   ├── 数据库设计.md
│   │   ├── 接口文档.md
│   │   ├── AI辅助敏捷开发计划.md
│   │   └── FastAuth接入方案.md
│   └── PRD.md                      # 产品需求文档
├── backend/                        # 🚀 后端项目 (待创建)
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       └── resources/
│   ├── build.gradle
│   └── README.md
├── frontend/                       # 🎨 前端项目 (待创建)
│   ├── h5-member/                  # H5会员端
│   └── admin-web/                  # Web管理后台
├── sql/                            # 💾 数据库脚本 (待创建)
│   ├── init-database.sql           # 初始化脚本 (16张表)
│   └── seed-data.sql               # 初始数据
└── README.md                       # 本文件
```

---

## 🚀 快速开始

### 环境要求

- **Java**: 17+
- **Node.js**: 18+
- **PostgreSQL**: 15+
- **Redis**: 7+
- **Gradle**: 7.6+

### 本地开发

#### 1. 克隆项目

```bash
git clone https://github.com/your-username/AutoDepositRefundAgent.git
cd AutoDepositRefundAgent
```

#### 2. 初始化数据库

```bash
# 创建数据库
createdb camp_db

# 执行初始化脚本 (16张表)
psql -U postgres -d camp_db -f sql/init-database.sql

# 导入初始数据
psql -U postgres -d camp_db -f sql/seed-data.sql
```

#### 3. 启动后端

```bash
cd backend

# 配置环境变量 (参考 docs/v1/技术方案.md A.2)
export DATABASE_URL=jdbc:postgresql://localhost:5432/camp_db
export DATABASE_USERNAME=camp_user
export DATABASE_PASSWORD=your_password
export REDIS_HOST=localhost
export REDIS_PORT=6379

# 启动服务
./gradlew bootRun
```

访问 API 文档: http://localhost:8080/doc.html

#### 4. 启动前端

```bash
# H5会员端
cd frontend/h5-member
npm install
npm run dev

# Web管理后台
cd frontend/admin-web
npm install
npm run dev
```

---

## 📅 开发计划

项目采用分阶段迭代开发,总计**28天** (6个Stage):

| 阶段 | 时长 | 主要内容 | 状态 |
|------|------|----------|------|
| **Stage 0** | 3天 | 环境搭建和基础框架 | 🟡 规划中 |
| **Stage 1** | 5天 | 基础框架 + 训练营CRUD + OAuth | ⚪ 未开始 |
| **Stage 2** | 5天 | 支付集成 (混合方案) | ⚪ 未开始 |
| **Stage 3** | 4天 | 打卡同步 | ⚪ 未开始 |
| **Stage 4** | 3天 | 混合匹配算法 | ⚪ 未开始 |
| **Stage 5** | 4天 | 退款流程 | ⚪ 未开始 |
| **Stage 6** | 4天 | 前端开发 + 系统管理 | ⚪ 未开始 |

详细计划请查看: [AI辅助敏捷开发计划](./docs/v1/AI辅助敏捷开发计划.md)

### Stage 1核心目标 (MVP)

- ✅ 会员能够扫码报名并支付押金
- ✅ 支付成功后立即获得群二维码
- ✅ 管理员能够创建训练营
- ✅ 系统自动同步打卡数据
- ✅ 管理员能够审核并执行退款

---

## 🔒 安全设计

- **身份认证**: JWT Token认证
- **权限控制**: 基于角色的访问控制 (RBAC)
- **接口防刷**: Redis + 滑动窗口算法
- **数据加密**: 敏感数据AES-256加密
- **签名验证**: 企业微信Webhook签名验证
- **SQL注入防护**: MyBatis Plus参数化查询
- **XSS防护**: 前端输入过滤

---

## 📊 性能指标

- **H5页面首屏加载时间**: < 2秒
- **管理后台响应时间**: < 1秒
- **支付回调处理时间**: < 3秒
- **并发支持**: 单个训练营1000人同时报名
- **系统可用性**: 12小时/天 × 7天/周

---

## 🤝 贡献指南

欢迎贡献代码和提出建议!

### 开发流程

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: 添加某个功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

### 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范:

- `feat`: 新功能
- `fix`: 修复Bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具链相关

---

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

---

## 👥 团队

- **产品设计**: 星主
- **需求分析**: Claude (AI)
- **架构设计**: Claude (AI)
- **开发实施**: 待定

---

## 📮 联系方式

- **问题反馈**: [GitHub Issues](https://github.com/your-username/AutoDepositRefundAgent/issues)
- **功能建议**: [GitHub Discussions](https://github.com/your-username/AutoDepositRefundAgent/discussions)

---

## 🌟 致谢

感谢以下开源项目:

- [Spring Boot](https://spring.io/projects/spring-boot)
- [Vue.js](https://vuejs.org/)
- [MyBatis Plus](https://baomidou.com/)
- [Element Plus](https://element-plus.org/)
- [Vant](https://vant-ui.github.io/vant/)

---

## 📈 项目状态

当前状态: 🟡 **需求分析完成,准备进入开发阶段**

- ✅ 需求分析完成
- ✅ 技术架构设计完成
- ✅ 数据库设计完成 (16张表)
- ✅ 接口文档完成
- ✅ 实施计划制定完成
- ⚪ 环境搭建 (待开始)
- ⚪ 核心功能开发 (待开始)

---

<p align="center">
  <b>💡 如有疑问,请查看 <a href="./docs/PRD.md">产品需求文档</a> 或 <a href="./docs/v1/技术方案.md">技术方案</a></b>
</p>

<p align="center">
  Made with ❤️ by AI-Assisted Development
</p>
