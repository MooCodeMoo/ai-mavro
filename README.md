# Mavro AI — surface treatment adviser

An upgrade of the existing Next.js app, keeping the adviser at `/` and administration at `/admin`. Supports Slovenian, Croatian, English and Dutch. All product recommendations come from the same database-backed rules edited by administrators.

## Run locally

```sh
npm ci
cp .env.example .env.local
# Set ADMIN_PASSWORD (12+ characters) and SESSION_SECRET (32+ characters).
# APP_ORIGIN must match the browser origin exactly.
npm run dev
```

The default local database is the existing `mavro-ai.db`. The previous `rules` and `analyses` tables are retained without modification. New versioned tables store reviewed-source rules and complete cases. The administration provides a private export of legacy tables. **Legacy import scripts are retained for reference only; they require their own separately installed `better-sqlite3` dependency and write only to old tables. Do not use them to publish new treatment rules. The running app no longer installs or uses `better-sqlite3`.**

## Configure the existing deployment

- Keep using the existing GitHub project, deployment and URL; no separate site is needed.
- Set `APP_ORIGIN` to the exact production HTTPS origin, `ADMIN_PASSWORD` and a random `SESSION_SECRET`. Use separate credentials and databases for preview and production.
- On Vercel or another serverless host, set `TURSO_DATABASE_URL` (libSQL URL) and `TURSO_AUTH_TOKEN`. A local filesystem is not durable on serverless hosts. The app deliberately refuses to use an implicit local database in production.
- On a persistent Node host, `DATABASE_URL=file:/absolute/persistent-volume/mavro-ai.db` is supported. Take a backup before switching versions. If using a remote database, import the old SQLite database using the database provider's supported import process before starting the app if legacy data is needed there.
- `DATABASE_URL` here is a **libSQL/SQLite** URL, not a PostgreSQL/Neon connection string. Never paste a PostgreSQL URL into it.
- `ANTHROPIC_API_KEY` enables image analysis. Set `ANTHROPIC_MODEL` to a model supported by your Anthropic account. Without a key the UI keeps manual selection available; it never fabricates an analysis.
- SMTP settings enable email. Without them PDF download remains available and email returns a clear configuration error. No email was sent during validation.
- Only set `TRUSTED_IP_HEADER` when the deployment platform overwrites that header; otherwise limits are intentionally shared across visitors. Rate counters live in the database and work across server instances.
- Back up the database, which includes private photos. A remote database quota and photo volume should be monitored. Use the admin deletion action for retention requests. There is no automatic retention policy that might silently delete existing customer data.

See [product verification](docs/product-verification.md) for source checks and limitations. See `.env.example` for all settings.

## Existing website integration

The adviser already replaces the existing root page of this repository. If a different main website is intended, add a link to the deployed adviser or embed it after adding that website's exact HTTPS origin to `EMBED_ALLOWED_ORIGINS` and rebuilding:

```html
<iframe
  src="https://YOUR-EXISTING-APP-HOST/"
  title="Mavro AI"
  style="width:100%;height:1600px;border:0"
  allow="camera"
></iframe>
```

The placeholder is not a deployed URL. Cross-site browsers can block cookies in an iframe, affecting case access and saved reports. Prefer a link or a same-site subdomain for the full workflow; validate on the actual host before using the iframe. No arbitrary site is allowed to frame this application by default. Do not embed administration.

## Workflow

1. Optionally enter customer details and add up to five photos. Photos are resized in the browser and re-encoded on the server, removing EXIF metadata. Photos sent for AI analysis go to Anthropic; this is explained before analysis.
2. Confirm or manually select surface and contamination. Different photo results can be chosen individually. AI confidence is an uncalibrated estimate, not a guarantee.
3. Add area and choose permitted dilution. Acidic cement cleaning requires explicit acid-resistance confirmation. Acidic metal cleaning requires a bare-metal confirmation. Unsupported combinations go to technical review.
4. Confirm the selection and storage permission. Save the complete case, including private photos and an immutable snapshot of the treatment and its source/revision. All cases start as pending review.
5. Download or email that saved snapshot. Unsaved changes require saving a new case. Owners access their cases using signed HttpOnly cookies; the local history contains only opaque IDs, not customer details. Owner access expires after seven days. Administrators retain access.
6. In administration, review cases, inspect photographs, edit source-backed rules in all four languages, and manage technical review.

## Product and calculator behavior

- 11 official Mavro products in a source-linked catalog; 59 initial surface/contamination rules. The application does not claim to cover the entire Mavro assortment.
- Public source verification and technical approval of a particular case are separate. Seed rules are published as source-checked summaries. Every saved case still starts pending technical review.
- No hardcoded commercial prices, stock claims or generic category-based alternatives. Alternatives must have a published rule for the exact same combination.
- Product consumption uses published units: `Strip-Off Plus` is in kg. No kg-to-litre conversion is guessed.
- Published coverage generally does not specify concentration basis. Numeric estimates are therefore limited to undiluted use, remain indicative, and never multiply coverage by the dilution factor. Use a test application for exact quantities. Products without a reliable coverage range do not receive a numeric estimate.
- Pack options are alternatives, each calculated separately for the upper estimate; they are not a combined order. Availability is not claimed.
- Optional protection is a candidate for technical confirmation, not an unconditional second treatment. MavroSeal is not automatically offered for roofs/paving where application constraints need further assessment.

## Validation

```sh
npm test             # meaningful domain and route integration tests, isolated temp database
npm run lint
npm run typecheck
npm run build
```

Tests cover previous incorrect fallthroughs, acid-sensitive substrates, correct consumption units, inactive rules, four-language completeness, actual admin rule edits, unchanged case snapshots, case/photo access control, Unicode PDF generation, disabled services and concurrent rate limits. Browser checks additionally cover responsive layout, saving, PDF download, administration and Croatian instructions.

PDF generation uses PDFKit and a bundled licensed DejaVu font. No Python, ReportLab, shell execution or user-supplied scripts/attachments are needed. Reports and emails are generated from server-stored data rather than accepting client-authored recommendations or PDF files.

`npm run format` formats the maintained application code. Old import scripts are retained for reference and explicitly scoped as legacy CommonJS in ESLint.

To repeat the browser checks, run `npx playwright install chromium` and `npm run build && npm run test:browser`. `CHROMIUM_EXECUTABLE_PATH` can select an already installed Chromium binary. `BROWSER_OUTPUT_DIR` optionally writes synthetic-data screenshots and a PDF outside the repository. The script creates an isolated temporary database, generates test-only credentials, starts/stops its own local production server and never sends live email or calls the AI provider.
