/**
 * 训练营 API 端到端集成测试
 *
 * 注意：此测试会启动完整的 Express 服务器并实际调用真实的知识星球 API
 * 需要在 .env 文件中配置正确的 Cookie 信息
 */

require('dotenv').config();
const request = require('supertest');
const express = require('express');

// 创建测试应用（复用主应用的配置）
const cors = require('cors');
const helmet = require('helmet');
const { success } = require('../../src/utils/response');
const { errorHandler, notFoundHandler } = require('../../src/middlewares/error.middleware');
const { apiLimiter } = require('../../src/middlewares/rate-limit.middleware');
const { timeoutMiddleware, haltOnTimeout, timeoutErrorHandler } = require('../../src/middlewares/timeout.middleware');
const campsRouter = require('../../src/routes/camps');

let app;

// 辅助函数：在测试之间添加延迟，避免API请求过快
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

beforeAll(() => {
  app = express();

  // 安全防护中间件
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"]
      }
    },
    crossOriginEmbedderPolicy: false
  }));

  // CORS 配置
  app.use(cors({
    origin: function (origin, callback) {
      callback(null, true); // 测试环境允许所有来源
    },
    credentials: true,
    optionsSuccessStatus: 200
  }));

  // 请求超时中间件
  app.use(timeoutMiddleware());
  app.use(haltOnTimeout);

  // Body 解析中间件
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 健康检查
  app.get('/health', (req, res) => {
    res.json(success({ status: 'running' }, '服务运行正常'));
  });

  // API 路由（测试环境不启用速率限制）
  app.use('/api/camps', campsRouter);

  // 超时错误处理
  app.use(timeoutErrorHandler);

  // 404 处理
  app.use(notFoundHandler);

  // 全局错误处理
  app.use(errorHandler);
});

describe('训练营 API E2E 集成测试', () => {
  describe('GET /health - 健康检查', () => {
    test('应该返回服务正常运行状态', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.status).toBe('running');

      console.log('✅ 健康检查接口正常');
    });
  });

  describe('GET /api/camps - 获取训练营列表', () => {
    test('应该成功获取已结束的训练营列表（默认参数）', async () => {
      const response = await request(app)
        .get('/api/camps')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      console.log(`✅ GET /api/camps 成功获取 ${response.body.data.length} 个训练营`);

      if (response.body.data.length > 0) {
        const camp = response.body.data[0];
        expect(camp).toHaveProperty('checkin_id');
        expect(camp).toHaveProperty('title');
        expect(camp).toHaveProperty('checkin_days');
        expect(camp).toHaveProperty('status');

        console.log('第一个训练营:', {
          id: camp.checkin_id,
          title: camp.title,
          days: camp.checkin_days,
          status: camp.status
        });
      }
    }, 30000);

    test('应该支持 scope 参数（ongoing）', async () => {
      const response = await request(app)
        .get('/api/camps')
        .query({ scope: 'ongoing', count: 10 })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);

      console.log(`✅ GET /api/camps?scope=ongoing 成功获取 ${response.body.data.length} 个进行中的训练营`);
    }, 30000);

    test('应该支持 count 参数限制返回数量', async () => {
      const count = 5;
      const response = await request(app)
        .get('/api/camps')
        .query({ count })
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(count);

      console.log(`✅ count=${count} 参数有效，返回 ${response.body.data.length} 个训练营`);
    }, 30000);

    test('应该拒绝无效的 scope 参数', async () => {
      const response = await request(app)
        .get('/api/camps')
        .query({ scope: 'invalid_scope' })
        .expect(400);

      expect(response.body.code).toBe(400);
      expect(response.body.message).toContain('scope');

      console.log('✅ 无效 scope 参数验证正常');
    }, 30000);

    test('应该拒绝超出范围的 count 参数', async () => {
      const response = await request(app)
        .get('/api/camps')
        .query({ count: 9999 })
        .expect(400);

      expect(response.body.code).toBe(400);
      expect(response.body.message).toContain('count');

      console.log('✅ 超范围 count 参数验证正常');
    }, 30000);
  });

  describe('POST /api/camps/:checkinId/refund-list - 生成退款名单', () => {
    let testCheckinId;

    beforeAll(async () => {
      // 添加延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500));

      // 先获取一个真实的训练营ID
      const response = await request(app).get('/api/camps?count=1');

      if (!response.body.data || response.body.data.length === 0) {
        throw new Error('没有可用的训练营进行测试');
      }

      testCheckinId = response.body.data[0].checkin_id;
      console.log(`使用训练营 ID ${testCheckinId} 进行退款名单测试`);
    }, 30000);

    test('应该成功生成退款名单（默认7天）', async () => {
      await delay(300);
      const response = await request(app)
        .post(`/api/camps/${testCheckinId}/refund-list`)
        .send({})
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('refund_list');
      expect(response.body.data).toHaveProperty('statistics');

      const { statistics } = response.body.data;
      expect(statistics).toHaveProperty('total_count');
      expect(statistics).toHaveProperty('qualified_count');
      expect(statistics).toHaveProperty('unqualified_count');
      expect(statistics).toHaveProperty('qualified_rate');

      console.log(`✅ POST /api/camps/${testCheckinId}/refund-list 成功:`, {
        总人数: statistics.total_count,
        合格人数: statistics.qualified_count,
        不合格人数: statistics.unqualified_count,
        合格率: `${statistics.qualified_rate}%`
      });
    }, 60000);

    test('应该支持自定义 required_days 参数', async () => {
      const requiredDays = 3;

      const response = await request(app)
        .post(`/api/camps/${testCheckinId}/refund-list`)
        .send({ required_days: requiredDays })
        .expect(200);

      expect(response.body.data.refund_list.length).toBeGreaterThanOrEqual(0);

      // 验证所有用户的 required_days 都是设置的值
      response.body.data.refund_list.forEach(user => {
        expect(user.required_days).toBe(requiredDays);
      });

      console.log(`✅ 自定义 required_days=${requiredDays} 测试通过`);
    }, 60000);

    test('应该拒绝无效的训练营ID（非数字）', async () => {
      const response = await request(app)
        .post('/api/camps/invalid_id/refund-list')
        .send({ required_days: 7 })
        .expect(400);

      expect(response.body.code).toBe(400);
      expect(response.body.message).toContain('无效的训练营 ID');

      console.log('✅ 无效训练营ID验证正常');
    }, 30000);

    test('应该拒绝无效的 required_days（负数）', async () => {
      const response = await request(app)
        .post(`/api/camps/${testCheckinId}/refund-list`)
        .send({ required_days: -1 })
        .expect(400);

      expect(response.body.code).toBe(400);

      console.log('✅ 负数 required_days 验证正常');
    }, 30000);

    test('应该拒绝超出范围的 required_days', async () => {
      const response = await request(app)
        .post(`/api/camps/${testCheckinId}/refund-list`)
        .send({ required_days: 999 })
        .expect(400);

      expect(response.body.code).toBe(400);

      console.log('✅ 超范围 required_days 验证正常');
    }, 30000);
  });

  describe('GET /api/camps/:checkinId/refund-list/text - 导出文本格式', () => {
    // 使用固定的训练营ID，避免频繁调用API
    const testCheckinId = 8424481182;

    test('应该成功导出退款名单为文本格式', async () => {
      const response = await request(app)
        .get(`/api/camps/${testCheckinId}/refund-list/text`)
        .expect('Content-Type', /text\/plain/)
        .expect(200);

      expect(typeof response.text).toBe('string');
      expect(response.text.length).toBeGreaterThan(0);

      // 验证包含关键内容
      expect(response.text).toContain('知识星球训练营退款名单');
      expect(response.text).toContain('总人数');
      expect(response.text).toContain('合格人数');
      expect(response.text).toContain('【合格名单】');
      expect(response.text).toContain('【不合格名单】');

      console.log(`✅ GET /api/camps/${testCheckinId}/refund-list/text 成功导出文本`);
      console.log(`文本长度: ${response.text.length} 字符`);
    }, 60000);

    test('应该支持 required_days 参数', async () => {
      const response = await request(app)
        .get(`/api/camps/${testCheckinId}/refund-list/text`)
        .query({ required_days: 10 })
        .expect(200);

      expect(response.text.length).toBeGreaterThan(0);

      console.log('✅ 文本导出支持 required_days 参数');
    }, 60000);

    test('应该拒绝无效的训练营ID', async () => {
      const response = await request(app)
        .get('/api/camps/abc/refund-list/text')
        .expect(400);

      expect(response.body.code).toBe(400);

      console.log('✅ 文本导出接口 ID 验证正常');
    }, 30000);
  });

  describe('错误处理', () => {
    test('访问不存在的路由应该返回404', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.code).toBe(404);
      expect(response.body.message).toContain('路径不存在');

      console.log('✅ 404 错误处理正常');
    });

    test('POST 请求缺少 Content-Type 应该能正常处理', async () => {
      const response = await request(app)
        .get('/api/camps?count=1');

      const testCheckinId = response.body.data[0]?.checkin_id;

      if (testCheckinId) {
        const postResponse = await request(app)
          .post(`/api/camps/${testCheckinId}/refund-list`)
          .send('required_days=7')
          .expect(200);

        expect(postResponse.body.code).toBe(200);

        console.log('✅ 不同 Content-Type 处理正常');
      }
    }, 60000);
  });

  describe('完整业务流程测试', () => {
    test('完整流程: 获取训练营 → 生成退款名单 → 导出文本', async () => {
      console.log('\n========== 开始完整业务流程测试 ==========');

      // Step 1: 获取训练营列表
      console.log('Step 1: 获取训练营列表...');
      const campsResponse = await request(app)
        .get('/api/camps')
        .query({ scope: 'over', count: 3 })
        .expect(200);

      expect(campsResponse.body.data.length).toBeGreaterThan(0);
      const camp = campsResponse.body.data[0];

      console.log(`✅ 获取到 ${campsResponse.body.data.length} 个训练营`);
      console.log(`选择训练营: ${camp.title} (ID: ${camp.checkin_id})`);

      // Step 2: 生成退款名单
      console.log('\nStep 2: 生成退款名单...');
      const refundResponse = await request(app)
        .post(`/api/camps/${camp.checkin_id}/refund-list`)
        .send({ required_days: 7 })
        .expect(200);

      const { statistics, refund_list } = refundResponse.body.data;

      console.log(`✅ 退款名单生成成功:`);
      console.log(`   - 总人数: ${statistics.total_count}`);
      console.log(`   - 合格人数: ${statistics.qualified_count}`);
      console.log(`   - 不合格人数: ${statistics.unqualified_count}`);
      console.log(`   - 合格率: ${statistics.qualified_rate}%`);

      // Step 3: 导出文本格式
      console.log('\nStep 3: 导出文本格式...');
      const textResponse = await request(app)
        .get(`/api/camps/${camp.checkin_id}/refund-list/text`)
        .query({ required_days: 7 })
        .expect(200);

      console.log(`✅ 文本导出成功，长度: ${textResponse.text.length} 字符`);

      // 验证文本中包含合格用户昵称
      const qualifiedUsers = refund_list.filter(u => u.is_qualified);
      if (qualifiedUsers.length > 0) {
        const firstQualifiedUser = qualifiedUsers[0];
        expect(textResponse.text).toContain(firstQualifiedUser.planet_nickname);
        console.log(`✅ 验证通过: 文本包含合格用户 "${firstQualifiedUser.planet_nickname}"`);
      }

      console.log('\n========== ✅ 完整业务流程测试通过 ==========\n');
    }, 120000); // 2分钟超时
  });
});
