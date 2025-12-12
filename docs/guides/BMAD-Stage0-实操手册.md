# BMAD 实操手册 - Stage 0 完整演示

> 本文档演示如何使用 BMAD 完成 Stage 0 的所有任务
> 包含**可直接复制执行**的完整命令和提示词

---

## Stage 0 概述

| 任务 | 目标 | 预计时间 |
|-----|------|---------|
| 任务 0.1 | 后端项目骨架搭建 | 4小时 |
| 任务 0.2 | 核心数据表创建 | 2小时 |
| 任务 0.3 | H5前端骨架搭建 | 2小时 |

---

## 任务 0.1：后端项目骨架搭建

### 步骤 1：启动 Claude Code

```bash
cd /Users/stinglong/code/github/AutoDepositRefundAgent
claude
```

### 步骤 2：执行以下提示词

**直接复制粘贴整段内容**：

```markdown
我需要创建一个 Spring Boot 3.2+ 的后端项目骨架。

## 项目基本信息

- 项目路径：在当前项目根目录下创建 `backend/` 文件夹
- 项目名称：camp-backend
- 基础包名：com.camp
- 端口：8080
- Java 版本：17
- 构建工具：Gradle (Kotlin DSL)

## 依赖清单

请在 build.gradle.kts 中添加以下依赖：

```kotlin
dependencies {
    // Spring Boot
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-data-redis")

    // MyBatis Plus
    implementation("com.baomidou:mybatis-plus-boot-starter:3.5.5")

    // PostgreSQL
    runtimeOnly("org.postgresql:postgresql")

    // Knife4j (API文档)
    implementation("com.github.xiaoymin:knife4j-openapi3-jakarta-spring-boot-starter:4.4.0")

    // Hutool
    implementation("cn.hutool:hutool-all:5.8.25")

    // Lombok
    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}
```

## 目录结构

创建以下目录结构：

```
backend/
├── build.gradle.kts
├── settings.gradle.kts
├── gradle/
│   └── wrapper/
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── gradlew
├── gradlew.bat
├── src/
│   ├── main/
│   │   ├── java/com/camp/
│   │   │   ├── CampApplication.java
│   │   │   ├── config/
│   │   │   │   ├── MybatisPlusConfig.java
│   │   │   │   ├── RedisConfig.java
│   │   │   │   ├── Knife4jConfig.java
│   │   │   │   └── CorsConfig.java
│   │   │   ├── common/
│   │   │   │   ├── Result.java
│   │   │   │   ├── ResultCode.java
│   │   │   │   ├── BusinessException.java
│   │   │   │   └── GlobalExceptionHandler.java
│   │   │   └── controller/
│   │   │       └── HealthController.java
│   │   └── resources/
│   │       └── application.yml
│   └── test/
│       └── java/com/camp/
│           └── CampApplicationTests.java
```

## 配置文件 application.yml

```yaml
server:
  port: 8080

spring:
  application:
    name: camp-backend
  datasource:
    url: jdbc:postgresql://localhost:5432/camp_db
    username: camp_user
    password: camp_password
    driver-class-name: org.postgresql.Driver
  data:
    redis:
      host: localhost
      port: 6379

mybatis-plus:
  mapper-locations: classpath*:/mapper/**/*.xml
  global-config:
    db-config:
      id-type: auto
      logic-delete-field: deletedAt
      logic-delete-value: NOW()
      logic-not-delete-value: "NULL"
  configuration:
    map-underscore-to-camel-case: true
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl

springdoc:
  swagger-ui:
    path: /swagger-ui.html
  api-docs:
    path: /v3/api-docs

knife4j:
  enable: true
  setting:
    language: zh_cn

logging:
  level:
    com.camp: DEBUG
```

## 统一响应格式 Result.java

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Result<T> {
    private Integer code;
    private String message;
    private T data;
    private Long timestamp;

    public static <T> Result<T> success(T data) {
        return new Result<>(200, "成功", data, System.currentTimeMillis());
    }

    public static <T> Result<T> success() {
        return success(null);
    }

    public static <T> Result<T> error(Integer code, String message) {
        return new Result<>(code, message, null, System.currentTimeMillis());
    }

    public static <T> Result<T> error(ResultCode resultCode) {
        return error(resultCode.getCode(), resultCode.getMessage());
    }
}
```

## 错误码枚举 ResultCode.java

```java
@Getter
@AllArgsConstructor
public enum ResultCode {
    SUCCESS(200, "成功"),
    BAD_REQUEST(400, "请求参数错误"),
    UNAUTHORIZED(401, "未授权"),
    FORBIDDEN(403, "禁止访问"),
    NOT_FOUND(404, "资源不存在"),
    INTERNAL_ERROR(500, "系统内部错误"),

    // 业务错误码 1001-1499
    CAMP_NOT_FOUND(1001, "训练营不存在"),
    CAMP_ALREADY_EXISTS(1002, "训练营已存在"),
    CAMP_STATUS_ERROR(1003, "训练营状态不允许此操作"),
    PAYMENT_NOT_FOUND(1101, "支付记录不存在"),
    PAYMENT_EXPIRED(1102, "支付已过期"),
    MEMBER_NOT_FOUND(1201, "会员不存在");

    private final Integer code;
    private final String message;
}
```

## 健康检查接口 HealthController.java

```java
@RestController
@RequestMapping("/api")
@Tag(name = "系统接口", description = "健康检查等系统接口")
public class HealthController {

    @GetMapping("/health")
    @Operation(summary = "健康检查")
    public Result<String> health() {
        return Result.success("OK");
    }
}
```

## 验收标准

完成后执行以下验证：

1. 启动项目：
   ```bash
   cd backend
   ./gradlew bootRun
   ```

2. 测试健康检查接口：
   ```bash
   curl http://localhost:8080/api/health
   ```
   应返回：`{"code":200,"message":"成功","data":"OK","timestamp":...}`

3. 访问 API 文档：
   浏览器打开 http://localhost:8080/doc.html

请生成完整的项目代码。
```

### 步骤 3：验证结果

AI 生成代码后，执行验证：

```bash
# 进入后端目录
cd backend

# 启动项目
./gradlew bootRun

# 新开一个终端，测试接口
curl http://localhost:8080/api/health
```

预期输出：
```json
{"code":200,"message":"成功","data":"OK","timestamp":1702345678901}
```

打开浏览器访问：http://localhost:8080/doc.html

---

## 任务 0.2：核心数据表创建

### 步骤 1：确保 PostgreSQL 已启动

```bash
# 如果使用 Docker
docker run -d \
  --name camp-postgres \
  -e POSTGRES_USER=camp_user \
  -e POSTGRES_PASSWORD=camp_password \
  -e POSTGRES_DB=camp_db \
  -p 5432:5432 \
  postgres:15
```

### 步骤 2：执行以下提示词

```markdown
我需要创建 PostgreSQL 数据库初始化脚本。

## 输出文件

创建文件：`backend/src/main/resources/db/init-stage0.sql`

## 表结构

### 1. training_camp（训练营表）

```sql
CREATE TABLE training_camp (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '训练营名称',
    description TEXT COMMENT '训练营描述',
    poster_url VARCHAR(500) COMMENT '海报图片URL',
    deposit_amount DECIMAL(10,2) NOT NULL COMMENT '押金金额',
    start_date DATE NOT NULL COMMENT '开始日期',
    end_date DATE NOT NULL COMMENT '结束日期',
    total_days INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED COMMENT '总天数',
    required_days INTEGER NOT NULL COMMENT '需打卡天数',
    grace_days INTEGER DEFAULT 1 COMMENT '宽限天数',
    group_qrcode_url VARCHAR(500) COMMENT '群二维码URL',
    planet_project_id VARCHAR(50) COMMENT '知识星球项目ID',
    status VARCHAR(20) NOT NULL DEFAULT 'draft' COMMENT '状态',
    enroll_url VARCHAR(500) COMMENT '报名链接',
    member_count INTEGER DEFAULT 0 COMMENT '会员数量',
    paid_amount DECIMAL(12,2) DEFAULT 0 COMMENT '已收金额',
    refunded_amount DECIMAL(12,2) DEFAULT 0 COMMENT '已退金额',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

COMMENT ON TABLE training_camp IS '训练营表';

CREATE INDEX idx_training_camp_status ON training_camp(status);
CREATE INDEX idx_training_camp_start_date ON training_camp(start_date);
CREATE INDEX idx_training_camp_end_date ON training_camp(end_date);
```

### 2. planet_user（知识星球用户表）

```sql
CREATE TABLE planet_user (
    id BIGSERIAL PRIMARY KEY,
    planet_user_id VARCHAR(50) NOT NULL UNIQUE COMMENT '星球用户ID',
    member_number VARCHAR(50) UNIQUE COMMENT '成员编号',
    planet_nickname VARCHAR(100) COMMENT '星球昵称',
    avatar_url VARCHAR(500) COMMENT '头像URL',
    joined_at TIMESTAMP COMMENT '加入时间',
    role VARCHAR(20) DEFAULT 'member' COMMENT '角色',
    member_status VARCHAR(20) DEFAULT 'active' COMMENT '成员状态',
    raw_data JSONB COMMENT '原始数据',
    synced_at TIMESTAMP COMMENT '最后同步时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE planet_user IS '知识星球用户表';

CREATE INDEX idx_planet_user_planet_user_id ON planet_user(planet_user_id);
CREATE INDEX idx_planet_user_member_number ON planet_user(member_number);
CREATE INDEX idx_planet_user_nickname ON planet_user(planet_nickname);
```

### 3. system_user（系统用户表）

```sql
CREATE TABLE system_user (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(200) NOT NULL COMMENT '密码(BCrypt)',
    real_name VARCHAR(50) COMMENT '真实姓名',
    role VARCHAR(20) NOT NULL DEFAULT 'admin' COMMENT '角色',
    status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态',
    last_login_at TIMESTAMP COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE system_user IS '系统用户表';

CREATE INDEX idx_system_user_username ON system_user(username);
CREATE INDEX idx_system_user_role ON system_user(role);
```

### 4. system_config（系统配置表）

```sql
CREATE TABLE system_config (
    id BIGSERIAL PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    description VARCHAR(500) COMMENT '配置说明',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE system_config IS '系统配置表';

CREATE INDEX idx_system_config_key ON system_config(config_key);
```

## 初始数据

```sql
-- 默认管理员（密码: admin123，使用 BCrypt 加密）
INSERT INTO system_user (username, password, real_name, role, status)
VALUES ('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '超级管理员', 'super_admin', 'active');

-- 系统配置
INSERT INTO system_config (config_key, config_value, description) VALUES
('zsxq.group_id', '', '知识星球群组ID'),
('zsxq.token', '', '知识星球访问Token'),
('wechat.mp.appid', '', '微信公众号AppID'),
('wechat.mp.secret', '', '微信公众号Secret'),
('wechat.pay.mch_id', '', '微信支付商户号'),
('wechat.pay.api_key', '', '微信支付API密钥');
```

请生成完整的 SQL 脚本文件。
```

### 步骤 3：执行数据库脚本

```bash
# 使用 psql 执行
psql -h localhost -U camp_user -d camp_db -f backend/src/main/resources/db/init-stage0.sql

# 或者使用 Docker
docker exec -i camp-postgres psql -U camp_user -d camp_db < backend/src/main/resources/db/init-stage0.sql
```

### 步骤 4：验证数据库

```bash
# 连接数据库
psql -h localhost -U camp_user -d camp_db

# 查看表
\dt

# 应该看到：
#  training_camp
#  planet_user
#  system_user
#  system_config
```

---

## 任务 0.3：H5前端骨架搭建

### 步骤 1：执行以下提示词

```markdown
我需要创建一个 Vue 3 + Vant 4 的 H5 会员端项目骨架。

## 项目基本信息

- 项目路径：`frontend/h5-member/`
- 技术栈：Vue 3.3+ + Vite 5.x + Vant 4.x
- 包管理器：npm

## 目录结构

```
frontend/h5-member/
├── package.json
├── vite.config.js
├── index.html
├── .env.development
├── .env.production
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── router/
│   │   └── index.js
│   ├── views/
│   │   └── Home.vue
│   ├── utils/
│   │   └── request.js
│   └── assets/
│       └── styles/
│           └── global.css
```

## package.json

```json
{
  "name": "h5-member",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.2.0",
    "vant": "^4.8.0",
    "@vant/use": "^1.6.0",
    "axios": "^1.6.0",
    "pinia": "^2.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.0.0",
    "unplugin-vue-components": "^0.26.0",
    "@vant/auto-import-resolver": "^1.2.0"
  }
}
```

## vite.config.js

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [VantResolver()]
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
```

## src/utils/request.js

```javascript
import axios from 'axios'
import { showToast } from 'vant'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const accessToken = localStorage.getItem('accessToken')
    if (accessToken) {
      config.headers['X-Access-Token'] = accessToken
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code !== 200) {
      showToast(res.message || '请求失败')
      return Promise.reject(new Error(res.message))
    }
    return res
  },
  error => {
    console.error('请求失败:', error)
    showToast(error.message || '网络错误')
    return Promise.reject(error)
  }
)

export default request
```

## src/views/Home.vue

```vue
<template>
  <div class="home">
    <van-nav-bar title="训练营" />
    <div class="content">
      <van-empty description="欢迎使用训练营系统" />
      <van-button type="primary" block @click="testApi">
        测试 API 连接
      </van-button>
      <p v-if="apiStatus" class="status">{{ apiStatus }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import request from '@/utils/request'

const apiStatus = ref('')

const testApi = async () => {
  try {
    const res = await request.get('/health')
    apiStatus.value = `API 连接成功: ${res.data}`
  } catch (error) {
    apiStatus.value = `API 连接失败: ${error.message}`
  }
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: #f5f5f5;
}
.content {
  padding: 20px;
}
.status {
  margin-top: 20px;
  text-align: center;
  color: #666;
}
</style>
```

## .env.development

```
VITE_API_BASE_URL=/api
```

## 验收标准

1. 安装依赖：
   ```bash
   cd frontend/h5-member
   npm install
   ```

2. 启动开发服务器：
   ```bash
   npm run dev
   ```

3. 访问 http://localhost:5173 看到页面

4. 点击"测试 API 连接"按钮，显示"API 连接成功: OK"

请生成完整的项目代码。
```

### 步骤 2：安装依赖并启动

```bash
cd frontend/h5-member
npm install
npm run dev
```

### 步骤 3：验证

1. 浏览器访问 http://localhost:5173
2. 点击"测试 API 连接"按钮
3. 显示"API 连接成功: OK"

---

## Stage 0 完成检查清单

- [ ] 后端项目可以启动
- [ ] 健康检查接口返回正确
- [ ] Knife4j 文档页面可以访问
- [ ] 数据库表创建成功
- [ ] 初始数据插入成功
- [ ] H5 前端可以启动
- [ ] 前后端 API 连通

全部通过后，Stage 0 完成！进入 Stage 1。

---

## 下一步

继续执行 Stage 1，参考：
- `docs/v1/guides/dev-AI辅助敏捷开发计划.md`
- 找到 "Stage 1：支付闭环" 部分的 AI 提示词
