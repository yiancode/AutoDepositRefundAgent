const logger = require('../utils/logger');
const { error } = require('../utils/response');
const { sanitizeForLog } = require('../utils/sanitize');

/**
 * 全局错误处理中间件
 */
function errorHandler(err, req, res, next) {
  // 记录错误日志（过滤敏感信息）
  logger.error(`${req.method} ${req.path} - ${err.message}`, {
    stack: err.stack,
    body: sanitizeForLog(req.body),
    query: sanitizeForLog(req.query),
    headers: sanitizeForLog(req.headers)
  });

  // 知识星球 Cookie 过期
  if (err.message.includes('401') || err.message.includes('Unauthorized')) {
    return res.status(403).json(
      error('知识星球 Cookie 已过期，请更新配置', 403)
    );
  }

  // 知识星球 API 异常
  if (err.message.includes('知识星球')) {
    return res.status(500).json(
      error(`知识星球 API 错误: ${err.message}`, 500)
    );
  }

  // 默认服务器错误
  res.status(500).json(
    error(process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message, 500)
  );
}

/**
 * 404 处理中间件
 */
function notFoundHandler(req, res) {
  res.status(404).json(
    error(`路径不存在: ${req.method} ${req.path}`, 404)
  );
}

module.exports = {
  errorHandler,
  notFoundHandler
};
