# Development History

Append-only, **reverse-chronological** (newest first). One entry per working
session or notable change. Never rewrite past entries.

Entry template:

```
## YYYY-MM-DD — <short title>
**Refs:** FEAT-###, BUG-###, ADR-####
**What:** <what changed>
**Why:** <the driver / problem>
**Files:** <key paths>
**Verification:** <build/lint/tests/manual checks and their result>
**Follow-ups:** <anything deferred>
```

---

## 2026-09-12 — Remove Construction.Application.Tests (ADR-0012)
**Refs:** FEAT-009, ADR-0012
**What:** Deleted `backend/tests/Construction.Application.Tests/` entirely
(the xUnit project + `TestDoubles/` fakes added under FEAT-009) and removed
its `<Folder Name="/tests/">` reference from `Construction.slnx`.
**Why:** User asked directly to remove it, no further reason given.
**Files:** `backend/Construction.slnx`; `backend/tests/` (deleted);
`docs/ARCHITECTURE.md`, `docs/DECISIONS.md` (ADR-0012), `docs/FEATURES.md`
(FEAT-009 note).
**Verification:** `cd backend && dotnet build` — 0 warnings, 0 errors (the
other 4 projects are unaffected; nothing referenced the test project).
**Follow-ups:** `Construction.Application`/`Domain` have no automated
regression coverage until/unless a test project is reintroduced.

---

## 2026-09-12 — Backend: migrate all Minimal API endpoints to MVC Controllers (FEAT-010)
**Refs:** FEAT-010, ADR-0011
**What:** Converted every backend route from ASP.NET Core Minimal APIs to MVC
Controllers:
- New `Common/FluentValidationFilter.cs` — a global `IAsyncActionFilter`
  registered once (`AddControllers(o => o.Filters.Add<FluentValidationFilter>())`)
  that resolves `IValidator<>` for whichever action argument has one
  registered (via `MakeGenericType` + FluentValidation's type-erased
  `IValidator.ValidateAsync(new ValidationContext<object>(argument))`
  pattern) and short-circuits with a 400 `ValidationProblemDetails` shaped to
  match the previous `Results.ValidationProblem(...)` output exactly. Replaces
  the Minimal-API-only `Common/ValidationFilter<T>` (deleted) and the inline
  `IValidator<T>.ValidateAsync()` calls that existed in
  `AuthEndpoints`/`OnboardingEndpoints` (5 occurrences).
- New `*Controller.cs` in each area, replacing the corresponding
  `*Endpoints.cs` (all 5 deleted): `Reference/ReferenceController.cs`,
  `Auth/AuthController.cs`, `Onboarding/OnboardingController.cs`,
  `Projects/ProjectsController.cs`, `Dashboard/DashboardController.cs`.
  `ClaimsPrincipal` is no longer an injected parameter — controllers use the
  inherited `User` property (`User.GetUserId()`), which also let
  Auth/Onboarding drop their inline `FindFirstValue(ClaimTypes.NameIdentifier)`
  calls (a small duplication ADR-0010 had flagged as a follow-up).
  Projects/Dashboard controllers inject `IProjectService`/`IDashboardService`
  exactly as their Minimal API predecessors did — zero change to
  `Construction.Application`/`Infrastructure`/`Domain`.
- Every action returns `Microsoft.AspNetCore.Http.IResult` via
  `Results.X(...)`, never `ControllerBase.Ok(...)`/`ActionResult<T>` — see
  ADR-0011 for why this is a hard rule, not a style choice (two separate JSON
  options pipelines for output).
- **Bug found live and fixed**: `[FromBody]` model binding for controller
  actions uses a third, separate `Microsoft.AspNetCore.Mvc.JsonOptions`
  instance, independent of the output-side `ConfigureHttpJsonOptions`.
  `POST /api/projects` with `"type":"Commercial"` initially failed to
  deserialize (400) even with the existing enum converter in place. Fixed by
  also chaining `.AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new
  JsonStringEnumConverter()))` onto `AddControllers(...)` in `Program.cs`.
- `Construction.Api.http` refreshed with real example requests for all 5
  areas (previously a stale default-template `/weatherforecast` scaffold).
**Why:** User noticed the codebase had no `Controllers` folder and asked why;
after an explanation that Minimal APIs were a deliberate, documented choice
(`docs/CONVENTIONS.md`), the user asked to plan and execute a migration to
MVC Controllers. Confirmed scope (all 5 areas, not just the ADR-0010 pilot)
and validation approach (shared filter, not inline calls) with the user
before implementing.
**Files:** `backend/src/Construction.Api/Program.cs`;
`backend/src/Construction.Api/Common/{FluentValidationFilter.cs (new),
ValidationFilter.cs (deleted)}`;
`backend/src/Construction.Api/{Auth,Onboarding,Reference,Projects,Dashboard}/*Controller.cs`
(new) replacing `*Endpoints.cs` (deleted) in each folder;
`backend/src/Construction.Api/Construction.Api.http`; `docs/ARCHITECTURE.md`,
`docs/DECISIONS.md` (ADR-0011).
**Verification:** `dotnet build` green after every one of the 10 sequenced
steps (add filter/wiring → migrate Reference → Auth → Onboarding → Projects →
Dashboard → delete dead filter → docs). `dotnet test` on
`Construction.Application.Tests`: unchanged 9/9 passing (this migration never
touches Application). Live curl regression across all 5 areas against a
running dev server: Reference options (200, anon); Auth register
(409 duplicate-email), login (200 happy + 401 wrong-password), me (200 with
token + 401 without); Onboarding preferences (400 via the async
`MustAsync`-backed timezone validator — confirms the type-erased filter
pattern works for DB-backed cross-referencing rules too), company, complete
(all 200); Projects create+list (confirmed `type`/`status` round-trip as
strings on both the request body and the response — this is where the
input-side JSON bug above was caught), create with empty name (400, exact
`ValidationProblemDetails` shape match); Dashboard create-task → exactly one
mirrored activity-log entry (re-confirms the FEAT-009 invariant survives the
routing change), unowned-project-id (404), deadline-before-assigned-date
(400, confirms the filter's type-erased validation handles
`CreateProjectTaskRequestValidator`'s cross-field `GreaterThanOrEqualTo` rule
correctly). `cd frontend && npm run build && npm run lint` not re-run this
entry (no frontend files touched, contract verified unchanged via the curl
regression above).
**Follow-ups:** None new — the pre-existing ADR-0010 follow-up (migrate
Auth/Onboarding/Reference to the Clean Architecture layering pattern) is
unaffected by this entry and still open.

---

## 2026-09-11 — Backend Clean Architecture pilot: Projects + Dashboard (FEAT-009)
**Refs:** FEAT-009, ADR-0010
**What:** Restructured the backend from a single flat `Construction.Api`
project into Clean Architecture, piloted on Projects + Dashboard only
(Auth/Onboarding/Reference deliberately unchanged — see ADR-0010):
- **`Construction.Domain`** (new, zero deps): `Project`, `ProjectTask`,
  `ActivityLogEntry` (+ `ProjectType`/`ProjectStatus` enums) moved here from
  the old `Data/`, gained private setters and static `Create(...)` factories
  enforcing invariants (e.g. `ProjectTask.Create` throws when
  `Deadline < AssignedDate`) — the entities were previously anemic and
  `DbSeeder` bypassed the one existing check by constructing entities
  directly.
- **`Construction.Application`** (new, → Domain only, zero EF/HTTP packages
  beyond `Microsoft.Extensions.DependencyInjection.Abstractions`):
  `Projects/` (`IProjectRepository`, `IProjectService`/`ProjectService`,
  `ProjectDto`, `CreateProjectCommand`) and `Dashboard/`
  (`IProjectTaskRepository`, `IActivityLogRepository`,
  `IDashboardService`/`DashboardService`, DTOs, `CreateProjectTaskCommand`).
  Services take an explicit `ownerId` string (no ambient `ICurrentUser`) so
  the same method serves both HTTP endpoints and `DbSeeder`.
  `DashboardService.CreateTaskAsync` takes an optional `occurredAtUtc` so
  `DbSeeder` can backdate demo activity-log timestamps through the same call
  the live endpoint makes — this is what finally eliminates the
  independently-duplicated (and already-drifted) task↔activity-log mirroring
  logic the audit found. `DependencyInjection.AddApplication()` registers both
  services + `TimeProvider.System`.
- **`Construction.Infrastructure`** (new, → Domain + Application):
  `AppDbContext` + `ApplicationUser`/`LookupOption`/`Currency`/
  `LookupCategories`/`ReferenceSeedData` moved here from `Data/`.
  `Repositories/` holds thin EF Core implementations (`ProjectRepository`,
  `ProjectTaskRepository`, `ActivityLogRepository`, `UnitOfWork`).
  `DependencyInjection.AddInfrastructure()` wires the DbContext + repos.
  Identity DI registration itself stays in `Program.cs` (needs
  `SignInManager<T>`, only trivially available in the Web-SDK `Api` project).
- **Migrations squashed and regenerated** as a single `InitialCreate` under
  the new namespaces rather than hand-editing the model snapshot's CLR-name
  string literals (risk of EF treating every entity as dropped+recreated).
  Verified via `dotnet ef dbcontext script` diff before/after (ignoring
  migration id/ordering) — no real schema drift.
- **Global enum-as-string JSON converter** moved from a per-enum
  `[JsonConverter]` attribute (now on Domain enums, which must stay
  serialization-agnostic) to `Program.cs`'s
  `ConfigureHttpJsonOptions(o => o.SerializerOptions.Converters.Add(new
  JsonStringEnumConverter()))` — verified via raw JSON inspection that
  `type`/`status` are still strings, not integers.
- **`Construction.Api`**: added `Common/ClaimsPrincipalExtensions.GetUserId()`
  and `Common/ValidationFilter<T>` (generic `IValidator<T>` endpoint filter),
  used by the rewritten `ProjectsEndpoints`/`DashboardEndpoints` — both now
  inject `IProjectService`/`IDashboardService` instead of `AppDbContext`, with
  no inline LINQ or business logic. `null` service result → 404. `DbSeeder`
  rewritten to depend on `UserManager<ApplicationUser>` (user provisioning)
  + `IProjectService`/`IDashboardService` (everything else); `AppDbContext` is
  touched only for `MigrateAsync()`. Removed the unused `Mapster` package
  reference (zero usages found).
- **`Construction.Application.Tests`** (new xUnit project, → Application +
  Domain only): hand-rolled `List<T>`-backed fakes in `TestDoubles/` (no
  mocking library); `ProjectTaskTests` (invariant enforcement),
  `ProjectServiceTests` (create/list round-trip, owner isolation, budget
  application), `DashboardServiceTests` — including the key regression-proof
  test asserting `CreateTaskAsync` produces exactly one matching
  `ActivityLogEntry`, and that an unowned project returns `null`/logs nothing.
  9 tests, all passing.
- Auth/Onboarding/Reference: `using` statement swap only (relocated
  `AppDbContext`/`ApplicationUser`), zero logic changes — still on the old
  direct-`AppDbContext` pattern, tracked as a deliberate follow-up.
**Why:** A same-session architecture audit of the backend found direct
`AppDbContext`/`UserManager` injection in endpoint handlers (no repository/
service abstraction), inline business logic mixing validation/auth/ownership/
persistence/DTO-mapping in single methods, anemic entities with an invariant
enforced only by a validator that `DbSeeder` bypassed, and duplicated (already
drifted) task↔activity-log mirroring logic between the live endpoint and the
seeder — with no test project, because the direct EF Core/HTTP coupling made
Application logic untestable in isolation.
**Files:** `backend/Construction.slnx`; `backend/src/Construction.Domain/**`;
`backend/src/Construction.Application/**`;
`backend/src/Construction.Infrastructure/**`;
`backend/src/Construction.Api/{Program.cs,Common/{ClaimsPrincipalExtensions.cs,
ValidationFilter.cs,DbSeeder.cs},Projects/{ProjectsEndpoints.cs,
ProjectContracts.cs},Dashboard/{DashboardEndpoints.cs,DashboardContracts.cs}}`;
`backend/tests/Construction.Application.Tests/**`; `docs/ARCHITECTURE.md`,
`docs/DECISIONS.md` (ADR-0010).
**Verification:** `cd backend && dotnet build` green after every phase
(scaffold → entity move/migration squash → Projects cutover → Dashboard
cutover → DbSeeder cutover → tests). `dotnet test` on
`Construction.Application.Tests`: 9/9 passing. Live smoke test against the dev
API (`dotnet run`, demo login): `GET/POST /api/projects` — raw JSON confirms
`type`/`status` remain strings; `POST` with an empty name returns 400 via
`ValidationFilter`. `POST /api/projects/{id}/tasks` — activity-log count goes
from 0→1 with the correctly mirrored description; a project id the caller
doesn't own returns 404. Dropped the LocalDB and let `DbSeeder` recreate it
fresh: demo project reappeared with the correct budget (850000/512340), all 8
tasks, and 8 activity-log entries with `occurredAt` correctly backdated to
each task's assigned-date offset. `cd frontend && npm run build && npm run
lint` not re-run this entry (no frontend files touched; last known-good from
FEAT-008).
**Follow-ups:** Migrate Auth/Onboarding/Reference to the same layered pattern
(tracked, not urgent — see ADR-0010). `frontend/npm run build && npm run
lint` should be re-verified as a safety check before considering this fully
closed, since it wasn't re-run in this session.

---

## 2026-09-11 — Main dashboard: sidebar shell + budget/task/activity data (FEAT-008)
**Refs:** FEAT-008, BUG-003, BUG-004, ADR-0009
**What:**
- **Backend:** new `ProjectTask` and `ActivityLogEntry` entities (`Data/`),
  `Project.BudgetTotal`/`TotalSpent` decimal columns, migration
  `AddDashboardEntities` (also picked up two previously un-migrated tables,
  `Currencies`/`LookupOptions`, that existed in the EF model but had never been
  captured in a migration — harmless bonus fix). New `Dashboard/` module:
  `GET/POST /api/projects/{id}/tasks`, `GET /api/projects/{id}/activity-log`,
  all owner-scoped like `ProjectsEndpoints`. Task creation auto-inserts a
  mirrored `ActivityLogEntry` in the same save. `ProjectDto` extended with the
  two budget fields. `DbSeeder` restructured to seed a demo project (8 tasks +
  matching log rows) independently of the demo-user idempotency check — no-op
  here since the demo user already had a project from earlier FEAT-007 testing.
  Hit and fixed a SQL Server "multiple cascade paths" error on first migration
  attempt (see ADR-0009) by making `ActivityLogEntry.ProjectTaskId`'s FK
  `Restrict` instead of `SetNull`.
- **Frontend:** new `AppShell`/`AppSidebar`/`Topbar`/`NavLinks`/`ComingSoonPage`/
  `LogoMark` shell components; router restructured to a single nested layout
  route (`/`, `/schedule`, `/task-log`, `/budget`, `/documents`, `/team`) inside
  `AppShell`, replacing six flat individually-`ProtectedRoute`-wrapped routes.
  New `features/dashboard/` (api/hooks/schema, `NewTaskDialog`,
  `BudgetSummaryCard`, `AssignedTasksPanel`, `RecentLogPanel`). New
  `NewProjectDialog` (`features/projects/`) reusing a newly extracted
  `ProjectFormFields` (also now shared with `OnboardingProjectPage`, DRYing up
  the previously duplicated form). New `projectStore` (selected-project id,
  zustand + persist) and `lib/format.ts` (`formatCurrency`). `DashboardPage`
  fully rewritten: loading / zero-projects / populated states, preserves the
  onboarding banner. Mobile: `AppSidebar` hides below `lg`, replaced by a
  `primereact/sidebar` drawer opened from a topbar hamburger.
- **Bug fix:** `getProjectOptions()` called `GET /api/projects/options`, which
  `ProjectsEndpoints` never mapped (BUG-003, 404) — repointed at the working
  `GET /api/reference/options` and reshaped client-side. This incidentally
  unblocks the pre-existing (previously broken) "create first project"
  onboarding step, since both consume the same hook. The sibling
  `getOnboardingOptions()` 404 (BUG-004) has the same root cause but was left
  unfixed — out of scope for this feature.
**Why:** User supplied the dashboard mockup (sidebar nav, budget cards, task/log
tables) and asked for it built with real backend-backed data rather than
frontend mocks, with the five not-yet-built nav destinations as stub pages.
**Files:** `backend/src/Construction.Api/{Data/{Project.cs,ProjectTask.cs,
ActivityLogEntry.cs,AppDbContext.cs},Dashboard/*,Projects/ProjectContracts.cs,
Common/DbSeeder.cs,Program.cs,Migrations/*AddDashboardEntities*}`,
`frontend/src/{components/{AppShell,AppSidebar,Topbar,NavLinks,ComingSoonPage,
LogoMark,navItems}.tsx,router/index.tsx,pages/DashboardPage.tsx,
stores/projectStore.ts,lib/format.ts,features/dashboard/*,
features/projects/{NewProjectDialog.tsx,ProjectFormFields.tsx,projects.api.ts},
features/onboarding/{OnboardingShell.tsx,OnboardingProjectPage.tsx},index.css}`.
**Verification:** `cd frontend && npm run build && npm run lint` pass (0
errors/warnings); `cd backend && dotnet build` passes (0 warnings). Live, via a
Playwright script driving both dev servers (headless Chromium installed to a
scratch dir — no project e2e tooling existed): seeded-demo login → dashboard
renders shell + Budget/Total Spent + populated Assigned Tasks/Recent Log →
created a task via "+ New Task" → appeared in the table **and** a mirrored row
appeared in Recent Log without a manual refresh → all 5 stub nav pages render
and update the active nav state + breadcrumb → resized through 1440/1024/768/
375px with `scrollWidth === clientWidth` (no horizontal scroll) at every width,
375px confirmed the mobile hamburger drawer mirrors the desktop nav → logged
out via the avatar menu, redirected to `/login`. Zero console/network errors
across the whole run.
**Follow-ups:** Schedule/Task Log/Budget & Finance/Document/Team remain stub
pages — real modules are future FEAT work. BUG-004 (`/api/onboarding/options`
404) left open. No per-project currency (`Project.Currency`) — budget figures
format using the user's currency preference. No `GET /api/projects/{id}`
detail endpoint (deliberately deferred, see ADR-0009). Bundle still >500 kB
(pre-existing, unaddressed). Recommend `/run-skill-generator` to capture the
dev-server-launch + Playwright-verification recipe as a reusable project skill.

## 2026-09-09 — Onboarding step: "describe your company" (FEAT-006)
**Refs:** FEAT-006, ADR-0008
**What:** Inserted a new step between preferences and "what do you want to do":
`/onboarding/company` — "How would you best describe your company?" with a 2×2
grid of `SelectableCard`s (Building homes/Builder, Remodeling/Remodeler, Coordinate
and supervise/Construction manager, Others). Same per-step pattern as the rest:
Continue → `PUT /api/onboarding/company` then `/onboarding/start`; Skip → straight
to `/onboarding/start`. Backend: `ApplicationUser.CompanyDescription` (nullable) +
`AddCompanyDescription` migration; `UserDto.CompanyDescription`;
`OnboardingOptionsDto.CompanyDescriptions` (`{value,label,hint}`);
`UpdateCompanyRequest` + validator (must be one of the four values). Frontend:
`OnboardingCompanyPage`, `useUpdateCompany`, `updateCompany()`, `AuthUser.companyDescription`,
`SelectableCard.description` made optional (Others has no hint), preferences step
now navigates to `/onboarding/company`, new route registered.
**Why:** User supplied the mockup for the missing step after "Let's set up your
dashboard".
**Files:** `backend/src/Construction.Api/{Data/ApplicationUser.cs,Auth/Contracts.cs,
Onboarding/{OnboardingContracts,OnboardingOptions,OnboardingValidators,OnboardingEndpoints}.cs,
Migrations/*AddCompanyDescription*}`,
`frontend/src/{stores/authStore.ts,router/index.tsx,components/SelectableCard.tsx,
features/onboarding/{onboarding.api.ts,onboarding.hooks.ts,OnboardingCompanyPage.tsx,OnboardingPreferencesPage.tsx}}`.
**Verification:** `cd frontend && npm run build && npm run lint` pass;
`cd backend && dotnet build` passes (0 warnings). Playwright (1440 px + 375 px):
preferences → Continue lands on `/onboarding/company`; selecting "Remodeling" +
Continue persists `companyDescription = "Remodeler"` (checked via `/me`) and
advances to `/onboarding/start`; no horizontal scroll; cards go 1-col on mobile.
**Follow-ups:** unchanged from the entry below.

## 2026-09-09 — Onboarding wizard + Projects entity (FEAT-006, FEAT-007)
**Refs:** FEAT-006, FEAT-007, ADR-0008
**What:**
- **Backend:** `ApplicationUser` gains workspace prefs (`MeasurementSystem`,
  `Currency`, `TimeZoneId`, `TemperatureUnit`), `ProjectStartMode`,
  `OnboardingCompletedAt`. New `Project` entity + `ProjectType`/`ProjectStatus`
  enums (string-converted) + `AppDbContext.Projects` config. One migration
  `AddOnboardingAndProjects` (string-pref column SQL defaults hand-set to
  Metric/USD/UTC/Celsius). New `UserDto.From(user)` factory now used by
  `JwtTokenService`, `/me`, and onboarding endpoints. `Onboarding/` module:
  `GET /api/onboarding/options` (anon; 26 curated currencies, 141 IANA timezones
  from `TimeZoneInfo` + `TryConvertWindowsIdToIanaId`, 2 measurement, 2 temp),
  `PUT /api/onboarding/preferences`, `POST /api/onboarding/complete` (auth;
  FluentValidation). `Projects/` module: `GET /api/projects`,
  `POST /api/projects`, `GET /api/projects/options` (Type/Status label lists from
  the mockup). Endpoints mapped in `Program.cs`.
- **Frontend:** `authStore.AuthUser` extended + `setUser` action +
  `selectNeedsOnboarding`. `features/onboarding/` (`onboarding.api.ts`,
  `onboarding.hooks.ts`, `OnboardingShell` = SplitLayout + badge + title +
  Continue/Skip footer, `OnboardingPreferencesPage` `/onboarding` with 4
  `Dropdown`s and `Intl` tz detection, `OnboardingStartPage` `/onboarding/start`
  with `SelectableCard` radios, `OnboardingProjectPage` `/onboarding/project`
  RHF+zod create form that creates the project then completes onboarding).
  `features/projects/` (`projects.api.ts`, `projects.hooks.ts`,
  `projects.schema.ts`). `components/SelectableCard.tsx`. Router gains 3
  `/onboarding*` routes. Dashboard shows a "Finish setting up" banner while
  incomplete + lists the user's projects + "New project". `index.css` gains
  `.p-dropdown` (tall rounded) and `.select-card` styles.
**Why:** User supplied the onboarding mockups (setup preferences, "what do you
want to do", then a create-project page) as the next screens. Chose: optional
page (no gate), Skip defers, backend-sourced dropdown data.
**Files:** `backend/src/Construction.Api/{Data/ApplicationUser.cs,Data/Project.cs,
Data/AppDbContext.cs,Auth/Contracts.cs,Auth/JwtTokenService.cs,Auth/AuthEndpoints.cs,
Onboarding/*,Projects/*,Program.cs,Migrations/*AddOnboardingAndProjects*}`,
`frontend/src/{stores/authStore.ts,router/index.tsx,index.css,components/SelectableCard.tsx,
pages/DashboardPage.tsx,features/onboarding/*,features/projects/*}`.
**Verification:** `cd frontend && npm run build && npm run lint` pass;
`cd backend && dotnet build` passes (0 warnings). API (curl): options endpoints
return the expected shapes (`Africa/Lagos` → `(GMT+01:00) Africa/Lagos`), PUT
preferences + POST project + POST complete round-trip and update the user, bad
timezone → 400. Playwright (1440 px + 375 px): register → dashboard banner →
`/onboarding` (tz auto-detected) → Continue → `/onboarding/start` (card select) →
Continue → `/onboarding/project` → fill + "Create project" → back on `/` with the
project listed and the banner gone; no horizontal scroll at either width; step 2
cards stack on mobile.
**Follow-ups:** FEAT-005 password reset. Full projects module (list/detail/edit)
beyond the dashboard stub. Consent `/terms` + `/privacy` still `#`. Rich
option-state dropdown from the unit-picker reference image not built (out of
scope). Bundle >500 kB — consider route-level code-splitting.

## 2026-09-09 — Sign-up page (FEAT-004)
**Refs:** FEAT-004, ADR-0007
**What:**
- **Backend:** `POST /api/auth/register` in `AuthEndpoints.cs` — validates
  `RegisterRequest` (`RegisterRequestValidator`), 409 on duplicate email, creates
  the user via `UserManager`, stores `PhoneNumber` + new
  `ApplicationUser.ExcludeFromMarketing`, then issues a JWT (auto-login, same
  `LoginResponse` shape as login). `CreateAsync` failures returned as a `password`
  validation problem. Migration `AddUserMarketingPreference`. Identity password
  options tightened (lowercase/uppercase/digit/special/8) per ADR-0007.
- **Frontend:** `/register` route + `RegisterPage` on the shared `SplitLayout` —
  email, combined country-code `Dropdown` + phone `InputText` (`.phone-field` CSS),
  password with a live two-column `PasswordChecklist`, marketing opt-out `Checkbox`
  (brand-coloured), consent copy with links. `auth.schema.ts` gains
  `passwordChecks` / `isPasswordStrong` / `registerSchema`; `auth.api.register()`;
  `useRegister` (mutation → `setAuth` → `/`). Login page "Sign up" link now points
  at `/register` (TODO removed).
**Why:** User supplied the sign-up mockup; FEAT-004 was the next backlog item and
the login "Sign up" link was a dead end.
**Files:** `backend/src/Construction.Api/{Auth/AuthEndpoints.cs,Auth/Contracts.cs,
Auth/RegisterRequestValidator.cs,Data/ApplicationUser.cs,Program.cs,Migrations/*AddUserMarketingPreference*}`,
`frontend/src/features/auth/{auth.schema.ts,auth.api.ts,useRegister.ts,PasswordChecklist.tsx,RegisterPage.tsx,LoginPage.tsx}`,
`frontend/src/router/index.tsx`, `frontend/src/index.css`.
**Verification:** `cd frontend && npm run build && npm run lint` pass;
`cd backend && dotnet build` passes (0 warnings). Live: `POST /api/auth/register`
new user → 200 + JWT; duplicate → 409; weak password → 400 with per-field errors.
Playwright: `/register` at 1440 px and 375 px — no horizontal scroll, checklist
turns items green live, mobile collapses the checklist to one column; full UI
submit (email + phone + `Builder1!`) redirects to `/` (auto-login).
**Follow-ups:** FEAT-005 password reset. `/terms` + `/privacy` pages don't exist —
consent links are `#` placeholders. Test users created in LocalDB during
verification (`sam@site.dev`, `e2e_*@site.dev`) — harmless in dev.

## 2026-09-09 — Split repo into `frontend/` + `backend/`
**Refs:** ADR-0006 (supersedes ADR-0001)
**What:**
- Moved the Vite/React app from the repo root into `frontend/` (all config,
  `src/`, `public/`, `.env*`, `node_modules`).
- Renamed the backend folder `server/` → `backend/` (internal
  `Construction.slnx` + `src/Construction.Api` layout unchanged).
- Updated all path references: `.gitignore` (`server/**/logs/` → `backend/**/logs/`),
  `README.md`, `CLAUDE.md`, `docs/PROJECT.md`, `docs/ARCHITECTURE.md`,
  `docs/CONVENTIONS.md`. Added ADR-0006 and marked ADR-0001 superseded.
- No source-code or hook changes: every path inside each app is relative, the
  Vite `/api` → `:5080` proxy is unchanged, and `.claude/hooks/ai-context.mjs`
  still resolves `docs/` from the repo root.
**Why:** User asked to separate the project into `backend/` and `frontend/`
folders; the root was cluttered with SPA tooling next to `docs/` and `.claude/`.
**Files:** repo root (moved `index.html`, `package*.json`, `vite.config.ts`,
`tsconfig*.json`, `.oxlintrc.json`, `.env*`, `public/`, `src/` → `frontend/`;
`server/` → `backend/`), `.gitignore`, `README.md`, `CLAUDE.md`, `docs/*`.
**Verification:** `cd frontend && npm run build && npm run lint` pass;
`cd backend && dotnet build` passes (0 warnings); ran both dev servers from the
new folders — API content root `backend/src/Construction.Api`, `/health` 200,
`POST /api/auth/login` via the Vite proxy 200, web root 200.
**Follow-ups:** none. (Optional: a root `package.json` with `--prefix frontend`
convenience scripts — deferred, not requested.)

## 2026-09-09 — AI-first workflow + Login redesign + responsiveness
**Refs:** FEAT-003, BUG-001, BUG-002, ADR-0005
**What:**
- Added the AI-first documentation & tracking system: `CLAUDE.md` at repo root and
  `docs/` (`PROJECT`, `ARCHITECTURE`, `DECISIONS`, `FEATURES`, `BUGS`,
  `DEVELOPMENT_HISTORY`, `CONVENTIONS`).
- Added enforcement hooks in committed `.claude/settings.json`:
  `UserPromptSubmit` → `.claude/hooks/ai-context.mjs` (injects a FEATURES/BUGS/
  recent-history digest into every prompt); `Stop` →
  `.claude/hooks/ai-history-reminder.mjs` (non-blocking update reminder).
- Redesigned the Login page to match the mockup: bundled construction hero photo
  (`src/assets/login-hero.jpg`) under a teal overlay with bottom-left
  headline/subcopy; black pill logo badge; green "Log in" heading; rounded 10px
  inputs with brand focus ring; full-width green pill button; password eye toggle.
- Responsiveness: `SplitLayout` now uses `min-h-dvh`, collapses to a single
  centered column below `lg`; `DashboardPage` paddings loosened for small screens.
**Why:** User asked for AI-first engineering with feature/bug tracking and a full
project history that every future prompt is checked against; the login screen did
not match the supplied design and had not been verified on phones/tablets.
**Files:** `CLAUDE.md`, `docs/*`, `.claude/settings.json`, `.claude/hooks/*.mjs`,
`src/components/SplitLayout.tsx`, `src/features/auth/LoginPage.tsx`,
`src/index.css`, `src/assets/login-hero.jpg`, `src/pages/DashboardPage.tsx`,
`README.md`.
**Verification:** `npm run build` + `npm run lint` pass; `dotnet build` passes;
hook scripts run standalone and exit 0 (incl. with a tracker file missing);
Playwright screenshots at 375 / 768 / 1024-1440 px — no horizontal scroll at any
width, left photo only from `lg` up, form centred single-column below `lg`;
seeded-credential login redirects to `/` and the dashboard renders on a 375 px
viewport. BUG-002 (duplicate `id="password"`) found and fixed during this check.
**Follow-ups:** FEAT-004 registration (wire the "Sign up" link), FEAT-005 password
reset. Consider code-splitting the Vite bundle (>500 kB warning).

## 2026-09-09 — Initial full-stack scaffold + end-to-end login
**Refs:** FEAT-001, FEAT-002, ADR-0001, ADR-0002, ADR-0003, ADR-0004
**What:**
- Backend `server/src/Construction.Api` (.NET 10, minimal APIs): EF Core +
  SQL Server LocalDB, ASP.NET Core Identity (`ApplicationUser` + `FullName`),
  JWT bearer auth, FluentValidation, Mapster, Serilog, OpenAPI + Scalar.
  Endpoints: `POST /api/auth/login`, `GET /api/auth/me`, `GET /health`.
  `InitialIdentity` migration; Development-only auto-migrate + demo user seed
  (`admin@construction.local` / `Passw0rd!`).
- Frontend at repo root (React 19, Vite 8, TS, Tailwind v4, PrimeReact): axios
  client with bearer + 401 handling, zustand `persist` auth store, TanStack Query,
  React Router (`/login` public, `/` protected, `*` → `/`), RHF + Zod login form,
  `SplitLayout`, `ProtectedRoute`, dashboard placeholder.
**Why:** Stand up the app from the supplied stack diagram and deliver a working
Login screen end to end.
**Files:** `server/**`, `src/**`, `package.json`, `vite.config.ts`, `index.html`,
`.gitignore`, `.env.example`, `README.md`.
**Verification:** `dotnet build` + `dotnet run` OK; `curl` login returns a JWT,
`/me` returns the user, wrong password → 401; `npm run build` + `npm run lint` +
`tsc -b` pass; Vite `/api` proxy forwards to `:5080`.
**Follow-ups:** Design fix + responsiveness (addressed in the entry above).
