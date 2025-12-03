# FastAuth 接入方案与知识星球会员服务设计

> 本文档为 AutoDepositRefundAgent v1 版本的用户认证方案设计，包含 FastAuth 集成和知识星球会员模块设计。

## 一、方案概述

为训练营押金退款系统设计完整的用户认证方案：

1. **FastAuth 集成**：实现微信公众号 OAuth 登录
2. **知识星球会员模块**：集成到现有项目，提供会员同步和验证功能
3. **用户体系整合**：将 OAuth 用户与星球会员关联

---

## 二、知识星球会员模块（集成方案）

### 2.1 模块定位

```
┌─────────────────────────────────────────────────────────────┐
│              知识星球会员模块（集成到现有项目）                │
│  职责：定时同步知识星球会员数据，提供会员身份验证接口         │
├─────────────────────────────────────────────────────────────┤
│  输入：知识星球 Cookie（system_config 配置）                 │
│  输出：会员列表、会员验证接口                                │
│  存储：复用现有 PostgreSQL 数据库                            │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 与现有架构集成

现有项目已包含以下相关组件，本方案在此基础上扩展：

| 已有组件 | 说明 | 扩展内容 |
|---------|------|---------|
| `planet_user` 表 | 存储知识星球用户基本信息 | 增加会员专属字段 |
| `PlanetApiManager` | 知识星球 API 封装 | 增加获取全量会员列表方法 |
| `CheckinSyncTask` | 打卡数据同步定时任务 | 新增会员同步定时任务 |

### 2.3 数据库设计

#### 2.3.1 扩展 planet_user 表

在现有 `planet_user` 表基础上增加会员相关字段：

```sql
-- 修改 planet_user 表，增加会员相关字段（PostgreSQL 语法）
ALTER TABLE planet_user ADD COLUMN IF NOT EXISTS user_number VARCHAR(20);
ALTER TABLE planet_user ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
ALTER TABLE planet_user ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP;
ALTER TABLE planet_user ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'member';
ALTER TABLE planet_user ADD COLUMN IF NOT EXISTS member_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE planet_user ADD COLUMN IF NOT EXISTS raw_data JSONB;
ALTER TABLE planet_user ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP;

-- 字段注释（PostgreSQL 使用 COMMENT ON COLUMN 语法）
COMMENT ON COLUMN planet_user.user_number IS '星球编号';
COMMENT ON COLUMN planet_user.avatar_url IS '头像URL';
COMMENT ON COLUMN planet_user.joined_at IS '加入星球时间';
COMMENT ON COLUMN planet_user.role IS '角色: owner/admin/member';
COMMENT ON COLUMN planet_user.member_status IS '会员状态: active/expired/banned';
COMMENT ON COLUMN planet_user.raw_data IS '原始API返回数据';
COMMENT ON COLUMN planet_user.synced_at IS '最后同步时间';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_planet_user_number ON planet_user(user_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_planet_user_nickname ON planet_user(planet_nickname) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_planet_user_synced ON planet_user(synced_at) WHERE deleted_at IS NULL;

COMMENT ON TABLE planet_user IS '知识星球用户/会员表';
```

#### 2.3.2 新增同步日志表

```sql
-- 同步日志表（新增，PostgreSQL 语法）
CREATE TABLE sync_log (
    id BIGSERIAL PRIMARY KEY,

    -- 同步目标
    sync_target VARCHAR(50) NOT NULL,
    planet_id VARCHAR(50),
    camp_id BIGINT,

    -- 同步类型和范围
    sync_type VARCHAR(20) NOT NULL,

    -- 同步统计
    total_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    new_count INTEGER DEFAULT 0,
    update_count INTEGER DEFAULT 0,

    -- 执行状态
    status VARCHAR(20) NOT NULL DEFAULT 'running',
    error_message TEXT,
    error_detail JSONB,

    -- 时间信息
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP,
    duration_ms INTEGER,

    -- 触发信息
    trigger_type VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    trigger_user_id BIGINT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_sync_log_target ON sync_log(sync_target);
CREATE INDEX idx_sync_log_status ON sync_log(status);
CREATE INDEX idx_sync_log_started ON sync_log(started_at DESC);
CREATE INDEX idx_sync_log_planet ON sync_log(planet_id) WHERE planet_id IS NOT NULL;
CREATE INDEX idx_sync_log_camp ON sync_log(camp_id) WHERE camp_id IS NOT NULL;

-- 字段注释（PostgreSQL 语法）
COMMENT ON TABLE sync_log IS '数据同步日志表';
COMMENT ON COLUMN sync_log.sync_target IS '同步目标: member/checkin';
COMMENT ON COLUMN sync_log.planet_id IS '星球ID（可选，为空表示全局同步）';
COMMENT ON COLUMN sync_log.camp_id IS '训练营ID（可选，打卡同步时使用）';
COMMENT ON COLUMN sync_log.sync_type IS '同步类型: full-全量/incremental-增量';
COMMENT ON COLUMN sync_log.total_count IS '总处理数量';
COMMENT ON COLUMN sync_log.success_count IS '成功数量';
COMMENT ON COLUMN sync_log.failed_count IS '失败数量';
COMMENT ON COLUMN sync_log.new_count IS '新增数量';
COMMENT ON COLUMN sync_log.update_count IS '更新数量';
COMMENT ON COLUMN sync_log.status IS '状态: running-执行中/success-成功/failed-失败/partial-部分成功';
COMMENT ON COLUMN sync_log.error_message IS '错误信息';
COMMENT ON COLUMN sync_log.error_detail IS '错误详情（批量时记录每条失败原因）';
COMMENT ON COLUMN sync_log.started_at IS '开始时间';
COMMENT ON COLUMN sync_log.finished_at IS '结束时间';
COMMENT ON COLUMN sync_log.duration_ms IS '执行耗时（毫秒）';
COMMENT ON COLUMN sync_log.trigger_type IS '触发类型: scheduled-定时/manual-手动';
COMMENT ON COLUMN sync_log.trigger_user_id IS '手动触发时的操作人ID';
```

### 2.4 Manager 层扩展

#### 2.4.1 PlanetApiManager 扩展方法

在现有 `PlanetApiManager` 中增加以下方法：

```java
/**
 * 知识星球 API 管理器
 *
 * 现有方法:
 * - getCheckins(checkinId): 获取打卡记录
 *
 * 新增方法:
 * - getMembers(planetId): 获取星球全量会员列表
 * - getMemberDetail(planetId, userId): 获取单个会员详情
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PlanetApiManager {

    private final SystemConfigService configService;
    private final HttpUtils httpUtils;

    // ==================== 新增：会员相关方法 ====================

    /**
     * 获取星球全量会员列表（分页拉取）
     *
     * @param planetId 星球ID
     * @return 会员列表
     */
    public List<PlanetMemberDTO> getMembers(String planetId) {
        List<PlanetMemberDTO> allMembers = new ArrayList<>();
        String endTime = null;

        do {
            PlanetMemberPageResult page = getMembersPage(planetId, endTime, 100);
            if (page == null || page.getMembers().isEmpty()) {
                break;
            }

            allMembers.addAll(page.getMembers());
            endTime = page.getEndTime();

            // 控制请求频率，防止被封禁
            sleepBetweenRequests();

        } while (endTime != null);

        return allMembers;
    }

    /**
     * 分页获取会员列表
     *
     * @param planetId 星球ID
     * @param endTime 分页游标（上一页最后一条的时间戳）
     * @param count 每页数量
     * @return 分页结果
     */
    public PlanetMemberPageResult getMembersPage(String planetId, String endTime, int count) {
        String cookie = configService.getConfig("planet.cookie");

        String url = String.format(
            "https://api.zsxq.com/v2/groups/%s/members?count=%d",
            planetId, count
        );

        if (endTime != null) {
            url += "&end_time=" + urlEncode(endTime);
        }

        HttpHeader header = buildHeader(cookie);
        String response = httpUtils.get(url, null, header, false).getBody();

        return parseMemberPageResult(response);
    }

    /**
     * 获取单个会员详情
     *
     * @param planetId 星球ID
     * @param userId 用户ID
     * @return 会员详情
     */
    public PlanetMemberDTO getMemberDetail(String planetId, String userId) {
        String cookie = configService.getConfig("planet.cookie");

        String url = String.format(
            "https://api.zsxq.com/v2/groups/%s/members/%s",
            planetId, userId
        );

        HttpHeader header = buildHeader(cookie);
        String response = httpUtils.get(url, null, header, false).getBody();

        return parseMemberDetail(response);
    }

    // ==================== 私有方法 ====================

    private HttpHeader buildHeader(String cookie) {
        HttpHeader header = new HttpHeader();
        header.add("Cookie", cookie);
        header.add("User-Agent", "Mozilla/5.0 (compatible; CampBot/1.0)");
        header.add("Referer", "https://wx.zsxq.com/");
        return header;
    }

    private void sleepBetweenRequests() {
        try {
            Thread.sleep(1000); // 每次请求间隔 1 秒
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private PlanetMemberPageResult parseMemberPageResult(String response) {
        JSONObject json = JSONObject.parseObject(response);

        if (!json.getBoolean("succeeded")) {
            log.error("获取会员列表失败: {}", json.getString("resp_data"));
            return null;
        }

        JSONObject respData = json.getJSONObject("resp_data");
        JSONArray members = respData.getJSONArray("members");

        List<PlanetMemberDTO> memberList = new ArrayList<>();
        for (int i = 0; i < members.size(); i++) {
            memberList.add(parseMember(members.getJSONObject(i)));
        }

        return PlanetMemberPageResult.builder()
            .members(memberList)
            .endTime(respData.getString("end_time"))
            .build();
    }

    private PlanetMemberDTO parseMember(JSONObject memberJson) {
        JSONObject user = memberJson.getJSONObject("user");
        return PlanetMemberDTO.builder()
            .userId(user.getString("user_id"))
            .userNumber(user.getInteger("number"))
            .nickname(user.getString("name"))
            .avatarUrl(user.getString("avatar_url"))
            .role(memberJson.getString("role"))
            .joinedAt(parseTime(memberJson.getString("create_time")))
            .rawData(memberJson)
            .build();
    }
}
```

#### 2.4.2 DTO 定义

```java
/**
 * 知识星球会员 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanetMemberDTO {
    /** 星球用户ID */
    private String userId;

    /** 星球编号 */
    private Integer userNumber;

    /** 昵称 */
    private String nickname;

    /** 头像URL */
    private String avatarUrl;

    /** 角色：owner/admin/member */
    private String role;

    /** 加入时间 */
    private LocalDateTime joinedAt;

    /** 原始数据 */
    private JSONObject rawData;
}

/**
 * 会员分页结果
 */
@Data
@Builder
public class PlanetMemberPageResult {
    /** 会员列表 */
    private List<PlanetMemberDTO> members;

    /** 下一页游标（为空表示没有更多数据） */
    private String endTime;
}
```

### 2.5 Service 层设计

#### 2.5.1 MemberSyncService（会员同步服务）

```java
/**
 * 会员同步服务
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MemberSyncService {

    private final PlanetApiManager planetApiManager;
    private final PlanetUserMapper planetUserMapper;
    private final SyncLogMapper syncLogMapper;
    private final SystemConfigService configService;

    /**
     * 全量同步会员
     *
     * @param planetId 星球ID
     * @param triggerType 触发类型
     * @param triggerId 触发人ID（手动触发时）
     * @return 同步日志ID
     */
    @Transactional
    public Long fullSync(String planetId, String triggerType, Long triggerId) {
        // 1. 创建同步日志
        SyncLog syncLog = createSyncLog(planetId, "full", triggerType, triggerId);

        try {
            // 2. 拉取全量会员
            List<PlanetMemberDTO> members = planetApiManager.getMembers(planetId);

            // 3. 批量保存/更新
            int newCount = 0;
            int updateCount = 0;

            for (PlanetMemberDTO member : members) {
                boolean isNew = saveOrUpdateMember(planetId, member);
                if (isNew) {
                    newCount++;
                } else {
                    updateCount++;
                }
            }

            // 4. 更新同步日志
            finishSyncLog(syncLog, members.size(), newCount, updateCount, "success", null);

        } catch (Exception e) {
            log.error("会员同步失败: planetId={}", planetId, e);
            finishSyncLog(syncLog, 0, 0, 0, "failed", e.getMessage());
            throw new BusinessException("会员同步失败: " + e.getMessage());
        }

        return syncLog.getId();
    }

    /**
     * 增量同步会员（分页拉取所有数据，更新已存在会员信息）
     */
    @Transactional
    public Long incrementalSync(String planetId, String triggerType, Long triggerId) {
        SyncLog syncLog = createSyncLog(planetId, "incremental", triggerType, triggerId);

        try {
            int totalProcessed = 0;
            int newCount = 0;
            int updateCount = 0;
            String endTime = null;  // 分页游标

            // 分页拉取直到为空
            while (true) {
                PlanetMemberPageResult page = planetApiManager.getMembersPage(
                    planetId,
                    endTime,
                    100  // 每页 100 条
                );

                if (page == null || page.getMembers().isEmpty()) {
                    break;  // 没有更多数据
                }

                // 处理当前页的会员
                for (PlanetMemberDTO member : page.getMembers()) {
                    boolean isNew = saveOrUpdateMember(planetId, member);
                    if (isNew) {
                        newCount++;
                    } else {
                        updateCount++;
                    }
                    totalProcessed++;
                }

                // 更新分页游标
                endTime = page.getEndTime();
                if (endTime == null || endTime.isEmpty()) {
                    break;  // 最后一页
                }

                // 防止过快请求，休眠 100ms
                Thread.sleep(100);
            }

            finishSyncLog(syncLog, totalProcessed, newCount, updateCount, "success", null);

        } catch (Exception e) {
            log.error("增量同步失败: planetId={}", planetId, e);
            finishSyncLog(syncLog, 0, 0, 0, "failed", e.getMessage());
            throw new BusinessException("增量同步失败: " + e.getMessage());
        }

        return syncLog.getId();
    }

    private boolean saveOrUpdateMember(String planetId, PlanetMemberDTO dto) {
        PlanetUser existing = planetUserMapper.findByPlanetUserId(dto.getUserId());

        if (existing == null) {
            // 新增
            PlanetUser user = new PlanetUser();
            user.setPlanetUserId(dto.getUserId());
            user.setUserNumber(dto.getUserNumber());
            user.setPlanetNickname(dto.getNickname());
            user.setAvatarUrl(dto.getAvatarUrl());
            user.setRole(dto.getRole());
            user.setJoinedAt(dto.getJoinedAt());
            user.setMemberStatus("active");
            user.setRawData(dto.getRawData());
            user.setSyncedAt(LocalDateTime.now());
            user.setCreatedAt(LocalDateTime.now());
            planetUserMapper.insert(user);
            return true;
        } else {
            // 更新
            existing.setUserNumber(dto.getUserNumber());
            existing.setPlanetNickname(dto.getNickname());
            existing.setAvatarUrl(dto.getAvatarUrl());
            existing.setRole(dto.getRole());
            existing.setRawData(dto.getRawData());
            existing.setSyncedAt(LocalDateTime.now());
            existing.setUpdatedAt(LocalDateTime.now());
            planetUserMapper.updateById(existing);
            return false;
        }
    }

    private SyncLog createSyncLog(String planetId, String syncType, String triggerType, Long triggerId) {
        SyncLog log = new SyncLog();
        log.setSyncTarget("member");
        log.setPlanetId(planetId);
        log.setSyncType(syncType);
        log.setStatus("running");
        log.setTriggerType(triggerType);
        log.setTriggerUserId(triggerId);
        log.setStartedAt(LocalDateTime.now());
        syncLogMapper.insert(log);
        return log;
    }

    private void finishSyncLog(SyncLog log, int total, int newCount, int updateCount,
                               String status, String errorMsg) {
        log.setTotalCount(total);
        log.setSuccessCount(newCount + updateCount);
        log.setNewCount(newCount);
        log.setUpdateCount(updateCount);
        log.setStatus(status);
        log.setErrorMessage(errorMsg);
        log.setFinishedAt(LocalDateTime.now());
        log.setDurationMs((int) Duration.between(log.getStartedAt(), log.getFinishedAt()).toMillis());
        syncLogMapper.updateById(log);
    }
}
```

#### 2.5.2 MemberVerifyService（会员验证服务）

```java
/**
 * 会员验证服务
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MemberVerifyService {

    private final PlanetUserMapper planetUserMapper;

    /**
     * 根据星球编号验证会员
     *
     * @param userNumber 星球编号
     * @return 验证结果
     */
    public MemberVerifyResult verifyByNumber(Integer userNumber) {
        PlanetUser user = planetUserMapper.findByUserNumber(userNumber);
        return buildVerifyResult(user);
    }

    /**
     * 根据昵称验证会员（模糊匹配）
     *
     * @param nickname 昵称（支持模糊匹配）
     * @return 验证结果列表
     */
    public List<MemberVerifyResult> verifyByNickname(String nickname) {
        List<PlanetUser> users = planetUserMapper.findByNicknameLike(nickname);
        return users.stream()
            .map(this::buildVerifyResult)
            .collect(Collectors.toList());
    }

    /**
     * 根据星球用户ID验证会员
     *
     * @param planetUserId 星球用户ID
     * @return 验证结果
     */
    public MemberVerifyResult verifyByUserId(String planetUserId) {
        PlanetUser user = planetUserMapper.findByPlanetUserId(planetUserId);
        return buildVerifyResult(user);
    }

    /**
     * 统一验证方法
     *
     * @param identifier 标识符（编号、昵称或用户ID）
     * @param identifierType 标识符类型：number/nickname/userId
     * @return 验证结果
     */
    public MemberVerifyResult verify(String identifier, String identifierType) {
        switch (identifierType) {
            case "number":
                return verifyByNumber(Integer.parseInt(identifier));
            case "userId":
                return verifyByUserId(identifier);
            case "nickname":
                List<MemberVerifyResult> results = verifyByNickname(identifier);
                // 昵称精确匹配优先
                return results.stream()
                    .filter(r -> r.isVerified() && r.getMember().getNickname().equals(identifier))
                    .findFirst()
                    .orElse(results.isEmpty() ? buildVerifyResult(null) : results.get(0));
            default:
                throw new BusinessException("不支持的标识符类型: " + identifierType);
        }
    }

    /**
     * 批量验证会员
     *
     * @param identifiers 标识符列表
     * @param identifierType 标识符类型
     * @return 验证结果Map（标识符 -> 结果）
     */
    public Map<String, MemberVerifyResult> batchVerify(List<String> identifiers, String identifierType) {
        Map<String, MemberVerifyResult> results = new LinkedHashMap<>();

        for (String identifier : identifiers) {
            try {
                results.put(identifier, verify(identifier, identifierType));
            } catch (Exception e) {
                log.warn("验证会员失败: identifier={}, type={}", identifier, identifierType, e);
                results.put(identifier, MemberVerifyResult.builder()
                    .verified(false)
                    .errorMessage(e.getMessage())
                    .build());
            }
        }

        return results;
    }

    /**
     * 搜索会员（支持昵称模糊查询）
     *
     * @param keyword 关键词
     * @param page 页码（从1开始）
     * @param size 每页数量
     * @return 分页结果
     */
    public PageResult<MemberVO> searchMembers(String keyword, int page, int size) {
        // 使用 MyBatis Plus 分页
        Page<PlanetUser> pageParam = new Page<>(page, size);
        IPage<PlanetUser> result = planetUserMapper.searchByKeyword(pageParam, keyword);

        List<MemberVO> members = result.getRecords().stream()
            .map(this::toMemberVO)
            .collect(Collectors.toList());

        return PageResult.<MemberVO>builder()
            .records(members)
            .total(result.getTotal())
            .page(page)
            .size(size)
            .build();
    }

    private MemberVerifyResult buildVerifyResult(PlanetUser user) {
        if (user == null) {
            return MemberVerifyResult.builder()
                .verified(false)
                .build();
        }

        return MemberVerifyResult.builder()
            .verified(true)
            .member(toMemberVO(user))
            .build();
    }

    private MemberVO toMemberVO(PlanetUser user) {
        return MemberVO.builder()
            .id(user.getId())
            .planetUserId(user.getPlanetUserId())
            .userNumber(user.getUserNumber())
            .nickname(user.getPlanetNickname())
            .avatarUrl(user.getAvatarUrl())
            .role(user.getRole())
            .joinedAt(user.getJoinedAt())
            .memberStatus(user.getMemberStatus())
            .build();
    }
}
```

#### 2.5.3 相关 VO/DTO 定义

```java
/**
 * 会员验证结果
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberVerifyResult {
    /** 是否验证通过 */
    private boolean verified;

    /** 会员信息（验证通过时） */
    private MemberVO member;

    /** 错误信息（验证失败时） */
    private String errorMessage;
}

/**
 * 会员视图对象
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberVO {
    private Long id;
    private String planetUserId;
    private Integer userNumber;
    private String nickname;
    private String avatarUrl;
    private String role;
    private LocalDateTime joinedAt;
    private String memberStatus;
}
```

### 2.6 定时任务设计

```java
/**
 * 会员同步定时任务
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MemberSyncTask {

    private final MemberSyncService memberSyncService;
    private final SystemConfigService configService;

    /**
     * 每天凌晨 2:30 全量同步会员
     * 与打卡同步（1:00）错开，避免并发压力
     */
    @Scheduled(cron = "0 30 2 * * ?")
    public void dailyFullSync() {
        String planetId = configService.getConfig("zsxq.planet.id");

        log.info("开始每日全量会员同步: planetId={}", planetId);

        try {
            Long logId = memberSyncService.fullSync(planetId, "scheduled", null);
            log.info("每日全量会员同步完成: logId={}", logId);
        } catch (Exception e) {
            log.error("每日全量会员同步失败", e);
            // 发送告警通知
        }
    }

    /**
     * 每 6 小时增量同步
     * 仅同步新加入的会员，减少 API 调用
     */
    @Scheduled(cron = "0 0 */6 * * ?")
    public void incrementalSync() {
        String planetId = configService.getConfig("zsxq.planet.id");

        log.info("开始增量会员同步: planetId={}", planetId);

        try {
            Long logId = memberSyncService.incrementalSync(planetId, "scheduled", null);
            log.info("增量会员同步完成: logId={}", logId);
        } catch (Exception e) {
            log.error("增量会员同步失败", e);
        }
    }
}
```

### 2.7 Controller 层设计

#### 2.7.1 会员验证接口（H5端）

```java
/**
 * H5 会员接口
 */
@RestController
@RequestMapping("/api/h5/members")
@RequiredArgsConstructor
public class MemberH5Controller {

    private final MemberVerifyService memberVerifyService;

    /**
     * 验证会员身份
     */
    @PostMapping("/verify")
    public Result<MemberVerifyResult> verify(@RequestBody @Valid MemberVerifyRequest request) {
        MemberVerifyResult result = memberVerifyService.verify(
            request.getIdentifier(),
            request.getIdentifierType()
        );
        return Result.success(result);
    }

    /**
     * 搜索会员
     */
    @GetMapping("/search")
    public Result<PageResult<MemberVO>> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.success(memberVerifyService.searchMembers(keyword, page, size));
    }
}
```

#### 2.7.2 会员管理接口（管理端）

```java
/**
 * 管理端会员接口
 */
@RestController
@RequestMapping("/api/admin/members")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class MemberAdminController {

    private final MemberSyncService memberSyncService;
    private final MemberVerifyService memberVerifyService;
    private final SyncLogMapper syncLogMapper;
    private final SystemConfigService configService;

    /**
     * 手动触发全量同步
     */
    @PostMapping("/sync")
    public Result<SyncResultVO> triggerSync(
            @RequestBody @Valid SyncRequest request,
            @AuthenticationPrincipal SystemUser currentUser) {

        String planetId = request.getPlanetId();
        if (planetId == null) {
            planetId = configService.getConfig("zsxq.planet.id");
        }

        Long logId;
        if ("full".equals(request.getSyncType())) {
            logId = memberSyncService.fullSync(planetId, "manual", currentUser.getId());
        } else {
            logId = memberSyncService.incrementalSync(planetId, "manual", currentUser.getId());
        }

        SyncLog log = syncLogMapper.selectById(logId);
        return Result.success(toSyncResultVO(log));
    }

    /**
     * 查询同步状态
     */
    @GetMapping("/sync/status")
    public Result<SyncResultVO> getSyncStatus(@RequestParam(required = false) String planetId) {
        if (planetId == null) {
            planetId = configService.getConfig("zsxq.planet.id");
        }

        SyncLog log = syncLogMapper.findLatestByTarget("member", planetId);
        if (log == null) {
            return Result.success(null);
        }
        return Result.success(toSyncResultVO(log));
    }

    /**
     * 查询同步历史
     */
    @GetMapping("/sync/history")
    public Result<PageResult<SyncResultVO>> getSyncHistory(
            @RequestParam(required = false) String planetId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {

        // 实现分页查询
        // ...
        return Result.success(null);
    }

    /**
     * 批量验证会员
     */
    @PostMapping("/batch-verify")
    public Result<Map<String, MemberVerifyResult>> batchVerify(
            @RequestBody @Valid BatchVerifyRequest request) {
        return Result.success(memberVerifyService.batchVerify(
            request.getIdentifiers(),
            request.getIdentifierType()
        ));
    }

    private SyncResultVO toSyncResultVO(SyncLog log) {
        return SyncResultVO.builder()
            .id(log.getId())
            .syncType(log.getSyncType())
            .status(log.getStatus())
            .totalCount(log.getTotalCount())
            .successCount(log.getSuccessCount())
            .newCount(log.getNewCount())
            .updateCount(log.getUpdateCount())
            .errorMessage(log.getErrorMessage())
            .startedAt(log.getStartedAt())
            .finishedAt(log.getFinishedAt())
            .durationMs(log.getDurationMs())
            .build();
    }
}
```

### 2.8 API 接口文档

#### 2.8.1 会员验证接口

**接口地址**：`POST /api/h5/members/verify`

**接口描述**：验证用户是否为知识星球会员

**请求头**：
| 参数名 | 必填 | 说明 |
|-------|-----|------|
| Content-Type | 是 | application/json |

**请求参数**：
```json
{
  "identifier": "12345",
  "identifierType": "number"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|------|------|
| identifier | String | 是 | 标识符（星球编号、昵称或用户ID） |
| identifierType | String | 是 | 标识符类型：number/nickname/userId |

**响应参数**：
```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "verified": true,
    "member": {
      "id": 1,
      "planetUserId": "454511121545",
      "userNumber": 12345,
      "nickname": "张三",
      "avatarUrl": "https://images.zsxq.com/xxx.jpg",
      "role": "member",
      "joinedAt": "2024-01-15T10:30:00",
      "memberStatus": "active"
    }
  },
  "timestamp": 1701234567890
}
```

| 参数名 | 类型 | 说明 |
|-------|-----|------|
| verified | Boolean | 是否验证通过 |
| member | Object | 会员信息（verified=true 时返回） |
| member.id | Long | 本地数据库ID |
| member.planetUserId | String | 星球用户ID |
| member.userNumber | Integer | 星球编号 |
| member.nickname | String | 昵称 |
| member.avatarUrl | String | 头像URL |
| member.role | String | 角色：owner/admin/member |
| member.joinedAt | DateTime | 加入时间 |
| member.memberStatus | String | 会员状态：active/expired/banned |

**错误码**：
| code | 说明 |
|------|------|
| 200 | 成功 |
| 400 | 参数错误 |
| 1001 | 不支持的标识符类型 |

---

#### 2.8.2 搜索会员接口

**接口地址**：`GET /api/h5/members/search`

**接口描述**：搜索会员（支持昵称模糊查询）

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|------|------|
| keyword | String | 是 | 搜索关键词（昵称） |
| page | Integer | 否 | 页码，默认 1 |
| size | Integer | 否 | 每页数量，默认 20，最大 100 |

**响应参数**：
```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "records": [
      {
        "id": 1,
        "planetUserId": "454511121545",
        "userNumber": 12345,
        "nickname": "张三",
        "avatarUrl": "https://images.zsxq.com/xxx.jpg",
        "role": "member",
        "joinedAt": "2024-01-15T10:30:00",
        "memberStatus": "active"
      }
    ],
    "total": 100,
    "page": 1,
    "size": 20
  },
  "timestamp": 1701234567890
}
```

---

#### 2.8.3 手动触发同步接口

**接口地址**：`POST /api/admin/members/sync`

**接口描述**：手动触发会员同步（需管理员权限）

**请求头**：
| 参数名 | 必填 | 说明 |
|-------|-----|------|
| Authorization | 是 | Bearer {token} |
| Content-Type | 是 | application/json |

**请求参数**：
```json
{
  "planetId": "28855511455142",
  "syncType": "full"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|------|------|
| planetId | String | 否 | 星球ID（默认使用配置的星球ID） |
| syncType | String | 是 | 同步类型：full-全量/incremental-增量 |

**响应参数**：
```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "id": 1,
    "syncType": "full",
    "status": "success",
    "totalCount": 1500,
    "successCount": 1500,
    "newCount": 50,
    "updateCount": 1450,
    "errorMessage": null,
    "startedAt": "2024-12-01T02:30:00",
    "finishedAt": "2024-12-01T02:35:30",
    "durationMs": 330000
  },
  "timestamp": 1701234567890
}
```

---

#### 2.8.4 查询同步状态接口

**接口地址**：`GET /api/admin/members/sync/status`

**接口描述**：查询最近一次同步状态

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|------|------|
| planetId | String | 否 | 星球ID（默认使用配置的星球ID） |

**响应参数**：同 2.8.3

---

#### 2.8.5 批量验证会员接口

**接口地址**：`POST /api/admin/members/batch-verify`

**接口描述**：批量验证会员身份

**请求参数**：
```json
{
  "identifiers": ["12345", "12346", "12347"],
  "identifierType": "number"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|-------|-----|------|------|
| identifiers | String[] | 是 | 标识符列表（最多 100 个） |
| identifierType | String | 是 | 标识符类型：number/nickname/userId |

**响应参数**：
```json
{
  "code": 200,
  "message": "成功",
  "data": {
    "12345": {
      "verified": true,
      "member": { ... }
    },
    "12346": {
      "verified": false,
      "errorMessage": null
    },
    "12347": {
      "verified": true,
      "member": { ... }
    }
  },
  "timestamp": 1701234567890
}
```

### 2.9 风控措施

```yaml
# 防止被知识星球封禁的措施
zsxq:
  rate-limit:
    requests-per-minute: 10           # 每分钟最多10次请求
    requests-per-day: 500             # 每天最多500次请求
    min-interval-ms: 1000             # 请求最小间隔（毫秒）

  retry:
    max-attempts: 3                   # 最大重试次数
    delay-seconds: 60                 # 重试间隔

  alert:
    on-failure: true                  # 失败时告警
    on-cookie-expired: true           # Cookie 过期告警
```

---

## 三、FastAuth 接入方案（Spring Boot v1）

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                        用户访问流程                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   用户 ──→ 前端(Vue) ──→ 后端(Spring Boot) ──→ 数据库               │
│              │                  │                                    │
│              │                  ├──→ FastAuth (微信OAuth)            │
│              │                  │        ↓                           │
│              │                  │    微信公众平台                     │
│              │                  │                                    │
│              │                  └──→ MemberVerifyService             │
│              │                           ↓                           │
│              │                      planet_user 表                   │
│              │                                                       │
│              └──→ 登录成功后，前端存储 JWT Token                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Maven 依赖配置

```xml
<!-- pom.xml -->
<dependencies>
    <!-- FastAuth 核心依赖 -->
    <dependency>
        <groupId>com.yiancode</groupId>
        <artifactId>fastauth</artifactId>
        <version>1.0.0</version>
    </dependency>

    <!-- HTTP 实现 -->
    <dependency>
        <groupId>cn.hutool</groupId>
        <artifactId>hutool-http</artifactId>
        <version>5.8.25</version>
    </dependency>

    <!-- Spring Security -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>

    <!-- JWT -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.12.3</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.12.3</version>
        <scope>runtime</scope>
    </dependency>

    <!-- Redis（用于 State 缓存） -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>
</dependencies>
```

### 3.3 配置文件

```yaml
# application.yml
fastauth:
  # 微信公众号配置
  wechat-mp:
    client-id: ${WECHAT_MP_APP_ID}
    client-secret: ${WECHAT_MP_APP_SECRET}
    redirect-uri: https://your-domain.com/api/auth/callback/wechat-mp

# 应用配置
app:
  auth:
    # returnUrl 白名单（防止开放重定向攻击）
    # 支持精确匹配和通配符（*.example.com）
    allowed-return-urls:
      - localhost             # 开发环境
      - 127.0.0.1             # 本地测试
      - *.your-domain.com     # 生产域名（支持所有子域名）
      - your-domain.com       # 主域名

# JWT 配置
jwt:
  secret: ${JWT_SECRET}
  expiration: 86400000  # 24小时

# 知识星球配置
zsxq:
  planet:
    id: ${ZSXQ_PLANET_ID}
  cookie: ${ZSXQ_COOKIE}
```

### 3.4 核心代码实现

#### 3.4.1 FastAuth 配置类

```java
@Configuration
public class FastAuthConfig {

    @Value("${fastauth.wechat-mp.client-id}")
    private String wechatMpClientId;

    @Value("${fastauth.wechat-mp.client-secret}")
    private String wechatMpClientSecret;

    @Value("${fastauth.wechat-mp.redirect-uri}")
    private String wechatMpRedirectUri;

    @Bean
    public AuthStateCache authStateCache(StringRedisTemplate redisTemplate) {
        // 使用 Redis 存储 State，支持分布式部署
        return new RedisAuthStateCache(redisTemplate);
    }

    @Bean("wechatMpAuthRequest")
    public AuthRequest wechatMpAuthRequest(AuthStateCache authStateCache) {
        return new AuthWeChatMpRequest(
            AuthConfig.builder()
                .clientId(wechatMpClientId)
                .clientSecret(wechatMpClientSecret)
                .redirectUri(wechatMpRedirectUri)
                .build(),
            authStateCache
        );
    }
}
```

#### 3.4.2 Redis State 缓存实现

```java
public class RedisAuthStateCache implements AuthStateCache {

    private final StringRedisTemplate redisTemplate;
    private static final String KEY_PREFIX = "fastauth:state:";
    private static final long DEFAULT_TIMEOUT = 180; // 3分钟

    public RedisAuthStateCache(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void cache(String key, String value) {
        redisTemplate.opsForValue().set(
            KEY_PREFIX + key,
            value,
            DEFAULT_TIMEOUT,
            TimeUnit.SECONDS
        );
    }

    @Override
    public void cache(String key, String value, long timeout) {
        redisTemplate.opsForValue().set(
            KEY_PREFIX + key,
            value,
            timeout,
            TimeUnit.MILLISECONDS
        );
    }

    @Override
    public String get(String key) {
        return redisTemplate.opsForValue().get(KEY_PREFIX + key);
    }

    @Override
    public boolean containsKey(String key) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(KEY_PREFIX + key));
    }
}
```

#### 3.4.3 认证控制器

```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthRequest wechatMpAuthRequest;
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final MemberVerifyService memberVerifyService;
    private final RedisTemplate<String, String> redisTemplate;

    @Value("${app.auth.allowed-return-urls}")
    private List<String> allowedReturnUrls;

    private static final String RETURN_URL_PREFIX = "auth:return_url:";
    private static final long RETURN_URL_TIMEOUT = 5 * 60 * 1000; // 5分钟

    /**
     * 获取微信公众号授权地址
     */
    @GetMapping("/authorize")
    public Result<String> authorize(
            @RequestParam(required = false) String returnUrl) {

        String state = AuthStateUtils.createState();

        // 如果有 returnUrl，验证并存储到 Redis
        if (StringUtils.hasText(returnUrl)) {
            // 安全检查：验证 returnUrl 是否在白名单内
            if (!isAllowedReturnUrl(returnUrl)) {
                return Result.fail("非法的重定向地址");
            }

            // 生成短 ID，将 returnUrl 存储到 Redis（5分钟过期）
            String returnUrlId = UUID.randomUUID().toString();
            redisTemplate.opsForValue().set(
                RETURN_URL_PREFIX + returnUrlId,
                returnUrl,
                RETURN_URL_TIMEOUT,
                TimeUnit.MILLISECONDS
            );

            state = state + "|" + returnUrlId;
        }

        String authorizeUrl = wechatMpAuthRequest.authorize(state);
        return Result.success(authorizeUrl);
    }

    /**
     * 微信公众号 OAuth 回调处理
     */
    @GetMapping("/callback/wechat-mp")
    public void callback(AuthCallback callback, HttpServletResponse response) throws IOException {

        AuthResponse<AuthUser> authResponse = wechatMpAuthRequest.login(callback);

        if (!authResponse.ok()) {
            response.sendRedirect("/login?error=" + authResponse.getMsg());
            return;
        }

        AuthUser authUser = authResponse.getData();

        // 1. 查找或创建本地用户
        SystemUser user = userService.findOrCreateByOAuth(authUser, "wechat-mp");

        // 2. 生成 JWT Token
        String token = jwtTokenProvider.generateToken(user);

        // 3. 从 Redis 读取 returnUrl（读取后立即删除，确保一次性使用）
        String returnUrl = getAndDeleteReturnUrl(callback.getState());

        // 4. 二次验证 returnUrl（防御性编程）
        if (StringUtils.hasText(returnUrl) && !isAllowedReturnUrl(returnUrl)) {
            returnUrl = null; // 丢弃非法 URL
        }

        // 5. 重定向到前端，带上 token
        String redirectUrl = StringUtils.hasText(returnUrl)
            ? returnUrl + "?token=" + token
            : "/dashboard?token=" + token;

        response.sendRedirect(redirectUrl);
    }

    /**
     * 绑定知识星球账号
     */
    @PostMapping("/bindPlanet")
    @PreAuthorize("isAuthenticated()")
    public Result<Void> bindPlanetAccount(
            @RequestBody BindPlanetRequest request,
            @AuthenticationPrincipal SystemUser currentUser) {

        // 1. 验证会员身份
        MemberVerifyResult verifyResult = memberVerifyService.verify(
            request.getIdentifier(),
            request.getIdentifierType()
        );

        if (!verifyResult.isVerified()) {
            return Result.fail("未找到该知识星球会员");
        }

        // 2. 绑定到当前用户
        userService.bindPlanetMember(currentUser.getId(), verifyResult.getMember());

        return Result.success();
    }

    /**
     * 从 state 中提取 returnUrlId，并从 Redis 读取原始 URL（读取后立即删除）
     */
    private String getAndDeleteReturnUrl(String state) {
        if (state != null && state.contains("|")) {
            String[] parts = state.split("\\|", 2);
            String returnUrlId = parts[1];
            String key = RETURN_URL_PREFIX + returnUrlId;

            // 读取并删除（原子操作）
            String returnUrl = redisTemplate.opsForValue().get(key);
            if (returnUrl != null) {
                redisTemplate.delete(key);
            }
            return returnUrl;
        }
        return null;
    }

    /**
     * 验证 returnUrl 是否在白名单内
     */
    private boolean isAllowedReturnUrl(String returnUrl) {
        if (allowedReturnUrls == null || allowedReturnUrls.isEmpty()) {
            return false;
        }

        try {
            URI uri = new URI(returnUrl);
            String host = uri.getHost();

            // 检查域名是否在白名单内
            for (String allowedPattern : allowedReturnUrls) {
                if (allowedPattern.startsWith("*") && host.endsWith(allowedPattern.substring(1))) {
                    return true; // 支持通配符 *.example.com
                } else if (host.equals(allowedPattern)) {
                    return true;
                }
            }
        } catch (URISyntaxException e) {
            return false; // URL 格式非法
        }

        return false;
    }
}
```

**🔒 安全说明：防止开放重定向攻击**

上述实现采用了多层防护策略：

1. **白名单验证**：只允许配置的域名作为重定向目标，支持通配符匹配（如 `*.example.com`）
2. **Redis 存储**：将 returnUrl 存储在 Redis 而非直接编码到 URL 中，防止参数篡改
3. **一次性使用**：returnUrl 读取后立即删除，防止重放攻击
4. **有效期限制**：5 分钟自动过期，减小攻击窗口
5. **二次验证**：回调处理时再次验证 returnUrl 是否在白名单内（防御性编程）

**风险场景示例**（已修复）：
```
# 攻击者构造恶意链接
/api/auth/authorize?returnUrl=https://evil.com/steal

# 用户授权后，token 被泄露到恶意网站
https://evil.com/steal?token=eyJhbGc...
```

**修复后的流程**：
1. 前端请求 `/api/auth/authorize?returnUrl=https://app.example.com/dashboard`
2. 后端验证 `app.example.com` 在白名单内 → 通过
3. 生成 UUID（如 `abc123`），将 returnUrl 存入 Redis: `auth:return_url:abc123`
4. 返回授权 URL，state = `random_state|abc123`
5. 回调时从 Redis 读取并删除 returnUrl，二次验证后重定向

#### 3.4.4 用户服务

```java
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final SystemUserMapper userMapper;
    private final UserOAuthMapper oauthMapper;
    private final UserPlanetBindingMapper bindingMapper;

    @Override
    @Transactional
    public SystemUser findOrCreateByOAuth(AuthUser authUser, String platform) {
        // 1. 查找是否已有绑定
        UserOAuth oauth = oauthMapper.findByPlatformAndUuid(
            platform,
            authUser.getUuid()
        );

        if (oauth != null) {
            // 已绑定，更新信息并返回用户
            oauth.setNickname(authUser.getNickname());
            oauth.setAvatar(authUser.getAvatar());
            oauth.setAccessToken(authUser.getToken().getAccessToken());
            oauth.setUpdatedAt(LocalDateTime.now());
            oauthMapper.updateById(oauth);

            return userMapper.selectById(oauth.getUserId());
        }

        // 2. 创建新用户
        SystemUser user = new SystemUser();
        user.setNickname(authUser.getNickname());
        user.setAvatar(authUser.getAvatar());
        user.setStatus("active");
        user.setCreatedAt(LocalDateTime.now());
        userMapper.insert(user);

        // 3. 创建 OAuth 绑定
        UserOAuth newOAuth = new UserOAuth();
        newOAuth.setUserId(user.getId());
        newOAuth.setPlatform(platform);
        newOAuth.setUuid(authUser.getUuid());
        newOAuth.setOpenId(authUser.getToken().getOpenId());
        newOAuth.setUnionId(authUser.getToken().getUnionId());
        newOAuth.setNickname(authUser.getNickname());
        newOAuth.setAvatar(authUser.getAvatar());
        newOAuth.setAccessToken(authUser.getToken().getAccessToken());
        newOAuth.setCreatedAt(LocalDateTime.now());
        oauthMapper.insert(newOAuth);

        return user;
    }

    @Override
    @Transactional
    public void bindPlanetMember(Long userId, MemberVO member) {
        // 1. 检查当前用户是否已绑定
        UserPlanetBinding existingByUser = bindingMapper.findByUserId(userId);
        if (existingByUser != null) {
            throw new BusinessException("您已绑定星球账号，无法重复绑定");
        }

        // 2. 检查该星球账号是否已被其他用户绑定
        UserPlanetBinding existingByPlanet = bindingMapper.findByPlanetUserId(member.getPlanetUserId());
        if (existingByPlanet != null) {
            throw new BusinessException(
                "该星球账号已被其他用户绑定，一个星球账号只能绑定一个系统用户"
            );
        }

        // 3. 创建绑定关系
        UserPlanetBinding binding = new UserPlanetBinding();
        binding.setUserId(userId);
        binding.setPlanetUserId(member.getPlanetUserId());
        binding.setPlanetUserNumber(member.getUserNumber());
        binding.setPlanetNickname(member.getNickname());
        binding.setVerified(true);
        binding.setCreatedAt(LocalDateTime.now());

        try {
            bindingMapper.insert(binding);
        } catch (DuplicateKeyException e) {
            // 防御性编程：即使前面检查过，仍可能因并发导致冲突
            throw new BusinessException("绑定失败，该账号可能已被占用，请重试");
        }
    }
}
```

### 3.5 数据库表设计（用户相关）

```sql
-- 系统用户表
CREATE TABLE system_user (
    id              BIGSERIAL PRIMARY KEY,
    nickname        VARCHAR(100),
    avatar          VARCHAR(500),
    phone           VARCHAR(20),
    email           VARCHAR(100),
    status          VARCHAR(20) DEFAULT 'active',
    role            VARCHAR(20) DEFAULT 'user',      -- user/admin/super_admin
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- OAuth 绑定表（支持多平台扩展）
CREATE TABLE user_oauth (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES system_user(id),
    platform        VARCHAR(30) NOT NULL,            -- wechat-mp
    uuid            VARCHAR(100) NOT NULL,           -- 平台唯一标识
    open_id         VARCHAR(100),                    -- 微信 openId
    union_id        VARCHAR(100),                    -- 微信 unionId
    nickname        VARCHAR(100),
    avatar          VARCHAR(500),
    access_token    VARCHAR(500),
    refresh_token   VARCHAR(500),
    expires_at      TIMESTAMP,
    raw_data        JSONB,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(platform, uuid)
);

-- 用户-星球绑定表
CREATE TABLE user_planet_binding (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES system_user(id),
    planet_user_id      VARCHAR(32) NOT NULL,
    planet_user_number  INT,
    planet_nickname     VARCHAR(100),
    verified            BOOLEAN DEFAULT false,
    created_at          TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id),              -- 一个用户只能绑定一个星球账号
    UNIQUE(planet_user_id)        -- 一个星球账号只能被一个用户绑定
);

CREATE INDEX idx_oauth_user ON user_oauth(user_id);
CREATE INDEX idx_oauth_platform_uuid ON user_oauth(platform, uuid);
CREATE INDEX idx_binding_user ON user_planet_binding(user_id);
CREATE INDEX idx_binding_planet_user ON user_planet_binding(planet_user_id);
```

### 3.6 前端集成（Vue 3）

```javascript
// src/api/auth.js
import request from '@/utils/request'

export const authApi = {
  // 获取微信公众号授权地址
  getAuthorizeUrl(returnUrl) {
    return request.get('/api/auth/authorize', {
      params: { returnUrl }
    })
  },

  // 绑定知识星球
  bindPlanet(data) {
    return request.post('/api/auth/bindPlanet', data)
  },

  // 获取当前用户信息
  getCurrentUser() {
    return request.get('/api/auth/me')
  }
}
```

```vue
<!-- src/views/Login.vue -->
<template>
  <div class="login-page">
    <h1>登录</h1>
    <el-button @click="loginWithWechat" type="success" size="large">
      微信公众号登录
    </el-button>
  </div>
</template>

<script setup>
import { authApi } from '@/api/auth'

const loginWithWechat = async () => {
  const returnUrl = window.location.origin + '/auth/callback'
  const { data: authorizeUrl } = await authApi.getAuthorizeUrl(returnUrl)
  window.location.href = authorizeUrl
}
</script>
```

```vue
<!-- src/views/AuthCallback.vue -->
<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

onMounted(async () => {
  const token = route.query.token
  if (token) {
    userStore.setToken(token)
    await userStore.fetchCurrentUser()
    router.push('/dashboard')
  } else {
    router.push('/login?error=' + (route.query.error || '登录失败'))
  }
})
</script>
```

---

## 四、完整业务流程

### 4.1 用户登录 + 星球绑定流程

```
┌─────────────────────────────────────────────────────────────────────┐
│                         完整用户流程                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. 用户访问系统                                                     │
│         │                                                            │
│         ▼                                                            │
│  2. 点击"微信登录"                                                   │
│         │                                                            │
│         ▼                                                            │
│  3. 跳转微信授权页（FastAuth 生成 URL）                              │
│         │                                                            │
│         ▼                                                            │
│  4. 用户微信授权                                                     │
│         │                                                            │
│         ▼                                                            │
│  5. 回调处理，创建/更新用户，生成 JWT                                │
│         │                                                            │
│         ▼                                                            │
│  6. 返回前端，存储 Token                                             │
│         │                                                            │
│         ▼                                                            │
│  7. 用户进入"绑定知识星球"页面                                        │
│         │                                                            │
│         ▼                                                            │
│  8. 输入星球编号或昵称                                               │
│         │                                                            │
│         ▼                                                            │
│  9. 调用 MemberVerifyService 验证                                    │
│         │                                                            │
│         ▼                                                            │
│  10. 验证通过，绑定关系写入数据库                                    │
│         │                                                            │
│         ▼                                                            │
│  11. 用户可以使用训练营相关功能                                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 训练营退款流程（结合用户身份）

```
┌─────────────────────────────────────────────────────────────────────┐
│                      退款审核流程                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. 管理员登录系统（微信 OAuth）                                     │
│         │                                                            │
│         ▼                                                            │
│  2. 进入"训练营管理"                                                 │
│         │                                                            │
│         ▼                                                            │
│  3. 选择训练营，点击"计算退款"                                       │
│         │                                                            │
│         ├──→ 4a. 从本地 planet_user 表获取会员信息                   │
│         │         │                                                  │
│         │         ▼                                                  │
│         │    4b. 匹配会员 → 支付记录 → 打卡记录                      │
│         │         │                                                  │
│         │         ▼                                                  │
│         │    4c. 计算每人应退金额                                    │
│         │                                                            │
│         ▼                                                            │
│  5. 显示退款名单，管理员审核                                         │
│         │                                                            │
│         ▼                                                            │
│  6. 确认后，调用企业微信退款 API                                     │
│         │                                                            │
│         ▼                                                            │
│  7. 退款成功，通知会员                                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 五、部署架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                          生产环境部署                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Nginx (SSL + 反向代理)                                             │
│       │                                                              │
│       ├──→ /api/*  ──→  后端服务 (Spring Boot :8080)                │
│       │                      │                                       │
│       │                      ├──→ PostgreSQL                         │
│       │                      ├──→ Redis                              │
│       │                      └──→ RabbitMQ                           │
│       │                                                              │
│       └──→ /*  ──→  前端静态文件 (Vue 3 build)                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 六、实施步骤

### 第一阶段：会员模块集成
- 扩展 `planet_user` 表，增加会员相关字段
- 创建 `sync_log` 同步日志表
- 扩展 `PlanetApiManager`，增加获取会员列表方法
- 实现 `MemberSyncService` 和 `MemberVerifyService`
- 创建会员同步定时任务
- 实现会员验证 API

### 第二阶段：FastAuth 集成
- 在主项目中添加 FastAuth 依赖
- 实现 OAuth 登录流程
- 配置微信公众号应用

### 第三阶段：用户体系整合
- 实现用户-星球绑定功能
- 完善权限控制
- 前端登录页面开发

### 第四阶段：业务流程对接
- 退款流程与用户身份关联
- 管理后台权限控制
- 完整测试
