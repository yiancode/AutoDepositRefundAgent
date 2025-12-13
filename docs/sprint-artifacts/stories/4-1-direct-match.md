# Story 4.1: 直接匹配实现

**Status**: ready-for-dev

---

## Story

**作为**系统，
**我希望**能够基于绑定状态直接确定会员匹配结果，
**以便于**为后续退款流程提供可靠的身份匹配基础。

---

## 验收标准

### AC-1: 已绑定用户直接匹配成功
```gherkin
Feature: 直接匹配
  Scenario: 已绑定用户直接匹配成功
    Given camp_member 的 bind_status = completed
    And bind_method IN (h5_bindplanet, user_fill, manual)
    When 执行匹配服务
    Then match_status = matched
    And 使用绑定时填写的 planet_member_number
    And 记录匹配时间 matched_at

  Scenario: 已绑定用户包含有效星球信息
    Given camp_member.bind_status = completed
    And camp_member.planet_member_number IS NOT NULL
    When 执行匹配
    Then 验证 planet_member_number 在 planet_user 表中存在
    And 关联成功后 match_status = matched

  Scenario: 绑定完成但星球信息无效
    Given camp_member.bind_status = completed
    And planet_member_number 在 planet_user 表中不存在
    When 执行匹配
    Then match_status = failed
    And 记录失败原因 "星球用户不存在"
    And 列入待人工处理列表
```

### AC-2: 未绑定用户转人工处理
```gherkin
Feature: 未绑定用户处理
  Scenario: 已过期用户转人工处理
    Given camp_member 的 bind_status = expired
    When 执行匹配
    Then match_status = pending
    And 列入待人工匹配列表

  Scenario: 待审核用户转人工处理
    Given camp_member 的 bind_status = manual_review
    When 执行匹配
    Then match_status = pending
    And 列入待人工匹配列表

  Scenario: 待绑定用户暂不匹配
    Given camp_member 的 bind_status = pending
    When 执行匹配
    Then 跳过匹配
    And match_status 保持 NULL
    And 记录日志 "绑定进行中，跳过匹配"

  Scenario: 已关闭用户标记失败
    Given camp_member 的 bind_status = closed
    When 执行匹配
    Then match_status = failed
    And 记录失败原因 "绑定已关闭"
```

### AC-3: 批量匹配支持
```gherkin
Feature: 批量匹配
  Scenario: 训练营结束时批量匹配
    Given 训练营状态变为 ended
    When 触发批量匹配任务
    Then 获取该训练营所有 match_status IS NULL 的会员
    And 对每个会员执行匹配逻辑
    And 返回匹配结果统计

  Scenario: 批量匹配结果统计
    Given 批量匹配任务执行完成
    Then 返回统计信息:
      | 字段 | 说明 |
      | totalProcessed | 处理总数 |
      | matchedCount | 匹配成功数 |
      | pendingCount | 待人工处理数 |
      | failedCount | 匹配失败数 |
      | skippedCount | 跳过数 |
    And 记录到 operation_log
```

### AC-4: 匹配结果记录
```gherkin
Feature: 匹配结果记录
  Scenario: 记录匹配状态变更日志
    Given 执行匹配操作
    When match_status 发生变更
    Then 记录到 member_match_log:
      | 字段 | 说明 |
      | member_id | 会员ID |
      | old_status | 旧状态 |
      | new_status | 新状态 |
      | reason | 变更原因 |
      | operator_type | system/admin |
      | created_at | 变更时间 |

  Scenario: 查询匹配历史
    Given 需要查看会员匹配历史
    When GET /api/admin/members/{id}/match-logs
    Then 返回匹配状态变更记录列表
```

### AC-5: 匹配服务接口
```gherkin
Feature: 匹配服务接口
  Scenario: POST /api/admin/match/camp/{campId}
    Given 管理员已登录
    And 训练营状态为 ended 或 settling
    When 调用批量匹配接口
    Then 返回匹配结果统计
    And HTTP 状态码 200

  Scenario: 权限校验
    Given 非管理员用户
    When 调用匹配接口
    Then 返回 403 Forbidden

  Scenario: 训练营状态校验
    Given 训练营状态为 ongoing
    When 调用批量匹配接口
    Then 返回错误 "训练营未结束，无法执行匹配"
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - MatchStatus 枚举** (AC: #1, #2)
  - [ ] 1.1 创建 `MatchStatus.java` 枚举类
  - [ ] 1.2 定义状态: pending, matched, failed
  - [ ] 1.3 更新 `CampMember.java` 添加 match_status 字段
  - [ ] 1.4 创建数据库迁移脚本

- [ ] **Task 2: 后端 - MatchService 核心逻辑** (AC: #1, #2, #3)
  - [ ] 2.1 创建 `MatchService.java` 接口
  - [ ] 2.2 创建 `MatchServiceImpl.java` 实现
  - [ ] 2.3 实现 `matchSingle(memberId)` 单个匹配方法
  - [ ] 2.4 实现 `matchByCamp(campId)` 批量匹配方法
  - [ ] 2.5 实现匹配结果统计
  - [ ] 2.6 编写单元测试

- [ ] **Task 3: 后端 - 匹配状态变更日志** (AC: #4)
  - [ ] 3.1 创建 `member_match_log` 表（如尚未存在）
  - [ ] 3.2 创建 `MemberMatchLog.java` 实体
  - [ ] 3.3 创建 `MemberMatchLogMapper.java`
  - [ ] 3.4 在 MatchService 中记录状态变更

- [ ] **Task 4: 后端 - 匹配接口控制器** (AC: #5)
  - [ ] 4.1 创建 `MatchController.java`
  - [ ] 4.2 实现 `POST /api/admin/match/camp/{campId}`
  - [ ] 4.3 实现 `GET /api/admin/members/{id}/match-logs`
  - [ ] 4.4 添加权限校验 `@PreAuthorize("hasRole('ADMIN')")`
  - [ ] 4.5 编写接口测试

- [ ] **Task 5: 后端 - 星球用户验证** (AC: #1)
  - [ ] 5.1 实现 `PlanetUserService.existsByMemberNumber()`
  - [ ] 5.2 在匹配逻辑中验证星球用户存在性
  - [ ] 5.3 处理星球用户不存在的情况

- [ ] **Task 6: 集成测试与验收** (AC: #全部)
  - [ ] 6.1 测试已绑定用户直接匹配
  - [ ] 6.2 测试未绑定用户转人工处理
  - [ ] 6.3 测试批量匹配功能
  - [ ] 6.4 测试匹配日志记录
  - [ ] 6.5 测试权限和状态校验

---

## Dev Notes

### 业务流程概述

本故事实现身份匹配的核心逻辑，为退款流程提供匹配基础。

```
训练营结束 (status=ended)
     ↓
触发批量匹配任务
     ↓
遍历 match_status IS NULL 的会员
     ↓
┌─────────────────────────────────────────────┐
│ 根据 bind_status 判断:                       │
│                                             │
│  bind_status = completed                    │
│       ↓                                     │
│  验证 planet_member_number 存在性            │
│       ↓                                     │
│  存在: match_status = matched               │
│  不存在: match_status = failed              │
│                                             │
│  bind_status IN (expired, manual_review)    │
│       ↓                                     │
│  match_status = pending                     │
│  列入待人工匹配列表                          │
│                                             │
│  bind_status = pending                      │
│       ↓                                     │
│  跳过（绑定进行中）                          │
│                                             │
│  bind_status = closed                       │
│       ↓                                     │
│  match_status = failed                      │
└─────────────────────────────────────────────┘
     ↓
记录匹配日志
     ↓
返回统计结果
```

### 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 匹配触发时机 | 训练营结束后 | 确保所有绑定操作已完成 |
| 匹配方式 | 基于 bind_status | 简化逻辑，已废弃智能匹配 |
| 未绑定处理 | 标记 pending 待人工 | 避免自动化错误匹配 |
| 日志记录 | 独立 match_log 表 | 审计追溯需要 |

### 状态枚举引用

> **SSOT 引用**: [状态枚举定义.md](../../v1/design/状态枚举定义.md)

**bind_status 状态**:
- `pending`: 待绑定
- `completed`: 已完成
- `expired`: 已过期
- `manual_review`: 待人工审核
- `closed`: 已关闭

**match_status 状态**:
- `pending`: 待匹配（需人工处理）
- `matched`: 已匹配
- `failed`: 匹配失败

### 代码实现参考

#### MatchService.java

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class MatchServiceImpl implements MatchService {

    private final CampMemberMapper memberMapper;
    private final PlanetUserMapper planetUserMapper;
    private final MemberMatchLogMapper matchLogMapper;
    private final TrainingCampMapper campMapper;

    /**
     * 单个会员匹配
     */
    @Override
    @Transactional
    public MatchResult matchSingle(Long memberId) {
        CampMember member = memberMapper.selectById(memberId);
        if (member == null) {
            throw new BusinessException(404, "会员不存在");
        }

        // 已匹配则跳过
        if (member.getMatchStatus() != null) {
            return MatchResult.skipped(memberId, "已处理过");
        }

        MatchStatus oldStatus = member.getMatchStatus();
        MatchStatus newStatus;
        String reason;

        switch (member.getBindStatus()) {
            case COMPLETED:
                // 已绑定，验证星球用户存在性
                if (planetUserMapper.existsByMemberNumber(member.getPlanetMemberNumber())) {
                    newStatus = MatchStatus.MATCHED;
                    reason = "绑定完成，星球用户验证通过";
                } else {
                    newStatus = MatchStatus.FAILED;
                    reason = "星球用户不存在: " + member.getPlanetMemberNumber();
                }
                break;

            case EXPIRED:
            case MANUAL_REVIEW:
                // 未绑定完成，转人工处理
                newStatus = MatchStatus.PENDING;
                reason = "绑定状态为 " + member.getBindStatus() + "，需人工处理";
                break;

            case PENDING:
                // 绑定进行中，跳过
                log.info("会员 {} 绑定进行中，跳过匹配", memberId);
                return MatchResult.skipped(memberId, "绑定进行中");

            case CLOSED:
                // 绑定已关闭，标记失败
                newStatus = MatchStatus.FAILED;
                reason = "绑定已关闭";
                break;

            default:
                newStatus = MatchStatus.PENDING;
                reason = "未知绑定状态";
        }

        // 更新状态
        member.setMatchStatus(newStatus);
        member.setMatchedAt(LocalDateTime.now());
        memberMapper.updateById(member);

        // 记录日志
        recordMatchLog(memberId, oldStatus, newStatus, reason, "system");

        return new MatchResult(memberId, newStatus, reason);
    }

    /**
     * 批量匹配训练营会员
     */
    @Override
    @Transactional
    public BatchMatchResult matchByCamp(Long campId) {
        // 验证训练营状态
        TrainingCamp camp = campMapper.selectById(campId);
        if (camp == null) {
            throw new BusinessException(404, "训练营不存在");
        }
        if (!CampStatus.ENDED.equals(camp.getStatus()) &&
            !CampStatus.SETTLING.equals(camp.getStatus())) {
            throw new BusinessException(400, "训练营未结束，无法执行匹配");
        }

        // 获取待匹配会员
        List<CampMember> members = memberMapper.selectUnmatchedByCampId(campId);

        int matchedCount = 0;
        int pendingCount = 0;
        int failedCount = 0;
        int skippedCount = 0;

        for (CampMember member : members) {
            try {
                MatchResult result = matchSingle(member.getId());
                switch (result.getStatus()) {
                    case MATCHED:
                        matchedCount++;
                        break;
                    case PENDING:
                        pendingCount++;
                        break;
                    case FAILED:
                        failedCount++;
                        break;
                    default:
                        skippedCount++;
                }
            } catch (Exception e) {
                log.error("匹配会员 {} 失败", member.getId(), e);
                skippedCount++;
            }
        }

        BatchMatchResult result = BatchMatchResult.builder()
            .campId(campId)
            .totalProcessed(members.size())
            .matchedCount(matchedCount)
            .pendingCount(pendingCount)
            .failedCount(failedCount)
            .skippedCount(skippedCount)
            .build();

        log.info("训练营 {} 批量匹配完成: {}", campId, result);
        return result;
    }

    private void recordMatchLog(Long memberId, MatchStatus oldStatus,
                                MatchStatus newStatus, String reason, String operatorType) {
        MemberMatchLog log = new MemberMatchLog();
        log.setMemberId(memberId);
        log.setOldStatus(oldStatus != null ? oldStatus.getValue() : null);
        log.setNewStatus(newStatus.getValue());
        log.setReason(reason);
        log.setOperatorType(operatorType);
        log.setCreatedAt(LocalDateTime.now());
        matchLogMapper.insert(log);
    }
}
```

#### MatchController.java

```java
@RestController
@RequestMapping("/api/admin/match")
@RequiredArgsConstructor
@Slf4j
public class MatchController {

    private final MatchService matchService;

    /**
     * 批量匹配训练营会员
     */
    @PostMapping("/camp/{campId}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<BatchMatchResult> matchCamp(@PathVariable Long campId) {
        BatchMatchResult result = matchService.matchByCamp(campId);
        return Result.success(result);
    }

    /**
     * 单个会员匹配
     */
    @PostMapping("/member/{memberId}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<MatchResult> matchMember(@PathVariable Long memberId) {
        MatchResult result = matchService.matchSingle(memberId);
        return Result.success(result);
    }
}
```

#### MemberController.java - 添加匹配日志查询

```java
/**
 * 获取会员匹配历史日志
 */
@GetMapping("/{id}/match-logs")
@PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
public Result<List<MemberMatchLogVO>> getMatchLogs(@PathVariable Long id) {
    List<MemberMatchLogVO> logs = matchService.getMatchLogs(id);
    return Result.success(logs);
}
```

### API 响应示例

#### POST /api/admin/match/camp/{campId}

```json
{
  "code": 200,
  "message": "批量匹配完成",
  "data": {
    "campId": 1,
    "totalProcessed": 156,
    "matchedCount": 142,
    "pendingCount": 10,
    "failedCount": 2,
    "skippedCount": 2
  },
  "timestamp": 1730000000
}
```

#### GET /api/admin/members/{id}/match-logs

```json
{
  "code": 200,
  "message": "成功",
  "data": [
    {
      "id": 1001,
      "memberId": 5001,
      "oldStatus": null,
      "newStatus": "matched",
      "reason": "绑定完成，星球用户验证通过",
      "operatorType": "system",
      "createdAt": "2025-12-31T03:00:00"
    }
  ],
  "timestamp": 1730000000
}
```

### 数据库变更

```sql
-- 如果 match_status 字段尚未存在，添加到 camp_member 表
ALTER TABLE camp_member
ADD COLUMN match_status VARCHAR(20) DEFAULT NULL COMMENT '匹配状态: pending/matched/failed',
ADD COLUMN matched_at TIMESTAMP DEFAULT NULL COMMENT '匹配时间';

-- 创建匹配日志表（如不存在）
CREATE TABLE IF NOT EXISTS member_match_log (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL REFERENCES camp_member(id),
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    reason VARCHAR(500),
    operator_type VARCHAR(20) NOT NULL DEFAULT 'system',
    operator_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_match_log_member ON member_match_log(member_id);
CREATE INDEX idx_match_log_created ON member_match_log(created_at);
```

### 安全检查清单

- [ ] 权限控制：仅 admin 角色可触发批量匹配
- [ ] 状态校验：训练营必须为 ended/settling 状态
- [ ] 日志记录：所有状态变更有审计日志
- [ ] 幂等性：重复执行不会重复处理已匹配会员
- [ ] 事务处理：批量操作使用事务保证一致性

### 测试要点

**后端测试**:
1. `MatchServiceTest` - 测试各种 bind_status 的匹配结果
2. `MatchControllerTest` - 测试接口权限和参数校验
3. 测试批量匹配统计准确性
4. 测试星球用户验证逻辑
5. 测试匹配日志记录

---

## 项目结构

### 后端新增/修改文件

```
backend/src/main/java/com/camp/
├── controller/
│   └── admin/
│       └── MatchController.java              # 新增匹配控制器
├── service/
│   ├── MatchService.java                     # 新增匹配服务接口
│   └── impl/
│       └── MatchServiceImpl.java             # 新增匹配服务实现
├── entity/
│   ├── CampMember.java                       # 修改添加 match_status 字段
│   └── MemberMatchLog.java                   # 新增匹配日志实体
├── mapper/
│   └── MemberMatchLogMapper.java             # 新增匹配日志 Mapper
├── enums/
│   └── MatchStatus.java                      # 新增匹配状态枚举
└── vo/
    ├── MatchResult.java                      # 新增匹配结果 VO
    ├── BatchMatchResult.java                 # 新增批量匹配结果 VO
    └── MemberMatchLogVO.java                 # 新增匹配日志 VO
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP02-S07 用户绑定 | ready-for-dev | bind_status 来源 |
| EP02-S08 绑定超时检查 | ready-for-dev | 转 manual_review |
| EP03-S01 SDK集成 | ready-for-dev | planet_user 表数据 |

### 后续依赖

本故事完成后:
- EP04-S02 手动匹配（处理 match_status=pending 的会员）
- EP04-S03 退款名单生成（筛选 match_status=matched）

---

## References

| 文档 | 路径 | 相关章节 |
|------|------|----------|
| PRD | `docs/PRD.md` | 3.3 退款审核流程 |
| 状态枚举 | `docs/v1/design/状态枚举定义.md` | bind_status, match_status |
| Epic 定义 | `docs/epics.md` | EP04-S01 |
| 数据库设计 | `docs/v1/design/数据库设计.md` | camp_member 表 |

---

## Dev Agent Record

### Context Reference
- Epic: EP04 身份匹配与退款流程
- Story: EP04-S01 直接匹配实现
- FR Coverage: FR5.1, FR5.2, FR5.3

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
| Epic | EP04 |
| 前置条件 | EP02-S07, EP02-S08, EP03-S01 完成 |
| 覆盖 FR | FR5.1, FR5.2, FR5.3 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
