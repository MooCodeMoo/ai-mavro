# Validation — 31 October 2026

Validated on the upgraded existing Next.js application (Next.js 16.4.3 / Node.js 24).

| Check | Result |
| --- | --- |
| Domain and API tests | 26 passed, 0 failed |
| ESLint | Passed, no warnings |
| TypeScript | Passed |
| Production build | Passed |
| Chromium browser workflow | Passed at 1440px and 390px |
| PDF inspection | A4 report and photograph page rendered; Slovenian diacritics extracted correctly |
| Production dependency audit (`npm audit --omit=dev`) | 0 known vulnerabilities at time of check |

The full dependency audit still reports moderate minimatch-related findings in the development-only ESLint toolchain. No forced downgrade or untested major override was applied. These are not bundled application dependencies.

Browser checks use synthetic data and an isolated temporary SQLite database. They cover corrected wood/paint recommendation, live quantity estimate, photograph upload, complete case save, private PDF download, Croatian instructions, persisted language choice, unsaved-change download lock, no horizontal overflow at 390px, unauthorised admin rejection, admin login and case review.

API integration tests exercise actual database writes and actual PDF generation. Anthropic success and email success use mocked network/transport boundaries; missing-configuration paths are tested separately. No live external email or customer submission was made during these local checks. The protected-preview checks below are separate.

Remote libSQL connectivity, actual SMTP credentials/delivery and live AI accuracy have not been validated in the production environment. A preview deployment must use its own database and secrets. The production branch has not been activated as part of the local checks.

## Main corrections

- One source of treatment rules, shared by the adviser and administration.
- Source-backed product IDs, language-specific instructions and explicit rule priority; exact combination matching for alternatives.
- No acid-based cement treatment on unknown/soft stone; no broad wood/aluminium override.
- Full private cases with photographs, pending review, deletion, immutable recommendation snapshots and server-generated reports.
- Signed HttpOnly admin/owner cookies, request-origin validation, bounded inputs, shared database rate limits and safe image re-encoding.
- PDFKit replaces Python script generation. PDF/email content is loaded from a saved case; arbitrary client attachments and product instructions are ignored.
- Remote libSQL support for serverless deployments and preservation/export of legacy SQLite tables.
- Page-list queries are batched rather than issuing one query per case and photograph list.

## Vercel build repair

The failed preview build used Node 26.13.0 because `engines.node` was `>=22`. The legacy `better-sqlite3` addon failed to compile against that runtime. The app now pins Node `24.x`, matching the existing Vercel project and the validated local/CI runtime. Its unused `better-sqlite3` runtime dependency and types were removed; active persistence uses `@libsql/client`. No stored database data was deleted.

## Protected internal preview

Commit `ba98dade2e2afba230d455a04c3caf1ead05130c` deployed successfully to
Vercel preview (Node 24). Preview-only branch environment variables configure
private Blob storage, signed sessions and AI Gateway. All seven configured
variables are restricted to this feature branch; production is unchanged.

- 26 automated tests pass, including concurrent object-store updates and
  rejection of the internal login flag on production/other branches.
- Lint, TypeScript and production build pass.
- Local desktop/mobile Chromium workflow passes, including photo/save/PDF,
  administration and review.
- Hosted adviser and session endpoints return 200. The session endpoint
  advertises the internal login only on the selected preview.
- A synthetic photo and complete case were persisted on the hosted private
  backend (200), with the expected `facadeclean-hc` recommendation.
- Remote browser access from the verification environment was intermittent;
  do not interpret local browser success as hosted end-to-end confirmation.
