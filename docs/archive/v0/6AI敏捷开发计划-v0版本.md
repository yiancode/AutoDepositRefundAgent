# 知识星球训练营退款系统 v0 - AI 敏捷开发计划

## 📋 文档信息
- **版本**: v0.1
- **创建日期**: 2025-10-27
- **开发模式**: AI Vibe Coding (全程 AI 编码)
- **总时长**: 4 天 (32 小时)
- **团队角色**: 人类负责设计和测试，AI 负责编码实现

---

## 🎯 v0 版本目标

**核心诉求**: 快速实现退款名单生成功能，解决手工统计痛点

**范围界定**:
- ✅ 封装知识星球 API
- ✅ 计算退款名单
- ✅ 导出 Excel 和图片
- ❌ 不包含数据库、支付、自动退款（留待 v1）

**技术栈**:
- 后端: Node.js + Express.js
- 前端: Vue 3 + Vite + Element Plus
- 部署: zsxq.dc401.com (Nginx + PM2)

---

## 📊 Sprint 规划总览

### Sprint 划分策略

采用 **4 个 Sprint**，每个 Sprint 1 天（8小时），每个功能模块独立可测试：

| Sprint | 时间 | 核心目标 | 交付物 | 验收标准 |
|--------|------|---------|--------|---------|
| **Sprint 0** | Day 0 (4h) | 环境搭建 + 项目骨架 | 可运行的空项目 | 前后端启动成功 |
| **Sprint 1** | Day 1 (8h) | 后端 API + 知识星球对接 | 可调用的 API 接口 | Postman 测试通过 |
| **Sprint 2** | Day 2 (8h) | 前端页面 + 数据展示 | 可交互的 Web 页面 | 手动测试通过 |
| **Sprint 3** | Day 3 (8h) | 导出功能 + 部署上线 | 生产环境可用系统 | 线上功能验证 |
| **缓冲时间** | Day 4 (4h) | Bug 修复 + 优化 | 最终交付版本 | 用户验收通过 |

---

## 🚀 Sprint 0: 环境搭建 + 项目骨架

### 📅 时间安排
- **预计时间**: 4 小时
- **优先级**: P0 (最高)

### 🎯 目标
创建前后端项目骨架，配置开发环境，确保项目可运行。

---

### 📦 Task 0.1: 后端项目初始化

**预计时间**: 1.5 小时

#### AI 提示词 (Prompt)

```markdown
# 任务描述
创建一个 Node.js + Express.js 后端项目骨架，用于封装知识星球 API。

## 技术要求
- Node.js 18+
- Express.js 4.x
- 项目名称: `zsxq-api`
- 端口: 3013
- 不使用数据库，纯 API 代理服务

## 目录结构
```
zsxq-api/
├── src/
│   ├── index.js              # 入口文件
│   ├── routes/
│   │   └── camps.js          # 训练营相关路由
│   ├── services/
│   │   ├── zsxq.service.js   # 知识星球 API 服务
│   │   └── refund.service.js # 退款名单计算服务
│   ├── middlewares/
│   │   ├── auth.middleware.js    # API Key 鉴权中间件
│   │   └── error.middleware.js   # 统一错误处理
│   ├── utils/
│   │   ├── logger.js         # 日志工具 (Winston)
│   │   └── response.js       # 统一响应格式
│   └── config/
│       └── constants.js      # 常量配置
├── .env.example              # 环境变量示例
├── .env                      # 环境变量 (不提交 Git)
├── .gitignore
├── package.json
├── README.md
└── ecosystem.config.js       # PM2 配置文件
```

## 功能实现清单

### 1. 初始化项目
- [ ] 创建项目目录 `zsxq-api`
- [ ] 运行 `npm init -y`
- [ ] 安装依赖:
  ```bash
  npm install express axios dotenv winston cors
  npm install nodemon --save-dev
  ```

### 2. 创建入口文件 `src/index.js`
```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
const errorMiddleware = require('./middlewares/error.middleware');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3013;

// 中间件
app.use(cors());
app.use(express.json());

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({
    code: 200,
    message: '服务运行正常',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString()
    }
  });
});

// 路由
app.use('/api/camps', require('./routes/camps'));

// 错误处理中间件
app.use(errorMiddleware);

// 启动服务
app.listen(PORT, () => {
  logger.info(`🚀 服务器启动成功: http://localhost:${PORT}`);
  logger.info(`📝 健康检查: http://localhost:${PORT}/health`);
});

module.exports = app;
```

### 3. 创建统一响应格式 `src/utils/response.js`
```javascript
/**
 * 统一成功响应
 */
function success(data, message = '成功') {
  return {
    code: 200,
    message,
    data,
    timestamp: Date.now()
  };
}

/**
 * 统一错误响应
 */
function error(message = '请求失败', code = 500) {
  return {
    code,
    message,
    data: null,
    timestamp: Date.now()
  };
}

module.exports = { success, error };
```

### 4. 创建日志工具 `src/utils/logger.js`
```javascript
const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.colorize({ all: true })
    }),
    // 文件输出 (保留 3 天)
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/app.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 3, // 保留 3 个文件
      tailable: true
    })
  ]
});

module.exports = logger;
```

### 5. 创建错误处理中间件 `src/middlewares/error.middleware.js`
```javascript
const logger = require('../utils/logger');
const { error } = require('../utils/response');

function errorMiddleware(err, req, res, next) {
  logger.error(`错误: ${err.message}`);
  logger.error(`堆栈: ${err.stack}`);

  // 知识星球 Cookie 过期
  if (err.response && err.response.status === 401) {
    return res.status(403).json(error('知识星球 Cookie 已过期，请更新配置', 403));
  }

  // 参数验证错误
  if (err.name === 'ValidationError') {
    return res.status(400).json(error(err.message, 400));
  }

  // 其他错误
  res.status(500).json(error('服务器内部错误', 500));
}

module.exports = errorMiddleware;
```

### 6. 创建 `.env.example`
```env
# 服务配置
PORT=3013
NODE_ENV=development

# API 鉴权 Key
API_KEY=your_api_key_here

# 知识星球配置
ZSXQ_GROUP_ID=15555411412112
ZSXQ_X_TIMESTAMP=your_timestamp
ZSXQ_AUTHORIZATION=your_authorization
ZSXQ_X_SIGNATURE=your_signature
```

### 7. 创建 `package.json` scripts
```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "pm2:start": "pm2 start ecosystem.config.js",
    "pm2:stop": "pm2 stop zsxq-api",
    "pm2:restart": "pm2 restart zsxq-api",
    "pm2:logs": "pm2 logs zsxq-api"
  }
}
```

### 8. 创建 PM2 配置 `ecosystem.config.js`
```javascript
module.exports = {
  apps: [{
    name: 'zsxq-api',
    script: 'src/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production',
      PORT: 3013
    },
    error_file: 'logs/pm2-error.log',
    out_file: 'logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
```

### 9. 创建 `.gitignore`
```
node_modules/
.env
logs/
*.log
.DS_Store
```

## 验收标准
- [ ] 运行 `npm run dev` 启动成功
- [ ] 访问 `http://localhost:3013/health` 返回 200 状态码
- [ ] 日志文件正常生成在 `logs/app.log`
- [ ] 没有 ESLint 或语法错误
```

#### 预期输出
- ✅ 后端项目目录结构完整
- ✅ 可运行的 Express 服务
- ✅ 健康检查接口可访问

---

### 📦 Task 0.2: 前端项目初始化

**预计时间**: 1.5 小时

#### AI 提示词 (Prompt)

```markdown
# 任务描述
创建一个 Vue 3 + Vite + Element Plus 前端项目骨架，用于展示退款名单。

## 技术要求
- Vue 3.3+
- Vite 5.x
- Element Plus 2.4+
- 项目名称: `zsxq-web`
- 端口: 5173 (开发环境)

## 目录结构
```
zsxq-web/
├── src/
│   ├── main.js               # 入口文件
│   ├── App.vue               # 根组件
│   ├── views/
│   │   ├── CampList.vue      # 训练营列表页面
│   │   └── RefundList.vue    # 退款名单页面
│   ├── components/
│   │   ├── StatisticsCard.vue  # 统计卡片组件
│   │   └── ExportButtons.vue   # 导出按钮组件
│   ├── api/
│   │   └── camps.js          # 训练营 API 封装
│   ├── utils/
│   │   ├── request.js        # Axios 封装
│   │   └── export.js         # 导出工具 (Excel/图片)
│   ├── router/
│   │   └── index.js          # 路由配置
│   └── assets/
│       └── styles/
│           └── global.css    # 全局样式
├── public/
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

## 功能实现清单

### 1. 初始化项目
```bash
npm create vite@latest zsxq-web -- --template vue
cd zsxq-web
npm install
npm install element-plus axios vue-router xlsx html2canvas
```

### 2. 配置 `vite.config.js`
```javascript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3013',
        changeOrigin: true
      }
    }
  }
});
```

### 3. 配置 Element Plus `src/main.js`
```javascript
import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import App from './App.vue';
import router from './router';
import '@/assets/styles/global.css';

const app = createApp(App);

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(ElementPlus);
app.use(router);
app.mount('#app');
```

### 4. 创建路由 `src/router/index.js`
```javascript
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    redirect: '/camps'
  },
  {
    path: '/camps',
    name: 'CampList',
    component: () => import('@/views/CampList.vue'),
    meta: { title: '训练营列表' }
  },
  {
    path: '/camps/:checkinId/refund',
    name: 'RefundList',
    component: () => import('@/views/RefundList.vue'),
    meta: { title: '退款名单' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守卫：设置页面标题
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '训练营退款系统';
  next();
});

export default router;
```

### 5. 封装 Axios `src/utils/request.js`
```javascript
import axios from 'axios';
import { ElMessage } from 'element-plus';

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 添加 API Key (后续实现)
    // config.headers['X-API-Key'] = 'xxx';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { code, message, data } = response.data;
    if (code === 200) {
      return data;
    } else {
      ElMessage.error(message || '请求失败');
      return Promise.reject(new Error(message));
    }
  },
  (error) => {
    // Cookie 过期错误
    if (error.response && error.response.status === 403) {
      ElMessage.error('知识星球 Cookie 已过期，请联系管理员更新');
    } else {
      ElMessage.error(error.message || '网络错误');
    }
    return Promise.reject(error);
  }
);

export default request;
```

### 6. 创建 API 封装 `src/api/camps.js`
```javascript
import request from '@/utils/request';

/**
 * 获取训练营列表
 */
export function getCamps(params) {
  return request({
    url: '/camps',
    method: 'get',
    params
  });
}

/**
 * 生成退款名单
 */
export function generateRefundList(checkinId, data) {
  return request({
    url: `/camps/${checkinId}/refund-list`,
    method: 'post',
    data
  });
}
```

### 7. 创建全局样式 `src/assets/styles/global.css`
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f7fa;
}

#app {
  min-height: 100vh;
  padding: 20px;
}

.page-container {
  max-width: 1400px;
  margin: 0 auto;
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 24px;
}
```

### 8. 创建空的页面组件

**`src/views/CampList.vue`**:
```vue
<template>
  <div class="page-container">
    <h1 class="page-title">训练营列表</h1>
    <p>这是训练营列表页面（待实现）</p>
  </div>
</template>

<script setup>
// 待实现
</script>

<style scoped>
/* 待实现 */
</style>
```

**`src/views/RefundList.vue`**:
```vue
<template>
  <div class="page-container">
    <h1 class="page-title">退款名单</h1>
    <p>这是退款名单页面（待实现）</p>
  </div>
</template>

<script setup>
// 待实现
</script>

<style scoped>
/* 待实现 */
</style>
```

### 9. 修改 `src/App.vue`
```vue
<template>
  <router-view />
</template>

<script setup>
// 根组件
</script>

<style>
@import '@/assets/styles/global.css';
</style>
```

### 10. 更新 `package.json` scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## 验收标准
- [ ] 运行 `npm run dev` 启动成功
- [ ] 访问 `http://localhost:5173` 能看到页面
- [ ] 路由切换正常 (`/camps`, `/camps/123/refund`)
- [ ] Element Plus 组件样式正常加载
- [ ] 浏览器控制台无错误
```

#### 预期输出
- ✅ 前端项目目录结构完整
- ✅ 可运行的 Vue 应用
- ✅ 路由和 Element Plus 配置成功

---

### 📦 Task 0.3: Git 仓库初始化

**预计时间**: 0.5 小时

#### AI 提示词 (Prompt)

```markdown
# 任务描述
初始化 Git 仓库，提交初始代码。

## 操作步骤

### 1. 后端项目
```bash
cd zsxq-api
git init
git add .
git commit -m "chore: 初始化后端项目骨架

- 创建 Express.js 项目结构
- 配置 Winston 日志
- 配置 PM2 进程管理
- 添加健康检查接口"
```

### 2. 前端项目
```bash
cd ../zsxq-web
git init
git add .
git commit -m "chore: 初始化前端项目骨架

- 创建 Vue 3 + Vite 项目
- 配置 Element Plus
- 配置路由和 Axios
- 创建基础页面组件"
```

### 3. (可选) 推送到远程仓库
如果有 GitHub/GitLab 仓库，执行:
```bash
# 后端
cd zsxq-api
git remote add origin <后端仓库地址>
git push -u origin main

# 前端
cd ../zsxq-web
git remote add origin <前端仓库地址>
git push -u origin main
```

## 验收标准
- [ ] Git 仓库初始化成功
- [ ] 初始提交完成
- [ ] (可选) 代码推送到远程仓库
```

---

### 📦 Task 0.4: 测试环境连通性

**预计时间**: 0.5 小时

#### 操作清单

1. **启动后端服务**
   ```bash
   cd zsxq-api
   npm run dev
   ```
   验证: 访问 `http://localhost:3013/health` 返回 200

2. **启动前端服务**
   ```bash
   cd zsxq-web
   npm run dev
   ```
   验证: 访问 `http://localhost:5173` 能看到页面

3. **测试前后端连通性**
   - 在前端尝试调用后端健康检查接口
   - 验证 Vite 代理配置是否生效

#### 验收标准
- [ ] 前后端服务都能正常启动
- [ ] 前端能通过代理访问后端接口
- [ ] 浏览器控制台无错误

---

### ✅ Sprint 0 交付物检查清单

- [ ] 后端项目骨架完整，服务可启动
- [ ] 前端项目骨架完整，页面可访问
- [ ] Git 仓库初始化完成
- [ ] 前后端连通性测试通过
- [ ] 日志系统正常工作
- [ ] 所有代码已提交到 Git

---

## 🚀 Sprint 1: 后端 API + 知识星球对接

### 📅 时间安排
- **预计时间**: 8 小时
- **优先级**: P0 (最高)

### 🎯 目标
实现后端核心功能：封装知识星球 API，提供训练营列表和退款名单生成接口。

---

### 📦 Task 1.1: 实现知识星球 API 服务

**预计时间**: 2.5 小时

#### AI 提示词 (Prompt)

```markdown
# 任务描述
创建知识星球 API 服务，封装调用知识星球接口的逻辑。

## 技术要求
- 使用 Axios 调用知识星球 API
- 从环境变量读取 Cookie
- 支持错误重试机制
- 支持自动翻页（单个训练营最多 200 人）

## 实现文件: `src/services/zsxq.service.js`

```javascript
const axios = require('axios');
const logger = require('../utils/logger');

class ZsxqService {
  constructor() {
    this.baseURL = 'https://api.zsxq.com/v2';
    this.groupId = process.env.ZSXQ_GROUP_ID;
    this.headers = this.getHeaders();
  }

  /**
   * 获取请求头
   */
  getHeaders() {
    return {
      'Host': 'api.zsxq.com',
      'content-type': 'application/json; charset=utf-8',
      'x-timestamp': process.env.ZSXQ_X_TIMESTAMP,
      'authorization': process.env.ZSXQ_AUTHORIZATION,
      'x-signature': process.env.ZSXQ_X_SIGNATURE,
      'x-request-id': this.generateRequestId(),
      'user-agent': 'xiaomiquan/5.28.1',
      'accept': '*/*',
      'accept-language': 'zh-Hans-CN;q=1'
    };
  }

  /**
   * 生成随机 Request ID
   */
  generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * 获取训练营列表
   * @param {string} scope - 状态: ongoing/over/closed
   * @param {number} count - 返回数量
   */
  async getCamps(scope = 'over', count = 100) {
    try {
      logger.info(`获取训练营列表: scope=${scope}, count=${count}`);

      const url = `${this.baseURL}/groups/${this.groupId}/checkins`;
      const response = await axios.get(url, {
        params: { scope, count },
        headers: this.getHeaders()
      });

      if (!response.data.succeeded) {
        throw new Error('知识星球 API 返回失败');
      }

      const checkins = response.data.resp_data.checkins || [];
      logger.info(`成功获取 ${checkins.length} 个训练营`);

      return checkins.map(camp => ({
        checkin_id: camp.checkin_id,
        title: camp.title,
        checkin_days: camp.checkin_days,
        status: camp.status,
        joined_count: camp.joined_count,
        expiration_time: camp.expiration_time
      }));

    } catch (error) {
      logger.error(`获取训练营列表失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取打卡排行榜（支持自动翻页）
   * @param {number} checkinId - 训练营ID
   */
  async getRankingList(checkinId) {
    try {
      logger.info(`获取打卡排行榜: checkin_id=${checkinId}`);

      let allUsers = [];
      let index = 0;
      let hasMore = true;

      // 自动翻页，最多支持 200 人（2 页）
      while (hasMore && index < 2) {
        const url = `${this.baseURL}/groups/${this.groupId}/checkins/${checkinId}/ranking_list`;
        const response = await axios.get(url, {
          params: { type: 'accumulated', index },
          headers: this.getHeaders()
        });

        if (!response.data.succeeded) {
          throw new Error('知识星球 API 返回失败');
        }

        const ranking_list = response.data.resp_data.ranking_list || [];
        allUsers = allUsers.concat(ranking_list);

        // 如果返回的数据少于 100 条，说明没有更多数据
        hasMore = ranking_list.length >= 100;
        index++;

        // 防止频繁请求，间隔 200ms
        if (hasMore) {
          await this.sleep(200);
        }
      }

      logger.info(`成功获取 ${allUsers.length} 个用户的打卡记录`);

      return allUsers.map(item => ({
        planet_user_id: item.user.user_id,
        planet_nickname: item.user.name,
        planet_alias: item.user.alias || '',
        rankings: item.rankings,
        checkined_days: item.checkined_days
      }));

    } catch (error) {
      logger.error(`获取打卡排行榜失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 延迟函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new ZsxqService();
```

## 验收标准
- [ ] 能正确调用知识星球 API
- [ ] Cookie 过期时抛出正确的异常
- [ ] 支持自动翻页（测试 200 人的训练营）
- [ ] 日志输出清晰
```

#### 预期输出
- ✅ `zsxq.service.js` 文件完成
- ✅ 可以正确调用知识星球 API

---

### 📦 Task 1.2: 实现退款名单计算服务

**预计时间**: 1.5 小时

#### AI 提示词 (Prompt)

```markdown
# 任务描述
创建退款名单计算服务，根据打卡天数计算合格名单。

## 实现文件: `src/services/refund.service.js`

```javascript
const zsxqService = require('./zsxq.service');
const logger = require('../utils/logger');

class RefundService {
  /**
   * 生成退款名单
   * @param {number} checkinId - 训练营ID
   * @param {number} requiredDays - 完成要求天数
   */
  async generateRefundList(checkinId, requiredDays) {
    try {
      logger.info(`生成退款名单: checkin_id=${checkinId}, required_days=${requiredDays}`);

      // 1. 获取打卡排行榜
      const rankingList = await zsxqService.getRankingList(checkinId);

      // 2. 计算是否合格
      const refundList = rankingList.map(user => ({
        ...user,
        required_days: requiredDays,
        is_qualified: user.checkined_days >= requiredDays
      }));

      // 3. 统计数据
      const total_count = refundList.length;
      const qualified_count = refundList.filter(u => u.is_qualified).length;
      const qualified_rate = total_count > 0
        ? ((qualified_count / total_count) * 100).toFixed(2)
        : 0;

      logger.info(`统计完成: 总人数=${total_count}, 合格人数=${qualified_count}, 合格率=${qualified_rate}%`);

      return {
        refund_list: refundList,
        statistics: {
          total_count,
          qualified_count,
          unqualified_count: total_count - qualified_count,
          qualified_rate: parseFloat(qualified_rate)
        }
      };

    } catch (error) {
      logger.error(`生成退款名单失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 生成合格人员昵称列表（用顿号分隔）
   * @param {Array} refundList - 退款名单
   */
  generateQualifiedNames(refundList) {
    return refundList
      .filter(user => user.is_qualified)
      .map(user => user.planet_nickname)
      .join('、');
  }
}

module.exports = new RefundService();
```

## 验收标准
- [ ] 能正确计算合格人数和合格率
- [ ] 统计数据准确
- [ ] 错误处理完善
```

#### 预期输出
- ✅ `refund.service.js` 文件完成
- ✅ 退款名单计算逻辑正确

---

### 📦 Task 1.3: 实现训练营路由接口

**预计时间**: 2 小时

#### AI 提示词 (Prompt)

```markdown
# 任务描述
实现训练营相关的 RESTful API 接口。

## 实现文件: `src/routes/camps.js`

```javascript
const express = require('express');
const router = express.Router();
const zsxqService = require('../services/zsxq.service');
const refundService = require('../services/refund.service');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * 获取训练营列表
 * GET /api/camps?scope=over&count=100
 */
router.get('/', async (req, res, next) => {
  try {
    const { scope = 'over', count = 100 } = req.query;

    logger.info(`[API] 获取训练营列表: scope=${scope}, count=${count}`);

    const camps = await zsxqService.getCamps(scope, parseInt(count));

    res.json(success({ camps }));
  } catch (err) {
    next(err);
  }
});

/**
 * 生成退款名单
 * POST /api/camps/:checkinId/refund-list
 * Body: { "required_days": 7 }
 */
router.post('/:checkinId/refund-list', async (req, res, next) => {
  try {
    const { checkinId } = req.params;
    const { required_days } = req.body;

    logger.info(`[API] 生成退款名单: checkin_id=${checkinId}, required_days=${required_days}`);

    // 参数验证
    if (!required_days || required_days <= 0) {
      return res.status(400).json(error('required_days 必须为正整数', 400));
    }

    // 生成退款名单
    const result = await refundService.generateRefundList(
      parseInt(checkinId),
      parseInt(required_days)
    );

    // 生成合格人员昵称列表
    const qualified_names = refundService.generateQualifiedNames(result.refund_list);

    res.json(success({
      camp_info: {
        checkin_id: parseInt(checkinId),
        required_days: parseInt(required_days)
      },
      refund_list: result.refund_list,
      statistics: {
        ...result.statistics,
        qualified_names
      }
    }));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

## 验收标准
- [ ] GET /api/camps 接口返回正确
- [ ] POST /api/camps/:checkinId/refund-list 接口返回正确
- [ ] 参数验证正确
- [ ] 错误处理完善
```

#### 预期输出
- ✅ 训练营列表接口可用
- ✅ 退款名单生成接口可用

---

### 📦 Task 1.4: Postman 接口测试

**预计时间**: 1.5 小时

#### 测试步骤

1. **配置环境变量**
   - 复制 `.env.example` 为 `.env`
   - 填入真实的知识星球 Cookie

2. **启动后端服务**
   ```bash
   npm run dev
   ```

3. **测试接口**

**测试用例 1: 健康检查**
```
GET http://localhost:3013/health

预期响应:
{
  "code": 200,
  "message": "服务运行正常",
  "data": {
    "status": "healthy",
    "timestamp": "2025-10-27T10:00:00.000Z"
  }
}
```

**测试用例 2: 获取训练营列表**
```
GET http://localhost:3013/api/camps?scope=over&count=10

预期响应:
{
  "code": 200,
  "message": "成功",
  "data": {
    "camps": [
      {
        "checkin_id": 2424424541,
        "title": "2510 AI小绿书爆文",
        "checkin_days": 9,
        "status": "over",
        "joined_count": 115,
        "expiration_time": "2025-11-03T23:59:59.999+0800"
      }
    ]
  },
  "timestamp": 1730000000000
}
```

**测试用例 3: 生成退款名单**
```
POST http://localhost:3013/api/camps/2424424541/refund-list
Content-Type: application/json

{
  "required_days": 7
}

预期响应:
{
  "code": 200,
  "message": "成功",
  "data": {
    "camp_info": {
      "checkin_id": 2424424541,
      "required_days": 7
    },
    "refund_list": [
      {
        "planet_user_id": 88455815452182,
        "planet_nickname": "球球的副业探索路",
        "planet_alias": "",
        "rankings": 1,
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

**测试用例 4: Cookie 过期错误**
```
GET http://localhost:3013/api/camps?scope=over
(使用过期的 Cookie)

预期响应:
{
  "code": 403,
  "message": "知识星球 Cookie 已过期，请更新配置",
  "data": null,
  "timestamp": 1730000000000
}
```

#### 验收标准
- [ ] 所有接口测试通过
- [ ] 数据格式正确
- [ ] 错误处理符合预期
- [ ] 日志输出清晰

---

### 📦 Task 1.5: 代码提交

**预计时间**: 0.5 小时

#### Git 提交

```bash
cd zsxq-api
git add .
git commit -m "feat(api): 实现后端核心功能

- 实现知识星球 API 服务 (zsxq.service.js)
- 实现退款名单计算服务 (refund.service.js)
- 实现训练营路由接口 (camps.js)
- 支持自动翻页（最多 200 人）
- 完成 Postman 接口测试

测试:
- ✅ GET /api/camps 接口测试通过
- ✅ POST /api/camps/:checkinId/refund-list 接口测试通过
- ✅ Cookie 过期错误处理正确"
```

---

### ✅ Sprint 1 交付物检查清单

- [ ] 知识星球 API 服务实现完成
- [ ] 退款名单计算服务实现完成
- [ ] 训练营路由接口实现完成
- [ ] Postman 接口测试全部通过
- [ ] 日志系统工作正常
- [ ] 代码已提交到 Git
- [ ] API 文档已更新（README.md）

---

## 🚀 Sprint 2: 前端页面 + 数据展示

### 📅 时间安排
- **预计时间**: 8 小时
- **优先级**: P0 (最高)

### 🎯 目标
实现前端核心功能：训练营列表页面、退款名单页面、数据展示和交互。

---

### 📦 Task 2.1: 实现训练营列表页面

**预计时间**: 2.5 小时

#### AI 提示词 (Prompt)

```markdown
# 任务描述
实现训练营列表页面，展示所有训练营，支持状态筛选和跳转到退款名单页面。

## 技术要求
- 使用 Element Plus 组件
- 支持下拉选择状态（进行中/已结束/已关闭）
- 支持加载状态和错误提示
- 表格展示训练营信息

## 实现文件: `src/views/CampList.vue`

```vue
<template>
  <div class="page-container">
    <h1 class="page-title">训练营退款系统 - v0</h1>

    <!-- 筛选区域 -->
    <div class="filter-bar">
      <el-select
        v-model="scope"
        placeholder="请选择状态"
        style="width: 200px"
        @change="loadCamps"
      >
        <el-option label="进行中" value="ongoing" />
        <el-option label="已结束" value="over" />
        <el-option label="已关闭" value="closed" />
      </el-select>

      <el-button type="primary" :icon="Refresh" @click="loadCamps" :loading="loading">
        刷新列表
      </el-button>
    </div>

    <!-- 训练营列表表格 -->
    <el-table
      :data="camps"
      v-loading="loading"
      stripe
      border
      style="width: 100%; margin-top: 20px"
    >
      <el-table-column prop="title" label="训练营名称" min-width="200" />

      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="checkin_days" label="打卡天数" width="120" align="center">
        <template #default="{ row }">
          {{ row.checkin_days }} 天
        </template>
      </el-table-column>

      <el-table-column prop="joined_count" label="参与人数" width="120" align="center">
        <template #default="{ row }">
          {{ row.joined_count }} 人
        </template>
      </el-table-column>

      <el-table-column prop="expiration_time" label="结束时间" width="180" align="center">
        <template #default="{ row }">
          {{ formatDate(row.expiration_time) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="150" align="center" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            size="small"
            @click="goToRefundList(row)"
            v-if="row.status === 'over' || row.status === 'closed'"
          >
            生成名单
          </el-button>
          <el-button type="info" size="small" disabled v-else>
            进行中
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 空状态 -->
    <el-empty v-if="!loading && camps.length === 0" description="暂无训练营数据" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import { getCamps } from '@/api/camps';

const router = useRouter();

// 状态
const loading = ref(false);
const scope = ref('over'); // 默认显示已结束
const camps = ref([]);

// 加载训练营列表
const loadCamps = async () => {
  loading.value = true;
  try {
    const data = await getCamps({ scope: scope.value });
    camps.value = data.camps || [];
    ElMessage.success(`加载成功，共 ${camps.value.length} 个训练营`);
  } catch (error) {
    ElMessage.error('加载失败：' + error.message);
  } finally {
    loading.value = false;
  }
};

// 跳转到退款名单页面
const goToRefundList = (camp) => {
  router.push({
    name: 'RefundList',
    params: { checkinId: camp.checkin_id },
    query: {
      title: camp.title,
      totalDays: camp.checkin_days
    }
  });
};

// 获取状态类型（Element Plus Tag）
const getStatusType = (status) => {
  const statusMap = {
    ongoing: 'success',
    over: 'warning',
    closed: 'info'
  };
  return statusMap[status] || 'info';
};

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    ongoing: '进行中',
    over: '已结束',
    closed: '已关闭'
  };
  return statusMap[status] || '未知';
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 页面加载时获取数据
onMounted(() => {
  loadCamps();
});
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>
```

## 验收标准
- [ ] 页面能正确展示训练营列表
- [ ] 下拉选择状态能正确筛选
- [ ] 点击"生成名单"能跳转到退款名单页面
- [ ] 加载状态和错误提示正常
- [ ] 空状态展示正常
```

#### 预期输出
- ✅ 训练营列表页面完成
- ✅ 能正确展示和筛选训练营

---

### 📦 Task 2.2: 实现退款名单页面（数据展示部分）

**预计时间**: 3 小时

#### AI 提示词 (Prompt)

```markdown
# 任务描述
实现退款名单页面，包含：训练营信息、完成天数输入、数据总览、详细名单表格。

## 技术要求
- 使用 Element Plus 组件
- 支持输入完成天数
- 展示统计信息和合格人员名单
- 支持表格筛选（全部/合格/不合格）
- 支持一键复制合格人员昵称

## 实现文件: `src/views/RefundList.vue`

```vue
<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="goBack">返回</el-button>
      <h1 class="page-title">生成退款名单 - {{ campTitle }}</h1>
    </div>

    <!-- 训练营信息 -->
    <el-card class="info-card" shadow="never">
      <h3>训练营信息</h3>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="训练营名称">{{ campTitle }}</el-descriptions-item>
        <el-descriptions-item label="打卡总天数">{{ totalDays }} 天</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 完成标准设置 -->
    <el-card class="setting-card" shadow="never">
      <div class="setting-row">
        <span class="setting-label">完成标准：</span>
        <el-input-number
          v-model="requiredDays"
          :min="1"
          :max="totalDays"
          :step="1"
          controls-position="right"
          style="width: 150px"
        />
        <span class="setting-text">天完成打卡算合格</span>
        <el-button
          type="primary"
          :icon="Check"
          @click="calculateRefundList"
          :loading="loading"
          :disabled="!requiredDays || requiredDays > totalDays"
        >
          开始计算
        </el-button>
      </div>
    </el-card>

    <!-- 数据总览（计算后显示） -->
    <el-card v-if="statistics" class="statistics-card" shadow="hover">
      <h3>📊 数据总览</h3>

      <!-- 统计卡片 -->
      <div class="stat-cards">
        <div class="stat-card">
          <div class="stat-value">{{ statistics.total_count }}</div>
          <div class="stat-label">总人数</div>
        </div>
        <div class="stat-card qualified">
          <div class="stat-value">{{ statistics.qualified_count }}</div>
          <div class="stat-label">合格人数</div>
        </div>
        <div class="stat-card rate">
          <div class="stat-value">{{ statistics.qualified_rate }}%</div>
          <div class="stat-label">合格率</div>
        </div>
        <div class="stat-card unqualified">
          <div class="stat-value">{{ statistics.unqualified_count }}</div>
          <div class="stat-label">不合格人数</div>
        </div>
      </div>

      <!-- 合格人员名单 -->
      <div class="qualified-names">
        <h4>完成打卡人员名单：</h4>
        <div class="names-box">
          {{ statistics.qualified_names }}
        </div>
        <el-button type="success" :icon="CopyDocument" @click="copyQualifiedNames">
          一键复制
        </el-button>
      </div>
    </el-card>

    <!-- 详细名单表格 -->
    <el-card v-if="refundList.length > 0" class="table-card" shadow="never">
      <div class="table-header">
        <h3>📋 详细名单</h3>
        <el-radio-group v-model="filterType" size="small">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="qualified">合格</el-radio-button>
          <el-radio-button label="unqualified">不合格</el-radio-button>
        </el-radio-group>
      </div>

      <el-table
        :data="filteredRefundList"
        stripe
        border
        style="width: 100%; margin-top: 16px"
        max-height="600"
      >
        <el-table-column type="index" label="序号" width="80" align="center" />

        <el-table-column prop="planet_nickname" label="星球昵称" min-width="150" />

        <el-table-column prop="planet_user_id" label="星球ID" width="180" align="center" />

        <el-table-column prop="checkined_days" label="打卡天数" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_qualified ? 'success' : 'danger'">
              {{ row.checkined_days }} 天
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="is_qualified" label="是否合格" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_qualified ? 'success' : 'danger'">
              {{ row.is_qualified ? '✅ 合格' : '❌ 不合格' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft, Check, CopyDocument } from '@element-plus/icons-vue';
import { generateRefundList } from '@/api/camps';

const route = useRoute();
const router = useRouter();

// 训练营信息
const checkinId = ref(route.params.checkinId);
const campTitle = ref(route.query.title || '未知训练营');
const totalDays = ref(parseInt(route.query.totalDays) || 9);

// 表单数据
const requiredDays = ref(totalDays.value); // 默认等于总天数
const loading = ref(false);

// 退款名单数据
const refundList = ref([]);
const statistics = ref(null);

// 表格筛选
const filterType = ref('all');

// 计算退款名单
const calculateRefundList = async () => {
  loading.value = true;
  try {
    const data = await generateRefundList(checkinId.value, {
      required_days: requiredDays.value
    });

    refundList.value = data.refund_list || [];
    statistics.value = data.statistics || null;

    ElMessage.success('计算完成！');
  } catch (error) {
    ElMessage.error('计算失败：' + error.message);
  } finally {
    loading.value = false;
  }
};

// 筛选后的退款名单
const filteredRefundList = computed(() => {
  if (filterType.value === 'qualified') {
    return refundList.value.filter(item => item.is_qualified);
  } else if (filterType.value === 'unqualified') {
    return refundList.value.filter(item => !item.is_qualified);
  }
  return refundList.value;
});

// 复制合格人员名单
const copyQualifiedNames = () => {
  const names = statistics.value.qualified_names;
  navigator.clipboard.writeText(names).then(() => {
    ElMessage.success('已复制到剪贴板');
  }).catch(() => {
    ElMessage.error('复制失败，请手动复制');
  });
};

// 返回列表页
const goBack = () => {
  router.push({ name: 'CampList' });
};

// 页面加载时自动计算（可选）
onMounted(() => {
  // 如果需要自动计算，取消注释下面这行
  // calculateRefundList();
});
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.page-title {
  margin: 0;
}

.info-card,
.setting-card,
.statistics-card,
.table-card {
  margin-bottom: 20px;
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-label {
  font-weight: 600;
  font-size: 16px;
}

.setting-text {
  font-size: 14px;
  color: #606266;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin: 20px 0;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  border-radius: 8px;
  text-align: center;
}

.stat-card.qualified {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card.rate {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-card.unqualified {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.qualified-names {
  margin-top: 20px;
}

.qualified-names h4 {
  margin-bottom: 12px;
  font-size: 16px;
  color: #303133;
}

.names-box {
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
  line-height: 1.8;
  color: #606266;
  max-height: 120px;
  overflow-y: auto;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-header h3 {
  margin: 0;
}
</style>
```

## 验收标准
- [ ] 页面能正确展示训练营信息
- [ ] 能输入完成天数并计算
- [ ] 数据总览展示正确（统计卡片、合格人员名单）
- [ ] 详细名单表格展示正确
- [ ] 表格筛选功能正常
- [ ] 一键复制功能正常
```

#### 预期输出
- ✅ 退款名单页面数据展示部分完成
- ✅ 能正确计算和展示退款名单

---

### 📦 Task 2.3: 前端功能测试

**预计时间**: 1.5 小时

#### 测试步骤

1. **测试训练营列表页面**
   - [ ] 页面加载时自动获取训练营列表
   - [ ] 下拉选择"已结束"能正确筛选
   - [ ] 点击"刷新列表"能重新加载数据
   - [ ] 表格数据展示正确（名称、状态、天数、人数）
   - [ ] 点击"生成名单"能正确跳转

2. **测试退款名单页面**
   - [ ] 页面能正确接收路由参数（训练营名称、总天数）
   - [ ] 输入完成天数，点击"开始计算"能正确调用 API
   - [ ] 数据总览区域展示正确：
     - [ ] 统计卡片数据正确（总人数、合格人数、合格率、不合格人数）
     - [ ] 合格人员名单正确显示（昵称用顿号分隔）
     - [ ] 点击"一键复制"能复制到剪贴板
   - [ ] 详细名单表格展示正确：
     - [ ] 表格数据正确（序号、昵称、ID、打卡天数、是否合格）
     - [ ] 表格筛选功能正常（全部/合格/不合格）
   - [ ] 点击"返回"能正确返回列表页

3. **测试错误处理**
   - [ ] 后端服务未启动时，前端显示错误提示
   - [ ] Cookie 过期时，前端显示"Cookie 已过期"提示
   - [ ] 网络错误时，前端显示错误提示

#### 验收标准
- [ ] 所有功能测试通过
- [ ] 用户体验流畅
- [ ] 错误提示清晰

---

### 📦 Task 2.4: 代码提交

**预计时间**: 0.5 小时

#### Git 提交

```bash
cd zsxq-web
git add .
git commit -m "feat(web): 实现前端核心功能

- 实现训练营列表页面 (CampList.vue)
- 实现退款名单页面 (RefundList.vue)
- 实现数据总览和统计卡片
- 实现详细名单表格和筛选
- 实现一键复制合格人员昵称
- 完成前端功能测试

测试:
- ✅ 训练营列表页面测试通过
- ✅ 退款名单页面测试通过
- ✅ 数据展示和交互测试通过"
```

---

### ✅ Sprint 2 交付物检查清单

- [ ] 训练营列表页面完成
- [ ] 退款名单页面完成
- [ ] 数据总览和统计卡片完成
- [ ] 详细名单表格和筛选完成
- [ ] 一键复制功能完成
- [ ] 前端功能测试全部通过
- [ ] 代码已提交到 Git

---

## 🚀 Sprint 3: 导出功能 + 部署上线

### 📅 时间安排
- **预计时间**: 5 小时 (使用宝塔面板大幅简化部署流程)
- **优先级**: P1

### 🎯 目标
实现导出功能（Excel 和图片），完成服务器部署，系统上线。

### 🔧 技术栈
- **前端导出**: xlsx + html2canvas
- **部署方式**: 宝塔面板 (图形化操作,无需命令行配置)

---

### 📦 Task 3.1: 实现导出工具

**预计时间**: 2 小时

#### AI 提示词 (Prompt)

```markdown
# 任务描述
实现导出工具，支持导出 Excel 和生成页面图片。

## 实现文件: `src/utils/export.js`

```javascript
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { ElMessage } from 'element-plus';

/**
 * 导出 Excel
 * @param {Array} refundList - 退款名单
 * @param {Object} campInfo - 训练营信息
 * @param {Object} statistics - 统计信息
 * @param {number} requiredDays - 完成要求天数
 */
export function exportExcel(refundList, campInfo, statistics, requiredDays) {
  try {
    // 构建 Excel 数据
    const data = [
      ['知识星球训练营退款名单'],
      [],
      ['训练营名称', campInfo.title],
      ['打卡总天数', campInfo.totalDays],
      ['完成要求', `${requiredDays}天`],
      ['总人数', statistics.total_count],
      ['合格人数', statistics.qualified_count],
      ['不合格人数', statistics.unqualified_count],
      ['合格率', `${statistics.qualified_rate}%`],
      [],
      ['完成打卡人员名单'],
      [statistics.qualified_names],
      [],
      ['序号', '星球昵称', '星球ID', '打卡天数', '是否合格']
    ];

    // 添加详细名单
    refundList.forEach((item, index) => {
      data.push([
        index + 1,
        item.planet_nickname,
        item.planet_user_id,
        item.checkined_days,
        item.is_qualified ? '合格' : '不合格'
      ]);
    });

    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(data);

    // 设置列宽
    ws['!cols'] = [
      { wch: 8 },  // 序号
      { wch: 20 }, // 星球昵称
      { wch: 20 }, // 星球ID
      { wch: 12 }, // 打卡天数
      { wch: 12 }  // 是否合格
    ];

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '退款名单');

    // 生成文件名
    const date = new Date().toISOString().split('T')[0];
    const filename = `退款名单-${campInfo.title}-${date}.xlsx`;

    // 导出文件
    XLSX.writeFile(wb, filename);

    ElMessage.success('Excel 导出成功');
  } catch (error) {
    console.error('导出 Excel 失败:', error);
    ElMessage.error('导出 Excel 失败');
  }
}

/**
 * 下载页面截图
 * @param {string} selector - DOM 选择器
 * @param {Object} campInfo - 训练营信息
 */
export async function downloadImage(selector, campInfo) {
  try {
    ElMessage.info('正在生成图片，请稍候...');

    const element = document.querySelector(selector);
    if (!element) {
      throw new Error('未找到目标元素');
    }

    // 生成 Canvas
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // 提高清晰度
      useCORS: true,
      width: 1200,
      logging: false
    });

    // 转换为 Blob
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      link.download = `退款名单-${campInfo.title}-${date}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      ElMessage.success('图片下载成功');
    });
  } catch (error) {
    console.error('下载图片失败:', error);
    ElMessage.error('下载图片失败');
  }
}
```

## 验收标准
- [ ] Excel 导出功能正常
- [ ] 图片下载功能正常
- [ ] 文件命名格式正确
- [ ] 错误处理完善
```

#### 预期输出
- ✅ 导出工具完成

---

### 📦 Task 3.2: 集成导出功能到退款名单页面

**预计时间**: 1.5 小时

#### AI 提示词 (Prompt)

```markdown
# 任务描述
在退款名单页面集成导出功能，添加"下载图片"和"导出 Excel"按钮。

## 修改文件: `src/views/RefundList.vue`

在 `<script setup>` 中添加:
```javascript
import { exportExcel, downloadImage } from '@/utils/export';

// 导出 Excel
const handleExportExcel = () => {
  exportExcel(refundList.value, {
    title: campTitle.value,
    totalDays: totalDays.value
  }, statistics.value, requiredDays.value);
};

// 下载图片
const handleDownloadImage = () => {
  downloadImage('.page-container', {
    title: campTitle.value
  });
};
```

在模板中添加导出按钮（在详细名单表格下方）:
```vue
<!-- 导出操作栏 -->
<div v-if="refundList.length > 0" class="export-bar">
  <el-button type="success" :icon="Download" @click="handleDownloadImage">
    下载图片
  </el-button>
  <el-button type="primary" :icon="Document" @click="handleExportExcel">
    导出 Excel
  </el-button>
  <el-button @click="goBack">关闭</el-button>
</div>
```

添加样式:
```css
.export-bar {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
}
```

## 验收标准
- [ ] "下载图片"按钮能正常下载 PNG 图片
- [ ] "导出 Excel"按钮能正常导出 Excel 文件
- [ ] 文件内容完整正确
- [ ] 文件命名格式正确
```

#### 预期输出
- ✅ 退款名单页面集成导出功能

---

### 📦 Task 3.3: 准备部署文件包

**预计时间**: 0.5 小时

#### 操作步骤

1. **构建前端项目**
   ```bash
   cd zsxq-web
   npm run build
   ```
   - 生成 `dist/` 目录,包含静态文件

2. **准备后端项目**
   ```bash
   cd zsxq-api
   # 确保 .env.example 存在
   ls -la .env.example

   # 确保 ecosystem.config.js 存在
   ls -la ecosystem.config.js
   ```

3. **检查必要文件**
   - 后端: `src/`, `package.json`, `.env.example`, `ecosystem.config.js`
   - 前端: `dist/` 目录

#### 验收标准
- [ ] 前端构建成功,生成 `dist/` 目录
- [ ] 后端必要文件齐全
- [ ] `.env.example` 包含所有必需配置项

---

### 📦 Task 3.4: 宝塔部署后端 Node.js 项目

**预计时间**: 0.5 小时

#### 操作步骤 (宝塔面板操作)

1. **上传代码**
   - 方式1: 宝塔文件管理器 → 上传 `zsxq-api.zip`
   - 方式2: 使用 Git 拉取代码
   - 建议路径: `/www/wwwroot/zsxq-api/`

2. **添加 Node.js 项目** (宝塔面板 → 网站 → Node项目)
   - **项目名称**: `知识星球训练营退款系统-API`
   - **项目路径**: `/www/wwwroot/zsxq-api/`
   - **端口号**: `3013`
   - **启动文件**: `src/index.js`
   - **运行用户**: `www`
   - **Node 版本**: 选择 `v18.x` 或更高

3. **配置环境变量** (项目设置 → 环境变量)
   ```env
   NODE_ENV=production
   PORT=3013
   ZSXQ_GROUP_ID=15555411412112
   ZSXQ_X_TIMESTAMP=你的时间戳
   ZSXQ_AUTHORIZATION=你的授权token
   ZSXQ_X_SIGNATURE=你的签名
   ```

4. **安装依赖** (项目设置 → 终端)
   ```bash
   npm install --production
   ```

5. **启动项目**
   - 点击"启动"按钮
   - 查看日志,确保没有错误

6. **测试接口**
   ```bash
   curl http://localhost:3013/health
   ```

#### 验收标准
- [ ] Node.js 项目在宝塔中成功添加
- [ ] 环境变量配置正确
- [ ] 项目成功启动,状态显示"运行中"
- [ ] 健康检查接口返回 200

#### 宝塔常见问题
- **端口被占用**: 修改 PORT 环境变量
- **依赖安装失败**: 检查 npm 镜像源,可切换为淘宝镜像
- **启动失败**: 查看项目日志,检查 .env 配置

---

### 📦 Task 3.5: 宝塔部署前端静态网站

**预计时间**: 0.5 小时

#### 操作步骤 (宝塔面板操作)

1. **添加网站** (宝塔面板 → 网站 → 添加站点)
   - **域名**: `zsxq.dc401.com` (或你的域名)
   - **根目录**: `/www/wwwroot/zsxq-web/`
   - **PHP 版本**: 选择 `纯静态`
   - **备注**: `知识星球退款系统前端`

2. **上传前端文件**
   - 方式1: 宝塔文件管理器 → 上传 `dist.zip` → 解压到网站根目录
   - 方式2: 使用 Git 拉取代码后,将 `dist/` 内容复制到网站根目录
   - 确保根目录包含 `index.html`

3. **配置反向代理** (网站设置 → 反向代理)
   - **代理名称**: `API代理`
   - **目标URL**: `http://127.0.0.1:3013`
   - **发送域名**: `$host`
   - **代理目录**: `/api`

   **配置内容**:
   ```nginx
   location ^~ /api/ {
       proxy_pass http://127.0.0.1:3013/;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
   }
   ```

4. **配置 SPA 路由** (网站设置 → 配置文件)
   - 在 `location /` 块中添加:
   ```nginx
   location / {
       try_files $uri $uri/ /index.html;
   }
   ```

5. **配置 SSL 证书** (网站设置 → SSL → Let's Encrypt)
   - 勾选域名
   - 点击"申请"
   - 等待证书签发
   - 开启"强制HTTPS"

6. **测试访问**
   - HTTP: `http://zsxq.dc401.com`
   - HTTPS: `https://zsxq.dc401.com`

#### 验收标准
- [ ] 前端页面能正常访问
- [ ] API 反向代理配置正确 (能调用后端接口)
- [ ] SPA 路由配置正确 (刷新页面不出现 404)
- [ ] SSL 证书配置成功 (HTTPS 访问正常)

#### 宝塔反向代理配置说明
**为什么要配置 `/api/` 代理?**
- 前端调用 `/api/camps` → Nginx 反向代理 → `http://127.0.0.1:3013/camps`
- 避免跨域问题
- 统一前后端入口

---

### 📦 Task 3.6: 生产环境测试

**预计时间**: 0.5 小时

#### 测试清单

1. **基础功能测试**
   - [ ] 访问 `https://zsxq.dc401.com` 能看到训练营列表
   - [ ] 能正确获取训练营列表
   - [ ] 能生成退款名单
   - [ ] 数据展示正确

2. **导出功能测试**
   - [ ] 能下载图片（PNG 格式）
   - [ ] 能导出 Excel（XLSX 格式）
   - [ ] 文件内容完整正确

3. **性能测试**
   - [ ] 页面加载速度 < 2 秒
   - [ ] API 响应时间 < 1 秒

4. **错误处理测试**
   - [ ] Cookie 过期时显示正确提示
   - [ ] 网络错误时显示正确提示

#### 验收标准
- [ ] 所有功能测试通过
- [ ] 性能达标
- [ ] 错误处理正常

---

### ✅ Sprint 3 交付物检查清单

**开发部分** (3.5 小时):
- [ ] Task 3.1: 导出工具实现完成 (exportExcel + downloadImage)
- [ ] Task 3.2: 退款名单页面集成导出功能 (导出按钮 + 事件处理)

**部署部分** (1.5 小时，宝塔操作):
- [ ] Task 3.3: 准备部署文件包 (前端 build + 后端打包)
- [ ] Task 3.4: 宝塔部署后端 Node.js 项目 (添加 Node 项目 + 环境变量)
- [ ] Task 3.5: 宝塔部署前端静态网站 (添加站点 + 反向代理 + SSL)
- [ ] Task 3.6: 生产环境测试 (功能测试 + 性能测试)

**代码提交**:
- [ ] 所有代码已提交到 Git
- [ ] 更新 README.md 部署说明

### 📊 Sprint 3 时间分配

| 任务 | 预计时间 | 类型 | 说明 |
|------|---------|------|------|
| Task 3.1 | 2h | 开发 | 实现 Excel 和图片导出工具 |
| Task 3.2 | 1.5h | 开发 | 集成导出功能到页面 |
| Task 3.3 | 0.5h | 部署准备 | 构建前端 + 检查文件 |
| Task 3.4 | 0.5h | 宝塔部署 | 后端 Node.js 项目 |
| Task 3.5 | 0.5h | 宝塔部署 | 前端静态站点 + SSL |
| Task 3.6 | 0.5h | 测试 | 生产环境完整测试 |
| **总计** | **5.5h** | - | **比原计划节省 2.5 小时** |

---

## 📝 缓冲时间: Bug 修复 + 优化

### 📅 时间安排
- **预计时间**: 4 小时
- **优先级**: P2

### 🎯 目标
修复测试中发现的 Bug，优化用户体验。

---

### 常见问题和解决方案

#### 问题 1: Cookie 频繁过期
**解决方案**: 在后端添加 Cookie 检测接口，前端定期检查。

#### 问题 2: 大数据量加载慢
**解决方案**: 前端添加表格分页功能。

#### 问题 3: 图片生成失败
**解决方案**: 检查 html2canvas 兼容性，调整配置参数。

#### 问题 4: Excel 导出中文乱码
**解决方案**: 确保 Excel 导出时使用 UTF-8 编码。

---

## 📚 附录：AI 提示词最佳实践

### 1. 提示词编写原则

✅ **DO (推荐)**:
- 明确任务目标和验收标准
- 提供完整的代码示例
- 列出详细的功能清单
- 说明技术要求和限制
- 提供目录结构和文件路径

❌ **DON'T (避免)**:
- 模糊的任务描述
- 缺少验收标准
- 没有代码示例
- 技术要求不明确

### 2. Vibe Coding 工作流

```
1. 人类：提供详细的提示词（包含目标、技术要求、代码示例）
   ↓
2. AI：生成完整的代码
   ↓
3. 人类：复制代码到项目中，运行测试
   ↓
4. 人类：如果有错误，提供错误信息给 AI
   ↓
5. AI：修复错误，重新生成代码
   ↓
6. 重复 3-5 直到功能通过测试
   ↓
7. 人类：提交代码到 Git，进入下一个任务
```

### 3. 常用提示词模板

#### 模板 1: 创建新文件
```markdown
# 任务描述
创建 XXX 文件，实现 YYY 功能。

## 技术要求
- 技术栈
- 依赖库
- 设计模式

## 实现文件: `path/to/file.js`
```[代码示例]```

## 验收标准
- [ ] 功能1
- [ ] 功能2
```

#### 模板 2: 修改现有文件
```markdown
# 任务描述
在 XXX 文件中添加 YYY 功能。

## 修改文件: `path/to/file.js`

在 `[位置]` 添加:
```[代码示例]```

## 验收标准
- [ ] 功能1
- [ ] 功能2
```

---

## 🎯 总结

本开发计划专为 AI Vibe Coding 设计，具有以下特点：

1. **模块化**：每个任务独立可测试
2. **详细化**：提供完整的代码示例和验收标准
3. **渐进式**：从简单到复杂，逐步实现
4. **可追溯**：每个 Sprint 都有明确的交付物

## 📌 关键里程碑

- **Day 0 (4h)**: 项目骨架搭建完成
- **Day 1 (8h)**: 后端 API 完成
- **Day 2 (8h)**: 前端页面完成
- **Day 3 (8h)**: 导出功能 + 部署上线
- **Day 4 (4h)**: Bug 修复 + 优化

## ✅ 最终交付物

- ✅ 可运行的 v0 系统（zsxq.dc401.com）
- ✅ 完整的前后端代码（Git 仓库）
- ✅ API 文档（README.md）
- ✅ 部署文档（deployment.md）
- ✅ 用户使用手册（user-guide.md）

---

**文档结束**
