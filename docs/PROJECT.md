# Project — Construction

## Vision

A web application for managing construction projects — crews, tasks, documents,
schedules, and reporting — in one dashboard. This repo currently contains the
foundation (auth + app shell); feature screens are built on top incrementally.

## Scope (current)

- **In:** authentication (login), app shell / routing, protected dashboard,
  AI-first documentation & tracking workflow.
- **Next (backlog):** user registration, password reset, then the domain
  features (projects, tasks, documents, scheduling, reports).
- **Out (for now):** the diagram's optional infra — Hangfire, SignalR, ImageSharp,
  ClosedXML, Redis, blob storage — added when a feature needs them.

## Stack

| Layer     | Tech |
| --------- | ---- |
| Frontend  | React 19, TypeScript, Vite 8, Tailwind CSS v4, PrimeReact + PrimeIcons, React Router 7, TanStack Query 5, Axios, Zustand, React Hook Form, Zod, Day.js |
| Backend   | .NET 10, ASP.NET Core Web API (MVC Controllers), EF Core (SQL Server), ASP.NET Core Identity, JWT bearer, FluentValidation, Serilog, OpenAPI + Scalar |
| Database  | SQL Server — LocalDB (`(localdb)\MSSQLLocalDB`, db `Construction`) in dev |
| Tooling   | oxlint, dotnet-ef, Vite dev proxy (`/api` → `:5080`) |

## Personas

- **Site admin / project manager** — the seeded demo user; manages projects and
  people. Primary user of the dashboard.
- **Field crew** (future) — narrow mobile-first task views.

## Glossary

- **Demo user** — `admin@construction.local` / `Passw0rd!`, seeded in Development.
- **Brand green** — `--color-brand` `#0d6a54` (buttons, headings, focus rings).
- **Tracker** — one of `docs/FEATURES.md` / `docs/BUGS.md`.

## Repo layout

- `frontend/` — React/TS/Vite SPA
- `backend/` — .NET 10 solution (`Construction.slnx`, `src/Construction.Api`)
- `docs/` — AI-first trackers & docs
- `.claude/` — workflow hooks

## How to run

See `README.md`. TL;DR: `dotnet run` in `backend/src/Construction.Api` (`:5080`),
`npm run dev` in `frontend/` (`:5173`).
