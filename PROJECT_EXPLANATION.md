# Complete Project Explanation (Start to End) — `PROJECT_EXPLANATION.md`

Ye document poore **Paid Client Access Integration & Portal** project ko bilkul zero se end tak **simple Hinglish + Technical Points** mein explain karta hai—taaki aap code, architecture, business logic, aur interview/walkthrough ke har question ka jawab confidence ke saath de sakein.

---

## 1. Ye Project Kya Hai? (Real-World Business Story)

Maan lijiye aapki ek **Financial Advisory / CA / Consulting Company** hai (**Apex Advisory**).

### Normal E-Commerce vs B2B Client Portal mein farq:
- **E-Commerce (Amazon/Flipkart):** Koi bhi random insaan website par aata hai, **Sign Up** karta hai, aur public products khareedta hai.
- **Humara B2B Client Portal:** Yahan har client ka document **private aur confidential** hota hai (jaise *Tax Planning Report* ya *Business Expansion Strategy*). Koi random visitor aake Sign Up nahi kar sakta!

### Real-World Step-by-Step Story:
1. **Step 1 — Sales Call & Zoho CRM Deal Creation:**
   - Ek client (**Alice Sharma**) aapki sales team se baat karti hai ki *"Mujhe apni company ke liye 2026 Financial Advisory & Tax Planning Report banwani hai."*
   - Sales team **Zoho CRM** ke **Deals** module mein ek **Deal** create karti hai (Deal Name: `Apex Capital — Q4 M&A Portal Access`, Stage: `Qualification`, Amount: `₹4,999`).
   - Zoho CRM us Deal ko ek unique ID deta hai, jisko hum **`Deal ID` (`zohoDealId`)** bolte hain (e.g., `1466428000000480422`).
2. **Step 2 — Client Account & Locked Document in Supabase:**
   - Client (**Alice**) ka account **Supabase** (`auth.users` aur `public.users`) mein banta hai, uske saath uski `zohoDealId` link hoti hai, aur uski report (`documents` + `document_contents`) upload hoti hai.
   - Jab tak payment nahi hoti, report **Locked** rehti hai.
3. **Step 3 — Client Portal Sign-In & ₹ INR Payment (Stripe):**
   - Hum Alice ko bolte hain: *"Portal par **Sign In** karo aur apni report ka fee (`₹4,999`) pay karke document unlock kar lo."*
   - Alice portal par Sign In karti hai → **"Pay ₹4,999 to Unlock Document"** button dabati hai → **Stripe Checkout** par Indian Rupees (`₹ INR`) mein card se payment karti hai.
4. **Step 4 — Automatic Document Unlock & Zoho CRM Deal Update:**
   - Jaise hi Stripe payment complete hoti hai:
     1. Humara backend verify karta hai ki payment asli hai (`payment_status === 'paid'`).
     2. **Supabase (`purchases` table)** mein Alice ka status `PAID` mark ho jata hai → Portal par Alice ka document **turant Unlock** ho jata hai!
     3. Backend **Zoho CRM API** ko call karke Alice ki Deal (`1466428000000480422`) ka Stage automatically **`Closed Won`** kar deta hai, `Amount` update karta hai, aur `Description` mein payment receipt likh deta hai!

---

## 2. Frequently Asked Conceptual Questions (Hinglish Q&A)

### Q1: "Deal" aur "Deal ID" (`zohoDealId`) kya hota hai?
- **Client (`User`):** Alice khud ek client/person hai (`alice@example.com`). Uska Supabase mein ek `user.id` (UUID) hota hai.
- **Deal (`Opportunity / Project`):** Alice ke saath jo ₹4,999 ka project/contract chal raha hai, usko CRM mein **Deal** kehte hain. Zoho CRM har Deal ko ek unique number deta hai (jaise `1466428000000480422`), jisko **`Deal ID`** kehte hain.
- Jab client portal par paise de deta hai, toh sales team ko manually Zoho CRM mein jaake status change nahi karna padta—humara code us `Deal ID` ko pakad ke automatically **`Closed Won`** mark kar deta hai.

### Q2: Humne `.env` mein Alice aur Bob ki Deal ID kyun daali hai? Kya system mein sirf 2 hi users ho sakte hain?
- **Nahi! System mein unlimited (100, 1,000, ya 10,000) users ho sakte hain!**
- `.env` mein `ZOHO_DEAL_ID_ALICE` aur `ZOHO_DEAL_ID_BOB` **sirf `npm run db:setup` (seed script)** ke liye hain, taaki jab aap demo ke liye 2 sample clients (`Alice` aur `Bob`) create karein, toh seed script unhe aapke Zoho CRM ke 2 real Deals se link kar sake.
- **Asli runtime code (`checkout.ts`, `webhook.ts`, `zohoService.ts`) `.env` se Deal ID NAHI padhta!** Runtime code hamesha **PostgreSQL database (`users.zoho_deal_id` aur `purchases.zoho_deal_id`)** se Deal ID padhta hai.

### Q3: Kya ek User ke paas Multiple Documents ho sakte hain?
- **Haan, 100%!** Database schema (`server/prisma/schema.prisma`) mein `User` aur `Document` ke beech **One-to-Many (`1:N`)** relation hai (`documents Document[]`).
- Ek client (`Alice`) ke paas 1 document bhi ho sakta hai aur 10 documents bhi ho sakte hain. Portal par usey apne saare assigned documents dikhenge aur wo har document ko alag-alag unlock kar sakti hai (`@@unique([userId, documentId])`).

### Q4: Portal par "Sign Up" button kyun nahi hai, sirf "Sign In" kyun hai?
- Kyunki ye ek **Private Client Portal** hai jahan client pehle Zoho CRM mein onboard hota hai aur uske liye specific confidential report banayi jati hai. Agar koi random insaan khud Sign Up karega, toh na uski koi Zoho CRM Deal hogi aur na hi uske naam par koi Advisory Report hogi. Isliye clients ko pre-provisioned credentials milte hain جن se wo **Sign In** karte hain.

---

## 3. End-to-End Technical Flow (Step-by-Step)

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client Browser (React + Light UI)
    participant Supa as Supabase Auth & Postgres (RLS)
    participant Server as Express + Prisma Backend (:4000)
    participant Stripe as Stripe Checkout & Webhooks (INR)
    participant Zoho as Zoho CRM API v6 (.in / .com)

    Client->>Supa: 1. Sign In (email + password)
    Supa-->>Client: Return Session JWT (auth.uid())
    Client->>Supa: 2. Direct Supabase query: users, documents, purchases, zoho_sync_logs, document_contents
    Supa-->>Client: RLS returns document card (₹4,999), blocks document_contents (0 rows) until PAID

    Client->>Server: 3. POST /api/checkout/create-session (Bearer JWT, documentId)
    Server->>Supa: 4. Verify JWT & fetch User (id, zohoDealId) + Document (priceCents in paise)
    Server->>Stripe: 5. Create Checkout Session in INR (metadata: { userId, documentId, zohoDealId })
    Stripe-->>Client: 6. Redirect to Stripe Checkout Page (₹4,999.00)
    Client->>Stripe: 7. Complete Card Payment (4242...)

    par Webhook Path & Redirect Verification Path (Shared Idempotent Handler)
        Stripe->>Server: 8a. POST /api/webhooks/stripe (raw body + stripe-signature)
        Client->>Server: 8b. POST /api/checkout/verify-session (sessionId on redirect)
    end

    Server->>Server: 9. Verify payment_status === 'paid' & Check 3-Layer Idempotency
    Server->>Supa: 10. DB Transaction: Upsert Purchase (PAID) + ZohoSyncLog (PENDING) + WebhookEvent
    Note over Supa,Client: Document is NOW UNLOCKED in Supabase RLS!

    Server->>Zoho: 11. OAuth2 Refresh Token -> PUT /crm/v6/Deals/{zohoDealId} (Stage='Closed Won', Amount)
    alt Zoho CRM Succeeds
        Zoho-->>Server: 200 OK (record updated)
        Server->>Supa: 12a. Update ZohoSyncLog (status='SUCCESS', syncedAt=now)
    else Zoho CRM Outage / Error
        Zoho--xServer: Timeout / 5xx / Outage
        Server->>Supa: 12b. Keep Purchase='PAID'; Update ZohoSyncLog (status='PENDING', attempts++, lastError)
    end

    Client->>Supa: 13. Browser reads unlocked document_contents & ZohoSyncLog directly from Supabase
```

---

## 4. Charon Assignment Requirements Kaise Solve Hue Hain? (Interview Cheat Sheet)

### Requirement 1: Verify Stripe Webhook & Match Payment to Client and Zoho Deal Using Stable IDs
- **Kaise solve kiya:**
  1. Jab client **"Pay ₹4,999 to Unlock Document"** click karta hai (`POST /api/checkout/create-session` in `server/src/routes/checkout.ts`), backend pehle client ka Supabase JWT verify karta hai.
  2. Phir database se client ke 3 **Stable IDs** nikaalta hai:
     - `userId` (Supabase User UUID)
     - `documentId` (Document UUID)
     - `zohoDealId` (Zoho CRM Deal ID)
  3. Ye teeno IDs Stripe Checkout Session ke `metadata` aur `payment_intent_data.metadata` mein attach kar diye jate hain.
  4. Jab Stripe webhook (`POST /api/webhooks/stripe` in `server/src/routes/webhook.ts`) aata hai, toh `server/src/index.ts` usko `express.raw({ type: 'application/json' })` ke through raw buffer mein receive karta hai aur `stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET)` se cryptographically verify karta hai.

---

### Requirement 2: Grant Access Only After Successful Payment & Idempotency (No Duplicates)
- **Kaise solve kiya:**
  1. **Paid Check:** Code sabse pehle check karta hai: `if (session.payment_status !== 'paid') return;` — unpaid ya incomplete session par kabhi access nahi milta.
  2. **3-Layer Idempotency (Agar webhook 2 baar ya 5 baar bhi aaye toh duplicate nahi hoga):**
     - **Layer 1 (`webhook_events` table):** `stripe_event_id` par `@unique` constraint hai.
     - **Layer 2 (`purchases` table):** `@@unique([userId, documentId])` aur `stripe_session_id @unique` constraint hai, aur hum `prisma.purchase.upsert` use karte hain—isliye ek client aur ek document ke liye kabhi doosri `Purchase` row ban hi nahi sakti.
     - **Layer 3 (`zoho_sync_logs` table):** `syncPurchaseToZoho()` (`server/src/services/zohoService.ts`) Zoho ko call karne se pehle check karta hai:
       ```ts
       if (purchase.zohoSync?.status === 'SUCCESS') {
         return { alreadySynced: true, syncLog: purchase.zohoSync };
       }
       ```
       Isliye agar Zoho pehle hi `SUCCESS` ho chuka hai, toh repeated webhook par Zoho CRM ko dobara API call **nahi** jati!

---

### Requirement 3: Update Matching Zoho Deal; If Zoho Is Unavailable, Keep Client Access Valid & Provide Retry
- **Kaise solve kiya (Decoupled Transaction Pattern):**
  1. Humne Database Transaction aur Zoho API call ko **alag-alag (decouple)** rakha hai (`server/src/routes/webhook.ts`).
  2. **Step 1 (DB Transaction First):** Pehle `prisma.$transaction` ke andar client ka `Purchase(status: 'PAID')` aur `ZohoSyncLog(status: 'PENDING')` database mein commit ho jata hai. Iska matlab: **Client ka document turant unlock ho gaya!**
  3. **Step 2 (Zoho API Call in `try/catch`):** Uske baad `syncPurchaseToZoho()` chalta hai.
     - Agar Zoho CRM chal raha hai → `ZohoSyncLog.status` = `'SUCCESS'` ho jata hai.
     - Agar Zoho CRM down hai (ya aapne UI mein **Simulate CRM Outage** ON kiya hai) → `catch` block error ko pakad leta hai, client ka `Purchase` **`PAID` hi rehta hai** (document lock nahi hota!), aur `ZohoSyncLog` mein `status: 'PENDING'`, `attempts++`, aur `lastError` save ho jata hai.
  4. **2 Ways to Retry Pending Zoho Sync:**
     - **Option A (Portal UI Button):** Client ya admin portal par **"Sync Account Status Now" / "Retry Account Manager Sync"** button click karta hai (`POST /api/zoho/retry/:purchaseId`).
     - **Option B (CLI Command):** Terminal mein `cd server && npm run sync:zoho-retry` run karte hain, jo saare `PENDING`/`FAILED` logs ko utha ke Zoho CRM mein sync kar deta hai.

---

### Requirement 4: Browser Reads Directly from Supabase & Strict Cross-Client Privacy (RLS)
- **Kaise solve kiya (`supabase/migrations/001_rls_policies.sql`):**
  1. **Direct Browser Reads:** React frontend (`client/src/App.tsx`) backend API se documents ya purchase status nahi mangwata—wo `@supabase/supabase-js` se seedha Supabase PostgreSQL tables (`users`, `documents`, `purchases`, `zoho_sync_logs`, `document_contents`) ko query karta hai.
  2. **Table Split (`documents` vs `document_contents`):**
     - `public.documents` mein sirf title, description, aur price (`₹4,999`) hota hai taaki payment se pehle locked card dikh sake.
     - `public.document_contents` mein asli confidential report (`body_markdown` aur `secret_code`) hoti hai.
  3. **PostgreSQL Row Level Security (RLS) Policies:**
     - `purchases_select_own`: `USING (user_id = auth.uid())` — Alice sirf apni purchase dekh sakti hai, Bob ki nahi.
     - `document_contents_select_paid_only`:
       ```sql
       EXISTS (
         SELECT 1 FROM public.purchases p
         WHERE p.document_id = public.document_contents.document_id
           AND p.user_id = auth.uid()
           AND p.status = 'PAID'
       )
       ```
       Jab tak `purchases` table mein us user (`auth.uid()`) ke liye `PAID` row nahi hoti, Supabase PostgreSQL khud `document_contents` ke liye `0 rows` return karta hai!
     - **Write Lockdown:** `REVOKE ALL ... FROM anon, authenticated; GRANT SELECT ...` — Browser DevTools se koi भी user fake `INSERT` ya `UPDATE` nahi kar sakta (sirf backend Prisma server write kar sakta hai).

---

## 5. Payment Ke Baad Data Kahan-Kahan Check Karein?

Jab aap portal par payment complete karte hain, toh **3 jagah** data update hota hai:

### 1. Client Portal (`http://localhost:5173`)
- Document card par green badge aa jata hai: **`Unlocked & Ready to Read`** + **`Account Manager Updated`**.
- Card ke andar poori Advisory Report aur Verification Code (`APEX-2026-INR-8841`) khul jata hai.
- Right sidebar (**Order History & CRM Sync**) mein **`Paid ₹4,999`** aur **`Account Manager CRM Status: Synced`** dikhta hai.

### 2. Supabase Dashboard (`Table Editor`)
- **`purchases` table:** Nayii row dikhegi jisme `status = PAID`, `currency = inr`, `user_id`, `document_id`, aur `zoho_deal_id` hoga.
- **`webhook_events` table:** Verified Stripe event ID (`evt_...`) aur payload dikhega.
- **`zoho_sync_logs` table:** `status = SUCCESS` (ya outage simulation ke waqt `PENDING`), `attempts`, aur `zoho_payload` (Zoho CRM ka response) dikhega.

### 3. Zoho CRM (`https://crm.zoho.in` → **Deals** Tab)
1. Apne Zoho CRM mein **Deals** tab kholein.
2. Client ki Deal पर click karein:
   - Alice ki Deal: **`Apex Capital — Q4 M&A Portal Access`** (`1466428000000480422`)
   - Bob ki Deal: **`Horizon Ventures — Series B Audit Access`** (`1466428000000480456`)
3. Page refresh (`F5`) karein—aapko dikhega:
   - **Stage:** **`Closed Won`** ho chuka hai!
   - **Amount:** Paid amount update ho chuka hai!
   - **Description Information (neeche scroll karne par):**
     `Paid Client Portal Access Confirmed | Document: 2026 Financial Advisory & Tax Planning Report (₹4,999.00 INR) | Stripe Session: cs_test_... | Client ID: ... | Paid At: ...`
   - **Timeline Tab:** Kis exact second par API ne `Stage` aur `Description` update kiya, uski history dikhegi.

---

## 6. Codebase File Map (Kaunsi File Kya Karti Hai?)

### Frontend (`client/` — Light Theme Component Architecture)
- `client/src/App.tsx`: Main state container — Supabase Auth session, direct Supabase RLS queries (`users`, `documents`, `purchases`, `zoho_sync_logs`, `document_contents`), Realtime listener, aur checkout redirect verification handle karta hai.
- `client/src/types/portal.ts`: TypeScript interfaces, demo client accounts (`Alice Sharma` & `Bob Verma`), aur `formatINR()` helper (`₹4,999`).
- `client/src/components/layout/Navbar.tsx`: Top navigation bar, quick client switcher (`Alice` / `Bob`), Refresh button, aur Sign Out button.
- `client/src/components/auth/LoginView.tsx`: Simple client Sign-In page + 1-click demo login buttons + 3-step *"How It Works"* guide.
- `client/src/components/portal/DocumentCard.tsx`: Document title, description, `₹ INR` price box, Locked/Unlocked badge, aur *"Pay ₹4,999 to Unlock Document"* button.
- `client/src/components/portal/DocumentReader.tsx`: Payment ke baad khulne wala clean report viewer aur verified receipt strip.
- `client/src/components/portal/AccountSyncCard.tsx`: Right sidebar — Client Account Deal Reference, Order History, aur Zoho CRM sync status + retry button.
- `client/src/components/portal/DemoToolsPanel.tsx`: Bottom collapsible bar — **Simulate Zoho CRM Outage** toggle switch aur **Run Account Privacy Check** button.

### Backend (`server/` — Express + Prisma + Stripe + Zoho CRM)
- `server/prisma/schema.prisma`: 6 PostgreSQL tables (`User`, `Document`, `DocumentContent`, `Purchase`, `WebhookEvent`, `ZohoSyncLog`).
- `server/src/index.ts`: Express server jo `/api/webhooks` ko `express.raw()` ke saath mount karta hai (JSON parser se pehle).
- `server/src/routes/checkout.ts`:
  - `POST /api/checkout/create-session`: Supabase JWT verify karke `INR` (`paise`) mein Stripe Checkout Session banata hai.
  - `POST /api/checkout/verify-session`: Redirect par Stripe session verify karke idempotent processor chalata hai.
- `server/src/routes/webhook.ts`: `POST /api/webhooks/stripe` — `stripe-signature` verify karta hai aur `processVerifiedStripeEvent()` ke through atomic DB transaction + Zoho sync chalata hai.
- `server/src/services/zohoService.ts`: Zoho OAuth 2.0 `ZOHO_REFRESH_TOKEN` se access token banata hai (in-memory cache ke saath) aur `PUT /crm/v6/Deals/${dealId}` call karta hai.
- `server/src/routes/zoho.ts`: `POST /api/zoho/retry/:purchaseId` — UI se pending Zoho sync retry karne ka endpoint.
- `server/src/scripts/`:
  - `setupDbAndSeed.ts` (`npm run db:setup`): Schema push + RLS policies apply + Alice & Bob seed.
  - `retryZohoSync.ts` (`npm run sync:zoho-retry`): CLI command jo saare pending Zoho syncs ko retry karta hai.
  - `exchangeZohoToken.ts` (`npm run zoho:token -- <GRANT_TOKEN>`): Zoho Self-Client Grant Token ko Refresh Token mein convert karta hai.
  - `verifyIntegration.ts` (`npm run test:integration`): Automated self-test suite.
