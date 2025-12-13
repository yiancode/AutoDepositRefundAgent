# Story 4.5: 微信退款执行

**Status**: ready-for-dev

---

## Story

**作为**系统，
**我希望**能够调用微信退款API执行退款，
**以便于**审核通过的退款能够自动发放到用户账户。

---

## 验收标准

### AC-1: 退款执行触发
```gherkin
Feature: 退款执行触发
  Scenario: 定时任务执行退款
    Given 系统配置了退款执行任务
    When 到达每小时整点
    Then 执行 RefundExecuteTask
    And 获取 audit_status=approved AND refund_status=pending 的记录
    And 逐个调用微信退款API

  Scenario: 审核通过后立即执行
    Given 管理员审核通过退款
    And 配置了即时退款模式
    When 审核完成
    Then 异步触发退款执行
    And 不等待定时任务

  Scenario: 手动触发单个退款
    Given 管理员在退款列表页
    And 退款状态为 approved
    When POST /api/admin/refunds/{id}/execute
    Then 立即执行该退款
```

### AC-2: 微信退款API调用
```gherkin
Feature: 微信退款API调用
  Scenario: 调用退款API成功
    Given refund_record.refund_status = pending
    When 调用微信退款 API /v3/refund/domestic/refunds
    Then 发送请求:
      | 参数 | 值 |
      | out_trade_no | 原支付订单号 |
      | out_refund_no | 退款单号 |
      | amount.refund | 退款金额(分) |
      | amount.total | 原订单金额(分) |
    And 更新 refund_status = processing

  Scenario: 退款单号生成
    Given 执行退款
    Then 生成退款单号格式: REF_YYYYMMDD_HHMMSS_随机6位
    And 保证唯一性

  Scenario: API返回成功
    Given 微信退款API返回成功
    Then 等待异步回调
    And refund_status 保持 processing
```

### AC-3: 退款回调处理
```gherkin
Feature: 退款结果回调
  Scenario: 接收退款成功回调
    Given 微信发送退款结果通知
    When POST /api/webhook/wechat/refund
    Then 验证签名
    And 解密通知内容
    And 根据 refund_status 处理:
      - SUCCESS: refund_status = success
      - CLOSED: refund_status = failed
      - ABNORMAL: refund_status = failed

  Scenario: 退款成功处理
    Given 回调 refund_status = SUCCESS
    Then 更新 refund_record:
      | 字段 | 值 |
      | refund_status | success |
      | wechat_refund_id | 微信退款单号 |
      | execute_time | 当前时间 |
    And 记录到 refund_status_log
    And 触发退款成功通知

  Scenario: 幂等性处理
    Given 收到重复的退款回调
    And 退款已处理为 success
    When 处理回调
    Then 返回成功响应
    And 不重复处理
```

### AC-4: 失败自动重试
```gherkin
Feature: 退款失败重试
  Scenario: 第一次失败
    Given 微信退款API调用失败
    And retry_count = 0
    When 处理失败
    Then 等待 5 秒后重试
    And retry_count = 1

  Scenario: 第二次失败
    Given 重试仍然失败
    And retry_count = 1
    When 处理失败
    Then 等待 10 秒后重试
    And retry_count = 2

  Scenario: 超过重试次数
    Given retry_count >= 3
    When 处理失败
    Then refund_status = failed
    And 发送企业微信告警
    And 标记为需人工处理

  Scenario: 指数退避策略
    Given 重试间隔: 5s, 10s, 20s
    Then 使用指数退避策略
    And 最大重试次数 3 次
```

### AC-5: 手动重试接口
```gherkin
Feature: 手动重试
  Scenario: 管理员手动重试失败退款
    Given 退款状态为 failed
    When POST /api/admin/refunds/{id}/retry
    Then 重置 retry_count = 0
    And refund_status = processing
    And 重新执行退款
    And 记录操作日志

  Scenario: 非失败状态不能重试
    Given refund_status != failed
    When 调用重试接口
    Then 返回错误 "当前状态不允许重试"

  Scenario: 重试次数限制
    Given 配置最大手动重试次数为 5
    And 已手动重试 5 次
    When 再次调用重试接口
    Then 返回错误 "已达到最大重试次数"
```

### AC-6: 退款进度查询
```gherkin
Feature: 退款进度查询
  Scenario: 主动查询退款状态
    Given 退款状态为 processing
    And 超过预期时间未收到回调
    When 定时任务查询退款状态
    Then 调用微信查询退款API
    And 根据返回状态更新本地记录

  Scenario: 查询超时处理
    Given 退款 processing 超过 24 小时
    Then 发送告警通知
    And 标记为需人工核查
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - 微信退款Manager** (AC: #2)
  - [ ] 1.1 创建 `WechatPayRefundManager.java`
  - [ ] 1.2 实现退款API调用
  - [ ] 1.3 实现退款单号生成
  - [ ] 1.4 实现签名和加密
  - [ ] 1.5 编写单元测试

- [ ] **Task 2: 后端 - 退款执行Service** (AC: #1, #2)
  - [ ] 2.1 创建 `RefundExecuteService.java`
  - [ ] 2.2 实现 `executeRefund(refundId)`
  - [ ] 2.3 实现批量执行逻辑
  - [ ] 2.4 实现异步执行支持
  - [ ] 2.5 编写单元测试

- [ ] **Task 3: 后端 - 定时执行任务** (AC: #1)
  - [ ] 3.1 创建 `RefundExecuteTask.java`
  - [ ] 3.2 配置执行周期
  - [ ] 3.3 实现待执行记录查询
  - [ ] 3.4 添加任务开关

- [ ] **Task 4: 后端 - 退款回调处理** (AC: #3)
  - [ ] 4.1 创建 `WechatRefundWebhookController.java`
  - [ ] 4.2 实现 `POST /api/webhook/wechat/refund`
  - [ ] 4.3 实现签名验证
  - [ ] 4.4 实现幂等处理
  - [ ] 4.5 编写接口测试

- [ ] **Task 5: 后端 - 失败重试机制** (AC: #4)
  - [ ] 5.1 实现指数退避策略
  - [ ] 5.2 实现自动重试逻辑
  - [ ] 5.3 实现超次数告警
  - [ ] 5.4 编写重试测试

- [ ] **Task 6: 后端 - 手动重试接口** (AC: #5)
  - [ ] 6.1 实现 `POST /api/admin/refunds/{id}/retry`
  - [ ] 6.2 添加状态和次数校验
  - [ ] 6.3 记录操作日志
  - [ ] 6.4 编写接口测试

- [ ] **Task 7: 后端 - 退款状态查询** (AC: #6)
  - [ ] 7.1 实现微信退款查询API调用
  - [ ] 7.2 创建超时检查定时任务
  - [ ] 7.3 实现告警通知

- [ ] **Task 8: 集成测试与验收** (AC: #全部)
  - [ ] 8.1 测试退款API调用（沙箱环境）
  - [ ] 8.2 测试回调处理
  - [ ] 8.3 测试自动重试
  - [ ] 8.4 测试手动重试
  - [ ] 8.5 测试告警通知

---

## Dev Notes

### 业务流程概述

本故事实现退款的执行和结果处理。

```
退款执行触发:
├── 定时任务 (每小时)
├── 审核通过后异步
└── 手动触发
     ↓
查询待执行退款 (audit_status=approved, refund_status=pending)
     ↓
对每条记录:
├── 生成退款单号
├── 调用微信退款API
├── 更新 refund_status = processing
     ↓
等待微信回调:
├── POST /api/webhook/wechat/refund
├── 验证签名、解密
├── 根据状态更新:
│   ├── SUCCESS → success
│   └── CLOSED/ABNORMAL → failed
     ↓
失败处理:
├── retry_count < 3: 自动重试 (5s, 10s, 20s)
└── retry_count >= 3: 标记失败、发送告警
```

### 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 执行方式 | 定时+异步 | 控制并发，避免超限 |
| 重试策略 | 指数退避 | 避免频繁请求 |
| 最大重试 | 3次 | 微信建议值 |
| 回调处理 | 幂等设计 | 可能重复通知 |

### 微信退款API参考

> **API 文档**: https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_1_9.shtml

**请求地址**: `POST https://api.mch.weixin.qq.com/v3/refund/domestic/refunds`

**请求参数**:
```json
{
  "out_trade_no": "ORD_20251210_180000_123456",
  "out_refund_no": "REF_20251231_100000_654321",
  "reason": "训练营打卡达标退款",
  "amount": {
    "refund": 9900,
    "total": 9900,
    "currency": "CNY"
  }
}
```

**响应参数**:
```json
{
  "refund_id": "50000000001",
  "out_refund_no": "REF_20251231_100000_654321",
  "transaction_id": "4200001234202512100001234567",
  "out_trade_no": "ORD_20251210_180000_123456",
  "channel": "ORIGINAL",
  "user_received_account": "招商银行信用卡0403",
  "status": "PROCESSING",
  "amount": {
    "total": 9900,
    "refund": 9900,
    "payer_total": 9900,
    "payer_refund": 9900
  }
}
```

### 代码实现参考

#### WechatPayRefundManager.java

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class WechatPayRefundManager {

    private final WechatPayConfig config;
    private final WechatPayClient payClient;

    /**
     * 申请退款
     */
    public RefundResult applyRefund(RefundRequest request) {
        log.info("申请退款: {}", request.getOutRefundNo());

        try {
            // 构建请求
            Map<String, Object> params = new HashMap<>();
            params.put("out_trade_no", request.getOutTradeNo());
            params.put("out_refund_no", request.getOutRefundNo());
            params.put("reason", request.getReason());
            params.put("amount", Map.of(
                "refund", request.getRefundAmount(),
                "total", request.getTotalAmount(),
                "currency", "CNY"
            ));

            // 调用API
            String response = payClient.post(
                "/v3/refund/domestic/refunds",
                JsonUtils.toJson(params)
            );

            // 解析响应
            Map<String, Object> result = JsonUtils.parseMap(response);
            String status = (String) result.get("status");
            String refundId = (String) result.get("refund_id");

            return RefundResult.builder()
                .success(true)
                .outRefundNo(request.getOutRefundNo())
                .wechatRefundId(refundId)
                .status(status)
                .build();

        } catch (WechatPayException e) {
            log.error("微信退款失败: {}", e.getMessage());
            return RefundResult.builder()
                .success(false)
                .outRefundNo(request.getOutRefundNo())
                .errorCode(e.getCode())
                .errorMessage(e.getMessage())
                .build();
        }
    }

    /**
     * 查询退款状态
     */
    public RefundQueryResult queryRefund(String outRefundNo) {
        String response = payClient.get("/v3/refund/domestic/refunds/" + outRefundNo);
        Map<String, Object> result = JsonUtils.parseMap(response);
        return RefundQueryResult.from(result);
    }

    /**
     * 生成退款单号
     */
    public String generateOutRefundNo() {
        String timestamp = LocalDateTime.now()
            .format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String random = String.format("%06d", new Random().nextInt(1000000));
        return "REF_" + timestamp + "_" + random;
    }
}
```

#### RefundExecuteService.java

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class RefundExecuteServiceImpl implements RefundExecuteService {

    private final RefundRecordMapper refundMapper;
    private final PaymentRecordMapper paymentMapper;
    private final WechatPayRefundManager refundManager;
    private final RefundStatusLogService statusLogService;
    private final WechatNotifyManager notifyManager;

    @Value("${refund.execute.max-retry:3}")
    private int maxRetry;

    /**
     * 执行单个退款
     */
    @Override
    @Transactional
    public RefundExecuteResult executeRefund(Long refundId) {
        RefundRecord refund = refundMapper.selectById(refundId);
        if (refund == null) {
            throw new BusinessException(404, "退款记录不存在");
        }

        // 校验状态
        if (!AuditStatus.APPROVED.equals(refund.getAuditStatus())) {
            throw new BusinessException(400, "退款未审核通过");
        }
        if (RefundStatus.SUCCESS.equals(refund.getRefundStatus())) {
            throw new BusinessException(400, "退款已成功");
        }
        if (RefundStatus.PROCESSING.equals(refund.getRefundStatus())) {
            throw new BusinessException(400, "退款处理中");
        }

        // 获取支付记录
        PaymentRecord payment = paymentMapper.selectById(refund.getPaymentRecordId());
        if (payment == null) {
            throw new BusinessException(500, "支付记录不存在");
        }

        // 生成退款单号
        String outRefundNo = refundManager.generateOutRefundNo();

        // 更新状态为处理中
        refund.setRefundStatus(RefundStatus.PROCESSING);
        refund.setOutRefundNo(outRefundNo);
        refundMapper.updateById(refund);

        statusLogService.log(refund.getId(), RefundStatus.PENDING.getValue(),
            RefundStatus.PROCESSING.getValue(), "开始执行退款");

        // 调用微信退款API
        RefundRequest request = RefundRequest.builder()
            .outTradeNo(payment.getOutTradeNo())
            .outRefundNo(outRefundNo)
            .refundAmount(convertToFen(refund.getRefundAmount()))
            .totalAmount(convertToFen(payment.getPayAmount()))
            .reason("训练营打卡达标退款")
            .build();

        RefundResult result = refundManager.applyRefund(request);

        if (result.isSuccess()) {
            refund.setWechatRefundId(result.getWechatRefundId());
            refundMapper.updateById(refund);

            log.info("退款申请成功: {}, 等待回调", outRefundNo);
            return RefundExecuteResult.processing(refundId, outRefundNo);

        } else {
            // 退款失败，触发重试
            return handleRefundFailure(refund, result.getErrorMessage());
        }
    }

    /**
     * 处理退款失败
     */
    private RefundExecuteResult handleRefundFailure(RefundRecord refund, String errorMessage) {
        int retryCount = refund.getRetryCount() + 1;
        refund.setRetryCount(retryCount);
        refund.setErrorMessage(errorMessage);

        if (retryCount >= maxRetry) {
            // 超过重试次数
            refund.setRefundStatus(RefundStatus.FAILED);
            refundMapper.updateById(refund);

            statusLogService.log(refund.getId(), RefundStatus.PROCESSING.getValue(),
                RefundStatus.FAILED.getValue(), "超过重试次数: " + errorMessage);

            // 发送告警
            notifyManager.sendRefundFailedAlert(refund);

            return RefundExecuteResult.failed(refund.getId(), errorMessage);

        } else {
            // 等待重试
            refund.setRefundStatus(RefundStatus.PENDING);
            refundMapper.updateById(refund);

            // 计算重试延迟
            int delay = (int) Math.pow(2, retryCount) * 5; // 5s, 10s, 20s

            log.info("退款失败，{}秒后重试，当前重试次数: {}", delay, retryCount);

            return RefundExecuteResult.retrying(refund.getId(), retryCount, delay);
        }
    }

    private int convertToFen(BigDecimal amount) {
        return amount.multiply(new BigDecimal("100")).intValue();
    }
}
```

#### WechatRefundWebhookController.java

```java
@RestController
@RequestMapping("/api/webhook/wechat")
@RequiredArgsConstructor
@Slf4j
public class WechatRefundWebhookController {

    private final WechatPayVerifier verifier;
    private final RefundCallbackService callbackService;

    /**
     * 微信退款结果通知
     */
    @PostMapping("/refund")
    public Map<String, String> handleRefundNotify(
            @RequestHeader("Wechatpay-Timestamp") String timestamp,
            @RequestHeader("Wechatpay-Nonce") String nonce,
            @RequestHeader("Wechatpay-Signature") String signature,
            @RequestHeader("Wechatpay-Serial") String serial,
            @RequestBody String body) {

        log.info("收到退款回调通知");

        // 1. 验证签名
        if (!verifier.verify(timestamp, nonce, body, signature)) {
            log.error("退款回调签名验证失败");
            return Map.of("code", "FAIL", "message", "签名验证失败");
        }

        try {
            // 2. 解析通知内容
            Map<String, Object> notification = JsonUtils.parseMap(body);
            Map<String, Object> resource = (Map<String, Object>) notification.get("resource");

            // 3. 解密数据
            String decryptedData = verifier.decryptResource(
                (String) resource.get("ciphertext"),
                (String) resource.get("associated_data"),
                (String) resource.get("nonce")
            );

            Map<String, Object> refundData = JsonUtils.parseMap(decryptedData);

            // 4. 处理回调
            callbackService.handleRefundCallback(refundData);

            return Map.of("code", "SUCCESS", "message", "成功");

        } catch (Exception e) {
            log.error("处理退款回调失败", e);
            return Map.of("code", "FAIL", "message", e.getMessage());
        }
    }
}
```

#### RefundCallbackService.java

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class RefundCallbackService {

    private final RefundRecordMapper refundMapper;
    private final RefundStatusLogService statusLogService;
    private final NotificationService notificationService;

    @Transactional
    public void handleRefundCallback(Map<String, Object> refundData) {
        String outRefundNo = (String) refundData.get("out_refund_no");
        String refundId = (String) refundData.get("refund_id");
        String refundStatus = (String) refundData.get("refund_status");

        log.info("处理退款回调: outRefundNo={}, status={}", outRefundNo, refundStatus);

        // 查询退款记录
        RefundRecord refund = refundMapper.selectByOutRefundNo(outRefundNo);
        if (refund == null) {
            log.warn("退款记录不存在: {}", outRefundNo);
            return;
        }

        // 幂等检查
        if (RefundStatus.SUCCESS.equals(refund.getRefundStatus()) ||
            RefundStatus.FAILED.equals(refund.getRefundStatus())) {
            log.info("退款已处理，跳过: {}", outRefundNo);
            return;
        }

        String oldStatus = refund.getRefundStatus().getValue();
        RefundStatus newStatus;
        String reason;

        switch (refundStatus) {
            case "SUCCESS":
                newStatus = RefundStatus.SUCCESS;
                reason = "退款成功";
                refund.setWechatRefundId(refundId);
                refund.setExecuteTime(LocalDateTime.now());
                // 触发成功通知
                notificationService.sendRefundSuccessNotification(refund);
                break;

            case "CLOSED":
            case "ABNORMAL":
                newStatus = RefundStatus.FAILED;
                reason = "退款" + (refundStatus.equals("CLOSED") ? "关闭" : "异常");
                break;

            default:
                log.warn("未知退款状态: {}", refundStatus);
                return;
        }

        refund.setRefundStatus(newStatus);
        refundMapper.updateById(refund);

        statusLogService.log(refund.getId(), oldStatus, newStatus.getValue(), reason);

        log.info("退款回调处理完成: {}", outRefundNo);
    }
}
```

#### RefundExecuteTask.java

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class RefundExecuteTask {

    private final RefundRecordMapper refundMapper;
    private final RefundExecuteService executeService;

    @Value("${refund.execute.enabled:true}")
    private boolean enabled;

    @Value("${refund.execute.batch-size:10}")
    private int batchSize;

    /**
     * 每小时执行待处理退款
     */
    @Scheduled(cron = "${refund.execute.cron:0 0 * * * ?}")
    public void executePendingRefunds() {
        if (!enabled) {
            log.info("退款执行任务已禁用");
            return;
        }

        log.info("开始执行待处理退款");

        // 查询待执行记录
        List<RefundRecord> pendingRefunds = refundMapper.selectPendingForExecute(batchSize);

        int success = 0;
        int failed = 0;

        for (RefundRecord refund : pendingRefunds) {
            try {
                RefundExecuteResult result = executeService.executeRefund(refund.getId());
                if (result.isProcessing()) {
                    success++;
                } else {
                    failed++;
                }
            } catch (Exception e) {
                log.error("执行退款失败: {}", refund.getId(), e);
                failed++;
            }

            // 控制请求频率
            try {
                Thread.sleep(1000); // 每秒最多1笔
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        log.info("退款执行任务完成: 成功={}, 失败={}", success, failed);
    }
}
```

### 配置项

```yaml
wechat:
  pay:
    mch-id: ${WECHAT_PAY_MCH_ID}
    api-key: ${WECHAT_PAY_API_KEY}
    cert-path: ${WECHAT_PAY_CERT_PATH}
    notify-url: https://api.example.com/api/webhook/wechat/refund

refund:
  execute:
    enabled: true
    cron: "0 0 * * * ?"   # 每小时整点
    batch-size: 10        # 每批次处理数
    max-retry: 3          # 最大自动重试次数
    manual-max-retry: 5   # 最大手动重试次数
```

### 安全检查清单

- [ ] API密钥安全存储（环境变量）
- [ ] 回调签名严格验证
- [ ] 退款金额与支付金额校验
- [ ] 幂等性处理防重复退款
- [ ] 敏感信息日志脱敏
- [ ] HTTPS 通信

### 测试要点

**后端测试**:
1. `WechatPayRefundManagerTest` - Mock微信API测试
2. `RefundExecuteServiceTest` - 测试执行逻辑
3. `RefundCallbackServiceTest` - 测试回调处理
4. 测试重试机制
5. 测试幂等性

**集成测试**:
1. 微信沙箱环境测试
2. 端到端退款流程测试
3. 回调签名验证测试

---

## 项目结构

### 后端新增/修改文件

```
backend/src/main/java/com/camp/
├── controller/
│   └── webhook/
│       └── WechatRefundWebhookController.java  # 新增退款回调控制器
├── manager/
│   └── WechatPayRefundManager.java             # 新增微信退款Manager
├── service/
│   ├── RefundExecuteService.java               # 新增退款执行服务
│   ├── RefundCallbackService.java              # 新增回调处理服务
│   └── impl/
│       ├── RefundExecuteServiceImpl.java       # 新增
│       └── RefundCallbackServiceImpl.java      # 新增
├── schedule/
│   └── RefundExecuteTask.java                  # 新增定时任务
├── dto/
│   ├── RefundRequest.java                      # 新增退款请求
│   └── RefundResult.java                       # 新增退款结果
└── vo/
    └── RefundExecuteResult.java                # 新增执行结果 VO
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP04-S04 退款审核 | ready-for-dev | approved 退款来源 |
| EP02-S05 支付记录 | ready-for-dev | 原订单信息 |
| 微信支付配置 | 必须完成 | 商户号、API密钥、证书 |

### 后续依赖

本故事完成后:
- EP04-S06 退款通知（通知退款结果）
- EP06-S05 异常处理（复用重试机制）

---

## References

| 文档 | 路径 | 相关章节 |
|------|------|----------|
| PRD | `docs/PRD.md` | 6.1.3 退款流程 |
| 接口文档 | `docs/v1/api/接口文档.md` | 11.2 退款结果通知 |
| 安全方案 | `docs/v1/security/支付安全增强方案.md` | 退款安全 |
| Epic 定义 | `docs/epics.md` | EP04-S05 |
| 前一故事 | `docs/sprint-artifacts/stories/4-4-refund-review.md` | 退款审核 |

---

## Dev Agent Record

### Context Reference
- Epic: EP04 身份匹配与退款流程
- Story: EP04-S05 微信退款执行
- FR Coverage: FR6.5, FR6.6

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
| 优先级 | P1 |
| Epic | EP04 |
| 前置条件 | EP04-S04 完成 |
| 覆盖 FR | FR6.5, FR6.6 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
