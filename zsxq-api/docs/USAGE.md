# 使用指南

本文档提供 zsxq-api 的完整使用说明，从配置到测试。

## 前置条件

- 拥有知识星球账号并加入目标星球
- 浏览器安装开发者工具（Chrome/Firefox/Edge）

## 第一步：获取知识星球 API 参数

### 1. 登录知识星球

访问 https://wx.zsxq.com/ 并登录您的账号

### 2. 打开浏览器开发者工具

- **Windows/Linux**: 按 `F12` 或 `Ctrl+Shift+I`
- **Mac**: 按 `Cmd+Option+I`

### 3. 切换到 Network 标签

在开发者工具中找到并点击 "Network"（网络）标签

### 4. 刷新页面

按 `F5` 或点击浏览器刷新按钮

### 5. 找到 API 请求

在 Network 列表中找到任意一个 `api.zsxq.com` 的请求，例如：
- `checkins`
- `groups`
- `topics`

### 6. 复制 Request Headers

点击请求，在右侧面板中找到 "Request Headers"，复制以下字段：

```
x-timestamp: 1730000000000
authorization: Bearer XXXXXXXXXXXXXXXXXXXXXXXX
x-signature: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 7. 获取星球 ID

在浏览器地址栏中找到星球 ID：
```
https://wx.zsxq.com/dweb2/index/group/15555411412112
                                      ^^^^^^^^^^^^^^
                                      这就是星球 ID
```

## 第二步：配置环境变量

### 1. 创建 .env 文件

在 `zsxq-api` 目录下复制示例文件：

```bash
cp .env.example .env
```

### 2. 编辑 .env 文件

使用文本编辑器打开 `.env`，填入真实参数：

```env
PORT=3013
NODE_ENV=development

# 知识星球 API 配置
ZSXQ_GROUP_ID=15555411412112
ZSXQ_X_TIMESTAMP=1730000000000
ZSXQ_AUTHORIZATION=Bearer XXXXXXXXXXXXXXXXXXXXXXXX
ZSXQ_X_SIGNATURE=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**重要提示**:
- `ZSXQ_X_TIMESTAMP` 必须是数字，不要加引号
- `ZSXQ_AUTHORIZATION` 必须包含 `Bearer ` 前缀
- 参数区分大小写

## 第三步：启动服务

### 开发环境（推荐）

```bash
npm run dev
```

启动后会自动监听文件变化并重启

### 生产环境

```bash
npm start
```

### 使用 PM2（生产部署）

```bash
npm run pm2:start    # 启动
npm run pm2:stop     # 停止
npm run pm2:restart  # 重启
npm run pm2:logs     # 查看日志
```

## 第四步：测试 API

### 1. 健康检查

```bash
curl http://localhost:3013/health
```

预期响应：
```json
{
  "code": 200,
  "message": "服务运行正常",
  "data": { ... }
}
```

### 2. 获取训练营列表

```bash
# 获取已结束的训练营
curl "http://localhost:3013/api/camps?scope=over&count=10"

# 获取进行中的训练营
curl "http://localhost:3013/api/camps?scope=ongoing&count=10"
```

预期响应：
```json
{
  "code": 200,
  "message": "成功获取 10 个训练营",
  "data": [
    {
      "checkin_id": 12345,
      "title": "AI 编程训练营 第1期",
      "checkin_days": 7,
      "status": "over",
      "joined_count": 99,
      "expiration_time": "2025-11-01T00:00:00.000Z"
    }
  ]
}
```

### 3. 生成退款名单

先从训练营列表中获取 `checkin_id`，然后：

```bash
curl -X POST "http://localhost:3013/api/camps/12345/refund-list" \
  -H "Content-Type: application/json" \
  -d '{"required_days": 7}'
```

预期响应：
```json
{
  "code": 200,
  "message": "退款名单生成成功",
  "data": {
    "refund_list": [ ... ],
    "statistics": {
      "total_count": 99,
      "qualified_count": 85,
      "unqualified_count": 14,
      "qualified_rate": 85.86,
      "qualified_names": "..."
    }
  }
}
```

### 4. 导出文本格式

```bash
curl "http://localhost:3013/api/camps/12345/refund-list/text?required_days=7"
```

预期响应：纯文本格式的退款名单

## 常见问题排查

### 1. Cookie 过期

**症状**:
```json
{
  "code": 403,
  "message": "知识星球 Cookie 已过期，请更新配置"
}
```

**解决方案**:
- 重新按照"第一步"获取最新的 Cookie 参数
- 更新 `.env` 文件
- 重启服务

### 2. 缺少环境变量

**症状**:
```
Error: 缺少必需的环境变量: ZSXQ_GROUP_ID, ZSXQ_AUTHORIZATION
```

**解决方案**:
- 检查 `.env` 文件是否存在
- 确认所有必需参数都已填写
- 检查参数名称拼写是否正确

### 3. 端口占用

**症状**:
```
Error: listen EADDRINUSE: address already in use :::3013
```

**解决方案**:
```bash
# 查找占用端口的进程
lsof -i :3013

# 杀死进程
kill -9 <PID>

# 或者修改 .env 中的 PORT
PORT=3014
```

### 4. 训练营无打卡数据

**症状**:
```json
{
  "refund_list": [],
  "statistics": {
    "total_count": 0,
    ...
  }
}
```

**可能原因**:
- 训练营 ID 错误
- 训练营尚未开始或刚创建
- Cookie 对应的账号无权访问该训练营

## 日志查看

### 控制台日志

开发环境下，日志会直接输出到控制台

### 文件日志

生产环境下，日志保存在 `logs/` 目录：

```bash
# 查看所有日志
tail -f logs/combined-2025-10-27.log

# 查看错误日志
tail -f logs/error-2025-10-27.log

# PM2 日志
npm run pm2:logs
```

## 使用技巧

### 1. 批量处理多个训练营

创建脚本 `batch-export.sh`：

```bash
#!/bin/bash

# 训练营 ID 列表
CAMP_IDS=(12345 12346 12347)

for id in "${CAMP_IDS[@]}"; do
  echo "处理训练营: $id"
  curl -X POST "http://localhost:3013/api/camps/$id/refund-list" \
    -H "Content-Type: application/json" \
    -d '{"required_days": 7}' \
    -o "refund-$id.json"
done
```

### 2. 定时同步数据

使用 crontab 定时执行：

```bash
# 每天凌晨 2 点生成退款名单
0 2 * * * curl -X POST "http://localhost:3013/api/camps/12345/refund-list" -d '{"required_days": 7}'
```

### 3. 集成到前端

在 Vue/React 中使用：

```javascript
// 获取训练营列表
const response = await fetch('http://localhost:3013/api/camps?scope=over');
const { data } = await response.json();

// 生成退款名单
const result = await fetch(`http://localhost:3013/api/camps/${id}/refund-list`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ required_days: 7 })
});
```

## 下一步

- [ ] 配置真实的知识星球 Cookie
- [ ] 测试获取训练营列表
- [ ] 测试生成退款名单
- [ ] 了解前端开发（zsxq-web）

需要帮助？请查看 `README.md` 或提交 Issue。
