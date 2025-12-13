# Story 1-3: 训练营 CRUD 接口

| 属性 | 值 |
|------|-----|
| **Story ID** | 1-3-camp-crud |
| **Epic** | EP01 - 基础框架与训练营管理 |
| **Story Points** | 5 |
| **优先级** | P0 |
| **前置依赖** | 1-2-jwt-authentication |
| **状态** | drafted |

---

## Story

**作为** 管理员
**我需要** 创建、查看、编辑、删除训练营
**以便** 管理训练营的基本信息和生命周期

---

## 验收标准 (BDD)

```gherkin
Feature: 训练营管理

  Scenario: 创建训练营
    Given 管理员已登录
    When POST /api/admin/camps 包含完整训练营信息
    Then 返回 201 Created
    And 训练营状态为 draft
    And 返回训练营ID

  Scenario: 创建训练营 - 参数校验失败
    Given 管理员已登录
    When POST /api/admin/camps 缺少必填字段 name
    Then 返回 400 Bad Request
    And 错误信息包含 "训练营名称不能为空"

  Scenario: 创建训练营 - 日期校验失败
    Given 管理员已登录
    When POST /api/admin/camps 的 endDate < startDate
    Then 返回 400 Bad Request
    And 错误信息为 "结束日期不能早于开始日期"

  Scenario: 创建训练营 - 打卡天数校验失败
    Given 管理员已登录
    When POST /api/admin/camps 的 requiredDays > totalDays
    Then 返回 400 Bad Request
    And 错误信息为 "要求打卡天数不能超过总天数"

  Scenario: 查询训练营列表 - 无筛选条件
    Given 存在 10 个训练营
    When GET /api/admin/camps?page=1&pageSize=5
    Then 返回分页数据 (5条记录)
    And 总数为 10
    And 按 createdAt 降序排列

  Scenario: 查询训练营列表 - 按状态筛选
    Given 存在 5 个 ongoing 状态和 3 个 draft 状态的训练营
    When GET /api/admin/camps?page=1&pageSize=10&status=ongoing
    Then 返回 5 条记录
    And 所有记录 status 为 ongoing

  Scenario: 查询训练营列表 - 关键词搜索
    Given 存在训练营 "早起打卡训练营" 和 "读书训练营"
    When GET /api/admin/camps?keyword=早起
    Then 返回包含 "早起打卡训练营" 的结果

  Scenario: 查询训练营列表 - 日期范围筛选
    Given 存在不同开始日期的训练营
    When GET /api/admin/camps?startDate=2025-01-01&endDate=2025-01-31
    Then 返回 startDate 在指定范围内的训练营

  Scenario: 获取训练营详情
    Given 存在 ID 为 1 的训练营
    When GET /api/admin/camps/1
    Then 返回 200 OK
    And 返回完整训练营信息

  Scenario: 获取训练营详情 - 不存在
    Given 不存在 ID 为 999 的训练营
    When GET /api/admin/camps/999
    Then 返回 404 Not Found
    And 错误码为 1101 (CAMP_NOT_FOUND)

  Scenario: 编辑草稿状态训练营
    Given 存在状态为 draft 的训练营
    When PUT /api/admin/camps/{id} 修改名称和押金
    Then 返回 200 OK
    And 信息更新成功

  Scenario: 编辑待发布状态训练营
    Given 存在状态为 pending 的训练营
    When PUT /api/admin/camps/{id} 修改信息
    Then 返回 200 OK
    And 信息更新成功

  Scenario: 禁止编辑进行中训练营的核心参数
    Given 存在状态为 ongoing 的训练营
    When PUT /api/admin/camps/{id} 修改 startDate
    Then 返回 400 Bad Request
    And 错误码为 1104 (CAMP_CORE_PARAM_LOCKED)
    And 错误信息为 "进行中的训练营不可修改核心参数"

  Scenario: 进行中训练营可修改非核心参数
    Given 存在状态为 ongoing 的训练营
    When PUT /api/admin/camps/{id} 修改 description
    Then 返回 200 OK
    And description 更新成功

  Scenario: 删除草稿状态训练营
    Given 存在状态为 draft 的训练营
    When DELETE /api/admin/camps/{id}
    Then 返回 200 OK
    And 训练营软删除 (deleted_at 非空)

  Scenario: 禁止删除已开始的训练营
    Given 存在状态为 ongoing 的训练营
    When DELETE /api/admin/camps/{id}
    Then 返回 400 Bad Request
    And 错误码为 1105 (CAMP_DELETE_DENIED)
    And 错误信息为 "已开始的训练营不可删除"

  Scenario: 禁止删除有会员报名的训练营
    Given 存在状态为 draft 但已有会员报名的训练营
    When DELETE /api/admin/camps/{id}
    Then 返回 400 Bad Request
    And 错误码为 1106 (CAMP_HAS_MEMBERS)
    And 错误信息为 "训练营已有会员报名，不可删除"
```

---

## 技术上下文

### 技术栈要求

| 组件 | 版本 | 说明 |
|------|------|------|
| Spring Boot | 3.2+ | 主框架 |
| MyBatis Plus | 3.5+ | ORM + 分页插件 |
| PostgreSQL | 15+ | 数据库 |
| Jakarta Validation | 3.0+ | 参数校验 |

### 数据库表

**training_camp 表**（已在 scripts/init-database.sql 中创建）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL | 主键 |
| name | VARCHAR(100) | 训练营名称 |
| poster_url | VARCHAR(500) | 海报URL |
| description | TEXT | 描述 |
| deposit | DECIMAL(10,2) | 押金金额 |
| start_date | DATE | 开始日期 |
| end_date | DATE | 结束日期 |
| total_days | INTEGER | 总天数 |
| required_days | INTEGER | 要求打卡天数 |
| group_qrcode_url | VARCHAR(500) | 群二维码URL |
| planet_project_id | VARCHAR(50) | 知识星球项目ID |
| status | VARCHAR(20) | 状态 (SSOT) |
| enroll_url | VARCHAR(500) | H5报名链接 |
| member_count | INTEGER | 报名人数 |
| paid_amount | DECIMAL(10,2) | 已收押金总额 |
| refunded_amount | DECIMAL(10,2) | 已退押金总额 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |
| deleted_at | TIMESTAMP | 软删除时间 |

### 状态枚举 (SSOT)

> 引用：`docs/v1/design/状态枚举定义.md#5-camp_status`

| 枚举值 | 含义 | 可编辑 | 可删除 |
|--------|------|--------|--------|
| `draft` | 草稿 | 全部字段 | 是（无会员时） |
| `pending` | 待发布 | 全部字段 | 是（无会员时） |
| `enrolling` | 报名中 | 非核心字段 | 否 |
| `ongoing` | 进行中 | 非核心字段 | 否 |
| `ended` | 已结束 | 非核心字段 | 否 |
| `settling` | 结算中 | 非核心字段 | 否 |
| `archived` | 已归档 | 否 | 否 |

**核心参数**（进行中不可修改）：
- name, deposit, startDate, endDate, totalDays, requiredDays, planetProjectId

**非核心参数**（进行中可修改）：
- posterUrl, description, groupQrcodeUrl

### 错误码定义

| 错误码 | HTTP 状态码 | 错误信息 | 说明 |
|--------|------------|----------|------|
| 1101 | 404 | 训练营不存在 | ID无效或已删除 |
| 1102 | 400 | 您已报名该训练营 | 重复报名 |
| 1103 | 400 | 训练营已结束 | 状态校验失败 |
| 1104 | 400 | 进行中的训练营不可修改核心参数 | 编辑限制 |
| 1105 | 400 | 已开始的训练营不可删除 | 删除限制 |
| 1106 | 400 | 训练营已有会员报名，不可删除 | 删除限制 |

---

## 实现任务清单

### Task 1: 创建训练营状态枚举

**目标**: 创建符合 SSOT 的训练营状态枚举

**文件**: `backend/src/main/java/com/yian/camp/enums/CampStatus.java`

```java
package com.yian.camp.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

@Getter
public enum CampStatus {
    DRAFT("draft", "草稿"),
    PENDING("pending", "待发布"),
    ENROLLING("enrolling", "报名中"),
    ONGOING("ongoing", "进行中"),
    ENDED("ended", "已结束"),
    SETTLING("settling", "结算中"),
    ARCHIVED("archived", "已归档");

    @EnumValue
    @JsonValue
    private final String value;
    private final String description;

    CampStatus(String value, String description) {
        this.value = value;
        this.description = description;
    }

    public static CampStatus fromValue(String value) {
        for (CampStatus status : values()) {
            if (status.value.equals(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown camp_status: " + value);
    }

    /**
     * 判断是否可以编辑核心参数
     */
    public boolean canEditCoreParams() {
        return this == DRAFT || this == PENDING;
    }

    /**
     * 判断是否可以删除
     */
    public boolean canDelete() {
        return this == DRAFT || this == PENDING;
    }

    /**
     * 判断是否已开始（不可删除）
     */
    public boolean isStarted() {
        return this == ENROLLING || this == ONGOING || this == ENDED || this == SETTLING || this == ARCHIVED;
    }
}
```

---

### Task 2: 创建训练营实体类

**目标**: 创建对应数据库表的实体类

**文件**: `backend/src/main/java/com/yian/camp/entity/TrainingCamp.java`

```java
package com.yian.camp.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.yian.camp.enums.CampStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("training_camp")
public class TrainingCamp {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;

    private String posterUrl;

    private String description;

    private BigDecimal deposit;

    private LocalDate startDate;

    private LocalDate endDate;

    private Integer totalDays;

    private Integer requiredDays;

    private String groupQrcodeUrl;

    private String planetProjectId;

    private CampStatus status;

    private String enrollUrl;

    private Integer memberCount;

    private BigDecimal paidAmount;

    private BigDecimal refundedAmount;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private LocalDateTime deletedAt;
}
```

---

### Task 3: 创建训练营 DTO 和 VO

**文件**: `backend/src/main/java/com/yian/camp/dto/CampCreateDTO.java`

```java
package com.yian.camp.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CampCreateDTO {

    @NotBlank(message = "训练营名称不能为空")
    @Size(max = 100, message = "训练营名称最长100字符")
    private String name;

    @NotBlank(message = "海报URL不能为空")
    @Size(max = 500, message = "海报URL最长500字符")
    private String posterUrl;

    @Size(max = 5000, message = "描述最长5000字符")
    private String description;

    @NotNull(message = "押金金额不能为空")
    @DecimalMin(value = "0.01", message = "押金金额必须大于0")
    @DecimalMax(value = "10000.00", message = "押金金额不能超过10000元")
    private BigDecimal deposit;

    @NotNull(message = "开始日期不能为空")
    @Future(message = "开始日期必须是未来日期")
    private LocalDate startDate;

    @NotNull(message = "结束日期不能为空")
    private LocalDate endDate;

    @NotNull(message = "要求打卡天数不能为空")
    @Min(value = 1, message = "要求打卡天数至少为1天")
    private Integer requiredDays;

    @NotBlank(message = "群二维码URL不能为空")
    @Size(max = 500, message = "群二维码URL最长500字符")
    private String groupQrcodeUrl;

    @NotBlank(message = "知识星球项目ID不能为空")
    @Size(max = 50, message = "知识星球项目ID最长50字符")
    private String planetProjectId;
}
```

**文件**: `backend/src/main/java/com/yian/camp/dto/CampUpdateDTO.java`

```java
package com.yian.camp.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CampUpdateDTO {

    @Size(max = 100, message = "训练营名称最长100字符")
    private String name;

    @Size(max = 500, message = "海报URL最长500字符")
    private String posterUrl;

    @Size(max = 5000, message = "描述最长5000字符")
    private String description;

    @DecimalMin(value = "0.01", message = "押金金额必须大于0")
    @DecimalMax(value = "10000.00", message = "押金金额不能超过10000元")
    private BigDecimal deposit;

    private LocalDate startDate;

    private LocalDate endDate;

    @Min(value = 1, message = "要求打卡天数至少为1天")
    private Integer requiredDays;

    @Size(max = 500, message = "群二维码URL最长500字符")
    private String groupQrcodeUrl;

    @Size(max = 50, message = "知识星球项目ID最长50字符")
    private String planetProjectId;
}
```

**文件**: `backend/src/main/java/com/yian/camp/dto/CampQueryDTO.java`

```java
package com.yian.camp.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class CampQueryDTO {

    private String status;

    private String keyword;

    private LocalDate startDateFrom;

    private LocalDate startDateTo;

    private Integer page = 1;

    private Integer pageSize = 20;
}
```

**文件**: `backend/src/main/java/com/yian/camp/vo/CampVO.java`

```java
package com.yian.camp.vo;

import com.yian.camp.entity.TrainingCamp;
import com.yian.camp.enums.CampStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class CampVO {

    private Long id;
    private String name;
    private String posterUrl;
    private String description;
    private BigDecimal deposit;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer totalDays;
    private Integer requiredDays;
    private String groupQrcodeUrl;
    private String planetProjectId;
    private String status;
    private String statusDesc;
    private String enrollUrl;
    private Integer memberCount;
    private BigDecimal paidAmount;
    private BigDecimal refundedAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CampVO fromEntity(TrainingCamp camp) {
        return CampVO.builder()
                .id(camp.getId())
                .name(camp.getName())
                .posterUrl(camp.getPosterUrl())
                .description(camp.getDescription())
                .deposit(camp.getDeposit())
                .startDate(camp.getStartDate())
                .endDate(camp.getEndDate())
                .totalDays(camp.getTotalDays())
                .requiredDays(camp.getRequiredDays())
                .groupQrcodeUrl(camp.getGroupQrcodeUrl())
                .planetProjectId(camp.getPlanetProjectId())
                .status(camp.getStatus().getValue())
                .statusDesc(camp.getStatus().getDescription())
                .enrollUrl(camp.getEnrollUrl())
                .memberCount(camp.getMemberCount())
                .paidAmount(camp.getPaidAmount())
                .refundedAmount(camp.getRefundedAmount())
                .createdAt(camp.getCreatedAt())
                .updatedAt(camp.getUpdatedAt())
                .build();
    }
}
```

**文件**: `backend/src/main/java/com/yian/camp/vo/CampListVO.java`

```java
package com.yian.camp.vo;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class CampListVO {

    private Long id;
    private String name;
    private String posterUrl;
    private BigDecimal deposit;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer totalDays;
    private Integer requiredDays;
    private String status;
    private String statusDesc;
    private Integer memberCount;
    private LocalDateTime createdAt;
}
```

---

### Task 4: 创建业务异常类

**文件**: `backend/src/main/java/com/yian/camp/exception/BusinessException.java`

```java
package com.yian.camp.exception;

import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {

    private final int code;

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    // ========== 训练营相关异常 ==========

    public static BusinessException campNotFound() {
        return new BusinessException(1101, "训练营不存在");
    }

    public static BusinessException alreadyEnrolled() {
        return new BusinessException(1102, "您已报名该训练营");
    }

    public static BusinessException campEnded() {
        return new BusinessException(1103, "训练营已结束");
    }

    public static BusinessException campCoreParamLocked() {
        return new BusinessException(1104, "进行中的训练营不可修改核心参数");
    }

    public static BusinessException campDeleteDenied() {
        return new BusinessException(1105, "已开始的训练营不可删除");
    }

    public static BusinessException campHasMembers() {
        return new BusinessException(1106, "训练营已有会员报名，不可删除");
    }

    public static BusinessException invalidDateRange() {
        return new BusinessException(1107, "结束日期不能早于开始日期");
    }

    public static BusinessException invalidRequiredDays() {
        return new BusinessException(1108, "要求打卡天数不能超过总天数");
    }
}
```

**更新**: `backend/src/main/java/com/yian/camp/exception/GlobalExceptionHandler.java`

```java
// 在已有的 GlobalExceptionHandler 中添加

@ExceptionHandler(BusinessException.class)
@ResponseStatus(HttpStatus.BAD_REQUEST)
public Result<Void> handleBusinessException(BusinessException e) {
    log.warn("业务异常: code={}, message={}", e.getCode(), e.getMessage());
    return Result.error(e.getCode(), e.getMessage());
}
```

---

### Task 5: 创建 Mapper 接口

**文件**: `backend/src/main/java/com/yian/camp/mapper/CampMapper.java`

```java
package com.yian.camp.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yian.camp.entity.TrainingCamp;
import com.yian.camp.vo.CampListVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface CampMapper extends BaseMapper<TrainingCamp> {

    /**
     * 分页查询训练营列表
     */
    IPage<CampListVO> selectCampPage(
            Page<CampListVO> page,
            @Param("status") String status,
            @Param("keyword") String keyword,
            @Param("startDateFrom") String startDateFrom,
            @Param("startDateTo") String startDateTo
    );

    /**
     * 查询训练营会员数量
     */
    @Select("SELECT COUNT(*) FROM camp_member WHERE camp_id = #{campId} AND deleted_at IS NULL")
    int countMembersByCampId(@Param("campId") Long campId);
}
```

**文件**: `backend/src/main/resources/mapper/CampMapper.xml`

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.yian.camp.mapper.CampMapper">

    <select id="selectCampPage" resultType="com.yian.camp.vo.CampListVO">
        SELECT
            id,
            name,
            poster_url AS posterUrl,
            deposit,
            start_date AS startDate,
            end_date AS endDate,
            total_days AS totalDays,
            required_days AS requiredDays,
            status,
            member_count AS memberCount,
            created_at AS createdAt
        FROM training_camp
        WHERE deleted_at IS NULL
        <if test="status != null and status != ''">
            AND status = #{status}
        </if>
        <if test="keyword != null and keyword != ''">
            AND name LIKE CONCAT('%', #{keyword}, '%')
        </if>
        <if test="startDateFrom != null and startDateFrom != ''">
            AND start_date &gt;= #{startDateFrom}::date
        </if>
        <if test="startDateTo != null and startDateTo != ''">
            AND start_date &lt;= #{startDateTo}::date
        </if>
        ORDER BY created_at DESC
    </select>

</mapper>
```

---

### Task 6: 配置 MyBatis Plus 分页插件

**文件**: `backend/src/main/java/com/yian/camp/config/MyBatisPlusConfig.java`

```java
package com.yian.camp.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

@Configuration
public class MyBatisPlusConfig {

    /**
     * 分页插件配置
     */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.POSTGRE_SQL));
        return interceptor;
    }

    /**
     * 自动填充处理器
     */
    @Bean
    public MetaObjectHandler metaObjectHandler() {
        return new MetaObjectHandler() {
            @Override
            public void insertFill(MetaObject metaObject) {
                this.strictInsertFill(metaObject, "createdAt", LocalDateTime.class, LocalDateTime.now());
                this.strictInsertFill(metaObject, "updatedAt", LocalDateTime.class, LocalDateTime.now());
            }

            @Override
            public void updateFill(MetaObject metaObject) {
                this.strictUpdateFill(metaObject, "updatedAt", LocalDateTime.class, LocalDateTime.now());
            }
        };
    }
}
```

---

### Task 7: 创建训练营 Service

**文件**: `backend/src/main/java/com/yian/camp/service/CampService.java`

```java
package com.yian.camp.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.yian.camp.dto.CampCreateDTO;
import com.yian.camp.dto.CampQueryDTO;
import com.yian.camp.dto.CampUpdateDTO;
import com.yian.camp.vo.CampListVO;
import com.yian.camp.vo.CampVO;

public interface CampService {

    /**
     * 创建训练营
     */
    CampVO createCamp(CampCreateDTO dto);

    /**
     * 查询训练营列表
     */
    IPage<CampListVO> listCamps(CampQueryDTO query);

    /**
     * 获取训练营详情
     */
    CampVO getCampById(Long id);

    /**
     * 更新训练营
     */
    CampVO updateCamp(Long id, CampUpdateDTO dto);

    /**
     * 删除训练营
     */
    void deleteCamp(Long id);
}
```

**文件**: `backend/src/main/java/com/yian/camp/service/impl/CampServiceImpl.java`

```java
package com.yian.camp.service.impl;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yian.camp.dto.CampCreateDTO;
import com.yian.camp.dto.CampQueryDTO;
import com.yian.camp.dto.CampUpdateDTO;
import com.yian.camp.entity.TrainingCamp;
import com.yian.camp.enums.CampStatus;
import com.yian.camp.exception.BusinessException;
import com.yian.camp.mapper.CampMapper;
import com.yian.camp.service.CampService;
import com.yian.camp.vo.CampListVO;
import com.yian.camp.vo.CampVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class CampServiceImpl implements CampService {

    private final CampMapper campMapper;

    @Override
    @Transactional
    public CampVO createCamp(CampCreateDTO dto) {
        // 1. 校验日期
        validateDateRange(dto.getStartDate(), dto.getEndDate());

        // 2. 计算总天数
        int totalDays = (int) ChronoUnit.DAYS.between(dto.getStartDate(), dto.getEndDate()) + 1;

        // 3. 校验打卡天数
        if (dto.getRequiredDays() > totalDays) {
            throw BusinessException.invalidRequiredDays();
        }

        // 4. 创建实体
        TrainingCamp camp = new TrainingCamp();
        camp.setName(dto.getName());
        camp.setPosterUrl(dto.getPosterUrl());
        camp.setDescription(dto.getDescription());
        camp.setDeposit(dto.getDeposit());
        camp.setStartDate(dto.getStartDate());
        camp.setEndDate(dto.getEndDate());
        camp.setTotalDays(totalDays);
        camp.setRequiredDays(dto.getRequiredDays());
        camp.setGroupQrcodeUrl(dto.getGroupQrcodeUrl());
        camp.setPlanetProjectId(dto.getPlanetProjectId());
        camp.setStatus(CampStatus.DRAFT);
        camp.setMemberCount(0);
        camp.setPaidAmount(BigDecimal.ZERO);
        camp.setRefundedAmount(BigDecimal.ZERO);

        // 5. 保存
        campMapper.insert(camp);

        log.info("创建训练营成功: id={}, name={}", camp.getId(), camp.getName());

        return CampVO.fromEntity(camp);
    }

    @Override
    public IPage<CampListVO> listCamps(CampQueryDTO query) {
        Page<CampListVO> page = new Page<>(query.getPage(), query.getPageSize());

        String startDateFrom = query.getStartDateFrom() != null ? query.getStartDateFrom().toString() : null;
        String startDateTo = query.getStartDateTo() != null ? query.getStartDateTo().toString() : null;

        return campMapper.selectCampPage(page, query.getStatus(), query.getKeyword(), startDateFrom, startDateTo);
    }

    @Override
    public CampVO getCampById(Long id) {
        TrainingCamp camp = campMapper.selectById(id);
        if (camp == null) {
            throw BusinessException.campNotFound();
        }
        return CampVO.fromEntity(camp);
    }

    @Override
    @Transactional
    public CampVO updateCamp(Long id, CampUpdateDTO dto) {
        // 1. 查询训练营
        TrainingCamp camp = campMapper.selectById(id);
        if (camp == null) {
            throw BusinessException.campNotFound();
        }

        // 2. 检查是否可以编辑核心参数
        boolean hasCoreParamChanges = hasCoreParamChanges(camp, dto);
        if (hasCoreParamChanges && !camp.getStatus().canEditCoreParams()) {
            throw BusinessException.campCoreParamLocked();
        }

        // 3. 更新字段
        if (dto.getName() != null) {
            camp.setName(dto.getName());
        }
        if (dto.getPosterUrl() != null) {
            camp.setPosterUrl(dto.getPosterUrl());
        }
        if (dto.getDescription() != null) {
            camp.setDescription(dto.getDescription());
        }
        if (dto.getGroupQrcodeUrl() != null) {
            camp.setGroupQrcodeUrl(dto.getGroupQrcodeUrl());
        }

        // 核心参数更新（仅 draft/pending 状态）
        if (camp.getStatus().canEditCoreParams()) {
            if (dto.getDeposit() != null) {
                camp.setDeposit(dto.getDeposit());
            }
            if (dto.getStartDate() != null) {
                camp.setStartDate(dto.getStartDate());
            }
            if (dto.getEndDate() != null) {
                camp.setEndDate(dto.getEndDate());
            }
            if (dto.getRequiredDays() != null) {
                camp.setRequiredDays(dto.getRequiredDays());
            }
            if (dto.getPlanetProjectId() != null) {
                camp.setPlanetProjectId(dto.getPlanetProjectId());
            }

            // 重新校验日期和天数
            validateDateRange(camp.getStartDate(), camp.getEndDate());
            int totalDays = (int) ChronoUnit.DAYS.between(camp.getStartDate(), camp.getEndDate()) + 1;
            camp.setTotalDays(totalDays);

            if (camp.getRequiredDays() > totalDays) {
                throw BusinessException.invalidRequiredDays();
            }
        }

        // 4. 保存更新
        campMapper.updateById(camp);

        log.info("更新训练营成功: id={}", id);

        return CampVO.fromEntity(camp);
    }

    @Override
    @Transactional
    public void deleteCamp(Long id) {
        // 1. 查询训练营
        TrainingCamp camp = campMapper.selectById(id);
        if (camp == null) {
            throw BusinessException.campNotFound();
        }

        // 2. 检查状态是否允许删除
        if (!camp.getStatus().canDelete()) {
            throw BusinessException.campDeleteDenied();
        }

        // 3. 检查是否有会员报名
        int memberCount = campMapper.countMembersByCampId(id);
        if (memberCount > 0) {
            throw BusinessException.campHasMembers();
        }

        // 4. 软删除
        campMapper.deleteById(id);

        log.info("删除训练营成功: id={}", id);
    }

    /**
     * 校验日期范围
     */
    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (endDate.isBefore(startDate)) {
            throw BusinessException.invalidDateRange();
        }
    }

    /**
     * 检查是否有核心参数变更
     */
    private boolean hasCoreParamChanges(TrainingCamp camp, CampUpdateDTO dto) {
        if (dto.getName() != null && !dto.getName().equals(camp.getName())) return true;
        if (dto.getDeposit() != null && dto.getDeposit().compareTo(camp.getDeposit()) != 0) return true;
        if (dto.getStartDate() != null && !dto.getStartDate().equals(camp.getStartDate())) return true;
        if (dto.getEndDate() != null && !dto.getEndDate().equals(camp.getEndDate())) return true;
        if (dto.getRequiredDays() != null && !dto.getRequiredDays().equals(camp.getRequiredDays())) return true;
        if (dto.getPlanetProjectId() != null && !dto.getPlanetProjectId().equals(camp.getPlanetProjectId())) return true;
        return false;
    }
}
```

---

### Task 8: 创建训练营 Controller

**文件**: `backend/src/main/java/com/yian/camp/controller/admin/CampController.java`

```java
package com.yian.camp.controller.admin;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.yian.camp.common.Result;
import com.yian.camp.dto.CampCreateDTO;
import com.yian.camp.dto.CampQueryDTO;
import com.yian.camp.dto.CampUpdateDTO;
import com.yian.camp.service.CampService;
import com.yian.camp.vo.CampListVO;
import com.yian.camp.vo.CampVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Tag(name = "训练营管理", description = "训练营 CRUD 接口")
@RestController
@RequestMapping("/api/admin/camps")
@RequiredArgsConstructor
public class CampController {

    private final CampService campService;

    @Operation(summary = "创建训练营", description = "创建新的训练营，初始状态为 draft")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Result<CampVO> createCamp(@Valid @RequestBody CampCreateDTO dto) {
        CampVO camp = campService.createCamp(dto);
        return Result.success(camp);
    }

    @Operation(summary = "获取训练营列表", description = "支持分页、状态筛选、关键词搜索、日期范围筛选")
    @GetMapping
    public Result<Map<String, Object>> listCamps(
            @Parameter(description = "状态筛选") @RequestParam(required = false) String status,
            @Parameter(description = "关键词搜索") @RequestParam(required = false) String keyword,
            @Parameter(description = "开始日期范围起始") @RequestParam(required = false) LocalDate startDateFrom,
            @Parameter(description = "开始日期范围结束") @RequestParam(required = false) LocalDate startDateTo,
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "每页条数") @RequestParam(defaultValue = "20") Integer pageSize
    ) {
        CampQueryDTO query = new CampQueryDTO();
        query.setStatus(status);
        query.setKeyword(keyword);
        query.setStartDateFrom(startDateFrom);
        query.setStartDateTo(startDateTo);
        query.setPage(page);
        query.setPageSize(pageSize);

        IPage<CampListVO> pageResult = campService.listCamps(query);

        Map<String, Object> data = new HashMap<>();
        data.put("list", pageResult.getRecords());
        data.put("total", pageResult.getTotal());
        data.put("page", pageResult.getCurrent());
        data.put("pageSize", pageResult.getSize());
        data.put("totalPages", pageResult.getPages());

        return Result.success(data);
    }

    @Operation(summary = "获取训练营详情")
    @GetMapping("/{id}")
    public Result<CampVO> getCampById(@PathVariable Long id) {
        CampVO camp = campService.getCampById(id);
        return Result.success(camp);
    }

    @Operation(summary = "更新训练营", description = "更新训练营信息，进行中状态不可修改核心参数")
    @PutMapping("/{id}")
    public Result<CampVO> updateCamp(
            @PathVariable Long id,
            @Valid @RequestBody CampUpdateDTO dto
    ) {
        CampVO camp = campService.updateCamp(id, dto);
        return Result.success(camp);
    }

    @Operation(summary = "删除训练营", description = "软删除训练营，已开始的训练营不可删除")
    @DeleteMapping("/{id}")
    public Result<Void> deleteCamp(@PathVariable Long id) {
        campService.deleteCamp(id);
        return Result.success();
    }
}
```

---

### Task 9: 创建单元测试

**文件**: `backend/src/test/java/com/yian/camp/CampControllerTest.java`

```java
package com.yian.camp;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yian.camp.dto.CampCreateDTO;
import com.yian.camp.dto.CampUpdateDTO;
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
class CampControllerTest {

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
    void testCreateCamp() throws Exception {
        CampCreateDTO dto = new CampCreateDTO();
        dto.setName("测试训练营");
        dto.setPosterUrl("https://cdn.example.com/poster.jpg");
        dto.setDescription("这是一个测试训练营");
        dto.setDeposit(new BigDecimal("99.00"));
        dto.setStartDate(LocalDate.now().plusDays(7));
        dto.setEndDate(LocalDate.now().plusDays(28));
        dto.setRequiredDays(15);
        dto.setGroupQrcodeUrl("https://cdn.example.com/qrcode.jpg");
        dto.setPlanetProjectId("15555411412112");

        mockMvc.perform(post("/api/admin/camps")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.name").value("测试训练营"))
                .andExpect(jsonPath("$.data.status").value("draft"));
    }

    @Test
    void testCreateCampWithInvalidDates() throws Exception {
        CampCreateDTO dto = new CampCreateDTO();
        dto.setName("测试训练营");
        dto.setPosterUrl("https://cdn.example.com/poster.jpg");
        dto.setDeposit(new BigDecimal("99.00"));
        dto.setStartDate(LocalDate.now().plusDays(28));
        dto.setEndDate(LocalDate.now().plusDays(7)); // 结束日期早于开始日期
        dto.setRequiredDays(15);
        dto.setGroupQrcodeUrl("https://cdn.example.com/qrcode.jpg");
        dto.setPlanetProjectId("15555411412112");

        mockMvc.perform(post("/api/admin/camps")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(1107));
    }

    @Test
    void testListCamps() throws Exception {
        mockMvc.perform(get("/api/admin/camps")
                        .header("Authorization", "Bearer " + token)
                        .param("page", "1")
                        .param("pageSize", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.list").isArray());
    }

    @Test
    void testGetCampById() throws Exception {
        // 先创建一个训练营
        TrainingCamp camp = new TrainingCamp();
        camp.setName("详情测试训练营");
        camp.setPosterUrl("https://cdn.example.com/poster.jpg");
        camp.setDeposit(new BigDecimal("99.00"));
        camp.setStartDate(LocalDate.now().plusDays(7));
        camp.setEndDate(LocalDate.now().plusDays(28));
        camp.setTotalDays(21);
        camp.setRequiredDays(15);
        camp.setGroupQrcodeUrl("https://cdn.example.com/qrcode.jpg");
        camp.setPlanetProjectId("15555411412112");
        camp.setStatus(CampStatus.DRAFT);
        camp.setMemberCount(0);
        camp.setPaidAmount(BigDecimal.ZERO);
        camp.setRefundedAmount(BigDecimal.ZERO);
        campMapper.insert(camp);

        mockMvc.perform(get("/api/admin/camps/" + camp.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.id").value(camp.getId()));
    }

    @Test
    void testGetCampByIdNotFound() throws Exception {
        mockMvc.perform(get("/api/admin/camps/99999")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(1101));
    }

    @Test
    void testUpdateCamp() throws Exception {
        // 创建训练营
        TrainingCamp camp = new TrainingCamp();
        camp.setName("更新测试训练营");
        camp.setPosterUrl("https://cdn.example.com/poster.jpg");
        camp.setDeposit(new BigDecimal("99.00"));
        camp.setStartDate(LocalDate.now().plusDays(7));
        camp.setEndDate(LocalDate.now().plusDays(28));
        camp.setTotalDays(21);
        camp.setRequiredDays(15);
        camp.setGroupQrcodeUrl("https://cdn.example.com/qrcode.jpg");
        camp.setPlanetProjectId("15555411412112");
        camp.setStatus(CampStatus.DRAFT);
        camp.setMemberCount(0);
        camp.setPaidAmount(BigDecimal.ZERO);
        camp.setRefundedAmount(BigDecimal.ZERO);
        campMapper.insert(camp);

        CampUpdateDTO updateDTO = new CampUpdateDTO();
        updateDTO.setName("更新后的训练营名称");
        updateDTO.setDeposit(new BigDecimal("199.00"));

        mockMvc.perform(put("/api/admin/camps/" + camp.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.name").value("更新后的训练营名称"))
                .andExpect(jsonPath("$.data.deposit").value(199.00));
    }

    @Test
    void testUpdateOngoingCampCoreParams() throws Exception {
        // 创建进行中的训练营
        TrainingCamp camp = new TrainingCamp();
        camp.setName("进行中训练营");
        camp.setPosterUrl("https://cdn.example.com/poster.jpg");
        camp.setDeposit(new BigDecimal("99.00"));
        camp.setStartDate(LocalDate.now().minusDays(5));
        camp.setEndDate(LocalDate.now().plusDays(15));
        camp.setTotalDays(20);
        camp.setRequiredDays(15);
        camp.setGroupQrcodeUrl("https://cdn.example.com/qrcode.jpg");
        camp.setPlanetProjectId("15555411412112");
        camp.setStatus(CampStatus.ONGOING);
        camp.setMemberCount(10);
        camp.setPaidAmount(new BigDecimal("990.00"));
        camp.setRefundedAmount(BigDecimal.ZERO);
        campMapper.insert(camp);

        CampUpdateDTO updateDTO = new CampUpdateDTO();
        updateDTO.setDeposit(new BigDecimal("199.00")); // 尝试修改核心参数

        mockMvc.perform(put("/api/admin/camps/" + camp.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(1104));
    }

    @Test
    void testDeleteDraftCamp() throws Exception {
        // 创建草稿状态训练营
        TrainingCamp camp = new TrainingCamp();
        camp.setName("待删除训练营");
        camp.setPosterUrl("https://cdn.example.com/poster.jpg");
        camp.setDeposit(new BigDecimal("99.00"));
        camp.setStartDate(LocalDate.now().plusDays(7));
        camp.setEndDate(LocalDate.now().plusDays(28));
        camp.setTotalDays(21);
        camp.setRequiredDays(15);
        camp.setGroupQrcodeUrl("https://cdn.example.com/qrcode.jpg");
        camp.setPlanetProjectId("15555411412112");
        camp.setStatus(CampStatus.DRAFT);
        camp.setMemberCount(0);
        camp.setPaidAmount(BigDecimal.ZERO);
        camp.setRefundedAmount(BigDecimal.ZERO);
        campMapper.insert(camp);

        mockMvc.perform(delete("/api/admin/camps/" + camp.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void testDeleteOngoingCamp() throws Exception {
        // 创建进行中训练营
        TrainingCamp camp = new TrainingCamp();
        camp.setName("进行中训练营");
        camp.setPosterUrl("https://cdn.example.com/poster.jpg");
        camp.setDeposit(new BigDecimal("99.00"));
        camp.setStartDate(LocalDate.now().minusDays(5));
        camp.setEndDate(LocalDate.now().plusDays(15));
        camp.setTotalDays(20);
        camp.setRequiredDays(15);
        camp.setGroupQrcodeUrl("https://cdn.example.com/qrcode.jpg");
        camp.setPlanetProjectId("15555411412112");
        camp.setStatus(CampStatus.ONGOING);
        camp.setMemberCount(0);
        camp.setPaidAmount(BigDecimal.ZERO);
        camp.setRefundedAmount(BigDecimal.ZERO);
        campMapper.insert(camp);

        mockMvc.perform(delete("/api/admin/camps/" + camp.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(1105));
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
│   └── MyBatisPlusConfig.java          # 新增
├── controller/
│   └── admin/
│       ├── AuthController.java
│       └── CampController.java          # 新增
├── dto/
│   ├── LoginDTO.java
│   ├── CampCreateDTO.java               # 新增
│   ├── CampUpdateDTO.java               # 新增
│   └── CampQueryDTO.java                # 新增
├── entity/
│   ├── SystemUser.java
│   └── TrainingCamp.java                # 新增
├── enums/
│   └── CampStatus.java                  # 新增
├── exception/
│   ├── AuthException.java
│   ├── BusinessException.java           # 新增
│   └── GlobalExceptionHandler.java
├── filter/
│   └── JwtAuthenticationFilter.java
├── mapper/
│   ├── SystemUserMapper.java
│   └── CampMapper.java                  # 新增
├── service/
│   ├── AuthService.java
│   ├── CampService.java                 # 新增
│   └── impl/
│       ├── AuthServiceImpl.java
│       └── CampServiceImpl.java         # 新增
├── util/
│   └── JwtUtil.java
└── vo/
    ├── LoginVO.java
    ├── UserInfoVO.java
    ├── CampVO.java                      # 新增
    └── CampListVO.java                  # 新增

backend/src/main/resources/
└── mapper/
    └── CampMapper.xml                   # 新增
```

---

## 架构合规要求

### 必须遵守

- [x] Controller 只做参数校验和响应封装
- [x] Service 实现业务逻辑
- [x] 使用统一响应格式 `Result<T>`
- [x] 使用 MyBatis Plus 分页插件
- [x] 状态枚举引用 SSOT 文档
- [x] 所有异常通过 BusinessException 抛出
- [x] 软删除使用 deleted_at 字段
- [x] 日志记录关键操作

### 禁止事项

- 在 Controller 层写业务逻辑
- 使用 System.out.println
- 硬编码状态值（必须使用枚举）
- 物理删除记录
- 跳过参数校验

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
curl -X POST http://localhost:8080/api/admin/camps \
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
  }'
# 预期: {"code":200,"data":{"id":1,"status":"draft",...}}

# 查询列表
curl "http://localhost:8080/api/admin/camps?page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN"
# 预期: {"code":200,"data":{"list":[...],"total":1}}

# 获取详情
curl http://localhost:8080/api/admin/camps/1 \
  -H "Authorization: Bearer $TOKEN"
# 预期: {"code":200,"data":{...}}

# 更新训练营
curl -X PUT http://localhost:8080/api/admin/camps/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "更新后的训练营名称"}'
# 预期: {"code":200,"data":{"name":"更新后的训练营名称"}}

# 删除训练营
curl -X DELETE http://localhost:8080/api/admin/camps/1 \
  -H "Authorization: Bearer $TOKEN"
# 预期: {"code":200}
```

### 单元测试
```bash
cd backend && ./gradlew test --tests "*CampControllerTest*"
# 预期: BUILD SUCCESSFUL
```

---

## 相关文档

| 文档 | 路径 | 说明 |
|------|------|------|
| API 设计规范 | `docs/v1/design/API设计规范.md` | RESTful 规范 |
| 数据库设计 | `docs/v1/design/数据库设计.md` | training_camp 表结构 |
| 状态枚举定义 | `docs/v1/design/状态枚举定义.md` | camp_status SSOT |
| 接口文档 | `docs/v1/api/接口文档.md` | 训练营管理接口 |
| Epic 详情 | `docs/epics.md` | EP01-S03 详细描述 |

---

## 完成标准

- [ ] `./gradlew compileJava` 编译成功
- [ ] CampStatus 枚举正确定义
- [ ] TrainingCamp 实体类完整
- [ ] 创建训练营接口返回 201
- [ ] 列表查询支持分页、筛选、搜索
- [ ] 详情查询返回完整信息
- [ ] 草稿状态可编辑所有字段
- [ ] 进行中状态不可编辑核心参数
- [ ] 草稿状态可删除（无会员）
- [ ] 进行中状态不可删除
- [ ] 单元测试通过
- [ ] API 文档显示训练营接口

---

**创建时间**: 2025-12-13
**创建者**: Claude (create-story workflow)
**Epic**: EP01 - 基础框架与训练营管理
