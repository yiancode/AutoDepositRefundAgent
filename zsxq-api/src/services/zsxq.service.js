const axios = require('axios');
const logger = require('../utils/logger');
const { ZSXQ } = require('../config/constants');

/**
 * 知识星球 API 服务
 */
class ZsxqService {
  constructor() {
    this.baseURL = ZSXQ.BASE_URL;
    // 确保 groupId 是字符串类型（知识星球 API 需要）
    this.groupId = String(process.env.ZSXQ_GROUP_ID || '');

    // 创建 Axios 实例（连接复用）
    this.axios = axios.create({
      baseURL: this.baseURL,
      timeout: ZSXQ.TIMEOUT_MS,
      maxRedirects: 5,
      maxContentLength: 50 * 1024 * 1024 // 50MB
    });

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

      const url = `/groups/${this.groupId}/checkins`;
      const response = await this.axios.get(url, {
        params: { scope, count },
        headers: this.getHeaders()
      });

      if (!response.data.succeeded) {
        throw new Error('知识星球 API 返回失败');
      }

      const checkins = response.data.resp_data.checkins || [];
      logger.info(`成功获取 ${checkins.length} 个训练营`);

      // 按创建时间倒序排序（最新的在前面）
      const sortedCheckins = checkins.sort((a, b) => {
        const dateA = new Date(a.create_time);
        const dateB = new Date(b.create_time);
        return dateB - dateA; // 倒序
      });

      // 获取宽限天数配置
      const graceDays = require('../config/constants').REFUND.GRACE_DAYS;

      return sortedCheckins.map(camp => ({
        checkin_id: camp.checkin_id,
        title: camp.title,
        checkin_days: camp.checkin_days, // API原始打卡天数
        actual_checkin_days: camp.checkin_days + graceDays, // 实际打卡天数（加上宽限天数）
        grace_days: graceDays, // 宽限天数
        status: camp.status,
        joined_count: camp.joined_count,
        expiration_time: camp.validity?.expiration_time || camp.expiration_time,
        create_time: camp.create_time
      }));

    } catch (error) {
      logger.error(`获取训练营列表失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取打卡排行榜（分页版本 - 用于前端滚动加载）
   * @param {number} checkinId - 训练营ID
   * @param {number} pageSize - 每页数量（默认20）
   * @param {number} startIndex - 起始 rankings 值（默认0）
   * @returns {Object} { users, hasMore, nextIndex }
   */
  async getRankingListPaginated(checkinId, pageSize = 20, startIndex = 0) {
    try {
      logger.info(`获取打卡排行榜（分页）: checkin_id=${checkinId}, pageSize=${pageSize}, startIndex=${startIndex}`);

      const url = `/groups/${this.groupId}/checkins/${checkinId}/ranking_list`;

      const response = await this.axios.get(url, {
        params: { type: 'accumulated', index: startIndex },
        headers: this.getHeaders()
      });

      if (!response.data.succeeded) {
        logger.warn(`获取排行榜失败（index=${startIndex}）`);
        return { users: [], hasMore: false, nextIndex: startIndex };
      }

      const ranking_list = response.data.resp_data.ranking_list || [];

      // 如果返回数据为空，说明没有更多数据
      if (ranking_list.length === 0) {
        logger.info(`没有更多数据（index=${startIndex}）`);
        return { users: [], hasMore: false, nextIndex: startIndex };
      }

      // 知识星球API每页默认返回约21条数据
      // 如果返回数据少于21条，说明已经是最后一页
      const ZSXQ_PAGE_SIZE = 21;
      const hasMore = ranking_list.length >= ZSXQ_PAGE_SIZE;

      logger.info(`API返回 ${ranking_list.length} 条原始数据，hasMore=${hasMore}`);

      // 截取指定数量的数据返回给前端
      const slicedList = ranking_list.slice(0, pageSize);

      // nextIndex: 如果还有更多数据，使用API返回的最后一条的 rankings 值
      // 注意：这里用的是原始API返回的最后一条（第21条），而不是截取后的第20条
      const lastItemFromApi = ranking_list[ranking_list.length - 1];
      const nextIndex = hasMore ? lastItemFromApi.rankings : startIndex;

      logger.info(`截取前 ${slicedList.length} 条返回，nextIndex=${nextIndex}`);

      const users = slicedList.map(item => ({
        planet_user_id: item.user.user_id,
        planet_nickname: item.user.name,
        planet_alias: item.user.alias || '',
        rankings: item.rankings,
        checkined_days: item.checkined_days
      }));

      logger.info(`分页获取成功: 返回 ${users.length} 个用户，hasMore=${hasMore}, nextIndex=${nextIndex}`);

      return { users, hasMore, nextIndex };

    } catch (error) {
      logger.error(`获取打卡排行榜（分页）失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取打卡排行榜（支持自动翻页 - 获取所有数据）
   * @param {number} checkinId - 训练营ID
   */
  async getRankingList(checkinId) {
    try {
      logger.info(`获取打卡排行榜: checkin_id=${checkinId}`);

      let allUsers = [];
      let index = 0;
      let pageCount = 0;
      const maxPages = 100; // 最多支持 100 页，确保能获取所有数据

      // 自动翻页，使用 rankings 值作为下一页的 index
      while (pageCount < maxPages) {
        const url = `/groups/${this.groupId}/checkins/${checkinId}/ranking_list`;

        try {
          const response = await this.axios.get(url, {
            params: { type: 'accumulated', index },
            headers: this.getHeaders()
          });

          if (!response.data.succeeded) {
            logger.warn(`第 ${pageCount + 1} 页请求失败（index=${index}），停止翻页`);
            break;
          }

          const ranking_list = response.data.resp_data.ranking_list || [];
          const currentCount = ranking_list.length;

          // 如果返回数据为空，说明没有更多数据
          if (currentCount === 0) {
            logger.info(`第 ${pageCount + 1} 页返回空数据（index=${index}），翻页结束`);
            break;
          }

          allUsers = allUsers.concat(ranking_list);
          pageCount++;
          logger.info(`第 ${pageCount} 页获取 ${currentCount} 个用户，累计 ${allUsers.length} 个用户 (index=${index})`);

          // 使用最后一条记录的 rankings 值作为下一页的 index
          const lastItem = ranking_list[ranking_list.length - 1];
          index = lastItem.rankings;

          // 防止频繁请求，等待一段时间再请求下一页
          await this.sleep(ZSXQ.REQUEST_DELAY_MS);
        } catch (error) {
          // 如果某一页请求失败，记录错误但不中断整个流程
          logger.warn(`第 ${pageCount + 1} 页请求异常（index=${index}）: ${error.message}，停止翻页`);
          break;
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
   * 获取用户详细信息（包含 number 字段）
   * @param {string} userId - 知识星球用户ID
   * @returns {Promise<Object>} 用户信息
   */
  async getUserDetail(userId) {
    try {
      logger.info(`获取用户详情: user_id=${userId}`);

      const url = `/groups/${this.groupId}/members/${userId}/summary`;

      const response = await this.axios.get(url, {
        headers: this.getHeaders()
      });

      if (!response.data.succeeded) {
        throw new Error(`知识星球 API 返回失败: ${response.data.message || '未知错误'}`);
      }

      const member = response.data.resp_data.member;

      const userInfo = {
        user_id: String(member.user_id),
        number: member.number,
        name: member.name,
        unique_id: member.unique_id || '',
        avatar_url: member.avatar_url || '',
        join_time: member.join_time || '',
        status: member.status || 'joined',
        expired_time: member.expired_time || '',
        introduction: member.introduction || ''
      };

      logger.info(`用户详情获取成功: user_id=${userId}, number=${userInfo.number}, name=${userInfo.name}`);

      return userInfo;
    } catch (error) {
      logger.error(`获取用户详情失败: user_id=${userId}, error=${error.message}`);
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
