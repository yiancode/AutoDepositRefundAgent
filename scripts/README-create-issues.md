# GitHub Issues 创建指南

本目录包含用于批量创建 v1 设计优化 GitHub Issues 的脚本。

## 方式一：使用自动化脚本（推荐）

### 前置条件

1. **安装 GitHub CLI**

```bash
# macOS
brew install gh

# 其他平台
# 见: https://cli.github.com/manual/installation
```

2. **登录 GitHub**

```bash
gh auth login
# 按提示选择: GitHub.com → HTTPS → 使用 Web 浏览器登录
```

3. **验证登录状态**

```bash
gh auth status
# 应显示: ✓ Logged in to github.com as <your-username>
```

### 执行脚本

```bash
cd /Users/stinglong/code/github/AutoDepositRefundAgent/scripts

# 添加执行权限
chmod +x create-optimization-issues.sh

# 执行脚本
./create-optimization-issues.sh
```

### 预期输出

```
🚀 开始创建 v1 设计优化 GitHub Issues...
✅ gh CLI 检查通过

📋 创建 P0 阻塞性问题...
✅ P0-1 创建成功
✅ P0-2 创建成功
✅ P0-3 创建成功

📋 创建 P1 高风险问题...
✅ P1-1 创建成功
✅ P1-2 创建成功
✅ P1-3 创建成功
✅ P1-4 创建成功

📋 创建 P2 优化机会（精选）...
✅ P2-1 创建成功
✅ P2-2 创建成功
✅ P2-3 创建成功

✅ GitHub Issues 创建完成！

📊 创建统计:
  - 🔴 P0 阻塞性问题: 3 个
  - 🟠 P1 高风险问题: 4 个
  - 🟡 P2 优化机会: 3 个
  - 总计: 10 个 Issues
```

## 方式二：手动创建（备用）

如果无法使用 GitHub CLI，可以手动在 GitHub 网页创建 Issues。

### 创建 Milestone

首先在 GitHub 仓库创建以下 Milestones：
- `Stage 0`
- `Stage 1`

### 创建 Labels

创建以下标签（Settings → Labels）：
- `P0-阻塞` (颜色: #d73a4a)
- `P1-高优先级` (颜色: #ff9800)
- `P2-优化` (颜色: #ffc107)
- `documentation` (颜色: #0075ca)
- `architecture` (颜色: #5319e7)
- `security` (颜色: #b60205)
- `performance` (颜色: #d93f0b)
- `developer-experience` (颜色: #0e8a16)
- `api-design` (颜色: #1d76db)
- `monitoring` (颜色: #fbca04)
- `Stage-0` (颜色: #c2e0c6)
- `Stage-1` (颜色: #bfdadc)

### 手动创建 Issues

查看 `create-optimization-issues.sh` 文件，复制每个 Issue 的内容（`--title` 和 `--body` 部分），在 GitHub 网页手动创建。

## 已创建的 Issues 清单

### 🔴 P0 - 阻塞性问题（必须在 Stage 0 前完成）

1. **[P0] 补充 EP02-会员报名与支付 用户故事文档**
   - Labels: `P0-阻塞`, `documentation`, `Stage-0`
   - 工作量: 4h

2. **[P0] 明确 FastAuth/OAuth 会员验证流程和数据写入时序**
   - Labels: `P0-阻塞`, `architecture`, `Stage-0`
   - 工作量: 4h

3. **[P0] 统一 bind_status 状态定义**
   - Labels: `P0-阻塞`, `documentation`, `Stage-0`
   - 工作量: 2h

### 🟠 P1 - 高风险问题（Stage 1 前完成）

4. **[P1] 评审并调整 Stage 规划为垂直切片模式**
   - Labels: `P1-高优先级`, `architecture`, `Stage-0`
   - 工作量: 4h

5. **[P1] 优化接口/数据库耦合，引入缓存层防止性能瓶颈**
   - Labels: `P1-高优先级`, `performance`, `Stage-1`
   - 工作量: 16h（按需执行）

6. **[P1] 支付安全增强：防重放 + 幂等性 + 前端失败补偿**
   - Labels: `P1-高优先级`, `security`, `Stage-1`
   - 工作量: 8h

7. **[P1] 补充 OAuth 绑定完整时序图到技术方案**
   - Labels: `P1-高优先级`, `documentation`, `architecture`, `Stage-0`
   - 工作量: 2h

### 🟡 P2 - 优化机会（开发中迭代）

8. **[P2] 补充业务监控指标体系（Layer 3-5）**
   - Labels: `P2-优化`, `monitoring`, `Stage-1`
   - 工作量: 6h

9. **[P2] 搭建 Docker Compose 一键启动开发环境**
   - Labels: `P2-优化`, `developer-experience`, `Stage-0`
   - 工作量: 4h

10. **[P2] 制定 API 命名规范并优化现有接口设计**
    - Labels: `P2-优化`, `api-design`, `Stage-0`
    - 工作量: 8h

## 管理 Issues

### 查看 Issues

```bash
# 查看所有优化相关 Issues
gh issue list --label "P0-阻塞,P1-高优先级,P2-优化"

# 按优先级查看
gh issue list --label "P0-阻塞"
gh issue list --label "P1-高优先级"

# 按 Milestone 查看
gh issue list --milestone "Stage 0"
```

### 分配 Issue

```bash
# 分配给自己
gh issue edit <issue-number> --add-assignee @me

# 分配给其他人
gh issue edit <issue-number> --add-assignee username
```

### 更新 Issue 状态

```bash
# 添加评论
gh issue comment <issue-number> --body "已完成 XX 部分"

# 关闭 Issue
gh issue close <issue-number> --comment "已完成并测试通过"

# 重新打开
gh issue reopen <issue-number>
```

### 创建 Project Board（看板）

```bash
# 在 GitHub 网页创建 Project
# Settings → Projects → New Project → "v1 设计优化"

# 添加 Issues 到 Project
gh issue edit <issue-number> --add-project "v1 设计优化"
```

## 工作流建议

### Stage 0 启动前检查清单

```bash
# 1. 确认所有 P0 Issues 已关闭
gh issue list --label "P0-阻塞" --state open
# 应返回空列表

# 2. 查看 P1 Issues 进度
gh issue list --label "P1-高优先级" --milestone "Stage 0"
```

### 每周进度汇报

```bash
# 统计已完成 Issues
gh issue list --state closed --milestone "Stage 0" --json number,title,closedAt

# 统计进行中 Issues
gh issue list --state open --assignee @me
```

## 常见问题

### Q: 脚本执行失败，提示 "command not found: gh"

**A**: 请先安装 GitHub CLI：
```bash
brew install gh
```

### Q: 提示 "authentication required"

**A**: 请先登录 GitHub：
```bash
gh auth login
```

### Q: 如何修改 Issue 内容？

**A**: 可以使用以下命令：
```bash
gh issue edit <issue-number> --title "新标题"
gh issue edit <issue-number> --body "$(cat new-body.md)"
```

或直接在 GitHub 网页编辑。

### Q: 如何删除错误创建的 Issue？

**A**: GitHub 不允许删除 Issue，但可以关闭并添加说明：
```bash
gh issue close <issue-number> --comment "此 Issue 创建错误，已废弃"
```

## 参考文档

- GitHub CLI 官方文档: https://cli.github.com/manual/
- 优化决策详细方案: `../docs/v1/设计优化决策文档.md`
- 管理层决策摘要: `../docs/v1/管理层决策摘要.md`
