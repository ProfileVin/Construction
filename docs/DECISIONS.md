# Architecture Decision Records

Append-only. Each ADR: Context · Decision · Consequences. Supersede rather than
edit — add a new ADR and mark the old one `Superseded by ADR-####`.

---

## ADR-0001 — Repo layout: SPA at root, API in `server/`
**Status:** Superseded by ADR-0006 (2026-09-09)
**Context:** Single-repo full-stack app; user asked for the frontend at the repo
root.
**Decision:** Vite/React app lives at the repository root; the .NET solution lives
under `server/` (`server/Construction.slnx`,
`server/src/Construction.Api`). Vite dev server proxies `/api` → `http://localhost:5080`.
**Consequences:** Root tooling (`package.json`, `tsconfig`, `oxlint`) is
unambiguous. `.gitignore` carries both Node and .NET sections. Backend commands
run from `server/…`.

## ADR-0002 — Auth: ASP.NET Core Identity + JWT bearer, token in localStorage
**Status:** Accepted (2026-09-09)
**Context:** Need email/password login for a SPA + API.
**Decision:** `IdentityCore<ApplicationUser>` + `SignInManager` for password
checks; issue a symmetric-key (HS256) JWT via `JwtTokenService`. The SPA stores
`{ token, user }` in `localStorage` through zustand `persist`
(key `construction-auth`); axios attaches the bearer token and clears auth on 401.
**Consequences:** Simple and stateless server-side. localStorage is XSS-exposed —
acceptable for now; revisit with httpOnly refresh cookies if requirements harden.
`Jwt:Key` in `appsettings.json` is a dev placeholder and must be replaced via
secret store outside local.

## ADR-0003 — Styling: Tailwind v4 + PrimeReact (Lara Light Teal)
**Status:** Accepted (2026-09-09)
**Context:** Stack diagram specifies Tailwind and PrimeReact together.
**Decision:** Tailwind v4 via `@tailwindcss/vite`. In `src/index.css` the
PrimeReact theme + core + icons CSS are `@import`ed **before**
`@import "tailwindcss"` so Tailwind utilities win specificity ties. Brand palette
is defined as `@theme` tokens. PrimeReact widget restyling is plain CSS at the
bottom of `index.css`, with selectors scoped to avoid hitting unrelated widgets
(e.g. `.p-button:not(.p-button-outlined):not(.p-button-text)`).
**Consequences:** One stylesheet owns theming. If Tailwind Preflight ever breaks a
PrimeReact widget, scope Preflight out or drop to Tailwind v3
`corePlugins.preflight = false`.

## ADR-0004 — Dev database: SQL Server LocalDB, auto-migrate + seed (Development only)
**Status:** Accepted (2026-09-09)
**Context:** No Docker on the dev machine; LocalDB (`MSSQLLocalDB`) is available.
**Decision:** Dev connection string targets `(localdb)\MSSQLLocalDB;Database=Construction`.
On startup **in Development only**, `DbSeeder` runs `Database.MigrateAsync()` and
seeds the demo user. Production applies migrations out-of-band.
**Consequences:** Zero-setup local run. Non-dev environments need an explicit
migration step and a real connection string + JWT key.

## ADR-0005 — AI-first workflow: `docs/` trackers + enforcement hooks
**Status:** Accepted (2026-09-09)
**Context:** User wants AI-first engineering with feature/bug tracking and a full
project history that every future prompt is evaluated against.
**Decision:** Markdown trackers in `docs/` (`FEATURES`, `BUGS`,
`DEVELOPMENT_HISTORY`, plus `PROJECT`, `ARCHITECTURE`, `DECISIONS`,
`CONVENTIONS`). A committed `.claude/settings.json` registers a `UserPromptSubmit`
hook (`.claude/hooks/ai-context.mjs`) that injects a FEATURES/BUGS/recent-history
digest into every prompt, and a non-blocking `Stop` hook that reminds to update
the trackers. `CLAUDE.md` codifies the read-first / update-after checklist.
**Consequences:** Every session sees current state without being told. Hook
scripts must never exit non-zero. History file grows over time — the hook injects
only the tail; full file is read on demand. Contributors not using this harness
still get the docs, just not the auto-injection.

## ADR-0006 — Repo layout: `frontend/` + `backend/` sibling folders
**Status:** Accepted (2026-09-09) — supersedes ADR-0001
**Context:** With the SPA at the repo root, root tooling (`package.json`,
`node_modules`, `tsconfig`, `.env`) sat alongside `docs/` and `.claude/` and
visually competed with the backend. User asked to split the project into
`backend/` and `frontend/` folders.
**Decision:** The Vite/React app moved to `frontend/` (all its config, `src/`,
`public/`, `.env*`). The .NET solution folder `server/` was renamed to `backend/`
(internal `Construction.slnx` + `src/Construction.Api` layout unchanged). `docs/`,
`.claude/`, `.gitignore`, `README.md`, `CLAUDE.md` stay at the root. npm and
dotnet commands are run from inside `frontend/` / `backend/`; no root
`package.json`. The AI-context hook still resolves `docs/` from the repo root, so
no hook change was needed.
**Consequences:** Clear two-app separation. All docs/run instructions updated to
`frontend/…` / `backend/…`. The Vite dev proxy (`/api` → `:5080`) and every source
path inside each app are unchanged. `.gitignore` patterns are non-anchored so they
keep working at the new depth (`backend/**/logs/` renamed from `server/**/logs/`).

## ADR-0007 — Password policy: one source of truth, enforced in three places
**Status:** Accepted (2026-09-09)
**Context:** The sign-up mockup (FEAT-004) shows a live checklist — lowercase,
uppercase, number, special character, 8-char minimum. The initial scaffold's
Identity options only required length 8 (`RequireNonAlphanumeric = false`).
**Decision:** The five rules are the policy everywhere:
- **Frontend** — `passwordChecks` array in `frontend/src/features/auth/auth.schema.ts`
  is the canonical list; `registerSchema` refines against `isPasswordStrong`, and
  `PasswordChecklist` renders the same array live.
- **API validation** — `RegisterRequestValidator` mirrors the rules with
  `.Matches(...)` for friendly per-field messages.
- **Identity** — `Program.cs` sets `RequireLowercase/Uppercase/Digit/NonAlphanumeric = true`,
  `RequiredLength = 8` as the final backstop; `CreateAsync` failures are returned
  as a `password` validation problem.
The seeded demo password `Passw0rd!` satisfies all five.
**Consequences:** Three restatements of the same rules must be kept in sync (change
the JS array + the validator + the Identity options together). In return, the user
sees consistent feedback at every layer and the DB can never hold a weak password.

## ADR-0008 — Onboarding: optional wizard, prefs on the user, deferrable Skip
**Status:** Accepted (2026-09-09)
**Context:** FEAT-006/007 mockups show a 3-step first-run flow (workspace
preferences → start mode → create first project) on the auth split layout.
**Decision:**
- **Not gated.** After login/register the user still lands on `/`. The dashboard
  shows a "Finish setting up" banner while `AuthUser.onboardingCompletedAt` is
  null (`selectNeedsOnboarding`). `/onboarding*` routes are plain
  `ProtectedRoute`s.
- **Skip defers** — it never writes `OnboardingCompletedAt`; only *Continue on the
  final step* (create project) marks completion. So Skip = "not now", and the
  banner persists.
- **Preferences live on `ApplicationUser`** (`MeasurementSystem`, `Currency`,
  `TimeZoneId`, `TemperatureUnit`, `ProjectStartMode`, `OnboardingCompletedAt`),
  returned in `UserDto` (via new `UserDto.From`) so login/register responses carry
  onboarding state with no extra `/me` round-trip. The SPA updates the store with
  `authStore.setUser` after each step.
- **Dropdown reference data comes from the API** (`GET /api/onboarding/options`,
  `GET /api/projects/options`). Timezones are generated once from
  `TimeZoneInfo.GetSystemTimeZones()` and converted to IANA ids
  (`TryConvertWindowsIdToIanaId`), formatted `(GMT+01:00) Area/City`. Currency
  list and enum labels are curated constants server-side.
- **`Project`** is a first-class entity (`ProjectType` / `ProjectStatus` enums
  stored as strings via `HasConversion<string>`); the onboarding "create project"
  step and a future full projects module share `POST /api/projects`.
**Consequences:** New enum values need adding in three spots (C# enum, the
`ProjectOptions` label list, and any FE display map). The unauth'd `/options`
endpoints leak only static reference data. Because Skip never completes, a user
can bypass onboarding forever — acceptable given "optional page".

## ADR-0009 — Main dashboard: sidebar shell, budget-as-columns, assignee-as-string
**Status:** Accepted (2026-09-11)
**Context:** FEAT-008 replaced the bare `DashboardPage` placeholder with the
mockup's real per-project dashboard (sidebar/topbar shell, Budget/Total Spent
cards, Assigned Tasks + Recent Log tables). No Task, Budget, or ActivityLog
concept existed anywhere in the backend beforehand.
**Decision:**
- **Budget lives as two columns on `Project`** (`BudgetTotal`, `TotalSpent`),
  not a separate entity — nothing else needs line items/categories this pass.
  Revisit (likely a derived rollup from a future `Expense`/`BudgetLineItem`
  table) when Budget & Finance becomes a real module.
- **`ProjectTask.AssigneeName` is a plain string**, not a reference to a
  `TeamMember`/`ApplicationUser` — no team-membership concept exists yet and
  Team is a stub page this pass. Revisit when Team is built out.
- **Task creation auto-inserts a matching `ActivityLogEntry`** (nullable
  `ProjectTaskId` FK) in the same `SaveChangesAsync()` call — the mockup shows
  log rows mirroring task-creation events 1:1, and this keeps the door open for
  other future log sources (status changes, etc.) without a schema change.
- **Sidebar/topbar shell (`AppShell`) is a new nested layout route** wrapping
  `ProtectedRoute`, replacing six flat individually-wrapped routes. Five nav
  destinations (Schedule, Task Log, Budget & Finance, Document, Team) render a
  generic `ComingSoonPage` stub rather than real features.
- **SQL Server "multiple cascade paths" gotcha:** `Project` cascade-deletes
  both `ProjectTask` and `ActivityLogEntry` directly, and `ProjectTask`
  cascade-deletes... no, *would* cascade/set-null `ActivityLogEntry` too via
  `ProjectTaskId` — SQL Server rejects this "diamond" (two cascading paths to
  the same table) at migration-apply time regardless of which specific action
  each path uses (`SetNull` counts the same as `Cascade`). Fixed by making the
  `ActivityLogEntry.ProjectTaskId` FK `DeleteBehavior.Restrict` (NO ACTION),
  leaving the direct `Project → ActivityLogEntry` cascade as the only path that
  actually cleans up log rows. **Pattern to reuse:** whenever a new entity has
  two FK paths back to the same ancestor and both would be cascading, make one
  of them `Restrict`.
**Consequences:** `Project` has no per-project currency — `BudgetSummaryCard`
formats using the logged-in user's `authStore.user.currency` (one
currency per user/company). A future multi-currency requirement would need
`Project.Currency`. No `GET /api/projects/{id}` detail endpoint was added —
the dashboard resolves its selected project from the already-loaded
`GET /api/projects/` list (now carrying the two budget fields), which the
sidebar switcher needs loaded in full anyway.

## ADR-0010 — Backend: Clean Architecture pilot on Projects + Dashboard only
**Status:** Accepted (2026-09-11)
**Context:** An audit of the (then single flat) `Construction.Api` project
found the expected shape for that style: endpoint handlers injected
`AppDbContext`/`UserManager<ApplicationUser>` directly (no repository/service
abstraction — the clearest DIP violation), business rules lived inline in
handler bodies (`DashboardEndpoints.CreateTaskAsync` did validation + auth +
ownership-check + building two related entities + persistence + DTO mapping
in one method — SRP violation), entities were anemic (nothing stopped
`ProjectTask.Deadline < AssignedDate` at the entity level — only
`CreateProjectTaskRequestValidator` checked it, and `DbSeeder` bypassed that
entirely by constructing entities directly), and the "creating a task mirrors
an activity-log row" rule was independently duplicated between
`DashboardEndpoints` and `DbSeeder` (already drifted: seeder backdated
`OccurredAt`, the live endpoint didn't). No test project existed — the direct
EF Core/Identity coupling in static handler methods was why.
**Decision:**
- **Full Clean Architecture**, not a lighter service-layer-only cut: new
  `Construction.Domain` (zero deps) / `Construction.Application` (→ Domain
  only, framework/EF/HTTP-free) / `Construction.Infrastructure` (→ Domain +
  Application) projects, strict inward dependencies, thin endpoint handlers in
  `Construction.Api`.
- **Pilot scope is Projects + Dashboard only.** Auth/Onboarding/Reference keep
  injecting `AppDbContext`/`UserManager` directly — a deliberate, temporary,
  tracked inconsistency (see `docs/ARCHITECTURE.md` "Patterns to reuse", which
  documents both the old and new pattern side by side), not an oversight to
  "fix" opportunistically. `Construction.Api` keeps direct project references
  to both `Infrastructure` and `Domain` (not just `Application`) for exactly
  this reason.
- **Domain entities get private setters + static `Create(...)` factories**
  that enforce real invariants (e.g. `ProjectTask.Create` throws when
  `Deadline < AssignedDate`). `DbSeeder` now goes through the same factories
  (indirectly, via the Application services) as the live endpoints, so the
  drift the audit found structurally can't recur.
- **Application services take an explicit `string ownerId` parameter** — no
  ambient `ICurrentUser`/`IHttpContextAccessor` — so the same method is
  callable from an HTTP endpoint (`principal.GetUserId()`) and from `DbSeeder`
  (a known demo-user id, no `HttpContext`). `DashboardService.CreateTaskAsync`
  takes an optional `occurredAtUtc` for exactly this reason: `DbSeeder` needs
  backdated activity-log timestamps for realistic demo data, the live endpoint
  doesn't, and now both go through one implementation instead of two.
- **No FluentValidation dependency in Application.** Validators stay in
  `Construction.Api`, unchanged, validating the Api's existing request DTOs;
  the one real domain invariant (deadline ≥ assigned date) is enforced by
  `ProjectTask.Create` instead. Keeps Application genuinely framework-free
  without duplicating validation rules across two layers.
- **Application DTOs/commands are separate types from the Api's existing
  DTOs/requests**, even though the shapes mostly match — a rename inside
  Application for internal clarity must never silently change the wire shape,
  since minimal-API JSON binding won't warn about an unmatched renamed field.
  Cost is one `From()` mapping line per direction per endpoint.
- **Added `Construction.Application.Tests`** (xUnit, references Application +
  Domain only, no mocking library — small hand-rolled `List<T>`-backed fakes
  in `TestDoubles/`) — the main payoff of the split: Application is now
  unit-testable with zero EF Core/HTTP, and the regression-proof test
  (`DashboardServiceTests.CreateTaskAsync_ProducesExactlyOneMatchingActivityLogEntry`)
  directly encodes the invariant the audit found undertested.
- **Migrations were squashed and regenerated**, not hand-edited, when moving
  entities to their new namespaces. EF Core's model snapshot records each
  entity's CLR full name as a string literal; changing namespaces without
  updating those strings would make EF think old entities were deleted and new
  ones created, dropping and recreating every table. Given dev-only LocalDB
  with no production data and only 5 migrations total, squash-and-regenerate
  was cheaper and safer than a hand-edited diff. Use explicit `--project`/
  `--startup-project`/`--output-dir` flags going forward since `AppDbContext`
  now lives in a different project than the startup project (see
  `docs/ARCHITECTURE.md`).
- **Global enum-as-string JSON converter** moved to
  `Program.cs` (`ConfigureHttpJsonOptions`) instead of a
  `[JsonConverter(typeof(JsonStringEnumConverter<T>))]` attribute directly on
  each enum — Domain enums stay free of serialization concerns, and the
  contract (`type`/`status` as strings, not integers) is preserved
  wire-for-wire. Verified by inspecting raw JSON, not just UI rendering.
- **Removed the unused `Mapster` package reference** from `Construction.Api`
  (zero usages anywhere) as a small, separate, trivially-revertable cleanup.
**Consequences:** Auth/Onboarding/Reference now visibly follow a different,
older pattern than Projects/Dashboard — anyone touching those areas should
read `docs/ARCHITECTURE.md`'s "Patterns to reuse" first to know which one
applies, rather than assuming the newer pattern is universal. Migrating those
three areas to the new pattern is an explicit, tracked follow-up, not
required before this pilot could ship. The HTTP contract (routes, JSON field
names/casing, status codes) did not change at all — verified live against the
frontend built earlier this session.

## ADR-0011 — Backend: migrate all Minimal API endpoints to MVC Controllers
**Status:** Accepted (2026-09-12)
**Context:** The backend used ASP.NET Core Minimal APIs exclusively (`docs/CONVENTIONS.md`
documented this) — `*Endpoints.cs` static classes with `Map<Area>Endpoints`
extensions over `MapGroup`. The user asked why no `ControllerBase` classes
existed and, after confirming this was a deliberate (not accidental) choice,
asked to migrate to Controllers. This is a routing-layer decision, orthogonal
to ADR-0010's Clean Architecture pilot: Projects/Dashboard's
`IProjectService`/`IDashboardService` internals are untouched, only how their
thin endpoints are declared changed.
**Decision:**
- **Full migration, all 5 areas** (Auth, Onboarding, Reference, Projects,
  Dashboard), not just the ADR-0010 pilot scope — routing style and layering
  are independent axes, and converting Auth/Onboarding/Reference to
  Controllers is mechanical (relocate handler bodies into actions) with no
  other architecture change, so there was no reason to leave them behind.
- **Validation via one global `FluentValidationFilter`**
  (`Common/FluentValidationFilter.cs`, an `IAsyncActionFilter` registered
  once via `AddControllers(o => o.Filters.Add<FluentValidationFilter>())`),
  not per-action inline `IValidator<T>.ValidateAsync()` calls. It resolves
  `IValidator<>` for whichever action argument has one registered (via
  `MakeGenericType` + FluentValidation's type-erased
  `IValidator.ValidateAsync(new ValidationContext<object>(argument))`
  pattern) and short-circuits with a 400 shaped to match what
  `Results.ValidationProblem(...)` already produced. This is strictly less
  boilerplate than the Minimal-API predecessor
  (`Common/ValidationFilter<T>`, which needed
  `.AddEndpointFilter<ValidationFilter<TRequest>>()` per route) and also
  eliminates the inline-validate-then-check duplication that existed in
  `AuthEndpoints`/`OnboardingEndpoints` (5 occurrences). Verified live against
  every validator including cross-field (`CreateProjectTaskRequestValidator`'s
  `Deadline >= AssignedDate`) and async DB-backed
  (`OnboardingValidators`' `MustAsync` timezone/currency checks) rules — both
  work correctly through the type-erased path.
- **Every controller action returns `Microsoft.AspNetCore.Http.IResult` via
  `Results.X(...)` — never `ControllerBase.Ok(...)`/`ActionResult<T>`.** This
  was not a style preference but a hard requirement discovered mid-migration:
  ASP.NET Core has **two separate JSON options pipelines**.
  `IResult`-based results (`Results.Ok`, `Results.ValidationProblem`, etc.)
  serialize through `Microsoft.AspNetCore.Http.Json.JsonOptions` (configured
  via `ConfigureHttpJsonOptions`) regardless of whether they're returned from
  a Minimal API delegate or a controller action — this dual support is what
  .NET 7's "unify minimal APIs and controllers" work added. `ControllerBase`'s
  own `Ok(...)`/`ActionResult<T>` helpers produce `ObjectResult`, which
  serializes through a *different* `Microsoft.AspNetCore.Mvc.JsonOptions`
  instance. Standardizing on `Results.X(...)` throughout meant the existing
  `ConfigureHttpJsonOptions` enum-converter kept working for every action's
  *output* with zero changes, and action bodies stayed near-identical to the
  pre-migration handler bodies (literally the same `return Results.Ok(dto);`,
  just relocated into a method).
- **Discovered live, not anticipated in the plan: the same two-pipelines
  problem exists on the *input* side.** `[FromBody]` model binding for
  controller actions binds through `Microsoft.AspNetCore.Mvc.JsonOptions`
  (a third, separate instance from both of the above), independent of what
  the action returns. `POST /api/projects` with `"type":"Commercial"` failed
  to deserialize (400, "The JSON value could not be converted to
  ...CreateProjectRequest") even with `ConfigureHttpJsonOptions` already
  configured, because the *input* path never consulted it. **Fix:** also
  chain `.AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new
  JsonStringEnumConverter()))` onto `services.AddControllers(...)`. Both
  configurations are needed; each governs a different direction. Re-verified
  live afterward (create + list round-trip with `type`/`status` intact).
- `Common/ClaimsPrincipalExtensions.GetUserId()` needed no changes — it's a
  plain extension method on `ClaimsPrincipal`, called as `User.GetUserId()`
  from a controller (`ControllerBase.User`) exactly as it was called as
  `principal.GetUserId()` from a Minimal API handler parameter.
  Auth/Onboarding's inline `FindFirstValue(ClaimTypes.NameIdentifier)` calls
  were swapped for `User.GetUserId()` while those files were open anyway,
  closing a small duplication note from ADR-0010's own writeup.
- The old `Common/ValidationFilter<T>` (`IEndpointFilter`) is deleted — fully
  dead once no Minimal API endpoint remains to apply it.
**Consequences:** The Clean-Architecture-vs-flat distinction between
Projects/Dashboard and Auth/Onboarding/Reference (ADR-0010) is unaffected and
still needs to be read separately from this ADR — routing style is now
uniform across all 5 areas, but layering is not. Anyone adding a new
controller action must return `Results.X(...)`, never the `ControllerBase`
result helpers, or risk silently losing enum-string serialization in
whichever direction uses the wrong path — this is the single most
non-obvious trap this ADR leaves behind, and is called out explicitly in
`docs/ARCHITECTURE.md`. The HTTP contract (routes, JSON field names/casing,
status codes, response bodies) is unchanged — verified live across all 5
areas including the input-serialization bug found and fixed during this
migration.

## ADR-0012 — Remove the `Construction.Application.Tests` project
**Status:** Accepted (2026-09-12)
**Context:** ADR-0010 added `Construction.Application.Tests` (xUnit, 9 tests,
hand-rolled in-memory fakes) as what it called "the main payoff" of the Clean
Architecture pilot — proving `Construction.Application` is unit-testable with
zero EF Core/HTTP. The user asked to remove it shortly after.
**Decision:** Delete `backend/tests/Construction.Application.Tests/` entirely
and drop its reference from `Construction.slnx`. `docs/CLAUDE.md`'s mandatory
quality gates were never `dotnet test` (only `dotnet build` for the backend),
so this doesn't change the required gate — `dotnet build` still passes clean.
**Consequences:** `Construction.Application`'s services
(`IProjectService`/`IDashboardService`) and the `Domain` entity factories'
invariants (e.g. `ProjectTask.Create` rejecting `Deadline < AssignedDate`) no
longer have automated regression coverage — verification for future changes
to that layer falls back to manual/live checks (as used throughout this
session) unless a test project is reintroduced later. This does not revert
ADR-0010's layering decision (Domain/Application/Infrastructure split,
repository interfaces, entity factories) — only the test project is gone.
