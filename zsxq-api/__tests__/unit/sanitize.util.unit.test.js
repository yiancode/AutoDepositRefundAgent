const { sanitizeForLog } = require('../../src/utils/sanitize');

describe('Sanitize Utils - 单元测试', () => {
  describe('sanitizeForLog()', () => {
    it('应该过滤掉敏感字段', () => {
      const data = {
        username: 'test',
        password: '123456',
        token: 'abc123',
        email: 'test@example.com'
      };

      const result = sanitizeForLog(data);

      expect(result.username).toBe('test');
      expect(result.password).toBe('[FILTERED]');
      expect(result.token).toBe('[FILTERED]');
      expect(result.email).toBe('test@example.com');
    });

    it('应该过滤嵌套对象中的敏感字段', () => {
      const data = {
        user: {
          name: 'test',
          password: '123456'
        },
        auth: {
          token: 'abc123',
          api_key: 'xyz789'
        }
      };

      const result = sanitizeForLog(data);

      expect(result.user.name).toBe('test');
      expect(result.user.password).toBe('[FILTERED]');
      expect(result.auth.token).toBe('[FILTERED]');
      expect(result.auth.api_key).toBe('[FILTERED]');
    });

    it('应该过滤数组中的敏感字段', () => {
      const data = {
        users: [
          { name: 'user1', password: 'pass1' },
          { name: 'user2', password: 'pass2' }
        ]
      };

      const result = sanitizeForLog(data);

      expect(result.users[0].name).toBe('user1');
      expect(result.users[0].password).toBe('[FILTERED]');
      expect(result.users[1].name).toBe('user2');
      expect(result.users[1].password).toBe('[FILTERED]');
    });

    it('应该处理 null 和 undefined 值', () => {
      const data = {
        field1: null,
        field2: undefined,
        password: '123456'
      };

      const result = sanitizeForLog(data);

      expect(result.field1).toBeNull();
      expect(result.field2).toBeUndefined();
      expect(result.password).toBe('[FILTERED]');
    });

    it('应该处理空对象', () => {
      const result = sanitizeForLog({});
      expect(result).toEqual({});
    });

    it('应该处理非对象类型', () => {
      expect(sanitizeForLog('string')).toBe('string');
      expect(sanitizeForLog(123)).toBe(123);
      expect(sanitizeForLog(true)).toBe(true);
      expect(sanitizeForLog(null)).toBeNull();
    });

    it('应该过滤所有已知敏感字段', () => {
      const sensitiveFields = {
        password: 'pass',
        token: 'tok',
        authorization: 'auth',
        cookie: 'cook',
        secret: 'sec',
        apikey: 'key1',
        api_key: 'key2',
        access_token: 'acc',
        refresh_token: 'ref'
      };

      const result = sanitizeForLog(sensitiveFields);

      Object.keys(sensitiveFields).forEach((key) => {
        expect(result[key]).toBe('[FILTERED]');
      });
    });

    it('应该保留非敏感字段的原始值', () => {
      const data = {
        id: 123,
        name: 'test',
        email: 'test@example.com',
        active: true,
        tags: ['tag1', 'tag2']
      };

      const result = sanitizeForLog(data);

      expect(result).toEqual(data);
    });

    it('应该处理循环引用', () => {
      const data = { name: 'test' };
      data.self = data; // 循环引用

      // 应该不抛出错误
      expect(() => sanitizeForLog(data)).not.toThrow();
    });

    it('应该处理包含函数的对象', () => {
      const data = {
        name: 'test',
        method: function () {
          return 'hello';
        },
        password: '123456'
      };

      const result = sanitizeForLog(data);

      expect(result.name).toBe('test');
      expect(typeof result.method).toBe('function');
      expect(result.password).toBe('[FILTERED]');
    });
  });
});
