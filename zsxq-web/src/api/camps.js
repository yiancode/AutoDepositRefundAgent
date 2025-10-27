/**
 * 训练营相关 API
 */
import request from '@/utils/request';

/**
 * 获取训练营列表
 * @param {Object} params - 查询参数
 * @param {string} params.scope - 训练营状态: ongoing(进行中) / over(已结束) / closed(已关闭)
 * @param {number} params.count - 返回数量,默认100,最大100
 * @returns {Promise<Object>} { camps: Array }
 */
export function getCamps(params) {
  return request({
    url: '/camps',
    method: 'get',
    params
  });
}

/**
 * 生成退款名单
 * @param {number} checkinId - 训练营ID
 * @param {Object} data - 请求参数
 * @param {number} data.required_days - 完成要求天数
 * @returns {Promise<Object>} { refund_list: Array, statistics: Object }
 */
export function generateRefundList(checkinId, data) {
  return request({
    url: `/camps/${checkinId}/refund-list`,
    method: 'post',
    data
  });
}

/**
 * 获取退款名单（分页查询 - 用于滚动加载）
 * @param {number} checkinId - 训练营ID
 * @param {Object} params - 查询参数
 * @param {number} params.required_days - 完成要求天数
 * @param {number} params.page_size - 每页数量（默认20）
 * @param {number} params.index - 起始 rankings 值（默认0）
 * @returns {Promise<Object>} { refund_list: Array, has_more: Boolean, next_index: Number, page_statistics: Object }
 */
export function getRefundListPaginated(checkinId, params) {
  return request({
    url: `/camps/${checkinId}/refund-list`,
    method: 'get',
    params
  });
}

/**
 * 获取退款名单(文本格式)
 * @param {number} checkinId - 训练营ID
 * @param {number} requiredDays - 完成要求天数
 * @returns {Promise<string>} 文本格式的退款名单
 */
export function getRefundListText(checkinId, requiredDays) {
  return request({
    url: `/camps/${checkinId}/refund-list/text`,
    method: 'get',
    params: { required_days: requiredDays },
    responseType: 'text'
  });
}
