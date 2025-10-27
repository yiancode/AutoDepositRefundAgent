# zsxq-api - 知识星球训练营退款系统后端

Node.js + Express.js 实现的轻量级 API 服务，用于生成知识星球训练营退款名单。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入真实的知识星球 API 参数：

```env
PORT=3013
NODE_ENV=development

# 知识星球 API 配置
ZSXQ_GROUP_ID=你的星球ID
ZSXQ_X_TIMESTAMP=时间戳
ZSXQ_AUTHORIZATION=Bearer token
ZSXQ_X_SIGNATURE=签名
```

**获取知识星球 Cookie 参数**:

1. 浏览器登录知识星球 https://wx.zsxq.com/
2. 打开 DevTools → Network
3. 刷新页面，找到任意 API 请求（如 `checkins`）
4. 复制 Request Headers 中的 `x-timestamp`, `authorization`, `x-signature`

### 3. 启动服务

**开发环境**（热重载）:
```bash
npm run dev
```

**生产环境**:
```bash
npm start
```

**使用 PM2**:
```bash
npm run pm2:start    # 启动
npm run pm2:stop     # 停止
npm run pm2:restart  # 重启
npm run pm2:logs     # 查看日志
```

### 4. 验证服务

访问健康检查接口：
```bash
curl http://localhost:3013/health
```

预期响应：
```json
{
  "code": 200,
  "message": "服务运行正常",
  "data": {
    "status": "running",
    "timestamp": "2025-10-27T...",
    "uptime": 12.345
  },
  "timestamp": 1730000000000
}
```

## API 接口

### 1. 获取训练营列表

**请求**:
```
GET /api/camps?scope=over&count=100
```

**参数**:
- `scope`: 状态筛选 (ongoing/over/closed)，默认 `over`
- `count`: 返回数量，默认 `100`

**响应**:
```json
{
  "code": 200,
  "message": "成功获取 10 个训练营",
  "data": [
    {
      "checkin_id": 12345,
      "title": "AI 编程训练营 第1期",
      "checkin_days": 7,
      "status": "over",
      "joined_count": 99,
      "expiration_time": "2025-11-01T00:00:00.000Z"
    }
  ],
  "timestamp": 1730000000000
}
```

### 2. 生成退款名单

**请求**:
```
POST /api/camps/:checkinId/refund-list
Content-Type: application/json

{
  "required_days": 7
}
```

**参数**:
- `checkinId`: 训练营 ID（URL 参数）
- `required_days`: 完成要求天数（默认 7）

**响应**:
```json
{
  "code": 200,
  "message": "退款名单生成成功",
  "data": {
    "refund_list": [
      {
        "planet_user_id": 88455815452182,
        "planet_nickname": "球球的副业探索路",
        "planet_alias": "",
        "checkined_days": 10,
        "required_days": 7,
        "is_qualified": true
      }
    ],
    "statistics": {
      "total_count": 99,
      "qualified_count": 85,
      "unqualified_count": 14,
      "qualified_rate": 85.86,
      "qualified_names": "球球的副业探索路、Aaron、向阳..."
    }
  },
  "timestamp": 1730000000000
}
```

### 3. 导出退款名单（文本格式）

**请求**:
```
GET /api/camps/:checkinId/refund-list/text?required_days=7
```

**响应**:
```
============================================================
知识星球训练营退款名单
============================================================

总人数: 99
合格人数: 85
不合格人数: 14
合格率: 85.86%

============================================================

【合格名单】

1. 球球的副业探索路 (打卡 10 天)
2. Aaron (打卡 8 天)
...
```

## 项目结构

```
zsxq-api/
├── src/
│   ├── index.js                 # 服务器入口
│   ├── routes/
│   │   └── camps.js             # 训练营路由
│   ├── services/
│   │   ├── zsxq.service.js      # 知识星球 API 封装
│   │   └── refund.service.js    # 退款名单计算
│   ├── middlewares/
│   │   └── error.middleware.js  # 错误处理
│   └── utils/
│       ├── logger.js            # Winston 日志
│       └── response.js          # 统一响应格式
├── logs/                        # 日志文件（自动生成）
├── .env                         # 环境变量（需手动创建）
├── .env.example                 # 环境变量模板
├── package.json                 # 项目配置
└── ecosystem.config.js          # PM2 配置
```

## 日志管理

日志文件位于 `logs/` 目录：

- `combined-YYYY-MM-DD.log`: 所有日志
- `error-YYYY-MM-DD.log`: 错误日志

日志保留策略：**3 天**

## 常见问题

### 1. Cookie 过期

**症状**: API 返回 `403 Forbidden`，错误信息 "知识星球 Cookie 已过期"

**解决方案**: 重新从浏览器 DevTools 获取最新的 Cookie 参数，更新 `.env` 文件

### 2. 缺少环境变量

**症状**: 启动时报错 "缺少必需的环境变量: ..."

**解决方案**: 检查 `.env` 文件是否存在，确保所有必需参数都已配置

### 3. 端口占用

**症状**: 启动时报错 "EADDRINUSE"

**解决方案**:
```bash
# 查找占用端口的进程
lsof -i :3013

# 杀死进程
kill -9 <PID>
```

## 开发规范

- 所有 API 错误都通过 `errorHandler` 中间件统一处理
- 使用 Winston 记录日志，避免使用 `console.log`
- 统一响应格式：`{ code, message, data, timestamp }`
- 所有异步操作使用 `async/await`，并捕获异常

## 技术栈

- **Node.js**: 18+
- **Express.js**: 4.x
- **Axios**: HTTP 客户端
- **Winston**: 日志管理
- **dotenv**: 环境变量管理
- **PM2**: 进程管理（生产环境）
