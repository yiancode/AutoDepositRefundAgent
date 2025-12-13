# Story 5.5: 打卡提醒通知

**Status**: ready-for-dev

---

## Story

**作为**系统，
**我希望**每天向未打卡的会员发送打卡提醒，
**以便于**提高会员打卡率，帮助会员完成训练营目标。

---

## 验收标准

### AC-1: 定时任务执行
```gherkin
Feature: 打卡提醒定时任务
  Scenario: 每天定时执行
    Given 系统配置了打卡提醒任务
    When 到达每天 20:00
    Then 执行 CheckinRemindTask
    And 查询当日未打卡的会员

  Scenario: 任务开关控制
    Given 配置 checkin-remind.enabled = false
    When 到达执行时间
    Then 跳过任务执行
```

### AC-2: 筛选提醒对象
```gherkin
Feature: 筛选提醒对象
  Scenario: 筛选当日未打卡会员
    Given 执行提醒任务
    Then 筛选条件:
      | 条件 | 说明 |
      | camp.status = ongoing | 训练营进行中 |
      | 当日无打卡记录 | checkin_date != today |
      | joined_group = true | 已进群 |

  Scenario: 排除已完成目标的会员
    Given 会员 checkin_count >= required_days
    When 执行筛选
    Then 跳过该会员（已达标无需提醒）

  Scenario: 排除当日已提醒的会员
    Given 会员当日已收到打卡提醒
    When 执行筛选
    Then 跳过该会员
```

### AC-3: 发送提醒消息
```gherkin
Feature: 发送提醒消息
  Scenario: 发送站内消息
    Given 需要发送打卡提醒
    When 发送提醒
    Then 创建 notification_message 记录
    And type = checkin_remind
    And 消息内容: "今日打卡还未完成，加油！距离目标还差{n}天"

  Scenario: 记录提醒
    Given 发送提醒
    Then notification_message 记录:
      | 字段 | 值 |
      | type | checkin_remind |
      | target_type | member |
      | status | sent |
```

### AC-4: 提醒内容个性化
```gherkin
Feature: 个性化提醒
  Scenario: 显示剩余天数
    Given 会员 checkin_count = 10, required_days = 15
    Then 消息显示: "还差5天完成目标"

  Scenario: 接近目标鼓励
    Given 会员 checkin_count = 14, required_days = 15
    Then 消息显示: "还差1天，胜利在望！"
```

### AC-5: 执行结果统计
```gherkin
Feature: 执行统计
  Scenario: 任务执行统计
    Given 提醒任务执行完成
    Then 记录统计信息:
      | 指标 | 说明 |
      | totalOngoing | 进行中训练营会员数 |
      | notCheckedToday | 当日未打卡数 |
      | remindedCount | 发送提醒数 |
      | skippedCount | 跳过数 |
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - CheckinRemindTask** (AC: #1, #2)
  - [ ] 1.1 创建 `CheckinRemindTask.java`
  - [ ] 1.2 配置 @Scheduled(cron = "0 0 20 * * ?")
  - [ ] 1.3 实现当日未打卡会员筛选
  - [ ] 1.4 添加任务开关

- [ ] **Task 2: 后端 - 提醒发送逻辑** (AC: #3, #4)
  - [ ] 2.1 实现提醒消息生成
  - [ ] 2.2 实现个性化内容
  - [ ] 2.3 创建 notification_message 记录

- [ ] **Task 3: 后端 - 去重和排除逻辑** (AC: #2)
  - [ ] 3.1 排除已达标会员
  - [ ] 3.2 当日去重检查

- [ ] **Task 4: 后端 - 统计和日志** (AC: #5)
  - [ ] 4.1 实现执行统计
  - [ ] 4.2 记录操作日志

- [ ] **Task 5: 集成测试** (AC: #全部)
  - [ ] 5.1 测试筛选逻辑
  - [ ] 5.2 测试个性化内容
  - [ ] 5.3 测试去重逻辑

---

## Dev Notes

### 业务流程概述

```
定时任务执行 (每天20:00)
     ↓
查询进行中的训练营
     ↓
对每个训练营:
├── 查询当日未打卡会员
├── 排除已达标会员
└── 排除当日已提醒会员
     ↓
对每个需要提醒的会员:
├── 计算剩余天数
├── 生成个性化消息
└── 创建 notification_message
     ↓
统计执行结果
```

### 代码实现参考

#### CheckinRemindTask.java

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class CheckinRemindTask {

    private final TrainingCampMapper campMapper;
    private final CampMemberMapper memberMapper;
    private final CheckinRecordMapper checkinMapper;
    private final NotificationMessageMapper notificationMapper;

    @Value("${checkin-remind.enabled:true}")
    private boolean enabled;

    /**
     * 每天20:00执行打卡提醒
     */
    @Scheduled(cron = "${checkin-remind.cron:0 0 20 * * ?}")
    public void sendCheckinRemind() {
        if (!enabled) {
            log.info("打卡提醒任务已禁用");
            return;
        }

        log.info("开始执行打卡提醒任务");

        LocalDate today = LocalDate.now();
        int reminded = 0, skipped = 0;

        // 查询进行中的训练营
        List<TrainingCamp> ongoingCamps = campMapper.selectByStatus(CampStatus.ONGOING);

        for (TrainingCamp camp : ongoingCamps) {
            // 查询该训练营当日未打卡的会员
            List<CampMember> members = memberMapper.selectNotCheckedToday(
                camp.getId(), today
            );

            for (CampMember member : members) {
                // 排除已达标
                if (member.getCheckinCount() >= camp.getRequiredDays()) {
                    skipped++;
                    continue;
                }

                // 排除当日已提醒
                if (hasRemindedToday(member.getId(), today)) {
                    skipped++;
                    continue;
                }

                // 发送提醒
                sendRemind(member, camp);
                reminded++;
            }
        }

        log.info("打卡提醒任务完成: 发送={}, 跳过={}", reminded, skipped);
    }

    private void sendRemind(CampMember member, TrainingCamp camp) {
        int remaining = camp.getRequiredDays() - member.getCheckinCount();
        String encouragement = remaining == 1 ? "胜利在望！" : "加油！";

        String content = String.format(
            "今日打卡还未完成，%s距离目标还差%d天",
            encouragement, remaining
        );

        NotificationMessage notification = NotificationMessage.builder()
            .type("checkin_remind")
            .targetType("member")
            .targetId(member.getId())
            .content(content)
            .status("sent")
            .sendTime(LocalDateTime.now())
            .createdAt(LocalDateTime.now())
            .build();
        notificationMapper.insert(notification);
    }

    private boolean hasRemindedToday(Long memberId, LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();
        return notificationMapper.existsByMemberIdAndTypeBetween(
            memberId, "checkin_remind", startOfDay, endOfDay
        );
    }
}
```

### 配置项

```yaml
checkin-remind:
  enabled: true
  cron: "0 0 20 * * ?"  # 每天20:00
```

---

## 项目结构

### 后端新增文件

```
backend/src/main/java/com/camp/
└── schedule/
    └── CheckinRemindTask.java                 # 新增打卡提醒任务
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP03-S02 打卡同步 | ready-for-dev | checkin_record 数据 |

---

## Story Metadata

| 属性 | 值 |
|------|-----|
| Story 点数 | 2 |
| 优先级 | P2 |
| Epic | EP05 |
| 前置条件 | EP03-S02 完成 |
| 覆盖 FR | FR11.3 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
