# Stage 1：支付闭环（垂直切片）- 实施指南

> **文档版本**: v1.2
> **最后更新**: 2025-12-12
> **SSOT引用**: [状态枚举定义.md](../design/状态枚举定义.md) - bind_status、pay_status 等状态值定义

> **优化依据**：《[优化完成总结](../archive/优化完成总结.md) - P1-1》垂直切片原则
> **核心目标**：优先完成"用户报名→支付→绑定"最小可用路径（MVP）

---

## 🎯 Stage 1 目标

完成支付闭环端到端功能，最早暴露核心业务风险

**为什么优先做支付闭环？**
- ✅ 支付是核心业务，风险最高（微信支付对接、网络重试、幂等性）
- ✅ 前后端可基于明确接口并行开发
- ✅ 最早可测试核心业务逻辑
- ✅ 管理后台不阻塞支付功能，可在Stage 2开发

---

## 📦 后端任务拆分

### 任务 1.1：OAuth授权流程（4小时）

**参考文档**：
- `EP02-会员报名与支付.md - S2.1`
- `OAuth绑定完整时序图.md`

**交付物**：
- `GET /api/auth/authorize` - 发起OAuth授权
- `GET /api/auth/callback/wechat-mp` - 处理微信回调
- `wechat_user` 表CRUD

**AI提示词**：
```markdown
我需要实现微信公众号OAuth授权，参考《EP02-会员报名与支付.md - S2.1》和《OAuth绑定完整时序图.md》：

【接口1】GET /api/auth/authorize?returnUrl=/camps/1
- 生成state参数存入Redis（5分钟有效）
- 重定向到微信授权页

【接口2】GET /api/auth/callback/wechat-mp?code=xxx&state=yyy
- 验证state
- 用code换取access_token和openid
- 创建/更新wechat_user表
- 生成JWT token
- 重定向回returnUrl

【数据库表】wechat_user
CREATE TABLE wechat_user (
    id BIGSERIAL PRIMARY KEY,
    openid VARCHAR(100) UNIQUE NOT NULL,
    unionid VARCHAR(100),
    nickname VARCHAR(100),
    avatar_url TEXT,
    subscribe_status BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

请生成完整代码和单元测试。
```

---

### 任务 1.2：创建支付订单（3小时）

**参考文档**：
- `EP02-会员报名与支付.md - S2.2`
- `支付安全增强方案.md`

**交付物**：
- `POST /api/h5/orders` - 创建订单
- `payment_record` 表CRUD
- accessToken生成与Redis存储

**AI提示词**：
```markdown
我需要实现创建支付订单接口，参考《EP02-会员报名与支付.md - S2.2》：

【接口】POST /api/h5/orders
【请求】
{
  "campId": 1,
  "planetUserId": "123456789",  // 用户填写的星球ID
  "planetNickname": "小明"
}

【业务逻辑】
1. 验证训练营状态（enrolling）和人数限制
2. 检查重复报名
3. 生成订单号（ord_ + UUID）
4. 创建payment_record：
   - pay_status = pending
   - bind_status = pending
   - planet_user_id_from_user = "123456789"
5. 生成accessToken存入Redis
6. 调用微信统一下单API
7. 返回prepay_id和accessToken

【数据库表】payment_record
参考《数据库设计.md - payment_record表》

请生成完整代码和单元测试。
```

---

### 任务 1.3：微信支付回调处理（4小时）

**参考文档**：
- `EP02-会员报名与支付.md - S2.4`
- `支付安全增强方案.md - 阶段1`
- `OAuth绑定完整时序图.md - 步骤29-49`

**交付物**：
- `POST /api/webhook/wechat/payment` - 支付回调接口
- 签名验证、幂等性处理
- payment_record状态更新

**AI提示词**：
```markdown
我需要实现微信支付回调处理，参考《支付安全增强方案.md - 阶段1》：

【安全要求】
1. 微信签名验证
2. 时间窗口验证（5分钟内）
3. Redis分布式锁（幂等性）
4. 数据库唯一约束

【业务逻辑】
1. 验证签名
2. 获取Redis锁（key=payment:callback:{orderNo}）
3. 更新payment_record：
   - pay_status = success
   - bind_status = pending
   - bind_deadline = NOW() + 7天
4. 更新Redis accessToken状态为active
5. 记录payment_status_log
6. 返回<xml><return_code>SUCCESS</return_code></xml>

参考《OAuth绑定完整时序图.md - 步骤29-49》的详细流程。

请生成完整代码和单元测试。
```

---

### 任务 1.4：绑定星球账号（3小时）

**参考文档**：
- `EP02-会员报名与支付.md - S2.5`
- `OAuth绑定完整时序图.md - 步骤50-69`

**交付物**：
- `POST /api/h5/orders/{orderNo}/bind-planet` - 绑定接口
- `user_planet_binding` 表CRUD
- accessToken验证Filter

**AI提示词**：
```markdown
我需要实现用户绑定星球账号接口，参考《EP02-会员报名与支付.md - S2.5》：

【接口】POST /api/h5/orders/{orderNo}/bind-planet
【Header】X-Access-Token: tk_xxx
【请求】
{
  "planetUserId": "123456789",
  "planetNickname": "小明"
}

【验证链条】
1. 验证accessToken（Redis，status=active）
2. 验证orderNo匹配
3. 验证绑定期限（bind_deadline）

【业务逻辑】
1. 查询/创建planet_user
2. 创建user_planet_binding
3. 更新payment_record：
   - bind_status = completed
   - bind_method = user_fill
   - bound_at = NOW()
4. 更新accessToken状态为bound
5. 记录payment_bind_status_log
6. 返回群二维码URL

参考《OAuth绑定完整时序图.md - 步骤50-69》。

请生成完整代码和单元测试。
```

---

### 任务 1.5：查询订单状态（2小时）

**参考文档**：`EP02-会员报名与支付.md - S2.7`

**交付物**：`GET /api/h5/orders/{orderNo}/status`

**AI提示词**：
```markdown
我需要实现订单状态查询接口，参考《EP02-会员报名与支付.md - S2.7》：

【接口】GET /api/h5/orders/{orderNo}/status
【Header】X-Access-Token: tk_xxx

【响应示例（待绑定）】
{
  "orderNo": "ord_123",
  "payStatus": "SUCCESS",
  "bindStatus": "pending",
  "remainingBindTime": 518400,
  "accessToken": "tk_xxx"
}

【响应示例（已完成）】
{
  "orderNo": "ord_456",
  "payStatus": "SUCCESS",
  "bindStatus": "completed",
  "bindMethod": "user_fill",
  "groupQrcodeUrl": "https://..."
}

请生成完整代码和单元测试。
```

---

## 📱 前端任务拆分

### 任务 1.6：H5支付页面（6小时）

**参考文档**：`EP02-会员报名与支付.md`

**页面清单**：
1. **训练营详情页** (`/camps/:id`)
   - 显示训练营信息
   - 填写星球ID和昵称
   - 点击"立即报名"创建订单

2. **支付页面** (`/payment/:orderNo`)
   - 显示订单信息
   - 调用wx.chooseWXPay()唤起微信支付
   - 支付成功后轮询订单状态

3. **绑定页面** (`/bind-planet?token=tk_xxx` - Vue Router前端路由)
   - 从URL查询参数获取 token
   - 根据token调用后端API获取订单信息
   - 确认或修改星球信息
   - 提交绑定请求（调用后端API: `POST /api/h5/orders/{orderNo}/bind-planet`）
   - 显示群二维码

   > 📝 **路由说明**：
   > - **前端路由**: `/bind-planet?token=tk_xxx` (Vue Router，浏览器地址栏)
   > - **后端API**: `/api/h5/orders/{orderNo}/bind-planet` (Spring Boot接口)
   > - token 用于鉴权，orderNo 从token对应的订单信息中获取

**技术栈**：
- Vue 3 + Vite
- Vant 4.x UI组件
- Axios（已在Stage 0封装）

**AI提示词**：
```markdown
我需要创建H5支付流程页面，参考《EP02-会员报名与支付.md》：

【页面1】训练营详情页 CampDetail.vue
- 调用 GET /api/h5/camps/{id}
- 表单：星球ID、星球昵称
- 点击报名 → POST /api/h5/orders → 跳转支付页

【页面2】支付页面 Payment.vue
- 调用 GET /api/h5/orders/{orderNo}/params 获取prepay_id
- wx.chooseWXPay() 唤起支付
- 支付成功 → 轮询 GET /api/h5/orders/{orderNo}/status
- bindStatus=pending → 跳转绑定页

【页面3】绑定页面 Bind.vue
- 显示订单信息
- 确认星球信息
- POST /api/h5/orders/{orderNo}/bind-planet
- 绑定成功 → 显示群二维码

【路由配置】
/camps/:id - 详情页
/payment/:orderNo - 支付页
/bind-planet - 绑定页（通过?token=tk_xxx传递凭证）

请生成完整代码。
```

---

## ✅ Stage 1 验收标准

### 功能验收

- [ ] **OAuth授权流程**：
  - 用户可通过微信授权登录
  - 授权成功后获取JWT token
  - wechat_user表正确创建/更新

- [ ] **支付订单创建**：
  - 用户填写星球信息后可创建订单
  - 订单号格式正确（ord_xxx）
  - accessToken生成并存入Redis
  - 返回有效的prepay_id

- [ ] **微信支付回调**：
  - 签名验证通过
  - 幂等性处理正确（重复回调不重复更新）
  - payment_record状态正确更新
  - accessToken状态更新为active

- [ ] **绑定星球账号**：
  - accessToken验证通过
  - 绑定期限校验正确
  - user_planet_binding表创建成功
  - payment_record.bind_status更新为completed

- [ ] **H5页面流程**：
  - 完整走通：授权 → 填信息 → 支付 → 绑定 → 显示二维码
  - 支付失败/取消时有正确提示
  - 绑定超时时有正确提示

### 技术验收

- [ ] **单元测试**：Service层覆盖率≥80%
- [ ] **集成测试**：所有接口通过Postman测试
- [ ] **代码检查**：`./gradlew check` 通过
- [ ] **前端检查**：`npm run lint && npm run type-check` 通过

### 性能验收

- [ ] 支付回调响应时间 < 1s（含数据库操作）
- [ ] 订单状态查询响应时间 < 200ms
- [ ] accessToken验证响应时间 < 50ms

---

## 📊 Stage 1 数据库表清单

| 表名 | 用途 | 是否必须 |
|------|------|---------|
| `training_camp` | 训练营信息 | ✅ 必须（Stage 0已创建） |
| `wechat_user` | 微信用户 | ✅ 必须 |
| `payment_record` | 支付记录 | ✅ 必须 |
| `planet_user` | 星球用户 | ✅ 必须 |
| `user_planet_binding` | 绑定关系 | ✅ 必须 |
| `payment_status_log` | 支付状态日志 | ✅ 必须 |
| `payment_bind_status_log` | 绑定状态日志 | ✅ 必须 |
| `system_config` | 系统配置（微信配置） | ✅ 必须（Stage 0已创建） |

**不在Stage 1创建的表**：
- `camp_member` - Stage 2（打卡同步时创建）
- `checkin_record` - Stage 2
- `refund_record` - Stage 4
- 其他管理相关表 - Stage 2

---

## 🚀 并行开发建议

### 后端开发顺序

```
Day 1-2: 任务1.1 OAuth + 任务1.2 创建订单
Day 3: 任务1.3 支付回调（最复杂）
Day 4: 任务1.4 绑定接口 + 任务1.5 状态查询
Day 5: 联调 + 测试 + Bug修复
```

### 前端开发顺序

```
Day 1-2: 任务1.6 页面1（详情页） + 页面2（支付页）
Day 3-4: 页面3（绑定页） + 微信JSAPI调用
Day 5: 联调 + 测试 + Bug修复
```

### 前后端联调

- **Day 3-4**：前后端可并行开发（接口契约已明确）
- **Day 5**：集中联调和集成测试

---

## 📚 相关文档

- [EP02: 会员报名与支付](../user-stories/EP02-会员报名与支付.md) - 用户故事
- [OAuth绑定完整时序图](../diagrams/OAuth绑定完整时序图.md) - 详细时序
- [支付安全增强方案](../security/支付安全增强方案.md) - 安全实施
- [状态枚举定义](../design/状态枚举定义.md) - 状态值规范
- [API设计规范](../design/API设计规范.md) - 接口规范

---

**文档版本**：v1.2
**最后更新**：2025-12-12
**维护者**：技术架构组
