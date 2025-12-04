# OAuth 安全指南

## 一、returnUrl 白名单管理

### 1.1 配置格式

```yaml
# application.yml
app:
  security:
    oauth:
      # returnUrl 白名单（支持精确匹配和通配符）
      redirect-urls-whitelist:
        # 开发环境
        - localhost
        - 127.0.0.1
        - 192.168.1.*

        # 测试环境
        - test-h5.example.com
        - staging-h5.example.com

        # 生产环境
        - h5.example.com
        - mobile.example.com
        - *.your-domain.com         # 支持通配符，匹配所有子域名

      # 正则表达式匹配（可选，更灵活）
      redirect-url-pattern: "^https://(h5|mobile|app)\\.(example|test)\\.com(/.*)?$"

      # 白名单策略
      allow-localhost: true          # 是否允许localhost（仅开发环境）
      require-https: true            # 是否强制HTTPS（生产环境必须）
```

### 1.2 配置属性类

```java
@Data
@Component
@ConfigurationProperties(prefix = "app.security.oauth")
public class OAuthSecurityProperties {

    /**
     * returnUrl 白名单列表
     * 支持精确匹配和通配符（*.example.com）
     */
    private List<String> redirectUrlsWhitelist = new ArrayList<>();

    /**
     * returnUrl 正则表达式匹配（可选）
     */
    private String redirectUrlPattern;

    /**
     * 是否允许 localhost（仅开发环境）
     */
    private boolean allowLocalhost = false;

    /**
     * 是否强制 HTTPS（生产环境建议 true）
     */
    private boolean requireHttps = true;
}
```

---

## 二、URL 重定向攻击防护

### 2.1 攻击场景示例

**场景1：开放重定向钓鱼攻击**

```
攻击者构造恶意链接：
https://your-domain.com/api/auth/authorize?returnUrl=https://evil.com/phishing

用户点击链接后：
1. 用户在你的网站完成OAuth授权
2. 授权成功后，系统重定向到 https://evil.com/phishing?token=xxx
3. 攻击者通过钓鱼网站获取用户的Token
4. 使用Token冒充用户进行恶意操作
```

**场景2：Token泄露**

```
正常流程：
用户授权 → 重定向到 https://h5.example.com/callback?token=xxx

被攻击：
用户授权 → 重定向到 https://evil.com/steal?token=xxx
```

### 2.2 防护措施

#### 方案1：白名单 + Redis存储（推荐）

```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthRequest wechatMpAuthRequest;
    private final RedisTemplate<String, String> redisTemplate;
    private final OAuthSecurityProperties securityProperties;

    private static final String RETURN_URL_PREFIX = "auth:return_url:";
    private static final long RETURN_URL_TIMEOUT = 5 * 60 * 1000; // 5分钟

    /**
     * 获取微信公众号授权地址
     */
    @GetMapping("/authorize")
    public Result<String> authorize(@RequestParam(required = false) String returnUrl) {

        String state = AuthStateUtils.createState();

        // 如果有 returnUrl，验证并存储到 Redis
        if (StringUtils.hasText(returnUrl)) {
            // ⚠️ 安全检查：验证 returnUrl 是否在白名单内
            if (!isAllowedReturnUrl(returnUrl)) {
                log.warn("非法的重定向地址: {}", returnUrl);
                return Result.fail("非法的重定向地址");
            }

            // 生成短ID，将 returnUrl 存储到 Redis（5分钟过期）
            String returnUrlId = UUID.randomUUID().toString();
            redisTemplate.opsForValue().set(
                RETURN_URL_PREFIX + returnUrlId,
                returnUrl,
                RETURN_URL_TIMEOUT,
                TimeUnit.MILLISECONDS
            );

            // 将短ID附加到state，避免URL过长
            state = state + "|" + returnUrlId;
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

        // 3. 从 Redis 读取 returnUrl（读取后立即删除，确保一次性使用）
        String returnUrl = getAndDeleteReturnUrl(callback.getState());

        // 4. 二次验证 returnUrl（防御性编程）
        if (StringUtils.hasText(returnUrl) && !isAllowedReturnUrl(returnUrl)) {
            log.warn("回调时检测到非法URL: {}", returnUrl);
            returnUrl = null; // 丢弃非法URL
        }

        // 5. 重定向到前端，带上 token
        String redirectUrl = StringUtils.hasText(returnUrl)
            ? returnUrl + "?token=" + token
            : "/dashboard?token=" + token;

        response.sendRedirect(redirectUrl);
    }

    /**
     * 验证 returnUrl 是否在白名单内
     */
    private boolean isAllowedReturnUrl(String returnUrl) {
        List<String> whitelist = securityProperties.getRedirectUrlsWhitelist();
        if (whitelist == null || whitelist.isEmpty()) {
            return false;
        }

        try {
            URI uri = new URI(returnUrl);
            String host = uri.getHost();
            String scheme = uri.getScheme();

            // 检查协议（生产环境强制HTTPS）
            if (securityProperties.isRequireHttps() && !"https".equals(scheme)) {
                // 允许localhost使用http（仅开发环境）
                if (!securityProperties.isAllowLocalhost() || !"localhost".equals(host)) {
                    log.warn("非HTTPS协议被拒绝: {}", returnUrl);
                    return false;
                }
            }

            // 检查域名是否在白名单内
            for (String allowedPattern : whitelist) {
                // 通配符匹配 *.example.com
                if (allowedPattern.startsWith("*.") && host.endsWith(allowedPattern.substring(1))) {
                    return true;
                }
                // 精确匹配
                else if (host.equals(allowedPattern)) {
                    return true;
                }
            }

            // 正则表达式匹配（可选）
            String pattern = securityProperties.getRedirectUrlPattern();
            if (StringUtils.hasText(pattern)) {
                return returnUrl.matches(pattern);
            }

        } catch (URISyntaxException e) {
            log.warn("非法URL格式: {}", returnUrl);
            return false;
        }

        return false;
    }

    /**
     * 从 state 中提取 returnUrlId，并从 Redis 读取原始 URL（读取后立即删除）
     */
    private String getAndDeleteReturnUrl(String state) {
        if (state != null && state.contains("|")) {
            String[] parts = state.split("\\|", 2);
            String returnUrlId = parts[1];
            String key = RETURN_URL_PREFIX + returnUrlId;

            // 读取并删除（原子操作）
            String returnUrl = redisTemplate.opsForValue().get(key);
            if (returnUrl != null) {
                redisTemplate.delete(key);
            }
            return returnUrl;
        }
        return null;
    }
}
```

---

## 三、安全最佳实践

### 3.1 多层防护策略

| 防护层 | 措施 | 说明 |
|--------|------|------|
| **输入验证** | 白名单检查 | 仅允许配置的域名 |
| **存储隔离** | Redis存储 | returnUrl不直接暴露在URL中 |
| **一次性使用** | 读后删除 | 防止重放攻击 |
| **有效期限制** | 5分钟过期 | 减小攻击窗口 |
| **二次验证** | 回调时再验证 | 防御性编程 |

### 3.2 配置检查清单

```bash
# ✅ 生产环境配置检查
app:
  security:
    oauth:
      redirect-urls-whitelist:
        - h5.example.com              # ✅ 精确域名
        - *.your-domain.com           # ✅ 支持子域名
      allow-localhost: false          # ✅ 生产环境禁止localhost
      require-https: true             # ✅ 强制HTTPS

# ❌ 不安全的配置
app:
  security:
    oauth:
      redirect-urls-whitelist:
        - "*"                         # ❌ 不要使用通配符匹配所有域名
        - ".*"                        # ❌ 不要使用正则匹配所有
      allow-localhost: true           # ❌ 生产环境不要允许localhost
      require-https: false            # ❌ 生产环境必须HTTPS
```

### 3.3 监控与告警

```java
@Component
@Slf4j
public class SecurityAuditService {

    /**
     * 记录可疑的重定向尝试
     */
    public void logSuspiciousRedirect(String requestIp, String returnUrl, String reason) {
        log.warn("检测到可疑的重定向尝试: IP={}, URL={}, 原因={}", requestIp, returnUrl, reason);

        // TODO: 发送告警到监控系统
        // alertService.sendAlert("可疑重定向尝试", details);

        // TODO: 记录到安全审计日志
        // auditLogService.record(AuditEvent.SUSPICIOUS_REDIRECT, details);
    }

    /**
     * 统计重定向拦截情况
     */
    public void incrementBlockedRedirectCounter(String domain) {
        // TODO: 增加Prometheus指标
        // meterRegistry.counter("auth.redirect.blocked", "domain", domain).increment();
    }
}
```

---

## 四、状态参数（state）的使用

### 4.1 state 的作用

1. **防止CSRF攻击**：确保回调请求来自合法的授权流程
2. **传递额外信息**：如returnUrl的ID
3. **关联授权会话**：匹配授权请求和回调

### 4.2 state 生成规则

```java
public class AuthStateUtils {

    /**
     * 生成随机state（防CSRF）
     */
    public static String createState() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    /**
     * 生成带附加信息的state
     * 格式: randomState|returnUrlId
     */
    public static String createStateWithReturnUrl(String returnUrlId) {
        return createState() + "|" + returnUrlId;
    }

    /**
     * 解析state，提取returnUrlId
     */
    public static String extractReturnUrlId(String state) {
        if (state != null && state.contains("|")) {
            String[] parts = state.split("\\|", 2);
            return parts.length == 2 ? parts[1] : null;
        }
        return null;
    }
}
```

### 4.3 state 缓存策略

```java
@Component
@RequiredArgsConstructor
public class RedisAuthStateCache implements AuthStateCache {

    private final StringRedisTemplate redisTemplate;
    private static final String KEY_PREFIX = "fastauth:state:";
    private static final long DEFAULT_TIMEOUT = 180; // 3分钟

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
    public String get(String key) {
        return redisTemplate.opsForValue().get(KEY_PREFIX + key);
    }

    @Override
    public boolean containsKey(String key) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(KEY_PREFIX + key));
    }
}
```

---

## 五、常见问题

### Q1: 为什么要将returnUrl存储到Redis而不是直接放在URL中？

**A**: 防止参数篡改。如果直接放在URL中，攻击者可以修改returnUrl参数，绕过白名单检查。

### Q2: 白名单配置支持哪些格式？

**A**:
- 精确匹配：`h5.example.com`
- 通配符匹配：`*.example.com`（匹配所有子域名）
- 正则表达式：`^https://(h5|mobile)\\.example\\.com(/.*)?$`

### Q3: 如何测试白名单配置是否生效？

**A**: 单元测试示例：

```java
@SpringBootTest
class OAuthSecurityTest {

    @Autowired
    private AuthController authController;

    @Test
    void testAllowedReturnUrl() {
        // 合法URL应该通过
        String result = authController.authorize("https://h5.example.com/callback");
        assertNotNull(result);
    }

    @Test
    void testBlockedReturnUrl() {
        // 非法URL应该被拦截
        assertThrows(BusinessException.class, () -> {
            authController.authorize("https://evil.com/phishing");
        });
    }
}
```

### Q4: 生产环境如何快速更新白名单？

**A**: 使用配置中心（如Nacos、Apollo）实现热更新：

```yaml
# nacos配置
app:
  security:
    oauth:
      redirect-urls-whitelist:
        - h5.example.com
        - new-domain.example.com  # 新增域名，无需重启
```

---

## 六、与技术方案的关联

本文档补充了 `技术方案.md` 第 5.7.4 章节（接口认证）的OAuth安全细节。

详见：`docs/v1/技术方案.md` §5.7.4
