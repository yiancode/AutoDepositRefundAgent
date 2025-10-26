---
description: 审查指定文件的代码质量
---

# 审查指定文件

审查指定文件或目录的代码质量、规范和潜在问题。

## 使用方法

```
/review-file <文件路径>
```

例如：
```
/review-file backend/src/main/java/com/camp/service/PaymentService.java
/review-file frontend/h5-member/src/views/CampList.vue
```

## 检查项

- 代码规范
- 安全漏洞
- 性能问题
- 测试覆盖

## 触发方式

- `/review-file <path>`
- 用户说: "审查 {文件名}"
