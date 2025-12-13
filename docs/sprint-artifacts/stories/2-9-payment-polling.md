# Story 2.9: 支付轮询兜底机制

**Status**: ready-for-dev

---

## Story

**作为**系统，
**我希望**通过定时轮询微信支付记录来补录缺失的Webhook回调，
**以便于**确保所有支付记录都被正确处理，即使在Webhook异常时也不遗漏。

---

## 验收标准

### AC-1: 定时任务配置
```gherkin
Feature: 支付轮询任务
  Scenario: 定时任务自动执行
    Given 系统配置了支付轮询任务
    When 到达每小时整点
    Then 自动执行 PaymentPollingTask
    And 记录任务开始时间和结束时间
    And 使用 Redis 分布式锁防止并发

  Scenario: 任务开关控制
    Given 配置 camp.task.payment-polling.enabled=false
    When 任务触发时间到达
    Then 跳过执行
    And 记录跳过日志
```

### AC-2: 调用微信查询接口
```gherkin
Feature: 微信支付查询
  Scenario: 查询指定时间范围的支付记录
    Given 配置查询时间范围为过去 2 小时
    When 执行轮询任务
    Then 调用微信商户平台账单查询 API
    And 请求参数包含:
      | 字段 | 值 |
      | bill_type | ALL |
      | bill_date | 当天日期 |
    And 解析返回的账单明细

  Scenario: 微信接口异常
    Given 微信接口返回异常
    When 解析失败
    Then 记录错误日志
    And 发送告警通知
    And 任务标记为失败
```

### AC-3: 补录缺失记录
```gherkin
Feature: 补录支付记录
  Scenario: 发现缺失的支付记录
    Given 微信账单中存在 transaction_id=xxx
    And 系统 payment_record 表中无此记录
    When 补录该记录
    Then 创建 payment_record:
      | 字段 | 值 |
      | order_no | 微信 out_trade_no |
      | transaction_id | 微信 transaction_id |
      | pay_status | success |
      | pay_time | 微信支付时间 |
      | source | polling |
    And 创建 camp_member 记录（bind_status=pending）
    And 发送绑定提醒通知给用户

  Scenario: 记录已存在不重复处理
    Given 系统已有该 transaction_id 的记录
    When 轮询任务发现该记录
    Then 跳过处理
    And 不产生重复数据
```

### AC-4: 幂等性保证
```gherkin
Feature: 幂等性
  Scenario: 按 transaction_id 判重
    Given 轮询发现支付记录
    When 检查 payment_record 表
    And 存在相同 transaction_id
    Then 跳过该记录
    And 记录跳过日志

  Scenario: 按 out_trade_no 判重
    Given 轮询发现支付记录
    When 检查 payment_record 表
    And 存在相同 order_no (out_trade_no)
    And 状态为 success
    Then 跳过该记录
```

### AC-5: source 字段标记
```gherkin
Feature: 记录来源标记
  Scenario: 区分记录来源
    Given 支付记录可能来自 Webhook 或轮询
    When 轮询补录记录
    Then source = 'polling'
    And 用于后续统计分析

  Scenario: 统计来源分布
    Given 管理员查看支付记录
    When 查询 source 字段
    Then 可以统计 Webhook vs Polling 的比例
    And 判断 Webhook 可靠性
```

### AC-6: 绑定状态处理
```gherkin
Feature: 补录记录的绑定状态
  Scenario: 设置待绑定状态
    Given 轮询补录了支付记录
    And 无法从微信账单获取用户身份信息
    When 创建 camp_member 记录
    Then bind_status = pending
    And bind_deadline = 当前时间 + 7 天
    And 生成 accessToken

  Scenario: 发送绑定提醒
    Given 补录记录成功
    When 创建 camp_member 完成
    Then 发送绑定链接给用户（如有联系方式）
    Or 等待用户主动绑定
```

### AC-7: 分布式锁
```gherkin
Feature: 分布式锁
  Scenario: 获取锁成功
    Given 没有其他实例在执行
    When 尝试获取分布式锁
    Then 获取成功
    And 执行轮询任务
    And 任务完成后释放锁

  Scenario: 获取锁失败
    Given 其他实例正在执行
    When 尝试获取分布式锁
    Then 获取失败
    And 跳过本次执行
    And 记录跳过日志
```

### AC-8: 异常处理
```gherkin
Feature: 异常处理
  Scenario: 单条记录处理失败
    Given 轮询发现多条缺失记录
    And 其中一条处理失败
    When 捕获异常
    Then 记录失败记录详情
    And 继续处理其他记录
    And 任务结束后汇总失败数

  Scenario: 微信接口限流
    Given 调用微信接口频率过高
    When 返回限流错误
    Then 记录限流日志
    And 等待一段时间后重试
    And 最多重试 3 次
```

### AC-9: 任务执行日志
```gherkin
Feature: 任务日志
  Scenario: 记录执行详情
    Given 执行支付轮询任务
    When 任务完成
    Then 记录到 operation_log:
      | 字段 | 值 |
      | operation_type | payment_polling |
      | total_from_wechat | 微信返回记录数 |
      | total_missing | 缺失记录数 |
      | total_created | 成功补录数 |
      | total_skipped | 跳过记录数 |
      | total_failed | 失败记录数 |
      | execution_time | 执行耗时(ms) |
```

### AC-10: 监控告警
```gherkin
Feature: 监控告警
  Scenario: 缺失记录过多告警
    Given 单次轮询发现缺失记录 > 10 条
    When 补录完成
    Then 发送告警通知管理员
    And 提示 Webhook 可能存在问题

  Scenario: 任务执行失败告警
    Given 任务执行过程中发生异常
    When 异常未能恢复
    Then 发送告警通知
    And 包含错误详情和建议操作
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - 定时任务框架** (AC: #1, #7)
  - [ ] 1.1 创建 `PaymentPollingTask.java`
  - [ ] 1.2 配置 `@Scheduled(cron = "0 0 * * * ?")`（每小时整点）
  - [ ] 1.3 实现 Redis 分布式锁
  - [ ] 1.4 添加任务开关配置
  - [ ] 1.5 编写单元测试

- [ ] **Task 2: 后端 - 微信账单查询封装** (AC: #2)
  - [ ] 2.1 在 `WechatPayManager.java` 添加 `downloadBill()`
  - [ ] 2.2 调用微信商户平台账单下载 API
  - [ ] 2.3 解析 CSV 格式账单数据
  - [ ] 2.4 实现重试机制（限流场景）
  - [ ] 2.5 编写单元测试

- [ ] **Task 3: 后端 - 补录服务实现** (AC: #3, #4, #5)
  - [ ] 3.1 创建 `PaymentPollingService.java`
  - [ ] 3.2 实现 `pollAndReconcile()`:
    - 调用微信查询接口
    - 对比数据库记录
    - 补录缺失记录
  - [ ] 3.3 实现幂等性检查（按 transaction_id）
  - [ ] 3.4 设置 source = 'polling'
  - [ ] 3.5 编写单元测试

- [ ] **Task 4: 后端 - 会员记录创建** (AC: #6)
  - [ ] 4.1 补录时创建 camp_member（bind_status=pending）
  - [ ] 4.2 设置 bind_deadline
  - [ ] 4.3 生成 accessToken
  - [ ] 4.4 尝试发送绑定提醒（如有联系方式）

- [ ] **Task 5: 后端 - 异常处理** (AC: #8)
  - [ ] 5.1 实现单条记录异常隔离
  - [ ] 5.2 实现重试机制
  - [ ] 5.3 记录失败记录列表
  - [ ] 5.4 任务结束汇总失败数

- [ ] **Task 6: 后端 - 日志与监控** (AC: #9, #10)
  - [ ] 6.1 实现任务执行日志记录
  - [ ] 6.2 实现缺失记录过多告警
  - [ ] 6.3 实现任务失败告警
  - [ ] 6.4 集成企业微信通知

- [ ] **Task 7: 后端 - 数据库更新** (AC: #5)
  - [ ] 7.1 确认 payment_record.source 字段存在
  - [ ] 7.2 添加 source 字段索引（可选）
  - [ ] 7.3 添加 transaction_id 唯一索引

- [ ] **Task 8: 后端 - 配置管理** (AC: #1, #2)
  - [ ] 8.1 添加配置项:
    ```yaml
    camp:
      task:
        payment-polling:
          enabled: true
          cron: "0 0 * * * ?"
          time-range-hours: 2
          retry-times: 3
          alert-threshold: 10
    ```
  - [ ] 8.2 支持动态配置更新

- [ ] **Task 9: 集成测试与验收** (AC: #全部)
  - [ ] 9.1 测试定时任务触发
  - [ ] 9.2 测试微信接口调用
  - [ ] 9.3 测试补录完整流程
  - [ ] 9.4 测试幂等性
  - [ ] 9.5 测试异常场景
  - [ ] 9.6 测试告警通知

---

## Dev Notes

### 业务流程概述

本故事实现支付轮询兜底机制，确保在Webhook失败时不遗漏支付记录。

```
每小时整点触发
     ↓
获取 Redis 分布式锁
     ↓
调用微信账单查询 API（过去2小时）
     ↓
解析账单明细
     ↓
逐条对比数据库（按 transaction_id）
     ↓
发现缺失记录 → 补录 payment_record
     ↓
创建 camp_member (bind_status=pending)
     ↓
生成 accessToken
     ↓
发送绑定提醒（如有联系方式）
     ↓
记录执行日志
     ↓
缺失过多 → 发送告警
     ↓
释放分布式锁
```

### 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 执行频率 | 每小时 | 及时发现缺失，不过于频繁 |
| 查询范围 | 过去2小时 | 覆盖可能的延迟，避免重复查询 |
| 判重字段 | transaction_id | 微信支付唯一标识 |
| source 标记 | 'polling' | 区分记录来源，便于分析 |
| 告警阈值 | 10条 | 单次发现超过10条缺失触发告警 |

### 微信账单查询 API

**请求**:
```
GET https://api.mch.weixin.qq.com/v3/bill/tradebill
?bill_date=2025-12-13
&bill_type=ALL
```

**响应**:
```json
{
  "hash_type": "SHA1",
  "hash_value": "xxx",
  "download_url": "https://api.mch.weixin.qq.com/v3/billdownload/file?token=xxx"
}
```

**账单格式 (CSV)**:
```
交易时间,公众账号ID,商户号,子商户号,设备号,微信订单号,商户订单号,用户标识,交易类型,交易状态,付款银行,货币种类,总金额,代金券或立减优惠金额,微信退款单号,商户退款单号,退款金额,代金券或立减优惠退款金额,退款类型,退款状态,商品名称,商户数据包,手续费,费率
```

### 代码实现参考

#### PaymentPollingTask.java

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentPollingTask {

    private final PaymentPollingService pollingService;
    private final StringRedisTemplate redisTemplate;

    @Value("${camp.task.payment-polling.enabled:true}")
    private boolean enabled;

    private static final String LOCK_KEY = "task:payment_polling:lock";
    private static final int LOCK_EXPIRE_SECONDS = 600; // 10分钟

    /**
     * 每小时整点执行支付轮询
     */
    @Scheduled(cron = "${camp.task.payment-polling.cron:0 0 * * * ?}")
    public void pollPayments() {
        if (!enabled) {
            log.info("Payment polling task is disabled");
            return;
        }

        // 获取分布式锁
        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(
            LOCK_KEY,
            String.valueOf(System.currentTimeMillis()),
            LOCK_EXPIRE_SECONDS,
            TimeUnit.SECONDS
        );

        if (Boolean.FALSE.equals(acquired)) {
            log.info("Payment polling task is running on another instance, skip");
            return;
        }

        long startTime = System.currentTimeMillis();
        log.info("Payment polling task started");

        try {
            PollingResult result = pollingService.pollAndReconcile();
            log.info("Payment polling task completed: fromWechat={}, missing={}, created={}, failed={}",
                    result.getTotalFromWechat(),
                    result.getTotalMissing(),
                    result.getTotalCreated(),
                    result.getTotalFailed());

            // 缺失过多告警
            if (result.getTotalMissing() > 10) {
                pollingService.sendMissingAlert(result);
            }

        } catch (Exception e) {
            log.error("Payment polling task failed", e);
            pollingService.sendFailureAlert(e);
        } finally {
            redisTemplate.delete(LOCK_KEY);
            long elapsed = System.currentTimeMillis() - startTime;
            log.info("Payment polling task finished in {} ms", elapsed);
        }
    }
}
```

#### PaymentPollingService.java

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentPollingService {

    private final WechatPayManager wechatPayManager;
    private final PaymentRecordMapper paymentRecordMapper;
    private final CampMemberMapper campMemberMapper;
    private final AccessTokenService accessTokenService;
    private final WechatNotifyManager notifyManager;
    private final OperationLogMapper operationLogMapper;

    @Value("${camp.task.payment-polling.time-range-hours:2}")
    private int timeRangeHours;

    /**
     * 轮询并核对支付记录
     */
    public PollingResult pollAndReconcile() {
        PollingResult result = new PollingResult();

        // 1. 下载微信账单
        LocalDate today = LocalDate.now();
        List<WechatBillItem> billItems = wechatPayManager.downloadBill(today);
        result.setTotalFromWechat(billItems.size());

        // 2. 过滤时间范围内的记录
        LocalDateTime startTime = LocalDateTime.now().minusHours(timeRangeHours);
        List<WechatBillItem> recentItems = billItems.stream()
            .filter(item -> item.getTransactionTime().isAfter(startTime))
            .collect(Collectors.toList());

        // 3. 逐条核对
        int missing = 0;
        int created = 0;
        int failed = 0;
        List<String> failedIds = new ArrayList<>();

        for (WechatBillItem item : recentItems) {
            try {
                // 检查是否已存在
                if (paymentRecordMapper.existsByTransactionId(item.getTransactionId())) {
                    continue; // 跳过已存在的记录
                }

                missing++;

                // 补录记录
                createMissingRecord(item);
                created++;

            } catch (Exception e) {
                failed++;
                failedIds.add(item.getTransactionId());
                log.error("Failed to create missing record: {}", item.getTransactionId(), e);
            }
        }

        result.setTotalMissing(missing);
        result.setTotalCreated(created);
        result.setTotalFailed(failed);
        result.setFailedIds(failedIds);

        // 记录执行日志
        logTaskExecution(result);

        return result;
    }

    @Transactional(rollbackFor = Exception.class)
    private void createMissingRecord(WechatBillItem item) {
        // 1. 创建 payment_record
        PaymentRecord record = new PaymentRecord();
        record.setOrderNo(item.getOutTradeNo());
        record.setTransactionId(item.getTransactionId());
        record.setAmount(item.getAmount());
        record.setPayStatus("success");
        record.setPayTime(item.getTransactionTime());
        record.setSource("polling"); // 标记来源
        record.setCreatedAt(LocalDateTime.now());

        // 解析 campId（从订单号或微信备注）
        Long campId = parseCampIdFromOrderNo(item.getOutTradeNo());
        record.setCampId(campId);

        paymentRecordMapper.insert(record);

        // 2. 创建 camp_member
        CampMember member = new CampMember();
        member.setCampId(campId);
        member.setPaymentRecordId(record.getId());
        member.setBindStatus("pending");
        member.setBindDeadline(LocalDateTime.now().plusDays(7));
        member.setPayStatus("success");
        member.setCreatedAt(LocalDateTime.now());
        campMemberMapper.insert(member);

        // 3. 生成 accessToken
        TrainingCamp camp = trainingCampMapper.selectById(campId);
        String accessToken = accessTokenService.generateToken(
            member.getId(),
            campId,
            camp.getEndDate()
        );
        member.setAccessToken(accessToken);
        campMemberMapper.updateById(member);

        log.info("Created missing payment record: orderNo={}, transactionId={}, source=polling",
                item.getOutTradeNo(), item.getTransactionId());

        // 4. 尝试发送绑定提醒（如果有联系方式）
        // 注：轮询补录的记录通常没有用户联系方式，依赖用户主动绑定
    }

    private Long parseCampIdFromOrderNo(String orderNo) {
        // 订单号格式: ord_{campId}_{uuid}
        // 或者从商户备注 (attach) 解析
        // 这里需要根据实际订单号格式实现
        try {
            String[] parts = orderNo.split("_");
            if (parts.length >= 2) {
                return Long.parseLong(parts[1]);
            }
        } catch (Exception e) {
            log.warn("Cannot parse campId from orderNo: {}", orderNo);
        }
        return null;
    }

    public void sendMissingAlert(PollingResult result) {
        String message = String.format(
            "【支付轮询告警】\n" +
            "单次轮询发现 %d 条缺失记录，超过阈值！\n" +
            "已补录: %d 条\n" +
            "失败: %d 条\n" +
            "请检查 Webhook 配置是否正常。",
            result.getTotalMissing(),
            result.getTotalCreated(),
            result.getTotalFailed()
        );
        notifyManager.sendAdminAlert(message);
    }

    public void sendFailureAlert(Exception e) {
        String message = String.format(
            "【支付轮询任务失败】\n" +
            "错误信息: %s\n" +
            "请检查微信接口和系统状态。",
            e.getMessage()
        );
        notifyManager.sendAdminAlert(message);
    }

    private void logTaskExecution(PollingResult result) {
        OperationLog log = new OperationLog();
        log.setOperationType("payment_polling");
        log.setOperatorType("system");
        log.setContent(JsonUtils.toJson(result));
        log.setCreatedAt(LocalDateTime.now());
        operationLogMapper.insert(log);
    }
}
```

#### WechatPayManager.java - downloadBill

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class WechatPayManager {

    // ... 其他方法 ...

    /**
     * 下载交易账单
     */
    public List<WechatBillItem> downloadBill(LocalDate billDate) {
        String dateStr = billDate.format(DateTimeFormatter.ISO_LOCAL_DATE);

        // 1. 获取账单下载链接
        String url = "https://api.mch.weixin.qq.com/v3/bill/tradebill"
            + "?bill_date=" + dateStr
            + "&bill_type=ALL";

        String response = httpClient.get(url);
        Map<String, Object> result = JsonUtils.parseMap(response);
        String downloadUrl = (String) result.get("download_url");

        // 2. 下载账单文件
        String csvContent = httpClient.get(downloadUrl);

        // 3. 解析 CSV
        return parseBillCsv(csvContent);
    }

    private List<WechatBillItem> parseBillCsv(String csvContent) {
        List<WechatBillItem> items = new ArrayList<>();
        String[] lines = csvContent.split("\n");

        // 跳过表头和汇总行
        for (int i = 1; i < lines.length - 2; i++) {
            String line = lines[i];
            if (line.startsWith("`")) {
                line = line.substring(1); // 去掉前缀
            }
            String[] fields = line.split(",`");

            try {
                WechatBillItem item = new WechatBillItem();
                item.setTransactionTime(parseDateTime(fields[0]));
                item.setTransactionId(fields[5].replace("`", ""));
                item.setOutTradeNo(fields[6].replace("`", ""));
                item.setAmount(new BigDecimal(fields[12].replace("`", "")));
                item.setTradeStatus(fields[9].replace("`", ""));
                items.add(item);
            } catch (Exception e) {
                log.warn("Failed to parse bill line: {}", line, e);
            }
        }

        return items;
    }
}
```

### 安全检查清单

- [ ] 分布式锁防止多实例并发
- [ ] 微信 API 调用使用签名认证
- [ ] 按 transaction_id 幂等判重
- [ ] 单条失败不影响整体任务
- [ ] 敏感信息不写入日志

### 错误码

| 场景 | 处理 |
|------|------|
| 微信接口异常 | 重试3次，失败后告警 |
| 单条补录失败 | 记录日志，继续处理 |
| 获取锁失败 | 跳过执行 |

### 数据库索引

确保以下索引存在：

```sql
-- transaction_id 唯一索引
CREATE UNIQUE INDEX idx_pr_transaction_id ON payment_record(transaction_id)
    WHERE transaction_id IS NOT NULL;

-- source 字段索引（统计分析）
CREATE INDEX idx_pr_source ON payment_record(source);
```

### 测试要点

**后端测试**:
1. `PaymentPollingTaskTest` - 测试定时任务、分布式锁
2. `PaymentPollingServiceTest` - 测试核对、补录逻辑
3. `WechatPayManagerTest` - Mock 账单下载

**集成测试**:
1. 使用微信沙箱测试账单查询
2. 模拟缺失记录测试补录
3. 测试幂等性（重复执行）
4. 测试异常场景（单条失败、接口限流）

---

## 项目结构

### 后端新增/修改文件

```
backend/src/main/java/com/camp/
├── schedule/
│   └── PaymentPollingTask.java          # 新增定时任务
├── service/
│   └── PaymentPollingService.java       # 新增轮询服务
├── manager/
│   └── WechatPayManager.java            # 新增 downloadBill 方法
├── dto/
│   └── task/
│       ├── PollingResult.java           # 轮询结果
│       └── WechatBillItem.java          # 账单明细项
└── mapper/
    └── PaymentRecordMapper.java         # 新增 existsByTransactionId
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP02-S05 支付 Webhook | ready-for-dev | Webhook 主路径 |
| 微信商户平台配置 | 必须完成 | 账单下载权限 |
| Redis 配置 | 必须完成 | 分布式锁 |

### 后续依赖

本故事完成后，EP02 Epic 全部完成。
- 后续可进行 EP03 打卡数据同步
- 后续可进行 EP04 身份匹配与退款

---

## References

| 文档 | 路径 | 相关章节 |
|------|------|----------|
| PRD | `docs/PRD.md` | FR2.5 支付处理 |
| 技术方案 | `docs/v1/design/技术方案.md` | 定时任务配置 |
| Epic 定义 | `docs/epics.md` | EP02-S09 |
| 前一故事 | `docs/sprint-artifacts/stories/2-8-bind-expire-check.md` | 定时任务参考 |
| 微信支付文档 | https://pay.weixin.qq.com/docs/merchant/apis/bill-download/trade-bill/get-trade-bill.html | 交易账单下载 |

---

## Dev Agent Record

### Context Reference
- Epic: EP02 会员报名与支付系统
- Story: EP02-S09 支付轮询兜底机制
- FR Coverage: FR2.5 (补充)

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
| 优先级 | P1 |
| Epic | EP02 |
| 前置条件 | EP02-S05 完成 |
| 覆盖 FR | FR2.5 (兜底) |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
