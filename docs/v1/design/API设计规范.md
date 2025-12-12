# API RESTful 设计规范

> **文档目的**：统一前后端接口设计规范，确保API的一致性和可维护性
> **SSOT引用**：[状态枚举定义.md](./状态枚举定义.md) - 所有状态枚举值定义

---

## 🎯 设计原则

### 1. RESTful 核心原则

- **资源导向**：URL表示资源，HTTP方法表示操作
- **无状态**：每个请求包含完整信息，不依赖服务器会话
- **统一接口**：标准HTTP方法（GET/POST/PUT/PATCH/DELETE）
- **可缓存性**：合理使用HTTP缓存头
- **分层系统**：客户端不需要知道是否直接连接到服务器

### 2. URL命名规范

#### 资源命名

- ✅ 使用**复数名词**：`/camps`, `/members`, `/payments`
- ✅ 使用**小写 + 连字符**：`/planet-binding`, `/qrcode-url`
- ❌ 避免驼峰命名：`/getPlanetBinding`（错误）
- ❌ 避免动词：`/createCamp`（错误）

#### 层级关系

```
✅ 推荐（层级 ≤ 3）:
/api/camps/{id}/members
/api/camps/{id}/members/{memberId}/checkins

❌ 避免（层级过深）:
/api/v1/admin/system/camps/{id}/members/{memberId}/checkins/detail
```

#### 版本控制

```
✅ 推荐（URL版本）:
/api/v1/camps
/api/v2/camps

✅ 可选（Header版本）:
Header: Accept-Version: v1

❌ 不推荐（无版本）:
/api/camps  （后续无法平滑升级）
```

---

## 📐 HTTP方法规范

| 方法 | 用途 | 幂等性 | 安全性 | 示例 |
|------|------|--------|--------|------|
| **GET** | 获取资源 | ✅ | ✅ | `GET /api/camps` |
| **POST** | 创建资源 | ❌ | ❌ | `POST /api/camps` |
| **PUT** | 完整更新资源 | ✅ | ❌ | `PUT /api/camps/{id}` |
| **PATCH** | 部分更新资源 | ✅ | ❌ | `PATCH /api/camps/{id}` |
| **DELETE** | 删除资源 | ✅ | ❌ | `DELETE /api/camps/{id}` |

### 示例对比

| 需求 | ❌ 不符合REST | ✅ 符合REST |
|------|-------------|-----------|
| 获取训练营列表 | `GET /api/admin/camp/list` | `GET /api/admin/camps` |
| 创建训练营 | `POST /api/admin/camp/create` | `POST /api/admin/camps` |
| 获取训练营详情 | `GET /api/admin/camp/detail/{id}` | `GET /api/admin/camps/{id}` |
| 更新训练营 | `POST /api/admin/camp/update/{id}` | `PUT /api/admin/camps/{id}` |
| 删除训练营 | `POST /api/admin/camp/delete/{id}` | `DELETE /api/admin/camps/{id}` |
| 发布训练营 | `POST /api/admin/camp/publish/{id}` | `POST /api/admin/camps/{id}/publish` |
| 审核退款 | `POST /api/admin/refund/approve` | `PUT /api/admin/refunds/{id}/approval` |
| 绑定星球账号 | `POST /api/h5/order/bindPlanet` | `POST /api/h5/orders/{orderNo}/planet-binding` |

---

## 📋 统一响应格式

### 1. 成功响应

```json
{
  "code": 200,
  "message": "成功",
  "data": {
    // 业务数据
  },
  "timestamp": 1701675600000
}
```

### 2. 分页响应

```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "items": [
      // 数据列表
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  },
  "timestamp": 1701675600000
}
```

### 3. 错误响应

```json
{
  "code": 400,
  "message": "参数校验失败",
  "errors": [
    {
      "field": "depositAmount",
      "message": "押金金额必须在1-999之间",
      "rejectedValue": 1000
    }
  ],
  "traceId": "a1b2c3d4-5678-90ab-cdef",
  "timestamp": 1701675600000
}
```

---

## 🔢 HTTP状态码规范

### 2xx 成功

| 状态码 | 含义 | 使用场景 |
|--------|------|---------|
| **200 OK** | 请求成功 | GET/PUT/PATCH成功 |
| **201 Created** | 资源已创建 | POST创建成功 |
| **204 No Content** | 请求成功但无返回内容 | DELETE成功 |

### 4xx 客户端错误

| 状态码 | 含义 | 使用场景 |
|--------|------|---------|
| **400 Bad Request** | 参数错误 | 参数校验失败 |
| **401 Unauthorized** | 未认证 | JWT token无效/过期 |
| **403 Forbidden** | 无权限 | 权限不足 |
| **404 Not Found** | 资源不存在 | 订单号/训练营不存在 |
| **409 Conflict** | 资源冲突 | 重复报名/订单号已存在 |
| **429 Too Many Requests** | 请求过于频繁 | 触发限流 |

### 5xx 服务器错误

| 状态码 | 含义 | 使用场景 |
|--------|------|---------|
| **500 Internal Server Error** | 服务器内部错误 | 未捕获的异常 |
| **503 Service Unavailable** | 服务不可用 | 维护中/过载 |

---

## 🎨 错误码设计

### 分类规则

```
错误码格式: XYZZ
X: 错误类别（1=业务, 2=系统, 3=第三方）
Y: 子类别
ZZ: 具体错误序号

示例:
1001-1099: 训练营相关错误
1101-1199: 支付相关错误
1201-1299: 退款相关错误
```

### 错误码清单

| 错误码 | HTTP状态码 | 错误信息 | 说明 |
|--------|-----------|---------|------|
| **1001** | 404 | 训练营不存在 | 查询的训练营ID无效 |
| **1002** | 400 | 训练营已满员 | 报名人数达到上限 |
| **1003** | 400 | 训练营已结束 | 无法报名已结束的训练营 |
| **1101** | 400 | 订单不存在 | 查询的订单号无效 |
| **1102** | 409 | 重复报名 | 用户已报名此训练营 |
| **1103** | 401 | 访问凭证无效 | accessToken过期或无效 |
| **1104** | 400 | 绑定期限已过 | 超过7天绑定期限 |
| **1201** | 404 | 退款记录不存在 | 查询的退款ID无效 |
| **1202** | 400 | 退款状态异常 | 当前状态不允许此操作 |
| **2001** | 500 | 数据库连接失败 | 无法连接数据库 |
| **2002** | 500 | Redis连接失败 | 无法连接缓存服务 |
| **3001** | 503 | 微信支付服务异常 | 调用微信支付API失败 |
| **3002** | 503 | 知识星球API异常 | 调用星球API失败 |

### Java异常映射

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CampNotFoundException.class)
    public Result<Void> handleCampNotFound(CampNotFoundException e) {
        return Result.error(1001, "训练营不存在");
    }

    @ExceptionHandler(DuplicateEnrollmentException.class)
    public Result<Void> handleDuplicateEnrollment(DuplicateEnrollmentException e) {
        return Result.error(1102, "您已报名此训练营，请勿重复支付");
    }

    @ExceptionHandler(AccessTokenExpiredException.class)
    public Result<Void> handleAccessTokenExpired(AccessTokenExpiredException e) {
        return Result.error(1103, "访问凭证已过期，请重新获取");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<Void> handleValidationError(MethodArgumentNotValidException e) {
        List<FieldError> fieldErrors = e.getBindingResult().getFieldErrors();
        List<ErrorDetail> errors = fieldErrors.stream()
            .map(error -> new ErrorDetail(
                error.getField(),
                error.getDefaultMessage(),
                error.getRejectedValue()
            ))
            .collect(Collectors.toList());

        return Result.error(400, "参数校验失败", errors);
    }
}
```

---

## 🔍 查询参数规范

### 1. 分页参数

```
GET /api/camps?page=1&pageSize=20&sort=createdAt,desc

标准参数名:
- page: 页码（从1开始）
- pageSize: 每页数量（默认20，最大100）
- sort: 排序字段（格式: field,direction）
```

### 2. 过滤参数

```
GET /api/camps?status=ENROLLING&depositAmount=99&startDate[gte]=2025-01-01

过滤规则:
- 精确匹配: status=ENROLLING
- 范围查询:
  - startDate[gte]=2025-01-01  （大于等于）
  - endDate[lte]=2025-12-31    （小于等于）
- 模糊搜索: name[like]=早起
- 多选: tags[in]=健身,早起,读书
```

### 3. 搜索参数

```
GET /api/members?q=小明&searchFields=wechatNickname,planetNickname

- q: 搜索关键词
- searchFields: 指定搜索字段（可选）
```

---

## 🔐 认证与授权

### 1. JWT认证（管理端）

```
Request:
GET /api/admin/camps
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response（token无效）:
HTTP 401 Unauthorized
{
  "code": 401,
  "message": "JWT token无效或已过期"
}
```

### 2. accessToken验证（H5端）

```
Request:
GET /api/h5/orders/ord_123/status
X-Access-Token: tk_a1b2c3d4-5678-90ab-cdef

Response（token无效）:
HTTP 401 Unauthorized
{
  "code": 1103,
  "message": "访问凭证无效，请重新获取"
}
```

### 3. 无需认证接口

```
公开接口（白名单）:
- GET /api/h5/camps          （训练营列表）
- GET /api/h5/camps/{id}     （训练营详情）
- POST /api/h5/orders         （创建订单）
- GET /api/auth/authorize     （OAuth授权）
```

---

## 📦 请求体规范

### 1. JSON格式

```json
POST /api/camps
Content-Type: application/json

{
  "name": "21天早起训练营",
  "depositAmount": 99.00,
  "startDate": "2025-01-01",
  "endDate": "2025-01-21",
  "requiredDays": 18,
  "totalDays": 21
}
```

### 2. 表单格式

```
POST /api/upload
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="file"; filename="poster.jpg"
Content-Type: image/jpeg

[二进制数据]
--boundary--
```

### 3. 数据类型

| 字段类型 | 格式 | 示例 |
|---------|------|------|
| 日期 | `yyyy-MM-dd` | `"2025-01-01"` |
| 时间 | `yyyy-MM-dd HH:mm:ss` | `"2025-01-01 08:00:00"` |
| 日期时间（ISO 8601） | `yyyy-MM-dd'T'HH:mm:ss` | `"2025-01-01T08:00:00"` |
| 金额 | 数字（保留2位小数） | `99.00` |
| 布尔值 | `true` / `false` | `true` |
| 枚举 | 字符串 | `"ENROLLING"` |

---

## 🎯 接口幂等性

### 幂等性要求

| HTTP方法 | 是否幂等 | 说明 |
|---------|---------|------|
| GET | ✅ | 多次查询结果相同 |
| POST | ❌ | 每次创建新资源 |
| PUT | ✅ | 多次更新结果相同 |
| PATCH | ✅ | 多次更新结果相同 |
| DELETE | ✅ | 多次删除结果相同（已删除） |

### POST幂等性设计

**方案1：客户端生成唯一请求ID**

```
POST /api/payments
Idempotency-Key: req_a1b2c3d4-5678-90ab-cdef

{
  "campId": 1,
  "amount": 99.00
}
```

**后端实现**：
```java
@PostMapping("/api/payments")
public Result<PaymentResponse> createPayment(
        @RequestHeader("Idempotency-Key") String idempotencyKey,
        @RequestBody PaymentRequest request) {

    // 检查Redis中是否已处理过此请求
    String cacheKey = "idempotency:" + idempotencyKey;
    String cachedResponse = redis.get(cacheKey);

    if (cachedResponse != null) {
        log.info("Duplicate request detected: {}", idempotencyKey);
        return JSON.parseObject(cachedResponse, Result.class);
    }

    // 处理业务逻辑
    PaymentResponse response = paymentService.createPayment(request);
    Result<PaymentResponse> result = Result.success(response);

    // 缓存响应（24小时）
    redis.setex(cacheKey, 86400, JSON.toJSONString(result));

    return result;
}
```

---

## 📝 接口文档示例

### 完整接口定义

```
### 创建训练营

#### 接口信息
- 接口路径: POST /api/admin/camps
- 认证方式: JWT (Bearer Token)
- 权限要求: ADMIN

#### 请求参数
**Header**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| Authorization | String | 是 | JWT token |

**Body (application/json)**:
| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| name | String | 是 | 训练营名称 | "21天早起训练营" |
| depositAmount | Number | 是 | 押金金额（1-999） | 99.00 |
| startDate | String | 是 | 开始日期 | "2025-01-01" |
| endDate | String | 是 | 结束日期 | "2025-01-21" |
| requiredDays | Integer | 是 | 要求打卡天数 | 18 |
| totalDays | Integer | 否 | 总天数（自动计算） | 21 |

#### 响应示例
**成功（201 Created）**:
```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": 1,
    "name": "21天早起训练营",
    "depositAmount": 99.00,
    "status": "DRAFT",
    "createdAt": "2025-01-01T10:00:00"
  },
  "timestamp": 1701675600000
}
```

**失败（400 Bad Request）**:
```json
{
  "code": 400,
  "message": "参数校验失败",
  "errors": [
    {
      "field": "depositAmount",
      "message": "押金金额必须在1-999之间",
      "rejectedValue": 1000
    }
  ],
  "traceId": "a1b2c3d4-5678-90ab-cdef",
  "timestamp": 1701675600000
}
```

#### 错误码
| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| 400 | 400 | 参数校验失败 |
| 401 | 401 | JWT token无效 |
| 403 | 403 | 无权限操作 |
```

---

## ✅ 接口重构清单

### 需要重构的接口

| 当前接口 | 问题 | 重构后 | 优先级 |
|---------|------|--------|--------|
| `/api/admin/camp/list` | 动词出现在URL | `/api/admin/camps` | P1 |
| `/api/admin/camp/create` | 动词create冗余 | `/api/admin/camps` (POST) | P1 |
| `/api/admin/refund/approve` | 动作型endpoint | `/api/admin/refunds/{id}/approval` (PUT) | P1 |
| `/api/h5/order/bindPlanet` | 驼峰命名 | `/api/h5/orders/{orderNo}/planet-binding` | P0 |
| `/api/h5/order/progress` | 语义不明 | `/api/h5/orders/{orderNo}/refund-status` | P1 |

### 重构步骤

1. **兼容性过渡**（推荐）：
   - 新接口按规范实现
   - 旧接口标记为`@Deprecated`
   - 保留旧接口3个版本（约6个月）
   - 前端逐步迁移到新接口

2. **直接替换**（小心）：
   - 仅在Stage 0阶段（无历史数据）
   - 前后端同步修改
   - 确保所有调用方都已更新

---

## 📚 参考资料

- [RESTful API Design](https://restfulapi.net/)
- [Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines)
- [Google API Design Guide](https://cloud.google.com/apis/design)

---

**文档版本**：v1.0
**最后更新**：2025-12-04
**维护者**：技术架构组
