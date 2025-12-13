# Story 2.2: 微信公众号 OAuth 集成

**Status**: ready-for-dev

---

## Story

**作为**一名会员，
**我希望**通过微信公众号授权登录 H5 应用，
**以便于**系统识别我的微信身份，后续支付和退款能够准确关联到我的账号。

---

## 验收标准

### AC-1: 触发授权流程
```gherkin
Feature: 微信公众号 OAuth 授权
  Scenario: 用户点击报名触发授权
    Given 用户在训练营详情页
    And 用户未登录 (localStorage 无有效 JWT)
    When 用户点击 "立即报名" 按钮
    Then 前端检测到未登录状态
    And 调用 GET /api/auth/authorize?returnUrl={当前页URL}
    And 后端返回微信授权 URL
    And 前端跳转到微信授权页面
```

### AC-2: 静默授权
```gherkin
  Scenario: 微信静默授权 (snsapi_base)
    Given 用户在微信内置浏览器中
    When 跳转到微信授权页面
    Then 微信自动完成静默授权 (无需用户点击确认)
    And 微信重定向到系统回调地址
    And 回调 URL 包含 code 和 state 参数
```

### AC-3: 回调处理与 Token 生成
```gherkin
  Scenario: OAuth 回调处理
    Given 微信回调携带有效 code
    When 系统接收到 GET /api/auth/callback/wechat-mp?code=xxx&state=xxx
    Then 系统用 code 换取 access_token 和 openid
    And 查询或创建 wechat_user 记录
    And 生成 JWT Token (有效期 30 天)
    And 重定向到原始 returnUrl 并附带 token 参数
```

### AC-4: 前端 Token 处理
```gherkin
  Scenario: 前端处理登录态
    Given 用户从 OAuth 回调重定向回来
    And URL 包含 token 参数
    When 前端检测到 token 参数
    Then 保存 token 到 localStorage
    And 清除 URL 中的 token 参数 (history.replaceState)
    And 显示登录成功提示
    And 继续原本的报名流程
```

### AC-5: 已登录状态
```gherkin
  Scenario: 已登录用户跳过授权
    Given 用户 localStorage 中有有效 JWT Token
    When 用户点击 "立即报名"
    Then 直接进入报名流程
    And 不触发 OAuth 授权
```

### AC-6: returnUrl 安全验证
```gherkin
  Scenario: returnUrl 白名单校验
    Given 攻击者构造恶意 returnUrl
    When 调用 GET /api/auth/authorize?returnUrl=https://evil.com
    Then 后端返回 400 错误
    And 错误信息为 "非法的重定向地址"
    And 不生成授权 URL
```

### AC-7: State 防 CSRF
```gherkin
  Scenario: State 参数校验
    Given 攻击者伪造回调请求
    When 回调 state 参数与 Redis 中存储不匹配
    Then 系统拒绝处理回调
    And 返回 400 错误 "state 无效或已过期"
```

### AC-8: Token 过期处理
```gherkin
  Scenario: JWT Token 过期
    Given 用户 JWT Token 已过期 (超过 30 天)
    When 用户尝试访问需要认证的接口
    Then 后端返回 401 Unauthorized
    And 前端清除本地 Token
    And 重新触发 OAuth 授权流程
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - 微信 OAuth Manager 封装** (AC: #2, #3)
  - [ ] 1.1 创建 `WechatOAuthManager.java` - 微信 API 调用封装
  - [ ] 1.2 实现 `buildAuthorizeUrl()` - 构建授权 URL (snsapi_base)
  - [ ] 1.3 实现 `getAccessToken(code)` - 用 code 换取 access_token
  - [ ] 1.4 实现 `getUserInfo(accessToken, openid)` - 获取用户信息 (可选, snsapi_userinfo 时使用)
  - [ ] 1.5 配置微信公众号参数 (application.yml)
    - `wechat.mp.app-id`
    - `wechat.mp.app-secret`
    - `wechat.mp.oauth-callback-url`
  - [ ] 1.6 编写单元测试 - Mock 微信 API 响应

- [ ] **Task 2: 后端 - OAuth Service 业务逻辑** (AC: #3, #6, #7)
  - [ ] 2.1 创建 `WechatOAuthService.java` - 业务逻辑
  - [ ] 2.2 实现 `generateAuthorizeUrl(returnUrl)`:
    - 验证 returnUrl 是否在白名单
    - 生成随机 state
    - 将 returnUrl + state 存入 Redis (5 分钟过期)
    - 返回微信授权 URL
  - [ ] 2.3 实现 `handleCallback(code, state)`:
    - 从 Redis 读取并删除 state 对应的 returnUrl
    - 调用微信 API 换取 openid
    - 查询或创建 wechat_user 记录
    - 生成 JWT Token
    - 返回重定向目标 URL
  - [ ] 2.4 实现 returnUrl 白名单校验逻辑
  - [ ] 2.5 编写单元测试 - 覆盖正常流程和异常场景

- [ ] **Task 3: 后端 - Auth Controller 接口** (AC: #1, #3, #6, #7)
  - [ ] 3.1 创建 `AuthController.java`
  - [ ] 3.2 实现 `GET /api/auth/authorize` 接口:
    - 参数: `returnUrl` (可选)
    - 响应: `{ "code": 200, "data": { "authorize_url": "https://..." } }`
  - [ ] 3.3 实现 `GET /api/auth/callback/wechat-mp` 接口:
    - 参数: `code`, `state`
    - 响应: 302 重定向到 returnUrl?token=xxx
  - [ ] 3.4 添加接口文档注解 (Knife4j/Swagger)
  - [ ] 3.5 编写集成测试

- [ ] **Task 4: 后端 - JWT Token 服务** (AC: #3, #8)
  - [ ] 4.1 创建 `JwtTokenProvider.java` 或复用现有实现
  - [ ] 4.2 实现 `generateToken(wechatUser)`:
    - Payload: `{ wechatUserId, openid, exp }`
    - 算法: HS256
    - 有效期: 30 天
  - [ ] 4.3 实现 `validateToken(token)` - 验证并解析 Token
  - [ ] 4.4 实现 `parseUserId(token)` - 提取用户 ID
  - [ ] 4.5 配置 JWT 密钥 (环境变量)
  - [ ] 4.6 编写单元测试

- [ ] **Task 5: 后端 - WechatUser 数据访问** (AC: #3)
  - [ ] 5.1 创建 `WechatUser.java` 实体类 (如未创建)
  - [ ] 5.2 创建 `WechatUserMapper.java`
  - [ ] 5.3 实现 `findByOpenid(openid)` 查询方法
  - [ ] 5.4 实现创建用户逻辑 (首次授权)
  - [ ] 5.5 编写 Mapper 测试

- [ ] **Task 6: 后端 - Redis State 缓存** (AC: #6, #7)
  - [ ] 6.1 设计 Redis Key 结构:
    - `auth:state:{state}` -> JSON `{ returnUrl, createdAt }`
    - `auth:return_url:{uuid}` -> returnUrl 原始值
  - [ ] 6.2 实现存储方法 (TTL: 5 分钟)
  - [ ] 6.3 实现读取并删除方法 (一次性使用)
  - [ ] 6.4 编写缓存测试

- [ ] **Task 7: 前端 - 登录状态管理** (AC: #4, #5, #8)
  - [ ] 7.1 创建 `src/stores/auth.ts` - Pinia 认证 Store
  - [ ] 7.2 实现 `isLoggedIn` getter - 检查 Token 是否存在且未过期
  - [ ] 7.3 实现 `login(token)` action - 保存 Token 到 localStorage
  - [ ] 7.4 实现 `logout()` action - 清除 Token
  - [ ] 7.5 实现 `checkTokenExpiry()` - 解析 JWT 检查过期时间
  - [ ] 7.6 编写 Store 单元测试

- [ ] **Task 8: 前端 - OAuth 流程触发** (AC: #1, #4)
  - [ ] 8.1 创建 `src/utils/auth.ts` - 认证工具函数
  - [ ] 8.2 实现 `triggerOAuth(returnUrl)`:
    - 调用 GET /api/auth/authorize
    - 跳转到返回的授权 URL
  - [ ] 8.3 实现 `handleOAuthCallback()`:
    - 检测 URL 中的 token 参数
    - 保存到 Store
    - 清除 URL 参数
  - [ ] 8.4 在 `App.vue` 或路由守卫中调用 `handleOAuthCallback()`

- [ ] **Task 9: 前端 - 路由守卫** (AC: #1, #5)
  - [ ] 9.1 创建 `src/router/guards.ts` - 路由守卫
  - [ ] 9.2 实现 `authGuard` - 需要登录的页面守卫:
    - 检查 Token 是否存在
    - 未登录则触发 OAuth
  - [ ] 9.3 配置需要认证的路由 (报名确认页、支付页等)
  - [ ] 9.4 编写路由守卫测试

- [ ] **Task 10: 前端 - Axios 拦截器** (AC: #8)
  - [ ] 10.1 修改 `src/utils/request.ts`:
    - 请求拦截器: 自动添加 `Authorization: Bearer {token}` Header
    - 响应拦截器: 401 时清除 Token 并触发重新登录
  - [ ] 10.2 编写拦截器测试

- [ ] **Task 11: 后端 - 安全配置** (AC: #6)
  - [ ] 11.1 配置 returnUrl 白名单 (application.yml):
    ```yaml
    app:
      security:
        oauth:
          redirect-urls-whitelist:
            - localhost
            - h5.example.com
          allow-localhost: true  # 仅开发环境
          require-https: true    # 生产环境
    ```
  - [ ] 11.2 创建 `OAuthSecurityProperties.java` 配置类
  - [ ] 11.3 编写白名单校验单元测试

- [ ] **Task 12: 集成测试与验收** (AC: #全部)
  - [ ] 12.1 编写完整 OAuth 流程集成测试
  - [ ] 12.2 使用微信开发者工具测试授权流程
  - [ ] 12.3 验证 returnUrl 白名单拦截
  - [ ] 12.4 验证 State 防 CSRF 机制
  - [ ] 12.5 验证 Token 过期处理

---

## Dev Notes

### 认证架构概述

本故事实现 **H5 主路径认证**，基于微信公众号 OAuth 2.0 (snsapi_base 静默授权)。

```
用户点击报名 → 前端检测未登录 → 调用 /api/auth/authorize
     ↓
后端生成授权 URL → 前端跳转微信授权页
     ↓
微信静默授权 → 回调 /api/auth/callback/wechat-mp
     ↓
后端换取 openid → 创建/更新 wechat_user → 生成 JWT
     ↓
重定向回前端 + token → 前端保存 Token → 继续报名流程
```

### 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 授权范围 | snsapi_base | 静默授权，用户无感知，仅获取 openid |
| Token 类型 | JWT (HS256) | 无状态验证，减少 Redis 查询 |
| Token 有效期 | 30 天 | 覆盖训练营周期，减少重复授权 |
| State 存储 | Redis | 支持集群，自动过期 |
| returnUrl 传递 | Redis 存储 + UUID 引用 | 避免 URL 过长，防止篡改 |

### 微信公众号配置

**开发前准备**:
1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 设置 → 公众号设置 → 功能设置 → 网页授权域名
3. 添加域名: `h5.example.com` (需上传验证文件)
4. 获取 AppID 和 AppSecret

**环境变量配置**:
```bash
# 微信公众号
WECHAT_MP_APPID=wx1234567890abcdef
WECHAT_MP_SECRET=your_app_secret_here
WECHAT_MP_OAUTH_CALLBACK_URL=https://api.example.com/api/auth/callback/wechat-mp
```

### API 接口规范

#### 1. 获取授权地址

**请求**:
```
GET /api/auth/authorize?returnUrl=https://h5.example.com/camps/1
```

**响应成功**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "authorize_url": "https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx123&redirect_uri=...&scope=snsapi_base&state=abc123|uuid456"
  },
  "timestamp": 1730000000
}
```

**响应失败 (returnUrl 非法)**:
```json
{
  "code": 400,
  "message": "非法的重定向地址",
  "data": null,
  "timestamp": 1730000000
}
```

#### 2. OAuth 回调

**请求**:
```
GET /api/auth/callback/wechat-mp?code=0xxxxx&state=abc123|uuid456
```

**响应**: HTTP 302 重定向
```
Location: https://h5.example.com/camps/1?token=eyJhbGciOiJIUzI1NiJ9...
```

### 代码实现参考

#### WechatOAuthManager.java

```java
@Component
@RequiredArgsConstructor
public class WechatOAuthManager {

    @Value("${wechat.mp.app-id}")
    private String appId;

    @Value("${wechat.mp.app-secret}")
    private String appSecret;

    @Value("${wechat.mp.oauth-callback-url}")
    private String callbackUrl;

    private final RestTemplate restTemplate;

    /**
     * 构建微信授权 URL (snsapi_base)
     */
    public String buildAuthorizeUrl(String state) {
        return UriComponentsBuilder
            .fromHttpUrl("https://open.weixin.qq.com/connect/oauth2/authorize")
            .queryParam("appid", appId)
            .queryParam("redirect_uri", URLEncoder.encode(callbackUrl, StandardCharsets.UTF_8))
            .queryParam("response_type", "code")
            .queryParam("scope", "snsapi_base")
            .queryParam("state", state)
            .fragment("wechat_redirect")
            .toUriString();
    }

    /**
     * 用 code 换取 access_token 和 openid
     */
    public WechatOAuthResult getAccessToken(String code) {
        String url = UriComponentsBuilder
            .fromHttpUrl("https://api.weixin.qq.com/sns/oauth2/access_token")
            .queryParam("appid", appId)
            .queryParam("secret", appSecret)
            .queryParam("code", code)
            .queryParam("grant_type", "authorization_code")
            .toUriString();

        ResponseEntity<WechatOAuthResult> response = restTemplate.getForEntity(url, WechatOAuthResult.class);
        WechatOAuthResult result = response.getBody();

        if (result == null || result.getErrcode() != null) {
            throw new BusinessException("微信授权失败: " + (result != null ? result.getErrmsg() : "响应为空"));
        }

        return result;
    }
}

@Data
public class WechatOAuthResult {
    @JsonProperty("access_token")
    private String accessToken;

    @JsonProperty("expires_in")
    private Integer expiresIn;

    @JsonProperty("refresh_token")
    private String refreshToken;

    private String openid;

    private String scope;

    private Integer errcode;

    private String errmsg;
}
```

#### returnUrl 白名单校验

```java
@Component
@RequiredArgsConstructor
public class ReturnUrlValidator {

    private final OAuthSecurityProperties securityProperties;

    public boolean isAllowed(String returnUrl) {
        if (!StringUtils.hasText(returnUrl)) {
            return true; // 无 returnUrl 时使用默认值
        }

        try {
            URI uri = new URI(returnUrl);
            String host = uri.getHost();
            String scheme = uri.getScheme();

            // 生产环境强制 HTTPS
            if (securityProperties.isRequireHttps() && !"https".equals(scheme)) {
                if (!securityProperties.isAllowLocalhost() || !"localhost".equals(host)) {
                    return false;
                }
            }

            // 白名单校验
            for (String pattern : securityProperties.getRedirectUrlsWhitelist()) {
                if (pattern.startsWith("*.") && host.endsWith(pattern.substring(1))) {
                    return true; // 通配符匹配
                }
                if (host.equals(pattern)) {
                    return true; // 精确匹配
                }
            }
        } catch (URISyntaxException e) {
            return false;
        }

        return false;
    }
}
```

#### 前端 Auth Store

```typescript
// src/stores/auth.ts
import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode'

interface JwtPayload {
  wechatUserId: number
  openid: string
  exp: number
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null
  }),

  getters: {
    isLoggedIn(): boolean {
      if (!this.token) return false
      try {
        const decoded = jwtDecode<JwtPayload>(this.token)
        return decoded.exp * 1000 > Date.now()
      } catch {
        return false
      }
    },

    wechatUserId(): number | null {
      if (!this.token) return null
      try {
        const decoded = jwtDecode<JwtPayload>(this.token)
        return decoded.wechatUserId
      } catch {
        return null
      }
    }
  },

  actions: {
    login(token: string) {
      this.token = token
      localStorage.setItem('token', token)
    },

    logout() {
      this.token = null
      localStorage.removeItem('token')
    },

    checkAndHandleCallback() {
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('token')
      if (token) {
        this.login(token)
        // 清除 URL 中的 token 参数
        urlParams.delete('token')
        const newUrl = urlParams.toString()
          ? `${window.location.pathname}?${urlParams.toString()}`
          : window.location.pathname
        window.history.replaceState({}, '', newUrl)
      }
    }
  }
})
```

### Redis Key 设计

| Key 模式 | TTL | 值 | 用途 |
|----------|-----|-----|------|
| `auth:state:{state}` | 300s | `{ "returnUrlId": "uuid" }` | State 验证 |
| `auth:return_url:{uuid}` | 300s | 原始 returnUrl | returnUrl 存储 |

### 安全检查清单

- [ ] returnUrl 白名单配置正确
- [ ] State 参数随机且一次性使用
- [ ] JWT 密钥足够复杂 (至少 32 字符)
- [ ] 生产环境强制 HTTPS
- [ ] CORS 配置正确
- [ ] 敏感配置使用环境变量

### 错误码

| 错误码 | HTTP | 含义 | 处理 |
|--------|------|------|------|
| 400 | 400 | 参数错误 | 检查 returnUrl 或 code |
| 400001 | 400 | 缺少 code 参数 | 检查微信回调 |
| 400002 | 400 | state 无效或已过期 | 重新发起授权 |
| 500001 | 500 | 微信接口调用失败 | 检查 AppID/Secret |

### 测试要点

**后端测试**:
1. `WechatOAuthServiceTest` - Mock 微信 API，测试正常和异常流程
2. `ReturnUrlValidatorTest` - 测试白名单各种场景
3. `JwtTokenProviderTest` - 测试 Token 生成和解析

**前端测试**:
1. `auth.store.spec.ts` - 测试登录态管理
2. `auth.utils.spec.ts` - 测试 OAuth 触发和回调处理

**集成测试**:
1. 使用微信开发者工具模拟授权流程
2. 测试 returnUrl 攻击场景
3. 测试 State 重放攻击

---

## 项目结构

### 后端新增文件

```
backend/src/main/java/com/camp/
├── controller/
│   └── auth/
│       └── AuthController.java          # OAuth 接口
├── service/
│   └── auth/
│       ├── WechatOAuthService.java      # OAuth 业务逻辑
│       └── JwtTokenProvider.java        # JWT 工具
├── manager/
│   └── WechatOAuthManager.java          # 微信 API 封装
├── config/
│   └── OAuthSecurityProperties.java     # 安全配置类
├── entity/
│   └── WechatUser.java                  # 微信用户实体
├── mapper/
│   └── WechatUserMapper.java            # 数据访问
└── dto/
    └── auth/
        ├── AuthorizeRequest.java
        └── WechatOAuthResult.java
```

### 前端新增文件

```
frontend/h5-member/src/
├── api/
│   └── auth.ts                          # 认证 API
├── stores/
│   └── auth.ts                          # 认证状态管理
├── utils/
│   └── auth.ts                          # 认证工具函数
├── router/
│   └── guards.ts                        # 路由守卫
└── types/
    └── auth.d.ts                        # 认证类型定义
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP01-S03 训练营 CRUD | 必须完成 | 数据库表结构 |
| EP02-S01 H5 前端骨架 | 必须完成 | 前端项目结构 |
| 微信公众号配置 | 必须完成 | AppID、网页授权域名 |

### 后续依赖

本故事完成后，以下功能可以开始:
- EP02-S03 训练营详情与报名确认
- EP02-S04 微信支付集成
- EP03-S01 星球身份绑定

---

## References

| 文档 | 路径 | 相关章节 |
|------|------|----------|
| PRD | `docs/PRD.md` | FR2.3 微信身份认证 |
| 技术方案 | `docs/v1/design/技术方案.md` | 5.1.0 用户报名流程, 5.7.4 接口认证 |
| API 文档 | `docs/v1/api/接口文档.md` | 十、认证管理接口 |
| OAuth 安全指南 | `docs/v1/security/OAuth安全指南.md` | returnUrl 白名单, State 防护 |
| 状态枚举 | `docs/v1/design/状态枚举定义.md` | accessToken 状态 |
| Epic 定义 | `docs/epics.md` | EP02-S02 |
| 前一故事 | `docs/sprint-artifacts/2-1-h5-camp-list.md` | 项目结构参考 |

---

## Dev Agent Record

### Context Reference
- Epic: EP02 会员报名与支付系统
- Story: EP02-S02 微信公众号 OAuth 集成
- FR Coverage: FR2.3

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
| Story 点数 | 5 |
| 优先级 | P0 |
| Epic | EP02 |
| 前置条件 | EP02-S01 完成 |
| 覆盖 FR | FR2.3 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |