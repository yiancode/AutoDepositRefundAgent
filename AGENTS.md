# Repository Guidelines

## Project Structure & Module Organization
- `zsxq-api/`: Node.js + Express service for refund automation. `src/` stores config, routes, services; tests live in `__tests__/unit` and `__tests__/integration`, with coverage artifacts in `coverage/`.
- `zsxq-web/`: Vue 3 + Vite admin console. Key modules sit in `src/api`, `views`, `utils`, and shared UI components stay in PascalCase `.vue` files.
- `docs/`: Versioned product requirements (`v0`, `v0.1`, `v1`), deployment checklists, and technical plans—review before scoping features.
- `static/`: Shared assets (`images/`, `dataCases/`) for demos and documentation; avoid checking large binaries elsewhere.
- `mettings/`, `prompts/`: Meeting notes and prompt archives that capture context for roadmap decisions.

## Build, Test, and Development Commands
- **Backend dev**: `cd zsxq-api && npm install && npm run dev` to launch the API on `localhost:3013` with hot reload.
- **Backend test/lint**: `npm test`, `npm run test:unit`, `npm run test:integration`, and `npm run lint` keep Jest suites and ESLint rules green.
- **Frontend dev**: `cd zsxq-web && npm install && npm run dev` serves the Vue app via Vite’s default port.
- **Frontend build/test**: `npm run build`, `npm run test`, and `npm run lint` cover production bundles, Vitest suites, and lint/format passes.
- **Formatting**: `npm run format` in each workspace applies the Prettier rules baked into the repo.

## Coding Style & Naming Conventions
- Prettier enforces `tabWidth: 2`, `singleQuote: true`, `semi: true`, and `endOfLine: lf`; let the formatters run before committing.
- Backend modules follow `*.service.js`, `*.middleware.js`, and functions use verb-first names such as `generateRefundList`.
- Vue SFCs use PascalCase filenames (`RefundList.vue`) with `<script setup>`; group imports by origin (`vue`, third-party UI, local modules).
- Keep env-specific values behind helpers or config files—never embed group IDs, tokens, or URLs directly in components.

## Testing Guidelines
- Jest drives API coverage; keep global thresholds (`branches 50`, `functions/lines/statements ≥80`) by mirroring `*.unit.test.js` and `*.integration.test.js` naming inside `__tests__/`.
- Vitest runs with Happy DOM; store specs under `src/__tests__/` or alongside components as `*.test.js`, and review `npm run test:coverage` output before merging.
- Trigger targeted suites (`npm run test:integration`, `npm run test:ui`) whenever touching outbound API clients or interactive UI states.

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat:`, `fix:`, `docs:`) with optional scopes (`feat(api): generate refund list`) and subjects ≤72 characters.
- PRs should summarize intent, link issues or docs, include local test commands, and attach before/after screenshots for UI changes.
- Confirm lint, tests, and formatting succeed locally; note coverage deltas or follow-up tasks in the PR description when relevant.
- Call out configuration or deployment impacts (PM2 scripts, `.env` keys) so maintainers can rotate secrets and update pipelines.

## Configuration & Security Notes
- Copy `.env.example` to `.env` in `zsxq-api/` for local runs; never commit populated env files or sensitive logs from `logs/`.
- Align rate limiting and timeout settings with production defaults; coordinate tuning with operations to avoid throttling regressions.
- Update RBAC policies and Swagger docs under `zsxq-api/src/config/` whenever routes or response shapes change to keep clients in sync.
