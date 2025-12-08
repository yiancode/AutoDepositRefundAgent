# v1 版本文档索引

> **文档原则**：单一数据源（SSOT）+ 分类清晰 + 明确引用关系

---

## 📁 目录结构

```
docs/v1/
├── README.md                 # 本文件 - 文档索引
├── design/                   # 📐 设计文档
├── api/                      # 📡 接口文档
├── security/                 # 🔐 安全方案
├── guides/                   # 📖 开发指南
├── user-stories/             # 📝 用户故事
├── diagrams/                 # 📊 图表
├── templates/                # 📋 模板
└── archive/                  # 🗄️ 归档
```

---

## 📐 设计文档 (`design/`)

| 文档 | 用途 | 大小 |
|------|------|------|
| [技术方案.md](./design/技术方案.md) | 系统整体技术方案 | 117KB |
| [数据库设计.md](./design/数据库设计.md) | 16张表设计 + 索引优化 | 85KB |
| [API设计规范.md](./design/API设计规范.md) | RESTful 规范、错误码设计 | 13KB |
| [前端路由设计.md](./design/前端路由设计.md) | 前端路由架构 | 13KB |
| [状态枚举定义.md](./design/状态枚举定义.md) | **所有状态枚举的唯一定义（SSOT）** | 15KB |

---

## 📡 接口文档 (`api/`)

| 文档 | 用途 | 大小 |
|------|------|------|
| [接口文档.md](./api/接口文档.md) | RESTful API 接口定义 | 76KB |

---

## 🔐 安全方案 (`security/`)

| 文档 | 用途 | 大小 |
|------|------|------|
| [OAuth安全指南.md](./security/OAuth安全指南.md) | OAuth 安全实践 | 13KB |
| [支付安全增强方案.md](./security/支付安全增强方案.md) | 签名验证、幂等性、Ticket 机制 | 17KB |

---

## 📖 开发指南 (`guides/`)

> 前缀说明：`dev-` 开发相关 | `ops-` 运维相关 | `user-` 用户手册

| 文档 | 用途 | 大小 |
|------|------|------|
| [dev-AI辅助敏捷开发计划.md](./guides/dev-AI辅助敏捷开发计划.md) | Stage 划分 + AI 提示词 | 44KB |
| [dev-开发前准备清单.md](./guides/dev-开发前准备清单.md) | 环境配置 + 工具安装 | 36KB |
| [dev-Stage1-支付闭环实施指南.md](./guides/dev-Stage1-支付闭环实施指南.md) | Stage 1 详细实施计划 | 11KB |
| [dev-缓存策略与性能优化.md](./guides/dev-缓存策略与性能优化.md) | Redis 缓存 + 数据库优化 | 10KB |
| [ops-监控指标体系.md](./guides/ops-监控指标体系.md) | 5 层监控指标 + 告警策略 | 10KB |
| [user-管理后台操作指南.md](./guides/user-管理后台操作指南.md) | 后台使用说明 | 11KB |

---

## 📝 用户故事 (`user-stories/`)

| 文档 | 对应 Epic | 状态 |
|------|----------|------|
| [EP01-训练营管理.md](./user-stories/EP01-训练营管理.md) | 训练营 CRUD | ✅ 完成 |
| [EP02-会员报名与支付.md](./user-stories/EP02-会员报名与支付.md) | 支付闭环（S2.1-S2.7） | ✅ 完成 |
| [EP03-打卡数据同步.md](./user-stories/EP03-打卡数据同步.md) | 打卡同步 | ✅ 完成 |
| [EP04-身份匹配.md](./user-stories/EP04-身份匹配.md) | 人工审核 | ✅ 完成 |
| [EP05-退款审核.md](./user-stories/EP05-退款审核.md) | 退款流程 | ✅ 完成 |
| [EP06-统计报表.md](./user-stories/EP06-统计报表.md) | 数据统计 | ✅ 完成 |

---

## 📊 图表 (`diagrams/`)

| 文档 | 用途 |
|------|------|
| [架构设计图.md](./diagrams/架构设计图.md) | 系统架构图 |
| [业务流程图.md](./diagrams/业务流程图.md) | 核心业务流程 |
| [状态机.md](./diagrams/状态机.md) | 状态转换图 |
| [时序图.md](./diagrams/时序图.md) | 交互时序 |
| [用户旅程图.md](./diagrams/用户旅程图.md) | 用户体验旅程 |
| [OAuth绑定完整时序图.md](./diagrams/OAuth绑定完整时序图.md) | OAuth 到支付绑定 77 步时序 |

---

## 📋 模板 (`templates/`)

| 模板 | 用途 |
|------|------|
| [README.md](./templates/README.md) | 模板使用说明 |
| [ADR-TEMPLATE.md](./templates/ADR-TEMPLATE.md) | 架构决策记录模板 |
| [EPIC-TEMPLATE.md](./templates/EPIC-TEMPLATE.md) | Epic 文档模板 |
| [TECH-DESIGN-TEMPLATE.md](./templates/TECH-DESIGN-TEMPLATE.md) | 技术设计文档模板 |
| [GUIDE-TEMPLATE.md](./templates/GUIDE-TEMPLATE.md) | 指南文档模板 |

---

## 🗄️ 归档 (`archive/`)

| 文档 | 说明 |
|------|------|
| [dev-文档评估指南.md](./archive/dev-文档评估指南.md) | 开发前文档评估顺序 + 检查清单 |
| [dev-文档评估问题清单.md](./archive/dev-文档评估问题清单.md) | 文档一致性问题记录 |
| [优化完成总结.md](./archive/优化完成总结.md) | 历史优化记录 |
| [FastAuth接入方案.md](./archive/FastAuth接入方案.md) | OAuth 认证方案详细设计（技术方案仍引用其章节） |
| [BMAD-METHOD使用指南.md](./archive/BMAD-METHOD使用指南.md) | 方法论参考 |
| [技术方案模板/](./archive/技术方案模板/) | 旧版模板（含示例图片） |

---

## 🔗 文档引用关系

### 单一数据源（SSOT）原则

| 数据类型 | 唯一定义位置 | 说明 |
|---------|------------|------|
| **状态枚举** | `design/状态枚举定义.md` | 其他文档引用，不重复定义 |
| **OAuth 时序** | `diagrams/OAuth绑定完整时序图.md` | 其他文档引用章节 |
| **支付安全** | `security/支付安全增强方案.md` | 其他文档引用章节 |
| **API 规范** | `design/API设计规范.md` | 其他文档引用章节 |
| **监控指标** | `guides/ops-监控指标体系.md` | 其他文档引用章节 |

### 核心引用链

```
design/技术方案.md (系统设计)
    ├─→ design/数据库设计.md (数据层)
    ├─→ api/接口文档.md (接口层)
    └─→ diagrams/OAuth绑定完整时序图.md (认证层)

user-stories/EP02-会员报名与支付.md (业务需求)
    ├─→ diagrams/OAuth绑定完整时序图.md (详细时序)
    ├─→ security/支付安全增强方案.md (安全实施)
    └─→ design/状态枚举定义.md (状态规范)

guides/dev-Stage1-支付闭环实施指南.md (实施计划)
    ├─→ user-stories/EP02-会员报名与支付.md (业务需求)
    ├─→ diagrams/OAuth绑定完整时序图.md (技术细节)
    └─→ design/API设计规范.md (接口规范)
```

---

## 🚀 快速导航

### 场景 1：开始新功能开发

1. 查看 [dev-AI辅助敏捷开发计划](./guides/dev-AI辅助敏捷开发计划.md) - 了解当前 Stage
2. 查看对应实施指南（如 [dev-Stage1-支付闭环实施指南](./guides/dev-Stage1-支付闭环实施指南.md)）
3. 参考对应用户故事（如 [EP02-会员报名与支付](./user-stories/EP02-会员报名与支付.md)）

### 场景 2：接口设计

1. 遵循 [API设计规范](./design/API设计规范.md)
2. 参考 [接口文档](./api/接口文档.md) - 已有接口示例
3. 使用 [状态枚举定义](./design/状态枚举定义.md) - 状态值规范

### 场景 3：数据库设计

1. 参考 [数据库设计](./design/数据库设计.md) - 16 张表设计
2. 应用 [dev-缓存策略与性能优化](./guides/dev-缓存策略与性能优化.md)

### 场景 4：安全评审

1. 检查 [支付安全增强方案](./security/支付安全增强方案.md)
2. 检查 [OAuth安全指南](./security/OAuth安全指南.md)

### 场景 5：运维部署

1. 使用 [dev-开发前准备清单](./guides/dev-开发前准备清单.md) - 环境配置
2. 配置 [ops-监控指标体系](./guides/ops-监控指标体系.md) - 监控告警

---

## 📊 文档统计

| 分类 | 数量 | 总大小 |
|------|------|--------|
| 设计文档 | 5 | ~209KB |
| 接口文档 | 1 | ~77KB |
| 安全方案 | 2 | ~31KB |
| 开发指南 | 6 | ~122KB |
| 用户故事 | 6 | ~92KB |
| 图表 | 6 | ~97KB |
| 模板 | 5 | ~9KB |
| 归档 | 8 | ~117KB |
| 根目录 | 2 | ~10KB |
| **合计** | **41** | **~764KB** |

---

**索引版本**：v2.5
**最后更新**：2025-12-08
**维护者**：技术架构组
