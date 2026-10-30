# Step-by-Step Setup Guide: Supabase, Zoho CRM & Stripe (`SETUP_GUIDE.md`)

Follow this click-by-step guide to obtain all credentials for `server/.env` and `client/.env` and connect **Supabase**, **Zoho CRM**, and **Stripe** from scratch.

---

## Step 0: Create Your `.env` Files

From the project root (`d:\Abdul Basit\paid-client-portal`), copy the `.env.example` files into `.env`:

```powershell
Copy-Item server\.env.example server\.env
Copy-Item client\.env.example client\.env
```

Keep both `server/.env` and `client/.env` open in your editor as you complete Steps 1, 2, and 3 below.

---

## Part 1: Supabase Setup (Auth, PostgreSQL & Row Level Security)

### 1.1 Create a Supabase Project
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and sign in.
2. Click **New project**.
3. Enter a **Project name** (e.g., `paid-client-portal`).
4. Set a strong **Database Password** (use alphanumeric characters only, e.g., `PortalDbPass2026`, so you don't have to URL-encode special symbols) and **save this password**—you will need it in Step 1.3.
5. Select your nearest region and click **Create new project** (wait ~60 seconds for provisioning to finish).

### 1.2 Get `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`
1. In your Supabase project sidebar, click **Project Settings** (the gear icon at the bottom left) → **API** (or **Data API** / **API Keys**).
2. Copy the **Project URL** (looks like `https://abcdefghijklm.supabase.co`):
   - Paste it into `server/.env` as `SUPABASE_URL="https://abcdefghijklm.supabase.co"`
   - Paste it into `client/.env` as `VITE_SUPABASE_URL="https://abcdefghijklm.supabase.co"`
3. Under **Project API keys**:
   - Copy the **`anon` `public`** key (`eyJ...`):
     - Paste it into `server/.env` as `SUPABASE_ANON_KEY="eyJ..."`
     - Paste it into `client/.env` as `VITE_SUPABASE_ANON_KEY="eyJ..."`
   - Click **Reveal** next to the **`service_role` `secret`** key and copy it:
     - Paste it **ONLY** into `server/.env` as `SUPABASE_SERVICE_ROLE_KEY="eyJ..."` *(Never put `service_role` in `client/.env`)*.

### 1.3 Get `DATABASE_URL` and `DIRECT_URL` (For Prisma ORM)
1. At the top of your Supabase Dashboard header, click the **Connect** button (or go to **Project Settings** → **Database**).
2. Select the **ORMs** tab → choose **Prisma** (or look under **Connection string** → **URI**):
   - Copy the **Transaction Pooler (port `6543`)** URI and replace `[YOUR-PASSWORD]` with the database password from Step 1.1:
     ```env
     DATABASE_URL="postgresql://postgres.abcdefghijklm:PortalDbPass2026@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
     ```
   - Copy the **Session Pooler (port `5432`)** or **Direct connection** URI and replace `[YOUR-PASSWORD]`:
     ```env
     DIRECT_URL="postgresql://postgres.abcdefghijklm:PortalDbPass2026@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
     ```
   - Paste both into `server/.env`.

---

## Part 2: Zoho CRM Setup (Deals & OAuth 2.0 Refresh Token)

### 2.1 Check Your Zoho Data Center Domain (CRITICAL!)
Look at the URL in your browser when you sign into [Zoho CRM](https://crm.zoho.com):

| Your Browser URL Ending | Set `ZOHO_ACCOUNTS_URL` in `server/.env` | Set `ZOHO_API_URL` in `server/.env` |
| :--- | :--- | :--- |
| `crm.zoho.com` (US / Global) | `https://accounts.zoho.com` | `https://www.zohoapis.com` |
| `crm.zoho.in` (India) | `https://accounts.zoho.in` | `https://www.zohoapis.in` |
| `crm.zoho.eu` (Europe) | `https://accounts.zoho.eu` | `https://www.zohoapis.eu` |
| `crm.zoho.com.au` (Australia) | `https://accounts.zoho.com.au` | `https://www.zohoapis.com.au` |

*(If your Zoho account is on `.in`, make sure `ZOHO_ACCOUNTS_URL` and `ZOHO_API_URL` in `server/.env` end with `.in`!)*

### 2.2 Create Two Test Deals in Zoho CRM (For Alice and Bob)
1. Open **Zoho CRM** and click the **Deals** tab in the top navigation bar.
2. Click **Create Deal** (or open two existing test Deals):
   - **Deal 1 (Alice)**:
     - **Deal Name**: `Apex Capital — Q4 M&A Portal Access`
     - **Account Name**: `Apex Capital` (create quick account if prompted)
     - **Stage**: `Qualification` (or any stage other than `Closed Won`)
     - **Closing Date**: Any future date
     - Click **Save**.
   - Look at your browser address bar on the saved Deal page:
     `https://crm.zoho.com/crm/org.../tab/Potentials/615294000000491001`
   - Copy that long numeric ID at the end of the URL (`615294000000491001`) and paste it into `server/.env`:
     ```env
     ZOHO_DEAL_ID_ALICE="615294000000491001"
     ```
3. Repeat for **Deal 2 (Bob)**:
   - **Deal Name**: `Horizon Ventures — Series B Audit Access`
   - **Stage**: `Qualification`
   - Click **Save**, copy the numeric ID from the URL, and paste it into `server/.env`:
     ```env
     ZOHO_DEAL_ID_BOB="615294000000491002"
     ```

### 2.3 Generate Zoho OAuth 2.0 Credentials & Refresh Token
1. Go to the **Zoho API Console** matching your region (e.g., [https://api-console.zoho.com/](https://api-console.zoho.com/) or [https://api-console.zoho.in/](https://api-console.zoho.in/)).
2. Click **Add Client** (or **Get Started** if it is your first client) and select **Self Client** → click **Create Now** → **OK**.
3. Click the **Client Secret** tab on your new Self Client:
   - Copy **Client ID** (`1000.XXXX...`) → paste into `server/.env` as `ZOHO_CLIENT_ID="..."`
   - Copy **Client Secret** → paste into `server/.env` as `ZOHO_CLIENT_SECRET="..."`
4. Click the **Generate Code** tab (right next to Client Secret):
   - **Scope**: Enter `ZohoCRM.modules.deals.ALL,ZohoCRM.settings.ALL`
   - **Time Duration**: Select `10 minutes`
   - **Scope Description**: Enter `Paid Client Portal Deal Sync`
   - Click **Create** (select your CRM system if prompted) and copy the generated **Grant Token** (`1000.xxxx...`).
5. Immediately run our helper command in your terminal inside `server/` to exchange that temporary Grant Token for a permanent `ZOHO_REFRESH_TOKEN`:
   ```powershell
   cd "d:\Abdul Basit\paid-client-portal\server"
   npm run zoho:token -- <PASTE_YOUR_GRANT_TOKEN_HERE>
   ```
6. Copy the printed `ZOHO_REFRESH_TOKEN="1000.xxxx..."` line into `server/.env`!

---

## Part 3: Stripe Setup (Test Secret Key & Local Webhook Listener)

### 3.1 Get `STRIPE_SECRET_KEY` (Test Mode)
1. Go to [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys) and ensure **Test mode** (or Sandbox) is toggled ON in the top bar.
2. Under **Standard keys**, click **Reveal test key** next to **Secret key** (`sk_test_...`).
3. Copy it and paste it into `server/.env`:
   ```env
   STRIPE_SECRET_KEY="sk_test_..."
   ```

### 3.2 Get `STRIPE_WEBHOOK_SECRET` via Stripe CLI
1. If you do not have the Stripe CLI installed on Windows yet, install it with Scoop or Winget:
   ```powershell
   winget install Stripe.StripeCli
   ```
   *(Or download `stripe_X.X.X_windows_x86_64.zip` from [https://github.com/stripe/stripe-cli/releases](https://github.com/stripe/stripe-cli/releases)).*
2. Authenticate the Stripe CLI with your Stripe account:
   ```powershell
   stripe login
   ```
   *(Press Enter to open the browser and click **Allow access**).*
3. Start forwarding Stripe webhooks to your local backend server on port `4000`:
   ```powershell
   stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded --forward-to localhost:4000/api/webhooks/stripe
   ```
4. Look at the terminal output:
   ```text
   Ready! You are using Stripe API Version [...]. Your webhook signing secret is whsec_1234567890abcdef... (^C to quit)
   ```
5. Copy that `whsec_...` value and paste it into `server/.env`:
   ```env
   STRIPE_WEBHOOK_SECRET="whsec_1234567890abcdef..."
   ```
   *(Keep this `stripe listen` terminal window running while testing!)*

---

## Part 4: Initialize Database, RLS Policies & Seed Test Clients

Once `server/.env` and `client/.env` are filled in:

### 4.1 Run the One-Command Database & RLS Setup
In a terminal inside `server/`:

```powershell
cd "d:\Abdul Basit\paid-client-portal\server"
npm run db:setup
```

Expected output:
```text
[Setup] Pushing Prisma schema to Supabase PostgreSQL...
[Setup] Applying 21 PostgreSQL RLS policy statements...
[Setup] PostgreSQL Row Level Security (RLS) policies applied.
  ✓ Seeded Client: alice@example.com (UUID: ...) | Zoho Deal: 615294000000491001 | Document: ...
  ✓ Seeded Client: bob@example.com   (UUID: ...) | Zoho Deal: 615294000000491002 | Document: ...
```

### 4.2 Enable Supabase Realtime (Optional, for Instant Live UI Refresh)
1. In your Supabase Dashboard, go to **Database** → **Publications** → click `supabase_realtime`.
2. Toggle ON the `purchases` and `zoho_sync_logs` tables (or click **Refresh Supabase** in the portal top bar anytime).

### 4.3 Start the Backend & Frontend
- **Terminal 1 (Backend — Port 4000):**
  ```powershell
  cd "d:\Abdul Basit\paid-client-portal\server"
  npm run dev
  ```
- **Terminal 2 (Stripe CLI Webhook Listener):**
  ```powershell
  stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded --forward-to localhost:4000/api/webhooks/stripe
  ```
- **Terminal 3 (Frontend Portal — Port 5173):**
  ```powershell
  cd "d:\Abdul Basit\paid-client-portal\client"
  pnpm run dev
  ```

Open [http://localhost:5173](http://localhost:5173) and follow [WALKTHROUGH.md](./WALKTHROUGH.md) to test Alice's purchase, duplicate webhook replay, Bob's simulated Zoho outage + retry, and the live Cross-Client RLS probe!

---

## Troubleshooting Quick Reference

| Symptom | Cause & Fix |
| :--- | :--- |
| `Zoho OAuth Token Error: invalid_client` | Your Zoho account is in a different region (e.g., `.in` or `.eu`). Change `ZOHO_ACCOUNTS_URL` and `ZOHO_API_URL` in `server/.env` to match your domain (`https://accounts.zoho.in` and `https://www.zohoapis.in`). |
| `Zoho CRM API rejected Deal update (INVALID_DATA)` | The Deal ID in `ZOHO_DEAL_ID_ALICE` or `ZOHO_DEAL_ID_BOB` does not exist in your Zoho CRM Deals module. Copy the numeric ID from the end of a real Deal URL in your Zoho CRM and re-run `npm run db:setup`. |
| `Webhook signature verification failed` | `STRIPE_WEBHOOK_SECRET` in `server/.env` does not match the `whsec_...` printed by your active `stripe listen` terminal. Update `server/.env` and restart `npm run dev`. |
| `Can't reach database server at ...:5432` | On IPv4-only networks, Supabase's direct connection host (`db.xxxx.supabase.co:5432`) requires IPv6. Use the **Session Pooler URI** (`aws-0-...pooler.supabase.com:5432`) for `DIRECT_URL` and **Transaction Pooler URI** (`:6543?pgbouncer=true`) for `DATABASE_URL`. |
