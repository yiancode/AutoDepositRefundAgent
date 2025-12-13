# Story 4.4: 退款审核列表与操作

**Status**: ready-for-dev

---

## Story

**作为**管理员，
**我希望**能够查看待审核的退款列表并进行单个或批量审核，
**以便于**高效地完成退款审核工作。

---

## 验收标准

### AC-1: 查看待审核列表
```gherkin
Feature: 待审核退款列表
  Scenario: 查看待审核列表
    Given 管理员已登录
    And 存在 audit_status = pending 的退款记录
    When GET /api/admin/refunds/pending?page=1&pageSize=20
    Then 返回待审核列表
    And 包含以下信息:
      | 字段 | 说明 |
      | id | 退款记录ID |
      | campName | 训练营名称 |
      | planetNickname | 星球昵称 |
      | refundAmount | 退款金额 |
      | auditStatus | 审核状态 |
      | bindStatus | 绑定状态 |
      | bindMethod | 绑定方式 |
      | checkinCount | 打卡天数 |
      | requiredDays | 要求天数 |
      | payTime | 支付时间 |
      | createdAt | 创建时间 |

  Scenario: 按训练营筛选
    Given GET /api/admin/refunds/pending?campId=1
    Then 只返回指定训练营的待审核记录

  Scenario: 显示汇总信息
    Given 待审核列表返回
    Then 包含 summary:
      | 字段 | 说明 |
      | totalAmount | 待审核总金额 |
      | boundCount | 已绑定数量 |
      | manualReviewCount | 待人工审核数量 |
```

### AC-2: 单个审核通过
```gherkin
Feature: 单个审核通过
  Scenario: 审核通过单个退款
    Given 管理员在审核列表
    And 退款记录 audit_status = pending
    When POST /api/admin/refunds/{id}/approve
    Then audit_status = approved
    And refund_status 保持 pending（等待执行）
    And 记录审核人 auditor_id
    And 记录审核时间 audit_time
    And 记录到 refund_status_log

  Scenario: 添加审核备注
    Given POST /api/admin/refunds/{id}/approve {"comment": "打卡达标，审核通过"}
    Then audit_comment 保存备注内容

  Scenario: 重复审核
    Given 退款记录 audit_status = approved
    When 再次调用 approve 接口
    Then 返回错误 "退款记录已审核"
```

### AC-3: 单个审核拒绝
```gherkin
Feature: 单个审核拒绝
  Scenario: 拒绝退款
    Given 管理员决定拒绝退款
    When POST /api/admin/refunds/{id}/reject {"reason": "身份信息不匹配"}
    Then audit_status = rejected
    And refund_status = rejected
    And 记录拒绝原因 reject_reason
    And 记录审核人和时间
    And 记录到 refund_status_log

  Scenario: 拒绝原因必填
    Given POST /api/admin/refunds/{id}/reject {}
    Then 返回错误 "请填写拒绝原因"
```

### AC-4: 批量审核通过
```gherkin
Feature: 批量审核
  Scenario: 批量审核通过
    Given 选择多条退款记录
    When POST /api/admin/refunds/batch-approve {refundIds: [5001, 5003, 5004]}
    Then 批量更新状态为 approved
    And 返回处理结果统计

  Scenario: 批量审核只处理已绑定
    Given POST /api/admin/refunds/batch-approve {refundIds, requireBound: true}
    Then 仅处理 bind_status=completed 的记录
    And 跳过未绑定的记录
    And 返回跳过详情

  Scenario: 批量审核结果
    Given 批量审核完成
    Then 返回:
      | 字段 | 说明 |
      | total | 请求总数 |
      | approved | 通过数 |
      | skipped | 跳过数 |
      | skippedDetails | 跳过原因详情 |

  Scenario: 二次确认
    Given 批量审核金额超过阈值（如10000元）
    When 前端发起批量审核
    Then 需要输入管理员密码确认
```

### AC-5: 退款记录列表
```gherkin
Feature: 退款记录查询
  Scenario: 查询退款记录
    Given 管理员查询退款历史
    When GET /api/admin/refunds/records?auditStatus=approved&refundStatus=success
    Then 返回符合条件的退款记录列表

  Scenario: 多条件筛选
    Given 筛选条件:
      | 参数 | 说明 |
      | campId | 训练营ID |
      | auditStatus | 审核状态 |
      | refundStatus | 退款状态 |
      | startDate | 开始日期 |
      | endDate | 结束日期 |
    Then 支持多条件组合筛选

  Scenario: 显示统计汇总
    Given 退款记录列表返回
    Then 包含 summary:
      | 字段 | 说明 |
      | totalRefunded | 已退款总额 |
      | successCount | 成功数 |
      | failedCount | 失败数 |
      | pendingCount | 待处理数 |
```

### AC-6: 前端审核页面
```gherkin
Feature: 审核页面
  Scenario: 待审核页面布局
    Given 管理员进入待审核页面
    Then 显示:
      | 区域 | 内容 |
      | 统计卡片 | 待审核数/金额、已绑定数、待处理数 |
      | 筛选栏 | 训练营选择 |
      | 退款列表 | 表格展示待审核记录 |
      | 批量操作 | 全选、批量通过按钮 |

  Scenario: 单个操作流程
    Given 点击某条记录的"通过"按钮
    Then 弹出确认对话框
    And 可输入审核备注
    And 确认后调用 API

  Scenario: 批量操作流程
    Given 勾选多条记录
    When 点击"批量通过"按钮
    Then 弹出确认对话框
    And 显示选中数量和金额
    And 显示"仅处理已绑定"选项
    And 确认后调用批量 API
```

### AC-7: 状态日志记录
```gherkin
Feature: 状态日志
  Scenario: 记录审核状态变更
    Given 执行审核操作
    Then 记录到 refund_status_log:
      | 字段 | 说明 |
      | refund_id | 退款记录ID |
      | old_status | 旧状态 |
      | new_status | 新状态 |
      | operator_id | 操作人ID |
      | comment | 备注/原因 |
      | created_at | 操作时间 |

  Scenario: 查询状态历史
    Given GET /api/admin/refunds/{id}/logs
    Then 返回该退款记录的所有状态变更历史
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - 待审核列表接口** (AC: #1)
  - [ ] 1.1 创建 `RefundController.java`
  - [ ] 1.2 实现 `GET /api/admin/refunds/pending`
  - [ ] 1.3 实现筛选和分页
  - [ ] 1.4 实现汇总统计
  - [ ] 1.5 编写接口测试

- [ ] **Task 2: 后端 - 单个审核接口** (AC: #2, #3)
  - [ ] 2.1 实现 `POST /api/admin/refunds/{id}/approve`
  - [ ] 2.2 实现 `POST /api/admin/refunds/{id}/reject`
  - [ ] 2.3 添加状态校验
  - [ ] 2.4 记录审核信息
  - [ ] 2.5 编写接口测试

- [ ] **Task 3: 后端 - 批量审核接口** (AC: #4)
  - [ ] 3.1 实现 `POST /api/admin/refunds/batch-approve`
  - [ ] 3.2 实现 requireBound 逻辑
  - [ ] 3.3 返回处理结果统计
  - [ ] 3.4 编写接口测试

- [ ] **Task 4: 后端 - 退款记录列表** (AC: #5)
  - [ ] 4.1 实现 `GET /api/admin/refunds/records`
  - [ ] 4.2 支持多条件筛选
  - [ ] 4.3 实现汇总统计
  - [ ] 4.4 编写接口测试

- [ ] **Task 5: 后端 - 状态日志** (AC: #7)
  - [ ] 5.1 创建 `refund_status_log` 表（如不存在）
  - [ ] 5.2 创建 `RefundStatusLog.java` 实体
  - [ ] 5.3 实现日志记录逻辑
  - [ ] 5.4 实现 `GET /api/admin/refunds/{id}/logs`

- [ ] **Task 6: 前端 - 待审核页面** (AC: #6)
  - [ ] 6.1 创建 `PendingRefundList.vue`
  - [ ] 6.2 实现统计卡片
  - [ ] 6.3 实现退款列表表格
  - [ ] 6.4 实现单个审核流程
  - [ ] 6.5 添加路由配置

- [ ] **Task 7: 前端 - 批量审核功能** (AC: #6)
  - [ ] 7.1 实现多选功能
  - [ ] 7.2 实现批量审核对话框
  - [ ] 7.3 实现确认流程
  - [ ] 7.4 处理审核结果

- [ ] **Task 8: 前端 - 退款记录页面** (AC: #5)
  - [ ] 8.1 创建 `RefundRecordList.vue`
  - [ ] 8.2 实现多条件筛选
  - [ ] 8.3 实现统计汇总展示

- [ ] **Task 9: 集成测试与验收** (AC: #全部)
  - [ ] 9.1 测试待审核列表
  - [ ] 9.2 测试单个审核操作
  - [ ] 9.3 测试批量审核
  - [ ] 9.4 测试状态日志记录

---

## Dev Notes

### 业务流程概述

本故事实现退款审核的完整流程。

```
管理员进入待审核页面
     ↓
查看待审核列表 (audit_status=pending)
     ↓
选择审核方式:
├── 单个审核
│   ├── 点击"通过" → 确认 → audit_status=approved
│   └── 点击"拒绝" → 填写原因 → audit_status=rejected
└── 批量审核
    ├── 勾选多条记录
    ├── 点击"批量通过"
    ├── 确认对话框（显示数量/金额）
    └── 调用批量API
     ↓
审核完成:
├── 更新 refund_record 状态
├── 记录 refund_status_log
├── 更新 auditor_id, audit_time
└── approved 的记录等待退款执行
```

### 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 批量审核 | 仅支持通过 | 拒绝需要填写原因 |
| requireBound | 默认true | 避免错误退款 |
| 状态日志 | 独立表 | 审计追溯需要 |
| 二次确认 | 金额阈值 | 防止误操作 |

### API 设计参考

> **SSOT引用**: [接口文档.md](../../v1/api/接口文档.md) - 第7章 退款管理接口

### 代码实现参考

#### RefundController.java

```java
@RestController
@RequestMapping("/api/admin/refunds")
@RequiredArgsConstructor
@Slf4j
public class RefundController {

    private final RefundService refundService;

    /**
     * 获取待审核列表
     */
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public Result<PageResult<RefundPendingVO>> getPendingList(
            @RequestParam(required = false) Long campId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {

        RefundQuery query = RefundQuery.builder()
            .campId(campId)
            .auditStatus(AuditStatus.PENDING)
            .page(page)
            .pageSize(pageSize)
            .build();

        PageResult<RefundPendingVO> result = refundService.getPendingList(query);
        return Result.success(result);
    }

    /**
     * 审核通过
     */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<RefundApproveResult> approve(
            @PathVariable Long id,
            @RequestBody(required = false) RefundApproveRequest request) {

        RefundApproveResult result = refundService.approve(id, request);
        return Result.success(result);
    }

    /**
     * 审核拒绝
     */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<RefundRejectResult> reject(
            @PathVariable Long id,
            @RequestBody @Valid RefundRejectRequest request) {

        RefundRejectResult result = refundService.reject(id, request);
        return Result.success(result);
    }

    /**
     * 批量审核通过
     */
    @PostMapping("/batch-approve")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<BatchApproveResult> batchApprove(
            @RequestBody @Valid BatchApproveRequest request) {

        BatchApproveResult result = refundService.batchApprove(request);
        return Result.success(result);
    }

    /**
     * 获取退款记录列表
     */
    @GetMapping("/records")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public Result<PageResult<RefundRecordVO>> getRecords(
            @RequestParam(required = false) Long campId,
            @RequestParam(required = false) String auditStatus,
            @RequestParam(required = false) String refundStatus,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {

        RefundRecordQuery query = RefundRecordQuery.builder()
            .campId(campId)
            .auditStatus(auditStatus)
            .refundStatus(refundStatus)
            .startDate(startDate)
            .endDate(endDate)
            .page(page)
            .pageSize(pageSize)
            .build();

        PageResult<RefundRecordVO> result = refundService.getRecords(query);
        return Result.success(result);
    }

    /**
     * 获取退款状态日志
     */
    @GetMapping("/{id}/logs")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public Result<List<RefundStatusLogVO>> getStatusLogs(@PathVariable Long id) {
        List<RefundStatusLogVO> logs = refundService.getStatusLogs(id);
        return Result.success(logs);
    }
}
```

#### RefundService.java - 审核方法

```java
/**
 * 审核通过
 */
@Override
@Transactional
public RefundApproveResult approve(Long refundId, RefundApproveRequest request) {
    RefundRecord refund = refundMapper.selectById(refundId);
    if (refund == null) {
        throw new BusinessException(404, "退款记录不存在");
    }
    if (!AuditStatus.PENDING.equals(refund.getAuditStatus())) {
        throw new BusinessException(400, "退款记录已审核");
    }

    // 更新状态
    AuditStatus oldStatus = refund.getAuditStatus();
    refund.setAuditStatus(AuditStatus.APPROVED);
    refund.setAuditorId(SecurityUtils.getCurrentUserId());
    refund.setAuditTime(LocalDateTime.now());
    if (request != null && StringUtils.hasText(request.getComment())) {
        refund.setAuditComment(request.getComment());
    }
    refundMapper.updateById(refund);

    // 记录状态日志
    recordStatusLog(refundId, oldStatus.getValue(), AuditStatus.APPROVED.getValue(),
        request != null ? request.getComment() : "审核通过");

    return RefundApproveResult.builder()
        .refundId(refundId)
        .auditStatus(AuditStatus.APPROVED)
        .refundStatus(refund.getRefundStatus())
        .auditor(SecurityUtils.getCurrentUsername())
        .auditTime(refund.getAuditTime())
        .build();
}

/**
 * 审核拒绝
 */
@Override
@Transactional
public RefundRejectResult reject(Long refundId, RefundRejectRequest request) {
    RefundRecord refund = refundMapper.selectById(refundId);
    if (refund == null) {
        throw new BusinessException(404, "退款记录不存在");
    }
    if (!AuditStatus.PENDING.equals(refund.getAuditStatus())) {
        throw new BusinessException(400, "退款记录已审核");
    }

    AuditStatus oldStatus = refund.getAuditStatus();
    refund.setAuditStatus(AuditStatus.REJECTED);
    refund.setRefundStatus(RefundStatus.REJECTED);
    refund.setRejectReason(request.getReason());
    refund.setAuditorId(SecurityUtils.getCurrentUserId());
    refund.setAuditTime(LocalDateTime.now());
    refundMapper.updateById(refund);

    recordStatusLog(refundId, oldStatus.getValue(), AuditStatus.REJECTED.getValue(),
        "拒绝原因: " + request.getReason());

    return RefundRejectResult.builder()
        .refundId(refundId)
        .auditStatus(AuditStatus.REJECTED)
        .refundStatus(RefundStatus.REJECTED)
        .reason(request.getReason())
        .auditor(SecurityUtils.getCurrentUsername())
        .auditTime(refund.getAuditTime())
        .build();
}

/**
 * 批量审核通过
 */
@Override
@Transactional
public BatchApproveResult batchApprove(BatchApproveRequest request) {
    List<Long> refundIds = request.getRefundIds();
    boolean requireBound = request.getRequireBound() == null || request.getRequireBound();

    int approved = 0;
    int skipped = 0;
    List<SkippedDetail> skippedDetails = new ArrayList<>();

    for (Long refundId : refundIds) {
        RefundRecord refund = refundMapper.selectById(refundId);
        if (refund == null) {
            skippedDetails.add(new SkippedDetail(refundId, "记录不存在"));
            skipped++;
            continue;
        }

        if (!AuditStatus.PENDING.equals(refund.getAuditStatus())) {
            skippedDetails.add(new SkippedDetail(refundId, "已审核"));
            skipped++;
            continue;
        }

        // 检查绑定状态
        if (requireBound) {
            CampMember member = memberMapper.selectById(refund.getMemberId());
            if (!BindStatus.COMPLETED.equals(member.getBindStatus())) {
                skippedDetails.add(new SkippedDetail(refundId,
                    "bind_status=" + member.getBindStatus() + "，需先手动绑定"));
                skipped++;
                continue;
            }
        }

        // 审核通过
        AuditStatus oldStatus = refund.getAuditStatus();
        refund.setAuditStatus(AuditStatus.APPROVED);
        refund.setAuditorId(SecurityUtils.getCurrentUserId());
        refund.setAuditTime(LocalDateTime.now());
        if (StringUtils.hasText(request.getComment())) {
            refund.setAuditComment(request.getComment());
        }
        refundMapper.updateById(refund);

        recordStatusLog(refundId, oldStatus.getValue(), AuditStatus.APPROVED.getValue(), "批量审核通过");
        approved++;
    }

    return BatchApproveResult.builder()
        .total(refundIds.size())
        .approved(approved)
        .skipped(skipped)
        .skippedDetails(skippedDetails)
        .auditor(SecurityUtils.getCurrentUsername())
        .auditTime(LocalDateTime.now())
        .build();
}
```

#### PendingRefundList.vue

```vue
<template>
  <div class="pending-refund">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-cards">
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic title="待审核数" :value="summary.totalCount" />
          <div class="stats-extra">金额: ¥{{ summary.totalAmount }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic title="已绑定" :value="summary.boundCount" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic title="待处理" :value="summary.manualReviewCount" />
        </el-card>
      </el-col>
    </el-row>

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
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 退款列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>待审核退款 ({{ pagination.total }}条)</span>
          <el-button
            type="success"
            :disabled="!selectedIds.length"
            @click="handleBatchApprove"
          >
            批量通过 ({{ selectedIds.length }})
          </el-button>
        </div>
      </template>

      <el-table
        :data="refunds"
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="campName" label="训练营" width="180" />
        <el-table-column prop="planetNickname" label="星球昵称" width="120" />
        <el-table-column prop="refundAmount" label="退款金额" width="100">
          <template #default="{ row }">¥{{ row.refundAmount }}</template>
        </el-table-column>
        <el-table-column prop="bindStatus" label="绑定状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getBindStatusType(row.bindStatus)">
              {{ getBindStatusText(row.bindStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="打卡情况" width="120">
          <template #default="{ row }">
            {{ row.checkinCount }} / {{ row.requiredDays }}
          </template>
        </el-table-column>
        <el-table-column prop="payTime" label="支付时间" width="160">
          <template #default="{ row }">{{ formatTime(row.payTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="handleApprove(row)">
              通过
            </el-button>
            <el-button type="danger" size="small" @click="handleReject(row)">
              拒绝
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

    <!-- 拒绝对话框 -->
    <el-dialog v-model="rejectDialogVisible" title="拒绝退款" width="400px">
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="拒绝原因" required>
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入拒绝原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认拒绝</el-button>
      </template>
    </el-dialog>

    <!-- 批量审核对话框 -->
    <batch-approve-dialog
      v-model:visible="batchDialogVisible"
      :selected-ids="selectedIds"
      :total-amount="selectedTotalAmount"
      @success="handleBatchSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPendingRefunds, approveRefund, rejectRefund } from '@/api/refund'
import BatchApproveDialog from '@/components/BatchApproveDialog.vue'

// ... 组件逻辑实现
</script>
```

### 页面效果示意

```
┌─────────────────────────────────────────────────────────────────┐
│  待审核退款                                                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │   待审核数      │ │    已绑定       │ │    待处理       │    │
│  │      98        │ │      85        │ │      13        │    │
│  │  金额: ¥9702   │ │                │ │                │    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│  训练营: [全部▼]                           [查询]               │
├─────────────────────────────────────────────────────────────────┤
│  待审核退款 (98条)                        [批量通过 (5)]         │
├─────────────────────────────────────────────────────────────────┤
│  □ │ 训练营   │ 星球昵称 │ 金额  │ 绑定  │ 打卡  │ 支付时间   │ 操作│
│  ─────────────────────────────────────────────────────────────  │
│  ☑ │ 21天早起 │ 小明    │ ¥99  │ 已完成│ 16/15│ 12-09 18:00│[通过]│
│    │         │        │      │      │      │            │[拒绝]│
│  ☑ │ 21天早起 │ 李四    │ ¥99  │ 已完成│ 15/15│ 12-09 20:00│[通过]│
│    │         │        │      │      │      │            │[拒绝]│
│  □ │ 30天读书 │ 王五    │ ¥199 │ 待审核│ 28/25│ 12-10 10:00│[通过]│
│    │         │        │      │      │      │            │[拒绝]│
│  ─────────────────────────────────────────────────────────────  │
│                              < 1 2 3 4 5 > 共98条               │
└─────────────────────────────────────────────────────────────────┘
```

### 安全检查清单

- [ ] 权限控制：审核操作需要 ADMIN 权限
- [ ] 状态校验：只能审核 pending 状态的记录
- [ ] 二次确认：批量操作需要确认
- [ ] 审计日志：所有操作记录到状态日志
- [ ] 防重复：已审核记录不能重复操作

### 测试要点

**后端测试**:
1. `RefundControllerTest` - 测试所有审核接口
2. `RefundServiceTest` - 测试审核逻辑
3. 测试批量审核的 requireBound 逻辑
4. 测试状态日志记录

**前端测试**:
1. 测试列表筛选和分页
2. 测试单个审核流程
3. 测试批量审核流程
4. 测试拒绝原因必填校验

---

## 项目结构

### 后端新增/修改文件

```
backend/src/main/java/com/camp/
├── controller/
│   └── admin/
│       └── RefundController.java             # 修改/新增退款控制器
├── service/
│   ├── RefundService.java                    # 修改添加审核方法
│   └── impl/
│       └── RefundServiceImpl.java            # 修改
├── entity/
│   └── RefundStatusLog.java                  # 新增状态日志实体
├── mapper/
│   └── RefundStatusLogMapper.java            # 新增状态日志 Mapper
├── dto/
│   ├── RefundApproveRequest.java             # 新增审核通过请求
│   ├── RefundRejectRequest.java              # 新增审核拒绝请求
│   ├── BatchApproveRequest.java              # 新增批量审核请求
│   └── query/
│       └── RefundRecordQuery.java            # 新增退款记录查询
└── vo/
    ├── RefundPendingVO.java                  # 新增待审核 VO
    ├── RefundRecordVO.java                   # 新增退款记录 VO
    ├── RefundApproveResult.java              # 新增审核结果 VO
    ├── RefundRejectResult.java               # 新增拒绝结果 VO
    ├── BatchApproveResult.java               # 新增批量审核结果 VO
    └── RefundStatusLogVO.java                # 新增状态日志 VO
```

### 前端新增文件

```
frontend/admin-web/src/
├── views/
│   └── refund/
│       ├── PendingRefundList.vue             # 新增待审核页面
│       └── RefundRecordList.vue              # 新增退款记录页面
├── components/
│   └── BatchApproveDialog.vue                # 新增批量审核对话框
├── api/
│   └── refund.js                             # 新增退款 API
└── router/
    └── index.js                              # 添加路由
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP04-S03 退款名单生成 | ready-for-dev | refund_record 数据来源 |
| EP04-S02 手动匹配 | ready-for-dev | 绑定状态查询 |

### 后续依赖

本故事完成后:
- EP04-S05 退款执行（执行 approved 的退款）
- EP06-S01 训练营报表（退款统计数据）

---

## References

| 文档 | 路径 | 相关章节 |
|------|------|----------|
| PRD | `docs/PRD.md` | 4.2.4 退款审核 |
| 接口文档 | `docs/v1/api/接口文档.md` | 7.1-7.6 退款管理接口 |
| 状态枚举 | `docs/v1/design/状态枚举定义.md` | audit_status, refund_status |
| Epic 定义 | `docs/epics.md` | EP04-S04 |
| 前一故事 | `docs/sprint-artifacts/stories/4-3-refund-list-generate.md` | 退款名单生成 |

---

## Dev Agent Record

### Context Reference
- Epic: EP04 身份匹配与退款流程
- Story: EP04-S04 退款审核列表与操作
- FR Coverage: FR6.2, FR6.3, FR6.4

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
| Epic | EP04 |
| 前置条件 | EP04-S03 完成 |
| 覆盖 FR | FR6.2, FR6.3, FR6.4 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
