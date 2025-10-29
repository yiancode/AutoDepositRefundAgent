const logger = require('../utils/logger');
const zsxqService = require('./zsxq.service');
const userService = require('./user.service');
const { REFUND } = require('../config/constants');

/**
 * 退款名单计算服务
 */
class RefundService {
  /**
   * 生成退款名单
   * @param {number} checkinId - 训练营ID
   * @param {number} requiredDays - 完成要求天数
   */
  async generateRefundList(checkinId, requiredDays = REFUND.DEFAULT_REQUIRED_DAYS) {
    try {
      logger.info(`生成退款名单: checkin_id=${checkinId}, required_days=${requiredDays}`);

      // 1. 获取打卡排行榜
      const rankingList = await zsxqService.getRankingList(checkinId);

      if (!rankingList || rankingList.length === 0) {
        logger.warn(`训练营 ${checkinId} 无打卡数据`);
        return {
          refund_list: [],
          statistics: {
            total_count: 0,
            qualified_count: 0,
            unqualified_count: 0,
            qualified_rate: 0,
            qualified_names: ''
          }
        };
      }

      // 2. 批量获取用户信息（包含 number）
      // 注意：宽限天数应用在训练营总天数，而非会员打卡天数
      const refundListWithNumber = await Promise.all(
        rankingList.map(async (user) => {
          let userNumber = null;

          try {
            // 尝试从缓存获取用户详情（包含 number）
            const userDetail = await userService.getUserById(user.planet_user_id);
            userNumber = userDetail.number;
          } catch (error) {
            logger.warn(`获取用户 number 失败: user_id=${user.planet_user_id}, error=${error.message}`);
            // 如果获取失败，保持 number 为 null
          }

          return {
            planet_user_id: user.planet_user_id,
            planet_number: userNumber, // 星球成员编号
            planet_nickname: user.planet_nickname,
            planet_alias: user.planet_alias,
            checkined_days: user.checkined_days, // 会员实际打卡天数（不加宽限）
            required_days: requiredDays,
            is_qualified: user.checkined_days >= requiredDays
          };
        })
      );

      const refundList = refundListWithNumber;

      // 3. 统计数据
      const totalCount = refundList.length;
      const qualifiedList = refundList.filter(u => u.is_qualified);
      const qualifiedCount = qualifiedList.length;
      const unqualifiedCount = totalCount - qualifiedCount;
      const qualifiedRate = totalCount > 0 ? ((qualifiedCount / totalCount) * 100).toFixed(2) : 0;

      // 4. 生成合格名单（显示所有合格人员）
      const qualifiedNames = qualifiedList
        .map(u => u.planet_nickname)
        .join('、');

      const result = {
        refund_list: refundList,
        statistics: {
          total_count: totalCount,
          qualified_count: qualifiedCount,
          unqualified_count: unqualifiedCount,
          qualified_rate: parseFloat(qualifiedRate),
          qualified_names: qualifiedNames
        }
      };

      logger.info(`退款名单生成成功: 总人数=${totalCount}, 合格=${qualifiedCount}, 合格率=${qualifiedRate}%`);

      return result;

    } catch (error) {
      logger.error(`生成退款名单失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 生成退款名单（分页版本 - 用于前端滚动加载）
   * @param {number} checkinId - 训练营ID
   * @param {number} requiredDays - 完成要求天数
   * @param {number} pageSize - 每页数量
   * @param {number} startIndex - 起始 rankings 值
   */
  async generateRefundListPaginated(checkinId, requiredDays = REFUND.DEFAULT_REQUIRED_DAYS, pageSize = 20, startIndex = 0) {
    try {
      logger.info(`生成退款名单（分页）: checkin_id=${checkinId}, required_days=${requiredDays}, pageSize=${pageSize}, startIndex=${startIndex}`);

      // 1. 获取打卡排行榜（分页）
      const { users, hasMore, nextIndex } = await zsxqService.getRankingListPaginated(checkinId, pageSize, startIndex);

      if (!users || users.length === 0) {
        logger.warn(`训练营 ${checkinId} 无更多打卡数据（index=${startIndex}）`);
        return {
          refund_list: [],
          has_more: false,
          next_index: startIndex,
          page_statistics: {
            page_count: 0,
            qualified_count: 0,
            unqualified_count: 0
          }
        };
      }

      // 2. 批量获取用户信息（包含 number）
      // 注意：宽限天数应用在训练营总天数，而非会员打卡天数
      const refundListWithNumber = await Promise.all(
        users.map(async (user) => {
          let userNumber = null;

          try {
            // 尝试从缓存获取用户详情（包含 number）
            const userDetail = await userService.getUserById(user.planet_user_id);
            userNumber = userDetail.number;
          } catch (error) {
            logger.warn(`获取用户 number 失败: user_id=${user.planet_user_id}, error=${error.message}`);
            // 如果获取失败，保持 number 为 null
          }

          return {
            planet_user_id: user.planet_user_id,
            planet_number: userNumber, // 星球成员编号
            planet_nickname: user.planet_nickname,
            planet_alias: user.planet_alias,
            checkined_days: user.checkined_days, // 会员实际打卡天数（不加宽限）
            required_days: requiredDays,
            is_qualified: user.checkined_days >= requiredDays
          };
        })
      );

      const refundList = refundListWithNumber;

      // 3. 统计当前页数据
      const pageCount = refundList.length;
      const qualifiedCount = refundList.filter(u => u.is_qualified).length;
      const unqualifiedCount = pageCount - qualifiedCount;

      const result = {
        refund_list: refundList,
        has_more: hasMore,
        next_index: nextIndex,
        page_statistics: {
          page_count: pageCount,
          qualified_count: qualifiedCount,
          unqualified_count: unqualifiedCount
        }
      };

      logger.info(`退款名单（分页）生成成功: 当前页人数=${pageCount}, 合格=${qualifiedCount}, hasMore=${hasMore}, nextIndex=${nextIndex}`);

      return result;

    } catch (error) {
      logger.error(`生成退款名单（分页）失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 导出退款名单（纯文本格式）
   * @param {Array} refundList - 退款名单
   * @param {Object} statistics - 统计信息
   */
  exportAsText(refundList, statistics) {
    const lines = [];

    // 标题和统计信息
    lines.push('='.repeat(60));
    lines.push('知识星球训练营退款名单');
    lines.push('='.repeat(60));
    lines.push('');
    lines.push(`总人数: ${statistics.total_count}`);
    lines.push(`合格人数: ${statistics.qualified_count}`);
    lines.push(`不合格人数: ${statistics.unqualified_count}`);
    lines.push(`合格率: ${statistics.qualified_rate}%`);
    lines.push('');
    lines.push('='.repeat(60));
    lines.push('');

    // 合格名单
    lines.push('【合格名单】');
    lines.push('');
    const qualified = refundList.filter(u => u.is_qualified);
    qualified.forEach((user, index) => {
      lines.push(`${index + 1}. ${user.planet_nickname} (打卡 ${user.checkined_days} 天)`);
    });

    lines.push('');
    lines.push('='.repeat(60));
    lines.push('');

    // 不合格名单
    lines.push('【不合格名单】');
    lines.push('');
    const unqualified = refundList.filter(u => !u.is_qualified);
    unqualified.forEach((user, index) => {
      lines.push(`${index + 1}. ${user.planet_nickname} (打卡 ${user.checkined_days} 天, 需要 ${user.required_days} 天)`);
    });

    return lines.join('\n');
  }
}

module.exports = new RefundService();
