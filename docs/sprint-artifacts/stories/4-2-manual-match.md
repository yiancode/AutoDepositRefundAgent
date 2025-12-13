# Story 4.2: 待匹配会员列表与手动匹配

**Status**: ready-for-dev

---

## Story

**作为**管理员，
**我希望**能够查看待匹配的会员列表并手动进行匹配，
**以便于**处理无法自动匹配的会员，确保退款流程顺利进行。

---

## 验收标准

### AC-1: 查看待匹配列表
```gherkin
Feature: 待匹配会员列表
  Scenario: 查看待处理会员列表
    Given 管理员已登录管理后台
    And 存在 match_status = pending 的会员
    When GET /api/admin/members?matchStatus=pending&page=1&pageSize=20
    Then 返回待处理会员列表
    And 包含以下信息:
      | 字段 | 说明 |
      | id | 会员ID |
      | campName | 训练营名称 |
      | filledPlanetNickname | 用户填写的星球昵称 |
      | filledPlanetUserId | 用户填写的星球ID |
      | bindStatus | 绑定状态 |
      | checkinCount | 打卡天数 |
      | eligibleForRefund | 是否满足退款条件 |
      | payAmount | 支付金额 |
      | payTime | 支付时间 |

  Scenario: 筛选训练营
    Given 系统存在多个训练营的待匹配会员
    When GET /api/admin/members?campId=1&matchStatus=pending
    Then 只返回指定训练营的待匹配会员

  Scenario: 搜索会员
    Given 待匹配会员列表
    When GET /api/admin/members?matchStatus=pending&keyword=张三
    Then 返回星球昵称或ID包含"张三"的会员
```

### AC-2: 查看星球用户候选列表
```gherkin
Feature: 星球用户搜索
  Scenario: 搜索星球用户
    Given 管理员在待匹配会员详情页
    When GET /api/admin/planet-users?keyword=小明&page=1&pageSize=20
    Then 返回匹配的星球用户列表
    And 包含:
      | 字段 | 说明 |
      | id | planet_user 表ID |
      | planetUserId | 星球用户ID |
      | planetNickname | 星球昵称 |
      | avatarUrl | 头像 |
      | joinedAt | 加入星球时间 |

  Scenario: 模糊搜索
    Given 输入搜索关键词 "小明"
    When 执行搜索
    Then 返回昵称或ID包含"小明"的用户
    And 结果按相关度排序

  Scenario: 限制搜索范围
    Given 指定训练营ID
    When GET /api/admin/planet-users?campId=1&keyword=小明
    Then 只返回该训练营关联星球圈子的用户
```

### AC-3: 手动匹配操作
```gherkin
Feature: 手动匹配
  Scenario: 管理员手动匹配成功
    Given 管理员在待匹配会员详情页
    And 选择了正确的星球用户
    When POST /api/admin/members/{id}/match {"planetUserId": 501}
    Then bind_status = completed
    And bind_method = manual
    And match_status = matched
    And 记录操作日志
    And 返回匹配成功信息

  Scenario: 重复匹配校验
    Given 会员已经匹配完成 (match_status = matched)
    When 再次调用匹配接口
    Then 返回错误 "会员已匹配，无需重复操作"

  Scenario: 星球用户不存在
    Given 提供的 planetUserId 不存在
    When 调用匹配接口
    Then 返回错误 "星球用户不存在"

  Scenario: 匹配后更新会员信息
    Given 手动匹配成功
    Then camp_member 更新:
      | 字段 | 值 |
      | planet_member_number | 关联的星球用户ID |
      | planet_nickname | 星球用户昵称 |
      | bind_status | completed |
      | bind_method | manual |
      | match_status | matched |
      | matched_at | 当前时间 |
```

### AC-4: 标记无法匹配
```gherkin
Feature: 标记无法匹配
  Scenario: 标记为匹配失败
    Given 管理员确认会员无法匹配到星球用户
    When POST /api/admin/members/{id}/match-failed {"reason": "用户提供信息错误"}
    Then match_status = failed
    And 记录失败原因
    And 记录操作日志

  Scenario: 匹配失败后可重新匹配
    Given 会员 match_status = failed
    When 管理员找到正确的星球用户
    And 调用匹配接口
    Then 可以重新匹配成功
    And match_status 更新为 matched
```

### AC-5: 前端待匹配管理页面
```gherkin
Feature: 待匹配管理页面
  Scenario: 页面布局
    Given 管理员进入待匹配管理页
    Then 显示:
      | 区域 | 内容 |
      | 筛选栏 | 训练营选择、关键词搜索 |
      | 待处理统计 | 总数、按训练营分布 |
      | 会员列表 | 表格展示待匹配会员 |
      | 分页 | 底部分页组件 |

  Scenario: 匹配操作流程
    Given 点击某会员的"匹配"按钮
    Then 弹出匹配对话框
    And 显示会员填写的信息
    And 提供星球用户搜索框
    And 显示搜索结果列表
    And 选择后点击确认完成匹配

  Scenario: 批量操作
    Given 选择多个待匹配会员
    When 点击"批量标记失败"
    Then 弹出确认对话框
    And 输入批量失败原因
    And 确认后批量更新状态
```

### AC-6: 操作日志记录
```gherkin
Feature: 操作日志
  Scenario: 记录手动匹配日志
    Given 管理员执行手动匹配
    Then 记录到 operation_log:
      | 字段 | 值 |
      | operation_type | manual_match |
      | operator_id | 当前管理员ID |
      | target_type | camp_member |
      | target_id | 会员ID |
      | content | JSON详情 |
      | created_at | 当前时间 |

  Scenario: 日志内容
    Given 手动匹配成功
    Then content JSON 包含:
      | 字段 | 说明 |
      | memberId | 会员ID |
      | planetUserId | 匹配的星球用户ID |
      | planetNickname | 星球昵称 |
      | filledNickname | 用户填写的昵称 |
      | matchReason | 匹配依据说明 |
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - 待匹配会员列表增强** (AC: #1)
  - [ ] 1.1 修改 `MemberController.java` 添加 matchStatus 筛选
  - [ ] 1.2 修改 `MemberService.getMemberList()` 支持 matchStatus
  - [ ] 1.3 添加待匹配统计接口
  - [ ] 1.4 编写接口测试

- [ ] **Task 2: 后端 - 星球用户搜索接口** (AC: #2)
  - [ ] 2.1 创建 `PlanetUserController.java`
  - [ ] 2.2 实现 `GET /api/admin/planet-users` 搜索接口
  - [ ] 2.3 支持按训练营圈子筛选
  - [ ] 2.4 实现模糊搜索（昵称、ID）
  - [ ] 2.5 编写接口测试

- [ ] **Task 3: 后端 - 手动匹配接口** (AC: #3)
  - [ ] 3.1 实现 `POST /api/admin/members/{id}/match`
  - [ ] 3.2 添加参数校验和状态校验
  - [ ] 3.3 更新会员绑定和匹配信息
  - [ ] 3.4 记录操作日志
  - [ ] 3.5 编写接口测试

- [ ] **Task 4: 后端 - 标记匹配失败接口** (AC: #4)
  - [ ] 4.1 实现 `POST /api/admin/members/{id}/match-failed`
  - [ ] 4.2 记录失败原因
  - [ ] 4.3 支持重新匹配逻辑
  - [ ] 4.4 编写接口测试

- [ ] **Task 5: 前端 - 待匹配管理页面** (AC: #5)
  - [ ] 5.1 创建 `PendingMatchList.vue` 页面
  - [ ] 5.2 实现筛选和搜索功能
  - [ ] 5.3 实现会员列表表格
  - [ ] 5.4 添加路由配置

- [ ] **Task 6: 前端 - 匹配对话框组件** (AC: #5)
  - [ ] 6.1 创建 `MatchDialog.vue` 组件
  - [ ] 6.2 实现星球用户搜索
  - [ ] 6.3 实现选择和确认流程
  - [ ] 6.4 实现错误处理

- [ ] **Task 7: 前端 - 批量操作** (AC: #5)
  - [ ] 7.1 实现批量选择
  - [ ] 7.2 实现批量标记失败
  - [ ] 7.3 实现批量操作确认对话框

- [ ] **Task 8: 集成测试与验收** (AC: #全部)
  - [ ] 8.1 测试待匹配列表查询
  - [ ] 8.2 测试星球用户搜索
  - [ ] 8.3 测试手动匹配流程
  - [ ] 8.4 测试标记失败流程
  - [ ] 8.5 测试操作日志记录

---

## Dev Notes

### 业务流程概述

本故事实现待匹配会员的人工处理流程。

```
管理员进入待匹配管理页
     ↓
筛选待处理会员 (match_status = pending)
     ↓
选择某个会员点击"匹配"
     ↓
弹出匹配对话框
├── 显示会员填写的信息
├── 搜索星球用户
└── 选择正确的星球用户
     ↓
确认匹配
     ↓
后端处理:
├── 验证星球用户存在
├── 更新 camp_member:
│   ├── bind_status = completed
│   ├── bind_method = manual
│   ├── match_status = matched
│   └── planet_member_number
├── 记录 member_match_log
└── 记录 operation_log
     ↓
返回成功，刷新列表
```

### 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 搜索范围 | 全部星球用户 | 可能跨圈子 |
| 匹配方式 | 单个操作 | 避免批量误操作 |
| 失败处理 | 可重新匹配 | 灵活处理异常情况 |
| 日志记录 | 双重日志 | match_log + operation_log |

### API 设计

#### GET /api/admin/members (增强)

新增查询参数:
| 参数 | 类型 | 说明 |
|------|------|------|
| matchStatus | string | 匹配状态筛选: pending/matched/failed |

#### GET /api/admin/planet-users

搜索星球用户。

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 是 | 搜索关键词 |
| campId | long | 否 | 训练营ID |
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页条数 |

**响应示例**:
```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "list": [
      {
        "id": 501,
        "planetUserId": "987654321",
        "planetNickname": "张三",
        "avatarUrl": "https://...",
        "groupId": "15555411412112",
        "joinedAt": "2025-01-01T10:00:00"
      }
    ],
    "total": 15,
    "page": 1,
    "pageSize": 20
  }
}
```

#### POST /api/admin/members/{id}/match

手动匹配会员。

**请求体**:
```json
{
  "planetUserId": 501,
  "matchReason": "昵称一致，确认为同一人"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "匹配成功",
  "data": {
    "memberId": 1002,
    "bindStatus": "completed",
    "bindMethod": "manual",
    "matchStatus": "matched",
    "boundPlanetUser": {
      "id": 501,
      "planetUserId": "987654321",
      "planetNickname": "张三"
    }
  }
}
```

#### POST /api/admin/members/{id}/match-failed

标记匹配失败。

**请求体**:
```json
{
  "reason": "用户提供的星球信息错误，无法找到对应用户"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "已标记失败",
  "data": {
    "memberId": 1003,
    "matchStatus": "failed",
    "failReason": "用户提供的星球信息错误"
  }
}
```

### 代码实现参考

#### PlanetUserController.java

```java
@RestController
@RequestMapping("/api/admin/planet-users")
@RequiredArgsConstructor
@Slf4j
public class PlanetUserController {

    private final PlanetUserService planetUserService;

    /**
     * 搜索星球用户
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public Result<PageResult<PlanetUserVO>> searchPlanetUsers(
            @RequestParam String keyword,
            @RequestParam(required = false) Long campId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {

        PlanetUserQuery query = PlanetUserQuery.builder()
            .keyword(keyword)
            .campId(campId)
            .page(page)
            .pageSize(pageSize)
            .build();

        PageResult<PlanetUserVO> result = planetUserService.searchUsers(query);
        return Result.success(result);
    }
}
```

#### MatchService.java - 手动匹配方法

```java
/**
 * 手动匹配会员
 */
@Override
@Transactional
public ManualMatchResult manualMatch(Long memberId, ManualMatchRequest request) {
    // 1. 查询会员
    CampMember member = memberMapper.selectById(memberId);
    if (member == null) {
        throw new BusinessException(404, "会员不存在");
    }

    // 2. 检查是否已匹配
    if (MatchStatus.MATCHED.equals(member.getMatchStatus())) {
        throw new BusinessException(400, "会员已匹配，无需重复操作");
    }

    // 3. 查询星球用户
    PlanetUser planetUser = planetUserMapper.selectById(request.getPlanetUserId());
    if (planetUser == null) {
        throw new BusinessException(404, "星球用户不存在");
    }

    // 4. 更新会员信息
    MatchStatus oldStatus = member.getMatchStatus();

    member.setBindStatus(BindStatus.COMPLETED);
    member.setBindMethod(BindMethod.MANUAL);
    member.setMatchStatus(MatchStatus.MATCHED);
    member.setPlanetMemberNumber(planetUser.getPlanetUserId());
    member.setPlanetNickname(planetUser.getPlanetNickname());
    member.setMatchedAt(LocalDateTime.now());
    memberMapper.updateById(member);

    // 5. 记录匹配日志
    recordMatchLog(memberId, oldStatus, MatchStatus.MATCHED,
        "手动匹配: " + request.getMatchReason(), "admin");

    // 6. 记录操作日志
    operationLogService.log(OperationLog.builder()
        .operationType("manual_match")
        .targetType("camp_member")
        .targetId(memberId)
        .content(JsonUtils.toJson(Map.of(
            "memberId", memberId,
            "planetUserId", request.getPlanetUserId(),
            "planetNickname", planetUser.getPlanetNickname(),
            "filledNickname", member.getFilledPlanetNickname(),
            "matchReason", request.getMatchReason()
        )))
        .build());

    // 7. 构建返回结果
    return ManualMatchResult.builder()
        .memberId(memberId)
        .bindStatus(BindStatus.COMPLETED)
        .bindMethod(BindMethod.MANUAL)
        .matchStatus(MatchStatus.MATCHED)
        .boundPlanetUser(PlanetUserVO.from(planetUser))
        .build();
}

/**
 * 标记匹配失败
 */
@Override
@Transactional
public void markMatchFailed(Long memberId, String reason) {
    CampMember member = memberMapper.selectById(memberId);
    if (member == null) {
        throw new BusinessException(404, "会员不存在");
    }

    MatchStatus oldStatus = member.getMatchStatus();

    member.setMatchStatus(MatchStatus.FAILED);
    member.setMatchFailReason(reason);
    member.setMatchedAt(LocalDateTime.now());
    memberMapper.updateById(member);

    // 记录日志
    recordMatchLog(memberId, oldStatus, MatchStatus.FAILED, reason, "admin");

    operationLogService.log(OperationLog.builder()
        .operationType("match_failed")
        .targetType("camp_member")
        .targetId(memberId)
        .content(JsonUtils.toJson(Map.of(
            "memberId", memberId,
            "reason", reason
        )))
        .build());
}
```

#### PendingMatchList.vue

```vue
<template>
  <div class="pending-match">
    <!-- 筛选栏 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="训练营">
          <el-select v-model="filterForm.campId" placeholder="全部" clearable>
            <el-option
              v-for="camp in camps"
              :key="camp.id"
              :label="camp.name"
              :value="camp.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input
            v-model="filterForm.keyword"
            placeholder="星球昵称/ID"
            clearable
            @input="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="8">
        <el-statistic title="待处理总数" :value="stats.totalPending" />
      </el-col>
      <el-col :span="8">
        <el-statistic title="已匹配" :value="stats.matched" />
      </el-col>
      <el-col :span="8">
        <el-statistic title="匹配失败" :value="stats.failed" />
      </el-col>
    </el-row>

    <!-- 会员列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>待匹配会员</span>
          <el-button
            type="danger"
            size="small"
            :disabled="!selectedIds.length"
            @click="handleBatchFailed"
          >
            批量标记失败
          </el-button>
        </div>
      </template>

      <el-table
        :data="members"
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="campName" label="训练营" width="180" />
        <el-table-column label="用户填写信息" width="200">
          <template #default="{ row }">
            <div>昵称: {{ row.filledPlanetNickname }}</div>
            <div>ID: {{ row.filledPlanetUserId }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="bindStatus" label="绑定状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getBindStatusType(row.bindStatus)">
              {{ getBindStatusText(row.bindStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="checkinCount" label="打卡天数" width="100" />
        <el-table-column prop="eligibleForRefund" label="退款资格" width="100">
          <template #default="{ row }">
            <el-tag :type="row.eligibleForRefund ? 'success' : 'danger'">
              {{ row.eligibleForRefund ? '符合' : '不符合' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payAmount" label="支付金额" width="100">
          <template #default="{ row }">¥{{ row.payAmount }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openMatchDialog(row)">
              匹配
            </el-button>
            <el-button type="danger" size="small" @click="handleMarkFailed(row)">
              标记失败
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadData"
        @current-change="loadData"
      />
    </el-card>

    <!-- 匹配对话框 -->
    <match-dialog
      v-model:visible="matchDialogVisible"
      :member="currentMember"
      @success="handleMatchSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPendingMembers, markMatchFailed } from '@/api/member'
import MatchDialog from '@/components/MatchDialog.vue'

// ... 组件逻辑实现
</script>
```

### 页面效果示意

```
┌─────────────────────────────────────────────────────────────────┐
│  待匹配会员管理                                                  │
├─────────────────────────────────────────────────────────────────┤
│  训练营: [全部▼]  搜索: [________________]  [查询]              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ 待处理总数  │ │   已匹配    │ │  匹配失败   │               │
│  │     15     │ │    142     │ │     2      │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
├─────────────────────────────────────────────────────────────────┤
│  待匹配会员                                    [批量标记失败]    │
├─────────────────────────────────────────────────────────────────┤
│  □ │ 训练营     │ 用户填写信息   │ 绑定状态 │ 打卡 │ 退款 │ 操作 │
│  ─────────────────────────────────────────────────────────────  │
│  □ │ 21天早起  │ 昵称: 张三      │ 已过期   │ 18  │ 符合 │ [匹配]│
│    │          │ ID: 123456     │         │     │     │ [失败]│
│  □ │ 30天读书  │ 昵称: 李四      │ 待审核   │ 25  │ 符合 │ [匹配]│
│    │          │ ID: 987654     │         │     │     │ [失败]│
│  ─────────────────────────────────────────────────────────────  │
│                              < 1 2 3 > 共15条                   │
└─────────────────────────────────────────────────────────────────┘
```

### 安全检查清单

- [ ] 权限控制：仅 admin/coach 角色可访问
- [ ] 参数校验：memberId 和 planetUserId 必须有效
- [ ] 重复操作防护：已匹配会员不能重复匹配
- [ ] 操作日志：所有匹配操作都有审计日志
- [ ] SQL 注入防护：使用参数化查询

### 测试要点

**后端测试**:
1. `MemberControllerTest` - 测试 matchStatus 筛选
2. `PlanetUserControllerTest` - 测试搜索接口
3. `MatchServiceTest` - 测试手动匹配和标记失败
4. 测试操作日志记录

**前端测试**:
1. 测试筛选和搜索功能
2. 测试匹配对话框流程
3. 测试批量操作
4. 测试错误处理

---

## 项目结构

### 后端新增/修改文件

```
backend/src/main/java/com/camp/
├── controller/
│   └── admin/
│       ├── MemberController.java             # 修改添加 matchStatus 筛选
│       └── PlanetUserController.java         # 新增星球用户控制器
├── service/
│   ├── MatchService.java                     # 修改添加手动匹配方法
│   ├── PlanetUserService.java                # 新增星球用户服务
│   └── impl/
│       └── PlanetUserServiceImpl.java        # 新增
├── dto/
│   ├── ManualMatchRequest.java               # 新增手动匹配请求
│   ├── MatchFailedRequest.java               # 新增失败标记请求
│   └── query/
│       └── PlanetUserQuery.java              # 新增星球用户查询
└── vo/
    ├── ManualMatchResult.java                # 新增手动匹配结果
    └── PlanetUserVO.java                     # 新增星球用户 VO
```

### 前端新增文件

```
frontend/admin-web/src/
├── views/
│   └── member/
│       └── PendingMatchList.vue              # 新增待匹配管理页
├── components/
│   └── MatchDialog.vue                       # 新增匹配对话框组件
├── api/
│   └── planetUser.js                         # 新增星球用户 API
└── router/
    └── index.js                              # 添加路由
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP04-S01 直接匹配 | ready-for-dev | match_status 状态定义 |
| EP03-S01 SDK集成 | ready-for-dev | planet_user 表数据 |
| EP05-S01 会员列表 | ready-for-dev | 列表页框架复用 |

### 后续依赖

本故事完成后:
- EP04-S03 退款名单生成（需要所有会员完成匹配）
- EP05-S03 人工绑定（复用匹配逻辑）

---

## References

| 文档 | 路径 | 相关章节 |
|------|------|----------|
| PRD | `docs/PRD.md` | 4.2.4 退款审核 |
| 接口文档 | `docs/v1/api/接口文档.md` | 5.1 会员列表, 5.3 手动匹配 |
| 状态枚举 | `docs/v1/design/状态枚举定义.md` | match_status, bind_status |
| Epic 定义 | `docs/epics.md` | EP04-S02 |
| 前一故事 | `docs/sprint-artifacts/stories/4-1-direct-match.md` | 直接匹配 |

---

## Dev Agent Record

### Context Reference
- Epic: EP04 身份匹配与退款流程
- Story: EP04-S02 待匹配会员列表与手动匹配
- FR Coverage: FR5.2, FR5.3

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
| 前置条件 | EP04-S01 完成 |
| 覆盖 FR | FR5.2, FR5.3 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
