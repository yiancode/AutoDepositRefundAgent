/**
 * 用户信息服务
 * 实现用户信息的缓存管理、查询和同步
 */
const pLimit = require('p-limit');
const logger = require('../utils/logger');
const { getRedisClient, isRedisAvailable, getCacheConfig, getApiConfig } = require('../utils/redis');
const zsxqService = require('./zsxq.service');

class UserService {
  constructor() {
    this.redis = getRedisClient();
    this.cacheConfig = getCacheConfig();
    this.apiConfig = getApiConfig();
  }

  /**
   * 根据 user_id 查询用户信息（懒加载策略）
   * @param {string} userId - 知识星球用户ID
   * @returns {Promise<Object>} 用户信息
   */
  async getUserById(userId) {
    try {
      // 1. 尝试从 Redis 获取
      if (this.cacheConfig.enabled && await isRedisAvailable()) {
        try {
          const cachedUser = await this.redis.hgetall(`zsxq:user:${userId}`);

          if (cachedUser && cachedUser.user_id) {
            // 缓存命中
            logger.info(`缓存命中: user_id=${userId}`);
            await this.incrementCacheStats('cache_hits');

            // 转换 number 为数字类型
            if (cachedUser.number) {
              cachedUser.number = parseInt(cachedUser.number);
            }

            return { ...cachedUser, cache_status: 'hit' };
          }
        } catch (redisError) {
          logger.warn(`Redis 查询失败，降级到直接调用 API: ${redisError.message}`);
        }
      }

      // 2. 缓存未命中，调用知识星球 API
      logger.info(`缓存未命中，调用知识星球 API: user_id=${userId}`);
      const apiUser = await zsxqService.getUserDetail(userId);

      // 3. 缓存到 Redis
      if (this.cacheConfig.enabled && await isRedisAvailable()) {
        try {
          await this.cacheUser(apiUser);
          await this.incrementCacheStats('cache_misses');
          await this.incrementCacheStats('api_calls');
        } catch (redisError) {
          logger.warn(`缓存写入失败: ${redisError.message}`);
        }
      }

      return { ...apiUser, cache_status: 'miss' };

    } catch (error) {
      logger.error(`获取用户信息失败: user_id=${userId}, error=${error.message}`);
      throw error;
    }
  }

  /**
   * 根据 number 查询用户信息
   * @param {number} number - 星球成员编号
   * @returns {Promise<Object>} 用户信息
   */
  async getUserByNumber(number) {
    try {
      // 1. 从索引中查找 user_id
      if (this.cacheConfig.enabled && await isRedisAvailable()) {
        try {
          const userId = await this.redis.get(`zsxq:number:${number}`);

          if (userId) {
            logger.info(`通过 number 索引找到 user_id: number=${number}, user_id=${userId}`);
            // 2. 根据 user_id 查询用户信息
            return await this.getUserById(userId);
          }
        } catch (redisError) {
          logger.warn(`Redis 索引查询失败: ${redisError.message}`);
        }
      }

      throw new Error(`未找到编号为 ${number} 的用户`);

    } catch (error) {
      logger.error(`根据 number 查询用户失败: number=${number}, error=${error.message}`);
      throw error;
    }
  }

  /**
   * 获取所有已缓存的用户信息（分页）
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @param {string} sortBy - 排序字段
   * @param {string} order - 排序方向
   * @returns {Promise<Object>} 用户列表和分页信息
   */
  async getUsers(page = 1, pageSize = 50, sortBy = 'number', order = 'asc') {
    try {
      if (!this.cacheConfig.enabled || !await isRedisAvailable()) {
        throw new Error('Redis 缓存不可用');
      }

      // 1. 从 Redis 获取所有用户 ID
      const userIds = await this.redis.smembers('zsxq:users:all');
      logger.info(`从缓存获取到 ${userIds.length} 个用户 ID`);

      if (userIds.length === 0) {
        return {
          users: [],
          pagination: {
            page,
            page_size: pageSize,
            total_count: 0,
            total_pages: 0
          },
          cache_info: await this.getCacheStats()
        };
      }

      // 2. 批量获取用户信息（使用 Redis Pipeline 优化）
      const users = await this.getUsersBatch(userIds);

      // 3. 排序
      const sortedUsers = this.sortUsers(users, sortBy, order);

      // 4. 分页
      const totalCount = sortedUsers.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

      return {
        users: paginatedUsers,
        pagination: {
          page,
          page_size: pageSize,
          total_count: totalCount,
          total_pages: totalPages
        },
        cache_info: await this.getCacheStats()
      };

    } catch (error) {
      logger.error(`获取用户列表失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 批量同步用户信息（管理员功能）
   * @param {boolean} force - 是否强制刷新
   * @param {number} concurrency - 并发数
   * @returns {Promise<Object>} 同步结果统计
   */
  async syncAllUsers(force = false, concurrency = 5) {
    const startTime = Date.now();

    try {
      logger.info(`开始批量同步用户信息: force=${force}, concurrency=${concurrency}`);

      // 1. 获取所有用户 ID（从排行榜接口或其他来源）
      // 这里我们需要一个获取所有用户ID的方法，暂时使用已缓存的用户ID
      let allUserIds = [];

      if (await isRedisAvailable()) {
        allUserIds = await this.redis.smembers('zsxq:users:all');
      }

      if (allUserIds.length === 0) {
        logger.warn('没有找到需要同步的用户 ID');
        return {
          sync_count: 0,
          success_count: 0,
          failed_count: 0,
          skipped_count: 0,
          duration_ms: Date.now() - startTime,
          failed_users: []
        };
      }

      // 2. 过滤已缓存的用户（force=false 时）
      let userIdsToSync = allUserIds;
      let skippedCount = 0;

      if (!force && this.cacheConfig.enabled && await isRedisAvailable()) {
        const cachedUserIds = await this.redis.smembers('zsxq:users:all');
        userIdsToSync = allUserIds.filter(id => !cachedUserIds.includes(id));
        skippedCount = allUserIds.length - userIdsToSync.length;
        logger.info(`跳过已缓存的 ${skippedCount} 个用户`);
      }

      logger.info(`开始同步用户信息: 总数=${allUserIds.length}, 待同步=${userIdsToSync.length}`);

      // 3. 并发控制（避免触发限流）
      const limit = pLimit(concurrency);
      const results = {
        success: [],
        failed: []
      };

      const tasks = userIdsToSync.map(userId =>
        limit(async () => {
          try {
            // 每个请求间隔（避免触发限流）
            await this.sleep(this.apiConfig.requestDelay);

            const userInfo = await zsxqService.getUserDetail(userId);
            await this.cacheUser(userInfo);
            results.success.push(userId);

            logger.info(`同步成功: user_id=${userId}, number=${userInfo.number}`);
          } catch (error) {
            results.failed.push({ user_id: userId, error: error.message });
            logger.error(`同步失败: user_id=${userId}, error=${error.message}`);
          }
        })
      );

      await Promise.all(tasks);

      const durationMs = Date.now() - startTime;

      logger.info(`批量同步完成: 成功=${results.success.length}, 失败=${results.failed.length}, 耗时=${durationMs}ms`);

      return {
        sync_count: userIdsToSync.length,
        success_count: results.success.length,
        failed_count: results.failed.length,
        skipped_count: skippedCount,
        duration_ms: durationMs,
        failed_users: results.failed
      };

    } catch (error) {
      logger.error(`批量同步用户信息失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 清空用户缓存（管理员功能）
   * @returns {Promise<Object>} 删除统计
   */
  async clearUserCache() {
    try {
      if (!this.cacheConfig.enabled || !await isRedisAvailable()) {
        throw new Error('Redis 缓存不可用');
      }

      logger.info('开始清空用户缓存');

      // 1. 获取所有用户 ID
      const userIds = await this.redis.smembers('zsxq:users:all');

      // 2. 批量删除用户缓存
      const pipeline = this.redis.pipeline();

      userIds.forEach(userId => {
        pipeline.del(`zsxq:user:${userId}`);
      });

      // 3. 删除索引（需要先获取每个用户的 number）
      // 为了简化，我们直接通过模式匹配删除所有 number 索引
      const numberKeys = await this.redis.keys('zsxq:number:*');
      numberKeys.forEach(key => {
        pipeline.del(key);
      });

      // 4. 删除集合和统计
      pipeline.del('zsxq:users:all');
      pipeline.del('zsxq:stats:cache');

      const results = await pipeline.exec();

      logger.info(`缓存清空完成: 删除 ${results.length} 个键`);

      return {
        deleted_keys: results.length,
        deleted_users: userIds.length
      };

    } catch (error) {
      logger.error(`清空用户缓存失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {Promise<Object>} 缓存统计
   */
  async getCacheStats() {
    try {
      if (!this.cacheConfig.enabled || !await isRedisAvailable()) {
        return {
          total_requests: 0,
          cache_hits: 0,
          cache_misses: 0,
          cache_hit_rate: 0,
          api_calls: 0,
          cached_users_count: 0,
          last_sync_time: null,
          redis_available: false
        };
      }

      const stats = await this.redis.hgetall('zsxq:stats:cache');
      const cachedUsersCount = await this.redis.scard('zsxq:users:all');

      const totalRequests = parseInt(stats.total_requests || 0);
      const cacheHits = parseInt(stats.cache_hits || 0);
      const cacheMisses = parseInt(stats.cache_misses || 0);
      const apiCalls = parseInt(stats.api_calls || 0);
      const lastSyncTime = stats.last_sync_time ? new Date(parseInt(stats.last_sync_time)) : null;

      const cacheHitRate = totalRequests > 0 ? ((cacheHits / totalRequests) * 100).toFixed(2) : 0;

      return {
        total_requests: totalRequests,
        cache_hits: cacheHits,
        cache_misses: cacheMisses,
        cache_hit_rate: parseFloat(cacheHitRate),
        api_calls: apiCalls,
        cached_users_count: cachedUsersCount,
        last_sync_time: lastSyncTime,
        redis_available: true
      };

    } catch (error) {
      logger.error(`获取缓存统计失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 缓存单个用户信息
   * @param {Object} user - 用户信息
   * @private
   */
  async cacheUser(user) {
    try {
      if (!this.cacheConfig.enabled || !await isRedisAvailable()) {
        return;
      }

      const ttl = this.cacheConfig.ttl;
      const now = Date.now();

      const pipeline = this.redis.pipeline();

      // 1. 缓存用户信息（Hash）
      const userCacheData = {
        ...user,
        cached_at: now,
        updated_at: now
      };

      pipeline.hset(`zsxq:user:${user.user_id}`, userCacheData);
      pipeline.expire(`zsxq:user:${user.user_id}`, ttl);

      // 2. 建立 number 索引（String）
      pipeline.set(`zsxq:number:${user.number}`, user.user_id);
      pipeline.expire(`zsxq:number:${user.number}`, ttl);

      // 3. 添加到用户 ID 集合（Set）
      pipeline.sadd('zsxq:users:all', user.user_id);
      pipeline.expire('zsxq:users:all', ttl);

      // 4. 更新最后同步时间
      pipeline.hset('zsxq:stats:cache', 'last_sync_time', now);

      await pipeline.exec();

      logger.debug(`用户信息已缓存: user_id=${user.user_id}, number=${user.number}`);

    } catch (error) {
      logger.error(`缓存用户信息失败: user_id=${user.user_id}, error=${error.message}`);
      throw error;
    }
  }

  /**
   * 批量获取用户信息（使用 Redis Pipeline 优化）
   * @param {Array<string>} userIds - 用户ID列表
   * @returns {Promise<Array<Object>>} 用户信息列表
   * @private
   */
  async getUsersBatch(userIds) {
    try {
      const pipeline = this.redis.pipeline();

      userIds.forEach(userId => {
        pipeline.hgetall(`zsxq:user:${userId}`);
      });

      const results = await pipeline.exec();

      return results
        .map(([err, user]) => {
          if (err || !user || !user.user_id) {
            return null;
          }
          // 转换 number 为数字类型
          if (user.number) {
            user.number = parseInt(user.number);
          }
          return user;
        })
        .filter(user => user !== null);

    } catch (error) {
      logger.error(`批量获取用户信息失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 排序用户列表
   * @param {Array<Object>} users - 用户列表
   * @param {string} sortBy - 排序字段
   * @param {string} order - 排序方向
   * @returns {Array<Object>} 排序后的用户列表
   * @private
   */
  sortUsers(users, sortBy, order) {
    return users.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // 处理日期字段
      if (sortBy === 'join_time') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }

  /**
   * 增加缓存统计计数
   * @param {string} field - 统计字段
   * @private
   */
  async incrementCacheStats(field) {
    try {
      if (!this.cacheConfig.enabled || !await isRedisAvailable()) {
        return;
      }

      await this.redis.hincrby('zsxq:stats:cache', field, 1);
      await this.redis.hincrby('zsxq:stats:cache', 'total_requests', 1);

    } catch (error) {
      logger.debug(`增加缓存统计失败: ${error.message}`);
    }
  }

  /**
   * 延迟函数
   * @param {number} ms - 毫秒数
   * @private
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new UserService();
