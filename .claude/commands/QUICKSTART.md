# Claude Code 指令快速参考

## ⚡ 最常用的 5 个指令

```bash
/progress          # 查看项目进度
/commit            # 智能提交代码
/bug-search "关键词"  # 搜索已知问题
/review            # 代码审查
/test              # 运行测试
```

---

## 📋 完整指令列表

### 上下文管理
- `/context-transfer` - 保存会话快照（Token 即将耗尽时）

### 进度管理
- `/progress` - 查看整体进度
- `/progress-save [描述]` - 保存进度检查点
- `/progress-load [ID]` - 加载历史检查点
- `/progress-compare` - 对比进度变化

### Git 提交
- `/commit` - 智能提交（自动生成提交信息、更新文档）

### Bug 管理
- `/bug-add` - 记录 Bug
- `/bug-search <关键词>` - 搜索 Bug
- `/bug-list [分类]` - 列出 Bug
- `/bug-stats` - Bug 统计

### 代码审查
- `/review` - 审查当前变更
- `/review-file <路径>` - 审查指定文件

### 测试
- `/test` - 运行所有测试
- `/test-backend` - 运行后端测试
- `/test-frontend` - 运行前端测试

### 其他
- `/refactor` - 代码重构
- `/docs-api` - 生成 API 文档
- `/deploy-dev` - 部署到开发环境
- `/deploy-test` - 部署到测试环境
- `/deploy-prod` - 部署到生产环境

---

## 🔄 典型工作流

```
编写代码 → /review → /test → /commit → /progress
```

---

## 💡 新手入门

1. 查看项目状态: `/progress`
2. 体验智能提交: `/commit`
3. 搜索问题: `/bug-search "关键词"`

---

**详细文档**: 查看 `.claude/commands/README.md`
