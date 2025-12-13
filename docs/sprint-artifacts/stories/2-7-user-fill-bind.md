# Story 2.7: 降级路径 - 用户填写绑定

**Status**: ready-for-dev

---

## Story

**作为**一名通过固定二维码支付的会员，
**我希望**在 H5 页面补填星球昵称和星球 ID 完成身份绑定，
**以便于**系统在打卡同步时能准确识别我，训练营结束后顺利完成退款。

---

## 验收标准

### AC-1: 访问绑定页面
```gherkin
Feature: 访问绑定页面
  Scenario: 通过绑定链接访问
    Given 用户通过固定二维码完成支付
    And 支付成功但 bind_status = pending
    And 用户收到绑定链接（包含 accessToken）
    When 访问 /bind?token={accessToken}&orderNo={orderNo}
    Then 验证 accessToken 有效且状态为 active
    And 显示绑定表单页面

  Scenario: 直接访问绑定页面
    Given 用户访问绑定页面但无 token 参数
    Then 显示错误提示"缺少访问凭证"
    And 提示联系管理员获取绑定链接
```

### AC-2: 绑定表单展示
```gherkin
Feature: 绑定表单
  Scenario: 显示绑定表单
    Given 用户在绑定页面
    And accessToken 验证通过
    When 页面加载完成
    Then 显示说明文案"请填写您的知识星球信息"
    And 显示「星球昵称」输入框（必填）
    And 显示「星球ID」输入框（必填，带格式提示）
    And 显示「如何获取星球ID」帮助按钮
    And 显示「确认绑定」按钮
    And 显示订单信息（训练营名称、支付金额、支付时间）
```

### AC-3: 表单校验
```gherkin
Feature: 表单校验
  Scenario: 星球昵称为空
    Given 用户在绑定表单
    When 星球昵称为空
    And 点击「确认绑定」
    Then 显示校验错误"请输入星球昵称"
    And 阻止提交

  Scenario: 星球ID格式错误
    Given 用户在绑定表单
    When 星球ID不是纯数字
    And 点击「确认绑定」
    Then 显示校验错误"星球ID必须为数字"

  Scenario: 星球ID长度不符
    Given 用户在绑定表单
    When 星球ID长度小于8位或大于15位
    And 点击「确认绑定」
    Then 显示校验错误"星球ID长度应为8-15位"
```

### AC-4: 提交绑定信息
```gherkin
Feature: 提交绑定
  Scenario: 绑定成功
    Given 用户填写了有效的星球昵称和星球ID
    When 点击「确认绑定」
    Then 调用 POST /api/h5/orders/{orderNo}/bind-planet
    And 请求头携带 X-Access-Token: {accessToken}
    And 请求体包含 { planetNickname, planetMemberNumber }
    And 后端更新 camp_member:
      | 字段 | 值 |
      | planet_nickname | 用户输入值 |
      | planet_member_number | 用户输入值 |
      | bind_status | completed |
      | bind_method | user_fill |
      | bind_time | 当前时间 |
    And 更新 accessToken 状态为 bound
    And 返回成功响应
    And 显示 Toast "绑定成功"
    And 自动跳转到群二维码页面
```

### AC-5: 后端绑定接口
```gherkin
Feature: 绑定接口
  Scenario: 接口正常响应
    Given 有效的 accessToken 和订单号
    When POST /api/h5/orders/{orderNo}/bind-planet
    Then 返回:
      | 字段 | 值 |
      | code | 200 |
      | message | 绑定成功 |
      | data.memberId | 会员ID |
      | data.bindStatus | completed |
      | data.groupQrcodeUrl | 群二维码URL（可选） |

  Scenario: 订单已绑定
    Given 订单 bind_status = completed
    When POST /api/h5/orders/{orderNo}/bind-planet
    Then 返回错误码 1003
    And 错误信息为"该订单已完成绑定"
```

### AC-6: accessToken 状态管理
```gherkin
Feature: accessToken 状态
  Scenario: Token 状态流转
    Given accessToken 状态为 active
    When 绑定成功
    Then accessToken 状态更新为 bound
    And Token 仍可用于查询群二维码和进度

  Scenario: Token 已过期
    Given accessToken 状态为 expired
    When 访问绑定页面
    Then 返回 401 Unauthorized
    And 显示"票据已过期，请联系管理员重新获取"

  Scenario: Token 已使用（已绑定）
    Given accessToken 状态为 bound
    When 访问绑定页面
    Then 显示"您已完成绑定"
    And 提供"查看群二维码"入口
```

### AC-7: 记录状态日志
```gherkin
Feature: 状态日志
  Scenario: 记录绑定状态变更
    Given 绑定操作成功
    Then 插入 bind_status_log:
      | 字段 | 值 |
      | camp_member_id | 会员ID |
      | from_status | pending |
      | to_status | completed |
      | trigger_source | user_fill |
      | operator_type | user |
      | remark | 用户通过降级路径补填绑定 |
```

### AC-8: 星球ID帮助弹窗
```gherkin
Feature: 帮助弹窗
  Scenario: 查看星球ID获取说明
    Given 用户在绑定页面
    When 点击「如何获取星球ID」
    Then 显示底部弹窗说明：
      | 步骤1: 打开知识星球App或网页版 |
      | 步骤2: 进入「我的」页面 |
      | 步骤3: 点击头像进入个人资料 |
      | 步骤4: 复制「星球编号」 |
    And 显示示例截图
    And 可点击关闭弹窗
```

### AC-9: 错误处理
```gherkin
Feature: 错误处理
  Scenario: 网络请求失败
    Given 网络异常
    When 提交绑定请求失败
    Then 显示"网络错误，请重试"
    And 保留用户输入的数据
    And 允许重新提交

  Scenario: 服务器错误
    Given 后端返回 500 错误
    When 提交绑定请求
    Then 显示"服务异常，请稍后重试"
    And 保留用户输入的数据
```

### AC-10: 绑定状态查询
```gherkin
Feature: 绑定状态查询
  Scenario: 查询绑定状态
    Given 用户已通过降级路径绑定
    When 访问 GET /api/h5/orders/{orderNo}/bind-status
    And 携带 X-Access-Token
    Then 返回:
      | 字段 | 值 |
      | bindStatus | completed |
      | bindMethod | user_fill |
      | planetNickname | 用户昵称 |
      | planetMemberNumber | 星球ID（脱敏） |
      | bindTime | 绑定时间 |
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - 绑定接口实现** (AC: #4, #5, #7)
  - [ ] 1.1 在 `PaymentH5Controller.java` 添加绑定接口
  - [ ] 1.2 实现 `POST /api/h5/orders/{orderNo}/bind-planet`:
    - 验证 X-Access-Token
    - 验证订单存在且归属正确
    - 检查是否已绑定（防重复）
    - 更新 camp_member 绑定信息
    - 更新 accessToken 状态为 bound
    - 记录 bind_status_log
  - [ ] 1.3 实现请求参数校验
  - [ ] 1.4 编写单元测试

- [ ] **Task 2: 后端 - 绑定状态查询接口** (AC: #10)
  - [ ] 2.1 实现 `GET /api/h5/orders/{orderNo}/bind-status`
  - [ ] 2.2 返回绑定状态、方式、时间等信息
  - [ ] 2.3 星球ID脱敏显示
  - [ ] 2.4 编写单元测试

- [ ] **Task 3: 后端 - PaymentBindService** (AC: #4, #7)
  - [ ] 3.1 创建 `PaymentBindService.java`
  - [ ] 3.2 实现 `bindByUserFill(orderNo, planetNickname, planetMemberNumber)`:
    - 更新 camp_member 表
    - 设置 bind_method = 'user_fill'
    - 设置 bind_status = 'completed'
    - 记录日志
  - [ ] 3.3 实现事务管理
  - [ ] 3.4 编写服务测试

- [ ] **Task 4: 后端 - AccessToken 状态更新** (AC: #6)
  - [ ] 4.1 在 `AccessTokenService.java` 添加状态更新方法
  - [ ] 4.2 实现 `updateTokenStatus(token, newStatus)`
  - [ ] 4.3 实现状态机校验（只允许合法流转）
  - [ ] 4.4 编写单元测试

- [ ] **Task 5: 前端 - 绑定页面组件** (AC: #1, #2, #3, #8)
  - [ ] 5.1 创建 `src/views/BindByToken.vue`
  - [ ] 5.2 从 URL 提取 token 和 orderNo 参数
  - [ ] 5.3 实现表单布局（Vant Field 组件）
  - [ ] 5.4 实现表单校验规则
  - [ ] 5.5 实现「如何获取星球ID」帮助弹窗
  - [ ] 5.6 实现订单信息展示
  - [ ] 5.7 编写组件测试

- [ ] **Task 6: 前端 - 绑定提交逻辑** (AC: #4, #9)
  - [ ] 6.1 实现提交绑定请求
  - [ ] 6.2 处理成功响应（跳转群二维码页）
  - [ ] 6.3 处理各种错误场景
  - [ ] 6.4 实现加载状态和按钮禁用

- [ ] **Task 7: 前端 - 已绑定状态处理** (AC: #6)
  - [ ] 7.1 进入页面时检查绑定状态
  - [ ] 7.2 已绑定用户显示"已完成绑定"
  - [ ] 7.3 提供"查看群二维码"和"查看进度"入口

- [ ] **Task 8: 前端 - API 封装** (AC: #4, #5, #10)
  - [ ] 8.1 在 `src/api/payment.ts` 添加:
    - `bindPlanetByToken(orderNo, data)` → POST /api/h5/orders/{orderNo}/bind-planet
    - `getBindStatus(orderNo)` → GET /api/h5/orders/{orderNo}/bind-status
  - [ ] 8.2 定义请求和响应类型

- [ ] **Task 9: 前端 - 路由配置** (AC: #1)
  - [ ] 9.1 添加路由: `/bind` → BindByToken.vue
  - [ ] 9.2 配置路由参数（token, orderNo）
  - [ ] 9.3 处理无参数情况

- [ ] **Task 10: 集成测试与验收** (AC: #全部)
  - [ ] 10.1 测试完整绑定流程
  - [ ] 10.2 测试 accessToken 过期场景
  - [ ] 10.3 测试已绑定用户再次访问
  - [ ] 10.4 测试表单校验各种场景
  - [ ] 10.5 测试绑定状态查询

---

## Dev Notes

### 业务流程概述

本故事实现「降级路径」的身份绑定，适用于通过固定二维码支付的用户。

```
用户通过固定二维码支付（未经 OAuth）
     ↓
支付成功 → 创建 camp_member (bind_status=pending)
     ↓
生成 accessToken → 返回绑定链接
     ↓
用户访问绑定链接 /bind?token=xxx&orderNo=xxx
     ↓
验证 accessToken → 显示绑定表单
     ↓
用户填写星球昵称和星球ID → 提交
     ↓
更新 camp_member (bind_status=completed, bind_method=user_fill)
     ↓
更新 accessToken 状态为 bound
     ↓
跳转群二维码页面
```

### 主路径 vs 降级路径

| 特性 | 主路径 (h5_bindplanet) | 降级路径 (user_fill) |
|------|----------------------|---------------------|
| 入口 | H5 报名页 | 固定收款码 |
| 认证方式 | 微信 OAuth | accessToken |
| 绑定时机 | 支付前绑定 | 支付后补填 |
| bind_status | 直接 completed | pending → completed |
| 用户体验 | 一步完成 | 需要额外步骤 |

### 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 认证方式 | accessToken | 无需 OAuth，降低用户操作成本 |
| Token 状态 | active → bound | 区分未绑定和已绑定，支持幂等 |
| 表单校验 | 前端 + 后端 | 前端即时反馈，后端保障安全 |
| 绑定成功后 | 自动跳转群二维码 | 引导用户进群，提升体验 |

### API 接口规范

#### 1. 用户填写绑定

**请求**:
```
POST /api/h5/orders/{orderNo}/bind-planet
X-Access-Token: tk_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Content-Type: application/json

{
  "planetNickname": "小明同学",
  "planetMemberNumber": "123456789"
}
```

**响应成功**:
```json
{
  "code": 200,
  "message": "绑定成功",
  "data": {
    "memberId": 1001,
    "bindStatus": "completed",
    "bindMethod": "user_fill",
    "bindTime": "2025-12-13T14:30:00",
    "groupQrcodeUrl": "https://cdn.example.com/qrcode/camp-1-group.jpg"
  },
  "timestamp": 1730000000
}
```

**响应失败 - 已绑定**:
```json
{
  "code": 1003,
  "message": "该订单已完成绑定",
  "data": {
    "bindStatus": "completed",
    "bindTime": "2025-12-13T10:00:00"
  },
  "timestamp": 1730000000
}
```

#### 2. 查询绑定状态

**请求**:
```
GET /api/h5/orders/{orderNo}/bind-status
X-Access-Token: tk_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**响应成功**:
```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "orderNo": "ord_a1b2c3d4-5678-90ab",
    "bindStatus": "completed",
    "bindMethod": "user_fill",
    "planetNickname": "小明同学",
    "planetMemberNumber": "123****789",
    "bindTime": "2025-12-13T14:30:00",
    "campName": "21天早起打卡训练营"
  },
  "timestamp": 1730000000
}
```

### 代码实现参考

#### PaymentH5Controller.java - 绑定接口

```java
@RestController
@RequestMapping("/api/h5")
@RequiredArgsConstructor
@Slf4j
public class PaymentH5Controller {

    private final PaymentBindService paymentBindService;
    private final AccessTokenService accessTokenService;

    /**
     * 用户填写绑定（降级路径）
     */
    @PostMapping("/orders/{orderNo}/bind-planet")
    public Result<BindResultVO> bindPlanetByToken(
            @PathVariable String orderNo,
            @RequestBody @Valid BindPlanetRequest request,
            @RequestHeader("X-Access-Token") String accessToken) {

        // 验证 Token（由拦截器完成）
        AccessTokenData tokenData = accessTokenService.validateToken(accessToken);

        // 验证订单归属
        if (!orderNo.equals(tokenData.getOrderNo())) {
            throw new BusinessException(403, "无权操作此订单");
        }

        // 检查 Token 状态
        if ("bound".equals(tokenData.getStatus())) {
            throw new BusinessException(1003, "该订单已完成绑定");
        }

        if ("expired".equals(tokenData.getStatus())) {
            throw new BusinessException(401, "票据已过期");
        }

        // 执行绑定
        BindResultVO result = paymentBindService.bindByUserFill(
            orderNo,
            request.getPlanetNickname(),
            request.getPlanetMemberNumber()
        );

        // 更新 Token 状态
        accessTokenService.updateTokenStatus(accessToken, "bound");

        return Result.success(result);
    }

    /**
     * 查询绑定状态
     */
    @GetMapping("/orders/{orderNo}/bind-status")
    public Result<BindStatusVO> getBindStatus(
            @PathVariable String orderNo,
            @RequestHeader("X-Access-Token") String accessToken) {

        AccessTokenData tokenData = accessTokenService.validateToken(accessToken);

        if (!orderNo.equals(tokenData.getOrderNo())) {
            throw new BusinessException(403, "无权查询此订单");
        }

        BindStatusVO vo = paymentBindService.getBindStatus(orderNo);
        return Result.success(vo);
    }
}
```

#### PaymentBindService.java

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentBindService {

    private final CampMemberMapper campMemberMapper;
    private final TrainingCampMapper trainingCampMapper;
    private final BindStatusLogMapper bindStatusLogMapper;

    @Transactional(rollbackFor = Exception.class)
    public BindResultVO bindByUserFill(String orderNo, String planetNickname,
                                       String planetMemberNumber) {
        // 查询会员记录
        CampMember member = campMemberMapper.selectByOrderNo(orderNo);
        if (member == null) {
            throw new BusinessException(404, "订单不存在");
        }

        // 检查是否已绑定
        if ("completed".equals(member.getBindStatus())) {
            throw new BusinessException(1003, "该订单已完成绑定");
        }

        String fromStatus = member.getBindStatus();

        // 更新绑定信息
        member.setPlanetNickname(planetNickname);
        member.setPlanetMemberNumber(planetMemberNumber);
        member.setBindStatus("completed");
        member.setBindMethod("user_fill");
        member.setBindTime(LocalDateTime.now());
        member.setUpdatedAt(LocalDateTime.now());
        campMemberMapper.updateById(member);

        // 记录状态日志
        BindStatusLog log = new BindStatusLog();
        log.setCampMemberId(member.getId());
        log.setFromStatus(fromStatus);
        log.setToStatus("completed");
        log.setTriggerSource("user_fill");
        log.setOperatorType("user");
        log.setRemark("用户通过降级路径补填绑定");
        log.setCreatedAt(LocalDateTime.now());
        bindStatusLogMapper.insert(log);

        // 获取群二维码
        TrainingCamp camp = trainingCampMapper.selectById(member.getCampId());

        log.info("User fill bind success: orderNo={}, planetMemberNumber={}",
                orderNo, planetMemberNumber);

        return BindResultVO.builder()
            .memberId(member.getId())
            .bindStatus("completed")
            .bindMethod("user_fill")
            .bindTime(member.getBindTime())
            .groupQrcodeUrl(camp.getGroupQrcodeUrl())
            .build();
    }

    public BindStatusVO getBindStatus(String orderNo) {
        CampMember member = campMemberMapper.selectByOrderNo(orderNo);
        if (member == null) {
            throw new BusinessException(404, "订单不存在");
        }

        TrainingCamp camp = trainingCampMapper.selectById(member.getCampId());

        return BindStatusVO.builder()
            .orderNo(orderNo)
            .bindStatus(member.getBindStatus())
            .bindMethod(member.getBindMethod())
            .planetNickname(member.getPlanetNickname())
            .planetMemberNumber(maskPlanetId(member.getPlanetMemberNumber()))
            .bindTime(member.getBindTime())
            .campName(camp.getName())
            .build();
    }

    private String maskPlanetId(String id) {
        if (id == null || id.length() < 8) return id;
        return id.substring(0, 3) + "****" + id.substring(id.length() - 3);
    }
}
```

#### 前端 BindByToken.vue

```vue
<template>
  <div class="bind-page">
    <van-nav-bar title="绑定星球账号" />

    <!-- 已绑定状态 -->
    <div class="bound-status" v-if="bindStatus === 'completed'">
      <van-icon name="checked" color="#07c160" size="60" />
      <h3>已完成绑定</h3>
      <p>星球昵称：{{ bindInfo?.planetNickname }}</p>
      <p>星球ID：{{ bindInfo?.planetMemberNumber }}</p>
      <van-button type="primary" block round @click="goToQrcode">
        查看群二维码
      </van-button>
    </div>

    <!-- 绑定表单 -->
    <div class="bind-form" v-else-if="!error">
      <!-- 订单信息 -->
      <div class="order-info">
        <p>训练营：{{ orderInfo?.campName }}</p>
        <p>支付金额：¥{{ orderInfo?.amount?.toFixed(2) }}</p>
      </div>

      <div class="bind-tips">
        <van-icon name="info-o" />
        <span>请填写您的知识星球信息，用于打卡核对和退款</span>
      </div>

      <van-form @submit="onSubmit">
        <van-cell-group inset>
          <van-field
            v-model="form.planetNickname"
            name="planetNickname"
            label="星球昵称"
            placeholder="请输入您在知识星球的昵称"
            :rules="[{ required: true, message: '请输入星球昵称' }]"
          />
          <van-field
            v-model="form.planetMemberNumber"
            name="planetMemberNumber"
            label="星球ID"
            type="digit"
            placeholder="请输入8-15位数字的星球ID"
            :rules="planetIdRules"
          >
            <template #button>
              <van-button size="small" type="primary" plain @click="showHelp = true">
                如何获取
              </van-button>
            </template>
          </van-field>
        </van-cell-group>

        <div class="submit-btn">
          <van-button
            round
            block
            type="primary"
            native-type="submit"
            :loading="loading"
          >
            确认绑定
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- 错误状态 -->
    <div class="error-state" v-else>
      <van-empty :description="errorMessage">
        <van-button round type="primary" @click="retry" v-if="canRetry">
          重试
        </van-button>
      </van-empty>
    </div>

    <!-- 帮助弹窗 -->
    <van-popup v-model:show="showHelp" position="bottom" round :style="{ height: '60%' }">
      <div class="help-content">
        <h3>如何获取星球ID</h3>
        <div class="step" v-for="(step, index) in helpSteps" :key="index">
          <span class="step-num">{{ index + 1 }}</span>
          <span>{{ step }}</span>
        </div>
        <img src="@/assets/help-planet-id.png" alt="示例图" class="help-img" />
        <van-button block @click="showHelp = false">我知道了</van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showFailToast } from 'vant'
import { bindPlanetByToken, getBindStatus, getOrderStatus } from '@/api/payment'
import { saveAccessToken, getAccessToken } from '@/utils/accessToken'

const route = useRoute()
const router = useRouter()

const token = route.query.token as string
const orderNo = route.query.orderNo as string

const loading = ref(false)
const showHelp = ref(false)
const error = ref(false)
const errorMessage = ref('')
const canRetry = ref(false)
const bindStatus = ref('')
const bindInfo = ref<any>(null)
const orderInfo = ref<any>(null)

const form = reactive({
  planetNickname: '',
  planetMemberNumber: ''
})

const planetIdRules = [
  { required: true, message: '请输入星球ID' },
  { pattern: /^\d{8,15}$/, message: '星球ID必须为8-15位数字' }
]

const helpSteps = [
  '打开知识星球App或网页版',
  '进入「我的」页面',
  '点击头像进入个人资料',
  '复制「星球编号」'
]

onMounted(async () => {
  if (!token || !orderNo) {
    error.value = true
    errorMessage.value = '缺少访问凭证，请联系管理员获取绑定链接'
    return
  }

  // 保存 token
  saveAccessToken(orderNo, token)

  // 检查绑定状态
  try {
    const statusRes = await getBindStatus(orderNo)
    bindStatus.value = statusRes.data.bindStatus
    bindInfo.value = statusRes.data

    if (bindStatus.value !== 'completed') {
      // 获取订单信息
      const orderRes = await getOrderStatus(orderNo)
      orderInfo.value = orderRes.data
    }
  } catch (e: any) {
    if (e.response?.status === 401) {
      error.value = true
      errorMessage.value = '票据已过期，请联系管理员重新获取'
    } else {
      error.value = true
      errorMessage.value = '加载失败，请重试'
      canRetry.value = true
    }
  }
})

const onSubmit = async () => {
  loading.value = true
  try {
    const res = await bindPlanetByToken(orderNo, {
      planetNickname: form.planetNickname,
      planetMemberNumber: form.planetMemberNumber
    })

    showToast('绑定成功')

    // 跳转到群二维码页面
    router.replace({
      path: '/group-qrcode',
      query: { orderNo }
    })
  } catch (e: any) {
    if (e.response?.data?.code === 1003) {
      showFailToast('该订单已完成绑定')
      bindStatus.value = 'completed'
    } else {
      showFailToast(e.response?.data?.message || '绑定失败，请重试')
    }
  } finally {
    loading.value = false
  }
}

const goToQrcode = () => {
  router.push({
    path: '/group-qrcode',
    query: { orderNo }
  })
}

const retry = () => {
  error.value = false
  // 重新加载
  location.reload()
}
</script>

<style scoped>
.bind-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.bound-status {
  padding: 60px 24px;
  text-align: center;
}

.bound-status h3 {
  margin: 16px 0 8px;
  color: #333;
}

.bound-status p {
  color: #666;
  font-size: 14px;
  margin: 4px 0;
}

.bound-status .van-button {
  margin-top: 32px;
}

.order-info {
  margin: 16px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
}

.order-info p {
  margin: 4px 0;
}

.bind-tips {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  font-size: 13px;
  color: #969799;
}

.submit-btn {
  padding: 24px 16px;
}

.error-state {
  padding: 60px 0;
}

.help-content {
  padding: 24px 16px;
}

.help-content h3 {
  text-align: center;
  margin-bottom: 24px;
}

.step {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.step-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #1989fa;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.help-img {
  width: 100%;
  margin: 16px 0;
  border-radius: 8px;
}
</style>
```

### 安全检查清单

- [ ] accessToken 验证通过拦截器统一处理
- [ ] 订单归属验证（Token 中的 orderNo 匹配）
- [ ] 防止重复绑定（检查 bind_status）
- [ ] 表单输入校验（前端 + 后端）
- [ ] 星球ID 脱敏显示
- [ ] 状态日志完整记录

### 错误码

| 错误码 | HTTP | 含义 | 处理 |
|--------|------|------|------|
| 401 | 401 | Token 无效或过期 | 提示联系管理员 |
| 403 | 403 | 无权操作此订单 | 检查 Token |
| 404 | 404 | 订单不存在 | 检查订单号 |
| 1003 | 400 | 订单已绑定 | 显示已绑定状态 |
| 400 | 400 | 参数校验失败 | 检查输入 |
| 500 | 500 | 服务器错误 | 提示重试 |

### 测试要点

**后端测试**:
1. `PaymentBindServiceTest` - 测试绑定逻辑
2. `PaymentH5ControllerTest` - 测试绑定和查询接口
3. `AccessTokenServiceTest` - 测试 Token 状态更新

**前端测试**:
1. `BindByToken.spec.ts` - 测试绑定页面各状态
2. 测试表单校验
3. 测试已绑定用户处理

**集成测试**:
1. 完整降级路径绑定流程
2. Token 过期场景
3. 重复绑定场景

---

## 项目结构

### 后端新增/修改文件

```
backend/src/main/java/com/camp/
├── controller/
│   └── h5/
│       └── PaymentH5Controller.java   # 新增 bindPlanetByToken, getBindStatus
├── service/
│   ├── PaymentBindService.java        # 新增绑定服务
│   └── AccessTokenService.java        # 新增状态更新方法
├── dto/
│   └── h5/
│       ├── BindPlanetRequest.java     # 绑定请求
│       ├── BindResultVO.java          # 绑定结果
│       └── BindStatusVO.java          # 绑定状态
└── mapper/
    └── BindStatusLogMapper.java       # 状态日志
```

### 前端新增文件

```
frontend/h5-member/src/
├── views/
│   └── BindByToken.vue                # 绑定页面
├── api/
│   └── payment.ts                     # 新增 bindPlanetByToken, getBindStatus
├── router/
│   └── index.ts                       # 新增 /bind 路由
└── types/
    └── payment.d.ts                   # 新增类型定义
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP02-S05 支付 Webhook | ready-for-dev | 创建 pending 状态的会员记录 |
| EP02-S06 群二维码展示 | ready-for-dev | 共享 accessToken 机制 |

### 后续依赖

本故事完成后，以下功能可以开始:
- EP02-S08 绑定超时检查（检查 pending 状态超时）
- EP03-S05 H5 打卡进度查询（共享 accessToken）

---

## References

| 文档 | 路径 | 相关章节 |
|------|------|----------|
| PRD | `docs/PRD.md` | FR3.2 降级路径-用户填写绑定 |
| 技术方案 | `docs/v1/design/技术方案.md` | 5.3 身份绑定流程 |
| API 文档 | `docs/v1/api/接口文档.md` | H5 绑定接口 |
| 支付安全 | `docs/v1/security/支付安全增强方案.md` | accessToken 机制 |
| 状态枚举 | `docs/v1/design/状态枚举定义.md` | bind_status, bind_method |
| Epic 定义 | `docs/epics.md` | EP02-S07 |
| 前一故事 | `docs/sprint-artifacts/stories/2-6-group-qrcode.md` | 群二维码展示参考 |

---

## Dev Agent Record

### Context Reference
- Epic: EP02 会员报名与支付系统
- Story: EP02-S07 降级路径-用户填写绑定
- FR Coverage: FR3.2, FR3.5, FR3.6

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
| Story 点数 | 3 |
| 优先级 | P0 |
| Epic | EP02 |
| 前置条件 | EP02-S05 完成 |
| 覆盖 FR | FR3.2, FR3.5, FR3.6 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
