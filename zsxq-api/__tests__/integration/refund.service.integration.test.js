/**
 * 退款计算服务集成测试
 *
 * 注意：此测试会通过 zsxqService 实际调用知识星球 API
 */

require('dotenv').config();
const refundService = require('../../src/services/refund.service');
const zsxqService = require('../../src/services/zsxq.service');

describe('退款计算服务集成测试', () => {
  let testCheckinId;
  let testCampTitle;

  beforeAll(async () => {
    // 获取一个真实的训练营ID用于测试
    const camps = await zsxqService.getCamps('over', 1);

    if (camps.length === 0) {
      throw new Error('没有可用的训练营进行测试');
    }

    testCheckinId = camps[0].checkin_id;
    testCampTitle = camps[0].title;

    console.log(`使用训练营进行测试:`, {
      id: testCheckinId,
      title: testCampTitle
    });
  }, 30000);

  describe('generateRefundList() - 生成退款名单', () => {
    test('应该成功生成退款名单（默认7天）', async () => {
      const result = await refundService.generateRefundList(testCheckinId);

      // 验证返回结构
      expect(result).toHaveProperty('refund_list');
      expect(result).toHaveProperty('statistics');
      expect(Array.isArray(result.refund_list)).toBe(true);

      // 验证统计信息
      const { statistics } = result;
      expect(statistics).toHaveProperty('total_count');
      expect(statistics).toHaveProperty('qualified_count');
      expect(statistics).toHaveProperty('unqualified_count');
      expect(statistics).toHaveProperty('qualified_rate');
      expect(statistics).toHaveProperty('qualified_names');

      expect(statistics.total_count).toBeGreaterThanOrEqual(0);
      expect(statistics.qualified_count).toBeGreaterThanOrEqual(0);
      expect(statistics.unqualified_count).toBeGreaterThanOrEqual(0);
      expect(statistics.total_count).toBe(
        statistics.qualified_count + statistics.unqualified_count
      );

      console.log(`✅ 退款名单生成成功:`, {
        训练营: testCampTitle,
        总人数: statistics.total_count,
        合格人数: statistics.qualified_count,
        不合格人数: statistics.unqualified_count,
        合格率: `${statistics.qualified_rate}%`
      });

      // 验证退款名单数据
      if (result.refund_list.length > 0) {
        const firstUser = result.refund_list[0];
        expect(firstUser).toHaveProperty('planet_user_id');
        expect(firstUser).toHaveProperty('planet_nickname');
        expect(firstUser).toHaveProperty('checkined_days');
        expect(firstUser).toHaveProperty('required_days');
        expect(firstUser).toHaveProperty('is_qualified');
        expect(typeof firstUser.is_qualified).toBe('boolean');

        console.log(`第一个用户信息:`, {
          昵称: firstUser.planet_nickname,
          打卡天数: firstUser.checkined_days,
          要求天数: firstUser.required_days,
          是否合格: firstUser.is_qualified ? '✅' : '❌'
        });
      }
    }, 60000);

    test('应该支持自定义要求天数（3天）', async () => {
      const requiredDays = 3;
      const result = await refundService.generateRefundList(testCheckinId, requiredDays);

      expect(result.refund_list.length).toBeGreaterThanOrEqual(0);

      // 验证所有用户的 required_days 都是 3
      result.refund_list.forEach(user => {
        expect(user.required_days).toBe(requiredDays);
        // 验证 is_qualified 逻辑正确
        expect(user.is_qualified).toBe(user.checkined_days >= requiredDays);
      });

      console.log(`✅ 自定义要求天数 ${requiredDays} 天测试通过:`, {
        合格人数: result.statistics.qualified_count,
        合格率: `${result.statistics.qualified_rate}%`
      });
    }, 60000);

    test('应该支持严格的要求天数（30天）', async () => {
      const requiredDays = 30;
      const result = await refundService.generateRefundList(testCheckinId, requiredDays);

      expect(result.refund_list.length).toBeGreaterThanOrEqual(0);

      result.refund_list.forEach(user => {
        expect(user.required_days).toBe(requiredDays);
        expect(user.is_qualified).toBe(user.checkined_days >= requiredDays);
      });

      // 30天的要求应该更严格，合格率应该更低
      console.log(`✅ 严格要求天数 ${requiredDays} 天测试通过:`, {
        合格人数: result.statistics.qualified_count,
        合格率: `${result.statistics.qualified_rate}%`
      });
    }, 60000);

    test('合格率计算应该正确', async () => {
      const result = await refundService.generateRefundList(testCheckinId, 7);

      if (result.statistics.total_count > 0) {
        const expectedRate = (
          (result.statistics.qualified_count / result.statistics.total_count) * 100
        ).toFixed(2);

        expect(result.statistics.qualified_rate).toBe(parseFloat(expectedRate));

        console.log(`✅ 合格率计算正确: ${result.statistics.qualified_rate}%`);
      }
    }, 60000);
  });

  describe('exportAsText() - 导出文本格式', () => {
    test('应该成功导出退款名单为文本格式', async () => {
      const result = await refundService.generateRefundList(testCheckinId, 7);
      const textContent = refundService.exportAsText(
        result.refund_list,
        result.statistics
      );

      expect(typeof textContent).toBe('string');
      expect(textContent.length).toBeGreaterThan(0);

      // 验证包含关键信息
      expect(textContent).toContain('知识星球训练营退款名单');
      expect(textContent).toContain('总人数');
      expect(textContent).toContain('合格人数');
      expect(textContent).toContain('不合格人数');
      expect(textContent).toContain('合格率');
      expect(textContent).toContain('【合格名单】');
      expect(textContent).toContain('【不合格名单】');

      console.log(`✅ 文本导出成功，长度: ${textContent.length} 字符`);
      console.log('文本内容预览（前200字符）:');
      console.log(textContent.substring(0, 200));
    }, 60000);

    test('导出的文本应该包含所有合格用户', async () => {
      const result = await refundService.generateRefundList(testCheckinId, 7);
      const textContent = refundService.exportAsText(
        result.refund_list,
        result.statistics
      );

      const qualifiedUsers = result.refund_list.filter(u => u.is_qualified);

      qualifiedUsers.forEach(user => {
        expect(textContent).toContain(user.planet_nickname);
      });

      console.log(`✅ 所有 ${qualifiedUsers.length} 个合格用户都在导出文本中`);
    }, 60000);
  });

  describe('边界情况测试', () => {
    test('使用无效的训练营ID应该抛出错误', async () => {
      const invalidCheckinId = 999999999;

      await expect(refundService.generateRefundList(invalidCheckinId, 7))
        .rejects
        .toThrow();

      console.log(`✅ 无效训练营ID错误处理正常`);
    }, 30000);

    test('空训练营（无打卡数据）应该返回空名单', async () => {
      // 这个测试依赖于实际数据，如果所有训练营都有数据则跳过
      // 仅作为逻辑验证
      const result = await refundService.generateRefundList(testCheckinId, 7);

      if (result.refund_list.length === 0) {
        expect(result.statistics.total_count).toBe(0);
        expect(result.statistics.qualified_count).toBe(0);
        expect(result.statistics.unqualified_count).toBe(0);
        console.log(`✅ 空训练营数据处理正常`);
      }
    }, 60000);
  });
});
