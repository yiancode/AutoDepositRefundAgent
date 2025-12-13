# Story 4.3: 退款名单自动生成

**Status**: ready-for-dev

---

## Story

**作为**系统，
**我希望**在训练营结束后能够自动生成退款审核名单，
**以便于**管理员可以高效地进行退款审核工作。

---

## 验收标准

### AC-1: 定时任务触发
```gherkin
Feature: 退款名单自动生成
  Scenario: 定时任务每日执行
    Given 系统配置了退款名单生成任务
    When 到达每天 03:00
    Then 执行 RefundGenerateTask
    And 扫描所有 status=ended 的训练营
    And 为符合条件的会员创建退款记录

  Scenario: 训练营状态触发
    Given 训练营状态从 ongoing 变为 ended
    When 状态变更完成
    Then 标记该训练营需要生成退款名单
    And 等待定时任务执行

  Scenario: 手动触发生成
    Given 管理员在训练营详情页
    And 训练营状态为 ended
    When POST /api/admin/refunds/generate/{campId}
    Then 立即为该训练营生成退款名单
    And 返回生成结果统计
```

### AC-2: 符合条件的会员筛选
```gherkin
Feature: 退款条件筛选
  Scenario: 筛选符合退款条件的会员
    Given 训练营已结束
    When 执行退款名单生成
    Then 筛选条件:
      | 条件 | 说明 |
      | eligible_for_refund = true | 满足退款条件 |
      | match_status = matched | 已完成身份匹配 |
      | refund_record 不存在 | 未创建过退款记录 |

  Scenario: 打卡达标判定
    Given 会员 checkin_count >= required_days
    And eligible_for_refund = true
    When 执行筛选
    Then 该会员列入退款名单

  Scenario: 打卡未达标
    Given 会员 checkin_count < required_days
    And eligible_for_refund = false
    When 执行筛选
    Then 该会员不列入退款名单
```

### AC-3: 只处理已匹配会员
```gherkin
Feature: 匹配状态校验
  Scenario: 已匹配会员创建退款记录
    Given 会员 match_status = matched
    And eligible_for_refund = true
    When 执行退款名单生成
    Then 创建 refund_record
    And audit_status = pending

  Scenario: 待匹配会员不处理
    Given 会员 match_status = pending
    And eligible_for_refund = true
    When 执行退款名单生成
    Then 不创建退款记录
    And 发送通知提醒管理员处理匹配

  Scenario: 匹配失败会员不处理
    Given 会员 match_status = failed
    When 执行退款名单生成
    Then 不创建退款记录
    And 记录到待处理列表
```

### AC-4: 创建退款记录
```gherkin
Feature: 创建退款记录
  Scenario: 创建退款记录
    Given 会员符合退款条件
    When 创建 refund_record
    Then 记录包含:
      | 字段 | 值 |
      | camp_id | 训练营ID |
      | member_id | 会员ID |
      | payment_record_id | 关联的支付记录ID |
      | refund_amount | 退款金额（等于支付金额） |
      | audit_status | pending |
      | refund_status | pending |
      | created_at | 当前时间 |

  Scenario: 幂等性保证
    Given 会员已存在退款记录
    When 重复执行生成任务
    Then 不创建重复的退款记录
    And 跳过该会员

  Scenario: 批量创建
    Given 100个符合条件的会员
    When 执行批量创建
    Then 使用批量插入优化性能
    And 单次插入最多100条
```

### AC-5: 生成结果统计
```gherkin
Feature: 生成结果统计
  Scenario: 返回生成统计
    Given 退款名单生成完成
    Then 返回统计信息:
      | 字段 | 说明 |
      | campId | 训练营ID |
      | totalEligible | 符合退款条件总数 |
      | createdCount | 新创建记录数 |
      | skippedCount | 跳过数（已有记录）|
      | pendingMatchCount | 待匹配数 |
      | failedMatchCount | 匹配失败数 |
      | totalRefundAmount | 退款总金额 |

  Scenario: 记录操作日志
    Given 退款名单生成完成
    Then 记录到 operation_log:
      | 字段 | 值 |
      | operation_type | refund_generate |
      | operator_type | system/admin |
      | content | 统计结果JSON |
```

### AC-6: 异常情况告警
```gherkin
Feature: 异常告警
  Scenario: 存在待匹配会员告警
    Given 生成任务完成
    And pendingMatchCount > 0
    Then 发送企业微信通知给管理员
    And 通知内容: "训练营{name}有{count}名会员待匹配，请及时处理"

  Scenario: 生成任务失败告警
    Given 生成任务执行失败
    Then 发送企业微信告警
    And 记录错误日志
    And 不影响其他训练营处理
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - RefundRecord 实体和 Mapper** (AC: #4)
  - [ ] 1.1 创建 `RefundRecord.java` 实体
  - [ ] 1.2 创建 `RefundRecordMapper.java`
  - [ ] 1.3 创建数据库迁移脚本（如需）
  - [ ] 1.4 编写 Mapper 测试

- [ ] **Task 2: 后端 - RefundGenerateService** (AC: #2, #3, #4)
  - [ ] 2.1 创建 `RefundGenerateService.java` 接口
  - [ ] 2.2 实现 `generateByCamp(campId)` 方法
  - [ ] 2.3 实现会员筛选逻辑
  - [ ] 2.4 实现批量创建退款记录
  - [ ] 2.5 实现幂等性检查
  - [ ] 2.6 编写单元测试

- [ ] **Task 3: 后端 - 定时任务** (AC: #1)
  - [ ] 3.1 创建 `RefundGenerateTask.java`
  - [ ] 3.2 配置 `@Scheduled(cron = "0 0 3 * * ?")`
  - [ ] 3.3 实现扫描 ended 训练营逻辑
  - [ ] 3.4 添加任务开关配置
  - [ ] 3.5 编写任务测试

- [ ] **Task 4: 后端 - 手动触发接口** (AC: #1)
  - [ ] 4.1 创建 `RefundGenerateController.java`
  - [ ] 4.2 实现 `POST /api/admin/refunds/generate/{campId}`
  - [ ] 4.3 添加权限校验
  - [ ] 4.4 编写接口测试

- [ ] **Task 5: 后端 - 告警通知** (AC: #6)
  - [ ] 5.1 实现待匹配会员告警通知
  - [ ] 5.2 实现任务失败告警通知
  - [ ] 5.3 复用 WechatNotifyManager

- [ ] **Task 6: 后端 - 统计和日志** (AC: #5)
  - [ ] 6.1 实现生成结果统计
  - [ ] 6.2 记录操作日志
  - [ ] 6.3 返回统计 VO

- [ ] **Task 7: 集成测试与验收** (AC: #全部)
  - [ ] 7.1 测试定时任务执行
  - [ ] 7.2 测试手动触发
  - [ ] 7.3 测试筛选逻辑
  - [ ] 7.4 测试幂等性
  - [ ] 7.5 测试告警通知

---

## Dev Notes

### 业务流程概述

本故事实现退款名单的自动生成，为退款审核提供数据基础。

```
定时任务 (每天03:00) / 手动触发
     ↓
扫描 status=ended 的训练营
     ↓
对每个训练营:
├── 查询符合条件的会员:
│   └── eligible_for_refund = true
│       AND match_status = matched
│       AND 无 refund_record
     ↓
├── 为每个会员创建 refund_record:
│   ├── audit_status = pending
│   ├── refund_status = pending
│   └── refund_amount = pay_amount
     ↓
├── 统计生成结果
     ↓
├── 检查异常情况:
│   └── 存在待匹配会员 → 发送告警
     ↓
└── 记录操作日志
```

### 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 执行时间 | 每天03:00 | 凌晨低峰期，打卡同步01:00后 |
| 批量处理 | 每批100条 | 避免内存溢出 |
| 幂等保证 | 检查已存在记录 | 重复执行安全 |
| 匹配状态 | 仅处理 matched | 确保身份准确 |

### 状态枚举引用

> **SSOT 引用**: [状态枚举定义.md](../../v1/design/状态枚举定义.md)

**audit_status 审核状态**:
- `pending`: 待审核
- `approved`: 已通过
- `rejected`: 已拒绝

**refund_status 退款状态**:
- `pending`: 待处理
- `processing`: 处理中
- `success`: 退款成功
- `failed`: 退款失败

### 代码实现参考

#### RefundGenerateTask.java

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class RefundGenerateTask {

    private final TrainingCampMapper campMapper;
    private final RefundGenerateService generateService;
    private final WechatNotifyManager notifyManager;

    @Value("${refund.generate.enabled:true}")
    private boolean enabled;

    /**
     * 每天03:00执行退款名单生成
     */
    @Scheduled(cron = "${refund.generate.cron:0 0 3 * * ?}")
    public void generateRefundList() {
        if (!enabled) {
            log.info("退款名单生成任务已禁用");
            return;
        }

        log.info("开始执行退款名单生成任务");

        // 查询所有已结束的训练营
        List<TrainingCamp> endedCamps = campMapper.selectByStatus(CampStatus.ENDED);

        int totalCreated = 0;
        int totalPendingMatch = 0;

        for (TrainingCamp camp : endedCamps) {
            try {
                RefundGenerateResult result = generateService.generateByCamp(camp.getId());
                totalCreated += result.getCreatedCount();
                totalPendingMatch += result.getPendingMatchCount();

                log.info("训练营 {} 退款名单生成完成: {}", camp.getId(), result);

            } catch (Exception e) {
                log.error("训练营 {} 退款名单生成失败", camp.getId(), e);
                // 发送告警
                notifyManager.sendGenerateFailedAlert(camp, e);
            }
        }

        // 如果有待匹配会员，发送汇总告警
        if (totalPendingMatch > 0) {
            notifyManager.sendPendingMatchAlert(totalPendingMatch);
        }

        log.info("退款名单生成任务完成: 创建{}条, 待匹配{}人", totalCreated, totalPendingMatch);
    }
}
```

#### RefundGenerateService.java

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class RefundGenerateServiceImpl implements RefundGenerateService {

    private final TrainingCampMapper campMapper;
    private final CampMemberMapper memberMapper;
    private final PaymentRecordMapper paymentMapper;
    private final RefundRecordMapper refundMapper;
    private final OperationLogService operationLogService;

    private static final int BATCH_SIZE = 100;

    @Override
    @Transactional
    public RefundGenerateResult generateByCamp(Long campId) {
        // 1. 验证训练营状态
        TrainingCamp camp = campMapper.selectById(campId);
        if (camp == null) {
            throw new BusinessException(404, "训练营不存在");
        }
        if (!CampStatus.ENDED.equals(camp.getStatus()) &&
            !CampStatus.SETTLING.equals(camp.getStatus())) {
            throw new BusinessException(400, "训练营未结束，无法生成退款名单");
        }

        // 2. 查询符合条件的会员
        List<CampMember> eligibleMembers = memberMapper.selectEligibleForRefund(campId);

        int createdCount = 0;
        int skippedCount = 0;
        int pendingMatchCount = 0;
        int failedMatchCount = 0;
        BigDecimal totalRefundAmount = BigDecimal.ZERO;

        List<RefundRecord> toCreate = new ArrayList<>();

        for (CampMember member : eligibleMembers) {
            // 检查匹配状态
            if (!MatchStatus.MATCHED.equals(member.getMatchStatus())) {
                if (MatchStatus.PENDING.equals(member.getMatchStatus())) {
                    pendingMatchCount++;
                } else {
                    failedMatchCount++;
                }
                continue;
            }

            // 检查是否已有退款记录
            if (refundMapper.existsByMemberId(member.getId())) {
                skippedCount++;
                continue;
            }

            // 查询支付记录
            PaymentRecord payment = paymentMapper.selectByMemberId(member.getId());
            if (payment == null) {
                log.warn("会员 {} 无支付记录，跳过", member.getId());
                continue;
            }

            // 创建退款记录
            RefundRecord refund = RefundRecord.builder()
                .campId(campId)
                .memberId(member.getId())
                .paymentRecordId(payment.getId())
                .refundAmount(payment.getPayAmount())
                .auditStatus(AuditStatus.PENDING)
                .refundStatus(RefundStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

            toCreate.add(refund);
            totalRefundAmount = totalRefundAmount.add(payment.getPayAmount());

            // 批量插入
            if (toCreate.size() >= BATCH_SIZE) {
                refundMapper.batchInsert(toCreate);
                createdCount += toCreate.size();
                toCreate.clear();
            }
        }

        // 插入剩余记录
        if (!toCreate.isEmpty()) {
            refundMapper.batchInsert(toCreate);
            createdCount += toCreate.size();
        }

        // 3. 构建结果
        RefundGenerateResult result = RefundGenerateResult.builder()
            .campId(campId)
            .campName(camp.getName())
            .totalEligible(eligibleMembers.size())
            .createdCount(createdCount)
            .skippedCount(skippedCount)
            .pendingMatchCount(pendingMatchCount)
            .failedMatchCount(failedMatchCount)
            .totalRefundAmount(totalRefundAmount)
            .build();

        // 4. 记录操作日志
        operationLogService.log(OperationLog.builder()
            .operationType("refund_generate")
            .targetType("training_camp")
            .targetId(campId)
            .content(JsonUtils.toJson(result))
            .build());

        return result;
    }
}
```

#### RefundGenerateController.java

```java
@RestController
@RequestMapping("/api/admin/refunds")
@RequiredArgsConstructor
@Slf4j
public class RefundGenerateController {

    private final RefundGenerateService generateService;

    /**
     * 手动生成退款名单
     */
    @PostMapping("/generate/{campId}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<RefundGenerateResult> generateRefundList(@PathVariable Long campId) {
        RefundGenerateResult result = generateService.generateByCamp(campId);
        return Result.success(result);
    }
}
```

### API 响应示例

#### POST /api/admin/refunds/generate/{campId}

```json
{
  "code": 200,
  "message": "退款名单生成成功",
  "data": {
    "campId": 1,
    "campName": "21天早起打卡训练营",
    "totalEligible": 100,
    "createdCount": 85,
    "skippedCount": 5,
    "pendingMatchCount": 8,
    "failedMatchCount": 2,
    "totalRefundAmount": 8415.00
  },
  "timestamp": 1730000000
}
```

### 数据库变更

```sql
-- refund_record 表（如已存在则跳过）
CREATE TABLE IF NOT EXISTS refund_record (
    id BIGSERIAL PRIMARY KEY,
    camp_id BIGINT NOT NULL REFERENCES training_camp(id),
    member_id BIGINT NOT NULL REFERENCES camp_member(id),
    payment_record_id BIGINT NOT NULL REFERENCES payment_record(id),
    refund_amount DECIMAL(10, 2) NOT NULL,
    audit_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    refund_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    auditor_id BIGINT REFERENCES system_user(id),
    audit_time TIMESTAMP,
    audit_comment VARCHAR(500),
    reject_reason VARCHAR(500),
    wechat_refund_id VARCHAR(64),
    execute_time TIMESTAMP,
    retry_count INT DEFAULT 0,
    error_message TEXT,
    notified BOOLEAN DEFAULT FALSE,
    notify_time TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_refund_camp ON refund_record(camp_id);
CREATE INDEX idx_refund_member ON refund_record(member_id);
CREATE INDEX idx_refund_audit_status ON refund_record(audit_status);
CREATE INDEX idx_refund_status ON refund_record(refund_status);
CREATE UNIQUE INDEX idx_refund_member_unique ON refund_record(member_id) WHERE audit_status != 'rejected';
```

### 配置项

```yaml
refund:
  generate:
    enabled: true
    cron: "0 0 3 * * ?"  # 每天03:00执行
    batch-size: 100       # 批量插入大小
```

### 安全检查清单

- [ ] 权限控制：手动触发需要 ADMIN 权限
- [ ] 状态校验：仅处理 ended/settling 训练营
- [ ] 幂等性：重复执行不会创建重复记录
- [ ] 事务处理：批量操作使用事务
- [ ] 异常处理：单个训练营失败不影响其他

### 测试要点

**后端测试**:
1. `RefundGenerateServiceTest` - 测试筛选和创建逻辑
2. `RefundGenerateTaskTest` - 测试定时任务
3. `RefundGenerateControllerTest` - 测试手动触发接口
4. 测试幂等性
5. 测试异常情况告警

---

## 项目结构

### 后端新增/修改文件

```
backend/src/main/java/com/camp/
├── controller/
│   └── admin/
│       └── RefundGenerateController.java     # 新增退款生成控制器
├── service/
│   ├── RefundGenerateService.java            # 新增退款生成服务接口
│   └── impl/
│       └── RefundGenerateServiceImpl.java    # 新增
├── schedule/
│   └── RefundGenerateTask.java               # 新增定时任务
├── entity/
│   └── RefundRecord.java                     # 新增退款记录实体
├── mapper/
│   └── RefundRecordMapper.java               # 新增退款记录 Mapper
├── enums/
│   ├── AuditStatus.java                      # 新增审核状态枚举
│   └── RefundStatus.java                     # 新增退款状态枚举（如不存在）
└── vo/
    └── RefundGenerateResult.java             # 新增生成结果 VO
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP04-S01 直接匹配 | ready-for-dev | match_status 状态 |
| EP03-S02 打卡同步 | ready-for-dev | eligible_for_refund 计算 |
| EP02-S05 支付记录 | ready-for-dev | payment_record 关联 |

### 后续依赖

本故事完成后:
- EP04-S04 退款审核（审核 refund_record）
- EP04-S05 退款执行（执行 approved 的退款）

---

## References

| 文档 | 路径 | 相关章节 |
|------|------|----------|
| PRD | `docs/PRD.md` | 3.3 退款审核流程 |
| 状态枚举 | `docs/v1/design/状态枚举定义.md` | audit_status, refund_status |
| 数据库设计 | `docs/v1/design/数据库设计.md` | refund_record 表 |
| Epic 定义 | `docs/epics.md` | EP04-S03 |
| 前一故事 | `docs/sprint-artifacts/stories/4-2-manual-match.md` | 手动匹配 |

---

## Dev Agent Record

### Context Reference
- Epic: EP04 身份匹配与退款流程
- Story: EP04-S03 退款名单自动生成
- FR Coverage: FR6.1

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
| Epic | EP04 |
| 前置条件 | EP04-S01 完成 |
| 覆盖 FR | FR6.1 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
