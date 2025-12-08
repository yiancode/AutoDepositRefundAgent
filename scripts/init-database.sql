-- ============================================================
-- 知识星球训练营自动押金退款系统 - 数据库初始化脚本
-- ============================================================
-- 版本: v1.1
-- 数据库: PostgreSQL 15+
-- 字符集: UTF-8
-- 生成日期: 2025-12-08
-- 来源文档: docs/v1/design/数据库设计.md
-- SSOT引用: docs/v1/design/状态枚举定义.md
-- ============================================================

-- 使用前请先创建数据库:
-- CREATE DATABASE camp_db WITH ENCODING 'UTF8';
-- \c camp_db

-- ============================================================
-- 一、通用触发器函数
-- ============================================================

-- 自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS '通用触发器函数：自动更新 updated_at 字段';

-- ============================================================
-- 二、核心业务表
-- ============================================================

-- ------------------------------------------------------------
-- 2.1 系统用户表（system_user）
-- ------------------------------------------------------------
CREATE TABLE system_user (
    id BIGSERIAL PRIMARY KEY,

    -- 登录信息
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,

    -- 基本信息
    real_name VARCHAR(50),

    -- 角色
    role VARCHAR(20) NOT NULL,

    -- 状态
    status VARCHAR(20) NOT NULL DEFAULT 'active',

    -- 登录信息
    last_login_ip VARCHAR(50),
    last_login_time TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    -- 状态值约束
    CONSTRAINT chk_su_role CHECK (role IN ('admin', 'manager', 'coach', 'volunteer')),
    CONSTRAINT chk_su_status CHECK (status IN ('active', 'disabled'))
);

CREATE INDEX idx_su_username ON system_user(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_su_role ON system_user(role) WHERE deleted_at IS NULL;

COMMENT ON TABLE system_user IS '系统用户表';
COMMENT ON COLUMN system_user.username IS '用户名（登录账号）';
COMMENT ON COLUMN system_user.password IS '密码（BCrypt加密）';
COMMENT ON COLUMN system_user.real_name IS '真实姓名';
COMMENT ON COLUMN system_user.role IS '角色: admin-超级管理员, manager-管理员, coach-教练, volunteer-志愿者';
COMMENT ON COLUMN system_user.status IS '状态: active-启用, disabled-禁用';
COMMENT ON COLUMN system_user.last_login_ip IS '最后登录IP';
COMMENT ON COLUMN system_user.last_login_time IS '最后登录时间';

CREATE TRIGGER trg_system_user_updated_at
    BEFORE UPDATE ON system_user
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- 2.2 训练营表（training_camp）
-- ------------------------------------------------------------
CREATE TABLE training_camp (
    id BIGSERIAL PRIMARY KEY,

    -- 基本信息
    name VARCHAR(100) NOT NULL,
    poster_url VARCHAR(500) NOT NULL,
    description TEXT,

    -- 金额信息
    deposit DECIMAL(10,2) NOT NULL,

    -- 时间信息
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    -- 打卡要求
    total_days INTEGER NOT NULL,
    required_days INTEGER NOT NULL,

    -- 群信息
    group_qrcode_url VARCHAR(500) NOT NULL,

    -- 关联信息
    planet_project_id VARCHAR(50) NOT NULL,

    -- 状态（引用 SSOT: 状态枚举定义.md#5-camp_status）
    status VARCHAR(20) NOT NULL DEFAULT 'draft',

    -- H5链接
    enroll_url VARCHAR(500),

    -- 统计字段（冗余，提升查询性能）
    member_count INTEGER DEFAULT 0,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    refunded_amount DECIMAL(10,2) DEFAULT 0,

    -- 通用字段
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    -- 业务约束
    CONSTRAINT chk_camp_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_camp_days CHECK (required_days <= total_days AND required_days > 0),

    -- 状态值约束（引用 SSOT: 状态枚举定义.md#5-camp_status）
    CONSTRAINT chk_camp_status CHECK (status IN ('draft', 'pending', 'enrolling', 'ongoing', 'ended', 'settling', 'archived'))
);

CREATE INDEX idx_camp_status ON training_camp(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_camp_dates ON training_camp(start_date, end_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_camp_planet_id ON training_camp(planet_project_id);
CREATE INDEX idx_camp_status_dates ON training_camp(status, start_date, end_date) WHERE deleted_at IS NULL;

COMMENT ON TABLE training_camp IS '训练营表';
COMMENT ON COLUMN training_camp.name IS '训练营名称';
COMMENT ON COLUMN training_camp.poster_url IS '项目海报URL';
COMMENT ON COLUMN training_camp.description IS '项目介绍';
COMMENT ON COLUMN training_camp.deposit IS '押金金额';
COMMENT ON COLUMN training_camp.start_date IS '开始日期';
COMMENT ON COLUMN training_camp.end_date IS '结束日期';
COMMENT ON COLUMN training_camp.total_days IS '总天数';
COMMENT ON COLUMN training_camp.required_days IS '要求打卡天数';
COMMENT ON COLUMN training_camp.group_qrcode_url IS '群二维码URL';
COMMENT ON COLUMN training_camp.planet_project_id IS '知识星球项目ID';
COMMENT ON COLUMN training_camp.status IS '状态（SSOT）: draft-草稿, pending-待发布, enrolling-报名中, ongoing-进行中, ended-已结束, settling-结算中, archived-已归档';
COMMENT ON COLUMN training_camp.enroll_url IS 'H5报名链接';
COMMENT ON COLUMN training_camp.member_count IS '报名人数';
COMMENT ON COLUMN training_camp.paid_amount IS '已收押金总额';
COMMENT ON COLUMN training_camp.refunded_amount IS '已退押金总额';
COMMENT ON COLUMN training_camp.deleted_at IS '软删除时间';

CREATE TRIGGER trg_training_camp_updated_at
    BEFORE UPDATE ON training_camp
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- 2.3 训练营人员关系表（camp_member_relation）
-- ------------------------------------------------------------
CREATE TABLE camp_member_relation (
    id BIGSERIAL PRIMARY KEY,

    camp_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role_type VARCHAR(20) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cmr_camp FOREIGN KEY (camp_id) REFERENCES training_camp(id),
    CONSTRAINT fk_cmr_user FOREIGN KEY (user_id) REFERENCES system_user(id),
    UNIQUE(camp_id, user_id, role_type)
);

CREATE INDEX idx_cmr_camp ON camp_member_relation(camp_id);
CREATE INDEX idx_cmr_user ON camp_member_relation(user_id);

COMMENT ON TABLE camp_member_relation IS '训练营人员关系表';
COMMENT ON COLUMN camp_member_relation.camp_id IS '训练营ID';
COMMENT ON COLUMN camp_member_relation.user_id IS '用户ID（教练或志愿者）';
COMMENT ON COLUMN camp_member_relation.role_type IS '角色类型: coach-教练, volunteer-志愿者';

-- ------------------------------------------------------------
-- 2.4 知识星球用户表（planet_user）- Excel离线导入
-- ------------------------------------------------------------
CREATE TABLE planet_user (
    id BIGSERIAL PRIMARY KEY,

    -- 基础信息（Excel 导入核心字段）
    member_number VARCHAR(20) NOT NULL,
    user_nickname VARCHAR(100),
    wechat_nickname VARCHAR(100),
    profile_nickname VARCHAR(100),
    remark_nickname VARCHAR(100),
    knowledge_id VARCHAR(50),

    -- 身份与状态
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    is_paid_join BOOLEAN DEFAULT FALSE,
    is_blocked BOOLEAN DEFAULT FALSE,
    is_exited BOOLEAN DEFAULT FALSE,
    is_followed_official BOOLEAN DEFAULT FALSE,
    is_notification_enabled BOOLEAN DEFAULT FALSE,

    -- 时间信息
    first_join_time TIMESTAMP,
    first_source VARCHAR(100),
    expire_time TIMESTAMP,
    days_to_renewal INTEGER,
    renewal_count INTEGER DEFAULT 0,
    last_active_time TIMESTAMP,

    -- 付费统计
    total_paid_amount DECIMAL(12,2) DEFAULT 0,

    -- 互动统计
    followers_count INTEGER DEFAULT 0,
    topics_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    questions_count INTEGER DEFAULT 0,
    questions_amount DECIMAL(10,2) DEFAULT 0,
    answers_count INTEGER DEFAULT 0,
    answers_income DECIMAL(10,2) DEFAULT 0,
    likes_given_count INTEGER DEFAULT 0,
    likes_received_count INTEGER DEFAULT 0,
    tips_given_amount DECIMAL(10,2) DEFAULT 0,
    tips_received_amount DECIMAL(10,2) DEFAULT 0,

    -- 分享统计
    share_users_count INTEGER DEFAULT 0,
    share_amount DECIMAL(10,2) DEFAULT 0,
    reward_share_users_count INTEGER DEFAULT 0,
    reward_share_orders_count INTEGER DEFAULT 0,
    reward_share_amount DECIMAL(10,2) DEFAULT 0,

    -- 系统字段
    import_batch_id VARCHAR(50),
    imported_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    CONSTRAINT uk_planet_member_number UNIQUE (member_number)
);

CREATE INDEX idx_pu_member_number ON planet_user(member_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_pu_user_nickname ON planet_user(user_nickname) WHERE deleted_at IS NULL;
CREATE INDEX idx_pu_wechat_nickname ON planet_user(wechat_nickname) WHERE deleted_at IS NULL;
CREATE INDEX idx_pu_role ON planet_user(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_pu_is_exited ON planet_user(is_exited) WHERE deleted_at IS NULL;
CREATE INDEX idx_pu_import_batch ON planet_user(import_batch_id);

COMMENT ON TABLE planet_user IS '知识星球会员表（Excel 离线导入）';
COMMENT ON COLUMN planet_user.member_number IS '成员编号（星球唯一标识，如：123456）';
COMMENT ON COLUMN planet_user.user_nickname IS '用户昵称';
COMMENT ON COLUMN planet_user.wechat_nickname IS '微信昵称';
COMMENT ON COLUMN planet_user.profile_nickname IS '星球名片昵称';
COMMENT ON COLUMN planet_user.remark_nickname IS '星球内备注昵称（运营设置）';
COMMENT ON COLUMN planet_user.knowledge_id IS '知识号';
COMMENT ON COLUMN planet_user.role IS '身份: owner-星主, admin-管理员, partner-合伙人, member-普通成员';
COMMENT ON COLUMN planet_user.is_paid_join IS '是否付费加入';
COMMENT ON COLUMN planet_user.is_blocked IS '是否被拉黑';
COMMENT ON COLUMN planet_user.is_exited IS '用户是否退出星球';
COMMENT ON COLUMN planet_user.is_followed_official IS '是否关注知识星球公众号';
COMMENT ON COLUMN planet_user.is_notification_enabled IS '是否开启消息通知';
COMMENT ON COLUMN planet_user.first_join_time IS '首次加入时间';
COMMENT ON COLUMN planet_user.first_source IS '首次来源';
COMMENT ON COLUMN planet_user.expire_time IS '到期时间';
COMMENT ON COLUMN planet_user.days_to_renewal IS '距离可续期的天数';
COMMENT ON COLUMN planet_user.renewal_count IS '已续期次数';
COMMENT ON COLUMN planet_user.last_active_time IS '最后活跃时间';
COMMENT ON COLUMN planet_user.total_paid_amount IS '在本星球成功付费的总金额';
COMMENT ON COLUMN planet_user.import_batch_id IS '导入批次号（关联 planet_user_import_log）';
COMMENT ON COLUMN planet_user.imported_at IS '导入时间';

CREATE TRIGGER trg_planet_user_updated_at
    BEFORE UPDATE ON planet_user
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- 2.5 会员导入记录表（planet_user_import_log）
-- ------------------------------------------------------------
CREATE TABLE planet_user_import_log (
    id BIGSERIAL PRIMARY KEY,

    -- 批次信息
    batch_id VARCHAR(50) NOT NULL,
    file_name VARCHAR(200) NOT NULL,
    file_path VARCHAR(500),
    file_size INTEGER,

    -- 导入统计
    total_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    updated_count INTEGER DEFAULT 0,
    skipped_count INTEGER DEFAULT 0,

    -- 状态
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    error_details JSONB,

    -- 操作信息
    operator_id BIGINT NOT NULL,
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    duration_ms INTEGER,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 外键约束
    CONSTRAINT fk_puil_operator FOREIGN KEY (operator_id) REFERENCES system_user(id),

    -- 状态值约束
    CONSTRAINT chk_puil_status CHECK (status IN ('pending', 'processing', 'success', 'failed', 'partial'))
);

CREATE INDEX idx_puil_batch ON planet_user_import_log(batch_id);
CREATE INDEX idx_puil_status ON planet_user_import_log(status);
CREATE INDEX idx_puil_operator ON planet_user_import_log(operator_id);
CREATE INDEX idx_puil_time ON planet_user_import_log(created_at);

COMMENT ON TABLE planet_user_import_log IS '星球会员 Excel 导入记录表';
COMMENT ON COLUMN planet_user_import_log.batch_id IS '导入批次号';
COMMENT ON COLUMN planet_user_import_log.file_name IS '原始 Excel 文件名';
COMMENT ON COLUMN planet_user_import_log.file_path IS '文件存储路径';
COMMENT ON COLUMN planet_user_import_log.total_count IS 'Excel 总行数（不含表头）';
COMMENT ON COLUMN planet_user_import_log.success_count IS '成功导入数';
COMMENT ON COLUMN planet_user_import_log.failed_count IS '失败数';
COMMENT ON COLUMN planet_user_import_log.updated_count IS '更新数（会员已存在，更新信息）';
COMMENT ON COLUMN planet_user_import_log.skipped_count IS '跳过数';
COMMENT ON COLUMN planet_user_import_log.status IS '状态: pending-待处理, processing-处理中, success-成功, failed-失败, partial-部分成功';
COMMENT ON COLUMN planet_user_import_log.error_details IS '失败行详情（JSON数组）';

-- ------------------------------------------------------------
-- 2.6 微信服务号用户表（wechat_user）- OAuth登录桥梁
-- ------------------------------------------------------------
CREATE TABLE wechat_user (
    id BIGSERIAL PRIMARY KEY,

    -- 微信身份（OAuth 获取）
    open_id VARCHAR(100) NOT NULL,
    union_id VARCHAR(100),
    nickname VARCHAR(100),
    avatar_url VARCHAR(500),

    -- 星球绑定
    planet_member_number VARCHAR(20),
    bind_status VARCHAR(20) NOT NULL DEFAULT 'unbound',
    bind_time TIMESTAMP,

    -- 用户填写的星球信息（用于匹配验证）
    filled_planet_nickname VARCHAR(100),
    filled_planet_number VARCHAR(20),

    -- 状态
    status VARCHAR(20) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    -- 唯一约束
    CONSTRAINT uk_wechat_open_id UNIQUE (open_id),

    -- 外键约束
    CONSTRAINT fk_wechat_planet FOREIGN KEY (planet_member_number)
        REFERENCES planet_user(member_number),

    -- 状态值约束
    CONSTRAINT chk_wu_bind_status CHECK (bind_status IN ('unbound', 'binding', 'bound')),
    CONSTRAINT chk_wu_status CHECK (status IN ('active', 'disabled'))
);

CREATE INDEX idx_wu_open_id ON wechat_user(open_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_wu_planet_member ON wechat_user(planet_member_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_wu_bind_status ON wechat_user(bind_status) WHERE deleted_at IS NULL;

COMMENT ON TABLE wechat_user IS '微信服务号用户表（OAuth登录 + 星球绑定桥梁）';
COMMENT ON COLUMN wechat_user.open_id IS '微信OpenID（服务号下唯一）';
COMMENT ON COLUMN wechat_user.union_id IS '微信UnionID（开放平台下唯一，可选）';
COMMENT ON COLUMN wechat_user.nickname IS '微信昵称';
COMMENT ON COLUMN wechat_user.avatar_url IS '微信头像URL';
COMMENT ON COLUMN wechat_user.planet_member_number IS '绑定的知识星球成员编号（对应 planet_user.member_number）';
COMMENT ON COLUMN wechat_user.bind_status IS '星球绑定状态: unbound-未绑定, binding-绑定中, bound-已绑定';
COMMENT ON COLUMN wechat_user.bind_time IS '绑定时间';
COMMENT ON COLUMN wechat_user.filled_planet_nickname IS '用户填写的星球昵称（用于验证）';
COMMENT ON COLUMN wechat_user.filled_planet_number IS '用户填写的星球成员编号';
COMMENT ON COLUMN wechat_user.status IS '账号状态: active-正常, disabled-禁用';

CREATE TRIGGER trg_wechat_user_updated_at
    BEFORE UPDATE ON wechat_user
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- 2.7 训练营会员表（camp_member）
-- ------------------------------------------------------------
CREATE TABLE camp_member (
    id BIGSERIAL PRIMARY KEY,

    -- 关联信息
    camp_id BIGINT NOT NULL,
    planet_member_number VARCHAR(20),
    wechat_user_id BIGINT,

    -- 填写的信息（降级路径使用，主路径从 wechat_user 获取）
    filled_planet_nickname VARCHAR(100),
    filled_planet_member_number VARCHAR(20),
    filled_wechat_nickname VARCHAR(100),

    -- 匹配信息
    match_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    match_time TIMESTAMP,

    -- 进群状态
    joined_group BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP,

    -- 打卡统计（冗余字段，定时更新）
    checkin_count INTEGER DEFAULT 0,
    checkin_rate DECIMAL(5,2) DEFAULT 0,
    last_checkin_time TIMESTAMP,

    -- 打卡合格状态（引用 SSOT: 状态枚举定义.md#7-checkin_status）
    checkin_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    full_attendance BOOLEAN DEFAULT FALSE,

    -- 退款资格
    eligible_for_refund BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    -- 外键约束
    CONSTRAINT fk_cm_camp FOREIGN KEY (camp_id) REFERENCES training_camp(id),
    CONSTRAINT fk_cm_planet_user FOREIGN KEY (planet_member_number) REFERENCES planet_user(member_number),
    CONSTRAINT fk_cm_wechat_user FOREIGN KEY (wechat_user_id) REFERENCES wechat_user(id),

    -- 业务约束：主路径或降级路径必须有一个标识
    CONSTRAINT chk_cm_identifier CHECK (
        wechat_user_id IS NOT NULL OR filled_planet_member_number IS NOT NULL
    ),

    -- 状态值约束（引用 SSOT: 状态枚举定义.md）
    CONSTRAINT chk_cm_match_status CHECK (match_status IN ('pending', 'matched', 'failed')),
    CONSTRAINT chk_cm_checkin_status CHECK (checkin_status IN ('pending', 'qualified', 'unqualified'))
);

-- 部分唯一索引：解决 NULL 值重复问题
CREATE UNIQUE INDEX uk_cm_camp_wechat ON camp_member(camp_id, wechat_user_id)
    WHERE wechat_user_id IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX uk_cm_camp_planet ON camp_member(camp_id, filled_planet_member_number)
    WHERE filled_planet_member_number IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_cm_camp ON camp_member(camp_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_cm_planet_member ON camp_member(planet_member_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_cm_wechat_user ON camp_member(wechat_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_cm_match_status ON camp_member(match_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_cm_checkin_status ON camp_member(checkin_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_cm_refund_eligible ON camp_member(eligible_for_refund) WHERE deleted_at IS NULL;
CREATE INDEX idx_member_camp_match ON camp_member(camp_id, match_status) WHERE deleted_at IS NULL;

COMMENT ON TABLE camp_member IS '训练营会员表';
COMMENT ON COLUMN camp_member.camp_id IS '训练营ID';
COMMENT ON COLUMN camp_member.planet_member_number IS '星球成员编号（匹配成功后填充，对应 planet_user.member_number）';
COMMENT ON COLUMN camp_member.wechat_user_id IS '微信用户ID（主路径：OAuth登录报名时关联）';
COMMENT ON COLUMN camp_member.filled_planet_nickname IS '填写的星球昵称（降级路径使用）';
COMMENT ON COLUMN camp_member.filled_planet_member_number IS '填写的星球成员编号（降级路径使用）';
COMMENT ON COLUMN camp_member.filled_wechat_nickname IS '填写的微信昵称（降级路径使用）';
COMMENT ON COLUMN camp_member.match_status IS '匹配状态: pending-待匹配, matched-已匹配, failed-匹配失败';
COMMENT ON COLUMN camp_member.match_time IS '匹配时间';
COMMENT ON COLUMN camp_member.joined_group IS '是否已进群';
COMMENT ON COLUMN camp_member.joined_at IS '进群时间';
COMMENT ON COLUMN camp_member.checkin_count IS '已打卡天数';
COMMENT ON COLUMN camp_member.checkin_rate IS '打卡完成率(%)';
COMMENT ON COLUMN camp_member.last_checkin_time IS '最后打卡时间';
COMMENT ON COLUMN camp_member.checkin_status IS '打卡合格状态（SSOT）: pending-待统计, qualified-合格, unqualified-不合格';
COMMENT ON COLUMN camp_member.full_attendance IS '是否全勤';
COMMENT ON COLUMN camp_member.eligible_for_refund IS '是否符合退款条件';

CREATE TRIGGER trg_camp_member_updated_at
    BEFORE UPDATE ON camp_member
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- 2.8 支付记录表（payment_record）
-- ------------------------------------------------------------
CREATE TABLE payment_record (
    id BIGSERIAL PRIMARY KEY,

    -- 订单信息
    order_no VARCHAR(50) NOT NULL UNIQUE,

    -- 关联信息
    camp_id BIGINT NOT NULL,
    member_id BIGINT,
    wechat_user_id BIGINT,

    -- 支付信息
    pay_amount DECIMAL(10,2) NOT NULL,
    pay_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    pay_time TIMESTAMP,

    -- 微信支付信息
    wechat_order_no VARCHAR(100),
    wechat_transaction_id VARCHAR(100),
    payer_wechat_name VARCHAR(100),

    -- 支付绑定信息
    bind_status VARCHAR(20) DEFAULT 'pending',
    bind_method VARCHAR(20),
    bind_deadline TIMESTAMP,

    -- 回调信息
    callback_data JSONB,

    -- 乐观锁（用于防止并发更新）
    version INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    -- 外键约束
    CONSTRAINT fk_pr_camp FOREIGN KEY (camp_id) REFERENCES training_camp(id),
    CONSTRAINT fk_pr_member FOREIGN KEY (member_id) REFERENCES camp_member(id),
    CONSTRAINT fk_pr_wechat_user FOREIGN KEY (wechat_user_id) REFERENCES wechat_user(id),

    -- 状态值约束（引用 SSOT: 状态枚举定义.md）
    CONSTRAINT chk_pr_pay_status CHECK (pay_status IN ('pending', 'success', 'failed', 'refunded')),
    CONSTRAINT chk_pr_bind_status CHECK (bind_status IN ('pending', 'completed', 'expired', 'manual_review', 'closed')),
    CONSTRAINT chk_pr_bind_method CHECK (bind_method IN ('h5_bindplanet', 'user_fill', 'manual') OR bind_method IS NULL)
);

CREATE INDEX idx_pr_order_no ON payment_record(order_no);
CREATE INDEX idx_pr_camp ON payment_record(camp_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pr_member ON payment_record(member_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pr_wechat_user ON payment_record(wechat_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pr_status ON payment_record(pay_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_pr_pay_time ON payment_record(pay_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_pr_bind_status ON payment_record(bind_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_pr_bind_deadline ON payment_record(bind_deadline) WHERE bind_status = 'pending' AND deleted_at IS NULL;

COMMENT ON TABLE payment_record IS '支付记录表';
COMMENT ON COLUMN payment_record.order_no IS '订单号（唯一）';
COMMENT ON COLUMN payment_record.camp_id IS '训练营ID';
COMMENT ON COLUMN payment_record.member_id IS '会员ID（支付成功后关联）';
COMMENT ON COLUMN payment_record.wechat_user_id IS '微信用户ID（主路径：OAuth登录后支付时关联）';
COMMENT ON COLUMN payment_record.pay_amount IS '支付金额';
COMMENT ON COLUMN payment_record.pay_status IS '支付状态: pending-待支付, success-成功, failed-失败, refunded-已退款';
COMMENT ON COLUMN payment_record.pay_time IS '支付时间';
COMMENT ON COLUMN payment_record.wechat_order_no IS '企业微信订单号';
COMMENT ON COLUMN payment_record.wechat_transaction_id IS '微信支付交易号';
COMMENT ON COLUMN payment_record.payer_wechat_name IS '付款人微信名';
COMMENT ON COLUMN payment_record.bind_status IS '绑定状态: pending-待绑定, completed-已绑定, expired-已过期, manual_review-人工审核中, closed-已关闭';
COMMENT ON COLUMN payment_record.bind_method IS '绑定方式: h5_bindplanet-H5绑定（主路径）, user_fill-用户填写（降级路径）, manual-人工绑定';
COMMENT ON COLUMN payment_record.bind_deadline IS '绑定截止时间（7天后）';
COMMENT ON COLUMN payment_record.callback_data IS '支付回调原始数据';
COMMENT ON COLUMN payment_record.version IS '乐观锁版本号，用于防止并发更新（每次更新+1）';

CREATE TRIGGER trg_payment_record_updated_at
    BEFORE UPDATE ON payment_record
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- 2.9 打卡记录表（checkin_record）
-- ------------------------------------------------------------
CREATE TABLE checkin_record (
    id BIGSERIAL PRIMARY KEY,

    -- 关联信息
    camp_id BIGINT NOT NULL,
    planet_member_number VARCHAR(20) NOT NULL,
    member_id BIGINT,

    -- 打卡信息
    checkin_date DATE NOT NULL,
    checkin_time TIMESTAMP NOT NULL,
    checkin_content TEXT,

    -- 知识星球原始数据
    planet_checkin_id VARCHAR(50),
    raw_data JSONB,

    -- 同步信息
    synced_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 外键约束
    CONSTRAINT fk_cr_camp FOREIGN KEY (camp_id) REFERENCES training_camp(id),
    CONSTRAINT fk_cr_planet_user FOREIGN KEY (planet_member_number) REFERENCES planet_user(member_number),
    CONSTRAINT fk_cr_member FOREIGN KEY (member_id) REFERENCES camp_member(id),

    -- 唯一约束：同一天同一人只能打卡一次
    UNIQUE(camp_id, planet_member_number, checkin_date)
);

CREATE INDEX idx_cr_camp ON checkin_record(camp_id);
CREATE INDEX idx_cr_planet_member ON checkin_record(planet_member_number);
CREATE INDEX idx_cr_member ON checkin_record(member_id);
CREATE INDEX idx_cr_date ON checkin_record(checkin_date);
CREATE INDEX idx_cr_camp_date ON checkin_record(camp_id, checkin_date);
CREATE INDEX idx_checkin_camp_date ON checkin_record(camp_id, checkin_date);

COMMENT ON TABLE checkin_record IS '打卡记录表';
COMMENT ON COLUMN checkin_record.camp_id IS '训练营ID';
COMMENT ON COLUMN checkin_record.planet_member_number IS '星球成员编号（对应 planet_user.member_number）';
COMMENT ON COLUMN checkin_record.member_id IS '会员ID（匹配后关联）';
COMMENT ON COLUMN checkin_record.checkin_date IS '打卡日期';
COMMENT ON COLUMN checkin_record.checkin_time IS '打卡时间';
COMMENT ON COLUMN checkin_record.checkin_content IS '打卡内容';
COMMENT ON COLUMN checkin_record.planet_checkin_id IS '知识星球打卡ID';
COMMENT ON COLUMN checkin_record.raw_data IS '原始数据';
COMMENT ON COLUMN checkin_record.synced_at IS '同步时间';

-- ------------------------------------------------------------
-- 2.10 退款记录表（refund_record）
-- ------------------------------------------------------------
CREATE TABLE refund_record (
    id BIGSERIAL PRIMARY KEY,

    -- 关联信息
    camp_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    payment_id BIGINT NOT NULL,

    -- 退款信息
    refund_amount DECIMAL(10,2) NOT NULL,
    refund_status VARCHAR(20) NOT NULL DEFAULT 'pending',

    -- 审核信息
    audit_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    auditor_id BIGINT,
    audit_time TIMESTAMP,
    audit_comment TEXT,

    -- 执行信息
    execute_time TIMESTAMP,
    wechat_refund_id VARCHAR(100),

    -- 失败信息
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    last_retry_time TIMESTAMP,

    -- 通知状态
    notified BOOLEAN DEFAULT FALSE,
    notify_time TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    -- 外键约束
    CONSTRAINT fk_rr_camp FOREIGN KEY (camp_id) REFERENCES training_camp(id),
    CONSTRAINT fk_rr_member FOREIGN KEY (member_id) REFERENCES camp_member(id),
    CONSTRAINT fk_rr_payment FOREIGN KEY (payment_id) REFERENCES payment_record(id),
    CONSTRAINT fk_rr_auditor FOREIGN KEY (auditor_id) REFERENCES system_user(id),

    -- 状态值约束（引用 SSOT: 状态枚举定义.md）
    CONSTRAINT chk_rr_refund_status CHECK (refund_status IN ('pending', 'approved', 'rejected', 'processing', 'success', 'failed')),
    CONSTRAINT chk_rr_audit_status CHECK (audit_status IN ('pending', 'approved', 'rejected'))
);

-- 唯一约束：同一支付记录只能有一条有效退款（防止重复退款）
CREATE UNIQUE INDEX uk_rr_payment ON refund_record(payment_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_rr_camp ON refund_record(camp_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rr_member ON refund_record(member_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rr_status ON refund_record(refund_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_rr_audit ON refund_record(audit_status) WHERE deleted_at IS NULL AND audit_status = 'pending';
CREATE INDEX idx_refund_pending_audit ON refund_record(camp_id, audit_status) WHERE audit_status = 'pending' AND deleted_at IS NULL;

COMMENT ON TABLE refund_record IS '退款记录表';
COMMENT ON COLUMN refund_record.camp_id IS '训练营ID';
COMMENT ON COLUMN refund_record.member_id IS '会员ID';
COMMENT ON COLUMN refund_record.payment_id IS '支付记录ID';
COMMENT ON COLUMN refund_record.refund_amount IS '退款金额';
COMMENT ON COLUMN refund_record.refund_status IS '退款状态: pending-待审核, approved-审核通过, rejected-审核拒绝, processing-退款中, success-退款成功, failed-退款失败';
COMMENT ON COLUMN refund_record.audit_status IS '审核状态: pending-待审核, approved-通过, rejected-拒绝';
COMMENT ON COLUMN refund_record.auditor_id IS '审核人ID';
COMMENT ON COLUMN refund_record.audit_time IS '审核时间';
COMMENT ON COLUMN refund_record.audit_comment IS '审核备注';
COMMENT ON COLUMN refund_record.execute_time IS '退款执行时间';
COMMENT ON COLUMN refund_record.wechat_refund_id IS '微信退款单号';
COMMENT ON COLUMN refund_record.failure_reason IS '失败原因';
COMMENT ON COLUMN refund_record.retry_count IS '重试次数';
COMMENT ON COLUMN refund_record.last_retry_time IS '最后重试时间';
COMMENT ON COLUMN refund_record.notified IS '是否已通知会员';
COMMENT ON COLUMN refund_record.notify_time IS '通知时间';

CREATE TRIGGER trg_refund_record_updated_at
    BEFORE UPDATE ON refund_record
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 三、系统管理表
-- ============================================================

-- ------------------------------------------------------------
-- 3.1 操作日志表（operation_log）
-- ------------------------------------------------------------
CREATE TABLE operation_log (
    id BIGSERIAL PRIMARY KEY,

    -- 操作人
    operator_id BIGINT NOT NULL,
    operator_name VARCHAR(50) NOT NULL,

    -- 操作信息
    operation_type VARCHAR(50) NOT NULL,
    operation_desc TEXT NOT NULL,

    -- 操作对象
    target_type VARCHAR(50),
    target_id BIGINT,
    target_name VARCHAR(200),

    -- 请求信息
    request_url VARCHAR(500),
    request_method VARCHAR(10),
    request_params TEXT,

    -- 网络信息
    ip_address VARCHAR(50),
    user_agent TEXT,

    -- 执行结果
    success BOOLEAN NOT NULL,
    error_message TEXT,

    -- 时间信息
    execute_time INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ol_operator FOREIGN KEY (operator_id) REFERENCES system_user(id)
);

CREATE INDEX idx_ol_operator ON operation_log(operator_id);
CREATE INDEX idx_ol_type ON operation_log(operation_type);
CREATE INDEX idx_ol_target ON operation_log(target_type, target_id);
CREATE INDEX idx_ol_time ON operation_log(created_at);
CREATE INDEX idx_operation_log_time_desc ON operation_log(created_at DESC);

COMMENT ON TABLE operation_log IS '操作日志表';
COMMENT ON COLUMN operation_log.operator_id IS '操作人ID';
COMMENT ON COLUMN operation_log.operator_name IS '操作人姓名';
COMMENT ON COLUMN operation_log.operation_type IS '操作类型';
COMMENT ON COLUMN operation_log.operation_desc IS '操作描述';
COMMENT ON COLUMN operation_log.target_type IS '操作对象类型（如：训练营、会员）';
COMMENT ON COLUMN operation_log.target_id IS '操作对象ID';
COMMENT ON COLUMN operation_log.target_name IS '操作对象名称';
COMMENT ON COLUMN operation_log.request_url IS '请求URL';
COMMENT ON COLUMN operation_log.request_method IS '请求方法';
COMMENT ON COLUMN operation_log.request_params IS '请求参数';
COMMENT ON COLUMN operation_log.ip_address IS 'IP地址';
COMMENT ON COLUMN operation_log.user_agent IS 'User Agent';
COMMENT ON COLUMN operation_log.success IS '是否成功';
COMMENT ON COLUMN operation_log.error_message IS '错误信息';
COMMENT ON COLUMN operation_log.execute_time IS '执行耗时（毫秒）';

-- ------------------------------------------------------------
-- 3.2 系统配置表（system_config）
-- ------------------------------------------------------------
CREATE TABLE system_config (
    id BIGSERIAL PRIMARY KEY,

    -- 配置项
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    config_type VARCHAR(20) NOT NULL DEFAULT 'string',

    -- 说明
    description TEXT,

    -- 分组
    group_name VARCHAR(50) NOT NULL DEFAULT 'default',

    -- 是否加密
    is_encrypted BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sc_key ON system_config(config_key);
CREATE INDEX idx_sc_group ON system_config(group_name);

COMMENT ON TABLE system_config IS '系统配置表';
COMMENT ON COLUMN system_config.config_key IS '配置键';
COMMENT ON COLUMN system_config.config_value IS '配置值';
COMMENT ON COLUMN system_config.config_type IS '配置类型: string, number, json, encrypted';
COMMENT ON COLUMN system_config.description IS '配置说明';
COMMENT ON COLUMN system_config.group_name IS '配置分组';
COMMENT ON COLUMN system_config.is_encrypted IS '是否加密存储';

CREATE TRIGGER trg_system_config_updated_at
    BEFORE UPDATE ON system_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- 3.3 通知消息表（notification_message）
-- ------------------------------------------------------------
CREATE TABLE notification_message (
    id BIGSERIAL PRIMARY KEY,

    -- 接收者信息
    recipient_type VARCHAR(20) NOT NULL,
    recipient_id BIGINT NOT NULL,

    -- 消息内容
    message_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,

    -- 关联信息
    camp_id BIGINT,
    member_id BIGINT,
    extra_data JSONB,

    -- 发送状态
    channel VARCHAR(20) NOT NULL,
    send_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    send_time TIMESTAMP,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,

    -- 阅读状态
    read_status BOOLEAN DEFAULT FALSE,
    read_time TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 外键约束
    CONSTRAINT fk_nm_camp FOREIGN KEY (camp_id) REFERENCES training_camp(id),
    CONSTRAINT fk_nm_member FOREIGN KEY (member_id) REFERENCES camp_member(id),

    -- 状态值约束
    CONSTRAINT chk_nm_recipient_type CHECK (recipient_type IN ('member', 'admin')),
    CONSTRAINT chk_nm_channel CHECK (channel IN ('wechat', 'sms', 'internal')),
    CONSTRAINT chk_nm_send_status CHECK (send_status IN ('pending', 'sent', 'failed'))
);

CREATE INDEX idx_nm_recipient ON notification_message(recipient_type, recipient_id);
CREATE INDEX idx_nm_type ON notification_message(message_type);
CREATE INDEX idx_nm_status ON notification_message(send_status) WHERE send_status = 'pending';
CREATE INDEX idx_nm_camp ON notification_message(camp_id);
CREATE INDEX idx_nm_time ON notification_message(created_at);

COMMENT ON TABLE notification_message IS '通知消息表';
COMMENT ON COLUMN notification_message.recipient_type IS '接收者类型: member-会员, admin-管理员';
COMMENT ON COLUMN notification_message.recipient_id IS '接收者ID';
COMMENT ON COLUMN notification_message.message_type IS '消息类型';
COMMENT ON COLUMN notification_message.title IS '消息标题';
COMMENT ON COLUMN notification_message.content IS '消息内容';
COMMENT ON COLUMN notification_message.camp_id IS '关联训练营ID';
COMMENT ON COLUMN notification_message.member_id IS '关联会员ID';
COMMENT ON COLUMN notification_message.extra_data IS '额外数据';
COMMENT ON COLUMN notification_message.channel IS '发送渠道: wechat-企微, sms-短信, internal-站内';
COMMENT ON COLUMN notification_message.send_status IS '发送状态: pending-待发送, sent-已发送, failed-失败';
COMMENT ON COLUMN notification_message.send_time IS '发送时间';
COMMENT ON COLUMN notification_message.retry_count IS '重试次数';
COMMENT ON COLUMN notification_message.error_message IS '错误信息';
COMMENT ON COLUMN notification_message.read_status IS '是否已读';
COMMENT ON COLUMN notification_message.read_time IS '阅读时间';

CREATE TRIGGER trg_notification_message_updated_at
    BEFORE UPDATE ON notification_message
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 四、状态日志表（审计追踪）
-- ============================================================

-- ------------------------------------------------------------
-- 4.1 训练营状态日志表（camp_status_log）
-- ------------------------------------------------------------
CREATE TABLE camp_status_log (
    id BIGSERIAL PRIMARY KEY,

    -- 关联信息
    camp_id BIGINT NOT NULL,

    -- 状态变更
    from_status VARCHAR(32),
    to_status VARCHAR(32) NOT NULL,
    event VARCHAR(64) NOT NULL,

    -- 操作信息
    operator_id BIGINT,
    remark TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_csl_camp FOREIGN KEY (camp_id) REFERENCES training_camp(id),
    CONSTRAINT fk_csl_operator FOREIGN KEY (operator_id) REFERENCES system_user(id)
);

CREATE INDEX idx_csl_camp ON camp_status_log(camp_id);
CREATE INDEX idx_csl_event ON camp_status_log(event);
CREATE INDEX idx_csl_time ON camp_status_log(created_at);

COMMENT ON TABLE camp_status_log IS '训练营状态日志表';
COMMENT ON COLUMN camp_status_log.camp_id IS '训练营ID';
COMMENT ON COLUMN camp_status_log.from_status IS '原状态';
COMMENT ON COLUMN camp_status_log.to_status IS '新状态';
COMMENT ON COLUMN camp_status_log.event IS '触发事件';
COMMENT ON COLUMN camp_status_log.operator_id IS '操作人ID';
COMMENT ON COLUMN camp_status_log.remark IS '备注';

-- ------------------------------------------------------------
-- 4.2 支付绑定状态日志表（payment_bind_status_log）
-- ------------------------------------------------------------
CREATE TABLE payment_bind_status_log (
    id BIGSERIAL PRIMARY KEY,

    -- 关联信息
    payment_id BIGINT NOT NULL,

    -- 状态变更
    from_status VARCHAR(32),
    to_status VARCHAR(32) NOT NULL,
    event VARCHAR(64) NOT NULL,

    -- 操作信息
    operator_id BIGINT,
    extra_data JSONB,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pbsl_payment FOREIGN KEY (payment_id) REFERENCES payment_record(id),
    CONSTRAINT fk_pbsl_operator FOREIGN KEY (operator_id) REFERENCES system_user(id)
);

CREATE INDEX idx_pbsl_payment ON payment_bind_status_log(payment_id);
CREATE INDEX idx_pbsl_event ON payment_bind_status_log(event);
CREATE INDEX idx_pbsl_time ON payment_bind_status_log(created_at);

COMMENT ON TABLE payment_bind_status_log IS '支付绑定状态日志表';
COMMENT ON COLUMN payment_bind_status_log.payment_id IS '支付记录ID';
COMMENT ON COLUMN payment_bind_status_log.from_status IS '原状态';
COMMENT ON COLUMN payment_bind_status_log.to_status IS '新状态';
COMMENT ON COLUMN payment_bind_status_log.event IS '触发事件';
COMMENT ON COLUMN payment_bind_status_log.operator_id IS '操作人ID（人工操作时）';
COMMENT ON COLUMN payment_bind_status_log.extra_data IS '额外数据（如匹配结果）';

-- ------------------------------------------------------------
-- 4.3 订单状态日志表（order_status_log）
-- ------------------------------------------------------------
CREATE TABLE order_status_log (
    id BIGSERIAL PRIMARY KEY,

    -- 关联信息
    order_id BIGINT NOT NULL,

    -- 状态变更
    from_status VARCHAR(32),
    to_status VARCHAR(32) NOT NULL,
    event VARCHAR(64) NOT NULL,

    -- 额外信息
    extra_data JSONB,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_osl_order FOREIGN KEY (order_id) REFERENCES payment_record(id)
);

CREATE INDEX idx_osl_order ON order_status_log(order_id);
CREATE INDEX idx_osl_event ON order_status_log(event);
CREATE INDEX idx_osl_time ON order_status_log(created_at);

COMMENT ON TABLE order_status_log IS '订单状态日志表';
COMMENT ON COLUMN order_status_log.order_id IS '订单ID（payment_record.id）';
COMMENT ON COLUMN order_status_log.from_status IS '原状态';
COMMENT ON COLUMN order_status_log.to_status IS '新状态';
COMMENT ON COLUMN order_status_log.event IS '触发事件';
COMMENT ON COLUMN order_status_log.extra_data IS '额外数据（如支付回调信息）';

-- ------------------------------------------------------------
-- 4.4 退款状态日志表（refund_status_log）
-- ------------------------------------------------------------
CREATE TABLE refund_status_log (
    id BIGSERIAL PRIMARY KEY,

    -- 关联信息
    refund_id BIGINT NOT NULL,

    -- 状态变更
    from_status VARCHAR(32),
    to_status VARCHAR(32) NOT NULL,
    event VARCHAR(64) NOT NULL,

    -- 操作信息
    operator_id BIGINT,
    remark TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_rsl_refund FOREIGN KEY (refund_id) REFERENCES refund_record(id),
    CONSTRAINT fk_rsl_operator FOREIGN KEY (operator_id) REFERENCES system_user(id)
);

CREATE INDEX idx_rsl_refund ON refund_status_log(refund_id);
CREATE INDEX idx_rsl_event ON refund_status_log(event);
CREATE INDEX idx_rsl_time ON refund_status_log(created_at);

COMMENT ON TABLE refund_status_log IS '退款状态日志表';
COMMENT ON COLUMN refund_status_log.refund_id IS '退款记录ID';
COMMENT ON COLUMN refund_status_log.from_status IS '原状态';
COMMENT ON COLUMN refund_status_log.to_status IS '新状态';
COMMENT ON COLUMN refund_status_log.event IS '触发事件';
COMMENT ON COLUMN refund_status_log.operator_id IS '操作人ID';
COMMENT ON COLUMN refund_status_log.remark IS '备注';

-- ------------------------------------------------------------
-- 4.5 会员状态日志表（member_status_log）
-- ------------------------------------------------------------
CREATE TABLE member_status_log (
    id BIGSERIAL PRIMARY KEY,

    -- 关联信息
    member_id BIGINT NOT NULL,
    camp_id BIGINT NOT NULL,

    -- 状态变更
    from_status VARCHAR(32),
    to_status VARCHAR(32) NOT NULL,
    event VARCHAR(64) NOT NULL,

    -- 额外信息
    extra_data JSONB,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_msl_member FOREIGN KEY (member_id) REFERENCES camp_member(id),
    CONSTRAINT fk_msl_camp FOREIGN KEY (camp_id) REFERENCES training_camp(id)
);

CREATE INDEX idx_msl_member ON member_status_log(member_id);
CREATE INDEX idx_msl_camp ON member_status_log(camp_id);
CREATE INDEX idx_msl_event ON member_status_log(event);
CREATE INDEX idx_msl_time ON member_status_log(created_at);

COMMENT ON TABLE member_status_log IS '会员状态日志表';
COMMENT ON COLUMN member_status_log.member_id IS '会员ID';
COMMENT ON COLUMN member_status_log.camp_id IS '训练营ID';
COMMENT ON COLUMN member_status_log.from_status IS '原状态';
COMMENT ON COLUMN member_status_log.to_status IS '新状态';
COMMENT ON COLUMN member_status_log.event IS '触发事件';
COMMENT ON COLUMN member_status_log.extra_data IS '额外数据';

-- ------------------------------------------------------------
-- 4.6 数据同步日志表（sync_log）- 打卡API同步
-- ------------------------------------------------------------
CREATE TABLE sync_log (
    id BIGSERIAL PRIMARY KEY,

    -- 同步任务信息
    sync_type VARCHAR(50) NOT NULL,
    sync_source VARCHAR(50) NOT NULL DEFAULT 'planet_api',

    -- 同步范围
    camp_id BIGINT,
    planet_group_id VARCHAR(50),

    -- 同步统计
    total_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    skipped_count INTEGER DEFAULT 0,

    -- 执行信息
    started_at TIMESTAMP NOT NULL,
    finished_at TIMESTAMP,
    duration_ms INTEGER,

    -- 状态
    status VARCHAR(20) NOT NULL DEFAULT 'running',

    -- 错误信息
    error_message TEXT,
    error_details JSONB,

    -- 同步结果明细（可选，大量数据时不存储）
    sync_details JSONB,

    -- 触发信息
    triggered_by VARCHAR(50) NOT NULL DEFAULT 'scheduler',
    operator_id BIGINT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 外键约束
    CONSTRAINT fk_sl_camp FOREIGN KEY (camp_id) REFERENCES training_camp(id),
    CONSTRAINT fk_sl_operator FOREIGN KEY (operator_id) REFERENCES system_user(id),

    -- 状态值约束（引用 SSOT: 状态枚举定义.md#8-sync_status）
    CONSTRAINT chk_sl_status CHECK (status IN ('running', 'success', 'partial', 'failed', 'cancelled')),
    CONSTRAINT chk_sl_sync_source CHECK (sync_source IN ('planet_api', 'manual')),
    CONSTRAINT chk_sl_triggered_by CHECK (triggered_by IN ('scheduler', 'manual', 'webhook'))
);

CREATE INDEX idx_sl_type ON sync_log(sync_type);
CREATE INDEX idx_sl_camp ON sync_log(camp_id);
CREATE INDEX idx_sl_status ON sync_log(status);
CREATE INDEX idx_sl_time ON sync_log(started_at);

COMMENT ON TABLE sync_log IS '数据同步日志表（会员Excel导入、打卡API同步）';
COMMENT ON COLUMN sync_log.sync_type IS '同步类型: member_full-全量导入, member_incremental-增量导入, checkin-打卡同步';
COMMENT ON COLUMN sync_log.sync_source IS '数据来源: planet_api-知识星球API(仅打卡), manual-手动导入(会员Excel)';
COMMENT ON COLUMN sync_log.camp_id IS '关联训练营ID（可选）';
COMMENT ON COLUMN sync_log.planet_group_id IS '知识星球圈子ID';
COMMENT ON COLUMN sync_log.total_count IS '总处理数量';
COMMENT ON COLUMN sync_log.success_count IS '成功数量';
COMMENT ON COLUMN sync_log.failed_count IS '失败数量';
COMMENT ON COLUMN sync_log.skipped_count IS '跳过数量';
COMMENT ON COLUMN sync_log.started_at IS '开始时间';
COMMENT ON COLUMN sync_log.finished_at IS '结束时间';
COMMENT ON COLUMN sync_log.duration_ms IS '执行耗时（毫秒）';
COMMENT ON COLUMN sync_log.status IS '状态: running-执行中, success-成功, failed-失败, partial-部分成功, cancelled-已取消';
COMMENT ON COLUMN sync_log.error_message IS '错误信息';
COMMENT ON COLUMN sync_log.error_details IS '错误详情（JSON格式）';
COMMENT ON COLUMN sync_log.sync_details IS '同步结果明细（JSON格式）';
COMMENT ON COLUMN sync_log.triggered_by IS '触发方式: scheduler-定时任务(打卡), manual-手动触发(会员导入), webhook-回调触发';
COMMENT ON COLUMN sync_log.operator_id IS '操作人ID（手动触发时）';

-- ============================================================
-- 五、视图设计
-- ============================================================

-- ------------------------------------------------------------
-- 5.1 会员完整信息视图
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_member_full_info AS
SELECT
    cm.id AS member_id,
    cm.camp_id,
    tc.name AS camp_name,
    tc.start_date,
    tc.end_date,
    tc.total_days,
    tc.required_days,
    tc.deposit,

    -- 会员填写信息（降级路径使用）
    cm.filled_planet_nickname,
    cm.filled_planet_member_number,
    cm.filled_wechat_nickname,

    -- 匹配信息
    cm.match_status,

    -- 知识星球用户信息
    pu.member_number AS planet_member_number,
    pu.user_nickname AS planet_nickname,
    pu.wechat_nickname,

    -- 进群状态
    cm.joined_group,
    cm.joined_at,

    -- 打卡统计
    cm.checkin_count,
    cm.checkin_rate,
    cm.last_checkin_time,
    cm.eligible_for_refund,

    -- 支付信息
    pr.order_no,
    pr.pay_amount,
    pr.pay_status,
    pr.pay_time,

    -- 退款信息
    rr.refund_status,
    rr.audit_status,
    rr.refund_amount,
    rr.audit_time,

    cm.created_at,
    cm.updated_at
FROM
    camp_member cm
    INNER JOIN training_camp tc ON cm.camp_id = tc.id
    LEFT JOIN planet_user pu ON cm.planet_member_number = pu.member_number
    LEFT JOIN payment_record pr ON pr.member_id = cm.id AND pr.pay_status = 'success'
    LEFT JOIN refund_record rr ON rr.member_id = cm.id
WHERE
    cm.deleted_at IS NULL
    AND tc.deleted_at IS NULL;

COMMENT ON VIEW v_member_full_info IS '会员完整信息视图';

-- ------------------------------------------------------------
-- 5.2 训练营统计视图
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_camp_statistics AS
SELECT
    tc.id AS camp_id,
    tc.name AS camp_name,
    tc.start_date,
    tc.end_date,
    tc.status,
    tc.deposit,

    -- 报名统计
    COUNT(DISTINCT cm.id) AS member_count,
    COUNT(DISTINCT CASE WHEN cm.match_status = 'matched' THEN cm.id END) AS matched_count,
    COUNT(DISTINCT CASE WHEN cm.joined_group = TRUE THEN cm.id END) AS joined_count,

    -- 打卡统计
    COUNT(DISTINCT CASE WHEN cm.eligible_for_refund = TRUE THEN cm.id END) AS eligible_count,
    ROUND(AVG(cm.checkin_rate), 2) AS avg_checkin_rate,

    -- 金额统计
    COALESCE(SUM(CASE WHEN pr.pay_status = 'success' THEN pr.pay_amount END), 0) AS total_paid,
    COALESCE(SUM(CASE WHEN rr.refund_status = 'success' THEN rr.refund_amount END), 0) AS total_refunded,
    COALESCE(SUM(CASE WHEN pr.pay_status = 'success' THEN pr.pay_amount END), 0) -
    COALESCE(SUM(CASE WHEN rr.refund_status = 'success' THEN rr.refund_amount END), 0) AS net_income,

    -- 退款统计
    COUNT(DISTINCT CASE WHEN rr.audit_status = 'pending' THEN rr.id END) AS pending_refund_count,
    COUNT(DISTINCT CASE WHEN rr.refund_status = 'success' THEN rr.id END) AS success_refund_count,
    COUNT(DISTINCT CASE WHEN rr.refund_status = 'failed' THEN rr.id END) AS failed_refund_count
FROM
    training_camp tc
    LEFT JOIN camp_member cm ON tc.id = cm.camp_id AND cm.deleted_at IS NULL
    LEFT JOIN payment_record pr ON cm.id = pr.member_id AND pr.deleted_at IS NULL
    LEFT JOIN refund_record rr ON cm.id = rr.member_id AND rr.deleted_at IS NULL
WHERE
    tc.deleted_at IS NULL
GROUP BY
    tc.id, tc.name, tc.start_date, tc.end_date, tc.status, tc.deposit;

COMMENT ON VIEW v_camp_statistics IS '训练营统计视图';

-- ============================================================
-- 六、存储过程
-- ============================================================

-- ------------------------------------------------------------
-- 6.1 自动更新训练营状态
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION auto_update_camp_status()
RETURNS void AS $$
BEGIN
    -- 更新为进行中（enrolling → ongoing）
    UPDATE training_camp
    SET status = 'ongoing'
    WHERE status = 'enrolling'
        AND start_date <= CURRENT_DATE
        AND end_date >= CURRENT_DATE
        AND deleted_at IS NULL;

    -- 更新为已结束（ongoing → ended）
    UPDATE training_camp
    SET status = 'ended'
    WHERE status = 'ongoing'
        AND end_date < CURRENT_DATE
        AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_update_camp_status() IS '自动更新训练营状态（可通过定时任务调用）';

-- ------------------------------------------------------------
-- 6.2 批量更新会员打卡统计
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_member_checkin_stats(p_camp_id BIGINT)
RETURNS void AS $$
BEGIN
    UPDATE camp_member cm
    SET
        checkin_count = (
            SELECT COUNT(*)
            FROM checkin_record cr
            WHERE cr.member_id = cm.id
        ),
        checkin_rate = ROUND(
            (SELECT COUNT(*)::DECIMAL
             FROM checkin_record cr
             WHERE cr.member_id = cm.id) * 100.0 /
            (SELECT required_days FROM training_camp WHERE id = p_camp_id),
            2
        ),
        last_checkin_time = (
            SELECT MAX(checkin_time)
            FROM checkin_record cr
            WHERE cr.member_id = cm.id
        ),
        eligible_for_refund = (
            SELECT COUNT(*)
            FROM checkin_record cr
            WHERE cr.member_id = cm.id
        ) >= (
            SELECT required_days
            FROM training_camp
            WHERE id = p_camp_id
        )
    WHERE cm.camp_id = p_camp_id
        AND cm.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_member_checkin_stats IS '批量更新指定训练营的会员打卡统计';

-- ------------------------------------------------------------
-- 6.3 生成退款审核列表
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_refund_list(p_camp_id BIGINT)
RETURNS TABLE(member_id BIGINT, payment_id BIGINT, refund_amount DECIMAL) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO refund_record (camp_id, member_id, payment_id, refund_amount, refund_status, audit_status)
    SELECT
        cm.camp_id,
        cm.id,
        pr.id,
        pr.pay_amount,
        'pending',
        'pending'
    FROM
        camp_member cm
        INNER JOIN payment_record pr ON cm.id = pr.member_id AND pr.pay_status = 'success'
        INNER JOIN training_camp tc ON cm.camp_id = tc.id
    WHERE
        cm.camp_id = p_camp_id
        AND cm.eligible_for_refund = TRUE
        AND cm.match_status = 'matched'
        AND NOT EXISTS (
            SELECT 1 FROM refund_record rr
            WHERE rr.member_id = cm.id
            AND rr.deleted_at IS NULL
        )
        AND cm.deleted_at IS NULL
        AND tc.deleted_at IS NULL
    RETURNING refund_record.member_id, refund_record.payment_id, refund_record.refund_amount;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_refund_list IS '为指定训练营生成退款审核列表';

-- ============================================================
-- 七、初始化数据
-- ============================================================

-- ------------------------------------------------------------
-- 7.1 创建默认管理员
-- ------------------------------------------------------------
-- 密码: admin123（实际使用时请修改）
-- BCrypt加密: $2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EHsM
INSERT INTO system_user (username, password, real_name, role, status) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EHsM', '超级管理员', 'admin', 'active')
ON CONFLICT (username) DO NOTHING;

-- ------------------------------------------------------------
-- 7.2 创建默认系统配置
-- ------------------------------------------------------------
INSERT INTO system_config (config_key, config_value, config_type, description, group_name, is_encrypted) VALUES
('planet.cookie', '', 'encrypted', '知识星球Cookie', 'planet', true),
('planet.group_id', '', 'string', '知识星球圈子ID', 'planet', false),
('wechat.corp_id', '', 'string', '企业微信企业ID', 'wechat', false),
('wechat.app_secret', '', 'encrypted', '企业微信应用Secret', 'wechat', true),
('wechat.pay_merchant_id', '', 'string', '微信支付商户号', 'wechat', false),
('wechat.pay_api_key', '', 'encrypted', '微信支付密钥', 'wechat', true),
('notification.admin_users', '[]', 'json', '接收通知的管理员ID列表', 'notification', false),
('system.bind_deadline_days', '7', 'number', '绑定截止天数', 'system', false),
('system.refund_retry_max', '3', 'number', '退款最大重试次数', 'system', false)
ON CONFLICT (config_key) DO NOTHING;

-- ============================================================
-- 八、完成提示
-- ============================================================

-- 打印初始化完成信息
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '数据库初始化完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '已创建：';
    RAISE NOTICE '  - 16 张业务表';
    RAISE NOTICE '  - 2 个视图';
    RAISE NOTICE '  - 3 个存储过程';
    RAISE NOTICE '  - 8 个触发器';
    RAISE NOTICE '  - 1 个默认管理员 (admin/admin123)';
    RAISE NOTICE '  - 9 条默认配置';
    RAISE NOTICE '========================================';
    RAISE NOTICE '下一步：';
    RAISE NOTICE '  1. 修改默认管理员密码';
    RAISE NOTICE '  2. 配置系统参数（知识星球、微信支付等）';
    RAISE NOTICE '  3. 启动后端服务';
    RAISE NOTICE '========================================';
END $$;