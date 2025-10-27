/**
 * Redis 客户端初始化
 */
const Redis = require('ioredis');
const logger = require('./logger');
const redisConfig = require('../config/redis.config');

let redisClient = null;
let isConnected = false;

/**
 * 创建 Redis 客户端
 */
function createRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  const config = redisConfig.redis;

  logger.info(`连接 Redis: ${config.host}:${config.port}, DB=${config.db}`);

  redisClient = new Redis({
    host: config.host,
    port: config.port,
    password: config.password,
    db: config.db,
    retryStrategy: config.retryStrategy,
    connectTimeout: config.connectTimeout,
    maxRetriesPerRequest: config.maxRetriesPerRequest,
    // 禁用自动重连（避免长时间阻塞）
    enableOfflineQueue: false,
    lazyConnect: true // 延迟连接
  });

  // 连接成功
  redisClient.on('connect', () => {
    logger.info('Redis 连接成功');
    isConnected = true;
  });

  // 连接就绪
  redisClient.on('ready', () => {
    logger.info('Redis 就绪');
  });

  // 连接错误
  redisClient.on('error', (err) => {
    logger.error(`Redis 连接错误: ${err.message}`);
    isConnected = false;
  });

  // 连接关闭
  redisClient.on('close', () => {
    logger.warn('Redis 连接关闭');
    isConnected = false;
  });

  // 重新连接
  redisClient.on('reconnecting', () => {
    logger.info('Redis 正在重新连接...');
  });

  // 尝试连接
  redisClient.connect().catch(err => {
    logger.error(`Redis 初始连接失败: ${err.message}`);
    isConnected = false;
  });

  return redisClient;
}

/**
 * 获取 Redis 客户端
 */
function getRedisClient() {
  if (!redisClient) {
    return createRedisClient();
  }
  return redisClient;
}

/**
 * 检查 Redis 是否可用
 */
async function isRedisAvailable() {
  if (!redisClient || !isConnected) {
    return false;
  }

  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    logger.error(`Redis PING 失败: ${error.message}`);
    return false;
  }
}

/**
 * 关闭 Redis 连接
 */
async function closeRedis() {
  if (redisClient) {
    logger.info('关闭 Redis 连接');
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
  }
}

/**
 * 获取缓存配置
 */
function getCacheConfig() {
  return redisConfig.cache;
}

/**
 * 获取 API 配置
 */
function getApiConfig() {
  return redisConfig.api;
}

module.exports = {
  createRedisClient,
  getRedisClient,
  isRedisAvailable,
  closeRedis,
  getCacheConfig,
  getApiConfig
};
