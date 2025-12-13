# Story 5.6: 训练营结束提醒

**Status**: ready-for-dev

---

## Story

**作为**系统，
**我希望**在训练营结束前1天提醒未完成打卡目标的会员，
**以便于**会员抓紧最后时间完成打卡，不错过退款机会。

---

## 验收标准

### AC-1: 定时任务执行
```gherkin
Feature: 结束提醒定时任务
  Scenario: 每天定时执行
    Given 系统配置了结束提醒任务
    When 到达每天 09:00
    Then 执行 EndRemindTask
    And 查询明天结束的训练营

  Scenario: 任务开关控制
    Given 配置 end-remind.enabled = false
    When 到达执行时间
    Then 跳过任务执行
```

### AC-2: 筛选提醒对象
```gherkin
Feature: 筛选提醒对象
  Scenario: 筛选明天结束训练营的会员
    Given 执行提醒任务
    Then 筛选训练营条件:
      | 条件 | 说明 |
      | end_date = tomorrow | 明天结束 |
      | status = ongoing | 进行中 |

  Scenario: 筛选未达标会员
    Given 训练营明天结束
    Then 筛选会员条件:
      | 条件 | 说明 |
      | checkin_count < required_days | 未达标 |
      | joined_group = true | 已进群 |

  Scenario: 排除已提醒会员
    Given 会员已收到该训练营的结束提醒
    When 执行筛选
    Then 跳过该会员
    And 每个训练营每个会员只提醒一次
```

### AC-3: 发送提醒消息
```gherkin
Feature: 发送提醒消息
  Scenario: 发送企业微信消息
    Given 会员已绑定企业微信
    When 发送提醒
    Then 调用企业微信应用消息接口
    And 消息内容: "【{训练营名称}】明天结束，您还差{n}天完成目标，请抓紧时间打卡！"

  Scenario: 紧急程度标识
    Given 发送结束提醒
    Then 消息标题包含"紧急"或特殊标识
    And 提高用户关注度

  Scenario: 会员未绑定企业微信
    Given 会员未绑定企业微信
    When 发送提醒
    Then 跳过
    And 记录 notification_message (status=skipped)
```

### AC-4: 提醒内容
```gherkin
Feature: 提醒内容
  Scenario: 显示差距天数
    Given 会员 checkin_count = 10, required_days = 15
    Then 消息显示: "还差5天完成目标"

  Scenario: 只差1天的特殊提醒
    Given 会员 checkin_count = 14, required_days = 15
    Then 消息显示: "只差1天就能完成目标，今天一定要打卡！"

  Scenario: 包含退款提示
    Given 发送结束提醒
    Then 消息包含: "完成打卡目标即可获得押金退还"
```

### AC-5: 执行结果统计
```gherkin
Feature: 执行统计
  Scenario: 任务执行统计
    Given 提醒任务执行完成
    Then 记录统计信息:
      | 指标 | 说明 |
      | campsEndingTomorrow | 明天结束的训练营数 |
      | totalNotAchieved | 未达标会员总数 |
      | remindedCount | 发送提醒数 |
      | skippedCount | 跳过数 |
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - EndRemindTask** (AC: #1, #2)
  - [ ] 1.1 创建 `EndRemindTask.java`
  - [ ] 1.2 配置 @Scheduled(cron = "0 0 9 * * ?")
  - [ ] 1.3 实现明天结束训练营筛选
  - [ ] 1.4 实现未达标会员筛选
  - [ ] 1.5 添加任务开关

- [ ] **Task 2: 后端 - 提醒发送逻辑** (AC: #3, #4)
  - [ ] 2.1 实现提醒消息生成
  - [ ] 2.2 调用 WechatNotifyManager
  - [ ] 2.3 创建 notification_message 记录

- [ ] **Task 3: 后端 - 去重逻辑** (AC: #2)
  - [ ] 3.1 实现结束提醒去重
  - [ ] 3.2 每个训练营每个会员只提醒一次

- [ ] **Task 4: 后端 - 统计和日志** (AC: #5)
  - [ ] 4.1 实现执行统计
  - [ ] 4.2 记录操作日志

- [ ] **Task 5: 集成测试** (AC: #全部)
  - [ ] 5.1 测试训练营筛选
  - [ ] 5.2 测试会员筛选
  - [ ] 5.3 测试消息发送
  - [ ] 5.4 测试去重逻辑

---

## Dev Notes

### 业务流程概述

```
定时任务执行 (每天09:00)
     ↓
查询明天结束的训练营:
└── end_date = tomorrow AND status = ongoing
     ↓
对每个训练营:
├── 查询未达标会员:
│   └── checkin_count < required_days
├── 排除已提醒会员
└── 发送企业微信提醒
     ↓
统计执行结果
```

### 代码实现参考

#### EndRemindTask.java

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class EndRemindTask {

    private final TrainingCampMapper campMapper;
    private final CampMemberMapper memberMapper;
    private final NotificationMessageMapper notificationMapper;
    private final WechatNotifyManager notifyManager;
    private final WechatUserMapper wechatUserMapper;

    @Value("${end-remind.enabled:true}")
    private boolean enabled;

    /**
     * 每天09:00执行结束提醒
     */
    @Scheduled(cron = "${end-remind.cron:0 0 9 * * ?}")
    public void sendEndRemind() {
        if (!enabled) {
            log.info("结束提醒任务已禁用");
            return;
        }

        log.info("开始执行结束提醒任务");

        LocalDate tomorrow = LocalDate.now().plusDays(1);
        int reminded = 0, skipped = 0;

        // 查询明天结束的训练营
        List<TrainingCamp> camps = campMapper.selectByEndDate(tomorrow);

        for (TrainingCamp camp : camps) {
            if (!CampStatus.ONGOING.equals(camp.getStatus())) {
                continue;
            }

            // 查询未达标会员
            List<CampMember> members = memberMapper.selectNotAchieved(
                camp.getId(), camp.getRequiredDays()
            );

            for (CampMember member : members) {
                // 检查是否已发送过结束提醒
                if (hasEndRemindSent(member.getId(), camp.getId())) {
                    skipped++;
                    continue;
                }

                try {
                    sendRemind(member, camp);
                    reminded++;
                } catch (Exception e) {
                    log.error("发送结束提醒失败: memberId={}", member.getId(), e);
                }
            }
        }

        log.info("结束提醒任务完成: 发送={}, 跳过={}", reminded, skipped);
    }

    private void sendRemind(CampMember member, TrainingCamp camp) {
        WechatUser wechatUser = wechatUserMapper.selectByMemberId(member.getId());
        int remaining = camp.getRequiredDays() - member.getCheckinCount();

        String urgency = remaining == 1
            ? "只差1天就能完成目标，今天一定要打卡！"
            : String.format("您还差%d天完成目标，请抓紧时间打卡！", remaining);

        String content = String.format(
            "【紧急提醒】%s明天结束，%s完成打卡目标即可获得押金退还。",
            camp.getName(), urgency
        );

        // 创建通知记录
        NotificationMessage notification = NotificationMessage.builder()
            .type("end_remind")
            .targetType("member")
            .targetId(member.getId())
            .refundId(null)
            .content(content)
            .status("pending")
            .createdAt(LocalDateTime.now())
            .build();

        // 添加训练营ID标识用于去重
        notification.setExtra(JsonUtils.toJson(Map.of("campId", camp.getId())));
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

    private boolean hasEndRemindSent(Long memberId, Long campId) {
        return notificationMapper.existsEndRemind(memberId, campId);
    }
}
```

### 配置项

```yaml
end-remind:
  enabled: true
  cron: "0 0 9 * * ?"  # 每天09:00
```

---

## 项目结构

### 后端新增文件

```
backend/src/main/java/com/camp/
└── schedule/
    └── EndRemindTask.java                     # 新增结束提醒任务
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP03-S02 打卡同步 | ready-for-dev | checkin_count 数据 |
| EP04-S06 退款通知 | ready-for-dev | WechatNotifyManager |

---

## Story Metadata

| 属性 | 值 |
|------|-----|
| Story 点数 | 2 |
| 优先级 | P2 |
| Epic | EP05 |
| 前置条件 | EP03-S02 完成 |
| 覆盖 FR | FR11.4 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
