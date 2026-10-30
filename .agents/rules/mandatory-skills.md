# Mandatory Workspace Skills & Architectural Invariants

You MUST read and apply the workspace skills located in `.agents/skills/` for every task in this repository:

1. **All coding, refactoring, debugging, and review tasks (`server/` & `client/`)**:
   - Activate and follow [`.agents/skills/ponytail/SKILL.md`](file:///d:/Abdul%20Basit/paid-client-portal/.agents/skills/ponytail/SKILL.md). Keep diffs minimal, never cut validation at trust boundaries, and always run verification (`npm run test:integration` and `npm run build`).
2. **All UI/UX, styling, component, and accessibility tasks (`client/`)**:
   - Activate and follow [`.agents/skills/ui-ux-pro-max/SKILL.md`](file:///d:/Abdul%20Basit/paid-client-portal/.agents/skills/ui-ux-pro-max/SKILL.md) and read the persisted design system at [`design-system/paid-client-portal/MASTER.md`](file:///d:/Abdul%20Basit/paid-client-portal/design-system/paid-client-portal/MASTER.md) before modifying components.
3. **All architecture diagrams, sequence diagrams, and topology updates (`.archify/`)**:
   - Activate and follow [`.agents/skills/archify/SKILL.md`](file:///d:/Abdul%20Basit/paid-client-portal/.agents/skills/archify/SKILL.md) and run `node .agents/skills/archify/bin/archify.mjs finalize ... --quality showcase --json`.
4. **All database, RLS, Stripe webhook, and Zoho CRM operational workflows**:
   - Activate and follow [`.agents/skills/paid-client-portal-ops/SKILL.md`](file:///d:/Abdul%20Basit/paid-client-portal/.agents/skills/paid-client-portal-ops/SKILL.md).

## Non-Negotiable Security & Reliability Rules

- **Direct Supabase Browser Reads**: `client/` MUST read `users`, `documents`, `purchases`, `zoho_sync_logs`, and `document_contents` directly from Supabase using `@supabase/supabase-js` and the signed-in user's JWT.
- **Secret Isolation**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, and `ZOHO_REFRESH_TOKEN` MUST remain strictly in `server/.env` and NEVER appear in `client/`.
- **Webhook Signature & Idempotency**: `/api/webhooks/stripe` MUST use `express.raw({ type: 'application/json' })`, verify `stripe-signature`, verify `payment_status === 'paid'`, and enforce 3-layer idempotency (`WebhookEvent.stripeEventId`, `Purchase[userId, documentId]`, and `ZohoSyncLog.status === 'SUCCESS'`).
- **Zoho Outage Resilience**: Client `Purchase(status: 'PAID')` MUST be committed in PostgreSQL before calling Zoho CRM so a Zoho failure never revokes or blocks client document access.
