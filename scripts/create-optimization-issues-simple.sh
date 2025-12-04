#!/bin/bash

# v1 设计优化 GitHub Issues 创建脚本（简化版，无 Milestone）
# 使用前请确保已安装并登录 gh CLI

set -e

echo "🚀 开始创建 v1 设计优化 GitHub Issues..."
echo ""

# 检查 gh CLI 是否已安装和登录
if ! command -v gh &> /dev/null; then
    echo "❌ 错误: gh CLI 未安装"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo "❌ 错误: gh CLI 未登录"
    exit 1
fi

echo "✅ gh CLI 检查通过"
echo ""

# ============================================
# 🔴 P0 - 阻塞性问题
# ============================================

echo "📋 创建 P0 阻塞性问题..."

# P0-1
gh issue create \
  --title "[P0] 补充 EP02-会员报名与支付 用户故事文档" \
  --label "P0-阻塞,documentation,Stage-0" \
  --body "## 问题描述

\`docs/v1/user-stories/EP02-会员报名与支付.md\` 文件不存在，导致核心支付流程缺少 Gherkin 验收标准。

## 影响范围

- 🎯 业务流程：支付绑定路径、OAuth集成、AccessToken机制
- 👨‍💻 开发团队：前后端对接口理解可能不一致
- 🧪 测试验收：无明确验收条件

## 任务清单

- [ ] 产品负责人编写 S2.1-S2.7 用户故事草稿
- [ ] 技术负责人补充技术约束和边界条件
- [ ] 前后端评审确认验收标准

## 预计工作量

⏱️ 4 小时

## 参考文档

- EP01 示例: \`docs/v1/user-stories/EP01-训练营管理.md\`
- 详细方案: \`docs/v1/设计优化决策文档.md#p0-1\`"

echo "✅ P0-1 创建成功"

# P0-2
gh issue create \
  --title "[P0] 明确 FastAuth/OAuth 会员验证流程和数据写入时序" \
  --label "P0-阻塞,architecture,Stage-0" \
  --body "## 问题描述

OAuth 完成后如何写入 \`user_planet_binding\` 表的流程不明确。

## 任务清单

- [ ] 在技术方案中补充完整时序图
- [ ] 在接口文档中明确 \`/api/auth/callback\` 的绑定逻辑
- [ ] 在数据库设计中说明各表的数据来源

## 预计工作量

⏱️ 4 小时

## 参考文档

- 详细时序图: \`docs/v1/设计优化决策文档.md#p1-4\`"

echo "✅ P0-2 创建成功"

# P0-3
gh issue create \
  --title "[P0] 统一 bind_status 状态定义" \
  --label "P0-阻塞,documentation,Stage-0" \
  --body "## 问题描述

\`bind_status\` 状态定义在不同文档中不一致。

## 任务清单

- [ ] 全局搜索替换 \`\"success\"\` → \`\"completed\"\`
- [ ] 在技术方案中增加状态机图例
- [ ] 在接口文档中添加状态枚举说明章节
- [ ] 前端同步修改状态枚举常量

## 预计工作量

⏱️ 2 小时

## 参考文档

- 优化方案: \`docs/v1/设计优化决策文档.md#p0-3\`"

echo "✅ P0-3 创建成功"
echo ""

# ============================================
# 🟠 P1 - 高风险问题
# ============================================

echo "📋 创建 P1 高风险问题..."

# P1-1
gh issue create \
  --title "[P1] 评审并调整 Stage 规划为垂直切片模式" \
  --label "P1-高优先级,architecture,Stage-0" \
  --body "## 问题描述

当前 Stage 1 规划违背\"先做低依赖垂直切片\"原则。

## 建议调整

**新 Stage 1**: 支付闭环 MVP（用户报名→支付→绑定）

## 任务清单

- [ ] 召开技术评审会
- [ ] 更新 \`AI辅助敏捷开发计划.md\`
- [ ] 更新 \`技术方案.md\`

## 预计工作量

⏱️ 4 小时

## 参考文档

- 详细方案: \`docs/v1/设计优化决策文档.md#p1-1\`
- 管理层摘要: \`docs/v1/管理层决策摘要.md\`"

echo "✅ P1-1 创建成功"

# P1-2
gh issue create \
  --title "[P1] 优化接口/数据库耦合，引入缓存层" \
  --label "P1-高优先级,performance,Stage-1" \
  --body "## 问题描述

接口需要 JOIN 3 张表，存在性能风险。

## 推荐方案

引入 Redis 缓存 + 数据冗余

## 实施时机

⏰ 按需执行（监控 P99 > 2s 或 QPS > 100 时）

## 预计工作量

⏱️ 16 小时

## 参考文档

- 详细方案: \`docs/v1/设计优化决策文档.md#p1-2\`"

echo "✅ P1-2 创建成功"

# P1-3
gh issue create \
  --title "[P1] 支付安全增强：防重放 + 幂等性" \
  --label "P1-高优先级,security,Stage-1" \
  --body "## 问题描述

支付回调缺少时间窗口验证和幂等性检查。

## 任务清单

- [ ] 实现支付回调时间窗口验证（5分钟）
- [ ] 实现 Redis 幂等性检查
- [ ] 添加数据库唯一约束
- [ ] 实现一次性 ticket 机制

## 预计工作量

⏱️ 8 小时

## 参考文档

- 详细方案: \`docs/v1/设计优化决策文档.md#p1-3\`"

echo "✅ P1-3 创建成功"

# P1-4
gh issue create \
  --title "[P1] 补充 OAuth 绑定完整时序图" \
  --label "P1-高优先级,documentation,architecture,Stage-0" \
  --body "## 问题描述

需要完整时序图展示支付→OAuth→绑定全流程。

## 任务清单

- [ ] 绘制完整 Mermaid 时序图
- [ ] 补充到技术方案文档
- [ ] 在接口文档中引用
- [ ] 明确各表数据来源

## 预计工作量

⏱️ 2 小时

## 参考文档

- 完整时序图: \`docs/v1/设计优化决策文档.md#p1-4\`"

echo "✅ P1-4 创建成功"
echo ""

# ============================================
# 🟡 P2 - 优化机会
# ============================================

echo "📋 创建 P2 优化机会..."

# P2-1
gh issue create \
  --title "[P2] 补充业务监控指标体系（Layer 3-5）" \
  --label "P2-优化,monitoring,Stage-1" \
  --body "## 问题描述

缺少业务指标监控（支付成功率、绑定完成率等）。

## 任务清单

- [ ] 定义 Layer 3-5 监控指标
- [ ] 实现 Prometheus 自定义 Metrics
- [ ] 配置 Grafana 仪表盘
- [ ] 设置告警规则

## 预计工作量

⏱️ 6 小时

## 参考文档

- 详细指标: \`docs/v1/设计优化决策文档.md#p2-1\`"

echo "✅ P2-1 创建成功"

# P2-2
gh issue create \
  --title "[P2] 搭建 Docker Compose 一键启动环境" \
  --label "P2-优化,developer-experience,Stage-0" \
  --body "## 问题描述

新人上手需手动配置环境，成本高。

## 目标

新人第一天即可启动：
\`\`\`bash
docker-compose up -d
./gradlew bootRun
\`\`\`

## 任务清单

- [ ] 创建 \`docker-compose.yml\`
- [ ] 编写数据库初始化脚本
- [ ] 更新 README 快速启动指南

## 预计工作量

⏱️ 4 小时

## 预期收益

新人上手时间: 2天 → 0.5天（↓75%）"

echo "✅ P2-2 创建成功"

# P2-3
gh issue create \
  --title "[P2] 制定 API 命名规范" \
  --label "P2-优化,api-design,Stage-0" \
  --body "## 问题描述

接口设计不符合 RESTful 最佳实践。

## 优化建议

- 复数名词: /camps
- API 版本: /api/v1/...
- 错误响应标准化（RFC 7807）

## 任务清单

- [ ] 制定《API 设计规范文档》
- [ ] 前后端联合评审
- [ ] 更新接口文档

## 预计工作量

⏱️ 8 小时

## 参考文档

- 详细规范: \`docs/v1/设计优化决策文档.md#p2-4\`"

echo "✅ P2-3 创建成功"
echo ""

# ============================================
# 总结
# ============================================

echo "✅ GitHub Issues 创建完成！"
echo ""
echo "📊 创建统计:"
echo "  - 🔴 P0 阻塞性问题: 3 个"
echo "  - 🟠 P1 高风险问题: 4 个"
echo "  - 🟡 P2 优化机会: 3 个"
echo "  - 总计: 10 个 Issues"
echo ""
echo "🔗 查看 Issues:"
echo "  gh issue list --label P0-阻塞,P1-高优先级,P2-优化"
echo ""
echo "💡 后续步骤:"
echo "  1. 在 GitHub 网页手动创建 Milestones: 'Stage 0' 和 'Stage 1'"
echo "  2. 将相应 Issues 添加到对应的 Milestone"
echo "  3. 分配 Issues: gh issue edit <number> --add-assignee @me"
