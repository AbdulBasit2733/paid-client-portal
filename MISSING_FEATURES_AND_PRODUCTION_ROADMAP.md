# Missing Features & Production Roadmap — Simple Hinglish Guide (`MISSING_FEATURES_AND_PRODUCTION_ROADMAP.md`)

Yeh document aapko interview / **15-minute live demo** mein explain karne mein help karega ki **abhi humne prototype mein kya banaya hai** aur **real production system mein aur kaun-kaun se features add hone chahiye**.

---

## 1. Quick Overview Table (Abhi Kya Hai vs. Production Mein Kya Chahiye)

| Feature Area | Abhi Prototype Mein Kya Hai (Current Scope) | Production Mein Kya Add Hona Chahiye (Missing Feature) |
| :--- | :--- | :--- |
| **1. Zoho CRM se Auto User & Deal Creation** | Humne `npm run db:setup` script se **20 Clients aur 28 Zoho CRM Deals** auto-create aur link kiye hain. | **Zoho Inbound Webhook (`POST /api/webhooks/zoho`)** taaki Zoho CRM mein naya Contact ya Deal bante hi Supabase mein User aur Deal automatically create ho jaye. |
| **2. Document Upload & PDF Storage** | Advisory report ka content PostgreSQL ke `document_contents` table mein text format mein stored hai (RLS protected). | **Advisor Admin Panel + Supabase Private Storage** jahan Advisor asli PDF upload kar sake aur payment ke baad client PDF download kar sake. |
| **3. Zoho Sync Automatic Background Retry** | Agar Zoho fail hota hai toh `Logs` Sheet mein **1-click Retry button** aur CLI command (`npm run sync:zoho-retry`) hai. | **Background Cron Job (`pg_cron` / BullMQ)** jo har 5 minute mein `PENDING` Zoho syncs ko khud auto-retry kare bina kisi button click ke. |
| **4. Client Login & Onboarding Email** | Sabhi 20 test clients ka password `Password123!` set hai aur Sign-In page par 1-click selector diya hai. | **Automated Welcome Email / Magic Link** taaki Zoho mein Deal bante hi client ko email jaye: *"Apna password set karo aur payment karke document unlock karo."* |
| **5. Refund & Chargeback Handling** | `checkout.session.completed` webhook handle hota hai jo document ko `PAID` aur Zoho Deal ko `Closed Won` karta hai. | **`charge.refunded` Webhook** taaki agar Stripe se पैसा refund ho, toh document wapas **Lock (`REFUNDED`)** ho jaye aur Zoho Deal `Closed Lost` ho jaye. |
| **6. GST Invoice & Multiple Team Members** | Payment `₹ INR` mein Stripe Checkout se hoti hai aur 1 User (`user_id`) apne documents dekhta hai. | **Auto GST Tax Invoice PDF (Zoho Books)** aur **Company/Organization level access** taaki ek company ke CEO aur CFO dono paid document dekh sakein. |

---

## 2. Har Missing Feature Ki Simple Hinglish Explanation (Step-by-Step)

### Feature 1: Zoho CRM se Website/Supabase mein Automatic User & Deal Sync (`Inbound Webhook`)

#### Abhi Kya Hota Hai?
Abhi humara flow **Portal → Zoho CRM** hai (yaani jab client website par payment karta hai, toh humारा backend Zoho CRM mein us Deal ko `Closed Won` mark karta hai). Aur shuruat ke 20 clients + 28 Deals humne `npm run db:setup` script chala kar Zoho CRM aur Supabase mein seed kiye hain. Agar koi Salesperson Zoho CRM mein jaakar 21st client ya nayi Deal banata hai, toh woh website par apne aap nahi dikhegi jab tak script na chale.

#### Production Mein Kaise Kaam Karega?
1. **Zoho CRM Workflow Rule**: Zoho CRM ke andar hum ek **Outbound Webhook** lagayenge jo tab trigger hoga jab Sales team koi naya **Deal** banayegi.
2. **Backend Endpoint (`POST /api/webhooks/zoho`)**: Zoho CRM us Deal ka data (`Client Email`, `Client Name`, `Deal ID`, `Deal Name`, `Amount`) humare backend ko bhejega.
3. **New vs. Existing Client Check**:
   - **Agar Client Naya Hai**: Humara server `supabaseAdmin.auth.admin.inviteUserByEmail()` call karke Supabase mein naya user banayega, client ko email jayegi, aur `documents` table mein `zoho_deal_id` attach ho jayegi.
   - **Agar Client Pehle Se Hai**: Naya user nahi banega—sirf us existing client ke `user_id` ke andar ek naya Document row (`documents` table mein) naye `zoho_deal_id` ke saath add ho jayega (jaise Aarav ke paas 3 Deals/Documents hain).

> **Interview Mein Bolne Ke Liye Line:**
> *"Abhi assignment ke liye humne 20 clients aur 28 Zoho Deals `db:setup` script se provision kiye hain. Production mein hum ek inbound webhook (`POST /api/webhooks/zoho`) lagayenge—jaise hi Sales team Zoho CRM mein Deal create karegi, Supabase mein user aur document automatically create ho jayega aur client ko login invite email chali jayegi."*

---

### Feature 2: Advisor Admin Portal & Real PDF File Upload (`Supabase Private Storage`)

#### Abhi Kya Hota Hai?
Abhi humne confidential advisory reports ko PostgreSQL ke `public.document_contents` table mein text format mein store kiya hai taaki hum Row Level Security (`RLS`) ko browser se seedha query karke dikha sakein. Abhi koi Admin/Advisor screen nahi hai jahan se PDF file upload ki ja sake.

#### Production Mein Kaise Kaam Karega?
1. **Admin/Advisor Upload Screen**: Ek separate Admin login hoga jahan Advisor client select karega, Deal ID link karega, price (`₹ INR`) dalega, aur **PDF report upload** karega.
2. **Supabase Private Storage Bucket**: PDF files Supabase Storage ke private bucket (`advisory-documents/{user_id}/{deal_id}.pdf`) mein save hongi.
3. **Storage RLS Security**: Supabase Storage par bhi wahi RLS policy lagegi—jab tak `public.purchases` mein `status = 'PAID'` nahi hai, tab tak client ko PDF ka signed download URL nahi milega.

> **Interview Mein Bolne Ke Liye Line:**
> *"Abhi humne report content PostgreSQL ke `document_contents` table mein rakha hai taaki RLS gate (`auth.uid()`) clean tarike se test ho sake. Production mein hum **Supabase Private Storage** aur ek **Advisor Upload Panel** add karenge jahan se PDF reports upload hongi aur payment ke baad signed URL se download hongi."*

---

### Feature 3: Automatic Background Retry Queue (`pg_cron` / `BullMQ`)

#### Abhi Kya Hota Hai?
Requirement 3 ke hisaab se, agar payment ke waqt Zoho CRM down hai, toh client ka document turant unlock (`PAID`) ho jata hai aur `zoho_sync_logs` table mein `status = 'PENDING'` save ho jata hai. Phir use sync karne ke liye hum `Logs` Sheet mein **"Sync Account Status Now"** button click karte hain ya terminal mein `npm run sync:zoho-retry` chalate hain.

#### Production Mein Kaise Kaam Karega?
1. Client ko khud "Retry" button dabane ki zaroorat nahi honi chahiye.
2. Backend mein ek **Background Cron Job (`pg_cron` ya BullMQ + Redis)** har 5 minute mein chalega.
3. Woh saare `PENDING` rows uthayega aur **Exponential Backoff** (pehle 2 min baad, phir 5 min, phir 15 min, phir 1 ghante baad) Zoho CRM ko retry karega.
4. Agar 5 attempts ke baad bhi Zoho fail hota hai (jaise token expire ho gaya), toh woh Dev team ko Slack/Email alert bhej dega.

> **Interview Mein Bolne Ke Liye Line:**
> *"Abhi demo dikhane ke liye humne UI mein 1-click Retry button aur CLI command diya hai. Production mein iske upar ek background cron job (`pg_cron` ya BullMQ) chalega jo har 5 minute mein `PENDING` Zoho syncs ko exponential backoff ke saath apne aap retry karega."*

---

### Feature 4: Refund & Chargeback Hone Par Document Wapas Lock Karna (`charge.refunded`)

#### Abhi Kya Hota Hai?
Abhi hum Stripe ka `checkout.session.completed` webhook sunte hain aur payment `paid` hone par document unlock kar dete hain. Lekin agar baad mein client refund maang leta hai aur Stripe se refund process ho jata hai, toh abhi document unlock hi rehta hai.

#### Production Mein Kaise Kaam Karega?
1. Hum apne `POST /api/webhooks/stripe` endpoint mein `charge.refunded` aur `charge.dispute.created` events bhi add karenge.
2. Jaise hi Stripe se refund ka webhook aayega:
   - Hum `purchases` table mein `status` ko `'PAID'` se badal kar `'REFUNDED'` kar denge.
   - Kyunki humari Supabase RLS policy sirf `status = 'PAID'` par hi `document_contents` padhne deti hai, document **usi second apne aap wapas Lock ho jayega**!
   - Saath hi Zoho CRM mein Deal ka stage `'Closed Won'` se badal kar `'Closed Lost (Refunded)'` ho jayega.

> **Interview Mein Bolne Ke Liye Line:**
> *"Humari Supabase RLS policy pehle se hi check karti hai ki `purchases.status = 'PAID'` hona chahiye. Production mein hum Stripe ka `charge.refunded` webhook add karenge—jaise hi refund hoga, status `'REFUNDED'` ho jayega, document automatically wapas lock ho jayega, aur Zoho CRM mein Deal revert ho jayegi."*

---

### Feature 5: GST Tax Invoice & Company Team Access (`Multi-User Organization`)

#### Abhi Kya Hota Hai?
1. Payment `₹ INR` mein hoti hai par client ko formal GST PDF Invoice (18% GST + Client GSTIN ke saath) generate hokar nahi milti.
2. Ek document ek hi email (`user_id`) se juda hai.

#### Production Mein Kaise Kaam Karega?
1. **Zoho Books / Stripe Invoices Integration**: Jaise hi Deal `Closed Won` hogi, Zoho Books se automatic GST Tax Invoice PDF ban kar client ko email ho jayegi.
2. **Organization-Based RLS**: Ek `organizations` table banega taaki agar *FinEdge Capital* company ne document kharida hai, toh unke CEO aur CFO dono apne-apne login se us unlocked document ko dekh sakein.
