# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 目录概述

这是**知识星球训练营自动押金退款系统 v1 版本**的文档目录，包含设计文档、API 规范、用户故事等。本目录是纯文档项目，不包含可执行代码。

**完整项目根目录**: `../..` (包含 `backend/`, `frontend/`, `zsxq-api/` 等)

## 文档结构

```
docs/v1/
├── design/          # 设计文档（技术方案、数据库、状态枚举）
├── api/             # RESTful API 接口定义
├── security/        # 安全方案（OAuth、支付安全）
├── guides/          # 开发/运维指南
├── user-stories/    # 6个 Epic 的用户故事（EP01-EP06）
├── diagrams/        # 架构图、流程图、时序图
├── templates/       # 文档模板（ADR、Epic、技术设计）
└── archive/         # 归档文档
```

## 单一数据源（SSOT）

| 数据类型 | 唯一定义位置 |
|---------|------------|
| 状态枚举 | `design/状态枚举定义.md` |
| API 规范 | `design/API设计规范.md` |
| 支付安全 | `security/支付安全增强方案.md` |
| OAuth 时序 | `diagrams/OAuth绑定完整时序图.md` |
| 监控指标 | `guides/ops-监控指标体系.md` |

## 文档编辑规范

### 必须遵守

1. **引用而非复制** - 使用链接引用其他文档，避免重复定义
2. **状态枚举** - 所有状态值必须引用 `design/状态枚举定义.md`
3. **Markdown 格式** - 使用标准 Markdown，支持 Mermaid 图表
4. **命名前缀** - 指南文档使用 `dev-`/`ops-`/`user-` 前缀

### 禁止事项

- 在多处重复定义相同的状态枚举或常量
- 创建与现有文档内容重复的新文档
- 修改 `archive/` 目录下的归档文档

## 关键文档

| 场景 | 首先阅读 |
|------|----------|
| 开始开发 | `guides/dev-AI辅助敏捷开发计划.md` |
| 接口设计 | `design/API设计规范.md` + `api/接口文档.md` |
| 数据库变更 | `design/数据库设计.md` |
| 安全评审 | `security/支付安全增强方案.md` |

## 自定义指令

本目录配置了文档评估相关的 Claude Code 指令：

| 指令 | 用途 |
|------|------|
| `/evaluate-next` | 评估下一个待评估文档并自动提交 |
| `/evaluate-batch` | 批量评估所有待评估文档 |
| `/evaluate-parallel` | 并行评估多个文档 |

## 文档版本

- **索引版本**: v2.5
- **技术栈**: Java 17 + Spring Boot 3.2 + PostgreSQL 15 + Vue 3
- **详细索引**: 查看 `README.md`