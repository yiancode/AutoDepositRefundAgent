/**
 * Redis 配置
 */
module.exports = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    connectTimeout: 10000, // 10 秒连接超时
    maxRetriesPerRequest: 3
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 86400, // 24 小时
    enabled: process.env.CACHE_ENABLED !== 'false'
  },
  api: {
    rateLimit: parseInt(process.env.API_RATE_LIMIT) || 50,
    concurrency: parseInt(process.env.API_CONCURRENCY) || 5,
    requestDelay: parseInt(process.env.API_REQUEST_DELAY) || 200
  }
};
