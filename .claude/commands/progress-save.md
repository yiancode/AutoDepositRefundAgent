---
description: 保存当前开发进度检查点
---

# 保存进度检查点

保存当前的开发进度作为检查点，方便后续对比和回溯。

## 使用方法

```
/progress-save [描述]
```

例如：
```
/progress-save "完成支付功能"
/progress-save "完成用户认证模块"
```

## 保存内容

### 1. 基础信息
- 检查点 ID（格式: `checkpoint-{YYYYMMDD-HHmmss}`）
- 时间戳
- 描述信息

### 2. Git 信息
- 当前 commit hash
- 当前分支
- 总提交数
- 最后一次提交信息

### 3. 进度数据
- 整体进度百分比
- 各阶段完成情况

### 4. 代码统计
- 后端代码行数
- 前端代码行数
- 测试代码行数

### 5. 测试覆盖率
- 后端覆盖率
- 前端覆盖率
- 整体覆盖率

### 6. 任务列表
- 已完成任务
- 进行中任务
- 待办任务

## 保存位置

检查点保存在两个地方：

1. **JSON 文件**: `docs/progress/checkpoints/{checkpoint-id}.json`
   ```json
   {
     "id": "checkpoint-20250115-143000",
     "timestamp": "2025-01-15T14:30:00+08:00",
     "description": "完成企业微信支付功能",
     "git": {
       "commit": "a3f5b2c",
       "branch": "main",
       "totalCommits": 47
     },
     "progress": {
       "overall": 35,
       "phase0": 100,
       "phase1": 45
     },
     "codeStats": {
       "backend": 2450,
       "frontend": 3120,
       "test": 820
     }
   }
   ```

2. **索引文件**: `docs/progress/checkpoints/index.md`
   - 列出所有检查点
   - 便于快速浏览和查找

## 输出示例

```
✅ 进度检查点已保存

📸 检查点 ID: checkpoint-20250115-143000
📝 描述: 完成企业微信支付功能
📊 当前进度: 35%
🔗 Git Commit: a3f5b2c

💾 保存位置: docs/progress/checkpoints/checkpoint-20250115-143000.json

💡 使用 /progress-load checkpoint-20250115-143000 查看此检查点
```

## 使用场景

### 1. 里程碑节点
完成重要功能后保存：
```
/progress-save "完成核心支付功能"
```

### 2. 每日工作结束
每天下班前保存：
```
/progress-save "Day 5 工作结束"
```

### 3. 版本发布前
发布前保存当前状态：
```
/progress-save "v1.0.0 发布前"
```

### 4. 重大重构前
开始大规模重构前保存：
```
/progress-save "重构 PaymentService 前"
```

## 触发方式

- `/progress-save [描述]`
- 用户说: "保存进度"、"创建检查点"

## 最佳实践

1. **描述清晰**: 使用有意义的描述，便于以后查找
2. **定期保存**: 建议每完成一个重要功能就保存一次
3. **重大节点必存**: 发布、重构、合并主分支前必须保存
4. **配合 commit**: 可以在 `/ commit` 后自动触发

## 注意事项

- 检查点文件会占用磁盘空间，建议定期清理（保留最近 30 个）
- 检查点应该纳入 Git 版本控制
- 描述信息建议使用中文，方便团队成员理解
