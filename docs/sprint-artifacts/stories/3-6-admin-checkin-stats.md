# Story 3.6: 管理后台打卡统计页

**Status**: ready-for-dev

---

## Story

**作为**管理员，
**我希望**在管理后台查看训练营的打卡统计和会员打卡进度，
**以便于**全面了解训练营打卡情况并做好退款准备工作。

---

## 验收标准

### AC-1: 打卡统计概览
```gherkin
Feature: 打卡统计概览
  Scenario: 显示统计概览卡片
    Given 管理员在训练营详情页 - 打卡情况Tab
    When 页面加载完成
    Then 显示统计概览卡片:
      | 字段 | 说明 |
      | totalMembers | 总人数 |
      | todayCheckins | 今日打卡人数 |
      | todayCheckinRate | 今日打卡率 |
      | avgCheckinRate | 平均打卡率 |
      | eligibleCount | 满足退款条件人数 |
      | eligibleRate | 退款资格达成率 |
    And 显示训练营进度: 第 {currentDay} 天 / 共 {totalDays} 天

  Scenario: 显示打卡分布图
    Given 统计概览页面加载完成
    When 渲染打卡分布
    Then 显示柱状图:
      | 分组 | 说明 |
      | 0-5天 | 打卡0-5天的人数 |
      | 6-10天 | 打卡6-10天的人数 |
      | 11-15天 | 打卡11-15天的人数 |
      | 16-21天 | 打卡16-21天的人数 |
    And 图表可切换为饼图
```

### AC-2: 每日打卡趋势
```gherkin
Feature: 每日打卡趋势
  Scenario: 显示打卡趋势折线图
    Given 管理员在打卡统计页
    When 页面加载完成
    Then 显示每日打卡趋势图:
      | 轴 | 数据 |
      | X轴 | 日期 |
      | Y轴 | 打卡人数 / 打卡率 |
    And 支持切换: 打卡人数 / 打卡率
    And 鼠标悬停显示详细数据
    And 显示训练营起止日期范围
```

### AC-3: 会员打卡进度表
```gherkin
Feature: 会员打卡进度表
  Scenario: 显示会员打卡列表
    Given 管理员在打卡统计页
    When 查看会员打卡进度表
    Then 显示表格列:
      | 列名 | 说明 |
      | 星球昵称 | planetNickname |
      | 已打卡天数 | checkinCount |
      | 要求天数 | requiredDays |
      | 完成率 | checkinRate% |
      | 退款资格 | eligibleForRefund |
      | 最后打卡 | lastCheckinTime |
      | 操作 | 查看日历 |
    And 默认按完成率降序排列

  Scenario: 搜索和筛选
    Given 会员打卡进度表显示中
    When 使用筛选功能
    Then 支持:
      | 筛选项 | 选项 |
      | 退款资格 | 全部 / 已满足 / 未满足 |
      | 搜索 | 按星球昵称搜索 |
      | 排序 | 打卡天数 / 完成率 / 最后打卡时间 |

  Scenario: 分页
    Given 会员数量超过每页条数
    When 翻页
    Then 支持分页: 10/20/50/100 条每页
    And 显示总记录数
```

### AC-4: 会员打卡日历视图
```gherkin
Feature: 打卡日历视图
  Scenario: 查看单个会员打卡日历
    Given 会员打卡进度表显示中
    When 点击某会员的「查看日历」按钮
    Then 弹出日历视图对话框
    And 显示会员基本信息:
      | 字段 | 说明 |
      | 星球昵称 | planetNickname |
      | 已打卡 | checkinCount 天 |
      | 完成率 | checkinRate% |
    And 日历范围: 训练营开始日期 ~ 结束日期
    And 已打卡日期显示 ✅ 绿色标记
    And 未打卡日期显示 ❌ 红色标记
    And 未来日期显示灰色
    And 今日日期高亮

  Scenario: 日历日期点击
    Given 日历视图显示中
    When 点击某一天
    Then 显示该日打卡详情（如有）:
      | 字段 | 说明 |
      | 打卡时间 | checkinTime |
      | 打卡内容 | checkinContent（截取前100字符）|
```

### AC-5: 手动同步按钮
```gherkin
Feature: 手动同步
  Scenario: 触发手动同步
    Given 管理员在打卡统计页
    When 点击「同步打卡数据」按钮
    Then 确认对话框: "确定同步该训练营的打卡数据？"
    And 确认后调用 POST /api/admin/checkins/sync/{campId}
    And 显示同步进度
    And 同步完成后刷新统计数据

  Scenario: 同步中状态
    Given 同步正在进行中
    When 再次点击同步按钮
    Then 按钮禁用
    And 显示「同步中...」
    And 完成后恢复按钮状态
```

### AC-6: 数据导出
```gherkin
Feature: 数据导出
  Scenario: 导出打卡统计
    Given 管理员在打卡统计页
    When 点击「导出」按钮
    Then 显示导出选项:
      | 选项 | 说明 |
      | 导出统计汇总 | Excel 格式 |
      | 导出会员明细 | Excel 格式 |
    And 导出文件名: {训练营名称}_打卡统计_{日期}.xlsx

  Scenario: 导出会员明细
    Given 选择导出会员明细
    When 执行导出
    Then Excel 包含列:
      | 列名 |
      | 序号 |
      | 星球昵称 |
      | 已打卡天数 |
      | 要求天数 |
      | 完成率 |
      | 退款资格 |
      | 最后打卡时间 |
```

### AC-7: 后端统计接口
```gherkin
Feature: 后端接口
  Scenario: GET /api/admin/checkins/stats/{campId}
    Given 请求携带有效 JWT Token
    When 调用统计接口
    Then 返回打卡统计数据:
      | 字段 | 类型 | 说明 |
      | campId | long | 训练营ID |
      | campName | string | 训练营名称 |
      | currentDay | int | 当前第几天 |
      | totalDays | int | 总天数 |
      | totalMembers | int | 总人数 |
      | todayCheckins | int | 今日打卡人数 |
      | todayCheckinRate | decimal | 今日打卡率 |
      | avgCheckinRate | decimal | 平均打卡率 |
      | eligibleCount | int | 满足退款条件人数 |
      | eligibleRate | decimal | 退款资格达成率 |
      | distribution | array | 打卡分布 |
      | dailyStats | array | 每日统计 |
      | lastSyncTime | datetime | 最后同步时间 |

  Scenario: GET /api/admin/checkins/members
    Given 请求携带有效 JWT Token
    When 调用会员打卡列表接口
    Then 返回分页数据:
      | 字段 | 类型 | 说明 |
      | memberId | long | 会员ID |
      | planetNickname | string | 星球昵称 |
      | checkinCount | int | 已打卡天数 |
      | requiredDays | int | 要求天数 |
      | checkinRate | decimal | 完成率 |
      | eligibleForRefund | boolean | 退款资格 |
      | lastCheckinTime | datetime | 最后打卡时间 |
```

### AC-8: 会员日历数据接口
```gherkin
Feature: 会员日历接口
  Scenario: GET /api/admin/checkins/calendar/{memberId}
    Given 请求携带有效 JWT Token
    When 调用会员日历接口
    Then 返回日历数据:
      | 字段 | 类型 | 说明 |
      | memberId | long | 会员ID |
      | planetNickname | string | 星球昵称 |
      | campId | long | 训练营ID |
      | startDate | date | 开始日期 |
      | endDate | date | 结束日期 |
      | checkinCount | int | 已打卡天数 |
      | requiredDays | int | 要求天数 |
      | calendar | array | 日历数据 |
    And calendar 数组包含:
      | 字段 | 说明 |
      | date | 日期 |
      | checked | 是否打卡 |
      | checkinTime | 打卡时间（如有）|
      | checkinContent | 打卡内容（如有）|
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - 打卡统计接口** (AC: #7)
  - [ ] 1.1 创建 `CheckinStatsController.java`
  - [ ] 1.2 实现 `GET /api/admin/checkins/stats/{campId}`
  - [ ] 1.3 添加权限校验 `@PreAuthorize("hasAnyRole('ADMIN','COACH')")`
  - [ ] 1.4 编写接口测试

- [ ] **Task 2: 后端 - 打卡统计服务** (AC: #7)
  - [ ] 2.1 创建 `CheckinStatsService.java`
  - [ ] 2.2 实现 `getCampCheckinStats(campId)` 方法
  - [ ] 2.3 实现打卡分布计算（SQL GROUP BY）
  - [ ] 2.4 实现每日统计计算
  - [ ] 2.5 编写单元测试

- [ ] **Task 3: 后端 - 会员打卡列表接口** (AC: #7)
  - [ ] 3.1 实现 `GET /api/admin/checkins/members`
  - [ ] 3.2 支持筛选: 退款资格、搜索
  - [ ] 3.3 支持排序: 打卡天数、完成率、最后打卡时间
  - [ ] 3.4 支持分页
  - [ ] 3.5 编写接口测试

- [ ] **Task 4: 后端 - 会员日历接口** (AC: #8)
  - [ ] 4.1 实现 `GET /api/admin/checkins/calendar/{memberId}`
  - [ ] 4.2 查询会员打卡记录
  - [ ] 4.3 生成日历数据
  - [ ] 4.4 编写接口测试

- [ ] **Task 5: 前端 - 统计页面结构** (AC: #1, #2)
  - [ ] 5.1 创建 `CheckinStats.vue` 页面
  - [ ] 5.2 实现统计概览卡片组件
  - [ ] 5.3 集成 ECharts 打卡分布图
  - [ ] 5.4 集成 ECharts 每日趋势图
  - [ ] 5.5 添加路由配置

- [ ] **Task 6: 前端 - 会员打卡表格** (AC: #3)
  - [ ] 6.1 实现 Element Plus Table 组件
  - [ ] 6.2 实现筛选和搜索功能
  - [ ] 6.3 实现排序功能
  - [ ] 6.4 实现分页功能

- [ ] **Task 7: 前端 - 打卡日历弹窗** (AC: #4)
  - [ ] 7.1 创建 `CheckinCalendarDialog.vue` 组件
  - [ ] 7.2 集成 Element Plus Calendar 组件
  - [ ] 7.3 实现自定义日期渲染（✅/❌）
  - [ ] 7.4 实现日期点击详情展示

- [ ] **Task 8: 前端 - 手动同步功能** (AC: #5)
  - [ ] 8.1 实现同步按钮和确认对话框
  - [ ] 8.2 调用同步接口
  - [ ] 8.3 显示同步状态
  - [ ] 8.4 同步完成后刷新数据

- [ ] **Task 9: 前端 - 数据导出** (AC: #6)
  - [ ] 9.1 实现导出选项下拉菜单
  - [ ] 9.2 使用 xlsx 库生成 Excel
  - [ ] 9.3 实现统计汇总导出
  - [ ] 9.4 实现会员明细导出

- [ ] **Task 10: 集成测试与验收** (AC: #全部)
  - [ ] 10.1 测试统计数据计算准确性
  - [ ] 10.2 测试会员列表筛选排序
  - [ ] 10.3 测试日历视图展示
  - [ ] 10.4 测试手动同步流程
  - [ ] 10.5 测试数据导出功能

---

## Dev Notes

### 业务流程概述

本故事实现管理后台的打卡统计页面，为管理员提供全面的打卡数据视图。

```
管理员进入训练营详情页
     ↓
点击「打卡情况」Tab
     ↓
后端加载统计数据:
├── 调用 GET /api/admin/checkins/stats/{campId}
└── 调用 GET /api/admin/checkins/members?campId=xxx
     ↓
前端渲染:
├── 统计概览卡片
├── 打卡分布图（柱状图/饼图）
├── 每日趋势图（折线图）
└── 会员打卡进度表
     ↓
点击会员「查看日历」
     ↓
调用 GET /api/admin/checkins/calendar/{memberId}
     ↓
弹出日历视图对话框
```

### 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 图表库 | ECharts | 功能丰富，Element Plus 推荐 |
| 日历组件 | Element Plus Calendar | 统一UI风格，支持自定义 |
| 表格组件 | Element Plus Table | 原生支持排序、筛选、分页 |
| 导出工具 | xlsx.js | 纯前端导出，无需后端支持 |
| 统计计算 | SQL 聚合 | 数据库层面计算，性能更好 |

### API 响应示例

#### GET /api/admin/checkins/stats/{campId}

```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "campId": 1,
    "campName": "21天早起打卡训练营",
    "currentDay": 15,
    "totalDays": 21,
    "totalMembers": 156,
    "todayCheckins": 120,
    "todayCheckinRate": 76.92,
    "avgCheckinRate": 75.50,
    "eligibleCount": 98,
    "eligibleRate": 62.82,
    "distribution": [
      {"label": "0-5天", "count": 10},
      {"label": "6-10天", "count": 28},
      {"label": "11-15天", "count": 70},
      {"label": "16-21天", "count": 48}
    ],
    "dailyStats": [
      {"date": "2025-12-10", "checkinCount": 150, "rate": 96.15},
      {"date": "2025-12-11", "checkinCount": 145, "rate": 92.95},
      {"date": "2025-12-12", "checkinCount": 138, "rate": 88.46}
    ],
    "lastSyncTime": "2025-12-24T01:00:00"
  }
}
```

#### GET /api/admin/checkins/members

```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "list": [
      {
        "memberId": 1001,
        "planetNickname": "小明同学",
        "checkinCount": 15,
        "requiredDays": 15,
        "checkinRate": 100.00,
        "eligibleForRefund": true,
        "lastCheckinTime": "2025-12-24T06:30:00"
      },
      {
        "memberId": 1002,
        "planetNickname": "李四",
        "checkinCount": 12,
        "requiredDays": 15,
        "checkinRate": 80.00,
        "eligibleForRefund": false,
        "lastCheckinTime": "2025-12-23T05:45:00"
      }
    ],
    "total": 156,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8
  }
}
```

### 代码实现参考

#### CheckinStatsController.java

```java
@RestController
@RequestMapping("/api/admin/checkins")
@RequiredArgsConstructor
@Slf4j
public class CheckinStatsController {

    private final CheckinStatsService statsService;
    private final CheckinSyncService syncService;

    /**
     * 获取训练营打卡统计
     */
    @GetMapping("/stats/{campId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public Result<CheckinStatsVO> getCampStats(@PathVariable Long campId) {
        CheckinStatsVO stats = statsService.getCampCheckinStats(campId);
        return Result.success(stats);
    }

    /**
     * 获取会员打卡列表
     */
    @GetMapping("/members")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public Result<PageResult<MemberCheckinVO>> getMemberCheckins(
            @RequestParam Long campId,
            @RequestParam(required = false) Boolean eligibleForRefund,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "checkinRate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {

        MemberCheckinQuery query = MemberCheckinQuery.builder()
            .campId(campId)
            .eligibleForRefund(eligibleForRefund)
            .search(search)
            .sortBy(sortBy)
            .sortOrder(sortOrder)
            .page(page)
            .pageSize(pageSize)
            .build();

        PageResult<MemberCheckinVO> result = statsService.getMemberCheckins(query);
        return Result.success(result);
    }

    /**
     * 获取会员打卡日历
     */
    @GetMapping("/calendar/{memberId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public Result<MemberCalendarVO> getMemberCalendar(@PathVariable Long memberId) {
        MemberCalendarVO calendar = statsService.getMemberCalendar(memberId);
        return Result.success(calendar);
    }
}
```

#### CheckinStatsService.java

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class CheckinStatsService {

    private final TrainingCampMapper campMapper;
    private final CampMemberMapper memberMapper;
    private final CheckinRecordMapper checkinMapper;
    private final SyncLogMapper syncLogMapper;

    /**
     * 获取训练营打卡统计
     */
    public CheckinStatsVO getCampCheckinStats(Long campId) {
        // 1. 查询训练营信息
        TrainingCamp camp = campMapper.selectById(campId);
        if (camp == null) {
            throw new BusinessException(404, "训练营不存在");
        }

        // 2. 计算基础统计
        LocalDate today = LocalDate.now();
        LocalDate startDate = camp.getStartDate();
        LocalDate endDate = camp.getEndDate();

        int totalDays = (int) ChronoUnit.DAYS.between(startDate, endDate) + 1;
        int currentDay = Math.min(
            (int) ChronoUnit.DAYS.between(startDate, today) + 1,
            totalDays
        );

        // 3. 查询会员统计
        int totalMembers = memberMapper.countByCampId(campId);
        int todayCheckins = memberMapper.countTodayCheckins(campId, today);
        int eligibleCount = memberMapper.countEligible(campId);

        // 4. 计算平均打卡率
        BigDecimal avgCheckinRate = memberMapper.avgCheckinRate(campId);
        BigDecimal todayCheckinRate = totalMembers > 0 ?
            BigDecimal.valueOf(todayCheckins * 100.0 / totalMembers)
                .setScale(2, RoundingMode.HALF_UP) :
            BigDecimal.ZERO;

        // 5. 查询打卡分布
        List<CheckinDistribution> distribution = memberMapper.selectCheckinDistribution(campId);

        // 6. 查询每日统计
        List<DailyStats> dailyStats = checkinMapper.selectDailyStats(campId, startDate, today);

        // 7. 获取最后同步时间
        LocalDateTime lastSyncTime = getLastSyncTime(campId);

        return CheckinStatsVO.builder()
            .campId(campId)
            .campName(camp.getName())
            .currentDay(currentDay)
            .totalDays(totalDays)
            .totalMembers(totalMembers)
            .todayCheckins(todayCheckins)
            .todayCheckinRate(todayCheckinRate)
            .avgCheckinRate(avgCheckinRate)
            .eligibleCount(eligibleCount)
            .eligibleRate(totalMembers > 0 ?
                BigDecimal.valueOf(eligibleCount * 100.0 / totalMembers)
                    .setScale(2, RoundingMode.HALF_UP) :
                BigDecimal.ZERO)
            .distribution(distribution)
            .dailyStats(dailyStats)
            .lastSyncTime(lastSyncTime)
            .build();
    }

    /**
     * 获取会员打卡列表
     */
    public PageResult<MemberCheckinVO> getMemberCheckins(MemberCheckinQuery query) {
        // 分页查询
        Page<CampMember> page = new Page<>(query.getPage(), query.getPageSize());

        // 构建查询条件
        LambdaQueryWrapper<CampMember> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CampMember::getCampId, query.getCampId())
            .eq(CampMember::getBindStatus, "completed")
            .isNull(CampMember::getDeletedAt);

        // 筛选条件
        if (query.getEligibleForRefund() != null) {
            wrapper.eq(CampMember::getEligibleForRefund, query.getEligibleForRefund());
        }
        if (StringUtils.hasText(query.getSearch())) {
            wrapper.like(CampMember::getPlanetNickname, query.getSearch());
        }

        // 排序
        String sortBy = query.getSortBy();
        boolean asc = "asc".equalsIgnoreCase(query.getSortOrder());
        switch (sortBy) {
            case "checkinCount":
                wrapper.orderBy(true, asc, CampMember::getCheckinCount);
                break;
            case "lastCheckinTime":
                wrapper.orderBy(true, asc, CampMember::getLastCheckinTime);
                break;
            default: // checkinRate
                // 需要计算完成率排序，这里简化为按打卡天数
                wrapper.orderBy(true, asc, CampMember::getCheckinCount);
        }

        IPage<CampMember> result = memberMapper.selectPage(page, wrapper);

        // 获取训练营要求天数
        TrainingCamp camp = campMapper.selectById(query.getCampId());
        int requiredDays = camp.getRequiredDays();

        // 转换为 VO
        List<MemberCheckinVO> list = result.getRecords().stream()
            .map(m -> convertToMemberVO(m, requiredDays))
            .collect(Collectors.toList());

        return PageResult.<MemberCheckinVO>builder()
            .list(list)
            .total(result.getTotal())
            .page(query.getPage())
            .pageSize(query.getPageSize())
            .totalPages((int) result.getPages())
            .build();
    }

    /**
     * 获取会员打卡日历
     */
    public MemberCalendarVO getMemberCalendar(Long memberId) {
        // 1. 查询会员信息
        CampMember member = memberMapper.selectById(memberId);
        if (member == null) {
            throw new BusinessException(404, "会员不存在");
        }

        // 2. 查询训练营信息
        TrainingCamp camp = campMapper.selectById(member.getCampId());

        // 3. 查询打卡记录
        List<CheckinRecord> records = checkinMapper.selectByMemberId(memberId);
        Map<LocalDate, CheckinRecord> recordMap = records.stream()
            .collect(Collectors.toMap(CheckinRecord::getCheckinDate, r -> r));

        // 4. 生成日历数据
        List<CalendarItem> calendar = new ArrayList<>();
        LocalDate current = camp.getStartDate();
        LocalDate today = LocalDate.now();
        LocalDate endDate = camp.getEndDate();

        while (!current.isAfter(endDate)) {
            CalendarItem item = new CalendarItem();
            item.setDate(current);

            if (current.isAfter(today)) {
                item.setChecked(null); // 未来日期
            } else {
                CheckinRecord record = recordMap.get(current);
                if (record != null) {
                    item.setChecked(true);
                    item.setCheckinTime(record.getCheckinTime());
                    item.setCheckinContent(truncate(record.getCheckinContent(), 100));
                } else {
                    item.setChecked(false);
                }
            }

            calendar.add(item);
            current = current.plusDays(1);
        }

        return MemberCalendarVO.builder()
            .memberId(memberId)
            .planetNickname(member.getPlanetNickname())
            .campId(camp.getId())
            .startDate(camp.getStartDate())
            .endDate(camp.getEndDate())
            .checkinCount(member.getCheckinCount())
            .requiredDays(camp.getRequiredDays())
            .calendar(calendar)
            .build();
    }

    private LocalDateTime getLastSyncTime(Long campId) {
        SyncLog lastLog = syncLogMapper.selectLastSuccessLog(campId, "checkin");
        return lastLog != null ? lastLog.getFinishedAt() : null;
    }

    private MemberCheckinVO convertToMemberVO(CampMember member, int requiredDays) {
        BigDecimal checkinRate = requiredDays > 0 ?
            BigDecimal.valueOf(member.getCheckinCount() * 100.0 / requiredDays)
                .setScale(2, RoundingMode.HALF_UP) :
            BigDecimal.ZERO;

        return MemberCheckinVO.builder()
            .memberId(member.getId())
            .planetNickname(member.getPlanetNickname())
            .checkinCount(member.getCheckinCount())
            .requiredDays(requiredDays)
            .checkinRate(checkinRate)
            .eligibleForRefund(member.getEligibleForRefund())
            .lastCheckinTime(member.getLastCheckinTime())
            .build();
    }

    private String truncate(String str, int maxLength) {
        if (str == null || str.length() <= maxLength) {
            return str;
        }
        return str.substring(0, maxLength) + "...";
    }
}
```

#### CheckinStats.vue (前端)

```vue
<template>
  <div class="checkin-stats">
    <!-- 统计概览 -->
    <el-row :gutter="16" class="stats-cards">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="总人数" :value="stats.totalMembers" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="今日打卡" :value="stats.todayCheckins">
            <template #suffix>
              <span class="rate">({{ stats.todayCheckinRate }}%)</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="平均打卡率" :value="stats.avgCheckinRate" suffix="%" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="满足退款条件" :value="stats.eligibleCount">
            <template #suffix>
              <span class="rate">({{ stats.eligibleRate }}%)</span>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 训练营进度 -->
    <el-card class="progress-card">
      <div class="progress-info">
        <span>训练营进度：第 {{ stats.currentDay }} 天 / 共 {{ stats.totalDays }} 天</span>
        <el-progress
          :percentage="(stats.currentDay / stats.totalDays) * 100"
          :format="() => `${stats.currentDay}/${stats.totalDays}`"
        />
      </div>
      <div class="sync-info">
        最后同步：{{ formatTime(stats.lastSyncTime) }}
        <el-button type="primary" size="small" @click="handleSync" :loading="syncing">
          同步打卡数据
        </el-button>
      </div>
    </el-card>

    <!-- 图表区域 -->
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card>
          <template #header>打卡分布</template>
          <div ref="distributionChart" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>每日打卡趋势</template>
          <div ref="trendChart" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 会员打卡列表 -->
    <el-card class="member-table">
      <template #header>
        <div class="table-header">
          <span>会员打卡进度</span>
          <div class="table-actions">
            <el-input
              v-model="search"
              placeholder="搜索星球昵称"
              clearable
              style="width: 200px"
              @input="handleSearch"
            />
            <el-select v-model="eligibleFilter" placeholder="退款资格" clearable @change="loadMembers">
              <el-option label="已满足" :value="true" />
              <el-option label="未满足" :value="false" />
            </el-select>
            <el-dropdown @command="handleExport">
              <el-button>
                导出 <el-icon><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="summary">导出统计汇总</el-dropdown-item>
                  <el-dropdown-item command="detail">导出会员明细</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </template>

      <el-table
        :data="members"
        v-loading="loading"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="planetNickname" label="星球昵称" />
        <el-table-column prop="checkinCount" label="已打卡" sortable="custom" width="100">
          <template #default="{ row }">
            {{ row.checkinCount }} / {{ row.requiredDays }}
          </template>
        </el-table-column>
        <el-table-column prop="checkinRate" label="完成率" sortable="custom" width="100">
          <template #default="{ row }">
            <el-progress :percentage="row.checkinRate" :stroke-width="8" />
          </template>
        </el-table-column>
        <el-table-column prop="eligibleForRefund" label="退款资格" width="100">
          <template #default="{ row }">
            <el-tag :type="row.eligibleForRefund ? 'success' : 'danger'">
              {{ row.eligibleForRefund ? '已满足' : '未满足' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastCheckinTime" label="最后打卡" sortable="custom" width="180">
          <template #default="{ row }">
            {{ formatTime(row.lastCheckinTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" link @click="showCalendar(row)">
              查看日历
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadMembers"
        @current-change="loadMembers"
      />
    </el-card>

    <!-- 日历弹窗 -->
    <checkin-calendar-dialog
      v-model:visible="calendarVisible"
      :member-id="selectedMemberId"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import { getCheckinStats, getMemberCheckins, syncCampCheckins } from '@/api/checkin'
import { exportExcel } from '@/utils/export'
import CheckinCalendarDialog from '@/components/CheckinCalendarDialog.vue'

const route = useRoute()
const campId = computed(() => route.params.campId)

// 数据状态
const stats = ref({})
const members = ref([])
const loading = ref(false)
const syncing = ref(false)

// 筛选和分页
const search = ref('')
const eligibleFilter = ref(null)
const sortBy = ref('checkinRate')
const sortOrder = ref('desc')
const pagination = ref({ page: 1, pageSize: 20, total: 0 })

// 日历弹窗
const calendarVisible = ref(false)
const selectedMemberId = ref(null)

// 图表
const distributionChart = ref(null)
const trendChart = ref(null)
let distributionChartInstance = null
let trendChartInstance = null

// 加载统计数据
const loadStats = async () => {
  const res = await getCheckinStats(campId.value)
  stats.value = res.data
  renderCharts()
}

// 加载会员列表
const loadMembers = async () => {
  loading.value = true
  try {
    const res = await getMemberCheckins({
      campId: campId.value,
      eligibleForRefund: eligibleFilter.value,
      search: search.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    })
    members.value = res.data.list
    pagination.value.total = res.data.total
  } finally {
    loading.value = false
  }
}

// 渲染图表
const renderCharts = () => {
  // 打卡分布图
  if (!distributionChartInstance) {
    distributionChartInstance = echarts.init(distributionChart.value)
  }
  distributionChartInstance.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: stats.value.distribution.map(d => d.label)
    },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: stats.value.distribution.map(d => d.count),
      itemStyle: { color: '#409EFF' }
    }]
  })

  // 每日趋势图
  if (!trendChartInstance) {
    trendChartInstance = echarts.init(trendChart.value)
  }
  trendChartInstance.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: stats.value.dailyStats.map(d => d.date)
    },
    yAxis: [
      { type: 'value', name: '打卡人数' },
      { type: 'value', name: '打卡率', max: 100 }
    ],
    series: [
      {
        name: '打卡人数',
        type: 'bar',
        data: stats.value.dailyStats.map(d => d.checkinCount)
      },
      {
        name: '打卡率',
        type: 'line',
        yAxisIndex: 1,
        data: stats.value.dailyStats.map(d => d.rate)
      }
    ]
  })
}

// 手动同步
const handleSync = async () => {
  await ElMessageBox.confirm('确定同步该训练营的打卡数据？', '提示')
  syncing.value = true
  try {
    await syncCampCheckins(campId.value)
    ElMessage.success('同步成功')
    loadStats()
    loadMembers()
  } catch (e) {
    ElMessage.error(e.message || '同步失败')
  } finally {
    syncing.value = false
  }
}

// 搜索防抖
let searchTimer = null
const handleSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    pagination.value.page = 1
    loadMembers()
  }, 300)
}

// 排序变化
const handleSortChange = ({ prop, order }) => {
  sortBy.value = prop
  sortOrder.value = order === 'ascending' ? 'asc' : 'desc'
  loadMembers()
}

// 显示日历
const showCalendar = (member) => {
  selectedMemberId.value = member.memberId
  calendarVisible.value = true
}

// 导出
const handleExport = (type) => {
  if (type === 'summary') {
    exportSummary()
  } else {
    exportDetail()
  }
}

const exportSummary = () => {
  // 导出统计汇总
  const data = [
    ['统计项', '数值'],
    ['总人数', stats.value.totalMembers],
    ['今日打卡人数', stats.value.todayCheckins],
    ['今日打卡率', `${stats.value.todayCheckinRate}%`],
    ['平均打卡率', `${stats.value.avgCheckinRate}%`],
    ['满足退款条件人数', stats.value.eligibleCount],
    ['退款资格达成率', `${stats.value.eligibleRate}%`]
  ]
  exportExcel(data, `${stats.value.campName}_打卡统计_${new Date().toISOString().split('T')[0]}`)
}

const exportDetail = async () => {
  // 导出全部会员明细
  const res = await getMemberCheckins({
    campId: campId.value,
    pageSize: 10000
  })
  const data = [
    ['序号', '星球昵称', '已打卡天数', '要求天数', '完成率', '退款资格', '最后打卡时间'],
    ...res.data.list.map((m, i) => [
      i + 1,
      m.planetNickname,
      m.checkinCount,
      m.requiredDays,
      `${m.checkinRate}%`,
      m.eligibleForRefund ? '已满足' : '未满足',
      formatTime(m.lastCheckinTime)
    ])
  ]
  exportExcel(data, `${stats.value.campName}_会员明细_${new Date().toISOString().split('T')[0]}`)
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString()
}

onMounted(() => {
  loadStats()
  loadMembers()
})
</script>

<style scoped>
.checkin-stats {
  padding: 20px;
}

.stats-cards {
  margin-bottom: 20px;
}

.progress-card {
  margin-bottom: 20px;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.sync-info {
  display: flex;
  align-items: center;
  gap: 16px;
  color: #909399;
  font-size: 14px;
}

.chart {
  height: 300px;
}

.member-table {
  margin-top: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-actions {
  display: flex;
  gap: 12px;
}

.rate {
  color: #909399;
  font-size: 12px;
  margin-left: 4px;
}
</style>
```

### 页面效果示意

```
┌─────────────────────────────────────────────────────────────────┐
│  21天早起打卡训练营 - 打卡统计                                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────────┐ ┌───────────┐ ┌────────────────┐  │
│  │ 总人数  │ │ 今日打卡    │ │ 平均打卡率│ │ 满足退款条件  │  │
│  │  156    │ │ 120 (76%)   │ │  75.5%    │ │ 98 (62.8%)    │  │
│  └─────────┘ └─────────────┘ └───────────┘ └────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  训练营进度：第 15 天 / 共 21 天                                  │
│  ██████████████████░░░░░░░░░░░░░░ 71%                           │
│  最后同步：2025-12-24 01:00      [同步打卡数据]                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌────────────────────────────────┐   │
│  │  打卡分布           │  │  每日打卡趋势                   │   │
│  │  ▓▓                 │  │  ___                           │   │
│  │  ▓▓▓▓▓              │  │ /   \___/\                     │   │
│  │  ▓▓▓▓▓▓▓▓▓          │  │/         \___                  │   │
│  │  ▓▓▓▓▓▓▓            │  │                                │   │
│  │  0-5 6-10 11-15 16+ │  │ 12/10  12/15  12/20  12/24     │   │
│  └─────────────────────┘  └────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  会员打卡进度                    [搜索] [退款资格▼] [导出▼]     │
├─────────────────────────────────────────────────────────────────┤
│  星球昵称 │ 已打卡    │ 完成率     │ 退款资格 │ 最后打卡  │ 操作│
│  ─────────────────────────────────────────────────────────────  │
│  小明同学 │ 15/15    │ ██████ 100%│ ✅已满足 │ 12-24 06:30│ 日历│
│  李四     │ 12/15    │ ████── 80% │ ❌未满足 │ 12-23 05:45│ 日历│
│  王五     │ 8/15     │ ██──── 53% │ ❌未满足 │ 12-20 07:00│ 日历│
│  ─────────────────────────────────────────────────────────────  │
│                              < 1 2 3 4 5 ... 8 >  共156条      │
└─────────────────────────────────────────────────────────────────┘
```

### 安全检查清单

- [ ] 权限控制：仅 admin/coach 角色可访问
- [ ] 数据校验：campId 必须存在
- [ ] 防止越权：只能查看有权限的训练营数据
- [ ] 导出数据不含敏感信息
- [ ] SQL 注入防护（使用 MyBatis 参数化查询）

### 测试要点

**后端测试**:
1. `CheckinStatsControllerTest` - 测试接口权限、参数校验
2. `CheckinStatsServiceTest` - 测试统计计算逻辑
3. 测试分页和筛选功能
4. 测试日历数据生成

**前端测试**:
1. 测试统计数据展示
2. 测试图表渲染
3. 测试表格筛选排序分页
4. 测试日历弹窗
5. 测试数据导出功能

---

## 项目结构

### 后端新增/修改文件

```
backend/src/main/java/com/camp/
├── controller/
│   └── admin/
│       └── CheckinStatsController.java     # 新增统计控制器
├── service/
│   └── CheckinStatsService.java            # 新增统计服务
├── vo/
│   └── checkin/
│       ├── CheckinStatsVO.java             # 新增统计VO
│       ├── MemberCheckinVO.java            # 新增会员打卡VO
│       ├── MemberCalendarVO.java           # 新增会员日历VO
│       ├── CheckinDistribution.java        # 新增分布数据
│       ├── DailyStats.java                 # 新增每日统计
│       └── CalendarItem.java               # 新增日历项
├── dto/
│   └── query/
│       └── MemberCheckinQuery.java         # 新增查询DTO
└── mapper/
    └── CampMemberMapper.java               # 修改添加统计方法
```

### 前端新增文件

```
frontend/admin-web/src/
├── views/
│   └── camp/
│       └── CheckinStats.vue                # 新增打卡统计页
├── components/
│   └── CheckinCalendarDialog.vue           # 新增日历弹窗组件
├── api/
│   └── checkin.js                          # 新增打卡API
└── utils/
    └── export.js                           # 导出工具（如需新增）
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP03-S02 定时同步 | ready-for-dev | 打卡数据来源 |
| EP01-S03 训练营CRUD | drafted | 训练营详情页框架 |
| EP03-S03 手动同步 | ready-for-dev | 同步按钮调用 |

### 后续依赖

本故事完成后，EP03 全部完成：
- EP04 退款流程（依赖打卡统计判断退款资格）
- EP06-S01 训练营报表（复用统计数据）

---

## References

| 文档 | 路径 | 相关章节 |
|------|------|----------|
| PRD | `docs/PRD.md` | 4.2.3.2 打卡进度统计页 |
| 接口文档 | `docs/v1/api/接口文档.md` | 6.2 获取打卡统计, 6.3 获取打卡记录 |
| 技术方案 | `docs/v1/design/技术方案.md` | Element Plus 组件使用 |
| Epic 定义 | `docs/epics.md` | EP03-S06 |
| 前一故事 | `docs/sprint-artifacts/stories/3-5-h5-checkin-progress.md` | H5打卡进度页 |

---

## Dev Agent Record

### Context Reference
- Epic: EP03 打卡数据同步与进度查询
- Story: EP03-S06 管理后台打卡统计页
- FR Coverage: FR8.3, FR8.4

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
| 前置条件 | EP03-S02, EP01-S03 完成 |
| 覆盖 FR | FR8.3, FR8.4 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
