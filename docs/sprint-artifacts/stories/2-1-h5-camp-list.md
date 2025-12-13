# Story 2.1: H5 前端骨架与训练营列表页

**Status**: ready-for-dev

---

## Story

**作为**一名会员，
**我希望**通过H5链接访问训练营列表，
**以便于**查看可报名的训练营并选择参与。

---

## 验收标准

### AC-1: 访问训练营列表
```gherkin
Feature: H5 训练营列表
  Scenario: 访问训练营列表
    Given 用户通过微信内置浏览器访问 H5 链接
    When 页面加载完成
    Then 显示可报名的训练营卡片列表
    And 每个卡片包含: 海报、名称、押金、日期、打卡要求、报名人数
```

### AC-2: 下拉刷新
```gherkin
  Scenario: 下拉刷新
    Given 用户在列表页
    When 下拉刷新
    Then 重置分页为第一页
    And 重新加载训练营数据
    And 显示刷新成功提示
```

### AC-3: 点击进入详情
```gherkin
  Scenario: 点击进入详情
    Given 存在可报名的训练营
    When 用户点击训练营卡片
    Then 进入训练营详情页 /camps/:id
```

### AC-4: 空列表处理
```gherkin
  Scenario: 无可报名训练营
    Given 系统中没有状态为"报名中"的训练营
    When 访问训练营列表
    Then 显示空状态插画
    And 显示文案"暂无可报名的训练营"
```

### AC-5: 加载状态
```gherkin
  Scenario: 数据加载中
    Given 用户访问训练营列表
    When 数据正在加载
    Then 显示骨架屏或loading状态
    And 防止重复请求
```

### AC-6: 网络异常处理
```gherkin
  Scenario: 网络超时重试
    Given 用户网络不稳定
    When 请求超时 (> 10秒)
    Then 显示错误提示 "网络超时，请重试"
    And 提供 "重新加载" 按钮
    And 记录错误日志

  Scenario: 网络断开
    Given 用户网络断开
    When 尝试加载列表
    Then 显示缓存数据 (若有)
    And 显示 "网络连接失败" 提示
    And 提供 "重新加载" 按钮
```

### AC-7: 分页加载
```gherkin
  Scenario: 滚动加载更多
    Given 列表数据超过一页
    When 用户滚动到底部
    Then 自动加载下一页数据
    And 追加到现有列表末尾
    And 最后一页显示 "没有更多了"
```

---

## Tasks / Subtasks

- [ ] **Task 1: 创建 H5 前端项目骨架** (AC: #全部)
  - [ ] 1.1 使用 Vite + Vue 3 + TypeScript 初始化项目
  - [ ] 1.2 安装配置 Vant 4 UI 组件库 (锁定 vant@^4.8.0)
  - [ ] 1.3 配置 Pinia 状态管理 (含持久化插件)
  - [ ] 1.4 配置 Vue Router 路由
  - [ ] 1.5 配置 Axios 请求封装 (含超时、重试、错误处理)
  - [ ] 1.6 配置环境变量 (.env.development, .env.production)
  - [ ] 1.7 配置 Vitest 单元测试框架

- [ ] **Task 2: 实现路由配置** (AC: #3)
  - [ ] 2.1 配置 /camps 路由指向 CampList 组件
  - [ ] 2.2 配置 /camps/:id 路由指向 CampDetail 组件
  - [ ] 2.3 配置 / 首页重定向到 /camps
  - [ ] 2.4 配置 404 页面

- [ ] **Task 3: 实现训练营列表页面** (AC: #1, #2, #4, #5, #6, #7)
  - [ ] 3.1 创建 CampList.vue 页面组件
  - [ ] 3.2 使用 Vant List 实现分页加载
    - 监听 `@load` 事件触发加载下一页
    - 维护 `loading` 和 `finished` 状态
    - 到达最后一页时设置 `finished = true`
  - [ ] 3.3 使用 Vant PullRefresh 实现下拉刷新
    - 监听 `@refresh` 事件
    - 重置 page=1，清空列表重新加载
    - 添加 300ms 防抖处理
  - [ ] 3.4 使用 Vant Skeleton 实现骨架屏加载状态
  - [ ] 3.5 实现空状态组件 (Vant Empty)
  - [ ] 3.6 实现网络错误提示组件 (重试按钮)

- [ ] **Task 4: 实现训练营卡片组件** (AC: #1)
  - [ ] 4.1 创建 CampCard.vue 组件
  - [ ] 4.2 卡片布局: 海报图片 + 信息区域
  - [ ] 4.3 显示字段: 名称、押金、日期、打卡要求、报名人数
  - [ ] 4.4 点击卡片跳转到详情页
  - [ ] 4.5 图片懒加载优化
    - 使用 Vant LazyLoad 指令
    - 配置占位图 (loading placeholder)
    - 图片加载失败显示默认图
    - CDN 参数优化: `?imageView2/2/w/300/q/80`
  - [ ] 4.6 无障碍支持
    - 图片 alt 属性 (训练营名称)
    - 卡片 role="button" 和 tabindex="0"
    - 颜色对比度符合 WCAG AA

- [ ] **Task 5: 实现 API 接口调用** (AC: #1, #6)
  - [ ] 5.1 创建 src/api/camp.ts 接口定义
  - [ ] 5.2 实现 getCampList(page, pageSize) 调用 GET /api/h5/camps
  - [ ] 5.3 定义完整 TypeScript 类型 (Camp, ApiResponse, ApiError)
  - [ ] 5.4 实现错误处理和重试逻辑 (最多重试 2 次)
  - [ ] 5.5 实现请求缓存
    - 缓存 5 分钟 (localStorage)
    - 下拉刷新时强制刷新 (bypass cache)
    - 缓存 key: `camps_list_page_{page}`

- [ ] **Task 6: 编写测试** (AC: #全部)
  - [ ] 6.1 CampCard 组件单元测试
  - [ ] 6.2 CampList 页面单元测试
  - [ ] 6.3 API 请求 Mock 测试
  - [ ] 6.4 性能测试 (Lighthouse)
    - FCP < 1.5s
    - LCP < 2.5s
    - CLS < 0.1

- [ ] **Task 7: 微信分享支持** (AC: #可选增强)
  - [ ] 7.1 配置微信 JSSDK (wx.config)
  - [ ] 7.2 设置默认分享标题和图片
  - [ ] 7.3 分享链接带 utm_source 参数追踪

---

## Dev Notes

### 认证说明

> **重要**: 本故事的列表页是**完全公开**的，无需任何认证。
>
> - 列表页 (`/camps`) 无需 OAuth 登录
> - 详情页 (`/camps/:id`) 也无需登录
> - `accessToken` 仅在支付完成后生成，用于后续绑定和进度查询 (EP02-S05/EP03-S05)
> - 本故事重点是列表展示，认证逻辑在后续故事 (EP02-S02) 处理

### 技术栈要求

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.3+ | 使用 Composition API + `<script setup>` |
| Vant | ^4.8.0 | 移动端 UI 组件库 (锁定版本) |
| TypeScript | 5.x | 类型安全 |
| Vite | 5.x | 构建工具 |
| Pinia | 2.x | 状态管理 |
| Axios | 1.x | HTTP 客户端 |
| Vitest | 1.x | 单元测试 |

### 项目结构

```
frontend/h5-member/
├── src/
│   ├── api/                # API 接口定义
│   │   ├── camp.ts         # 训练营相关接口
│   │   └── types.ts        # 通用响应类型
│   ├── components/         # 通用组件
│   │   ├── CampCard.vue    # 训练营卡片组件
│   │   └── ErrorRetry.vue  # 错误重试组件
│   ├── views/              # 页面组件
│   │   ├── CampList.vue    # 训练营列表页
│   │   └── CampDetail.vue  # 训练营详情页 (占位)
│   ├── router/             # 路由配置
│   │   └── index.ts
│   ├── stores/             # Pinia 状态管理
│   │   └── camp.ts         # 训练营状态 + 缓存
│   ├── utils/              # 工具函数
│   │   ├── request.ts      # Axios 封装
│   │   └── cache.ts        # 缓存工具
│   ├── types/              # TypeScript 类型定义
│   │   ├── camp.d.ts       # 训练营类型
│   │   └── api.d.ts        # API 响应类型
│   ├── assets/             # 静态资源
│   │   └── images/         # 占位图等
│   ├── App.vue
│   └── main.ts
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── .env.development
```

### API 接口规范

**请求**:
```
GET /api/h5/camps?status=enrolling&page=1&pageSize=10
```

**响应**:
```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "21天早起打卡训练营",
        "posterUrl": "https://cdn.example.com/posters/camp1.jpg",
        "description": "每天早上6点前打卡...",
        "deposit": 99.00,
        "startDate": "2025-12-10",
        "endDate": "2025-12-31",
        "checkinDays": 21,
        "requiredDays": 15,
        "memberCount": 128,
        "status": "enrolling"
      }
    ],
    "total": 5,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  },
  "timestamp": 1730000000
}
```

### TypeScript 类型定义

```typescript
// types/api.d.ts - 通用 API 类型
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  timestamp: number
}

export interface ApiError {
  code: number
  message: string
  timestamp: number
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// types/camp.d.ts - 训练营类型
export type CampStatus = 'draft' | 'enrolling' | 'ongoing' | 'ended' | 'settled' | 'archived'

export interface Camp {
  id: number
  name: string
  posterUrl: string
  description: string
  deposit: number
  startDate: string      // ISO 8601 date (YYYY-MM-DD)
  endDate: string        // ISO 8601 date
  checkinDays: number
  requiredDays: number
  memberCount: number
  status: CampStatus
}

export type CampListResponse = PageResult<Camp>
```

### Vant 分页加载实现

```vue
<template>
  <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
    <van-list
      v-model:loading="loading"
      :finished="finished"
      :error.sync="error"
      error-text="加载失败，点击重试"
      finished-text="没有更多了"
      @load="onLoad"
    >
      <CampCard
        v-for="camp in camps"
        :key="camp.id"
        :camp="camp"
        @click="goDetail(camp.id)"
      />
    </van-list>
    <van-empty v-if="!loading && !error && camps.length === 0" description="暂无可报名的训练营" />
  </van-pull-refresh>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getCampList } from '@/api/camp'
import type { Camp } from '@/types/camp'

const router = useRouter()
const camps = ref<Camp[]>([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const error = ref(false)
const page = ref(1)
const pageSize = 10

// 加载更多
async function onLoad() {
  try {
    const res = await getCampList(page.value, pageSize)
    camps.value.push(...res.data.list)
    page.value++
    if (camps.value.length >= res.data.total) {
      finished.value = true
    }
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}

// 下拉刷新
async function onRefresh() {
  page.value = 1
  finished.value = false
  error.value = false
  camps.value = []
  await onLoad()
  refreshing.value = false
}

function goDetail(id: number) {
  router.push(`/camps/${id}`)
}
</script>
```

### 响应式与设备兼容

**屏幕适配**:
- iPhone 6/7/8 (375px) - 最小宽度
- iPhone X/11/12/13/14/15 (390px-430px)
- Android 常见尺寸 (360px, 375px, 412px)

**安全区域处理**:
- iOS: 使用 Vant 内置 Safe Area 支持
- 顶部预留微信标题栏高度 (44px iOS / 48px Android)
- env(safe-area-inset-bottom) 处理底部

**微信浏览器特定**:
- 禁用 window.top 访问 (iframe 限制)
- 使用 WeixinJSBridge 时需等待 ready 事件

### 错误码处理

| HTTP 状态码 | 含义 | 前端处理 |
|------------|------|---------|
| 200 | 成功 | 正常展示数据 |
| 400 | 请求参数错误 | 显示错误提示 |
| 404 | 资源不存在 | 显示空状态 |
| 429 | 请求过于频繁 | 显示 "请稍后重试" |
| 500 | 服务器错误 | 显示重试按钮 |
| 网络超时 | 请求超时 | 显示重试按钮 |

### 环境变量配置

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_TITLE=训练营押金退款
VITE_API_TIMEOUT=10000
VITE_LOG_LEVEL=debug
VITE_ENABLE_CACHE=true

# .env.production
VITE_API_BASE_URL=https://api.example.com/api
VITE_APP_TITLE=训练营押金退款
VITE_API_TIMEOUT=10000
VITE_LOG_LEVEL=warn
VITE_ENABLE_CACHE=true
```

### 性能要求

| 指标 | 目标值 | 测量方式 |
|------|--------|---------|
| First Contentful Paint (FCP) | < 1.5s | Lighthouse |
| Largest Contentful Paint (LCP) | < 2.5s | Lighthouse |
| Cumulative Layout Shift (CLS) | < 0.1 | Lighthouse |
| Time to Interactive (TTI) | < 3.5s | Lighthouse |
| 首屏加载 | < 2s | 实际测试 |

**测试命令**:
```bash
npm run build
npm run preview
# 使用 Chrome DevTools Lighthouse 面板测试
```

---

## 后端集成验证

**开发前置条件**: 确保后端 `GET /api/h5/camps` 接口已就绪。

**验证清单**:
- [ ] 后端服务已启动: `http://localhost:8080`
- [ ] 接口可访问: `curl http://localhost:8080/api/h5/camps?page=1&pageSize=10`
- [ ] 响应格式与接口文档 (v1.1 §3.1) 一致
- [ ] 支持分页参数: page, pageSize
- [ ] 支持状态过滤: ?status=enrolling
- [ ] CORS 已配置 (允许 http://localhost:5173)
- [ ] 返回数据中 HTML 内容已转义 (防 XSS)

**快速验证命令**:
```bash
# 启动后端
cd backend && ./gradlew bootRun

# 测试接口
curl -s "http://localhost:8080/api/h5/camps?status=enrolling&page=1&pageSize=10" | jq
```

---

## EP01 学习参考

在开始开发前，参考 EP01 已完成故事的实现模式：

**后端代码参考** (如已实现):
- `CampH5Controller.java` - H5 端控制器结构
- `CampService.java` - 分页查询逻辑
- `CampVO.java` - 返回字段结构

**关键学习点**:
1. API 响应格式统一使用 `ApiResponse<T>` 包装
2. 分页使用 MyBatis Plus PageHelper
3. 状态枚举值与 `状态枚举定义.md` 保持一致
4. 软删除字段 `deleted_at` 在查询时自动过滤

---

## Project Structure Notes

### 与统一项目结构对齐

- H5 会员端项目位于 `frontend/h5-member/`
- 遵循 Vue 3 + Vite 标准项目结构
- API 调用指向后端 Spring Boot 服务 (EP01 已创建)

### 依赖关系

- **前置条件**: EP01-S03 (训练营 CRUD 接口) 必须完成
- **后端接口**: `GET /api/h5/camps` 由 `CampH5Controller.java` 提供
- **数据库表**: `training_camp` 表结构已定义
- **后续依赖**: EP02-S02 (OAuth) 将复用本故事创建的项目骨架

---

## References

| 文档 | 路径 | 相关章节 |
|------|------|----------|
| PRD | `docs/PRD.md` | 4.1.1 训练营列表页 |
| 技术方案 | `docs/v1/design/技术方案.md` | 4.2 技术选型, 5.1.0 用户报名流程 |
| API 文档 | `docs/v1/api/接口文档.md` | 3.1 获取训练营列表 |
| 前端路由 | `docs/v1/design/前端路由设计.md` | 1.1 H5 路由表 |
| Epic 定义 | `docs/epics.md` | EP02-S01 |
| 用户故事 | `docs/v1/user-stories/EP02-会员报名与支付.md` | Story 2.1 |
| 状态枚举 | `docs/v1/design/状态枚举定义.md` | camp_status 定义 |

---

## Dev Agent Record

### Context Reference
- Epic: EP02 会员报名与支付系统
- Story: EP02-S01 H5 前端骨架与训练营列表页
- FR Coverage: FR2.1

### Agent Model Used
_To be filled by dev agent_

### Debug Log References
_To be filled by dev agent_

### Completion Notes List
_To be filled by dev agent_

### File List
_To be filled by dev agent_

---

## Story Metadata

| 属性 | 值 |
|------|-----|
| Story 点数 | 3 |
| 优先级 | P0 |
| Epic | EP02 |
| 前置条件 | EP01-S03 完成 |
| 覆盖 FR | FR2.1 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
