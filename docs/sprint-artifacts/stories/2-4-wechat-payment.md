# Story 2.4: 微信支付下单与调起

**Status**: ready-for-dev

---

## Story

**作为**一名已绑定星球账号的会员，
**我希望**通过微信支付完成训练营押金缴纳，
**以便于**正式加入训练营并获得入群资格。

---

## 验收标准

### AC-1: 报名确认页展示
```gherkin
Feature: 报名确认页
  Scenario: 显示报名确认信息
    Given 用户已登录且已绑定星球账号
    And 用户从训练营详情页点击「立即报名」
    When 进入报名确认页 /enroll-confirm?campId={id}
    Then 显示训练营名称
    And 显示押金金额（格式：¥99.00）
    And 显示用户星球昵称（从 wechat_user 读取）
    And 显示用户星球ID（脱敏显示：123****789）
    And 显示「确认支付」按钮
    And 显示支付说明文案
```

### AC-2: 创建支付订单
```gherkin
Feature: 创建支付订单
  Scenario: 成功创建订单
    Given 用户在报名确认页
    When 点击「确认支付」按钮
    Then 调用 POST /api/h5/orders
    And 请求体包含 { campId, planetUserId, planetNickname, wechatNickname }
    And 后端创建 payment_record 记录:
      | 字段 | 值 |
      | order_no | ord_ + UUID |
      | camp_id | 训练营ID |
      | wechat_user_id | 当前用户ID |
      | amount | 训练营押金金额 |
      | pay_status | pending |
    And 返回 orderNo 和 payUrl
```

### AC-3: 获取微信支付参数
```gherkin
  Scenario: 获取支付参数
    Given 已创建支付订单并获得 orderNo
    When 调用 GET /api/h5/orders/{orderNo}/params
    Then 后端调用微信支付统一下单接口
    And 返回支付参数:
      | 字段 | 说明 |
      | appId | 公众号AppID |
      | timeStamp | 时间戳 |
      | nonceStr | 随机字符串 |
      | package | prepay_id=xxx |
      | signType | RSA |
      | paySign | 签名 |
```

### AC-4: 调起微信支付
```gherkin
  Scenario: 调起微信支付（公众号环境）
    Given 前端获取到支付参数
    And 当前在微信内置浏览器中
    When 调用 WeixinJSBridge.invoke('getBrandWCPayRequest', payParams)
    Then 弹出微信支付确认框
    And 用户输入支付密码
    And 支付成功后触发回调

  Scenario: 非微信环境提示
    Given 前端获取到支付参数
    And 当前不在微信内置浏览器中
    Then 显示提示「请在微信中打开此页面完成支付」
```

### AC-5: 支付结果轮询
```gherkin
  Scenario: 轮询支付状态
    Given 用户完成微信支付操作
    When WeixinJSBridge 回调 res.err_msg == "get_brand_wcpay_request:ok"
    Then 前端开始轮询 GET /api/h5/orders/{orderNo}/status
    And 轮询间隔 2 秒
    And 最大轮询时间 30 秒

  Scenario: 支付成功
    Given 轮询返回 payStatus = "success"
    Then 停止轮询
    And 获取响应中的 accessToken
    And 跳转到支付成功页 /pay-success?orderNo={orderNo}
```

### AC-6: 重复报名检测
```gherkin
  Scenario: 用户已报名该训练营
    Given 用户已对该训练营支付成功
    When 再次尝试创建订单 POST /api/h5/orders
    Then 返回错误码 1001
    And 错误信息为「您已报名该训练营，无需重复报名」
    And 前端显示提示并跳转到进度查询页
```

### AC-7: 订单超时处理
```gherkin
  Scenario: 订单超时未支付
    Given 订单创建后超过 30 分钟未支付
    When 用户尝试获取支付参数
    Then 返回错误码 1002
    And 错误信息为「订单已过期，请重新报名」

  Scenario: 轮询超时
    Given 轮询支付状态超过 30 秒
    And payStatus 仍为 "pending"
    Then 停止轮询
    And 显示「支付确认中，请稍后查看」
    And 提供「查看订单状态」按钮
```

### AC-8: 支付失败处理
```gherkin
  Scenario: 用户取消支付
    Given WeixinJSBridge 回调 res.err_msg == "get_brand_wcpay_request:cancel"
    Then 显示「支付已取消」
    And 保留在当前页面
    And 允许重新点击支付

  Scenario: 支付失败
    Given WeixinJSBridge 回调 res.err_msg == "get_brand_wcpay_request:fail"
    Then 显示「支付失败，请重试」
    And 保留在当前页面
    And 允许重新点击支付
```

### AC-9: attach 字段透传
```gherkin
  Scenario: 支付订单携带业务数据
    Given 创建微信支付订单
    Then attach 字段包含 JSON:
      | 字段 | 值 |
      | campId | 训练营ID |
      | wechatUserId | 微信用户ID |
      | planetMemberNumber | 星球编号 |
    And attach 用于支付回调时解析业务数据
```

### AC-10: 金额校验
```gherkin
  Scenario: 金额一致性校验
    Given 训练营押金为 99.00 元
    When 创建支付订单
    Then 微信支付金额为 9900 分
    And payment_record.amount = 99.00
    And 前端显示金额 = ¥99.00
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - 微信支付 Manager 封装** (AC: #3, #9, #10)
  - [ ] 1.1 创建 `WechatPayManager.java` - 微信支付 API 封装
  - [ ] 1.2 实现 `createPrepayOrder()` - 调用统一下单接口 /v3/pay/transactions/jsapi
  - [ ] 1.3 实现 `buildPayParams()` - 构建前端支付参数并签名
  - [ ] 1.4 实现金额转换 (元 → 分)
  - [ ] 1.5 配置微信支付参数 (application.yml):
    - `wechat.pay.mch-id` - 商户号
    - `wechat.pay.api-key` - API 密钥
    - `wechat.pay.cert-path` - 证书路径
    - `wechat.pay.notify-url` - 回调地址
  - [ ] 1.6 编写单元测试 - Mock 微信 API 响应

- [ ] **Task 2: 后端 - 创建订单接口** (AC: #2, #6, #9)
  - [ ] 2.1 创建 `PaymentH5Controller.java`
  - [ ] 2.2 实现 `POST /api/h5/orders` 接口:
    - 验证用户已登录 (JWT)
    - 验证训练营存在且可报名 (status=enrolling)
    - 检查重复报名 (同一用户+同一训练营)
    - 生成订单号 (ord_ + UUID)
    - 创建 payment_record 记录
    - 返回 orderNo 和 payUrl
  - [ ] 2.3 实现请求参数校验
  - [ ] 2.4 编写集成测试

- [ ] **Task 3: 后端 - 获取支付参数接口** (AC: #3, #7)
  - [ ] 3.1 实现 `GET /api/h5/orders/{orderNo}/params` 接口:
    - 验证订单存在且属于当前用户
    - 检查订单是否过期 (30分钟)
    - 调用 WechatPayManager 创建预支付订单
    - 返回支付参数
  - [ ] 3.2 缓存 prepay_id (避免重复调用微信接口)
  - [ ] 3.3 编写单元测试

- [ ] **Task 4: 后端 - 查询支付状态接口** (AC: #5)
  - [ ] 4.1 实现 `GET /api/h5/orders/{orderNo}/status` 接口:
    - 查询 payment_record 状态
    - 支付成功时生成 accessToken
    - 返回 payStatus, bindStatus, accessToken 等
  - [ ] 4.2 实现 accessToken 生成逻辑 (tk_ + UUID)
  - [ ] 4.3 Redis 存储 accessToken 结构
  - [ ] 4.4 编写单元测试

- [ ] **Task 5: 后端 - PaymentRecord 数据访问** (AC: #2)
  - [ ] 5.1 创建 `PaymentRecord.java` 实体类
  - [ ] 5.2 创建 `PaymentRecordMapper.java`
  - [ ] 5.3 实现查询方法:
    - `findByOrderNo(orderNo)`
    - `findByCampIdAndWechatUserId(campId, wechatUserId)`
    - `countByCampIdAndWechatUserIdAndPayStatus(campId, wechatUserId, 'success')`
  - [ ] 5.4 编写 Mapper 测试

- [ ] **Task 6: 后端 - 订单号生成与安全** (AC: #2, #9)
  - [ ] 6.1 实现订单号生成器 (ord_ + UUID v4)
  - [ ] 6.2 确保订单号不可预测
  - [ ] 6.3 添加订单号唯一索引

- [ ] **Task 7: 前端 - 报名确认页** (AC: #1, #2, #8)
  - [ ] 7.1 创建 `src/views/EnrollConfirm.vue`
  - [ ] 7.2 实现页面布局 (训练营信息、用户信息、支付按钮)
  - [ ] 7.3 实现「确认支付」按钮点击逻辑
  - [ ] 7.4 实现加载状态和错误处理
  - [ ] 7.5 编写组件单元测试

- [ ] **Task 8: 前端 - 微信支付调用** (AC: #4, #8)
  - [ ] 8.1 创建 `src/utils/wechatPay.ts`
  - [ ] 8.2 实现 `invokeWechatPay(payParams)` - 调用 WeixinJSBridge
  - [ ] 8.3 实现微信环境检测 `isWechatBrowser()`
  - [ ] 8.4 处理支付回调 (ok/cancel/fail)
  - [ ] 8.5 编写工具函数测试

- [ ] **Task 9: 前端 - 支付状态轮询** (AC: #5, #7)
  - [ ] 9.1 创建 `src/composables/usePaymentPolling.ts`
  - [ ] 9.2 实现轮询逻辑 (间隔 2s, 最大 30s)
  - [ ] 9.3 实现轮询结果处理 (成功跳转/超时提示)
  - [ ] 9.4 保存 accessToken 到 localStorage
  - [ ] 9.5 编写 Composable 测试

- [ ] **Task 10: 前端 - API 封装** (AC: #2, #3, #5)
  - [ ] 10.1 创建 `src/api/payment.ts`:
    - `createOrder(data)` → POST /api/h5/orders
    - `getPayParams(orderNo)` → GET /api/h5/orders/{orderNo}/params
    - `getOrderStatus(orderNo)` → GET /api/h5/orders/{orderNo}/status
  - [ ] 10.2 定义接口类型

- [ ] **Task 11: 前端 - 路由配置** (AC: #1)
  - [ ] 11.1 添加路由: `/enroll-confirm` → EnrollConfirm.vue
  - [ ] 11.2 添加路由守卫: 需要登录且已绑定星球

- [ ] **Task 12: 集成测试与验收** (AC: #全部)
  - [ ] 12.1 使用微信开发者工具测试完整支付流程
  - [ ] 12.2 测试重复报名检测
  - [ ] 12.3 测试订单超时处理
  - [ ] 12.4 测试支付取消和失败场景
  - [ ] 12.5 验证 attach 字段正确传递

---

## Dev Notes

### 业务流程概述

本故事实现会员支付押金的核心流程，是报名流程的关键环节。

```
用户在报名确认页 → 点击「确认支付」
     ↓
创建支付订单 POST /api/h5/orders
     ↓
获取支付参数 GET /api/h5/orders/{orderNo}/params
     ↓
调用 WeixinJSBridge 调起微信支付
     ↓
用户完成支付 → 微信异步回调 (2-5 处理)
     ↓
前端轮询 GET /api/h5/orders/{orderNo}/status
     ↓
payStatus=success → 获取 accessToken → 跳转支付成功页
```

### 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 支付接口版本 | 微信支付 V3 | 安全性更高，签名使用 RSA |
| 订单号格式 | ord_ + UUID | 不可预测，防枚举攻击 |
| 金额单位 | 数据库存元，API 传分 | 符合微信支付规范 |
| 支付结果获取 | 前端轮询 | 简单可靠，兼容性好 |
| 轮询策略 | 2秒间隔，30秒超时 | 平衡用户体验和服务器压力 |

### 微信支付 V3 签名流程

```
1. 构造签名串
   HTTP请求方法\n
   URL\n
   请求时间戳\n
   请求随机串\n
   请求报文主体\n

2. 使用商户私钥进行 SHA256withRSA 签名

3. 将签名值放入 Authorization Header
```

### API 接口规范

#### 1. 创建支付订单

**请求**:
```
POST /api/h5/orders
Authorization: Bearer {jwt}
Content-Type: application/json

{
  "campId": 1,
  "planetUserId": "123456789",
  "planetNickname": "小明同学",
  "wechatNickname": "小明"
}
```

**响应成功**:
```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "orderId": 10001,
    "orderNo": "ord_a1b2c3d4-5678-90ab-cdef",
    "amount": 99.00,
    "status": "pending",
    "expireTime": "2025-12-13T12:30:00",
    "payUrl": "/api/h5/orders/ord_a1b2c3d4-5678-90ab-cdef/params"
  },
  "timestamp": 1730000000
}
```

**响应失败 (重复报名)**:
```json
{
  "code": 1001,
  "message": "您已报名该训练营，无需重复报名",
  "data": null,
  "timestamp": 1730000000
}
```

#### 2. 获取支付参数

**请求**:
```
GET /api/h5/orders/{orderNo}/params
```

**响应成功**:
```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "orderNo": "ord_a1b2c3d4-5678-90ab-cdef",
    "amount": 99.00,
    "description": "21天早起打卡训练营 - 押金",
    "payParams": {
      "appId": "wx1234567890abcdef",
      "timeStamp": "1730000000",
      "nonceStr": "abc123xyz789",
      "package": "prepay_id=wx20251213120000abcdef",
      "signType": "RSA",
      "paySign": "xxxxxxxxxxxxxxxx"
    },
    "expireTime": "2025-12-13T12:30:00"
  },
  "timestamp": 1730000000
}
```

#### 3. 查询支付状态

**请求**:
```
GET /api/h5/orders/{orderNo}/status
```

**响应成功 (已支付)**:
```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "orderNo": "ord_a1b2c3d4-5678-90ab-cdef",
    "payStatus": "success",
    "bindStatus": "completed",
    "bindMethod": "h5_bindplanet",
    "payTime": "2025-12-13T12:05:30",
    "memberId": 1001,
    "showQrcode": true,
    "accessToken": "tk_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  },
  "timestamp": 1730000000
}
```

### 代码实现参考

#### WechatPayManager.java

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class WechatPayManager {

    @Value("${wechat.pay.mch-id}")
    private String mchId;

    @Value("${wechat.pay.app-id}")
    private String appId;

    @Value("${wechat.pay.notify-url}")
    private String notifyUrl;

    private final WechatPayHttpClient httpClient;
    private final PrivateKey merchantPrivateKey;

    /**
     * 创建 JSAPI 预支付订单
     */
    public PrepayResult createJsapiOrder(CreateOrderRequest request) {
        String url = "https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi";

        // 构建请求体
        Map<String, Object> body = new HashMap<>();
        body.put("appid", appId);
        body.put("mchid", mchId);
        body.put("description", request.getDescription());
        body.put("out_trade_no", request.getOrderNo());
        body.put("notify_url", notifyUrl);

        // 金额（分）
        Map<String, Object> amount = new HashMap<>();
        amount.put("total", request.getAmountInCents());
        amount.put("currency", "CNY");
        body.put("amount", amount);

        // 支付者 OpenID
        Map<String, Object> payer = new HashMap<>();
        payer.put("openid", request.getOpenId());
        body.put("payer", payer);

        // attach 业务数据
        Map<String, Object> attachData = new HashMap<>();
        attachData.put("campId", request.getCampId());
        attachData.put("wechatUserId", request.getWechatUserId());
        attachData.put("planetMemberNumber", request.getPlanetMemberNumber());
        body.put("attach", JsonUtils.toJson(attachData));

        // 调用微信接口
        String response = httpClient.post(url, body);
        Map<String, Object> result = JsonUtils.parseMap(response);

        return PrepayResult.builder()
            .prepayId((String) result.get("prepay_id"))
            .build();
    }

    /**
     * 构建前端支付参数
     */
    public JsapiPayParams buildPayParams(String prepayId) {
        String timeStamp = String.valueOf(System.currentTimeMillis() / 1000);
        String nonceStr = UUID.randomUUID().toString().replace("-", "");
        String packageStr = "prepay_id=" + prepayId;

        // 构造签名串
        String signMessage = appId + "\n"
            + timeStamp + "\n"
            + nonceStr + "\n"
            + packageStr + "\n";

        // RSA 签名
        String paySign = signWithRSA(signMessage);

        return JsapiPayParams.builder()
            .appId(appId)
            .timeStamp(timeStamp)
            .nonceStr(nonceStr)
            .packageValue(packageStr)
            .signType("RSA")
            .paySign(paySign)
            .build();
    }

    private String signWithRSA(String message) {
        try {
            Signature signature = Signature.getInstance("SHA256withRSA");
            signature.initSign(merchantPrivateKey);
            signature.update(message.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(signature.sign());
        } catch (Exception e) {
            throw new BusinessException("签名失败", e);
        }
    }
}
```

#### PaymentH5Controller.java

```java
@RestController
@RequestMapping("/api/h5")
@RequiredArgsConstructor
@Slf4j
public class PaymentH5Controller {

    private final PaymentService paymentService;

    /**
     * 创建支付订单
     */
    @PostMapping("/orders")
    public Result<CreateOrderVO> createOrder(
            @RequestBody @Valid CreateOrderRequest request,
            @AuthenticationPrincipal JwtUserDetails user) {

        // 检查重复报名
        if (paymentService.hasEnrolled(request.getCampId(), user.getWechatUserId())) {
            throw new BusinessException(1001, "您已报名该训练营，无需重复报名");
        }

        CreateOrderVO vo = paymentService.createOrder(request, user.getWechatUserId());
        return Result.success(vo);
    }

    /**
     * 获取支付参数
     */
    @GetMapping("/orders/{orderNo}/params")
    public Result<PayParamsVO> getPayParams(@PathVariable String orderNo) {
        PayParamsVO vo = paymentService.getPayParams(orderNo);
        return Result.success(vo);
    }

    /**
     * 查询支付状态
     */
    @GetMapping("/orders/{orderNo}/status")
    public Result<OrderStatusVO> getOrderStatus(@PathVariable String orderNo) {
        OrderStatusVO vo = paymentService.getOrderStatus(orderNo);
        return Result.success(vo);
    }
}
```

#### 前端 wechatPay.ts

```typescript
// src/utils/wechatPay.ts

export interface WechatPayParams {
  appId: string
  timeStamp: string
  nonceStr: string
  package: string
  signType: string
  paySign: string
}

export type PayResult = 'ok' | 'cancel' | 'fail'

/**
 * 检测是否在微信浏览器中
 */
export function isWechatBrowser(): boolean {
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('micromessenger')
}

/**
 * 调用微信支付
 */
export function invokeWechatPay(params: WechatPayParams): Promise<PayResult> {
  return new Promise((resolve, reject) => {
    if (!isWechatBrowser()) {
      reject(new Error('请在微信中打开此页面完成支付'))
      return
    }

    // 确保 WeixinJSBridge 已加载
    const invoke = () => {
      WeixinJSBridge.invoke(
        'getBrandWCPayRequest',
        {
          appId: params.appId,
          timeStamp: params.timeStamp,
          nonceStr: params.nonceStr,
          package: params.package,
          signType: params.signType,
          paySign: params.paySign
        },
        (res: { err_msg: string }) => {
          if (res.err_msg === 'get_brand_wcpay_request:ok') {
            resolve('ok')
          } else if (res.err_msg === 'get_brand_wcpay_request:cancel') {
            resolve('cancel')
          } else {
            resolve('fail')
          }
        }
      )
    }

    if (typeof WeixinJSBridge === 'undefined') {
      document.addEventListener('WeixinJSBridgeReady', invoke, false)
    } else {
      invoke()
    }
  })
}
```

#### 前端 usePaymentPolling.ts

```typescript
// src/composables/usePaymentPolling.ts
import { ref, onUnmounted } from 'vue'
import { getOrderStatus } from '@/api/payment'
import type { OrderStatusVO } from '@/types/payment'

export function usePaymentPolling(orderNo: string) {
  const status = ref<OrderStatusVO | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isPolling = ref(false)

  let timer: number | null = null
  let startTime = 0

  const POLL_INTERVAL = 2000 // 2秒
  const MAX_POLL_TIME = 30000 // 30秒

  const poll = async () => {
    if (!isPolling.value) return

    try {
      const res = await getOrderStatus(orderNo)
      status.value = res.data

      if (res.data.payStatus === 'success') {
        stopPolling()
        return
      }

      // 检查超时
      if (Date.now() - startTime > MAX_POLL_TIME) {
        stopPolling()
        error.value = '支付确认超时，请稍后查看订单状态'
        return
      }

      // 继续轮询
      timer = window.setTimeout(poll, POLL_INTERVAL)
    } catch (e: any) {
      error.value = e.message || '查询失败'
      stopPolling()
    }
  }

  const startPolling = () => {
    if (isPolling.value) return

    isPolling.value = true
    loading.value = true
    startTime = Date.now()
    poll()
  }

  const stopPolling = () => {
    isPolling.value = false
    loading.value = false
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  onUnmounted(() => {
    stopPolling()
  })

  return {
    status,
    loading,
    error,
    startPolling,
    stopPolling
  }
}
```

### 微信支付配置

**application.yml**:
```yaml
wechat:
  pay:
    app-id: ${WECHAT_PAY_APP_ID}
    mch-id: ${WECHAT_PAY_MCH_ID}
    api-key: ${WECHAT_PAY_API_KEY}
    cert-serial-no: ${WECHAT_PAY_CERT_SERIAL_NO}
    private-key-path: ${WECHAT_PAY_PRIVATE_KEY_PATH}
    notify-url: https://api.example.com/api/webhook/wechat/payment
```

### 安全检查清单

- [ ] 订单号使用 UUID，不可预测
- [ ] 微信支付签名使用 RSA (SHA256withRSA)
- [ ] 金额校验（前端、后端、微信回调三方一致）
- [ ] 防重复报名检查
- [ ] 订单过期时间设置 (30分钟)
- [ ] attach 字段不含敏感信息
- [ ] HTTPS 传输

### 错误码

| 错误码 | HTTP | 含义 | 处理 |
|--------|------|------|------|
| 1001 | 400 | 重复报名 | 跳转进度页 |
| 1002 | 400 | 订单已过期 | 重新创建订单 |
| 1003 | 400 | 训练营不可报名 | 返回列表页 |
| 400 | 400 | 参数错误 | 检查输入 |
| 401 | 401 | 未登录 | 触发 OAuth |
| 500 | 500 | 服务器错误 | 提示重试 |

### 测试要点

**后端测试**:
1. `PaymentServiceTest` - 测试创建订单、重复报名检测
2. `WechatPayManagerTest` - Mock 微信接口，测试签名
3. `PaymentH5ControllerTest` - 集成测试各接口

**前端测试**:
1. `EnrollConfirm.spec.ts` - 测试页面渲染和按钮点击
2. `wechatPay.spec.ts` - 测试微信环境检测
3. `usePaymentPolling.spec.ts` - 测试轮询逻辑

**集成测试**:
1. 使用微信开发者工具测试完整支付流程
2. 测试沙箱环境支付
3. 测试各种失败场景

---

## 项目结构

### 后端新增文件

```
backend/src/main/java/com/camp/
├── controller/
│   └── h5/
│       └── PaymentH5Controller.java     # 支付相关接口
├── service/
│   └── PaymentService.java              # 支付业务逻辑
├── manager/
│   └── WechatPayManager.java            # 微信支付 API 封装
├── entity/
│   └── PaymentRecord.java               # 支付记录实体
├── mapper/
│   └── PaymentRecordMapper.java         # 数据访问
├── dto/
│   └── payment/
│       ├── CreateOrderRequest.java
│       ├── CreateOrderVO.java
│       ├── PayParamsVO.java
│       └── OrderStatusVO.java
└── config/
    └── WechatPayConfig.java             # 微信支付配置
```

### 前端新增文件

```
frontend/h5-member/src/
├── views/
│   └── EnrollConfirm.vue                # 报名确认页
├── api/
│   └── payment.ts                       # 支付 API
├── utils/
│   └── wechatPay.ts                     # 微信支付工具
├── composables/
│   └── usePaymentPolling.ts             # 轮询 Hook
├── router/
│   └── index.ts                         # 新增路由
└── types/
    └── payment.d.ts                     # 类型定义
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP02-S02 微信 OAuth | ready-for-dev | 登录态、JWT |
| EP02-S03 报名信息填写 | ready-for-dev | 星球绑定 |
| EP01-S03 训练营 CRUD | ready-for-dev | 训练营数据 |
| 微信支付商户号 | 必须配置 | AppID、商户号、API密钥、证书 |

### 后续依赖

本故事完成后，以下功能可以开始:
- EP02-S05 微信支付 Webhook 回调处理
- EP02-S06 支付成功后群二维码展示

---

## References

| 文档 | 路径 | 相关章节 |
|------|------|----------|
| PRD | `docs/PRD.md` | FR2.4 创建支付订单, FR2.7 重复报名检测 |
| 技术方案 | `docs/v1/design/技术方案.md` | 5.1 用户报名流程 |
| API 文档 | `docs/v1/api/接口文档.md` | 3.3-3.5 支付相关接口 |
| 支付安全 | `docs/v1/security/支付安全增强方案.md` | 签名验证、幂等处理 |
| 状态枚举 | `docs/v1/design/状态枚举定义.md` | pay_status, bind_status |
| Epic 定义 | `docs/epics.md` | EP02-S04 |
| 前一故事 | `docs/sprint-artifacts/stories/2-3-camp-detail-enroll.md` | 报名流程参考 |
| 微信支付文档 | https://pay.weixin.qq.com/docs/merchant/apis/jsapi-payment/direct-jsons/jsapi-prepay.html | JSAPI 下单 |

---

## Dev Agent Record

### Context Reference
- Epic: EP02 会员报名与支付系统
- Story: EP02-S04 微信支付下单与调起
- FR Coverage: FR2.4, FR2.7

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
| Story 点数 | 5 |
| 优先级 | P0 |
| Epic | EP02 |
| 前置条件 | EP02-S03 完成 |
| 覆盖 FR | FR2.4, FR2.7 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
