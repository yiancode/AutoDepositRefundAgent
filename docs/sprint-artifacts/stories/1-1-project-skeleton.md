# Story 1-1: 项目骨架与数据库初始化

| 属性 | 值 |
|------|-----|
| **Story ID** | 1-1-project-skeleton |
| **Epic** | EP01 - 基础框架与训练营管理 |
| **Story Points** | 5 |
| **优先级** | P0 |
| **前置依赖** | 无 |
| **状态** | ready-for-dev |

---

## Story

**作为** 开发者
**我需要** 搭建可运行的项目骨架和初始化数据库
**以便** 后续功能开发有一个稳定的基础框架

---

## 验收标准 (BDD)

```gherkin
Feature: 项目骨架初始化

  Scenario: Spring Boot 应用启动成功
    Given 项目代码已编译
    When 执行 ./gradlew bootRun
    Then 应用在 localhost:8080 启动成功
    And 访问 /actuator/health 返回 UP

  Scenario: 数据库初始化成功
    Given PostgreSQL 服务已启动
    When 执行 psql -f scripts/init-database.sql
    Then 创建 19 张数据表
    And 索引和约束正确创建

  Scenario: API 文档可访问
    Given 应用已启动
    When 访问 /doc.html
    Then 显示 Knife4j API 文档页面
    And 文档包含项目基本信息

  Scenario: Redis 连接正常
    Given Redis 服务已启动
    When 应用启动时连接 Redis
    Then 连接成功无报错
    And /actuator/health 显示 redis: UP
```

---

## 技术上下文

### 技术栈要求

| 组件 | 版本 | 说明 |
|------|------|------|
| Java | 17+ | LTS 版本 |
| Spring Boot | 3.2+ | 主框架 |
| PostgreSQL | 15+ | 主数据库，支持 JSONB |
| Redis | 7.x | 缓存、会话、限流 |
| MyBatis Plus | 3.5+ | ORM 框架 |
| Knife4j | 4.x | API 文档 |
| Gradle | 8.x | 构建工具 |

### 数据库表清单 (19 张)

**核心业务表 (9 张)**:
- `system_user` - 系统用户
- `training_camp` - 训练营
- `camp_member` - 训练营会员
- `camp_member_relation` - 会员关联
- `planet_user` - 知识星球用户
- `wechat_user` - 微信用户
- `payment_record` - 支付记录
- `checkin_record` - 打卡记录
- `refund_record` - 退款记录

**管理表 (5 张)**:
- `operation_log` - 操作日志
- `system_config` - 系统配置
- `notification_message` - 通知消息
- `planet_user_import_log` - 导入日志
- `sync_log` - 同步日志

**状态日志表 (5 张)**:
- `camp_status_log` - 训练营状态变更
- `payment_bind_status_log` - 支付绑定状态变更
- `order_status_log` - 订单状态变更
- `refund_status_log` - 退款状态变更
- `member_status_log` - 会员状态变更

---

## 实现任务清单

### Task 1: 创建 Gradle 项目结构

**目标**: 初始化 Spring Boot 3.2 项目

**文件**: `backend/build.gradle`

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.2.0'
    id 'io.spring.dependency-management' version '1.1.4'
}

group = 'com.yian'
artifactId = 'camp-refund'
version = '1.0.0-SNAPSHOT'

java {
    sourceCompatibility = '17'
}

repositories {
    mavenCentral()
}

dependencies {
    // Spring Boot Starters
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
    implementation 'org.springframework.boot:spring-boot-starter-data-redis'

    // MyBatis Plus
    implementation 'com.baomidou:mybatis-plus-spring-boot3-starter:3.5.5'

    // PostgreSQL
    runtimeOnly 'org.postgresql:postgresql'

    // Knife4j API 文档
    implementation 'com.github.xiaoymin:knife4j-openapi3-jakarta-spring-boot-starter:4.4.0'

    // Lombok
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'

    // 测试
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

**验证命令**:
```bash
cd backend && ./gradlew dependencies
```

---

### Task 2: 配置 application.yml

**目标**: 配置数据库、Redis、日志等

**文件**: `backend/src/main/resources/application.yml`

```yaml
server:
  port: 8080
  servlet:
    context-path: /

spring:
  application:
    name: camp-refund

  # 数据库配置
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:camp_db}
    username: ${DB_USERNAME:camp_user}
    password: ${DB_PASSWORD:}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000

  # Redis 配置
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}
      timeout: 10000ms

# MyBatis Plus 配置
mybatis-plus:
  mapper-locations: classpath*:/mapper/**/*.xml
  type-aliases-package: com.yian.camp.entity
  configuration:
    map-underscore-to-camel-case: true
    log-impl: org.apache.ibatis.logging.slf4j.Slf4jImpl
  global-config:
    db-config:
      id-type: auto
      logic-delete-field: deletedAt
      logic-delete-value: 'NOW()'
      logic-not-delete-value: 'NULL'

# Knife4j 配置
springdoc:
  api-docs:
    enabled: true
    path: /v3/api-docs
  swagger-ui:
    enabled: true
    path: /swagger-ui.html

knife4j:
  enable: true
  setting:
    language: zh_cn

# Actuator 配置
management:
  endpoints:
    web:
      exposure:
        include: health,info
  endpoint:
    health:
      show-details: when_authorized

# 日志配置
logging:
  level:
    root: INFO
    com.yian.camp: DEBUG
    org.mybatis: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
```

---

### Task 3: 创建启动类和基础配置

**文件**: `backend/src/main/java/com/yian/camp/CampApplication.java`

```java
package com.yian.camp;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.yian.camp.mapper")
public class CampApplication {

    public static void main(String[] args) {
        SpringApplication.run(CampApplication.class, args);
    }
}
```

**文件**: `backend/src/main/java/com/yian/camp/config/Knife4jConfig.java`

```java
package com.yian.camp.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class Knife4jConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("训练营押金退款系统 API")
                .version("1.0.0")
                .description("知识星球训练营自动押金退款系统 RESTful API 文档")
                .contact(new Contact()
                    .name("易安")
                    .email("yian@example.com")));
    }
}
```

---

### Task 4: 创建统一响应格式

**文件**: `backend/src/main/java/com/yian/camp/common/Result.java`

```java
package com.yian.camp.common;

import lombok.Data;
import java.time.Instant;

@Data
public class Result<T> {
    private Integer code;
    private String message;
    private T data;
    private Long timestamp;

    private Result() {
        this.timestamp = Instant.now().toEpochMilli();
    }

    public static <T> Result<T> success(T data) {
        Result<T> result = new Result<>();
        result.setCode(200);
        result.setMessage("success");
        result.setData(data);
        return result;
    }

    public static <T> Result<T> success() {
        return success(null);
    }

    public static <T> Result<T> error(int code, String message) {
        Result<T> result = new Result<>();
        result.setCode(code);
        result.setMessage(message);
        return result;
    }
}
```

---

### Task 5: 验证数据库脚本

**文件**: `scripts/init-database.sql` (已存在，需验证)

**验证命令**:
```bash
# 创建数据库
createdb camp_db

# 执行初始化脚本
psql -U postgres -d camp_db -f scripts/init-database.sql

# 验证表数量
psql -U postgres -d camp_db -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
# 预期结果: 19

# 验证核心表存在
psql -U postgres -d camp_db -c "\dt"
```

---

### Task 6: 创建健康检查端点测试

**文件**: `backend/src/test/java/com/yian/camp/HealthCheckTest.java`

```java
package com.yian.camp;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class HealthCheckTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void healthEndpointShouldReturnUp() throws Exception {
        mockMvc.perform(get("/actuator/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"));
    }
}
```

---

## 目录结构

```
backend/
├── build.gradle
├── settings.gradle
├── gradlew
├── gradlew.bat
├── gradle/
│   └── wrapper/
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
└── src/
    ├── main/
    │   ├── java/
    │   │   └── com/yian/camp/
    │   │       ├── CampApplication.java
    │   │       ├── common/
    │   │       │   └── Result.java
    │   │       ├── config/
    │   │       │   └── Knife4jConfig.java
    │   │       ├── controller/
    │   │       ├── service/
    │   │       │   └── impl/
    │   │       ├── mapper/
    │   │       ├── entity/
    │   │       ├── dto/
    │   │       ├── vo/
    │   │       └── exception/
    │   └── resources/
    │       ├── application.yml
    │       ├── application-dev.yml
    │       ├── application-prod.yml
    │       └── mapper/
    └── test/
        └── java/
            └── com/yian/camp/
                └── HealthCheckTest.java
```

---

## 架构合规要求

### 必须遵守

- [x] Controller 只做参数校验和响应封装
- [x] 使用统一响应格式 `Result<T>`
- [x] 敏感配置使用环境变量
- [x] 日志使用 Slf4j Logger
- [x] 遵循 RESTful API 设计规范

### 禁止事项

- ❌ 硬编码数据库密码
- ❌ 使用 System.out.println
- ❌ 跳过参数校验
- ❌ 在 Controller 层写业务逻辑

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
# 预期: Started CampApplication in X seconds
```

### 健康检查验证
```bash
curl http://localhost:8080/actuator/health
# 预期: {"status":"UP"}
```

### API 文档验证
```bash
# 浏览器访问
http://localhost:8080/doc.html
# 预期: 显示 Knife4j 文档页面
```

### 数据库连接验证
```bash
cd backend && ./gradlew test --tests "*HealthCheckTest*"
# 预期: BUILD SUCCESSFUL
```

---

## 相关文档

| 文档 | 路径 | 说明 |
|------|------|------|
| 技术方案 | `docs/v1/design/技术方案.md` | 整体技术设计 |
| 数据库设计 | `docs/v1/design/数据库设计.md` | 19张表详细设计 |
| API 设计规范 | `docs/v1/design/API设计规范.md` | RESTful 规范 |
| 状态枚举定义 | `docs/v1/design/状态枚举定义.md` | SSOT 状态值 |
| 初始化脚本 | `scripts/init-database.sql` | 数据库初始化 |

---

## 完成标准

- [ ] `./gradlew compileJava` 编译成功
- [ ] `./gradlew bootRun` 应用启动成功
- [ ] `/actuator/health` 返回 UP
- [ ] `/doc.html` 显示 API 文档
- [ ] 数据库 19 张表创建成功
- [ ] 单元测试通过

---

**创建时间**: 2025-12-13
**创建者**: Claude (create-story workflow)
**Epic**: EP01 - 基础框架与训练营管理
