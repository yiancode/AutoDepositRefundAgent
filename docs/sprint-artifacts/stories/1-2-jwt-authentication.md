# Story 1-2: JWT认证与用户登录

| 属性 | 值 |
|------|-----|
| **Story ID** | 1-2-jwt-authentication |
| **Epic** | EP01 - 基础框架与训练营管理 |
| **Story Points** | 3 |
| **优先级** | P0 |
| **前置依赖** | 1-1-project-skeleton |
| **状态** | drafted |

---

## 用户故事

**作为** 管理员
**我需要** 通过用户名密码登录后台，获取JWT Token用于后续接口认证
**以便** 安全地访问管理后台的各项功能

---

## 验收标准 (BDD)

```gherkin
Feature: 用户登录认证

  Scenario: 管理员登录成功
    Given 数据库存在用户 admin/password
    When POST /api/admin/auth/login {"username": "admin", "password": "password"}
    Then 返回 200 和有效的 JWT Token
    And Token 有效期为 24 小时
    And 响应包含用户基本信息 (id, username, realName, role)

  Scenario: 密码错误登录失败
    Given 数据库存在用户 admin/password
    When POST /api/admin/auth/login {"username": "admin", "password": "wrong"}
    Then 返回 401 Unauthorized
    And 错误码为 1301
    And 错误信息为 "用户名或密码错误"

  Scenario: 用户不存在
    Given 数据库不存在用户 nonexistent
    When POST /api/admin/auth/login {"username": "nonexistent", "password": "any"}
    Then 返回 401 Unauthorized
    And 错误码为 1301
    And 错误信息为 "用户名或密码错误"

  Scenario: 用户已禁用
    Given 数据库存在用户 disabled_user 且 status = disabled
    When POST /api/admin/auth/login {"username": "disabled_user", "password": "correct"}
    Then 返回 403 Forbidden
    And 错误码为 1304
    And 错误信息为 "账号已被禁用"

  Scenario: Token 验证成功
    Given 用户已获取有效 Token
    When 使用 Token 访问 GET /api/admin/camps
    Then 请求正常执行
    And SecurityContext 包含用户信息

  Scenario: Token 过期
    Given 用户 Token 已过期
    When 使用过期 Token 访问 GET /api/admin/camps
    Then 返回 401 Unauthorized
    And 错误码为 1302 (TOKEN_EXPIRED)

  Scenario: Token 格式无效
    Given 用户提供格式错误的 Token
    When 使用无效 Token 访问 GET /api/admin/camps
    Then 返回 401 Unauthorized
    And 错误码为 1303 (TOKEN_INVALID)

  Scenario: 缺少 Token
    Given 请求未携带 Authorization Header
    When 访问 GET /api/admin/camps
    Then 返回 401 Unauthorized
    And 错误码为 1301 (UNAUTHORIZED)

  Scenario: 获取当前用户信息
    Given 用户已登录
    When GET /api/admin/auth/me
    Then 返回 200
    And 响应包含用户完整信息

  Scenario: 退出登录
    Given 用户已登录
    When POST /api/admin/auth/logout
    Then 返回 200
    And Token 加入黑名单 (Redis)
```

---

## 技术上下文

### 技术栈要求

| 组件 | 版本 | 说明 |
|------|------|------|
| Spring Security | 6.2+ | Spring Boot 3.2 默认版本 |
| jjwt | 0.12.x | JWT 库 (io.jsonwebtoken) |
| BCrypt | - | Spring Security 内置 |
| Redis | 7.x | Token 黑名单存储 |

### 安全规范

| 项目 | 规范 |
|------|------|
| 密码存储 | BCrypt 加密 (strength=10) |
| JWT 签名算法 | HS256 |
| JWT 有效期 | 24 小时 |
| Token 格式 | Bearer {token} |
| Token 黑名单 | Redis (TTL = Token剩余有效期) |

### 接口白名单

以下接口无需 JWT 认证：

```
POST /api/admin/auth/login    # 登录
GET  /api/h5/**               # H5会员端接口
POST /api/webhook/**          # Webhook回调
GET  /doc.html                # API文档
GET  /swagger-ui/**           # Swagger UI
GET  /v3/api-docs/**          # OpenAPI 文档
GET  /actuator/health         # 健康检查
```

### 错误码定义

| 错误码 | HTTP 状态码 | 错误信息 | 说明 |
|--------|------------|----------|------|
| 1301 | 401 | 未授权 | 未登录或Token缺失 |
| 1302 | 401 | Token已过期 | JWT已过期 |
| 1303 | 401 | Token无效 | JWT格式错误或签名验证失败 |
| 1304 | 403 | 账号已被禁用 | 用户status=disabled |
| 1305 | 403 | 无权限 | 角色权限不足 |

---

## 实现任务清单

### Task 1: 添加 JWT 依赖

**目标**: 在 build.gradle 添加 JWT 和 Spring Security 相关依赖

**文件**: `backend/build.gradle`

```groovy
dependencies {
    // Spring Security
    implementation 'org.springframework.boot:spring-boot-starter-security'

    // JWT (io.jsonwebtoken)
    implementation 'io.jsonwebtoken:jjwt-api:0.12.5'
    runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.12.5'
    runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.12.5'

    // 测试
    testImplementation 'org.springframework.security:spring-security-test'
}
```

**验证命令**:
```bash
cd backend && ./gradlew dependencies --configuration compileClasspath | grep jjwt
```

---

### Task 2: 创建 JWT 配置

**目标**: 配置 JWT 签名密钥和有效期

**文件**: `backend/src/main/resources/application.yml`

```yaml
# JWT 配置
jwt:
  secret: ${JWT_SECRET:your-256-bit-secret-key-for-development-only}
  expiration: 86400000  # 24小时 (毫秒)
  header: Authorization
  prefix: "Bearer "
```

**文件**: `backend/src/main/java/com/yian/camp/config/JwtProperties.java`

```java
package com.yian.camp.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    private String secret;
    private Long expiration = 86400000L; // 24小时
    private String header = "Authorization";
    private String prefix = "Bearer ";
}
```

---

### Task 3: 创建 JWT 工具类

**目标**: 实现 JWT 的生成、解析、验证功能

**文件**: `backend/src/main/java/com/yian/camp/util/JwtUtil.java`

```java
package com.yian.camp.util;

import com.yian.camp.config.JwtProperties;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtUtil {

    private final JwtProperties jwtProperties;

    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * 生成 JWT Token
     */
    public String generateToken(Long userId, String username, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("username", username);
        claims.put("role", role);

        Date now = new Date();
        Date expiration = new Date(now.getTime() + jwtProperties.getExpiration());

        return Jwts.builder()
                .claims(claims)
                .subject(username)
                .issuedAt(now)
                .expiration(expiration)
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }

    /**
     * 解析 Token 获取 Claims
     */
    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * 验证 Token 是否有效
     */
    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("JWT Token 已过期: {}", e.getMessage());
            throw e;
        } catch (JwtException e) {
            log.warn("JWT Token 无效: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 从 Token 获取用户ID
     */
    public Long getUserId(String token) {
        Claims claims = parseToken(token);
        return claims.get("userId", Long.class);
    }

    /**
     * 从 Token 获取用户名
     */
    public String getUsername(String token) {
        Claims claims = parseToken(token);
        return claims.getSubject();
    }

    /**
     * 从 Token 获取角色
     */
    public String getRole(String token) {
        Claims claims = parseToken(token);
        return claims.get("role", String.class);
    }

    /**
     * 获取 Token 过期时间
     */
    public Date getExpiration(String token) {
        Claims claims = parseToken(token);
        return claims.getExpiration();
    }

    /**
     * 检查 Token 是否过期
     */
    public boolean isTokenExpired(String token) {
        Date expiration = getExpiration(token);
        return expiration.before(new Date());
    }
}
```

---

### Task 4: 创建认证相关 DTO 和 VO

**文件**: `backend/src/main/java/com/yian/camp/dto/LoginDTO.java`

```java
package com.yian.camp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginDTO {

    @NotBlank(message = "用户名不能为空")
    private String username;

    @NotBlank(message = "密码不能为空")
    private String password;
}
```

**文件**: `backend/src/main/java/com/yian/camp/vo/LoginVO.java`

```java
package com.yian.camp.vo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginVO {

    private String token;
    private Long userId;
    private String username;
    private String realName;
    private String role;
    private Long expiresIn;
}
```

**文件**: `backend/src/main/java/com/yian/camp/vo/UserInfoVO.java`

```java
package com.yian.camp.vo;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class UserInfoVO {

    private Long id;
    private String username;
    private String realName;
    private String role;
    private String status;
    private LocalDateTime lastLoginTime;
    private String lastLoginIp;
}
```

---

### Task 5: 创建自定义异常类

**文件**: `backend/src/main/java/com/yian/camp/exception/AuthException.java`

```java
package com.yian.camp.exception;

import lombok.Getter;

@Getter
public class AuthException extends RuntimeException {

    private final int code;

    public AuthException(int code, String message) {
        super(message);
        this.code = code;
    }

    // 预定义异常
    public static AuthException unauthorized() {
        return new AuthException(1301, "未授权");
    }

    public static AuthException tokenExpired() {
        return new AuthException(1302, "Token已过期");
    }

    public static AuthException tokenInvalid() {
        return new AuthException(1303, "Token无效");
    }

    public static AuthException accountDisabled() {
        return new AuthException(1304, "账号已被禁用");
    }

    public static AuthException noPermission() {
        return new AuthException(1305, "无权限");
    }

    public static AuthException badCredentials() {
        return new AuthException(1301, "用户名或密码错误");
    }
}
```

---

### Task 6: 创建认证服务

**文件**: `backend/src/main/java/com/yian/camp/service/AuthService.java`

```java
package com.yian.camp.service;

import com.yian.camp.dto.LoginDTO;
import com.yian.camp.vo.LoginVO;
import com.yian.camp.vo.UserInfoVO;

public interface AuthService {

    /**
     * 用户登录
     */
    LoginVO login(LoginDTO dto);

    /**
     * 退出登录
     */
    void logout(String token);

    /**
     * 获取当前用户信息
     */
    UserInfoVO getCurrentUser();

    /**
     * 检查 Token 是否在黑名单
     */
    boolean isTokenBlacklisted(String token);
}
```

**文件**: `backend/src/main/java/com/yian/camp/service/impl/AuthServiceImpl.java`

```java
package com.yian.camp.service.impl;

import com.yian.camp.config.JwtProperties;
import com.yian.camp.dto.LoginDTO;
import com.yian.camp.entity.SystemUser;
import com.yian.camp.exception.AuthException;
import com.yian.camp.mapper.SystemUserMapper;
import com.yian.camp.service.AuthService;
import com.yian.camp.util.JwtUtil;
import com.yian.camp.vo.LoginVO;
import com.yian.camp.vo.UserInfoVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final SystemUserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final JwtProperties jwtProperties;
    private final StringRedisTemplate redisTemplate;

    private static final String TOKEN_BLACKLIST_PREFIX = "token:blacklist:";

    @Override
    public LoginVO login(LoginDTO dto) {
        // 1. 查询用户
        SystemUser user = userMapper.selectByUsername(dto.getUsername());
        if (user == null) {
            log.warn("登录失败: 用户不存在 - {}", dto.getUsername());
            throw AuthException.badCredentials();
        }

        // 2. 检查用户状态
        if ("disabled".equals(user.getStatus())) {
            log.warn("登录失败: 账号已禁用 - {}", dto.getUsername());
            throw AuthException.accountDisabled();
        }

        // 3. 验证密码
        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            log.warn("登录失败: 密码错误 - {}", dto.getUsername());
            throw AuthException.badCredentials();
        }

        // 4. 生成 Token
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole());

        // 5. 更新登录信息 (异步执行，不阻塞登录)
        userMapper.updateLoginInfo(user.getId(), LocalDateTime.now(), null);

        log.info("用户登录成功: {}", dto.getUsername());

        return LoginVO.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .realName(user.getRealName())
                .role(user.getRole())
                .expiresIn(jwtProperties.getExpiration() / 1000)
                .build();
    }

    @Override
    public void logout(String token) {
        if (token != null && token.startsWith(jwtProperties.getPrefix())) {
            token = token.substring(jwtProperties.getPrefix().length());
        }

        if (token != null) {
            try {
                // 计算剩余有效期
                Date expiration = jwtUtil.getExpiration(token);
                long ttl = expiration.getTime() - System.currentTimeMillis();

                if (ttl > 0) {
                    // 加入黑名单
                    String key = TOKEN_BLACKLIST_PREFIX + token;
                    redisTemplate.opsForValue().set(key, "1", ttl, TimeUnit.MILLISECONDS);
                    log.info("Token已加入黑名单");
                }
            } catch (Exception e) {
                log.warn("Token加入黑名单失败: {}", e.getMessage());
            }
        }
    }

    @Override
    public UserInfoVO getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof SystemUser user) {
            return UserInfoVO.builder()
                    .id(user.getId())
                    .username(user.getUsername())
                    .realName(user.getRealName())
                    .role(user.getRole())
                    .status(user.getStatus())
                    .lastLoginTime(user.getLastLoginTime())
                    .lastLoginIp(user.getLastLoginIp())
                    .build();
        }
        throw AuthException.unauthorized();
    }

    @Override
    public boolean isTokenBlacklisted(String token) {
        String key = TOKEN_BLACKLIST_PREFIX + token;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }
}
```

---

### Task 7: 创建 JWT 认证过滤器

**文件**: `backend/src/main/java/com/yian/camp/filter/JwtAuthenticationFilter.java`

```java
package com.yian.camp.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yian.camp.common.Result;
import com.yian.camp.config.JwtProperties;
import com.yian.camp.entity.SystemUser;
import com.yian.camp.mapper.SystemUserMapper;
import com.yian.camp.service.AuthService;
import com.yian.camp.util.JwtUtil;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProperties jwtProperties;
    private final JwtUtil jwtUtil;
    private final SystemUserMapper userMapper;
    private final AuthService authService;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader(jwtProperties.getHeader());

        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith(jwtProperties.getPrefix())) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(jwtProperties.getPrefix().length());

        try {
            // 检查黑名单
            if (authService.isTokenBlacklisted(token)) {
                writeErrorResponse(response, 401, 1303, "Token已失效");
                return;
            }

            // 验证并解析 Token
            if (jwtUtil.validateToken(token)) {
                Long userId = jwtUtil.getUserId(token);
                String role = jwtUtil.getRole(token);

                // 查询用户信息
                SystemUser user = userMapper.selectById(userId);
                if (user == null || "disabled".equals(user.getStatus())) {
                    writeErrorResponse(response, 401, 1304, "账号已被禁用");
                    return;
                }

                // 设置认证信息
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        user,
                        null,
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                );
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (ExpiredJwtException e) {
            writeErrorResponse(response, 401, 1302, "Token已过期");
            return;
        } catch (Exception e) {
            log.error("JWT认证失败: {}", e.getMessage());
            writeErrorResponse(response, 401, 1303, "Token无效");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void writeErrorResponse(HttpServletResponse response, int httpStatus, int code, String message) throws IOException {
        response.setStatus(httpStatus);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());

        Result<Void> result = Result.error(code, message);
        response.getWriter().write(objectMapper.writeValueAsString(result));
    }
}
```

---

### Task 8: 配置 Spring Security

**文件**: `backend/src/main/java/com/yian/camp/config/SecurityConfig.java`

```java
package com.yian.camp.config;

import com.yian.camp.filter.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 禁用 CSRF (JWT 无状态认证不需要)
            .csrf(AbstractHttpConfigurer::disable)

            // 禁用 Session (JWT 无状态)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // 配置请求授权
            .authorizeHttpRequests(auth -> auth
                // 白名单接口
                .requestMatchers(
                    "/api/admin/auth/login",
                    "/api/h5/**",
                    "/api/webhook/**",
                    "/doc.html",
                    "/swagger-ui/**",
                    "/v3/api-docs/**",
                    "/webjars/**",
                    "/actuator/health"
                ).permitAll()

                // 其他接口需要认证
                .anyRequest().authenticated()
            )

            // 添加 JWT 过滤器
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

---

### Task 9: 创建认证控制器

**文件**: `backend/src/main/java/com/yian/camp/controller/admin/AuthController.java`

```java
package com.yian.camp.controller.admin;

import com.yian.camp.common.Result;
import com.yian.camp.dto.LoginDTO;
import com.yian.camp.service.AuthService;
import com.yian.camp.vo.LoginVO;
import com.yian.camp.vo.UserInfoVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@Tag(name = "认证管理", description = "用户登录、退出、获取用户信息")
@RestController
@RequestMapping("/api/admin/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "用户登录", description = "使用用户名密码登录，返回JWT Token")
    @PostMapping("/login")
    public Result<LoginVO> login(@Valid @RequestBody LoginDTO dto) {
        LoginVO loginVO = authService.login(dto);
        return Result.success(loginVO);
    }

    @Operation(summary = "退出登录", description = "将Token加入黑名单")
    @PostMapping("/logout")
    public Result<Void> logout(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        authService.logout(token);
        return Result.success();
    }

    @Operation(summary = "获取当前用户信息")
    @GetMapping("/me")
    public Result<UserInfoVO> getCurrentUser() {
        UserInfoVO userInfo = authService.getCurrentUser();
        return Result.success(userInfo);
    }
}
```

---

### Task 10: 创建全局异常处理

**文件**: `backend/src/main/java/com/yian/camp/exception/GlobalExceptionHandler.java`

```java
package com.yian.camp.exception;

import com.yian.camp.common.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AuthException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public Result<Void> handleAuthException(AuthException e) {
        log.warn("认证异常: {}", e.getMessage());
        return Result.error(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleValidationException(MethodArgumentNotValidException e) {
        List<String> errors = e.getBindingResult().getFieldErrors()
                .stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.toList());
        String message = String.join("; ", errors);
        log.warn("参数校验失败: {}", message);
        return Result.error(400, message);
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Result<Void> handleException(Exception e) {
        log.error("系统异常: ", e);
        return Result.error(500, "系统内部错误");
    }
}
```

---

### Task 11: 创建 SystemUser 实体和 Mapper

**文件**: `backend/src/main/java/com/yian/camp/entity/SystemUser.java`

```java
package com.yian.camp.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("system_user")
public class SystemUser {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String username;

    private String password;

    private String realName;

    private String role;

    private String status;

    private String lastLoginIp;

    private LocalDateTime lastLoginTime;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @TableLogic
    private LocalDateTime deletedAt;
}
```

**文件**: `backend/src/main/java/com/yian/camp/mapper/SystemUserMapper.java`

```java
package com.yian.camp.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yian.camp.entity.SystemUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDateTime;

@Mapper
public interface SystemUserMapper extends BaseMapper<SystemUser> {

    @Select("SELECT * FROM system_user WHERE username = #{username} AND deleted_at IS NULL")
    SystemUser selectByUsername(@Param("username") String username);

    @Update("UPDATE system_user SET last_login_time = #{loginTime}, last_login_ip = #{loginIp} WHERE id = #{id}")
    int updateLoginInfo(@Param("id") Long id, @Param("loginTime") LocalDateTime loginTime, @Param("loginIp") String loginIp);
}
```

---

### Task 12: 创建单元测试

**文件**: `backend/src/test/java/com/yian/camp/AuthControllerTest.java`

```java
package com.yian.camp;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yian.camp.dto.LoginDTO;
import com.yian.camp.entity.SystemUser;
import com.yian.camp.mapper.SystemUserMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SystemUserMapper userMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        // 创建测试用户
        SystemUser user = new SystemUser();
        user.setUsername("testuser");
        user.setPassword(passwordEncoder.encode("password123"));
        user.setRealName("测试用户");
        user.setRole("admin");
        user.setStatus("active");

        // 清理并创建
        userMapper.delete(null);
        userMapper.insert(user);
    }

    @Test
    void testLoginSuccess() throws Exception {
        LoginDTO dto = new LoginDTO();
        dto.setUsername("testuser");
        dto.setPassword("password123");

        mockMvc.perform(post("/api/admin/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.token").exists())
                .andExpect(jsonPath("$.data.username").value("testuser"));
    }

    @Test
    void testLoginFailWithWrongPassword() throws Exception {
        LoginDTO dto = new LoginDTO();
        dto.setUsername("testuser");
        dto.setPassword("wrongpassword");

        mockMvc.perform(post("/api/admin/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(1301));
    }

    @Test
    void testAccessProtectedEndpointWithoutToken() throws Exception {
        mockMvc.perform(get("/api/admin/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testAccessProtectedEndpointWithToken() throws Exception {
        // 先登录获取 Token
        LoginDTO dto = new LoginDTO();
        dto.setUsername("testuser");
        dto.setPassword("password123");

        MvcResult result = mockMvc.perform(post("/api/admin/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andReturn();

        String response = result.getResponse().getContentAsString();
        String token = objectMapper.readTree(response).get("data").get("token").asText();

        // 使用 Token 访问受保护接口
        mockMvc.perform(get("/api/admin/auth/me")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.username").value("testuser"));
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
│   └── SecurityConfig.java
├── controller/
│   └── admin/
│       └── AuthController.java
├── dto/
│   └── LoginDTO.java
├── entity/
│   └── SystemUser.java
├── exception/
│   ├── AuthException.java
│   └── GlobalExceptionHandler.java
├── filter/
│   └── JwtAuthenticationFilter.java
├── mapper/
│   └── SystemUserMapper.java
├── service/
│   ├── AuthService.java
│   └── impl/
│       └── AuthServiceImpl.java
├── util/
│   └── JwtUtil.java
└── vo/
    ├── LoginVO.java
    └── UserInfoVO.java
```

---

## 架构合规要求

### 必须遵守

- [x] 密码使用 BCrypt 加密存储
- [x] JWT 使用 HS256 签名
- [x] Token 黑名单存储于 Redis
- [x] 敏感配置使用环境变量
- [x] 登录失败返回统一错误信息，不泄露用户存在性
- [x] 使用 Slf4j Logger 记录日志

### 禁止事项

- 明文存储密码
- 在 JWT 中存储敏感信息
- 硬编码 JWT Secret
- 跳过 Token 验证
- 在日志中打印 Token 原文

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

### 登录测试
```bash
# 登录
curl -X POST http://localhost:8080/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
# 预期: {"code":200,"data":{"token":"eyJ..."}}

# 获取用户信息
curl http://localhost:8080/api/admin/auth/me \
  -H "Authorization: Bearer {token}"
# 预期: {"code":200,"data":{"username":"admin"}}
```

### 单元测试
```bash
cd backend && ./gradlew test --tests "*AuthControllerTest*"
# 预期: BUILD SUCCESSFUL
```

---

## 相关文档

| 文档 | 路径 | 说明 |
|------|------|------|
| API 设计规范 | `docs/v1/design/API设计规范.md` | RESTful 规范 |
| 数据库设计 | `docs/v1/design/数据库设计.md` | system_user 表结构 |
| 状态枚举定义 | `docs/v1/design/状态枚举定义.md` | 用户状态枚举 |
| Epic 详情 | `docs/epics.md` | EP01-S02 详细描述 |

---

## 完成标准

- [ ] `./gradlew compileJava` 编译成功
- [ ] JWT 依赖正确配置
- [ ] 登录接口返回有效 Token
- [ ] Token 验证正确拦截未授权请求
- [ ] Token 过期返回 1302 错误码
- [ ] 退出登录 Token 加入黑名单
- [ ] 单元测试通过
- [ ] API 文档显示认证接口

---

**创建时间**: 2025-12-13
**创建者**: Claude (create-story workflow)
**Epic**: EP01 - 基础框架与训练营管理
