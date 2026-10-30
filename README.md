# Paid Client Access Integration & Portal

A resilient full-stack integration connecting **Stripe Checkout & Webhooks**, **Supabase Auth & PostgreSQL (with strict Row Level Security)**, **Prisma ORM**, and **Zoho CRM Deals (OAuth 2.0)**, presented in a **Shadcn UI** client portal.

---

## Architecture & Requirement Alignment

| Requirement | Implementation Details |
| :--- | :--- |
| **Browser reads access status directly from Supabase** | `client/src/App.tsx` authenticates via `@supabase/supabase-js` and queries `users`, `documents`, `purchases`, `zoho_sync_logs`, and `document_contents` **directly from Supabase** using the signed-in user's JWT (`auth.uid()`), plus live Supabase Realtime subscriptions. |
| **Stripe & Zoho credentials remain server-side** | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, and `ZOHO_REFRESH_TOKEN` exist strictly in `server/.env`. The browser only receives `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. |
| **1. Verify Stripe webhook & match to client and Zoho Deal using stable IDs** | `POST /api/checkout/create-session` verifies the user's Supabase JWT, looks up their stable `user.id` and mapped `user.zohoDealId`, and embeds `{ userId, documentId, zohoDealId }` in Stripe Checkout `metadata` and `payment_intent_data.metadata`. `POST /api/webhooks/stripe` uses `express.raw({ type: 'application/json' })` and `stripe.webhooks.constructEvent()` to cryptographically verify `stripe-signature`. |
| **2. Grant access only after successful payment; repeated webhook must not duplicate entitlement or Zoho update** | Webhook verifies `session.payment_status === 'paid'`. Idempotency is enforced at 3 layers: (1) `WebhookEvent.stripeEventId` unique constraint, (2) `Purchase` unique constraint on `[userId, documentId]` and `stripeSessionId`, and (3) `syncPurchaseToZoho()` checking `ZohoSyncLog.status === 'SUCCESS'` before calling Zoho CRM. |
| **3. Update matching Zoho Deal; if Zoho unavailable, keep client access valid, record pending, provide retry action & command** | `processVerifiedStripeEvent` commits `Purchase(status: 'PAID')` and `ZohoSyncLog(status: 'PENDING')` in a database transaction **first**, then calls Zoho CRM outside the transaction. If Zoho fails or times out, client access stays `PAID`, `ZohoSyncLog` records `PENDING` with `lastError` and `attempts++`, and retry is available via **both** the portal UI button (`POST /api/zoho/retry/:purchaseId`) and CLI (`npm run sync:zoho-retry`). |
| **4. Show access & CRM sync status on portal; one client cannot retrieve another client's document or purchase** | Document catalog metadata (`public.documents`) is separated from confidential document content (`public.document_contents`). `supabase/migrations/001_rls_policies.sql` enforces PostgreSQL RLS so `purchases` and `zoho_sync_logs` are readable only where `user_id = auth.uid()`, and `document_contents` is readable **only** when a `PAID` purchase exists for `auth.uid()` and that `document_id`. Direct browser `INSERT`/`UPDATE`/`DELETE` privileges are revoked from `anon` and `authenticated`. |

---

## Repository Structure

```text
paid-client-portal/
├── .archify/                             # Interactive standalone HTML Architecture Diagram
├── client/                               # React + Vite + Tailwind v4 + Shadcn UI Client Portal
│   ├── .env.example                      # Browser env template (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
│   └── src/
│       ├── App.tsx                       # Portal UI: Supabase Auth, Direct RLS Reads, Checkout, Zoho Retry, RLS Probe
│       ├── lib/supabase.ts               # Browser Supabase client
│       └── components/ui/                # Shadcn UI components (Card, Button, Badge, Alert, Tabs, Switch)
├── server/                               # Express + TypeScript + Prisma + Stripe + Zoho CRM Backend
│   ├── .env.example                      # Server env template (Stripe, Supabase Admin, Zoho OAuth2)
│   ├── prisma/schema.prisma              # Relational schema with idempotency constraints
│   └── src/
│       ├── index.ts                      # Express server mounting raw webhook body parser before JSON parser
│       ├── middleware/auth.ts            # Supabase Bearer JWT verification middleware
│       ├── routes/checkout.ts            # POST /api/checkout/create-session
│       ├── routes/webhook.ts             # POST /api/webhooks/stripe (signature verification + idempotent handler)
│       ├── routes/zoho.ts                # POST /api/zoho/retry/:purchaseId
│       ├── services/zohoService.ts       # Zoho OAuth2 Refresh Token caching + Deal v6 update + outage handling
│       └── scripts/
│           ├── setupDbAndSeed.ts         # npm run db:setup (Pushes schema, applies RLS SQL, seeds Alice & Bob)
│           ├── retryZohoSync.ts          # npm run sync:zoho-retry (CLI retry command for pending Zoho updates)
│           ├── exchangeZohoToken.ts      # npm run zoho:token -- <GRANT_TOKEN> (Zoho OAuth helper)
│           └── verifyIntegration.ts      # npm run test:integration (Automated webhook & resilience self-test)
└── supabase/
    └── migrations/001_rls_policies.sql   # PostgreSQL Row Level Security & privilege lockdown policies
```

---

## Quick Start & Local Setup

### 1. Configure Environment Variables

Copy the example environment files and populate your Supabase, Stripe Test, and Zoho CRM credentials:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

> **Tip — Generating `ZOHO_REFRESH_TOKEN` in 1 Command:**
> In the [Zoho API Console](https://api-console.zoho.com/), create a **Self Client**, copy the Client ID and Client Secret into `server/.env` (and set `ZOHO_ACCOUNTS_URL`/`ZOHO_API_URL` to match your Zoho region, e.g., `.com` or `.in`), generate a Grant Token with scope `ZohoCRM.modules.deals.ALL`, and run:
> ```bash
> cd server
> npm run zoho:token -- <YOUR_GRANT_TOKEN>
> ```

### 2. Provision Database Schema, PostgreSQL RLS Policies, and Test Clients

Run the automated setup script in `server/`:

```bash
cd server
npm install
npm run db:setup
```

This single command:
1. Pushes `prisma/schema.prisma` to your Supabase PostgreSQL database.
2. Executes `supabase/migrations/001_rls_policies.sql` to enable Row Level Security on all tables and revoke client write privileges.
3. Creates two test clients in Supabase Auth and seeds their mapped Zoho Deals & protected documents:
   - **Client A:** `alice@example.com` / `Password123!` (Mapped to `ZOHO_DEAL_ID_ALICE`)
   - **Client B:** `bob@example.com` / `Password123!` (Mapped to `ZOHO_DEAL_ID_BOB`)

### 3. Start the Backend, Frontend, and Stripe Webhook Listener

Open 3 terminals:

**Terminal 1 — Backend (`http://localhost:4000`):**
```bash
cd server
npm run dev
```

**Terminal 2 — Stripe CLI Webhook Forwarding:**
```bash
stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded --forward-to localhost:4000/api/webhooks/stripe
```
*(Copy the `whsec_...` signing secret printed by the Stripe CLI into `STRIPE_WEBHOOK_SECRET` in `server/.env`.)*

**Terminal 3 — Frontend Client Portal (`http://localhost:5173`):**
```bash
cd client
pnpm run dev
```

---

## Testing & 15-Minute Walkthrough Guide

### Step 1: Verify Locked State & Direct Supabase RLS Read
1. Open `http://localhost:5173` and click **Client A — Alice Vance (`alice@example.com`)**.
2. Observe that the portal queries `documents`, `purchases`, `zoho_sync_logs`, and `document_contents` **directly from Supabase**.
3. Before payment, Alice sees the document card (`Q4 M&A Valuation & Due Diligence Dossier`) with status **LOCKED — PAYMENT REQUIRED**, and `supabase.from('document_contents').select('*')` returns `0 rows` due to the `document_contents_select_paid_only` RLS policy.

### Step 2: Complete Stripe Test Payment & Verify Zoho Deal Update
1. Click **Purchase Access via Stripe ($49.00)** and pay using Stripe test card `4242 4242 4242 4242`.
2. When Stripe redirects back to the portal, `POST /api/webhooks/stripe` verifies the `stripe-signature`, grants Alice's `Purchase(status: 'PAID')`, and updates Alice's Zoho CRM Deal (`ZOHO_DEAL_ID_ALICE`) to `Closed Won`.
3. Alice's portal immediately displays **ACCESS GRANTED (PAID)**, **Zoho CRM: SUCCESS**, and renders the confidential dossier markdown and watermark code from `public.document_contents`.

### Step 3: Verify Webhook Idempotency (Requirement 2)
Re-send the same Stripe webhook event from your terminal:
```bash
stripe events resend <evt_id_from_stripe_cli>
```
Or run the automated verification suite:
```bash
cd server
npm run test:integration
```
Observe in the backend console:
`[Webhook] Idempotent skip: Event evt_... already processed and synced to Zoho.` — No duplicate `Purchase` row is created and Zoho CRM is not called a second time.

### Step 4: Verify Zoho Outage Resilience & Retry (Requirement 3)
1. Click **Switch Client: BOB** in the top bar to log in as `bob@example.com`.
2. Enable the **Simulate Zoho CRM Outage During Checkout Webhook** toggle switch.
3. Click **Purchase Access via Stripe ($79.00)** and complete payment.
4. Observe that Bob's confidential document unlocks immediately (**ACCESS GRANTED (PAID)**), while his CRM status badge shows **Zoho CRM: PENDING**.
5. Recover the pending CRM update using **either**:
   - **Portal UI Action:** Click **Retry Zoho CRM Deal Sync** in the portal, **OR**
   - **CLI Command:** Run `npm run sync:zoho-retry` inside `server/`.
6. Observe the status transition from `PENDING` to `SUCCESS` and verify Bob's Deal in Zoho CRM is now `Closed Won`.

### Step 5: Verify Cross-Client Tenant Isolation (Requirement 4)
1. Open the **Cross-Client RLS Verification** tab in the portal and click **Run Live Cross-Tenant RLS Probe**.
2. Observe the live audit proof: querying `purchases` where `user_id != auth.uid()` returns `0 rows` (Alice's purchase and document content are completely invisible to Bob), and attempting a direct browser `INSERT` into `purchases` is rejected by PostgreSQL role privileges and RLS.
