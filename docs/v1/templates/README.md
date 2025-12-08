# 文档模板目录

本目录提供标准化的文档模板，用于保持文档格式一致性。

## 可用模板

| 模板 | 用途 | 文件 |
|------|------|------|
| Epic 模板 | 创建新的用户故事集合 | [EPIC-TEMPLATE.md](./EPIC-TEMPLATE.md) |
| 技术设计模板 | 新功能或模块的技术设计 | [TECH-DESIGN-TEMPLATE.md](./TECH-DESIGN-TEMPLATE.md) |
| ADR 模板 | 架构决策记录 | [ADR-TEMPLATE.md](./ADR-TEMPLATE.md) |
| 操作指南模板 | 面向用户的操作说明 | [GUIDE-TEMPLATE.md](./GUIDE-TEMPLATE.md) |

## 使用方法

1. 复制对应模板文件到目标目录
2. 重命名文件（遵循命名规范）
3. 填写模板内容
4. 删除模板中的说明文字（`<!-- ... -->`）

## 命名规范

| 文档类型 | 命名格式 | 示例 |
|----------|----------|------|
| Epic | `EP{编号}-{名称}.md` | `EP07-消息通知.md` |
| 技术设计 | `{功能名称}.md` | `批量退款优化方案.md` |
| ADR | `ADR-{编号}-{标题}.md` | `ADR-001-选择PostgreSQL.md` |
| 开发指南 | `dev-{功能名称}.md` | `dev-缓存策略与性能优化.md` |
| 运维指南 | `ops-{功能名称}.md` | `ops-监控指标体系.md` |
| 用户指南 | `user-{对象}操作指南.md` | `user-管理后台操作指南.md` |

## 文档层级

```
docs/v1/
├── README.md              # 文档索引
├── CLAUDE.md              # Claude Code 指引
├── design/                # 设计文档
│   ├── 技术方案.md
│   ├── 数据库设计.md
│   ├── API设计规范.md
│   ├── 前端路由设计.md
│   └── 状态枚举定义.md     # SSOT
├── api/                   # 接口文档
│   └── 接口文档.md
├── security/              # 安全方案
│   ├── OAuth安全指南.md
│   └── 支付安全增强方案.md
├── guides/                # 开发/运维指南
│   ├── dev-*.md           # 开发指南
│   ├── ops-*.md           # 运维指南
│   └── user-*.md          # 用户指南
├── user-stories/          # 用户故事
│   ├── EP01-训练营管理.md
│   └── ...
├── diagrams/              # 图表文件
├── templates/             # 文档模板（本目录）
└── archive/               # 归档文档
```

---

## 元信息格式规范

所有文档应在标题后使用 blockquote 格式的元信息：

```markdown
# 文档标题

> **文档版本**: v1.0
> **最后更新**: YYYY-MM-DD
> **SSOT引用**: [状态枚举定义.md](../design/状态枚举定义.md) - 相关状态说明

> **文档目的**: 简短描述文档的用途和目标读者
```

---

**维护者**：技术团队
**最后更新**：2025-12-08
