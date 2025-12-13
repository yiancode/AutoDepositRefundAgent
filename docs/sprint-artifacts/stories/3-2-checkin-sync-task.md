# Story 3.2: 打卡数据定时同步任务

**Status**: ready-for-dev

---

## Story

**作为**系统，
**我希望**每天凌晨自动同步所有进行中训练营的打卡数据，
**以便于**准确统计会员打卡进度并判断退款资格。

---

## 验收标准

### AC-1: 定时任务配置
```gherkin
Feature: 打卡同步定时任务
  Scenario: 定时任务自动执行
    Given 系统配置了打卡同步任务
    When 到达每天 01:00
    Then 自动执行 CheckinSyncTask
    And 记录任务开始时间
    And 使用 Redis 分布式锁防止并发

  Scenario: 任务开关控制
    Given 配置 camp.task.checkin-sync.enabled=false
    When 任务触发时间到达
    Then 跳过执行
    And 记录跳过日志
```

### AC-2: 查询进行中训练营
```gherkin
Feature: 训练营筛选
  Scenario: 筛选需要同步的训练营
    Given 执行打卡同步任务
    When 查询训练营列表
    Then 筛选条件:
      | 字段 | 条件 |
      | status | ongoing |
      | planet_checkin_id | IS NOT NULL |
      | deleted_at | IS NULL |
    And 返回待同步训练营列表

  Scenario: 无进行中训练营
    Given 不存在 ongoing 状态的训练营
    When 执行同步任务
    Then 任务正常结束
    And 记录日志 "No ongoing camps to sync"
```

### AC-3: 调用SDK获取排行榜
```gherkin
Feature: 打卡排行榜获取
  Scenario: 获取训练营打卡排行榜
    Given 存在进行中的训练营
    And 训练营配置了 planet_checkin_id
    When 调用 zsxqClient.checkins().getRankingList(groupId, checkinId)
    Then 返回 List<RankingItem>
    And 每项包含:
      | 字段 | 说明 |
      | user.userId | 星球用户ID |
      | user.name | 星球昵称 |
      | count | 累计打卡天数 |
      | rank | 排名 |
    And SDK 内部处理分页

  Scenario: 训练营无打卡记录
    Given 训练营刚开始，无人打卡
    When 获取排行榜
    Then 返回空列表
    And 不抛出异常
    And 记录日志
```

### AC-4: 更新会员打卡统计
```gherkin
Feature: 打卡统计更新
  Scenario: 更新会员打卡天数
    Given 获取到排行榜数据
    And 会员已完成身份绑定 (bind_status=completed)
    When 处理排行榜数据
    Then 根据 planet_member_number 匹配 camp_member
    And 更新 camp_member.checkin_count = RankingItem.count
    And 更新 camp_member.last_checkin_time = 当前时间

  Scenario: 未绑定会员跳过
    Given 获取到排行榜数据
    And 存在星球用户未与会员绑定
    When 处理排行榜数据
    Then 跳过该用户
    And 记录跳过日志（含 planet_user_id）
```

### AC-5: 计算退款资格
```gherkin
Feature: 退款资格计算
  Scenario: 达到打卡要求
    Given 会员 checkin_count >= required_days
    When 更新打卡统计后
    Then 设置 eligible_for_refund = true
    And 设置 checkin_status = qualified

  Scenario: 未达到打卡要求
    Given 会员 checkin_count < required_days
    And 训练营尚未结束
    When 更新打卡统计后
    Then 设置 eligible_for_refund = false
    And 设置 checkin_status = pending

  Scenario: 训练营结束未达标
    Given 会员 checkin_count < required_days
    And 训练营已结束 (end_date < 当前日期)
    When 更新打卡统计后
    Then 设置 eligible_for_refund = false
    And 设置 checkin_status = unqualified
```

### AC-6: 同步日志记录
```gherkin
Feature: 同步日志
  Scenario: 记录同步成功日志
    Given 打卡同步完成
    When 无错误发生
    Then 插入 sync_log:
      | 字段 | 值 |
      | sync_type | checkin |
      | sync_source | planet_api |
      | camp_id | 训练营ID |
      | total_count | 排行榜总人数 |
      | success_count | 成功更新数 |
      | skipped_count | 跳过数（未绑定） |
      | status | success |
      | triggered_by | scheduler |
      | duration_ms | 执行耗时 |

  Scenario: 记录同步失败日志
    Given 打卡同步过程发生异常
    When 捕获异常
    Then 插入 sync_log:
      | 字段 | 值 |
      | status | failed |
      | error_message | 错误信息 |
      | error_details | 错误详情（JSON） |
```

### AC-7: Token过期处理
```gherkin
Feature: Token过期处理
  Scenario: Token过期时发送告警
    Given 知识星球 Token 已过期
    When 同步任务捕获 TokenExpiredException
    Then 记录 sync_log (status=failed)
    And 发送企业微信告警通知管理员
    And 通知内容: "知识星球Token已过期，请更新system_config"
    And 跳过本次同步

  Scenario: Token有效继续执行
    Given Token 有效
    When 调用 SDK
    Then 正常获取数据
    And 继续同步流程
```

### AC-8: 分布式锁
```gherkin
Feature: 分布式锁
  Scenario: 获取锁成功
    Given 没有其他实例在执行
    When 尝试获取分布式锁 checkin_sync_lock
    Then 获取成功
    And 锁有效期 10 分钟
    And 执行同步任务
    And 任务完成后释放锁

  Scenario: 获取锁失败
    Given 其他实例正在执行
    When 尝试获取分布式锁
    Then 获取失败
    And 跳过本次执行
    And 记录跳过日志
```

### AC-9: 单营同步接口（复用）
```gherkin
Feature: 单训练营同步
  Scenario: 提供同步服务方法
    Given CheckinSyncService 提供 syncCampCheckins(campId) 方法
    When 传入训练营ID
    Then 同步该训练营的打卡数据
    And 返回 SyncResult (totalCount, successCount, failedCount)
    And 该方法可被手动同步接口复用
```

### AC-10: 异常隔离
```gherkin
Feature: 异常隔离
  Scenario: 单营同步失败不影响其他
    Given 同步任务遍历多个训练营
    And 其中一个训练营同步失败
    When 捕获异常
    Then 记录失败日志
    And 继续同步下一个训练营
    And 任务结束后汇总失败数

  Scenario: 网络异常重试
    Given API 调用网络异常
    When 捕获 NetworkException
    Then 重试最多 3 次
    And 重试间隔 2 秒
    And 全部失败后标记该训练营同步失败
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - 定时任务框架** (AC: #1, #8)
  - [ ] 1.1 创建 `CheckinSyncTask.java`
  - [ ] 1.2 配置 `@Scheduled(cron = "0 0 1 * * ?")`（每天01:00）
  - [ ] 1.3 实现 Redis 分布式锁
  - [ ] 1.4 添加任务开关配置 `camp.task.checkin-sync.enabled`
  - [ ] 1.5 编写单元测试

- [ ] **Task 2: 后端 - 同步服务实现** (AC: #2, #3, #4, #9)
  - [ ] 2.1 创建 `CheckinSyncService.java`
  - [ ] 2.2 实现 `syncAllOngoingCamps()` 方法:
    - 查询 ongoing 状态训练营
    - 遍历同步每个训练营
    - 汇总同步结果
  - [ ] 2.3 实现 `syncCampCheckins(campId)` 方法:
    - 调用 ZsxqCheckinService 获取排行榜
    - 匹配 camp_member 记录
    - 更新 checkin_count
  - [ ] 2.4 编写单元测试（Mock SDK）

- [ ] **Task 3: 后端 - 退款资格计算** (AC: #5)
  - [ ] 3.1 在 `CheckinSyncService.java` 添加退款资格计算
  - [ ] 3.2 实现 `calculateEligibility(member, camp)`:
    - checkin_count >= required_days → eligible = true
    - 更新 checkin_status
  - [ ] 3.3 编写计算逻辑测试

- [ ] **Task 4: 后端 - 同步日志** (AC: #6)
  - [ ] 4.1 创建 `SyncLogService.java`
  - [ ] 4.2 实现 `createSyncLog(type, campId, result)` 方法
  - [ ] 4.3 实现日志记录（开始、成功、失败）
  - [ ] 4.4 SyncLogMapper 批量插入方法

- [ ] **Task 5: 后端 - Token过期告警** (AC: #7)
  - [ ] 5.1 在同步服务中捕获 TokenExpiredException
  - [ ] 5.2 调用 WechatNotifyManager 发送告警
  - [ ] 5.3 创建告警消息模板 `token_expired_alert`
  - [ ] 5.4 编写异常处理测试

- [ ] **Task 6: 后端 - 异常隔离与重试** (AC: #10)
  - [ ] 6.1 实现单营同步异常隔离
  - [ ] 6.2 实现 Spring Retry 重试机制
  - [ ] 6.3 配置重试参数:
    ```yaml
    camp:
      task:
        checkin-sync:
          retry-times: 3
          retry-interval: 2000
    ```
  - [ ] 6.4 编写异常场景测试

- [ ] **Task 7: 后端 - CampMemberMapper 更新** (AC: #4, #5)
  - [ ] 7.1 添加 `selectByPlanetMemberNumber(campId, planetMemberNumber)`
  - [ ] 7.2 添加 `batchUpdateCheckinStats(List<CheckinUpdateDTO>)`
  - [ ] 7.3 添加相关索引优化

- [ ] **Task 8: 后端 - 配置管理** (AC: #1)
  - [ ] 8.1 添加配置项:
    ```yaml
    camp:
      task:
        checkin-sync:
          enabled: true
          cron: "0 0 1 * * ?"
          retry-times: 3
          retry-interval: 2000
          lock-expire-seconds: 600
    ```
  - [ ] 8.2 创建 `CheckinSyncProperties.java`

- [ ] **Task 9: 集成测试与验收** (AC: #全部)
  - [ ] 9.1 测试定时任务触发
  - [ ] 9.2 测试分布式锁
  - [ ] 9.3 测试完整同步流程（Mock SDK）
  - [ ] 9.4 测试退款资格计算
  - [ ] 9.5 测试异常场景（Token过期、网络异常）
  - [ ] 9.6 测试同步日志记录

---

## Dev Notes

### 业务流程概述

本故事实现打卡数据定时同步，是打卡核心功能之一。

```
每天 01:00 定时任务触发
     ↓
获取 Redis 分布式锁
     ↓
查询所有 status=ongoing 的训练营
     ↓
遍历每个训练营：
  ↓
  调用 zsxqClient.checkins().getRankingList()
  ↓
  遍历排行榜数据：
    ↓
    根据 planet_member_number 匹配 camp_member
    ↓
    更新 checkin_count
    ↓
    计算 eligible_for_refund
  ↓
  记录 sync_log
↓
释放分布式锁
↓
任务完成，记录总体日志
```

### 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 执行时间 | 每天 01:00 | 避开业务高峰，确保数据稳定 |
| 同步方式 | 全量覆盖 | 排行榜 count 是累计值，直接覆盖即可 |
| 匹配方式 | planet_member_number | 绑定时已建立关联 |
| 锁有效期 | 10 分钟 | 预留充足同步时间 |
| 异常处理 | 单营隔离 | 一个训练营失败不影响其他 |

### 数据流转说明

```
知识星球 API (RankingItem)
     ↓
┌─────────────────────────────────────┐
│ userId → planet_user.planet_user_id │
│ name   → 用于日志记录和验证         │
│ count  → camp_member.checkin_count  │
└─────────────────────────────────────┘
     ↓
计算退款资格:
checkin_count >= required_days → eligible_for_refund = true
```

### 代码实现参考

#### CheckinSyncTask.java

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class CheckinSyncTask {

    private final CheckinSyncService checkinSyncService;
    private final StringRedisTemplate redisTemplate;
    private final WechatNotifyManager notifyManager;

    @Value("${camp.task.checkin-sync.enabled:true}")
    private boolean enabled;

    @Value("${camp.task.checkin-sync.lock-expire-seconds:600}")
    private int lockExpireSeconds;

    private static final String LOCK_KEY = "task:checkin_sync:lock";

    /**
     * 每天 01:00 执行打卡数据同步
     */
    @Scheduled(cron = "${camp.task.checkin-sync.cron:0 0 1 * * ?}")
    public void syncCheckins() {
        if (!enabled) {
            log.info("Checkin sync task is disabled");
            return;
        }

        // 获取分布式锁
        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(
            LOCK_KEY,
            String.valueOf(System.currentTimeMillis()),
            lockExpireSeconds,
            TimeUnit.SECONDS
        );

        if (Boolean.FALSE.equals(acquired)) {
            log.info("Checkin sync task is running on another instance, skip");
            return;
        }

        long startTime = System.currentTimeMillis();
        log.info("Checkin sync task started");

        try {
            SyncTaskResult result = checkinSyncService.syncAllOngoingCamps();
            log.info("Checkin sync task completed: camps={}, totalSuccess={}, totalFailed={}",
                    result.getCampCount(),
                    result.getTotalSuccessCount(),
                    result.getTotalFailedCount());

        } catch (ZsxqTokenExpiredException e) {
            log.error("Checkin sync failed: Token expired", e);
            notifyManager.sendAdminAlert(
                "【打卡同步失败】知识星球Token已过期，请更新system_config中的zsxq.token配置"
            );
        } catch (Exception e) {
            log.error("Checkin sync task failed", e);
            notifyManager.sendAdminAlert(
                String.format("【打卡同步失败】错误信息: %s", e.getMessage())
            );
        } finally {
            redisTemplate.delete(LOCK_KEY);
            long elapsed = System.currentTimeMillis() - startTime;
            log.info("Checkin sync task finished in {} ms", elapsed);
        }
    }
}
```

#### CheckinSyncService.java

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class CheckinSyncService {

    private final TrainingCampMapper trainingCampMapper;
    private final CampMemberMapper campMemberMapper;
    private final ZsxqCheckinService zsxqCheckinService;
    private final SyncLogService syncLogService;

    @Value("${camp.task.checkin-sync.retry-times:3}")
    private int retryTimes;

    /**
     * 同步所有进行中训练营的打卡数据
     */
    public SyncTaskResult syncAllOngoingCamps() {
        // 查询所有进行中的训练营
        List<TrainingCamp> camps = trainingCampMapper.selectOngoingCampsWithCheckinId();

        if (camps.isEmpty()) {
            log.info("No ongoing camps to sync");
            return new SyncTaskResult(0, 0, 0);
        }

        log.info("Found {} ongoing camps to sync", camps.size());

        int totalSuccess = 0;
        int totalFailed = 0;
        List<Long> failedCampIds = new ArrayList<>();

        for (TrainingCamp camp : camps) {
            try {
                SyncResult result = syncCampCheckins(camp.getId());
                totalSuccess += result.getSuccessCount();
                log.info("Camp {} sync completed: success={}, skipped={}",
                        camp.getId(), result.getSuccessCount(), result.getSkippedCount());
            } catch (Exception e) {
                totalFailed++;
                failedCampIds.add(camp.getId());
                log.error("Camp {} sync failed", camp.getId(), e);
                // 继续同步下一个训练营
            }
        }

        if (!failedCampIds.isEmpty()) {
            log.warn("Sync failed for camps: {}", failedCampIds);
        }

        return new SyncTaskResult(camps.size(), totalSuccess, totalFailed);
    }

    /**
     * 同步单个训练营的打卡数据（可被手动同步复用）
     */
    @Retryable(
        value = {ZsxqNetworkException.class},
        maxAttempts = 3,
        backoff = @Backoff(delay = 2000)
    )
    public SyncResult syncCampCheckins(Long campId) {
        TrainingCamp camp = trainingCampMapper.selectById(campId);
        if (camp == null || camp.getDeletedAt() != null) {
            throw new BusinessException("训练营不存在: " + campId);
        }

        long startTime = System.currentTimeMillis();

        // 调用 SDK 获取排行榜
        List<CheckinRankingDTO> rankings = zsxqCheckinService.getRankingList(
            camp.getPlanetCheckinId()
        );

        int successCount = 0;
        int skippedCount = 0;
        int failedCount = 0;

        for (CheckinRankingDTO ranking : rankings) {
            try {
                // 根据星球成员编号匹配会员
                CampMember member = campMemberMapper.selectByPlanetMemberNumber(
                    campId,
                    ranking.getUserId()  // planet_user_id
                );

                if (member == null) {
                    skippedCount++;
                    log.debug("Skip unbound user: planetUserId={}", ranking.getUserId());
                    continue;
                }

                // 更新打卡统计
                updateMemberCheckinStats(member, ranking.getCheckinCount(), camp);
                successCount++;

            } catch (Exception e) {
                failedCount++;
                log.error("Failed to update member checkin: planetUserId={}",
                        ranking.getUserId(), e);
            }
        }

        long duration = System.currentTimeMillis() - startTime;

        // 记录同步日志
        SyncResult result = SyncResult.builder()
            .campId(campId)
            .totalCount(rankings.size())
            .successCount(successCount)
            .skippedCount(skippedCount)
            .failedCount(failedCount)
            .durationMs(duration)
            .build();

        syncLogService.createSuccessLog("checkin", campId, result);

        return result;
    }

    @Transactional(rollbackFor = Exception.class)
    private void updateMemberCheckinStats(CampMember member, int checkinCount,
                                          TrainingCamp camp) {
        int oldCount = member.getCheckinCount();
        member.setCheckinCount(checkinCount);
        member.setLastCheckinTime(LocalDateTime.now());

        // 计算退款资格
        boolean eligible = checkinCount >= camp.getRequiredDays();
        member.setEligibleForRefund(eligible);

        // 更新打卡状态
        if (eligible) {
            member.setCheckinStatus("qualified");
        } else if (camp.getEndDate().isBefore(LocalDate.now())) {
            member.setCheckinStatus("unqualified");
        } else {
            member.setCheckinStatus("pending");
        }

        member.setUpdatedAt(LocalDateTime.now());
        campMemberMapper.updateById(member);

        if (oldCount != checkinCount) {
            log.info("Updated member {} checkin: {} -> {}, eligible={}",
                    member.getId(), oldCount, checkinCount, eligible);
        }
    }
}
```

#### SyncLogService.java

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class SyncLogService {

    private final SyncLogMapper syncLogMapper;

    /**
     * 创建成功日志
     */
    public void createSuccessLog(String syncType, Long campId, SyncResult result) {
        SyncLog log = new SyncLog();
        log.setSyncType(syncType);
        log.setSyncSource("planet_api");
        log.setCampId(campId);
        log.setTotalCount(result.getTotalCount());
        log.setSuccessCount(result.getSuccessCount());
        log.setSkippedCount(result.getSkippedCount());
        log.setFailedCount(result.getFailedCount());
        log.setDurationMs(result.getDurationMs());
        log.setStatus("success");
        log.setTriggeredBy("scheduler");
        log.setStartedAt(LocalDateTime.now().minusMillis(result.getDurationMs()));
        log.setFinishedAt(LocalDateTime.now());
        log.setCreatedAt(LocalDateTime.now());

        syncLogMapper.insert(log);
    }

    /**
     * 创建失败日志
     */
    public void createFailedLog(String syncType, Long campId, Exception e) {
        SyncLog log = new SyncLog();
        log.setSyncType(syncType);
        log.setSyncSource("planet_api");
        log.setCampId(campId);
        log.setStatus("failed");
        log.setErrorMessage(e.getMessage());
        log.setErrorDetails(JsonUtils.toJson(Map.of(
            "exceptionClass", e.getClass().getName(),
            "stackTrace", ExceptionUtils.getStackTrace(e)
        )));
        log.setTriggeredBy("scheduler");
        log.setStartedAt(LocalDateTime.now());
        log.setFinishedAt(LocalDateTime.now());
        log.setCreatedAt(LocalDateTime.now());

        syncLogMapper.insert(log);
    }
}
```

#### TrainingCampMapper.java - 新增查询

```java
@Mapper
public interface TrainingCampMapper extends BaseMapper<TrainingCamp> {

    /**
     * 查询需要同步打卡的训练营（ongoing + 有 planet_checkin_id）
     */
    @Select("""
        SELECT * FROM training_camp
        WHERE status = 'ongoing'
          AND planet_checkin_id IS NOT NULL
          AND deleted_at IS NULL
        ORDER BY id
        """)
    List<TrainingCamp> selectOngoingCampsWithCheckinId();
}
```

#### CampMemberMapper.java - 新增查询

```java
@Mapper
public interface CampMemberMapper extends BaseMapper<CampMember> {

    /**
     * 根据训练营ID和星球用户ID查询会员
     */
    @Select("""
        SELECT cm.* FROM camp_member cm
        JOIN planet_user pu ON cm.planet_member_number = pu.member_number
        WHERE cm.camp_id = #{campId}
          AND pu.planet_user_id = #{planetUserId}
          AND cm.bind_status = 'completed'
          AND cm.deleted_at IS NULL
        """)
    CampMember selectByPlanetUserId(
        @Param("campId") Long campId,
        @Param("planetUserId") String planetUserId
    );
}
```

#### application.yml 配置

```yaml
camp:
  task:
    checkin-sync:
      enabled: true
      cron: "0 0 1 * * ?"         # 每天01:00执行
      retry-times: 3               # 重试次数
      retry-interval: 2000         # 重试间隔(ms)
      lock-expire-seconds: 600     # 分布式锁有效期(秒)
```

### 安全检查清单

- [ ] 分布式锁防止多实例并发执行
- [ ] Token 过期时发送告警通知
- [ ] 单营同步失败不影响其他训练营
- [ ] 敏感信息不写入日志（如 Token）
- [ ] 同步日志完整记录便于问题追踪

### 错误码

| 场景 | 处理 |
|------|------|
| Token 过期 | 发送告警，跳过同步，记录失败日志 |
| 网络异常 | 重试3次，失败后标记该训练营失败 |
| 会员未绑定 | 跳过，记录 skipped_count |
| 数据库异常 | 事务回滚，记录失败日志 |

### 数据库索引

确保以下索引存在以优化查询性能：

```sql
-- 训练营状态和打卡ID查询
CREATE INDEX idx_tc_ongoing_checkin ON training_camp(status, planet_checkin_id)
    WHERE status = 'ongoing' AND deleted_at IS NULL;

-- 会员星球ID匹配查询
CREATE INDEX idx_pu_planet_user_id ON planet_user(planet_user_id)
    WHERE deleted_at IS NULL;

-- 同步日志查询
CREATE INDEX idx_sl_camp_type ON sync_log(camp_id, sync_type);
CREATE INDEX idx_sl_status_time ON sync_log(status, started_at);
```

### 测试要点

**后端测试**:
1. `CheckinSyncTaskTest` - 测试定时任务、分布式锁
2. `CheckinSyncServiceTest` - Mock SDK 测试同步逻辑
3. `SyncLogServiceTest` - 测试日志记录

**集成测试**:
1. 使用真实Token测试API调用（CI环境配置）
2. 测试完整同步流程
3. 测试异常场景（Token过期、网络异常）
4. 测试退款资格计算逻辑

---

## 项目结构

### 后端新增/修改文件

```
backend/src/main/java/com/camp/
├── schedule/
│   └── CheckinSyncTask.java              # 新增定时任务
├── service/
│   ├── CheckinSyncService.java           # 新增同步服务
│   └── SyncLogService.java               # 新增日志服务
├── config/
│   └── CheckinSyncProperties.java        # 新增配置类
├── dto/
│   └── sync/
│       ├── SyncResult.java               # 同步结果
│       └── SyncTaskResult.java           # 任务结果
└── mapper/
    ├── TrainingCampMapper.java           # 新增查询方法
    └── CampMemberMapper.java             # 新增查询方法
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP03-S01 SDK集成 | ready-for-dev | ZsxqClient, ZsxqCheckinService |
| EP01-S01 项目骨架 | ready-for-dev | Spring Boot基础框架 |
| Redis 配置 | 必须完成 | 分布式锁 |
| 知识星球Token | 需人工获取 | 从浏览器获取 |

### 后续依赖

本故事完成后，以下功能可以开始:
- EP03-S03 手动触发打卡同步
- EP03-S04 Token过期告警机制
- EP03-S05 H5打卡进度查询
- EP03-S06 管理后台打卡统计
- EP04-S01 直接匹配实现（依赖打卡数据）

---

## References

| 文档 | 路径 | 相关章节 |
|------|------|----------|
| PRD | `docs/PRD.md` | FR4.2 定时同步任务 |
| 技术方案 | `docs/v1/design/技术方案.md` | 5.11.7 打卡同步流程 |
| 数据库设计 | `docs/v1/design/数据库设计.md` | sync_log, camp_member |
| zsxq-sdk一致性 | `docs/v1/design/zsxq-sdk-database-consistency-report.md` | 字段映射 |
| Epic 定义 | `docs/epics.md` | EP03-S02 |
| 前一故事 | `docs/sprint-artifacts/stories/3-1-zsxq-sdk-integration.md` | SDK集成 |

---

## Dev Agent Record

### Context Reference
- Epic: EP03 打卡数据同步与进度查询
- Story: EP03-S02 打卡数据定时同步任务
- FR Coverage: FR4.2, FR4.4, FR4.5

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
| Epic | EP03 |
| 前置条件 | EP03-S01 完成 |
| 覆盖 FR | FR4.2, FR4.4, FR4.5 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
