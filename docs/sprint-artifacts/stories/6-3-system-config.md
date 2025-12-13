# Story 6.3: 系统配置管理

**Status**: ready-for-dev

---

## Story

**作为**超级管理员，
**我希望**能够管理系统配置（知识星球、微信支付等），
**以便于**灵活调整系统参数，无需修改代码。

---

## 验收标准

### AC-1: 查看配置
```gherkin
Feature: 查看系统配置
  Scenario: 访问配置页面
    Given 超级管理员已登录
    When GET /api/admin/config
    Then 返回配置分组:
      | 分组 | 说明 |
      | zsxq | 知识星球配置 |
      | wechat | 微信公众号配置 |
      | wechat_pay | 微信支付配置 |
      | notification | 通知配置 |

  Scenario: 敏感配置脱敏显示
    Given 配置包含敏感信息
    Then 密码/密钥类配置显示为 ******
    And 仅在编辑时可查看/修改
```

### AC-2: 修改配置
```gherkin
Feature: 修改配置
  Scenario: 修改知识星球Token
    Given 超级管理员在配置页面
    When PUT /api/admin/config/zsxq {token: "new_token"}
    Then 配置加密存储到 system_config
    And 记录操作日志

  Scenario: 修改微信支付配置
    Given 修改微信支付商户号
    When 点击 "保存"
    Then 所有支付相关配置一起保存
    And 验证配置完整性

  Scenario: 配置验证
    Given 提交不完整的配置
    Then 返回验证错误
    And 提示缺少哪些必填项
```

### AC-3: 测试配置有效性
```gherkin
Feature: 测试配置
  Scenario: 测试知识星球连接
    Given 配置了知识星球Token
    When 点击 "测试连接"
    Then POST /api/admin/config/zsxq/test
    And 调用知识星球API验证
    And 返回测试结果 (成功/失败+原因)

  Scenario: 测试微信支付
    Given 配置了微信支付参数
    When 点击 "测试连接"
    Then 验证证书和商户号有效性
    And 返回测试结果
```

### AC-4: 配置加密存储
```gherkin
Feature: 配置安全
  Scenario: 敏感配置加密
    Given 保存包含密钥的配置
    Then 使用 AES-GCM 加密存储
    And 数据库字段为密文

  Scenario: 配置读取解密
    Given 获取配置
    Then 后端解密后返回
    And 敏感字段脱敏显示
```

### AC-5: 配置热更新
```gherkin
Feature: 配置热更新
  Scenario: 修改后立即生效
    Given 修改了知识星球Token
    When 保存成功
    Then 不需要重启应用
    And 下次API调用使用新配置

  Scenario: 通知其他实例
    Given 多实例部署
    When 配置更新
    Then 通过 Redis Pub/Sub 通知
    And 所有实例刷新配置
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - 配置查询接口** (AC: #1)
  - [ ] 1.1 创建 `ConfigController.java`
  - [ ] 1.2 实现 `GET /api/admin/config`
  - [ ] 1.3 实现配置分组返回
  - [ ] 1.4 敏感字段脱敏

- [ ] **Task 2: 后端 - 配置更新接口** (AC: #2)
  - [ ] 2.1 实现 `PUT /api/admin/config/{group}`
  - [ ] 2.2 配置验证
  - [ ] 2.3 加密存储
  - [ ] 2.4 记录操作日志

- [ ] **Task 3: 后端 - 配置测试接口** (AC: #3)
  - [ ] 3.1 实现 `POST /api/admin/config/{group}/test`
  - [ ] 3.2 实现知识星球连接测试
  - [ ] 3.3 实现微信支付测试

- [ ] **Task 4: 后端 - 配置加密** (AC: #4)
  - [ ] 4.1 创建 `ConfigEncryptUtil.java`
  - [ ] 4.2 实现 AES-GCM 加密/解密
  - [ ] 4.3 敏感字段标识

- [ ] **Task 5: 后端 - 配置热更新** (AC: #5)
  - [ ] 5.1 实现配置缓存
  - [ ] 5.2 实现 Redis Pub/Sub 通知
  - [ ] 5.3 配置刷新监听

- [ ] **Task 6: 前端 - 配置页面** (AC: #1, #2, #3)
  - [ ] 6.1 创建 `SystemConfig.vue`
  - [ ] 6.2 实现配置表单
  - [ ] 6.3 实现测试连接功能
  - [ ] 6.4 敏感字段显示/隐藏切换

- [ ] **Task 7: 测试** (AC: #全部)
  - [ ] 7.1 测试配置加密存储
  - [ ] 7.2 测试配置热更新
  - [ ] 7.3 测试连接测试功能

---

## Dev Notes

### 业务流程概述

```
超级管理员访问配置页面
     ↓
加载当前配置:
├── 知识星球: group_id, token(脱敏)
├── 微信公众号: appid, secret(脱敏)
├── 微信支付: mch_id, api_key(脱敏), cert_path
└── 通知: enabled, retry_count, retry_interval
     ↓
管理员操作:
├── 修改配置 → 验证 → 加密存储 → 热更新
├── 测试连接 → 调用API验证 → 返回结果
└── 查看详情 → 临时显示明文
```

### 代码实现参考

#### ConfigController.java

```java
@RestController
@RequestMapping("/api/admin/config")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Slf4j
public class ConfigController {

    private final SystemConfigService configService;

    /**
     * 获取所有配置
     */
    @GetMapping
    public Result<Map<String, ConfigGroupVO>> getAllConfig() {
        Map<String, ConfigGroupVO> configs = configService.getAllConfigGroups();
        return Result.success(configs);
    }

    /**
     * 获取指定分组配置
     */
    @GetMapping("/{group}")
    public Result<ConfigGroupVO> getConfigByGroup(@PathVariable String group) {
        ConfigGroupVO config = configService.getConfigGroup(group);
        return Result.success(config);
    }

    /**
     * 更新配置
     */
    @PutMapping("/{group}")
    @OperationLog(type = "UPDATE_CONFIG", description = "更新系统配置")
    public Result<Void> updateConfig(
            @PathVariable String group,
            @RequestBody @Valid Map<String, String> configs) {
        configService.updateConfigGroup(group, configs);
        return Result.success();
    }

    /**
     * 测试配置连接
     */
    @PostMapping("/{group}/test")
    public Result<ConfigTestResult> testConfig(@PathVariable String group) {
        ConfigTestResult result = configService.testConfig(group);
        return Result.success(result);
    }
}
```

#### SystemConfigServiceImpl.java

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class SystemConfigServiceImpl implements SystemConfigService {

    private final SystemConfigMapper configMapper;
    private final ConfigEncryptUtil encryptUtil;
    private final RedisTemplate<String, String> redisTemplate;
    private final ZsxqApiClient zsxqClient;
    private final WechatPayClient wechatPayClient;

    // 敏感字段列表
    private static final Set<String> SENSITIVE_KEYS = Set.of(
        "zsxq.token", "zsxq.authorization", "zsxq.x_signature",
        "wechat.secret", "wechat_pay.api_key", "wechat_pay.cert_content"
    );

    private static final String CONFIG_CHANNEL = "config:refresh";

    @Override
    public Map<String, ConfigGroupVO> getAllConfigGroups() {
        List<SystemConfig> allConfigs = configMapper.selectList(null);

        Map<String, List<SystemConfig>> grouped = allConfigs.stream()
            .collect(Collectors.groupingBy(SystemConfig::getConfigGroup));

        Map<String, ConfigGroupVO> result = new LinkedHashMap<>();
        for (Map.Entry<String, List<SystemConfig>> entry : grouped.entrySet()) {
            ConfigGroupVO groupVO = buildConfigGroupVO(entry.getKey(), entry.getValue());
            result.put(entry.getKey(), groupVO);
        }
        return result;
    }

    private ConfigGroupVO buildConfigGroupVO(String group, List<SystemConfig> configs) {
        List<ConfigItemVO> items = configs.stream()
            .map(c -> ConfigItemVO.builder()
                .key(c.getConfigKey())
                .value(maskSensitiveValue(c.getConfigKey(), c.getConfigValue()))
                .description(c.getDescription())
                .sensitive(SENSITIVE_KEYS.contains(c.getConfigKey()))
                .build())
            .collect(Collectors.toList());

        return ConfigGroupVO.builder()
            .group(group)
            .title(getGroupTitle(group))
            .items(items)
            .build();
    }

    private String maskSensitiveValue(String key, String value) {
        if (SENSITIVE_KEYS.contains(key) && value != null && value.length() > 4) {
            return value.substring(0, 2) + "******" + value.substring(value.length() - 2);
        }
        return value;
    }

    @Override
    @Transactional
    public void updateConfigGroup(String group, Map<String, String> configs) {
        for (Map.Entry<String, String> entry : configs.entrySet()) {
            String fullKey = group + "." + entry.getKey();
            String value = entry.getValue();

            // 加密敏感配置
            if (SENSITIVE_KEYS.contains(fullKey)) {
                value = encryptUtil.encrypt(value);
            }

            // 更新或插入
            SystemConfig config = configMapper.selectByKey(fullKey);
            if (config != null) {
                config.setConfigValue(value);
                config.setUpdatedAt(LocalDateTime.now());
                configMapper.updateById(config);
            } else {
                config = SystemConfig.builder()
                    .configKey(fullKey)
                    .configValue(value)
                    .configGroup(group)
                    .build();
                configMapper.insert(config);
            }
        }

        // 通知配置刷新
        publishConfigRefresh(group);
    }

    @Override
    public ConfigTestResult testConfig(String group) {
        try {
            switch (group) {
                case "zsxq":
                    return testZsxqConfig();
                case "wechat_pay":
                    return testWechatPayConfig();
                default:
                    return ConfigTestResult.success("配置项无需测试");
            }
        } catch (Exception e) {
            log.error("配置测试失败: group={}", group, e);
            return ConfigTestResult.fail(e.getMessage());
        }
    }

    private ConfigTestResult testZsxqConfig() {
        // 调用知识星球API测试
        boolean success = zsxqClient.testConnection();
        return success
            ? ConfigTestResult.success("知识星球连接成功")
            : ConfigTestResult.fail("知识星球连接失败，请检查Token");
    }

    private void publishConfigRefresh(String group) {
        redisTemplate.convertAndSend(CONFIG_CHANNEL, group);
    }
}
```

#### ConfigEncryptUtil.java

```java
@Component
public class ConfigEncryptUtil {

    @Value("${config.encrypt.key}")
    private String encryptKey;

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    /**
     * AES-GCM 加密
     */
    public String encrypt(String plaintext) {
        try {
            SecretKey key = new SecretKeySpec(encryptKey.getBytes(), "AES");
            byte[] iv = new byte[GCM_IV_LENGTH];
            SecureRandom.getInstanceStrong().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, key, spec);

            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            // IV + Ciphertext
            byte[] result = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, result, 0, iv.length);
            System.arraycopy(ciphertext, 0, result, iv.length, ciphertext.length);

            return Base64.getEncoder().encodeToString(result);
        } catch (Exception e) {
            throw new RuntimeException("配置加密失败", e);
        }
    }

    /**
     * AES-GCM 解密
     */
    public String decrypt(String ciphertext) {
        try {
            byte[] decoded = Base64.getDecoder().decode(ciphertext);

            byte[] iv = new byte[GCM_IV_LENGTH];
            byte[] encrypted = new byte[decoded.length - GCM_IV_LENGTH];
            System.arraycopy(decoded, 0, iv, 0, GCM_IV_LENGTH);
            System.arraycopy(decoded, GCM_IV_LENGTH, encrypted, 0, encrypted.length);

            SecretKey key = new SecretKeySpec(encryptKey.getBytes(), "AES");
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, key, spec);

            byte[] plaintext = cipher.doFinal(encrypted);
            return new String(plaintext, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("配置解密失败", e);
        }
    }
}
```

#### 配置热更新监听

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class ConfigRefreshListener implements MessageListener {

    private final ConfigCacheManager cacheManager;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String group = new String(message.getBody());
        log.info("收到配置刷新通知: group={}", group);
        cacheManager.refreshConfig(group);
    }
}

@Configuration
public class RedisConfig {

    @Bean
    public RedisMessageListenerContainer container(
            RedisConnectionFactory factory,
            ConfigRefreshListener listener) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(factory);
        container.addMessageListener(listener, new PatternTopic("config:refresh"));
        return container;
    }
}
```

### 配置项

```yaml
config:
  encrypt:
    key: ${CONFIG_ENCRYPT_KEY:your-32-byte-secret-key-here!!}  # 32字节密钥
```

---

## 项目结构

### 后端新增文件

```
backend/src/main/java/com/camp/
├── controller/
│   └── admin/
│       └── ConfigController.java               # 新增配置控制器
├── service/
│   ├── SystemConfigService.java                # 新增配置服务接口
│   └── impl/
│       └── SystemConfigServiceImpl.java        # 新增配置服务实现
├── util/
│   └── ConfigEncryptUtil.java                  # 新增加密工具
├── listener/
│   └── ConfigRefreshListener.java              # 新增配置刷新监听
└── vo/
    ├── ConfigGroupVO.java                      # 新增配置分组VO
    ├── ConfigItemVO.java                       # 新增配置项VO
    └── ConfigTestResult.java                   # 新增测试结果VO
```

### 前端新增文件

```
frontend/admin-web/src/
└── views/
    └── system/
        └── SystemConfig.vue                    # 新增配置管理页面
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP01-S06 用户管理 | ready-for-dev | 超级管理员角色 |

---

## Story Metadata

| 属性 | 值 |
|------|-----|
| Story 点数 | 3 |
| 优先级 | P2 |
| Epic | EP06 |
| 前置条件 | EP01-S06 完成 |
| 覆盖 FR | FR10.3 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
