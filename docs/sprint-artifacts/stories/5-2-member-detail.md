# Story 5.2: 会员详情与状态管理

**Status**: ready-for-dev

---

## Story

**作为**管理员，
**我希望**能够查看会员详情并管理会员状态，
**以便于**全面了解会员信息并进行必要的状态管理操作。

---

## 验收标准

### AC-1: 查看会员基本信息
```gherkin
Feature: 会员基本信息
  Scenario: 查看会员详情
    Given 管理员在会员列表
    When 点击某会员的"查看详情"
    Then 跳转到会员详情页
    And GET /api/admin/members/{id}
    And 显示基本信息:
      | 字段 | 说明 |
      | 训练营名称 | 所属训练营 |
      | 星球昵称 | 绑定的星球昵称 |
      | 星球ID | 星球用户ID |
      | 用户填写信息 | 报名时填写的信息 |
      | 微信昵称 | 微信用户昵称 |
      | 绑定状态 | 当前绑定状态 |
      | 绑定方式 | h5_bindplanet/user_fill/manual |
      | 匹配状态 | 当前匹配状态 |
      | 是否进群 | 是/否 |
      | 打卡进度 | x/y 天 |
      | 退款资格 | 是否满足 |
      | 创建时间 | 报名时间 |
```

### AC-2: 查看支付记录
```gherkin
Feature: 支付记录
  Scenario: 查看会员支付记录
    Given 会员详情页的"支付记录"Tab
    When 点击切换到该Tab
    Then GET /api/admin/members/{id}/payments
    Then 显示支付记录列表:
      | 字段 | 说明 |
      | 订单号 | 商户订单号 |
      | 支付金额 | 金额 |
      | 支付状态 | pending/success/failed |
      | 支付时间 | - |
      | 微信交易号 | transaction_id |

  Scenario: 无支付记录
    Given 会员无支付记录
    Then 显示空状态提示
```

### AC-3: 查看打卡记录
```gherkin
Feature: 打卡记录
  Scenario: 查看会员打卡记录
    Given 会员详情页的"打卡记录"Tab
    When 点击切换到该Tab
    Then GET /api/admin/members/{id}/checkins
    Then 显示打卡记录列表:
      | 字段 | 说明 |
      | 打卡日期 | 打卡的日期 |
      | 打卡内容 | 简要内容 |
      | 打卡时间 | 具体时间 |
      | 来源 | 星球同步/手动补录 |

  Scenario: 打卡统计
    Given 打卡记录Tab
    Then 显示统计:
      | 指标 | 说明 |
      | 已打卡天数 | checkinCount |
      | 要求天数 | requiredDays |
      | 完成率 | 百分比 |
```

### AC-4: 查看退款记录
```gherkin
Feature: 退款记录
  Scenario: 查看会员退款记录
    Given 会员详情页的"退款记录"Tab
    When 点击切换到该Tab
    Then GET /api/admin/members/{id}/refunds
    Then 显示退款记录列表:
      | 字段 | 说明 |
      | 退款单号 | out_refund_no |
      | 退款金额 | 金额 |
      | 审核状态 | pending/approved/rejected |
      | 退款状态 | pending/processing/success/failed |
      | 创建时间 | - |
      | 执行时间 | 退款成功时间 |

  Scenario: 无退款记录
    Given 会员无退款记录
    Then 显示"暂无退款记录"
```

### AC-5: 标记进群状态
```gherkin
Feature: 标记进群
  Scenario: 标记会员已进群
    Given 会员 joined_group = false
    When 管理员点击"标记已进群"
    Then POST /api/admin/members/{id}/join-group
    Then joined_group = true
    And 记录操作日志
    And 刷新页面显示

  Scenario: 取消进群标记
    Given 会员 joined_group = true
    When 管理员点击"取消进群标记"
    Then POST /api/admin/members/{id}/unjoin-group
    Then joined_group = false
    And 记录操作日志

  Scenario: 进群状态已是目标状态
    Given 会员 joined_group = true
    When 再次调用标记已进群
    Then 返回成功（幂等）
    And 状态不变
```

### AC-6: 查看操作日志
```gherkin
Feature: 操作日志
  Scenario: 查看会员相关操作日志
    Given 会员详情页的"操作日志"Tab
    When 点击切换到该Tab
    Then GET /api/admin/members/{id}/logs
    Then 显示操作日志列表:
      | 字段 | 说明 |
      | 操作类型 | manual_match/mark_joined 等 |
      | 操作人 | 管理员名称 |
      | 操作内容 | 详细描述 |
      | 操作时间 | - |
```

### AC-7: 前端会员详情页
```gherkin
Feature: 会员详情页面
  Scenario: 页面布局
    Given 管理员进入会员详情页
    Then 显示:
      | 区域 | 内容 |
      | 顶部 | 返回按钮、会员标识 |
      | 基本信息卡片 | 会员核心信息 |
      | Tab切换 | 支付记录/打卡记录/退款记录/操作日志 |
      | 操作按钮 | 标记进群等 |

  Scenario: Tab 切换
    Given 点击不同Tab
    Then 加载对应数据
    And 支持懒加载
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - 会员详情接口** (AC: #1)
  - [ ] 1.1 实现 `GET /api/admin/members/{id}`
  - [ ] 1.2 返回会员完整信息
  - [ ] 1.3 编写接口测试

- [ ] **Task 2: 后端 - 支付记录接口** (AC: #2)
  - [ ] 2.1 实现 `GET /api/admin/members/{id}/payments`
  - [ ] 2.2 返回支付记录列表
  - [ ] 2.3 编写接口测试

- [ ] **Task 3: 后端 - 打卡记录接口** (AC: #3)
  - [ ] 3.1 实现 `GET /api/admin/members/{id}/checkins`
  - [ ] 3.2 返回打卡记录列表和统计
  - [ ] 3.3 编写接口测试

- [ ] **Task 4: 后端 - 退款记录接口** (AC: #4)
  - [ ] 4.1 实现 `GET /api/admin/members/{id}/refunds`
  - [ ] 4.2 返回退款记录列表
  - [ ] 4.3 编写接口测试

- [ ] **Task 5: 后端 - 标记进群接口** (AC: #5)
  - [ ] 5.1 实现 `POST /api/admin/members/{id}/join-group`
  - [ ] 5.2 实现 `POST /api/admin/members/{id}/unjoin-group`
  - [ ] 5.3 记录操作日志
  - [ ] 5.4 编写接口测试

- [ ] **Task 6: 后端 - 操作日志接口** (AC: #6)
  - [ ] 6.1 实现 `GET /api/admin/members/{id}/logs`
  - [ ] 6.2 筛选会员相关日志
  - [ ] 6.3 编写接口测试

- [ ] **Task 7: 前端 - 会员详情页** (AC: #7)
  - [ ] 7.1 创建 `MemberDetail.vue`
  - [ ] 7.2 实现基本信息展示
  - [ ] 7.3 实现 Tab 切换
  - [ ] 7.4 添加路由配置

- [ ] **Task 8: 前端 - Tab 内容组件** (AC: #2, #3, #4, #6)
  - [ ] 8.1 实现支付记录Tab
  - [ ] 8.2 实现打卡记录Tab
  - [ ] 8.3 实现退款记录Tab
  - [ ] 8.4 实现操作日志Tab

- [ ] **Task 9: 前端 - 操作功能** (AC: #5)
  - [ ] 9.1 实现标记进群按钮
  - [ ] 9.2 实现确认对话框
  - [ ] 9.3 处理操作结果

- [ ] **Task 10: 集成测试与验收** (AC: #全部)
  - [ ] 10.1 测试详情数据加载
  - [ ] 10.2 测试各Tab数据
  - [ ] 10.3 测试标记进群功能
  - [ ] 10.4 测试前端交互

---

## Dev Notes

### 业务流程概述

本故事实现会员详情查看和状态管理。

```
从会员列表点击"查看详情"
     ↓
跳转到会员详情页 /member/{id}
     ↓
页面加载:
├── 调用 GET /api/admin/members/{id} 获取基本信息
└── 显示基本信息卡片
     ↓
Tab 切换:
├── 支付记录 Tab → GET /api/admin/members/{id}/payments
├── 打卡记录 Tab → GET /api/admin/members/{id}/checkins
├── 退款记录 Tab → GET /api/admin/members/{id}/refunds
└── 操作日志 Tab → GET /api/admin/members/{id}/logs
     ↓
操作按钮:
├── 标记已进群 → POST /api/admin/members/{id}/join-group
└── 取消进群 → POST /api/admin/members/{id}/unjoin-group
     ↓
操作完成 → 刷新页面 → 记录操作日志
```

### 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| Tab 加载 | 懒加载 | 减少初始请求 |
| 详情数据 | 单独接口 | 数据量适中 |
| 操作日志 | 筛选显示 | 只显示该会员相关 |
| 进群标记 | 幂等设计 | 防止重复操作 |

### 代码实现参考

#### MemberController.java - 详情相关接口

```java
/**
 * 获取会员详情
 */
@GetMapping("/{id}")
@PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
public Result<MemberDetailVO> getMemberDetail(@PathVariable Long id) {
    MemberDetailVO detail = memberService.getMemberDetail(id);
    return Result.success(detail);
}

/**
 * 获取会员支付记录
 */
@GetMapping("/{id}/payments")
@PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
public Result<List<PaymentRecordVO>> getMemberPayments(@PathVariable Long id) {
    List<PaymentRecordVO> payments = memberService.getMemberPayments(id);
    return Result.success(payments);
}

/**
 * 获取会员打卡记录
 */
@GetMapping("/{id}/checkins")
@PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
public Result<CheckinRecordResult> getMemberCheckins(@PathVariable Long id) {
    CheckinRecordResult result = memberService.getMemberCheckins(id);
    return Result.success(result);
}

/**
 * 获取会员退款记录
 */
@GetMapping("/{id}/refunds")
@PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
public Result<List<RefundRecordVO>> getMemberRefunds(@PathVariable Long id) {
    List<RefundRecordVO> refunds = memberService.getMemberRefunds(id);
    return Result.success(refunds);
}

/**
 * 标记会员已进群
 */
@PostMapping("/{id}/join-group")
@PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
public Result<Void> markJoinedGroup(@PathVariable Long id) {
    memberService.markJoinedGroup(id, true);
    return Result.success();
}

/**
 * 取消会员进群标记
 */
@PostMapping("/{id}/unjoin-group")
@PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
public Result<Void> markUnjoinedGroup(@PathVariable Long id) {
    memberService.markJoinedGroup(id, false);
    return Result.success();
}

/**
 * 获取会员操作日志
 */
@GetMapping("/{id}/logs")
@PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
public Result<List<OperationLogVO>> getMemberLogs(@PathVariable Long id) {
    List<OperationLogVO> logs = memberService.getMemberLogs(id);
    return Result.success(logs);
}
```

#### MemberServiceImpl.java - 详情实现

```java
@Override
public MemberDetailVO getMemberDetail(Long memberId) {
    CampMember member = memberMapper.selectById(memberId);
    if (member == null) {
        throw new BusinessException(404, "会员不存在");
    }

    TrainingCamp camp = campMapper.selectById(member.getCampId());
    WechatUser wechatUser = wechatUserMapper.selectByMemberId(memberId);

    return MemberDetailVO.builder()
        .id(member.getId())
        .campId(member.getCampId())
        .campName(camp != null ? camp.getName() : null)
        .planetNickname(member.getPlanetNickname())
        .planetUserId(member.getPlanetMemberNumber())
        .filledPlanetNickname(member.getFilledPlanetNickname())
        .filledPlanetUserId(member.getFilledPlanetUserId())
        .wechatNickname(wechatUser != null ? wechatUser.getNickname() : null)
        .wechatOpenid(wechatUser != null ? wechatUser.getOpenid() : null)
        .bindStatus(member.getBindStatus())
        .bindMethod(member.getBindMethod())
        .matchStatus(member.getMatchStatus())
        .joinedGroup(member.getJoinedGroup())
        .checkinCount(member.getCheckinCount())
        .requiredDays(camp != null ? camp.getRequiredDays() : null)
        .eligibleForRefund(member.getEligibleForRefund())
        .payAmount(member.getPayAmount())
        .payTime(member.getPayTime())
        .createdAt(member.getCreatedAt())
        .build();
}

@Override
public CheckinRecordResult getMemberCheckins(Long memberId) {
    CampMember member = memberMapper.selectById(memberId);
    TrainingCamp camp = campMapper.selectById(member.getCampId());

    List<CheckinRecord> records = checkinRecordMapper.selectList(
        new LambdaQueryWrapper<CheckinRecord>()
            .eq(CheckinRecord::getMemberId, memberId)
            .orderByDesc(CheckinRecord::getCheckinDate)
    );

    List<CheckinRecordVO> voList = records.stream()
        .map(this::convertCheckinToVO)
        .collect(Collectors.toList());

    // 统计信息
    CheckinStats stats = CheckinStats.builder()
        .checkinCount(member.getCheckinCount())
        .requiredDays(camp.getRequiredDays())
        .completionRate(calculateCompletionRate(member.getCheckinCount(), camp.getRequiredDays()))
        .build();

    return CheckinRecordResult.builder()
        .records(voList)
        .stats(stats)
        .build();
}

@Override
@Transactional
public void markJoinedGroup(Long memberId, boolean joined) {
    CampMember member = memberMapper.selectById(memberId);
    if (member == null) {
        throw new BusinessException(404, "会员不存在");
    }

    // 幂等检查
    if (member.getJoinedGroup() != null && member.getJoinedGroup().equals(joined)) {
        return;
    }

    Boolean oldValue = member.getJoinedGroup();
    member.setJoinedGroup(joined);
    memberMapper.updateById(member);

    // 记录操作日志
    operationLogService.log(OperationLog.builder()
        .operationType(joined ? "mark_joined_group" : "unmark_joined_group")
        .targetType("camp_member")
        .targetId(memberId)
        .content(JsonUtils.toJson(Map.of(
            "memberId", memberId,
            "oldValue", oldValue,
            "newValue", joined
        )))
        .build());
}
```

#### MemberDetail.vue

```vue
<template>
  <div class="member-detail">
    <!-- 顶部 -->
    <div class="header">
      <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
      <span class="title">会员详情</span>
    </div>

    <!-- 基本信息卡片 -->
    <el-card class="info-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>基本信息</span>
          <div class="actions">
            <el-button
              v-if="!member.joinedGroup"
              type="success"
              size="small"
              @click="handleMarkJoined"
            >
              标记已进群
            </el-button>
            <el-button
              v-else
              type="warning"
              size="small"
              @click="handleUnmarkJoined"
            >
              取消进群标记
            </el-button>
          </div>
        </div>
      </template>

      <el-descriptions :column="3" border>
        <el-descriptions-item label="训练营">{{ member.campName }}</el-descriptions-item>
        <el-descriptions-item label="星球昵称">{{ member.planetNickname }}</el-descriptions-item>
        <el-descriptions-item label="星球ID">{{ member.planetUserId }}</el-descriptions-item>
        <el-descriptions-item label="填写昵称">{{ member.filledPlanetNickname }}</el-descriptions-item>
        <el-descriptions-item label="填写ID">{{ member.filledPlanetUserId }}</el-descriptions-item>
        <el-descriptions-item label="微信昵称">{{ member.wechatNickname || '-' }}</el-descriptions-item>
        <el-descriptions-item label="绑定状态">
          <el-tag :type="getBindStatusType(member.bindStatus)">
            {{ getBindStatusText(member.bindStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="绑定方式">{{ getBindMethodText(member.bindMethod) }}</el-descriptions-item>
        <el-descriptions-item label="匹配状态">
          <el-tag :type="getMatchStatusType(member.matchStatus)">
            {{ getMatchStatusText(member.matchStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="是否进群">
          <el-tag :type="member.joinedGroup ? 'success' : 'info'">
            {{ member.joinedGroup ? '是' : '否' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="打卡进度">
          {{ member.checkinCount }} / {{ member.requiredDays }} 天
        </el-descriptions-item>
        <el-descriptions-item label="退款资格">
          <el-tag :type="member.eligibleForRefund ? 'success' : 'danger'">
            {{ member.eligibleForRefund ? '符合' : '不符合' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="支付金额">¥{{ member.payAmount }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ formatTime(member.payTime) }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatTime(member.createdAt) }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- Tab 切换 -->
    <el-card class="tabs-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="支付记录" name="payments">
          <payment-records :member-id="memberId" ref="paymentsRef" />
        </el-tab-pane>
        <el-tab-pane label="打卡记录" name="checkins">
          <checkin-records :member-id="memberId" ref="checkinsRef" />
        </el-tab-pane>
        <el-tab-pane label="退款记录" name="refunds">
          <refund-records :member-id="memberId" ref="refundsRef" />
        </el-tab-pane>
        <el-tab-pane label="操作日志" name="logs">
          <operation-logs :member-id="memberId" ref="logsRef" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMemberDetail, markJoinedGroup, unmarkJoinedGroup } from '@/api/member'
import PaymentRecords from './components/PaymentRecords.vue'
import CheckinRecords from './components/CheckinRecords.vue'
import RefundRecords from './components/RefundRecords.vue'
import OperationLogs from './components/OperationLogs.vue'

const route = useRoute()
const router = useRouter()
const memberId = ref(route.params.id)
const loading = ref(false)
const member = ref({})
const activeTab = ref('payments')

// 加载会员详情
const loadMemberDetail = async () => {
  loading.value = true
  try {
    const res = await getMemberDetail(memberId.value)
    member.value = res.data
  } finally {
    loading.value = false
  }
}

// 标记已进群
const handleMarkJoined = async () => {
  await ElMessageBox.confirm('确认标记该会员已进群？', '提示')
  await markJoinedGroup(memberId.value)
  ElMessage.success('已标记进群')
  loadMemberDetail()
}

// 取消进群标记
const handleUnmarkJoined = async () => {
  await ElMessageBox.confirm('确认取消该会员的进群标记？', '提示')
  await unmarkJoinedGroup(memberId.value)
  ElMessage.success('已取消进群标记')
  loadMemberDetail()
}

// Tab 切换懒加载
const handleTabChange = (tab) => {
  // 各组件内部会处理数据加载
}

// 返回
const goBack = () => {
  router.back()
}

// 状态映射函数...
const getBindStatusType = (status) => { /* ... */ }
const getBindStatusText = (status) => { /* ... */ }
const getMatchStatusType = (status) => { /* ... */ }
const getMatchStatusText = (status) => { /* ... */ }
const getBindMethodText = (method) => { /* ... */ }
const formatTime = (time) => { /* ... */ }

onMounted(() => {
  loadMemberDetail()
})
</script>
```

### API 响应示例

#### GET /api/admin/members/{id}

```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "id": 1001,
    "campId": 1,
    "campName": "21天早起打卡训练营",
    "planetNickname": "张三",
    "planetUserId": "123456789",
    "filledPlanetNickname": "张三",
    "filledPlanetUserId": "123456789",
    "wechatNickname": "小张",
    "wechatOpenid": "o1234567890",
    "bindStatus": "completed",
    "bindMethod": "h5_bindplanet",
    "matchStatus": "matched",
    "joinedGroup": true,
    "checkinCount": 18,
    "requiredDays": 15,
    "eligibleForRefund": true,
    "payAmount": 99.00,
    "payTime": "2025-12-01T10:00:00",
    "createdAt": "2025-12-01T10:00:00"
  }
}
```

### 安全检查清单

- [ ] 权限控制：仅 ADMIN/COACH 可访问
- [ ] ID 校验：确保会员存在
- [ ] 操作日志：记录所有状态变更
- [ ] 幂等处理：重复操作不报错

### 测试要点

**后端测试**:
1. `MemberControllerTest` - 测试详情接口
2. 测试各Tab数据接口
3. 测试标记进群功能
4. 测试操作日志记录

**前端测试**:
1. 测试详情页数据展示
2. 测试Tab切换加载
3. 测试标记进群交互

---

## 项目结构

### 后端新增/修改文件

```
backend/src/main/java/com/camp/
├── controller/
│   └── admin/
│       └── MemberController.java              # 修改添加详情接口
├── service/
│   └── impl/
│       └── MemberServiceImpl.java             # 修改添加详情方法
└── vo/
    ├── MemberDetailVO.java                    # 新增详情 VO
    ├── PaymentRecordVO.java                   # 新增支付记录 VO
    ├── CheckinRecordVO.java                   # 新增打卡记录 VO
    ├── CheckinRecordResult.java               # 新增打卡结果 VO
    └── OperationLogVO.java                    # 新增操作日志 VO
```

### 前端新增文件

```
frontend/admin-web/src/
├── views/
│   └── member/
│       ├── MemberDetail.vue                   # 新增会员详情页
│       └── components/
│           ├── PaymentRecords.vue             # 新增支付记录组件
│           ├── CheckinRecords.vue             # 新增打卡记录组件
│           ├── RefundRecords.vue              # 新增退款记录组件
│           └── OperationLogs.vue              # 新增操作日志组件
└── router/
    └── index.js                               # 添加路由
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP05-S01 会员列表 | ready-for-dev | 列表入口 |
| EP02-S04 支付记录 | ready-for-dev | payment_record 数据 |
| EP03-S02 打卡同步 | ready-for-dev | checkin_record 数据 |

### 后续依赖

本故事完成后:
- EP05-S03 人工绑定（从详情页操作）

---

## References

| 文档 | 路径 | 相关章节 |
|------|------|----------|
| PRD | `docs/PRD.md` | 4.3.2 会员详情 |
| 接口文档 | `docs/v1/api/接口文档.md` | 5.2 会员详情 |
| Epic 定义 | `docs/epics.md` | EP05-S02 |
| 前一故事 | `docs/sprint-artifacts/stories/5-1-member-list.md` | 会员列表 |

---

## Dev Agent Record

### Context Reference
- Epic: EP05 会员管理与通知系统
- Story: EP05-S02 会员详情与状态管理
- FR Coverage: FR7.2, FR7.4

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
| Epic | EP05 |
| 前置条件 | EP05-S01 完成 |
| 覆盖 FR | FR7.2, FR7.4 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
