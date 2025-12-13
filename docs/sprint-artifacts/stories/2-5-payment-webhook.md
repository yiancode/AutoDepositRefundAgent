# Story 2.5: 微信支付 Webhook 回调处理

**Status**: ready-for-dev

---

## Story

**作为**系统，
**我希望**正确处理微信支付回调，验证签名并记录支付结果，
**以便于**确保支付数据的安全性和一致性，为后续退款流程提供可靠基础。

---

## 验收标准

### AC-1: 接收微信支付回调
```gherkin
Feature: 支付回调接收
  Scenario: 接收有效的支付回调
    Given 用户完成微信支付
    When 微信服务器调用 POST /api/webhook/wechat/payment
    And 请求体包含加密的支付通知数据
    Then 系统解密回调数据
    And 记录原始请求日志
    And 返回成功响应给微信
```

### AC-2: 签名验证
```gherkin
Feature: 微信支付 V3 签名验证
  Scenario: 签名验证成功
    Given 收到微信支付回调请求
    And HTTP Header 包含 Wechatpay-Signature, Wechatpay-Timestamp, Wechatpay-Nonce
    When 使用微信支付平台证书验证签名
    And 签名验证通过
    Then 继续处理回调业务逻辑

  Scenario: 签名验证失败
    Given 收到支付回调请求
    And 签名验证不通过
    Then 返回 FAIL 响应
    And 记录安全日志（包含请求 IP、时间、详情）
    And 发送安全告警通知管理员
```

### AC-3: 时间窗口验证（防重放攻击）
```gherkin
Feature: 时间窗口验证
  Scenario: 回调时间在有效窗口内
    Given 回调请求中的 timestamp
    When timestamp 与当前时间差距在 5 分钟内
    Then 验证通过，继续处理

  Scenario: 回调时间过期
    Given 回调请求中的 timestamp
    When timestamp 与当前时间差距超过 5 分钟
    Then 拒绝处理回调
    And 记录疑似重放攻击日志
    And 返回 FAIL 响应
```

### AC-4: 幂等性处理
```gherkin
Feature: Redis 分布式锁幂等处理
  Scenario: 首次处理回调
    Given 收到订单号为 ord_xxx 的回调
    When Redis 中不存在 payment:callback:ord_xxx
    Then 获取分布式锁成功
    And 处理支付业务逻辑
    And 释放分布式锁

  Scenario: 重复回调（同一订单）
    Given 收到订单号为 ord_xxx 的重复回调
    And Redis 中已存在 payment:callback:ord_xxx
    Then 获取锁失败
    And 记录重复回调日志
    And 直接返回成功响应（幂等）
```

### AC-5: 更新支付记录
```gherkin
Feature: 更新支付状态
  Scenario: 支付成功更新记录
    Given 签名验证和幂等检查通过
    And 回调数据 trade_state = SUCCESS
    When 处理支付成功逻辑
    Then 更新 payment_record:
      | 字段 | 值 |
      | pay_status | success |
      | transaction_id | 微信支付单号 |
      | pay_time | 支付完成时间 |
    And 使用乐观锁确保并发安全

  Scenario: 支付失败更新记录
    Given 回调数据 trade_state != SUCCESS
    Then 更新 payment_record.pay_status = failed
    And 记录失败原因
```

### AC-6: 创建会员记录
```gherkin
Feature: 创建训练营会员
  Scenario: 支付成功创建会员
    Given 支付状态更新为 success
    When 从 attach 字段解析业务数据
    And 获取 campId, wechatUserId, planetMemberNumber
    Then 创建 camp_member 记录:
      | 字段 | 值 |
      | camp_id | attach 中的 campId |
      | wechat_user_id | attach 中的 wechatUserId |
      | planet_member_number | attach 中的 planetMemberNumber |
      | bind_status | completed |
      | bind_method | h5_bindplanet |
      | pay_status | success |
    And 增加训练营报名人数 (enroll_count)
```

### AC-7: 生成 accessToken
```gherkin
Feature: 生成访问票据
  Scenario: 支付成功生成 accessToken
    Given 会员记录创建成功
    When 生成 accessToken (tk_ + UUID)
    Then 存入 Redis:
      | Key | access_token:{token} |
      | Value | JSON { memberId, campId, expireAt } |
      | TTL | 训练营结束时间 + 7 天 |
    And 更新 camp_member.access_token = token
```

### AC-8: 记录状态日志
```gherkin
Feature: 状态变更日志
  Scenario: 记录支付状态变更
    Given 支付状态更新成功
    Then 插入 payment_status_log:
      | 字段 | 值 |
      | payment_record_id | 支付记录ID |
      | from_status | pending |
      | to_status | success |
      | trigger_source | wechat_webhook |
    And 插入 bind_status_log（如果创建了会员）
```

### AC-9: 响应微信服务器
```gherkin
Feature: 返回正确响应
  Scenario: 处理成功响应
    Given 业务处理成功
    When 返回响应给微信
    Then HTTP 200
    And 响应体为 JSON: { "code": "SUCCESS", "message": "成功" }

  Scenario: 处理失败响应
    Given 业务处理异常
    Then HTTP 200（微信要求）
    And 响应体为 JSON: { "code": "FAIL", "message": "处理失败" }
    And 微信会重试（最多10次，间隔递增）
```

### AC-10: 异常处理与告警
```gherkin
Feature: 异常处理
  Scenario: 数据库写入失败
    Given 支付记录更新失败（数据库异常）
    Then 返回 FAIL 让微信重试
    And 记录详细错误日志
    And 发送告警通知管理员

  Scenario: attach 解析失败
    Given attach 字段格式错误或数据缺失
    Then 记录异常日志（包含原始 attach）
    And 创建待人工处理的记录
    And 返回 SUCCESS（避免微信重试）
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - Webhook Controller** (AC: #1, #9)
  - [ ] 1.1 创建 `WechatPayWebhookController.java`
  - [ ] 1.2 实现 `POST /api/webhook/wechat/payment` 接口
  - [ ] 1.3 解析请求 Header (Wechatpay-Signature, Wechatpay-Timestamp, Wechatpay-Nonce)
  - [ ] 1.4 解密回调数据（使用 AES-256-GCM）
  - [ ] 1.5 配置接口不需要 JWT 认证（白名单）
  - [ ] 1.6 编写集成测试

- [ ] **Task 2: 后端 - 签名验证服务** (AC: #2, #3)
  - [ ] 2.1 创建 `WechatPaySignatureValidator.java`
  - [ ] 2.2 实现 `validateSignature(headers, body)` - SHA256withRSA 验证
  - [ ] 2.3 实现证书缓存与自动更新机制
  - [ ] 2.4 实现时间窗口验证（5分钟内有效）
  - [ ] 2.5 签名失败时发送安全告警
  - [ ] 2.6 编写单元测试（Mock 证书）

- [ ] **Task 3: 后端 - 幂等性服务** (AC: #4)
  - [ ] 3.1 创建 `PaymentCallbackIdempotentService.java`
  - [ ] 3.2 实现 `tryAcquireLock(orderNo)` - Redis SETNX
  - [ ] 3.3 设置锁过期时间 10 分钟（防死锁）
  - [ ] 3.4 实现 `releaseLock(orderNo)`
  - [ ] 3.5 编写幂等性测试

- [ ] **Task 4: 后端 - 支付回调业务逻辑** (AC: #5, #6, #7)
  - [ ] 4.1 创建 `PaymentCallbackService.java`
  - [ ] 4.2 实现 `processPaymentCallback(callbackData)`:
    - 解析 attach 获取业务数据
    - 乐观锁更新 payment_record
    - 创建 camp_member 记录
    - 生成 accessToken
    - 增加训练营报名人数
  - [ ] 4.3 使用 @Transactional 保证事务一致性
  - [ ] 4.4 编写单元测试

- [ ] **Task 5: 后端 - accessToken 服务** (AC: #7)
  - [ ] 5.1 创建 `AccessTokenService.java`
  - [ ] 5.2 实现 `generateToken(memberId, campId, campEndDate)`:
    - 生成 tk_ + UUID 格式
    - Redis 存储结构设计
    - TTL = 训练营结束 + 7 天
  - [ ] 5.3 实现 `validateToken(token)` - 供后续故事使用
  - [ ] 5.4 编写单元测试

- [ ] **Task 6: 后端 - 状态日志记录** (AC: #8)
  - [ ] 6.1 创建 `PaymentStatusLogMapper.java`
  - [ ] 6.2 创建 `BindStatusLogMapper.java`
  - [ ] 6.3 实现状态变更日志记录逻辑
  - [ ] 6.4 记录 trigger_source = 'wechat_webhook'

- [ ] **Task 7: 后端 - 异常处理与告警** (AC: #10)
  - [ ] 7.1 创建 `WebhookExceptionHandler.java`
  - [ ] 7.2 实现业务异常 vs 系统异常分类处理
  - [ ] 7.3 集成企业微信告警服务
  - [ ] 7.4 创建安全日志表 `security_alert_log`
  - [ ] 7.5 编写异常处理测试

- [ ] **Task 8: 后端 - 数据库优化** (AC: #5)
  - [ ] 8.1 确认 payment_record.order_no 唯一索引存在
  - [ ] 8.2 添加 version 字段支持乐观锁（如未存在）
  - [ ] 8.3 创建 transaction_id 索引

- [ ] **Task 9: 配置微信支付证书** (AC: #2)
  - [ ] 9.1 配置 application.yml:
    - `wechat.pay.api-v3-key` - API V3 密钥
    - `wechat.pay.cert-serial-no` - 证书序列号
    - `wechat.pay.private-key-path` - 商户私钥路径
    - `wechat.pay.notify-url` - 回调地址
  - [ ] 9.2 配置平台证书自动下载
  - [ ] 9.3 编写配置验证脚本

- [ ] **Task 10: 集成测试与验收** (AC: #全部)
  - [ ] 10.1 编写微信回调模拟测试
  - [ ] 10.2 测试签名验证成功/失败场景
  - [ ] 10.3 测试幂等性（重复回调）
  - [ ] 10.4 测试并发回调处理
  - [ ] 10.5 测试 attach 解析各种场景
  - [ ] 10.6 验证 accessToken 正确生成

---

## Dev Notes

### 业务流程概述

本故事处理微信支付成功后的回调通知，是支付流程的关键环节。

```
微信支付成功 → 微信服务器回调 POST /api/webhook/wechat/payment
     ↓
验证签名 (SHA256withRSA) → 验证时间窗口 (5分钟)
     ↓
Redis 分布式锁（幂等性检查）
     ↓
解析 attach 获取业务数据
     ↓
乐观锁更新 payment_record (pending → success)
     ↓
创建 camp_member 记录 (bind_status=completed)
     ↓
生成 accessToken (tk_ + UUID) 存入 Redis
     ↓
记录状态日志 → 返回 SUCCESS
```

### 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 签名验证 | SHA256withRSA | 微信支付 V3 API 强制要求 |
| 幂等机制 | Redis SETNX | 高性能，支持分布式，自动过期 |
| 并发控制 | 乐观锁 + 分布式锁 | 双重保障，防止并发更新 |
| accessToken 格式 | tk_ + UUID | 不可预测，符合项目规范 |
| 异常响应 | FAIL 让微信重试 | 系统异常时依赖微信重试机制 |

### 微信支付 V3 回调数据结构

**HTTP Header**:
```
Wechatpay-Timestamp: 1638329382
Wechatpay-Nonce: 5K8264ILTKCH16CQ2502SI8ZNMTM67VS
Wechatpay-Signature: CtcbzwtQjN8...
Wechatpay-Serial: 5157F09EFDC096...
```

**请求体（加密）**:
```json
{
  "id": "EV-2024...",
  "create_time": "2024-12-13T12:00:00+08:00",
  "resource_type": "encrypt-resource",
  "event_type": "TRANSACTION.SUCCESS",
  "resource": {
    "algorithm": "AEAD_AES_256_GCM",
    "ciphertext": "...(加密数据)...",
    "nonce": "...",
    "associated_data": "transaction"
  }
}
```

**解密后的支付数据**:
```json
{
  "transaction_id": "4200001234567890",
  "out_trade_no": "ord_a1b2c3d4-5678-90ab",
  "trade_type": "JSAPI",
  "trade_state": "SUCCESS",
  "trade_state_desc": "支付成功",
  "bank_type": "CMB_DEBIT",
  "attach": "{\"campId\":1,\"wechatUserId\":100,\"planetMemberNumber\":\"123456789\"}",
  "success_time": "2024-12-13T12:05:30+08:00",
  "payer": {
    "openid": "oUpF8xxx"
  },
  "amount": {
    "total": 9900,
    "payer_total": 9900,
    "currency": "CNY"
  }
}
```

### 代码实现参考

#### WechatPayWebhookController.java

```java
@RestController
@RequestMapping("/api/webhook/wechat")
@RequiredArgsConstructor
@Slf4j
public class WechatPayWebhookController {

    private final WechatPaySignatureValidator signatureValidator;
    private final PaymentCallbackService paymentCallbackService;

    /**
     * 微信支付回调
     */
    @PostMapping("/payment")
    public ResponseEntity<Map<String, String>> handlePaymentCallback(
            @RequestHeader("Wechatpay-Timestamp") String timestamp,
            @RequestHeader("Wechatpay-Nonce") String nonce,
            @RequestHeader("Wechatpay-Signature") String signature,
            @RequestHeader("Wechatpay-Serial") String serial,
            @RequestBody String body) {

        log.info("Received wechat payment callback, serial: {}", serial);

        try {
            // 1. 验证签名
            if (!signatureValidator.validate(timestamp, nonce, body, signature, serial)) {
                log.error("Signature validation failed");
                return ResponseEntity.ok(Map.of("code", "FAIL", "message", "签名验证失败"));
            }

            // 2. 验证时间窗口
            if (!signatureValidator.validateTimestamp(timestamp)) {
                log.warn("Timestamp validation failed, possible replay attack");
                return ResponseEntity.ok(Map.of("code", "FAIL", "message", "时间戳过期"));
            }

            // 3. 解密回调数据
            WechatPayCallback callback = parseAndDecrypt(body);

            // 4. 处理回调业务逻辑
            paymentCallbackService.processCallback(callback);

            return ResponseEntity.ok(Map.of("code", "SUCCESS", "message", "成功"));

        } catch (DuplicateCallbackException e) {
            // 重复回调，返回成功（幂等）
            log.info("Duplicate callback for orderNo: {}", e.getOrderNo());
            return ResponseEntity.ok(Map.of("code", "SUCCESS", "message", "成功"));

        } catch (BusinessException e) {
            // 业务异常，返回成功避免微信重试
            log.error("Business error: {}", e.getMessage());
            return ResponseEntity.ok(Map.of("code", "SUCCESS", "message", e.getMessage()));

        } catch (Exception e) {
            // 系统异常，返回失败让微信重试
            log.error("System error processing callback", e);
            return ResponseEntity.ok(Map.of("code", "FAIL", "message", "处理失败"));
        }
    }
}
```

#### WechatPaySignatureValidator.java

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class WechatPaySignatureValidator {

    @Value("${wechat.pay.api-v3-key}")
    private String apiV3Key;

    private final WechatPayCertificateManager certificateManager;

    /**
     * 验证微信支付 V3 签名
     */
    public boolean validate(String timestamp, String nonce, String body,
                           String signature, String serial) {
        try {
            // 1. 获取平台证书
            X509Certificate certificate = certificateManager.getCertificate(serial);
            if (certificate == null) {
                log.error("Certificate not found for serial: {}", serial);
                return false;
            }

            // 2. 构造验签名串
            String signMessage = timestamp + "\n" + nonce + "\n" + body + "\n";

            // 3. Base64 解码签名
            byte[] signatureBytes = Base64.getDecoder().decode(signature);

            // 4. SHA256withRSA 验签
            Signature sign = Signature.getInstance("SHA256withRSA");
            sign.initVerify(certificate);
            sign.update(signMessage.getBytes(StandardCharsets.UTF_8));

            return sign.verify(signatureBytes);

        } catch (Exception e) {
            log.error("Signature validation error", e);
            return false;
        }
    }

    /**
     * 验证时间戳（5分钟内有效）
     */
    public boolean validateTimestamp(String timestamp) {
        long callbackTime = Long.parseLong(timestamp);
        long currentTime = System.currentTimeMillis() / 1000;
        long diff = Math.abs(currentTime - callbackTime);

        if (diff > 300) {  // 5分钟
            log.warn("Timestamp out of window: {} seconds diff", diff);
            return false;
        }
        return true;
    }
}
```

#### PaymentCallbackIdempotentService.java

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentCallbackIdempotentService {

    private final StringRedisTemplate redisTemplate;

    private static final String LOCK_PREFIX = "payment:callback:";
    private static final int LOCK_EXPIRE_MINUTES = 10;

    /**
     * 尝试获取回调处理锁
     */
    public boolean tryAcquireLock(String orderNo) {
        String lockKey = LOCK_PREFIX + orderNo;
        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(
            lockKey,
            String.valueOf(System.currentTimeMillis()),
            LOCK_EXPIRE_MINUTES,
            TimeUnit.MINUTES
        );

        if (Boolean.FALSE.equals(acquired)) {
            log.warn("Duplicate callback detected for orderNo: {}", orderNo);
            return false;
        }

        log.info("Lock acquired for orderNo: {}", orderNo);
        return true;
    }

    /**
     * 释放锁
     */
    public void releaseLock(String orderNo) {
        String lockKey = LOCK_PREFIX + orderNo;
        redisTemplate.delete(lockKey);
        log.info("Lock released for orderNo: {}", orderNo);
    }
}
```

#### PaymentCallbackService.java

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentCallbackService {

    private final PaymentCallbackIdempotentService idempotentService;
    private final PaymentRecordMapper paymentRecordMapper;
    private final CampMemberMapper campMemberMapper;
    private final TrainingCampMapper trainingCampMapper;
    private final AccessTokenService accessTokenService;
    private final PaymentStatusLogMapper statusLogMapper;

    @Transactional(rollbackFor = Exception.class)
    public void processCallback(WechatPayCallback callback) {
        String orderNo = callback.getOutTradeNo();

        // 1. 幂等检查
        if (!idempotentService.tryAcquireLock(orderNo)) {
            throw new DuplicateCallbackException(orderNo);
        }

        try {
            // 2. 查询支付记录
            PaymentRecord record = paymentRecordMapper.selectByOrderNo(orderNo);
            if (record == null) {
                log.error("Payment record not found: {}", orderNo);
                throw new BusinessException("订单不存在");
            }

            // 3. 检查是否已处理
            if (!"pending".equals(record.getPayStatus())) {
                log.info("Payment already processed: {}, status: {}",
                        orderNo, record.getPayStatus());
                return;
            }

            // 4. 解析 attach
            AttachData attachData = parseAttach(callback.getAttach());

            // 5. 乐观锁更新支付记录
            int updated = paymentRecordMapper.updatePayStatusWithOptimisticLock(
                orderNo,
                callback.getTradeState().equalsIgnoreCase("SUCCESS") ? "success" : "failed",
                callback.getTransactionId(),
                callback.getSuccessTime(),
                record.getVersion()
            );

            if (updated == 0) {
                throw new OptimisticLockingFailureException("并发更新失败");
            }

            // 6. 支付成功时创建会员记录
            if ("SUCCESS".equalsIgnoreCase(callback.getTradeState())) {
                createCampMember(record, attachData, callback);
            }

            // 7. 记录状态日志
            logStatusChange(record.getId(), "pending",
                    callback.getTradeState().equalsIgnoreCase("SUCCESS") ? "success" : "failed",
                    "wechat_webhook");

            log.info("Payment callback processed successfully: {}", orderNo);

        } finally {
            idempotentService.releaseLock(orderNo);
        }
    }

    private void createCampMember(PaymentRecord record, AttachData attach,
                                  WechatPayCallback callback) {
        // 检查是否已存在会员记录
        if (campMemberMapper.existsByCampIdAndWechatUserId(
                attach.getCampId(), attach.getWechatUserId())) {
            log.info("Camp member already exists for campId: {}, wechatUserId: {}",
                    attach.getCampId(), attach.getWechatUserId());
            return;
        }

        // 创建会员记录
        CampMember member = new CampMember();
        member.setCampId(attach.getCampId());
        member.setWechatUserId(attach.getWechatUserId());
        member.setPlanetMemberNumber(attach.getPlanetMemberNumber());
        member.setBindStatus("completed");
        member.setBindMethod("h5_bindplanet");
        member.setPayStatus("success");
        member.setPaymentRecordId(record.getId());
        member.setCreatedAt(LocalDateTime.now());
        campMemberMapper.insert(member);

        // 生成 accessToken
        TrainingCamp camp = trainingCampMapper.selectById(attach.getCampId());
        String accessToken = accessTokenService.generateToken(
            member.getId(),
            attach.getCampId(),
            camp.getEndDate()
        );
        member.setAccessToken(accessToken);
        campMemberMapper.updateById(member);

        // 增加训练营报名人数
        trainingCampMapper.incrementEnrollCount(attach.getCampId());

        log.info("Camp member created: memberId={}, accessToken={}",
                member.getId(), accessToken);
    }

    private AttachData parseAttach(String attach) {
        try {
            return JsonUtils.parse(attach, AttachData.class);
        } catch (Exception e) {
            log.error("Failed to parse attach: {}", attach, e);
            throw new BusinessException("attach 解析失败");
        }
    }
}
```

#### AccessTokenService.java

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class AccessTokenService {

    private final StringRedisTemplate redisTemplate;

    private static final String TOKEN_PREFIX = "access_token:";

    /**
     * 生成访问票据
     */
    public String generateToken(Long memberId, Long campId, LocalDate campEndDate) {
        String token = "tk_" + UUID.randomUUID().toString();
        String key = TOKEN_PREFIX + token;

        // 计算 TTL（训练营结束 + 7 天）
        LocalDateTime expireAt = campEndDate.plusDays(7).atTime(23, 59, 59);
        long ttlSeconds = ChronoUnit.SECONDS.between(LocalDateTime.now(), expireAt);

        // 存储到 Redis
        Map<String, Object> tokenData = new HashMap<>();
        tokenData.put("memberId", memberId);
        tokenData.put("campId", campId);
        tokenData.put("expireAt", expireAt.toString());

        redisTemplate.opsForValue().set(
            key,
            JsonUtils.toJson(tokenData),
            ttlSeconds,
            TimeUnit.SECONDS
        );

        log.info("AccessToken generated: {}, expires at: {}", token, expireAt);
        return token;
    }

    /**
     * 验证访问票据
     */
    public AccessTokenData validateToken(String token) {
        String key = TOKEN_PREFIX + token;
        String data = redisTemplate.opsForValue().get(key);

        if (data == null) {
            throw new BusinessException(401, "票据无效或已过期");
        }

        return JsonUtils.parse(data, AccessTokenData.class);
    }
}
```

### 安全检查清单

- [ ] 微信支付 V3 签名验证实现正确
- [ ] 时间窗口验证（5分钟）防重放攻击
- [ ] Redis 分布式锁确保幂等性
- [ ] 数据库乐观锁防止并发更新
- [ ] 签名失败记录安全日志
- [ ] 敏感配置使用环境变量
- [ ] HTTPS 传输（Nginx 配置）
- [ ] 接口不需要 JWT 认证（添加到白名单）

### 微信回调重试策略

微信支付回调在收到 FAIL 响应时会重试：

| 重试次数 | 间隔时间 |
|----------|----------|
| 第1次 | 15秒 |
| 第2次 | 30秒 |
| 第3次 | 3分钟 |
| 第4次 | 10分钟 |
| 第5次 | 30分钟 |
| 第6-10次 | 1小时 |

### 错误码

| 错误码 | HTTP | 含义 | 处理 |
|--------|------|------|------|
| FAIL | 200 | 签名验证失败 | 记录安全日志，发送告警 |
| FAIL | 200 | 时间戳过期 | 拒绝处理 |
| FAIL | 200 | 系统异常 | 等待微信重试 |
| SUCCESS | 200 | 业务异常 | 记录日志，人工处理 |
| SUCCESS | 200 | 处理成功 | 正常流程 |

### 测试要点

**后端测试**:
1. `WechatPaySignatureValidatorTest` - Mock 证书，测试签名验证
2. `PaymentCallbackIdempotentServiceTest` - 测试分布式锁
3. `PaymentCallbackServiceTest` - 测试完整回调流程

**集成测试**:
1. 使用微信支付沙箱环境测试
2. 模拟重复回调验证幂等性
3. 模拟签名错误验证拒绝
4. 测试并发回调处理

---

## 项目结构

### 后端新增文件

```
backend/src/main/java/com/camp/
├── controller/
│   └── webhook/
│       └── WechatPayWebhookController.java    # 支付回调接口
├── service/
│   ├── PaymentCallbackService.java            # 回调业务逻辑
│   ├── PaymentCallbackIdempotentService.java  # 幂等性服务
│   ├── AccessTokenService.java                # 访问票据服务
│   └── WechatPaySignatureValidator.java       # 签名验证
├── manager/
│   └── WechatPayCertificateManager.java       # 证书管理
├── dto/
│   └── callback/
│       ├── WechatPayCallback.java             # 回调数据结构
│       └── AttachData.java                    # attach 解析结构
├── mapper/
│   ├── PaymentStatusLogMapper.java            # 支付状态日志
│   └── BindStatusLogMapper.java               # 绑定状态日志
├── exception/
│   └── DuplicateCallbackException.java        # 重复回调异常
└── config/
    └── WechatPayConfig.java                   # 微信支付配置
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP02-S04 微信支付下单 | ready-for-dev | 创建支付订单，attach 结构 |
| EP01-S03 训练营 CRUD | ready-for-dev | training_camp 表，enroll_count |
| 微信支付商户号配置 | 必须完成 | API V3 密钥、平台证书 |

### 后续依赖

本故事完成后，以下功能可以开始:
- EP02-S06 支付成功后群二维码展示
- EP02-S07 降级路径-用户填写绑定
- EP02-S09 支付轮询兜底机制

---

## References

| 文档 | 路径 | 相关章节 |
|------|------|----------|
| PRD | `docs/PRD.md` | FR2.5 微信支付Webhook回调处理 |
| 技术方案 | `docs/v1/design/技术方案.md` | 5.2.8 异常处理 |
| API 文档 | `docs/v1/api/接口文档.md` | Webhook 接口 |
| 支付安全 | `docs/v1/security/支付安全增强方案.md` | 签名验证、幂等处理、告警机制 |
| 状态枚举 | `docs/v1/design/状态枚举定义.md` | pay_status, bind_status |
| Epic 定义 | `docs/epics.md` | EP02-S05 |
| 前一故事 | `docs/sprint-artifacts/stories/2-4-wechat-payment.md` | 支付下单参考 |
| 微信支付文档 | https://pay.weixin.qq.com/docs/merchant/apis/jsapi-payment/payment-notice.html | 支付通知 |

---

## Dev Agent Record

### Context Reference
- Epic: EP02 会员报名与支付系统
- Story: EP02-S05 微信支付 Webhook 回调处理
- FR Coverage: FR2.5, FR3.1

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
| 前置条件 | EP02-S04 完成 |
| 覆盖 FR | FR2.5, FR3.1 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
