const axios = require('axios');
const logger = require('../utils/logger');

/**
 * 知识星球 API 服务
 */
class ZsxqService {
  constructor() {
    this.baseURL = 'https://api.zsxq.com/v2';
    this.groupId = process.env.ZSXQ_GROUP_ID;

    // 验证必需的环境变量
    this.validateConfig();
  }

  /**
   * 验证配置
   */
  validateConfig() {
    const required = ['ZSXQ_GROUP_ID', 'ZSXQ_X_TIMESTAMP', 'ZSXQ_AUTHORIZATION', 'ZSXQ_X_SIGNATURE'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`缺少必需的环境变量: ${missing.join(', ')}`);
    }
  }

  /**
   * 获取请求头
   */
  getHeaders() {
    return {
      'Host': 'api.zsxq.com',
      'content-type': 'application/json; charset=utf-8',
      'x-timestamp': process.env.ZSXQ_X_TIMESTAMP,
      'authorization': process.env.ZSXQ_AUTHORIZATION,
      'x-signature': process.env.ZSXQ_X_SIGNATURE,
      'x-request-id': this.generateRequestId(),
      'user-agent': 'xiaomiquan/5.28.1',
      'accept': '*/*',
      'accept-language': 'zh-Hans-CN;q=1'
    };
  }

  /**
   * 生成随机 Request ID
   */
  generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * 获取训练营列表
   * @param {string} scope - 状态: ongoing/over/closed
   * @param {number} count - 返回数量
   */
  async getCamps(scope = 'over', count = 100) {
    try {
      logger.info(`获取训练营列表: scope=${scope}, count=${count}`);

      const url = `${this.baseURL}/groups/${this.groupId}/checkins`;
      const response = await axios.get(url, {
        params: { scope, count },
        headers: this.getHeaders(),
        timeout: 10000
      });

      if (!response.data.succeeded) {
        throw new Error('知识星球 API 返回失败');
      }

      const checkins = response.data.resp_data.checkins || [];
      logger.info(`成功获取 ${checkins.length} 个训练营`);

      return checkins.map(camp => ({
        checkin_id: camp.checkin_id,
        title: camp.title,
        checkin_days: camp.checkin_days,
        status: camp.status,
        joined_count: camp.joined_count,
        expiration_time: camp.expiration_time
      }));

    } catch (error) {
      logger.error(`获取训练营列表失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取打卡排行榜（支持自动翻页）
   * @param {number} checkinId - 训练营ID
   */
  async getRankingList(checkinId) {
    try {
      logger.info(`获取打卡排行榜: checkin_id=${checkinId}`);

      let allUsers = [];
      let index = 0;
      let hasMore = true;

      // 自动翻页，最多支持 200 人（2 页）
      while (hasMore && index < 2) {
        const url = `${this.baseURL}/groups/${this.groupId}/checkins/${checkinId}/ranking_list`;
        const response = await axios.get(url, {
          params: { type: 'accumulated', index },
          headers: this.getHeaders(),
          timeout: 10000
        });

        if (!response.data.succeeded) {
          throw new Error('知识星球 API 返回失败');
        }

        const ranking_list = response.data.resp_data.ranking_list || [];
        allUsers = allUsers.concat(ranking_list);

        // 如果返回的数据少于 100 条，说明没有更多数据
        hasMore = ranking_list.length >= 100;
        index++;

        // 防止频繁请求，间隔 200ms
        if (hasMore) {
          await this.sleep(200);
        }
      }

      logger.info(`成功获取 ${allUsers.length} 个用户的打卡记录`);

      return allUsers.map(item => ({
        planet_user_id: item.user.user_id,
        planet_nickname: item.user.name,
        planet_alias: item.user.alias || '',
        rankings: item.rankings,
        checkined_days: item.checkined_days
      }));

    } catch (error) {
      logger.error(`获取打卡排行榜失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 延迟函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new ZsxqService();
