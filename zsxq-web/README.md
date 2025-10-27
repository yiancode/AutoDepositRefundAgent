# zsxq-web - 知识星球训练营退款系统前端

基于 Vue 3 + Vite + Element Plus 的训练营退款管理系统前端。

## 技术栈

- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite 7.1.12
- **UI 组件库**: Element Plus 2.8.0
- **路由**: Vue Router 4.4.0
- **HTTP 客户端**: Axios 1.7.0
- **图标**: @element-plus/icons-vue 2.3.1

## 功能特性

### 1. 训练营列表页面 (`/camps`)
- 展示所有训练营列表
- 支持状态筛选（进行中/已结束/已关闭）
- 实时刷新数据
- 跳转到退款名单页面

### 2. 退款名单页面 (`/camps/:checkinId/refund`)
- 设置完成要求天数
- 生成退款名单
- 展示统计信息（总人数、合格人数、合格率）
- 查看详细名单（星球昵称、星球ID、打卡天数、是否合格）
- 导出文本格式名单
- 显示逗号分隔的合格名单

## 项目结构

```
zsxq-web/
├── src/
│   ├── api/              # API 接口封装
│   │   └── camps.js      # 训练营相关接口
│   ├── router/           # 路由配置
│   │   └── index.js      # Vue Router 配置
│   ├── utils/            # 工具函数
│   │   └── request.js    # Axios 请求封装
│   ├── views/            # 页面组件
│   │   ├── CampList.vue  # 训练营列表
│   │   └── RefundList.vue# 退款名单
│   ├── App.vue           # 根组件
│   ├── main.js           # 入口文件
│   └── style.css         # 全局样式
├── public/               # 静态资源
├── index.html            # HTML 模板
├── vite.config.js        # Vite 配置
├── package.json          # 项目依赖
└── README.md             # 项目说明

代码统计: 690 行
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

前端服务将启动在 http://localhost:5173

**注意**: 前端依赖后端 API 服务,请确保后端服务已在 http://localhost:3013 运行。

### 3. 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 4. 预览生产构建

```bash
npm run preview
```

## 配置说明

### Vite 代理配置 (`vite.config.js`)

前端通过 Vite 代理将 `/api/*` 请求转发到后端:

```javascript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:3013',
      changeOrigin: true,
      rewrite: (path) => path
    }
  }
}
```

### 路由别名配置

使用 `@` 作为 `src` 目录的别名:

```javascript
resolve: {
  alias: {
    '@': resolve(__dirname, 'src')
  }
}
```

## API 接口

前端调用的后端 API 接口:

### 1. 获取训练营列表
```
GET /api/camps?scope=over&count=100
```

### 2. 生成退款名单
```
POST /api/camps/:checkinId/refund-list
Body: { "required_days": 7 }
```

### 3. 获取退款名单(文本格式)
```
GET /api/camps/:checkinId/refund-list/text?required_days=7
```

## 开发指南

### 添加新页面

1. 在 `src/views/` 创建 Vue 组件
2. 在 `src/router/index.js` 添加路由配置
3. 在相关页面添加导航链接

### 添加新 API

1. 在 `src/api/` 创建或修改 API 模块
2. 使用 `src/utils/request.js` 封装的 Axios 实例
3. 在组件中导入并调用

### 错误处理

请求错误已在 `request.js` 中统一处理:
- 网络错误
- HTTP 错误状态码 (400, 401, 403, 404, 429, 500)
- 自动弹出 ElMessage 提示

## 环境要求

- Node.js 18+
- npm 或 yarn
- 后端服务运行在 http://localhost:3013

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 开发进度

- ✅ Sprint 2.0: 创建 Vue 3 + Vite 项目
- ✅ Sprint 2.1: 配置项目结构和基础文件
- ✅ Sprint 2.2: 实现 API 封装
- ✅ Sprint 2.3: 配置路由
- ✅ Sprint 2.4: 实现训练营列表页面
- ✅ Sprint 2.5: 实现退款名单页面
- ✅ Sprint 2.6: 配置 Vite 代理
- ✅ Sprint 2.7: 测试前端功能

## 后续优化

- ⏳ 添加 Excel 导出功能
- ⏳ 添加图片导出功能
- ⏳ 添加单元测试
- ⏳ 集成 ESLint + Prettier
- ⏳ 优化响应式布局
- ⏳ 添加加载骨架屏

## 许可证

MIT
