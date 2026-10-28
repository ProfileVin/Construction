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

## ADR-0013 — Construction.Api: group feature folders under `Features/`; split `Auth/`
**Status:** Accepted (2026-09-14)
**Context:** `Construction.Api` kept `Auth/`, `Dashboard/`, `Onboarding/`,
`Projects/`, `Reference/` as flat top-level folders alongside `Common/` and
`Properties/`. The user wanted feature slices visually/structurally grouped
under one `Features/` folder, distinct from cross-cutting concerns
(`Common/`) and genuinely global identity/JWT wiring (`Auth/`).
**Decision:** Moved `Dashboard/`, `Onboarding/`, `Projects/`, `Reference/`
wholesale into `Features/<name>/`. Split `Auth/`: `AuthController.cs`,
`Contracts.cs`, `LoginRequestValidator.cs`, `RegisterRequestValidator.cs`
(the login/register feature, same shape as the other controllers) moved to
`Features/Auth/`; `JwtOptions.cs` and `JwtTokenService.cs` (bound/consumed
directly by `Program.cs`'s JWT bearer + DI setup) stayed at top-level `Auth/`
as global identity plumbing. Every moved file's `namespace` line changed
from `Construction.Api.<X>` to `Construction.Api.Features.<X>` (all files use
file-scoped `namespace` syntax, one segment per folder level — no
`.csproj`/`.slnx` changes needed since the project has no explicit
`<Compile>` globs and the solution only references `.csproj` paths).
**Consequences:** `Auth/JwtTokenService.cs` now references `UserDto`/
`LoginResponse` in `Construction.Api.Features.Auth` while itself staying in
`Construction.Api.Auth` — a two-way reference between the two Auth
namespaces (legal C#, same assembly), an accepted side effect of splitting
identity plumbing from the login/register feature rather than moving `Auth/`
wholesale. `Common/` and `Properties/` are unaffected. `dotnet build` is
clean (0 warnings/errors); files were moved with `git mv` to preserve blame
history.

## ADR-0014 — Explicit CSS cascade-layer order: Tailwind preflight below PrimeReact
**Status:** Accepted (2026-09-23)
**Context:** PrimeReact's Lara theme is emitted inside `@layer primereact`.
`index.css` `@import`s it before `tailwindcss`, so `primereact` was the first
layer declared — i.e. the *lowest* priority — and Tailwind v4 preflight
(`@layer base`: `button { color: inherit; background: transparent }`,
`* { margin: 0 }`) silently overrode the theme. Every filled button rendered
dark text on the brand fill with the icon flush against the label (BUG-005).
**Decision:** Declare the order once, first thing in `index.css`:
`@layer theme, base, primereact, components, utilities;`. Preflight now sits
below the theme; Tailwind `components`/`utilities` still sit above it, so
utility classes keep overriding PrimeReact (the original reason for the
import order). Unlayered rules in `index.css` beat every layer, so the
existing brand overrides are unaffected.
**Consequences:** PrimeReact components now get their full theme styling,
which also exposed theme defects preflight had been masking — fixed with
unlayered overrides in `index.css`: the Lara-teal paginator's active page
(text = background colour) and SelectButton options inheriting the global
filled-button rule. New PrimeReact components should be visually checked
against the theme, not against preflight-reset defaults. Any new `@layer`
must be added to this declaration in the intended position.

## ADR-0015 — Document storage: local disk behind `IFileStorage`, authed blob access
**Status:** Accepted (2026-09-23)
**Context:** The Document page (FEAT-014) needs real upload / open / download of
drawings and permits (mockup shows files up to ~61 MB). Options were local
disk, SQL `varbinary`, or metadata-only placeholders. The user chose local
disk with a 100 MB per-file cap.
**Decision:**
- File bytes go to disk via an Application-layer `IFileStorage` interface;
  Infrastructure's `LocalFileStorage` writes under `FileStorage:RootPath`
  (default `App_Data/uploads`, resolved against the Api content root,
  gitignored). Metadata lives in the `ProjectDocuments` table.
- Storage keys are server-generated (`{projectId:N}/{documentId:N}{ext}`) and
  never come from user input. `LocalFileStorage` also refuses any key that
  resolves outside the root.
- Upload limits: 100 MB (`DocumentUploadRules.MaxSizeBytes`, enforced by
  `[RequestSizeLimit]`/`[RequestFormLimits]` + the FluentValidation
  validator + the client zod schema) and an extension allow-list (images,
  PDF, Word, Excel/CSV, DWG/DXF, TXT, ZIP). Format (Image/Pdf/Word/
  Spreadsheet/Other) is derived from the extension.
- The uploader's display name is snapshotted on the row (same choice as the
  task assignee string, ADR-0009). Application gets it through a small
  `IUserDirectory` so it never references Identity.
- The content endpoint needs the bearer token, so the SPA fetches files as
  blobs (`responseType: 'blob'`) and opens or downloads them via object URLs,
  not plain `<a href>`s.
**Consequences:** Uploads work on a single API instance. Scaling out, or
hosting where the disk isn't persistent, needs a blob-store `IFileStorage`
(Azure Blob / S3), which only changes one DI line. Blob fetches load the whole
file into browser memory, which is fine at 100 MB. Streaming very large files
would need short-lived signed URLs. There's no delete or rename endpoint yet.

## ADR-0016 — Team members: a project-scoped directory, not user accounts
**Status:** Accepted (2026-09-23)
**Context:** The Team page (FEAT-015) lists the people on a project, with
role/trade, email, assigned phase, active-task count and Active/Deactivated
status, plus "Invite Team Member" and "Export". Tasks already store their
assignee as a free-text name (ADR-0009). The user chose: *Invite = add a member
record (no email sent, no login)* and *Active Tasks = open tasks whose assignee
name matches the member*.
**Decision:**
- New `TeamMember` entity per project (not an `ApplicationUser`). Email is
  unique per project (lower-cased, unique index `(ProjectId, Email)`), and a
  duplicate returns 409. Deactivating is a status flag, not a delete.
- `ActiveTaskCount` is computed at read time: non-`Completed` `ProjectTask`s
  grouped by `AssigneeName`, matched to `FullName` case-insensitively. It is
  never stored, and tasks keep their free-text assignee.
- Export is server-side CSV (`GET …/team/export`, same filters, unpaged). Cells
  are RFC-4180 quoted, and a cell starting with `= + - @` (or tab/CR) gets a
  leading `'` so spreadsheets don't evaluate it (CSV injection). A UTF-8 BOM is
  written so Excel reads accents correctly.
- `DbSeeder` gets an idempotent **top-up** step that runs every startup and
  seeds 12 sample members into any demo-user project that has none. The main
  seed only runs for a brand-new demo user, so existing dev DBs would never
  have received the sample data otherwise.
**Consequences:** Renaming a member (or a task's assignee) silently changes the
count, because there's no FK between tasks and members. Moving to a real
`AssigneeMemberId` FK later is a data migration (match names once). Members
can't log in. Turning an invite into an account needs an email/invite-token
flow (FEAT-005-style) that links a `TeamMember` to an `ApplicationUser`.

## ADR-0017 — Task create: one "Assign New Task" dialog, multipart, attachments as ProjectDocuments
**Status:** Accepted (2026-09-25)
**Context:** The user's "Assign New Task" mockup (FEAT-018) replaces the old
"New task" dialog. It has four fields: Task Details (a text area), Assigned To
(a dropdown), Deadline, and "Attach photo, CAD, or site document" (up to 25 MB).
It has no title, assigned date, phase or status. The same dialog also serves
Schedule "+ New Task" and Task Log "New Log". The user chose three things: Task
Details *is* the task text, one dialog everywhere with only the mockup's fields,
and attachments stored in the Document repository.
**Decision:**
- Task Details is stored in `ProjectTask.Title`, and its limit went from 200 to
  1000 characters (migration `AddTaskAttachment`). Tables already truncate it
  with a `title` tooltip, and the details dialog shows it in full (`pre-line`).
- The dialog sends assigned date = today (the browser's local date),
  `status = Upcoming` and no phase. The API still accepts `phaseId`/`status`,
  so other clients or a later "edit task" form can set them.
- Assigned To lists the project's **active** `TeamMember`s. The task still stores
  the name string (ADR-0009/0016), so seeded tasks whose assignee isn't on the
  team keep working. The server does not check the name against the team.
- `POST /api/projects/{id}/tasks` is now `multipart/form-data` (`[FromForm]`),
  following the document upload (ADR-0015), so the file travels in the same
  request. The request's strings are nullable so MVC's implicit `[Required]`
  doesn't replace the FluentValidation messages.
- An attachment becomes a normal `ProjectDocument`: its phase is the task's
  phase, its name is the file name, and its uploader is the current user.
  `ProjectTask.AttachmentDocumentId` is a nullable FK with `Restrict`, because
  a second cascade path from `Projects` isn't allowed on SQL Server. The file is
  saved first. The document, task and activity-log rows are written in one
  `SaveChangesAsync`, and the stored file is deleted if that throws. Limit:
  `DocumentUploadRules.TaskAttachmentMaxSizeBytes` (25 MB), plus the same
  extension allow-list as documents.
**Consequences:** Attachments appear on the Documents page and are opened
through the existing authed content endpoint. They can't be told apart there
from direct uploads. Deleting documents (not supported yet) will have to
consider referencing tasks, because the FK blocks the delete. One attachment
per task. More than one would need a join table. Phase/Status can no longer be
set from the UI at creation, which leaves new tasks off the Schedule roadmap
until an edit-task feature exists.

## ADR-0018 — Activity log: stored log numbers, editable description, derived phase numbers
**Status:** Accepted (2026-09-25)
**Context:** The Dashboard "Log details" mockup (FEAT-019) shows a
`#LOG-2026-081` reference, the linked task's title, "03. Electrical Rough-in"
as the phase, the assignee, and a Description with Cancel/Save. The user chose:
Save edits the description, and only the Dashboard Recent Log dialog changes
(Task details on Schedule and Task Log stay as they are).
**Decision:**
- **Log number is stored**, like `Invoice.InvoiceNumber`: `LOG-{occurredAt year}-{n:000}`,
  where n = the project's entry count + 1 at insert time. The migration backfills
  existing rows with `ROW_NUMBER()` per project in `OccurredAt, Id` order. Storing
  it (rather than computing it from a row's position) keeps a number stable once
  it has been shown or quoted.
- **Phase number is derived, not stored**: the phase's 1-based position in the
  project's phases ordered by `StartDate, CreatedAt` (the order Schedule already
  uses). It changes if phases are re-dated, which is acceptable for a display prefix.
- The log list is joined to tasks and phases in the service, one list query each,
  with no new repository joins. Projects are small. A paged log would need a
  proper join.
- **Description is editable** (`PUT …/activity-log/{entryId}`, 1–2000 chars).
  The column went from 500 to 2000, which also fixes BUG-012 (auto text embedding
  1000-char task details). There is no edit history: the text is replaced in place.
**Consequences:** Two entries created at the same moment in one project could
race to the same number. That's the same accepted risk as invoice numbers, and a
unique index or DB sequence would close it. Editing loses the original
auto-generated text. If an audit trail is needed later, add
`UpdatedAt`/`UpdatedBy` or a history table.

## ADR-0019 — Task edit: JSON PUT, details dialog owns the edit, only status changes are logged
**Status:** Accepted (2026-09-25)
**Context:** FEAT-018 cut "Assign New Task" down to the mockup's fields, so new
tasks are always `Upcoming` with no phase, and nothing could change a task after
creation. The user chose: Edit from Task details (Schedule, Task Log and now the
Dashboard); editable fields are Task Details, Assigned To, Deadline, Phase and
Status; and a Recent Log row only when the status changes.
**Decision:**
- **`PUT /api/projects/{id}/tasks/{taskId}` takes JSON**, not multipart. The
  assigned date and the attachment are fixed after creation, so there's no file
  handling on edit. The domain gains `ProjectTask.Update(...)`, which `Create` now
  calls, so both paths share one set of guards.
- **Deadline vs. assigned date** is checked in `DashboardService.UpdateTaskAsync`
  (the validator can't see the stored assigned date). It returns a
  `TaskUpdateResult` status, and the controller turns it into the same
  `errors.deadline` validation-problem shape the FluentValidation filter produces.
- **A phase id that isn't one of the project's phases is saved as `null`**, as
  `TeamService.ValidPhaseId` does, rather than failing on the FK.
- **Only status changes are logged** (`Task "…" marked In Progress`). The row uses
  the same `LOG-{year}-{seq}` numbering as creation, through a shared private
  `AddLogEntryAsync`. Editing text, assignee, deadline or phase is silent.
- **The details dialog owns the edit step** (it hides and opens
  `EditTaskDialog`; Save/Cancel closes both), like Team's details → Edit. So the
  three callers only pass a task.
- **Dashboard opens details from the task title.** A "View Details" column didn't
  fit: the FEAT-017 fixed column widths already fill the card at 1440 px, and an
  extra column collapsed the Task column to zero width.
**Consequences:** No edit history beyond status rows. Replacing or removing an
attachment needs a separate endpoint later. Status rows share the log-number
race accepted in ADR-0018.

## ADR-0020 — Milestone create: phase list → row name, title → bar label, status from dates
**Status:** Accepted (2026-10-13)
**Context:** The "Assign New Milestone" mockup has only a title, a "Construction
Phase" dropdown and Start/Completion dates. The old dialog also asked for status,
percent complete and a checkpoint label. A roadmap row shows `ConstructionPhase.Name`
as its heading ("Foundation & Excavation") and `CheckpointLabel` on the bar
("Cured & Inspected"). The user chose the mapping and the status rule below.
**Decision:**
- **The dropdown is a fixed client-side list** (`constructionPhaseOptions` in
  `schedule.schema.ts`, including the seeded names). The pick is sent as `name`
  and becomes the row heading. **The title is sent as `checkpointLabel`** (the bar
  label). It is required, max 300 to match the column.
- **Status and percent are derived from the dates on the client**
  (`derivePhaseStatus`): completion date before today → Completed / 100%; start on
  or before today → In Progress / 0%; otherwise Upcoming / 0%.
- **No backend change.** `POST /api/projects/{id}/phases` keeps its contract, so
  the seeder and any other caller can still set status/percent explicitly.
**Consequences:** Phase names are limited to the list in the UI (the API still
accepts any name). Percent complete stays 0 for in-progress milestones until a
milestone edit flow exists (follow-up). The status rule uses the browser's date,
not the server's.

## ADR-0021 — Task Log "New Log": an activity-log entry on a task, not a task
**Status:** Accepted (2026-10-13)
**Context:** The Task Log "New Log" mockup has: Milestone / Task, six Construction
Phase chips, Assignee, Log Note, Attachment, and "Create Log". It has no deadline, and
every `ProjectTask` needs one. Until now "New Log" opened "Assign New Task". The user
chose: a log is a numbered entry on an existing task, and the chips are fixed trade tags.
**Decision:**
- **`POST /api/projects/{id}/activity-log`** (multipart) creates an `ActivityLogEntry`
  through the same `AddLogEntryAsync` / `LOG-{year}-{seq}` numbering as the automatic
  rows. The note is the entry's `Description`, so it stays editable in Log details.
  The task must belong to the project (404 otherwise).
- **`ActivityLogEntry` gains nullable `AssigneeName`, `Category` and
  `AttachmentDocumentId`** (migration `AddActivityLogDetails`). The DTO's
  `assigneeName` is the entry's own value, falling back to the task's, so older
  automatic rows read the same as before.
- **The trade tags are a fixed list** (`ActivityLogCategories.All`, mirrored by
  `logCategoryOptions` on the client), not the project's roadmap phases.
- **Attachments are `ProjectDocument`s**, filed under the task's phase, like task
  attachments (ADR-0017). The file-then-rows-then-cleanup code is shared through
  `DashboardService.BuildAttachmentAsync` / `SaveWithAttachmentAsync`. The FK is
  `Restrict`, for the same multiple-cascade-path reason.
- The Task Log table lists tasks, so a new log doesn't change it. The page confirms the
  save with a toast instead, and the entry appears in the Dashboard Recent Log.
**Consequences:** Logs can't be listed or filtered on the Task Log page yet. The
Recent Log only shows the 20 newest entries. A log doesn't change the task's status.
Log numbers share the count + 1 race accepted in ADR-0018.

## ADR-0022 — Record New Expense: title → vendor line, reference overrides the number, Scheduled status, multipart
**Status:** Accepted (2026-10-13)
**Context:** The "Record New Expense" mockup has Title, Budget Category, Amount,
Invoice / Reference #, Billing Date, a Pending / Paid / Scheduled status control, Notes
and a Receipt upload. It has no Vendor field. The invoices table shows the invoice
number with the vendor beneath. The user chose the mappings below.
**Decision:**
- **The title is stored in `Invoice.VendorName`**, the line under the invoice number. No new column.
- **A typed reference becomes `InvoiceNumber`**, as entered, `#` included. When blank, the
  server generates `INV-{year}-{seq}` as before. No uniqueness rule is added; references
  are the vendor's own numbers.
- **`InvoiceStatus.Scheduled`** is new. It is stored as a string, so no migration is needed.
  It counts toward **Committed POs** together with Pending (promised, not yet paid).
- **`POST …/budget/invoices` is multipart** (`[FromForm]`, 26 MB request limit) so the
  receipt can ride along. The receipt is a `ProjectDocument` with no phase, linked by
  `Invoice.ReceiptDocumentId` (FK Restrict). `Invoice.Notes` (≤ 2000) is new. Migration:
  `AddInvoiceNotesAndReceipt`.
- **The attachment code is shared**: the file → document row → save → delete-on-failure
  sequence moved from `DashboardService` into `Application/Documents/AttachmentUploader`
  (scoped), now used by tasks, logs and invoices.
- **The category is required in the dialog only when the project has categories.** Some
  projects have none (categories are seeded only, FEAT-013), and an always-required field
  would block recording expenses there.
**Consequences:** The JSON body for invoice create no longer works. The only callers are
the SPA and the seeder, which goes through the service. Generated numbers still use
count + 1, so a typed reference that happens to look like `INV-…` could duplicate a later
generated number. This is accepted for now.

## ADR-0023 — Budget sub-tabs in a `?tab=` search param; placeholders; client-side category paging
**Status:** Accepted (2026-10-21)
**Context:** The new Budget & Finance mockup adds six sub-tabs (Overview, Purchase Order,
Change Order, Invoice, Payments, Reports) and paginates the category list. Only Overview
has a backend today. The user chose placeholder tabs and a linkable tab.
**Decision:**
- **The active tab is a `?tab=` search param on `/budget`** (`useSearchParams`), not nested
  routes. Overview is the default and drops the param; unknown values fall back to Overview.
  Switching tabs pushes a history entry, so Back returns to the previous tab. The sidebar's
  `/budget` link and the project `key` remount stay as they are.
- **Non-Overview tabs render the shared `ComingSoonPage`**, with one backlog row each (FEAT-025–029).
- **Categories are paged on the client** (5 per page, standalone `Paginator` with
  `pagerTemplate`), because `GET …/budget/summary` already returns every category and the
  totals need them all anyway. Colours keep the unpaginated index, so a category's colour
  doesn't depend on the page.
- **The tab values and the `isBudgetTab` guard live in `features/budget/budget.tabs.ts`**,
  not in the component file, so oxlint's fast-refresh rule stays clean.
**Consequences:** If a sub-tab grows its own sub-pages, moving to nested routes
(`/budget/purchase-orders/:id`) would replace the param. Old `?tab=` links would need a redirect.

## ADR-0024 — Purchase orders: first parent/child aggregate, max+1 numbering, Pending-only delete, POs feed Committed POs
**Status:** Accepted (2026-10-21)
**Context:** The Purchase Order tab mockup (FEAT-025) needs POs with line items, four KPIs and per-row
actions. The user chose a Pending → Paid lifecycle (⋮ = Mark as Paid / Delete), a line-item summary as
the second line under the vendor, and that Overview's "Committed POs" should come from real POs.
**Decision:**
- **`PurchaseOrder` is an aggregate that owns `PurchaseOrderLineItem`s**: a private `List<>` backing field
  exposed as `IReadOnlyList`, `HasMany(...).WithOne()` with field access. It is the first child collection
  in Domain. Lines cascade from the PO only and carry no `ProjectId`, so SQL Server sees a single cascade path.
  `TotalAmount` is computed once at creation (lines are immutable) and stored so KPI sums run in SQL.
- **Numbering:** `PO-{Sequence:0000}`, with `Sequence` = max + 1 per project and a unique
  `(ProjectId, Sequence)` index. Unlike invoices' count + 1, deleting an older PO can't produce a duplicate.
  If the newest PO is deleted, its number is handed out again. There is no retry on a concurrent-create
  collision: the unique index rejects it, and the Application layer has no EF reference to catch it.
- **Only Pending POs can be deleted.** A Paid PO has been disbursed, so `DELETE` returns 409 and the UI hides ⋮ on Paid rows.
- **KPIs:** Total Committed = Pending + Paid; Pending Approvals = Pending; Disbursed To Date = Paid;
  Unallocated = `Project.BudgetTotal` − Total Committed (may be negative).
- **The budget summary's `committedPOs` now uses the same PO total.** This supersedes the invoice proxy
  (Pending + Scheduled invoices) from FEAT-013/ADR-0022. Scheduled invoices no longer affect it.
- **Issue date** = the creation date (the modal has no issue-date field); the delivery date is optional.
- JSON body (no attachment). The endpoints live under `…/budget/purchase-orders` in their own
  `PurchaseOrdersController` / `IPurchaseOrderService`.
**Consequences:** Projects without POs show $0 Committed POs on Overview even when unpaid invoices exist.
Line items can't be edited after creation (no edit flow yet). A real approval step can be added later
as a new status between Pending and Paid.

## ADR-0025 — Change orders: Pending → Approved/Rejected, approvals extend contract value only; invoice KPIs
**Status:** Accepted (2026-10-22)
**Context:** The Change Order and Invoice tab mockups (FEAT-026/027) were built from the PO tab and carry
copy-paste errors. The CO table shows Paid/Pending badges, but a KPI says "Approved". Both "+ New" buttons
say "New Purchase Order", and the Invoice page is titled "Change Orders". Invoice row 1 has 👁 + ⋮ while the other rows say
"Inspect >". The CO subtitle says approved changes "update schedule and billing automatically", and there is
no create-CO mockup. The user chose: Pending/Approved/Rejected, "Inspect >" on every row, a simple create
modal, and approvals that reach contract value only.
**Decision:**
- **`ChangeOrder` is a flat entity** (no line items) with PO-style numbering: `CO-{Sequence:0000}`, max + 1,
  unique `(ProjectId, Sequence)`. Only a Pending CO can be approved or rejected. The service answers 409 for any other;
  the domain methods also throw as a guard. There is no delete or edit yet.
- **CO KPIs:** Total Change Order = Pending + Approved (Rejected never reaches the contract); Pending
  Approvals = Pending; Approved = Approved.
- **Approval only feeds the Invoice tab's Total Contract Value** = `Project.BudgetTotal` + approved CO total.
  `BudgetTotal` isn't changed, so Overview, Dashboard and the PO tab's Unallocated don't move. The schedule isn't
  touched. The mockup subtitle is kept as-is.
- **Invoice KPIs:** Total Billed to Date = all invoices; Approved Invoices = Paid + Scheduled (both approved
  for payment). Invoices gain `MarkPaid` (no-op when already Paid), exposed on the details dialog for Pending and
  Scheduled rows.
- **"Inspect >" is the row action on both new tables** (shared `components/InspectLink` + `.inspect-link`),
  opening a details dialog that owns the actions. The PO tab keeps 👁 + ⋮.
- **The Invoice tab is a separate panel** (`features/invoices/`) over the extended `GET …/budget/invoices`
  (optional `search`/`status`); the Overview's `InvoicesPanel` is left as the "recent invoices" view.
  "+ New Invoice" reuses "Record New Expense" (ADR-0022) rather than adding a second invoice form.
- Mockup copy fixes: "New Change Order", "Invoices", "New Invoice", and a new Invoice subtitle.
**Consequences:** `BudgetService` now depends on `IChangeOrderRepository`. If approvals should later raise
the budget or shift phases, that's a new decision (it would move many existing KPIs). Approved/rejected COs
can't be reverted. Like POs, there's no retry on a concurrent-create sequence collision.

## ADR-0026 — Deadline extensions are logged as activity-log entries; fixed reason list
**Status:** Accepted (2026-10-28)
**Context:** The Schedule "View Details" mockup (FEAT-030) has an "Extend Deadline" form with a new date and a
"Reason For Extension" dropdown, plus a per-task "Task Logs & Updates" list. Tasks had no reason field and the only
log endpoint returned the project's latest 20 entries.
**Decision:**
- **A dedicated `POST …/tasks/{taskId}/extend-deadline`** (deadline + reason) instead of reusing the full-task PUT.
  The new date must be later than the current deadline (400 on `deadline` otherwise). One save updates the task and
  adds an activity-log entry "Deadline extended from <old> to <new> — <reason>".
- **The reason lives only in that log entry** — no new column or migration. It then shows in the task's log list,
  the Dashboard Recent Log and Task Log without extra work.
- **Reasons are a fixed list** (`DeadlineExtensionReasons.All`, mirrored in `dashboard.schema.ts`), the same pattern
  as `ActivityLogCategories`.
- **`GET …/tasks/{taskId}/activity-log`** returns every entry on one task, newest first, reusing `ToDtosAsync`.
- **Trade** in the Assignee card is the active team member's `roleTitle` matched on `fullName`, from the same cached
  team query as `AssigneeDropdown`; hidden when the assignee isn't an active member.
**Consequences:** Extension history is text, so it can't be queried as structured data (e.g. "count weather
delays"). If that's needed, add a `TaskDeadlineExtension` table. The per-task log list isn't paged.

## ADR-0027 — Change orders: two-step approval, Reason → Scope, multi-attachment link table
**Status:** Accepted (2026-10-28)
**Context:** The Change Order create/Inspect mockups (FEAT-031) add a Reason dropdown, Category / Trade,
Schedule Impact, several attachments, and a two-step "General Contractor Review → Owner Sign-Off" timeline.
ADR-0025 had a single Pending → Approved/Rejected decision and a free-text Reason. The user chose a real two-step
workflow, multiple files, an optional Summary & Scope field, and "no hardcoded UI text".
**Decision:**
- **Statuses:** `Pending` (awaiting GC review) → `PendingOwnerApproval` → `Approved`. Reject is allowed at
  either step and records the signer on that step. Approve/Reject routes are unchanged: approve advances one step.
  Anything not awaiting a step returns 409. The enum is stored as a string, so the new value needs no data change.
- **KPIs:** Pending Approvals = both pending steps; Approved (and so the Invoice tab's contract value) moves
  only on owner sign-off.
- **Signers are the logged-in user's display name** (`IUserDirectory`). There are no per-role accounts yet, so one
  user can sign both steps. The UI shows only stored names and dates, and hides them when absent.
- **`Reason` → `Scope` rename** keeps the old free text. `Reason` is now a short value from `ChangeOrderReasons.All`,
  mirrored on the client like `ActivityLogCategories`. The migration backfills `ContractorReviewedAt = DecidedAt` for
  rows decided under the single-step flow.
- **Attachments** use a `ChangeOrderAttachments (ChangeOrderId, DocumentId)` link table: cascade from the change
  order, Restrict to the document (multiple-cascade-path rule, as for invoice receipts). Up to 5 files of 25 MB.
  `AttachmentUploader.SaveWithAsync` gained a list overload that deletes every written file if the save fails.
- **Category / Trade** is the project's budget category (nullable FK, ClientSetNull, as for invoices). A category
  from another project is dropped.
- Create is now multipart. The request date is the submission day, since the mockup has no date field.
**Consequences:** The old :5080 build can't read `PendingOwnerApproval` rows, so restart the API after pulling.
Documents attached to a change order can't be hard-deleted while linked (there's no delete endpoint today). Role
titles ("Project Manager") and an owner/client name aren't shown, because no data backs them yet.


## ADR-0028 — Payments: standalone ledger, Cleared-only KPIs, payee suggestions
**Status:** Accepted (2026-10-28)
**Context:** The Payments tab mockup (FEAT-028) records inbound client payments and outbound vendor
disbursements, with Processing/Cleared statuses and two KPI cards. The modal has no invoice or PO field. The
user chose: payments are standalone, the KPIs count Cleared payments only, and Client/Payee is a type-or-pick
dropdown.
**Decision:**
- **New `Payment` entity**, copying the purchase-order pattern (ADR-0024): per-project `Sequence` (max + 1,
  unique), `PAY-{seq:0000}`, enums stored as strings. The mockup mixes INV- refs into REF#, but those aren't
  linked to anything, so every row gets a PAY number.
- **Standalone:** recording or clearing a payment doesn't mark invoices/POs paid or change `Project.TotalSpent`.
  Only the payment queries are invalidated.
- **Statuses:** new payments are `Processing`; `Mark as Cleared` is one way. Only Processing payments can be
  deleted (409 otherwise), as with Pending POs.
- **KPIs** sum `Cleared` amounts by direction: money in transit isn't "received" yet.
- **Payee suggestions** come from `GET …/payments/payees`: a SQL `UNION` of this project's payment party names,
  PO vendors and invoice vendors (distinct, sorted, max 100). It's one list for both directions; any name can be
  typed in.
**Consequences:** A client payment can be suggested a vendor's name (and vice versa); good enough until there's a
real client/vendor directory. Cleared payments can't be edited or removed through the API.

## ADR-0029 — Demo-data top-ups may write through `AppDbContext` directly
**Status:** Accepted (2026-10-28)
**Context:** FEAT-031 added Scope, RequestedByName and attachments to change orders. Dev databases seeded earlier
have demo COs without them, so the Inspect dialog looked empty (BUG-015). The seeder only creates COs for projects
that have none, and there is no edit endpoint for these fields.
**Decision:** `DbSeeder.SeedChangeOrdersAsync` runs a startup top-up. It does `ExecuteUpdate` on the owner's COs
whose description matches a seed: it fills a null Scope / RequestedByName and attaches two embedded sample files
(through the existing `AttachmentUploader`) to COs with no attachments. It writes through `AppDbContext` rather
than a new service method, because this is dev-only demo data and shouldn't grow the application API.
**Consequences:** The top-up is idempotent (null checks / "no attachments" filter). User-created COs are never
matched unless they share a seed description exactly. Each demo CO adds 2 small documents to the Documents tab.
