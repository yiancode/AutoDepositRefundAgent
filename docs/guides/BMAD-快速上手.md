# BMAD 快速上手指南（5分钟入门）

> 如果你只有5分钟，看这份指南就够了！

---

## 第一步：确认环境（30秒）

打开终端，执行：

```bash
cd /Users/stinglong/code/github/AutoDepositRefundAgent
ls .bmad/bmm/agents/
```

看到 `dev.md`、`sm.md`、`quick-flow-solo-dev.md` 等文件就说明 BMAD 已安装。

---

## 第二步：选择开发方式（1分钟）

### 🚀 推荐方式：直接使用AI提示词

本项目已经准备好了完整的AI提示词，**无需使用Agent**，直接复制粘贴即可！

```bash
# 打开任务计划文档
open docs/v1/guides/dev-AI辅助敏捷开发计划.md
```

---

## 第三步：开始开发（3分钟）

### 示例：执行 Stage 0 - 任务 0.1

#### 1. 启动 Claude Code

```bash
cd /Users/stinglong/code/github/AutoDepositRefundAgent
claude
```

#### 2. 复制下面的提示词，直接粘贴到 Claude Code：

```markdown
我需要创建一个 Spring Boot 3.2+ 的后端项目骨架，请帮我完成以下任务：

【项目要求】
- 项目名称：camp-backend
- 基础包名：com.camp
- 端口：8080
- Java 版本：17
- 构建工具：Gradle
- 项目目录：在当前项目根目录下创建 backend/ 文件夹

【依赖清单】
1. Spring Boot Starter Web
2. Spring Boot Starter Validation
3. MyBatis Plus 3.5.5+
4. PostgreSQL 驱动
5. Redis Spring Boot Starter
6. Lombok
7. Knife4j 4.x（API 文档）
8. Hutool（工具类）

【目录结构】
backend/
├── build.gradle
├── settings.gradle
├── src/main/java/com/camp/
│   ├── CampApplication.java
│   ├── config/
│   │   ├── MybatisPlusConfig.java
│   │   ├── RedisConfig.java
│   │   ├── Knife4jConfig.java
│   │   └── CorsConfig.java
│   ├── common/
│   │   ├── Result.java
│   │   ├── ResultCode.java
│   │   ├── BusinessException.java
│   │   └── GlobalExceptionHandler.java
│   └── controller/
│       └── HealthController.java
├── src/main/resources/
│   └── application.yml

【统一响应格式】
{
  "code": 200,
  "message": "成功",
  "data": {},
  "timestamp": 1234567890
}

【验收标准】
1. 运行 ./gradlew bootRun 成功启动
2. 访问 http://localhost:8080/doc.html 显示 Knife4j 文档
3. 访问 http://localhost:8080/api/health 返回成功

请生成完整的代码，包括 build.gradle、application.yml 和所有 Java 文件。
```

#### 3. 等待 AI 生成代码

AI 会生成所有需要的文件。

#### 4. 验证结果

```bash
cd backend
./gradlew bootRun
```

在浏览器打开：http://localhost:8080/doc.html

---

## 第四步：继续下一个任务

在 `docs/v1/guides/dev-AI辅助敏捷开发计划.md` 中找到下一个任务的 AI 提示词，重复第三步。

---

## 可选：使用 BMAD Agent

如果你想使用 Agent 的交互式体验，复制下面的命令到 Claude Code：

### 快速开发 Agent（推荐）

```
请阅读并完全执行这个Agent文件的所有指令：
/Users/stinglong/code/github/AutoDepositRefundAgent/.bmad/bmm/agents/quick-flow-solo-dev.md
```

然后输入 `2` 或 `*quick-dev` 开始开发。

### Scrum Master Agent

```
请阅读并完全执行这个Agent文件的所有指令：
/Users/stinglong/code/github/AutoDepositRefundAgent/.bmad/bmm/agents/sm.md
```

然后输入 `2` 或 `*create-story` 创建Story。

---

## 常用文档路径

| 用途 | 路径 |
|-----|------|
| **任务计划（含AI提示词）** | `docs/v1/guides/dev-AI辅助敏捷开发计划.md` |
| 技术方案 | `docs/v1/design/技术方案.md` |
| 数据库设计 | `docs/v1/design/数据库设计.md` |
| API接口 | `docs/v1/api/接口文档.md` |
| 状态枚举 | `docs/v1/design/状态枚举定义.md` |

---

## 遇到问题？

查看完整教程：`docs/guides/BMAD-新手完全教程.md`

或在 Claude Code 中询问：
```
请帮我查看 BMAD 的使用方法，参考 docs/guides/BMAD-新手完全教程.md
```

---

**记住**：本项目最推荐的方式是**直接使用 `dev-AI辅助敏捷开发计划.md` 中的AI提示词**，因为它们已经针对每个任务做了详细优化！
