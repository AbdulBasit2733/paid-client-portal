# Architecture & Security Deep Dive (`ARCHITECTURE.md`)

## 1. Stable Identity Mapping Across All 4 Systems

Every client has a single canonical identity row in `public.users` (`server/prisma/schema.prisma`) seeded by `npm run db:setup`:

| Field | Purpose |
| :--- | :--- |
| `users.id` (`UUID`) | Matches `auth.users.id` (`auth.uid()`) in Supabase Auth. |
| `users.zoho_deal_id` | Stable Zoho CRM Deal ID mapped to this client (`ZOHO_DEAL_ID_ALICE`, `ZOHO_DEAL_ID_BOB`). |
| `documents.id` (`UUID`) | Stable Document UUID assigned to the client (`documents.owner_id`). |

When the client initiates checkout (`POST /api/checkout/create-session`), the backend verifies their Supabase JWT, fetches their `User` and `Document` records from PostgreSQL, and embeds `{ userId, documentId, zohoDealId }` into Stripe Checkout `metadata` and `payment_intent_data.metadata`.

---

## 2. Three-Layer Webhook Idempotency (`server/src/routes/webhook.ts`)

Stripe may deliver `checkout.session.completed` multiple times. Our handler prevents duplicate entitlements and duplicate Zoho CRM calls at 3 levels:

1. **Event-Level Deduplication**: `webhook_events.stripe_event_id` has a `@unique` constraint.
2. **Entitlement-Level Deduplication**: `purchases` has both `@@unique([userId, documentId])` and `@unique` on `stripe_session_id`, written via `prisma.purchase.upsert`.
3. **CRM Sync Deduplication**: `syncPurchaseToZoho()` checks `if (purchase.zohoSync?.status === 'SUCCESS') return { alreadySynced: true }` before making any HTTP request to Zoho CRM.

---

## 3. Decoupled Transaction Boundary for Zoho Outage Resilience (`server/src/services/zohoService.ts`)

To guarantee that a Zoho CRM outage, rate limit, or expired token never blocks a paying client from accessing their document:

1. **Step 1 (Database Transaction)**: `processVerifiedStripeEvent()` commits `Purchase(status: 'PAID')`, `ZohoSyncLog(status: 'PENDING')`, and `WebhookEvent` inside `prisma.$transaction(...)`. The moment this transaction commits, Supabase RLS immediately unlocks `public.document_contents` for the client.
2. **Step 2 (Out-of-Transaction Zoho Call)**: `syncPurchaseToZoho()` runs inside a `try/catch` block outside the DB transaction.
   - If Zoho returns `200 OK`, `ZohoSyncLog` is updated to `status = 'SUCCESS'` and `syncedAt = now()`.
   - If Zoho throws an error or times out, `ZohoSyncLog` stays `status = 'PENDING'`, increments `attempts`, and records `lastError`. The webhook still returns `200 OK` to Stripe so Stripe does not endlessly retry an already-entitled purchase, while operators or the client can retry Zoho via `POST /api/zoho/retry/:purchaseId` or `npm run sync:zoho-retry`.

---

## 4. Row Level Security & Privilege Separation (`supabase/migrations/001_rls_policies.sql`)

- **Table Split**: `public.documents` stores non-sensitive catalog metadata (`title`, `description`, `price_cents`), whereas `public.document_contents` stores the confidential markdown (`body_markdown`) and watermark (`secret_code`).
- **Read-Only Browser Role**: `REVOKE ALL ... FROM anon, authenticated` followed by `GRANT SELECT ... TO authenticated` ensures a user cannot forge a `Purchase` row from browser DevTools.
- **Cross-Tenant Isolation**:
  - `purchases_select_own`: `USING (user_id = auth.uid())`
  - `zoho_sync_logs_select_own`: `USING (user_id = auth.uid())`
  - `document_contents_select_paid_only`: `USING (EXISTS (SELECT 1 FROM public.purchases p JOIN public.documents d ON d.id = p.document_id WHERE p.document_id = public.document_contents.document_id AND p.user_id = auth.uid() AND p.status = 'PAID' AND (d.owner_id IS NULL OR d.owner_id = auth.uid())))`
