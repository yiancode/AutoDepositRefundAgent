const RefundService = require('../../src/services/refund.service');
const ZsxqService = require('../../src/services/zsxq.service');

// Mock ZsxqService
jest.mock('../../src/services/zsxq.service');

describe('RefundService - 单元测试 (Mock 数据)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateRefundList()', () => {
    it('应该正确计算合格和不合格人员', async () => {
      // Mock 数据
      const mockRankingList = [
        {
          planet_user_id: 12345,
          planet_nickname: '用户A',
          planet_alias: '',
          checkined_days: 10,
          rankings: 1
        },
        {
          planet_user_id: 67890,
          planet_nickname: '用户B',
          planet_alias: '',
          checkined_days: 5,
          rankings: 2
        },
        {
          planet_user_id: 11111,
          planet_nickname: '用户C',
          planet_alias: '',
          checkined_days: 7,
          rankings: 3
        }
      ];

      ZsxqService.getRankingList.mockResolvedValue(mockRankingList);

      const result = await RefundService.generateRefundList(123, 7);

      expect(result.refund_list).toHaveLength(3);
      expect(result.statistics.total_count).toBe(3);
      expect(result.statistics.qualified_count).toBe(2); // 10天和7天合格
      expect(result.statistics.unqualified_count).toBe(1); // 5天不合格
      expect(result.statistics.qualified_rate).toBe(66.67);
    });

    it('应该正确处理所有人都合格的情况', async () => {
      const mockRankingList = [
        { planet_user_id: 1, planet_nickname: 'A', planet_alias: '', checkined_days: 10, rankings: 1 },
        { planet_user_id: 2, planet_nickname: 'B', planet_alias: '', checkined_days: 8, rankings: 2 },
        { planet_user_id: 3, planet_nickname: 'C', planet_alias: '', checkined_days: 7, rankings: 3 }
      ];

      ZsxqService.getRankingList.mockResolvedValue(mockRankingList);

      const result = await RefundService.generateRefundList(123, 7);

      expect(result.statistics.qualified_count).toBe(3);
      expect(result.statistics.unqualified_count).toBe(0);
      expect(result.statistics.qualified_rate).toBe(100);
    });

    it('应该正确处理所有人都不合格的情况', async () => {
      const mockRankingList = [
        { planet_user_id: 1, planet_nickname: 'A', planet_alias: '', checkined_days: 3, rankings: 1 },
        { planet_user_id: 2, planet_nickname: 'B', planet_alias: '', checkined_days: 2, rankings: 2 },
        { planet_user_id: 3, planet_nickname: 'C', planet_alias: '', checkined_days: 1, rankings: 3 }
      ];

      ZsxqService.getRankingList.mockResolvedValue(mockRankingList);

      const result = await RefundService.generateRefundList(123, 7);

      expect(result.statistics.qualified_count).toBe(0);
      expect(result.statistics.unqualified_count).toBe(3);
      expect(result.statistics.qualified_rate).toBe(0);
    });

    it('应该正确生成合格名单字符串', async () => {
      const mockRankingList = [
        { planet_user_id: 1, planet_nickname: '张三', planet_alias: '', checkined_days: 10, rankings: 1 },
        { planet_user_id: 2, planet_nickname: '李四', planet_alias: '', checkined_days: 8, rankings: 2 },
        { planet_user_id: 3, planet_nickname: '王五', planet_alias: '', checkined_days: 5, rankings: 3 }
      ];

      ZsxqService.getRankingList.mockResolvedValue(mockRankingList);

      const result = await RefundService.generateRefundList(123, 7);

      expect(result.statistics.qualified_names).toContain('张三');
      expect(result.statistics.qualified_names).toContain('李四');
      expect(result.statistics.qualified_names).not.toContain('王五'); // 不合格
    });

    it('应该正确处理空数据', async () => {
      ZsxqService.getRankingList.mockResolvedValue([]);

      const result = await RefundService.generateRefundList(123, 7);

      expect(result.refund_list).toHaveLength(0);
      expect(result.statistics.total_count).toBe(0);
      expect(result.statistics.qualified_count).toBe(0);
      expect(result.statistics.unqualified_count).toBe(0);
      expect(result.statistics.qualified_rate).toBe(0);
      expect(result.statistics.qualified_names).toBe('');
    });

    it('应该正确处理边界情况: 刚好达到要求', async () => {
      const mockRankingList = [
        { planet_user_id: 1, planet_nickname: 'A', planet_alias: '', checkined_days: 7, rankings: 1 }
      ];

      ZsxqService.getRankingList.mockResolvedValue(mockRankingList);

      const result = await RefundService.generateRefundList(123, 7);

      expect(result.statistics.qualified_count).toBe(1);
      expect(result.refund_list[0].is_qualified).toBe(true);
    });

    it('应该正确处理边界情况: 差一天不合格', async () => {
      const mockRankingList = [
        { planet_user_id: 1, planet_nickname: 'A', planet_alias: '', checkined_days: 6, rankings: 1 }
      ];

      ZsxqService.getRankingList.mockResolvedValue(mockRankingList);

      const result = await RefundService.generateRefundList(123, 7);

      expect(result.statistics.qualified_count).toBe(0);
      expect(result.refund_list[0].is_qualified).toBe(false);
    });

    it('应该正确限制合格名单显示数量', async () => {
      // 生成 25 个合格用户
      const mockRankingList = Array.from({ length: 25 }, (_, i) => ({
        planet_user_id: i + 1,
        planet_nickname: `用户${i + 1}`,
        planet_alias: '',
        checkined_days: 10,
        rankings: i + 1
      }));

      ZsxqService.getRankingList.mockResolvedValue(mockRankingList);

      const result = await RefundService.generateRefundList(123, 7);

      // 应该只显示前 20 个名字，后面加 "..."
      const names = result.statistics.qualified_names.split('、');
      expect(names[names.length - 1]).toBe('...');
    });

    it('应该在 API 调用失败时抛出错误', async () => {
      ZsxqService.getRankingList.mockRejectedValue(new Error('API 调用失败'));

      await expect(RefundService.generateRefundList(123, 7)).rejects.toThrow('API 调用失败');
    });
  });

  describe('边界条件测试', () => {
    it('应该正确处理超大数字的打卡天数', async () => {
      const mockRankingList = [
        { planet_user_id: 1, planet_nickname: 'A', planet_alias: '', checkined_days: 999, rankings: 1 }
      ];

      ZsxqService.getRankingList.mockResolvedValue(mockRankingList);

      const result = await RefundService.generateRefundList(123, 7);

      expect(result.refund_list[0].checkined_days).toBe(999);
      expect(result.refund_list[0].is_qualified).toBe(true);
    });

    it('应该正确处理打卡天数为 0 的情况', async () => {
      const mockRankingList = [
        { planet_user_id: 1, planet_nickname: 'A', planet_alias: '', checkined_days: 0, rankings: 1 }
      ];

      ZsxqService.getRankingList.mockResolvedValue(mockRankingList);

      const result = await RefundService.generateRefundList(123, 7);

      expect(result.refund_list[0].is_qualified).toBe(false);
    });

    it('应该正确处理包含特殊字符的昵称', async () => {
      const mockRankingList = [
        {
          planet_user_id: 1,
          planet_nickname: '测试🔥用户@#$%',
          planet_alias: '',
          checkined_days: 10,
          rankings: 1
        }
      ];

      ZsxqService.getRankingList.mockResolvedValue(mockRankingList);

      const result = await RefundService.generateRefundList(123, 7);

      expect(result.refund_list[0].planet_nickname).toBe('测试🔥用户@#$%');
      expect(result.statistics.qualified_names).toContain('测试🔥用户@#$%');
    });
  });
});
