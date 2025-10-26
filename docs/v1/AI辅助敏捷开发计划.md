# AI 辅助敏捷开发计划

> **适用场景**：全程使用 AI 进行编码，人工只负责关键设计和功能测试
> **开发模式**：Vibe Coding（AI 驱动开发）
> **总时长**：23 天（8 个 Sprint）
> **原则**：每个迭代都能独立运行和测试

---

## 📋 开发原则

### 1. 最小可测试单元
- 每个 Sprint 完成后都能独立运行
- 每个任务都有明确的验收标准
- 每个功能都有单元测试

### 2. 垂直切片
- 每个迭代都包含前后端完整功能
- 优先完成端到端的功能流程
- 避免"前端等后端"的情况

### 3. 依赖最小化
- 优先开发低依赖模块
- 外部依赖使用 Mock
- 避免阻塞性任务

### 4. 测试驱动
- 核心业务逻辑必须有单元测试
- 接口必须有集成测试
- 测试覆盖率：核心业务 ≥ 80%

---

## 🚀 迭代计划总览

| Sprint | 时长 | 目标 | 交付物 |
|--------|------|------|--------|
| Sprint 0 | 2天 | 环境搭建和基础框架 | 可运行的前后端骨架 + 数据库 |
| Sprint 1 | 3天 | 用户认证和权限管理 | JWT 认证 + 登录页面 |
| Sprint 2 | 4天 | 训练营管理 | 训练营 CRUD + H5 列表页面 |
| Sprint 3 | 4天 | 企业微信支付集成 | 支付创建 + Webhook 回调 |
| Sprint 4 | 3天 | 知识星球 API 集成 | 打卡数据同步 + 定时任务 |
| Sprint 5 | 2天 | 会员匹配算法 | 自动匹配 + 手动匹配 |
| Sprint 6 | 3天 | 退款审核和执行 | 退款列表生成 + 自动退款 |
| Sprint 7 | 3天 | 统计报表和通知 | ECharts 图表 + 企业微信通知 |
| Sprint 8 | 3天 | 系统管理和安全 | 用户管理 + 操作日志 + 限流 |

---

## Sprint 0：环境搭建和基础框架（2天）

### 🎯 目标
搭建可运行的前后端骨架，完成数据库初始化

### 📦 任务拆分

#### 任务 0.1：后端项目骨架搭建
- **优先级**：P0（必须完成）
- **预计时间**：4 小时
- **负责人**：AI（Claude Code / Cursor）
- **交付物**：可运行的 Spring Boot 项目 + Knife4j 文档
- **验收标准**：
  - ✅ `mvn spring-boot:run` 启动成功
  - ✅ 访问 http://localhost:8080/doc.html 显示 API 文档
  - ✅ 健康检查接口 `/api/health` 返回 200

#### 🤖 AI 提示词（任务 0.1）

```markdown
我需要创建一个 Spring Boot 3.2+ 的后端项目骨架，请帮我完成以下任务：

【项目要求】
- 项目名称：camp-backend
- 基础包名：com.camp
- 端口：8080
- Java 版本：17

【依赖清单】
1. Spring Boot Starter Web
2. Spring Boot Starter Security（暂时禁用，后续配置）
3. Spring Boot Starter Validation
4. MyBatis Plus 3.5.5
5. PostgreSQL 驱动
6. Redis Spring Boot Starter
7. Lombok
8. Knife4j 4.x（API 文档）
9. OkHttp3（HTTP 客户端）
10. Hutool（工具类）

【目录结构】
backend/
├── src/main/java/com/camp/
│   ├── CampApplication.java          # 启动类
│   ├── config/
│   │   ├── MybatisPlusConfig.java    # MyBatis Plus 配置
│   │   ├── RedisConfig.java          # Redis 配置
│   │   ├── Knife4jConfig.java        # API 文档配置
│   │   └── CorsConfig.java           # CORS 跨域配置
│   ├── common/
│   │   ├── Result.java               # 统一响应格式
│   │   ├── ResultCode.java           # 错误码枚举
│   │   ├── BusinessException.java    # 业务异常
│   │   └── GlobalExceptionHandler.java  # 全局异常处理
│   ├── controller/
│   │   └── HealthController.java     # 健康检查接口
│   ├── service/
│   ├── mapper/
│   └── entity/
├── src/main/resources/
│   ├── application.yml               # 通用配置
│   ├── application-dev.yml           # 开发环境配置
│   ├── application-prod.yml          # 生产环境配置
│   └── logback-spring.xml            # 日志配置

【配置要求】
1. application.yml：
   - 数据源：PostgreSQL (localhost:5432/camp_db)
   - Redis：localhost:6379
   - 日志级别：INFO

2. 统一响应格式（Result.java）：
   ```json
   {
     "code": 200,
     "message": "成功",
     "data": {},
     "timestamp": 1234567890
   }
   ```

3. 全局异常处理：
   - ValidationException → 400
   - BusinessException → 自定义错误码
   - Exception → 500

4. HealthController 实现：
   - GET /api/health → 返回系统状态

【验收标准】
1. 运行 `mvn spring-boot:run` 成功启动
2. 访问 http://localhost:8080/doc.html 显示 Knife4j 文档
3. 访问 http://localhost:8080/api/health 返回 {"code":200,"message":"系统运行正常"}

请生成完整的代码，包括 pom.xml 和所有配置文件。
```

---

#### 任务 0.2：数据库脚本生成
- **优先级**：P0
- **预计时间**：2 小时
- **交付物**：完整的数据库初始化脚本
- **验收标准**：
  - ✅ 执行 SQL 脚本成功创建 10 张表
  - ✅ 索引创建成功
  - ✅ 触发器工作正常

#### 🤖 AI 提示词（任务 0.2）

```markdown
我需要生成 PostgreSQL 数据库初始化脚本，请帮我创建以下内容：

【数据库设计参考】
- 参考文档：docs/v1/数据库设计.md
- 数据库名称：camp_db
- 表数量：10 张核心表

【脚本要求】
1. sql/init-database.sql：
   - 创建数据库（如果不存在）
   - 创建 10 张表（参考文档中的完整设计）
   - 创建索引（外键索引、查询优化索引）
   - 创建触发器（自动更新 updated_at 字段）

2. sql/seed-data.sql：
   - 默认管理员账号（username: admin, password: 加密后的 admin123）
   - 系统配置初始数据（system_config 表）

【表清单】
1. training_camp - 训练营基本信息
2. camp_member - 会员与训练营关系（核心表）
3. planet_user - 知识星球用户信息
4. payment_record - 支付流水记录
5. checkin_record - 打卡记录
6. refund_record - 退款记录
7. system_user - 管理员账号
8. operation_log - 操作审计日志
9. system_config - 系统配置
10. camp_member_relation - 训练营与教练/志愿者关系

【字段要求】
- 所有表必须有：id（BIGSERIAL）、created_at（TIMESTAMPTZ）、updated_at（TIMESTAMPTZ）
- 软删除表必须有：deleted_at（TIMESTAMPTZ，默认 NULL）
- 金额字段：DECIMAL(10,2)
- 枚举字段：使用 VARCHAR 存储，注释中说明可选值

【验收标准】
1. 执行 `psql -U postgres -f sql/init-database.sql` 成功
2. 数据库包含 10 张表
3. 索引创建成功
4. 触发器工作正常（更新记录时 updated_at 自动更新）

请生成完整的 SQL 脚本。
```

---

#### 任务 0.3：前端项目骨架搭建（H5 会员端）
- **优先级**：P0
- **预计时间**：3 小时
- **交付物**：可运行的 Vue 3 + Vant H5 项目
- **验收标准**：
  - ✅ `npm run dev` 启动成功
  - ✅ 能访问首页
  - ✅ Axios 请求能正常转发到后端

#### 🤖 AI 提示词（任务 0.3）

```markdown
我需要创建一个 Vue 3 + Vant 的 H5 会员端项目，请帮我完成以下任务：

【项目要求】
- 项目名称：h5-member
- 目录位置：frontend/h5-member/
- 技术栈：Vue 3.3+ + Vite 5.x + Vant 4.x + Pinia + Vue Router

【依赖清单】
1. Vue 3.3+
2. Vant 4.x（移动端 UI 组件库）
3. Vue Router 4.x
4. Pinia 2.x
5. Axios
6. Day.js（日期处理）
7. qrcode.vue3（二维码生成）

【目录结构】
frontend/h5-member/
├── src/
│   ├── main.js                  # 入口文件
│   ├── App.vue                  # 根组件
│   ├── router/
│   │   └── index.js             # 路由配置
│   ├── stores/
│   │   └── user.js              # 用户状态管理
│   ├── views/
│   │   ├── CampList.vue         # 训练营列表
│   │   ├── CampDetail.vue       # 训练营详情
│   │   └── ProgressQuery.vue    # 打卡进度查询
│   ├── components/
│   │   └── CampCard.vue         # 训练营卡片组件
│   ├── utils/
│   │   └── request.js           # Axios 封装
│   └── assets/
├── .env.development             # 开发环境变量
├── .env.production              # 生产环境变量
└── vite.config.js               # Vite 配置

【功能要求】
1. 路由配置：
   - / → 训练营列表（CampList.vue）
   - /camp/:id → 训练营详情（CampDetail.vue）
   - /progress → 打卡进度查询（ProgressQuery.vue）

2. Axios 封装（utils/request.js）：
   - 基础 URL：开发环境 http://localhost:8080/api
   - 请求拦截器：添加 Content-Type
   - 响应拦截器：统一处理错误（显示 Toast）

3. 基础页面（CampList.vue）：
   - 显示标题"训练营列表"
   - 空状态提示（暂无数据）

4. Vite 配置：
   - 配置代理：/api → http://localhost:8080
   - 配置别名：@/ → src/

【验收标准】
1. 运行 `npm run dev` 成功启动
2. 访问 http://localhost:5173 显示"训练营列表"页面
3. Axios 请求能正常转发到后端

请生成完整的代码和配置文件。
```

---

#### 任务 0.4：前端项目骨架搭建（Web 管理后台）
- **优先级**：P1（重要但不紧急）
- **预计时间**：3 小时
- **交付物**：可运行的 Vue 3 + Element Plus 项目
- **验收标准**：
  - ✅ `npm run dev` 启动成功
  - ✅ 能看到登录页和基础布局

#### 🤖 AI 提示词（任务 0.4）

```markdown
我需要创建一个 Vue 3 + Element Plus 的 Web 管理后台项目，请帮我完成以下任务：

【项目要求】
- 项目名称：admin-web
- 目录位置：frontend/admin-web/
- 技术栈：Vue 3.3+ + Vite 5.x + Element Plus + Pinia + Vue Router + ECharts

【依赖清单】
1. Vue 3.3+
2. Element Plus 2.4+（后台 UI 组件库）
3. Vue Router 4.x
4. Pinia 2.x
5. Axios
6. ECharts 5.x（图表库）
7. Day.js（日期处理）

【目录结构】
frontend/admin-web/
├── src/
│   ├── main.js                  # 入口文件
│   ├── App.vue                  # 根组件
│   ├── router/
│   │   └── index.js             # 路由配置 + 权限守卫
│   ├── stores/
│   │   └── user.js              # 用户状态管理（Token、角色）
│   ├── views/
│   │   ├── Login.vue            # 登录页面
│   │   ├── Dashboard.vue        # 仪表盘
│   │   ├── CampManage.vue       # 训练营管理
│   │   └── RefundManage.vue     # 退款管理
│   ├── layout/
│   │   └── Layout.vue           # 基础布局（侧边栏+头部+内容区）
│   ├── components/
│   │   └── StatisticsCard.vue   # 统计卡片组件
│   ├── utils/
│   │   └── request.js           # Axios 封装
│   └── assets/
├── .env.development             # 开发环境变量
├── .env.production              # 生产环境变量
└── vite.config.js               # Vite 配置

【功能要求】
1. 路由配置：
   - /login → 登录页面
   - / → 仪表盘（需要登录）
   - /camps → 训练营管理
   - /refunds → 退款管理

2. 权限守卫（router/index.js）：
   - 未登录 → 跳转到登录页
   - Token 验证

3. 基础布局（layout/Layout.vue）：
   - 侧边栏：菜单导航
   - 头部：用户信息 + 退出登录
   - 主内容区：<router-view />

4. 登录页面（views/Login.vue）：
   - 表单：用户名 + 密码
   - 提交后保存 Token 到 localStorage

【验收标准】
1. 运行 `npm run dev` 成功启动
2. 访问 http://localhost:5174 显示登录页面
3. 基础布局正常显示

请生成完整的代码和配置文件。
```

---

## Sprint 1：用户认证和权限管理（3天）

### 🎯 目标
完成 JWT 认证、登录注册、角色权限

### 📦 任务拆分

#### 任务 1.1：JWT 认证基础设施
- **优先级**：P0
- **预计时间**：4 小时
- **交付物**：JWT 工具类 + Spring Security 配置
- **验收标准**：
  - ✅ 登录接口返回有效 Token
  - ✅ 访问受保护接口需要 Token

#### 🤖 AI 提示词（任务 1.1）

```markdown
我需要在 Spring Boot 项目中实现 JWT 认证，请帮我完成以下任务：

【技术要求】
- JWT 库：jjwt 0.11.5
- Token 有效期：7 天
- 密钥：从配置文件读取

【需要创建的类】
1. JwtUtil.java（com.camp.common.util）：
   - generateToken(String username, Long userId) → 生成 Token
   - parseToken(String token) → 解析 Token，返回用户信息
   - validateToken(String token) → 校验 Token 是否有效

2. SecurityConfig.java（com.camp.config）：
   - 禁用 CSRF
   - 配置白名单：/api/auth/**, /api/h5/**, /doc.html, /webjars/**
   - 配置 JWT 过滤器

3. JwtAuthenticationFilter.java（com.camp.filter）：
   - 从 Header 中提取 Authorization: Bearer {token}
   - 校验 Token，设置 SecurityContext

【配置文件】
application.yml 添加：
```yaml
jwt:
  secret: your-secret-key-change-in-production
  expiration: 604800  # 7 天（秒）
```

【验收标准】
1. 访问 /api/admin/** 未携带 Token → 返回 401
2. 携带有效 Token → 正常访问
3. Token 过期 → 返回 401

请生成完整的代码。
```

---

#### 任务 1.2：登录注册接口
- **优先级**：P0
- **预计时间**：3 小时
- **交付物**：登录、注册接口 + 单元测试
- **验收标准**：
  - ✅ Postman 测试通过
  - ✅ 密码加密正确

#### 🤖 AI 提示词（任务 1.2）

```markdown
我需要实现用户登录和注册接口，请帮我完成以下任务：

【数据库表】
system_user 表（已存在）：
- id, username, password, real_name, role, status, created_at, updated_at

【需要创建的类】
1. SystemUser.java（com.camp.entity）
2. SystemUserMapper.java（com.camp.mapper）
3. AuthService.java（com.camp.service）：
   - login(username, password) → 返回 Token
   - register(username, password, realName) → 创建用户
4. AuthController.java（com.camp.controller）：
   - POST /api/auth/login
   - POST /api/auth/register（仅开发环境可用）

【接口设计】
1. POST /api/auth/login
   请求：{"username": "admin", "password": "admin123"}
   响应：{"code": 200, "data": {"token": "xxx", "user": {...}}}

2. POST /api/auth/register
   请求：{"username": "test", "password": "123456", "realName": "测试用户"}
   响应：{"code": 200, "message": "注册成功"}

【密码加密】
- 使用 BCryptPasswordEncoder
- 注册时加密，登录时校验

【验收标准】
1. 使用默认账号（admin/admin123）登录成功
2. 密码错误 → 返回 401
3. Token 能正常解析出用户信息

请生成完整的代码和单元测试。
```

---

#### 任务 1.3：Web 管理后台登录页面
- **优先级**：P1
- **预计时间**：2 小时
- **交付物**：Element Plus 登录页面
- **验收标准**：
  - ✅ 登录成功后跳转到仪表盘
  - ✅ Token 保存到 localStorage

#### 🤖 AI 提示词（任务 1.3）

```markdown
我需要实现 Web 管理后台的登录页面，请帮我完成以下任务：

【页面路径】
frontend/admin-web/src/views/Login.vue

【功能要求】
1. 表单字段：
   - 用户名（必填，3-20 字符）
   - 密码（必填，6-20 字符）
   - 记住密码（可选）

2. 表单验证：
   - 使用 Element Plus 的表单验证
   - 密码错误时显示错误提示

3. 登录逻辑：
   - 调用 POST /api/auth/login
   - 登录成功 → 保存 Token 到 localStorage → 跳转到 /dashboard
   - 登录失败 → 显示错误提示

4. UI 设计：
   - 居中布局
   - 背景：渐变色
   - 卡片式表单

【状态管理】
更新 stores/user.js：
```javascript
export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref({})

  const login = async (username, password) => {
    const res = await axios.post('/api/auth/login', { username, password })
    token.value = res.data.data.token
    userInfo.value = res.data.data.user
    localStorage.setItem('token', token.value)
  }

  const logout = () => {
    token.value = ''
    userInfo.value = {}
    localStorage.removeItem('token')
  }

  return { token, userInfo, login, logout }
})
```

【验收标准】
1. 登录成功后跳转到仪表盘
2. Token 保存到 localStorage
3. 密码错误时显示错误提示

请生成完整的 Vue 代码。
```

---

## Sprint 2：训练营管理（4天）

### 🎯 目标
完成训练营 CRUD、H5 列表页面

### 📦 任务拆分

#### 任务 2.1：训练营 CRUD 接口
- **优先级**：P0
- **预计时间**：4 小时
- **交付物**：训练营 CRUD 接口 + 单元测试
- **验收标准**：
  - ✅ Postman 测试通过
  - ✅ 分页查询正常

#### 🤖 AI 提示词（任务 2.1）

```markdown
我需要实现训练营管理的 CRUD 接口，请帮我完成以下任务：

【数据库表】
training_camp 表（已存在）：
- id, name, description, deposit_amount, start_date, end_date,
  required_days, total_days, group_qrcode, status, created_at, updated_at

【需要创建的类】
1. TrainingCamp.java（实体类）
2. TrainingCampMapper.java（Mapper）
3. CampDTO.java（数据传输对象）
4. CampVO.java（视图对象）
5. CampService.java（业务逻辑）：
   - createCamp(CampDTO) → 创建训练营
   - updateCamp(id, CampDTO) → 更新训练营
   - getCampList(status, page, size) → 分页查询
   - getCampDetail(id) → 获取详情
   - deleteCamp(id) → 软删除
6. CampController.java（控制器）：
   - POST /api/admin/camps
   - PUT /api/admin/camps/{id}
   - GET /api/admin/camps
   - GET /api/admin/camps/{id}
   - DELETE /api/admin/camps/{id}

【接口设计】
1. POST /api/admin/camps
   请求：
   ```json
   {
     "name": "21天打卡训练营",
     "description": "21天养成好习惯",
     "deposit_amount": 99.00,
     "start_date": "2024-01-01",
     "end_date": "2024-01-21",
     "required_days": 18,
     "group_qrcode": "https://xxx.png"
   }
   ```
   响应：{"code": 200, "data": {...}}

2. GET /api/admin/camps?status=active&page=1&size=10
   响应：{"code": 200, "data": {"list": [...], "total": 100}}

【参数校验】
- name：必填，1-50 字符
- deposit_amount：必填，0.01-9999.99
- start_date < end_date
- required_days ≤ total_days

【业务逻辑】
1. 创建训练营时：
   - 计算 total_days = (end_date - start_date) + 1
   - 校验 required_days ≤ total_days
   - 状态默认为 "active"

2. 软删除：
   - 只有状态为 "finished" 的训练营才能删除
   - 更新 deleted_at 字段

【验收标准】
1. 创建训练营成功
2. 查询列表能正常分页
3. 更新和删除功能正常

请生成完整的代码和单元测试（使用 @SpringBootTest）。
```

---

#### 任务 2.2：H5 训练营列表页面
- **优先级**：P0
- **预计时间**：3 小时
- **交付物**：H5 训练营列表页面
- **验收标准**：
  - ✅ 能正常显示训练营列表
  - ✅ 点击卡片能跳转到详情页

#### 🤖 AI 提示词（任务 2.2）

```markdown
我需要实现 H5 训练营列表页面，请帮我完成以下任务：

【页面路径】
frontend/h5-member/src/views/CampList.vue

【功能要求】
1. 调用后端接口：
   - GET /api/h5/camps?status=active

2. 使用 Vant 组件：
   - NavBar（顶部导航栏）
   - List（列表组件，支持下拉刷新）
   - Card（卡片样式）
   - Empty（空状态）
   - Loading（加载状态）

3. 每个训练营卡片显示：
   - 训练营名称（加粗）
   - 押金金额（红色加粗，¥99.00）
   - 开始-结束日期（2024-01-01 至 2024-01-21）
   - 打卡要求（"打卡 18 天可退款"）
   - "立即报名"按钮

4. 交互：
   - 点击卡片 → 跳转到训练营详情页（/camp/:id）
   - 点击"立即报名" → 跳转到报名页面

【UI 设计】
- 顶部：NavBar（标题"训练营列表"）
- 列表：Card 卡片样式，间距 10px
- 空状态：Empty 组件（"暂无训练营"）
- 加载状态：Loading

【验收标准】
1. 页面能正常显示训练营列表
2. 数据格式正确（金额显示 ¥99.00）
3. 点击卡片能正常跳转

请生成完整的 Vue 代码。
```

---

#### 任务 2.3：H5 训练营详情页面
- **优先级**：P1
- **预计时间**：3 小时
- **AI 提示词**：创建训练营详情页面，显示完整信息

---

#### 任务 2.4：Web 管理后台训练营管理页面
- **优先级**：P1
- **预计时间**：4 小时
- **AI 提示词**：创建训练营管理页面（表格 + 新增/编辑对话框）

---

## Sprint 3：企业微信支付集成（4天）

### 🎯 目标
完成支付创建、Webhook 回调、轮询兜底

### 📦 任务拆分

#### 任务 3.1：企业微信支付 SDK 封装
- **优先级**：P0
- **预计时间**：4 小时
- **交付物**：企业微信支付 Manager 类
- **验收标准**：
  - ✅ 能成功调用企业微信支付 API
  - ✅ 签名正确

#### 🤖 AI 提示词（任务 3.1）

```markdown
我需要封装企业微信支付 API，请帮我完成以下任务：

【企业微信支付 API 文档】
- 创建订单：POST https://api.weixin.qq.com/pay/createorder
- 查询订单：POST https://api.weixin.qq.com/pay/queryorder
- 退款：POST https://api.weixin.qq.com/pay/refund

【需要创建的类】
1. WechatPayManager.java（com.camp.manager）：
   - createOrder(out_trade_no, amount, description) → 返回支付参数
   - queryOrder(out_trade_no) → 查询支付状态
   - refund(out_trade_no, refund_amount) → 发起退款

2. WechatPayConfig.java（com.camp.config）：
   - 从 system_config 表读取：appid, secret, mch_id, api_key

【签名算法】
- 使用 MD5 签名（参考企业微信文档）
- 签名步骤：
  1. 参数按 ASCII 码排序
  2. 拼接成 key1=value1&key2=value2&key=api_key
  3. MD5 加密后转大写

【异常处理】
- 网络异常 → 重试 1 次
- 签名错误 → 记录日志，抛出 BusinessException

【配置读取】
从 system_config 表读取配置：
```java
@Autowired
private SystemConfigService configService;

private String getConfig(String key) {
    return configService.getConfigValue(key);
}

// 使用示例
String appid = getConfig("wechat.pay.appid");
```

【验收标准】
1. 能成功调用企业微信支付 API（需要测试环境密钥）
2. 签名正确
3. 错误处理完善

请生成完整的代码。
```

---

#### 任务 3.2：支付创建和 Webhook 回调
- **优先级**：P0
- **预计时间**：4 小时
- **交付物**：支付创建接口 + Webhook 回调处理
- **验收标准**：
  - ✅ 创建支付成功
  - ✅ 模拟回调能正常处理

#### 🤖 AI 提示词（任务 3.2）

```markdown
我需要实现支付创建和回调处理，请帮我完成以下任务：

【数据库表】
payment_record 表（已存在）：
- id, out_trade_no, camp_id, member_id, amount, status,
  wx_transaction_id, paid_at, created_at, updated_at

【需要创建的类】
1. PaymentRecord.java（实体类）
2. PaymentRecordMapper.java（Mapper）
3. PaymentService.java（业务逻辑）：
   - createPayment(campId, memberId, amount) → 创建支付订单
   - handleWebhook(xmlData) → 处理支付回调

4. PaymentController.java（控制器）：
   - POST /api/h5/payments → 创建支付
   - POST /api/webhook/wechat/pay → 支付回调

【接口设计】
1. POST /api/h5/payments
   请求：{"camp_id": 1}
   响应：{"code": 200, "data": {"pay_params": {...}}}

2. POST /api/webhook/wechat/pay
   - 验证签名
   - 更新支付状态为"已支付"
   - 创建 camp_member 记录
   - 返回成功响应（XML 格式）

【业务逻辑】
1. 创建支付时：
   - 生成唯一订单号（out_trade_no = "CAMP" + timestamp + random）
   - 调用 WechatPayManager.createOrder()
   - 保存 payment_record（状态=待支付）

2. 回调处理：
   - 校验签名（防止伪造）
   - 幂等性处理（避免重复回调）
   - 事务处理：
     - 更新 payment_record（状态=已支付）
     - 创建 camp_member 记录（match_status=待匹配）

【幂等性处理】
```java
// 使用 Redis 分布式锁
String lockKey = "payment:callback:" + out_trade_no;
if (!redisTemplate.opsForValue().setIfAbsent(lockKey, "1", 5, TimeUnit.MINUTES)) {
    log.warn("重复回调: {}", out_trade_no);
    return;
}
```

【验收标准】
1. 创建支付成功，返回支付参数
2. 模拟回调能正常处理
3. 支付记录状态正确更新

请生成完整的代码和单元测试。
```

---

#### 任务 3.3：支付轮询兜底
- **优先级**：P1
- **预计时间**：2 小时
- **AI 提示词**：实现定时任务，每小时轮询待支付订单

---

## Sprint 4：知识星球 API 集成（3天）

### 🎯 目标
完成打卡数据同步、定时任务

### 📦 任务拆分

#### 任务 4.1：知识星球 API 封装
- **优先级**：P0
- **预计时间**：4 小时
- **交付物**：知识星球 Manager 类
- **验收标准**：
  - ✅ 能成功获取知识星球数据
  - ✅ Cookie 过期能正常提示

#### 🤖 AI 提示词（任务 4.1）

```markdown
我需要封装知识星球 API，请帮我完成以下任务：

【知识星球 API】
- 获取成员列表：GET https://api.zsxq.com/v2/groups/{group_id}/members
- 获取打卡记录：GET https://api.zsxq.com/v2/groups/{group_id}/topics

【需要创建的类】
1. PlanetManager.java（com.camp.manager）：
   - getMemberList(groupId) → 返回用户列表
   - getCheckinRecords(groupId, startDate, endDate) → 返回打卡记录

2. PlanetConfig.java（com.camp.config）：
   - 从 system_config 表读取：cookie, group_id

【认证方式】
- 使用 Cookie 认证（Header: Cookie: {value}）

【错误处理】
- Cookie 过期（返回 401） → 发送企业微信通知给管理员
- 网络异常 → 记录日志，重试 1 次

【数据解析】
知识星球 API 返回示例：
```json
{
  "succeeded": true,
  "resp_data": {
    "members": [
      {
        "user_id": "123",
        "name": "张三",
        "avatar": "https://xxx.jpg"
      }
    ],
    "topics": [
      {
        "user_id": "123",
        "create_time": "2024-01-01T00:00:00Z",
        "type": "checkin"
      }
    ]
  }
}
```

【验收标准】
1. 能成功获取知识星球数据
2. 数据格式正确解析
3. Cookie 过期能正常提示

请生成完整的代码。
```

---

#### 任务 4.2：打卡数据同步定时任务
- **优先级**：P0
- **预计时间**：4 小时
- **交付物**：打卡数据同步 Service + 定时任务
- **验收标准**：
  - ✅ 定时任务能正常执行
  - ✅ 打卡数据正确保存

#### 🤖 AI 提示词（任务 4.2）

```markdown
我需要实现打卡数据同步定时任务，请帮我完成以下任务：

【需要创建的类】
1. CheckinRecord.java（实体类）
2. CheckinRecordMapper.java（Mapper）
3. CheckinService.java（com.camp.service）：
   - syncCheckinData(campId, date) → 同步指定日期的打卡数据
   - calculateRefundEligibility(campId) → 计算退款资格

4. CheckinScheduledTask.java（com.camp.task）：
   - @Scheduled(cron = "0 0 1 * * ?") // 每天 01:00 执行
   - 自动同步所有进行中训练营的打卡数据

【业务逻辑】
1. 同步打卡数据：
   - 调用 PlanetManager.getCheckinRecords()
   - 解析打卡数据，保存到 checkin_record 表
   - 更新 camp_member 表的打卡统计（checkin_count）

2. 计算退款资格：
   - 统计每个会员的打卡天数
   - 更新 camp_member 表的 is_qualified 字段

【错误处理】
- 同步失败 → 发送企业微信通知给管理员
- 部分失败 → 继续处理其他训练营

【定时任务配置】
在启动类添加：
```java
@EnableScheduling
public class CampApplication {
    // ...
}
```

【验收标准】
1. 定时任务能正常执行
2. 打卡数据正确保存
3. 退款资格计算准确

请生成完整的代码和单元测试。
```

---

## Sprint 5：会员匹配算法（2天）

### 🎯 目标
完成自动匹配和手动匹配

### 📦 任务拆分

#### 任务 5.1：会员匹配算法
- **优先级**：P0
- **预计时间**：4 小时
- **交付物**：匹配算法 Service + 接口
- **验收标准**：
  - ✅ 自动匹配能正确识别高置信度匹配
  - ✅ 手动匹配能覆盖自动匹配结果

#### 🤖 AI 提示词（任务 5.1）

```markdown
我需要实现会员匹配算法，请帮我完成以下任务：

【匹配逻辑】
1. 星球ID匹配 → 置信度 100%
2. 星球昵称匹配 → 置信度 66%
3. 微信昵称匹配 → 置信度 33%
4. 匹配失败 → 人工介入

【需要创建的类】
1. MatchService.java（com.camp.service）：
   - autoMatch(campId) → 自动匹配所有会员
   - manualMatch(memberId, planetUserId) → 手动匹配
   - getUnmatchedMembers(campId) → 获取未匹配会员列表

2. MatchController.java（com.camp.controller）：
   - POST /api/admin/match/auto → 自动匹配
   - POST /api/admin/match/manual → 手动匹配
   - GET /api/admin/match/unmatched → 获取未匹配会员

【匹配算法】
```java
public MatchResult autoMatch(Long campId) {
    // 获取训练营所有会员
    List<CampMember> members = memberMapper.selectByCampId(campId);

    // 获取知识星球用户列表
    List<PlanetUser> users = planetUserMapper.selectAll();

    int matched = 0;
    for (CampMember member : members) {
        if (member.getMatchStatus().equals("已匹配")) {
            continue;  // 已匹配，跳过
        }

        for (PlanetUser user : users) {
            // 1. 星球ID匹配（置信度100%）
            if (member.getPlanetUid() != null &&
                member.getPlanetUid().equals(user.getUid())) {
                match(member, user, 100);
                matched++;
                break;
            }

            // 2. 星球昵称匹配（置信度66%）
            if (member.getPlanetNickname() != null &&
                similar(member.getPlanetNickname(), user.getNickname())) {
                match(member, user, 66);
                matched++;
                break;
            }

            // 3. 微信昵称匹配（置信度33%）
            if (member.getWechatNickname() != null &&
                similar(member.getWechatNickname(), user.getNickname())) {
                match(member, user, 33);
                matched++;
                break;
            }
        }
    }

    return new MatchResult(matched, members.size() - matched);
}

// 相似度计算（编辑距离）
private boolean similar(String s1, String s2) {
    int distance = StringUtil.levenshteinDistance(s1, s2);
    return distance <= 2;  // 允许2个字符差异
}

// 执行匹配
private void match(CampMember member, PlanetUser user, int confidence) {
    member.setPlanetUserId(user.getId());
    member.setMatchStatus("已匹配");
    member.setMatchConfidence(confidence);
    memberMapper.updateById(member);
}
```

【手动匹配】
```java
public void manualMatch(Long memberId, Long planetUserId) {
    CampMember member = memberMapper.selectById(memberId);
    member.setPlanetUserId(planetUserId);
    member.setMatchStatus("已匹配");
    member.setMatchConfidence(100);  // 手动匹配置信度100%
    memberMapper.updateById(member);
}
```

【验收标准】
1. 自动匹配能正确识别高置信度匹配
2. 手动匹配能覆盖自动匹配结果
3. 匹配统计准确（已匹配/未匹配数量）

请生成完整的代码和单元测试。
```

---

## Sprint 6：退款审核和执行（3天）

### 🎯 目标
完成退款列表生成、审核、自动退款

### 📦 任务拆分

#### 任务 6.1：退款列表生成
- **优先级**：P0
- **预计时间**：4 小时
- **交付物**：退款列表生成 Service + 接口
- **验收标准**：
  - ✅ 能正确生成退款列表
  - ✅ 审核流程正常

#### 🤖 AI 提示词（任务 6.1）

```markdown
我需要实现退款列表生成功能，请帮我完成以下任务：

【需要创建的类】
1. RefundRecord.java（实体类）
2. RefundRecordMapper.java（Mapper）
3. RefundService.java（com.camp.service）：
   - generateRefundList(campId) → 生成退款列表
   - approveRefund(refundIds) → 批量审核通过
   - executeRefund(refundId) → 执行退款
   - retryFailedRefunds() → 重试失败的退款

4. RefundController.java（com.camp.controller）：
   - POST /api/admin/refunds/generate → 生成退款列表
   - POST /api/admin/refunds/approve → 批量审核
   - POST /api/admin/refunds/execute → 执行退款
   - GET /api/admin/refunds → 查询退款列表

【业务逻辑】
1. 生成退款列表：
   - 查询训练营的所有会员
   - 筛选 is_qualified = true 的会员
   - 创建 refund_record 记录（状态=待审核）

2. 审核通过：
   - 更新 refund_record 状态为"待退款"

3. 执行退款：
   - 调用 WechatPayManager.refund()
   - 成功 → 更新状态为"已退款"
   - 失败 → 重试 1 次
   - 仍失败 → 标记为"退款失败"，记录失败原因

【代码示例】
```java
@Service
public class RefundService {
    @Autowired
    private CampMemberMapper memberMapper;

    @Autowired
    private RefundRecordMapper refundMapper;

    @Autowired
    private WechatPayManager wechatPayManager;

    @Transactional
    public RefundResult generateRefundList(Long campId) {
        // 1. 查询合格会员
        List<CampMember> members = memberMapper.selectByCampId(campId)
            .stream()
            .filter(m -> m.getIsQualified())
            .collect(Collectors.toList());

        // 2. 创建退款记录
        for (CampMember member : members) {
            RefundRecord record = new RefundRecord();
            record.setCampId(campId);
            record.setMemberId(member.getId());
            record.setAmount(member.getDepositAmount());
            record.setStatus("待审核");
            refundMapper.insert(record);
        }

        return new RefundResult(members.size());
    }

    @Transactional
    public void executeRefund(Long refundId) {
        RefundRecord record = refundMapper.selectById(refundId);

        try {
            // 调用企业微信退款 API
            wechatPayManager.refund(
                record.getOutTradeNo(),
                record.getAmount()
            );

            // 更新状态
            record.setStatus("已退款");
            record.setRefundedAt(new Date());
            refundMapper.updateById(record);

        } catch (Exception e) {
            // 失败重试 1 次
            try {
                Thread.sleep(3000);
                wechatPayManager.refund(
                    record.getOutTradeNo(),
                    record.getAmount()
                );
                record.setStatus("已退款");
                record.setRefundedAt(new Date());
            } catch (Exception e2) {
                // 仍失败，标记为退款失败
                record.setStatus("退款失败");
                record.setFailReason(e2.getMessage());
            }
            refundMapper.updateById(record);
        }
    }
}
```

【验收标准】
1. 能正确生成退款列表
2. 审核流程正常
3. 退款能正常执行（需要测试环境）

请生成完整的代码和单元测试。
```

---

## Sprint 7：统计报表和通知（3天）

### 🎯 目标
完成数据统计、ECharts 图表、企业微信通知

### 📦 任务拆分

#### 任务 7.1：统计数据接口
- **优先级**：P1
- **预计时间**：4 小时
- **交付物**：统计数据接口
- **验收标准**：
  - ✅ 统计数据准确
  - ✅ 性能良好

#### 🤖 AI 提示词（任务 7.1）

```markdown
我需要实现统计数据接口，请帮我完成以下任务：

【接口设计】
1. GET /api/admin/statistics/overview
   响应：
   ```json
   {
     "total_camps": 50,
     "active_camps": 10,
     "total_members": 5000,
     "total_refund_amount": 50000.00
   }
   ```

2. GET /api/admin/statistics/camp/{id}
   响应：
   ```json
   {
     "member_count": 100,
     "matched_count": 95,
     "qualified_count": 85,
     "refund_rate": 0.85,
     "checkin_trend": [10, 15, 20, ...]  // 每日打卡人数
   }
   ```

【需要创建的类】
1. StatisticsVO.java（视图对象）
2. StatisticsService.java（com.camp.service）
3. StatisticsController.java（com.camp.controller）

【业务逻辑】
1. 系统概览统计：
   - 总训练营数量
   - 进行中训练营数量
   - 总会员数量
   - 总退款金额

2. 训练营详细统计：
   - 会员数量
   - 已匹配数量
   - 合格数量
   - 退款率
   - 每日打卡人数趋势

【性能优化】
- 使用 Redis 缓存统计数据（5 分钟过期）
- 复杂查询使用数据库视图

【验收标准】
1. 统计数据准确
2. 性能良好（复杂查询使用缓存）

请生成完整的代码。
```

---

## Sprint 8：系统管理和安全（3天）

### 🎯 目标
完成用户管理、操作日志、接口限流

### 📦 任务拆分

#### 任务 8.1：接口限流
- **优先级**：P0
- **预计时间**：3 小时
- **交付物**：Redis 接口限流 AOP
- **验收标准**：
  - ✅ 超过限流阈值返回 429
  - ✅ 限流计数准确

#### 🤖 AI 提示词（任务 8.1）

```markdown
我需要实现 Redis 接口限流，请帮我完成以下任务：

【限流规则】
- 同一 IP 每分钟最多 100 次请求
- 同一用户每分钟最多 200 次请求

【需要创建的类】
1. RateLimit.java（注解）
2. RateLimitAspect.java（com.camp.aspect）：
   - 使用 Redis + Lua 脚本实现滑动窗口限流

【使用方式】
```java
@RateLimit(key = "api:login", limit = 10, period = 60)
public Result login(String username, String password) {
    // ...
}
```

【Lua 脚本】
```lua
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local period = tonumber(ARGV[2])
local current = tonumber(redis.call('get', key) or "0")

if current + 1 > limit then
    return 0  -- 超过限流
else
    redis.call('INCRBY', key, 1)
    redis.call('EXPIRE', key, period)
    return 1  -- 允许通过
end
```

【验收标准】
1. 超过限流阈值 → 返回 429 Too Many Requests
2. 限流计数准确
3. 性能影响小于 10ms

请生成完整的代码。
```

---

## 📝 使用建议

### 1. 如何使用这些提示词？

#### 方式一：直接复制到 Claude Code / Cursor
```
1. 打开 Claude Code 或 Cursor
2. 复制对应任务的 AI 提示词
3. 粘贴到对话框
4. AI 会生成完整的代码
5. 复制代码到项目中
6. 运行测试，验证功能
```

#### 方式二：使用 Claude Code 的 Slash Commands
```
1. 在项目根目录创建 .claude/commands/
2. 为每个任务创建一个 .md 文件（如 task-0.1.md）
3. 复制提示词到文件中
4. 使用 /task-0.1 触发任务
```

---

### 2. 开发流程建议

每个 Sprint 的开发流程：

```
1. Sprint 计划会议
   - 明确本 Sprint 的目标
   - 确认任务优先级
   - 准备好所有 AI 提示词

2. 开发迭代
   - 按照任务顺序逐个开发
   - 每个任务完成后立即测试
   - 通过验收标准后再进入下一个任务

3. Sprint 回顾
   - 检查所有任务是否完成
   - 运行集成测试
   - 记录遇到的问题和解决方案

4. Sprint 演示
   - 演示本 Sprint 的功能
   - 收集反馈
   - 规划下一个 Sprint
```

---

### 3. 质量保障

#### 代码审查清单

每个任务完成后，检查：
- [ ] 代码是否符合项目规范？
- [ ] 是否有单元测试？
- [ ] 测试覆盖率是否达标？
- [ ] 是否有 API 文档？
- [ ] 错误处理是否完善？
- [ ] 日志是否充分？

#### 测试策略

1. **单元测试**：核心业务逻辑必须有单元测试
2. **集成测试**：每个接口都要用 Postman 测试
3. **端到端测试**：每个 Sprint 结束后运行完整流程测试

---

### 4. 风险控制

#### 常见风险

1. **AI 生成的代码有误**
   - 解决方案：仔细阅读生成的代码，运行测试
   - 验证：每个任务都有明确的验收标准

2. **依赖环境问题**
   - 解决方案：Sprint 0 完成环境搭建，确保环境可用
   - 验证：运行健康检查接口

3. **第三方 API 调用失败**
   - 解决方案：使用 Mock 数据进行开发
   - 验证：集成测试时使用真实 API

---

## 📊 进度跟踪

### 进度看板

| Sprint | 状态 | 进度 | 备注 |
|--------|------|------|------|
| Sprint 0 | 🟡 待开始 | 0% | |
| Sprint 1 | ⚪ 未开始 | 0% | |
| Sprint 2 | ⚪ 未开始 | 0% | |
| Sprint 3 | ⚪ 未开始 | 0% | |
| Sprint 4 | ⚪ 未开始 | 0% | |
| Sprint 5 | ⚪ 未开始 | 0% | |
| Sprint 6 | ⚪ 未开始 | 0% | |
| Sprint 7 | ⚪ 未开始 | 0% | |
| Sprint 8 | ⚪ 未开始 | 0% | |

### 每日站会问题

1. 昨天完成了哪些任务?
2. 今天计划完成哪些任务?
3. 遇到了哪些阻碍?

---

## 🎉 总结

这份 AI 辅助敏捷开发计划的核心优势：

1. **详细的提示词**：每个任务都有完整的 AI 提示词，直接复制即可使用
2. **明确的验收标准**：每个任务都有清晰的完成标准
3. **垂直切片**：每个 Sprint 都能独立运行和测试
4. **测试驱动**：每个功能都有单元测试和集成测试

**预期效果**：
- 开发效率提升 **80-90%**
- 代码质量显著改善
- Bug 修复速度提升 **10x**
- 团队协作效率提升 **50%**

祝开发顺利! 🚀
