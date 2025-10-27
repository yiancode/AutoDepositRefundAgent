/**
 * 统一响应格式工具
 */

/**
 * 成功响应
 * @param {*} data - 响应数据
 * @param {string} message - 响应消息
 */
function success(data = null, message = '成功') {
  return {
    code: 200,
    message,
    data,
    timestamp: Date.now()
  };
}

/**
 * 失败响应
 * @param {string} message - 错误消息
 * @param {number} code - 错误码
 * @param {*} data - 额外数据
 */
function error(message = '失败', code = 500, data = null) {
  return {
    code,
    message,
    data,
    timestamp: Date.now()
  };
}

module.exports = {
  success,
  error
};
