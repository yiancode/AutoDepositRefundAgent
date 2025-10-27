import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCamps, generateRefundList, getRefundListText } from '@/api/camps';
import request from '@/utils/request';

// Mock request 模块
vi.mock('@/utils/request');

describe('Camps API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCamps', () => {
    it('应该成功获取训练营列表', async () => {
      const mockData = {
        camps: [
          {
            checkin_id: 123,
            title: '测试训练营',
            status: 'over',
            checkin_days: 7,
            joined_count: 100
          }
        ]
      };

      request.mockResolvedValue(mockData);

      const result = await getCamps({ scope: 'over', count: 100 });

      expect(request).toHaveBeenCalledWith({
        url: '/camps',
        method: 'get',
        params: { scope: 'over', count: 100 }
      });
      expect(result).toEqual(mockData);
    });

    it('应该处理获取训练营列表失败的情况', async () => {
      const error = new Error('Network error');
      request.mockRejectedValue(error);

      await expect(getCamps({ scope: 'over' })).rejects.toThrow('Network error');
    });
  });

  describe('generateRefundList', () => {
    it('应该成功生成退款名单', async () => {
      const checkinId = 123;
      const requiredDays = 7;
      const mockData = {
        refund_list: [
          {
            planet_user_id: 88455815452182,
            planet_nickname: '测试用户',
            checkined_days: 10,
            required_days: 7,
            is_qualified: true
          }
        ],
        statistics: {
          total_count: 100,
          qualified_count: 85,
          unqualified_count: 15,
          qualified_rate: 85.0
        }
      };

      request.mockResolvedValue(mockData);

      const result = await generateRefundList(checkinId, { required_days: requiredDays });

      expect(request).toHaveBeenCalledWith({
        url: `/camps/${checkinId}/refund-list`,
        method: 'post',
        data: { required_days: requiredDays }
      });
      expect(result).toEqual(mockData);
      expect(result.refund_list).toHaveLength(1);
      expect(result.statistics.qualified_rate).toBe(85.0);
    });
  });

  describe('getRefundListText', () => {
    it('应该成功获取文本格式退款名单', async () => {
      const checkinId = 123;
      const requiredDays = 7;
      const mockText = '用户1\n用户2\n用户3';

      request.mockResolvedValue(mockText);

      const result = await getRefundListText(checkinId, requiredDays);

      expect(request).toHaveBeenCalledWith({
        url: `/camps/${checkinId}/refund-list/text`,
        method: 'get',
        params: { required_days: requiredDays },
        responseType: 'text'
      });
      expect(result).toBe(mockText);
    });
  });
});
