/**
 * 知识星球 API 服务集成测试
 *
 * 注意：此测试会实际调用知识星球 API
 * 需要在 .env 文件中配置正确的 Cookie 信息
 */

require('dotenv').config();
const ZsxqService = require('../../src/services/zsxq.service');

describe('知识星球 API 服务集成测试', () => {
  let zsxqService;

  beforeAll(() => {
    // 验证环境变量是否配置
    const requiredEnv = ['ZSXQ_GROUP_ID', 'ZSXQ_X_TIMESTAMP', 'ZSXQ_AUTHORIZATION', 'ZSXQ_X_SIGNATURE'];
    const missing = requiredEnv.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`缺少必需的环境变量: ${missing.join(', ')}`);
    }

    zsxqService = require('../../src/services/zsxq.service');
  });

  describe('getCamps() - 获取训练营列表', () => {
    test('应该成功获取已结束的训练营列表', async () => {
      const camps = await zsxqService.getCamps('over', 10);

      expect(camps).toBeDefined();
      expect(Array.isArray(camps)).toBe(true);

      console.log(`✅ 成功获取 ${camps.length} 个训练营`);

      if (camps.length > 0) {
        const firstCamp = camps[0];
        expect(firstCamp).toHaveProperty('checkin_id');
        expect(firstCamp).toHaveProperty('title');
        expect(firstCamp).toHaveProperty('checkin_days');
        expect(firstCamp).toHaveProperty('status');
        expect(firstCamp).toHaveProperty('joined_count');

        console.log(`第一个训练营信息:`, {
          id: firstCamp.checkin_id,
          title: firstCamp.title,
          days: firstCamp.checkin_days,
          status: firstCamp.status,
          members: firstCamp.joined_count
        });
      }
    }, 30000);

    test('应该成功获取进行中的训练营列表', async () => {
      const camps = await zsxqService.getCamps('ongoing', 10);

      expect(camps).toBeDefined();
      expect(Array.isArray(camps)).toBe(true);

      console.log(`✅ 成功获取 ${camps.length} 个进行中的训练营`);
    }, 30000);
  });

  describe('getRankingList() - 获取打卡排行榜', () => {
    let testCheckinId;

    beforeAll(async () => {
      // 先获取一个训练营ID用于测试
      const camps = await zsxqService.getCamps('over', 1);

      if (camps.length === 0) {
        throw new Error('没有可用的训练营进行测试');
      }

      testCheckinId = camps[0].checkin_id;
      console.log(`使用训练营 ID: ${testCheckinId} (${camps[0].title}) 进行测试`);
    }, 30000);

    test('应该成功获取打卡排行榜数据', async () => {
      const rankingList = await zsxqService.getRankingList(testCheckinId);

      expect(rankingList).toBeDefined();
      expect(Array.isArray(rankingList)).toBe(true);

      console.log(`✅ 成功获取 ${rankingList.length} 个用户的打卡记录`);

      if (rankingList.length > 0) {
        const firstUser = rankingList[0];
        expect(firstUser).toHaveProperty('planet_user_id');
        expect(firstUser).toHaveProperty('planet_nickname');
        expect(firstUser).toHaveProperty('checkined_days');
        expect(typeof firstUser.checkined_days).toBe('number');

        console.log(`排名第一的用户:`, {
          nickname: firstUser.planet_nickname,
          checkinedDays: firstUser.checkined_days
        });
      }
    }, 60000); // 排行榜可能需要翻页，设置更长的超时时间

    test('获取到的用户数据应该包含正确的字段', async () => {
      const rankingList = await zsxqService.getRankingList(testCheckinId);

      if (rankingList.length > 0) {
        rankingList.forEach(user => {
          expect(user.planet_user_id).toBeDefined();
          expect(user.planet_nickname).toBeDefined();
          expect(user.checkined_days).toBeGreaterThanOrEqual(0);
          expect(typeof user.planet_nickname).toBe('string');
        });

        console.log(`✅ 所有 ${rankingList.length} 个用户数据格式验证通过`);
      }
    }, 60000);
  });

  describe('API 错误处理', () => {
    test('使用无效的训练营ID应该抛出错误', async () => {
      const invalidCheckinId = 999999999;

      await expect(zsxqService.getRankingList(invalidCheckinId))
        .rejects
        .toThrow();

      console.log(`✅ 无效ID错误处理正常`);
    }, 30000);
  });
});
