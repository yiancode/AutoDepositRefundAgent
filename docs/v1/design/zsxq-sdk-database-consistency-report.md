# zsxq-sdk 与数据库设计一致性分析报告

**分析日期**: 2025-12-12
**分析范围**: zsxq-sdk Java 模型 vs 数据库设计
**参考文档**:
- `/Users/stinglong/code/github/zsxq-sdk/packages/java/src/main/java/com/zsxq/sdk/model/` (Java SDK)
- `/Users/stinglong/code/github/zsxq-sdk/docs/archive/v0.1/Fiddler原始API文档.md`
- `docs/v1/design/数据库设计.md`

---

## 一、总体评估

### 1.1 设计合理性评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 业务完整性 | ★★★★☆ | 核心业务流程覆盖完整 |
| 字段映射准确性 | ★★★☆☆ | 存在部分字段缺失和命名不一致 |
| 可扩展性 | ★★★★☆ | 预留了扩展字段，结构灵活 |
| API兼容性 | ★★★☆☆ | 需要补充部分API返回字段 |

### 1.2 核心问题汇总

| 问题类型 | 数量 | 严重程度 |
|----------|------|----------|
| 关键字段缺失 | 5 | **高** |
| 字段命名不一致 | 3 | 中 |
| 类型不匹配 | 2 | 中 |
| 冗余设计 | 1 | 低 |

---

## 二、详细字段对照分析

### 2.1 planet_user 表 vs zsxq-sdk User 模型

#### zsxq-sdk User.java 模型定义
```java
@Data
public class User {
    @SerializedName(value = "user_id", alternate = {"uid"})
    private String userId;      // API主键标识（兼容 uid 和 user_id）
    private String name;        // 用户名
    private String avatarUrl;   // 头像URL
    private String location;    // 位置
    private String introduction;// 简介
    private String uniqueId;    // 唯一ID
    private String userSid;     // 用户SID
    private String grade;       // 等级
    private Boolean verified;   // 是否认证
}
```

#### API 实际返回示例（Fiddler抓包）
```json
{
  "user_id": 51118424254414,
  "name": "用户名",
  "avatar_url": "https://images.zsxq.com/...",
  "location": "深圳",
  "introduction": "个人简介"
}
```

#### 数据库 planet_user 表现有字段
```sql
member_number VARCHAR(20)    -- 成员编号
user_nickname VARCHAR(100)   -- 用户昵称
wechat_nickname VARCHAR(100) -- 微信昵称
profile_nickname VARCHAR(100)-- 星球名片昵称
```

#### **问题识别**

| 问题 | 严重程度 | 说明 |
|------|----------|------|
| ❌ 缺少 `user_id` 字段 | **高** | API返回的主键标识，用于关联打卡/话题等数据 |
| ❌ 缺少 `uid` 字段 | **高** | 字符串形式的用户唯一标识 |
| ❌ 缺少 `avatar_url` 字段 | 中 | 用户头像，展示需要 |
| ❌ 缺少 `location` 字段 | 低 | 用户位置信息 |
| ❌ 缺少 `introduction` 字段 | 低 | 用户简介 |
| ⚠️ `member_number` vs API无此字段 | 中 | Excel导入特有字段，API不返回 |

#### **改进建议**
```sql
-- 新增字段
planet_user_id VARCHAR(50),      -- API返回的 user_id（字符串存储，兼容大数字）
planet_uid VARCHAR(50),          -- API返回的 uid
avatar_url VARCHAR(500),         -- 用户头像URL
location VARCHAR(100),           -- 用户位置
introduction TEXT,               -- 用户简介
```

---

### 2.2 training_camp 表 vs zsxq-sdk Checkin 模型

#### zsxq-sdk Checkin.java 模型定义
```java
@Data
public class Checkin {
    private Long checkinId;     // 打卡项目ID（API主键）
    private Group group;        // 所属星球
    private User owner;         // 创建者
    private String name;        // 项目名称
    private String description; // 项目描述
    private String coverUrl;    // 封面URL
    private String status;      // 状态: "ongoing" | "closed" | "over"
    private String createTime;  // 创建时间
    private String beginTime;   // 开始时间
    private String endTime;     // 结束时间
}
```

#### 数据库 training_camp 表现有字段
```sql
planet_project_id VARCHAR(50)  -- 知识星球项目ID
name VARCHAR(100)              -- 训练营名称
description TEXT               -- 项目介绍
poster_url VARCHAR(500)        -- 项目海报URL
start_date DATE                -- 开始日期
end_date DATE                  -- 结束日期
status VARCHAR(20)             -- 状态（自定义枚举）
```

#### **问题识别**

| 问题 | 严重程度 | 说明 |
|------|----------|------|
| ⚠️ `planet_project_id` 应改名为 `planet_checkin_id` | 中 | 与API字段名保持一致 |
| ❌ 缺少 `cover_url` 字段 | 低 | API返回打卡项目封面 |
| ⚠️ 状态枚举不一致 | 中 | API: ongoing/closed/over vs DB: draft/pending/enrolling... |
| ⚠️ 时间类型不一致 | 低 | API: ISO8601时间戳 vs DB: DATE类型 |

#### **改进建议**
```sql
-- 字段调整
planet_checkin_id VARCHAR(50),  -- 改名，与API保持一致
cover_url VARCHAR(500),         -- 新增封面URL
planet_status VARCHAR(20),      -- 新增：存储API原始状态
```

---

### 2.3 checkin_record 表 vs API 打卡话题返回

#### API 打卡话题返回示例
```json
{
  "topic_id": 82811825281411142,
  "topic_uid": "82811825281411142",
  "type": "talk",
  "talk": {
    "owner": {
      "user_id": 51118424254414,
      "name": "作者名称"
    },
    "text": "打卡内容..."
  },
  "create_time": "2025-12-08T10:30:00.000+0800"
}
```

#### 数据库 checkin_record 表现有字段
```sql
planet_checkin_id VARCHAR(50)     -- 知识星球打卡ID
planet_member_number VARCHAR(20)  -- 星球成员编号
checkin_date DATE                 -- 打卡日期
checkin_time TIMESTAMP            -- 打卡时间
checkin_content TEXT              -- 打卡内容
```

#### **问题识别**

| 问题 | 严重程度 | 说明 |
|------|----------|------|
| ⚠️ `planet_checkin_id` 应存储 `topic_id` | 中 | 打卡记录对应的是话题ID |
| ❌ 缺少 `topic_uid` 字段 | 低 | API返回的话题UID |
| ⚠️ 需要 `planet_user_id` 关联 | **高** | 打卡按user_id关联，而非member_number |

#### **改进建议**
```sql
-- 字段调整
planet_topic_id VARCHAR(50),      -- 改名：存储话题ID
planet_topic_uid VARCHAR(50),     -- 新增：话题UID
planet_user_id VARCHAR(50),       -- 新增：打卡用户的API user_id
```

---

### 2.4 RankingItem 模型（打卡排行榜）

#### zsxq-sdk RankingItem.java 模型
```java
@Data
public class RankingItem {
    private User user;              // 用户信息
    private Integer rank;           // 排名
    private Integer count;          // 打卡次数
    private Integer continuousCount;// 连续打卡天数
}
```

#### zsxq-sdk MyCheckinStatistics.java 模型
```java
@Data
public class MyCheckinStatistics {
    private Integer totalCheckinCount;  // 总打卡次数
    private Integer continuousDays;     // 当前连续天数
    private Integer maxContinuousDays;  // 最长连续天数
    private String lastCheckinTime;     // 最后打卡时间
}
```

#### **当前设计缺失**

数据库未设计打卡排行榜相关表，但 `camp_member` 表的 `checkin_count` 字段可满足基本需求。

#### **改进建议**

如需支持连续打卡统计，建议在 `camp_member` 表新增：
```sql
continuous_checkin_count INTEGER DEFAULT 0,  -- 连续打卡天数
max_continuous_count INTEGER DEFAULT 0,      -- 最长连续打卡天数
```

---

## 三、字段映射对照表

### 3.1 User 字段映射

| zsxq-sdk User.java | API返回 | planet_user 表 | 状态 | 建议 |
|-------------------|---------|----------------|------|------|
| `userId` | ✅ | `planet_user_id` | ✅ 已补充 | - |
| (alternate uid) | ✅ | `planet_uid` | ✅ 已补充 | - |
| `name` | ✅ | `user_nickname` | ⚠️ 命名不同 | 保持，理解为同义 |
| `avatarUrl` | ✅ | `avatar_url` | ✅ 已补充 | - |
| `location` | ✅ | `location` | ✅ 已补充 | - |
| `introduction` | ✅ | `introduction` | ✅ 已补充 | - |
| - | - | `member_number` | Excel特有 | 保留 |
| - | - | `wechat_nickname` | Excel特有 | 保留 |

### 3.2 Checkin 字段映射

| zsxq-sdk Checkin.java | API返回 | training_camp 表 | 状态 | 建议 |
|----------------------|---------|------------------|------|------|
| `checkinId` | ✅ | `planet_checkin_id` | ✅ 已补充 | - |
| `name` | ✅ | `name` | ✅ | - |
| `description` | ✅ | `description` | ✅ | - |
| `coverUrl` | ✅ | `cover_url` | ✅ 已补充 | - |
| `beginTime` | ✅ | `start_date` | ⚠️ 类型不同 | 保持DATE |
| `endTime` | ✅ | `end_date` | ⚠️ 类型不同 | 保持DATE |
| `status` | ✅ | `planet_status` | ✅ 已补充 | - |

### 3.3 CheckinRecord 字段映射

| zsxq-sdk CheckinRecord.java | API返回 | checkin_record 表 | 状态 |
|----------------------------|---------|-------------------|------|
| `topicId` | ✅ | `planet_topic_id` | ✅ 已补充 |
| `topicUid` | ✅ | `planet_topic_uid` | ✅ 已补充 |
| `owner.userId` | ✅ | `planet_user_id` | ✅ 已补充 |
| `text` | ✅ | `checkin_content` | ✅ |
| `createTime` | ✅ | `checkin_time` | ✅ |

### 3.4 RankingItem / MyCheckinStatistics 字段映射

| zsxq-sdk 模型 | 字段 | camp_member 表 | 状态 |
|--------------|------|----------------|------|
| RankingItem | `count` | `checkin_count` | ✅ |
| RankingItem | `continuousCount` | `continuous_checkin_count` | ✅ 已补充 |
| MyCheckinStatistics | `totalCheckinCount` | `checkin_count` | ✅ |
| MyCheckinStatistics | `continuousDays` | `continuous_checkin_count` | ✅ 已补充 |
| MyCheckinStatistics | `maxContinuousDays` | `max_continuous_count` | ✅ 已补充 |
| MyCheckinStatistics | `lastCheckinTime` | `last_checkin_time` | ✅ |

---

## 四、状态枚举对照

### 4.1 打卡项目状态

| zsxq-sdk / API | 含义 | training_camp.status | 建议映射 |
|----------------|------|---------------------|----------|
| `ongoing` | 进行中 | `ongoing` | ✅ 一致 |
| `closed` | 已关闭 | `archived` | 映射 |
| `over` | 已结束 | `ended` | 映射 |
| - | - | `draft` | 系统内部状态 |
| - | - | `pending` | 系统内部状态 |
| - | - | `enrolling` | 系统内部状态 |
| - | - | `settling` | 系统内部状态 |

**建议**: 新增 `planet_status` 字段存储API原始状态，保持系统状态独立管理。

---

## 五、改进优先级

### 5.1 高优先级（必须修复）

1. **planet_user 表新增 `planet_user_id` 字段**
   - 原因：API通过 user_id 关联用户数据，打卡同步依赖此字段
   - 影响：无法正确匹配打卡记录与会员

2. **checkin_record 表新增 `planet_user_id` 字段**
   - 原因：打卡API返回的是 user_id，而非 member_number
   - 影响：打卡数据无法正确关联

### 5.2 中优先级（建议修复）

3. **planet_user 表新增 `avatar_url` 字段**
   - 原因：前端展示需要用户头像

4. **training_camp 表 `planet_project_id` 改名为 `planet_checkin_id`**
   - 原因：与API字段名保持一致，降低理解成本

5. **新增 `planet_status` 字段**
   - 原因：区分API状态与系统状态

### 5.3 低优先级（可选）

6. **planet_user 表新增 `location`, `introduction` 字段**
7. **training_camp 表新增 `cover_url` 字段**
8. **camp_member 表新增 `continuous_checkin_count` 字段**

---

## 六、数据库脚本更新建议

详见 `scripts/init-database.sql` 中的改动，主要包括：

1. `planet_user` 表新增5个字段
2. `training_camp` 表新增2个字段
3. `checkin_record` 表新增2个字段
4. `camp_member` 表新增2个字段
5. 相应索引更新

---

## 七、迁移策略

对于已有数据的生产环境，建议：

```sql
-- 1. 新增字段（允许NULL）
ALTER TABLE planet_user
ADD COLUMN planet_user_id VARCHAR(50),
ADD COLUMN planet_uid VARCHAR(50),
ADD COLUMN avatar_url VARCHAR(500);

-- 2. 创建索引
CREATE INDEX idx_pu_planet_user_id ON planet_user(planet_user_id) WHERE deleted_at IS NULL;

-- 3. 数据迁移（如有API调用能力，可批量更新）
-- UPDATE planet_user SET planet_user_id = ... WHERE ...

-- 4. 可选：添加NOT NULL约束（确保数据完整后）
-- ALTER TABLE planet_user ALTER COLUMN planet_user_id SET NOT NULL;
```

---

## 八、结论

当前数据库设计**已完成对齐**，与 zsxq-sdk Java 模型字段一致：

### 已完成的改进

1. **用户标识体系完善**：新增 `planet_user_id`/`planet_uid` 字段，支持 API 数据关联
2. **打卡项目对齐**：新增 `planet_checkin_id`, `planet_status`, `cover_url` 字段
3. **打卡记录对齐**：新增 `planet_topic_id`, `planet_topic_uid`, `planet_user_id` 字段
4. **连续打卡统计**：新增 `continuous_checkin_count`, `max_continuous_count` 字段

### 数据库脚本版本

- **当前版本**: v1.2
- **更新日期**: 2025-12-12
- **对齐参考**: zsxq-sdk Java 模型 (`com.zsxq.sdk.model.*`)

### 验证清单

| 表 | Java 模型 | 状态 |
|----|----------|------|
| `planet_user` | `User.java` | ✅ 已对齐 |
| `training_camp` | `Checkin.java` | ✅ 已对齐 |
| `checkin_record` | `CheckinRecord.java`, `Topic.java` | ✅ 已对齐 |
| `camp_member` | `RankingItem.java`, `MyCheckinStatistics.java` | ✅ 已对齐 |
