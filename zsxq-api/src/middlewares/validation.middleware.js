const Joi = require('joi');
const { error } = require('../utils/response');
const { REFUND } = require('../config/constants');

/**
 * 验证退款名单请求参数
 */
function validateRefundRequest(req, res, next) {
  const schema = Joi.object({
    required_days: Joi.number()
      .integer()
      .min(REFUND.MIN_REQUIRED_DAYS)
      .max(REFUND.MAX_REQUIRED_DAYS)
      .default(REFUND.DEFAULT_REQUIRED_DAYS)
      .messages({
        'number.base': '完成天数必须是数字',
        'number.integer': '完成天数必须是整数',
        'number.min': `完成天数最小为 ${REFUND.MIN_REQUIRED_DAYS}`,
        'number.max': `完成天数最大为 ${REFUND.MAX_REQUIRED_DAYS}`
      })
  });

  const { error: validationError, value } = schema.validate(req.body);

  if (validationError) {
    return res.status(400).json(
      error(validationError.details[0].message, 400)
    );
  }

  req.body = value;
  next();
}

/**
 * 验证训练营 ID
 */
function validateCheckinId(req, res, next) {
  const { checkinId } = req.params;

  // 检查是否为有效的数字 ID
  if (!/^\d+$/.test(checkinId)) {
    return res.status(400).json(
      error('无效的训练营 ID，必须是数字', 400)
    );
  }

  // 检查 ID 范围（防止溢出）
  const id = parseInt(checkinId, 10);
  if (id > Number.MAX_SAFE_INTEGER) {
    return res.status(400).json(
      error('训练营 ID 超出有效范围', 400)
    );
  }

  next();
}

/**
 * 验证查询参数
 */
function validateCampsQuery(req, res, next) {
  const schema = Joi.object({
    scope: Joi.string()
      .valid('ongoing', 'over', 'closed')
      .default('over')
      .messages({
        'any.only': 'scope 必须是 ongoing, over 或 closed 之一'
      }),
    count: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(100)
      .messages({
        'number.base': 'count 必须是数字',
        'number.min': 'count 最小为 1',
        'number.max': 'count 最大为 100'
      })
  });

  const { error: validationError, value } = schema.validate(req.query);

  if (validationError) {
    return res.status(400).json(
      error(validationError.details[0].message, 400)
    );
  }

  req.query = value;
  next();
}

module.exports = {
  validateRefundRequest,
  validateCheckinId,
  validateCampsQuery
};
