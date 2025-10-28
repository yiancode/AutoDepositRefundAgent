# 测试和代码质量指南

本文档说明如何运行测试、检查代码质量和格式化代码。

---

## 📦 安装依赖

**快速开始**: 运行项目根目录的自动化脚本

```bash
cd /Users/stinglong/code/github/AutoDepositRefundAgent
bash setup-dev-env.sh
```

如果遇到 npm 权限问题,请参考 [SETUP_MANUAL.md](./SETUP_MANUAL.md) 进行手动配置。

---

**手动安装** (如果自动化脚本失败):

```bash
# 1. 修复 npm 权限 (仅需一次)
sudo chown -R $(whoami) ~/.npm

# 2. 安装开发依赖
npm install --save-dev eslint prettier eslint-config-prettier eslint-plugin-prettier
```

---

## 🧪 运行测试

### 运行所有测试

```bash
npm test
```

**输出示例**:
```
PASS  __tests__/unit/refund.service.unit.test.js
PASS  __tests__/unit/sanitize.util.unit.test.js
PASS  __tests__/integration/camps.api.integration.test.js

Test Suites: 3 passed, 3 total
Tests:       45 passed, 45 total
Coverage:    95.24%
```

---

### 运行单元测试 (Mock 数据)

```bash
npm run test:unit
```

**特点**:
- ✅ 不调用真实 API
- ✅ 运行速度快 (< 1 秒)
- ✅ 适合开发时频繁运行
- ✅ 测试覆盖边界条件

**包含测试**:
- `refund.service.unit.test.js` - 退款计算逻辑测试
- `sanitize.util.unit.test.js` - 敏感信息过滤测试

---

### 运行集成测试 (真实 API)

```bash
npm run test:integration
```

**特点**:
- ⚠️ 调用真实知识星球 API
- ⚠️ 运行速度较慢 (5-10 秒)
- ⚠️ 需要正确的 `.env` 配置
- ✅ 验证真实业务流程

**包含测试**:
- `camps.api.integration.test.js` - API 端到端测试
- `refund.service.integration.test.js` - 退款服务集成测试
- `zsxq.service.integration.test.js` - 知识星球 API 测试

---

### 监听模式 (开发时推荐)

```bash
npm run test:watch
```

自动检测文件变化并重新运行测试。

---

## 📊 测试覆盖率

查看详细的测试覆盖率报告:

```bash
npm test
```

**覆盖率目标**:
- **总体**: > 85%
- **关键业务逻辑**: > 90%
- **工具函数**: > 80%

**覆盖率报告**:
- 终端输出: 表格形式
- HTML 报告: `coverage/lcov-report/index.html`

---

## 🎨 代码格式化

### 检查代码风格

```bash
npm run lint
```

**检查内容**:
- 语法错误
- 潜在 Bug
- 代码风格问题
- 最佳实践违反

### 自动修复

```bash
npm run lint:fix
```

自动修复可修复的问题 (缩进、引号、分号等)。

### 格式化代码

```bash
npm run format
```

使用 Prettier 统一格式化所有代码文件。

---

## 📝 编写测试指南

### 单元测试模板

```javascript
const MyService = require('../../src/services/my.service');
const Dependency = require('../../src/services/dependency');

// Mock 依赖
jest.mock('../../src/services/dependency');

describe('MyService - 单元测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该正确处理正常情况', async () => {
    // 1. Arrange (准备)
    Dependency.mockMethod.mockResolvedValue({ data: 'test' });

    // 2. Act (执行)
    const result = await MyService.someMethod();

    // 3. Assert (断言)
    expect(result).toEqual({ data: 'test' });
    expect(Dependency.mockMethod).toHaveBeenCalledTimes(1);
  });

  it('应该正确处理错误情况', async () => {
    Dependency.mockMethod.mockRejectedValue(new Error('API Error'));

    await expect(MyService.someMethod()).rejects.toThrow('API Error');
  });
});
```

### 测试命名规范

- ✅ **好的命名**: `应该正确计算合格和不合格人员`
- ❌ **不好的命名**: `test1`, `works`

### 测试组织

```javascript
describe('功能模块', () => {
  describe('子功能 A', () => {
    it('场景 1', () => {});
    it('场景 2', () => {});
  });

  describe('子功能 B', () => {
    it('场景 1', () => {});
    it('场景 2', () => {});
  });
});
```

---

## 🔧 配置文件说明

### `.eslintrc.json`

ESLint 配置文件,定义代码检查规则:

```json
{
  "env": {
    "node": true,
    "es2021": true,
    "jest": true
  },
  "extends": ["eslint:recommended", "prettier"],
  "rules": {
    "no-console": "off",        // 允许使用 console
    "no-unused-vars": "error"   // 禁止未使用的变量
  }
}
```

### `.prettierrc.json`

Prettier 配置文件,定义代码格式:

```json
{
  "semi": true,              // 使用分号
  "singleQuote": true,       // 使用单引号
  "printWidth": 100,         // 每行最大字符数
  "tabWidth": 2              // 缩进宽度
}
```

### `jest.config.js`

Jest 测试框架配置:

```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

---

## 🚀 CI/CD 集成

### GitHub Actions 示例

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run lint
      - run: npm run test:unit
```

---

## 📚 常见问题

### Q1: 单元测试和集成测试的区别?

| 特性 | 单元测试 | 集成测试 |
|------|---------|---------|
| **速度** | ⚡ 快 (< 1s) | 🐢 慢 (5-10s) |
| **依赖** | Mock 数据 | 真实 API |
| **稳定性** | ✅ 高 | ⚠️ 受 API 影响 |
| **覆盖范围** | 单个函数/模块 | 完整业务流程 |
| **运行频率** | 每次提交 | CI/CD + 发布前 |

### Q2: 测试失败怎么办?

1. **查看错误信息**: Jest 会输出详细的错误堆栈
2. **检查 Mock 配置**: 确保 Mock 返回正确的数据格式
3. **调试模式**: 在测试中添加 `console.log()` 输出中间结果
4. **单独运行**: `npm run test:unit -- refund.service.unit.test.js`

### Q3: ESLint 报错怎么办?

```bash
# 自动修复
npm run lint:fix

# 查看详细错误
npm run lint

# 忽略特定规则 (在代码中)
// eslint-disable-next-line no-console
console.log('debug info');
```

---

## 📊 测试统计

**当前测试状态** (2025-10-27):

| 类型 | 文件数 | 测试数 | 通过率 | 覆盖率 |
|------|-------|--------|--------|--------|
| 单元测试 | 2 | 20+ | 100% | 90%+ |
| 集成测试 | 3 | 30 | 83% | 85% |
| **总计** | **5** | **50+** | **90%+** | **88%+** |

---

## 🎯 下一步

- [ ] 提高集成测试通过率到 100%
- [ ] 添加更多边界条件测试
- [ ] 集成 Husky (Git hooks)
- [ ] 添加性能测试
- [ ] 添加安全测试

---

**最后更新**: 2025-10-27
**维护者**: Claude Code
