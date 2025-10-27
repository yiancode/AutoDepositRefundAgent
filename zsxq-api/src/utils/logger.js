const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// 日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  })
);

// 日志传输配置
const transports = [
  // 控制台输出
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      logFormat
    )
  }),
  // 错误日志文件（保留 3 天）
  new DailyRotateFile({
    dirname: path.join(__dirname, '../../logs'),
    filename: 'error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxFiles: '3d',
    format: logFormat
  }),
  // 所有日志文件（保留 3 天）
  new DailyRotateFile({
    dirname: path.join(__dirname, '../../logs'),
    filename: 'combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '3d',
    format: logFormat
  })
];

// 创建 logger 实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports
});

module.exports = logger;
