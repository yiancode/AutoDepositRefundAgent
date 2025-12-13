# Story 5.3: 人工绑定会员

**Status**: ready-for-dev

---

## Story

**作为**管理员，
**我希望**能够为绑定超时的会员手动关联星球用户，
**以便于**这些会员能够正常参与退款流程。

---

## 验收标准

### AC-1: 待人工绑定会员列表
```gherkin
Feature: 待人工绑定列表
  Scenario: 查看待人工绑定会员
    Given 管理员已登录
    When GET /api/admin/members?bindStatus=manual_review
    Then 返回 bind_status=manual_review 的会员列表
    And 显示:
      | 字段 | 说明 |
      | 训练营名称 | - |
      | 用户填写信息 | 星球昵称和ID |
      | 支付金额 | - |
      | 支付时间 | - |
      | 过期时间 | 绑定超时时间 |

  Scenario: 统计待处理数量
    Given 会员列表页
    Then 统计卡片显示待人工审核数量
```

### AC-2: 搜索星球用户
```gherkin
Feature: 星球用户搜索
  Scenario: 搜索星球用户
    Given 管理员在人工绑定对话框
    When GET /api/admin/planet-users?keyword=小明
    Then 返回匹配的星球用户列表
    And 包含:
      | 字段 | 说明 |
      | id | planet_user 表ID |
      | planetUserId | 星球用户ID |
      | planetNickname | 星球昵称 |
      | avatarUrl | 头像 |
      | groupName | 所属圈子 |

  Scenario: 支持多字段搜索
    Given 输入关键词
    Then 同时匹配星球昵称和星球ID
```

### AC-3: 执行人工绑定
```gherkin
Feature: 人工绑定操作
  Scenario: 管理员执行人工绑定
    Given 管理员选择了正确的星球用户
    When POST /api/admin/members/{id}/bind {"planetUserId": 501}
    Then bind_status = completed
    And bind_method = manual
    And 关联 planet_user_id
    And 更新 planet_nickname
    And 记录操作日志

  Scenario: 绑定成功后更新匹配状态
    Given 人工绑定成功
    Then 自动执行匹配
    And match_status = matched

  Scenario: 重复绑定校验
    Given 会员 bind_status = completed
    When 再次调用绑定接口
    Then 返回错误 "会员已绑定，无需重复操作"

  Scenario: 星球用户不存在
    Given 提供的 planetUserId 不存在
    When 调用绑定接口
    Then 返回错误 "星球用户不存在"
```

### AC-4: 绑定对话框
```gherkin
Feature: 绑定对话框
  Scenario: 打开绑定对话框
    Given 点击会员的"绑定"按钮
    Then 弹出绑定对话框
    And 显示会员填写的信息
    And 提供星球用户搜索框

  Scenario: 搜索和选择
    Given 输入搜索关键词
    When 搜索结果返回
    Then 显示星球用户列表
    And 每行显示昵称、ID、头像
    And 点击选择某个用户

  Scenario: 确认绑定
    Given 已选择星球用户
    When 点击"确认绑定"
    Then 调用绑定API
    And 显示绑定结果
    And 刷新列表
```

### AC-5: 绑定日志记录
```gherkin
Feature: 绑定日志
  Scenario: 记录人工绑定日志
    Given 执行人工绑定
    Then 记录到 operation_log:
      | 字段 | 值 |
      | operation_type | manual_bind |
      | target_type | camp_member |
      | target_id | 会员ID |
      | content | JSON详情 |

  Scenario: 日志内容包含
    Given 人工绑定成功
    Then content JSON 包含:
      | 字段 | 说明 |
      | memberId | 会员ID |
      | planetUserId | 绑定的星球用户ID |
      | planetNickname | 星球昵称 |
      | filledNickname | 用户填写的昵称 |
      | operator | 操作人 |
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - 星球用户搜索接口** (AC: #2)
  - [ ] 1.1 实现 `GET /api/admin/planet-users`
  - [ ] 1.2 支持关键词模糊搜索
  - [ ] 1.3 编写接口测试

- [ ] **Task 2: 后端 - 人工绑定接口** (AC: #3)
  - [ ] 2.1 实现 `POST /api/admin/members/{id}/bind`
  - [ ] 2.2 更新会员绑定信息
  - [ ] 2.3 自动执行匹配
  - [ ] 2.4 记录操作日志
  - [ ] 2.5 编写接口测试

- [ ] **Task 3: 后端 - 绑定状态校验** (AC: #3)
  - [ ] 3.1 实现重复绑定校验
  - [ ] 3.2 实现星球用户存在性校验
  - [ ] 3.3 编写校验测试

- [ ] **Task 4: 前端 - 绑定对话框组件** (AC: #4)
  - [ ] 4.1 创建 `ManualBindDialog.vue`
  - [ ] 4.2 实现星球用户搜索
  - [ ] 4.3 实现选择和确认流程
  - [ ] 4.4 处理绑定结果

- [ ] **Task 5: 前端 - 集成到会员列表** (AC: #1)
  - [ ] 5.1 添加"绑定"操作按钮
  - [ ] 5.2 调用绑定对话框
  - [ ] 5.3 刷新列表

- [ ] **Task 6: 集成测试与验收** (AC: #全部)
  - [ ] 6.1 测试星球用户搜索
  - [ ] 6.2 测试人工绑定流程
  - [ ] 6.3 测试状态校验
  - [ ] 6.4 测试日志记录

---

## Dev Notes

### 业务流程概述

```
管理员进入会员列表
     ↓
筛选 bind_status = manual_review
     ↓
点击某会员的"绑定"按钮
     ↓
弹出绑定对话框:
├── 显示会员填写的信息
├── 搜索星球用户
└── 选择正确的星球用户
     ↓
点击"确认绑定"
     ↓
后端处理:
├── 验证星球用户存在
├── 更新 camp_member:
│   ├── bind_status = completed
│   ├── bind_method = manual
│   ├── planet_member_number
│   └── planet_nickname
├── 执行匹配 → match_status = matched
└── 记录操作日志
     ↓
返回成功，刷新列表
```

### 代码实现参考

#### MemberController.java - 人工绑定

```java
/**
 * 人工绑定会员
 */
@PostMapping("/{id}/bind")
@PreAuthorize("hasRole('ADMIN')")
public Result<ManualBindResult> manualBind(
        @PathVariable Long id,
        @RequestBody @Valid ManualBindRequest request) {

    ManualBindResult result = memberService.manualBind(id, request);
    return Result.success(result);
}
```

#### MemberServiceImpl.java - 人工绑定实现

```java
@Override
@Transactional
public ManualBindResult manualBind(Long memberId, ManualBindRequest request) {
    CampMember member = memberMapper.selectById(memberId);
    if (member == null) {
        throw new BusinessException(404, "会员不存在");
    }

    // 检查是否已绑定
    if (BindStatus.COMPLETED.equals(member.getBindStatus())) {
        throw new BusinessException(400, "会员已绑定，无需重复操作");
    }

    // 查询星球用户
    PlanetUser planetUser = planetUserMapper.selectById(request.getPlanetUserId());
    if (planetUser == null) {
        throw new BusinessException(404, "星球用户不存在");
    }

    // 更新会员绑定信息
    member.setBindStatus(BindStatus.COMPLETED);
    member.setBindMethod(BindMethod.MANUAL);
    member.setPlanetMemberNumber(planetUser.getPlanetUserId());
    member.setPlanetNickname(planetUser.getPlanetNickname());
    member.setBindTime(LocalDateTime.now());
    memberMapper.updateById(member);

    // 自动执行匹配
    member.setMatchStatus(MatchStatus.MATCHED);
    member.setMatchedAt(LocalDateTime.now());
    memberMapper.updateById(member);

    // 记录操作日志
    operationLogService.log(OperationLog.builder()
        .operationType("manual_bind")
        .targetType("camp_member")
        .targetId(memberId)
        .content(JsonUtils.toJson(Map.of(
            "memberId", memberId,
            "planetUserId", request.getPlanetUserId(),
            "planetNickname", planetUser.getPlanetNickname(),
            "filledNickname", member.getFilledPlanetNickname()
        )))
        .build());

    return ManualBindResult.builder()
        .memberId(memberId)
        .bindStatus(BindStatus.COMPLETED)
        .matchStatus(MatchStatus.MATCHED)
        .planetUser(PlanetUserVO.from(planetUser))
        .build();
}
```

### 安全检查清单

- [ ] 权限控制：仅 ADMIN 可执行绑定
- [ ] 状态校验：仅 manual_review 可绑定
- [ ] 操作日志：记录所有绑定操作
- [ ] 防重复：已绑定不能重复绑定

---

## 项目结构

### 后端新增/修改文件

```
backend/src/main/java/com/camp/
├── controller/
│   └── admin/
│       └── MemberController.java              # 修改添加绑定接口
├── dto/
│   └── ManualBindRequest.java                 # 新增绑定请求
└── vo/
    └── ManualBindResult.java                  # 新增绑定结果
```

### 前端新增文件

```
frontend/admin-web/src/
└── components/
    └── ManualBindDialog.vue                   # 新增绑定对话框
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP02-S08 绑定超时检查 | ready-for-dev | manual_review 状态来源 |
| EP03-S01 SDK集成 | ready-for-dev | planet_user 表数据 |

### 后续依赖

本故事完成后:
- EP04-S03 退款名单生成（需要绑定完成）

---

## References

| 文档 | 路径 | 相关章节 |
|------|------|----------|
| PRD | `docs/PRD.md` | 4.3.3 人工绑定 |
| Epic 定义 | `docs/epics.md` | EP05-S03 |

---

## Story Metadata

| 属性 | 值 |
|------|-----|
| Story 点数 | 2 |
| 优先级 | P1 |
| Epic | EP05 |
| 前置条件 | EP02-S08 完成 |
| 覆盖 FR | FR7.3, FR3.4 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
