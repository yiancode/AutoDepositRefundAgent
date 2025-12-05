# 文档评估问题清单（基于 dev-文档评估指南）

> 评估日期：2025-12-__（待补）  
> 评估范围：`docs/v1` 下各类需求、设计、流程与实施指南  
> 评估依据：`docs/v1/guides/dev-文档评估指南.md`

---

## 第一层：需求定义

### docs/PRD.md
1. 训练营列表筛选仍固定为“未开始/进行中/已结束”（docs/PRD.md:218-229），与 SSOT 中 `DRAFT/PENDING/ENROLLING/ONGOING/ENDED/SETTLING/ARCHIVED` 不一致。
2. Stage 2 验收标准引用 `bind_method=dynamic_qrcode`（docs/PRD.md:861），该枚举在 SSOT 中不存在。
3. 多处仍描述“智能匹配”流程（docs/PRD.md:22,858-905），与最新技术方案“超时进入人工审核”相矛盾（docs/v1/design/技术方案.md:873）。

### docs/v1/user-stories/EP01-训练营管理.md
1. Story 1.2 禁止“报名中”训练营编辑（docs/v1/user-stories/EP01-训练营管理.md:108-116），而 PRD 允许在未开课前编辑（docs/PRD.md:235）。
2. Story 1.4 漏掉 PRD 要求的时间筛选（docs/v1/user-stories/EP01-训练营管理.md:186-206 vs docs/PRD.md:218-223）。

### docs/v1/user-stories/EP02-会员报名与支付.md
1. 多个场景仍规划“智能匹配队列/算法”（docs/v1/user-stories/EP02-会员报名与支付.md:431,527,737-755,833-835）。
2. “相关文档”引用了不存在的 `../security/FastAuth接入方案.md`（docs/v1/user-stories/EP02-会员报名与支付.md:807）。

### docs/v1/user-stories/EP03-打卡数据同步.md
1. Story 3.3 要求标记“全勤”状态（docs/v1/user-stories/EP03-打卡数据同步.md:166-175），数据库并无对应字段（docs/v1/design/数据库设计.md:998-1059）。

### docs/v1/user-stories/EP04-身份匹配.md
1. Epic 仍围绕智能匹配算法设计（docs/v1/user-stories/EP04-身份匹配.md:41-216,245-308）。
2. 大量引用“匹配置信度”驱动审核（docs/v1/user-stories/EP04-身份匹配.md:87-177），但该概念已废弃（docs/v1/guides/dev-文档评估指南.md:113-126）。

### docs/v1/user-stories/EP05-退款审核.md
1. Story 5.1 允许“已结束”状态直接生成退款名单（docs/v1/user-stories/EP05-退款审核.md:35-44），与 EP01 Story 1.6 的“先进入结算中”冲突。
2. 列表/审核流程依赖置信度字段（docs/v1/user-stories/EP05-退款审核.md:48-111），与现状不符。

### docs/v1/user-stories/EP06-统计报表.md
1. Story 6.1/6.2 要求展示“匹配置信度”图表（docs/v1/user-stories/EP06-统计报表.md:48-55），数据源不存在。
2. Story 6.2 需要“多训练营对比”（docs/v1/user-stories/EP06-统计报表.md:88-105），接口设计无相应能力（docs/v1/user-stories/EP06-统计报表.md:185-232）。

---

## 第二层：核心设计

### docs/v1/design/状态枚举定义.md
1. `refund_status` 在 SSOT 中使用大写常量，但 DB/API 均使用小写（docs/v1/design/状态枚举定义.md:223-247；docs/v1/design/数据库设计.md:1218-1260）。
2. 未覆盖 `camp_member.match_status`、`refund_record.audit_status` 等关键枚举（见数据库定义）。

### docs/v1/design/数据库设计.md
1. `payment_bind_status_log` 仍保留 `SMART_MATCH/MATCH_FAIL` 事件（docs/v1/design/数据库设计.md:1529-1555）。
2. `refund_record` 同时维护 `refund_status` 与 `audit_status` 且值域重叠，缺少一致性说明。

### docs/v1/design/技术方案.md
1. 第5.5.8节宣称“移除智能匹配”，但后文调度/伪代码仍触发智能匹配（docs/v1/design/技术方案.md:1513,1629-1677）。
2. 多处引用 `../security/FastAuth接入方案.md`（docs/v1/design/技术方案.md:160,432-516,1271,1512,2277-2278），路径实际指向 `docs/v1/archive/`.

### docs/v1/design/API设计规范.md
1. 将 `POST /api/h5/payments` 列入“无需认证接口”白名单（docs/v1/design/API设计规范.md:304-313），与 EP02 对 JWT 的要求矛盾。
2. 版本策略标记 `/api/camps`（无版本）为不推荐（docs/v1/design/API设计规范.md:69-89），但示例/接口仍无版本。

### docs/v1/design/前端路由设计.md
1. `/refunds/:id/approve` 仅允许 `admin` 访问（docs/v1/design/前端路由设计.md:176-177,249-252），与 PRD 权限矩阵不一致。
2. H5 路由缺少 PRD 规定的“群二维码展示页”（docs/PRD.md:177-185）。

---

## 第三层：图表验证

### docs/v1/diagrams/状态机.md
1. 支付状态机新增 `PAYING/REFUNDING/REFUND_FAILED/CANCELLED`，不在 SSOT 定义范围。
2. 训练营状态机包含 `CANCELLED`，SSOT 未定义。

### docs/v1/diagrams/业务流程图.md
1. H5 主路径假设报名链接自带 `planet_user_id`（docs/v1/diagrams/业务流程图.md:76-111），与 EP02 用户填写逻辑不符。
2. 退款流程未考虑 `SETTLING/ARCHIVED` 状态（docs/v1/diagrams/业务流程图.md:206-215）。

### docs/v1/diagrams/时序图.md
1. 绑定接口仍使用 `/api/payment/{out_trade_no}` 与 `/api/payment/bind`（docs/v1/diagrams/时序图.md:21-64），与最新 `/api/h5/orders/...` 接口不一致。
2. 退款名单时序仍在“已结束”直接生成名单（docs/v1/diagrams/时序图.md:203-239），缺少结算状态。

### docs/v1/diagrams/OAuth绑定完整时序图.md
1. 超时定时任务依旧调用 `addToMatchQueue`（docs/v1/diagrams/OAuth绑定完整时序图.md:210-238）。
2. 定时任务只把状态更新为 `expired`，未进入 `manual_review`。

### docs/v1/diagrams/架构设计图.md
1. 领域模型引用未定义的 `MemberStatus`。
2. 安全天示图假设存在 API Gateway，与单节点部署描述矛盾。

### docs/v1/diagrams/用户旅程图.md
1. 会员旅程仍宣称“系统自动匹配成功退款”（docs/v1/diagrams/用户旅程图.md:39-69）。
2. H5 报名原型展示星球信息自动填写（docs/v1/diagrams/用户旅程图.md:171-177），与 EP02 的人工填写路径不符。

---

## 第四层：接口与安全

### docs/v1/api/接口文档.md
1. 退款审核流程仍使用智能匹配+置信度（docs/v1/api/接口文档.md:3358-3400,3458）。
2. H5 状态/二维码接口路径写为 `/api/h5/payments/...`（docs/v1/api/接口文档.md:517-592,3362-3374），与其余文档统一的 `/api/h5/orders/...` 不一致。

### docs/v1/security/支付安全增强方案.md
1. 阶段2 ticket 方案要求以 ticket 参数调用 `/api/h5/orders/{orderNo}/status`（docs/v1/security/支付安全增强方案.md:230-320），但 API/用户故事均只定义 `X-Access-Token`。
2. 建议在 `payment_record` 增加 `version` 列实现乐观锁（docs/v1/security/支付安全增强方案.md:190-215），数据库设计未包含此字段。

### docs/v1/security/OAuth安全指南.md
1. 回调路径示例为 `/api/auth/callback/wechat-mp`（docs/v1/security/OAuth安全指南.md:70-133），与统一的 `/api/auth/callback` 不符。
2. `authorize` 示例返回 JSON URL（docs/v1/security/OAuth安全指南.md:42-79），而现行流程要求直接 302 跳转。

---

## 第五层：实施指南

### docs/v1/guides/dev-AI辅助敏捷开发计划.md
1. Stage 3/4 仍以智能匹配为核心（docs/v1/guides/dev-AI辅助敏捷开发计划.md:44,823-962,1454）。
2. 多处仍使用 `bind_method=dynamic_qrcode`（docs/v1/guides/dev-AI辅助敏捷开发计划.md:678-730）。

### docs/v1/guides/dev-Stage1-支付闭环实施指南.md
1. H5 绑定页路由写为 `/bind/:orderNo`（docs/v1/guides/dev-Stage1-支付闭环实施指南.md:154-186），与统一路由 `/bind-planet` 不符。
2. 订单状态响应示例包含 `bindingUrl` 字段（docs/v1/guides/dev-Stage1-支付闭环实施指南.md:200-218），API 文档未定义。

### docs/v1/guides/dev-开发前准备清单.md
1. RabbitMQ 队列仍包含 `match.smart`（docs/v1/guides/dev-开发前准备清单.md:608）。
2. Stage 描述仍提“智能匹配算法 / attach 携带 planet_user_id”（docs/v1/guides/dev-开发前准备清单.md:1552-1582）。

### docs/v1/guides/dev-缓存策略与性能优化.md
1. “数据冗余”方案假设 `camp_member` 表存在诸如 `planet_user_name/order_no` 等字段（docs/v1/guides/dev-缓存策略与性能优化.md:176-206），与当前 DB 结构不符。
2. SQL 示例引用不存在的 `camp_member.payment_record_id` 字段（docs/v1/guides/dev-缓存策略与性能优化.md:193-196）。

### docs/v1/guides/ops-监控指标体系.md
1. 指标仍跟踪“自动匹配成功率/匹配置信度平均值”（docs/v1/guides/ops-监控指标体系.md:100-105）。
2. 指标公式将 `user_fill` 视为自动匹配（docs/v1/guides/ops-监控指标体系.md:102-103），与绑定方式定义不符。

---

## 附录

- 原始问题清单来源：临时记录 `/tmp/doc-issues.md`（本文件已整理归档）。
- 后续行动建议：优先清理“智能匹配”相关内容、统一状态/接口、补齐缺失枚举与路由描述。
