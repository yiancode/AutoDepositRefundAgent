# 缓存策略与性能优化

> **文档目的**：定义系统缓存策略，解决接口/数据库耦合与性能风险
> **对应决策**：[优化完成总结](../archive/优化完成总结.md) P1-2（接口/数据库耦合与性能风险）

---

## 🎯 优化目标

| 指标 | 现状（预估） | 目标 | 优化手段 |
|------|-------------|------|---------|
| 会员列表查询响应时间 | 500-1000ms | <200ms | Redis缓存 + 数据冗余 |
| 训练营详情查询 | 100-200ms | <50ms | Redis缓存 |
| 数据库连接数 | 50-100 | <30 | 连接池优化 + 缓存减少查询 |
| 缓存命中率 | N/A | >90% | 合理设计缓存key |

---

## 📋 缓存分层策略

```
L1: 应用内存缓存（Caffeine）
    ↓ 未命中
L2: Redis分布式缓存
    ↓ 未命中
L3: 数据库查询
```

---

## 🔑 Redis缓存设计

### 1. 训练营信息缓存

**场景**：H5端训练营列表/详情高频查询

**缓存Key设计**：
```
# 单个训练营详情
camp:detail:{campId}
TTL: 1小时
示例: camp:detail:1

# 训练营列表（报名中）
camp:list:enrolling
TTL: 5分钟
内容: JSON数组
```

**实现**：
```java
@Service
public class CampCacheService {

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Autowired
    private CampMapper campMapper;

    /**
     * 获取训练营详情（优先从缓存读取）
     */
    public Camp getCampDetail(Long campId) {
        String key = "camp:detail:" + campId;

        // 1. 尝试从Redis读取
        String cached = redisTemplate.opsForValue().get(key);
        if (cached != null) {
            return JSON.parseObject(cached, Camp.class);
        }

        // 2. 缓存未命中，查询数据库
        Camp camp = campMapper.selectById(campId);
        if (camp == null) {
            throw new CampNotFoundException();
        }

        // 3. 写入缓存（1小时）
        redisTemplate.opsForValue().set(
            key,
            JSON.toJSONString(camp),
            1,
            TimeUnit.HOURS
        );

        return camp;
    }

    /**
     * 更新训练营时删除缓存（Cache Aside模式）
     */
    public void updateCamp(Camp camp) {
        campMapper.updateById(camp);

        // 删除相关缓存
        String detailKey = "camp:detail:" + camp.getId();
        redisTemplate.delete(detailKey);
        redisTemplate.delete("camp:list:enrolling");
    }
}
```

---

### 2. 会员列表缓存

**问题**：会员列表需要JOIN多张表，性能差

**方案A：Redis缓存（推荐）**

**缓存Key设计**：
```
camp:members:{campId}
TTL: 5分钟
内容: JSON数组（包含完整会员信息）
```

**实现**：
```java
@Service
public class MemberCacheService {

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Autowired
    private MemberService memberService;

    /**
     * 获取训练营会员列表（带缓存）
     */
    public List<MemberDTO> getCampMembers(Long campId) {
        String key = "camp:members:" + campId;

        // 1. 尝试从Redis读取
        String cached = redisTemplate.opsForValue().get(key);
        if (cached != null) {
            return JSON.parseArray(cached, MemberDTO.class);
        }

        // 2. 缓存未命中，查询数据库（JOIN查询）
        List<MemberDTO> members = memberService.listMembersWithDetails(campId);

        // 3. 写入缓存（5分钟）
        redisTemplate.opsForValue().set(
            key,
            JSON.toJSONString(members),
            5,
            TimeUnit.MINUTES
        );

        return members;
    }

    /**
     * 会员信息变更时删除缓存
     */
    public void invalidateMemberCache(Long campId) {
        String key = "camp:members:" + campId;
        redisTemplate.delete(key);
    }
}
```

**方案B：数据冗余（长期优化）**

**数据库设计**：
```sql
-- camp_member表增加冗余字段
ALTER TABLE camp_member ADD COLUMN planet_user_name VARCHAR(50);
ALTER TABLE camp_member ADD COLUMN planet_user_number VARCHAR(50);
ALTER TABLE camp_member ADD COLUMN order_no VARCHAR(64);
ALTER TABLE camp_member ADD COLUMN wechat_nickname VARCHAR(100);

-- 创建复合索引
CREATE INDEX idx_camp_member_query ON camp_member(camp_id, bind_status);
```

**查询优化**：
```sql
-- 优化前（JOIN 3张表）
SELECT
    cm.id,
    cm.camp_id,
    cm.filled_user_number,
    pu.planet_user_id,      -- ❌ 需JOIN
    pu.name,                -- ❌ 需JOIN
    pr.order_no,            -- ❌ 需JOIN
    pr.amount,              -- ❌ 需JOIN
    pr.bind_status          -- ❌ 需JOIN
FROM camp_member cm
LEFT JOIN planet_user pu ON cm.planet_user_id = pu.id
LEFT JOIN payment_record pr ON cm.payment_record_id = pr.id
WHERE cm.camp_id = ?;

-- 优化后（单表查询）
SELECT
    id,
    camp_id,
    planet_user_name,       -- ✅ 冗余字段
    planet_user_number,     -- ✅ 冗余字段
    order_no,               -- ✅ 冗余字段
    wechat_nickname,        -- ✅ 冗余字段
    bind_status
FROM camp_member
WHERE camp_id = ?
  AND bind_status IN ('completed', 'pending');
```

**数据同步**：
```java
// 绑定完成时同步更新冗余字段
@Transactional
public void completeBind(Long paymentRecordId, PlanetUser planetUser) {
    // 1. 更新payment_record
    paymentRecord.setBindStatus(BindStatus.COMPLETED);
    paymentRecordMapper.updateById(paymentRecord);

    // 2. 更新camp_member冗余字段
    CampMember member = campMemberMapper.selectByPaymentRecordId(paymentRecordId);
    member.setPlanetUserName(planetUser.getName());
    member.setPlanetUserNumber(planetUser.getUserNumber());
    member.setOrderNo(paymentRecord.getOrderNo());
    campMemberMapper.updateById(member);

    // 3. 删除缓存
    memberCacheService.invalidateMemberCache(member.getCampId());
}
```

---

### 3. accessToken缓存

**已有设计**（保持不变）：

```
key: access_token:{token}
value: {orderNo, campId, wechatUserId, status, expireAt}
TTL: 训练营结束 + 7天
```

---

## 🚀 数据库性能优化

### 1. 索引优化

```sql
-- payment_record表
CREATE INDEX idx_payment_status_time ON payment_record(pay_status, created_at DESC);
CREATE INDEX idx_payment_bind_status ON payment_record(bind_status, bind_deadline);

-- camp_member表
CREATE INDEX idx_member_camp_status ON camp_member(camp_id, bind_status);
CREATE INDEX idx_member_planet_user ON camp_member(planet_user_id);

-- checkin_record表
CREATE INDEX idx_checkin_camp_date ON checkin_record(camp_id, checkin_date DESC);

-- refund_record表
CREATE INDEX idx_refund_approval_status ON refund_record(approval_status, created_at DESC)
WHERE approval_status = 'PENDING';  -- 部分索引
```

### 2. 分页查询优化

**问题**：大offset分页查询慢

```sql
-- ❌ 慢查询（offset过大时）
SELECT * FROM camp_member
WHERE camp_id = 1
ORDER BY created_at DESC
LIMIT 20 OFFSET 1000;
```

**优化方案**：使用游标分页

```sql
-- ✅ 基于ID游标分页
SELECT * FROM camp_member
WHERE camp_id = 1
  AND id < ?  -- 上一页最后一条记录的ID
ORDER BY id DESC
LIMIT 20;
```

**Java实现**：
```java
@GetMapping("/api/admin/camps/{id}/members")
public Result<PageResult<MemberDTO>> listMembers(
        @PathVariable Long id,
        @RequestParam(required = false) Long lastId,  // 游标
        @RequestParam(defaultValue = "20") Integer pageSize) {

    List<MemberDTO> members = memberService.listMembersCursor(id, lastId, pageSize);

    return Result.success(PageResult.of(members));
}
```

---

## 📊 缓存监控指标

### 关键指标

```java
@Component
public class CacheMetrics {

    private final Counter cacheHitCounter;
    private final Counter cacheMissCounter;

    public CacheMetrics(MeterRegistry registry) {
        this.cacheHitCounter = Counter.builder("cache.hit")
            .tag("cache", "redis")
            .description("缓存命中次数")
            .register(registry);

        this.cacheMissCounter = Counter.builder("cache.miss")
            .tag("cache", "redis")
            .description("缓存未命中次数")
            .register(registry);
    }

    public void recordHit() {
        cacheHitCounter.increment();
    }

    public void recordMiss() {
        cacheMissCounter.increment();
    }

    // 计算命中率
    public double getHitRate() {
        double hits = cacheHitCounter.count();
        double misses = cacheMissCounter.count();
        return hits / (hits + misses);
    }
}
```

**目标**：
- 缓存命中率 > 90%
- 缓存响应时间 < 10ms
- 缓存Key驱逐率 < 10/秒

---

## ⚠️ 缓存一致性策略

### 1. Cache Aside（推荐）

**读流程**：
```
1. 查询缓存
2. 缓存命中 → 返回
3. 缓存未命中 → 查询数据库 → 写入缓存 → 返回
```

**写流程**：
```
1. 更新数据库
2. 删除缓存（让下次读取时重建）
```

**优点**：
- 实现简单
- 数据最终一致性
- 适合读多写少场景

**缺点**：
- 短暂的缓存不一致窗口（秒级）

---

### 2. Cache Through（可选）

**适用场景**：写入频繁且需要强一致性

**实现**：
```java
@Transactional
public void updateCamp(Camp camp) {
    // 1. 更新数据库
    campMapper.updateById(camp);

    // 2. 同步更新缓存
    String key = "camp:detail:" + camp.getId();
    redisTemplate.opsForValue().set(
        key,
        JSON.toJSONString(camp),
        1,
        TimeUnit.HOURS
    );
}
```

---

## ✅ 实施清单

### Stage 1: 基础缓存（必须）

- [ ] 实现训练营详情/列表缓存
- [ ] 实现Cache Aside模式
- [ ] 实现缓存指标监控
- [ ] 配置Redis连接池

### Stage 2: 会员列表优化（推荐）

- [ ] 实现会员列表Redis缓存
- [ ] 评估数据冗余方案
- [ ] 数据库索引优化
- [ ] 分页查询优化

### Stage 3: 高级优化（可选）

- [ ] 实现应用内存缓存（Caffeine）
- [ ] 实现缓存预热
- [ ] 实现缓存穿透/击穿/雪崩防护
- [ ] 缓存数据压缩

---

## 📚 相关文档

- [数据库设计](./数据库设计.md)
- [监控指标体系](./监控指标体系.md)

---

**文档版本**：v1.0
**最后更新**：2025-12-04
**维护者**：技术架构组 + DBA团队
