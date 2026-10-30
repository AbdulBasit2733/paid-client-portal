# Frontend Directory Rules (`client/GEMINI.md`)

When reading or modifying any file inside `client/`, Antigravity MUST enforce these rules:

1. **Mandatory Skill Activation**:
   - Read and follow `../.agents/skills/ui-ux-pro-max/SKILL.md`, `../.agents/skills/ponytail/SKILL.md`, and `../design-system/paid-client-portal/MASTER.md`.
   - Use the **Clean Light Theme SaaS** palette (`#F8FAFC` page background, `#FFFFFF` cards, `#2563EB` Trust Blue primary CTA, `#16A34A` Emerald unlocked state, `#E2E8F0` borders) and `Plus Jakarta Sans` typography.
   - Write all customer-facing copy in **simple, friendly, plain English** for real clients. Keep evaluator/demo controls neatly tucked in `src/components/portal/DemoToolsPanel.tsx`.
   - Format all prices in **Indian Rupees (`₹ INR`)** via `formatINR()` in `src/types/portal.ts`.

2. **Component-Based Architecture**:
   - `src/types/portal.ts` — Shared types, demo client presets, and `formatINR` currency helper.
   - `src/components/layout/Navbar.tsx` — Top navigation bar, client profile pill, and quick account switcher.
   - `src/components/auth/LoginView.tsx` — Welcoming client sign-in form + 1-click demo client buttons.
   - `src/components/portal/DocumentCard.tsx` — Client document card with `₹` pricing, status badge, and Stripe checkout trigger.
   - `src/components/portal/DocumentReader.tsx` — Clean unlocked document viewer & payment receipt banner.
   - `src/components/portal/AccountSyncCard.tsx` — Order receipt & Account Manager (Zoho CRM) sync status + retry button.
   - `src/components/portal/DemoToolsPanel.tsx` — Collapsible walkthrough tools for simulating Zoho outage and verifying cross-client privacy.

3. **Direct Browser-to-Supabase Reads (Strict Requirement)**:
   - Access status, document catalog (`documents`), unlocked document payloads (`document_contents`), entitlements (`purchases`), and CRM sync statuses (`zoho_sync_logs`) MUST be queried directly from Supabase using `supabase.from(...)`.

4. **Zero Server Secrets in Browser**:
   - Only `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_BASE_URL` may be referenced in `client/`.

5. **Build Verification**:
   - Always run `pnpm run build` in `client/` after making changes to verify zero TypeScript or Vite bundling errors.
