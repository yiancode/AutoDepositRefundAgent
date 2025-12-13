# Story 6.5: 异常处理统一机制

**Status**: ready-for-dev

---

## Story

**作为**系统，
**我希望**有统一的异常处理和告警机制，
**以便于**保证系统稳定性，及时发现和处理问题。

---

## 验收标准

### AC-1: 全局异常处理
```gherkin
Feature: 全局异常处理
  Scenario: 业务异常
    Given 业务逻辑抛出 BusinessException
    Then 返回 HTTP 400
    And 响应体: {"code": 业务错误码, "message": "错误信息", "data": null}

  Scenario: 参数校验异常
    Given 请求参数校验失败
    Then 返回 HTTP 400
    And 响应体包含具体的校验错误信息

  Scenario: 权限异常
    Given 用户无权限访问资源
    Then 返回 HTTP 403
    And 响应体: {"code": 403, "message": "权限不足"}

  Scenario: 系统异常
    Given 系统内部错误
    Then 返回 HTTP 500
    And 响应体: {"code": 500, "message": "系统繁忙，请稍后重试"}
    And 记录详细错误日志
```

### AC-2: 第三方API异常处理
```gherkin
Feature: 第三方API异常
  Scenario: API调用失败重试
    Given 调用知识星球API失败
    Then 按配置策略重试
    And 重试间隔: 1s, 2s, 4s (指数退避)
    And 最大重试次数: 3次

  Scenario: 重试失败后告警
    Given 超过最大重试次数
    Then 发送告警通知
    And 记录异常日志
    And 返回友好错误信息

  Scenario: 支付API异常
    Given 调用微信支付API失败
    Then 重试
    And 保证幂等性
    And 记录支付异常日志
```

### AC-3: 安全异常处理
```gherkin
Feature: 安全异常
  Scenario: Webhook签名验证失败
    Given Webhook请求签名不匹配
    Then 返回 FAIL 拒绝请求
    And 记录安全日志 (IP, 请求内容, 时间)
    And 如果短时间内频繁失败则告警

  Scenario: JWT Token异常
    Given Token 过期或无效
    Then 返回 HTTP 401
    And 响应体: {"code": 401, "message": "登录已过期，请重新登录"}

  Scenario: 暴力攻击检测
    Given 同一IP短时间内多次认证失败
    Then 临时封禁IP
    And 发送安全告警
```

### AC-4: 告警机制
```gherkin
Feature: 告警通知
  Scenario: 系统异常告警
    Given 发生严重系统异常
    Then 发送企业微信告警
    And 告警内容: 错误类型、错误信息、发生时间、影响范围

  Scenario: 告警防重复
    Given 同类异常短时间内多次发生
    Then 合并为一条告警
    And 告警间隔至少 5 分钟

  Scenario: 告警级别
    Given 异常发生
    Then 根据严重程度分级:
      | 级别 | 条件 | 通知方式 |
      | CRITICAL | 支付/退款失败 | 企业微信 + 短信 |
      | ERROR | API调用失败 | 企业微信 |
      | WARN | 重试成功 | 仅记录日志 |
```

### AC-5: 异常日志记录
```gherkin
Feature: 异常日志
  Scenario: 记录详细异常信息
    Given 异常发生
    Then 记录到日志:
      | 字段 | 说明 |
      | timestamp | 时间戳 |
      | level | 日志级别 |
      | exception | 异常类型 |
      | message | 错误信息 |
      | stackTrace | 堆栈信息 |
      | requestId | 请求ID |
      | userId | 操作用户 |
      | requestPath | 请求路径 |
      | requestParams | 请求参数 |

  Scenario: 安全日志单独存储
    Given 安全相关异常
    Then 记录到 security_log 表
    And 包含 IP、请求详情、威胁类型
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - 全局异常处理器** (AC: #1)
  - [ ] 1.1 创建 `GlobalExceptionHandler.java`
  - [ ] 1.2 处理 BusinessException
  - [ ] 1.3 处理 MethodArgumentNotValidException
  - [ ] 1.4 处理 AccessDeniedException
  - [ ] 1.5 处理未知异常

- [ ] **Task 2: 后端 - 自定义异常类** (AC: #1)
  - [ ] 2.1 创建 `BusinessException.java`
  - [ ] 2.2 创建 `SystemException.java`
  - [ ] 2.3 定义错误码枚举

- [ ] **Task 3: 后端 - 重试机制** (AC: #2)
  - [ ] 3.1 配置 Spring Retry
  - [ ] 3.2 实现指数退避策略
  - [ ] 3.3 添加 @Retryable 注解

- [ ] **Task 4: 后端 - 告警服务** (AC: #4)
  - [ ] 4.1 创建 `AlertService.java`
  - [ ] 4.2 实现企业微信告警
  - [ ] 4.3 实现告警去重
  - [ ] 4.4 告警级别管理

- [ ] **Task 5: 后端 - 安全日志** (AC: #3, #5)
  - [ ] 5.1 创建 `SecurityLog.java` 实体
  - [ ] 5.2 实现安全日志记录
  - [ ] 5.3 实现暴力攻击检测

- [ ] **Task 6: 测试** (AC: #全部)
  - [ ] 6.1 测试各类异常处理
  - [ ] 6.2 测试重试机制
  - [ ] 6.3 测试告警发送

---

## Dev Notes

### 业务流程概述

```
异常发生
     ↓
GlobalExceptionHandler 捕获:
├── BusinessException → 返回业务错误码
├── ValidationException → 返回校验错误
├── SecurityException → 返回安全错误 + 记录安全日志
└── Exception → 返回500 + 记录错误日志 + 告警
     ↓
告警机制:
├── 判断告警级别
├── 检查去重 (5分钟内同类不重复)
└── 发送企业微信/短信
     ↓
重试机制 (API调用):
├── @Retryable 注解
├── 指数退避: 1s → 2s → 4s
└── 最大 3 次
```

### 代码实现参考

#### GlobalExceptionHandler.java

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    private final AlertService alertService;

    public GlobalExceptionHandler(AlertService alertService) {
        this.alertService = alertService;
    }

    /**
     * 业务异常
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Result<?>> handleBusinessException(BusinessException e) {
        log.warn("业务异常: code={}, message={}", e.getCode(), e.getMessage());
        return ResponseEntity.badRequest()
            .body(Result.fail(e.getCode(), e.getMessage()));
    }

    /**
     * 参数校验异常
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Result<?>> handleValidationException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .collect(Collectors.joining("; "));
        log.warn("参数校验失败: {}", message);
        return ResponseEntity.badRequest()
            .body(Result.fail(ErrorCode.PARAM_INVALID.getCode(), message));
    }

    /**
     * 权限异常
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Result<?>> handleAccessDeniedException(AccessDeniedException e) {
        log.warn("权限不足: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(Result.fail(403, "权限不足"));
    }

    /**
     * 认证异常
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Result<?>> handleAuthException(AuthenticationException e) {
        log.warn("认证失败: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Result.fail(401, "登录已过期，请重新登录"));
    }

    /**
     * 系统异常
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Result<?>> handleException(Exception e, HttpServletRequest request) {
        String requestId = MDC.get("requestId");
        log.error("系统异常 [requestId={}]: path={}", requestId, request.getRequestURI(), e);

        // 发送告警
        alertService.sendAlert(AlertLevel.ERROR, "系统异常",
            String.format("路径: %s\n错误: %s\n请求ID: %s",
                request.getRequestURI(), e.getMessage(), requestId));

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Result.fail(500, "系统繁忙，请稍后重试"));
    }
}
```

#### BusinessException.java

```java
@Getter
public class BusinessException extends RuntimeException {

    private final int code;
    private final String message;

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
        this.message = message;
    }

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.code = errorCode.getCode();
        this.message = errorCode.getMessage();
    }

    public BusinessException(ErrorCode errorCode, String detail) {
        super(errorCode.getMessage() + ": " + detail);
        this.code = errorCode.getCode();
        this.message = errorCode.getMessage() + ": " + detail;
    }
}

public enum ErrorCode {
    // 通用错误 1xxx
    PARAM_INVALID(1001, "参数校验失败"),
    RESOURCE_NOT_FOUND(1002, "资源不存在"),
    OPERATION_NOT_ALLOWED(1003, "操作不允许"),

    // 训练营错误 2xxx
    CAMP_NOT_FOUND(2001, "训练营不存在"),
    CAMP_STATUS_ERROR(2002, "训练营状态不正确"),

    // 支付错误 3xxx
    PAYMENT_FAILED(3001, "支付失败"),
    PAYMENT_TIMEOUT(3002, "支付超时"),

    // 退款错误 4xxx
    REFUND_FAILED(4001, "退款失败"),
    REFUND_ALREADY_DONE(4002, "已退款，请勿重复操作"),

    // 第三方API错误 5xxx
    ZSXQ_API_ERROR(5001, "知识星球接口异常"),
    WECHAT_API_ERROR(5002, "微信接口异常");

    private final int code;
    private final String message;

    ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int getCode() { return code; }
    public String getMessage() { return message; }
}
```

#### Spring Retry 配置

```java
@Configuration
@EnableRetry
public class RetryConfig {

    /**
     * 自定义重试模板
     */
    @Bean
    public RetryTemplate retryTemplate() {
        RetryTemplate template = new RetryTemplate();

        // 指数退避策略
        ExponentialBackOffPolicy backOffPolicy = new ExponentialBackOffPolicy();
        backOffPolicy.setInitialInterval(1000);  // 初始1秒
        backOffPolicy.setMultiplier(2.0);         // 倍数
        backOffPolicy.setMaxInterval(10000);      // 最大10秒
        template.setBackOffPolicy(backOffPolicy);

        // 重试策略
        SimpleRetryPolicy retryPolicy = new SimpleRetryPolicy();
        retryPolicy.setMaxAttempts(3);
        template.setRetryPolicy(retryPolicy);

        return template;
    }
}

// 使用示例
@Service
@Slf4j
public class ZsxqApiClient {

    @Retryable(
        value = {RestClientException.class, IOException.class},
        maxAttempts = 3,
        backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public ZsxqResponse callApi(String endpoint, Object params) {
        log.info("调用知识星球API: {}", endpoint);
        // API调用逻辑
    }

    @Recover
    public ZsxqResponse recover(Exception e, String endpoint, Object params) {
        log.error("知识星球API调用失败，已达最大重试次数: {}", endpoint, e);
        throw new BusinessException(ErrorCode.ZSXQ_API_ERROR, e.getMessage());
    }
}
```

#### AlertService.java

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class AlertService {

    private final WechatNotifyManager notifyManager;
    private final RedisTemplate<String, String> redisTemplate;

    @Value("${alert.wechat.webhook-url}")
    private String webhookUrl;

    @Value("${alert.dedupe-interval:300}")
    private int dedupeInterval;  // 5分钟去重

    /**
     * 发送告警
     */
    public void sendAlert(AlertLevel level, String title, String content) {
        // 去重检查
        String dedupeKey = "alert:dedupe:" + DigestUtils.md5Hex(title + content);
        if (Boolean.TRUE.equals(redisTemplate.hasKey(dedupeKey))) {
            log.debug("告警已去重: {}", title);
            return;
        }

        // 记录去重标记
        redisTemplate.opsForValue().set(dedupeKey, "1", dedupeInterval, TimeUnit.SECONDS);

        // 根据级别发送
        switch (level) {
            case CRITICAL:
                sendWechatAlert(title, content, true);
                // TODO: 发送短信
                break;
            case ERROR:
                sendWechatAlert(title, content, false);
                break;
            case WARN:
                log.warn("告警[WARN]: {} - {}", title, content);
                break;
        }
    }

    private void sendWechatAlert(String title, String content, boolean isCritical) {
        String prefix = isCritical ? "[CRITICAL] " : "[ERROR] ";
        String fullContent = String.format(
            "%s%s\n\n%s\n\n时间: %s",
            prefix, title, content,
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
        );

        try {
            notifyManager.sendWebhookMessage(webhookUrl, fullContent);
            log.info("告警发送成功: {}", title);
        } catch (Exception e) {
            log.error("告警发送失败: {}", title, e);
        }
    }
}

public enum AlertLevel {
    CRITICAL,  // 严重: 支付/退款失败
    ERROR,     // 错误: API调用失败
    WARN       // 警告: 重试成功等
}
```

#### 安全日志实体

```java
@Data
@Builder
@TableName("security_log")
public class SecurityLog {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String eventType;      // WEBHOOK_SIGNATURE_FAIL, AUTH_FAIL, BRUTE_FORCE
    private String ipAddress;
    private String userAgent;
    private String requestPath;
    private String requestBody;
    private String threatLevel;    // HIGH, MEDIUM, LOW
    private LocalDateTime eventTime;
    private String description;
}
```

### 配置项

```yaml
# application.yml
spring:
  retry:
    enabled: true

alert:
  wechat:
    webhook-url: ${ALERT_WEBHOOK_URL}
  dedupe-interval: 300  # 5分钟去重

logging:
  level:
    com.camp: INFO
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%X{requestId}] %-5level %logger{36} - %msg%n"
```

---

## 项目结构

### 后端新增文件

```
backend/src/main/java/com/camp/
├── exception/
│   ├── GlobalExceptionHandler.java             # 新增全局异常处理器
│   ├── BusinessException.java                  # 新增业务异常
│   ├── SystemException.java                    # 新增系统异常
│   └── ErrorCode.java                          # 新增错误码枚举
├── config/
│   └── RetryConfig.java                        # 新增重试配置
├── service/
│   └── AlertService.java                       # 新增告警服务
└── entity/
    └── SecurityLog.java                        # 新增安全日志实体
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP01-S01 项目骨架 | ready-for-dev | 基础项目结构 |

### 添加依赖

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.retry</groupId>
    <artifactId>spring-retry</artifactId>
</dependency>
<dependency>
    <groupId>org.aspectj</groupId>
    <artifactId>aspectjweaver</artifactId>
</dependency>
```

---

## Story Metadata

| 属性 | 值 |
|------|-----|
| Story 点数 | 3 |
| 优先级 | P1 |
| Epic | EP06 |
| 前置条件 | EP01-S01 完成 |
| 覆盖 FR | FR12.1, FR12.2, FR12.3, FR12.4 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
