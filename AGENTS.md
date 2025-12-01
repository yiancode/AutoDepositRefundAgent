# Repository Guidelines

## Project Structure & Module Organization
This monorepo splits the Express automation API under `zsxq-api/` and the Vue 3 console under `zsxq-web/`. The API keeps configs, routes, and services inside `src/`, with Jest suites in `__tests__/unit` and `__tests__/integration`. Front-end features live in `zsxq-web/src/api`, `views`, and `utils`, with shared UI in PascalCase `.vue` components. Reference docs belong in `docs/`, static assets in `static/`, and historical research or prompt notes in `mettings/` and `prompts/`.

## Build, Test, and Development Commands
- `cd zsxq-api && npm install && npm run dev`: start the Express server with nodemon on `localhost:3013`.
- `cd zsxq-web && npm install && npm run dev`: boot the Vite dev server for the console; `npm run build` prepares production bundles.
- `npm test`, `npm run test:unit`, `npm run test:integration`: execute Jest suites from the repo root; choose the scoped script that matches the layer you changed.
- `npm run lint` / `npm run format`: run ESLint and Prettier in each workspace before sending a PR.

## Coding Style & Naming Conventions
Prettier enforces two-space indentation, single quotes, semicolons, and LF endings—run `npm run format` after sizeable edits. Backend helpers follow verb-first filenames such as `calculate-refund.service.js`, `issue-refund.controller.js`, and `auth.middleware.js`. Vue SFCs stay in PascalCase, use `<script setup>`, and order imports as Vue core, third-party UI, then local modules.

## Testing Guidelines
Jest owns the API coverage with thresholds of ≥50% branches and ≥80% statements/functions/lines; name suites `*.unit.test.js` or `*.integration.test.js` under the matching `__tests__` folder. Vitest with Happy DOM covers the Vue client via `npm run test:ui`, with colocated specs like `RefundWidget.test.js` or files inside `src/__tests__/`. Run `npm run test:coverage` ahead of merges and prefer targeted commands (`npm run test:integration`, etc.) when touching a single layer.

## Commit & Pull Request Guidelines
Use Conventional Commits (`feat:`, `fix:`, `docs:`) with optional scopes (`feat(api): generate refund list`) and limit subjects to 72 characters. Pull requests must state intent, link issues or product notes, list local test commands, and attach before/after screenshots for UI changes. Confirm lint, format, and coverage locally, and call out any `.env`, PM2, or Swagger updates in the description.

## Security & Configuration Tips
Copy `zsxq-api/.env.example` to `.env`, never commit secrets, and align rate limits/timeouts with production values. When touching roles or endpoints, update RBAC policies plus Swagger files in `zsxq-api/src/config/` so downstream clients stay consistent.
