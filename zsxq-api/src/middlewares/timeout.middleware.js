const timeout = require('connect-timeout');
const { TIMEOUT } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * 请求超时中间件
 */
function timeoutMiddleware() {
  return timeout(TIMEOUT.REQUEST_MS, {
    respond: !TIMEOUT.HALTABLE
  });
}

/**
 * 超时检查中间件
 */
function haltOnTimeout(req, res, next) {
  if (!req.timedout) {
    next();
  } else {
    logger.warn(`Request timeout: ${req.method} ${req.path}`);
  }
}

/**
 * 超时错误处理
 */
function timeoutErrorHandler(err, req, res, next) {
  if (req.timedout) {
    logger.error(`Request timeout: ${req.method} ${req.path}`);
    return res.status(408).json({
      code: 408,
      message: '请求超时，请稍后重试',
      data: null,
      timestamp: Date.now()
    });
  }
  next(err);
}

module.exports = {
  timeoutMiddleware,
  haltOnTimeout,
  timeoutErrorHandler
};
