require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const { success } = require('./utils/response');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');
const campsRouter = require('./routes/camps');

const app = express();
const PORT = process.env.PORT || 3013;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// 健康检查
app.get('/health', (req, res) => {
  res.json(success({
    status: 'running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }, '服务运行正常'));
});

// API 路由
app.use('/api/camps', campsRouter);

// 404 处理
app.use(notFoundHandler);

// 错误处理
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  logger.info(`========================================`);
  logger.info(`知识星球退款系统 API 已启动`);
  logger.info(`端口: ${PORT}`);
  logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`========================================`);
});

// 优雅退出
process.on('SIGINT', () => {
  logger.info('收到 SIGINT 信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('收到 SIGTERM 信号，正在关闭服务器...');
  process.exit(0);
});
