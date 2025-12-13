# Story 3.3: 手动触发打卡同步

**Status**: ready-for-dev

---

## Story

**作为**管理员，
**我希望**能够手动触发某个训练营的打卡同步，
**以便于**在需要时立即获取最新打卡数据，而不必等待每日定时任务。

---

## 验收标准

### AC-1: 单营手动同步接口
```gherkin
Feature: 单个训练营手动同步
  Scenario: 管理员触发单营同步
    Given 管理员已登录
    And 训练营存在且状态为 ongoing
    When POST /api/admin/checkins/sync/{campId}
    Then 立即执行打卡同步
    And 返回同步结果:
      | 字段 | 说明 |
      | campId | 训练营ID |
      | syncTime | 同步完成时间 |
      | totalUsers | 排行榜总人数 |
      | successCount | 成功更新数 |
      | skippedCount | 跳过数（未绑定） |
      | duration | 执行耗时(ms) |

  Scenario: 训练营不存在
    Given 管理员已登录
    When POST /api/admin/checkins/sync/{invalidCampId}
    Then 返回 404
    And 错误信息 "训练营不存在"

  Scenario: 训练营状态非 ongoing
    Given 训练营状态为 draft/ended/settled
    When POST /api/admin/checkins/sync/{campId}
    Then 返回 400
    And 错误信息 "只能同步进行中的训练营"
```

### AC-2: 批量同步接口
```gherkin
Feature: 批量同步所有训练营
  Scenario: 触发批量同步
    Given 管理员已登录
    When POST /api/admin/checkins/sync
    Then 启动异步批量同步任务
    And 返回任务信息:
      | 字段 | 说明 |
      | taskId | 任务ID |
      | campCount | 待同步训练营数 |
      | status | processing |
      | startTime | 启动时间 |
    And 后台逐个同步所有 ongoing 训练营

  Scenario: 无进行中训练营
    Given 不存在 ongoing 状态的训练营
    When POST /api/admin/checkins/sync
    Then 返回 200
    And campCount = 0
    And status = "completed"
```

### AC-3: 分布式锁防并发
```gherkin
Feature: 分布式锁
  Scenario: 同步正在进行中
    Given 该训练营正在同步中（锁未释放）
    When 再次触发同步
    Then 返回错误码 1201
    And 错误信息 "同步进行中，请稍后再试"

  Scenario: 获取锁成功
    Given 没有其他同步在执行
    When 触发手动同步
    Then 获取锁 sync_lock:{campId}
    And 锁有效期 5 分钟
    And 同步完成后释放锁

  Scenario: 批量同步锁
    Given 批量同步正在进行中
    When 再次触发批量同步
    Then 返回错误码 1202
    And 错误信息 "批量同步进行中，请稍后再试"
```

### AC-4: 复用定时任务逻辑
```gherkin
Feature: 复用同步服务
  Scenario: 调用 CheckinSyncService
    Given 手动同步接口收到请求
    When 执行同步
    Then 调用 CheckinSyncService.syncCampCheckins(campId)
    And 与定时任务使用相同的同步逻辑
    And 更新 camp_member.checkin_count
    And 计算 eligible_for_refund
    And 记录 sync_log (triggered_by=manual)
```

### AC-5: 同步日志记录
```gherkin
Feature: 同步日志
  Scenario: 记录手动同步日志
    Given 手动同步完成
    When 无错误发生
    Then 插入 sync_log:
      | 字段 | 值 |
      | sync_type | checkin |
      | sync_source | planet_api |
      | camp_id | 训练营ID |
      | triggered_by | manual |
      | operator_id | 操作管理员ID |
      | status | success |
      | duration_ms | 执行耗时 |

  Scenario: 记录同步失败日志
    Given 手动同步过程发生异常
    When 捕获异常
    Then 插入 sync_log (status=failed)
    And 记录 error_message
```

### AC-6: Token过期处理
```gherkin
Feature: Token过期处理
  Scenario: Token过期时返回错误
    Given 知识星球 Token 已过期
    When 手动触发同步
    And 捕获 TokenExpiredException
    Then 返回错误码 1203
    And 错误信息 "知识星球Token已过期，请更新配置"
    And 记录 sync_log (status=failed)
```

### AC-7: 权限控制
```gherkin
Feature: 权限控制
  Scenario: 仅管理员可操作
    Given 用户角色为 admin
    When POST /api/admin/checkins/sync/{campId}
    Then 允许执行

  Scenario: 非管理员无权限
    Given 用户角色为 coach 或 volunteer
    When POST /api/admin/checkins/sync/{campId}
    Then 返回 403
    And 错误信息 "无权限执行此操作"
```

### AC-8: 同步进度查询
```gherkin
Feature: 同步进度查询
  Scenario: 查询批量同步进度
    Given 存在进行中的批量同步任务
    When GET /api/admin/checkins/sync/status/{taskId}
    Then 返回任务进度:
      | 字段 | 说明 |
      | taskId | 任务ID |
      | status | processing/completed/failed |
      | totalCamps | 总训练营数 |
      | completedCamps | 已完成数 |
      | currentCamp | 当前同步训练营名称 |
      | progress | 进度百分比 |
      | startTime | 开始时间 |
      | endTime | 结束时间（如已完成） |

  Scenario: 任务不存在
    Given 任务ID无效或已过期
    When GET /api/admin/checkins/sync/status/{invalidTaskId}
    Then 返回 404
    And 错误信息 "任务不存在或已过期"
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - 单营同步接口** (AC: #1, #4, #5)
  - [ ] 1.1 创建 `CheckinSyncController.java`
  - [ ] 1.2 实现 `POST /api/admin/checkins/sync/{campId}`
  - [ ] 1.3 校验训练营存在且状态为 ongoing
  - [ ] 1.4 调用 `CheckinSyncService.syncCampCheckins(campId)`
  - [ ] 1.5 返回同步结果 DTO
  - [ ] 1.6 编写接口测试

- [ ] **Task 2: 后端 - 批量同步接口** (AC: #2)
  - [ ] 2.1 实现 `POST /api/admin/checkins/sync`
  - [ ] 2.2 创建异步任务执行批量同步
  - [ ] 2.3 生成任务ID并存储到 Redis
  - [ ] 2.4 返回任务信息
  - [ ] 2.5 实现后台逐营同步逻辑
  - [ ] 2.6 编写单元测试

- [ ] **Task 3: 后端 - 分布式锁** (AC: #3)
  - [ ] 3.1 实现单营同步锁 `sync_lock:camp:{campId}`
  - [ ] 3.2 实现批量同步锁 `sync_lock:batch`
  - [ ] 3.3 锁有效期配置（默认5分钟）
  - [ ] 3.4 同步完成后释放锁
  - [ ] 3.5 编写并发测试

- [ ] **Task 4: 后端 - 同步日志增强** (AC: #5)
  - [ ] 4.1 在 `SyncLogService.java` 添加 `createManualSyncLog()`
  - [ ] 4.2 记录 `triggered_by=manual`
  - [ ] 4.3 记录 `operator_id`（当前管理员ID）
  - [ ] 4.4 区分手动同步和定时同步的日志

- [ ] **Task 5: 后端 - Token过期处理** (AC: #6)
  - [ ] 5.1 在 Controller 层捕获 `ZsxqTokenExpiredException`
  - [ ] 5.2 返回业务错误码 1203
  - [ ] 5.3 记录失败日志

- [ ] **Task 6: 后端 - 权限控制** (AC: #7)
  - [ ] 6.1 使用 `@PreAuthorize("hasRole('ADMIN')")`
  - [ ] 6.2 或自定义权限注解 `@RequireAdmin`
  - [ ] 6.3 编写权限测试

- [ ] **Task 7: 后端 - 进度查询接口** (AC: #8)
  - [ ] 7.1 实现 `GET /api/admin/checkins/sync/status/{taskId}`
  - [ ] 7.2 从 Redis 读取任务进度
  - [ ] 7.3 返回进度信息 DTO
  - [ ] 7.4 任务完成后保留进度信息30分钟
  - [ ] 7.5 编写接口测试

- [ ] **Task 8: 集成测试与验收** (AC: #全部)
  - [ ] 8.1 测试单营手动同步
  - [ ] 8.2 测试批量同步启动
  - [ ] 8.3 测试并发锁机制
  - [ ] 8.4 测试 Token 过期场景
  - [ ] 8.5 测试权限控制
  - [ ] 8.6 测试进度查询

---

## Dev Notes

### 业务流程概述

本故事为管理员提供手动同步打卡数据的能力，复用定时任务的同步逻辑。

```
管理员点击「同步」按钮
     ↓
POST /api/admin/checkins/sync/{campId}
     ↓
校验权限（仅 admin）
     ↓
校验训练营状态（ongoing）
     ↓
尝试获取分布式锁
     ↓ (获取成功)
调用 CheckinSyncService.syncCampCheckins()
     ↓
获取排行榜 → 更新 checkin_count → 计算 eligible_for_refund
     ↓
记录 sync_log (triggered_by=manual)
     ↓
释放分布式锁
     ↓
返回同步结果
```

### 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 同步方式 | 同步执行 | 单营同步耗时短（<30秒）|
| 批量同步 | 异步任务 | 多营同步耗时长，需后台执行 |
| 锁粒度 | 按训练营 | 允许不同训练营并行同步 |
| 锁有效期 | 5 分钟 | 比定时任务短，快速失败 |
| 日志区分 | triggered_by | 区分手动/定时，便于统计 |

### API 响应格式

#### 单营同步成功

```json
{
  "code": 200,
  "message": "同步成功",
  "data": {
    "campId": 1,
    "campName": "21天早起训练营",
    "syncTime": "2025-12-13T10:30:00",
    "totalUsers": 156,
    "successCount": 142,
    "skippedCount": 14,
    "duration": 3500
  }
}
```

#### 同步进行中错误

```json
{
  "code": 1201,
  "message": "同步进行中，请稍后再试",
  "data": {
    "campId": 1,
    "lockHolder": "定时任务",
    "lockExpireAt": "2025-12-13T01:05:00"
  }
}
```

#### 批量同步启动

```json
{
  "code": 200,
  "message": "批量同步已启动",
  "data": {
    "taskId": "sync_batch_1702450200000",
    "campCount": 5,
    "status": "processing",
    "startTime": "2025-12-13T10:30:00"
  }
}
```

### 代码实现参考

#### CheckinSyncController.java

```java
@RestController
@RequestMapping("/api/admin/checkins")
@RequiredArgsConstructor
@Slf4j
public class CheckinSyncController {

    private final CheckinSyncService checkinSyncService;
    private final TrainingCampMapper trainingCampMapper;
    private final StringRedisTemplate redisTemplate;

    private static final String LOCK_KEY_PREFIX = "sync_lock:camp:";
    private static final String BATCH_LOCK_KEY = "sync_lock:batch";
    private static final int LOCK_EXPIRE_SECONDS = 300; // 5分钟

    /**
     * 手动触发单个训练营打卡同步
     */
    @PostMapping("/sync/{campId}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<ManualSyncResultVO> syncCamp(
            @PathVariable Long campId,
            @AuthenticationPrincipal UserDetails user) {

        // 1. 校验训练营
        TrainingCamp camp = trainingCampMapper.selectById(campId);
        if (camp == null || camp.getDeletedAt() != null) {
            throw new BusinessException(404, "训练营不存在");
        }
        if (!"ongoing".equals(camp.getStatus())) {
            throw new BusinessException(400, "只能同步进行中的训练营");
        }

        // 2. 获取分布式锁
        String lockKey = LOCK_KEY_PREFIX + campId;
        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(
            lockKey,
            "manual:" + user.getUsername(),
            LOCK_EXPIRE_SECONDS,
            TimeUnit.SECONDS
        );

        if (Boolean.FALSE.equals(acquired)) {
            throw new BusinessException(1201, "同步进行中，请稍后再试");
        }

        try {
            // 3. 执行同步
            SyncResult result = checkinSyncService.syncCampCheckins(campId);

            // 4. 返回结果
            ManualSyncResultVO vo = ManualSyncResultVO.builder()
                .campId(campId)
                .campName(camp.getName())
                .syncTime(LocalDateTime.now())
                .totalUsers(result.getTotalCount())
                .successCount(result.getSuccessCount())
                .skippedCount(result.getSkippedCount())
                .duration(result.getDurationMs())
                .build();

            return Result.success(vo);

        } catch (ZsxqTokenExpiredException e) {
            log.error("Token expired during manual sync, campId={}", campId, e);
            throw new BusinessException(1203, "知识星球Token已过期，请更新配置");
        } finally {
            redisTemplate.delete(lockKey);
        }
    }

    /**
     * 批量同步所有进行中训练营
     */
    @PostMapping("/sync")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<BatchSyncTaskVO> syncAllCamps(
            @AuthenticationPrincipal UserDetails user) {

        // 1. 获取批量同步锁
        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(
            BATCH_LOCK_KEY,
            "batch:" + user.getUsername(),
            600, // 10分钟
            TimeUnit.SECONDS
        );

        if (Boolean.FALSE.equals(acquired)) {
            throw new BusinessException(1202, "批量同步进行中，请稍后再试");
        }

        // 2. 查询待同步训练营
        List<TrainingCamp> camps = trainingCampMapper.selectOngoingCampsWithCheckinId();

        if (camps.isEmpty()) {
            redisTemplate.delete(BATCH_LOCK_KEY);
            return Result.success(BatchSyncTaskVO.builder()
                .taskId(generateTaskId())
                .campCount(0)
                .status("completed")
                .startTime(LocalDateTime.now())
                .build());
        }

        // 3. 创建异步任务
        String taskId = generateTaskId();
        asyncExecuteBatchSync(taskId, camps, user.getUsername());

        return Result.success(BatchSyncTaskVO.builder()
            .taskId(taskId)
            .campCount(camps.size())
            .status("processing")
            .startTime(LocalDateTime.now())
            .build());
    }

    /**
     * 查询批量同步进度
     */
    @GetMapping("/sync/status/{taskId}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<BatchSyncProgressVO> getSyncProgress(@PathVariable String taskId) {
        String progressJson = redisTemplate.opsForValue().get("sync_progress:" + taskId);

        if (progressJson == null) {
            throw new BusinessException(404, "任务不存在或已过期");
        }

        BatchSyncProgressVO progress = JsonUtils.parse(progressJson, BatchSyncProgressVO.class);
        return Result.success(progress);
    }

    @Async
    private void asyncExecuteBatchSync(String taskId, List<TrainingCamp> camps, String operator) {
        String progressKey = "sync_progress:" + taskId;
        BatchSyncProgressVO progress = new BatchSyncProgressVO();
        progress.setTaskId(taskId);
        progress.setTotalCamps(camps.size());
        progress.setStatus("processing");
        progress.setStartTime(LocalDateTime.now());

        try {
            for (int i = 0; i < camps.size(); i++) {
                TrainingCamp camp = camps.get(i);
                progress.setCurrentCamp(camp.getName());
                progress.setCompletedCamps(i);
                progress.setProgress((i * 100) / camps.size());
                redisTemplate.opsForValue().set(progressKey, JsonUtils.toJson(progress), 30, TimeUnit.MINUTES);

                try {
                    checkinSyncService.syncCampCheckins(camp.getId());
                } catch (Exception e) {
                    log.error("Batch sync failed for camp {}", camp.getId(), e);
                    // 继续同步下一个
                }
            }

            progress.setStatus("completed");
            progress.setCompletedCamps(camps.size());
            progress.setProgress(100);
            progress.setEndTime(LocalDateTime.now());

        } catch (Exception e) {
            progress.setStatus("failed");
            progress.setErrorMessage(e.getMessage());
        } finally {
            redisTemplate.opsForValue().set(progressKey, JsonUtils.toJson(progress), 30, TimeUnit.MINUTES);
            redisTemplate.delete(BATCH_LOCK_KEY);
        }
    }

    private String generateTaskId() {
        return "sync_batch_" + System.currentTimeMillis();
    }
}
```

#### ManualSyncResultVO.java

```java
@Data
@Builder
public class ManualSyncResultVO {
    private Long campId;
    private String campName;
    private LocalDateTime syncTime;
    private Integer totalUsers;
    private Integer successCount;
    private Integer skippedCount;
    private Long duration;
}
```

#### BatchSyncProgressVO.java

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchSyncProgressVO {
    private String taskId;
    private String status; // processing, completed, failed
    private Integer totalCamps;
    private Integer completedCamps;
    private String currentCamp;
    private Integer progress; // 0-100
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String errorMessage;
}
```

#### SyncLogService.java - 增强

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class SyncLogService {

    private final SyncLogMapper syncLogMapper;

    /**
     * 创建手动同步成功日志
     */
    public void createManualSyncLog(String syncType, Long campId, SyncResult result, Long operatorId) {
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
        log.setTriggeredBy("manual");  // 区分手动触发
        log.setOperatorId(operatorId); // 记录操作人
        log.setStartedAt(LocalDateTime.now().minusMillis(result.getDurationMs()));
        log.setFinishedAt(LocalDateTime.now());
        log.setCreatedAt(LocalDateTime.now());

        syncLogMapper.insert(log);
    }

    /**
     * 创建手动同步失败日志
     */
    public void createManualFailedLog(String syncType, Long campId, Exception e, Long operatorId) {
        SyncLog log = new SyncLog();
        log.setSyncType(syncType);
        log.setSyncSource("planet_api");
        log.setCampId(campId);
        log.setStatus("failed");
        log.setErrorMessage(e.getMessage());
        log.setTriggeredBy("manual");
        log.setOperatorId(operatorId);
        log.setStartedAt(LocalDateTime.now());
        log.setFinishedAt(LocalDateTime.now());
        log.setCreatedAt(LocalDateTime.now());

        syncLogMapper.insert(log);
    }
}
```

### 错误码定义

| 错误码 | HTTP | 含义 |
|--------|------|------|
| 1201 | 409 | 同步进行中，请稍后再试 |
| 1202 | 409 | 批量同步进行中，请稍后再试 |
| 1203 | 503 | 知识星球Token已过期 |

### 安全检查清单

- [ ] 权限控制：仅 admin 角色可执行
- [ ] 分布式锁防止并发同步
- [ ] Token 过期友好提示
- [ ] 操作日志记录操作人
- [ ] 敏感信息不写入日志

### 测试要点

**后端测试**:
1. `CheckinSyncControllerTest` - 测试接口权限、参数校验
2. 测试分布式锁获取和释放
3. 测试 Token 过期异常处理
4. 测试批量同步异步执行

**集成测试**:
1. Mock zsxq-sdk 测试完整同步流程
2. 测试并发请求锁机制
3. 测试进度查询接口
4. 测试异常场景（训练营不存在、状态错误）

---

## 项目结构

### 后端新增/修改文件

```
backend/src/main/java/com/camp/
├── controller/
│   └── admin/
│       └── CheckinSyncController.java     # 新增同步控制器
├── service/
│   └── SyncLogService.java                # 修改增加手动同步日志
├── vo/
│   └── sync/
│       ├── ManualSyncResultVO.java        # 新增同步结果
│       ├── BatchSyncTaskVO.java           # 新增批量任务
│       └── BatchSyncProgressVO.java       # 新增进度查询
└── exception/
    └── ErrorCode.java                     # 新增错误码
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP03-S01 SDK集成 | ready-for-dev | ZsxqClient, ZsxqCheckinService |
| EP03-S02 定时同步 | ready-for-dev | CheckinSyncService.syncCampCheckins() |
| EP01-S02 JWT认证 | drafted | @PreAuthorize 权限控制 |
| Redis 配置 | 必须完成 | 分布式锁、进度存储 |

### 后续依赖

本故事完成后，以下功能可以开始:
- EP03-S04 Token过期告警机制（共享Token异常处理）
- EP03-S06 管理后台打卡统计（前端调用同步按钮）

---

## References

| 文档 | 路径 | 相关章节 |
|------|------|----------|
| PRD | `docs/PRD.md` | FR4.3 手动同步触发 |
| 接口文档 | `docs/v1/api/接口文档.md` | 6.1 同步打卡数据, 6.4 批量同步 |
| 技术方案 | `docs/v1/design/技术方案.md` | 定时任务配置、分布式锁 |
| Epic 定义 | `docs/epics.md` | EP03-S03 |
| 前一故事 | `docs/sprint-artifacts/stories/3-2-checkin-sync-task.md` | 定时同步任务 |

---

## Dev Agent Record

### Context Reference
- Epic: EP03 打卡数据同步与进度查询
- Story: EP03-S03 手动触发打卡同步
- FR Coverage: FR4.3

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
| 覆盖 FR | FR4.3 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
