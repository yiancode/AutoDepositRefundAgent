---
description: 保存当前开发进度检查点（优化版）
---

# 保存进度检查点

保存当前开发进度，专门为**恢复上下文**优化，方便下次继续工作。

## 使用方法

```
/progress-save [描述]
```

例如：
```
/progress-save "完成退款导出功能的后端部分"
/progress-save "修复打卡统计 bug，待测试"
```

## 保存内容（结构化）

### 检查点文件格式

保存到 `docs/progress/checkpoints/{checkpoint-id}.md`：

```markdown
# 检查点：{描述}

**ID**: checkpoint-{YYYYMMDD-HHmmss}
**时间**: {ISO 时间戳}
**Git Commit**: {hash} ({branch})

---

## 当前任务

**任务名称**：{正在做的功能/bug}
**任务状态**：{进行中/待测试/已完成}
**完成进度**：{X/Y 步骤}

---

## 工作上下文

### 正在编辑的文件
- `path/to/file1.js` - {简要说明改了什么}
- `path/to/file2.vue` - {简要说明改了什么}

### 已完成的步骤
1. ✅ {步骤1描述}
2. ✅ {步骤2描述}

### 待完成的步骤
3. ⏳ {当前步骤} ← 进行到这里
4. ⬜ {下一步}
5. ⬜ {再下一步}

---

## 关键信息

### 需要记住的决策
- {为什么选择了某个方案}
- {某个特殊处理的原因}

### 遇到的问题
- {问题描述} → {解决方案或待解决}

### 相关文件（恢复时需要读取）
- `zsxq-api/src/services/xxx.service.js`
- `zsxq-web/src/views/Xxx.vue`
- `docs/xxx.md`

---

## 下次继续的指令

复制以下内容开始新会话：

\`\`\`
读一下这个检查点文件：docs/progress/checkpoints/{checkpoint-id}.md

然后读取"相关文件"中列出的源代码，继续完成"待完成的步骤"。
当前进行到：{当前步骤描述}
\`\`\`

---

## 代码统计

- 后端代码：{X} 行
- 前端代码：{Y} 行
- 测试代码：{Z} 行
- 测试覆盖率：{N}%
```

## 执行流程

执行 `/progress-save` 时，Claude 会：

1. **收集 Git 信息**
   ```bash
   git log -1 --format="%h %s"
   git branch --show-current
   ```

2. **分析当前会话**
   - 识别正在进行的任务
   - 列出已编辑/创建的文件
   - 提取关键决策和问题

3. **生成检查点文件**
   - 创建结构化的 markdown 文件
   - 自动生成"下次继续的指令"

4. **更新索引**
   - 更新 `docs/progress/checkpoints/index.md`

## 输出示例

```
✅ 进度检查点已保存

📸 检查点: checkpoint-20250128-143000
📝 描述: 完成退款导出功能的后端部分
📊 进度: 3/5 步骤完成
🔗 Commit: a3f5b2c (main)

💾 文件: docs/progress/checkpoints/checkpoint-20250128-143000.md

---

📋 下次继续时，复制这段话开始新会话：

"读一下检查点文件 docs/progress/checkpoints/checkpoint-20250128-143000.md，
然后读取相关文件，继续完成退款导出功能。当前进行到：添加前端导出按钮"
```

## 使用场景

### 1. 上下文过长时
```
/progress-save "实现到一半，上下文太长"
/clear
# 新会话中
/progress-load checkpoint-20250128-143000
```

### 2. 每日工作结束
```
/progress-save "Day 3 结束，明天继续前端部分"
```

### 3. 切换任务前
```
/progress-save "暂停 A 功能，先处理紧急 bug"
```

### 4. 重大节点
```
/progress-save "v0.2 后端完成，准备开始前端"
```

## 最佳实践

1. **描述要具体**：写清楚"做了什么"和"接下来要做什么"
2. **15 轮必存**：超过 15 轮对话强制保存
3. **切换必存**：切换任务前必须保存当前进度
4. **关联任务计划**：配合 `/task-plan` 使用效果更好

## 配合其他指令

```
/task-plan 实现 XXX    # 规划任务
# ... 执行几步 ...
/progress-save        # 保存进度
/clear               # 清空上下文
/progress-load       # 恢复进度继续
```

## 注意事项

- 检查点文件使用 Markdown 格式，方便人工阅读
- "下次继续的指令"是关键，确保能快速恢复上下文
- 建议保留最近 10 个检查点，定期清理旧的
