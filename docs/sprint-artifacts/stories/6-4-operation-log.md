# Story 6.4: 操作日志查询

**Status**: ready-for-dev

---

## Story

**作为**管理员，
**我希望**能够查询系统操作日志，
**以便于**追踪操作记录，进行问题排查和审计。

---

## 验收标准

### AC-1: 查看操作日志列表
```gherkin
Feature: 操作日志列表
  Scenario: 查看操作日志
    Given 管理员访问日志页面
    When GET /api/admin/logs?pageNum=1&pageSize=20
    Then 返回操作日志列表:
      | 字段 | 说明 |
      | operationTime | 操作时间 |
      | operator | 操作人 |
      | operationType | 操作类型 |
      | targetType | 操作对象类型 |
      | targetId | 操作对象ID |
      | content | 操作详情 |
      | ipAddress | IP地址 |

  Scenario: 分页展示
    Given 日志记录超过 20 条
    Then 分页展示
    And 支持每页 20/50/100 条
```

### AC-2: 日志筛选
```gherkin
Feature: 日志筛选
  Scenario: 按操作类型筛选
    Given 选择操作类型 "APPROVE_REFUND"
    When GET /api/admin/logs?operationType=APPROVE_REFUND
    Then 返回所有退款审核操作的日志

  Scenario: 按操作人筛选
    Given 输入操作人 "admin"
    When GET /api/admin/logs?operator=admin
    Then 返回该操作人的所有日志

  Scenario: 按时间范围筛选
    Given 选择时间范围 2024-01-01 ~ 2024-01-31
    When GET /api/admin/logs?startDate=2024-01-01&endDate=2024-01-31
    Then 返回该时间范围内的日志

  Scenario: 组合筛选
    Given 选择操作类型 + 时间范围
    Then 返回满足所有条件的日志
```

### AC-3: 操作类型定义
```gherkin
Feature: 操作类型
  Scenario: 支持的操作类型
    Given 系统运行中
    Then 记录以下操作类型:
      | 类型 | 说明 |
      | CREATE_CAMP | 创建训练营 |
      | UPDATE_CAMP | 更新训练营 |
      | PUBLISH_CAMP | 发布训练营 |
      | APPROVE_REFUND | 审核退款 |
      | REJECT_REFUND | 拒绝退款 |
      | EXECUTE_REFUND | 执行退款 |
      | MANUAL_BIND | 人工绑定 |
      | MANUAL_MATCH | 人工匹配 |
      | UPDATE_CONFIG | 更新配置 |
      | LOGIN | 登录 |
      | LOGOUT | 登出 |
```

### AC-4: 日志详情查看
```gherkin
Feature: 日志详情
  Scenario: 查看详情
    Given 点击某条日志
    Then 弹出详情对话框
    And 显示完整的 content JSON
    And 格式化显示

  Scenario: 跳转到关联对象
    Given 日志关联了训练营
    When 点击 "查看训练营"
    Then 跳转到训练营详情页
```

### AC-5: AOP 自动记录
```gherkin
Feature: 自动记录日志
  Scenario: 注解方式记录
    Given 方法添加了 @OperationLog 注解
    When 方法执行成功
    Then 自动记录操作日志
    And 包含操作人、时间、IP、参数

  Scenario: 获取操作人信息
    Given 请求带有 JWT Token
    Then 从 SecurityContext 获取操作人
    And 记录用户ID和用户名

  Scenario: 获取 IP 地址
    Given HTTP 请求
    Then 从 X-Forwarded-For 或 RemoteAddr 获取 IP
```

---

## Tasks / Subtasks

- [ ] **Task 1: 后端 - 日志查询接口** (AC: #1, #2)
  - [ ] 1.1 创建 `LogController.java`
  - [ ] 1.2 实现 `GET /api/admin/logs`
  - [ ] 1.3 支持多条件筛选
  - [ ] 1.4 分页查询

- [ ] **Task 2: 后端 - AOP 日志切面** (AC: #5)
  - [ ] 2.1 创建 `@OperationLog` 注解
  - [ ] 2.2 创建 `OperationLogAspect.java`
  - [ ] 2.3 实现自动记录逻辑
  - [ ] 2.4 IP 地址获取

- [ ] **Task 3: 后端 - 日志类型枚举** (AC: #3)
  - [ ] 3.1 创建 `OperationType` 枚举
  - [ ] 3.2 添加类型描述

- [ ] **Task 4: 前端 - 日志列表页面** (AC: #1, #2)
  - [ ] 4.1 创建 `OperationLog.vue`
  - [ ] 4.2 实现日志表格
  - [ ] 4.3 实现筛选表单
  - [ ] 4.4 分页组件

- [ ] **Task 5: 前端 - 日志详情** (AC: #4)
  - [ ] 5.1 实现详情对话框
  - [ ] 5.2 JSON 格式化显示
  - [ ] 5.3 关联对象跳转

- [ ] **Task 6: 测试** (AC: #全部)
  - [ ] 6.1 测试 AOP 自动记录
  - [ ] 6.2 测试筛选功能
  - [ ] 6.3 测试分页

---

## Dev Notes

### 业务流程概述

```
用户操作触发:
├── 管理员执行操作 (创建训练营、审核退款等)
├── AOP 切面拦截
├── 获取操作人、IP、参数
└── 异步写入 operation_log 表
     ↓
管理员查看日志:
├── 访问日志页面
├── 设置筛选条件
├── 分页展示日志
└── 查看详情/跳转关联对象
```

### 代码实现参考

#### @OperationLog 注解

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface OperationLog {

    /**
     * 操作类型
     */
    String type();

    /**
     * 操作描述
     */
    String description() default "";

    /**
     * 目标类型
     */
    String targetType() default "";
}
```

#### OperationLogAspect.java

```java
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class OperationLogAspect {

    private final OperationLogMapper logMapper;
    private final HttpServletRequest request;

    @AfterReturning(pointcut = "@annotation(operationLog)", returning = "result")
    public void logOperation(JoinPoint joinPoint, OperationLog operationLog, Object result) {
        try {
            // 获取操作人
            String operator = SecurityContextHolder.getContext()
                .getAuthentication().getName();

            // 获取 IP
            String ip = getClientIp(request);

            // 获取方法参数
            String params = getMethodParams(joinPoint);

            // 获取目标 ID
            Long targetId = extractTargetId(joinPoint, result);

            // 构建日志内容
            Map<String, Object> content = new LinkedHashMap<>();
            content.put("method", joinPoint.getSignature().toShortString());
            content.put("params", params);
            if (result != null) {
                content.put("result", result);
            }

            // 保存日志
            com.camp.entity.OperationLog log = com.camp.entity.OperationLog.builder()
                .operationType(operationLog.type())
                .targetType(operationLog.targetType())
                .targetId(targetId)
                .operator(operator)
                .content(JsonUtils.toJson(content))
                .ipAddress(ip)
                .operationTime(LocalDateTime.now())
                .build();

            logMapper.insert(log);

        } catch (Exception e) {
            log.error("记录操作日志失败", e);
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // 多级代理取第一个
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    private String getMethodParams(JoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        if (args == null || args.length == 0) {
            return "[]";
        }

        List<Object> filteredArgs = new ArrayList<>();
        for (Object arg : args) {
            // 过滤 HttpServletRequest/Response 等
            if (arg instanceof HttpServletRequest
                || arg instanceof HttpServletResponse
                || arg instanceof BindingResult) {
                continue;
            }
            filteredArgs.add(arg);
        }
        return JsonUtils.toJson(filteredArgs);
    }

    private Long extractTargetId(JoinPoint joinPoint, Object result) {
        // 从参数或返回值提取 ID
        Object[] args = joinPoint.getArgs();
        for (Object arg : args) {
            if (arg instanceof Long) {
                return (Long) arg;
            }
        }
        // 从返回值提取
        if (result != null && result instanceof Result) {
            Object data = ((Result<?>) result).getData();
            if (data instanceof Map) {
                Object id = ((Map<?, ?>) data).get("id");
                if (id instanceof Long) {
                    return (Long) id;
                }
            }
        }
        return null;
    }
}
```

#### LogController.java

```java
@RestController
@RequestMapping("/api/admin/logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class LogController {

    private final OperationLogMapper logMapper;

    @GetMapping
    public Result<PageResult<OperationLogVO>> getLogs(
            @RequestParam(required = false) String operationType,
            @RequestParam(required = false) String operator,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate,
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "20") Integer pageSize) {

        LambdaQueryWrapper<com.camp.entity.OperationLog> wrapper = new LambdaQueryWrapper<>();

        if (StringUtils.isNotBlank(operationType)) {
            wrapper.eq(com.camp.entity.OperationLog::getOperationType, operationType);
        }
        if (StringUtils.isNotBlank(operator)) {
            wrapper.like(com.camp.entity.OperationLog::getOperator, operator);
        }
        if (startDate != null) {
            wrapper.ge(com.camp.entity.OperationLog::getOperationTime, startDate.atStartOfDay());
        }
        if (endDate != null) {
            wrapper.lt(com.camp.entity.OperationLog::getOperationTime, endDate.plusDays(1).atStartOfDay());
        }

        wrapper.orderByDesc(com.camp.entity.OperationLog::getOperationTime);

        IPage<com.camp.entity.OperationLog> page = logMapper.selectPage(
            new Page<>(pageNum, pageSize), wrapper
        );

        List<OperationLogVO> voList = page.getRecords().stream()
            .map(this::toVO)
            .collect(Collectors.toList());

        return Result.success(PageResult.of(voList, page.getTotal()));
    }

    @GetMapping("/types")
    public Result<List<EnumVO>> getOperationTypes() {
        List<EnumVO> types = Arrays.stream(OperationType.values())
            .map(t -> new EnumVO(t.name(), t.getDescription()))
            .collect(Collectors.toList());
        return Result.success(types);
    }
}
```

#### 在业务方法添加注解

```java
@Service
public class CampServiceImpl implements CampService {

    @Override
    @Transactional
    @OperationLog(type = "CREATE_CAMP", targetType = "training_camp", description = "创建训练营")
    public TrainingCamp createCamp(CampCreateRequest request) {
        // 业务逻辑...
    }

    @Override
    @Transactional
    @OperationLog(type = "PUBLISH_CAMP", targetType = "training_camp", description = "发布训练营")
    public void publishCamp(Long campId) {
        // 业务逻辑...
    }
}

@Service
public class RefundServiceImpl implements RefundService {

    @Override
    @Transactional
    @OperationLog(type = "APPROVE_REFUND", targetType = "refund_record", description = "审核通过退款")
    public void approveRefund(Long refundId, String remark) {
        // 业务逻辑...
    }
}
```

### OperationType 枚举

```java
public enum OperationType {
    CREATE_CAMP("创建训练营"),
    UPDATE_CAMP("更新训练营"),
    PUBLISH_CAMP("发布训练营"),
    APPROVE_REFUND("审核退款"),
    REJECT_REFUND("拒绝退款"),
    EXECUTE_REFUND("执行退款"),
    MANUAL_BIND("人工绑定"),
    MANUAL_MATCH("人工匹配"),
    UPDATE_CONFIG("更新配置"),
    LOGIN("登录"),
    LOGOUT("登出");

    private final String description;

    OperationType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
```

---

## 项目结构

### 后端新增文件

```
backend/src/main/java/com/camp/
├── controller/
│   └── admin/
│       └── LogController.java                  # 新增日志控制器
├── annotation/
│   └── OperationLog.java                       # 新增操作日志注解
├── aspect/
│   └── OperationLogAspect.java                 # 新增日志切面
├── enums/
│   └── OperationType.java                      # 新增操作类型枚举
└── vo/
    └── OperationLogVO.java                     # 新增日志VO
```

### 前端新增文件

```
frontend/admin-web/src/
└── views/
    └── system/
        └── OperationLog.vue                    # 新增操作日志页面
```

---

## 依赖关系

### 前置条件

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| EP01-S03 训练营CRUD | ready-for-dev | 被记录的操作 |

---

## Story Metadata

| 属性 | 值 |
|------|-----|
| Story 点数 | 2 |
| 优先级 | P2 |
| Epic | EP06 |
| 前置条件 | EP01-S03 完成 |
| 覆盖 FR | FR10.4 |
| 创建日期 | 2025-12-13 |
| 状态 | ready-for-dev |
