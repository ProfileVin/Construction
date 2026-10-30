# Construction

Web app scaffold: React + TypeScript + Vite SPA in [`frontend/`](frontend/),
ASP.NET Core (.NET 10) Web API in [`backend/`](backend/). First screen delivered
is an end-to-end **Login** flow (ASP.NET Core Identity + JWT).

## Project docs & AI workflow

This repo is developed AI-first. Living documentation and state tracking live in
[`docs/`](docs/) and the workflow rules in [`CLAUDE.md`](CLAUDE.md):

| File | Purpose |
| ---- | ------- |
| [`CLAUDE.md`](CLAUDE.md) | Operating rules — read-first / update-after checklist |
| [`Techstack.md`](Techstack.md) | Full tech stack with versions |
| [`docs/PROJECT.md`](docs/PROJECT.md) | Vision, scope, stack, glossary |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Module maps + patterns to reuse |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | ADR log |
| [`docs/FEATURES.md`](docs/FEATURES.md) | `FEAT-###` registry |
| [`docs/BUGS.md`](docs/BUGS.md) | `BUG-###` registry |
| [`docs/DEVELOPMENT_HISTORY.md`](docs/DEVELOPMENT_HISTORY.md) | Append-only session log |
| [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) | Coding standards |

`.claude/settings.json` registers a `UserPromptSubmit` hook that injects a digest
of the trackers + recent history into every prompt, so each session works against
the full development history.

## Stack

| Layer     | Tech                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------- |
| Frontend  | React 19, TypeScript, Vite, Tailwind CSS v4, PrimeReact + PrimeIcons, React Router, TanStack Query, Axios, Zustand, React Hook Form, Zod, Day.js |
| Backend   | .NET 10, ASP.NET Core Web API (MVC Controllers), EF Core (SQL Server), ASP.NET Core Identity, JWT bearer auth, FluentValidation, Serilog, OpenAPI + Scalar |
| Database  | SQL Server LocalDB (`(localdb)\MSSQLLocalDB`, database `Construction`)                           |

## Prerequisites

- Node 20+ and npm
- .NET SDK 10
- SQL Server LocalDB (ships with Visual Studio / the SQL Server Express installer)
- `dotnet-ef` global tool for migrations: `dotnet tool install -g dotnet-ef`

## Run the backend

```bash
cd backend/src/Construction.Api
dotnet run
```

- Listens on `http://localhost:5080` (see `Properties/launchSettings.json`).
- On startup in **Development** it applies EF migrations and seeds a demo user:
  - **Email:** `admin@construction.local`
  - **Password:** `Passw0rd!`
- API docs (Development only): `http://localhost:5080/scalar/v1`
- Health check: `http://localhost:5080/health`

### Endpoints

| Method | Route                        | Auth        | Purpose                                        |
| ------ | ---------------------------- | ----------- | --------------------------------------------- |
| POST   | `/api/auth/register`         | anonymous   | Create account → `{ token, expiresAt, user }` (409 if email taken) |
| POST   | `/api/auth/login`            | anonymous   | Returns `{ token, expiresAt, user }`          |
| GET    | `/api/auth/me`               | bearer JWT  | Current user (incl. onboarding state)         |
| GET    | `/api/reference/options`     | anonymous   | All seeded dropdown lists (measurement / currency / timezone / temperature / company / project type & status) |
| PUT    | `/api/onboarding/preferences`| bearer JWT  | Save workspace preferences → updated user     |
| PUT    | `/api/onboarding/company`    | bearer JWT  | Save company description → updated user        |
| POST   | `/api/onboarding/complete`   | bearer JWT  | Mark onboarding done (+ start mode) → updated user |
| GET    | `/api/projects`              | bearer JWT  | Current user's projects                       |
| POST   | `/api/projects`              | bearer JWT  | Create a project                             |
| GET    | `/api/projects/{id}/tasks`   | bearer JWT  | Project tasks (incl. `attachmentDocumentId`)  |
| POST   | `/api/projects/{id}/tasks`   | bearer JWT  | Multipart create (`title`, `assigneeName`, `assignedDate`, `deadline`, optional `phaseId`, `status`, `attachment` ≤ 25 MB → stored as a project document); mirrors an activity-log row |
| PUT    | `/api/projects/{id}/tasks/{taskId}` | bearer JWT | JSON edit (`title`, `assigneeName`, `deadline`, `phaseId` or null, `status`) → updated task. Deadline must be on or after the assigned date (400). A status change adds an activity-log row |
| GET    | `/api/projects/{id}/activity-log` | bearer JWT | 20 most recent activity-log entries (`logNumber`, description, linked task title / assignee / phase name + number, `category`, `attachmentDocumentId`) |
| POST   | `/api/projects/{id}/budget/invoices` | bearer JWT | Multipart "Record New Expense" (`vendorName` = title, optional `categoryId`, `amount` > 0, `status` = Pending/Paid/Scheduled, `issuedDate`, optional `referenceNumber` ≤ 40 replacing the generated `INV-{year}-{seq}`, `notes` ≤ 2000, `receipt` ≤ 25 MB → project document) → 201 invoice |
| GET    | `/api/projects/{id}/budget/purchase-orders` | bearer JWT | Paged POs with line items (`search` matches PO#, vendor or item; `status` = Pending/Paid; `page`, `pageSize`), newest first |
| GET    | `/api/projects/{id}/budget/purchase-orders/summary` | bearer JWT | `totalCommitted` (Pending + Paid), `pendingApprovals`, `disbursedToDate`, `unallocated` (budget − committed). The budget summary's `committedPOs` uses the same total |
| POST   | `/api/projects/{id}/budget/purchase-orders` | bearer JWT | JSON create (`vendorName`, `lineItems` 1–50 × {`description`, `quantity` 1–100,000, `unitPrice` > 0}, optional `deliveryDate`, `notes` ≤ 2000) → 201 Pending PO numbered `PO-0001`… |
| POST   | `/api/projects/{id}/budget/purchase-orders/{poId}/mark-paid` | bearer JWT | Pending → Paid → updated PO |
| DELETE | `/api/projects/{id}/budget/purchase-orders/{poId}` | bearer JWT | 204; 409 when the PO is already Paid |
| GET    | `/api/projects/{id}/budget/change-orders` | bearer JWT | Paged change orders (`search` matches CO#, description or reason; `status` = Pending/Approved/Rejected; `page`, `pageSize`), newest date first |
| GET    | `/api/projects/{id}/budget/change-orders/summary` | bearer JWT | `totalChangeOrders` (Pending + Approved), `pendingApprovals`, `approved` |
| POST   | `/api/projects/{id}/budget/change-orders` | bearer JWT | JSON create (`description` ≤ 500, `amount` > 0, `requestedDate`, optional `reason` ≤ 2000) → 201 Pending CO numbered `CO-0001`… |
| POST   | `/api/projects/{id}/budget/change-orders/{coId}/approve` | bearer JWT | Pending → Approved → updated CO; 409 when not Pending |
| POST   | `/api/projects/{id}/budget/change-orders/{coId}/reject` | bearer JWT | Pending → Rejected → updated CO; 409 when not Pending |
| GET    | `/api/projects/{id}/budget/payments` | bearer JWT | Paged payments (`search` matches PAY# or payer/payee; `status` = Processing/Cleared; `page`, `pageSize`), newest payment date first |
| GET    | `/api/projects/{id}/budget/payments/summary` | bearer JWT | `totalReceived` / `totalDisbursed` — Cleared inbound / outbound only |
| GET    | `/api/projects/{id}/budget/payments/payees` | bearer JWT | Distinct names used on the project (payments, PO vendors, invoice vendors) for the payee dropdown |
| POST   | `/api/projects/{id}/budget/payments` | bearer JWT | JSON create (`direction` = Inbound/Outbound, `partyName` ≤ 200, `amount` > 0, `paymentDate`, `method` = Ach/Wire/PayPal/Check, optional `notes` ≤ 2000) → 201 Processing payment numbered `PAY-0001`… |
| POST   | `/api/projects/{id}/budget/payments/{paymentId}/mark-cleared` | bearer JWT | Processing → Cleared → updated payment |
| DELETE | `/api/projects/{id}/budget/payments/{paymentId}` | bearer JWT | 204; 409 when the payment is already Cleared |
| GET    | `/api/projects/{id}/budget/invoices` | bearer JWT | Paged invoices (optional `search` = invoice # or vendor, `status` = Pending/Paid/Scheduled; `page`, `pageSize`) |
| GET    | `/api/projects/{id}/budget/invoices/summary` | bearer JWT | `totalContractValue` (budget + approved change orders), `totalBilledToDate`, `approvedInvoices` (Paid + Scheduled) |
| POST   | `/api/projects/{id}/budget/invoices/{invoiceId}/mark-paid` | bearer JWT | → Paid → updated invoice |
| POST   | `/api/projects/{id}/activity-log` | bearer JWT | Multipart "New Log" on a task (`taskId`, `category` = Framing/Structural/Finishing/Electrical/Mechanical/Plumbing, `assigneeName`, `note` ≤ 2000, optional `attachment` ≤ 25 MB → project document) → 201 numbered entry; 404 if the task isn't in the project |
| PUT    | `/api/projects/{id}/activity-log/{entryId}` | bearer JWT | `{ "description": "…" }` (1–2000 chars) → updated entry |
| GET    | `/api/projects/{id}/documents` | bearer JWT | Paged documents (`search`, `format`=Image/Pdf/Word/Spreadsheet/Other, `page`, `pageSize`) |
| GET    | `/api/projects/{id}/documents/counts` | bearer JWT | Document counts: `all` + per format        |
| POST   | `/api/projects/{id}/documents` | bearer JWT | Multipart upload (`file`, optional `name`, `phaseId`); ≤ 100 MB, extension allow-list |
| GET    | `/api/projects/{id}/documents/{docId}/content` | bearer JWT | File bytes; `?download=true` → attachment |
| GET    | `/api/projects/{id}/team`    | bearer JWT  | Paged team members (`search`, `role`, `status`=Active/Deactivated, `page`, `pageSize`) |
| GET    | `/api/projects/{id}/team/roles` | bearer JWT | Distinct role titles (for the role filter) |
| GET    | `/api/projects/{id}/team/export` | bearer JWT | CSV of members matching the same filters (unpaged) |
| POST   | `/api/projects/{id}/team`    | bearer JWT  | Add a member (name, role, specialty, email, phase); 409 on a duplicate email |
| PUT    | `/api/projects/{id}/team/{memberId}` | bearer JWT | Edit a member; 409 on a duplicate email |
| PUT    | `/api/projects/{id}/team/{memberId}/status` | bearer JWT | `{ "status": "Active" \| "Deactivated" }` |
| GET    | `/health`                    | anonymous   | Liveness + DB check                           |

Config lives in `backend/src/Construction.Api/appsettings.json` (`ConnectionStrings:Default`,
`Jwt:*`). The `Jwt:Key` value there is a development placeholder — replace it for any
non-local environment (and move it to a secret store).

## Run the frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

- `frontend/vite.config.ts` proxies `/api` → `http://localhost:5080`, so no CORS
  setup is needed in dev and `frontend/.env` can leave `VITE_API_URL` blank.
- For a non-proxied build, set `VITE_API_URL` (see `frontend/.env.example`) to the
  API base URL including the `/api` prefix.

Scripts (run in `frontend/`): `npm run dev`, `npm run build`, `npm run preview`,
`npm run lint` (oxlint).

## Project layout

```
frontend/
  src/
    lib/         axios instance (auth header + 401 handling), query client
    stores/      authStore.ts — zustand + persist (localStorage key "construction-auth")
    router/      createBrowserRouter: /login (public), / (protected), * -> /
    components/  ProtectedRoute, SplitLayout
    features/auth/  auth.schema.ts (zod), auth.api.ts, useLogin.ts, LoginPage.tsx
    pages/       DashboardPage.tsx — placeholder; new screens get added here
    assets/      login-hero.jpg
backend/
  Construction.slnx
  src/Construction.Api/
    Program.cs   DI, CORS, JWT, Serilog, Scalar, endpoint wiring, dev seeding
    Data/        ApplicationUser (IdentityUser + FullName), AppDbContext
    Auth/        JwtOptions, JwtTokenService, Contracts, LoginRequestValidator, AuthEndpoints
    Common/      DbSeeder
    Migrations/  InitialIdentity
docs/            AI-first trackers (see "Project docs & AI workflow" above)
```

### Login page hero image

`frontend/src/features/auth/LoginPage.tsx` imports
`frontend/src/assets/login-hero.jpg` for the left panel. Replace that file to
change the photo; the tinted overlay is applied in `SplitLayout`.

### Tailwind v4 + PrimeReact note

`frontend/src/index.css` imports the PrimeReact Lara theme **before**
`@import "tailwindcss"` so Tailwind utilities win specificity ties. PrimeReact's
own component CSS survives Tailwind v4's Preflight in this setup; if a widget looks
unstyled after upgrades, scope Preflight out or pin Tailwind to v3 with
`corePlugins.preflight = false`.

## New migration

```bash
cd backend/src/Construction.Api
dotnet ef migrations add <Name> -o Migrations
```

Migrations are applied automatically on Development startup; run
`dotnet ef database update` to apply them manually.
