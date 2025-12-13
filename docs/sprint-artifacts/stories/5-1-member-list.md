# Story 5.1: 会员列表与搜索

**Status**: ready-for-dev

---

## Story

**作为**管理员，
**我希望**能够查询、搜索和筛选会员列表，
**以便于**快速找到需要管理的会员信息。

---

## 验收标准

### AC-1: 查询会员列表
```gherkin
Feature: 会员列表查询
  Scenario: 分页查询会员列表
    Given 管理员已登录管理后台
    When GET /api/admin/members?page=1&pageSize=20
    Then 返回分页的会员列表
    And 包含以下字段:
      | 字段 | 说明 |
      | id | 会员ID |
      | campName | 训练营名称 |
      | planetNickname | 星球昵称 |
      | planetUserId | 星球用户ID |
      | wechatNickname | 微信昵称 |
      | bindStatus | 绑定状态 |
      | matchStatus | 匹配状态 |
      | joinedGroup | 是否进群 |
      | checkinCount | 打卡天数 |
      | requiredDays | 要求天数 |
      | eligibleForRefund | 是否满足退款条件 |
      | payAmount | 支付金额 |
      | payTime | 支付时间 |
      | createdAt | 创建时间 |

  Scenario: 默认排序
    Given 查询会员列表
    Then 按 createdAt 降序排列
    And 最新报名的会员排在前面
```

### AC-2: 按训练营筛选
```gherkin
Feature: 训练营筛选
  Scenario: 筛选指定训练营会员
    Given GET /api/admin/members?campId=1
    Then 只返回该训练营的会员

  Scenario: 训练营下拉列表
    Given 管理员进入会员列表页
    Then 训练营筛选下拉显示所有训练营
    And 支持搜索训练营名称

  Scenario: 多训练营筛选
    Given GET /api/admin/members?campIds=1,2,3
    Then 返回多个训练营的会员
```

### AC-3: 按绑定状态筛选
```gherkin
Feature: 绑定状态筛选
  Scenario: 筛选已绑定会员
    Given GET /api/admin/members?bindStatus=completed
    Then 只返回 bind_status=completed 的会员

  Scenario: 筛选待人工审核会员
    Given GET /api/admin/members?bindStatus=manual_review
    Then 只返回 bind_status=manual_review 的会员
    And 这些会员需要人工处理

  Scenario: 绑定状态选项
    Given 绑定状态筛选下拉
    Then 显示选项:
      | 值 | 显示文本 |
      | pending | 待绑定 |
      | completed | 已完成 |
      | expired | 已过期 |
      | manual_review | 待人工审核 |
      | closed | 已关闭 |
```

### AC-4: 关键词搜索
```gherkin
Feature: 关键词搜索
  Scenario: 搜索星球昵称
    Given 输入搜索关键词 "张三"
    When GET /api/admin/members?keyword=张三
    Then 返回星球昵称包含"张三"的会员

  Scenario: 搜索星球ID
    Given 输入搜索关键词 "123456"
    When GET /api/admin/members?keyword=123456
    Then 返回星球ID包含"123456"的会员

  Scenario: 搜索微信昵称
    Given 输入搜索关键词 "小明"
    When GET /api/admin/members?keyword=小明
    Then 返回微信昵称包含"小明"的会员

  Scenario: 模糊匹配
    Given 搜索关键词
    Then 使用 LIKE '%keyword%' 模糊匹配
    And 同时匹配: 星球昵称、星球ID、微信昵称
```

### AC-5: 按退款资格筛选
```gherkin
Feature: 退款资格筛选
  Scenario: 筛选符合退款条件的会员
    Given GET /api/admin/members?eligibleForRefund=true
    Then 只返回 eligible_for_refund=true 的会员

  Scenario: 筛选不符合退款条件的会员
    Given GET /api/admin/members?eligibleForRefund=false
    Then 只返回 eligible_for_refund=false 的会员
```

### AC-6: 组合条件筛选
```gherkin
Feature: 组合筛选
  Scenario: 多条件组合
    Given GET /api/admin/members?campId=1&bindStatus=completed&keyword=张
    Then 同时满足所有条件的会员
    And 训练营ID=1
    And 绑定状态=completed
    And 包含关键词"张"

  Scenario: 重置筛选
    Given 已设置多个筛选条件
    When 点击"重置"按钮
    Then 清空所有筛选条件
    And 重新加载默认列表
```

### AC-7: 统计汇总
```gherkin
Feature: 会员统计
  Scenario: 列表顶部统计
    Given 会员列表页面
    Then 显示统计卡片:
      | 指标 | 说明 |
      | 总会员数 | 符合筛选条件的会员总数 |
      | 已绑定 | bind_status=completed 数量 |
      | 待处理 | bind_status IN (pending, manual_review) 数量 |
      | 符合退款 | eligible_for_refund=true 数量 |

  Scenario: 统计随筛选更新
    Given 设置筛选条件
    When 查询结果返回
    Then 统计数据同步更新
```

### AC-8: 前端会员列表页
```gherkin
Feature: 会员列表页面
  Scenario: 页面布局
    Given 管理员进入会员列表
    Then 显示:
      | 区域 | 内容 |
      | 统计卡片 | 总数、已绑定、待处理、符合退款 |
      | 筛选栏 | 训练营、绑定状态、退款资格、搜索框 |
      | 数据表格 | 会员列表 |
      | 分页 | 底部分页组件 |

  Scenario: 表格列配置
    Given 会员列表表格
    Then 显示列:
      | 列名 | 宽度 | 说明 |
      | 训练营 | 180 | 训练营名称 |
      | 星球信息 | 180 | 昵称 + ID |
      | 微信昵称 | 120 | - |
      | 绑定状态 | 100 | Tag 显示 |
      | 进群 | 80 | 是/否 |
      | 打卡进度 | 120 | x/y 格式 |
      | 退款资格 | 100 | 符合/不符合 |
      | 支付金额 | 100 | - |
      | 操作 | 150 | 查看详情 |

  Scenario: 响应式适配
    Given 不同屏幕宽度
    Then 表格支持横向滚动
    And 关键列固定
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - 会员列表接口** (AC: #1, #2, #3, #4, #5, #6)
  - [ ] 1.1 创建 `MemberController.java`
  - [ ] 1.2 实现 `GET /api/admin/members`
  - [ ] 1.3 实现多条件筛选查询
  - [ ] 1.4 实现关键词模糊搜索
  - [ ] 1.5 实现分页排序
  - [ ] 1.6 编写接口测试

- [ ] **Task 2: 后端 - MemberService 实现** (AC: #1, #6)
  - [ ] 2.1 创建 `MemberService.java` 接口
  - [ ] 2.2 创建 `MemberServiceImpl.java` 实现
  - [ ] 2.3 实现 `getMemberList(MemberQuery query)`
  - [ ] 2.4 实现动态条件查询
  - [ ] 2.5 编写单元测试

- [ ] **Task 3: 后端 - 会员统计接口** (AC: #7)
  - [ ] 3.1 实现 `GET /api/admin/members/stats`
  - [ ] 3.2 支持按筛选条件统计
  - [ ] 3.3 编写接口测试

- [ ] **Task 4: 后端 - Mapper 查询优化** (AC: #1, #4)
  - [ ] 4.1 创建 `CampMemberMapper.java` 扩展方法
  - [ ] 4.2 实现复杂条件查询 SQL
  - [ ] 4.3 优化索引使用
  - [ ] 4.4 编写 Mapper 测试

- [ ] **Task 5: 前端 - 会员列表页面** (AC: #8)
  - [ ] 5.1 创建 `MemberList.vue`
  - [ ] 5.2 实现统计卡片组件
  - [ ] 5.3 实现筛选栏组件
  - [ ] 5.4 实现数据表格
  - [ ] 5.5 添加路由配置

- [ ] **Task 6: 前端 - 筛选功能** (AC: #2, #3, #5, #6)
  - [ ] 6.1 实现训练营下拉选择
  - [ ] 6.2 实现绑定状态筛选
  - [ ] 6.3 实现关键词搜索
  - [ ] 6.4 实现退款资格筛选
  - [ ] 6.5 实现重置功能

- [ ] **Task 7: 前端 - API 调用** (AC: #全部)
  - [ ] 7.1 创建 `member.js` API 模块
  - [ ] 7.2 实现会员列表请求
  - [ ] 7.3 实现统计请求
  - [ ] 7.4 处理加载状态

- [ ] **Task 8: 集成测试与验收** (AC: #全部)
  - [ ] 8.1 测试各筛选条件
  - [ ] 8.2 测试组合筛选
  - [ ] 8.3 测试分页功能
  - [ ] 8.4 测试统计准确性
  - [ ] 8.5 测试前端交互

---

## Dev Notes

### 业务流程概述

本故事实现会员列表的查询和筛选功能。

```
管理员进入会员列表页
     ↓
显示统计卡片 (总数、已绑定、待处理、符合退款)
     ↓
筛选栏:
├── 训练营选择
├── 绑定状态筛选
├── 退款资格筛选
└── 关键词搜索
     ↓
调用后端 API:
GET /api/admin/members?campId=&bindStatus=&eligibleForRefund=&keyword=&page=&pageSize=
     ↓
后端处理:
├── 构建动态查询条件
├── 执行分页查询
├── 关联查询训练营信息
└── 返回会员列表 + 分页信息
     ↓
前端展示:
├── 更新统计卡片
├── 渲染数据表格
└── 显示分页组件
```

### 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 查询方式 | 动态条件 | 支持灵活筛选 |
| 搜索实现 | LIKE 模糊匹配 | 简单有效 |
| 数据关联 | 单次查询+关联 | 减少 N+1 问题 |
| 分页 | 后端分页 | 数据量可能较大 |

### 状态枚举引用

> **SSOT引用**: [状态枚举定义.md](../../v1/design/状态枚举定义.md)

**bind_status 绑定状态**:
- `pending`: 待绑定
- `completed`: 已完成
- `expired`: 已过期
- `manual_review`: 待人工审核
- `closed`: 已关闭

**match_status 匹配状态**:
- `pending`: 待匹配
- `matched`: 已匹配
- `failed`: 匹配失败

### 代码实现参考

#### MemberController.java

```java
@RestController
@RequestMapping("/api/admin/members")
@RequiredArgsConstructor
@Slf4j
public class MemberController {

    private final MemberService memberService;

    /**
     * 获取会员列表
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public Result<PageResult<MemberVO>> getMemberList(
            @RequestParam(required = false) Long campId,
            @RequestParam(required = false) List<Long> campIds,
            @RequestParam(required = false) String bindStatus,
            @RequestParam(required = false) String matchStatus,
            @RequestParam(required = false) Boolean eligibleForRefund,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {

        MemberQuery query = MemberQuery.builder()
            .campId(campId)
            .campIds(campIds)
            .bindStatus(bindStatus)
            .matchStatus(matchStatus)
            .eligibleForRefund(eligibleForRefund)
            .keyword(keyword)
            .page(page)
            .pageSize(pageSize)
            .build();

        PageResult<MemberVO> result = memberService.getMemberList(query);
        return Result.success(result);
    }

    /**
     * 获取会员统计
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public Result<MemberStats> getMemberStats(
            @RequestParam(required = false) Long campId,
            @RequestParam(required = false) String bindStatus) {

        MemberStatsQuery query = MemberStatsQuery.builder()
            .campId(campId)
            .bindStatus(bindStatus)
            .build();

        MemberStats stats = memberService.getMemberStats(query);
        return Result.success(stats);
    }
}
```

#### MemberService.java

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class MemberServiceImpl implements MemberService {

    private final CampMemberMapper memberMapper;
    private final TrainingCampMapper campMapper;

    @Override
    public PageResult<MemberVO> getMemberList(MemberQuery query) {
        // 构建查询条件
        LambdaQueryWrapper<CampMember> wrapper = new LambdaQueryWrapper<>();

        // 训练营筛选
        if (query.getCampId() != null) {
            wrapper.eq(CampMember::getCampId, query.getCampId());
        }
        if (query.getCampIds() != null && !query.getCampIds().isEmpty()) {
            wrapper.in(CampMember::getCampId, query.getCampIds());
        }

        // 绑定状态筛选
        if (StringUtils.hasText(query.getBindStatus())) {
            wrapper.eq(CampMember::getBindStatus, query.getBindStatus());
        }

        // 匹配状态筛选
        if (StringUtils.hasText(query.getMatchStatus())) {
            wrapper.eq(CampMember::getMatchStatus, query.getMatchStatus());
        }

        // 退款资格筛选
        if (query.getEligibleForRefund() != null) {
            wrapper.eq(CampMember::getEligibleForRefund, query.getEligibleForRefund());
        }

        // 关键词搜索
        if (StringUtils.hasText(query.getKeyword())) {
            String keyword = "%" + query.getKeyword() + "%";
            wrapper.and(w -> w
                .like(CampMember::getPlanetNickname, keyword)
                .or().like(CampMember::getPlanetMemberNumber, keyword)
                .or().like(CampMember::getFilledPlanetNickname, keyword)
                .or().like(CampMember::getFilledPlanetUserId, keyword)
            );
        }

        // 排序
        wrapper.orderByDesc(CampMember::getCreatedAt);

        // 分页查询
        Page<CampMember> pageParam = new Page<>(query.getPage(), query.getPageSize());
        Page<CampMember> pageResult = memberMapper.selectPage(pageParam, wrapper);

        // 转换为 VO
        List<MemberVO> voList = pageResult.getRecords().stream()
            .map(this::convertToVO)
            .collect(Collectors.toList());

        return PageResult.<MemberVO>builder()
            .list(voList)
            .total(pageResult.getTotal())
            .page(query.getPage())
            .pageSize(query.getPageSize())
            .build();
    }

    @Override
    public MemberStats getMemberStats(MemberStatsQuery query) {
        Long campId = query.getCampId();

        return MemberStats.builder()
            .totalCount(memberMapper.countByCampId(campId))
            .completedCount(memberMapper.countByBindStatus(campId, "completed"))
            .pendingCount(memberMapper.countByBindStatusIn(campId,
                Arrays.asList("pending", "manual_review")))
            .eligibleCount(memberMapper.countByEligibleForRefund(campId, true))
            .build();
    }

    private MemberVO convertToVO(CampMember member) {
        TrainingCamp camp = campMapper.selectById(member.getCampId());

        return MemberVO.builder()
            .id(member.getId())
            .campId(member.getCampId())
            .campName(camp != null ? camp.getName() : null)
            .planetNickname(member.getPlanetNickname())
            .planetUserId(member.getPlanetMemberNumber())
            .filledPlanetNickname(member.getFilledPlanetNickname())
            .filledPlanetUserId(member.getFilledPlanetUserId())
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
}
```

#### MemberList.vue

```vue
<template>
  <div class="member-list">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-cards">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="总会员数" :value="stats.totalCount" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="已绑定" :value="stats.completedCount" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="待处理" :value="stats.pendingCount" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="符合退款" :value="stats.eligibleCount" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选栏 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="训练营">
          <el-select
            v-model="filterForm.campId"
            placeholder="全部训练营"
            clearable
            filterable
          >
            <el-option
              v-for="camp in camps"
              :key="camp.id"
              :label="camp.name"
              :value="camp.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="绑定状态">
          <el-select v-model="filterForm.bindStatus" placeholder="全部" clearable>
            <el-option label="待绑定" value="pending" />
            <el-option label="已完成" value="completed" />
            <el-option label="已过期" value="expired" />
            <el-option label="待人工审核" value="manual_review" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="退款资格">
          <el-select v-model="filterForm.eligibleForRefund" placeholder="全部" clearable>
            <el-option label="符合" :value="true" />
            <el-option label="不符合" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input
            v-model="filterForm.keyword"
            placeholder="星球昵称/ID/微信昵称"
            clearable
            style="width: 200px"
            @keyup.enter="loadData"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 会员列表 -->
    <el-card>
      <template #header>
        <span>会员列表 ({{ pagination.total }})</span>
      </template>

      <el-table :data="members" v-loading="loading" stripe>
        <el-table-column prop="campName" label="训练营" width="180" />
        <el-table-column label="星球信息" width="180">
          <template #default="{ row }">
            <div>{{ row.planetNickname || row.filledPlanetNickname }}</div>
            <div class="text-gray">{{ row.planetUserId || row.filledPlanetUserId }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="wechatNickname" label="微信昵称" width="120" />
        <el-table-column prop="bindStatus" label="绑定状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getBindStatusType(row.bindStatus)" size="small">
              {{ getBindStatusText(row.bindStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="joinedGroup" label="进群" width="80">
          <template #default="{ row }">
            <el-tag :type="row.joinedGroup ? 'success' : 'info'" size="small">
              {{ row.joinedGroup ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="打卡进度" width="120">
          <template #default="{ row }">
            <span :class="{ 'text-success': row.checkinCount >= row.requiredDays }">
              {{ row.checkinCount }} / {{ row.requiredDays }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="eligibleForRefund" label="退款资格" width="100">
          <template #default="{ row }">
            <el-tag :type="row.eligibleForRefund ? 'success' : 'danger'" size="small">
              {{ row.eligibleForRefund ? '符合' : '不符合' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payAmount" label="支付金额" width="100">
          <template #default="{ row }">¥{{ row.payAmount }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="loadData"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMemberList, getMemberStats } from '@/api/member'
import { getCampList } from '@/api/camp'

const router = useRouter()

// 数据
const loading = ref(false)
const members = ref([])
const camps = ref([])
const stats = ref({
  totalCount: 0,
  completedCount: 0,
  pendingCount: 0,
  eligibleCount: 0
})

// 筛选条件
const filterForm = reactive({
  campId: null,
  bindStatus: null,
  eligibleForRefund: null,
  keyword: ''
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      ...filterForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await getMemberList(params)
    members.value = res.data.list
    pagination.total = res.data.total

    // 同时加载统计
    const statsRes = await getMemberStats({ campId: filterForm.campId })
    stats.value = statsRes.data
  } finally {
    loading.value = false
  }
}

// 重置筛选
const resetFilter = () => {
  filterForm.campId = null
  filterForm.bindStatus = null
  filterForm.eligibleForRefund = null
  filterForm.keyword = ''
  pagination.page = 1
  loadData()
}

// 查看详情
const viewDetail = (row) => {
  router.push(`/member/${row.id}`)
}

// 状态映射
const getBindStatusType = (status) => {
  const map = {
    pending: 'warning',
    completed: 'success',
    expired: 'info',
    manual_review: 'danger',
    closed: 'info'
  }
  return map[status] || 'info'
}

const getBindStatusText = (status) => {
  const map = {
    pending: '待绑定',
    completed: '已完成',
    expired: '已过期',
    manual_review: '待审核',
    closed: '已关闭'
  }
  return map[status] || status
}

// 加载训练营列表
const loadCamps = async () => {
  const res = await getCampList({ pageSize: 100 })
  camps.value = res.data.list
}

onMounted(() => {
  loadCamps()
  loadData()
})
</script>

<style scoped>
.stats-cards {
  margin-bottom: 16px;
}
.filter-card {
  margin-bottom: 16px;
}
.text-gray {
  color: #909399;
  font-size: 12px;
}
.text-success {
  color: #67c23a;
}
</style>
```

### API 响应示例

#### GET /api/admin/members

```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "list": [
      {
        "id": 1001,
        "campId": 1,
        "campName": "21天早起打卡训练营",
        "planetNickname": "张三",
        "planetUserId": "123456789",
        "filledPlanetNickname": "张三",
        "filledPlanetUserId": "123456789",
        "wechatNickname": "小张",
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
    ],
    "total": 156,
    "page": 1,
    "pageSize": 20
  }
}
```

#### GET /api/admin/members/stats

```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "totalCount": 156,
    "completedCount": 142,
    "pendingCount": 12,
    "eligibleCount": 98
  }
}
```

### 安全检查清单

- [ ] 权限控制：仅 ADMIN/COACH 可访问
- [ ] SQL 注入防护：使用参数化查询
- [ ] 分页限制：最大 pageSize 100
- [ ] 敏感信息脱敏：必要时隐藏部分信息
- [ ] 日志记录：记录关键操作

### 测试要点

**后端测试**:
1. `MemberControllerTest` - 测试各筛选参数
2. `MemberServiceTest` - 测试查询逻辑
3. 测试组合筛选
4. 测试分页边界
5. 测试空结果处理

**前端测试**:
1. 测试筛选交互
2. 测试搜索功能
3. 测试分页切换
4. 测试统计卡片更新

---

## 项目结构

### 后端新增/修改文件

```
backend/src/main/java/com/camp/
├── controller/
│   └── admin/
│       └── MemberController.java              # 新增会员控制器
├── service/
│   ├── MemberService.java                     # 新增会员服务接口
│   └── impl/
│       └── MemberServiceImpl.java             # 新增
├── mapper/
│   └── CampMemberMapper.java                  # 修改添加统计方法
├── dto/
│   └── query/
│       ├── MemberQuery.java                   # 新增会员查询
│       └── MemberStatsQuery.java              # 新增统计查询
└── vo/
    ├── MemberVO.java                          # 新增会员 VO
    └── MemberStats.java                       # 新增统计 VO
```

### 前端新增文件

```
frontend/admin-web/src/
├── views/
│   └── member/
│       └── MemberList.vue                     # 新增会员列表页
├── api/
│   └── member.js                              # 新增会员 API
└── router/
    └── index.js                               # 添加路由
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP02-S05 支付记录 | ready-for-dev | camp_member 表数据 |
| EP01-S03 训练营CRUD | ready-for-dev | 训练营下拉数据 |

### 后续依赖

本故事完成后:
- EP05-S02 会员详情（基于列表进入详情）
- EP04-S02 手动匹配（筛选 matchStatus=pending）

---

## References

| 文档 | 路径 | 相关章节 |
|------|------|----------|
| PRD | `docs/PRD.md` | 4.3.1 会员管理 |
| 接口文档 | `docs/v1/api/接口文档.md` | 5.1 会员列表 |
| 状态枚举 | `docs/v1/design/状态枚举定义.md` | bind_status, match_status |
| Epic 定义 | `docs/epics.md` | EP05-S01 |

---

## Dev Agent Record

### Context Reference
- Epic: EP05 会员管理与通知系统
- Story: EP05-S01 会员列表与搜索
- FR Coverage: FR7.1, FR7.5

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
| Epic | EP05 |
| 前置条件 | EP02-S05 完成 |
| 覆盖 FR | FR7.1, FR7.5 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
