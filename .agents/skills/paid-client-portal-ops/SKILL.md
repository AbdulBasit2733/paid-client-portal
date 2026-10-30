---
name: paid-client-portal-ops
description: >-
  Operational runbook and verification workflows for the Paid Client Access Integration & Portal.
  Use this skill whenever setting up Supabase RLS policies, seeding Alice and Bob test clients,
  exchanging Zoho CRM OAuth 2.0 grant tokens, testing Stripe webhook idempotency, or retrying
  pending Zoho CRM Deal syncs.
---

# Paid Client Portal Operations & Verification Skill

Use this runbook whenever performing database provisioning, webhook verification, Zoho OAuth setup, or integration testing in `paid-client-portal`.

## 1. Provision Supabase Schema, RLS Policies & Seed Clients

Run from `server/`:

```bash
cd server
npm run db:setup
```

- Pushes `server/prisma/schema.prisma` to Supabase PostgreSQL.
- Executes `supabase/migrations/001_rls_policies.sql` to enable Row Level Security on `users`, `documents`, `document_contents`, `purchases`, `zoho_sync_logs`, and `webhook_events`, and revokes `INSERT`/`UPDATE`/`DELETE` from browser roles (`anon`, `authenticated`).
- Seeds test clients `alice@example.com` and `bob@example.com` (`Password123!`) mapped to `ZOHO_DEAL_ID_ALICE` and `ZOHO_DEAL_ID_BOB`.

## 2. Exchange Zoho Self-Client Grant Token for Refresh Token

Run from `server/`:

```bash
cd server
npm run zoho:token -- <GRANT_TOKEN>
```

Paste the returned `ZOHO_REFRESH_TOKEN` into `server/.env`. Ensure `ZOHO_ACCOUNTS_URL` and `ZOHO_API_URL` match the Zoho data center (`.com`, `.in`, `.eu`, `.com.au`).

## 3. Run Automated Webhook & Outage Resilience Verification

Run from `server/`:

```bash
cd server
npm run test:integration
```

Verifies HMAC-SHA256 `stripe-signature` construction, tamper rejection, Zoho outage fallback (`Purchase = PAID` while `ZohoSyncLog = PENDING`), and idempotent duplicate webhook suppression.

## 4. Retry Pending Zoho CRM Deal Updates via CLI

Run from `server/`:

```bash
cd server
npm run sync:zoho-retry
```

Queries all `ZohoSyncLog` rows with `status IN ('PENDING', 'FAILED')` and re-attempts `PUT /crm/v6/Deals/{zohoDealId}` (`Stage: 'Closed Won'`).
