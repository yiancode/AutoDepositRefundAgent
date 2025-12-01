# FastAuth 接入方案与知识星球会员服务设计

> 本文档为 AutoDepositRefundAgent v1 版本的用户认证方案设计，包含 FastAuth 集成和知识星球会员服务设计。

## 一、方案概述

为训练营押金退款系统设计完整的用户认证方案：

1. **FastAuth 集成**：实现微信公众号 OAuth 登录
2. **知识星球会员服务**：独立服务验证星球会员身份
3. **用户体系整合**：将 OAuth 用户与星球会员关联

---

## 二、知识星球会员服务（zsxq-member-service）

### 2.1 服务定位

```
┌─────────────────────────────────────────────────────────────┐
│                   zsxq-member-service                       │
│  职责：定时同步知识星球会员数据，提供会员身份验证接口         │
├─────────────────────────────────────────────────────────────┤
│  输入：知识星球 Cookie/Token（管理员配置）                   │
│  输出：会员列表、会员验证接口                                │
│  存储：本地数据库（与业务系统隔离）                          │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 技术架构

```
zsxq-member-service/
├── src/main/java/com/yiancode/zsxq/
│   ├── ZsxqMemberServiceApplication.java
│   ├── config/
│   │   ├── ZsxqApiConfig.java          # 星球API配置
│   │   └── ScheduleConfig.java         # 定时任务配置
│   ├── entity/
│   │   ├── PlanetMember.java           # 星球会员实体
│   │   └── SyncLog.java                # 同步日志
│   ├── mapper/
│   │   ├── PlanetMemberMapper.java
│   │   └── SyncLogMapper.java
│   ├── service/
│   │   ├── ZsxqApiService.java         # 星球API调用（核心）
│   │   ├── MemberSyncService.java      # 会员同步服务
│   │   └── MemberVerifyService.java    # 会员验证服务
│   ├── controller/
│   │   ├── MemberController.java       # 会员查询接口
│   │   └── AdminController.java        # 管理接口
│   ├── job/
│   │   └── MemberSyncJob.java          # 定时同步任务
│   └── dto/
│       ├── MemberDTO.java
│       └── VerifyRequest.java
└── src/main/resources/
    ├── application.yml
    └── mapper/*.xml
```

### 2.3 核心数据表设计

```sql
-- 星球会员表
CREATE TABLE planet_member (
    id              BIGSERIAL PRIMARY KEY,
    planet_id       VARCHAR(32) NOT NULL,           -- 星球ID
    user_id         VARCHAR(32) NOT NULL,           -- 星球用户ID
    user_number     INT,                            -- 星球编号
    nickname        VARCHAR(100),                   -- 昵称
    avatar_url      VARCHAR(500),                   -- 头像
    joined_at       TIMESTAMP,                      -- 加入时间
    role            VARCHAR(20) DEFAULT 'member',   -- 角色：owner/admin/member
    status          VARCHAR(20) DEFAULT 'active',   -- 状态
    raw_data        JSONB,                          -- 原始数据
    synced_at       TIMESTAMP DEFAULT NOW(),        -- 同步时间
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(planet_id, user_id)
);

-- 同步日志表
CREATE TABLE sync_log (
    id              BIGSERIAL PRIMARY KEY,
    planet_id       VARCHAR(32) NOT NULL,
    sync_type       VARCHAR(20),                    -- full/incremental
    member_count    INT DEFAULT 0,
    status          VARCHAR(20),                    -- success/failed
    error_message   TEXT,
    started_at      TIMESTAMP,
    finished_at     TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_member_planet_user ON planet_member(planet_id, user_id);
CREATE INDEX idx_member_number ON planet_member(planet_id, user_number);
CREATE INDEX idx_member_nickname ON planet_member(planet_id, nickname);
```

### 2.4 核心 API 设计

```yaml
# 1. 会员验证接口
POST /api/v1/members/verify
Request:
  {
    "planetId": "28855511455142",
    "identifier": "12345",          # 星球编号或昵称
    "identifierType": "number"      # number/nickname/userId
  }
Response:
  {
    "success": true,
    "data": {
      "verified": true,
      "member": {
        "userId": "454511121545",
        "userNumber": 12345,
        "nickname": "张三",
        "avatarUrl": "https://...",
        "joinedAt": "2024-01-15T10:30:00Z",
        "role": "member"
      }
    }
  }

# 2. 批量查询会员
POST /api/v1/members/batch-query
Request:
  {
    "planetId": "28855511455142",
    "identifiers": ["12345", "12346", "12347"],
    "identifierType": "number"
  }

# 3. 搜索会员（模糊查询）
GET /api/v1/members/search?planetId=xxx&keyword=张三&page=1&size=20

# 4. 手动触发同步（管理接口）
POST /api/v1/admin/sync
Request:
  {
    "planetId": "28855511455142",
    "syncType": "full"              # full/incremental
  }

# 5. 同步状态查询
GET /api/v1/admin/sync/status?planetId=xxx
```

### 2.5 定时同步策略

```java
@Component
public class MemberSyncJob {

    // 每天凌晨 2 点全量同步
    @Scheduled(cron = "0 0 2 * * ?")
    public void fullSync() {
        // 全量拉取所有会员
    }

    // 每小时增量同步（新加入的会员）
    @Scheduled(cron = "0 0 * * * ?")
    public void incrementalSync() {
        // 只同步最近加入的会员
    }
}
```

### 2.6 风控措施

```yaml
# 防止被知识星球封禁的措施
rate-limit:
  requests-per-minute: 10           # 每分钟最多10次请求
  requests-per-day: 500             # 每天最多500次请求

retry:
  max-attempts: 3                   # 最大重试次数
  delay-seconds: 60                 # 重试间隔

alert:
  on-failure: true                  # 失败时告警
  channels: ["wechat", "email"]     # 告警渠道
```

---

## 三、FastAuth 接入方案（Spring Boot v1）

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                        用户访问流程                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   用户 ──→ 前端(Vue) ──→ 后端(Spring Boot) ──→ 数据库               │
│              │                  │                                    │
│              │                  ├──→ FastAuth (微信OAuth)            │
│              │                  │        ↓                           │
│              │                  │    微信公众平台                     │
│              │                  │                                    │
│              │                  └──→ zsxq-member-service             │
│              │                           ↓                           │
│              │                      知识星球API                       │
│              │                                                       │
│              └──→ 登录成功后，前端存储 JWT Token                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Maven 依赖配置

```xml
<!-- pom.xml -->
<dependencies>
    <!-- FastAuth 核心依赖 -->
    <dependency>
        <groupId>com.yiancode</groupId>
        <artifactId>fastauth</artifactId>
        <version>1.0.0</version>
    </dependency>

    <!-- HTTP 实现 -->
    <dependency>
        <groupId>cn.hutool</groupId>
        <artifactId>hutool-http</artifactId>
        <version>5.8.25</version>
    </dependency>

    <!-- Spring Security -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>

    <!-- JWT -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.12.3</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.12.3</version>
        <scope>runtime</scope>
    </dependency>

    <!-- Redis（用于 State 缓存） -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>
</dependencies>
```

### 3.3 配置文件

```yaml
# application.yml
fastauth:
  # 微信公众号配置
  wechat-mp:
    client-id: ${WECHAT_MP_APP_ID}
    client-secret: ${WECHAT_MP_APP_SECRET}
    redirect-uri: https://your-domain.com/api/auth/callback/wechat-mp

# JWT 配置
jwt:
  secret: ${JWT_SECRET}
  expiration: 86400000  # 24小时

# 知识星球会员服务
zsxq-member-service:
  base-url: http://localhost:8081
  api-key: ${ZSXQ_SERVICE_API_KEY}
```

### 3.4 核心代码实现

#### 3.4.1 FastAuth 配置类

```java
@Configuration
public class FastAuthConfig {

    @Value("${fastauth.wechat-mp.client-id}")
    private String wechatMpClientId;

    @Value("${fastauth.wechat-mp.client-secret}")
    private String wechatMpClientSecret;

    @Value("${fastauth.wechat-mp.redirect-uri}")
    private String wechatMpRedirectUri;

    @Bean
    public AuthStateCache authStateCache(StringRedisTemplate redisTemplate) {
        // 使用 Redis 存储 State，支持分布式部署
        return new RedisAuthStateCache(redisTemplate);
    }

    @Bean("wechatMpAuthRequest")
    public AuthRequest wechatMpAuthRequest(AuthStateCache authStateCache) {
        return new AuthWeChatMpRequest(
            AuthConfig.builder()
                .clientId(wechatMpClientId)
                .clientSecret(wechatMpClientSecret)
                .redirectUri(wechatMpRedirectUri)
                .build(),
            authStateCache
        );
    }
}
```

#### 3.4.2 Redis State 缓存实现

```java
public class RedisAuthStateCache implements AuthStateCache {

    private final StringRedisTemplate redisTemplate;
    private static final String KEY_PREFIX = "fastauth:state:";
    private static final long DEFAULT_TIMEOUT = 180; // 3分钟

    public RedisAuthStateCache(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void cache(String key, String value) {
        redisTemplate.opsForValue().set(
            KEY_PREFIX + key,
            value,
            DEFAULT_TIMEOUT,
            TimeUnit.SECONDS
        );
    }

    @Override
    public void cache(String key, String value, long timeout) {
        redisTemplate.opsForValue().set(
            KEY_PREFIX + key,
            value,
            timeout,
            TimeUnit.MILLISECONDS
        );
    }

    @Override
    public String get(String key) {
        return redisTemplate.opsForValue().get(KEY_PREFIX + key);
    }

    @Override
    public boolean containsKey(String key) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(KEY_PREFIX + key));
    }
}
```

#### 3.4.3 认证控制器

```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthRequest wechatMpAuthRequest;
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final ZsxqMemberClient zsxqMemberClient;

    /**
     * 获取微信公众号授权地址
     */
    @GetMapping("/authorize")
    public Result<String> authorize(
            @RequestParam(required = false) String returnUrl) {

        String state = AuthStateUtils.createState();

        // 如果有 returnUrl，编码到 state 中
        if (StringUtils.hasText(returnUrl)) {
            state = state + "|" + Base64.encode(returnUrl);
        }

        String authorizeUrl = wechatMpAuthRequest.authorize(state);
        return Result.success(authorizeUrl);
    }

    /**
     * 微信公众号 OAuth 回调处理
     */
    @GetMapping("/callback/wechat-mp")
    public void callback(AuthCallback callback, HttpServletResponse response) throws IOException {

        AuthResponse<AuthUser> authResponse = wechatMpAuthRequest.login(callback);

        if (!authResponse.ok()) {
            response.sendRedirect("/login?error=" + authResponse.getMsg());
            return;
        }

        AuthUser authUser = authResponse.getData();

        // 1. 查找或创建本地用户
        SystemUser user = userService.findOrCreateByOAuth(authUser, "wechat-mp");

        // 2. 生成 JWT Token
        String token = jwtTokenProvider.generateToken(user);

        // 3. 解析 returnUrl
        String returnUrl = parseReturnUrl(callback.getState());

        // 4. 重定向到前端，带上 token
        String redirectUrl = StringUtils.hasText(returnUrl)
            ? returnUrl + "?token=" + token
            : "/dashboard?token=" + token;

        response.sendRedirect(redirectUrl);
    }

    /**
     * 绑定知识星球账号
     */
    @PostMapping("/bindPlanet")
    @PreAuthorize("isAuthenticated()")
    public Result<Void> bindPlanetAccount(
            @RequestBody BindPlanetRequest request,
            @AuthenticationPrincipal SystemUser currentUser) {

        // 1. 调用 zsxq-member-service 验证会员身份
        MemberVerifyResponse verifyResponse = zsxqMemberClient.verify(
            request.getPlanetId(),
            request.getIdentifier(),
            request.getIdentifierType()
        );

        if (!verifyResponse.isVerified()) {
            return Result.fail("未找到该知识星球会员");
        }

        // 2. 绑定到当前用户
        userService.bindPlanetMember(currentUser.getId(), verifyResponse.getMember());

        return Result.success();
    }

    private String parseReturnUrl(String state) {
        if (state != null && state.contains("|")) {
            String[] parts = state.split("\\|", 2);
            return Base64.decode(parts[1]);
        }
        return null;
    }
}
```

#### 3.4.4 用户服务

```java
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final SystemUserMapper userMapper;
    private final UserOAuthMapper oauthMapper;
    private final UserPlanetBindingMapper bindingMapper;

    @Override
    @Transactional
    public SystemUser findOrCreateByOAuth(AuthUser authUser, String platform) {
        // 1. 查找是否已有绑定
        UserOAuth oauth = oauthMapper.findByPlatformAndUuid(
            platform,
            authUser.getUuid()
        );

        if (oauth != null) {
            // 已绑定，更新信息并返回用户
            oauth.setNickname(authUser.getNickname());
            oauth.setAvatar(authUser.getAvatar());
            oauth.setAccessToken(authUser.getToken().getAccessToken());
            oauth.setUpdatedAt(LocalDateTime.now());
            oauthMapper.updateById(oauth);

            return userMapper.selectById(oauth.getUserId());
        }

        // 2. 创建新用户
        SystemUser user = new SystemUser();
        user.setNickname(authUser.getNickname());
        user.setAvatar(authUser.getAvatar());
        user.setStatus("active");
        user.setCreatedAt(LocalDateTime.now());
        userMapper.insert(user);

        // 3. 创建 OAuth 绑定
        UserOAuth newOAuth = new UserOAuth();
        newOAuth.setUserId(user.getId());
        newOAuth.setPlatform(platform);
        newOAuth.setUuid(authUser.getUuid());
        newOAuth.setOpenId(authUser.getToken().getOpenId());
        newOAuth.setUnionId(authUser.getToken().getUnionId());
        newOAuth.setNickname(authUser.getNickname());
        newOAuth.setAvatar(authUser.getAvatar());
        newOAuth.setAccessToken(authUser.getToken().getAccessToken());
        newOAuth.setCreatedAt(LocalDateTime.now());
        oauthMapper.insert(newOAuth);

        return user;
    }

    @Override
    @Transactional
    public void bindPlanetMember(Long userId, PlanetMember member) {
        // 检查是否已绑定
        UserPlanetBinding existing = bindingMapper.findByUserIdAndPlanetId(
            userId,
            member.getPlanetId()
        );

        if (existing != null) {
            throw new BusinessException("该星球账号已绑定");
        }

        // 创建绑定关系
        UserPlanetBinding binding = new UserPlanetBinding();
        binding.setUserId(userId);
        binding.setPlanetId(member.getPlanetId());
        binding.setPlanetUserId(member.getUserId());
        binding.setPlanetUserNumber(member.getUserNumber());
        binding.setPlanetNickname(member.getNickname());
        binding.setCreatedAt(LocalDateTime.now());
        bindingMapper.insert(binding);
    }
}
```

### 3.5 数据库表设计（用户相关）

```sql
-- 系统用户表
CREATE TABLE system_user (
    id              BIGSERIAL PRIMARY KEY,
    nickname        VARCHAR(100),
    avatar          VARCHAR(500),
    phone           VARCHAR(20),
    email           VARCHAR(100),
    status          VARCHAR(20) DEFAULT 'active',
    role            VARCHAR(20) DEFAULT 'user',      -- user/admin/super_admin
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- OAuth 绑定表（支持多平台扩展）
CREATE TABLE user_oauth (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES system_user(id),
    platform        VARCHAR(30) NOT NULL,            -- wechat-mp
    uuid            VARCHAR(100) NOT NULL,           -- 平台唯一标识
    open_id         VARCHAR(100),                    -- 微信 openId
    union_id        VARCHAR(100),                    -- 微信 unionId
    nickname        VARCHAR(100),
    avatar          VARCHAR(500),
    access_token    VARCHAR(500),
    refresh_token   VARCHAR(500),
    expires_at      TIMESTAMP,
    raw_data        JSONB,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(platform, uuid)
);

-- 用户-星球绑定表
CREATE TABLE user_planet_binding (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES system_user(id),
    planet_id           VARCHAR(32) NOT NULL,
    planet_user_id      VARCHAR(32) NOT NULL,
    planet_user_number  INT,
    planet_nickname     VARCHAR(100),
    verified            BOOLEAN DEFAULT false,
    created_at          TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, planet_id)
);

CREATE INDEX idx_oauth_user ON user_oauth(user_id);
CREATE INDEX idx_oauth_platform_uuid ON user_oauth(platform, uuid);
CREATE INDEX idx_binding_user ON user_planet_binding(user_id);
CREATE INDEX idx_binding_planet_user ON user_planet_binding(planet_id, planet_user_id);
```

### 3.6 前端集成（Vue 3）

```javascript
// src/api/auth.js
import request from '@/utils/request'

export const authApi = {
  // 获取微信公众号授权地址
  getAuthorizeUrl(returnUrl) {
    return request.get('/api/auth/authorize', {
      params: { returnUrl }
    })
  },

  // 绑定知识星球
  bindPlanet(data) {
    return request.post('/api/auth/bindPlanet', data)
  },

  // 获取当前用户信息
  getCurrentUser() {
    return request.get('/api/auth/me')
  }
}
```

```vue
<!-- src/views/Login.vue -->
<template>
  <div class="login-page">
    <h1>登录</h1>
    <el-button @click="loginWithWechat" type="success" size="large">
      微信公众号登录
    </el-button>
  </div>
</template>

<script setup>
import { authApi } from '@/api/auth'

const loginWithWechat = async () => {
  const returnUrl = window.location.origin + '/auth/callback'
  const { data: authorizeUrl } = await authApi.getAuthorizeUrl(returnUrl)
  window.location.href = authorizeUrl
}
</script>
```

```vue
<!-- src/views/AuthCallback.vue -->
<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

onMounted(async () => {
  const token = route.query.token
  if (token) {
    userStore.setToken(token)
    await userStore.fetchCurrentUser()
    router.push('/dashboard')
  } else {
    router.push('/login?error=' + (route.query.error || '登录失败'))
  }
})
</script>
```

---

## 四、完整业务流程

### 4.1 用户登录 + 星球绑定流程

```
┌─────────────────────────────────────────────────────────────────────┐
│                         完整用户流程                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. 用户访问系统                                                     │
│         │                                                            │
│         ▼                                                            │
│  2. 点击"微信登录"                                                   │
│         │                                                            │
│         ▼                                                            │
│  3. 跳转微信授权页（FastAuth 生成 URL）                              │
│         │                                                            │
│         ▼                                                            │
│  4. 用户微信授权                                                     │
│         │                                                            │
│         ▼                                                            │
│  5. 回调处理，创建/更新用户，生成 JWT                                │
│         │                                                            │
│         ▼                                                            │
│  6. 返回前端，存储 Token                                             │
│         │                                                            │
│         ▼                                                            │
│  7. 用户进入"绑定知识星球"页面                                        │
│         │                                                            │
│         ▼                                                            │
│  8. 输入星球编号或昵称                                               │
│         │                                                            │
│         ▼                                                            │
│  9. 调用 zsxq-member-service 验证                                    │
│         │                                                            │
│         ▼                                                            │
│  10. 验证通过，绑定关系写入数据库                                    │
│         │                                                            │
│         ▼                                                            │
│  11. 用户可以使用训练营相关功能                                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 训练营退款流程（结合用户身份）

```
┌─────────────────────────────────────────────────────────────────────┐
│                      退款审核流程                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. 管理员登录系统（微信 OAuth）                                     │
│         │                                                            │
│         ▼                                                            │
│  2. 进入"训练营管理"                                                 │
│         │                                                            │
│         ▼                                                            │
│  3. 选择训练营，点击"计算退款"                                       │
│         │                                                            │
│         ├──→ 4a. 调用 zsxq-member-service 获取打卡数据               │
│         │         │                                                  │
│         │         ▼                                                  │
│         │    4b. 匹配会员 → 支付记录 → 打卡记录                      │
│         │         │                                                  │
│         │         ▼                                                  │
│         │    4c. 计算每人应退金额                                    │
│         │                                                            │
│         ▼                                                            │
│  5. 显示退款名单，管理员审核                                         │
│         │                                                            │
│         ▼                                                            │
│  6. 确认后，生成微信批量退款 CSV                                     │
│         │                                                            │
│         ▼                                                            │
│  7. 导出 CSV，上传微信支付后台执行退款                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 五、部署架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                          生产环境部署                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Nginx (SSL + 反向代理)                                             │
│       │                                                              │
│       ├──→ /api/*  ──→  后端服务 (Spring Boot :8080)                │
│       │                      │                                       │
│       │                      ├──→ PostgreSQL                         │
│       │                      ├──→ Redis                              │
│       │                      └──→ zsxq-member-service (:8081)        │
│       │                                  │                           │
│       │                                  └──→ PostgreSQL (独立库)    │
│       │                                                              │
│       └──→ /*  ──→  前端静态文件 (Vue 3 build)                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 六、实施步骤

### 第一阶段：zsxq-member-service
- 创建独立 Spring Boot 项目
- 实现星球 API 调用和数据同步
- 部署并验证

### 第二阶段：FastAuth 集成
- 在主项目中添加 FastAuth 依赖
- 实现 OAuth 登录流程
- 配置微信公众号应用

### 第三阶段：用户体系整合
- 实现用户-星球绑定功能
- 完善权限控制
- 前端登录页面开发

### 第四阶段：业务流程对接
- 退款流程与用户身份关联
- 管理后台权限控制
- 完整测试
