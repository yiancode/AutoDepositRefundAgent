# Story 3.1: 知识星球SDK集成与配置

**Status**: ready-for-dev

---

## Story

**作为**开发者，
**我希望**集成zsxq-sdk并完成配置，
**以便于**调用知识星球API获取打卡排行榜数据。

---

## 验收标准

### AC-1: Maven/Gradle 依赖配置
```gherkin
Feature: SDK依赖配置
  Scenario: 添加SDK依赖
    Given 项目使用 Gradle 构建
    When 添加 zsxq-sdk 依赖到 build.gradle
    Then 依赖版本为 1.0.0 或更高
    And 可以 import io.github.yiancode.zsxq 包
    And 编译通过无错误
```

### AC-2: SDK Bean 配置
```gherkin
Feature: Spring Bean配置
  Scenario: ZsxqClient Bean创建成功
    Given 配置了 zsxq.token 环境变量
    And 配置了 zsxq.group-id 环境变量
    When 应用启动
    Then ZsxqClient Bean 创建成功
    And Bean 使用单例模式
    And 支持连接池配置

  Scenario: 配置缺失时启动失败
    Given 未配置 zsxq.token
    When 应用启动
    Then 启动失败
    And 日志显示明确的配置缺失提示
```

### AC-3: Token有效性验证
```gherkin
Feature: Token验证
  Scenario: 启动时验证Token
    Given 应用启动完成
    When 执行 Token 有效性检查
    Then 调用 zsxqClient.users().self()
    And 验证返回用户信息
    And 记录 Token 有效性日志

  Scenario: Token无效时告警
    Given Token 已过期或无效
    When 验证 Token
    Then 捕获 TokenExpiredException
    And 记录错误日志
    And 发送启动告警（可选）
```

### AC-4: 获取打卡排行榜
```gherkin
Feature: 打卡排行榜API
  Scenario: 获取指定训练营的打卡排行榜
    Given ZsxqClient 已初始化
    And 训练营有对应的 zsxq_topic_id
    When 调用 zsxqClient.checkins().getRankingList(groupId, topicId)
    Then 返回 List<RankingItem>
    And 每项包含: userId, name, count, rank
    And 支持分页（SDK内部处理）

  Scenario: 处理空结果
    Given 训练营无打卡记录
    When 获取排行榜
    Then 返回空列表
    And 不抛出异常
```

### AC-5: 超时和重试配置
```gherkin
Feature: 网络配置
  Scenario: 配置超时时间
    Given 配置 zsxq.timeout = 30000 (ms)
    When 调用知识星球API
    Then 超过30秒未响应时超时
    And 抛出 TimeoutException

  Scenario: 配置重试次数
    Given 配置 zsxq.retry-count = 3
    When API调用失败（网络异常）
    Then 自动重试最多3次
    And 重试间隔递增（1s, 2s, 4s）
    And 全部失败后抛出异常
```

### AC-6: 异常处理封装
```gherkin
Feature: 异常处理
  Scenario: Token过期异常
    Given 调用API时Token过期
    When 捕获 TokenExpiredException
    Then 转换为业务异常 ZsxqTokenExpiredException
    And 异常包含过期时间和建议操作

  Scenario: 网络异常
    Given 网络连接失败
    When 捕获 IOException
    Then 转换为 ZsxqNetworkException
    And 异常包含错误详情

  Scenario: 限流异常
    Given API调用触发限流
    When 捕获 RateLimitException
    Then 转换为 ZsxqRateLimitException
    And 包含重试建议时间
```

### AC-7: 配置项管理
```gherkin
Feature: 配置项
  Scenario: 支持环境变量配置
    Given 配置项定义在 application.yml
    When 使用环境变量覆盖
    Then 环境变量优先级更高
    And 敏感配置不硬编码

  Scenario: 配置项列表
    Then 支持以下配置项:
      | 配置项 | 默认值 | 说明 |
      | zsxq.token | - | 知识星球Token（必填）|
      | zsxq.group-id | - | 星球ID（必填）|
      | zsxq.timeout | 30000 | 超时时间(ms) |
      | zsxq.retry-count | 3 | 重试次数 |
      | zsxq.retry-interval | 1000 | 重试间隔(ms) |
```

### AC-8: 健康检查端点
```gherkin
Feature: 健康检查
  Scenario: Actuator健康检查
    Given 应用启动完成
    When GET /actuator/health
    Then 返回 zsxq 组件的健康状态
    And status = UP（Token有效）
    Or status = DOWN（Token无效）
```

---

## Tasks / Subtasks

- [ ] **Task 1: 添加SDK依赖** (AC: #1)
  - [ ] 1.1 在 `build.gradle` 添加依赖:
    ```groovy
    implementation 'io.github.yiancode:zsxq-sdk:1.0.0'
    ```
  - [ ] 1.2 执行 `./gradlew build` 验证依赖解析
  - [ ] 1.3 检查传递依赖是否有冲突

- [ ] **Task 2: 创建配置类** (AC: #2, #7)
  - [ ] 2.1 创建 `ZsxqProperties.java` 配置属性类
  - [ ] 2.2 创建 `ZsxqSdkConfig.java` Spring配置类
  - [ ] 2.3 配置 ZsxqClient Bean
  - [ ] 2.4 添加 `application.yml` 配置节
  - [ ] 2.5 编写配置类测试

- [ ] **Task 3: Token验证服务** (AC: #3)
  - [ ] 3.1 创建 `ZsxqTokenValidator.java`
  - [ ] 3.2 实现 `validateToken()` 方法
  - [ ] 3.3 添加 `@PostConstruct` 启动时验证
  - [ ] 3.4 编写验证测试

- [ ] **Task 4: 打卡服务封装** (AC: #4)
  - [ ] 4.1 创建 `ZsxqCheckinService.java`
  - [ ] 4.2 实现 `getRankingList(groupId, topicId)` 方法
  - [ ] 4.3 实现结果映射到业务对象
  - [ ] 4.4 编写单元测试（Mock SDK）

- [ ] **Task 5: 重试机制实现** (AC: #5)
  - [ ] 5.1 配置 SDK 内置重试（如支持）
  - [ ] 5.2 或使用 Spring Retry 包装
  - [ ] 5.3 实现指数退避策略
  - [ ] 5.4 编写重试测试

- [ ] **Task 6: 异常处理** (AC: #6)
  - [ ] 6.1 创建 `ZsxqException.java` 基类
  - [ ] 6.2 创建 `ZsxqTokenExpiredException.java`
  - [ ] 6.3 创建 `ZsxqNetworkException.java`
  - [ ] 6.4 创建 `ZsxqRateLimitException.java`
  - [ ] 6.5 实现异常转换逻辑

- [ ] **Task 7: 健康检查** (AC: #8)
  - [ ] 7.1 创建 `ZsxqHealthIndicator.java`
  - [ ] 7.2 实现 `health()` 方法
  - [ ] 7.3 配置 Actuator 暴露端点
  - [ ] 7.4 编写健康检查测试

- [ ] **Task 8: 集成测试** (AC: #全部)
  - [ ] 8.1 编写 SDK 集成测试
  - [ ] 8.2 测试获取排行榜功能
  - [ ] 8.3 测试 Token 验证
  - [ ] 8.4 测试异常场景

---

## Dev Notes

### 业务流程概述

本故事是打卡同步功能的基础，完成后其他打卡相关故事可以开始。

```
应用启动
     ↓
加载 zsxq 配置（token, group-id 等）
     ↓
创建 ZsxqClient Bean
     ↓
启动时验证 Token 有效性
     ↓
注册健康检查端点
     ↓
SDK 就绪，可供其他服务调用
```

### 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| SDK 版本 | zsxq-sdk 1.0.0 | 自研封装，稳定可控 |
| 配置管理 | Spring ConfigurationProperties | 类型安全，IDE 友好 |
| 重试策略 | 指数退避 | 避免雪崩，对API友好 |
| 健康检查 | Spring Actuator | 标准化，运维友好 |

### 知识星球API说明

知识星球API需要通过浏览器获取Token（Cookie中的Authorization），Token有效期约7天。

**获取Token步骤**:
1. 浏览器登录 https://wx.zsxq.com
2. 打开开发者工具 → Network
3. 刷新页面，找到任意API请求
4. 复制 Request Headers 中的 `Authorization` 值

### 代码实现参考

#### ZsxqProperties.java

```java
@ConfigurationProperties(prefix = "zsxq")
@Validated
@Data
public class ZsxqProperties {

    /**
     * 知识星球Token（从浏览器获取）
     */
    @NotBlank(message = "zsxq.token 配置不能为空")
    private String token;

    /**
     * 星球ID
     */
    @NotBlank(message = "zsxq.group-id 配置不能为空")
    private String groupId;

    /**
     * 请求超时时间（毫秒）
     */
    private int timeout = 30000;

    /**
     * 重试次数
     */
    private int retryCount = 3;

    /**
     * 重试间隔（毫秒）
     */
    private int retryInterval = 1000;

    /**
     * 启动时验证Token
     */
    private boolean validateOnStartup = true;
}
```

#### ZsxqSdkConfig.java

```java
@Configuration
@EnableConfigurationProperties(ZsxqProperties.class)
@RequiredArgsConstructor
@Slf4j
public class ZsxqSdkConfig {

    private final ZsxqProperties properties;

    @Bean
    public ZsxqClient zsxqClient() {
        ZsxqClientConfig config = ZsxqClientConfig.builder()
            .token(properties.getToken())
            .timeout(properties.getTimeout())
            .retryCount(properties.getRetryCount())
            .retryInterval(properties.getRetryInterval())
            .build();

        log.info("Creating ZsxqClient with groupId: {}", properties.getGroupId());
        return new ZsxqClient(config);
    }

    @Bean
    public ZsxqTokenValidator zsxqTokenValidator(ZsxqClient client) {
        return new ZsxqTokenValidator(client, properties.isValidateOnStartup());
    }
}
```

#### ZsxqTokenValidator.java

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class ZsxqTokenValidator {

    private final ZsxqClient zsxqClient;
    private final boolean validateOnStartup;

    @PostConstruct
    public void validateTokenOnStartup() {
        if (!validateOnStartup) {
            log.info("Skip token validation on startup");
            return;
        }

        try {
            log.info("Validating zsxq token on startup...");
            UserInfo userInfo = zsxqClient.users().self();
            log.info("Token validation success, user: {}", userInfo.getName());
        } catch (TokenExpiredException e) {
            log.error("Zsxq token has expired! Please update the token.");
            // 启动时不强制失败，但记录警告
        } catch (Exception e) {
            log.error("Failed to validate zsxq token", e);
        }
    }

    /**
     * 手动验证Token
     */
    public boolean validateToken() {
        try {
            zsxqClient.users().self();
            return true;
        } catch (TokenExpiredException e) {
            return false;
        } catch (Exception e) {
            log.warn("Token validation error", e);
            return false;
        }
    }
}
```

#### ZsxqCheckinService.java

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class ZsxqCheckinService {

    private final ZsxqClient zsxqClient;
    private final ZsxqProperties properties;

    /**
     * 获取打卡排行榜
     *
     * @param topicId 话题ID（训练营对应的打卡话题）
     * @return 排行榜列表
     */
    public List<CheckinRankingDTO> getRankingList(String topicId) {
        try {
            List<RankingItem> items = zsxqClient.checkins()
                .getRankingList(properties.getGroupId(), topicId);

            return items.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        } catch (TokenExpiredException e) {
            log.error("Token expired when fetching ranking list");
            throw new ZsxqTokenExpiredException("知识星球Token已过期，请更新配置", e);
        } catch (RateLimitException e) {
            log.warn("Rate limited when fetching ranking list");
            throw new ZsxqRateLimitException("API调用频率过高，请稍后重试", e);
        } catch (Exception e) {
            log.error("Failed to fetch ranking list for topic: {}", topicId, e);
            throw new ZsxqNetworkException("获取打卡排行榜失败", e);
        }
    }

    private CheckinRankingDTO convertToDTO(RankingItem item) {
        return CheckinRankingDTO.builder()
            .userId(item.getUserId())
            .userName(item.getName())
            .checkinCount(item.getCount())
            .rank(item.getRank())
            .build();
    }
}
```

#### ZsxqHealthIndicator.java

```java
@Component
@RequiredArgsConstructor
public class ZsxqHealthIndicator implements HealthIndicator {

    private final ZsxqTokenValidator tokenValidator;

    @Override
    public Health health() {
        boolean isValid = tokenValidator.validateToken();

        if (isValid) {
            return Health.up()
                .withDetail("token", "valid")
                .build();
        } else {
            return Health.down()
                .withDetail("token", "expired or invalid")
                .withDetail("action", "Please update zsxq.token in configuration")
                .build();
        }
    }
}
```

#### application.yml 配置

```yaml
zsxq:
  token: ${ZSXQ_TOKEN}
  group-id: ${ZSXQ_GROUP_ID}
  timeout: 30000
  retry-count: 3
  retry-interval: 1000
  validate-on-startup: true

management:
  endpoints:
    web:
      exposure:
        include: health,info
  endpoint:
    health:
      show-details: always
```

### 异常类定义

```java
// 基类
public class ZsxqException extends RuntimeException {
    public ZsxqException(String message) {
        super(message);
    }
    public ZsxqException(String message, Throwable cause) {
        super(message, cause);
    }
}

// Token过期
public class ZsxqTokenExpiredException extends ZsxqException {
    public ZsxqTokenExpiredException(String message, Throwable cause) {
        super(message, cause);
    }
}

// 网络异常
public class ZsxqNetworkException extends ZsxqException {
    public ZsxqNetworkException(String message, Throwable cause) {
        super(message, cause);
    }
}

// 限流
public class ZsxqRateLimitException extends ZsxqException {
    private final long retryAfterMs;

    public ZsxqRateLimitException(String message, Throwable cause) {
        super(message, cause);
        this.retryAfterMs = 60000; // 默认1分钟后重试
    }
}
```

### 安全检查清单

- [ ] Token 不硬编码在代码中
- [ ] Token 通过环境变量或安全配置注入
- [ ] Token 不写入日志（脱敏处理）
- [ ] 健康检查端点不暴露敏感信息

### 测试要点

**单元测试**:
1. `ZsxqPropertiesTest` - 测试配置属性绑定
2. `ZsxqTokenValidatorTest` - Mock SDK 测试验证逻辑
3. `ZsxqCheckinServiceTest` - Mock SDK 测试业务逻辑

**集成测试**:
1. 使用真实Token测试API调用（CI环境配置）
2. 测试健康检查端点
3. 测试异常场景（可选，使用过期Token）

---

## 项目结构

### 后端新增文件

```
backend/src/main/java/com/camp/
├── config/
│   ├── ZsxqProperties.java           # 配置属性
│   └── ZsxqSdkConfig.java            # SDK配置
├── service/
│   ├── ZsxqCheckinService.java       # 打卡服务封装
│   └── ZsxqTokenValidator.java       # Token验证
├── dto/
│   └── zsxq/
│       └── CheckinRankingDTO.java    # 排行榜DTO
├── exception/
│   ├── ZsxqException.java            # 异常基类
│   ├── ZsxqTokenExpiredException.java
│   ├── ZsxqNetworkException.java
│   └── ZsxqRateLimitException.java
└── health/
    └── ZsxqHealthIndicator.java      # 健康检查
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP01-S01 项目骨架 | ready-for-dev | Spring Boot基础框架 |
| zsxq-sdk 发布 | 已完成 | Maven Central可用 |
| 知识星球Token | 需人工获取 | 从浏览器获取 |

### 后续依赖

本故事完成后，以下功能可以开始:
- EP03-S02 打卡数据定时同步任务
- EP03-S04 Token过期告警机制

---

## References

| 文档 | 路径 | 相关章节 |
|------|------|----------|
| PRD | `docs/PRD.md` | FR4.1 知识星球API集成 |
| 技术方案 | `docs/v1/design/技术方案.md` | 外部依赖集成 |
| Epic 定义 | `docs/epics.md` | EP03-S01 |
| zsxq-sdk | https://github.com/yiancode/zsxq-sdk | SDK文档 |

---

## Dev Agent Record

### Context Reference
- Epic: EP03 打卡数据同步与进度查询
- Story: EP03-S01 知识星球SDK集成与配置
- FR Coverage: FR4.1

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
| Epic | EP03 |
| 前置条件 | EP01-S01 完成 |
| 覆盖 FR | FR4.1 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
