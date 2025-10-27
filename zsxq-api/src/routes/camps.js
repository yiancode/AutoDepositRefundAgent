const express = require('express');
const router = express.Router();
const { success, error } = require('../utils/response');
const zsxqService = require('../services/zsxq.service');
const refundService = require('../services/refund.service');
const logger = require('../utils/logger');
const {
  validateCampsQuery,
  validateCheckinId,
  validateRefundRequest
} = require('../middlewares/validation.middleware');

/**
 * GET /api/camps
 * 获取训练营列表
 *
 * Query 参数:
 * - scope: ongoing/over/closed (默认: over)
 * - count: 返回数量 (默认: 100)
 */
router.get('/', validateCampsQuery, async (req, res, next) => {
  try {
    const { scope = 'over', count = 100 } = req.query;

    logger.info(`API 请求: GET /api/camps?scope=${scope}&count=${count}`);

    const camps = await zsxqService.getCamps(scope, parseInt(count));

    res.json(success(camps, `成功获取 ${camps.length} 个训练营`));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/camps/:checkinId/refund-list
 * 生成退款名单
 *
 * URL 参数:
 * - checkinId: 训练营ID
 *
 * Body 参数:
 * - required_days: 完成要求天数 (默认: 7)
 */
router.post('/:checkinId/refund-list', validateCheckinId, validateRefundRequest, async (req, res, next) => {
  try {
    const { checkinId } = req.params;
    const { required_days = 7 } = req.body;

    logger.info(`API 请求: POST /api/camps/${checkinId}/refund-list, required_days=${required_days}`);

    // 验证参数
    if (!checkinId) {
      return res.status(400).json(error('缺少训练营ID', 400));
    }

    if (required_days <= 0) {
      return res.status(400).json(error('完成天数必须大于0', 400));
    }

    const result = await refundService.generateRefundList(
      parseInt(checkinId),
      parseInt(required_days)
    );

    res.json(success(result, '退款名单生成成功'));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/camps/:checkinId/refund-list/text
 * 导出退款名单（文本格式）
 *
 * URL 参数:
 * - checkinId: 训练营ID
 *
 * Query 参数:
 * - required_days: 完成要求天数 (默认: 7)
 */
router.get('/:checkinId/refund-list/text', validateCheckinId, validateCampsQuery, async (req, res, next) => {
  try {
    const { checkinId } = req.params;
    const { required_days = 7 } = req.query;

    logger.info(`API 请求: GET /api/camps/${checkinId}/refund-list/text?required_days=${required_days}`);

    const result = await refundService.generateRefundList(
      parseInt(checkinId),
      parseInt(required_days)
    );

    const textContent = refundService.exportAsText(
      result.refund_list,
      result.statistics
    );

    // 返回纯文本格式
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(textContent);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
