# Story 1-4: 训练营发布与报名链接生成

| 属性 | 值 |
|------|-----|
| **Story ID** | 1-4-camp-publish |
| **Epic** | EP01 - 基础框架与训练营管理 |
| **Story Points** | 3 |
| **优先级** | P0 |
| **前置依赖** | 1-3-camp-crud |
| **状态** | drafted |

---

## 用户故事

**作为** 管理员
**我需要** 发布训练营并获取H5报名链接和二维码
**以便** 会员可以通过链接访问报名页面

---

## 验收标准 (BDD)

```gherkin
Feature: 训练营发布

  Background:
    Given 管理员已登录

  Scenario: 发布草稿状态训练营
    Given 存在状态为 draft 且信息完整的训练营
    When POST /api/admin/camps/{id}/publish
    Then 返回 200 OK
    And 训练营状态变为 pending
    And 记录状态变更日志

  Scenario: 确认发布待发布状态训练营
    Given 存在状态为 pending 的训练营
    When POST /api/admin/camps/{id}/confirm-publish
    Then 返回 200 OK
    And 训练营状态变为 enrolling
    And 返回 enrollUrl (H5报名链接)
    And enrollUrl 格式为 https://{domain}/enroll/{campId}
    And 记录状态变更日志

  Scenario: 发布失败 - 缺少训练营名称
    Given 存在状态为 draft 但缺少 name 的训练营
    When POST /api/admin/camps/{id}/publish
    Then 返回 400 Bad Request
    And 错误码为 1110 (CAMP_INCOMPLETE)
    And 错误信息包含 "缺少必填项: 训练营名称"

  Scenario: 发布失败 - 缺少海报
    Given 存在状态为 draft 但缺少 posterUrl 的训练营
    When POST /api/admin/camps/{id}/publish
    Then 返回 400 Bad Request
    And 错误码为 1110 (CAMP_INCOMPLETE)
    And 错误信息包含 "缺少必填项: 海报"

  Scenario: 发布失败 - 缺少押金金额
    Given 存在状态为 draft 但 deposit 为空的训练营
    When POST /api/admin/camps/{id}/publish
    Then 返回 400 Bad Request
    And 错误码为 1110 (CAMP_INCOMPLETE)
    And 错误信息包含 "缺少必填项: 押金金额"

  Scenario: 发布失败 - 缺少开始日期
    Given 存在状态为 draft 但缺少 startDate 的训练营
    When POST /api/admin/camps/{id}/publish
    Then 返回 400 Bad Request
    And 错误码为 1110 (CAMP_INCOMPLETE)
    And 错误信息包含 "缺少必填项: 开始日期"

  Scenario: 发布失败 - 缺少结束日期
    Given 存在状态为 draft 但缺少 endDate 的训练营
    When POST /api/admin/camps/{id}/publish
    Then 返回 400 Bad Request
    And 错误码为 1110 (CAMP_INCOMPLETE)
    And 错误信息包含 "缺少必填项: 结束日期"

  Scenario: 发布失败 - 缺少打卡要求
    Given 存在状态为 draft 但缺少 requiredDays 的训练营
    When POST /api/admin/camps/{id}/publish
    Then 返回 400 Bad Request
    And 错误码为 1110 (CAMP_INCOMPLETE)
    And 错误信息包含 "缺少必填项: 打卡要求"

  Scenario: 发布失败 - 缺少群二维码
    Given 存在状态为 draft 但缺少 groupQrcodeUrl 的训练营
    When POST /api/admin/camps/{id}/publish
    Then 返回 400 Bad Request
    And 错误码为 1110 (CAMP_INCOMPLETE)
    And 错误信息包含 "缺少必填项: 群二维码"

  Scenario: 发布失败 - 缺少知识星球项目ID
    Given 存在状态为 draft 但缺少 planetProjectId 的训练营
    When POST /api/admin/camps/{id}/publish
    Then 返回 400 Bad Request
    And 错误码为 1110 (CAMP_INCOMPLETE)
    And 错误信息包含 "缺少必填项: 知识星球项目ID"

  Scenario: 发布失败 - 开始日期已过
    Given 存在状态为 draft 且 startDate < 今天 的训练营
    When POST /api/admin/camps/{id}/publish
    Then 返回 400 Bad Request
    And 错误码为 1111 (CAMP_START_DATE_PASSED)
    And 错误信息为 "开始日期已过，无法发布"

  Scenario: 发布失败 - 状态不允许
    Given 存在状态为 ongoing 的训练营
    When POST /api/admin/camps/{id}/publish
    Then 返回 400 Bad Request
    And 错误码为 1112 (CAMP_CANNOT_PUBLISH)
    And 错误信息为 "当前状态不允许发布"

  Scenario: 发布失败 - 训练营不存在
    Given 不存在 ID 为 99999 的训练营
    When POST /api/admin/camps/99999/publish
    Then 返回 404 Not Found
    And 错误码为 1101 (CAMP_NOT_FOUND)

  Scenario: 获取训练营发布信息
    Given 存在状态为 enrolling 的训练营
    When GET /api/admin/camps/{id}/publish-info
    Then 返回 200 OK
    And 返回 enrollUrl
    And 返回 dynamicQrcodeUrl

  Scenario: 获取未发布训练营的发布信息
    Given 存在状态为 draft 的训练营
    When GET /api/admin/camps/{id}/publish-info
    Then 返回 400 Bad Request
    And 错误码为 1113 (CAMP_NOT_PUBLISHED)
    And 错误信息为 "训练营尚未发布"
```

---

## 技术上下文

### 技术栈要求

| 组件 | 版本 | 说明 |
|------|------|------|
| Spring Boot | 3.2+ | 主框架 |
| MyBatis Plus | 3.5+ | ORM |
| PostgreSQL | 15+ | 数据库 |

### 发布校验清单

发布训练营需要校验以下必填字段：

| 字段 | 说明 | 校验规则 |
|------|------|---------|
| name | 训练营名称 | 非空 |
| posterUrl | 海报URL | 非空 |
| deposit | 押金金额 | 非空且 > 0 |
| startDate | 开始日期 | 非空且 >= 今天 |
| endDate | 结束日期 | 非空且 > startDate |
| requiredDays | 打卡要求天数 | 非空且 > 0 |
| groupQrcodeUrl | 群二维码URL | 非空 |
| planetProjectId | 知识星球项目ID | 非空 |

### 状态流转

> 引用：`docs/v1/design/状态枚举定义.md#5-camp_status`

```
draft → pending (发布审核)
pending → enrolling (确认发布，生成报名链接)
pending → draft (撤回，见 Story 1-8)
```

### 报名链接格式

- **enrollUrl**: `https://{H5_DOMAIN}/enroll/{campId}`
- **dynamicQrcodeUrl**: `https://{H5_DOMAIN}/enroll/{campId}?source=qrcode`

其中 `H5_DOMAIN` 通过配置文件指定。

### 错误码定义

| 错误码 | HTTP 状态码 | 错误信息 | 说明 |
|--------|------------|----------|------|
| 1101 | 404 | 训练营不存在 | ID无效或已删除 |
| 1110 | 400 | 缺少必填项: {字段} | 发布校验失败 |
| 1111 | 400 | 开始日期已过，无法发布 | startDate < 今天 |
| 1112 | 400 | 当前状态不允许发布 | 非 draft/pending 状态 |
| 1113 | 400 | 训练营尚未发布 | 获取发布信息时未发布 |

---

## 实现任务清单

### Task 1: 添加配置项

**目标**: 添加 H5 域名配置

**文件**: `backend/src/main/resources/application.yml`

```yaml
# H5 配置
h5:
  domain: ${H5_DOMAIN:https://h5.example.com}
```

**文件**: `backend/src/main/java/com/yian/camp/config/H5Properties.java`

```java
package com.yian.camp.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "h5")
public class H5Properties {

    private String domain = "https://h5.example.com";

    /**
     * 生成报名链接
     */
    public String generateEnrollUrl(Long campId) {
        return String.format("%s/enroll/%d", domain, campId);
    }

    /**
     * 生成动态二维码链接
     */
    public String generateDynamicQrcodeUrl(Long campId) {
        return String.format("%s/enroll/%d?source=qrcode", domain, campId);
    }
}
```

---

### Task 2: 扩展 BusinessException

**目标**: 添加发布相关异常

**文件**: `backend/src/main/java/com/yian/camp/exception/BusinessException.java`

在现有 BusinessException 类中添加：

```java
// ========== 训练营发布相关异常 ==========

public static BusinessException campIncomplete(String missingField) {
    return new BusinessException(1110, "缺少必填项: " + missingField);
}

public static BusinessException campStartDatePassed() {
    return new BusinessException(1111, "开始日期已过，无法发布");
}

public static BusinessException campCannotPublish() {
    return new BusinessException(1112, "当前状态不允许发布");
}

public static BusinessException campNotPublished() {
    return new BusinessException(1113, "训练营尚未发布");
}
```

---

### Task 3: 创建发布相关 VO

**文件**: `backend/src/main/java/com/yian/camp/vo/CampPublishInfoVO.java`

```java
package com.yian.camp.vo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CampPublishInfoVO {

    /**
     * 训练营ID
     */
    private Long campId;

    /**
     * H5报名链接
     */
    private String enrollUrl;

    /**
     * 动态二维码链接（前端用于生成二维码）
     */
    private String dynamicQrcodeUrl;

    /**
     * 训练营状态
     */
    private String status;

    /**
     * 状态描述
     */
    private String statusDesc;
}
```

---

### Task 4: 创建状态日志实体和 Mapper

**文件**: `backend/src/main/java/com/yian/camp/entity/CampStatusLog.java`

```java
package com.yian.camp.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("camp_status_log")
public class CampStatusLog {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 训练营ID
     */
    private Long campId;

    /**
     * 原状态
     */
    private String fromStatus;

    /**
     * 新状态
     */
    private String toStatus;

    /**
     * 变更原因
     */
    private String reason;

    /**
     * 操作人ID
     */
    private Long operatorId;

    /**
     * 操作人姓名
     */
    private String operatorName;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
```

**文件**: `backend/src/main/java/com/yian/camp/mapper/CampStatusLogMapper.java`

```java
package com.yian.camp.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yian.camp.entity.CampStatusLog;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CampStatusLogMapper extends BaseMapper<CampStatusLog> {
}
```

---

### Task 5: 扩展 CampStatus 枚举

**目标**: 添加发布相关方法

**文件**: `backend/src/main/java/com/yian/camp/enums/CampStatus.java`

在现有枚举中添加方法：

```java
/**
 * 判断是否可以发布
 */
public boolean canPublish() {
    return this == DRAFT;
}

/**
 * 判断是否可以确认发布
 */
public boolean canConfirmPublish() {
    return this == PENDING;
}

/**
 * 判断是否已发布（有报名链接）
 */
public boolean isPublished() {
    return this == ENROLLING || this == ONGOING || this == ENDED || this == SETTLING || this == ARCHIVED;
}
```

---

### Task 6: 扩展 CampService 接口

**文件**: `backend/src/main/java/com/yian/camp/service/CampService.java`

添加以下方法：

```java
/**
 * 发布训练营（进入待发布状态）
 */
CampVO publishCamp(Long id);

/**
 * 确认发布训练营（生成报名链接）
 */
CampPublishInfoVO confirmPublishCamp(Long id);

/**
 * 获取训练营发布信息
 */
CampPublishInfoVO getPublishInfo(Long id);
```

---

### Task 7: 实现发布逻辑

**文件**: `backend/src/main/java/com/yian/camp/service/impl/CampServiceImpl.java`

添加以下实现：

```java
@Autowired
private H5Properties h5Properties;

@Autowired
private CampStatusLogMapper campStatusLogMapper;

@Override
@Transactional
public CampVO publishCamp(Long id) {
    // 1. 查询训练营
    TrainingCamp camp = campMapper.selectById(id);
    if (camp == null) {
        throw BusinessException.campNotFound();
    }

    // 2. 检查状态
    if (!camp.getStatus().canPublish()) {
        throw BusinessException.campCannotPublish();
    }

    // 3. 校验必填字段
    validateCampForPublish(camp);

    // 4. 检查开始日期
    if (camp.getStartDate().isBefore(LocalDate.now())) {
        throw BusinessException.campStartDatePassed();
    }

    // 5. 更新状态
    CampStatus fromStatus = camp.getStatus();
    camp.setStatus(CampStatus.PENDING);
    campMapper.updateById(camp);

    // 6. 记录状态日志
    logStatusChange(camp.getId(), fromStatus, CampStatus.PENDING, "发布审核");

    log.info("训练营发布审核: id={}, name={}", camp.getId(), camp.getName());

    return CampVO.fromEntity(camp);
}

@Override
@Transactional
public CampPublishInfoVO confirmPublishCamp(Long id) {
    // 1. 查询训练营
    TrainingCamp camp = campMapper.selectById(id);
    if (camp == null) {
        throw BusinessException.campNotFound();
    }

    // 2. 检查状态
    if (!camp.getStatus().canConfirmPublish()) {
        throw BusinessException.campCannotPublish();
    }

    // 3. 生成报名链接
    String enrollUrl = h5Properties.generateEnrollUrl(camp.getId());

    // 4. 更新状态和链接
    CampStatus fromStatus = camp.getStatus();
    camp.setStatus(CampStatus.ENROLLING);
    camp.setEnrollUrl(enrollUrl);
    campMapper.updateById(camp);

    // 5. 记录状态日志
    logStatusChange(camp.getId(), fromStatus, CampStatus.ENROLLING, "确认发布");

    log.info("训练营确认发布: id={}, name={}, enrollUrl={}", camp.getId(), camp.getName(), enrollUrl);

    return CampPublishInfoVO.builder()
            .campId(camp.getId())
            .enrollUrl(enrollUrl)
            .dynamicQrcodeUrl(h5Properties.generateDynamicQrcodeUrl(camp.getId()))
            .status(camp.getStatus().getValue())
            .statusDesc(camp.getStatus().getDescription())
            .build();
}

@Override
public CampPublishInfoVO getPublishInfo(Long id) {
    // 1. 查询训练营
    TrainingCamp camp = campMapper.selectById(id);
    if (camp == null) {
        throw BusinessException.campNotFound();
    }

    // 2. 检查是否已发布
    if (!camp.getStatus().isPublished()) {
        throw BusinessException.campNotPublished();
    }

    return CampPublishInfoVO.builder()
            .campId(camp.getId())
            .enrollUrl(camp.getEnrollUrl())
            .dynamicQrcodeUrl(h5Properties.generateDynamicQrcodeUrl(camp.getId()))
            .status(camp.getStatus().getValue())
            .statusDesc(camp.getStatus().getDescription())
            .build();
}

/**
 * 校验训练营发布必填字段
 */
private void validateCampForPublish(TrainingCamp camp) {
    List<String> missingFields = new ArrayList<>();

    if (!StringUtils.hasText(camp.getName())) {
        missingFields.add("训练营名称");
    }
    if (!StringUtils.hasText(camp.getPosterUrl())) {
        missingFields.add("海报");
    }
    if (camp.getDeposit() == null || camp.getDeposit().compareTo(BigDecimal.ZERO) <= 0) {
        missingFields.add("押金金额");
    }
    if (camp.getStartDate() == null) {
        missingFields.add("开始日期");
    }
    if (camp.getEndDate() == null) {
        missingFields.add("结束日期");
    }
    if (camp.getRequiredDays() == null || camp.getRequiredDays() <= 0) {
        missingFields.add("打卡要求");
    }
    if (!StringUtils.hasText(camp.getGroupQrcodeUrl())) {
        missingFields.add("群二维码");
    }
    if (!StringUtils.hasText(camp.getPlanetProjectId())) {
        missingFields.add("知识星球项目ID");
    }

    if (!missingFields.isEmpty()) {
        throw BusinessException.campIncomplete(String.join(", ", missingFields));
    }
}

/**
 * 记录状态变更日志
 */
private void logStatusChange(Long campId, CampStatus fromStatus, CampStatus toStatus, String reason) {
    CampStatusLog log = new CampStatusLog();
    log.setCampId(campId);
    log.setFromStatus(fromStatus.getValue());
    log.setToStatus(toStatus.getValue());
    log.setReason(reason);
    // TODO: 从 SecurityContext 获取当前操作人
    // log.setOperatorId(getCurrentUserId());
    // log.setOperatorName(getCurrentUserName());
    campStatusLogMapper.insert(log);
}
```

需要在类顶部添加导入：

```java
import com.yian.camp.config.H5Properties;
import com.yian.camp.entity.CampStatusLog;
import com.yian.camp.mapper.CampStatusLogMapper;
import com.yian.camp.vo.CampPublishInfoVO;
import org.springframework.util.StringUtils;
import java.util.ArrayList;
import java.util.List;
```

---

### Task 8: 创建发布接口

**文件**: `backend/src/main/java/com/yian/camp/controller/admin/CampController.java`

添加以下接口：

```java
@Operation(summary = "发布训练营", description = "将草稿状态的训练营提交发布审核")
@PostMapping("/{id}/publish")
public Result<CampVO> publishCamp(@PathVariable Long id) {
    CampVO camp = campService.publishCamp(id);
    return Result.success(camp);
}

@Operation(summary = "确认发布", description = "确认发布待发布状态的训练营，生成报名链接")
@PostMapping("/{id}/confirm-publish")
public Result<CampPublishInfoVO> confirmPublishCamp(@PathVariable Long id) {
    CampPublishInfoVO publishInfo = campService.confirmPublishCamp(id);
    return Result.success(publishInfo);
}

@Operation(summary = "获取发布信息", description = "获取已发布训练营的报名链接等信息")
@GetMapping("/{id}/publish-info")
public Result<CampPublishInfoVO> getPublishInfo(@PathVariable Long id) {
    CampPublishInfoVO publishInfo = campService.getPublishInfo(id);
    return Result.success(publishInfo);
}
```

需要添加导入：

```java
import com.yian.camp.vo.CampPublishInfoVO;
```

---

### Task 9: 创建单元测试

**文件**: `backend/src/test/java/com/yian/camp/CampPublishTest.java`

```java
package com.yian.camp;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yian.camp.dto.LoginDTO;
import com.yian.camp.entity.TrainingCamp;
import com.yian.camp.enums.CampStatus;
import com.yian.camp.mapper.CampMapper;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class CampPublishTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CampMapper campMapper;

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
    void testPublishCompleteCamp() throws Exception {
        // 创建完整的草稿训练营
        TrainingCamp camp = createCompleteCamp(CampStatus.DRAFT);
        campMapper.insert(camp);

        mockMvc.perform(post("/api/admin/camps/" + camp.getId() + "/publish")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.status").value("pending"));
    }

    @Test
    void testPublishIncompleteCamp() throws Exception {
        // 创建不完整的草稿训练营（缺少群二维码）
        TrainingCamp camp = createCompleteCamp(CampStatus.DRAFT);
        camp.setGroupQrcodeUrl(null);
        campMapper.insert(camp);

        mockMvc.perform(post("/api/admin/camps/" + camp.getId() + "/publish")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(1110))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("群二维码")));
    }

    @Test
    void testPublishCampWithPastStartDate() throws Exception {
        // 创建开始日期已过的训练营
        TrainingCamp camp = createCompleteCamp(CampStatus.DRAFT);
        camp.setStartDate(LocalDate.now().minusDays(1));
        campMapper.insert(camp);

        mockMvc.perform(post("/api/admin/camps/" + camp.getId() + "/publish")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(1111));
    }

    @Test
    void testPublishOngoingCamp() throws Exception {
        // 创建进行中的训练营（不允许发布）
        TrainingCamp camp = createCompleteCamp(CampStatus.ONGOING);
        campMapper.insert(camp);

        mockMvc.perform(post("/api/admin/camps/" + camp.getId() + "/publish")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(1112));
    }

    @Test
    void testConfirmPublishPendingCamp() throws Exception {
        // 创建待发布的训练营
        TrainingCamp camp = createCompleteCamp(CampStatus.PENDING);
        campMapper.insert(camp);

        mockMvc.perform(post("/api/admin/camps/" + camp.getId() + "/confirm-publish")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.status").value("enrolling"))
                .andExpect(jsonPath("$.data.enrollUrl").exists());
    }

    @Test
    void testConfirmPublishDraftCamp() throws Exception {
        // 创建草稿训练营（不允许直接确认发布）
        TrainingCamp camp = createCompleteCamp(CampStatus.DRAFT);
        campMapper.insert(camp);

        mockMvc.perform(post("/api/admin/camps/" + camp.getId() + "/confirm-publish")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(1112));
    }

    @Test
    void testGetPublishInfoForEnrollingCamp() throws Exception {
        // 创建报名中的训练营
        TrainingCamp camp = createCompleteCamp(CampStatus.ENROLLING);
        camp.setEnrollUrl("https://h5.example.com/enroll/" + System.currentTimeMillis());
        campMapper.insert(camp);

        mockMvc.perform(get("/api/admin/camps/" + camp.getId() + "/publish-info")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.enrollUrl").exists())
                .andExpect(jsonPath("$.data.dynamicQrcodeUrl").exists());
    }

    @Test
    void testGetPublishInfoForDraftCamp() throws Exception {
        // 创建草稿训练营（未发布）
        TrainingCamp camp = createCompleteCamp(CampStatus.DRAFT);
        campMapper.insert(camp);

        mockMvc.perform(get("/api/admin/camps/" + camp.getId() + "/publish-info")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(1113));
    }

    @Test
    void testPublishNonExistentCamp() throws Exception {
        mockMvc.perform(post("/api/admin/camps/99999/publish")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(1101));
    }

    /**
     * 创建完整的测试训练营
     */
    private TrainingCamp createCompleteCamp(CampStatus status) {
        TrainingCamp camp = new TrainingCamp();
        camp.setName("测试训练营-" + System.currentTimeMillis());
        camp.setPosterUrl("https://cdn.example.com/poster.jpg");
        camp.setDescription("这是一个测试训练营");
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
├── CampApplication.java
├── common/
│   └── Result.java
├── config/
│   ├── Knife4jConfig.java
│   ├── JwtProperties.java
│   ├── SecurityConfig.java
│   ├── MyBatisPlusConfig.java
│   └── H5Properties.java            # 新增
├── controller/
│   └── admin/
│       ├── AuthController.java
│       └── CampController.java       # 新增发布接口
├── dto/
│   ├── LoginDTO.java
│   ├── CampCreateDTO.java
│   ├── CampUpdateDTO.java
│   └── CampQueryDTO.java
├── entity/
│   ├── SystemUser.java
│   ├── TrainingCamp.java
│   └── CampStatusLog.java            # 新增
├── enums/
│   └── CampStatus.java               # 扩展
├── exception/
│   ├── AuthException.java
│   ├── BusinessException.java        # 扩展
│   └── GlobalExceptionHandler.java
├── filter/
│   └── JwtAuthenticationFilter.java
├── mapper/
│   ├── SystemUserMapper.java
│   ├── CampMapper.java
│   └── CampStatusLogMapper.java      # 新增
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
    └── CampPublishInfoVO.java        # 新增
```

---

## 架构合规要求

### 必须遵守

- [x] 发布前校验所有必填字段
- [x] 状态变更记录到 camp_status_log
- [x] 使用配置文件管理 H5 域名
- [x] 日志记录关键操作
- [x] 遵循状态机流转规则

### 禁止事项

- 跳过发布校验直接修改状态
- 硬编码 H5 域名
- 在 Controller 层实现业务逻辑
- 物理删除状态日志记录

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
```

### 接口测试
```bash
# 登录获取 Token
TOKEN=$(curl -s -X POST http://localhost:8080/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.data.token')

# 创建训练营
CAMP_ID=$(curl -s -X POST http://localhost:8080/api/admin/camps \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "21天早起训练营",
    "posterUrl": "https://cdn.example.com/poster.jpg",
    "deposit": 99.00,
    "startDate": "2025-01-10",
    "endDate": "2025-01-31",
    "requiredDays": 15,
    "groupQrcodeUrl": "https://cdn.example.com/qrcode.jpg",
    "planetProjectId": "15555411412112"
  }' | jq -r '.data.id')

echo "Created camp ID: $CAMP_ID"

# 发布训练营
curl -X POST "http://localhost:8080/api/admin/camps/$CAMP_ID/publish" \
  -H "Authorization: Bearer $TOKEN"
# 预期: {"code":200,"data":{"status":"pending",...}}

# 确认发布
curl -X POST "http://localhost:8080/api/admin/camps/$CAMP_ID/confirm-publish" \
  -H "Authorization: Bearer $TOKEN"
# 预期: {"code":200,"data":{"enrollUrl":"https://h5.example.com/enroll/...",...}}

# 获取发布信息
curl "http://localhost:8080/api/admin/camps/$CAMP_ID/publish-info" \
  -H "Authorization: Bearer $TOKEN"
# 预期: {"code":200,"data":{"enrollUrl":"...","dynamicQrcodeUrl":"..."}}
```

### 单元测试
```bash
cd backend && ./gradlew test --tests "*CampPublishTest*"
# 预期: BUILD SUCCESSFUL
```

---

## 相关文档

| 文档 | 路径 | 说明 |
|------|------|------|
| API 设计规范 | `docs/v1/design/API设计规范.md` | RESTful 规范 |
| 数据库设计 | `docs/v1/design/数据库设计.md` | camp_status_log 表结构 |
| 状态枚举定义 | `docs/v1/design/状态枚举定义.md` | camp_status SSOT |
| 接口文档 | `docs/v1/api/接口文档.md` | 发布接口 |
| Epic 详情 | `docs/epics.md` | EP01-S04 详细描述 |

---

## 完成标准

- [ ] `./gradlew compileJava` 编译成功
- [ ] H5Properties 配置类正确创建
- [ ] 发布接口校验所有必填字段
- [ ] 发布校验失败返回具体缺失字段
- [ ] 状态变更记录到 camp_status_log
- [ ] 确认发布生成正确的报名链接
- [ ] 获取发布信息接口返回完整数据
- [ ] 单元测试通过
- [ ] API 文档显示发布接口

---

**创建时间**: 2025-12-13
**创建者**: Claude (create-story workflow)
**Epic**: EP01 - 基础框架与训练营管理
