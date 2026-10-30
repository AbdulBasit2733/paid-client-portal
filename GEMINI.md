# Project Rules & Mandatory Agent Skills (`GEMINI.md`)

This repository implements the **Paid Client Access Integration & Portal** connecting **Stripe Checkout & Webhooks**, **Supabase Auth & PostgreSQL (Row Level Security)**, **Prisma ORM**, and **Zoho CRM Deals (OAuth 2.0)** with a **Shadcn UI** client portal.

## 1. Where Skills Are Installed (Workspace Root `.agents/skills/`)

In Antigravity, project skills are installed once at the **workspace root** inside `.agents/skills/` (never duplicated inside `client/` or `server/`):

- **`.agents/skills/ui-ux-pro-max/SKILL.md`** — UI/UX design intelligence & accessibility rules (paired with `design-system/paid-client-portal/MASTER.md`).
- **`.agents/skills/archify/SKILL.md`** — Validated standalone HTML architecture & sequence diagram generator (`.archify/`).
- **`.agents/skills/ponytail/SKILL.md`** — Minimal, high-signal senior engineering & verification discipline.
- **`.agents/skills/paid-client-portal-ops/SKILL.md`** — Project runbook for Supabase RLS setup, Stripe webhook verification, and Zoho CRM OAuth/retry commands.

## 2. Mandatory Skill Activation Rules

Antigravity MUST activate and follow these skills whenever working in this workspace:

1. **Before editing any UI file in `client/`**: Read `.agents/skills/ui-ux-pro-max/SKILL.md` and `design-system/paid-client-portal/MASTER.md`.
2. **Before editing any backend or database file in `server/` or `supabase/`**: Read `.agents/skills/ponytail/SKILL.md` and `.agents/skills/paid-client-portal-ops/SKILL.md`.
3. **When updating or generating architecture/sequence diagrams**: Read `.agents/skills/archify/SKILL.md` and run `node .agents/skills/archify/bin/archify.mjs finalize ... --quality showcase --json`.

## 3. Core Architecture Invariants (Never Violate)

1. **Browser Reads Access Status Directly from Supabase**:
   - The React app (`client/src/App.tsx`) authenticates with Supabase Auth and queries `users`, `documents`, `purchases`, `zoho_sync_logs`, and `document_contents` directly from Supabase PostgreSQL under RLS (`auth.uid()`).
2. **Server-Side Credential Isolation**:
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, and `ZOHO_REFRESH_TOKEN` MUST only exist in `server/.env`.
3. **Stripe Webhook Verification & 3-Layer Idempotency**:
   - `POST /api/webhooks/stripe` must use `express.raw({ type: 'application/json' })` and `stripe.webhooks.constructEvent`.
   - Access is granted only when `session.payment_status === 'paid'`.
   - Repeated webhook deliveries must be deduplicated via `WebhookEvent.stripeEventId`, `Purchase[userId, documentId]`, and `ZohoSyncLog.status === 'SUCCESS'`.
4. **Decoupled Zoho CRM Sync & Retry**:
   - Commit `Purchase(status: 'PAID')` and `ZohoSyncLog(status: 'PENDING')` in a database transaction **before** calling Zoho CRM.
   - If Zoho fails, client document access remains valid (`PAID`), `ZohoSyncLog` records `PENDING` with `lastError` and `attempts++`, and retry works via both `POST /api/zoho/retry/:purchaseId` and `npm run sync:zoho-retry`.
5. **Strict Cross-Client Tenant Isolation**:
   - `supabase/migrations/001_rls_policies.sql` enforces that one client (`auth.uid()`) can never read another client's `purchases`, `zoho_sync_logs`, or `document_contents`, nor `INSERT`/`UPDATE` entitlements from the browser.
