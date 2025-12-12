# Story 1-5: 训练营状态自动更新定时任务

| 属性 | 值 |
|------|-----|
| **Story ID** | 1-5-camp-status-update |
| **Epic** | EP01 - 基础框架与训练营管理 |
| **Story Points** | 2 |
| **优先级** | P0 |
| **前置依赖** | 1-3-camp-crud |
| **状态** | drafted |

---

## 用户故事

**作为** 系统
**我需要** 每天自动根据日期更新训练营状态
**以便** 训练营能够按照预定时间线自动推进状态

---

## 验收标准 (BDD)

```gherkin
Feature: 训练营状态自动更新

  Background:
    Given 定时任务配置为每天 00:05 执行

  Scenario: 自动更新为进行中
    Given 存在状态为 enrolling 的训练营
    And 当前日期 >= 训练营开始日期
    When 定时任务执行
    Then 训练营状态更新为 ongoing
    And 记录状态变更日志 (reason="定时任务自动更新")
    And 操作人记录为 "SYSTEM"

  Scenario: 自动更新为已结束
    Given 存在状态为 ongoing 的训练营
    And 当前日期 > 训练营结束日期
    When 定时任务执行
    Then 训练营状态更新为 ended
    And 记录状态变更日志 (reason="定时任务自动更新")

  Scenario: 批量更新多个训练营
    Given 存在 3 个 enrolling 状态且已到开始日期的训练营
    And 存在 2 个 ongoing 状态且已过结束日期的训练营
    When 定时任务执行
    Then 3 个训练营状态更新为 ongoing
    And 2 个训练营状态更新为 ended
    And 日志记录更新了 5 个训练营

  Scenario: 状态未达到更新条件
    Given 存在 enrolling 状态的训练营
    And 当前日期 < 训练营开始日期
    When 定时任务执行
    Then 训练营状态保持 enrolling 不变
    And 不记录状态变更日志

  Scenario: draft/pending 状态不自动更新
    Given 存在状态为 draft 或 pending 的训练营
    And 当前日期 >= 训练营开始日期
    When 定时任务执行
    Then 训练营状态保持不变
    And 不记录状态变更日志

  Scenario: ended/settling/archived 状态不自动更新
    Given 存在状态为 ended 的训练营
    When 定时任务执行
    Then 训练营状态保持 ended 不变
    And 不记录状态变更日志

  Scenario: 定时任务执行成功日志
    Given 存在需要更新的训练营
    When 定时任务执行完成
    Then 记录 INFO 日志 "训练营状态自动更新完成: enrollingToOngoing=X, ongoingToEnded=Y"

  Scenario: 定时任务执行失败日志
    Given 定时任务执行过程中发生异常
    Then 记录 ERROR 日志 "训练营状态自动更新失败"
    And 包含异常堆栈信息
    And 不影响其他定时任务执行

  Scenario: 手动触发状态更新
    Given 管理员已登录
    When POST /api/admin/camps/trigger-status-update
    Then 返回 200 OK
    And 返回更新结果 (enrollingToOngoing, ongoingToEnded)
    And 日志记录 "手动触发训练营状态更新"
```

---

## 技术上下文

### 技术栈要求

| 组件 | 版本 | 说明 |
|------|------|------|
| Spring Boot | 3.2+ | 主框架 |
| Spring Scheduler | - | 定时任务 |
| MyBatis Plus | 3.5+ | ORM + 批量更新 |
| PostgreSQL | 15+ | 数据库 |

### 状态流转规则

> 引用：`docs/v1/design/状态枚举定义.md#5-camp_status`

**定时任务自动流转范围**：

| 原状态 | 新状态 | 触发条件 |
|--------|--------|---------|
| `enrolling` | `ongoing` | 当前日期 >= startDate |
| `ongoing` | `ended` | 当前日期 > endDate |

**其他状态流转**（不由定时任务处理）：

| 原状态 | 新状态 | 触发方式 |
|--------|--------|---------|
| `draft` | `pending` | 管理员操作 (发布审核) |
| `pending` | `enrolling` | 管理员操作 (确认发布) |
| `pending` | `draft` | 管理员操作 (撤回) |
| `ended` | `settling` | 管理员操作 (触发结算) |
| `settling` | `archived` | 结算流程完成 |

### 定时任务配置

| 参数 | 值 | 说明 |
|------|------|------|
| Cron 表达式 | `0 5 0 * * ?` | 每天 00:05 执行 |
| 时区 | Asia/Shanghai | 中国时区 |
| 并发控制 | 单实例执行 | 避免重复处理 |

---

## 实现任务清单

### Task 1: 启用 Spring Scheduler

**目标**: 配置 Spring 定时任务

**文件**: `backend/src/main/java/com/yian/camp/CampApplication.java`

```java
package com.yian.camp;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@MapperScan("com.yian.camp.mapper")
@EnableScheduling  // 启用定时任务
public class CampApplication {

    public static void main(String[] args) {
        SpringApplication.run(CampApplication.class, args);
    }
}
```

---

### Task 2: 创建状态更新结果 VO

**文件**: `backend/src/main/java/com/yian/camp/vo/CampStatusUpdateResultVO.java`

```java
package com.yian.camp.vo;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CampStatusUpdateResultVO {

    /**
     * 从 enrolling 更新到 ongoing 的数量
     */
    private int enrollingToOngoing;

    /**
     * 从 ongoing 更新到 ended 的数量
     */
    private int ongoingToEnded;

    /**
     * 更新总数
     */
    private int totalUpdated;

    /**
     * 执行时间
     */
    private LocalDateTime executedAt;

    /**
     * 触发方式 (SCHEDULED / MANUAL)
     */
    private String triggerType;
}
```

---

### Task 3: 扩展 CampMapper

**目标**: 添加批量状态更新方法

**文件**: `backend/src/main/java/com/yian/camp/mapper/CampMapper.java`

添加以下方法：

```java
/**
 * 查询需要更新为 ongoing 的训练营ID列表
 * 条件: status = 'enrolling' AND start_date <= today
 */
@Select("SELECT id FROM training_camp WHERE status = 'enrolling' AND start_date <= #{today} AND deleted_at IS NULL")
List<Long> selectCampsToStartOngoing(@Param("today") LocalDate today);

/**
 * 查询需要更新为 ended 的训练营ID列表
 * 条件: status = 'ongoing' AND end_date < today
 */
@Select("SELECT id FROM training_camp WHERE status = 'ongoing' AND end_date < #{today} AND deleted_at IS NULL")
List<Long> selectCampsToEnd(@Param("today") LocalDate today);

/**
 * 批量更新训练营状态
 */
@Update("<script>" +
        "UPDATE training_camp SET status = #{status}, updated_at = NOW() " +
        "WHERE id IN " +
        "<foreach collection='ids' item='id' open='(' separator=',' close=')'>" +
        "#{id}" +
        "</foreach>" +
        "</script>")
int batchUpdateStatus(@Param("ids") List<Long> ids, @Param("status") String status);
```

需要添加导入：

```java
import java.time.LocalDate;
import java.util.List;
import org.apache.ibatis.annotations.Update;
```

---

### Task 4: 扩展 CampService 接口

**文件**: `backend/src/main/java/com/yian/camp/service/CampService.java`

添加以下方法：

```java
/**
 * 执行训练营状态自动更新
 * @param triggerType 触发类型 (SCHEDULED / MANUAL)
 * @return 更新结果
 */
CampStatusUpdateResultVO executeStatusUpdate(String triggerType);
```

---

### Task 5: 实现状态更新逻辑

**文件**: `backend/src/main/java/com/yian/camp/service/impl/CampServiceImpl.java`

添加以下实现：

```java
@Override
@Transactional
public CampStatusUpdateResultVO executeStatusUpdate(String triggerType) {
    LocalDate today = LocalDate.now();
    int enrollingToOngoing = 0;
    int ongoingToEnded = 0;

    // 1. 处理 enrolling → ongoing
    List<Long> toOngoingIds = campMapper.selectCampsToStartOngoing(today);
    if (!toOngoingIds.isEmpty()) {
        campMapper.batchUpdateStatus(toOngoingIds, CampStatus.ONGOING.getValue());
        enrollingToOngoing = toOngoingIds.size();

        // 记录状态变更日志
        for (Long campId : toOngoingIds) {
            logStatusChange(campId, CampStatus.ENROLLING, CampStatus.ONGOING,
                    "定时任务自动更新", "SYSTEM", "系统");
        }

        log.info("训练营状态自动更新 enrolling → ongoing: {} 个", enrollingToOngoing);
    }

    // 2. 处理 ongoing → ended
    List<Long> toEndedIds = campMapper.selectCampsToEnd(today);
    if (!toEndedIds.isEmpty()) {
        campMapper.batchUpdateStatus(toEndedIds, CampStatus.ENDED.getValue());
        ongoingToEnded = toEndedIds.size();

        // 记录状态变更日志
        for (Long campId : toEndedIds) {
            logStatusChange(campId, CampStatus.ONGOING, CampStatus.ENDED,
                    "定时任务自动更新", "SYSTEM", "系统");
        }

        log.info("训练营状态自动更新 ongoing → ended: {} 个", ongoingToEnded);
    }

    int totalUpdated = enrollingToOngoing + ongoingToEnded;
    log.info("训练营状态自动更新完成: enrollingToOngoing={}, ongoingToEnded={}, total={}",
            enrollingToOngoing, ongoingToEnded, totalUpdated);

    return CampStatusUpdateResultVO.builder()
            .enrollingToOngoing(enrollingToOngoing)
            .ongoingToEnded(ongoingToEnded)
            .totalUpdated(totalUpdated)
            .executedAt(LocalDateTime.now())
            .triggerType(triggerType)
            .build();
}

/**
 * 记录状态变更日志（重载方法，支持指定操作人）
 */
private void logStatusChange(Long campId, CampStatus fromStatus, CampStatus toStatus,
                             String reason, String operatorId, String operatorName) {
    CampStatusLog statusLog = new CampStatusLog();
    statusLog.setCampId(campId);
    statusLog.setFromStatus(fromStatus.getValue());
    statusLog.setToStatus(toStatus.getValue());
    statusLog.setReason(reason);
    statusLog.setOperatorId(operatorId != null ? Long.parseLong(operatorId.replace("SYSTEM", "0")) : null);
    statusLog.setOperatorName(operatorName);
    campStatusLogMapper.insert(statusLog);
}
```

修改现有的 `logStatusChange` 方法：

```java
/**
 * 记录状态变更日志（从 SecurityContext 获取当前用户）
 */
private void logStatusChange(Long campId, CampStatus fromStatus, CampStatus toStatus, String reason) {
    String operatorId = null;
    String operatorName = null;

    // 尝试从 SecurityContext 获取当前用户
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && auth.getPrincipal() instanceof SystemUser user) {
        operatorId = user.getId().toString();
        operatorName = user.getRealName();
    }

    logStatusChange(campId, fromStatus, toStatus, reason, operatorId, operatorName);
}
```

需要添加导入：

```java
import com.yian.camp.vo.CampStatusUpdateResultVO;
import org.springframework.security.core.Authentication;
```

---

### Task 6: 创建定时任务类

**文件**: `backend/src/main/java/com/yian/camp/schedule/CampStatusUpdateTask.java`

```java
package com.yian.camp.schedule;

import com.yian.camp.service.CampService;
import com.yian.camp.vo.CampStatusUpdateResultVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class CampStatusUpdateTask {

    private final CampService campService;

    /**
     * 每天 00:05 自动更新训练营状态
     * - enrolling → ongoing (到达开始日期)
     * - ongoing → ended (超过结束日期)
     */
    @Scheduled(cron = "0 5 0 * * ?", zone = "Asia/Shanghai")
    public void updateCampStatus() {
        log.info("===== 开始执行训练营状态自动更新任务 =====");

        try {
            CampStatusUpdateResultVO result = campService.executeStatusUpdate("SCHEDULED");

            log.info("===== 训练营状态自动更新任务完成 ===== " +
                            "enrollingToOngoing={}, ongoingToEnded={}, total={}",
                    result.getEnrollingToOngoing(),
                    result.getOngoingToEnded(),
                    result.getTotalUpdated());

        } catch (Exception e) {
            log.error("===== 训练营状态自动更新任务失败 =====", e);
            // 不抛出异常，避免影响其他定时任务
        }
    }
}
```

---

### Task 7: 创建手动触发接口

**文件**: `backend/src/main/java/com/yian/camp/controller/admin/CampController.java`

添加以下接口：

```java
@Operation(summary = "手动触发状态更新", description = "手动触发训练营状态自动更新任务")
@PostMapping("/trigger-status-update")
public Result<CampStatusUpdateResultVO> triggerStatusUpdate() {
    log.info("手动触发训练营状态更新");
    CampStatusUpdateResultVO result = campService.executeStatusUpdate("MANUAL");
    return Result.success(result);
}
```

需要添加导入：

```java
import com.yian.camp.vo.CampStatusUpdateResultVO;
```

---

### Task 8: 修改 CampStatusLog 实体

**目标**: 调整 operatorId 类型以支持 "SYSTEM"

**文件**: `backend/src/main/java/com/yian/camp/entity/CampStatusLog.java`

修改 operatorId 字段：

```java
/**
 * 操作人ID (系统自动更新时为 0)
 */
private Long operatorId;
```

---

### Task 9: 创建单元测试

**文件**: `backend/src/test/java/com/yian/camp/CampStatusUpdateTest.java`

```java
package com.yian.camp;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yian.camp.dto.LoginDTO;
import com.yian.camp.entity.TrainingCamp;
import com.yian.camp.enums.CampStatus;
import com.yian.camp.mapper.CampMapper;
import com.yian.camp.service.CampService;
import com.yian.camp.vo.CampStatusUpdateResultVO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class CampStatusUpdateTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CampMapper campMapper;

    @Autowired
    private CampService campService;

    private String token;

    @BeforeEach
    void setUp() throws Exception {
        // 登录获取 Token
        LoginDTO loginDTO = new LoginDTO();
        loginDTO.setUsername("admin");
        loginDTO.setPassword("admin123");

        MvcResult result = mockMvc.perform(post("/api/admin/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginDTO)))
                .andReturn();

        String response = result.getResponse().getContentAsString();
        token = objectMapper.readTree(response).get("data").get("token").asText();
    }

    @Test
    void testEnrollingToOngoing() {
        // 创建报名中且已到开始日期的训练营
        TrainingCamp camp = createCamp(CampStatus.ENROLLING);
        camp.setStartDate(LocalDate.now().minusDays(1)); // 昨天开始
        camp.setEndDate(LocalDate.now().plusDays(20));
        campMapper.insert(camp);

        // 执行状态更新
        CampStatusUpdateResultVO result = campService.executeStatusUpdate("TEST");

        // 验证结果
        assertTrue(result.getEnrollingToOngoing() >= 1);

        // 验证数据库状态
        TrainingCamp updated = campMapper.selectById(camp.getId());
        assertEquals(CampStatus.ONGOING, updated.getStatus());
    }

    @Test
    void testOngoingToEnded() {
        // 创建进行中且已过结束日期的训练营
        TrainingCamp camp = createCamp(CampStatus.ONGOING);
        camp.setStartDate(LocalDate.now().minusDays(30));
        camp.setEndDate(LocalDate.now().minusDays(1)); // 昨天结束
        campMapper.insert(camp);

        // 执行状态更新
        CampStatusUpdateResultVO result = campService.executeStatusUpdate("TEST");

        // 验证结果
        assertTrue(result.getOngoingToEnded() >= 1);

        // 验证数据库状态
        TrainingCamp updated = campMapper.selectById(camp.getId());
        assertEquals(CampStatus.ENDED, updated.getStatus());
    }

    @Test
    void testEnrollingNotStartedYet() {
        // 创建报名中但未到开始日期的训练营
        TrainingCamp camp = createCamp(CampStatus.ENROLLING);
        camp.setStartDate(LocalDate.now().plusDays(7)); // 7天后开始
        camp.setEndDate(LocalDate.now().plusDays(28));
        campMapper.insert(camp);

        Long campId = camp.getId();

        // 执行状态更新
        campService.executeStatusUpdate("TEST");

        // 验证状态未变
        TrainingCamp updated = campMapper.selectById(campId);
        assertEquals(CampStatus.ENROLLING, updated.getStatus());
    }

    @Test
    void testDraftNotAutoUpdated() {
        // 创建草稿状态且已到开始日期的训练营
        TrainingCamp camp = createCamp(CampStatus.DRAFT);
        camp.setStartDate(LocalDate.now().minusDays(1));
        camp.setEndDate(LocalDate.now().plusDays(20));
        campMapper.insert(camp);

        Long campId = camp.getId();

        // 执行状态更新
        campService.executeStatusUpdate("TEST");

        // 验证状态未变
        TrainingCamp updated = campMapper.selectById(campId);
        assertEquals(CampStatus.DRAFT, updated.getStatus());
    }

    @Test
    void testManualTriggerApi() throws Exception {
        // 创建需要更新的训练营
        TrainingCamp camp = createCamp(CampStatus.ENROLLING);
        camp.setStartDate(LocalDate.now().minusDays(1));
        camp.setEndDate(LocalDate.now().plusDays(20));
        campMapper.insert(camp);

        // 调用手动触发接口
        mockMvc.perform(post("/api/admin/camps/trigger-status-update")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.triggerType").value("MANUAL"))
                .andExpect(jsonPath("$.data.totalUpdated").isNumber());
    }

    @Test
    void testBatchUpdate() {
        // 创建多个需要更新的训练营
        for (int i = 0; i < 3; i++) {
            TrainingCamp camp = createCamp(CampStatus.ENROLLING);
            camp.setName("批量测试训练营-" + i + "-" + System.currentTimeMillis());
            camp.setStartDate(LocalDate.now().minusDays(1));
            camp.setEndDate(LocalDate.now().plusDays(20));
            campMapper.insert(camp);
        }

        for (int i = 0; i < 2; i++) {
            TrainingCamp camp = createCamp(CampStatus.ONGOING);
            camp.setName("批量测试训练营-ended-" + i + "-" + System.currentTimeMillis());
            camp.setStartDate(LocalDate.now().minusDays(30));
            camp.setEndDate(LocalDate.now().minusDays(1));
            campMapper.insert(camp);
        }

        // 执行状态更新
        CampStatusUpdateResultVO result = campService.executeStatusUpdate("TEST");

        // 验证结果
        assertTrue(result.getEnrollingToOngoing() >= 3);
        assertTrue(result.getOngoingToEnded() >= 2);
        assertTrue(result.getTotalUpdated() >= 5);
    }

    /**
     * 创建测试训练营
     */
    private TrainingCamp createCamp(CampStatus status) {
        TrainingCamp camp = new TrainingCamp();
        camp.setName("状态更新测试训练营-" + System.currentTimeMillis());
        camp.setPosterUrl("https://cdn.example.com/poster.jpg");
        camp.setDeposit(new BigDecimal("99.00"));
        camp.setStartDate(LocalDate.now().plusDays(7));
        camp.setEndDate(LocalDate.now().plusDays(28));
        camp.setTotalDays(21);
        camp.setRequiredDays(15);
        camp.setGroupQrcodeUrl("https://cdn.example.com/qrcode.jpg");
        camp.setPlanetProjectId("15555411412112");
        camp.setStatus(status);
        camp.setMemberCount(0);
        camp.setPaidAmount(BigDecimal.ZERO);
        camp.setRefundedAmount(BigDecimal.ZERO);
        return camp;
    }
}
```

---

## 目录结构

```
backend/src/main/java/com/yian/camp/
├── CampApplication.java              # 添加 @EnableScheduling
├── common/
│   └── Result.java
├── config/
│   ├── Knife4jConfig.java
│   ├── JwtProperties.java
│   ├── SecurityConfig.java
│   ├── MyBatisPlusConfig.java
│   └── H5Properties.java
├── controller/
│   └── admin/
│       ├── AuthController.java
│       └── CampController.java       # 新增手动触发接口
├── dto/
│   └── ...
├── entity/
│   ├── SystemUser.java
│   ├── TrainingCamp.java
│   └── CampStatusLog.java
├── enums/
│   └── CampStatus.java
├── exception/
│   └── ...
├── filter/
│   └── JwtAuthenticationFilter.java
├── mapper/
│   ├── SystemUserMapper.java
│   ├── CampMapper.java               # 新增批量更新方法
│   └── CampStatusLogMapper.java
├── schedule/                         # 新增目录
│   └── CampStatusUpdateTask.java     # 新增
├── service/
│   ├── AuthService.java
│   ├── CampService.java              # 扩展
│   └── impl/
│       ├── AuthServiceImpl.java
│       └── CampServiceImpl.java      # 扩展
├── util/
│   └── JwtUtil.java
└── vo/
    ├── LoginVO.java
    ├── UserInfoVO.java
    ├── CampVO.java
    ├── CampListVO.java
    ├── CampPublishInfoVO.java
    └── CampStatusUpdateResultVO.java # 新增
```

---

## 架构合规要求

### 必须遵守

- [x] 定时任务使用 Spring Scheduler
- [x] 状态变更记录到 camp_status_log
- [x] 系统自动操作标记为 "SYSTEM"
- [x] 批量操作使用单次事务
- [x] 异常不影响其他定时任务
- [x] 使用 Slf4j 记录详细日志

### 禁止事项

- 在定时任务中抛出未捕获的异常
- 使用硬编码的状态值
- 跳过状态日志记录
- 在单个循环中逐条更新（应批量处理）

---

## 验证检查清单

### 编译验证
```bash
cd backend && ./gradlew compileJava
# 预期: BUILD SUCCESSFUL
```

### 启动验证
```bash
cd backend && ./gradlew bootRun
# 预期: Started CampApplication
# 并且日志不显示定时任务立即执行（需等到 00:05）
```

### 手动触发测试
```bash
# 登录获取 Token
TOKEN=$(curl -s -X POST http://localhost:8080/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.data.token')

# 手动触发状态更新
curl -X POST http://localhost:8080/api/admin/camps/trigger-status-update \
  -H "Authorization: Bearer $TOKEN"
# 预期: {"code":200,"data":{"enrollingToOngoing":0,"ongoingToEnded":0,"totalUpdated":0,"triggerType":"MANUAL"}}
```

### 单元测试
```bash
cd backend && ./gradlew test --tests "*CampStatusUpdateTest*"
# 预期: BUILD SUCCESSFUL
```

### 定时任务日志验证
```bash
# 等待到 00:05 或调整 cron 表达式进行测试
# 预期日志:
# ===== 开始执行训练营状态自动更新任务 =====
# 训练营状态自动更新完成: enrollingToOngoing=X, ongoingToEnded=Y
# ===== 训练营状态自动更新任务完成 =====
```

---

## 相关文档

| 文档 | 路径 | 说明 |
|------|------|------|
| API 设计规范 | `docs/v1/design/API设计规范.md` | RESTful 规范 |
| 数据库设计 | `docs/v1/design/数据库设计.md` | training_camp, camp_status_log 表结构 |
| 状态枚举定义 | `docs/v1/design/状态枚举定义.md` | camp_status SSOT |
| Epic 详情 | `docs/epics.md` | EP01-S05 详细描述 |

---

## 完成标准

- [ ] `./gradlew compileJava` 编译成功
- [ ] 启用 @EnableScheduling
- [ ] 定时任务每天 00:05 执行
- [ ] enrolling → ongoing 自动流转正常
- [ ] ongoing → ended 自动流转正常
- [ ] draft/pending 状态不被自动更新
- [ ] 状态变更记录到 camp_status_log
- [ ] 手动触发接口正常工作
- [ ] 单元测试通过
- [ ] 异常情况有完整日志

---

**创建时间**: 2025-12-13
**创建者**: Claude (create-story workflow)
**Epic**: EP01 - 基础框架与训练营管理
