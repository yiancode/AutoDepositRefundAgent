/**
 * 用户信息路由
 * 提供用户信息查询、缓存管理等接口
 */
const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { success, error: errorResponse } = require('../utils/response');
const userService = require('../services/user.service');

/**
 * GET /api/users
 * 获取所有用户信息（分页）
 *
 * Query 参数:
 * - page: 页码（默认: 1）
 * - page_size: 每页数量（默认: 50，最大: 200）
 * - sort_by: 排序字段（number/join_time，默认: number）
 * - order: 排序方向（asc/desc，默认: asc）
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      page_size = 50,
      sort_by = 'number',
      order = 'asc'
    } = req.query;

    // 参数验证
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(page_size);

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json(errorResponse('page 参数必须是大于 0 的整数', 400));
    }

    if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 200) {
      return res.status(400).json(errorResponse('page_size 参数必须在 1-200 之间', 400));
    }

    if (!['number', 'join_time'].includes(sort_by)) {
      return res.status(400).json(errorResponse('sort_by 参数只能是 number 或 join_time', 400));
    }

    if (!['asc', 'desc'].includes(order)) {
      return res.status(400).json(errorResponse('order 参数只能是 asc 或 desc', 400));
    }

    logger.info(`API 请求: GET /api/users?page=${pageNum}&page_size=${pageSizeNum}&sort_by=${sort_by}&order=${order}`);

    const result = await userService.getUsers(pageNum, pageSizeNum, sort_by, order);

    res.json(success(result, '查询成功'));

  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/users/:userId
 * 根据 user_id 查询用户信息
 *
 * URL 参数:
 * - userId: 知识星球用户ID（必填）
 */
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json(errorResponse('userId 参数不能为空', 400));
    }

    logger.info(`API 请求: GET /api/users/${userId}`);

    const user = await userService.getUserById(userId);

    res.json(success(user, '查询成功'));

  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/users/number/:number
 * 根据 number 查询用户信息
 *
 * URL 参数:
 * - number: 星球成员编号（必填）
 */
router.get('/number/:number', async (req, res, next) => {
  try {
    const { number } = req.params;

    const numberInt = parseInt(number);
    if (isNaN(numberInt)) {
      return res.status(400).json(errorResponse('number 参数必须是整数', 400));
    }

    logger.info(`API 请求: GET /api/users/number/${numberInt}`);

    const user = await userService.getUserByNumber(numberInt);

    res.json(success(user, '查询成功'));

  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/users/sync
 * 批量同步用户信息（管理员功能）
 *
 * Body 参数:
 * - force: 是否强制刷新（默认: false）
 * - concurrency: 并发请求数（默认: 5）
 */
router.post('/sync', async (req, res, next) => {
  try {
    const {
      force = false,
      concurrency = 5
    } = req.body;

    // 参数验证
    const concurrencyNum = parseInt(concurrency);
    if (isNaN(concurrencyNum) || concurrencyNum < 1 || concurrencyNum > 10) {
      return res.status(400).json(errorResponse('concurrency 参数必须在 1-10 之间', 400));
    }

    logger.info(`API 请求: POST /api/users/sync (force=${force}, concurrency=${concurrencyNum})`);

    const result = await userService.syncAllUsers(force, concurrencyNum);

    res.json(success(result, '同步完成'));

  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/users/cache
 * 清空用户缓存（管理员功能）
 */
router.delete('/cache', async (req, res, next) => {
  try {
    logger.info('API 请求: DELETE /api/users/cache');

    const result = await userService.clearUserCache();

    res.json(success(result, '缓存已清空'));

  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/users/cache/stats
 * 获取缓存统计信息
 */
router.get('/cache/stats', async (req, res, next) => {
  try {
    logger.info('API 请求: GET /api/users/cache/stats');

    const stats = await userService.getCacheStats();

    res.json(success(stats, '查询成功'));

  } catch (err) {
    next(err);
  }
});

module.exports = router;
