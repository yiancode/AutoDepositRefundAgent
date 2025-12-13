# Story 2.3: 训练营详情页与报名信息填写

**Status**: ready-for-dev

---

## Story

**作为**一名会员，
**我希望**查看训练营详情并填写报名信息（星球昵称、星球ID），
**以便于**系统能够在支付成功后准确识别我的星球身份，完成身份绑定。

---

## 验收标准

### AC-1: 查看训练营详情
```gherkin
Feature: 训练营详情展示
  Scenario: 未登录用户查看详情
    Given 用户通过链接访问训练营详情页 /camps/{id}
    And 用户未登录（无 JWT Token）
    When 页面加载完成
    Then 调用 GET /api/h5/camps/{id} 获取详情
    And 显示训练营海报图片
    And 显示训练营名称
    And 显示押金金额（格式：¥99.00）
    And 显示时间范围（开始日期 ~ 结束日期）
    And 显示打卡要求（如：需打卡21天，宽限1天）
    And 显示项目介绍
    And 底部显示「立即报名」按钮
```

### AC-2: 已登录未绑定用户点击报名
```gherkin
  Scenario: 已登录但未绑定星球账号
    Given 用户已通过 OAuth 登录（localStorage 有有效 JWT）
    And 用户的 wechat_user.planet_member_number IS NULL
    When 用户点击「立即报名」按钮
    Then 检测到未绑定星球账号
    And 跳转到绑定页面 /bind-planet?campId={id}&returnUrl=/camps/{id}
```

### AC-3: 未登录用户点击报名触发 OAuth
```gherkin
  Scenario: 未登录用户点击报名
    Given 用户未登录（localStorage 无 JWT 或已过期）
    When 用户点击「立即报名」按钮
    Then 前端触发 OAuth 授权流程
    And 调用 GET /api/auth/authorize?returnUrl=/camps/{id}
    And 跳转到微信授权页面
```

### AC-4: 绑定星球账号页面展示
```gherkin
Feature: 星球账号绑定页面
  Scenario: 显示绑定表单
    Given 用户访问绑定页面 /bind-planet
    And 用户已登录
    When 页面加载完成
    Then 显示说明文案「请填写您的知识星球信息，用于打卡核对和退款」
    And 显示「星球昵称」输入框（必填）
    And 显示「星球ID」输入框（必填，带获取说明链接）
    And 显示「如何获取星球ID」帮助按钮
    And 显示「确认绑定」按钮
```

### AC-5: 绑定表单校验
```gherkin
  Scenario: 表单校验 - 星球昵称
    Given 用户在绑定页面
    When 星球昵称为空
    And 点击「确认绑定」
    Then 显示校验错误「请输入星球昵称」
    And 阻止提交

  Scenario: 表单校验 - 星球ID格式
    Given 用户在绑定页面
    When 星球ID不是纯数字
    And 点击「确认绑定」
    Then 显示校验错误「星球ID必须为数字」
    And 阻止提交

  Scenario: 表单校验 - 星球ID长度
    Given 用户在绑定页面
    When 星球ID长度小于8位或大于15位
    And 点击「确认绑定」
    Then 显示校验错误「星球ID长度应为8-15位」
    And 阻止提交
```

### AC-6: 提交绑定信息
```gherkin
  Scenario: 成功绑定星球账号
    Given 用户填写了有效的星球昵称和星球ID
    When 点击「确认绑定」
    Then POST /api/auth/bindPlanet
    And 请求头携带 Authorization: Bearer {jwt}
    And 请求体包含 { planetNickname, planetMemberNumber }
    And 后端更新 wechat_user 表:
      | 字段 | 值 |
      | planet_nickname | 用户输入值 |
      | planet_member_number | 用户输入值 |
      | bind_status | bound |
    And 返回 200 成功
    And 显示 Toast「绑定成功」
    And 跳转回 returnUrl（训练营详情页）
```

### AC-7: 绑定失败处理
```gherkin
  Scenario: 绑定接口失败
    Given 用户提交绑定请求
    When 后端返回错误（如 500 内部错误）
    Then 显示 Toast「绑定失败，请重试」
    And 保留用户输入的数据
    And 允许重新提交
```

### AC-8: 已绑定用户直接进入报名确认
```gherkin
  Scenario: 已绑定星球账号的用户
    Given 用户已登录
    And 用户的 wechat_user.planet_member_number IS NOT NULL
    When 用户点击「立即报名」
    Then 直接跳转到报名确认页 /enroll-confirm?campId={id}
    And 不显示绑定页面
```

### AC-9: 重复报名检测
```gherkin
  Scenario: 用户已报名该训练营
    Given 用户已对该训练营支付成功
    When 访问训练营详情页
    Then 底部按钮显示「查看进度」而非「立即报名」
    And 点击后跳转到进度查询页
```

### AC-10: 星球ID获取帮助
```gherkin
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

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - 训练营详情接口优化** (AC: #1)
  - [ ] 1.1 确认 `GET /api/h5/camps/{id}` 接口已实现（来自 2-1）
  - [ ] 1.2 确保返回字段包含: name, posterUrl, deposit, startDate, endDate, requiredDays, graceDays, description, enrollCount
  - [ ] 1.3 添加 memberStatus 字段（null=未报名, enrolled=已报名未支付, paid=已支付）
  - [ ] 1.4 编写接口测试用例

- [ ] **Task 2: 后端 - 绑定星球账号接口** (AC: #6, #7)
  - [ ] 2.1 创建 `POST /api/auth/bindPlanet` 接口
  - [ ] 2.2 实现请求参数校验:
    - `planetNickname`: 非空，长度 1-50
    - `planetMemberNumber`: 非空，纯数字，长度 8-15
  - [ ] 2.3 实现绑定逻辑:
    - 从 JWT 获取当前 wechatUserId
    - 更新 wechat_user 表的 planet_nickname, planet_member_number, bind_status='bound'
  - [ ] 2.4 处理重复绑定（同一 planet_member_number 已被其他微信用户绑定）
  - [ ] 2.5 编写单元测试

- [ ] **Task 3: 后端 - 检查会员报名状态** (AC: #8, #9)
  - [ ] 3.1 在训练营详情接口添加 memberStatus 逻辑
  - [ ] 3.2 查询 camp_member 表判断用户是否已报名
  - [ ] 3.3 查询 payment_record 表判断支付状态
  - [ ] 3.4 返回状态枚举：null / enrolled / paid

- [ ] **Task 4: 前端 - 训练营详情页组件** (AC: #1, #2, #3, #9)
  - [ ] 4.1 创建 `src/views/CampDetail.vue`
  - [ ] 4.2 实现详情数据获取和展示
  - [ ] 4.3 实现海报图片加载（带占位图）
  - [ ] 4.4 实现「立即报名」按钮逻辑:
    - 未登录 → 触发 OAuth
    - 已登录未绑定 → 跳转绑定页
    - 已登录已绑定 → 跳转报名确认页
  - [ ] 4.5 实现已报名状态显示（查看进度按钮）
  - [ ] 4.6 编写组件单元测试

- [ ] **Task 5: 前端 - 星球绑定页组件** (AC: #4, #5, #6, #7, #10)
  - [ ] 5.1 创建 `src/views/BindPlanet.vue`
  - [ ] 5.2 实现表单布局（Vant Field 组件）
  - [ ] 5.3 实现表单校验规则（vee-validate 或原生）
  - [ ] 5.4 实现「如何获取星球ID」帮助弹窗（Vant Popup）
  - [ ] 5.5 实现提交绑定请求
  - [ ] 5.6 实现绑定成功后跳转（读取 returnUrl query 参数）
  - [ ] 5.7 实现错误处理和重试
  - [ ] 5.8 编写组件单元测试

- [ ] **Task 6: 前端 - Auth 状态扩展** (AC: #2, #8)
  - [ ] 6.1 在 auth store 添加 `isBoundPlanet` getter
  - [ ] 6.2 实现从 JWT 解析 planet_member_number
  - [ ] 6.3 实现 `bindPlanet(planetNickname, planetMemberNumber)` action
  - [ ] 6.4 绑定成功后更新本地 JWT（或刷新）

- [ ] **Task 7: 前端 - 路由配置** (AC: #2, #3)
  - [ ] 7.1 添加路由: `/camps/:id` → CampDetail.vue
  - [ ] 7.2 添加路由: `/bind-planet` → BindPlanet.vue
  - [ ] 7.3 添加路由守卫: BindPlanet 页面需要登录
  - [ ] 7.4 处理 returnUrl 参数传递

- [ ] **Task 8: 前端 - API 封装** (AC: #1, #6)
  - [ ] 8.1 创建 `src/api/camp.ts`:
    - `getCampDetail(id: number)` → GET /api/h5/camps/{id}
  - [ ] 8.2 创建 `src/api/auth.ts`:
    - `bindPlanet(data: BindPlanetRequest)` → POST /api/auth/bindPlanet
  - [ ] 8.3 定义接口类型

- [ ] **Task 9: 前端 - UI 细节** (AC: #4, #10)
  - [ ] 9.1 设计绑定页面 UI 样式
  - [ ] 9.2 添加星球 ID 帮助弹窗的示例图片
  - [ ] 9.3 实现输入框获得焦点时键盘弹出处理
  - [ ] 9.4 添加加载状态和按钮禁用逻辑

- [ ] **Task 10: 集成测试与验收** (AC: #全部)
  - [ ] 10.1 测试未登录用户查看详情并点击报名
  - [ ] 10.2 测试已登录未绑定用户的绑定流程
  - [ ] 10.3 测试已绑定用户直接进入报名确认
  - [ ] 10.4 测试已报名用户显示查看进度
  - [ ] 10.5 测试表单校验各种场景
  - [ ] 10.6 在微信开发者工具中验证完整流程

---

## Dev Notes

### 业务流程概述

本故事是会员报名流程的核心环节，实现「查看详情 → 检查登录态 → 绑定星球 → 进入支付」的前置步骤。

```
用户访问详情页 → 点击「立即报名」
     ↓
检查登录态 (JWT)
     ↓ 未登录
触发 OAuth 授权 (2-2 已实现)
     ↓ 已登录
检查星球绑定状态 (wechat_user.planet_member_number)
     ↓ 未绑定
跳转绑定页面 → 用户填写星球信息 → 提交绑定
     ↓ 已绑定
跳转报名确认页 (2-4 实现)
```

### 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 绑定存储位置 | wechat_user 表 | 微信用户与星球账号 1:1 绑定，便于复用 |
| 校验时机 | 前端 + 后端双重校验 | 前端即时反馈，后端保证数据安全 |
| 星球信息验证 | 仅格式校验，不验证存在性 | 无法直接调用星球 API 验证，打卡同步时自然验证 |
| 绑定后 JWT | 不刷新 Token | JWT 只含基础信息，绑定状态通过接口查询 |

### 数据库表关系

```
wechat_user (微信用户)
├── id (PK)
├── open_id (微信 OpenID)
├── planet_member_number (绑定后填充) → 关联 planet_user.member_number
├── planet_nickname (用户填写)
├── bind_status: unbound → binding → bound
└── created_at

camp_member (训练营会员)
├── camp_id → training_camp.id
├── wechat_user_id → wechat_user.id
├── filled_planet_member_number (用户填写的星球编号)
└── pay_status: 标识支付状态
```

### API 接口规范

#### 1. 训练营详情

**请求**:
```
GET /api/h5/camps/{id}
```

**响应成功**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "name": "21天早起训练营",
    "posterUrl": "https://cdn.example.com/poster.jpg",
    "deposit": 99.00,
    "startDate": "2025-01-01",
    "endDate": "2025-01-21",
    "requiredDays": 21,
    "graceDays": 1,
    "description": "每天早起打卡，坚持21天...",
    "enrollCount": 156,
    "status": "enrolling",
    "memberStatus": null
  },
  "timestamp": 1730000000
}
```

**memberStatus 枚举**:
| 值 | 含义 |
|----|------|
| null | 未报名 |
| enrolled | 已报名未支付 |
| paid | 已支付 |

#### 2. 绑定星球账号

**请求**:
```
POST /api/auth/bindPlanet
Authorization: Bearer {jwt}
Content-Type: application/json

{
  "planetNickname": "小明",
  "planetMemberNumber": "123456789"
}
```

**响应成功**:
```json
{
  "code": 200,
  "message": "绑定成功",
  "data": {
    "planetNickname": "小明",
    "planetMemberNumber": "123456789",
    "boundAt": "2025-12-13T10:30:00"
  },
  "timestamp": 1730000000
}
```

**响应失败 - 已被绑定**:
```json
{
  "code": 400,
  "message": "该星球账号已被其他微信用户绑定",
  "data": null,
  "timestamp": 1730000000
}
```

### 代码实现参考

#### AuthController.java - 绑定接口

```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final WechatUserService wechatUserService;

    /**
     * 绑定星球账号
     */
    @PostMapping("/bindPlanet")
    public Result<BindPlanetVO> bindPlanet(
            @RequestBody @Valid BindPlanetRequest request,
            @AuthenticationPrincipal JwtUserDetails user) {

        Long wechatUserId = user.getWechatUserId();

        // 检查是否已被其他用户绑定
        if (wechatUserService.isPlanetMemberBound(request.getPlanetMemberNumber(), wechatUserId)) {
            throw new BusinessException(400, "该星球账号已被其他微信用户绑定");
        }

        // 执行绑定
        WechatUser wechatUser = wechatUserService.bindPlanet(
            wechatUserId,
            request.getPlanetNickname(),
            request.getPlanetMemberNumber()
        );

        BindPlanetVO vo = new BindPlanetVO();
        vo.setPlanetNickname(wechatUser.getPlanetNickname());
        vo.setPlanetMemberNumber(wechatUser.getPlanetMemberNumber());
        vo.setBoundAt(LocalDateTime.now());

        return Result.success(vo);
    }
}
```

#### BindPlanetRequest.java - 请求参数

```java
@Data
public class BindPlanetRequest {

    @NotBlank(message = "星球昵称不能为空")
    @Size(min = 1, max = 50, message = "星球昵称长度应为1-50个字符")
    private String planetNickname;

    @NotBlank(message = "星球ID不能为空")
    @Pattern(regexp = "^\\d{8,15}$", message = "星球ID必须为8-15位数字")
    private String planetMemberNumber;
}
```

#### WechatUserService.java - 绑定逻辑

```java
@Service
@RequiredArgsConstructor
public class WechatUserServiceImpl implements WechatUserService {

    private final WechatUserMapper wechatUserMapper;

    @Override
    public boolean isPlanetMemberBound(String planetMemberNumber, Long excludeUserId) {
        return wechatUserMapper.countByPlanetMemberNumber(planetMemberNumber, excludeUserId) > 0;
    }

    @Override
    @Transactional
    public WechatUser bindPlanet(Long wechatUserId, String planetNickname, String planetMemberNumber) {
        WechatUser user = wechatUserMapper.selectById(wechatUserId);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }

        user.setPlanetNickname(planetNickname);
        user.setPlanetMemberNumber(planetMemberNumber);
        user.setBindStatus("bound");
        user.setUpdatedAt(LocalDateTime.now());

        wechatUserMapper.updateById(user);
        return user;
    }
}
```

#### 前端 BindPlanet.vue

```vue
<template>
  <div class="bind-planet-page">
    <van-nav-bar title="绑定星球账号" left-arrow @click-left="onBack" />

    <div class="bind-tips">
      <van-icon name="info-o" />
      <span>请填写您的知识星球信息，用于打卡核对和退款</span>
    </div>

    <van-form @submit="onSubmit" :show-error-message="true">
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
        <van-button round block type="primary" native-type="submit" :loading="loading">
          确认绑定
        </van-button>
      </div>
    </van-form>

    <!-- 帮助弹窗 -->
    <van-popup v-model:show="showHelp" position="bottom" round :style="{ height: '60%' }">
      <div class="help-content">
        <h3>如何获取星球ID</h3>
        <div class="step">
          <span class="step-num">1</span>
          <span>打开知识星球App或网页版</span>
        </div>
        <div class="step">
          <span class="step-num">2</span>
          <span>进入「我的」页面</span>
        </div>
        <div class="step">
          <span class="step-num">3</span>
          <span>点击头像进入个人资料</span>
        </div>
        <div class="step">
          <span class="step-num">4</span>
          <span>复制「星球编号」</span>
        </div>
        <img src="@/assets/help-planet-id.png" alt="示例图" class="help-img" />
        <van-button block @click="showHelp = false">我知道了</van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showFailToast } from 'vant'
import { bindPlanet } from '@/api/auth'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const showHelp = ref(false)

const form = reactive({
  planetNickname: '',
  planetMemberNumber: ''
})

const planetIdRules = [
  { required: true, message: '请输入星球ID' },
  { pattern: /^\d{8,15}$/, message: '星球ID必须为8-15位数字' }
]

const onBack = () => {
  router.back()
}

const onSubmit = async () => {
  loading.value = true
  try {
    await bindPlanet({
      planetNickname: form.planetNickname,
      planetMemberNumber: form.planetMemberNumber
    })
    showToast('绑定成功')

    // 跳转回来源页
    const returnUrl = route.query.returnUrl as string
    if (returnUrl) {
      router.replace(returnUrl)
    } else {
      router.replace('/')
    }
  } catch (error: any) {
    showFailToast(error.message || '绑定失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.bind-planet-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.bind-tips {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  font-size: 14px;
  color: #969799;
}

.submit-btn {
  padding: 24px 16px;
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
}

.help-img {
  width: 100%;
  margin: 16px 0;
  border-radius: 8px;
}
</style>
```

### 安全检查清单

- [ ] 绑定接口需要 JWT 认证
- [ ] 星球 ID 格式校验（前端+后端）
- [ ] 防止同一星球账号被多个微信用户绑定
- [ ] XSS 防护（星球昵称可能含特殊字符）
- [ ] 日志记录绑定操作（审计需要）

### 错误码

| 错误码 | HTTP | 含义 | 处理 |
|--------|------|------|------|
| 400 | 400 | 参数校验失败 | 检查输入格式 |
| 400001 | 400 | 该星球账号已被绑定 | 提示用户检查或联系客服 |
| 401 | 401 | 未登录或 Token 过期 | 重新触发 OAuth |
| 404 | 404 | 训练营不存在 | 返回列表页 |
| 500 | 500 | 服务器错误 | 提示重试 |

### 测试要点

**后端测试**:
1. `BindPlanetServiceTest` - 测试绑定逻辑、重复绑定校验
2. `CampDetailControllerTest` - 测试详情接口、memberStatus 逻辑

**前端测试**:
1. `CampDetail.spec.ts` - 测试详情展示、按钮状态
2. `BindPlanet.spec.ts` - 测试表单校验、提交流程

**集成测试**:
1. 完整报名流程（未登录 → OAuth → 绑定 → 详情）
2. 已绑定用户直接进入报名
3. 已报名用户显示查看进度

---

## 项目结构

### 后端新增/修改文件

```
backend/src/main/java/com/camp/
├── controller/
│   └── auth/
│       └── AuthController.java          # 新增 bindPlanet 接口
├── service/
│   └── WechatUserService.java           # 新增绑定方法
├── dto/
│   └── auth/
│       ├── BindPlanetRequest.java       # 新增
│       └── BindPlanetVO.java            # 新增
└── mapper/
    └── WechatUserMapper.java            # 新增查询方法
```

### 前端新增文件

```
frontend/h5-member/src/
├── views/
│   ├── CampDetail.vue                   # 训练营详情页
│   └── BindPlanet.vue                   # 星球绑定页
├── api/
│   ├── camp.ts                          # getCampDetail
│   └── auth.ts                          # bindPlanet（扩展）
├── router/
│   └── index.ts                         # 新增路由
├── assets/
│   └── help-planet-id.png               # 帮助图片
└── types/
    └── camp.d.ts                        # 类型定义
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP02-S01 H5 前端骨架 | ready-for-dev | 项目结构、路由配置 |
| EP02-S02 微信 OAuth | ready-for-dev | 登录态管理、JWT 验证 |
| EP01-S03 训练营 CRUD | ready-for-dev | 训练营数据表 |

### 后续依赖

本故事完成后，以下功能可以开始:
- EP02-S04 微信支付下单与调起
- EP02-S06 支付成功后群二维码展示

---

## References

| 文档 | 路径 | 相关章节 |
|------|------|----------|
| PRD | `docs/PRD.md` | FR2.2 H5报名信息填写 |
| 技术方案 | `docs/v1/design/技术方案.md` | 5.1.0 用户报名流程 |
| API 文档 | `docs/v1/api/接口文档.md` | H5训练营接口、认证接口 |
| 数据库设计 | `docs/v1/design/数据库设计.md` | wechat_user 表 |
| 状态枚举 | `docs/v1/design/状态枚举定义.md` | wechat_user.bind_status |
| Epic 定义 | `docs/epics.md` | EP02-S03 |
| 前一故事 | `docs/sprint-artifacts/stories/2-2-wechat-oauth.md` | OAuth 流程参考 |

---

## Dev Agent Record

### Context Reference
- Epic: EP02 会员报名与支付系统
- Story: EP02-S03 训练营详情页与报名信息填写
- FR Coverage: FR2.2, FR3.1

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
| 前置条件 | EP02-S02 完成 |
| 覆盖 FR | FR2.2, FR3.1 |
| 创建日期 | 2025-12-13 |
| 状态 | drafted |
