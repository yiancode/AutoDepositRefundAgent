/**
 * 应用常量配置
 */

module.exports = {
  // 知识星球 API 配置
  ZSXQ: {
    MAX_PAGES: 2,              // 最多翻页数（支持 200 人）
    REQUEST_DELAY_MS: 500,     // 请求间隔（毫秒）- 增加到500ms避免请求过快
    TIMEOUT_MS: 10000,         // 请求超时（毫秒）
    BASE_URL: 'https://api.zsxq.com/v2'
  },

  // 退款计算配置
  REFUND: {
    DEFAULT_REQUIRED_DAYS: 7,  // 默认完成天数
    MIN_REQUIRED_DAYS: 1,      // 最小完成天数
    MAX_REQUIRED_DAYS: 365,    // 最大完成天数
    MAX_DISPLAY_NAMES: 20      // 最多显示合格名单数量
  },

  // API 速率限制
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 分钟
    MAX_REQUESTS: 100,          // 最多请求数
    MESSAGE: '请求过于频繁，请稍后再试'
  },

  // 超时配置
  TIMEOUT: {
    REQUEST_MS: 30000,          // 请求超时 30 秒
    HALTABLE: false             // 是否可中断
  },

  // 日志配置
  LOG: {
    RETENTION_DAYS: '3d',       // 日志保留天数
    DATE_PATTERN: 'YYYY-MM-DD',
    MAX_SIZE: '20m',
    MAX_FILES: '7d'
  },

  // 敏感字段（日志过滤）
  SENSITIVE_FIELDS: [
    'password',
    'token',
    'authorization',
    'cookie',
    'secret',
    'apikey',
    'api_key',
    'access_token',
    'refresh_token'
  ]
};
