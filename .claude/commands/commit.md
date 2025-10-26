# 自动提交指令 (/commit)

智能分析当前开发进度，自动生成 Git 提交信息并更新项目文档。

## 任务目标

1. 分析代码变更，生成符合规范的 Git commit 信息
2. 更新开发进度文档 (`docs/开发进度.md`)
3. 更新 CLAUDE.md 的项目状态
4. 执行 Git 提交和推送

## 执行步骤

### 步骤 1: 分析当前变更

执行以下 Git 命令并行获取信息：

```bash
# 获取未暂存的文件变更
git status --short

# 获取详细的 diff
git diff

# 获取已暂存的变更
git diff --staged

# 获取最近 3 次提交历史（用于学习提交风格）
git log -3 --oneline
```

### 步骤 2: 智能分析变更内容

根据 Git diff 分析：

**变更类型判断规则**:
- 新增文件 → `feat` (功能)
- 修改 bug 相关代码/测试 → `fix` (修复)
- 修改文档（.md 文件）→ `docs` (文档)
- 修改测试文件（.test.js/.spec.js）→ `test` (测试)
- 代码重构（无功能变化）→ `refactor` (重构)
- 性能优化 → `perf` (性能)
- 样式调整（CSS/格式化）→ `style` (样式)
- 构建配置变更（package.json/vite.config.js）→ `chore` (构建)

**影响范围判断**:
- `backend/` 目录 → `backend`
- `frontend/h5-member/` → `h5`
- `frontend/admin-web/` → `admin`
- `sql/` → `database`
- `docs/` → `docs`
- 多个目录 → 使用主要影响范围

**生成提交信息格式**:
```
<type>(<scope>): <subject>

<body>

<footer>
```

示例：
```
feat(backend): 实现训练营列表查询接口

- 新增 CampController.getCamps() 方法
- 实现 ZsxqService.fetchCamps() 调用知识星球 API
- 添加 Cookie 验证和错误处理
- 测试覆盖率: 85%

Refs: #1
```

### 步骤 3: 更新开发进度文档

读取或创建 `docs/开发进度.md`，更新内容：

```markdown
# 开发进度跟踪

**最后更新**: {当前时间}
**当前阶段**: {阶段名称}
**总体进度**: {百分比}%

---

## 📅 最近更新 (最近 10 次)

### {日期时间} - {提交类型}

**提交信息**: {commit message subject}

**变更文件**:
- `{文件路径}` - {变更说明}
- `{文件路径}` - {变更说明}

**解决的问题**:
- {问题描述}

**新增功能**:
- {功能描述}

**技术亮点**:
- {亮点说明}

---

## 📊 进度统计

### 后端开发进度 (阶段一)

| 模块 | 进度 | 状态 | 备注 |
|------|------|------|------|
| 用户认证 | 100% | ✅ 已完成 | JWT + Spring Security |
| 训练营管理 | 80% | 🚧 进行中 | CRUD 已完成 |
| 企业微信支付 | 0% | ⏳ 未开始 | |
| 知识星球 API | 60% | 🚧 进行中 | 列表查询已完成 |
| 会员匹配 | 0% | ⏳ 未开始 | |
| 退款管理 | 0% | ⏳ 未开始 | |

### 前端开发进度 (阶段一)

| 模块 | 进度 | 状态 | 备注 |
|------|------|------|------|
| 管理后台-登录 | 100% | ✅ 已完成 | |
| 管理后台-训练营管理 | 50% | 🚧 进行中 | 列表页已完成 |
| H5-训练营列表 | 0% | ⏳ 未开始 | |
| H5-报名页面 | 0% | ⏳ 未开始 | |

---

## 🎯 里程碑

- [x] 阶段零：环境搭建 (Day 0-2) - ✅ {完成日期}
- [ ] 阶段一：核心功能 MVP (Day 3-16) - 🚧 进行中 (已完成 {X}/14 天)
- [ ] 阶段二：数据统计 (Day 17-23) - ⏳ 未开始
- [ ] 阶段三：系统管理 (Day 24-30) - ⏳ 未开始

---

## 📝 开发日志

{保留最近 20 条日志}
```

### 步骤 4: 更新 CLAUDE.md

更新 CLAUDE.md 中的以下部分：

**更新"项目状态"部分**:
```markdown
## 项目状态

🟢 **开发进行中 - {当前阶段}**

**最后更新**: {时间}
**最后提交**: {commit 信息}

**已完成**：
- ✅ {任务1} ({完成日期})
- ✅ {任务2} ({完成日期})

**进行中**：
- 🚧 {任务3} - {进度}%
- 🚧 {任务4} - {进度}%

**待开始**：
- ⚪ {任务5}
- ⚪ {任务6}
```

### 步骤 5: 执行 Git 提交

执行以下命令（按顺序）：

```bash
# 1. 添加所有变更
git add .

# 2. 生成提交（使用 HEREDOC 格式）
git commit -m "$(cat <<'EOF'
{生成的 commit message}
EOF
)"

# 3. 推送到远程仓库
git push origin {当前分支}
```

### 步骤 6: 输出提交摘要

向用户输出：

```
✅ 代码已提交并推送

📝 提交信息:
{commit message subject}

📊 变更统计:
- 修改文件: {数量} 个
- 新增行: +{数量}
- 删除行: -{数量}

📄 更新的文档:
- docs/开发进度.md ✅
- CLAUDE.md ✅

🔗 提交 Hash: {git commit hash}

---

💡 提示:
- 查看详细变更: git show {hash}
- 查看提交历史: git log --oneline
- 撤销提交: git reset --soft HEAD~1
```

## 智能特性

### 1. 自动检测提交类型

示例分析逻辑：

```javascript
// 伪代码
function detectCommitType(files, diffs) {
  if (files.some(f => f.startsWith('backend/') && f.includes('test'))) {
    return 'test';
  }
  if (files.some(f => f.endsWith('.md'))) {
    return 'docs';
  }
  if (diffs.includes('TODO') || diffs.includes('FIXME')) {
    return 'chore';
  }
  if (diffs.includes('fix bug') || diffs.includes('修复')) {
    return 'fix';
  }
  if (files.some(f => f === 'package.json') || files.some(f => f.includes('config'))) {
    return 'chore';
  }
  // 默认是新功能
  return 'feat';
}
```

### 2. 自动关联 Issue

如果提交信息中包含 `#数字`，自动添加 `Refs: #数字` 或 `Closes: #数字`

### 3. 自动生成变更日志

基于提交历史自动生成 `CHANGELOG.md`（可选）

### 4. 防止敏感信息提交

检查以下文件是否被暂存：
- `.env`
- `.env.local`
- `application-prod.yml`
- `**/config/*-prod.yml`
- `**/*secret*`
- `**/*password*`

如果发现，提示用户确认是否继续。

## 错误处理

### 场景 1: 没有变更

```
⚠️ 没有检测到任何变更

运行 'git status' 查看当前状态
```

### 场景 2: 推送失败（远程有新提交）

```
⚠️ 推送失败：远程仓库有新提交

建议操作:
1. 拉取最新代码: git pull --rebase origin {branch}
2. 解决冲突（如果有）
3. 重新运行 /commit
```

### 场景 3: 存在冲突文件

```
⚠️ 检测到未解决的合并冲突

冲突文件:
- {文件路径}

请先解决冲突，然后重新运行 /commit
```

## 触发方式

- 用户输入: `/commit`
- 用户说: "提交代码"、"保存进度"、"提交并推送"

## 配置选项（可选，存储在 .claude/config.json）

```json
{
  "commit": {
    "autoPush": true,              // 是否自动推送
    "updateDocs": true,            // 是否自动更新文档
    "defaultBranch": "main",       // 默认分支
    "requireTests": false,         // 是否要求有测试
    "checkCoverage": false,        // 是否检查测试覆盖率
    "minCoverage": 70,             // 最低覆盖率要求
    "conventionalCommits": true,   // 是否使用 Conventional Commits
    "signCommit": false            // 是否签名提交
  }
}
```

## 示例用法

### 示例 1: 完成一个新功能

```
用户: /commit

Claude:
[分析代码变更...]

检测到以下变更:
- backend/src/controller/CampController.js (新增)
- backend/src/service/ZsxqService.js (新增)
- backend/test/camp.test.js (新增)

变更类型: feat (新功能)
影响范围: backend

生成的提交信息:
---
feat(backend): 实现训练营列表查询接口

- 新增 CampController.getCamps() 方法
- 实现 ZsxqService.fetchCamps() 调用知识星球 API
- 添加 Cookie 验证和错误处理
- 测试覆盖率: 85%
---

是否确认提交? (输入 'yes' 确认，或修改提交信息)

用户: yes

Claude:
✅ 代码已提交并推送
[显示提交摘要...]
```

### 示例 2: 修复 Bug

```
用户: /commit

Claude:
[分析...]

检测到 Bug 修复:
- backend/src/service/PaymentService.js:45 修复空指针异常

生成的提交信息:
---
fix(backend): 修复支付回调空指针异常

当 payment_record 不存在时，PaymentService.handleCallback()
会抛出 NullPointerException。

解决方案：添加空值检查，返回明确的错误信息。

Closes: #15
---

✅ 代码已提交并推送
```

## 注意事项

1. **提交前检查**: 确保代码可以正常运行
2. **测试覆盖**: 建议每次提交包含相应的测试
3. **文档同步**: 如果修改了 API，记得更新 API 文档
4. **敏感信息**: 绝不提交密码、密钥等敏感信息
5. **提交粒度**: 每次提交只做一件事，便于回滚和 Code Review

## 相关指令

- `/commit-undo` - 撤销最后一次提交
- `/commit-amend` - 修改最后一次提交信息
- `/commit-history` - 查看提交历史和统计
