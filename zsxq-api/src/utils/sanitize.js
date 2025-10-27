const { SENSITIVE_FIELDS } = require('../config/constants');

/**
 * 过滤对象中的敏感字段
 * @param {Object} obj - 需要过滤的对象
 * @returns {Object} - 过滤后的对象
 */
function sanitizeForLog(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForLog(item));
  }

  // 处理普通对象
  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // 检查是否为敏感字段
    const isSensitive = SENSITIVE_FIELDS.some(field =>
      lowerKey.includes(field.toLowerCase())
    );

    if (isSensitive) {
      sanitized[key] = '***REDACTED***';
    } else if (value && typeof value === 'object') {
      // 递归处理嵌套对象
      sanitized[key] = sanitizeForLog(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * 过滤 URL 中的敏感查询参数
 * @param {string} url - URL 字符串
 * @returns {string} - 过滤后的 URL
 */
function sanitizeUrl(url) {
  if (!url) return url;

  try {
    const urlObj = new URL(url, 'http://localhost');
    const params = urlObj.searchParams;

    for (const key of params.keys()) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_FIELDS.some(field =>
        lowerKey.includes(field.toLowerCase())
      );

      if (isSensitive) {
        params.set(key, '***REDACTED***');
      }
    }

    return urlObj.pathname + (urlObj.search || '');
  } catch (error) {
    // 如果不是有效的 URL，直接返回
    return url;
  }
}

module.exports = {
  sanitizeForLog,
  sanitizeUrl
};
