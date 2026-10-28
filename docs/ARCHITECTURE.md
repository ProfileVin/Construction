# Architecture

## Repo layout

```
frontend/   React/TS/Vite SPA (npm commands run here)
backend/    .NET 10 solution — Construction.slnx + src/Construction.Api
docs/       AI-first trackers & docs
.claude/    workflow hooks (settings.json + hooks/*.mjs)
```

## Frontend (`frontend/src`)

```
src/
  lib/
    api.ts          axios instance — baseURL = VITE_API_URL || '/api';
                    request interceptor adds `Authorization: Bearer <token>`;
                    response interceptor clears auth + redirects to /login on 401.
    queryClient.ts  shared TanStack Query client (retry 1, staleTime 30s).
  stores/
    authStore.ts    zustand + persist (localStorage key "construction-auth"):
                    { token, user, setAuth, clearAuth }; selectIsAuthenticated.
  router/
    index.tsx       createBrowserRouter: /login (public), / (protected), * -> /.
  components/
    ProtectedRoute.tsx  redirects to /login when !isAuthenticated.
    SplitLayout.tsx     auth shell — hero panel (>= lg) + centered form column.
  features/
    auth/
      auth.schema.ts   zod loginSchema/registerSchema; passwordChecks +
                       isPasswordStrong (canonical password rules).
      auth.api.ts      login(), register(), me() — typed axios calls.
      useLogin.ts      useMutation → setAuth + navigate('/'); getLoginErrorMessage().
      useRegister.ts   useMutation → setAuth + navigate('/'); getRegisterErrorMessage().
      LoginPage.tsx    RHF + zodResolver + PrimeReact inputs inside <Controller>.
      RegisterPage.tsx same shell; country-code Dropdown + phone, PasswordChecklist,
                       marketing Checkbox, consent copy.
      PasswordChecklist.tsx  live two-column list driven by passwordChecks.
    onboarding/          (FEAT-006) onboarding.api.ts, onboarding.hooks.ts,
      OnboardingShell.tsx    SplitLayout + logo badge + title + Continue/Skip footer.
      OnboardingPreferencesPage.tsx  /onboarding — 4 Dropdowns, Intl tz detection.
      OnboardingCompanyPage.tsx      /onboarding/company — 2×2 SelectableCard grid.
      OnboardingStartPage.tsx        /onboarding/start — SelectableCard radios.
      OnboardingProjectPage.tsx      /onboarding/project — RHF create form,
                                     createProject() then completeOnboarding().
    projects/            (FEAT-007) projects.api.ts, projects.hooks.ts,
                         projects.schema.ts (createProjectSchema).
  components/
    SelectableCard.tsx  radio-style card (role=radio); styled via .select-card.
  pages/
    DashboardPage.tsx  authed landing; "Finish setting up" banner while
                       !onboardingCompletedAt; lists useProjects(); logout.
  index.css          PrimeReact theme imports, then `@import "tailwindcss"`,
                     `@theme` tokens, PrimeReact component overrides.
```

**Data flow — login:** `LoginPage` form → `useLogin` mutation → `auth.api.login()`
→ `POST /api/auth/login` → on success `authStore.setAuth(token, user)` →
`navigate('/')` → `ProtectedRoute` allows `/` → `DashboardPage`. Subsequent
requests carry the bearer token via the axios interceptor; a 401 clears auth.

## Backend (`backend/`)

Two independent axes describe the backend's current shape — don't conflate
them:

1. **Routing style — unified.** As of ADR-0011, every route is an MVC
   Controller (`[ApiController]`); there are no Minimal API `*Endpoints.cs`
   files left anywhere.
2. **Layering — piloted, not universal.** As of ADR-0010, the backend is
   **Clean Architecture, piloted on Projects + Dashboard only**.
   Features/Auth, Features/Onboarding, Features/Reference deliberately still
   use the old flat pattern (controller action → `AppDbContext`/`UserManager`
   directly) — a tracked, temporary inconsistency, not an oversight. When
   touching those areas, follow the *old pattern* below; when touching
   Features/Projects, Features/Dashboard (or adding a new piloted area),
   follow the *new pattern*.
3. **Folder grouping.** As of ADR-0013, the five feature areas live under
   `Construction.Api/Features/<area>/`. Top-level `Construction.Api/Auth/`
   is not a feature folder — it holds only global JWT/Identity plumbing
   (`JwtOptions.cs`, `JwtTokenService.cs`) that `Program.cs` wires up.

```
backend/
  Construction.slnx
  src/
    Construction.Domain/            zero dependencies
      Entities/    Project.cs, ProjectTask.cs, ActivityLogEntry.cs — private
                   setters + static `Create(...)` factories enforcing
                   invariants (e.g. ProjectTask.Deadline >= AssignedDate).
                   ProjectType / ProjectStatus enums live here too.
    Construction.Application/       → Domain only, framework/EF/HTTP-free
      Common/IUnitOfWork.cs
      Projects/    IProjectRepository, IProjectService/ProjectService,
                   ProjectDto (+ From(Domain.Project)), CreateProjectCommand.
      Dashboard/   IProjectTaskRepository, IActivityLogRepository,
                   IDashboardService/DashboardService, ProjectTaskDto,
                   ActivityLogEntryDto, CreateProjectTaskCommand.
                   DashboardService.CreateTaskAsync(ownerId, projectId,
                   command, ct, occurredAtUtc: null) — the optional param lets
                   DbSeeder backdate timestamps while the live endpoint omits it,
                   so the task+activity-log mirroring logic exists in one place.
                   UpdateTaskAsync (FEAT-020) shares the private
                   AddLogEntryAsync (LOG-{year}-{seq} numbering) and adds a
                   row only when the status changes.
      DependencyInjection.cs   AddApplication(): registers IProjectService/
                   IDashboardService, AddSingleton(TimeProvider.System).
    Construction.Infrastructure/    → Domain + Application
      Persistence/ AppDbContext.cs (IdentityDbContext<ApplicationUser>),
                   ApplicationUser.cs, LookupOption.cs, Currency.cs,
                   LookupCategories.cs, ReferenceSeedData.cs, Migrations/.
      Repositories/ ProjectRepository, ProjectTaskRepository,
                   ActivityLogRepository, UnitOfWork — thin EF Core impls.
      DependencyInjection.cs   AddInfrastructure(services, config):
                   AddDbContext<AppDbContext> + the repository/UnitOfWork
                   registrations. Identity DI itself
                   (AddIdentityCore<ApplicationUser>()...AddSignInManager())
                   stays in Program.cs — SignInManager needs ASP.NET Core
                   hosting types only trivially available in the Web-SDK Api
                   project.
    Construction.Api/               Web SDK; references Domain + Application +
                                     Infrastructure directly (Features/Auth,
                                     Features/Onboarding, Features/Reference
                                     still need AppDbContext/ApplicationUser
                                     out-of-pilot-scope).
      Program.cs   DI wiring (AddInfrastructure + AddApplication +
                   AddControllers), CORS ("spa" — :5173/:5174), Serilog, JWT
                   bearer, Identity, health checks, OpenAPI + Scalar (Dev),
                   `MapControllers()`, Development-only DbSeeder call.
                   **Two separate JSON options, both configured with the
                   enum→string converter (see ADR-0011):**
                   `ConfigureHttpJsonOptions` (governs every
                   `Microsoft.AspNetCore.Http.IResult` — i.e. every
                   `Results.X(...)` call, which is what all controller actions
                   return) and `AddControllers().AddJsonOptions(...)` (governs
                   `[FromBody]` model binding on the way in). Missing either
                   one silently breaks enum serialization in one direction
                   only — easy to miss, verify both directions after touching
                   this.
      Common/      ClaimsPrincipalExtensions.GetUserId() (extension on
                   ClaimsPrincipal; in a controller, call it as
                   `User.GetUserId()`), FluentValidationFilter (a global
                   `IAsyncActionFilter` registered once via
                   `AddControllers(o => o.Filters.Add<FluentValidationFilter>())`
                   — resolves `IValidator<T>` for whichever action argument has
                   one registered and short-circuits with a 400
                   `ValidationProblemDetails` shaped to match
                   `Results.ValidationProblem`'s output; no per-action
                   validation code needed anywhere), DbSeeder.cs (depends on
                   UserManager<ApplicationUser> for user provisioning +
                   IProjectService/IDashboardService for everything else — no
                   direct entity creation).
      Auth/        GLOBAL JWT/IDENTITY PLUMBING ONLY (not a feature folder;
                   see ADR-0013) — JwtOptions.cs (bound from the `Jwt` config
                   section), JwtTokenService.cs (issues tokens; consumed by
                   Features/Auth/AuthController.cs).
      Features/    Feature areas, each with its own `*Controller.cs`,
                   `*Contracts.cs`, `*Validator.cs` (ADR-0013):
        Auth/, Onboarding/, Reference/   OLD LAYERING PATTERN — controller
                   action injects AppDbContext/UserManager<ApplicationUser>
                   directly, business rules inline in the action. Unchanged
                   this pass (routing style did change — see ADR-0011).
        Projects/, Dashboard/           NEW LAYERING PATTERN — see below.
```

No automated test project exists (`Construction.Application.Tests` was added
during the ADR-0010 pilot and removed shortly after — see ADR-0012).

Config: `appsettings.json` — `ConnectionStrings:Default` (LocalDB), `Jwt:*`
(dev placeholder key — replace outside local).

## Patterns to reuse

**Frontend:**
- **New API call:** add a typed function in a `features/<x>/<x>.api.ts` using the
  shared `api` client; wrap in a `useQuery`/`useMutation` hook in the same folder.
- **File upload / download (FEAT-014, ADR-0015):** the shared client defaults to
  `Content-Type: application/json`, so a `FormData` POST **must** pass
  `headers: { 'Content-Type': 'multipart/form-data' }`. Otherwise axios
  JSON-serializes the form. Authed file endpoints can't be plain `<a href>`s:
  fetch with `responseType: 'blob'` and open or download via an object URL
  (`lib/download.ts` `downloadBlob(blob, fileName)`; used by Documents and the
  Team CSV export; `openBlobInNewTab(fetcher)` opens one in a new tab without
  tripping popup blockers — Documents "Open" and the task "Open attachment").
  Backend file bytes go through `IFileStorage` (`FileStorage:RootPath`), never
  direct `File.*` calls in services; build storage keys with
  `DocumentUploadRules.StorageKeyFor(...)`. A file attached to another record
  (e.g. a task, FEAT-018 / ADR-0017) is saved as a `ProjectDocument` and linked
  by id, in the same `SaveChangesAsync`, deleting the stored file if the save
  throws.
- **Form-style dialogs (mockup look):** add `className="form-dialog mx-4"` to the
  PrimeReact `Dialog` (inset header divider, 4px fields, a custom two-line
  header works) and wrap Cancel/Save in `form-dialog-actions` (a 2-column grid of
  equal full-width buttons). Used by `NewTaskDialog` (FEAT-018),
  `LogDetailsDialog` (FEAT-019) and `EditTaskDialog` (FEAT-020). A tall form
  that must fit without scrolling adds `form-dialog--compact` (tighter padding,
  fields, drop zone and buttons). Pair it with 13px labels, `gap-2.5`/`gap-1`
  and `<AttachmentDropZone compact>`, as in `NewExpenseDialog` (BUG-013).
- **Picking a task assignee:** `features/dashboard/AssigneeDropdown.tsx` (active
  team members, name + role). Pass `currentName` when editing, so a saved
  assignee who isn't an active member stays selectable.
- **Task create/edit cache refresh:** both task mutations call
  `invalidateTaskQueries` in `dashboard.hooks.ts`. Add new task-dependent query
  keys there, not in one mutation.
- **Details → Edit:** the details dialog owns the edit step. It hides itself and
  opens the form, and Save/Cancel closes both, so callers only pass the record
  (`TaskDetailsDialog` → `EditTaskDialog`, FEAT-020).
- **In-page sub-tabs (Budget):** a `role="tablist"` bar whose active tab lives in a `?tab=`
  search param, with the values and type guard in a `*.tabs.ts` file (ADR-0023).
- **Row actions menu (Purchase Orders):** one PrimeReact `Menu popup` per table, toggled from each
  row's ⋮ button, with the clicked row kept in state. A destructive item goes through
  `confirmDialog` with a `<ConfirmDialog />` mounted once in the panel (`PurchaseOrdersTable`/`Panel`).
- **Editable line-item grid:** `useFieldArray` plus `useWatch` for live line totals and the subtotal; pale-blue
  `.po-line-input` fields; the header row is hidden below `sm` and each line stacks
  (`NewPurchaseOrderDialog`). For `InputNumber` inside a form, wire **both** `onChange` (per keystroke) and
  `onValueChange` (blur). With `onValueChange` alone the value only commits on blur, so a clearing
  error shifts the layout mid-click.
- **Parent/child aggregate (backend):** the parent owns a private `List<Child>` exposed as
  `IReadOnlyList`, configured with `HasMany(...).WithOne()` + `UsePropertyAccessMode(Field)`. The child
  cascades from the parent only, with no `ProjectId`, to avoid SQL Server's multiple-cascade-path error
  (`PurchaseOrder`, ADR-0024).
- **Approval-style lifecycle (backend):** the service checks `Status == Pending` and returns a status enum
  (`Decided`/`NotFound`/`NotPending` → 200/404/409); the domain `Approve`/`Reject` methods also throw as a
  guard. Approve and reject share one service method and one private controller helper (`ChangeOrder`, ADR-0025).
- **"Inspect >" row action (Change Orders, Invoices):** `components/InspectLink` (`.inspect-link`, brand
  green) opens a details dialog that owns the row's actions (Approve/Reject, Mark as Paid) and is updated
  in place from the mutation's result (`onDecided`/`onPaid`).
- **Status-grouped KPI sums:** repositories expose `GetTotalsAsync` → one `GROUP BY Status` query mapped to a
  totals record with derived properties (`PurchaseOrderTotals`, `ChangeOrderTotals`, `InvoiceTotals`).
- **Paginated DataTable S.No:** use `opts.rowIndex + 1`. PrimeReact's
  `rowIndex` already includes the paginator offset (BUG-006).
- **List-page table look (Documents, Team, Budget invoices):** `className="app-table"` on a lazy
  `DataTable` + `paginatorTemplate={pagerTemplate}` from
  `components/pagerTemplate.tsx` ("← Previous 1 2 Next →", `.pager-nav`). Add
  `app-table--shaded` for a grey header with "Showing X of Y" in `paginatorLeft`. For a
  list that isn't a table, use a standalone `Paginator` with `template={pagerTemplate}` and
  `className="app-pager"` (Budget categories). Flat
  search field = `.flat-search`; a light-blue filter strip = `.toolbar-band`.
  Size PrimeReact `Dropdown`s with a wrapper `div` (`w-full sm:w-48`), because
  the unlayered global `.p-dropdown { width: 100% }` beats Tailwind width utilities.
  For the same reason, Tailwind `border-0`/`p-0` can't strip a `.p-inputtext`.
  For a bordered search box with an icon, use `.search-field` on the wrapper
  (Dropdown-sized; the wrapper owns the border and focus ring) (BUG-008).
- **Auth state:** read via `useAuthStore(selector)`; never store the token
  elsewhere. Gate routes with `<ProtectedRoute>`.
- **UI preferences** (e.g. sidebar collapsed): `stores/uiStore.ts` (zustand +
  persist, `construction-ui`). The selected project lives in `stores/projectStore.ts`.
- **Forms:** React Hook Form + `zodResolver(<schema>)`; wrap every PrimeReact
  input in `<Controller>`; surface field errors as `<small>` and request-level
  errors from the mutation via a `getXErrorMessage(error)` helper. For live field
  feedback use `useWatch({ control, name })`, not `watch()` (oxlint react-compiler
  rule). Password rules are the `passwordChecks` array in `auth.schema.ts` — reuse
  it, don't restate.
- **Styling:** Tailwind utilities in JSX; brand tokens are `bg-brand`,
  `text-brand`, `bg-brand-hover`, `text-accent`, `bg-page`. PrimeReact widget
  restyles go in the override block at the bottom of `frontend/src/index.css` as
  plain CSS (keep selectors scoped so they don't hit unrelated widgets).

**Backend — routing (all areas, since ADR-0011):**
- Every area is an `[ApiController]` class: `[Route("api/<area>")]` at class
  level, `[HttpGet]`/`[HttpPost]`/`[HttpPut]`("<sub-route>") per action,
  `[Authorize]` at class level when every action needs auth (Onboarding,
  Projects, Dashboard) or per-action when mixed (Features/Auth's `me` vs
  register/login). Dependencies are constructor-injected (primary
  constructor) — controllers are instantiated per request, so scoped services
  (`AppDbContext`, `UserManager`, an Application service) inject cleanly.
  **Every action returns `Microsoft.AspNetCore.Http.IResult` via
  `Results.X(...)` — never `ControllerBase.Ok(...)`/`ActionResult<T>`** (see
  the two-JSON-options note above; this is not a style preference, mixing them
  silently breaks enum serialization for whichever action uses the other
  path). Never inject `ClaimsPrincipal`/take an `IValidator<T>` parameter —
  use the inherited `User` property and let `FluentValidationFilter` handle
  validation.

**Backend — new layered pattern (Features/Projects, Features/Dashboard; use for any new area):**
- **New entity or invariant:** add to `Construction.Domain/Entities/` with
  private setters + a static `Create(...)` factory that throws on invalid
  input — this is the single place the invariant is enforced (DbSeeder and the
  live endpoint both go through it, so they can't drift).
- **New use case:** an interface + implementation in
  `Construction.Application/<Area>/` (e.g. `IProjectService`/`ProjectService`),
  taking an explicit `string ownerId` parameter (never an ambient
  `ICurrentUser`) so it's callable from both an HTTP endpoint and `DbSeeder`.
  Define a small repository interface (`I<Entity>Repository`) alongside it —
  Application never references EF Core directly. Application-layer DTOs/
  commands are deliberately separate `record`s from the Api's request/response
  DTOs (a rename for internal clarity must never silently change the wire
  shape) — map between them with one `From()` line per direction, same as the
  existing entity→DTO convention.
- **New repository:** thin EF Core implementation in
  `Construction.Infrastructure/Repositories/`, registered in
  `Infrastructure/DependencyInjection.cs`. Register the matching Application
  service in `Application/DependencyInjection.cs`.
- **New controller action:** inject the Application service (never
  `AppDbContext`), resolve the user id via `User.GetUserId()`, map request →
  command, call the service, map the result DTO → the Api's own DTO, return
  `Results.X` (`null` service result → `Results.NotFound()`).

**Backend — old layering pattern (Features/Auth, Features/Onboarding,
Features/Reference; not yet migrated to Application/Infrastructure — routing
style is still the shared Controller pattern above):**
- The controller action injects `AppDbContext`/`UserManager<ApplicationUser>`
  directly and contains the business logic inline; projects to DTOs with the
  entity's own static `DtoType.From(entity)`. No `IValidator<T>` parameter or
  inline `ValidateAsync` call — that's handled by the shared
  `FluentValidationFilter`, same as the new pattern.

**Backend — shared regardless of pattern:**
- **New entity / schema change:** update `AppDbContext`
  (`Construction.Infrastructure/Persistence/`), then generate a migration with
  explicit project flags (the context lives in a different project than the
  startup project):
  `dotnet ef migrations add <Name> --project
  src/Construction.Infrastructure/Construction.Infrastructure.csproj
  --startup-project src/Construction.Api/Construction.Api.csproj --output-dir
  Persistence/Migrations`. Migrations auto-apply in Development on startup via
  `DbSeeder`.
