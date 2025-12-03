# Repository Guidelines

## ⚠️ IMPORTANT: v0 版本已废弃

**此文件内容适用于已废弃的 v0 版本 (Node.js + Express)，仅供参考。**

- **当前开发版本**: v1 (Java + Spring Boot + PostgreSQL)
- **废弃目录**: `zsxq-api/`, `zsxq-web/` - 不再维护和开发
- **v1 开发指南**: 请参考 `CLAUDE.md` 和 `docs/v1/` 目录
- **禁止事项**: ❌ 不要修改或参考 v0 代码进行新功能开发

---

## v0 Project Structure & Module Organization (已废弃)

> 以下内容仅供参考，了解历史架构。

This monorepo splits the Express automation API under `zsxq-api/` and the Vue 3 console under `zsxq-web/`. The API keeps configs, routes, and services inside `src/`, with Jest suites in `__tests__/unit` and `__tests__/integration`. Front-end features live in `zsxq-web/src/api`, `views`, and `utils`, with shared UI in PascalCase `.vue` components. Reference docs belong in `docs/`, static assets in `static/`, and historical research or prompt notes in `mettings/` and `prompts/`.

## v0 Build, Test, and Development Commands (已废弃)
- `cd zsxq-api && npm install && npm run dev`: start the Express server with nodemon on `localhost:3013`.
- `cd zsxq-web && npm install && npm run dev`: boot the Vite dev server for the console; `npm run build` prepares production bundles.
- `npm test`, `npm run test:unit`, `npm run test:integration`: execute Jest suites from the repo root; choose the scoped script that matches the layer you changed.
- `npm run lint` / `npm run format`: run ESLint and Prettier in each workspace before sending a PR.

## v0 Coding Style & Naming Conventions (已废弃)
Prettier enforces two-space indentation, single quotes, semicolons, and LF endings—run `npm run format` after sizeable edits. Backend helpers follow verb-first filenames such as `calculate-refund.service.js`, `issue-refund.controller.js`, and `auth.middleware.js`. Vue SFCs stay in PascalCase, use `<script setup>`, and order imports as Vue core, third-party UI, then local modules.

## v0 Testing Guidelines (已废弃)
Jest owns the API coverage with thresholds of ≥50% branches and ≥80% statements/functions/lines; name suites `*.unit.test.js` or `*.integration.test.js` under the matching `__tests__` folder. Vitest with Happy DOM covers the Vue client via `npm run test:ui`, with colocated specs like `RefundWidget.test.js` or files inside `src/__tests__/`. Run `npm run test:coverage` ahead of merges and prefer targeted commands (`npm run test:integration`, etc.) when touching a single layer.

## Commit & Pull Request Guidelines (通用规范)
Use Conventional Commits (`feat:`, `fix:`, `docs:`) with optional scopes (`feat(api): generate refund list`) and limit subjects to 72 characters. Pull requests must state intent, link issues or product notes, list local test commands, and attach before/after screenshots for UI changes. Confirm lint, format, and coverage locally, and call out any configuration or dependency updates in the description.

## v0 Security & Configuration Tips (已废弃)
Copy `zsxq-api/.env.example` to `.env`, never commit secrets, and align rate limits/timeouts with production values. When touching roles or endpoints, update RBAC policies plus Swagger files in `zsxq-api/src/config/` so downstream clients stay consistent.
