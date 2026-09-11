# CLAUDE.md — operating rules for this repo

**Construction** — a full-stack web app. React/TS/Vite SPA in `frontend/`, .NET 10
Web API in `backend/`. See `docs/PROJECT.md` for vision & stack, `README.md` to
run it.

## AI-first workflow — follow every session

This project keeps its full history and state in `docs/`. A `UserPromptSubmit`
hook (`.claude/hooks/ai-context.mjs`) auto-injects a digest of `FEATURES.md`,
`BUGS.md`, and recent `DEVELOPMENT_HISTORY.md` into every prompt — treat it as
required reading, not noise.

**Before doing work**
1. Read the injected tracking digest. Open `docs/DEVELOPMENT_HISTORY.md` in full
   if the task touches anything from a previous session.
2. Check `docs/FEATURES.md` / `docs/BUGS.md` for the relevant `FEAT-###` /
   `BUG-###`.
3. For non-trivial work read `docs/ARCHITECTURE.md` (**patterns to reuse**) and
   `docs/DECISIONS.md`. Prefer existing patterns over new ones.

**After any code change (same turn)**
1. Update `docs/FEATURES.md` and/or `docs/BUGS.md` (status, new rows with the next
   ID).
2. Add an ADR to `docs/DECISIONS.md` for any notable decision.
3. Append a `docs/DEVELOPMENT_HISTORY.md` entry (newest first) — use the template
   in that file: refs, what, why, files, verification, follow-ups.
4. Run the quality gates and make them pass (from the repo root):
   `cd frontend && npm run build && npm run lint` · `cd backend && dotnet build`.

Full coding standards: `docs/CONVENTIONS.md`.

## Quick facts

- Layout: `frontend/` (Vite SPA), `backend/` (.NET solution), `docs/` (trackers),
  `.claude/` (hooks). Run npm/dotnet commands from inside `frontend/` / `backend/`.
- Dev servers: API `dotnet run` in `backend/src/Construction.Api` → `:5080`;
  web `npm run dev` in `frontend/` → `:5173` (proxies `/api` → `:5080`).
- Seeded demo user (Development): `admin@construction.local` / `Passw0rd!`.
- Auth token lives only in `frontend/src/stores/authStore.ts` (zustand + persist).
- Brand palette tokens live in `frontend/src/index.css` `@theme`.
- `.claude/settings.local.json` is gitignored and local-only.
