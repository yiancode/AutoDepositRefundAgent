# Story 5.4: 进群提醒通知

**Status**: ready-for-dev

---

## Story

**作为**系统，
**我希望**能够在会员支付成功后24小时未进群时发送提醒，
**以便于**提高会员进群率，确保训练营顺利开展。

---

## 验收标准

### AC-1: 定时任务执行
```gherkin
Feature: 进群提醒定时任务
  Scenario: 每天定时执行
    Given 系统配置了进群提醒任务
    When 到达每天 10:00
    Then 执行 JoinGroupRemindTask
    And 查询需要提醒的会员

  Scenario: 任务开关控制
    Given 配置 join-group-remind.enabled = false
    When 到达执行时间
    Then 跳过任务执行
```

### AC-2: 筛选提醒对象
```gherkin
Feature: 筛选提醒对象
  Scenario: 筛选需要提醒的会员
    Given 执行提醒任务
    Then 筛选条件:
      | 条件 | 说明 |
      | pay_status = success | 支付成功 |
      | joined_group = false | 未进群 |
      | pay_time < now - 24h | 支付超过24小时 |
      | camp.status = ongoing | 训练营进行中 |

  Scenario: 排除已提醒会员
    Given 会员24小时内已收到进群提醒
    When 执行筛选
    Then 跳过该会员
    And 每24小时最多提醒一次
```

### AC-3: 发送提醒消息
```gherkin
Feature: 发送提醒消息
  Scenario: 发送企业微信消息
    Given 会员已绑定企业微信
    When 发送提醒
    Then 调用企业微信应用消息接口
    And 消息内容: "您还未加入【{训练营名称}】群，请尽快扫码进群，以免错过精彩内容"

  Scenario: 会员未绑定企业微信
    Given 会员未绑定企业微信
    When 发送提醒
    Then 跳过该会员
    And 记录 notification_message (status=skipped)

  Scenario: 记录提醒消息
    Given 发送提醒
    Then 创建 notification_message 记录
    And type = join_group_remind
```

### AC-4: 提醒去重
```gherkin
Feature: 提醒去重
  Scenario: 24小时内不重复提醒
    Given 会员已在今天收到进群提醒
    When 再次执行提醒任务
    Then 跳过该会员

  Scenario: 进群后不再提醒
    Given 会员已标记进群 (joined_group = true)
    When 执行提醒任务
    Then 不发送提醒
```

### AC-5: 执行结果统计
```gherkin
Feature: 执行统计
  Scenario: 任务执行统计
    Given 提醒任务执行完成
    Then 记录统计信息:
      | 指标 | 说明 |
      | totalNeedRemind | 需要提醒总数 |
      | sentCount | 成功发送数 |
      | skippedCount | 跳过数 |
      | failedCount | 失败数 |
    And 记录到操作日志
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - JoinGroupRemindTask** (AC: #1, #2)
  - [ ] 1.1 创建 `JoinGroupRemindTask.java`
  - [ ] 1.2 配置 @Scheduled(cron = "0 0 10 * * ?")
  - [ ] 1.3 实现会员筛选逻辑
  - [ ] 1.4 添加任务开关

- [ ] **Task 2: 后端 - 提醒发送逻辑** (AC: #3)
  - [ ] 2.1 实现提醒消息发送
  - [ ] 2.2 调用 WechatNotifyManager
  - [ ] 2.3 创建 notification_message 记录

- [ ] **Task 3: 后端 - 去重逻辑** (AC: #4)
  - [ ] 3.1 实现24小时去重检查
  - [ ] 3.2 查询最近提醒记录

- [ ] **Task 4: 后端 - 统计和日志** (AC: #5)
  - [ ] 4.1 实现执行统计
  - [ ] 4.2 记录操作日志

- [ ] **Task 5: 集成测试** (AC: #全部)
  - [ ] 5.1 测试筛选逻辑
  - [ ] 5.2 测试去重逻辑
  - [ ] 5.3 测试消息发送

---

## Dev Notes

### 业务流程概述

```
定时任务执行 (每天10:00)
     ↓
查询需要提醒的会员:
├── pay_status = success
├── joined_group = false
├── pay_time < now - 24h
└── 24小时内未提醒过
     ↓
对每个会员:
├── 检查企业微信绑定
├── 已绑定: 发送提醒消息
├── 未绑定: 跳过
└── 记录 notification_message
     ↓
统计执行结果
     ↓
记录操作日志
```

### 代码实现参考

#### JoinGroupRemindTask.java

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class JoinGroupRemindTask {

    private final CampMemberMapper memberMapper;
    private final NotificationMessageMapper notificationMapper;
    private final WechatNotifyManager notifyManager;
    private final WechatUserMapper wechatUserMapper;
    private final TrainingCampMapper campMapper;

    @Value("${join-group-remind.enabled:true}")
    private boolean enabled;

    /**
     * 每天10:00执行进群提醒
     */
    @Scheduled(cron = "${join-group-remind.cron:0 0 10 * * ?}")
    public void sendJoinGroupRemind() {
        if (!enabled) {
            log.info("进群提醒任务已禁用");
            return;
        }

        log.info("开始执行进群提醒任务");

        // 查询需要提醒的会员
        LocalDateTime threshold = LocalDateTime.now().minusHours(24);
        List<CampMember> members = memberMapper.selectNeedJoinGroupRemind(threshold);

        int sent = 0, skipped = 0, failed = 0;

        for (CampMember member : members) {
            // 检查24小时内是否已提醒
            if (hasRemindedWithin24Hours(member.getId())) {
                skipped++;
                continue;
            }

            try {
                sendRemind(member);
                sent++;
            } catch (Exception e) {
                log.error("发送进群提醒失败: memberId={}", member.getId(), e);
                failed++;
            }
        }

        log.info("进群提醒任务完成: 发送={}, 跳过={}, 失败={}", sent, skipped, failed);
    }

    private void sendRemind(CampMember member) {
        TrainingCamp camp = campMapper.selectById(member.getCampId());
        WechatUser wechatUser = wechatUserMapper.selectByMemberId(member.getId());

        String content = String.format(
            "您还未加入【%s】群，请尽快扫码进群，以免错过精彩内容",
            camp.getName()
        );

        // 创建通知记录
        NotificationMessage notification = NotificationMessage.builder()
            .type("join_group_remind")
            .targetType("member")
            .targetId(member.getId())
            .content(content)
            .status("pending")
            .createdAt(LocalDateTime.now())
            .build();
        notificationMapper.insert(notification);

        if (wechatUser == null || wechatUser.getWechatUserId() == null) {
            notification.setStatus("skipped");
            notification.setErrorMessage("会员未绑定企业微信");
            notificationMapper.updateById(notification);
            return;
        }

        // 发送消息
        notifyManager.sendTextMessage(wechatUser.getWechatUserId(), content);
        notification.setStatus("sent");
        notification.setSendTime(LocalDateTime.now());
        notificationMapper.updateById(notification);
    }

    private boolean hasRemindedWithin24Hours(Long memberId) {
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        return notificationMapper.existsByMemberIdAndTypeAfter(
            memberId, "join_group_remind", since
        );
    }
}
```

### 配置项

```yaml
join-group-remind:
  enabled: true
  cron: "0 0 10 * * ?"  # 每天10:00
```

---

## 项目结构

### 后端新增文件

```
backend/src/main/java/com/camp/
└── schedule/
    └── JoinGroupRemindTask.java               # 新增进群提醒任务
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP02-S06 支付回调 | ready-for-dev | pay_status 状态 |
| EP04-S06 退款通知 | ready-for-dev | WechatNotifyManager |

---

## Story Metadata

| 属性 | 值 |
|------|-----|
| Story 点数 | 2 |
| 优先级 | P2 |
| Epic | EP05 |
| 前置条件 | EP02-S06 完成 |
| 覆盖 FR | FR11.2 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
