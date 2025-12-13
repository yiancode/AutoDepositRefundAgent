# Story 4.6: 退款结果通知

**Status**: ready-for-dev

---

## Story

**作为**系统，
**我希望**在退款成功后通知会员，失败时告警管理员，
**以便于**用户及时了解退款结果，管理员能够快速处理异常情况。

---

## 验收标准

### AC-1: 退款成功通知会员
```gherkin
Feature: 退款成功通知
  Scenario: 退款成功发送通知
    Given 退款执行成功 (refund_status = success)
    When 触发成功通知
    Then 发送企业微信应用消息给会员
    And 消息内容: "恭喜您！您参加的「{训练营名称}」押金 ¥{金额} 已退还到您的支付账户，预计1-3个工作日到账。"
    And 更新 refund_record.notified = true
    And 记录 notified_at 时间

  Scenario: 会员未绑定企业微信
    Given 退款成功
    And 会员未绑定企业微信 (wechat_user_id IS NULL)
    When 触发通知
    Then 跳过企业微信通知
    And 记录到 notification_message 表
    And 状态为 skipped
    And 备注: "会员未绑定企业微信"

  Scenario: 通知发送失败
    Given 企业微信接口调用失败
    When 发送通知
    Then 记录失败原因
    And notification_message.status = failed
    And 稍后重试 (最多3次)
```

### AC-2: 退款失败告警管理员
```gherkin
Feature: 退款失败告警
  Scenario: 退款失败发送告警
    Given 退款执行失败 (refund_status = failed)
    And retry_count >= max_retry
    When 触发失败告警
    Then 发送企业微信消息给管理员群
    And 消息内容包含:
      | 内容 | 说明 |
      | 训练营名称 | 来源 |
      | 会员昵称 | 便于识别 |
      | 退款金额 | 金额信息 |
      | 失败原因 | 具体错误 |
      | 操作建议 | 处理指引 |
    And 记录到 notification_message

  Scenario: 告警消息模板
    Given 退款失败
    Then 告警消息格式:
      """
      [退款失败告警]
      训练营: {campName}
      会员: {planetNickname}
      金额: ¥{amount}
      原因: {errorMessage}
      请及时登录后台处理
      """

  Scenario: 批量失败汇总告警
    Given 同一时间多笔退款失败
    When 失败数量 >= 3
    Then 发送汇总告警消息
    And 消息内容: "有{count}笔退款失败，请及时处理"
    And 附带失败记录ID列表
```

### AC-3: 通知消息记录
```gherkin
Feature: 通知消息记录
  Scenario: 创建通知记录
    Given 需要发送通知
    When 创建 notification_message
    Then 记录包含:
      | 字段 | 说明 |
      | type | success_notify / fail_alert |
      | target_type | member / admin |
      | target_id | 会员ID / 管理员ID |
      | content | 消息内容 |
      | status | pending / sent / failed / skipped |
      | send_time | 发送时间 |
      | error_message | 失败原因 |

  Scenario: 查询通知历史
    Given 管理员查看通知记录
    When GET /api/admin/notifications?type=refund&page=1&pageSize=20
    Then 返回退款相关的通知记录列表
    And 支持按类型、状态筛选

  Scenario: 通知发送统计
    Given GET /api/admin/notifications/stats
    Then 返回统计信息:
      | 字段 | 说明 |
      | totalSent | 发送总数 |
      | successCount | 成功数 |
      | failedCount | 失败数 |
      | skippedCount | 跳过数 |
```

### AC-4: 通知重试机制
```gherkin
Feature: 通知重试
  Scenario: 定时任务重试失败通知
    Given 存在 status = failed 的通知记录
    And retry_count < 3
    When 执行重试任务 (每5分钟)
    Then 重新发送通知
    And retry_count + 1

  Scenario: 超过重试次数
    Given retry_count >= 3
    When 仍然失败
    Then status = permanently_failed
    And 不再重试
    And 记录最终失败原因

  Scenario: 手动重发通知
    Given 管理员在通知记录页
    And 通知状态为 failed 或 permanently_failed
    When POST /api/admin/notifications/{id}/resend
    Then 立即重新发送
    And 重置 retry_count = 0
```

### AC-5: 通知模板管理
```gherkin
Feature: 通知模板
  Scenario: 使用模板发送通知
    Given 系统配置了通知模板
    When 发送退款成功通知
    Then 使用模板: refund_success
    And 替换变量: {campName}, {amount}, {nickname}

  Scenario: 模板配置
    Given 系统配置表 system_config
    Then 存储通知模板:
      | key | 模板内容 |
      | notify.refund.success | 恭喜您！押金 ¥{amount} 已退还... |
      | notify.refund.failed | [退款失败告警] 会员{nickname}... |

  Scenario: 默认模板
    Given 模板配置不存在
    When 发送通知
    Then 使用代码中的默认模板
```

### AC-6: 企业微信消息推送
```gherkin
Feature: 企业微信消息
  Scenario: 发送应用消息给会员
    Given 会员已绑定企业微信 (wechat_user_id)
    When 调用企业微信消息接口
    Then POST /cgi-bin/message/send
    And msgtype = text
    And touser = wechat_user_id

  Scenario: 发送群聊消息给管理员
    Given 配置了管理员群聊 chatId
    When 发送告警消息
    Then 调用企业微信群聊接口
    And 消息发送到管理员群

  Scenario: Access Token 管理
    Given 调用企业微信API
    Then 使用 WechatAccessTokenManager 获取 token
    And token 自动刷新和缓存
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - NotificationMessage 实体** (AC: #3)
  - [ ] 1.1 创建 `NotificationMessage.java` 实体
  - [ ] 1.2 创建 `NotificationMessageMapper.java`
  - [ ] 1.3 添加索引和查询方法
  - [ ] 1.4 编写 Mapper 测试

- [ ] **Task 2: 后端 - NotificationService** (AC: #1, #2, #3)
  - [ ] 2.1 创建 `NotificationService.java` 接口
  - [ ] 2.2 实现 `sendRefundSuccessNotify(refundId)`
  - [ ] 2.3 实现 `sendRefundFailedAlert(refundId)`
  - [ ] 2.4 实现通知记录创建
  - [ ] 2.5 编写单元测试

- [ ] **Task 3: 后端 - WechatNotifyManager** (AC: #6)
  - [ ] 3.1 创建 `WechatNotifyManager.java`
  - [ ] 3.2 实现应用消息发送
  - [ ] 3.3 实现群聊消息发送
  - [ ] 3.4 集成 AccessToken 管理
  - [ ] 3.5 编写接口测试

- [ ] **Task 4: 后端 - 通知重试任务** (AC: #4)
  - [ ] 4.1 创建 `NotificationRetryTask.java`
  - [ ] 4.2 配置 5 分钟执行周期
  - [ ] 4.3 实现失败通知重试
  - [ ] 4.4 实现超次数处理

- [ ] **Task 5: 后端 - 通知管理接口** (AC: #3, #4)
  - [ ] 5.1 创建 `NotificationController.java`
  - [ ] 5.2 实现 `GET /api/admin/notifications`
  - [ ] 5.3 实现 `GET /api/admin/notifications/stats`
  - [ ] 5.4 实现 `POST /api/admin/notifications/{id}/resend`
  - [ ] 5.5 编写接口测试

- [ ] **Task 6: 后端 - 模板管理** (AC: #5)
  - [ ] 6.1 定义模板常量和默认值
  - [ ] 6.2 实现从 system_config 读取模板
  - [ ] 6.3 实现模板变量替换

- [ ] **Task 7: 集成到退款流程** (AC: #1, #2)
  - [ ] 7.1 在 RefundCallbackService 中调用成功通知
  - [ ] 7.2 在退款失败处理中调用告警通知
  - [ ] 7.3 集成测试

- [ ] **Task 8: 集成测试与验收** (AC: #全部)
  - [ ] 8.1 测试退款成功通知
  - [ ] 8.2 测试退款失败告警
  - [ ] 8.3 测试通知重试
  - [ ] 8.4 测试手动重发
  - [ ] 8.5 测试模板替换

---

## Dev Notes

### 业务流程概述

本故事实现退款结果的通知功能。

```
退款回调处理完成
     ↓
┌─────────────────────────────────────────────┐
│ 根据退款结果判断:                             │
│                                             │
│  refund_status = success                    │
│       ↓                                     │
│  查询会员企业微信绑定信息                     │
│       ↓                                     │
│  已绑定: 发送应用消息给会员                   │
│  未绑定: 跳过，记录 notification_message     │
│       ↓                                     │
│  更新 refund_record.notified = true         │
│                                             │
│  refund_status = failed                     │
│       ↓                                     │
│  发送告警消息到管理员群                       │
│       ↓                                     │
│  记录 notification_message                   │
└─────────────────────────────────────────────┘
     ↓
通知重试任务 (每5分钟):
├── 查询 status=failed AND retry_count<3
├── 重新发送
├── 成功: status=sent
└── 失败: retry_count++ 或 permanently_failed
```

### 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 消息类型 | 应用消息 | 可靠送达，支持模板 |
| 告警方式 | 群聊消息 | 多人同时收到 |
| 重试次数 | 最多3次 | 避免无限重试 |
| 重试间隔 | 5分钟 | 给系统恢复时间 |

### 企业微信 API 参考

> **发送应用消息**: https://developer.work.weixin.qq.com/document/path/90236

**请求地址**: `POST https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=ACCESS_TOKEN`

**请求参数**:
```json
{
  "touser": "UserID1|UserID2",
  "msgtype": "text",
  "agentid": 1000002,
  "text": {
    "content": "您的押金已退还到账户"
  },
  "safe": 0
}
```

**发送群聊消息**:
```json
{
  "chatid": "CHATID",
  "msgtype": "text",
  "text": {
    "content": "[退款失败告警] ..."
  },
  "safe": 0
}
```

### 代码实现参考

#### NotificationMessage.java

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("notification_message")
public class NotificationMessage {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String type;           // success_notify, fail_alert
    private String targetType;     // member, admin
    private Long targetId;         // 会员ID或管理员ID
    private Long refundId;         // 关联退款记录
    private String content;        // 消息内容
    private String status;         // pending, sent, failed, skipped, permanently_failed
    private Integer retryCount;    // 重试次数
    private String errorMessage;   // 错误信息
    private LocalDateTime sendTime;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

#### NotificationService.java

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationMessageMapper notificationMapper;
    private final RefundRecordMapper refundMapper;
    private final CampMemberMapper memberMapper;
    private final WechatUserMapper wechatUserMapper;
    private final WechatNotifyManager notifyManager;
    private final SystemConfigService configService;

    /**
     * 发送退款成功通知
     */
    @Override
    @Transactional
    public void sendRefundSuccessNotify(Long refundId) {
        RefundRecord refund = refundMapper.selectById(refundId);
        if (refund == null || refund.getNotified()) {
            return; // 已通知过，跳过
        }

        CampMember member = memberMapper.selectById(refund.getMemberId());
        TrainingCamp camp = campMapper.selectById(refund.getCampId());

        // 构建消息内容
        String template = configService.getString("notify.refund.success",
            "恭喜您！您参加的「{campName}」押金 ¥{amount} 已退还到您的支付账户，预计1-3个工作日到账。");
        String content = template
            .replace("{campName}", camp.getName())
            .replace("{amount}", refund.getRefundAmount().toString());

        // 创建通知记录
        NotificationMessage notification = NotificationMessage.builder()
            .type("success_notify")
            .targetType("member")
            .targetId(member.getId())
            .refundId(refundId)
            .content(content)
            .status("pending")
            .retryCount(0)
            .createdAt(LocalDateTime.now())
            .build();
        notificationMapper.insert(notification);

        // 查询会员企业微信绑定
        WechatUser wechatUser = wechatUserMapper.selectByMemberId(member.getId());
        if (wechatUser == null || wechatUser.getWechatUserId() == null) {
            // 未绑定企业微信，跳过
            notification.setStatus("skipped");
            notification.setErrorMessage("会员未绑定企业微信");
            notificationMapper.updateById(notification);
            log.info("会员 {} 未绑定企业微信，跳过退款通知", member.getId());
            return;
        }

        // 发送企业微信消息
        try {
            notifyManager.sendTextMessage(wechatUser.getWechatUserId(), content);
            notification.setStatus("sent");
            notification.setSendTime(LocalDateTime.now());
            notificationMapper.updateById(notification);

            // 更新退款记录
            refund.setNotified(true);
            refund.setNotifyTime(LocalDateTime.now());
            refundMapper.updateById(refund);

            log.info("退款成功通知已发送: refundId={}", refundId);

        } catch (Exception e) {
            log.error("发送退款成功通知失败: refundId={}", refundId, e);
            notification.setStatus("failed");
            notification.setErrorMessage(e.getMessage());
            notificationMapper.updateById(notification);
        }
    }

    /**
     * 发送退款失败告警
     */
    @Override
    @Transactional
    public void sendRefundFailedAlert(RefundRecord refund) {
        CampMember member = memberMapper.selectById(refund.getMemberId());
        TrainingCamp camp = campMapper.selectById(refund.getCampId());

        // 构建告警内容
        String template = configService.getString("notify.refund.failed",
            "[退款失败告警]\n训练营: {campName}\n会员: {nickname}\n金额: ¥{amount}\n原因: {reason}\n请及时登录后台处理");
        String content = template
            .replace("{campName}", camp.getName())
            .replace("{nickname}", member.getPlanetNickname())
            .replace("{amount}", refund.getRefundAmount().toString())
            .replace("{reason}", refund.getErrorMessage() != null ? refund.getErrorMessage() : "未知错误");

        // 创建通知记录
        NotificationMessage notification = NotificationMessage.builder()
            .type("fail_alert")
            .targetType("admin")
            .targetId(null) // 群聊消息
            .refundId(refund.getId())
            .content(content)
            .status("pending")
            .retryCount(0)
            .createdAt(LocalDateTime.now())
            .build();
        notificationMapper.insert(notification);

        // 发送群聊消息
        try {
            String chatId = configService.getString("wechat.admin.chatid");
            notifyManager.sendGroupMessage(chatId, content);
            notification.setStatus("sent");
            notification.setSendTime(LocalDateTime.now());
            notificationMapper.updateById(notification);

            log.info("退款失败告警已发送: refundId={}", refund.getId());

        } catch (Exception e) {
            log.error("发送退款失败告警失败: refundId={}", refund.getId(), e);
            notification.setStatus("failed");
            notification.setErrorMessage(e.getMessage());
            notificationMapper.updateById(notification);
        }
    }

    /**
     * 手动重发通知
     */
    @Override
    @Transactional
    public void resendNotification(Long notificationId) {
        NotificationMessage notification = notificationMapper.selectById(notificationId);
        if (notification == null) {
            throw new BusinessException(404, "通知记录不存在");
        }

        // 重置状态
        notification.setStatus("pending");
        notification.setRetryCount(0);
        notification.setErrorMessage(null);
        notificationMapper.updateById(notification);

        // 重新发送
        if ("success_notify".equals(notification.getType())) {
            sendRefundSuccessNotify(notification.getRefundId());
        } else if ("fail_alert".equals(notification.getType())) {
            RefundRecord refund = refundMapper.selectById(notification.getRefundId());
            sendRefundFailedAlert(refund);
        }
    }
}
```

#### WechatNotifyManager.java

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class WechatNotifyManager {

    private final WechatAccessTokenManager tokenManager;
    private final RestTemplate restTemplate;

    @Value("${wechat.corp.agentid}")
    private Integer agentId;

    private static final String SEND_MESSAGE_URL =
        "https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token={token}";

    private static final String SEND_GROUP_URL =
        "https://qyapi.weixin.qq.com/cgi-bin/appchat/send?access_token={token}";

    /**
     * 发送应用消息给用户
     */
    public void sendTextMessage(String userId, String content) {
        String accessToken = tokenManager.getAccessToken();

        Map<String, Object> message = new HashMap<>();
        message.put("touser", userId);
        message.put("msgtype", "text");
        message.put("agentid", agentId);
        message.put("text", Map.of("content", content));
        message.put("safe", 0);

        String url = SEND_MESSAGE_URL.replace("{token}", accessToken);
        Map<String, Object> response = restTemplate.postForObject(url, message, Map.class);

        if (response != null && !Integer.valueOf(0).equals(response.get("errcode"))) {
            throw new WechatException("发送消息失败: " + response.get("errmsg"));
        }

        log.info("企业微信消息已发送: userId={}", userId);
    }

    /**
     * 发送群聊消息
     */
    public void sendGroupMessage(String chatId, String content) {
        String accessToken = tokenManager.getAccessToken();

        Map<String, Object> message = new HashMap<>();
        message.put("chatid", chatId);
        message.put("msgtype", "text");
        message.put("text", Map.of("content", content));
        message.put("safe", 0);

        String url = SEND_GROUP_URL.replace("{token}", accessToken);
        Map<String, Object> response = restTemplate.postForObject(url, message, Map.class);

        if (response != null && !Integer.valueOf(0).equals(response.get("errcode"))) {
            throw new WechatException("发送群消息失败: " + response.get("errmsg"));
        }

        log.info("企业微信群消息已发送: chatId={}", chatId);
    }
}
```

#### NotificationRetryTask.java

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationRetryTask {

    private final NotificationMessageMapper notificationMapper;
    private final NotificationService notificationService;

    @Value("${notification.retry.max-count:3}")
    private int maxRetryCount;

    @Value("${notification.retry.enabled:true}")
    private boolean enabled;

    /**
     * 每5分钟重试失败的通知
     */
    @Scheduled(cron = "${notification.retry.cron:0 */5 * * * ?}")
    public void retryFailedNotifications() {
        if (!enabled) {
            return;
        }

        log.info("开始执行通知重试任务");

        // 查询失败且未超过重试次数的通知
        List<NotificationMessage> failedNotifications = notificationMapper.selectList(
            new LambdaQueryWrapper<NotificationMessage>()
                .eq(NotificationMessage::getStatus, "failed")
                .lt(NotificationMessage::getRetryCount, maxRetryCount)
        );

        int retried = 0;
        int succeeded = 0;

        for (NotificationMessage notification : failedNotifications) {
            try {
                // 增加重试次数
                notification.setRetryCount(notification.getRetryCount() + 1);
                notificationMapper.updateById(notification);

                // 重试发送
                notificationService.resendNotification(notification.getId());
                succeeded++;

            } catch (Exception e) {
                log.error("重试通知失败: id={}", notification.getId(), e);

                // 检查是否超过重试次数
                if (notification.getRetryCount() >= maxRetryCount) {
                    notification.setStatus("permanently_failed");
                    notificationMapper.updateById(notification);
                }
            }
            retried++;
        }

        log.info("通知重试任务完成: 重试{}条, 成功{}条", retried, succeeded);
    }
}
```

#### NotificationController.java

```java
@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * 获取通知列表
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public Result<PageResult<NotificationVO>> getNotifications(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {

        NotificationQuery query = NotificationQuery.builder()
            .type(type)
            .status(status)
            .page(page)
            .pageSize(pageSize)
            .build();

        PageResult<NotificationVO> result = notificationService.getNotifications(query);
        return Result.success(result);
    }

    /**
     * 获取通知统计
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public Result<NotificationStats> getStats() {
        NotificationStats stats = notificationService.getStats();
        return Result.success(stats);
    }

    /**
     * 手动重发通知
     */
    @PostMapping("/{id}/resend")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> resendNotification(@PathVariable Long id) {
        notificationService.resendNotification(id);
        return Result.success();
    }
}
```

### 配置项

```yaml
wechat:
  corp:
    corpid: ${WECHAT_CORP_ID}
    agentid: ${WECHAT_AGENT_ID}
    secret: ${WECHAT_SECRET}
  admin:
    chatid: ${WECHAT_ADMIN_CHATID}  # 管理员群聊ID

notification:
  retry:
    enabled: true
    cron: "0 */5 * * * ?"  # 每5分钟
    max-count: 3            # 最大重试次数
```

### 安全检查清单

- [ ] Access Token 安全存储
- [ ] 敏感信息日志脱敏
- [ ] 权限控制（仅管理员可重发）
- [ ] 防止重复通知（幂等检查）
- [ ] API 调用频率限制

### 测试要点

**后端测试**:
1. `NotificationServiceTest` - 测试成功/失败通知
2. `WechatNotifyManagerTest` - Mock 企业微信 API
3. `NotificationRetryTaskTest` - 测试重试逻辑
4. 测试模板替换
5. 测试未绑定企业微信情况

**集成测试**:
1. 端到端退款通知流程
2. 重试机制验证
3. 手动重发功能

---

## 项目结构

### 后端新增/修改文件

```
backend/src/main/java/com/camp/
├── controller/
│   └── admin/
│       └── NotificationController.java         # 新增通知控制器
├── service/
│   ├── NotificationService.java                # 新增通知服务接口
│   └── impl/
│       └── NotificationServiceImpl.java        # 新增
├── manager/
│   └── WechatNotifyManager.java                # 新增企业微信通知
├── schedule/
│   └── NotificationRetryTask.java              # 新增重试任务
├── entity/
│   └── NotificationMessage.java                # 新增通知消息实体
├── mapper/
│   └── NotificationMessageMapper.java          # 新增通知 Mapper
├── dto/
│   └── query/
│       └── NotificationQuery.java              # 新增通知查询
└── vo/
    ├── NotificationVO.java                     # 新增通知 VO
    └── NotificationStats.java                  # 新增统计 VO
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP04-S05 退款执行 | ready-for-dev | 退款成功/失败触发 |
| EP02-S06 支付回调 | ready-for-dev | wechat_user 关联 |
| 企业微信配置 | 必须完成 | corpid, agentid, secret |

### 后续依赖

本故事完成后:
- EP05-S04 提醒通知（复用 WechatNotifyManager）
- EP06-S02 异常告警（复用告警模板）

---

## References

| 文档 | 路径 | 相关章节 |
|------|------|----------|
| PRD | `docs/PRD.md` | 6.2 退款通知 |
| 接口文档 | `docs/v1/api/接口文档.md` | 10.1 通知管理 |
| 数据库设计 | `docs/v1/design/数据库设计.md` | notification_message 表 |
| Epic 定义 | `docs/epics.md` | EP04-S06 |
| 前一故事 | `docs/sprint-artifacts/stories/4-5-refund-execute.md` | 退款执行 |

---

## Dev Agent Record

### Context Reference
- Epic: EP04 身份匹配与退款流程
- Story: EP04-S06 退款结果通知
- FR Coverage: FR6.7, FR6.8

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
| 前置条件 | EP04-S05 完成 |
| 覆盖 FR | FR6.7, FR6.8 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
