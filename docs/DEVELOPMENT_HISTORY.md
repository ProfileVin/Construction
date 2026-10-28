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

## 2026-10-28 — Change Order Inspect: Summary & Scope + Attachments always shown (BUG-015)
**Refs:** BUG-015, FEAT-031, ADR-0029
**What:**
- **Frontend:** `ChangeOrderDetailsDialog` always renders the Summary & Scope card (as in the mockup). It shows
  "No scope provided." / "No attachments." when those are empty, instead of hiding the whole card.
- **Backend (seeder only):**
  - Every change-order seed now has a scope.
  - A new startup top-up fills a null `Scope` / `RequestedByName` on the demo COs (matched by description).
  - The top-up also attaches an embedded `Site-Survey.png` and `Contractor-Quote.pdf` through `AttachmentUploader`
    to any demo CO with no files.
  - No migration and no API change.
**Why:** The user reported that Inspect showed no scope or attachments. The API path worked; the data was empty
(8/12 seeds had no scope, no seed had files, and pre-FEAT-031 rows had no requester), and the dialog hid the card.
**Files:** `frontend/src/features/change-orders/ChangeOrderDetailsDialog.tsx`, `backend/src/Construction.Api/Common/DbSeeder.cs`.
**Verification:**
- `npm run build` and `npm run lint` are clean. The API built to a scratch folder with 0 warnings and 0 errors
  (:5080 locks the Debug DLLs).
- Ran the new build on :5081 (cwd `src/Construction.Api`, so files land in the real `App_Data/uploads`):
  - Every demo CO in the 3 projects now has a scope, "Site Admin" as requester, and 2 attachments.
  - The user's COs ("Reject me", CO-0013) are unchanged.
  - After a restart, Riverside still has 24 attachments (no duplicates).
  - Both files download as `application/pdf` / `image/png`.
- `playwright-cli` on :5173:
  - Inspect on Riverside CO-0006 shows the scope text and both file chips; clicking one opens a new tab.
  - A user CO shows the two empty-state lines.
**Follow-ups:**
- Restart the :5080 API so it runs the new seeder code. The data is already in the DB.
- The mockup's role under Requested By ("Project Manager") and the owner's name/company on Owner Sign-Off still
  have no data.

## 2026-10-28 — Team: "Invite New Team Member" modal redesign (FEAT-033)
**Refs:** FEAT-033 (updates FEAT-015)
**What:**
- `TeamMemberFormDialog` was rebuilt to the mockup (`form-dialog` look, 40rem).
  - **Invite mode:**
    - A read-only "Who Has Access" list: the logged-in user as Owner, then active members from the same
      `useTeamMembers({ status: 'Active', pageSize: 100 })` query `AssigneeDropdown` uses. Each row has a PrimeReact
      initials `Avatar` and the role title; the list scrolls inside `max-h-40`.
    - Then Full Name / Email Address / Role (the editable trade-role dropdown, "Assign a role").
    - A disabled, checked "Link Should Expire After Use" `InputSwitch` with a "not available yet" note, marked
      `shortcut:` in the code.
    - Buttons: Cancel / "Send Invitation & Add Member".
  - **Edit mode:** the same three fields plus Specialty and Assigned Phase, and "Save Changes".
- `initials()` moved from `components/Topbar.tsx` to `lib/format.ts`.
**Why:** The user's mockup for Team → Invite Team Member. The user chose: add-only (no email or invite links), a
read-only access list, and Role = the existing trade role.
**Files:** `frontend/src/features/team/TeamMemberFormDialog.tsx`, `frontend/src/components/Topbar.tsx`,
`frontend/src/lib/format.ts`, `docs/*`.
**Verification:**
- `npm run build` + `npm run lint` pass. No backend change.
- Standalone `playwright-core` on the user's Vite :5173, demo user, `/team` at 1440 px:
  - The access list shows "SA Site Admin Owner" plus 10 active members, and the switch is checked and disabled.
  - An empty submit → name/email/role errors.
  - A valid invite → the dialog closes, and the member is in the table (Active, no phase).
  - The same email again → "A member with this email is already on the project."
  - Edit shows Specialty/Phase and no access list, and a saved specialty shows in the row.
  - At 375 px there's no page overflow (the dialog scrolls, like the other form dialogs).
- Probe: typing in the editable Role field opens its suggestion list. A mouse click or Tab closes it.
  Escape closes the whole dialog (PrimeReact default, unchanged).
**Follow-ups:** Real invitations (link/email, expiry) and per-member access levels are out of scope. One test
member "Invite Test …" was added to the "API test - change orders (safe to delete)" project.

## 2026-10-28 — Documents: "Upload New Document" modal redesign (FEAT-032)
**Refs:** FEAT-032 (updates FEAT-014)
**What:**
- `UploadDocumentDialog` was rebuilt to the mockup (`form-dialog` look).
  - Fields: "Document Title / Display Name" first (optional), then "Source File Attachment" with "Max: 100 MB".
  - The drop zone is a large dashed, light-grey box with a cloud icon in a white circle, "Drag and drop files
    here, or browse files" and the supported-types hint.
  - Footer: equal Cancel / Upload buttons.
  - Kept: the drag/drop and file-input logic, the zod checks, the progress bar and the error mapping.
- The Phase dropdown and its `phaseId` schema field were removed (the mockup has neither). The API still accepts
  `phaseId`, so existing files keep theirs.
- `.ifc` was added to `DocumentUploadRules.AllowedExtensions` and the client `ALLOWED_EXTENSIONS`, so the hint's
  "IFC" is true. `AttachmentDropZone` shares that list, so task/log/change-order attachments accept it too.
**Why:** The user's mockup for Document → Upload Document. The user didn't answer the phase/title/IFC questions,
so the recommended defaults were used: drop Phase, keep the title optional, allow IFC.
**Files:** `frontend/src/features/documents/{UploadDocumentDialog.tsx,documents.schema.ts}`,
`backend/src/Construction.Application/Documents/DocumentUploadRules.cs`, `docs/*`.
**Verification:**
- `npm run build` + `npm run lint` pass; `dotnet build` passes (0 warnings, 0 errors). The API was restarted.
- Standalone `playwright-core` on the user's Vite :5173, demo user, `/documents` at 1440 px:
  - The dialog text matches the mockup, and the dialog is 506px tall.
  - An empty submit shows "Choose a file to upload". A `.exe` shows "This file type isn't supported".
  - A titled `.ifc` uploads and shows as "BIM Model …" with a File badge.
  - A `.png` with a blank title uses the file name and an Image badge.
  - At 375 px nothing overflows, the buttons stack, and the dialog fits without scrolling.
**Follow-ups:** Multi-file upload ("files" in the mockup copy) isn't supported: the endpoint and table take one file
per upload. A test `.ifc` and a 1×1 `.png` were uploaded to the "API test - change orders (safe to delete)" project.

## 2026-10-28 — Budget: Payments tab + "Record Payment" modal (FEAT-028)
**Refs:** FEAT-028, ADR-0028 (follows the FEAT-025 / ADR-0024 purchase-order pattern)
**What:**
- **Domain/DB:** new `Payment` entity (`PaymentDirection` Inbound/Outbound, `PaymentMethod` Ach/Wire/PayPal/Check,
  `PaymentStatus` Processing/Cleared, `PAY-{seq:0000}`), migration `AddPayments`.
- **Application/Infrastructure:** `Payments/*` (DTOs, command + list query, `IPaymentRepository`, `PaymentService`)
  and `PaymentRepository`: search on number/payee, Cleared totals grouped by direction, payee-name `UNION` of
  payments + PO vendors + invoice vendors.
- **API:** `PaymentsController` at `api/projects/{id}/budget/payments` — list, `summary`, `payees`, create (JSON,
  `CreatePaymentRequestValidator`), `{id}/mark-cleared`, delete (409 unless Processing). `DbSeeder` tops up 12 demo
  payments (the mockup rows plus earlier client payments, so Received = the mockup's $120,003.90).
- **Frontend:** new `features/payments/` (`PaymentsPanel`, `PaymentsTable`, `RecordPaymentDialog`,
  `PaymentDetailsDialog`, `PaymentStatusBadge`, api/hooks/schema), wired into `BudgetPage`. The tab label is now
  "Payment". The payee field is an editable `Dropdown`, as in the Team role field.
**Why:** The user's two mockups for Budget & Finance → Payment; FEAT-028 was the placeholder.
**Files:** `backend/src/Construction.Domain/Entities/Payment.cs`, `backend/src/Construction.Application/{Payments/*,DependencyInjection.cs}`,
`backend/src/Construction.Infrastructure/{Persistence/AppDbContext.cs,Persistence/Migrations/*_AddPayments.cs,Repositories/PaymentRepository.cs,DependencyInjection.cs}`,
`backend/src/Construction.Api/{Features/Payments/*,Common/DbSeeder.cs}`, `frontend/src/features/payments/*`,
`frontend/src/features/budget/budget.tabs.ts`, `frontend/src/pages/BudgetPage.tsx`, `README.md`, `docs/*`.
**Verification:**
- `dotnet build` passes (0 warnings, 0 errors); `npm run build` + `npm run lint` pass.
- API with curl, as the demo user:
  - The seeded summary is Received $120,003.90.
  - Search + status filter work, and the payee list includes PO/invoice vendors.
  - Validator messages appear for an empty or invalid body.
  - Create → Processing, and the KPI is unchanged. Mark-cleared → the KPI goes up.
  - Deleting a Cleared payment → 409. An unknown project → 404. No token → 401.
- Standalone `playwright-core` script (the MCP bridge wasn't connected) on the user's Vite :5173 at 1440 px:
  - KPIs and table render, and the active tab is "Payment".
  - Search "sebastian" → 3 rows. Processing filter and page 2 work.
  - An empty submit shows the payee/amount errors.
  - The payee dropdown offers PO vendors, and picking one fills the field.
  - A typed new payee records an outbound Bank Check payment: Processing, KPI unchanged. The details dialog
    shows every field. Mark as Cleared moves Payment Disbursed by the amount and removes the ⋮ menu.
  - A Processing payment is deleted after the confirm.
  - At 375 px there is no horizontal page overflow on the page or in the dialog.
- A first version reset the form in the dialog's `onShow`. When the form was filled the instant the dialog opened,
  that reset could wipe the input. It was removed (`close()` already resets), and the check passes with an
  immediate fill.
**Follow-ups:** No edit-payment action. Payee suggestions aren't split by direction. No link from payments to
invoices/POs (ADR-0028). The UI test left a few Cleared test payments in the "API test - change orders (safe to
delete)" project.

## 2026-10-28 — Change Orders: create + Inspect redesign, 2-step approval (FEAT-031)
**Refs:** FEAT-031, ADR-0027 (builds on FEAT-026, ADR-0025)
**What:**
- **Domain/DB:** `ChangeOrder` gains Scope (renamed from the old Reason), Reason (dropdown value), CategoryId,
  ScheduleImpactDays, RequestedByName, ContractorReviewedAt/ByName and OwnerDecidedByName.
  `ChangeOrderStatus.PendingOwnerApproval` is new. `Approve(byName)`/`Reject(byName)` work step by step. A new
  `ChangeOrderAttachment` link entity was added. Migration `ChangeOrderDetailsAndTwoStepApproval` was hand-tuned to
  rename Reason → Scope and backfill step 1 on decided rows.
- **Application:**
  - `ChangeOrderReasons`.
  - The create command carries scope/category/impact/files.
  - `ChangeOrderService` gained `GetAsync` (category name + attachments). `CreateAsync` stores files and records
    the requester. `DecideAsync` records the signer.
  - The totals' Pending covers both steps.
  - `AttachmentUploader.SaveWithAsync` gained a list overload.
- **API:** create is multipart (≤5 files, size/extension rules, reason list, 0–365 days). Added `GET {id}`. The
  seeder data now has reasons, scopes and impact days, and one CO left at owner sign-off (only fresh DBs get it).
- **Frontend:**
  - `NewChangeOrderDialog` and `ChangeOrderDetailsDialog` were rebuilt to the mockups.
  - `useChangeOrder` detail query.
  - The status badge and filter gained "Pending GC Review" / "Pending Owner Approval".
  - `AttachmentDropZone` got a `multiple` prop.
**Why:** The user's mockups for Budget & Finance → Change Order → New Change Order / Inspect.
**Files:** `backend/src/Construction.Domain/Entities/ChangeOrder.cs`,
`backend/src/Construction.Application/{ChangeOrders/*,Documents/AttachmentUploader.cs}`,
`backend/src/Construction.Infrastructure/{Persistence/AppDbContext.cs,Persistence/Migrations/*_ChangeOrderDetailsAndTwoStepApproval.cs,Repositories/ChangeOrderRepository.cs}`,
`backend/src/Construction.Api/{Features/ChangeOrders/*,Common/DbSeeder.cs}`,
`frontend/src/features/change-orders/*`, `frontend/src/components/AttachmentDropZone.tsx`.
**Verification:**
- `npm run build` and `npm run lint` are clean.
- The API compiles with 0 warnings when built to a scratch output folder. The running :5080 API locks the Debug DLLs.
- Ran the new build on :5081, which applied the migration, and curl-tested a scratch project
  "API test - change orders (safe to delete)":
  - Create with 2 files → 201, and `GET {id}` lists both attachments.
  - Approve → PendingOwnerApproval; the KPI stays under Pending.
  - Approve → Approved; the KPI moves to Approved.
  - A 3rd approve → 409.
  - Reject at the GC step → Rejected, with only the GC signer set.
  - A bad reason, a `.exe` file, 6 files, or 400 days each → 400.
- Riverside Villas' existing change orders read back correctly: old reasons appear as scope, decided rows have
  step 1 backfilled, and the KPIs are unchanged.
- The UI wasn't clicked through because :5080 still runs the old build.
**Follow-ups:** Restart the API. Delete the scratch test project when convenient (there is no project-delete
endpoint yet). Add role/owner data if the timeline should show titles or the client's name.

## 2026-10-28 — Schedule "View Details": deadline details & extension (FEAT-030)
**Refs:** FEAT-030, ADR-0026 (builds on FEAT-020, FEAT-022)
**What:**
- **Backend:** `IActivityLogRepository.ListByTaskAsync`; `DashboardService.ListTaskActivityLogAsync` and
  `ExtendTaskDeadlineAsync` (new `TaskUpdateStatus.DeadlineNotLater`, `DeadlineExtensionReasons`);
  `DashboardController` `GET tasks/{taskId}/activity-log` and `POST tasks/{taskId}/extend-deadline`
  (`ExtendTaskDeadlineRequest` + validator). No migration.
- **Frontend:** `TaskDetailsDialog` rebuilt to the mockup (due-date card + days-remaining pill, assignee + trade,
  task logs, Extend Deadline form with Calendar + reason Dropdown, Cancel / Confirm Extension). Kept "Edit task"
  (opens `EditTaskDialog`) and "Open attachment". New `extendTaskDeadline` / `listTaskActivityLog` API calls,
  `useExtendTaskDeadline` / `useTaskActivityLog` hooks, `extendDeadlineSchema` + `deadlineExtensionReasons`.
**Why:** The user's mockup for Schedule tab → View Details.
**Files:** `backend/src/Construction.Application/Dashboard/{DashboardService,IDashboardService,IActivityLogRepository,UpdateProjectTaskCommand}.cs`,
`backend/src/Construction.Infrastructure/Repositories/ActivityLogRepository.cs`,
`backend/src/Construction.Api/Features/Dashboard/{DashboardController,DashboardContracts,ExtendTaskDeadlineRequestValidator}.cs`,
`frontend/src/features/dashboard/{TaskDetailsDialog.tsx,dashboard.api.ts,dashboard.hooks.ts,dashboard.schema.ts}`.
**Verification:** `npm run build` and `npm run lint` pass. The API compiles with 0 errors and 0 warnings when built to a
separate output folder. The normal `dotnet build` hit MSB3021 because the running API (PID 48416) locked the Debug DLLs.
Ran the new build on :5081 and curl-tested it: the per-task log returns only that task's entries; a same-date
extension → 400 `deadline`; an unknown reason → 400; an unknown task → 404. The success path and the UI weren't
exercised because :5080 still runs the old build and dev data was left unchanged.
**Follow-ups:** Restart the API, then click through Schedule → View Details → Confirm Extension.

## 2026-10-27 — Add Techstack.md; fix stale stack tables
**Refs:** ADR-0011, ADR-0012 (docs only)
**What:** Added a root `Techstack.md` that lists every frontend and backend technology with its version and purpose,
plus database/storage, auth, tooling, testing status, and a "not yet adopted" list. Corrected the Stack tables in
`README.md` and `docs/PROJECT.md`: "minimal APIs" is now "MVC Controllers", and Mapster is removed because no project
references it. Linked `Techstack.md` from the README docs table.
**Why:** The user asked for one file that lists the whole stack. The existing summaries had drifted from the code.
**Files:** `Techstack.md`, `README.md`, `docs/PROJECT.md`.
**Verification:** Checked every version against `frontend/package.json` and the four `backend/src/*/*.csproj`.
Grep confirms that `Mapster` and `minimal APIs` no longer appear in either Stack table. No code changed, so the
build and lint gates were not run.
**Follow-ups:** Keep `Techstack.md` in sync whenever a dependency is added or bumped.

## 2026-10-22 — Pin patched System.Security.Cryptography.Pkcs (BUG-014)
**Refs:** BUG-014
**What:** Added a direct `System.Security.Cryptography.Pkcs` 10.0.13 reference to `Construction.Infrastructure.csproj`,
overriding the vulnerable 9.0.11 that `Microsoft.Data.SqlClient` 6.1.6 (via EF Core SqlServer 10.0.12) pulls in.
Construction.Api gets it transitively.
**Why:** The user reported the NU1902/NU1903 warnings on `dotnet run`. Both advisories (CVE-2026-70162,
CVE-2026-84008, .NET DoS) are fixed in 10.0.13.
**Files:** `backend/src/Construction.Infrastructure/Construction.Infrastructure.csproj`, `docs/BUGS.md`.
**Verification:** `dotnet nuget why` resolves Pkcs 10.0.13 in both projects. `dotnet build -c Release` gives
0 warnings and 0 errors. The Debug build compiled but couldn't copy outputs because the user's running API
locked the Debug DLLs (MSB3021), so restart it to pick up the change.
**Follow-ups:** Remove the pin when a SqlClient/EF Core update brings a patched Pkcs.

## 2026-10-22 — Change Orders tab + Invoices tab (FEAT-026, FEAT-027)
**Refs:** FEAT-026, FEAT-027, ADR-0025 (builds on FEAT-024/025, ADR-0023/0024; reuses FEAT-023's "Record New Expense")
**What:**
- **Backend — change orders:**
  - Domain `ChangeOrder` (`ChangeOrderStatus { Pending, Approved, Rejected }`, `CO-{seq:0000}`, `Approve`/`Reject`
    only from Pending). Migration `AddChangeOrders` (one table, unique `(ProjectId, Sequence)`).
  - `Application/ChangeOrders/` (service, repository interface, DTOs, list query, create command, decision enums);
    `Infrastructure/Repositories/ChangeOrderRepository` (LIKE search on CO#/description/reason, status filter, max + 1,
    totals grouped by status).
  - `Api/Features/ChangeOrders/` (controller at `…/budget/change-orders`: GET list, GET summary, POST,
    POST `{id}/approve`, POST `{id}/reject` → 200/404/409), contracts and a FluentValidation validator.
  - `DbSeeder.SeedChangeOrdersAsync` tops up 12 demo COs (4 Approved, 2 Rejected) for each project with none.
- **Backend — invoices:**
  - `Invoice.MarkPaid`.
  - `InvoiceListQuery` (search + status) replaces page/pageSize on `IInvoiceRepository.SearchByProjectAsync` and
    `IBudgetService.SearchInvoicesAsync`.
  - New `GetAsync`/`GetTotalsAsync` on the repository.
  - `BudgetService.GetInvoiceSummaryAsync` (budget + approved COs; all invoices; Paid + Scheduled) and
    `MarkInvoicePaidAsync`.
  - `BudgetController` gains `search`/`status` on `GET invoices`, plus `GET invoices/summary` and
    `POST invoices/{id}/mark-paid`.
  - `.http` samples and README rows added.
- **Frontend:**
  - `features/change-orders/`: api, hooks (mutations also invalidate `['invoices','summary']`), zod schema,
    `ChangeOrdersPanel`, `ChangeOrdersTable`, `ChangeOrderDetailsDialog` (Reject/Approve), `NewChangeOrderDialog`,
    `ChangeOrderStatusBadge`.
  - `features/invoices/`: api, hooks, `InvoicesTabPanel` ("+ New Invoice" opens `NewExpenseDialog`),
    `InvoicesTable`, `InvoiceDetailsDialog` (Open receipt, Mark as Paid), and `InvoiceStatusBadge`. The badge moved
    out of `InvoicesPanel`, which now uses it.
  - Shared `components/InspectLink` + `.inspect-link` CSS.
  - `useCreateInvoice` also refreshes the Invoice tab.
  - `BudgetPage` renders both panels; Payments/Reports stay "coming soon".
**Why:** The user supplied the Change Order and Invoice tab mockups. Their choices are in ADR-0025:
Pending/Approved/Rejected, "Inspect >" on every row, a simple create modal, and approval only feeding contract value.
**Files:** `backend/src/Construction.Domain/Entities/{ChangeOrder.cs,Invoice.cs}`,
`backend/src/Construction.Application/{ChangeOrders/*,Budget/{BudgetService,IBudgetService,IInvoiceRepository,InvoiceListQuery}.cs,DependencyInjection.cs}`,
`backend/src/Construction.Infrastructure/{Persistence/AppDbContext.cs,Persistence/Migrations/*AddChangeOrders*,Repositories/{ChangeOrderRepository,InvoiceRepository}.cs,DependencyInjection.cs}`,
`backend/src/Construction.Api/{Features/ChangeOrders/*,Features/Budget/{BudgetController,BudgetContracts}.cs,Common/DbSeeder.cs,Construction.Api.http}`,
`README.md`, `frontend/src/features/{change-orders,invoices}/*`, `frontend/src/components/InspectLink.tsx`,
`frontend/src/features/budget/{InvoicesPanel.tsx,budget.hooks.ts}`, `frontend/src/pages/BudgetPage.tsx`,
`frontend/src/index.css`, `docs/{FEATURES,DECISIONS,ARCHITECTURE}.md`.
**Verification:**
- `npm run build` + `npm run lint` pass (only the existing >500 kB chunk warning). `dotnet build` passes with
  0 errors; the only warnings are the existing NU1902/NU1903 advisories on `System.Security.Cryptography.Pkcs`.
- `dotnet run` applied `AddChangeOrders` and seeded 12 COs per project.
- curl:
  - CO list, search "hvac", status=Pending and summary all correct.
  - Create → 201 `CO-0013`. Approve → 200, then approve again → 409. Invalid create → 400 with
    Amount/Description/RequestedDate errors. Unknown CO → 404.
  - Invoice summary Total Contract Value went up by exactly the approved amount (Riverside: $850,000 + $23,603.17).
  - Invoice search/status filters work. Mark-paid → 200 and Approved Invoices moved by the invoice amount.
  - Overview `GET …/budget/summary` → 200.
- `playwright-cli` (headless Chromium) at 1440 px on Riverside Villas:
  - Both tabs match the mockups.
  - Change Orders: page 2 shows 5 rows; "hvac" search → CO-0003, CO-0001; the Rejected filter shows only Rejected.
  - Creating a CO through the modal shows the empty-form errors first, then saves CO-0013 dated today.
  - Inspect → Approve switches the dialog to Approved; the Approved KPI and Total Contract Value went up by $500.
  - Invoices: "curl" search shows 2 rows. Inspect → Mark as Paid hides the button.
  - "+ New Invoice" opens "Record New Expense". Overview still renders.
  - No console errors. At 375 px neither tab scrolls horizontally (the table scrolls inside its card).
- The verification left test data in the dev DB: CO-0013 on both projects (approved), and invoices
  `INV-2026-001` and `#CURL-001` on Riverside marked Paid.
**Follow-ups:** Payments (FEAT-028) and Reports (FEAT-029) tabs. CO edit/delete and revert are not built.
Approvals don't yet touch the schedule or the project budget (ADR-0025). The create-CO modal should be
restyled if a mockup arrives.

## 2026-10-21 — Purchase Orders tab + "Create Purchase Order" modal (FEAT-025)
**Refs:** FEAT-025, ADR-0024 (builds on FEAT-024 / ADR-0023; supersedes the invoice-based Committed POs from FEAT-013/ADR-0022)
**What:**
- **Backend:**
  - Domain `PurchaseOrder` (+ `PurchaseOrderLineItem`, `PurchaseOrderStatus { Pending, Paid }`) — the first
    parent/child aggregate. Migration `AddPurchaseOrders`: two tables, PO-only cascade for lines, unique `(ProjectId, Sequence)`.
  - `Application/PurchaseOrders/` (service, repository interface, DTOs with `ItemSummary`, commands/query, delete-status enum);
    `Infrastructure/Repositories/PurchaseOrderRepository` (LIKE search on PO#/vendor/line description, status filter,
    split-query paging, max + 1 sequence, totals grouped by status).
  - `Api/Features/PurchaseOrders/` (controller at `…/budget/purchase-orders`: GET list, GET summary, POST, POST `{id}/mark-paid`,
    DELETE → 204/404/409), contracts, and a FluentValidation validator with a per-line child validator.
  - `BudgetService.GetSummaryAsync` `committedPOs` now equals the PO total.
  - `DbSeeder.SeedPurchaseOrdersAsync` tops up 12 demo POs (5 Paid) for each project with none.
  - `.http` samples and README rows added.
- **Frontend:**
  - `features/purchase-orders/`: api, hooks (every mutation also invalidates `['budget','summary']`), zod schema,
    `PurchaseOrdersPanel` (header, 4 KPI cards via `BudgetSummaryCard`, Team-style `toolbar-band` search + status
    dropdown), `PurchaseOrdersTable` (`app-table--shaded`, shared pager, "Showing X of Y purchase orders", 👁 + shared ⋮
    `Menu popup`), `PurchaseOrderDetailsDialog`, `PurchaseOrderStatusBadge`, and `NewPurchaseOrderDialog`
    (`useFieldArray` line grid, live totals/SUBTOTAL, stacked lines and buttons on phones).
  - `ConfirmDialog` for delete.
  - `BudgetSummaryCard`: `onOpenDetails` is now optional, and there's a new `fractionDigits` prop.
  - `BudgetPage` renders the panel for `?tab=purchase-orders`.
  - `index.css`: `.po-line-input`, `.po-menu-danger`.
**Why:** The user supplied the Purchase Order tab and Create Purchase Order mockups. They chose Pending → Paid with
⋮ Mark as Paid / Delete, POs as the source of Overview's Committed POs, and a line-item summary under the vendor.
**Files:** `backend/src/Construction.Domain/Entities/PurchaseOrder.cs`,
`backend/src/Construction.Application/{PurchaseOrders/*,Budget/BudgetService.cs,DependencyInjection.cs}`,
`backend/src/Construction.Infrastructure/{Persistence/AppDbContext.cs,Persistence/Migrations/*AddPurchaseOrders*,Repositories/PurchaseOrderRepository.cs,DependencyInjection.cs}`,
`backend/src/Construction.Api/{Features/PurchaseOrders/*,Common/DbSeeder.cs,Construction.Api.http}`, `README.md`,
`frontend/src/features/purchase-orders/*`, `frontend/src/features/dashboard/BudgetSummaryCard.tsx`,
`frontend/src/pages/BudgetPage.tsx`, `frontend/src/index.css`, `docs/{FEATURES,DECISIONS,ARCHITECTURE}.md`.
**Verification:**
- `npm run build` + `npm run lint` pass. `dotnet build -c Release` passes (0 errors).
  - The Debug build compiles but couldn't copy outputs, because the user's running API (:5080) locks the Debug DLLs.
  - The migration was generated with `--configuration Release`.
- A second API instance (Release, Development env) was run on :5081. It applied the migration and seeded the demo POs.
  - The first seed came from a build that predated the realistic item names. I rolled back to
    `AddInvoiceNotesAndReceipt` with `dotnet ef database update` (dropping only the new PO tables) and re-seeded.
- curl against :5081:
  - List: 12 seeded rows. Search "wire" and status=Paid filtered correctly.
  - Summary = budget summary `committedPOs` (64,047.70).
  - Create with 3 lines → 201 `PO-0013`, total 35,900, summary "Electrical materials +2 more".
  - Empty/invalid body → 400 with vendor + per-line messages; no lines → "Add at least one line item."
  - Mark paid moved Disbursed/Committed. Delete Paid → 409; delete Pending → 204.
  - Unknown PO / foreign project → 404.
- Standalone `playwright-core` (MCP bridge not connected) on the user's Vite (:5173), with `/api` re-routed to :5081:
  - 1440 px matches both mockups.
  - Paging (8 of 11 → page 2), search "lumber" → PO-0010, Paid filter, and 👁 details dialog all work.
  - ⋮ Mark as Paid flips the badge and moves the Pending/Disbursed KPIs.
  - ⋮ Delete shows "Delete PO-0013? This can't be undone." and removes the row.
  - Empty submit shows "Vendor is required" / "Item is required".
  - Three lines give totals $20,000 / $7,500 / $8,400 and SUBTOTAL $35,900; removing one gives $28,400.
  - Create → `PO-0015` appears first, and Overview Committed POs = Total Committed ($75,063.67).
  - At 375 px there's no page or dialog overflow.
- The run found a real bug, now fixed: `InputNumber` with only `onValueChange` commits on blur. After a failed submit,
  the cleared error shifted "Add item" mid-click and the click missed. Both inputs now also wire `onChange`.
  The 375 px pass also showed a clipped "Create Purchase Order" button, so the actions now stack below `sm`.
- The test runs left extra dev data on the first project: PO-0013–0015 created, some POs marked Paid, some deleted.
**Follow-ups:** The user's :5080 API must be restarted to serve the new endpoints (it's still the pre-change build).
Possible next steps: edit a PO / its line items, a real approval status, a PO → invoice link, and FEAT-026–029.

## 2026-10-21 — Budget & Finance redesign: sub-tabs, category pager, invoices restyle (FEAT-024)
**Refs:** FEAT-024, FEAT-025–029 (new backlog), ADR-0023 (builds on FEAT-013 / FEAT-023)
**What:**
- New `features/budget/BudgetTabs.tsx` + `budget.tabs.ts`: a `role="tablist"` bar on a teal-bordered
  track with equal segments. The active segment is brand-filled with its `pi` icon. It scrolls horizontally on phones.
- `BudgetPage`: the tab comes from `?tab=` (`useSearchParams`, first use in the repo). Overview shows the
  existing cards + panels; the other tabs show `ComingSoonPage`. The summary cards are outlined.
- `BudgetSummaryCard` gains an optional `className` (Dashboard usage unchanged).
- `CategoryBreakdownPanel`: outlined; paged on the client, 5 per page, with a standalone `Paginator` + `pagerTemplate`
  (shown only when there are more than 5 categories). Colour index = absolute index.
- `InvoicesPanel`: outlined; `app-table app-table--shaded` + `pagerTemplate`; "Showing X of Y invoices" moved
  into `paginatorLeft`; S.No centred.
- `index.css`: `.app-pager.p-paginator` shares the `.app-table` pager rules. New `.app-table--shaded` adds a grey
  header (#e9eaec) and pushes the left content to the left edge (Documents/Team pagers unchanged).
**Why:** The user supplied a new Budget page mockup. They chose placeholder sub-tabs and a URL-backed tab.
**Files:** `frontend/src/pages/BudgetPage.tsx`,
`frontend/src/features/budget/{BudgetTabs.tsx,budget.tabs.ts,CategoryBreakdownPanel.tsx,InvoicesPanel.tsx}`,
`frontend/src/features/dashboard/BudgetSummaryCard.tsx`, `frontend/src/index.css`,
`docs/{FEATURES,DECISIONS,ARCHITECTURE}.md`.
**Verification:**
- `npm run build` + `npm run lint` pass (the first lint run flagged `only-export-components`, which was fixed by moving
  the constants to `budget.tabs.ts`); `dotnet build` passes (0 errors).
- Standalone `playwright-core` script (the MCP bridge wasn't connected), demo user, `/budget` at 1440 px:
  - Overview is active by default. Clicking Reports changes the URL to `?tab=reports` and shows the coming-soon panel; a reload keeps
    Reports; Back returns to `/budget` + Overview; `?tab=bogus` falls back to Overview.
  - Invoices header computes `rgb(233, 234, 236)`; "Showing 1 of 1 invoices" is on the pager row.
  - At 375 px there is no page overflow, and the tablist scrolls horizontally.
- No seeded project has budget categories or more than 3 invoices, so a second run stubbed `…/budget/summary` (7
  categories) and `…/budget/invoices` (20) with `page.route`. Categories page 1 shows 5 rows and page 2 shows the other 2; invoices
  show "Showing 8 of 20" → page 2 starts at S.No 9 → page 3 shows "Showing 4 of 20" starting at S.No 17.
**Follow-ups:** FEAT-025–029 (the real tab content). The mockup's "… 18" ellipsis page link isn't rendered
(PrimeReact `PageLinks` has none; Documents/Team match).

## 2026-10-13 — Compact "Record New Expense" modal (BUG-013)
**Refs:** BUG-013, FEAT-023
**What:**
- New `.form-dialog--compact` modifier in `index.css`: tighter header/content padding, 0.45rem/13.5px inputs and dropdown, a smaller drop zone and tile, and 2.4rem action buttons. The `.expense-status-toggle` buttons are smaller too (0.35rem padding, 14px, 3px track).
- `NewExpenseDialog`: uses the modifier, 13px labels, `gap-2.5` between fields and `gap-1` within them, a 2-row notes field, `mt-1` actions.
- `AttachmentDropZone` gains an optional `compact` prop (13px label, `gap-1`). The other callers are unchanged.
**Why:** The user reported the modal's fields were too large and the content scrolled on desktop (about 980px of content against PrimeReact's 90%-of-viewport cap). The user chose to keep a single column rather than pairing fields.
**Files:** `frontend/src/index.css`, `frontend/src/features/budget/NewExpenseDialog.tsx`,
`frontend/src/components/AttachmentDropZone.tsx`, `docs/{BUGS,FEATURES,ARCHITECTURE}.md`
**Verification:**
- `npm run build` + `npm run lint` pass; `dotnet build` passes.
- playwright-cli against the running dev servers: the dialog is 715px and `.p-dialog-content` has no overflow at 1440×900 or 1366×800. At 1440×900 with the empty-save validation errors shown, it's still no overflow (785px).
- 1280×720 and 375×812 scroll vertically as expected, with no horizontal scroll. On a phone the status buttons stay on one row.
- New Task dialog inputs still use the 0.7rem padding (unchanged).
**Follow-ups:** None. Could apply `form-dialog--compact` to New Log if it gets the same complaint.

## 2026-10-13 — "Record New Expense" modal redesign (FEAT-023)
**Refs:** FEAT-023, ADR-0022 (builds on FEAT-013)
**What:**
- **Backend:**
  - `InvoiceStatus.Scheduled`.
  - `Invoice.Notes` + `ReceiptDocumentId` (FK → `ProjectDocuments`, Restrict). Migration `AddInvoiceNotesAndReceipt`.
  - `CreateInvoiceCommand` gains `ReferenceNumber`/`Notes`/`Receipt`.
  - `BudgetService.CreateInvoiceAsync` uses the reference as the invoice number when given, and stores the receipt.
  - Committed POs = Pending + Scheduled.
  - New shared `Application/Documents/AttachmentUploader`: `BuildAsync`/`SaveWithAsync`, lifted out of `DashboardService`, which now uses it too.
  - `POST …/budget/invoices` is now multipart, with a size limit. `CreateInvoiceRequest` is a nullable-string class, and the validator messages are updated ("Title is required.", "Billing date is required.").
  - The DTOs expose `notes`/`receiptDocumentId`.
  - `.http` sample + README row added.
- **Frontend:**
  - `NewExpenseDialog` rewritten as "Record New Expense": `form-dialog` look, 38rem wide, the mockup's fields, a `$ ` decimal amount, a `dd/mm/yy` calendar, and a `SelectButton` with the new `.expense-status-toggle` CSS (full-width mint track, teal border, brand-filled active segment, regular weight). Notes and the receipt use the shared `AttachmentDropZone`, which gained a `hint` prop. Buttons: Cancel / Record Expense.
  - `createInvoice` sends FormData.
  - `useCreateInvoice` also refreshes the documents queries.
  - Schema: title/categoryId/amount/referenceNumber/billingDate/status/notes/receipt. The category is required only when the project has categories.
  - Scheduled badge (amber) in `InvoicesPanel`.
**Why:** The user supplied the Budget & Finance "Record New Expense" mockup. They chose: title = vendor line, reference # overrides the generated number, Scheduled counts toward Committed POs.
**Files:** `backend/src/Construction.Domain/Entities/Invoice.cs`,
`backend/src/Construction.Application/{Budget/{BudgetService,CreateInvoiceCommand,InvoiceDto}.cs,Documents/AttachmentUploader.cs,Dashboard/DashboardService.cs,DependencyInjection.cs}`,
`backend/src/Construction.Infrastructure/Persistence/{AppDbContext.cs,Migrations/*AddInvoiceNotesAndReceipt*}`,
`backend/src/Construction.Api/Features/Budget/{BudgetController,BudgetContracts,CreateInvoiceRequestValidator}.cs`,
`backend/src/Construction.Api/Construction.Api.http`, `README.md`,
`frontend/src/features/budget/{NewExpenseDialog.tsx,InvoicesPanel.tsx,budget.api.ts,budget.hooks.ts,budget.schema.ts}`,
`frontend/src/components/AttachmentDropZone.tsx`, `frontend/src/index.css`.
**Verification:** `dotnet build` passes (0 warnings). `npm run build` + oxlint pass.
- **curl:**
  - Multipart with `#CURL-001`, a Scheduled status and a PNG receipt returned 201 with that number, `notes` and `receiptDocumentId`.
  - No reference returned `INV-2026-003`.
  - Committed POs went 3111 → 4361.5; a Paid invoice wasn't counted.
  - An empty body returned 400 with Title / Amount / Billing date errors.
- **Playwright** (standalone script), `/budget` at 1440 px:
  - The modal matches the mockup.
  - An empty save shows the Title / Amount / Billing date errors.
  - Filling every field, picking Scheduled and attaching a PNG, then Record Expense, put a first row of "#PW-0042 · Playwright Steel Supply · $2,500.75 · Scheduled". Committed POs went $0.00 → $2,500.75.
  - The receipt is listed on `/documents`.
- At 375 px there is no horizontal scroll and the three status segments stay on one row.
- Neither demo project has budget categories, so the category-required path wasn't exercised live.
**Follow-ups:** The invoice details dialog doesn't show notes or open the receipt yet. Test data left in dev:
- "Riverside Villas": invoices `#CURL-001`, `INV-2026-003`.
- "Controller Migration Test": invoice `#PW-0042`.
- Plus their `pixel.png` receipts.

## 2026-10-13 — Task Log "New Log" modal (FEAT-022)
**Refs:** FEAT-022, ADR-0021 (builds on FEAT-012, FEAT-018, FEAT-019)
**What:**
- **Backend:**
  - `ActivityLogEntry` gains nullable `AssigneeName` (200), `Category` (40) and `AttachmentDocumentId` (FK → `ProjectDocuments`, Restrict). Migration `AddActivityLogDetails`.
  - New `CreateActivityLogCommand` + `ActivityLogCategories.All` (the six trade tags).
  - `DashboardService.CreateActivityLogAsync` checks the project owner and that the task is in the project, stores the attachment as a `ProjectDocument` under the task's phase, and adds a numbered entry.
  - The attachment code in `CreateTaskAsync` was extracted into `BuildAttachmentAsync` / `SaveWithAttachmentAsync`. `AddLogEntryAsync` takes the optional fields and returns the entry.
  - DTO: `assigneeName` = the entry's own, else the task's; new `category` and `attachmentDocumentId`.
  - New `POST /api/projects/{id}/activity-log` (multipart) + `CreateActivityLogRequestValidator`. `.http` sample and README row added.
- **Frontend:**
  - New `features/task-log/NewLogDialog.tsx` (`form-dialog` look): task dropdown (filterable, phase subtitle, pre-fills the assignee), `.log-chip` single-select chips, `AssigneeDropdown` (new `placeholder` prop), Log Note, attachment, Cancel / Create Log.
  - `TaskLogPanel` uses it and shows a success `Toast` ("LOG-2026-016 created").
  - New shared `components/AttachmentDropZone.tsx`, extracted from `NewTaskDialog`, which now uses it with no visible change.
  - `createActivityLog` + `useCreateActivityLog`, which invalidates the Recent Log and the documents queries. `createLogSchema` + `logCategoryOptions`.
  - `LogDetailsDialog` shows the trade tag next to the phase and an "Open attachment" link.
**Why:** The user supplied the Task Log "New Log" mockup. They chose: a log is an entry on an existing task (the mockup has no deadline, so it can't be a task), and the chips are fixed trade tags.
**Files:** `backend/src/Construction.Domain/Entities/ActivityLogEntry.cs`,
`backend/src/Construction.Application/Dashboard/{CreateActivityLogCommand,ActivityLogEntryDto,IDashboardService,DashboardService}.cs`,
`backend/src/Construction.Infrastructure/Persistence/{AppDbContext.cs,Migrations/*AddActivityLogDetails*}`,
`backend/src/Construction.Api/Features/Dashboard/{DashboardController,DashboardContracts,CreateActivityLogRequestValidator}.cs`,
`backend/src/Construction.Api/Construction.Api.http`, `README.md`,
`frontend/src/components/AttachmentDropZone.tsx`,
`frontend/src/features/task-log/{NewLogDialog,TaskLogPanel}.tsx`,
`frontend/src/features/dashboard/{NewTaskDialog,LogDetailsDialog,AssigneeDropdown}.tsx`,
`frontend/src/features/dashboard/dashboard.{api,hooks,schema}.ts`, `frontend/src/index.css`.
**Verification:** `dotnet build` passes (0 warnings). `npm run build` + `npm run lint` pass. The API was restarted, and the migration applied on startup.
- **curl:**
  - A valid multipart request with a PNG returned 201 with `LOG-2026-015`, `category: Structural`, the entry's own assignee and an `attachmentDocumentId`.
  - An empty request with an unknown category returned 400 with per-field errors (TaskId, Category, AssigneeName, Note).
  - An unknown task id returned 404.
- **Playwright** (standalone `playwright-core` script), `/task-log` at 1440 px:
  - The modal matches the mockup. All six chips sit on one row once the chip padding was tightened and the dialog widened to 38rem.
  - Framing is preselected.
  - Saving the empty form shows the 3 required errors.
  - Picking a task pre-fills its assignee.
  - Structural toggles on.
  - Note + PNG → Create Log shows the toast "LOG-2026-016 created — Logged on …", and reopening shows a reset form.
  - Dashboard Recent Log → View Details shows the note, the "Structural" tag, the assignee and "Open attachment".
  - `/documents` lists the file.
  - "Assign New Task" looks the same after the drop-zone extraction.
  - At 375 px there is no horizontal scroll and the chips wrap.
**Follow-ups:** There is no list or filter of logs on the Task Log page. A log doesn't move the task's status. Test data left in dev on "Controller Migration Test": log entries `LOG-2026-015`/`016` and two `pixel.png` documents.

## 2026-10-13 — "Assign New Milestone" modal redesign (FEAT-021)
**Refs:** FEAT-021, FEAT-011, ADR-0020
**What:**
- Rewrote `NewMilestoneDialog` to match the mockup, using the shared `.form-dialog` look from "Assign New Task": header "Assign New Milestone" with a divider, then Milestone / Phase Title ("Enter details"), Construction Phase dropdown ("Select a phase"), and Deadline with Start date + Completion date calendars side by side from `sm` (stacked on phones; the completion `minDate` is the start date). Equal full-width Cancel/Save. Cancel / ✕ resets the form, and closing is blocked while saving. Server validation messages are shown in the error alert.
- `schedule.schema.ts`: new `constructionPhaseOptions` (11 standard phases), `createPhaseSchema` is now title/phase/startDate/endDate, and new `derivePhaseStatus`. Removed the unused `phaseStatusOptions`.
- Payload mapping: phase → `name` (row heading), title → `checkpointLabel` (bar label), status/percent derived from the dates. Frontend only.
**Why:** The user supplied the Schedule-page mockup for the "+ New Milestone" modal. They chose the phase-list mapping and date-derived status (ADR-0020).
**Files:** `frontend/src/features/schedule/{NewMilestoneDialog.tsx,schedule.schema.ts}`, `docs/{FEATURES,DECISIONS,DEVELOPMENT_HISTORY}.md`.
**Verification:** `npm run build` + `npm run lint` pass (fixed one oxlint `incompatible-library` warning by using `useWatch` instead of `watch`); `dotnet build` passes (0 warnings). Live Playwright run (standalone `playwright-core` script; the MCP browser bridge wasn't connected), demo user, `/schedule`:
- At 1440 px the modal matches the mockup.
- Save on the empty form shows all 4 required errors.
- A completion date typed before the start date is rejected by `minDate`, so the save is blocked.
- Cancel resets the form.
- "Roofing" from today+7 to today+30 created a row "Roofing · Upcoming", with the title on the bar.
- "Exterior Envelope" from today−3 to today+12 created a row "0% In Progress".
- At 375 px there is no horizontal scroll and the dates stack.
**Follow-ups:** Milestone edit (status/percent/dates) doesn't exist yet. Two QA milestones ("QA Upcoming Milestone", "QA Current Milestone") were left on the demo user's "Controller Migration Test" project; they are harmless in dev.

## 2026-09-25 — Edit task flow (FEAT-020)
**Refs:** FEAT-020, ADR-0019 (FEAT-018 follow-up)
**What:**
- **Backend:**
  - `ProjectTask.Update(title, assignee, deadline, phaseId, status, now)`, which `Create` now calls.
  - `IProjectTaskRepository.GetAsync`.
  - New `UpdateProjectTaskCommand` + `TaskUpdateResult` (`Updated | NotFound | DeadlineBeforeAssigned`).
  - `DashboardService.UpdateTaskAsync`: an unknown phase id is saved as `null`, and a status change adds a `Task "…" marked <Status>` log row. The log-number code moved into a private `AddLogEntryAsync` that create also uses.
  - New `PUT /api/projects/{id}/tasks/{taskId}` (JSON) + `UpdateProjectTaskRequestValidator`. The deadline error returns the usual `errors.deadline` shape.
  - `.http` sample added.
- **Frontend:**
  - `updateProjectTask` + `useUpdateProjectTask`. Both task mutations share `invalidateTaskQueries`.
  - `editTaskSchema` (no "not in the past" rule).
  - New `AssigneeDropdown` (moved out of `NewTaskDialog`; `currentName` keeps a non-member's saved assignee).
  - New `EditTaskDialog`: Task Details, Assigned To, Deadline (min = assigned date), Phase + Status side by side from `sm`. Save stays disabled until something changes.
  - `TaskDetailsDialog` has an **Edit** button and owns the edit step, so Schedule and Task Log are unchanged.
  - Dashboard Assigned Tasks: the task title is now a button that opens Task details.
**Why:** The FEAT-018 follow-up. The create dialog no longer sets Phase/Status, so tasks couldn't reach a phase or be completed. The user chose: Edit in Task details + Dashboard; all fields except the attachment; a log row only on status change.
**Files:** `backend/src/Construction.Domain/Entities/ProjectTask.cs`,
`backend/src/Construction.Application/Dashboard/{IProjectTaskRepository,IDashboardService,DashboardService,UpdateProjectTaskCommand}.cs`,
`backend/src/Construction.Infrastructure/Repositories/ProjectTaskRepository.cs`,
`backend/src/Construction.Api/Features/Dashboard/{DashboardController,DashboardContracts,UpdateProjectTaskRequestValidator}.cs`,
`backend/src/Construction.Api/Construction.Api.http`,
`frontend/src/features/dashboard/{AssigneeDropdown,EditTaskDialog,TaskDetailsDialog,NewTaskDialog,AssignedTasksPanel}.tsx`,
`frontend/src/features/dashboard/{dashboard.api,dashboard.hooks,dashboard.schema}.ts`,
`README.md`, `docs/*`.
**Verification:**
- `dotnet build` shows 0 warnings and 0 errors. `npm run build` passes (only the existing chunk-size warning) and oxlint exits 0.
- curl against `PUT …/tasks/{id}` (Riverside Villas, "Pour foundation slab"):
  - phase + `InProgress` → 200 with `phaseName`, and a `LOG-2026-012 … marked In Progress` row
  - same status with a new deadline → 200, no new log row
  - deadline before the assigned date → 400 `deadline`; empty title → 400
  - unknown phase → 200 with `phaseId: null`
  - unknown task or project → 404
  - the task was restored afterwards (that added `LOG-2026-013 … marked Upcoming`)
- Playwright (cached-Chromium script), 1440 px and 375 px:
  - Dashboard title → Task details → Edit: fields prefilled, including "QA Bot", who isn't a team member. Save is disabled until a change. Cancel closes everything.
  - Phase + In Progress → Save closes both dialogs, the Recent Log shows the status row, and reopening shows the new phase and status.
  - Task Log shows the new phase subtitle and status badge. Edit there restored "No phase"/Upcoming via the clear icon.
  - Schedule Upcoming Deadlines → Edit opens.
  - No horizontal scroll and no page or console errors.
  - Found during verification: a "View Details" column squeezed the Assigned Tasks "Task" column to 0 px at 1440 px. It was replaced by the clickable title, and the Task column is back to 106 px.
**Follow-ups:**
- Attachments can't be replaced or removed on edit.
- There's no edit history beyond status rows.
- The seeded Riverside log rows have future dates, so new rows sort below them there.
- Test data remains: "Controller QA task" (restored to Upcoming/no phase) and "Pour foundation slab" each gained status log rows.
- The API process (PID 53456) was stopped to rebuild. An API started from this session is running on :5080.

---

## 2026-09-25 — Dashboard "Log details" redesign + editable description (FEAT-019)
**Refs:** FEAT-019, BUG-012, ADR-0018
**What:**
- **Backend:**
  - `ActivityLogEntry` gains `LogNumber` (a `Create` parameter) and `UpdateDescription`.
  - `DashboardService.CreateTaskAsync` numbers new entries `LOG-{year}-{count+1:000}` (the invoice pattern).
  - `IActivityLogRepository` gains `CountByProjectAsync` and `GetAsync`.
  - `ActivityLogEntryDto` (Application + API) adds `LogNumber`, `TaskTitle`, `AssigneeName`, `PhaseName` and `PhaseNumber`. A private `ToDtosAsync` joins entries to tasks and phases, with phases numbered in start-date order.
  - New `PUT /api/projects/{id}/activity-log/{entryId}` (`UpdateActivityLogRequest` + validator, 1–2000 chars).
  - Migration `AddActivityLogNumber`: `Description` goes from 500 to 2000 (BUG-012); `LogNumber` is added and backfilled with `ROW_NUMBER()` + `FORMAT(n,'000')`. `Down` truncates descriptions to 500 before shrinking the column.
  - `.http` sample added.
- **Frontend:**
  - New `LogDetailsDialog` with a custom header (grey `#LOG-…` chip • date, task title clamped to 2 lines), a light-blue Phase/Milestone + Assignee box, and an editable light-blue Description (RHF + zod `logDescriptionSchema`). Save stays disabled until the text changes.
  - `useUpdateActivityLog` invalidates the activity log.
  - `RecentLogPanel` uses the new dialog.
  - `.assign-task-dialog`/`.assign-task-actions` were renamed to the shared `.form-dialog`/`.form-dialog-actions`; `NewTaskDialog` is updated. Added `.log-info-box`/`.log-description`, plus `min-width: 0` on the dialog title so long titles wrap.
**Why:** The user supplied the log-details mockup and asked to check what the backend needed. They chose: Save edits the description, and only the Dashboard Recent Log changes. BUG-012 was found while planning.
**Files:** `backend/src/Construction.Domain/Entities/ActivityLogEntry.cs`,
`backend/src/Construction.Application/Dashboard/{ActivityLogEntryDto,IActivityLogRepository,IDashboardService,DashboardService}.cs`,
`backend/src/Construction.Infrastructure/{Repositories/ActivityLogRepository.cs,Persistence/AppDbContext.cs,Persistence/Migrations/*AddActivityLogNumber*}`,
`backend/src/Construction.Api/Features/Dashboard/{DashboardController,DashboardContracts,UpdateActivityLogRequestValidator}.cs`,
`backend/src/Construction.Api/Construction.Api.http`,
`frontend/src/features/dashboard/{LogDetailsDialog,RecentLogPanel,NewTaskDialog}.tsx`,
`frontend/src/features/dashboard/{dashboard.api,dashboard.hooks,dashboard.schema}.ts`, `frontend/src/index.css`,
`README.md`, `docs/*`.
**Verification:**
- `dotnet build` shows 0 errors. `npm run build` passes (only the existing chunk-size warning) and oxlint exits 0.
- The migration applied on startup, and existing entries were backfilled (`LOG-2026-001…009` on the test project).
- curl:
  - `POST …/tasks` with a 1000-char title → 201, and the new entry got `LOG-2026-010` (BUG-012)
  - the list returns task title and assignee, and `phaseName`/`phaseNumber` (1) for a phased task
  - `PUT` → 200 with the new text
  - empty or 2001 chars → 400 with the validator messages
  - unknown entry → 404; unknown project → 404
- Playwright (cached-Chromium script), 1440 px and 375 px:
  - matches the mockup layout, with no horizontal scroll and no page errors
  - Save is disabled until edited; Cancel discards the edit
  - Save closes the dialog and updates the Recent Log row, and reopening shows the saved text
  - a 1000-char spaceless title clamps to 2 lines and the close button stays visible (fixed during verification)
**Follow-ups:**
- Log numbers could collide under concurrent inserts (the same accepted risk as invoice numbers).
- There's no edit history for descriptions.
- Test data remains in the dev DB, including the 1000-"x" task and edited log text.
- The user's API process (PID 42412) was stopped to rebuild. An API instance started from this session is running.

---

## 2026-09-25 — "Assign New Task" modal redesign + task attachments (FEAT-018)
**Refs:** FEAT-018, BUG-011, ADR-0017
**What:**
- **Frontend:** `NewTaskDialog` was rewritten to match the mockup.
  - Fields: header "Assign New Task" with an inset divider; Task Details `InputTextarea`; "Assigned To:" `Dropdown` of active team members (via `useTeamMembers`, name + role item template, filter when there are more than 8, empty message pointing at Team); Deadline `Calendar` (`dd/mm/yy`, `minDate` today).
  - Dashed attachment zone: camera tile, "Browse" pill, drag and drop. Once a file is picked it shows the name and size with Change and ×.
  - Footer: equal full-width Cancel/Save.
  - Scoped CSS lives in `index.css` under `.assign-task-dialog`, `.assign-task-actions` and `.assign-task-drop*`.
  - `createTaskSchema` is now title (≤ 1000), assignee, deadline (not past) and an optional attachment (≤ 25 MB, `ALLOWED_EXTENSIONS`). `extensionOf` is exported from `documents.schema.ts` for this.
  - `createProjectTask` posts `FormData`. `useCreateProjectTask` also invalidates the Task Log, documents and team queries (BUG-011).
  - `TaskDetailsDialog` shows the full text and an "Open attachment" link. The new `lib/download.ts` `openBlobInNewTab` is shared with `DocumentsTable`.
- **Backend:**
  - `ProjectTask.AttachmentDocumentId`, an FK to `ProjectDocuments` with Restrict, indexed. `Title` max goes from 200 to 1000. Migration `AddTaskAttachment`.
  - `DocumentUploadRules` gains `TaskAttachmentMaxSizeBytes` (25 MB) and `StorageKeyFor(...)`, now also used by `DocumentService`.
  - `CreateProjectTaskCommand` takes an optional `TaskAttachment`.
  - `DashboardService.CreateTaskAsync` stores the file, then writes the document, task and activity rows in one save, and deletes the file if the save fails.
  - `POST …/tasks` is `[FromForm]` multipart with request-size limits. The request class has nullable strings, and the validator adds the attachment rules.
  - Both task DTOs expose `AttachmentDocumentId`. The `.http` sample is now multipart.
**Why:** The user supplied the "Assign New Task" mockup and asked for a frontend and backend redesign. They chose: Task Details = task text, one dialog everywhere with only the mockup's fields, and attachments stored in the Document repository.
**Files:** `frontend/src/features/dashboard/{NewTaskDialog,TaskDetailsDialog}.tsx`,
`frontend/src/features/dashboard/{dashboard.api,dashboard.schema,dashboard.hooks}.ts`,
`frontend/src/features/documents/{documents.schema.ts,DocumentsTable.tsx}`,
`frontend/src/lib/download.ts`, `frontend/src/index.css`,
`backend/src/Construction.Domain/Entities/ProjectTask.cs`,
`backend/src/Construction.Application/{Dashboard/{CreateProjectTaskCommand,DashboardService,ProjectTaskDto}.cs,Documents/{DocumentUploadRules,DocumentService}.cs}`,
`backend/src/Construction.Infrastructure/Persistence/{AppDbContext.cs,Migrations/*AddTaskAttachment*}`,
`backend/src/Construction.Api/Features/Dashboard/{DashboardController,DashboardContracts,CreateProjectTaskRequestValidator}.cs`,
`backend/src/Construction.Api/Construction.Api.http`, `README.md`, `docs/*`.
**Verification:**
- `npm run build` passes (only the existing chunk-size warning) and `npm run lint` (oxlint) exits 0. `dotnet build` shows 0 warnings and 0 errors. The migration applied on startup.
- curl against `POST …/tasks`:
  - no attachment → 201
  - 1 MB PDF → 201 with `attachmentDocumentId`, and the document is listed in `GET …/documents`
  - 30 MB → 400 "Request body too large" (the UI maps this to "Attachments must be 25 MB or smaller")
  - `.exe` → 400 "This file type isn't supported."
  - deadline before assigned date → 400
  - empty title/assignee → 400 with the validator's messages. MVC's implicit-required message showed up first and was fixed with nullable request strings.
- Playwright (cached Chromium via a scratch script, because the MCP bridge wasn't connected):
  - 1440 px and 375 px: modal matches the mockup, no horizontal scroll, no page errors.
  - Empty Save → three inline errors. The dropdown lists 10 active members with roles.
  - Save with a PDF → the task shows in Assigned Tasks and a Recent Log row appears. The file is listed on `/documents`.
  - Schedule "+ New Task" and Task Log "New Log" open the same "Assign New Task" dialog.
  - Task details "Open attachment" opens a blob tab.
**Follow-ups:**
- An edit-task flow, for Phase/Status now that the create dialog doesn't set them. Tasks created here don't appear on the Schedule roadmap until they have a phase.
- A document delete must handle tasks that reference the document (the FK is Restrict).
- Test tasks and `sample.pdf` documents created during verification remain in the dev DB ("Curl check …", "Playwright check …").
- The running API dev server was stopped to rebuild and was restarted afterwards.

---

## 2026-09-23 — Construction Phases card: design sizing
**Refs:** BUG-010, FEAT-011
**What:** Made the card as compact as the design frame (1117 × 618). Only sizes changed; layout, colors, row borders and behavior are the same.
- Spacing: card `p-6` → `p-5`, list `mt-5 gap-3`.
- Header band: `h-8 px-3` with 11 px labels.
- Rows: `px-3 py-3`, 15 px titles, 14 px dates.
- Bars: `h-7 rounded-md`, 11 px labels.
- The zoom toggle is 12 px with tighter padding.
- `StatusBadge` gained an opt-in `compact` prop (`px-2 py-0.5 text-[11px]`). Its other callers are unchanged.
- The label-fit constants (`BAND_INSET_PX` 12, half-width 32, slot 76) were rescaled to the new inset and type size.

**Why:** Compared with the design, the user said "the design is smaller" and chose to change sizes only, keeping every row bordered.
**Files:** `frontend/src/features/schedule/{PhaseTimelinePanel,PhaseRow}.tsx`,
`frontend/src/components/StatusBadge.tsx`, `frontend/src/index.css`.
**Verification:**
- `npm run build` + `npm run lint` pass (only the existing chunk warning). No backend change.
- Playwright on `/schedule` (Riverside Villas) at every zoom level, 1440 px and 375 px:
  - Rows are about 98 px apart (design about 96 px), and the band and bars are 28–32 px tall.
  - The Day-view 01–23 Sep segments still end where "SEP 24" begins.
  - No label overlaps the caption, there is no horizontal scroll and there are no console errors.

**Follow-ups:** None.

---

## 2026-09-23 — Schedule "Construction Phases" card: aligned axis, working zoom, mockup styling (BUG-010)
**Refs:** BUG-010, FEAT-011
**What:**
- `phaseTimeline.utils.ts`:
  - New `ZoomLevel`/`ZOOM_LEVELS`.
  - `computeTimelineRange(phases, zoom)` snaps the range outward to whole units: day, week, month, or quarter (quarters by hand, no dayjs plugin). It replaces the 5% padding, and Day zoom gets one day of air on each side.
  - `buildTimelineTicks(range, zoom, maxLabels)` replaces `buildDateScaleTicks`. It returns one tick per unit with its position and width on the bar axis, plus `isCurrent`. Only every n-th tick keeps a label.
  - `getPhaseBarMetrics` now counts the end date inclusively.
- `PhaseTimelinePanel`:
  - Zoom defaults to Month and feeds the range and ticks.
  - A new `TimelineHeader` is a blue "PHASE / TASK" band. Its tick labels are centered in their unit and use the same border + `px-6` track geometry as the rows.
  - A ResizeObserver measures the axis. That width sets the label budget (about 88 px per label) and skips labels that would overlap the caption or spill past the right edge.
- `PhaseRow`:
  - A full-width pale track with white gridlines at the labeled ticks.
  - The segment is colored by status: brand for Completed; amber-100 with an amber-200 `percentComplete` fill for In Progress; blue-200 for Upcoming, whose label gets "(N%)" when above zero.
  - Larger `text-brand-ink` title and slate-700 dates. The bar label has a `title` tooltip.
  - The shared `StatusBadge` is unchanged.
- `index.css`: scoped `.schedule-zoom-toggle` rules make a mint pill with borderless segments and a brand-filled selection. The generic SelectButton rules stay.

**Why:** The user flagged the card against its original mockup. The date labels didn't line up with the bars, the zoom did nothing, and the styling had drifted. The user chose a real-date Gantt (not the mockup's left-anchored progress bars) and a working zoom.
**Files:** `frontend/src/features/schedule/{phaseTimeline.utils.ts,PhaseTimelinePanel.tsx,PhaseRow.tsx}`,
`frontend/src/index.css`, `docs/{BUGS,FEATURES}.md`.
**Verification:**
- `npm run build` + `npm run lint` pass (only the existing chunk-size warning). No backend change.
- A scripted Playwright run of `/schedule` (Riverside Villas) clicked each zoom level at 1440 px and 375 px:
  - No horizontal scroll and no console errors.
  - Day view at 1440 px: the 01–23 Sep segments end exactly where the "SEP 24" unit (Ceiling) begins.
  - Labels never overlap "PHASE / TASK". At 375 px they thin to one or two.
  - The status colors and the mint toggle match the mockup.

**Follow-ups:** The mockup's rectangular badge style wasn't applied: `StatusBadge` is shared with Task Log, Dashboard, and Team.

---

## 2026-09-23 — Dashboard Assigned Tasks / Recent Log cards restyle (FEAT-017)
**Refs:** FEAT-017
**What:** New scoped `.p-datatable.dash-table` rules in `index.css`: a `#e8e8e8`
header band with title-case, non-wrapping labels; 13 px / 500 cells with
`1.15rem` vertical padding; `table-layout: fixed`, with cells that truncate on one
line; a `.dash-table__center` S.No. New `.dash-link` (blue) for links. Both panels
became `h-full` bordered cards with a `text-xl` slate-900 title. Recent Log's
title row is `h-9`, so both tables start at the same height. `AssignedTasksPanel`
moved the external-link icon into its own narrow column, which aligns the icons
the way the mockup does, and the icon link now has a per-row `aria-label`. Fixed
column widths are sized to fit the ~500 px card content at 1440 px with the
sidebar expanded (the dates use `0.5rem` side padding). The Task and description
cells carry `title` tooltips.
**Why:** The user supplied a mockup of the two dashboard cards. The style is
scoped to the dashboard so the other tables (Task Log, Documents, Team, invoices)
are unchanged.
**Files:** `frontend/src/{index.css,features/dashboard/{AssignedTasksPanel,RecentLogPanel}.tsx}`,
`docs/FEATURES.md`.
**Verification:** `npm run build` + `npm run lint` pass (only the existing chunk
warning); no backend change. Playwright at 1440 px: the header is `rgb(232, 232, 232)`
and not uppercase; both tables start at the same y (±1 px); neither card scrolls
horizontally; only the Task cell truncates (the dates are shown in full). View
Details opens the log dialog. At 375 px the page doesn't overflow (the table
scrolls inside its card). No console errors. Screenshots were compared with the
mockup.
**Follow-ups:** The link blue (`#2563eb`) follows the mockup; other pages still
use brand-green links.

---

## 2026-09-23 — Sidebar redesign + collapsible icon rail (FEAT-016)
**Refs:** FEAT-016
**What:**
- New `stores/uiStore.ts` (zustand + persist, `construction-ui`):
  `sidebarCollapsed` / `toggleSidebar`.
- New `components/SidebarLogo.tsx`: the mockup's placeholder mark, a teal hollow
  square + "LOGO", with a `compact` (square-only) variant for the rail. Used in
  `AppSidebar` and the `Topbar` mobile drawer. `LogoMark` is unchanged (onboarding).
- `AppSidebar` restyled: `#f8f8f8` background, logo / project / nav sections with
  dividers, a "< >" toggle tab (`pi-code`) on the right edge (`aria-expanded`,
  label "Collapse/Expand sidebar"), width `w-72` ↔ `w-20`. The New Project button
  becomes icon-only with a tooltip when collapsed. The switcher has a grey
  "Project" chip, name, description line and a brand `pi-sort` icon, and is hidden
  when collapsed.
- `NavLinks` gains a `collapsed` prop: icon-only links with `aria-label` +
  PrimeReact `Tooltip`. The look now matches the mockup (17 px, `text-xl` icons,
  `rounded-lg`).
- `navItems.ts`: outline icons (`pi-chart-bar`, `pi-calendar`, `pi-clipboard`,
  `pi-dollar`, `pi-file`, `pi-users`).
- `index.css`: `.p-button.p-component.sidebar-new-project` (6 px radius,
  left-aligned label; the extra classes beat the global pill rule, as in BUG-009)
  + an icon-only variant.
**Why:** The user supplied a sidebar mockup. They chose: second line = description
(no address field), toggle = collapse to an icon rail, logo = literal "LOGO"
placeholder.
**Files:** `frontend/src/{stores/uiStore.ts,components/{AppSidebar,SidebarLogo,NavLinks,Topbar}.tsx,components/navItems.ts,index.css}`, `docs/{FEATURES,ARCHITECTURE}.md`.
**Verification:** `npm run build` + `npm run lint` pass (only the existing chunk
warning); `dotnet build` 0/0. Playwright scratch script (17/17 PASS), at 1440 px
on `/budget`: the sidebar is 288 px; "LOGO" is visible; New Project has a 6 px
radius, brand fill and a left-aligned label; the switcher shows the chip, name
and description, and switching projects works; Budget is the active link. The
toggle makes it 80 px, with labels and switcher hidden, a tooltip on hover, and
the icon link navigating to `/team`. The state persists across reload, and the
toggle expands it back to 288 px. At 375 px the aside is hidden and the drawer
shows LOGO + 6 links. No overflow, no console errors. Screenshots were compared
with the mockup.
**Follow-ups:** Replace the "LOGO" placeholder once a real logo exists. The
project switcher could show an address if one is ever added to `Project`.

---

## 2026-09-23 — Fix Calendar trigger rendering as a filled pill (BUG-009)
**Refs:** BUG-009, BUG-005
**What:** In `index.css`, `.p-calendar .p-datepicker-trigger` and its `:enabled:hover`
rule now include `.p-button` (`.p-calendar .p-button.p-datepicker-trigger`).
**Why:** The trigger is a `.p-button`, so the global filled-button rule
(`.p-button:not(.p-button-outlined):not(.p-button-text)`, 0,3,0; hover 0,5,0)
beat the calendar rules (0,2,0 / 0,4,0). It made the trigger a brand-green pill,
taller than the input. With the extra class the specificity ties, and the
calendar block comes later, so it wins. This is the same override approach as
the SelectButton fix (BUG-005).
**Files:** `frontend/src/index.css`, `docs/BUGS.md`.
**Verification:** `npm run build` + `npm run lint` pass (only the existing chunk
warning); `dotnet build` 0/0. Playwright scratch script at 1440 px, on the Task
Log Date Range and on the New Task dialog's date field: the trigger background
is `rgb(255, 255, 255)`, its radius is `0 10px` (end-cap), its height equals
the input's, and there is no gap. On Task Log, hover gives `#f8fafc`, and a click
opens the date picker. No console errors. Screenshots confirm. The Milestone
and Expense dialogs use the same rule and were not opened.
**Follow-ups:** none.

---

## 2026-09-23 — Fix search-field double border (BUG-008); file BUG-009
**Refs:** BUG-008, BUG-009
**What:** New `.search-field` class in `index.css`: a bordered wrapper with a
leading icon, the same border, radius, height and focus ring as a `Dropdown`,
with a borderless, transparent inner `.p-inputtext`. `TaskLogToolbar` uses it
in place of its Tailwind-styled `<span>`. `.topbar-search .p-inputtext` gains
`border: none`. Removed the ineffective `border-0 bg-transparent p-0 shadow-none`
utilities from both inputs and added `aria-label`s ("Filter task log", "Search").
**Why:** BUG-008. Tailwind utilities are layered, so they can't override the
unlayered global `.p-inputtext` border and padding. The inputs drew a box inside
their wrappers.
**Files:** `frontend/src/index.css`, `frontend/src/features/task-log/TaskLogToolbar.tsx`,
`frontend/src/components/Topbar.tsx`, `docs/{BUGS,ARCHITECTURE}.md`.
**Verification:** `npm run build` + `npm run lint` pass (only the existing chunk
warning); `dotnet build` 0/0. Playwright scratch script at 1440 px on `/task-log`:
both search inputs have `border-top-width: 0px`; the search field is 49 px, the
same as the dropdowns. Focus puts the brand ring on the wrapper and none on the
input. Typing a non-matching term still filters the table to "No tasks". At
375 px there is no overflow, and there are no console errors. Screenshots show
a single border.
**Follow-ups:** BUG-009 (Calendar `showIcon` trigger picks up the filled-button
style).

---

## 2026-09-23 — Fix dropdown double border (BUG-007); restore backend build; file BUG-008
**Refs:** BUG-007, BUG-008
**What:**
- `index.css` Dropdown block: `.p-dropdown .p-dropdown-label` gets `border: none;
  border-radius: 0` (the label is also a `.p-inputtext`, so the global input
  border drew a box inside every dropdown). `.p-dropdown .p-dropdown-label:enabled:focus
  { box-shadow: none }` stops the editable Team role `<input>` from drawing an
  inner focus ring inside the dropdown's `.p-focus` ring. `.p-dropdown.p-invalid`
  now sets the red border, which the unlayered `.p-dropdown` border had
  overridden. Removed the now-redundant `.toolbar-band` label rule.
- Reverted `Features/Budget/BudgetContracts.cs` and
  `Features/Dashboard/DashboardContracts.cs` to their committed state, with fully
  qualified `Construction.Application.*` types in the `From(...)` methods. This
  fixes the build break recorded in the FEAT-015 entry below (user approved).
**Why:** BUG-007, filed during FEAT-015. The API had to build for the browser check.
**Files:** `frontend/src/index.css`, `backend/src/Construction.Api/Features/{Budget/BudgetContracts,Dashboard/DashboardContracts}.cs`, `docs/BUGS.md`.
**Verification:** `npm run build` + `npm run lint` pass (only the existing
>500 kB chunk warning); `dotnet build` 0 warnings / 0 errors. Playwright scratch
script at 1440 px: every `.p-dropdown-label` has `border-top-width: 0px` on
`/register` (phone field), `/task-log`, `/team` and `/onboarding`. In the
Team invite dialog, the focused role input has `box-shadow: none` and no border,
and the outer dropdown shows the focus ring. Submitting with the role empty turns
the role dropdown border `rgb(220, 38, 38)`. At 375 px, `/task-log` and `/team`
have no horizontal overflow. No console errors. Screenshots show a single border
per dropdown. The New Task, Milestone, Expense and Upload dialogs were not
opened; they use the same global rule.
**Follow-ups:** BUG-008 (the Task Log search input and topbar search show an
inner input border; same root cause).

---

## 2026-09-23 — Team page: project team members (FEAT-015); file BUG-007
**Refs:** FEAT-015, BUG-007, ADR-0016
**What:**
- **Backend:** Domain `TeamMember` (+ `TeamMemberStatus`). `Application/Team/`:
  `ITeamService`/`TeamService` (search, roles, export, create, update,
  set-status; owner-scoped; `TeamMemberSaveResult` carries NotFound /
  DuplicateEmail → 404 / 409), `ITeamMemberRepository`, DTO/commands/query.
  `IProjectTaskRepository.CountOpenByAssigneeAsync` (open tasks per assignee,
  case-insensitive) feeds `ActiveTaskCount`. Infrastructure:
  `TeamMemberRepository`, `AppDbContext` mapping (unique `(ProjectId, Email)`,
  phase FK `ClientSetNull`), migration `AddTeamMembers`. Api:
  `Features/Team/` `TeamController` (list/roles/export/create/update/status),
  `TeamContracts`, `TeamValidators`, `TeamCsv` (RFC-4180 + CSV-injection
  guard + BOM). `DbSeeder` gained an idempotent `SeedTeamMembersAsync` top-up
  (12 sample members; the first five are the seeded task assignees).
- **Frontend:** `features/team/` (`team.api.ts`, `team.hooks.ts`,
  `team.schema.ts`, `TeamPanel`, `TeamTable`, `TeamStatusBadge`,
  `TeamMemberDialog` for details + deactivate/reactivate + edit,
  `TeamMemberFormDialog` shared by invite and edit, with an editable role
  dropdown that suggests existing roles, and a 409 message) +
  `pages/TeamPage.tsx`. `/team` is no longer a stub. Extracted from Documents:
  `components/pagerTemplate.tsx`, `lib/download.ts`, and the CSS renames
  `.documents-table` → `.app-table`, `.documents-paginator__nav` →
  `.pager-nav`, `.documents-search` → `.flat-search`. New `.toolbar-band`.
**Why:** User supplied the Team mockup and approved the plan (invite = member
record only; active tasks = name match; real seed data in `DbSeeder`).
**Files:** `backend/src/Construction.{Domain/Entities/TeamMember.cs,
Application/{Team/*,Dashboard/IProjectTaskRepository.cs,DependencyInjection.cs},
Infrastructure/{Repositories/{TeamMemberRepository,ProjectTaskRepository}.cs,
Persistence/AppDbContext.cs,Persistence/Migrations/*AddTeamMembers*,
DependencyInjection.cs},Api/{Features/Team/*,Common/DbSeeder.cs}}`,
`frontend/src/{features/team/*,pages/TeamPage.tsx,router/index.tsx,
components/pagerTemplate.tsx,lib/download.ts,index.css,
features/documents/{DocumentsTable,DocumentsPanel}.tsx}`, `README.md`, `docs/*`.
**Verification:** `npm run build` + `npm run lint` pass (only the existing
>500 kB chunk warning). `dotnet build` passed (0 warnings) after all Team
backend changes, and the API ran from that build. The seeder's auto-migrate
applied `AddTeamMembers`. The top-up added 12 members to each demo-user
project, and a restart added none (13/12 unchanged). curl: list/paging (12 →
8 + 4), `role`, `status`, `search` filters; roles endpoint; create 201;
duplicate email in different case 409; invalid email 400; update to a taken
email 409; status toggle 200; bad status 400; an InProgress + a Completed task
for "grace okafor" → Grace Okafor shows 1 task; Riverside Villas shows real
counts (Miguel 2, Dana 2, Priya 2, Sam 1, Carlos 1); export CSV has
`Content-Disposition: attachment; filename=team-members.csv`, `'=cmd|calc`
escaped and `"Has, comma ""quote"""` quoted; foreign project 404; no token
401. Playwright (scratch script, 1440 + 375 px): heading uses the project
name; 8 rows; page 2 starts at S.No 9; invite via dialog → row appears;
duplicate email shows the 409 message; Open → Deactivate flips the badge →
Edit saves; status filter; Export downloads `team-members.csv` with the
filter applied; the Documents pager still renders after the refactor; no page
overflow at 375 px; Action column fits at 1440 px. The only console error is
the deliberate 409. Two issues found and fixed during the check: filter
dropdowns stretched full-width (global `.p-dropdown` width beat Tailwind; now
wrapped in sized divs) and long names pushed the Action column off-card
(name/role now wrap).
**Follow-ups:** BUG-007 (app-wide dropdown double border). No delete-member
endpoint. Members aren't linked to tasks by FK (ADR-0016). Test members and
tasks ("=cmd|calc", "Browser Probe …", "Probe InProgress/Completed") were left
in the dev DB on project "Controller Migration Test". **At the end of this
session `dotnet build` fails** because of an edit made outside this session at
19:17–19:18 to `Features/Budget/BudgetContracts.cs` and
`Features/Dashboard/DashboardContracts.cs`. It shortened
`Construction.Application.*` parameter types to bare names, which inside the
Api namespace resolve to the Api records themselves (CS1503/CS0411). Not
reverted here.

## 2026-09-23 — Document page: Project File Repository (FEAT-014) + S.No paging fix (BUG-006)
**Refs:** FEAT-014, BUG-006, ADR-0015
**What:**
- **Backend:** new `ProjectDocument` entity + `DocumentFormat` enum and
  `DocumentFormatResolver` (Domain). `Application/Documents/`:
  `IDocumentService`/`DocumentService` (search, counts, upload, open; all
  owner-scoped, null → 404), `IProjectDocumentRepository`, `IFileStorage`,
  `DocumentUploadRules` (100 MB, extension allow-list), DTOs/commands; new
  `Application/Common/IUserDirectory` for the uploader display name.
  Infrastructure: `ProjectDocumentRepository`, `Storage/LocalFileStorage`
  (+ options, path-traversal guard), `Identity/UserDirectory`, `AppDbContext`
  mapping, migration `AddProjectDocuments`. Api: `Features/Documents/`
  `DocumentsController` (`GET` list, `GET counts`, multipart `POST` with
  request-size limits, `GET {id}/content[?download=true]` via `Results.File`
  with range support), `DocumentContracts`, `UploadDocumentRequestValidator`.
  `Program.cs` resolves `FileStorage:RootPath` against the content root;
  `appsettings.json` gains the `FileStorage` section; `.gitignore` ignores
  `backend/**/App_Data/`.
- **Frontend:** `features/documents/` (`documents.api.ts`,
  `documents.hooks.ts`, `documents.schema.ts`, `DocumentsPanel`,
  `DocumentsTable`, `UploadDocumentDialog` with drag-drop, optional name and
  phase, and a progress bar) + `pages/DocumentsPage.tsx`; `/documents` route
  no longer a stub. `lib/format.ts` gains `formatFileSize`. Scoped `index.css`
  overrides: `.documents-search` (flat field), `.documents-table` (title-case
  headers, right-aligned "← Previous / Next →" paginator).
- **BUG-006:** paginated S.No double-counted the page offset. Fixed in
  `TaskLogTable`, `InvoicesPanel`, `DocumentsTable`.
**Why:** User supplied the Document tab mockup and asked for the backend too.
**Files:** `backend/src/Construction.{Domain/Entities/ProjectDocument.cs,
Application/{Documents/*,Common/IUserDirectory.cs,DependencyInjection.cs},
Infrastructure/{Repositories/ProjectDocumentRepository.cs,Storage/*,Identity/*,
Persistence/AppDbContext.cs,Persistence/Migrations/*AddProjectDocuments*,
DependencyInjection.cs},Api/{Features/Documents/*,Program.cs,appsettings.json}}`,
`frontend/src/{features/documents/*,pages/DocumentsPage.tsx,router/index.tsx,
lib/format.ts,index.css,features/task-log/TaskLogTable.tsx,
features/budget/InvoicesPanel.tsx}`, `.gitignore`, `README.md`, `docs/*`.
**Verification:** `dotnet build` passes (0 warnings); `npm run build` +
`npm run lint` pass. Migration applied with `dotnet ef database update`
(the `DbSeeder` auto-migrate call is commented out in `Program.cs`). curl:
PDF/PNG/CSV/DOCX uploads → 201 with correct format and phase name; `.exe` →
400 "This file type isn't supported"; no file → 400; 101 MB → 400 (body
limit); counts, `format` filter and `search` correct; inline content bytes
match the original; `download=true` sends `Content-Disposition: attachment`;
foreign project → 404; no token → 401. Playwright (scratch script) at 1440 px:
dialog upload with name + phase shows up as row 1 and "All Files" count
updates; `.exe` rejected client-side; each tab filters correctly; search
works; page 2 starts at S.No 9 (was 17 before the BUG-006 fix); Download
saves `Ground_Floor_Joists.pdf`; Open loads the PNG in a new tab from a
`blob:` URL. At 375 px there's no horizontal page overflow (the table scrolls
inside its card). No console errors.
**Follow-ups:** delete/rename/replace endpoints and UI; a blob-store
`IFileStorage` for multi-instance hosting; `DbSeeder` doesn't seed documents
(no demo files). Test uploads were left in the dev DB and `App_Data/uploads`
for project "Controller Migration Test". README's endpoint table is still
missing the older tasks/phases/task-log/budget routes (pre-existing gap).

## 2026-09-23 — Fix PrimeReact button styling lost to Tailwind preflight (BUG-005)
**Refs:** BUG-005, ADR-0014
**What:** `frontend/src/index.css` now opens with
`@layer theme, base, primereact, components, utilities;` so Tailwind preflight
no longer overrides the Lara theme — filled buttons get white text and the
icon/label gap back. That exposed two theme defects preflight had been
hiding, both fixed with unlayered overrides in `index.css`: the paginator's
active page (Lara-teal sets text = background `#0f766e`; now brand fill +
white, 2.25rem elements) and the Schedule Day/Week/Month/Quarter
`SelectButton` (its options matched the global filled-button rule, so every
option was solid green with unreadable labels — pre-existing; now white
segments with a brand-filled selection). Also `white-space: nowrap` on filled
buttons and `flex-wrap gap-4` on the Schedule (both panels), Task Log and
Dashboard "Assigned Tasks" headers, so at 375 px buttons drop to their own
row instead of wrapping to two lines / clipping (pre-existing).
**Why:** User asked to fix BUG-005 (filed earlier the same day).
**Files:** `frontend/src/index.css`,
`frontend/src/features/schedule/{PhaseTimelinePanel,UpcomingDeadlinesPanel}.tsx`,
`frontend/src/features/task-log/TaskLogPanel.tsx`,
`frontend/src/features/dashboard/AssignedTasksPanel.tsx`, `docs/DECISIONS.md`,
`docs/BUGS.md`.
**Verification:** Scripted Playwright before/after screenshots of 13 views
(login, register, dashboard, schedule, task-log, budget, documents, 4
onboarding steps, New Expense + New Task dialogs) at 1440 px and 375 px,
pixel-diffed and reviewed: only button/paginator/toggle changes plus ≤2 px
height shifts; no horizontal scroll, no console errors or API 4xx. Computed
style on "New Expense": label/icon `#fff`, icon margin-right 8 px (was
`#1f2937` / 0). `cd frontend && npm run build && npm run lint` pass;
`cd backend && dotnet build` passes (no backend changes; alternate `-o` dir
since the running API locks the default output).
**Follow-ups:** None for this bug.

---

## 2026-09-23 — Fix onboarding options 404 (BUG-004); browser check of /budget; file BUG-005
**Refs:** BUG-004, BUG-005, FEAT-013
**What:** `getOnboardingOptions()` (`frontend/src/features/onboarding/onboarding.api.ts`)
now calls `GET /api/reference/options` instead of the never-mapped
`/api/onboarding/options` — the same fix pattern as BUG-003; the reference
response is a superset of `OnboardingOptions`, so no client-side reshaping.
README endpoint table: replaced the phantom `/api/onboarding/options` and
`/api/projects/options` rows with the real `/api/reference/options`. Also did
the FEAT-013 follow-up browser check of `/budget`, which surfaced BUG-005
(app-wide PrimeReact button text/icon styling lost to Tailwind preflight
because of CSS layer order) — filed, not fixed.
**Why:** BUG-004 broke the very first onboarding step; FEAT-013's history entry
asked for a real-browser check of `/budget`.
**Files:** `frontend/src/features/onboarding/onboarding.api.ts`, `README.md`,
`docs/BUGS.md`.
**Verification:** Playwright (headless Chromium, scripted — the MCP browser
bridge wasn't connected) logged in as the demo user: `/onboarding` and
`/onboarding/company` at 1440 px and 375 px — all four dropdowns populated
(timezone auto-detected), zero console errors / API 4xx (previously a 404 on
`/api/onboarding/options`). `/budget` at 1440 px and 375 px — renders, no
horizontal page scroll (invoice table scrolls within its card on mobile), no
console errors. `cd frontend && npm run build && npm run lint` pass (only the
pre-existing >500 kB chunk warning); `cd backend && dotnet build` passes (built
to an alternate `-o` dir because the running API locked the default output).
**Follow-ups:** BUG-005. `/budget` was only seen in its empty state — the
demo user's active project predates the budget seed data, so the populated
category bars / invoice rows still haven't been viewed in a browser.

---

## 2026-09-23 — Budget & Finance page: category breakdown + invoices (FEAT-013)
**Refs:** FEAT-013
**What:** Built the `/budget` page end-to-end, replacing its `ComingSoonPage`
stub, from a user-supplied mockup. Backend: new `BudgetCategory`
(`Construction.Domain/Entities/BudgetCategory.cs` — name, allocated/spent
amounts, `IsContingency` bool) and `Invoice` (`InvoiceStatus` enum,
vendor, category FK, amount, issued date) entities + migration
`AddBudgetCategoriesAndInvoices`. New `Construction.Application/Budget/`
(`IBudgetService`/`BudgetService`) and `Construction.Api/Features/Budget/`
(`BudgetController`: `GET /summary`, `GET/POST /invoices`), following the
same Clean Architecture pilot pattern and `Features/<Area>/` convention as
FEAT-011/012. Reused FEAT-012's generic `PagedResult<T>`/`PagedResponse<T>`
for the invoices list rather than inventing a second pagination shape.
Added `IProjectRepository.GetForOwnerAsync` (`ProjectRepository.cs`) — the
first single-project fetch method; previously only `ListByOwnerAsync`/
`ExistsForOwnerAsync` existed, but the summary needs `Project.BudgetTotal`/
`TotalSpent` for the three top stat cards. **Derived-metric definitions**
(user confirmed "reasonable approximations", no PO subsystem): Committed
POs = sum of Pending invoices; Unbilled Work =
`max(0, sum(category.SpentAmount) - sum(invoice.Amount))`; Contingency
Burn % = spend/allocated on the one category flagged `IsContingency`,
labeled Healthy (≤50%) / Watch (≤80%) / At Risk (>80%). Frontend: new
`frontend/src/features/budget/` (`budget.api.ts`/`.hooks.ts`/`.schema.ts`,
`CategoryProgressRow`/`CategoryBreakdownPanel` — single percent-width bars,
5-color fixed palette, no shared-timeline math needed unlike Schedule's
Gantt bars — `InvoicesPanel` reusing `TaskLogTable`'s `paginator`/`lazy`
pattern, `NewExpenseDialog`). Extended `BudgetSummaryCard.tsx` (shared with
Dashboard) with an optional `badge` prop for the Remaining Balance card's
Positive/Over Budget pill — existing Dashboard usages unaffected since it's
optional. "Open Details" on the three stat cards scrolls to the category
panel (`scrollIntoView`) rather than being a dead click, since there's
nowhere else on this page for them to navigate to.
**Why:** User-requested feature, same mockup-driven full-stack approach as
FEAT-011/012 in the same session (resumed after a ~week gap — session
picked back up on 2026-09-23). User explicitly confirmed full-stack and the
derived-metric approximations before implementation, since neither is
obviously derivable from the mockup alone (no purchase-order concept exists
anywhere in this app).
**Files:** `backend/src/Construction.Domain/Entities/{BudgetCategory,Invoice}.cs`
(new); `backend/src/Construction.Infrastructure/Persistence/AppDbContext.cs`,
`Repositories/{BudgetCategoryRepository,InvoiceRepository,ProjectRepository}.cs`;
`backend/src/Construction.Application/Budget/*` (new),
`Projects/IProjectRepository.cs`; `backend/src/Construction.Api/Features/Budget/*`
(new), `Common/{PagedResponse.cs,DbSeeder.cs}`; migration
`Persistence/Migrations/20260915140937_AddBudgetCategoriesAndInvoices.cs`;
`frontend/src/features/budget/*` (new),
`frontend/src/features/dashboard/BudgetSummaryCard.tsx`,
`frontend/src/pages/BudgetPage.tsx` (new), `frontend/src/router/index.tsx`.
**Verification:** `cd backend && dotnet build` — 0 warnings/errors.
`cd frontend && npm run build && npm run lint` — clean. **Migration FK
lesson from FEAT-011 applied proactively this time**: `Invoice.CategoryId →
BudgetCategory` used `DeleteBehavior.ClientSetNull` from the start (both
`BudgetCategories` and `Invoices` cascade-delete from `Projects`, so a
DB-level `SET NULL` would hit the same "multiple cascade paths" SQL Server
error already fixed once — confirmed the generated migration has no
`onDelete` param on that FK, i.e. `NoAction` at the DB level). Live API
smoke test hit a snag: a `Construction.Api.exe` process left running from
before this session's ~week-long gap was serving requests against a
pre-migration database (`Invalid object name 'BudgetCategories'`/`'Invoices'`)
— not a code bug, just a stale process; the user is restarting it, full
summary/invoices verification pending that. Did not visually verify the
page in a browser — no Playwright browser extension available in this
environment, same limitation as FEAT-011/012.
**Follow-ups:** No "add category" UI — categories are seed-only this pass
(`BudgetService.CreateCategoryAsync` exists but isn't wrapped in a
controller endpoint). Someone should open `/budget` in a real browser to
confirm layout, once the stale dev-server process is cycled and the live
smoke test completes.

---

## 2026-09-14 — Task Log page: filterable, paginated task table (FEAT-012)
**Refs:** FEAT-012
**What:** Built the `/task-log` page end-to-end, replacing its `ComingSoonPage`
stub, from a user-supplied mockup (distinct from the Schedule mockup — this
one has Assignee/Logged Date columns, a filter toolbar, and pagination).
Backend: this is the first pagination/filtering capability anywhere in the
backend. New `Construction.Application/Common/PagedResult.cs` (generic
envelope), `Dashboard/TaskListQuery.cs` (search/phase/status/date-range +
page/pageSize), `IProjectTaskRepository.SearchByProjectAsync` (EF `Where` +
`EF.Functions.Like` + `Skip`/`Take`, implemented in
`ProjectTaskRepository.cs`). New `Construction.Application/TaskLog/ITaskLogService`
and `Construction.Api/Features/TaskLog/TaskLogController` —
**deliberately a separate `GET /api/projects/{id}/task-log` endpoint**, not a
change to the existing `GET /tasks` (which Dashboard's `AssignedTasksPanel`
and Schedule's `UpcomingDeadlinesPanel` already depend on as a bare array);
keeping them separate avoided a breaking response-shape change to either
existing consumer. No new domain entity/migration — purely a new
query/filtering capability over the existing `ProjectTask` schema from
FEAT-011. Frontend: new `frontend/src/features/task-log/` module
(`taskLog.api.ts`/`.hooks.ts`, `TaskLogToolbar` — search + phase/status
dropdowns + PrimeReact `Calendar selectionMode="range"` — `TaskLogTable`,
`TaskLogPanel` owning filter/page state). `TaskLogTable` uses PrimeReact
`DataTable`'s `paginator`/`lazy`/`totalRecords`/`onPage` (first use of
DataTable pagination in this app). "New Log" reuses the existing
`NewTaskDialog` unchanged (same component Schedule already extended with
Phase/Status). **Refactor while building:** once a third call site
(`TaskLogTable`) needed the "task details" dialog and status pill,
extracted `StatusBadge` (moved `features/schedule/StatusBadge.tsx` →
`components/StatusBadge.tsx`, updated its two existing importers) and a new
shared `features/dashboard/TaskDetailsDialog.tsx` (deduplicated from
`UpcomingDeadlinesPanel.tsx`'s inline `Dialog`, which now uses the shared
component too).
**Why:** User-requested feature, following the same mockup-driven,
full-stack approach as Schedule (FEAT-011) in the same session, confirmed
this mockup belongs to `/task-log` not `/schedule`.
**Files:** `backend/src/Construction.Application/Common/PagedResult.cs`
(new), `Dashboard/{TaskListQuery.cs,IProjectTaskRepository.cs}`,
`Construction.Application/TaskLog/*` (new);
`backend/src/Construction.Infrastructure/Repositories/ProjectTaskRepository.cs`;
`backend/src/Construction.Api/Common/PagedResponse.cs` (new),
`Features/TaskLog/TaskLogController.cs` (new);
`frontend/src/components/StatusBadge.tsx` (moved),
`frontend/src/features/dashboard/TaskDetailsDialog.tsx` (new),
`frontend/src/features/task-log/*` (new), `frontend/src/pages/TaskLogPage.tsx`
(new), `frontend/src/router/index.tsx`.
**Verification:** `cd backend && dotnet build` — 0 warnings/errors.
`cd frontend && npm run build && npm run lint` — clean. Live API smoke test
against the running dev server: unfiltered paginated fetch (`pageSize=2`
correctly returned 2 of 2 total), `status=Completed` filter (correctly
returned only the 1 matching task), `search=footing` filter (correctly
matched by title substring) — all three returned the correct
`{items, totalCount, page, pageSize}` envelope shape. Did not visually
verify the toolbar/table/pagination controls in a browser — no Playwright
browser extension available in this environment, same limitation noted
under FEAT-011.
**Follow-ups:** Same as FEAT-011 — someone should open `/task-log` in a
real browser to confirm the filter toolbar and paginated table render and
behave as intended.

---

## 2026-09-14 — Schedule page: Construction Phases roadmap + Upcoming Deadlines (FEAT-011)
**Refs:** FEAT-011
**What:** Built the `/schedule` page end-to-end, replacing its `ComingSoonPage`
stub, from a user-supplied mockup. Backend: new `ConstructionPhase` domain
entity (`Construction.Domain/Entities/ConstructionPhase.cs` — name, date
range, percent complete, `PhaseStatus` enum, checkpoint label) + migration
`AddConstructionPhasesAndTaskPhaseStatus`; `ProjectTask` gained a nullable
`PhaseId` FK to `ConstructionPhase` and a `ProjectTaskStatus` enum. New
`Construction.Application/Schedule/` (`IScheduleService`/`ScheduleService`,
`IConstructionPhaseRepository`) and `Construction.Api/Features/Schedule/`
(`ScheduleController`: `GET/POST /api/projects/{id}/phases`), following the
Projects/Dashboard piloted layering (ADR-0010) and `Features/<Area>/` folder
convention (ADR-0013). `DashboardService.ListTasksAsync`/`CreateTaskAsync`
extended to resolve/pass through `PhaseId`/`PhaseName`/`Status` on
`ProjectTaskDto`. Frontend: new `frontend/src/features/schedule/` module
(`schedule.api.ts`/`.hooks.ts`/`.schema.ts`, `StatusBadge`,
`phaseTimeline.utils.ts` date-math helpers, `PhaseRow`/`PhaseTimelinePanel`
— a hand-rolled Tailwind Gantt bar, no new npm dependency —
`NewMilestoneDialog`, `UpcomingDeadlinesPanel` reusing the existing
`AssignedTasksPanel`/`RecentLogPanel` DataTable + dialog patterns). Extended
`dashboard.api.ts`'s `ProjectTask` type and `NewTaskDialog`/`dashboard.schema.ts`
with Phase/Status fields rather than duplicating the type. `DbSeeder.cs`
seeds 5 phases + links the 8 existing seeded tasks to them (only applies to a
fresh demo user with zero projects — existing seeded projects from prior
sessions don't retroactively get phases).
**Why:** User-requested feature, built from two mockups shown mid-session —
clarified that the first ("Task Log" table with filters/pagination) was a
different, out-of-scope page (`/task-log`, still a stub), and the second
("Construction Phases" + "Upcoming Deadlines") was the actual `/schedule`
target. User explicitly chose full-stack (real schema) over a frontend-only
mock-data pass.
**Files:** `backend/src/Construction.Domain/Entities/ConstructionPhase.cs`
(new), `ProjectTask.cs`; `backend/src/Construction.Infrastructure/Persistence/AppDbContext.cs`,
`Repositories/ConstructionPhaseRepository.cs` (new); `backend/src/Construction.Application/Schedule/*`
(new), `Dashboard/{ProjectTaskDto,CreateProjectTaskCommand,DashboardService}.cs`;
`backend/src/Construction.Api/Features/Schedule/*` (new),
`Features/Dashboard/{DashboardContracts,DashboardController,CreateProjectTaskRequestValidator}.cs`,
`Common/DbSeeder.cs`; migration
`Persistence/Migrations/20260914124520_AddConstructionPhasesAndTaskPhaseStatus.cs`;
`frontend/src/features/schedule/*` (new), `frontend/src/features/dashboard/{dashboard.api,dashboard.schema,NewTaskDialog}.tsx`,
`frontend/src/pages/SchedulePage.tsx` (new), `frontend/src/router/index.tsx`.
**Verification:** `cd backend && dotnet build` — 0 warnings/errors.
`cd frontend && npm run build && npm run lint` — clean. Live API smoke test
(login → create phase → create task linked to that phase → list both):
confirmed `phaseName` correctly resolves on the task list response. **Found
and fixed a real bug during live verification**: the initial migration's
`ProjectTasks.PhaseId → ConstructionPhases` FK with `OnDelete(SetNull)` made
SQL Server reject it ("may cause cycles or multiple cascade paths") because
`ConstructionPhases` and `ProjectTasks` both already cascade-delete from
`Projects` — switched to `DeleteBehavior.ClientSetNull` (no DB-level ON
DELETE action; EF nulls the FK client-side for tracked entities instead),
removed and regenerated the migration. Could **not** visually verify the
Gantt rendering in a browser — no Playwright browser extension available in
this environment; only the API contract and TS/build correctness were
confirmed, not pixel-level rendering.
**Follow-ups:** Day/Week/Month/Quarter zoom toggle is UI-only (doesn't
re-bucket the chart yet). No delete/update endpoints for phases or tasks
(list/create only, matching the existing tasks endpoint's scope). Someone
should open `/schedule` in a real browser to confirm the Gantt bars render
as intended — not yet done this session.

---

## 2026-09-14 — Construction.Api: group feature folders under Features/ (ADR-0013)
**Refs:** ADR-0013
**What:** Moved `Dashboard/`, `Onboarding/`, `Projects/`, `Reference/` (16
files total, `git mv`) into a new `Features/<name>/` wrapper folder under
`Construction.Api`. Split `Auth/`: `AuthController.cs`, `Contracts.cs`,
`LoginRequestValidator.cs`, `RegisterRequestValidator.cs` moved to
`Features/Auth/`; `JwtOptions.cs`/`JwtTokenService.cs` stayed at top-level
`Auth/` as global JWT/Identity setup. Updated the `namespace` line in all 16
moved files (`Construction.Api.<X>` → `Construction.Api.Features.<X>`) and
fixed 5 `using` statements that crossed the split: `Program.cs` (added
`using Construction.Api.Features.Auth;` alongside the existing
`Construction.Api.Auth` for `LoginRequestValidator`),
`Features/Auth/AuthController.cs` (added `using Construction.Api.Auth;` for
`JwtTokenService`), `Auth/JwtTokenService.cs` (added
`using Construction.Api.Features.Auth;` for `UserDto`/`LoginResponse`),
`Features/Onboarding/OnboardingController.cs` (swapped `Construction.Api.Auth`
→ `Construction.Api.Features.Auth`), `Features/Onboarding/OnboardingValidators.cs`
(swapped `Construction.Api.Reference` → `Construction.Api.Features.Reference`).
**Why:** User-requested folder reorg to visually/structurally group feature
slices apart from cross-cutting `Common/` and global `Auth/` identity
plumbing (see their shared target-layout diagram).
**Files:** `backend/src/Construction.Api/Features/**` (new, 16 moved files),
`backend/src/Construction.Api/Auth/JwtTokenService.cs`,
`backend/src/Construction.Api/Program.cs`; `docs/DECISIONS.md` (ADR-0013).
**Verification:** `cd backend && dotnet build` — 0 warnings, 0 errors.
`git status` confirmed all 16 files tracked as renames (blame preserved).
Grepped for stale `Construction.Api.Auth`/`.Reference`/`.Dashboard`/`.Onboarding`/`.Projects`
references in `Features/` — only the one intentional `Construction.Api.Auth`
using in `AuthController.cs` remained.
**Follow-ups:** None — purely structural, no behavior/HTTP contract change.

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
