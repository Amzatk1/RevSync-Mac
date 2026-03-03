# RevSync — To‑Do (Web + Desktop)
_Last updated: 2026-03-03_

This checklist fits your current RevSync architecture:
- **Backend:** Django + DRF + Postgres + Celery/Redis  
- **Storage:** Supabase buckets (quarantine/validated/public-assets)  
- **Security:** Ed25519 signing, short-lived signed URLs, audit logs  
- **Mobile:** RN/Expo for consumer flashing (BLE-first)  
- **Web:** Marketplace + uploader portal + moderation + support  
- **Desktop (RevSync Pro):** Pro workbench for USB/Serial/CAN/JTAG flashing + map editing

---

## 0) Which “AI” to use (and what it should do)
### Best AI roles for RevSync Pro / Web
AI is most valuable for **assisting** workflows, not “blindly generating tunes.”

**Use AI for:**
- Explaining ECU maps and fields (“what does this table do?”)
- Suggesting safe deltas within hard bounds (“+2% fuel in 4–6k RPM band”)
- Reviewing changes for risk (“this raises torque limit by 30% → high risk”)
- Generating release notes/changelogs from diffs
- Helping support agents triage logs (“likely power dip / checksum mismatch”)
- Detecting anomalies in logs/telemetry (statistical + ML)

**Do NOT rely on AI for:**
- Writing binaries without deterministic parsers/checksums
- Approving a tune for flashing without hard validation + human review

### Recommended AI options
**Option A — Local/Open-source (privacy + cost control)**
- **Qwen2.5 Instruct (7B/14B)** for strong structured reasoning
- **Llama 3.1/3.2 Instruct (8B/70B)** for general assistant
- **Mistral 7B Instruct** for lightweight inference
Best for: running inside your infra, predictable costs.

**Option B — Hosted APIs (highest quality)**
- OpenAI / Anthropic / Google models for strongest reasoning and tooling.
Best for: fastest development and best outputs.

### Implementation pattern (recommended)
- AI returns **structured JSON** only (never raw binary).
- AI suggestions are applied by a **deterministic engine**:
  - ECU definition + map scaling
  - safety bounds
  - checksum correction
  - packaging + signing
- Every AI suggestion must pass:
  1) schema validation
  2) safety bounds validation
  3) checksum validation
  4) human approval (at least for early launch)

---

# PART A — Web App To‑Do (Marketplace + Tuner Portal + Admin)

## A1) Web foundations
- [ ] Choose web stack (recommended):
  - **Next.js** (App Router) + TypeScript
  - UI: Tailwind + shadcn/ui (or your component system)
  - Auth: Supabase Auth (session) + backend JWT (your current pattern)
- [ ] Define routing + access control
  - Rider routes
  - Tuner routes
  - Admin routes
  - Support routes
  - AccessDenied page
- [ ] API client layer
  - Axios/fetch wrapper
  - Token refresh strategy
  - Standard error handling (401/403/429/5xx)
- [ ] Admin UI routing guards and strict Role-Based Access Control (RBAC) checks
- [ ] Observability
  - client logging (redacted)
  - Sentry (optional) with consent rules (UK/EU)

## A2) Rider marketplace pages (functional, not marketing)
- [ ] **Marketplace browse**: search, filters, pagination
  - calls: `GET /api/v1/marketplace/browse/`
- [ ] **Tune details**: versions, fitment, requirements, safety badges
  - calls: `GET /api/v1/marketplace/listing/<uuid>/`
- [ ] **Purchases / Entitlements**
  - calls: `GET /api/v1/marketplace/entitlements/`
  - show: status Active / Withdrawn / Suspended
  - include “Restore Purchases”
- [ ] **Downloads**
  - calls: `POST /api/v1/marketplace/download/<version_uuid>/`
  - show: download events, last verified timestamp (if you store it)

## A3) Tuner onboarding + portal
- [ ] **Apply to become tuner**
  - calls: `/api/tuners/apply/`, `/api/tuners/apply/status/`
  - record acceptance of “Uploader Policy” + Terms addendum
- [ ] **Tuner profile**
  - business name, logo, slug, verification level
- [ ] **My listings** (CRUD)
  - calls: `/api/v1/tuner/listings/`, `/api/v1/tuner/listings/<uuid>/`
- [ ] **Versions** (create + manage)
  - calls: `/api/v1/tuner/versions/`
- [ ] **Upload flow (quarantine)**
  - init: `POST /api/v1/tuner/versions/<uuid>/upload-init/`
  - upload to Supabase quarantine via signed URL/path
  - complete: `POST /api/v1/tuner/versions/<uuid>/upload-complete/`
- [ ] **Validation status + report viewer**
  - calls: `GET /api/v1/tuner/versions/<uuid>/validation/`
  - show: layer-by-layer results (schema, malware, compatibility, signing)
- [ ] **Submit for review**
  - calls: `POST /api/v1/tuner/versions/<uuid>/submit-review/`
- [ ] **Analytics** (later)
  - downloads, conversion, refunds, ratings
- [ ] **Payouts** (if marketplace payouts)
  - Stripe Connect onboarding + payout history

## A4) Admin/moderation
- [ ] **Content review queue**
  - approve / reject / request changes
- [ ] **Publish controls**
  - approve, publish, suspend, unsuspend
- [ ] **System health**
  - Celery queue lengths, last failures
  - Supabase storage status
  - Stripe webhook status
- [ ] **Audit log viewer**
  - filters by actor/action/version/listing/date
- [ ] **Tuner enforcement**
  - trust tier upgrades (NEW → TRUSTED)
  - automatic suspension after repeated failed uploads
  - ban / revoke privileges

## A5) Security & Payments Hardening (Web + Backend)
- [ ] Stripe webhooks are source-of-truth:
  - payment_intent.succeeded → grant entitlement
  - charge.refunded / disputes → revoke entitlement (policy-based)
- [ ] Idempotency keys for webhook processing
- [ ] Rider invoices/receipts UI (optional)
- [ ] VAT/tax strategy (UK/EU) (later)
- [ ] **Rate limits**: strict limits on `upload-init`, `upload-complete`, `download-link`, and admin actions
- [ ] **Signed URLs**: implement single-use signed URLs (or event logging + abuse detection)
- [ ] **Kill switch flows**: quick-suspend tune version and immediately revoke new download links

## A6) Legal, Compliance & Data Retention
- [ ] Legal pages render from a versioned source:
  - Terms, Privacy, Safety, Refund, Acceptable Use, Warranty
  - New: **Uploader Policy** (strict removal, malware scanning, repeat offender rules)
  - **Export controls/sanctions clause** (global compliance)
- [ ] Consent tracking (UserLegalAcceptance):
  - record version + timestamp + ip hash
- [ ] Data export request UI:
  - logs export, purchase history export
- [ ] **Retention policies**:
  - Quarantine retention (auto delete after X days)
  - Validated retention tied to listing status
  - Backup retention policy (per user/workshop)
  - Log retention + GDPR deletion workflow

---

# PART B — Desktop “RevSync Pro” To‑Do (Editor + USB/JTAG Flashing)

## B1) Desktop foundations & packaging
**Recommended options**
- **Electron + React** (fastest, reuse web UI patterns, many device libraries)
- **Tauri + React** (lighter, Rust backend)
Pick one and standardize.

- [ ] App shell:
  - resizable panels (VS Code style)
  - command palette
  - project/workspace concept
  - status bar (connection + ECU IDs + readiness)
- [ ] Local storage:
  - project files on disk
  - encrypted secrets store (OS keychain)
  - log directory with rotation
- [ ] **Auto-update strategy**: implement automatic updates + signed installers
- [ ] **Code signing**: macOS notarization and Windows signing
- [ ] **Driver install guidance**: seamless USB serial drivers installation helper / troubleshooting panel

## B2) Hardware connectivity layer
- [ ] USB/Serial flashing:
  - port enumeration, permissions, reconnect handling
  - protocol profiles (K-Line/CAN/UDS presets)
- [ ] CAN support (if needed):
  - adapters & drivers
- [ ] JTAG support (advanced):
  - adapter abstraction (J-Link, ST-Link)
- [ ] Device firmware + identity:
  - firmware version display
  - serial number/cert (if hardware supports)
- [ ] **Hard checks**: Mandatory “still published” check before initiating flash sequence

## B3) ECU definition packs & governance (Core Requirement)
- [ ] ECU family registry:
  - map addresses, scalings, axis definitions, units
  - checksum algorithm identifiers
  - safe bounds (rev/boost/torque)
- [ ] Definition format:
  - JSON/YAML + versioning
- [ ] **Governance & Trust**:
  - Pack signing (Ed25519) + trust chain
  - Pack versioning + compatibility matrix (ECU family ↔ pack version)
  - Pack update mechanism: desktop securely fetches updates, rollback if broken
  - Pack review process (internal approval before releasing new pack)
- [ ] Tooling:
  - pack validator, pack diff viewer, pack publisher pipeline

## B4) Map editor (2D/3D) + diff
- [ ] 2D table editor:
  - bulk edit, interpolate, clamp
- [ ] 3D surface view
- [ ] Compare mode:
  - stock vs modified
  - diff heatmap
- [ ] Change history:
  - undo/redo stack
  - commit notes

## B5) Deterministic tune build pipeline & Checksum Engine
- [ ] Import baseline:
  - from ECU backup (.bin) or stock library
- [ ] Apply edits to binary:
  - using definition pack mapping + scalings
- [ ] **Binary patch safety checks**: enforced write bounds, region allowlist checks
- [ ] Checksum correction plugin system:
  - Plugin interface spec (inputs/outputs)
  - Unit test harness per ECU family
  - Golden test vectors (stock bin → expected checksum)
  - “fail closed”: if checksum correction fails, strictly block export/flash
- [ ] Safety rules engine (hard gates):
  - bounds checks, forbidden regions, risk report generation
- [ ] Tune Package Spec (.revsyncpkg):
  - build `.revsyncpkg` with versioned manifest (manifest.schema.json v1/v2) + tune.bin + notes + constraints
  - backward compatibility rules and migration plan for schema changes
  - Uploader policy enforcement (block forbidden fields at the package level)
- [ ] Signing:
  - local tuner key AND/OR server countersign after upload

## B6) Desktop validation + verification UI
- [ ] Show verification status:
  - signature valid/unknown, hashes verified, compatibility match
- [ ] Validation timeline UI:
  - schema, malware, compatibility, signing
- [ ] “Unsafe operations” gating by mode:
  - Guided / Pro / Lab modes
  - Clear “raw binary mode” disclaimers for Pro/Lab

## B7) Flash manager + recovery
- [ ] Pre-flash checklist (hard gates):
  - power stable (operator confirmation)
  - backup exists
  - checksum verified, signature verified, compatibility verified
  - comms stable (error rate)
- [ ] Flash sequence:
  - bootloader → erase → write chunks (ACK/NAK) → verify → reboot
- [ ] Recovery wizard:
  - restore from backup, partial restore (Lab mode)
- [ ] Report generation + Audit:
  - PDF + JSON bundle, include hashes/signatures, ECU IDs, timestamps
  - Workshop consent + audit report capturing operator identity

## B8) Desktop ↔ RevSync backend integration
- [ ] Login with Supabase (same identity)
- [ ] Pull marketplace listings/versions
- [ ] Upload packages to quarantine (for selling)
- [ ] Fetch version status before flash
- [ ] Upload flash reports for support/audit (optional)

## B9) AI integration for desktop (assistive, safe)
- [ ] “Explain this map” assistant
- [ ] “Suggest safe adjustments” assistant outputs JSON diffs ONLY
- [ ] AI suggestions always run through deterministic bounds + checksum + review
- [ ] Pro/Lab requirement for any AI-assisted edits

---

# PART C — DevOps & Infrastructure (Must-have for Production)
- [ ] Staging + Production environments (separate Supabase projects/keys)
- [ ] CI pipeline: lint + typecheck + tests + build
- [ ] Secrets management (rotate signing keys securely, rotate Supabase service role keys)
- [ ] Observability backend: structured logs + alerts (Celery failures, validation failures spikes, anomalies)

---

# PART D — Implementation order (recommended)
## Phase 1 (fast value)
- Web: tuner portal upload + validation report viewer + admin moderation
- Desktop: workbench shell + connection manager + flash manager (no map editor yet)
- DevOps: CI/CD setup, log structure

## Phase 2 (professional editor core)
- ECU definition pack system (with governance & signatures)
- 2D map editor + diff
- checksum correction plugins (with test harness)
- export `.revsyncpkg` (+ schema governance)
- auto-update mechanisms

## Phase 3 (AI assist + scale)
- AI map explanation + safe suggestions (JSON diffs)
- analytics dashboards
- batch flash + reports automation
- advanced recovery + lab tooling
