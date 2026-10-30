# 15-Minute Live Walkthrough & Demo Playbook (`WALKTHROUGH.md`)

Use this step-by-step script during your 15-minute live evaluation to demonstrate all 4 assignment requirements, the interactive **Archify** diagram, and live cross-tenant RLS isolation.

---

## Pre-Flight Checklist (Before Starting the Call)

1. **Interactive Architecture Diagram Open in Tab 1**:
   - Open `.archify/architecture-paid-client-access-20261030-161000/paid-client-access.html` in your browser.
2. **Backend Running in Terminal 1 (`http://localhost:4000`)**:
   ```bash
   cd server
   npm run dev
   ```
3. **Stripe Webhook Listener Running in Terminal 2**:
   ```bash
   stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded --forward-to localhost:4000/api/webhooks/stripe
   ```
4. **Frontend Portal Running in Terminal 3 (`http://localhost:5173`)**:
   ```bash
   cd client
   pnpm run dev
   ```

---

## Minute 0–3: System Topology & Trust Boundaries

1. Show the interactive **Archify** diagram (`.archify/.../paid-client-access.html`).
2. Highlight the 3 trust boundaries:
   - **Browser (`client/`)**: Uses only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Queries `documents`, `purchases`, `zoho_sync_logs`, and `document_contents` **directly from Supabase** under PostgreSQL Row Level Security (`auth.uid()`).
   - **Backend (`server/`)**: Holds `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, and Zoho OAuth credentials in `server/.env`.
   - **Supabase PostgreSQL RLS ([`001_rls_policies.sql`](./supabase/migrations/001_rls_policies.sql))**: Separates public catalog metadata (`documents`) from confidential payloads (`document_contents`) and revokes browser write privileges (`REVOKE ALL ... FROM anon, authenticated; GRANT SELECT ...`).

---

## Minute 3–7: Requirement 1 & 2 — Verified Payment, Zoho Deal Sync & Idempotency

1. In the Client Portal (`http://localhost:5173`), click **Client A — Alice Vance (`alice@example.com`)**.
2. Point out Alice's mapped Zoho Deal ID (`615294000000491001`) and the **LOCKED — PAYMENT REQUIRED** badge (`supabase.from('document_contents').select('*')` returns `0 rows`).
3. Click **Purchase Access via Stripe ($49.00)** and complete checkout with `4242 4242 4242 4242`.
4. Show the Portal automatically unlocking Alice's confidential M&A Dossier (`ACCESS GRANTED (PAID)`) and displaying **Zoho CRM: SUCCESS**.
5. **Demonstrate Idempotency Live (Requirement 2)**:
   - Copy the `evt_...` ID from the Stripe CLI terminal and run:
     ```bash
     stripe events resend <evt_id>
     ```
   - Show the server log printing:
     `[Webhook] Idempotent skip: Event evt_... already processed and synced to Zoho.`
   - Or run `npm run test:integration` in `server/` to show the 4 automated cryptographic & idempotency assertions passing.

---

## Minute 7–11: Requirement 3 — Zoho CRM Outage Resilience & Retry

1. Click **Switch Client: BOB** in the top header (`bob@example.com`).
2. Toggle **Simulate Zoho CRM Outage During Checkout Webhook** to **ON**.
3. Click **Purchase Access via Stripe ($79.00)** and pay with `4242 4242 4242 4242`.
4. Point out the critical resilience behavior:
   - Bob's document access is **immediately unlocked** (`ACCESS GRANTED (PAID)`) because `Purchase` commits in PostgreSQL before the Zoho API call.
   - Meanwhile, the Zoho badge shows **Zoho CRM: PENDING** with the recorded error and attempt counter.
5. Trigger the retry using either:
   - The UI button: Click **Retry Zoho CRM Deal Sync**, **OR**
   - The CLI command in `server/`:
     ```bash
     npm run sync:zoho-retry
     ```
6. Watch the badge flip from `PENDING` to **Zoho CRM: SUCCESS**.

---

## Minute 11–15: Requirement 4 — Cross-Client Tenant Isolation Proof

1. While still signed in as **Bob**, click the **Cross-Client RLS Verification** tab.
2. Click **Run Live Cross-Tenant RLS Probe**.
3. Show the live audit output returned directly from Supabase:
   - Querying `SELECT * FROM purchases WHERE user_id != auth.uid()` returns **`0 rows`** (Alice's purchase and document content cannot be retrieved by Bob).
   - Attempting a direct browser `INSERT` into `purchases` is **REJECTED** by PostgreSQL privileges and RLS.
