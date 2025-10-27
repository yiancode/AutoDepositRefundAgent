const rateLimit = require('express-rate-limit');
const { RATE_LIMIT } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * API 速率限制中间件
 */
const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_REQUESTS,
  message: {
    code: 429,
    message: RATE_LIMIT.MESSAGE,
    data: null,
    timestamp: Date.now()
  },
  standardHeaders: true, // 返回 RateLimit-* headers
  legacyHeaders: false,  // 禁用 X-RateLimit-* headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for ${req.ip} - ${req.method} ${req.path}`);
    res.status(429).json({
      code: 429,
      message: RATE_LIMIT.MESSAGE,
      data: {
        retryAfter: req.rateLimit.resetTime
      },
      timestamp: Date.now()
    });
  },
  // 跳过健康检查和静态资源
  skip: (req) => {
    return req.path === '/health' || req.path.startsWith('/static');
  }
});

/**
 * 严格的速率限制（用于敏感操作）
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 10,                   // 最多 10 次请求
  message: {
    code: 429,
    message: '该操作请求过于频繁，请稍后再试',
    data: null,
    timestamp: Date.now()
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  apiLimiter,
  strictLimiter
};
