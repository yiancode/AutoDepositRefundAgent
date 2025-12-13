# Story 3.4: Token过期告警机制

**Status**: ready-for-dev

---

## Story

**作为**系统，
**我希望**在知识星球Token过期时及时告警通知管理员，
**以便于**管理员能够快速更新Token，确保打卡同步功能正常运行。

---

## 验收标准

### AC-1: 同步时Token过期告警
```gherkin
Feature: 同步时Token过期告警
  Scenario: 定时同步捕获Token过期
    Given 定时同步任务执行
    And 知识星球Token已过期
    When 调用SDK抛出 TokenExpiredException
    Then 捕获异常并记录日志
    And 发送企业微信告警通知
    And 通知内容包含:
      | 字段 | 值 |
      | 标题 | 知识星球Token过期告警 |
      | 错误信息 | Token expired |
      | 发生时间 | 异常发生时间 |
      | 影响范围 | 打卡同步功能暂停 |
      | 操作建议 | 更新system_config中的zsxq.token |
    And 记录 sync_log (status=failed, error_type=token_expired)

  Scenario: 手动同步捕获Token过期
    Given 管理员触发手动同步
    And 知识星球Token已过期
    When 调用SDK抛出 TokenExpiredException
    Then 返回错误码 1203
    And 发送企业微信告警通知
    And 通知所有管理员角色用户
```

### AC-2: 定期Token有效性检测
```gherkin
Feature: 定期Token检测
  Scenario: 定时检测Token有效性
    Given 系统配置了Token检测任务
    When 到达每6小时整点 (00:00, 06:00, 12:00, 18:00)
    Then 执行 TokenValidateTask
    And 调用 zsxqClient.users().self()
    And 验证返回用户信息

  Scenario: Token检测失败
    Given Token已过期或无效
    When 检测任务执行
    And 调用返回401/403
    Then 发送告警通知
    And 记录检测失败日志

  Scenario: Token检测成功
    Given Token有效
    When 检测任务执行
    Then 记录检测成功日志
    And 不发送通知
```

### AC-3: 告警去重机制
```gherkin
Feature: 告警去重
  Scenario: 同一天内去重
    Given 已在今天发送过Token过期告警
    When 再次检测到Token过期
    Then 跳过发送
    And 记录日志 "告警已发送，跳过重复通知"

  Scenario: 跨天重置
    Given 昨天发送过Token过期告警
    And 今天再次检测到Token过期
    When 检测任务执行
    Then 发送新的告警通知
    And 重置去重计数

  Scenario: 每小时最多1次
    Given 配置告警限流: 每小时最多1次
    When 1小时内多次检测到Token过期
    Then 只发送第1次告警
    And 后续跳过直到下一小时
```

### AC-4: 企业微信通知
```gherkin
Feature: 企业微信通知
  Scenario: 发送告警消息
    Given Token过期需要告警
    When 调用 WechatNotifyManager.sendTokenExpiredAlert()
    Then 发送企业微信应用消息
    And 消息类型: text
    And 接收人: 所有admin角色用户
    And 消息优先级: 高

  Scenario: 消息模板
    Given 告警消息发送
    Then 使用模板 admin_token_expired
    And 消息格式:
      """
      🚨【Token过期告警】

      知识星球API Token已过期或失效！

      错误信息：{{error_message}}
      发生时间：{{error_time}}
      影响范围：打卡同步功能暂停

      请立即更新Token：
      1. 登录知识星球网页版
      2. 从浏览器开发者工具获取新Token
      3. 更新 system_config 中的 zsxq.token

      👉 系统配置：{{config_url}}
      """
```

### AC-5: 通知接收人配置
```gherkin
Feature: 通知接收人
  Scenario: 通知所有管理员
    Given Token过期告警触发
    When 查询接收人列表
    Then 查询 role=admin 的所有用户
    And 获取用户的企业微信userid
    And 发送告警到所有管理员

  Scenario: 无管理员时告警
    Given 系统中无admin用户
    When 告警触发
    Then 记录错误日志 "无可通知的管理员"
    And 尝试发送到默认告警群
```

### AC-6: 健康检查集成
```gherkin
Feature: 健康检查
  Scenario: Actuator健康检查
    Given 应用启动完成
    When GET /actuator/health
    Then 返回 zsxq 组件的健康状态
    And status = UP (Token有效)
    Or status = DOWN (Token无效)
    And 包含 lastCheckedAt 字段

  Scenario: Token无效时健康检查降级
    Given Token已过期
    When 健康检查执行
    Then zsxq.status = DOWN
    And details.reason = "Token expired"
    And details.action = "Please update zsxq.token"
```

### AC-7: 告警日志记录
```gherkin
Feature: 告警日志
  Scenario: 记录告警发送日志
    Given 告警发送成功
    Then 记录到 operation_log:
      | 字段 | 值 |
      | operation_type | token_expired_alert |
      | operator_type | system |
      | content | 告警详情JSON |
      | target_users | 接收人列表 |
      | status | success |

  Scenario: 记录告警发送失败
    Given 企业微信接口调用失败
    Then 记录到 operation_log:
      | status | failed |
      | error_message | 错误信息 |
    And 重试发送（最多3次）
```

### AC-8: Token更新后验证
```gherkin
Feature: Token更新验证
  Scenario: 更新Token后自动验证
    Given 管理员在system_config更新了zsxq.token
    When 配置保存成功
    Then 立即执行Token验证
    And 调用 zsxqClient.users().self()
    And 验证成功: 提示 "Token验证成功"
    And 验证失败: 提示 "Token无效，请检查"

  Scenario: 提供手动验证接口
    Given 管理员想验证当前Token
    When POST /api/admin/system/zsxq/validate-token
    Then 执行Token验证
    And 返回验证结果:
      | 字段 | 说明 |
      | valid | true/false |
      | userName | 星球用户名（如有效）|
      | errorMessage | 错误信息（如无效）|
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - 定期检测任务** (AC: #2)
  - [ ] 1.1 创建 `TokenValidateTask.java`
  - [ ] 1.2 配置 `@Scheduled(cron = "0 0 0/6 * * ?")` （每6小时）
  - [ ] 1.3 实现 Token 验证逻辑
  - [ ] 1.4 添加任务开关配置 `zsxq.validate.enabled`
  - [ ] 1.5 编写单元测试

- [ ] **Task 2: 后端 - 告警通知服务** (AC: #1, #4)
  - [ ] 2.1 在 `WechatNotifyManager.java` 添加 `sendTokenExpiredAlert()`
  - [ ] 2.2 使用消息模板 `admin_token_expired`
  - [ ] 2.3 查询所有 admin 角色用户
  - [ ] 2.4 调用企业微信应用消息接口
  - [ ] 2.5 编写通知服务测试

- [ ] **Task 3: 后端 - 告警去重** (AC: #3)
  - [ ] 3.1 创建 `AlertRateLimiter.java`
  - [ ] 3.2 使用 Redis 存储告警时间戳
  - [ ] 3.3 实现每小时1次限流
  - [ ] 3.4 实现每天重置逻辑
  - [ ] 3.5 编写限流测试

- [ ] **Task 4: 后端 - 通知接收人查询** (AC: #5)
  - [ ] 4.1 创建 `AdminUserService.java`
  - [ ] 4.2 实现 `getAdminWechatUserIds()`
  - [ ] 4.3 缓存管理员列表（10分钟TTL）
  - [ ] 4.4 处理无管理员场景

- [ ] **Task 5: 后端 - 健康检查集成** (AC: #6)
  - [ ] 5.1 增强 `ZsxqHealthIndicator.java`
  - [ ] 5.2 添加 lastCheckedAt 字段
  - [ ] 5.3 添加详细错误信息
  - [ ] 5.4 编写健康检查测试

- [ ] **Task 6: 后端 - 告警日志** (AC: #7)
  - [ ] 6.1 创建 `AlertLogService.java`
  - [ ] 6.2 实现告警日志记录
  - [ ] 6.3 记录发送成功/失败状态
  - [ ] 6.4 实现重试机制

- [ ] **Task 7: 后端 - Token更新验证** (AC: #8)
  - [ ] 7.1 在 `SystemConfigController.java` 添加更新后验证逻辑
  - [ ] 7.2 实现 `POST /api/admin/system/zsxq/validate-token`
  - [ ] 7.3 返回验证结果
  - [ ] 7.4 编写接口测试

- [ ] **Task 8: 集成测试与验收** (AC: #全部)
  - [ ] 8.1 测试定期检测任务
  - [ ] 8.2 测试告警发送
  - [ ] 8.3 测试告警去重
  - [ ] 8.4 测试健康检查
  - [ ] 8.5 测试Token更新验证

---

## Dev Notes

### 业务流程概述

本故事实现Token过期的全链路告警机制。

```
Token过期检测来源:
├── 定时同步任务（每天01:00）捕获异常
├── 手动同步接口捕获异常
└── 定期检测任务（每6小时）主动检测
          ↓
     捕获 TokenExpiredException
          ↓
     检查告警限流（每小时最多1次）
          ↓ (允许发送)
     查询所有 admin 角色用户
          ↓
     发送企业微信告警通知
          ↓
     记录告警日志
          ↓
     更新健康检查状态
```

### 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 检测频率 | 每6小时 | 平衡及时性和API调用量 |
| 告警限流 | 每小时1次 | 避免告警轰炸 |
| 通知渠道 | 企业微信应用消息 | 管理员常用，及时性高 |
| 告警级别 | P1高优先级 | 影响核心业务功能 |
| 去重存储 | Redis | 支持多实例部署 |

### 告警消息模板

```
🚨【Token过期告警】

知识星球API Token已过期或失效！

错误信息：Authentication failed: token expired
发生时间：2025-12-13 01:00:15
影响范围：打卡同步功能暂停

请立即更新Token：
1. 登录知识星球网页版
2. 从浏览器开发者工具获取新Token
3. 更新 system_config 中的 zsxq.token

👉 系统配置：https://admin.xxx.com/system/config
```

### 代码实现参考

#### TokenValidateTask.java

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class TokenValidateTask {

    private final ZsxqClient zsxqClient;
    private final WechatNotifyManager notifyManager;
    private final AlertRateLimiter alertRateLimiter;

    @Value("${zsxq.validate.enabled:true}")
    private boolean enabled;

    /**
     * 每6小时检测Token有效性
     */
    @Scheduled(cron = "${zsxq.validate.cron:0 0 0/6 * * ?}")
    public void validateToken() {
        if (!enabled) {
            log.info("Token validate task is disabled");
            return;
        }

        log.info("Token validate task started");

        try {
            // 调用API验证Token
            UserInfo userInfo = zsxqClient.users().self();
            log.info("Token is valid, user: {}", userInfo.getName());

        } catch (TokenExpiredException e) {
            log.error("Token expired detected in validate task");
            handleTokenExpired(e, "scheduled_validate");

        } catch (Exception e) {
            log.error("Token validate failed with unexpected error", e);
        }
    }

    /**
     * 处理Token过期
     */
    public void handleTokenExpired(Exception e, String source) {
        // 检查限流
        if (!alertRateLimiter.allowAlert("token_expired")) {
            log.info("Token expired alert rate limited, skip sending");
            return;
        }

        // 发送告警
        try {
            TokenExpiredAlertDTO alert = TokenExpiredAlertDTO.builder()
                .errorMessage(e.getMessage())
                .errorTime(LocalDateTime.now())
                .source(source)
                .configUrl(getConfigUrl())
                .build();

            notifyManager.sendTokenExpiredAlert(alert);
            log.info("Token expired alert sent successfully");

        } catch (Exception ex) {
            log.error("Failed to send token expired alert", ex);
        }
    }

    private String getConfigUrl() {
        // 从配置获取管理后台地址
        return "https://admin.xxx.com/system/config";
    }
}
```

#### AlertRateLimiter.java

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class AlertRateLimiter {

    private final StringRedisTemplate redisTemplate;

    private static final String ALERT_KEY_PREFIX = "alert:rate_limit:";
    private static final int DEFAULT_INTERVAL_SECONDS = 3600; // 1小时

    /**
     * 检查是否允许发送告警
     */
    public boolean allowAlert(String alertType) {
        String key = ALERT_KEY_PREFIX + alertType;

        // 尝试设置，如果已存在则失败
        Boolean success = redisTemplate.opsForValue().setIfAbsent(
            key,
            String.valueOf(System.currentTimeMillis()),
            DEFAULT_INTERVAL_SECONDS,
            TimeUnit.SECONDS
        );

        if (Boolean.TRUE.equals(success)) {
            log.debug("Alert {} allowed", alertType);
            return true;
        }

        log.debug("Alert {} rate limited", alertType);
        return false;
    }

    /**
     * 重置限流（手动清除）
     */
    public void resetLimit(String alertType) {
        String key = ALERT_KEY_PREFIX + alertType;
        redisTemplate.delete(key);
    }
}
```

#### WechatNotifyManager.java - Token过期告警

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class WechatNotifyManager {

    private final SystemUserMapper systemUserMapper;
    private final WechatWorkClient wechatWorkClient;
    private final OperationLogMapper operationLogMapper;

    /**
     * 发送Token过期告警
     */
    public void sendTokenExpiredAlert(TokenExpiredAlertDTO alert) {
        // 1. 获取所有管理员的企业微信userid
        List<String> adminUserIds = getAdminWechatUserIds();

        if (adminUserIds.isEmpty()) {
            log.warn("No admin users found for token expired alert");
            // 尝试发送到默认告警群
            sendToDefaultAlertGroup(alert);
            return;
        }

        // 2. 构建消息内容
        String content = buildAlertContent(alert);

        // 3. 发送企业微信消息
        try {
            WechatTextMessage message = WechatTextMessage.builder()
                .touser(String.join("|", adminUserIds))
                .msgtype("text")
                .text(new WechatTextMessage.Text(content))
                .build();

            wechatWorkClient.sendMessage(message);

            // 4. 记录发送成功日志
            logAlertSent(alert, adminUserIds, "success", null);

        } catch (Exception e) {
            log.error("Failed to send token expired alert", e);
            logAlertSent(alert, adminUserIds, "failed", e.getMessage());
            throw e;
        }
    }

    private List<String> getAdminWechatUserIds() {
        List<SystemUser> admins = systemUserMapper.selectByRole("admin");
        return admins.stream()
            .map(SystemUser::getWechatUserId)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
    }

    private String buildAlertContent(TokenExpiredAlertDTO alert) {
        return String.format("""
            🚨【Token过期告警】

            知识星球API Token已过期或失效！

            错误信息：%s
            发生时间：%s
            影响范围：打卡同步功能暂停

            请立即更新Token：
            1. 登录知识星球网页版
            2. 从浏览器开发者工具获取新Token
            3. 更新 system_config 中的 zsxq.token

            👉 系统配置：%s
            """,
            alert.getErrorMessage(),
            alert.getErrorTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
            alert.getConfigUrl()
        );
    }

    private void logAlertSent(TokenExpiredAlertDTO alert, List<String> recipients,
                              String status, String errorMessage) {
        OperationLog log = new OperationLog();
        log.setOperationType("token_expired_alert");
        log.setOperatorType("system");
        log.setContent(JsonUtils.toJson(Map.of(
            "alert", alert,
            "recipients", recipients,
            "status", status,
            "errorMessage", errorMessage
        )));
        log.setCreatedAt(LocalDateTime.now());
        operationLogMapper.insert(log);
    }

    private void sendToDefaultAlertGroup(TokenExpiredAlertDTO alert) {
        // 实现发送到默认告警群的逻辑
        log.warn("Sending to default alert group as fallback");
    }
}
```

#### ZsxqHealthIndicator.java - 增强版

```java
@Component
@RequiredArgsConstructor
public class ZsxqHealthIndicator implements HealthIndicator {

    private final ZsxqClient zsxqClient;

    private volatile LocalDateTime lastCheckedAt;
    private volatile boolean lastCheckResult;
    private volatile String lastErrorMessage;

    @Override
    public Health health() {
        try {
            zsxqClient.users().self();
            lastCheckedAt = LocalDateTime.now();
            lastCheckResult = true;
            lastErrorMessage = null;

            return Health.up()
                .withDetail("token", "valid")
                .withDetail("lastCheckedAt", lastCheckedAt.toString())
                .build();

        } catch (TokenExpiredException e) {
            lastCheckedAt = LocalDateTime.now();
            lastCheckResult = false;
            lastErrorMessage = e.getMessage();

            return Health.down()
                .withDetail("token", "expired")
                .withDetail("reason", "Token expired")
                .withDetail("action", "Please update zsxq.token in system_config")
                .withDetail("lastCheckedAt", lastCheckedAt.toString())
                .build();

        } catch (Exception e) {
            lastCheckedAt = LocalDateTime.now();
            lastCheckResult = false;
            lastErrorMessage = e.getMessage();

            return Health.down()
                .withDetail("token", "unknown")
                .withDetail("error", e.getMessage())
                .withDetail("lastCheckedAt", lastCheckedAt.toString())
                .build();
        }
    }

    public LocalDateTime getLastCheckedAt() {
        return lastCheckedAt;
    }

    public boolean isLastCheckResult() {
        return lastCheckResult;
    }
}
```

#### SystemConfigController.java - Token验证接口

```java
@RestController
@RequestMapping("/api/admin/system")
@RequiredArgsConstructor
@Slf4j
public class SystemConfigController {

    private final ZsxqClient zsxqClient;

    /**
     * 手动验证Token有效性
     */
    @PostMapping("/zsxq/validate-token")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<TokenValidateResultVO> validateToken() {
        try {
            UserInfo userInfo = zsxqClient.users().self();

            return Result.success(TokenValidateResultVO.builder()
                .valid(true)
                .userName(userInfo.getName())
                .userId(userInfo.getUserId())
                .validatedAt(LocalDateTime.now())
                .build());

        } catch (TokenExpiredException e) {
            return Result.success(TokenValidateResultVO.builder()
                .valid(false)
                .errorMessage("Token已过期，请更新")
                .validatedAt(LocalDateTime.now())
                .build());

        } catch (Exception e) {
            return Result.success(TokenValidateResultVO.builder()
                .valid(false)
                .errorMessage("验证失败: " + e.getMessage())
                .validatedAt(LocalDateTime.now())
                .build());
        }
    }
}
```

### 配置项

```yaml
zsxq:
  token: ${ZSXQ_TOKEN}
  group-id: ${ZSXQ_GROUP_ID}
  validate:
    enabled: true
    cron: "0 0 0/6 * * ?"  # 每6小时检测

alert:
  rate-limit:
    token-expired: 3600    # Token过期告警限流间隔（秒）
```

### 安全检查清单

- [ ] Token不硬编码，通过环境变量注入
- [ ] Token不写入日志（脱敏处理）
- [ ] 告警消息不包含敏感信息
- [ ] 验证接口需要管理员权限
- [ ] 告警发送失败有重试机制

### 测试要点

**后端测试**:
1. `TokenValidateTaskTest` - 测试定期检测任务
2. `AlertRateLimiterTest` - 测试限流逻辑
3. `WechatNotifyManagerTest` - Mock企业微信接口测试告警发送
4. `ZsxqHealthIndicatorTest` - 测试健康检查

**集成测试**:
1. 使用过期Token测试告警触发
2. 测试告警去重机制
3. 测试健康检查端点
4. 测试Token更新后验证

---

## 项目结构

### 后端新增/修改文件

```
backend/src/main/java/com/camp/
├── schedule/
│   └── TokenValidateTask.java           # 新增定期检测任务
├── service/
│   ├── AlertRateLimiter.java            # 新增告警限流
│   └── AlertLogService.java             # 新增告警日志
├── manager/
│   └── WechatNotifyManager.java         # 修改添加Token告警方法
├── controller/
│   └── admin/
│       └── SystemConfigController.java  # 修改添加Token验证接口
├── health/
│   └── ZsxqHealthIndicator.java         # 修改增强健康检查
├── dto/
│   └── alert/
│       ├── TokenExpiredAlertDTO.java    # 新增告警DTO
│       └── TokenValidateResultVO.java   # 新增验证结果VO
└── mapper/
    └── SystemUserMapper.java            # 新增查询admin方法
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP03-S01 SDK集成 | ready-for-dev | ZsxqClient, TokenExpiredException |
| EP03-S02 定时同步 | ready-for-dev | 同步任务捕获异常 |
| 企业微信配置 | 必须完成 | 应用消息推送 |
| Redis 配置 | 必须完成 | 告警限流存储 |

### 后续依赖

本故事完成后，EP03 告警机制完整：
- EP06-S05 异常处理优化（可复用告警通知机制）
- 其他告警场景（退款失败、同步失败）可复用 AlertRateLimiter

---

## References

| 文档 | 路径 | 相关章节 |
|------|------|----------|
| PRD | `docs/PRD.md` | FR4.6 Cookie过期告警, FR11.7 Token过期告警 |
| 通知模板 | `docs/v1/design/通知消息模板.md` | 3.3 Token过期告警 |
| 技术方案 | `docs/v1/design/技术方案.md` | 企业微信通知配置 |
| Epic 定义 | `docs/epics.md` | EP03-S04 |
| 前一故事 | `docs/sprint-artifacts/stories/3-3-manual-sync.md` | 手动同步参考 |
| SDK集成 | `docs/sprint-artifacts/stories/3-1-zsxq-sdk-integration.md` | ZsxqHealthIndicator |

---

## Dev Agent Record

### Context Reference
- Epic: EP03 打卡数据同步与进度查询
- Story: EP03-S04 Token过期告警机制
- FR Coverage: FR4.6, FR11.7

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
| Story 点数 | 2 |
| 优先级 | P1 |
| Epic | EP03 |
| 前置条件 | EP03-S02 完成 |
| 覆盖 FR | FR4.6, FR11.7 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
