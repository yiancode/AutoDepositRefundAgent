# 开发环境手动配置指南

由于 npm 权限问题,需要手动完成以下步骤。

---

## 步骤 1: 修复 npm 权限

在终端执行以下命令:

```bash
sudo chown -R $(whoami) ~/.npm
```

输入您的 macOS 密码后,权限问题将被修复。

**验证权限修复**:
```bash
ls -la ~/.npm | head -5
# 所有文件的所有者应该是您的用户名,而不是 root
```

---

## 步骤 2: 安装 ESLint 和 Prettier

进入后端项目目录并安装开发依赖:

```bash
cd /Users/stinglong/code/github/AutoDepositRefundAgent/zsxq-api

npm install --save-dev \
  eslint@^8.57.0 \
  prettier@^3.2.5 \
  eslint-config-prettier@^9.1.0 \
  eslint-plugin-prettier@^5.1.3
```

**预期输出**:
```
added 120 packages in 5s
```

---

## 步骤 3: 验证安装

检查依赖是否安装成功:

```bash
npm list eslint prettier --depth=0
```

**预期输出**:
```
zsxq-api@1.0.0 /Users/stinglong/code/github/AutoDepositRefundAgent/zsxq-api
├── eslint@8.57.0
└── prettier@3.2.5
```

---

## 步骤 4: 运行单元测试

```bash
npm run test:unit
```

**预期输出**:
```
PASS  __tests__/unit/sanitize.util.unit.test.js
PASS  __tests__/unit/refund.service.unit.test.js

Test Suites: 2 passed, 2 total
Tests:       22 passed, 22 total
Snapshots:   0 total
Time:        1.234s
```

---

## 步骤 5: 检查代码风格

```bash
npm run lint
```

**预期输出**:
```
✔ No ESLint errors found
```

如果有错误,自动修复:
```bash
npm run lint:fix
```

---

## 步骤 6: 格式化代码

```bash
npm run format
```

**预期输出**:
```
src/index.js 50ms
src/routes/camps.js 20ms
src/services/zsxq.service.js 30ms
...
```

---

## 步骤 7: 运行所有测试 (可选)

```bash
npm test
```

**注意**: 集成测试会调用真实 API,需要正确的 `.env` 配置。

---

## 一键完成 (权限修复后)

修复权限后,可以使用自动化脚本:

```bash
cd /Users/stinglong/code/github/AutoDepositRefundAgent
bash setup-dev-env.sh
```

---

## 常见问题

### Q1: npm install 仍然失败?

检查是否还有其他权限问题:

```bash
# 检查 node_modules 权限
ls -la node_modules | head -5

# 如果有 root 文件,修复:
sudo chown -R $(whoami) node_modules
```

### Q2: ESLint 报错 "Cannot find module 'eslint-config-prettier'"?

重新安装:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Q3: 测试失败?

查看详细错误:

```bash
npm run test:unit -- --verbose
```

---

## 配置文件说明

已创建以下配置文件:

- `.eslintrc.json` - ESLint 规则配置
- `.prettierrc.json` - Prettier 格式化配置
- `__tests__/unit/` - 单元测试文件

---

**最后更新**: 2025-10-27
**维护者**: Claude Code
