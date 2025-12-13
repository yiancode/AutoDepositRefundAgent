# Story 6.1: 训练营统计报表

**Status**: ready-for-dev

---

## Story

**作为**管理员，
**我希望**能够查看训练营的统计报表和趋势图表，
**以便于**了解运营数据，做出数据驱动的决策。

---

## 验收标准

### AC-1: 总体数据卡片
```gherkin
Feature: 总体数据展示
  Scenario: 查看总体数据卡片
    Given 管理员访问报表页面
    When GET /api/admin/stats/overview
    Then 显示总体数据卡片:
      | 指标 | 说明 |
      | totalCamps | 训练营总数 |
      | totalMembers | 参与会员总数 |
      | totalDeposit | 押金收入总额 |
      | totalRefund | 退款总额 |
      | netIncome | 净收入 (押金-退款) |

  Scenario: 时间范围筛选
    Given 选择时间范围 "本月"
    When 刷新数据
    Then 所有数据卡片按本月数据计算
```

### AC-2: 训练营明细表
```gherkin
Feature: 训练营明细表
  Scenario: 查看明细表
    Given 管理员在报表页面
    When GET /api/admin/stats/camp-details?startDate=&endDate=
    Then 返回训练营明细列表:
      | 字段 | 说明 |
      | campName | 训练营名称 |
      | enrollCount | 报名人数 |
      | completionRate | 完成率 (%) |
      | depositAmount | 押金收入 |
      | refundAmount | 退款金额 |
      | netIncome | 净收入 |

  Scenario: 排序功能
    Given 明细表已加载
    When 点击 "押金收入" 列头
    Then 按押金收入降序排列

  Scenario: 分页展示
    Given 训练营数量超过 10 个
    Then 分页展示
    And 支持每页 10/20/50 条
```

### AC-3: 趋势图表
```gherkin
Feature: 趋势图表
  Scenario: 查看月度趋势图
    Given 选择 "本月"
    When GET /api/admin/stats/trend?period=month
    Then 显示折线图
    And X轴: 日期
    And Y轴: 参与人数、完成人数

  Scenario: 查看收入趋势
    Given 切换到 "收入趋势"
    Then 显示柱状图
    And 展示押金收入和退款金额对比

  Scenario: 图表交互
    Given 鼠标悬停在数据点
    Then 显示详细数据 tooltip
```

### AC-4: 时间范围筛选
```gherkin
Feature: 时间范围筛选
  Scenario: 预设时间范围
    Given 管理员在报表页面
    Then 支持快速选择:
      | 选项 | 说明 |
      | 本周 | 当前周一到今天 |
      | 本月 | 当月1日到今天 |
      | 上月 | 上月1日到末日 |
      | 本季度 | 当季度 |
      | 自定义 | 日期选择器 |

  Scenario: 自定义时间范围
    Given 选择 "自定义"
    When 选择开始日期和结束日期
    Then 刷新所有数据
```

### AC-5: 数据刷新
```gherkin
Feature: 数据刷新
  Scenario: 手动刷新
    Given 报表页面已加载
    When 点击 "刷新" 按钮
    Then 重新加载所有数据
    And 显示加载动画

  Scenario: 加载状态
    Given 请求报表数据
    Then 显示骨架屏或加载动画
    When 数据返回
    Then 渲染数据
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - 统计概览接口** (AC: #1)
  - [ ] 1.1 创建 `StatsController.java`
  - [ ] 1.2 实现 `GET /api/admin/stats/overview`
  - [ ] 1.3 实现时间范围参数处理
  - [ ] 1.4 编写单元测试

- [ ] **Task 2: 后端 - 明细表接口** (AC: #2)
  - [ ] 2.1 实现 `GET /api/admin/stats/camp-details`
  - [ ] 2.2 实现 SQL 聚合查询
  - [ ] 2.3 支持排序和分页
  - [ ] 2.4 编写单元测试

- [ ] **Task 3: 后端 - 趋势数据接口** (AC: #3)
  - [ ] 3.1 实现 `GET /api/admin/stats/trend`
  - [ ] 3.2 实现日/周/月聚合
  - [ ] 3.3 编写单元测试

- [ ] **Task 4: 前端 - 报表页面布局** (AC: #1, #4)
  - [ ] 4.1 创建 `CampReport.vue`
  - [ ] 4.2 实现数据卡片组件
  - [ ] 4.3 实现时间范围选择器

- [ ] **Task 5: 前端 - 明细表组件** (AC: #2)
  - [ ] 5.1 实现 el-table 明细表
  - [ ] 5.2 实现排序和分页
  - [ ] 5.3 格式化金额显示

- [ ] **Task 6: 前端 - 图表组件** (AC: #3)
  - [ ] 6.1 集成 ECharts
  - [ ] 6.2 实现折线图 (趋势)
  - [ ] 6.3 实现柱状图 (收入对比)
  - [ ] 6.4 图表响应式适配

- [ ] **Task 7: 集成测试** (AC: #全部)
  - [ ] 7.1 测试各接口数据正确性
  - [ ] 7.2 测试时间范围筛选
  - [ ] 7.3 测试图表渲染

---

## Dev Notes

### 业务流程概述

```
管理员访问报表页面
     ↓
默认加载本月数据:
├── 概览卡片 (5个指标)
├── 训练营明细表
└── 趋势图表
     ↓
用户操作:
├── 切换时间范围 → 重新加载
├── 排序明细表 → 重新排序
├── 切换图表类型 → 重新渲染
└── 导出 → 跳转导出功能 (EP06-S02)
```

### 代码实现参考

#### StatsController.java

```java
@RestController
@RequestMapping("/api/admin/stats")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
public class StatsController {

    private final StatsService statsService;

    /**
     * 获取统计概览
     */
    @GetMapping("/overview")
    public Result<StatsOverviewVO> getOverview(
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate) {

        StatsOverviewVO overview = statsService.getOverview(startDate, endDate);
        return Result.success(overview);
    }

    /**
     * 获取训练营明细
     */
    @GetMapping("/camp-details")
    public Result<PageResult<CampDetailStatsVO>> getCampDetails(
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate,
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(defaultValue = "depositAmount") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder) {

        PageResult<CampDetailStatsVO> details = statsService.getCampDetails(
            startDate, endDate, pageNum, pageSize, sortBy, sortOrder
        );
        return Result.success(details);
    }

    /**
     * 获取趋势数据
     */
    @GetMapping("/trend")
    public Result<List<TrendDataVO>> getTrend(
            @RequestParam(defaultValue = "month") String period,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate) {

        List<TrendDataVO> trend = statsService.getTrend(period, startDate, endDate);
        return Result.success(trend);
    }
}
```

#### StatsServiceImpl.java - SQL 聚合

```java
@Service
@RequiredArgsConstructor
public class StatsServiceImpl implements StatsService {

    private final TrainingCampMapper campMapper;
    private final CampMemberMapper memberMapper;
    private final PaymentRecordMapper paymentMapper;
    private final RefundRecordMapper refundMapper;

    @Override
    public StatsOverviewVO getOverview(LocalDate startDate, LocalDate endDate) {
        // 默认本月
        if (startDate == null) {
            startDate = LocalDate.now().withDayOfMonth(1);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay();

        // 训练营数量
        Long totalCamps = campMapper.countByDateRange(start, end);

        // 会员数量
        Long totalMembers = memberMapper.countByDateRange(start, end);

        // 押金收入
        BigDecimal totalDeposit = paymentMapper.sumAmountByDateRange(start, end);

        // 退款金额
        BigDecimal totalRefund = refundMapper.sumAmountByDateRange(start, end);

        // 净收入
        BigDecimal netIncome = totalDeposit.subtract(totalRefund);

        return StatsOverviewVO.builder()
            .totalCamps(totalCamps)
            .totalMembers(totalMembers)
            .totalDeposit(totalDeposit)
            .totalRefund(totalRefund)
            .netIncome(netIncome)
            .build();
    }

    @Override
    public PageResult<CampDetailStatsVO> getCampDetails(
            LocalDate startDate, LocalDate endDate,
            int pageNum, int pageSize, String sortBy, String sortOrder) {

        // 使用 SQL 联表聚合查询
        // SELECT
        //   c.id, c.name,
        //   COUNT(m.id) as enroll_count,
        //   AVG(CASE WHEN m.checkin_count >= c.required_days THEN 1 ELSE 0 END) * 100 as completion_rate,
        //   SUM(p.amount) as deposit_amount,
        //   SUM(r.amount) as refund_amount,
        //   SUM(p.amount) - COALESCE(SUM(r.amount), 0) as net_income
        // FROM training_camp c
        // LEFT JOIN camp_member m ON c.id = m.camp_id
        // LEFT JOIN payment_record p ON m.id = p.member_id
        // LEFT JOIN refund_record r ON m.id = r.member_id
        // WHERE c.created_at BETWEEN ? AND ?
        // GROUP BY c.id
        // ORDER BY {sortBy} {sortOrder}
        // LIMIT ? OFFSET ?

        return campMapper.selectCampDetailStats(startDate, endDate, pageNum, pageSize, sortBy, sortOrder);
    }
}
```

#### CampReport.vue - 前端实现

```vue
<template>
  <div class="camp-report">
    <!-- 时间筛选 -->
    <el-card class="filter-card">
      <el-radio-group v-model="period" @change="handlePeriodChange">
        <el-radio-button label="week">本周</el-radio-button>
        <el-radio-button label="month">本月</el-radio-button>
        <el-radio-button label="lastMonth">上月</el-radio-button>
        <el-radio-button label="custom">自定义</el-radio-button>
      </el-radio-group>
      <el-date-picker
        v-if="period === 'custom'"
        v-model="dateRange"
        type="daterange"
        @change="fetchData"
      />
      <el-button :icon="Refresh" @click="fetchData">刷新</el-button>
    </el-card>

    <!-- 数据卡片 -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="4" v-for="card in statsCards" :key="card.key">
        <el-card shadow="hover">
          <el-statistic :title="card.title" :value="overview[card.key]" :precision="card.precision" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card header="参与趋势">
          <div ref="trendChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card header="收入对比">
          <div ref="incomeChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 明细表 -->
    <el-card header="训练营明细">
      <el-table :data="campDetails" @sort-change="handleSortChange">
        <el-table-column prop="campName" label="训练营名称" />
        <el-table-column prop="enrollCount" label="报名人数" sortable="custom" />
        <el-table-column prop="completionRate" label="完成率" sortable="custom">
          <template #default="{ row }">{{ row.completionRate }}%</template>
        </el-table-column>
        <el-table-column prop="depositAmount" label="押金收入" sortable="custom">
          <template #default="{ row }">{{ formatMoney(row.depositAmount) }}</template>
        </el-table-column>
        <el-table-column prop="refundAmount" label="退款金额" sortable="custom">
          <template #default="{ row }">{{ formatMoney(row.refundAmount) }}</template>
        </el-table-column>
        <el-table-column prop="netIncome" label="净收入" sortable="custom">
          <template #default="{ row }">{{ formatMoney(row.netIncome) }}</template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="pagination.pageNum"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        @current-change="fetchCampDetails"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import { getStatsOverview, getCampDetails, getTrendData } from '@/api/stats'

// ECharts 图表初始化
const initTrendChart = (data) => {
  const chart = echarts.init(trendChartRef.value)
  chart.setOption({
    xAxis: { type: 'category', data: data.map(d => d.date) },
    yAxis: { type: 'value' },
    series: [
      { name: '参与人数', type: 'line', data: data.map(d => d.enrollCount) },
      { name: '完成人数', type: 'line', data: data.map(d => d.completedCount) }
    ],
    tooltip: { trigger: 'axis' },
    legend: {}
  })
}
</script>
```

### 配置项

```yaml
stats:
  default-period: month
  cache:
    enabled: true
    ttl: 300  # 5分钟缓存
```

---

## 项目结构

### 后端新增文件

```
backend/src/main/java/com/camp/
├── controller/
│   └── admin/
│       └── StatsController.java                # 新增统计控制器
├── service/
│   ├── StatsService.java                       # 新增统计服务接口
│   └── impl/
│       └── StatsServiceImpl.java               # 新增统计服务实现
└── vo/
    ├── StatsOverviewVO.java                    # 新增概览VO
    ├── CampDetailStatsVO.java                  # 新增明细VO
    └── TrendDataVO.java                        # 新增趋势VO
```

### 前端新增文件

```
frontend/admin-web/src/
├── views/
│   └── stats/
│       └── CampReport.vue                      # 新增报表页面
└── api/
    └── stats.js                                # 新增统计API
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP01-S03 训练营CRUD | ready-for-dev | training_camp 数据 |
| EP03-S02 打卡同步 | ready-for-dev | checkin_count 数据 |

---

## Story Metadata

| 属性 | 值 |
|------|-----|
| Story 点数 | 5 |
| 优先级 | P2 |
| Epic | EP06 |
| 前置条件 | EP01-S03, EP03-S02 完成 |
| 覆盖 FR | FR9.1, FR9.2 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
