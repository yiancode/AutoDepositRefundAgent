# Story 1-6: 用户管理与角色权限

| 属性 | 值 |
|------|-----|
| **Story ID** | 1-6-user-management |
| **Epic** | EP01 - 基础框架与训练营管理 |
| **Story Points** | 3 |
| **优先级** | P0 |
| **前置依赖** | 1-2-jwt-authentication |
| **状态** | drafted |

---

## 用户故事

**作为** 超级管理员
**我需要** 能够添加、编辑、删除系统用户并分配角色
**以便** 实现细粒度的权限控制，确保不同角色用户只能访问对应功能

---

## 验收标准 (BDD)

```gherkin
Feature: 用户管理与角色权限

  Background:
    Given 超级管理员已登录系统
    And JWT Token 有效

  # ==================== 用户 CRUD ====================

  Scenario: 创建系统用户
    Given 请求体包含必填字段 username/password/realName/role
    When POST /api/admin/users
    Then 返回 201 Created
    And 密码使用 BCrypt 加密存储
    And 返回字段包含 id/username/realName/role/status/createdAt
    And 不返回密码字段

  Scenario: 创建用户 - 用户名已存在
    Given 数据库已存在 username="coach1" 的用户
    When POST /api/admin/users 包含 username="coach1"
    Then 返回 400 Bad Request
    And 错误码为 1401 (USER_EXISTS)
    And 错误信息为 "用户名已存在"

  Scenario: 创建用户 - 非法角色值
    Given 请求体包含 role="invalid_role"
    When POST /api/admin/users
    Then 返回 400 Bad Request
    And 错误信息包含 "角色值无效，允许值: admin, manager, coach, volunteer"

  Scenario: 查看用户列表
    Given 系统中存在 15 个用户
    When GET /api/admin/users?page=1&pageSize=10
    Then 返回 200 OK
    And 返回分页列表 (total=15, page=1, pageSize=10)
    And 返回字段包含 id/username/realName/role/status/createdAt
    And 按创建时间倒序排列

  Scenario: 按角色筛选用户
    Given 选择角色筛选为 "coach"
    When GET /api/admin/users?role=coach
    Then 只返回角色为 "coach" 的用户

  Scenario: 按状态筛选用户
    Given 选择状态筛选为 "disabled"
    When GET /api/admin/users?status=disabled
    Then 只返回状态为 "disabled" 的用户

  Scenario: 搜索用户 - 按用户名或真实姓名
    Given 输入搜索关键词 "张三"
    When GET /api/admin/users?keyword=张三
    Then 返回 username 或 realName 包含 "张三" 的用户

  Scenario: 查看用户详情
    Given 用户ID为 10
    When GET /api/admin/users/10
    Then 返回 200 OK
    And 返回用户完整信息 (不含密码)

  Scenario: 查看用户详情 - 用户不存在
    Given 用户ID为 999
    When GET /api/admin/users/999
    Then 返回 404 Not Found
    And 错误码为 1402 (USER_NOT_FOUND)

  Scenario: 更新用户信息
    Given 用户ID为 10
    When PUT /api/admin/users/10 包含 realName="李四"
    Then 返回 200 OK
    And 用户 realName 更新为 "李四"
    And updated_at 字段更新

  Scenario: 更新用户角色
    Given 用户ID为 10 且角色为 "coach"
    When PUT /api/admin/users/10 包含 role="manager"
    Then 返回 200 OK
    And 用户角色更新为 "manager"
    And 该用户下次登录后获得新权限

  Scenario: 禁用用户
    Given 用户ID为 10 且状态为 "active"
    When PUT /api/admin/users/10 包含 status="disabled"
    Then 返回 200 OK
    And 用户状态更新为 "disabled"
    And 该用户当前 Token 立即失效 (通过 Redis 黑名单)

  Scenario: 禁用用户 - 不能禁用自己
    Given 当前登录用户ID为 1
    When PUT /api/admin/users/1 包含 status="disabled"
    Then 返回 400 Bad Request
    And 错误信息为 "不能禁用当前登录账号"

  Scenario: 启用用户
    Given 用户ID为 10 且状态为 "disabled"
    When PUT /api/admin/users/10 包含 status="active"
    Then 返回 200 OK
    And 用户状态更新为 "active"

  Scenario: 重置用户密码
    Given 用户ID为 10
    When POST /api/admin/users/10/reset-password
    Then 返回 200 OK
    And 返回新的随机密码 (8位字母数字组合)
    And 密码使用 BCrypt 加密存储
    And 该用户所有 Token 失效

  Scenario: 删除用户 (软删除)
    Given 用户ID为 10
    When DELETE /api/admin/users/10
    Then 返回 200 OK
    And deleted_at 字段设置为当前时间
    And 该用户当前 Token 立即失效

  Scenario: 删除用户 - 不能删除自己
    Given 当前登录用户ID为 1
    When DELETE /api/admin/users/1
    Then 返回 400 Bad Request
    And 错误信息为 "不能删除当前登录账号"

  Scenario: 删除用户 - 不能删除最后一个超级管理员
    Given 系统中只有 1 个 admin 用户
    When 尝试删除该 admin 用户
    Then 返回 400 Bad Request
    And 错误码为 1404 (LAST_ADMIN_CANNOT_DELETE)
    And 错误信息为 "不能删除最后一个超级管理员"

  # ==================== Token 失效验证 ====================

  Scenario: 禁用用户后 Token 立即失效
    Given 用户A已登录并获取Token
    When 管理员禁用用户A
    And 用户A使用原Token访问任意接口
    Then 返回 401 Unauthorized
    And 错误信息为 "Token已失效，请重新登录"

  Scenario: 删除用户后 Token 立即失效
    Given 用户B已登录并获取Token
    When 管理员删除用户B
    And 用户B使用原Token访问任意接口
    Then 返回 401 Unauthorized
    And 错误信息为 "Token已失效，请重新登录"

  Scenario: 重置密码后旧 Token 失效
    Given 用户C已登录并获取Token
    When 管理员重置用户C的密码
    And 用户C使用原Token访问任意接口
    Then 返回 401 Unauthorized
    And 错误信息为 "Token已失效，请重新登录"

  # ==================== 角色权限控制 ====================

  Scenario: 教练访问受限接口 - 创建训练营
    Given 用户角色为 coach
    And 已登录获取 Token
    When POST /api/admin/camps
    Then 返回 403 Forbidden
    And 错误码为 1303 (NO_PERMISSION)

  Scenario: 教练访问受限接口 - 创建用户
    Given 用户角色为 coach
    When POST /api/admin/users
    Then 返回 403 Forbidden
    And 错误码为 1303 (NO_PERMISSION)

  Scenario: 志愿者访问受限接口
    Given 用户角色为 volunteer
    When POST /api/admin/camps
    Then 返回 403 Forbidden
    And 错误码为 1303 (NO_PERMISSION)

  Scenario: 管理员访问用户管理 - 禁止
    Given 用户角色为 manager
    When POST /api/admin/users
    Then 返回 403 Forbidden
    And 错误码为 1303 (NO_PERMISSION)
    And 错误信息为 "用户管理仅限超级管理员操作"

  Scenario: 管理员访问训练营管理 - 允许
    Given 用户角色为 manager
    When GET /api/admin/camps
    Then 返回 200 OK
    And 正常返回训练营列表

  Scenario: 教练查看负责项目
    Given 用户角色为 coach
    And 该教练是训练营 camp_id=1 的教练
    When GET /api/admin/camps/1
    Then 返回 200 OK
    And 正常返回训练营详情

  Scenario: 教练访问非负责项目 - 禁止
    Given 用户角色为 coach
    And 该教练不是训练营 camp_id=2 的教练
    When GET /api/admin/camps/2
    Then 返回 403 Forbidden
    And 错误信息为 "您没有权限查看此训练营"
```

---

## 技术上下文

### 技术栈要求

| 组件 | 版本 | 说明 |
|------|------|------|
| Spring Boot | 3.2+ | 主框架 |
| Spring Security | 6.x | 安全框架 |
| MyBatis Plus | 3.5+ | ORM |
| PostgreSQL | 15+ | 数据库 |
| Redis | 7.x | Token 黑名单 |

### RBAC 权限模型

> 引用：`docs/v1/design/技术方案.md#3.1-用户角色`

| 角色 | 编码 | 权限范围 |
|------|------|---------|
| 超级管理员 | `admin` | 全部功能 |
| 管理员 | `manager` | 训练营管理、会员管理、退款审核、统计报表 |
| 教练 | `coach` | 查看负责的训练营、会员列表、打卡统计 |
| 志愿者 | `volunteer` | 查看负责的训练营、会员列表 |

### 权限矩阵

| 功能模块 | admin | manager | coach | volunteer |
|---------|-------|---------|-------|-----------|
| 用户管理 | ✅ | ❌ | ❌ | ❌ |
| 训练营CRUD | ✅ | ✅ | ❌ | ❌ |
| 训练营查看 | ✅ | ✅ | ✅(负责的) | ✅(负责的) |
| 会员管理 | ✅ | ✅ | ✅(负责的) | ✅(负责的) |
| 退款审核 | ✅ | ✅ | ❌ | ❌ |
| 统计报表 | ✅ | ✅ | ✅(负责的) | ❌ |
| 系统配置 | ✅ | ❌ | ❌ | ❌ |

### 数据库表结构

> 引用：`docs/v1/design/数据库设计.md#system_user`

**system_user 表**（已存在，EP01-S02 创建）:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL | 主键 |
| username | VARCHAR(50) | 用户名，唯一 |
| password | VARCHAR(255) | BCrypt 加密密码 |
| real_name | VARCHAR(50) | 真实姓名 |
| role | VARCHAR(20) | 角色: admin/manager/coach/volunteer |
| status | VARCHAR(20) | 状态: active/disabled |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |
| deleted_at | TIMESTAMP | 软删除时间 |

**camp_member_relation 表**（用于教练/志愿者与训练营关联）:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL | 主键 |
| camp_id | BIGINT | 训练营ID |
| user_id | BIGINT | 系统用户ID |
| role_type | VARCHAR(20) | 关系类型: coach/volunteer |
| created_at | TIMESTAMP | 创建时间 |

---

## 实现任务清单

### Task 1: 创建 UserRole 枚举

**目标**: 定义用户角色枚举

**文件**: `backend/src/main/java/com/yian/camp/enums/UserRole.java`

```java
package com.yian.camp.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

@Getter
public enum UserRole {
    ADMIN("admin", "超级管理员"),
    MANAGER("manager", "管理员"),
    COACH("coach", "教练"),
    VOLUNTEER("volunteer", "志愿者");

    @EnumValue
    @JsonValue
    private final String value;
    private final String description;

    UserRole(String value, String description) {
        this.value = value;
        this.description = description;
    }

    public static UserRole fromValue(String value) {
        for (UserRole role : values()) {
            if (role.value.equals(value)) {
                return role;
            }
        }
        throw new IllegalArgumentException("Unknown role: " + value);
    }
}
```

---

### Task 2: 创建 UserStatus 枚举

**文件**: `backend/src/main/java/com/yian/camp/enums/UserStatus.java`

```java
package com.yian.camp.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

@Getter
public enum UserStatus {
    ACTIVE("active", "正常"),
    DISABLED("disabled", "已禁用");

    @EnumValue
    @JsonValue
    private final String value;
    private final String description;

    UserStatus(String value, String description) {
        this.value = value;
        this.description = description;
    }
}
```

---

### Task 3: 创建 UserDTO

**文件**: `backend/src/main/java/com/yian/camp/dto/UserDTO.java`

```java
package com.yian.camp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.ToString;

@Data
public class UserDTO {

    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 50, message = "用户名长度必须在3-50字符之间")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "用户名只能包含字母、数字、下划线")
    private String username;

    @ToString.Exclude  // 防止密码在日志中泄露
    @NotBlank(message = "密码不能为空", groups = CreateGroup.class)
    @Size(min = 6, max = 50, message = "密码长度必须在6-50字符之间", groups = CreateGroup.class)
    private String password;

    @NotBlank(message = "真实姓名不能为空")
    @Size(max = 50, message = "真实姓名不能超过50字符")
    private String realName;

    @NotBlank(message = "角色不能为空")
    @Pattern(regexp = "^(admin|manager|coach|volunteer)$", message = "角色值无效，允许值: admin, manager, coach, volunteer")
    private String role;

    private String status = "active";

    public interface CreateGroup {}
}
```

---

### Task 4: 创建 UserVO

**文件**: `backend/src/main/java/com/yian/camp/vo/UserVO.java`

```java
package com.yian.camp.vo;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserVO {

    private Long id;
    private String username;
    private String realName;
    private String role;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

---

### Task 5: 创建 UserListVO

**文件**: `backend/src/main/java/com/yian/camp/vo/UserListVO.java`

```java
package com.yian.camp.vo;

import lombok.Data;

import java.util.List;

@Data
public class UserListVO {

    private List<UserVO> list;
    private Long total;
    private Integer page;
    private Integer pageSize;
    private Integer totalPages;
}
```

---

### Task 6: 扩展 SystemUser 实体

**目标**: 添加 UserDetails 实现所需的方法

**文件**: `backend/src/main/java/com/yian/camp/entity/SystemUser.java`

确保实体包含以下字段和方法：

```java
package com.yian.camp.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.yian.camp.enums.UserRole;
import com.yian.camp.enums.UserStatus;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;

@Data
@TableName("system_user")
public class SystemUser implements UserDetails {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String username;

    private String password;

    private String realName;

    private UserRole role;

    private UserStatus status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private LocalDateTime deletedAt;

    // ========== UserDetails 实现 ==========

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.getValue().toUpperCase()));
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return status == UserStatus.ACTIVE;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return status == UserStatus.ACTIVE && deletedAt == null;
    }
}
```

---

### Task 7: 创建 SystemUserMapper

**文件**: `backend/src/main/java/com/yian/camp/mapper/SystemUserMapper.java`

```java
package com.yian.camp.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yian.camp.entity.SystemUser;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface SystemUserMapper extends BaseMapper<SystemUser> {
}
```

---

### Task 8: 创建 UserService 接口

**文件**: `backend/src/main/java/com/yian/camp/service/UserService.java`

```java
package com.yian.camp.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yian.camp.dto.UserDTO;
import com.yian.camp.entity.SystemUser;
import com.yian.camp.vo.UserVO;

public interface UserService {

    /**
     * 创建用户
     */
    UserVO createUser(UserDTO dto);

    /**
     * 更新用户
     */
    UserVO updateUser(Long id, UserDTO dto);

    /**
     * 删除用户 (软删除)
     */
    void deleteUser(Long id, Long currentUserId);

    /**
     * 获取用户详情
     */
    UserVO getUserById(Long id);

    /**
     * 分页查询用户列表
     */
    Page<UserVO> getUserList(String keyword, String role, String status, int page, int pageSize);

    /**
     * 重置用户密码
     * @return 新密码 (明文)
     */
    String resetPassword(Long id);

    /**
     * 根据用户名查询用户
     */
    SystemUser findByUsername(String username);
}
```

---

### Task 9: 实现 UserServiceImpl

**文件**: `backend/src/main/java/com/yian/camp/service/impl/UserServiceImpl.java`

```java
package com.yian.camp.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yian.camp.dto.UserDTO;
import com.yian.camp.entity.SystemUser;
import com.yian.camp.enums.UserRole;
import com.yian.camp.enums.UserStatus;
import com.yian.camp.exception.BusinessException;
import com.yian.camp.exception.ErrorCode;
import com.yian.camp.mapper.SystemUserMapper;
import com.yian.camp.service.TokenBlacklistService;
import com.yian.camp.service.UserService;
import com.yian.camp.vo.UserVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final SystemUserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final TokenBlacklistService tokenBlacklistService;

    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    @Transactional
    public UserVO createUser(UserDTO dto) {
        // 检查用户名是否存在
        if (existsByUsername(dto.getUsername())) {
            throw new BusinessException(ErrorCode.USER_EXISTS, "用户名已存在");
        }

        SystemUser user = new SystemUser();
        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setRealName(dto.getRealName());
        user.setRole(UserRole.fromValue(dto.getRole()));
        user.setStatus(UserStatus.ACTIVE);

        userMapper.insert(user);
        log.info("创建用户成功: username={}, role={}", user.getUsername(), user.getRole());

        return toVO(user);
    }

    @Override
    @Transactional
    public UserVO updateUser(Long id, UserDTO dto) {
        SystemUser user = getById(id);

        // 更新字段
        if (StringUtils.hasText(dto.getRealName())) {
            user.setRealName(dto.getRealName());
        }
        if (StringUtils.hasText(dto.getRole())) {
            user.setRole(UserRole.fromValue(dto.getRole()));
        }
        if (StringUtils.hasText(dto.getStatus())) {
            UserStatus newStatus = UserStatus.valueOf(dto.getStatus().toUpperCase());
            if (newStatus == UserStatus.DISABLED) {
                // 禁用时使 Token 失效
                tokenBlacklistService.invalidateUserTokens(id);
            }
            user.setStatus(newStatus);
        }

        userMapper.updateById(user);
        log.info("更新用户成功: id={}, username={}", id, user.getUsername());

        return toVO(user);
    }

    @Override
    @Transactional
    public void deleteUser(Long id, Long currentUserId) {
        if (id.equals(currentUserId)) {
            throw new BusinessException(ErrorCode.INVALID_OPERATION, "不能删除当前登录账号");
        }

        SystemUser user = getById(id);

        // 检查是否为最后一个超级管理员
        if (user.getRole() == UserRole.ADMIN) {
            long adminCount = userMapper.selectCount(
                new LambdaQueryWrapper<SystemUser>()
                    .eq(SystemUser::getRole, UserRole.ADMIN)
                    .isNull(SystemUser::getDeletedAt)
            );
            if (adminCount <= 1) {
                throw new BusinessException(ErrorCode.LAST_ADMIN_CANNOT_DELETE, "不能删除最后一个超级管理员");
            }
        }

        // 软删除
        userMapper.deleteById(id);

        // 使 Token 失效
        tokenBlacklistService.invalidateUserTokens(id);

        log.info("删除用户成功: id={}, username={}", id, user.getUsername());
    }

    @Override
    public UserVO getUserById(Long id) {
        return toVO(getById(id));
    }

    @Override
    public Page<UserVO> getUserList(String keyword, String role, String status, int page, int pageSize) {
        Page<SystemUser> pageParam = new Page<>(page, pageSize);

        LambdaQueryWrapper<SystemUser> wrapper = new LambdaQueryWrapper<>();

        // 关键词搜索 (用户名或真实姓名)
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w
                    .like(SystemUser::getUsername, keyword)
                    .or()
                    .like(SystemUser::getRealName, keyword)
            );
        }

        // 角色筛选
        if (StringUtils.hasText(role)) {
            wrapper.eq(SystemUser::getRole, UserRole.fromValue(role));
        }

        // 状态筛选
        if (StringUtils.hasText(status)) {
            wrapper.eq(SystemUser::getStatus, UserStatus.valueOf(status.toUpperCase()));
        }

        // 按创建时间倒序
        wrapper.orderByDesc(SystemUser::getCreatedAt);

        Page<SystemUser> result = userMapper.selectPage(pageParam, wrapper);

        // 转换为 VO
        Page<UserVO> voPage = new Page<>(result.getCurrent(), result.getSize(), result.getTotal());
        voPage.setRecords(result.getRecords().stream().map(this::toVO).toList());

        return voPage;
    }

    @Override
    @Transactional
    public String resetPassword(Long id) {
        SystemUser user = getById(id);

        // 生成随机密码
        String newPassword = generateRandomPassword(8);
        user.setPassword(passwordEncoder.encode(newPassword));

        userMapper.updateById(user);

        // 使所有 Token 失效
        tokenBlacklistService.invalidateUserTokens(id);

        log.info("重置用户密码成功: id={}, username={}", id, user.getUsername());

        return newPassword;
    }

    @Override
    public SystemUser findByUsername(String username) {
        return userMapper.selectOne(
                new LambdaQueryWrapper<SystemUser>().eq(SystemUser::getUsername, username)
        );
    }

    // ========== 私有方法 ==========

    private boolean existsByUsername(String username) {
        return userMapper.selectCount(
                new LambdaQueryWrapper<SystemUser>().eq(SystemUser::getUsername, username)
        ) > 0;
    }

    private SystemUser getById(Long id) {
        SystemUser user = userMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND, "用户不存在");
        }
        return user;
    }

    private String generateRandomPassword(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        }
        return sb.toString();
    }

    private UserVO toVO(SystemUser user) {
        return UserVO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .realName(user.getRealName())
                .role(user.getRole().getValue())
                .status(user.getStatus().getValue())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
```

---

### Task 10: 创建 TokenBlacklistService

**目标**: 实现 Token 黑名单机制

**文件**: `backend/src/main/java/com/yian/camp/service/TokenBlacklistService.java`

```java
package com.yian.camp.service;

public interface TokenBlacklistService {

    /**
     * 将用户所有 Token 加入黑名单
     */
    void invalidateUserTokens(Long userId);

    /**
     * 检查 Token 是否在黑名单中
     */
    boolean isTokenBlacklisted(String token);

    /**
     * 将单个 Token 加入黑名单
     */
    void blacklistToken(String token, long expireSeconds);
}
```

**实现文件**: `backend/src/main/java/com/yian/camp/service/impl/TokenBlacklistServiceImpl.java`

```java
package com.yian.camp.service.impl;

import com.yian.camp.service.TokenBlacklistService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class TokenBlacklistServiceImpl implements TokenBlacklistService {

    private final StringRedisTemplate redisTemplate;

    private static final String BLACKLIST_PREFIX = "token:blacklist:";
    private static final String USER_INVALIDATE_PREFIX = "user:token_invalidate:";

    @Override
    public void invalidateUserTokens(Long userId) {
        // 记录用户 Token 失效时间点
        String key = USER_INVALIDATE_PREFIX + userId;
        redisTemplate.opsForValue().set(key, String.valueOf(System.currentTimeMillis()), 7, TimeUnit.DAYS);
    }

    @Override
    public boolean isTokenBlacklisted(String token) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + token));
    }

    @Override
    public void blacklistToken(String token, long expireSeconds) {
        redisTemplate.opsForValue().set(BLACKLIST_PREFIX + token, "1", expireSeconds, TimeUnit.SECONDS);
    }

    /**
     * 检查 Token 是否在用户失效时间点之前签发
     */
    public boolean isTokenInvalidatedForUser(Long userId, long tokenIssuedAt) {
        String key = USER_INVALIDATE_PREFIX + userId;
        String value = redisTemplate.opsForValue().get(key);
        if (value == null) {
            return false;
        }
        long invalidateTime = Long.parseLong(value);
        return tokenIssuedAt < invalidateTime;
    }
}
```

---

### Task 11: 创建 UserController

**文件**: `backend/src/main/java/com/yian/camp/controller/admin/UserController.java`

```java
package com.yian.camp.controller.admin;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yian.camp.common.Result;
import com.yian.camp.dto.UserDTO;
import com.yian.camp.entity.SystemUser;
import com.yian.camp.exception.BusinessException;
import com.yian.camp.exception.ErrorCode;
import com.yian.camp.service.UserService;
import com.yian.camp.vo.UserListVO;
import com.yian.camp.vo.UserVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@Tag(name = "用户管理", description = "系统用户CRUD - 仅限超级管理员")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService userService;

    @Operation(summary = "创建用户")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Result<UserVO> createUser(
            @Validated(UserDTO.CreateGroup.class) @RequestBody UserDTO dto) {
        UserVO user = userService.createUser(dto);
        return Result.success(user);
    }

    @Operation(summary = "查看用户列表")
    @GetMapping
    public Result<UserListVO> getUserList(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize) {

        Page<UserVO> result = userService.getUserList(keyword, role, status, page, pageSize);

        UserListVO vo = new UserListVO();
        vo.setList(result.getRecords());
        vo.setTotal(result.getTotal());
        vo.setPage((int) result.getCurrent());
        vo.setPageSize((int) result.getSize());
        vo.setTotalPages((int) result.getPages());

        return Result.success(vo);
    }

    @Operation(summary = "查看用户详情")
    @GetMapping("/{id}")
    public Result<UserVO> getUserById(@PathVariable Long id) {
        UserVO user = userService.getUserById(id);
        return Result.success(user);
    }

    @Operation(summary = "更新用户")
    @PutMapping("/{id}")
    public Result<UserVO> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserDTO dto,
            @AuthenticationPrincipal SystemUser currentUser) {

        // 禁止禁用自己
        if ("disabled".equals(dto.getStatus()) && id.equals(currentUser.getId())) {
            throw new BusinessException(ErrorCode.INVALID_OPERATION, "不能禁用当前登录账号");
        }

        UserVO user = userService.updateUser(id, dto);
        return Result.success(user);
    }

    @Operation(summary = "删除用户")
    @DeleteMapping("/{id}")
    public Result<Void> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal SystemUser currentUser) {
        userService.deleteUser(id, currentUser.getId());
        return Result.success();
    }

    @Operation(summary = "重置用户密码")
    @PostMapping("/{id}/reset-password")
    public Result<Map<String, String>> resetPassword(@PathVariable Long id) {
        String newPassword = userService.resetPassword(id);
        return Result.success(Map.of("newPassword", newPassword));
    }
}
```

---

### Task 12: 更新 SecurityConfig 权限配置

**目标**: 配置基于角色的访问控制

**文件**: `backend/src/main/java/com/yian/camp/config/SecurityConfig.java`

添加/更新以下配置：

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .csrf(AbstractHttpConfigurer::disable)
        .sessionManagement(session ->
            session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
        )
        .authorizeHttpRequests(auth -> auth
            // 公开接口
            .requestMatchers("/api/admin/auth/login").permitAll()
            .requestMatchers("/api/h5/**").permitAll()
            .requestMatchers("/api/webhook/**").permitAll()
            .requestMatchers("/doc.html", "/webjars/**", "/v3/api-docs/**").permitAll()

            // 用户管理 - 仅超级管理员
            .requestMatchers("/api/admin/users/**").hasRole("ADMIN")

            // 系统配置 - 仅超级管理员
            .requestMatchers("/api/admin/config/**").hasRole("ADMIN")

            // 训练营管理 - 管理员及以上
            .requestMatchers(HttpMethod.POST, "/api/admin/camps").hasAnyRole("ADMIN", "MANAGER")
            .requestMatchers(HttpMethod.PUT, "/api/admin/camps/**").hasAnyRole("ADMIN", "MANAGER")
            .requestMatchers(HttpMethod.DELETE, "/api/admin/camps/**").hasAnyRole("ADMIN", "MANAGER")

            // 退款审核 - 管理员及以上
            .requestMatchers("/api/admin/refunds/**").hasAnyRole("ADMIN", "MANAGER")

            // 其他管理接口 - 需要认证
            .requestMatchers("/api/admin/**").authenticated()

            .anyRequest().authenticated()
        )
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        .exceptionHandling(ex -> ex
            .authenticationEntryPoint((request, response, authException) -> {
                response.setContentType("application/json;charset=UTF-8");
                response.setStatus(401);
                response.getWriter().write("{\"code\":1301,\"message\":\"未登录或Token已过期\"}");
            })
            .accessDeniedHandler((request, response, accessDeniedException) -> {
                response.setContentType("application/json;charset=UTF-8");
                response.setStatus(403);
                response.getWriter().write("{\"code\":1303,\"message\":\"权限不足\"}");
            })
        );

    return http.build();
}
```

---

### Task 13: 添加错误码常量

**目标**: 定义用户管理相关错误码

**文件**: `backend/src/main/java/com/yian/camp/exception/ErrorCode.java`

添加以下错误码：

```java
// ========== 用户模块 14xx ==========
public static final int USER_EXISTS = 1401;
public static final int USER_NOT_FOUND = 1402;
public static final int INVALID_OPERATION = 1403;
public static final int LAST_ADMIN_CANNOT_DELETE = 1404;
```

---

### Task 14: 更新 JwtAuthenticationFilter

**目标**: 检查 Token 是否被拉黑

**文件**: `backend/src/main/java/com/yian/camp/filter/JwtAuthenticationFilter.java`

在 Token 验证逻辑中添加黑名单检查：

```java
@Override
protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                FilterChain filterChain) throws ServletException, IOException {
    String token = extractToken(request);

    if (token != null) {
        // 检查 Token 是否被拉黑
        if (tokenBlacklistService.isTokenBlacklisted(token)) {
            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(401);
            response.getWriter().write("{\"code\":1301,\"message\":\"Token已失效\"}");
            return;
        }

        try {
            Claims claims = jwtUtil.parseToken(token);
            Long userId = claims.get("userId", Long.class);
            long issuedAt = claims.getIssuedAt().getTime();

            // 检查用户 Token 是否被批量失效
            if (tokenBlacklistService.isTokenInvalidatedForUser(userId, issuedAt)) {
                response.setContentType("application/json;charset=UTF-8");
                response.setStatus(401);
                response.getWriter().write("{\"code\":1301,\"message\":\"Token已失效，请重新登录\"}");
                return;
            }

            // 设置认证信息
            SystemUser user = userService.findByUsername(claims.getSubject());
            if (user != null && user.isEnabled()) {
                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            log.warn("Token解析失败: {}", e.getMessage());
        }
    }

    filterChain.doFilter(request, response);
}
```

---

### Task 15: 创建单元测试

**文件**: `backend/src/test/java/com/yian/camp/UserManagementTest.java`

```java
package com.yian.camp;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yian.camp.dto.LoginDTO;
import com.yian.camp.dto.UserDTO;
import com.yian.camp.entity.SystemUser;
import com.yian.camp.mapper.SystemUserMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class UserManagementTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SystemUserMapper userMapper;

    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        // 以 admin 身份登录
        LoginDTO loginDTO = new LoginDTO();
        loginDTO.setUsername("admin");
        loginDTO.setPassword("admin123");

        MvcResult result = mockMvc.perform(post("/api/admin/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginDTO)))
                .andReturn();

        String response = result.getResponse().getContentAsString();
        adminToken = objectMapper.readTree(response).get("data").get("token").asText();
    }

    @Test
    void testCreateUser() throws Exception {
        UserDTO dto = new UserDTO();
        dto.setUsername("test_coach_" + System.currentTimeMillis());
        dto.setPassword("password123");
        dto.setRealName("测试教练");
        dto.setRole("coach");

        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.username").value(dto.getUsername()))
                .andExpect(jsonPath("$.data.role").value("coach"))
                .andExpect(jsonPath("$.data.status").value("active"));
    }

    @Test
    void testCreateUserDuplicate() throws Exception {
        // 先创建一个用户
        String username = "dup_user_" + System.currentTimeMillis();
        UserDTO dto = new UserDTO();
        dto.setUsername(username);
        dto.setPassword("password123");
        dto.setRealName("重复用户");
        dto.setRole("volunteer");

        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());

        // 再次创建同名用户
        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(1401))
                .andExpect(jsonPath("$.message").value("用户名已存在"));
    }

    @Test
    void testGetUserList() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("page", "1")
                        .param("pageSize", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.list").isArray())
                .andExpect(jsonPath("$.data.total").isNumber());
    }

    @Test
    void testGetUserListByRole() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("role", "admin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void testUpdateUser() throws Exception {
        // 先创建一个用户
        String username = "update_test_" + System.currentTimeMillis();
        UserDTO createDto = new UserDTO();
        createDto.setUsername(username);
        createDto.setPassword("password123");
        createDto.setRealName("原名字");
        createDto.setRole("coach");

        MvcResult createResult = mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andReturn();

        Long userId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("data").get("id").asLong();

        // 更新用户
        UserDTO updateDto = new UserDTO();
        updateDto.setRealName("新名字");
        updateDto.setRole("manager");

        mockMvc.perform(put("/api/admin/users/" + userId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.realName").value("新名字"))
                .andExpect(jsonPath("$.data.role").value("manager"));
    }

    @Test
    void testCoachCannotAccessUserManagement() throws Exception {
        // 创建教练用户
        String username = "coach_test_" + System.currentTimeMillis();
        UserDTO dto = new UserDTO();
        dto.setUsername(username);
        dto.setPassword("password123");
        dto.setRealName("测试教练");
        dto.setRole("coach");

        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());

        // 以教练身份登录
        LoginDTO loginDTO = new LoginDTO();
        loginDTO.setUsername(username);
        loginDTO.setPassword("password123");

        MvcResult loginResult = mockMvc.perform(post("/api/admin/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginDTO)))
                .andReturn();

        String coachToken = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("data").get("token").asText();

        // 教练尝试访问用户管理
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + coachToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(1303));
    }

    @Test
    void testResetPassword() throws Exception {
        // 先创建一个用户
        String username = "reset_pwd_" + System.currentTimeMillis();
        UserDTO dto = new UserDTO();
        dto.setUsername(username);
        dto.setPassword("oldpassword");
        dto.setRealName("密码重置测试");
        dto.setRole("volunteer");

        MvcResult createResult = mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andReturn();

        Long userId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("data").get("id").asLong();

        // 重置密码
        mockMvc.perform(post("/api/admin/users/" + userId + "/reset-password")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.newPassword").isString());
    }

    @Test
    void testDeleteUser() throws Exception {
        // 先创建一个用户
        String username = "delete_test_" + System.currentTimeMillis();
        UserDTO dto = new UserDTO();
        dto.setUsername(username);
        dto.setPassword("password123");
        dto.setRealName("删除测试");
        dto.setRole("volunteer");

        MvcResult createResult = mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andReturn();

        Long userId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("data").get("id").asLong();

        // 删除用户
        mockMvc.perform(delete("/api/admin/users/" + userId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // 验证用户已被软删除
        SystemUser deletedUser = userMapper.selectById(userId);
        assertNull(deletedUser); // MyBatis Plus 软删除后 selectById 返回 null
    }

    @Test
    void testDeleteLastAdmin() throws Exception {
        // 确保只有一个 admin (假设测试环境只有 admin 用户)
        // 尝试删除 admin 用户应该失败
        mockMvc.perform(delete("/api/admin/users/1")  // 假设 admin id=1
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(1404))
                .andExpect(jsonPath("$.message").value("不能删除最后一个超级管理员"));
    }

    @Test
    void testDisabledUserTokenInvalidated() throws Exception {
        // 创建用户并登录获取 Token
        String username = "disable_test_" + System.currentTimeMillis();
        UserDTO dto = new UserDTO();
        dto.setUsername(username);
        dto.setPassword("password123");
        dto.setRealName("禁用测试");
        dto.setRole("coach");

        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());

        // 用户登录
        LoginDTO loginDTO = new LoginDTO();
        loginDTO.setUsername(username);
        loginDTO.setPassword("password123");

        MvcResult loginResult = mockMvc.perform(post("/api/admin/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginDTO)))
                .andReturn();

        String userToken = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("data").get("token").asText();
        Long userId = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("data").get("user").get("id").asLong();

        // 管理员禁用该用户
        UserDTO disableDto = new UserDTO();
        disableDto.setStatus("disabled");

        mockMvc.perform(put("/api/admin/users/" + userId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(disableDto)))
                .andExpect(status().isOk());

        // 用户使用原 Token 访问应该返回 401
        mockMvc.perform(get("/api/admin/auth/me")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isUnauthorized());
    }

    // ========== 参数化权限测试 ==========

    @ParameterizedTest(name = "{0} 访问 {1} 应返回 {2}")
    @MethodSource("permissionTestCases")
    void testRolePermissions(String roleName, String endpoint, int expectedStatus) throws Exception {
        // 创建指定角色用户
        String username = roleName + "_perm_" + System.currentTimeMillis();
        UserDTO dto = new UserDTO();
        dto.setUsername(username);
        dto.setPassword("password123");
        dto.setRealName(roleName + "测试");
        dto.setRole(roleName);

        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());

        // 登录获取 Token
        LoginDTO loginDTO = new LoginDTO();
        loginDTO.setUsername(username);
        loginDTO.setPassword("password123");

        MvcResult loginResult = mockMvc.perform(post("/api/admin/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginDTO)))
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("data").get("token").asText();

        // 执行访问
        mockMvc.perform(get(endpoint)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().is(expectedStatus));
    }

    static Stream<Arguments> permissionTestCases() {
        return Stream.of(
            // 用户管理接口 - 仅 admin 可访问
            Arguments.of("manager", "/api/admin/users", 403),
            Arguments.of("coach", "/api/admin/users", 403),
            Arguments.of("volunteer", "/api/admin/users", 403),

            // 训练营列表 - manager 及以上可访问
            Arguments.of("manager", "/api/admin/camps", 200),
            Arguments.of("coach", "/api/admin/camps", 200),  // coach 可查看列表但可能过滤
            Arguments.of("volunteer", "/api/admin/camps", 200)  // volunteer 可查看列表但可能过滤
        );
    }
}
```

---

### Task 16: 创建 CampAccessChecker 工具类

**目标**: 封装资源级别访问检查逻辑

**文件**: `backend/src/main/java/com/yian/camp/util/CampAccessChecker.java`

```java
package com.yian.camp.util;

import com.yian.camp.entity.SystemUser;
import com.yian.camp.enums.UserRole;
import com.yian.camp.exception.BusinessException;
import com.yian.camp.exception.ErrorCode;
import com.yian.camp.mapper.CampMemberRelationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 训练营资源访问检查器
 * 用于检查 coach/volunteer 是否有权限访问特定训练营
 */
@Component
@RequiredArgsConstructor
public class CampAccessChecker {

    private final CampMemberRelationMapper relationMapper;

    /**
     * 检查用户是否有权限访问指定训练营
     * - admin/manager: 可访问所有训练营
     * - coach/volunteer: 只能访问自己负责的训练营
     *
     * @param user 当前用户
     * @param campId 训练营ID
     * @throws BusinessException 无权限时抛出 NO_PERMISSION 异常
     */
    public void checkCampAccess(SystemUser user, Long campId) {
        if (user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.MANAGER) {
            return; // 管理员可访问所有
        }

        // coach/volunteer 需检查是否负责该训练营
        boolean hasAccess = relationMapper.existsByUserIdAndCampId(user.getId(), campId);
        if (!hasAccess) {
            throw new BusinessException(ErrorCode.NO_PERMISSION, "您没有权限查看此训练营");
        }
    }

    /**
     * 检查用户是否为指定训练营的教练
     */
    public boolean isCoachOfCamp(Long userId, Long campId) {
        return relationMapper.existsByUserIdAndCampIdAndRoleType(userId, campId, "coach");
    }

    /**
     * 检查用户是否为指定训练营的志愿者
     */
    public boolean isVolunteerOfCamp(Long userId, Long campId) {
        return relationMapper.existsByUserIdAndCampIdAndRoleType(userId, campId, "volunteer");
    }
}
```

**相关 Mapper 方法**（添加到 `CampMemberRelationMapper.java`）:

```java
@Select("SELECT EXISTS(SELECT 1 FROM camp_member_relation WHERE user_id = #{userId} AND camp_id = #{campId})")
boolean existsByUserIdAndCampId(@Param("userId") Long userId, @Param("campId") Long campId);

@Select("SELECT EXISTS(SELECT 1 FROM camp_member_relation WHERE user_id = #{userId} AND camp_id = #{campId} AND role_type = #{roleType})")
boolean existsByUserIdAndCampIdAndRoleType(@Param("userId") Long userId, @Param("campId") Long campId, @Param("roleType") String roleType);
```

**使用示例**（在 CampService 中）:

```java
@Service
@RequiredArgsConstructor
public class CampServiceImpl implements CampService {

    private final CampAccessChecker accessChecker;

    @Override
    public CampVO getCampById(Long id, SystemUser currentUser) {
        // 检查访问权限
        accessChecker.checkCampAccess(currentUser, id);

        // 继续获取数据...
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
│   ├── SecurityConfig.java              # 更新：添加权限配置
│   └── MyBatisPlusConfig.java
├── controller/
│   └── admin/
│       ├── AuthController.java
│       ├── CampController.java
│       └── UserController.java          # 新增
├── dto/
│   ├── LoginDTO.java
│   ├── CampDTO.java
│   └── UserDTO.java                     # 新增
├── entity/
│   ├── SystemUser.java                  # 更新：实现 UserDetails
│   ├── TrainingCamp.java
│   └── CampStatusLog.java
├── enums/
│   ├── CampStatus.java
│   ├── UserRole.java                    # 新增
│   └── UserStatus.java                  # 新增
├── exception/
│   ├── BusinessException.java
│   ├── ErrorCode.java                   # 更新：添加用户错误码
│   └── GlobalExceptionHandler.java
├── filter/
│   └── JwtAuthenticationFilter.java     # 更新：添加黑名单检查
├── mapper/
│   ├── SystemUserMapper.java
│   ├── CampMapper.java
│   └── CampStatusLogMapper.java
├── schedule/
│   └── CampStatusUpdateTask.java
├── service/
│   ├── AuthService.java
│   ├── CampService.java
│   ├── UserService.java                 # 新增
│   ├── TokenBlacklistService.java       # 新增
│   └── impl/
│       ├── AuthServiceImpl.java
│       ├── CampServiceImpl.java
│       ├── UserServiceImpl.java         # 新增
│       └── TokenBlacklistServiceImpl.java # 新增
├── util/
│   ├── JwtUtil.java
│   └── CampAccessChecker.java          # 新增
└── vo/
    ├── LoginVO.java
    ├── UserInfoVO.java
    ├── CampVO.java
    ├── CampListVO.java
    ├── UserVO.java                      # 新增
    └── UserListVO.java                  # 新增
```

---

## 架构合规要求

### 必须遵守

- [x] 使用 Spring Security RBAC 权限模型
- [x] 密码使用 BCrypt 加密存储
- [x] Token 黑名单机制使用 Redis 实现
- [x] 软删除使用 deleted_at 字段
- [x] 使用 Slf4j 记录操作日志
- [x] 权限控制使用 `@PreAuthorize` 注解

### 禁止事项

- 在代码中硬编码密码
- 返回响应中包含密码字段
- 使用明文密码存储
- 绕过权限校验

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
# 1. 登录获取 Token
TOKEN=$(curl -s -X POST http://localhost:8080/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.data.token')

# 2. 查看用户列表
curl -X GET http://localhost:8080/api/admin/users \
  -H "Authorization: Bearer $TOKEN"
# 预期: 返回用户列表

# 3. 创建用户
curl -X POST http://localhost:8080/api/admin/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"test_coach","password":"password123","realName":"测试教练","role":"coach"}'
# 预期: 201 Created

# 4. 教练权限测试
COACH_TOKEN=$(curl -s -X POST http://localhost:8080/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test_coach","password":"password123"}' | jq -r '.data.token')

curl -X GET http://localhost:8080/api/admin/users \
  -H "Authorization: Bearer $COACH_TOKEN"
# 预期: 403 Forbidden
```

### 单元测试
```bash
cd backend && ./gradlew test --tests "*UserManagementTest*"
# 预期: BUILD SUCCESSFUL
```

---

## 相关文档

| 文档 | 路径 | 说明 |
|------|------|------|
| 技术方案 | `docs/v1/design/技术方案.md` | 角色定义、权限模型 |
| 数据库设计 | `docs/v1/design/数据库设计.md` | system_user 表结构 |
| API 设计规范 | `docs/v1/design/API设计规范.md` | RESTful 规范 |
| 接口文档 | `docs/v1/api/接口文档.md` | 用户管理 API |
| Epic 详情 | `docs/epics.md` | EP01-S06 详细描述 |

---

## 完成标准

### 基础功能
- [ ] `./gradlew compileJava` 编译成功
- [ ] 创建用户接口正常工作
- [ ] 用户列表分页、筛选正常
- [ ] 更新用户信息正常
- [ ] 删除用户（软删除）正常
- [ ] 重置密码返回新密码

### 权限控制
- [ ] 角色权限控制正确 (admin/manager/coach/volunteer)
- [ ] CampAccessChecker 资源级别访问检查工作正常
- [ ] coach/volunteer 只能访问负责的训练营

### Token 安全
- [ ] Token 黑名单机制生效
- [ ] 禁用用户后 Token 立即失效
- [ ] 删除用户后 Token 立即失效
- [ ] 重置密码后旧 Token 失效

### 安全防护
- [ ] 最后一个超级管理员不能被删除
- [ ] 密码字段不出现在日志中 (@ToString.Exclude)
- [ ] 响应中不返回密码字段

### 测���覆盖
- [ ] 单元测试通过
- [ ] 参数化权限测试覆盖所有角色
- [ ] Token 失效测试用例通过

---

## 架构决策记录 (ADR)

### ADR-001: Token 失效机制

**背景**: 禁用/删除用户后需要使其 Token 立即失效

**决策**: 采用混合方案 (时间戳 + 黑名单)
- 批量失效：记录用户级别的 invalidate_time 到 Redis
- 单个 Token 失效（如登出）：直接加入黑名单
- JWT 校验时比较 issuedAt < invalidate_time

**理由**:
- 存储效率高：一个用户只需一条记录
- 响应及时：无需遍历所有 Token
- 两种场景都能覆盖

---

### ADR-002: 权限控制粒度

**背景**: coach/volunteer 需要数据级别权限（只能访问负责的训练营）

**决策**: 显式 Service 层检查 + CampAccessChecker 工具类
- 使用 `@PreAuthorize("hasRole('ADMIN')")` 做 URL 级别控制
- 使用 `CampAccessChecker.checkCampAccess()` 做资源级别控制

**理由**:
- 关注点分离明确
- 权限逻辑集中在 CampAccessChecker 中便于维护
- 避免 SpEL 过度复杂化

---

### ADR-003: 密码重置机制

**背景**: 管理员重置用户密码的交互方式

**决策**: 返回随机密码方案
- 生成 8 位随机密码 (字母数字组合)
- 直接返回给管理员
- 使所有旧 Token 失效

**理由**:
- 实现简单，适合 v1 MVP
- 内部管理系统，管理员可信
- 未来可扩展为邮件/短信通知

---

**创建时间**: 2025-12-13
**创建者**: Claude (create-story workflow)
**增强方法**: Architecture Decision Records, Pre-mortem Analysis
**Epic**: EP01 - 基础框架与训练营管理
