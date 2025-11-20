# Repository Guidelines

## Project Structure & Module Organization
This monorepo hosts the automation API under `zsxq-api/` and the Vue console under `zsxq-web/`. The API keeps configs, routes, and services inside `src/`, while Jest unit and integration suites live in `__tests__/unit` and `__tests__/integration`. The web client stores feature modules under `src/api`, `views`, and `utils`, with shared UI in PascalCase `.vue` files. Docs live in `docs/`, assets in `static/`, and historical context in `mettings/` plus `prompts/`.

## Build, Test, and Development Commands
- `cd zsxq-api && npm install && npm run dev`: start Express with hot reload on `localhost:3013`.
- `npm test` / `npm run test:unit` / `npm run test:integration`: run Jest suites; prefer scoped scripts when touching a single layer.
- `npm run lint` and `npm run format`: keep ESLint and Prettier aligned in both workspaces.
- `cd zsxq-web && npm install && npm run dev`: boot the Vite dev server; use `npm run build` for production bundles.

## Coding Style & Naming Conventions
Prettier enforces two-space indentation, single quotes, semicolons, and LF endings; run the formatter before opening a PR. Backend modules use verb-first helpers in files named `*.service.js`, `*.controller.js`, or `*.middleware.js`. Vue components must stay in PascalCase, use `<script setup>`, and order imports as Vue core, third-party UI, then local modules.

## Testing Guidelines
Jest drives API coverage with thresholds of 50% branches and 80% for other metrics; mirror the `*.unit.test.js` and `*.integration.test.js` naming in the appropriate `__tests__` folder. Vitest with Happy DOM covers the web client, with specs either in `src/__tests__/` or colocated as `Component.test.js`. Use `npm run test:coverage` before merging and execute targeted suites (`npm run test:integration`, `npm run test:ui`) when editing outbound clients or interactive flows.

## Commit & Pull Request Guidelines
Follow Conventional Commits (`feat:`, `fix:`, `docs:`) with optional scopes such as `feat(api): generate refund list`, keeping subjects under 72 characters. Pull requests must explain intent, link issues or product docs, list local test commands, and include before/after screenshots for UI changes. Confirm linting, tests, and formatting locally, and mention any coverage or configuration impact (PM2 scripts, `.env` keys) in the description.

## Security & Configuration Tips
Copy `.env.example` to `.env` in `zsxq-api/` and keep actual secrets out of version control. Align rate limiting and timeout settings with production defaults before merging. Update RBAC policies and Swagger specs in `zsxq-api/src/config/` whenever you add or adjust endpoints so client teams stay in sync.
