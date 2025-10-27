/**
 * Swagger API 文档配置
 */
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '知识星球训练营退款系统 API',
      version: '1.0.0',
      description: `
        知识星球训练营自动押金退款系统 API 文档。

        ## 功能概述
        - 获取训练营列表
        - 生成退款名单
        - 导出退款名单(文本格式)

        ## 认证方式
        系统使用知识星球 Cookie 进行 API 认证，Cookie 配置在环境变量中。
      `,
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3013',
        description: '开发环境'
      },
      {
        url: 'https://api.example.com',
        description: '生产环境'
      }
    ],
    tags: [
      {
        name: '训练营管理',
        description: '训练营相关接口'
      },
      {
        name: '健康检查',
        description: '系统健康检查接口'
      }
    ],
    components: {
      schemas: {
        Camp: {
          type: 'object',
          properties: {
            checkin_id: {
              type: 'integer',
              description: '训练营ID',
              example: 8424481182
            },
            title: {
              type: 'string',
              description: '训练营名称',
              example: '2510 AI写作(软件文档)'
            },
            status: {
              type: 'string',
              enum: ['ongoing', 'over', 'closed'],
              description: '训练营状态',
              example: 'over'
            },
            checkin_days: {
              type: 'integer',
              description: '打卡天数',
              example: 9
            },
            joined_count: {
              type: 'integer',
              description: '参与人数',
              example: 99
            },
            expiration_time: {
              type: 'string',
              format: 'date-time',
              description: '结束时间',
              example: '2025-10-27T12:00:00Z'
            }
          }
        },
        RefundListItem: {
          type: 'object',
          properties: {
            planet_user_id: {
              type: 'integer',
              description: '星球用户ID',
              example: 88455815452182
            },
            planet_nickname: {
              type: 'string',
              description: '星球昵称',
              example: '球球的副业探索路'
            },
            checkined_days: {
              type: 'integer',
              description: '已打卡天数',
              example: 10
            },
            required_days: {
              type: 'integer',
              description: '要求打卡天数',
              example: 7
            },
            is_qualified: {
              type: 'boolean',
              description: '是否合格',
              example: true
            }
          }
        },
        Statistics: {
          type: 'object',
          properties: {
            total_count: {
              type: 'integer',
              description: '总人数',
              example: 99
            },
            qualified_count: {
              type: 'integer',
              description: '合格人数',
              example: 85
            },
            unqualified_count: {
              type: 'integer',
              description: '不合格人数',
              example: 14
            },
            qualified_rate: {
              type: 'number',
              format: 'float',
              description: '合格率(%)',
              example: 85.86
            },
            qualified_names: {
              type: 'string',
              description: '合格用户昵称(逗号分隔)',
              example: '球球的副业探索路、Aaron、向阳...'
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            code: {
              type: 'integer',
              description: '响应状态码',
              example: 200
            },
            message: {
              type: 'string',
              description: '响应消息',
              example: '成功'
            },
            data: {
              type: 'object',
              description: '响应数据'
            },
            timestamp: {
              type: 'integer',
              description: '时间戳',
              example: 1730000000000
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            code: {
              type: 'integer',
              description: '错误状态码',
              example: 500
            },
            message: {
              type: 'string',
              description: '错误消息',
              example: '请求失败'
            },
            timestamp: {
              type: 'integer',
              description: '时间戳',
              example: 1730000000000
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/index.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;
