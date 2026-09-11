# Conventions

## Per-task workflow (every session)

**Before starting**
1. Read the recent `docs/DEVELOPMENT_HISTORY.md` entries (the `UserPromptSubmit`
   hook injects the tail; open the file for anything older).
2. Check `docs/FEATURES.md` and `docs/BUGS.md` for the item you're touching.
3. For non-trivial work, read `docs/ARCHITECTURE.md` (patterns to reuse) and
   `docs/DECISIONS.md`.

**While building** — reuse the patterns in `docs/ARCHITECTURE.md`; don't invent a
second way to do something that already has one.

**Before finishing**
1. Update `docs/FEATURES.md` / `docs/BUGS.md` status (add/flip rows, next
   `FEAT-###` / `BUG-###`).
2. Add an ADR to `docs/DECISIONS.md` for any notable/again-arguable decision
   (`ADR-####`).
3. Append a `docs/DEVELOPMENT_HISTORY.md` entry (newest first) using the template
   in that file.
4. Run the gates below; they must pass.

## Quality gates

```
cd frontend && npm run build   # tsc -b + vite build
cd frontend && npm run lint    # oxlint
cd backend  && dotnet build
```

## Frontend

- TypeScript strict; use `import type { … }` for type-only imports
  (`verbatimModuleSyntax` is on).
- Feature-folder structure under `frontend/src/features/<area>/` — schema, api,
  hooks, components co-located.
- Forms: React Hook Form + `zodResolver`; every PrimeReact input inside a
  `<Controller>`; field errors as `<small className="text-[13px] text-red-600">`.
- Server state via TanStack Query; client/session state via zustand. The auth
  token lives only in `authStore`.
- Styling: Tailwind utilities in JSX with brand tokens (`bg-brand`, `text-brand`,
  `bg-brand-hover`, `text-accent`, `bg-page`). PrimeReact restyles go in the
  override block at the bottom of `frontend/src/index.css`, selectors scoped.
- Responsive: mobile-first; verify at 375 / 768 / 1024 / 1440 px; no horizontal
  scroll; use `min-h-dvh` for full-height panels; tap targets ≥ 44 px.

## Backend

- MVC Controllers (`[ApiController]`) organized in **feature folders** — each
  area (`Auth/`, `Onboarding/`, `Reference/`, `Projects/`, `Dashboard/`)
  contains its own `*Controller.cs`, `*Contracts.cs` (DTOs), and
  `*Validator.cs` files together, not split into type-based folders. See
  `docs/ARCHITECTURE.md` for the current per-area layering pattern (Clean
  Architecture pilot on Projects/Dashboard vs. the older flat pattern on
  Auth/Onboarding/Reference — ADR-0010).
- Validate request DTOs with FluentValidation `IValidator<T>` from DI —
  resolved automatically by the global `Common/FluentValidationFilter.cs`
  action filter, so no per-action validation code is needed. Map DTOs with
  each type's own static `From(...)` method (no Mapster — removed, see
  ADR-0010). Controller actions return `Results.X(...)` (`IResult`), never
  `ControllerBase.Ok(...)`/`ActionResult<T>` — mixing them breaks enum JSON
  serialization (see ADR-0011).
- EF Core: change `AppDbContext` (lives in
  `Construction.Infrastructure/Persistence/`), then
  `dotnet ef migrations add <Name> --project
  src/Construction.Infrastructure/Construction.Infrastructure.csproj
  --startup-project src/Construction.Api/Construction.Api.csproj --output-dir
  Persistence/Migrations`. Never edit an applied migration.
- Config/secrets: no real secrets in `appsettings*.json`; dev placeholders only.
- Serilog for logging; no `Console.WriteLine`.

## IDs & naming

- `FEAT-###`, `BUG-###`, `ADR-####` — zero-padded, never reused.
- Branches (when used): `feat/feat-003-login-redesign`, `fix/bug-001-…`.
- Commit subject: `<area>: <summary> (FEAT-003 / BUG-001)`.
