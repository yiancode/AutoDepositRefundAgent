module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js', // 排除主入口文件
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 50,  // 分支覆盖率50%（因为有很多错误处理分支在集成测试中难以触发）
      functions: 80,  // 函数覆盖率80%
      lines: 80,      // 行覆盖率80%
      statements: 80  // 语句覆盖率80%
    }
  },
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  verbose: true,
  testTimeout: 30000 // 30秒超时（因为要调用真实API）
};
