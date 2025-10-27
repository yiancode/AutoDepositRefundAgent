require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const logger = require('./utils/logger');
const { success } = require('./utils/response');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');
const { apiLimiter } = require('./middlewares/rate-limit.middleware');
const { timeoutMiddleware, haltOnTimeout, timeoutErrorHandler } = require('./middlewares/timeout.middleware');
const campsRouter = require('./routes/camps');
const usersRouter = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3013;

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
  crossOriginEmbedderPolicy: false // 允许跨域资源
}));

// CORS 配置
const corsOptions = {
  origin: function (origin, callback) {
    // 允许的域名白名单
    const whitelist = process.env.CORS_WHITELIST
      ? process.env.CORS_WHITELIST.split(',')
      : [
          'http://localhost:5173',
          'http://localhost:3000',
          'https://zsxq.dc401.com',  // 生产域名
          'http://zsxq.dc401.com'     // HTTP 备用
        ];

    // 开发环境允许所有来源
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`CORS 阻止来源: ${origin}`);
      callback(new Error('CORS 策略不允许该来源'));
    }
  },
  credentials: true, // 允许携带 Cookie
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// 请求超时中间件
app.use(timeoutMiddleware());
app.use(haltOnTimeout);

// Body 解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: 健康检查
 *     description: 检查服务运行状态
 *     tags: [健康检查]
 *     responses:
 *       200:
 *         description: 服务正常运行
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
app.get('/health', (req, res) => {
  res.json(success({
    status: 'running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV || 'development'
  }, '服务运行正常'));
});

// API 文档
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '训练营退款系统 API 文档'
}));

// API 速率限制
app.use('/api/', apiLimiter);

// API 路由
app.use('/api/camps', campsRouter);
app.use('/api/users', usersRouter);

// 超时错误处理
app.use(timeoutErrorHandler);

// 404 处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

// 启动服务器
const server = app.listen(PORT, () => {
  logger.info(`========================================`);
  logger.info(`知识星球退款系统 API 已启动`);
  logger.info(`端口: ${PORT}`);
  logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`========================================`);
});

// 优雅退出
const gracefulShutdown = (signal) => {
  logger.info(`收到 ${signal} 信号，正在关闭服务器...`);
  server.close(() => {
    logger.info('服务器已关闭');
    process.exit(0);
  });

  // 如果 10 秒内未能关闭，强制退出
  setTimeout(() => {
    logger.error('无法正常关闭服务器，强制退出');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的 Promise 拒绝:', { reason, promise });
});
