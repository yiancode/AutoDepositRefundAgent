# Story 2.8: 绑定超时检查与人工审核转入

**Status**: ready-for-dev

---

## Story

**作为**系统，
**我希望**自动检测超时未绑定的支付记录并转入人工审核流程，
**以便于**确保所有支付记录都能得到及时处理，避免会员长期处于未绑定状态。

---

## 验收标准

### AC-1: 定时任务配置
```gherkin
Feature: 绑定超时检测任务
  Scenario: 定时任务自动执行
    Given 系统配置了绑定超时检测任务
    When 到达每天 02:00
    Then 自动执行 BindExpireTask
    And 记录任务开始时间和结束时间
    And 记录处理的记录数量
```

### AC-2: 超时记录检测
```gherkin
Feature: 超时记录检测
  Scenario: 检测超过绑定期限的记录
    Given 存在 camp_member 记录满足:
      | 条件 | 值 |
      | bind_status | pending |
      | bind_deadline | < 当前时间 |
    When 执行超时检测任务
    Then 查询所有满足条件的记录
    And 按训练营分组统计

  Scenario: 无超时记录
    Given 不存在超时的 pending 记录
    When 执行超时检测任务
    Then 任务正常结束
    And 不触发任何状态更新
    And 不发送通知
```

### AC-3: 状态更新流程
```gherkin
Feature: 状态更新
  Scenario: 更新为 expired 再转 manual_review
    Given 检测到超时的 pending 记录
    When 执行状态更新
    Then 首先更新 bind_status 为 expired
    And 立即更新为 manual_review
    And 记录状态日志:
      | 字段 | 值 |
      | from_status | pending |
      | to_status | manual_review |
      | trigger_source | bind_expire_task |
      | operator_type | system |
      | remark | 绑定超时自动转入人工审核 |
```

### AC-4: accessToken 状态同步
```gherkin
Feature: accessToken 状态同步
  Scenario: 超时后 Token 状态更新
    Given 会员绑定超时
    And 存在关联的 accessToken
    When 绑定状态更新为 manual_review
    Then accessToken 状态更新为 expired
    And Redis 中 Token 数据标记为过期
```

### AC-5: 管理员通知
```gherkin
Feature: 管理员通知
  Scenario: 发送超时汇总通知
    Given 检测到 N 条超时记录
    And N > 0
    When 状态更新完成
    Then 发送企业微信通知给管理员
    And 通知内容包含:
      | 字段 | 说明 |
      | 总数量 | 今日超时总数 |
      | 分组统计 | 按训练营分组的超时数量 |
      | 审核入口 | 管理后台链接 |

  Scenario: 无超时记录不发送通知
    Given 检测到 0 条超时记录
    When 任务完成
    Then 不发送通知
```

### AC-6: 批量处理优化
```gherkin
Feature: 批量处理
  Scenario: 批量更新提高效率
    Given 检测到大量超时记录（如 100 条）
    When 执行状态更新
    Then 使用批量 UPDATE 语句
    And 单次事务处理不超过 100 条
    And 记录每批次处理时间

  Scenario: 大批量分批处理
    Given 检测到超过 100 条超时记录
    When 执行状态更新
    Then 分批处理，每批 100 条
    And 每批独立事务
    And 记录总体处理结果
```

### AC-7: 待审核列表查询
```gherkin
Feature: 待审核列表
  Scenario: 管理员查看待审核列表
    Given 存在 bind_status=manual_review 的记录
    When GET /api/admin/members?bindStatus=manual_review
    Then 返回待审核会员列表
    And 每条记录包含:
      | 字段 | 说明 |
      | memberId | 会员ID |
      | orderNo | 订单号 |
      | campName | 训练营名称 |
      | payAmount | 支付金额 |
      | payTime | 支付时间 |
      | payerNickname | 微信付款人昵称 |
      | expireTime | 超时时间 |
    And 支持分页查询
    And 按超时时间倒序排列
```

### AC-8: 错误处理与重试
```gherkin
Feature: 错误处理
  Scenario: 数据库更新失败
    Given 状态更新过程中数据库异常
    When 捕获异常
    Then 回滚当前批次事务
    And 记录失败的记录ID列表
    And 继续处理下一批次
    And 任务结束后发送告警

  Scenario: 通知发送失败
    Given 状态更新成功
    And 企业微信通知发送失败
    Then 记录通知失败日志
    And 任务标记为部分成功
    And 不影响下次任务执行
```

### AC-9: 任务执行日志
```gherkin
Feature: 任务日志
  Scenario: 记录任务执行详情
    Given 执行绑定超时检测任务
    When 任务完成
    Then 记录到 operation_log:
      | 字段 | 值 |
      | operation_type | bind_expire_check |
      | total_scanned | 扫描记录总数 |
      | total_expired | 超时记录数 |
      | total_updated | 成功更新数 |
      | total_failed | 失败记录数 |
      | execution_time | 执行耗时(ms) |
```

### AC-10: 幂等性保证
```gherkin
Feature: 幂等性
  Scenario: 重复执行不产生副作用
    Given 某条记录已在前次任务中处理
    And bind_status 已是 manual_review
    When 再次执行任务
    Then 跳过该记录
    And 不产生重复日志

  Scenario: 分布式锁防并发
    Given 多个实例同时运行
    When 任务触发时间到达
    Then 使用 Redis 分布式锁
    And 只有一个实例执行任务
    And 其他实例跳过本次执行
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - 定时任务框架** (AC: #1, #10)
  - [ ] 1.1 创建 `BindExpireTask.java`
  - [ ] 1.2 配置 `@Scheduled(cron = "0 0 2 * * ?")`
  - [ ] 1.3 实现 Redis 分布式锁（防止多实例并发）
  - [ ] 1.4 添加任务开关配置 `camp.task.bind-expire.enabled`
  - [ ] 1.5 编写单元测试

- [ ] **Task 2: 后端 - 超时检测服务** (AC: #2, #3)
  - [ ] 2.1 在 `PaymentBindService.java` 添加 `checkAndExpireBindings()`
  - [ ] 2.2 实现查询超时记录逻辑:
    - 条件: bind_status=pending AND bind_deadline < NOW()
    - 使用分页查询避免大数据量问题
  - [ ] 2.3 实现状态更新: pending → manual_review
  - [ ] 2.4 记录状态变更日志
  - [ ] 2.5 编写单元测试

- [ ] **Task 3: 后端 - 批量更新优化** (AC: #6)
  - [ ] 3.1 实现 `batchUpdateBindStatus(List<Long> memberIds)`
  - [ ] 3.2 配置批量大小 `camp.task.bind-expire.batch-size=100`
  - [ ] 3.3 每批独立事务处理
  - [ ] 3.4 编写性能测试（模拟大批量数据）

- [ ] **Task 4: 后端 - accessToken 状态同步** (AC: #4)
  - [ ] 4.1 在 `AccessTokenService.java` 添加批量过期方法
  - [ ] 4.2 实现 `expireTokensByMemberIds(List<Long> memberIds)`
  - [ ] 4.3 更新 Redis 中的 Token 状态
  - [ ] 4.4 编写单元测试

- [ ] **Task 5: 后端 - 状态日志记录** (AC: #3, #9)
  - [ ] 5.1 创建 `BindExpireLog` 实体类（可选，复用 operation_log）
  - [ ] 5.2 实现批量插入状态变更日志
  - [ ] 5.3 实现任务执行日志记录
  - [ ] 5.4 添加日志索引优化查询

- [ ] **Task 6: 后端 - 管理员通知** (AC: #5)
  - [ ] 6.1 创建 `BindExpireNotifyDTO`
  - [ ] 6.2 实现按训练营分组统计
  - [ ] 6.3 调用 `WechatNotifyManager.sendBindExpireNotify()`
  - [ ] 6.4 使用通知模板 `admin_bind_timeout`
  - [ ] 6.5 编写通知服务测试

- [ ] **Task 7: 后端 - 待审核列表接口** (AC: #7)
  - [ ] 7.1 修改 `MemberController.java` 支持 bindStatus 过滤
  - [ ] 7.2 实现 `GET /api/admin/members?bindStatus=manual_review`
  - [ ] 7.3 返回必要字段（订单号、金额、付款人等）
  - [ ] 7.4 支持分页和排序
  - [ ] 7.5 编写接口测试

- [ ] **Task 8: 后端 - 错误处理** (AC: #8)
  - [ ] 8.1 实现异常捕获和事务回滚
  - [ ] 8.2 记录失败记录列表
  - [ ] 8.3 实现失败告警通知
  - [ ] 8.4 添加重试机制（可选）

- [ ] **Task 9: 后端 - 数据库优化** (AC: #2, #6)
  - [ ] 9.1 确认索引存在:
    ```sql
    CREATE INDEX idx_cm_bind_expire ON camp_member(bind_deadline)
      WHERE bind_status = 'pending';
    ```
  - [ ] 9.2 验证批量更新 SQL 性能
  - [ ] 9.3 添加 EXPLAIN 分析日志

- [ ] **Task 10: 集成测试与验收** (AC: #全部)
  - [ ] 10.1 测试定时任务触发
  - [ ] 10.2 测试批量超时处理
  - [ ] 10.3 测试分布式锁
  - [ ] 10.4 测试管理员通知
  - [ ] 10.5 测试待审核列表查询
  - [ ] 10.6 测试错误场景（数据库异常、通知失败）

---

## Dev Notes

### 业务流程概述

本故事处理绑定超时的自动化检测和转入人工审核流程。

```
每天 02:00 定时任务触发
     ↓
获取 Redis 分布式锁（防并发）
     ↓
查询 bind_status=pending AND bind_deadline < NOW()
     ↓
分批处理（每批 100 条）
     ↓
更新 bind_status: pending → manual_review
     ↓
更新 accessToken 状态为 expired
     ↓
记录状态变更日志
     ↓
按训练营分组统计
     ↓
发送管理员通知（如有超时记录）
     ↓
释放分布式锁，任务结束
```

### 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 执行时间 | 每天 02:00 | 业务低峰期，避免影响用户 |
| 状态流转 | 直接到 manual_review | 简化流程，expired 状态仅作过渡 |
| 批量大小 | 100 条/批 | 平衡性能和事务安全 |
| 并发控制 | Redis 分布式锁 | 支持多实例部署 |
| 通知策略 | 汇总通知 | 减少通知频率，提高效率 |

### 绑定超时期限计算

bind_deadline 在支付成功时设置：
- H5 OAuth 支付: 不设置 bind_deadline（直接绑定）
- 固定二维码支付: bind_deadline = 支付时间 + 7 天

```java
// 支付回调时设置
if (attachData.getWechatUserId() == null) {
    // 降级路径，设置绑定截止时间
    member.setBindDeadline(LocalDateTime.now().plusDays(7));
    member.setBindStatus("pending");
}
```

### 代码实现参考

#### BindExpireTask.java

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class BindExpireTask {

    private final PaymentBindService paymentBindService;
    private final StringRedisTemplate redisTemplate;

    @Value("${camp.task.bind-expire.enabled:true}")
    private boolean enabled;

    private static final String LOCK_KEY = "task:bind_expire:lock";
    private static final int LOCK_EXPIRE_SECONDS = 300; // 5分钟

    /**
     * 每天 02:00 执行绑定超时检查
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void checkBindExpire() {
        if (!enabled) {
            log.info("Bind expire task is disabled");
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
            log.info("Bind expire task is running on another instance, skip");
            return;
        }

        long startTime = System.currentTimeMillis();
        log.info("Bind expire task started");

        try {
            BindExpireResult result = paymentBindService.checkAndExpireBindings();
            log.info("Bind expire task completed: scanned={}, expired={}, failed={}",
                    result.getTotalScanned(),
                    result.getTotalExpired(),
                    result.getTotalFailed());

        } catch (Exception e) {
            log.error("Bind expire task failed", e);
        } finally {
            redisTemplate.delete(LOCK_KEY);
            long elapsed = System.currentTimeMillis() - startTime;
            log.info("Bind expire task finished in {} ms", elapsed);
        }
    }
}
```

#### PaymentBindService.java - checkAndExpireBindings

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentBindService {

    private final CampMemberMapper campMemberMapper;
    private final BindStatusLogMapper bindStatusLogMapper;
    private final AccessTokenService accessTokenService;
    private final WechatNotifyManager wechatNotifyManager;
    private final OperationLogMapper operationLogMapper;

    @Value("${camp.task.bind-expire.batch-size:100}")
    private int batchSize;

    /**
     * 检查并处理绑定超时记录
     */
    public BindExpireResult checkAndExpireBindings() {
        BindExpireResult result = new BindExpireResult();
        int offset = 0;
        int totalExpired = 0;
        int totalFailed = 0;

        while (true) {
            // 分页查询超时记录
            List<CampMember> expiredMembers = campMemberMapper.selectExpiredPendingBindings(
                LocalDateTime.now(),
                offset,
                batchSize
            );

            if (expiredMembers.isEmpty()) {
                break;
            }

            result.setTotalScanned(result.getTotalScanned() + expiredMembers.size());

            // 批量处理
            BatchUpdateResult batchResult = processBatch(expiredMembers);
            totalExpired += batchResult.getSuccessCount();
            totalFailed += batchResult.getFailedCount();

            offset += batchSize;
        }

        result.setTotalExpired(totalExpired);
        result.setTotalFailed(totalFailed);

        // 发送管理员通知
        if (totalExpired > 0) {
            sendAdminNotification(result);
        }

        // 记录任务执行日志
        logTaskExecution(result);

        return result;
    }

    @Transactional(rollbackFor = Exception.class)
    private BatchUpdateResult processBatch(List<CampMember> members) {
        BatchUpdateResult result = new BatchUpdateResult();

        try {
            List<Long> memberIds = members.stream()
                .map(CampMember::getId)
                .collect(Collectors.toList());

            // 批量更新状态
            campMemberMapper.batchUpdateBindStatus(memberIds, "manual_review");

            // 批量更新 accessToken 状态
            accessTokenService.expireTokensByMemberIds(memberIds);

            // 批量插入状态日志
            List<BindStatusLog> logs = members.stream()
                .map(m -> {
                    BindStatusLog log = new BindStatusLog();
                    log.setCampMemberId(m.getId());
                    log.setFromStatus("pending");
                    log.setToStatus("manual_review");
                    log.setTriggerSource("bind_expire_task");
                    log.setOperatorType("system");
                    log.setRemark("绑定超时自动转入人工审核");
                    log.setCreatedAt(LocalDateTime.now());
                    return log;
                })
                .collect(Collectors.toList());
            bindStatusLogMapper.batchInsert(logs);

            result.setSuccessCount(members.size());

        } catch (Exception e) {
            log.error("Batch update failed", e);
            result.setFailedCount(members.size());
            result.setFailedIds(members.stream()
                .map(CampMember::getId)
                .collect(Collectors.toList()));
            throw e; // 触发事务回滚
        }

        return result;
    }

    private void sendAdminNotification(BindExpireResult result) {
        try {
            // 按训练营分组统计
            Map<String, Integer> campStats = campMemberMapper.countExpiredBycamp();

            BindExpireNotifyDTO dto = BindExpireNotifyDTO.builder()
                .totalCount(result.getTotalExpired())
                .campStats(campStats)
                .checkTime(LocalDateTime.now())
                .build();

            wechatNotifyManager.sendBindExpireNotify(dto);

        } catch (Exception e) {
            log.error("Failed to send admin notification", e);
        }
    }

    private void logTaskExecution(BindExpireResult result) {
        OperationLog log = new OperationLog();
        log.setOperationType("bind_expire_check");
        log.setOperatorType("system");
        log.setContent(JsonUtils.toJson(result));
        log.setCreatedAt(LocalDateTime.now());
        operationLogMapper.insert(log);
    }
}
```

#### CampMemberMapper.java - 超时查询

```java
@Mapper
public interface CampMemberMapper extends BaseMapper<CampMember> {

    /**
     * 查询超时未绑定的记录
     */
    @Select("""
        SELECT * FROM camp_member
        WHERE bind_status = 'pending'
          AND bind_deadline < #{now}
          AND deleted_at IS NULL
        ORDER BY bind_deadline ASC
        LIMIT #{limit} OFFSET #{offset}
        """)
    List<CampMember> selectExpiredPendingBindings(
        @Param("now") LocalDateTime now,
        @Param("offset") int offset,
        @Param("limit") int limit
    );

    /**
     * 批量更新绑定状态
     */
    @Update("""
        UPDATE camp_member
        SET bind_status = #{newStatus},
            updated_at = NOW()
        WHERE id IN
        <foreach collection="ids" item="id" open="(" separator="," close=")">
            #{id}
        </foreach>
        """)
    int batchUpdateBindStatus(
        @Param("ids") List<Long> ids,
        @Param("newStatus") String newStatus
    );

    /**
     * 按训练营分组统计超时记录
     */
    @Select("""
        SELECT tc.name as camp_name, COUNT(*) as count
        FROM camp_member cm
        JOIN training_camp tc ON cm.camp_id = tc.id
        WHERE cm.bind_status = 'manual_review'
          AND cm.updated_at >= CURRENT_DATE
          AND cm.deleted_at IS NULL
        GROUP BY tc.id, tc.name
        """)
    Map<String, Integer> countExpiredBycamp();
}
```

#### MemberController.java - 待审核列表

```java
@RestController
@RequestMapping("/api/admin/members")
@RequiredArgsConstructor
@Slf4j
public class MemberController {

    private final CampMemberService memberService;

    /**
     * 会员列表查询（支持 bindStatus 过滤）
     */
    @GetMapping
    public Result<PageResult<MemberListVO>> listMembers(
            @RequestParam(required = false) Long campId,
            @RequestParam(required = false) String bindStatus,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer pageSize) {

        MemberQueryDTO query = MemberQueryDTO.builder()
            .campId(campId)
            .bindStatus(bindStatus)
            .keyword(keyword)
            .page(page)
            .pageSize(pageSize)
            .build();

        PageResult<MemberListVO> result = memberService.listMembers(query);
        return Result.success(result);
    }
}
```

### 通知消息模板

使用 `admin_bind_timeout` 模板：

```
【绑定超时提醒】

今日新增 {{total_count}} 笔超时未绑定订单：

{{#each camp_stats}}
- {{camp_name}}：{{count}} 笔
{{/each}}

请及时登录管理后台处理：
{{admin_url}}/members?bindStatus=manual_review

检查时间：{{check_time}}
```

### 安全检查清单

- [ ] 分布式锁防止多实例并发执行
- [ ] 批量更新使用事务保证一致性
- [ ] 状态变更有完整日志记录
- [ ] 通知失败不影响核心业务
- [ ] 敏感信息不写入日志

### 错误码

| 错误码 | HTTP | 含义 | 处理 |
|--------|------|------|------|
| 500 | 500 | 批量更新失败 | 记录失败ID，继续处理 |
| 500 | 500 | 通知发送失败 | 记录日志，标记部分成功 |

### 数据库索引

确保以下索引存在以优化查询性能：

```sql
-- 绑定超时检查查询优化
CREATE INDEX idx_cm_bind_expire ON camp_member(bind_deadline)
    WHERE bind_status = 'pending' AND deleted_at IS NULL;

-- 待审核列表查询优化
CREATE INDEX idx_cm_manual_review ON camp_member(bind_status, updated_at)
    WHERE bind_status = 'manual_review' AND deleted_at IS NULL;
```

### 测试要点

**后端测试**:
1. `BindExpireTaskTest` - 测试定时任务触发、分布式锁
2. `PaymentBindServiceTest` - 测试超时检测、批量更新
3. `CampMemberMapperTest` - 测试查询和批量更新 SQL

**集成测试**:
1. 模拟超时数据测试完整流程
2. 测试大批量数据分批处理
3. 测试并发场景（多实例）
4. 测试异常场景（数据库、通知失败）

---

## 项目结构

### 后端新增/修改文件

```
backend/src/main/java/com/camp/
├── schedule/
│   └── BindExpireTask.java              # 新增定时任务
├── service/
│   ├── PaymentBindService.java          # 新增 checkAndExpireBindings
│   └── AccessTokenService.java          # 新增 expireTokensByMemberIds
├── controller/
│   └── admin/
│       └── MemberController.java        # 修改支持 bindStatus 过滤
├── dto/
│   └── task/
│       ├── BindExpireResult.java        # 任务执行结果
│       ├── BatchUpdateResult.java       # 批量更新结果
│       └── BindExpireNotifyDTO.java     # 通知数据
└── mapper/
    └── CampMemberMapper.java            # 新增查询和批量更新方法
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP02-S07 用户填写绑定 | ready-for-dev | bind_status=pending 记录来源 |
| EP02-S05 支付 Webhook | ready-for-dev | 设置 bind_deadline |
| Redis 配置 | 必须完成 | 分布式锁 |

### 后续依赖

本故事完成后，以下功能可以开始:
- EP05-S03 人工绑定会员（处理 manual_review 状态记录）
- EP05-S01 会员列表查询（共享 bindStatus 过滤）

---

## References

| 文档 | 路径 | 相关章节 |
|------|------|----------|
| PRD | `docs/PRD.md` | FR3.3 绑定超时检查 |
| 技术方案 | `docs/v1/design/技术方案.md` | 5.5.8 异步数据流, 定时任务配置 |
| 时序图 | `docs/v1/diagrams/时序图.md` | 6.3 绑定超时处理时序 |
| 状态枚举 | `docs/v1/design/状态枚举定义.md` | bind_status 状态机 |
| 通知模板 | `docs/v1/design/通知消息模板.md` | admin_bind_timeout |
| Epic 定义 | `docs/epics.md` | EP02-S08 |
| 前一故事 | `docs/sprint-artifacts/stories/2-7-user-fill-bind.md` | 用户填写绑定参考 |

---

## Dev Agent Record

### Context Reference
- Epic: EP02 会员报名与支付系统
- Story: EP02-S08 绑定超时检查与人工审核转入
- FR Coverage: FR3.3

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
| Epic | EP02 |
| 前置条件 | EP02-S07 完成 |
| 覆盖 FR | FR3.3 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
