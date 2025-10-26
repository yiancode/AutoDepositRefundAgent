# Claude Code 配置文件说明

## 配置文件列表

本项目提供了两个配置文件：

### 1. `config.example.json` - v1 版本配置（完整版）
**用途**: v1 版本（完整的押金退款系统）的配置模板
**技术栈**:
- 后端: Java 17 + Spring Boot 3.2+
- 前端: Vue 3 + Element Plus
- 数据库: PostgreSQL 15+
- 缓存: Redis 7.x

**适用场景**: 30 天开发周期，完整的数据库设计，支持 1000+ 人的训练营

---

### 2. `config.v0.json` - v0 版本配置（简化版）⭐ **当前使用**
**用途**: v0 版本（临时 MVP 版本）的实际配置
**技术栈**:
- 后端: Node.js + Express.js
- 前端: Vue 3 + Vite + Element Plus
- 数据库: 无（纯 API 代理）

**适用场景**: 4 天快速上线，无数据库，临时使用

---

## 使用方法

### 方式 1: 复制并重命名（推荐）

```bash
# 使用 v0 配置（当前项目）
cp .claude/config.v0.json .claude/config.json

# 或者使用 v1 配置（未来升级）
cp .claude/config.example.json .claude/config.json
```

### 方式 2: 直接修改

编辑 `.claude/config.v0.json` 或 `.claude/config.example.json`，根据实际需求调整参数。

---

## v0 配置详解

### 项目基本信息
```json
{
  "project": {
    "name": "知识星球训练营退款系统 v0",
    "version": "0.1.0",
    "stage": "v0-开发阶段",
    "deployDomain": "zsxq.dc401.com",
    "targetTimeline": "4天内完成"
  }
}
```

### Git 提交配置
```json
{
  "commit": {
    "autoPush": true,                    // 自动推送到远程仓库
    "updateDocs": true,                  // 自动更新文档
    "requireTests": false,               // v0 不强制要求测试
    "minCoverage": 60,                   // 最低覆盖率 60%（v0 降低要求）
    "preventSensitiveFiles": true,       // 防止提交敏感文件
    "sensitivePatterns": [
      ".env",
      "config/zsxq-cookie.txt"           // ⚠️ 知识星球 Cookie 文件
    ]
  }
}
```

### 代码审查配置
```json
{
  "codeReview": {
    "enabled": true,
    "autoReviewOnCommit": false,         // v0 不自动审查（节省时间）
    "rules": {
      "backend": {
        "maxFunctionLength": 80,         // Node.js 函数最大 80 行
        "requireJsDoc": true,            // 需要 JSDoc 注释
        "minTestCoverage": 60            // v0 降低到 60%
      },
      "security": {
        "checkApiKeyExposure": true      // 检查 API Key 泄露
      }
    }
  }
}
```

### 测试配置
```json
{
  "test": {
    "autoRunOnCommit": false,            // v0 不自动运行测试
    "minCoverageBackend": 60,            // 后端覆盖率 60%
    "minCoverageFrontend": 50,           // 前端覆盖率 50%
    "testCommand": {
      "backend": "npm test",             // Node.js 测试命令
      "frontend": "npm run test"
    }
  }
}
```

### v0 特有配置
```json
{
  "v0Specific": {
    "noDatabase": true,                  // 无数据库
    "apiProxyMode": true,                // API 代理模式
    "zsxqApiEndpoint": "https://api.zsxq.com/v2",
    "cookieStorageMode": "file",         // Cookie 存储在文件中
    "cookieUpdateMethod": "web-interface", // 通过 Web 界面更新
    "maxConcurrentUsers": 5,             // 最多 5 人同时使用
    "maxCampMembers": 200,               // 单个训练营最多 200 人
    "autoPagenation": true,              // 自动翻页获取数据
    "features": {
      "getCampList": true,               // ✅ 获取训练营列表
      "generateRefundList": true,        // ✅ 生成退款名单
      "copyQualifiedMembers": true,      // ✅ 一键复制合格人员
      "exportExcel": true,               // ✅ 导出 Excel
      "downloadImage": true,             // ✅ 下载图片
      "cookieValidation": true,          // ✅ Cookie 失效检测
      "apiKeyAuth": true,                // ✅ API 鉴权
      "dataCache": false                 // ❌ 无缓存
    }
  }
}
```

### 部署配置
```json
{
  "deploy": {
    "serverInfo": {
      "host": "zsxq.dc401.com",
      "port": 3013,                      // Node.js 服务端口
      "nginxConfig": "/etc/nginx/sites-available/zsxq"
    },
    "deployCommands": {
      "backend": [
        "npm install",
        "pm2 restart zsxq-backend"       // 使用 PM2 管理进程
      ],
      "frontend": [
        "npm run build",
        "cp -r dist/* /var/www/web/"     // 复制到 Nginx 目录
      ]
    }
  }
}
```

---

## 关键配置项说明

### 1. 敏感文件保护

**问题**: v0 版本将知识星球 Cookie 存储在文件中，不能提交到 Git

**配置**:
```json
{
  "commit": {
    "preventSensitiveFiles": true,
    "sensitivePatterns": [
      "config/zsxq-cookie.txt",          // Cookie 文件
      ".env",                            // 环境变量
      "*secret*",                        // 任何包含 secret 的文件
      "*.key"                            // 密钥文件
    ]
  }
}
```

### 2. 测试覆盖率要求

**v0 vs v1 对比**:

| 版本 | 后端 | 前端 | 原因 |
|------|------|------|------|
| v0 | 60% | 50% | 快速迭代，临时使用 |
| v1 | 80% | 70% | 生产级质量要求 |

### 3. 代码审查规则

**v0 简化的审查规则**:
- 不检查 SQL 注入（无数据库）
- 降低函数长度要求（80 行 vs 50 行）
- 不强制要求测试（快速开发）

### 4. 性能配置

```json
{
  "performance": {
    "apiRequestTimeout": 10000,        // API 请求超时 10 秒
    "apiRetryCount": 2,                // 失败重试 2 次
    "rateLimitPerMinute": 100,         // 每分钟最多 100 次请求
    "cacheDisabled": true              // v0 禁用缓存
  }
}
```

---

## 配置优先级

1. **`.claude/config.json`** - 实际使用的配置（优先级最高）
2. **`.claude/config.v0.json`** - v0 版本模板
3. **`.claude/config.example.json`** - v1 版本模板

---

## 常见配置场景

### 场景 1: 开发环境

```json
{
  "commit": {
    "autoPush": false,                 // 不自动推送
    "requireTests": false              // 不强制测试
  },
  "codeReview": {
    "autoReviewOnCommit": false        // 不自动审查
  }
}
```

### 场景 2: 生产环境

```json
{
  "commit": {
    "autoPush": true,                  // 自动推送
    "requireTests": true               // 强制测试
  },
  "deploy": {
    "requireConfirmation": {
      "prod": true                     // 生产部署需确认
    },
    "autoBackup": true                 // 自动备份
  }
}
```

### 场景 3: CI/CD 集成

```json
{
  "test": {
    "autoRunOnCommit": true,           // 自动运行测试
    "failOnCoverageDrop": true         // 覆盖率下降则失败
  },
  "codeReview": {
    "autoReviewOnCommit": true         // 自动审查
  }
}
```

---

## 配置文件更新

### 何时更新配置

1. **切换版本**: v0 → v1 时更换配置文件
2. **环境变化**: 开发 → 生产环境
3. **需求变更**: 新功能需要新配置项
4. **性能调优**: 根据实际情况调整参数

### 更新步骤

```bash
# 1. 备份现有配置
cp .claude/config.json .claude/config.backup.json

# 2. 复制新配置
cp .claude/config.v0.json .claude/config.json

# 3. 根据需要修改参数
vim .claude/config.json

# 4. 提交配置变更
git add .claude/config.json
git commit -m "chore: 更新项目配置"
```

---

## 注意事项

1. ⚠️ **不要提交敏感信息**: `.claude/config.json` 应该在 `.gitignore` 中
2. ⚠️ **定期检查配置**: 确保配置与实际项目匹配
3. ⚠️ **团队协作**: 团队成员应使用相同的配置模板
4. ⚠️ **文档同步**: 配置变更时更新本文档

---

## 故障排查

### 问题 1: 指令不工作

**原因**: 配置文件格式错误或缺失

**解决**:
```bash
# 检查 JSON 格式
cat .claude/config.json | jq .

# 如果报错，重新复制模板
cp .claude/config.v0.json .claude/config.json
```

### 问题 2: 敏感文件被提交

**原因**: `preventSensitiveFiles` 未启用或模式不匹配

**解决**:
```json
{
  "commit": {
    "preventSensitiveFiles": true,
    "sensitivePatterns": [
      "你的敏感文件路径"
    ]
  }
}
```

### 问题 3: 测试覆盖率要求过高

**原因**: v0 使用了 v1 的配置

**解决**: 使用 v0 配置模板，覆盖率要求降低至 60%/50%

---

## 相关文档

- [指令快速参考](./commands/QUICKSTART.md)
- [指令详细文档](./commands/README.md)
- [v0 技术方案](../docs/v0/技术方案-详细版.md)
- [项目配置](../CLAUDE.md)

---

**最后更新**: 2025-10-27
**适用版本**: v0.1.0
