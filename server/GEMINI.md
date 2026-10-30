# Backend Directory Rules (`server/GEMINI.md`)

When reading or modifying any file inside `server/`, Antigravity MUST enforce these rules:

1. **Mandatory Skill Activation**:
   - Read and follow `../.agents/skills/ponytail/SKILL.md` and `../.agents/skills/paid-client-portal-ops/SKILL.md`.
   - Keep code minimal, explicit, and verified at every trust boundary.

2. **Webhook Raw Buffer & Signature Verification**:
   - In `src/index.ts`, `/api/webhooks` MUST be mounted with `express.raw({ type: 'application/json' })` BEFORE `express.json()`.
   - In `src/routes/webhook.ts`, always verify `stripe-signature` via `stripe.webhooks.constructEvent` and check `session.payment_status === 'paid'`.

3. **3-Layer Idempotency & Stable IDs**:
   - Checkout sessions (`src/routes/checkout.ts`) must embed `{ userId, documentId, zohoDealId }` in both `metadata` and `payment_intent_data.metadata`.
   - Webhook handling must never duplicate `Purchase` rows or trigger a second Zoho CRM Deal update if `ZohoSyncLog.status === 'SUCCESS'`.

4. **Decoupled Zoho CRM Sync & Retry**:
   - Always commit `Purchase(status: 'PAID')` and `ZohoSyncLog(status: 'PENDING')` in `prisma.$transaction` BEFORE calling `syncPurchaseToZoho()`.
   - Never allow a Zoho CRM network/auth error to roll back or block a client's paid entitlement.
   - Maintain both retry mechanisms: `POST /api/zoho/retry/:purchaseId` (`src/routes/zoho.ts`) and `npm run sync:zoho-retry` (`src/scripts/retryZohoSync.ts`).

5. **Build & Integration Self-Test**:
   - Always run `npm run build` and `npm run test:integration` in `server/` after any backend change.
