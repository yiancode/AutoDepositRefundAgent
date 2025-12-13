# Story 3.5: H5打卡进度查询页

**Status**: ready-for-dev

> **SSOT引用**: [状态枚举定义.md](../../v1/design/状态枚举定义.md) - camp_status、refund_status 等状态枚举值

---

## Story

**作为**会员，
**我希望**在H5页面查看自己的打卡进度和退款资格，
**以便于**了解当前打卡情况并确认是否满足退款条件。

---

## 验收标准

### AC-1: 打卡进度页入口
```gherkin
Feature: 打卡进度页入口
  Scenario: 从支付成功页进入
    Given 用户支付成功
    And 绑定状态为 completed
    When 点击「查看打卡进度」按钮
    Then 跳转到打卡进度页 /progress/{memberId}
    And 自动携带 accessToken

  Scenario: 从群二维码页进入
    Given 用户在群二维码展示页
    When 点击「我的打卡」按钮
    Then 跳转到打卡进度页
    And 使用本地存储的 accessToken
```

### AC-2: 训练营信息卡片
```gherkin
Feature: 训练营信息展示
  Scenario: 显示训练营基本信息
    Given 用户访问打卡进度页
    When 页面加载完成
    Then 显示训练营信息卡片:
      | 字段 | 说明 |
      | campName | 训练营名称 |
      | startDate | 开始日期 |
      | endDate | 结束日期 |
      | requiredDays | 要求打卡天数 |
      | planetNickname | 星球昵称 |

  Scenario: 显示时间进度条
    Given 训练营总时长 21 天
    And 已进行 15 天
    When 页面加载完成
    Then 显示进度条 15/21 (71%)
    And 进度条颜色根据进度变化
    And 显示文案「已进行 15 天 / 共 21 天」
```

### AC-3: 打卡统计展示
```gherkin
Feature: 打卡统计
  Scenario: 显示打卡完成情况
    Given 用户已打卡 12 天
    And 要求打卡 15 天
    When 页面加载完成
    Then 显示打卡统计:
      | 字段 | 值 |
      | checkinCount | 12 |
      | requiredDays | 15 |
      | checkinRate | 80% |
      | gap | 差 3 天 |
    And 打卡进度条显示 12/15

  Scenario: 显示剩余天数
    Given 训练营剩余 6 天
    And 还需打卡 3 天
    When 页面加载完成
    Then 显示「还需打卡 3 天，剩余 6 天」
    And 可完成时显示绿色提示
    And 不可完成时显示红色警告
```

### AC-4: 退款资格状态
```gherkin
Feature: 退款资格显示
  Scenario: 符合退款条件
    Given checkinCount >= requiredDays
    And eligibleForRefund = true
    When 页面加载完成
    Then 显示 ✅ 绿色标签「恭喜！您已满足退款条件」
    And 显示退款金额
    And 显示预计退款时间（训练营结束后）

  Scenario: 未达到退款条件（进行中）
    Given checkinCount < requiredDays
    And 训练营状态为 ongoing
    When 页面加载完成
    Then 显示 ⏳ 黄色标签「继续加油，还差 X 天」
    And 显示鼓励文案

  Scenario: 未达到退款条件（已结束）
    Given checkinCount < requiredDays
    And 训练营状态为 ended
    When 页面加载完成
    Then 显示 ❌ 红色标签「未达到退款条件」
    And 显示实际打卡情况

  Scenario: 退款已处理
    Given refundStatus = success
    When 页面加载完成
    Then 显示 💰 绿色标签「退款已到账」
    And 显示退款金额和到账时间
```

### AC-5: 打卡日历视图
```gherkin
Feature: 打卡日历
  Scenario: 显示打卡日历
    Given 训练营日期范围 12月10日-12月31日
    When 页面加载完成
    Then 显示日历组件
    And 已打卡日期显示 ✅ 绿色圆点
    And 未打卡日期显示 ❌ 红色圆点
    And 未来日期显示灰色
    And 今日日期高亮显示

  Scenario: 日历交互
    Given 日历显示中
    When 点击某一天
    Then 显示该日打卡详情（如有）
    And 显示打卡时间和内容
```

### AC-6: 下拉刷新
```gherkin
Feature: 下拉刷新
  Scenario: 刷新数据
    Given 用户在打卡进度页
    When 下拉页面
    Then 显示刷新动画
    And 重新请求 GET /api/h5/progress/{memberId}
    And 刷新完成显示提示

  Scenario: 数据更新提示
    Given 打卡数据每日01:00更新
    When 页面加载完成
    Then 显示底部提示「数据每日 01:00 更新，最后同步：{lastSyncTime}」
```

### AC-7: 票据验证
```gherkin
Feature: 票据验证
  Scenario: 票据有效
    Given 用户携带有效 accessToken
    When 访问打卡进度页
    Then 正常显示数据

  Scenario: 票据无效
    Given accessToken 无效或过期
    When 访问打卡进度页
    Then 返回错误码 401
    And 显示「登录已过期，请重新访问」
    And 提供重新进入入口

  Scenario: memberId 不匹配
    Given accessToken 对应的 memberId 与请求不一致
    When 访问 /progress/{otherMemberId}
    Then 返回错误码 403
    And 显示「无权查看此信息」
```

### AC-8: 后端接口实现
```gherkin
Feature: 后端接口
  Scenario: GET /api/h5/progress/{memberId}
    Given 请求携带有效 X-Access-Token
    When 调用接口
    Then 返回打卡进度数据:
      | 字段 | 类型 | 说明 |
      | memberId | long | 会员ID |
      | campId | long | 训练营ID |
      | campName | string | 训练营名称 |
      | planetNickname | string | 星球昵称 |
      | startDate | date | 开始日期 |
      | endDate | date | 结束日期 |
      | currentDay | int | 当前第几天 |
      | totalDays | int | 总天数 |
      | requiredDays | int | 要求打卡天数 |
      | checkinCount | int | 已打卡天数 |
      | checkinRate | decimal | 打卡率 |
      | remainingDays | int | 剩余天数 |
      | gap | int | 差距天数 |
      | status | string | 训练营状态 |
      | eligibleForRefund | boolean | 是否符合退款 |
      | refundStatus | string | 退款状态 |
      | checkinCalendar | array | 打卡日历 |
      | lastCheckinTime | datetime | 最后打卡时间 |
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - 打卡进度接口** (AC: #8)
  - [ ] 1.1 创建 `ProgressH5Controller.java`
  - [ ] 1.2 实现 `GET /api/h5/progress/{memberId}`
  - [ ] 1.3 添加 accessToken 票据验证
  - [ ] 1.4 验证 memberId 与 accessToken 匹配
  - [ ] 1.5 编写接口测试

- [ ] **Task 2: 后端 - 进度数据服务** (AC: #8)
  - [ ] 2.1 创建 `CheckinProgressService.java`
  - [ ] 2.2 实现 `getProgress(memberId)` 方法
  - [ ] 2.3 计算打卡统计（count, rate, gap）
  - [ ] 2.4 生成打卡日历数据
  - [ ] 2.5 编写单元测试

- [ ] **Task 3: 前端 - 页面结构** (AC: #1, #2)
  - [ ] 3.1 创建 `CheckinProgress.vue`
  - [ ] 3.2 实现训练营信息卡片组件
  - [ ] 3.3 实现时间进度条组件
  - [ ] 3.4 添加页面路由 `/progress/:memberId`

- [ ] **Task 4: 前端 - 打卡统计组件** (AC: #3)
  - [ ] 4.1 创建 `CheckinStats.vue` 组件
  - [ ] 4.2 实现打卡进度条
  - [ ] 4.3 实现统计数据展示
  - [ ] 4.4 实现剩余天数计算展示

- [ ] **Task 5: 前端 - 退款资格组件** (AC: #4)
  - [ ] 5.1 创建 `RefundStatus.vue` 组件
  - [ ] 5.2 实现不同状态的样式展示
  - [ ] 5.3 实现退款金额和时间展示
  - [ ] 5.4 添加状态动画效果

- [ ] **Task 6: 前端 - 打卡日历** (AC: #5)
  - [ ] 6.1 集成 Vant Calendar 组件
  - [ ] 6.2 实现自定义日期渲染
  - [ ] 6.3 实现打卡状态标记
  - [ ] 6.4 实现日期点击详情

- [ ] **Task 7: 前端 - 下拉刷新** (AC: #6)
  - [ ] 7.1 集成 Vant PullRefresh 组件
  - [ ] 7.2 实现刷新逻辑
  - [ ] 7.3 显示数据更新提示

- [ ] **Task 8: 前端 - 票据处理** (AC: #7)
  - [ ] 8.1 实现 accessToken 存储和读取
  - [ ] 8.2 实现请求拦截器添加 Header
  - [ ] 8.3 实现票据过期处理
  - [ ] 8.4 实现错误页面展示

- [ ] **Task 9: 集成测试与验收** (AC: #全部)
  - [ ] 9.1 测试完整查询流程
  - [ ] 9.2 测试票据验证
  - [ ] 9.3 测试不同打卡状态展示
  - [ ] 9.4 测试下拉刷新
  - [ ] 9.5 移动端适配测试

---

## Dev Notes

### 业务流程概述

本故事实现H5端会员打卡进度查询页面。

```
支付成功页 / 群二维码页
     ↓
点击「查看打卡进度」
     ↓
携带 accessToken 访问 /progress/{memberId}
     ↓
后端验证 accessToken
     ↓ (验证通过)
查询 camp_member + training_camp
     ↓
计算打卡统计和退款资格
     ↓
生成打卡日历数据
     ↓
返回进度数据
     ↓
前端渲染页面
├── 训练营信息卡片
├── 时间进度条
├── 打卡统计
├── 退款资格状态
└── 打卡日历
```

### 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 日历组件 | Vant Calendar | 移动端友好，支持自定义渲染 |
| 进度条 | Vant Progress | 统一UI风格 |
| 票据存储 | localStorage | 简单可靠，支持跨页面 |
| 数据缓存 | 不缓存 | 确保数据实时性 |
| 刷新方式 | 下拉刷新 | 移动端交互习惯 |

### API 响应示例

```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "memberId": 1001,
    "campId": 1,
    "campName": "21天早起打卡训练营",
    "planetNickname": "小明同学",
    "startDate": "2025-12-10",
    "endDate": "2025-12-31",
    "currentDay": 15,
    "totalDays": 21,
    "requiredDays": 15,
    "checkinCount": 12,
    "checkinRate": 80.00,
    "remainingDays": 6,
    "gap": 3,
    "status": "ongoing",
    "eligibleForRefund": false,
    "refundStatus": null,
    "checkinCalendar": [
      {"date": "2025-12-10", "checked": true},
      {"date": "2025-12-11", "checked": true},
      {"date": "2025-12-12", "checked": false}
    ],
    "lastCheckinTime": "2025-12-23T06:30:00",
    "lastSyncTime": "2025-12-24T01:00:00"
  }
}
```

### 代码实现参考

#### ProgressH5Controller.java

```java
@RestController
@RequestMapping("/api/h5/progress")
@RequiredArgsConstructor
@Slf4j
public class ProgressH5Controller {

    private final CheckinProgressService progressService;
    private final AccessTokenService accessTokenService;

    /**
     * 查询打卡进度
     */
    @GetMapping("/{memberId}")
    public Result<CheckinProgressVO> getProgress(
            @PathVariable Long memberId,
            @RequestHeader("X-Access-Token") String accessToken) {

        // 1. 验证票据
        AccessTokenInfo tokenInfo = accessTokenService.validateToken(accessToken);
        if (tokenInfo == null) {
            throw new BusinessException(401, "登录已过期，请重新访问");
        }

        // 2. 验证 memberId 匹配
        if (!memberId.equals(tokenInfo.getMemberId())) {
            throw new BusinessException(403, "无权查看此信息");
        }

        // 3. 查询进度数据
        CheckinProgressVO progress = progressService.getProgress(memberId);

        return Result.success(progress);
    }
}
```

#### CheckinProgressService.java

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class CheckinProgressService {

    private final CampMemberMapper campMemberMapper;
    private final TrainingCampMapper trainingCampMapper;
    private final SyncLogMapper syncLogMapper;

    /**
     * 获取打卡进度
     */
    public CheckinProgressVO getProgress(Long memberId) {
        // 1. 查询会员信息
        CampMember member = campMemberMapper.selectById(memberId);
        if (member == null) {
            throw new BusinessException(404, "会员不存在");
        }

        // 2. 查询训练营信息
        TrainingCamp camp = trainingCampMapper.selectById(member.getCampId());

        // 3. 计算统计数据
        LocalDate today = LocalDate.now();
        LocalDate startDate = camp.getStartDate();
        LocalDate endDate = camp.getEndDate();

        int totalDays = (int) ChronoUnit.DAYS.between(startDate, endDate) + 1;
        int currentDay = Math.min(
            (int) ChronoUnit.DAYS.between(startDate, today) + 1,
            totalDays
        );
        int remainingDays = Math.max(
            (int) ChronoUnit.DAYS.between(today, endDate),
            0
        );

        int checkinCount = member.getCheckinCount();
        int requiredDays = camp.getRequiredDays();
        int gap = Math.max(requiredDays - checkinCount, 0);
        double checkinRate = totalDays > 0 ?
            (checkinCount * 100.0 / currentDay) : 0;

        // 4. 生成打卡日历
        List<CheckinCalendarItem> calendar = buildCheckinCalendar(
            member, startDate, endDate
        );

        // 5. 获取最后同步时间
        LocalDateTime lastSyncTime = getLastSyncTime(camp.getId());

        // 6. 构建返回对象
        return CheckinProgressVO.builder()
            .memberId(memberId)
            .campId(camp.getId())
            .campName(camp.getName())
            .planetNickname(member.getPlanetNickname())
            .startDate(startDate)
            .endDate(endDate)
            .currentDay(currentDay)
            .totalDays(totalDays)
            .requiredDays(requiredDays)
            .checkinCount(checkinCount)
            .checkinRate(BigDecimal.valueOf(checkinRate).setScale(2, RoundingMode.HALF_UP))
            .remainingDays(remainingDays)
            .gap(gap)
            .status(camp.getStatus())
            .eligibleForRefund(member.getEligibleForRefund())
            .refundStatus(member.getRefundStatus())
            .checkinCalendar(calendar)
            .lastCheckinTime(member.getLastCheckinTime())
            .lastSyncTime(lastSyncTime)
            .build();
    }

    private List<CheckinCalendarItem> buildCheckinCalendar(
            CampMember member, LocalDate startDate, LocalDate endDate) {
        // 从数据库查询打卡记录或从 member 的打卡数据生成
        // 这里简化实现，实际需要查询 checkin_record 表
        List<CheckinCalendarItem> calendar = new ArrayList<>();

        LocalDate current = startDate;
        while (!current.isAfter(endDate) && !current.isAfter(LocalDate.now())) {
            CheckinCalendarItem item = new CheckinCalendarItem();
            item.setDate(current);
            // TODO: 根据实际打卡记录判断
            item.setChecked(false); // 需要从 checkin_record 查询
            calendar.add(item);
            current = current.plusDays(1);
        }

        return calendar;
    }

    private LocalDateTime getLastSyncTime(Long campId) {
        SyncLog lastLog = syncLogMapper.selectLastSuccessLog(campId, "checkin");
        return lastLog != null ? lastLog.getFinishedAt() : null;
    }
}
```

#### CheckinProgress.vue (前端)

```vue
<template>
  <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
    <div class="progress-page">
      <!-- 训练营信息卡片 -->
      <van-cell-group class="camp-card">
        <van-cell :title="progress.campName" :label="dateRange" />
        <van-cell title="我的身份" :value="progress.planetNickname" />
      </van-cell-group>

      <!-- 时间进度 -->
      <div class="time-progress">
        <div class="title">训练营进度</div>
        <van-progress
          :percentage="timePercentage"
          stroke-width="12"
          :color="timeProgressColor"
        />
        <div class="label">
          已进行 {{ progress.currentDay }} 天 / 共 {{ progress.totalDays }} 天
        </div>
      </div>

      <!-- 打卡统计 -->
      <checkin-stats :progress="progress" />

      <!-- 退款资格状态 -->
      <refund-status :progress="progress" />

      <!-- 打卡日历 -->
      <div class="calendar-section">
        <div class="title">打卡日历</div>
        <van-calendar
          v-model:show="showCalendar"
          type="single"
          :min-date="minDate"
          :max-date="maxDate"
          :formatter="calendarFormatter"
          :show-confirm="false"
        />
      </div>

      <!-- 数据更新提示 -->
      <div class="sync-tip">
        数据每日 01:00 更新，最后同步：{{ formatTime(progress.lastSyncTime) }}
      </div>
    </div>
  </van-pull-refresh>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant'
import { getProgress } from '@/api/progress'
import CheckinStats from '@/components/CheckinStats.vue'
import RefundStatus from '@/components/RefundStatus.vue'

const route = useRoute()
const memberId = route.params.memberId
const progress = ref({})
const refreshing = ref(false)
const showCalendar = ref(true)

const timePercentage = computed(() => {
  if (!progress.value.totalDays) return 0
  return Math.round((progress.value.currentDay / progress.value.totalDays) * 100)
})

const timeProgressColor = computed(() => {
  const p = timePercentage.value
  if (p < 30) return '#4caf50'
  if (p < 70) return '#ff9800'
  return '#f44336'
})

const dateRange = computed(() => {
  return `${progress.value.startDate} ~ ${progress.value.endDate}`
})

const minDate = computed(() => new Date(progress.value.startDate))
const maxDate = computed(() => new Date(progress.value.endDate))

const calendarFormatter = (day) => {
  const dateStr = formatDate(day.date)
  const calendarItem = progress.value.checkinCalendar?.find(
    item => item.date === dateStr
  )

  if (calendarItem) {
    day.bottomInfo = calendarItem.checked ? '✅' : '❌'
  }
  return day
}

const fetchProgress = async () => {
  try {
    const res = await getProgress(memberId)
    progress.value = res.data
  } catch (error) {
    showToast(error.message || '加载失败')
  }
}

const onRefresh = async () => {
  await fetchProgress()
  refreshing.value = false
  showToast('刷新成功')
}

const formatTime = (time) => {
  if (!time) return '暂无'
  return new Date(time).toLocaleString()
}

const formatDate = (date) => {
  return date.toISOString().split('T')[0]
}

onMounted(() => {
  fetchProgress()
})
</script>

<style scoped>
.progress-page {
  padding: 16px;
  background: #f7f8fa;
  min-height: 100vh;
}

.camp-card {
  margin-bottom: 16px;
  border-radius: 8px;
}

.time-progress {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.time-progress .title {
  font-weight: bold;
  margin-bottom: 12px;
}

.time-progress .label {
  text-align: center;
  color: #999;
  font-size: 12px;
  margin-top: 8px;
}

.calendar-section {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
}

.calendar-section .title {
  font-weight: bold;
  margin-bottom: 12px;
}

.sync-tip {
  text-align: center;
  color: #999;
  font-size: 12px;
  padding: 16px;
}
</style>
```

### 页面效果示意

```
┌─────────────────────────────────┐
│  21天早起打卡训练营              │
│  2025-12-10 ~ 2025-12-31        │
│  我的身份: 小明同学              │
├─────────────────────────────────┤
│  训练营进度                      │
│  ████████████░░░░░ 71%          │
│  已进行 15 天 / 共 21 天         │
├─────────────────────────────────┤
│  打卡统计                        │
│  ████████░░░░ 12/15 (80%)       │
│  还需打卡 3 天，剩余 6 天        │
├─────────────────────────────────┤
│  ⏳ 继续加油，还差 3 天          │
│  退款金额：¥99.00               │
├─────────────────────────────────┤
│  打卡日历                        │
│  ┌───┬───┬───┬───┬───┬───┬───┐ │
│  │ 10│ 11│ 12│ 13│ 14│ 15│ 16│ │
│  │ ✅│ ✅│ ❌│ ✅│ ✅│ ✅│ ❌│ │
│  └───┴───┴───┴───┴───┴───┴───┘ │
├─────────────────────────────────┤
│  数据每日01:00更新               │
│  最后同步：2025-12-24 01:00     │
└─────────────────────────────────┘
```

### 安全检查清单

- [ ] accessToken 验证必须严格
- [ ] memberId 必须与 token 匹配
- [ ] 不泄露其他用户数据
- [ ] 票据过期有友好提示
- [ ] XSS 防护（用户昵称展示）

### 测试要点

**后端测试**:
1. `ProgressH5ControllerTest` - 测试接口权限、参数校验
2. `CheckinProgressServiceTest` - 测试统计计算逻辑
3. 测试票据验证

**前端测试**:
1. 测试不同打卡状态展示
2. 测试退款资格各种情况
3. 测试下拉刷新
4. 测试票据过期处理
5. 移动端适配测试

---

## 项目结构

### 后端新增/修改文件

```
backend/src/main/java/com/camp/
├── controller/
│   └── h5/
│       └── ProgressH5Controller.java       # 新增进度控制器
├── service/
│   └── CheckinProgressService.java         # 新增进度服务
└── vo/
    └── h5/
        ├── CheckinProgressVO.java          # 新增进度VO
        └── CheckinCalendarItem.java        # 新增日历项
```

### 前端新增文件

```
frontend/h5-member/src/
├── views/
│   └── CheckinProgress.vue                 # 新增进度页面
├── components/
│   ├── CheckinStats.vue                    # 新增统计组件
│   └── RefundStatus.vue                    # 新增退款状态组件
├── api/
│   └── progress.js                         # 新增进度API
└── router/
    └── index.js                            # 添加路由
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP03-S02 定时同步 | ready-for-dev | 打卡数据来源 |
| EP02-S06 群二维码 | ready-for-dev | accessToken 来源 |
| EP02-S07 用户绑定 | ready-for-dev | 绑定状态查询 |

### 后续依赖

本故事完成后:
- EP03-S06 管理后台打卡统计（复用部分统计逻辑）
- EP04 退款流程（退款状态展示）

---

## References

| 文档 | 路径 | 相关章节 |
|------|------|----------|
| PRD | `docs/PRD.md` | FR8.1 H5打卡进度页, FR8.2 打卡记录列表 |
| 接口文档 | `docs/v1/api/接口文档.md` | 3.8 查询打卡进度 |
| 技术方案 | `docs/v1/design/技术方案.md` | H5前端技术栈 |
| Epic 定义 | `docs/epics.md` | EP03-S05 |
| 前一故事 | `docs/sprint-artifacts/stories/3-4-token-expire-alert.md` | Token告警 |

---

## Dev Agent Record

### Context Reference
- Epic: EP03 打卡数据同步与进度查询
- Story: EP03-S05 H5打卡进度查询页
- FR Coverage: FR8.1, FR8.2

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
| Epic | EP03 |
| 前置条件 | EP03-S02, EP02-S06 完成 |
| 覆盖 FR | FR8.1, FR8.2 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
