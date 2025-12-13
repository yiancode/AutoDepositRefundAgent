# Story 2.6: 支付成功后群二维码展示

**Status**: ready-for-dev

---

## Story

**作为**一名已支付押金的会员，
**我希望**支付成功后立即看到训练营群二维码，
**以便于**及时加入训练营群，开始打卡之旅。

---

## 验收标准

### AC-1: 支付成功跳转
```gherkin
Feature: 支付成功页跳转
  Scenario: 支付成功后自动跳转
    Given 用户完成微信支付
    And WeixinJSBridge 回调 res.err_msg == "get_brand_wcpay_request:ok"
    When 前端轮询 GET /api/h5/orders/{orderNo}/status
    And 返回 payStatus = "success"
    Then 停止轮询
    And 获取响应中的 accessToken
    And 自动跳转到支付成功页 /pay-success?orderNo={orderNo}
```

### AC-2: 支付成功页展示
```gherkin
Feature: 支付成功页
  Scenario: 显示成功状态和入群提示
    Given 用户进入支付成功页
    When 页面加载完成
    Then 显示成功图标（绿色对勾）
    And 显示"支付成功"文案
    And 显示支付金额（格式：¥99.00）
    And 显示训练营名称
    And 显示「查看群二维码」按钮
    And 显示「查看打卡进度」按钮（可选）
```

### AC-3: 群二维码页面展示
```gherkin
Feature: 群二维码页面
  Scenario: 显示群二维码
    Given 用户从支付成功页点击「查看群二维码」
    Or 用户直接访问 /group-qrcode?orderNo={orderNo}
    When 携带有效的 accessToken
    And 调用 GET /api/h5/orders/{orderNo}/qrcode
    Then 显示训练营群二维码图片
    And 显示训练营名称
    And 显示提示文案"请长按保存二维码，扫码加入训练营群"
    And 显示注意事项（入群后请修改群昵称为星球昵称）
```

### AC-4: 长按保存二维码
```gherkin
Feature: 保存群二维码
  Scenario: 长按保存到相册
    Given 用户在群二维码页面
    When 长按二维码图片
    Then 弹出微信原生菜单
    And 显示"保存图片"选项
    And 用户点击保存后图片存入相册

  Scenario: 点击保存按钮（备选）
    Given 用户在群二维码页面
    When 点击「保存到相册」按钮
    Then 调用微信 JS-SDK 保存图片
    And 显示 Toast "保存成功"
```

### AC-5: 获取群二维码接口
```gherkin
Feature: 群二维码接口
  Scenario: 有效票据获取二维码
    Given 用户已支付成功
    And 请求头携带 X-Access-Token: {accessToken}
    When GET /api/h5/orders/{orderNo}/qrcode
    Then 返回:
      | 字段 | 值 |
      | campName | 训练营名称 |
      | groupQrcodeUrl | 群二维码图片URL |
      | tips | 入群提示文案 |
      | expireAt | 二维码过期时间（可选）|

  Scenario: 无效票据被拒绝
    Given accessToken 无效或已过期
    When GET /api/h5/orders/{orderNo}/qrcode
    Then 返回 401 Unauthorized
    And 错误信息为"票据无效或已过期"
```

### AC-6: 已报名用户再次访问
```gherkin
Feature: 已报名用户访问
  Scenario: 从训练营详情进入
    Given 用户已对该训练营支付成功
    When 访问训练营详情页 /camps/{id}
    Then 底部按钮显示「已报名」
    And 显示「查看群二维码」入口
    And 显示「查看打卡进度」入口

  Scenario: 直接访问群二维码页
    Given 用户已支付成功
    And localStorage 中有有效的 accessToken
    When 直接访问 /group-qrcode?orderNo={orderNo}
    Then 正常显示群二维码
```

### AC-7: accessToken 存储与使用
```gherkin
Feature: accessToken 管理
  Scenario: 保存 accessToken
    Given 支付状态轮询返回 accessToken
    When 解析响应
    Then 保存 accessToken 到 localStorage
    And Key 格式为 accessToken_{orderNo}

  Scenario: 使用 accessToken 请求
    Given 访问需要票据的接口
    When 发送请求
    Then 自动从 localStorage 读取 accessToken
    And 添加到请求头 X-Access-Token: {token}
```

### AC-8: 群二维码过期处理
```gherkin
Feature: 二维码过期处理
  Scenario: 群二维码已过期
    Given 管理员更新了群二维码
    And 旧二维码已失效
    When 用户查看群二维码
    Then 显示新的群二维码
    And 显示提示"如旧二维码无法进群，请使用此新码"
```

### AC-9: 错误处理
```gherkin
Feature: 错误处理
  Scenario: 网络请求失败
    Given 网络异常或服务器错误
    When 获取群二维码失败
    Then 显示友好错误提示"加载失败，请重试"
    And 显示「重试」按钮

  Scenario: 订单不存在
    Given 访问不存在的订单
    When GET /api/h5/orders/{orderNo}/qrcode
    Then 返回 404
    And 显示"订单不存在"
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - 群二维码接口** (AC: #5, #8)
  - [ ] 1.1 在 `PaymentH5Controller.java` 添加接口
  - [ ] 1.2 实现 `GET /api/h5/orders/{orderNo}/qrcode`:
    - 验证 X-Access-Token
    - 查询订单关联的训练营
    - 返回群二维码 URL
  - [ ] 1.3 添加 tips 字段（入群提示文案）
  - [ ] 1.4 编写单元测试

- [ ] **Task 2: 后端 - accessToken 验证中间件** (AC: #5, #7)
  - [ ] 2.1 创建 `AccessTokenInterceptor.java`
  - [ ] 2.2 实现 `preHandle()` 提取并验证 X-Access-Token
  - [ ] 2.3 配置拦截器作用于 `/api/h5/orders/*/qrcode`, `/api/h5/progress/*`
  - [ ] 2.4 验证失败返回 401
  - [ ] 2.5 编写拦截器测试

- [ ] **Task 3: 前端 - 支付成功页** (AC: #1, #2)
  - [ ] 3.1 创建 `src/views/PaySuccess.vue`
  - [ ] 3.2 实现成功状态展示（图标、金额、训练营名称）
  - [ ] 3.3 实现「查看群二维码」按钮跳转
  - [ ] 3.4 实现「查看打卡进度」按钮跳转
  - [ ] 3.5 页面进入时保存 accessToken
  - [ ] 3.6 编写组件测试

- [ ] **Task 4: 前端 - 群二维码页** (AC: #3, #4, #8)
  - [ ] 4.1 创建 `src/views/GroupQrcode.vue`
  - [ ] 4.2 调用接口获取群二维码
  - [ ] 4.3 实现二维码图片展示（支持长按保存）
  - [ ] 4.4 实现「保存到相册」按钮（微信 JS-SDK）
  - [ ] 4.5 实现入群提示文案展示
  - [ ] 4.6 编写组件测试

- [ ] **Task 5: 前端 - accessToken 工具封装** (AC: #7)
  - [ ] 5.1 创建 `src/utils/accessToken.ts`
  - [ ] 5.2 实现 `saveAccessToken(orderNo, token)`
  - [ ] 5.3 实现 `getAccessToken(orderNo)`
  - [ ] 5.4 实现 `clearAccessToken(orderNo)`
  - [ ] 5.5 在 Axios 拦截器中自动添加 X-Access-Token

- [ ] **Task 6: 前端 - API 封装** (AC: #5)
  - [ ] 6.1 在 `src/api/payment.ts` 添加:
    - `getGroupQrcode(orderNo)` → GET /api/h5/orders/{orderNo}/qrcode
  - [ ] 6.2 定义响应类型 `GroupQrcodeVO`

- [ ] **Task 7: 前端 - 路由配置** (AC: #1, #3)
  - [ ] 7.1 添加路由: `/pay-success` → PaySuccess.vue
  - [ ] 7.2 添加路由: `/group-qrcode` → GroupQrcode.vue
  - [ ] 7.3 配置路由参数 (orderNo)

- [ ] **Task 8: 前端 - 训练营详情页更新** (AC: #6)
  - [ ] 8.1 修改 `CampDetail.vue`
  - [ ] 8.2 已报名用户显示「已报名」状态
  - [ ] 8.3 添加「查看群二维码」和「查看打卡进度」入口
  - [ ] 8.4 判断逻辑：检查 memberStatus 或 localStorage

- [ ] **Task 9: 前端 - 错误处理** (AC: #9)
  - [ ] 9.1 实现网络错误提示
  - [ ] 9.2 实现「重试」按钮
  - [ ] 9.3 实现 401 错误特殊处理（提示联系管理员）

- [ ] **Task 10: 集成测试与验收** (AC: #全部)
  - [ ] 10.1 测试完整支付成功到展示群二维码流程
  - [ ] 10.2 测试长按保存图片功能（微信环境）
  - [ ] 10.3 测试 accessToken 过期场景
  - [ ] 10.4 测试已报名用户再次访问

---

## Dev Notes

### 业务流程概述

本故事是支付流程的最后一步，为会员提供入群通道。

```
支付成功 (Story 2-5 Webhook 更新状态)
     ↓
前端轮询 GET /api/h5/orders/{orderNo}/status
     ↓
payStatus = success → 获取 accessToken
     ↓
跳转到支付成功页 /pay-success
     ↓
点击「查看群二维码」
     ↓
携带 accessToken 请求 GET /api/h5/orders/{orderNo}/qrcode
     ↓
展示群二维码 → 用户长按保存 → 扫码进群
```

### 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 二维码图片来源 | 训练营配置 URL | 管理员上传到 COS，数据库存 URL |
| 票据验证 | Spring Interceptor | 统一拦截，代码复用 |
| 保存图片 | 微信 JS-SDK | 原生体验，兼容性好 |
| Token 存储 | localStorage | 简单持久化，按订单区分 |

### API 接口规范

#### 获取群二维码

**请求**:
```
GET /api/h5/orders/{orderNo}/qrcode
X-Access-Token: tk_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**响应成功**:
```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "orderNo": "ord_a1b2c3d4-5678-90ab",
    "campId": 1,
    "campName": "21天早起打卡训练营",
    "groupQrcodeUrl": "https://cdn.example.com/qrcode/camp-1-group.jpg",
    "tips": "请长按保存二维码，扫码加入训练营群。入群后请修改群昵称为您的星球昵称，方便教练核对身份。",
    "memberInfo": {
      "planetNickname": "小明同学",
      "planetMemberNumber": "123456789"
    }
  },
  "timestamp": 1730000000
}
```

**响应失败 (票据无效)**:
```json
{
  "code": 401,
  "message": "票据无效或已过期",
  "data": null,
  "timestamp": 1730000000
}
```

### 代码实现参考

#### PaymentH5Controller.java - 获取群二维码

```java
@RestController
@RequestMapping("/api/h5")
@RequiredArgsConstructor
@Slf4j
public class PaymentH5Controller {

    private final PaymentService paymentService;
    private final AccessTokenService accessTokenService;

    /**
     * 获取群二维码
     */
    @GetMapping("/orders/{orderNo}/qrcode")
    public Result<GroupQrcodeVO> getGroupQrcode(
            @PathVariable String orderNo,
            @RequestHeader("X-Access-Token") String accessToken) {

        // 验证 accessToken（由拦截器完成）
        AccessTokenData tokenData = accessTokenService.validateToken(accessToken);

        // 验证订单归属
        if (!orderNo.equals(tokenData.getOrderNo())) {
            throw new BusinessException(403, "无权访问此订单");
        }

        GroupQrcodeVO vo = paymentService.getGroupQrcode(orderNo);
        return Result.success(vo);
    }
}
```

#### AccessTokenInterceptor.java

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class AccessTokenInterceptor implements HandlerInterceptor {

    private final AccessTokenService accessTokenService;

    @Override
    public boolean preHandle(HttpServletRequest request,
                            HttpServletResponse response,
                            Object handler) throws Exception {

        String accessToken = request.getHeader("X-Access-Token");

        if (!StringUtils.hasText(accessToken)) {
            writeUnauthorizedResponse(response, "缺少访问票据");
            return false;
        }

        try {
            AccessTokenData tokenData = accessTokenService.validateToken(accessToken);
            // 将 tokenData 存入 request attribute，供 Controller 使用
            request.setAttribute("accessTokenData", tokenData);
            return true;

        } catch (BusinessException e) {
            writeUnauthorizedResponse(response, e.getMessage());
            return false;
        }
    }

    private void writeUnauthorizedResponse(HttpServletResponse response,
                                          String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");

        Result<Void> result = Result.fail(401, message);
        response.getWriter().write(JsonUtils.toJson(result));
    }
}
```

#### 前端 PaySuccess.vue

```vue
<template>
  <div class="pay-success-page">
    <!-- 成功图标 -->
    <div class="success-icon">
      <van-icon name="checked" color="#07c160" size="80" />
    </div>

    <!-- 成功信息 -->
    <div class="success-info">
      <h2>支付成功</h2>
      <p class="amount">¥{{ orderInfo?.amount?.toFixed(2) }}</p>
      <p class="camp-name">{{ orderInfo?.campName }}</p>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <van-button
        type="primary"
        block
        round
        @click="goToGroupQrcode"
      >
        查看群二维码
      </van-button>

      <van-button
        plain
        block
        round
        class="mt-12"
        @click="goToProgress"
      >
        查看打卡进度
      </van-button>
    </div>

    <!-- 提示 -->
    <div class="tips">
      <p>请尽快扫码加入训练营群</p>
      <p>入群后修改群昵称为您的星球昵称</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOrderStatus } from '@/api/payment'
import { saveAccessToken } from '@/utils/accessToken'
import type { OrderStatusVO } from '@/types/payment'

const route = useRoute()
const router = useRouter()

const orderNo = route.query.orderNo as string
const orderInfo = ref<OrderStatusVO | null>(null)

onMounted(async () => {
  // 从 URL 获取 accessToken 或从轮询结果获取
  const tokenFromQuery = route.query.accessToken as string
  if (tokenFromQuery) {
    saveAccessToken(orderNo, tokenFromQuery)
  }

  // 获取订单信息
  try {
    const res = await getOrderStatus(orderNo)
    orderInfo.value = res.data

    // 保存 accessToken
    if (res.data.accessToken) {
      saveAccessToken(orderNo, res.data.accessToken)
    }
  } catch (error) {
    console.error('获取订单信息失败', error)
  }
})

const goToGroupQrcode = () => {
  router.push({
    path: '/group-qrcode',
    query: { orderNo }
  })
}

const goToProgress = () => {
  router.push({
    path: '/progress',
    query: { memberId: orderInfo.value?.memberId }
  })
}
</script>

<style scoped>
.pay-success-page {
  min-height: 100vh;
  padding: 60px 24px;
  text-align: center;
  background: linear-gradient(180deg, #e8f5e9 0%, #ffffff 100%);
}

.success-icon {
  margin-bottom: 24px;
}

.success-info h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 12px;
}

.success-info .amount {
  font-size: 32px;
  font-weight: bold;
  color: #07c160;
  margin-bottom: 8px;
}

.success-info .camp-name {
  font-size: 14px;
  color: #666;
}

.action-buttons {
  margin-top: 48px;
  padding: 0 16px;
}

.mt-12 {
  margin-top: 12px;
}

.tips {
  margin-top: 32px;
  font-size: 12px;
  color: #999;
  line-height: 1.8;
}
</style>
```

#### 前端 GroupQrcode.vue

```vue
<template>
  <div class="group-qrcode-page">
    <van-nav-bar title="群二维码" left-arrow @click-left="onBack" />

    <div class="content" v-if="!loading && qrcodeData">
      <!-- 训练营名称 -->
      <h2 class="camp-name">{{ qrcodeData.campName }}</h2>

      <!-- 二维码图片 -->
      <div class="qrcode-wrapper">
        <img
          :src="qrcodeData.groupQrcodeUrl"
          alt="群二维码"
          class="qrcode-image"
          @click="previewImage"
        />
      </div>

      <!-- 提示文案 -->
      <div class="tips">
        <p>{{ qrcodeData.tips }}</p>
      </div>

      <!-- 会员信息 -->
      <div class="member-info" v-if="qrcodeData.memberInfo">
        <p>您的星球昵称：{{ qrcodeData.memberInfo.planetNickname }}</p>
        <p>您的星球ID：{{ maskPlanetId(qrcodeData.memberInfo.planetMemberNumber) }}</p>
      </div>

      <!-- 保存按钮 -->
      <div class="save-btn">
        <van-button
          type="primary"
          block
          round
          icon="photo-o"
          @click="saveToAlbum"
        >
          保存到相册
        </van-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div class="loading" v-if="loading">
      <van-loading type="spinner" size="40" />
      <p>加载中...</p>
    </div>

    <!-- 错误状态 -->
    <div class="error" v-if="error">
      <van-empty description="加载失败">
        <van-button round type="primary" @click="fetchQrcode">重试</van-button>
      </van-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showImagePreview } from 'vant'
import { getGroupQrcode } from '@/api/payment'
import { getAccessToken } from '@/utils/accessToken'
import type { GroupQrcodeVO } from '@/types/payment'

const route = useRoute()
const router = useRouter()

const orderNo = route.query.orderNo as string
const qrcodeData = ref<GroupQrcodeVO | null>(null)
const loading = ref(true)
const error = ref(false)

onMounted(() => {
  fetchQrcode()
})

const fetchQrcode = async () => {
  loading.value = true
  error.value = false

  try {
    const res = await getGroupQrcode(orderNo)
    qrcodeData.value = res.data
  } catch (e: any) {
    error.value = true
    if (e.response?.status === 401) {
      showToast('票据已过期，请联系管理员')
    }
  } finally {
    loading.value = false
  }
}

const previewImage = () => {
  if (qrcodeData.value?.groupQrcodeUrl) {
    showImagePreview([qrcodeData.value.groupQrcodeUrl])
  }
}

const saveToAlbum = () => {
  // 微信 JS-SDK 下载图片
  if (typeof wx !== 'undefined' && wx.downloadImage) {
    wx.downloadImage({
      serverId: qrcodeData.value?.groupQrcodeUrl || '',
      success: () => {
        showToast('保存成功')
      },
      fail: () => {
        showToast('保存失败，请长按图片保存')
      }
    })
  } else {
    showToast('请长按图片保存')
  }
}

const maskPlanetId = (id: string) => {
  if (!id || id.length < 8) return id
  return id.slice(0, 3) + '****' + id.slice(-3)
}

const onBack = () => {
  router.back()
}
</script>

<style scoped>
.group-qrcode-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.content {
  padding: 24px 16px;
  text-align: center;
}

.camp-name {
  font-size: 18px;
  color: #333;
  margin-bottom: 20px;
}

.qrcode-wrapper {
  background: #fff;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: inline-block;
}

.qrcode-image {
  width: 240px;
  height: 240px;
  object-fit: contain;
}

.tips {
  margin-top: 20px;
  padding: 12px 16px;
  background: #fff8e6;
  border-radius: 8px;
  font-size: 13px;
  color: #8b6914;
  line-height: 1.6;
}

.member-info {
  margin-top: 16px;
  font-size: 13px;
  color: #666;
  line-height: 1.8;
}

.save-btn {
  margin-top: 32px;
  padding: 0 24px;
}

.loading, .error {
  padding: 100px 0;
  text-align: center;
}

.loading p {
  margin-top: 12px;
  color: #999;
}
</style>
```

#### 前端 accessToken.ts

```typescript
// src/utils/accessToken.ts

const TOKEN_PREFIX = 'accessToken_'

/**
 * 保存 accessToken
 */
export function saveAccessToken(orderNo: string, token: string): void {
  const key = TOKEN_PREFIX + orderNo
  localStorage.setItem(key, token)
}

/**
 * 获取 accessToken
 */
export function getAccessToken(orderNo: string): string | null {
  const key = TOKEN_PREFIX + orderNo
  return localStorage.getItem(key)
}

/**
 * 清除 accessToken
 */
export function clearAccessToken(orderNo: string): void {
  const key = TOKEN_PREFIX + orderNo
  localStorage.removeItem(key)
}

/**
 * 获取当前所有 orderNo 的 accessToken
 * 用于调试或批量清理
 */
export function getAllAccessTokens(): Record<string, string> {
  const tokens: Record<string, string> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(TOKEN_PREFIX)) {
      const orderNo = key.replace(TOKEN_PREFIX, '')
      tokens[orderNo] = localStorage.getItem(key) || ''
    }
  }
  return tokens
}
```

### 安全检查清单

- [ ] accessToken 验证通过拦截器统一处理
- [ ] 订单归属验证（token 中的 orderNo 与请求 orderNo 匹配）
- [ ] 群二维码 URL 使用 HTTPS
- [ ] 前端不暴露敏感的用户信息
- [ ] 错误响应不泄露系统内部信息

### 错误码

| 错误码 | HTTP | 含义 | 处理 |
|--------|------|------|------|
| 401 | 401 | 票据无效或过期 | 提示联系管理员 |
| 403 | 403 | 无权访问此订单 | 检查订单归属 |
| 404 | 404 | 订单不存在 | 检查订单号 |
| 500 | 500 | 服务器错误 | 提示重试 |

### 测试要点

**后端测试**:
1. `AccessTokenInterceptorTest` - 测试拦截器验证逻辑
2. `PaymentH5ControllerTest` - 测试获取群二维码接口

**前端测试**:
1. `PaySuccess.spec.ts` - 测试支付成功页展示
2. `GroupQrcode.spec.ts` - 测试群二维码页功能
3. `accessToken.spec.ts` - 测试工具函数

**集成测试**:
1. 微信开发者工具测试完整流程
2. 测试长按保存图片（真机）
3. 测试 accessToken 过期场景

---

## 项目结构

### 后端新增/修改文件

```
backend/src/main/java/com/camp/
├── controller/
│   └── h5/
│       └── PaymentH5Controller.java   # 新增 getGroupQrcode 接口
├── interceptor/
│   └── AccessTokenInterceptor.java    # 新增拦截器
├── config/
│   └── WebMvcConfig.java              # 配置拦截器
├── dto/
│   └── h5/
│       └── GroupQrcodeVO.java         # 新增响应对象
└── service/
    └── PaymentService.java            # 新增 getGroupQrcode 方法
```

### 前端新增文件

```
frontend/h5-member/src/
├── views/
│   ├── PaySuccess.vue                 # 支付成功页
│   └── GroupQrcode.vue                # 群二维码页
├── utils/
│   └── accessToken.ts                 # accessToken 工具
├── api/
│   └── payment.ts                     # 新增 getGroupQrcode
├── router/
│   └── index.ts                       # 新增路由
└── types/
    └── payment.d.ts                   # 新增 GroupQrcodeVO 类型
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP02-S05 支付 Webhook | ready-for-dev | 生成 accessToken |
| EP02-S04 微信支付下单 | ready-for-dev | 支付状态轮询 |
| EP01-S03 训练营 CRUD | ready-for-dev | group_qrcode_url 字段 |

### 后续依赖

本故事完成后，以下功能可以开始:
- EP02-S07 降级路径-用户填写绑定（共享 accessToken 机制）
- EP03-S05 H5 打卡进度查询页（共享 accessToken 机制）
- EP05-S04 进群提醒通知（依赖群二维码展示）

---

## References

| 文档 | 路径 | 相关章节 |
|------|------|----------|
| PRD | `docs/PRD.md` | FR2.6 支付后显示群二维码 |
| 技术方案 | `docs/v1/design/技术方案.md` | 5.1 用户报名流程 |
| API 文档 | `docs/v1/api/接口文档.md` | H5 订单接口 |
| 支付安全 | `docs/v1/security/支付安全增强方案.md` | accessToken/Ticket 机制 |
| 状态枚举 | `docs/v1/design/状态枚举定义.md` | accessToken 状态 |
| Epic 定义 | `docs/epics.md` | EP02-S06 |
| 前一故事 | `docs/sprint-artifacts/stories/2-5-payment-webhook.md` | Webhook 处理参考 |

---

## Dev Agent Record

### Context Reference
- Epic: EP02 会员报名与支付系统
- Story: EP02-S06 支付成功后群二维码展示
- FR Coverage: FR2.6

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
| Story 点数 | 2 |
| 优先级 | P0 |
| Epic | EP02 |
| 前置条件 | EP02-S05 完成 |
| 覆盖 FR | FR2.6 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
