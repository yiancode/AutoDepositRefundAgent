---
description: 加载历史进度检查点
---

# 加载历史检查点

查看历史保存的进度检查点，了解项目在不同时间点的状态。

## 使用方法

```
/progress-load [检查点ID]
```

如果不提供 ID，显示所有可用检查点列表。

## 示例

### 列出所有检查点
```
/progress-load
```

### 查看指定检查点
```
/progress-load checkpoint-20250115-143000
```

## 触发方式

- `/progress-load` - 列出所有检查点
- `/progress-load <ID>` - 查看指定检查点
- 用户说: "查看历史进度"、"加载检查点"
