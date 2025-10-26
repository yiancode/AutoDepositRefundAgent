# 代码重构指令

基于代码审查结果或技术债务，执行自动化代码重构。

## 使用场景

- 代码审查发现需要优化的代码
- 消除代码重复
- 提取公共方法
- 优化性能
- 改善代码可读性

## 子命令

### `/refactor` - 交互式重构

引导用户选择重构类型并执行。

### `/refactor-extract-method` - 提取方法

将长方法拆分为多个小方法。

### `/refactor-rename` - 批量重命名

重命名类、方法、变量（自动更新所有引用）。

### `/refactor-remove-duplication` - 消除重复代码

检测并消除重复代码。

---

## 触发方式

- `/refactor` - 交互式重构
- `/refactor-extract-method <file>:<line>` - 提取方法
- `/refactor-rename <old_name> <new_name>` - 重命名
- `/refactor-remove-duplication` - 消除重复

## 示例

```
用户: /refactor

Claude:
🔧 选择重构类型:

a) 提取方法 (Extract Method)
b) 重命名 (Rename)
c) 消除重复代码 (Remove Duplication)
d) 提取常量 (Extract Constant)
e) 简化条件表达式 (Simplify Conditional)

> a

Claude:
请提供需要重构的文件和行号:
> backend/src/main/java/com/camp/controller/CampController.java:78

[分析代码，建议重构方案...]
```

## 注意事项

- 重构前自动创建 Git 分支
- 重构后自动运行测试确保功能不变
- 保留重构前后的对比
