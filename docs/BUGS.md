# Bugs

Registry of defects. IDs are permanent (`BUG-###`).

**Severity:** `Critical` · `High` · `Medium` · `Low`
**Status:** `Open` · `In progress` · `Fixed` · `Won't fix` · `Cannot reproduce`

| ID      | Title                                             | Area | Severity | Status | Repro / Notes | Fix |
| ------- | ------------------------------------------------- | ---- | -------- | ------ | ------------- | --- |
| BUG-001 | Login page does not match the design mockup; responsiveness unverified | ui | High | Fixed | Initial scaffold shipped a flat green left panel (no photo), default PrimeReact input styling, and untested small-screen layout. | FEAT-003, 2026-09-09 — hero photo + overlay, mockup-matched inputs/button, `min-h-dvh` single-column below `lg`. |
| BUG-002 | Duplicate `id="password"` in the login DOM | auth / ui | Medium | Fixed | PrimeReact `<Password>` rendered `id` on its wrapper `<div>` *and* `inputId` on the inner `<input>`, so `id="password"` appeared twice and `<label htmlFor>` was ambiguous. Found via Playwright during FEAT-003 verification. | 2026-09-09 — removed `id` from `<Password>` in `LoginPage.tsx`, kept `inputId="password"`. |
| BUG-003 | `GET /api/projects/options` 404 — `getProjectOptions()` called a route `ProjectsEndpoints` never mapped | projects | High | Fixed | Broke the type/status dropdowns on both `OnboardingProjectPage` ("Create your first project") and the new dashboard's "+ New Project" dialog — `continueDisabled`/spinner would never resolve. Found while verifying FEAT-008. | FEAT-008, 2026-09-11 — repointed `getProjectOptions()` at the working `GET /api/reference/options` (already serves identical seeded `ProjectTypes`/`ProjectStatuses`), reshaped client-side. No backend change. |
| BUG-004 | `GET /api/onboarding/options` 404 — `getOnboardingOptions()` called a route `OnboardingEndpoints` never mapped | onboarding | High | Fixed | Breaks `OnboardingPreferencesPage`'s measurement/currency/timezone/temperature dropdowns (the very first onboarding step). Same root cause/pattern as BUG-003; found alongside it but left unfixed — out of scope for FEAT-008 (dashboard). | 2026-09-23 — repointed `getOnboardingOptions()` at `GET /api/reference/options` (its response is a superset of `OnboardingOptions`, no reshaping needed). No backend change. README endpoint table corrected (both phantom `*/options` routes removed). |
| BUG-005 | PrimeReact buttons render dark text (`#1f2937`) on the brand-green fill, and the icon sits flush against the label | ui | Medium | Open | Every filled `<Button>` app-wide (Log in, Continue, New Project, New Expense, …). Computed style shows the label/icon inheriting `body` color and `.p-button-icon-left` margin `0`. Cause: the Lara theme is emitted inside `@layer primereact`; since it's `@import`ed before `tailwindcss` in `index.css`, `primereact` is declared first and becomes the *lowest*-priority layer, so Tailwind v4 preflight (`button { color: inherit }`, `* { margin: 0 }`, in `@layer base`) overrides it. Found via Playwright while verifying FEAT-013. | Proposed: declare layer order at the top of `index.css` (`@layer theme, base, primereact, components, utilities;`) so preflight sits below the theme — needs an app-wide visual re-check since it also restores other theme margins/colors preflight currently suppresses. |

## Filing a bug

1. Append a row with the next `BUG-###`; include a concrete repro.
2. Set Severity + Status `Open`.
3. On fix: Status `Fixed`, name the FEAT/commit and date in the Fix column, and
   record it in `DEVELOPMENT_HISTORY.md`.
