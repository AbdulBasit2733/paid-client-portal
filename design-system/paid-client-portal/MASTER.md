# Design System Master File (`MASTER.md`)

> **LOGIC:** Generated with `ui-ux-pro-max` for the **Knowbal Client Document Portal (`#2F5CEA` Royal Blue Light Theme)**.

---

**Project:** Paid Client Portal  
**Category:** Modern B2B/SaaS Client Document Portal (Light Mode — `#2F5CEA` Brand Theme)  
**Currency Standard:** Indian Rupee (`INR` / `₹`, stored in paise: `100 paise = ₹1.00`)

---

## Global Rules

### 1. `#2F5CEA` Brand Color Palette

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| **Primary Brand** | `#2F5CEA` | `--color-primary` | Primary CTA buttons, active badges, global payment spinner, focus rings |
| **Primary Hover** | `#244BC5` | `--color-primary-hover` | Button hover state |
| **Primary Tint** | `#EEF3FD` | — | Soft brand badge surface & icon container background |
| **On Primary** | `#FFFFFF` | `--color-on-primary` | White button label text |
| **Page Canvas** | `#F4F7FE` | `--color-background` | Cool ice-blue light page background |
| **Card & Sheet Surface** | `#FFFFFF` | `--color-card` | Crisp white cards, header navbar, and Shadcn `Sheet` drawers |
| **Heading Navy** | `#0B132B` | `--color-foreground` | High-contrast deep navy headings & modal backdrops (`#0B132B/55`) |
| **Body / Muted Text** | `#475569` | `--color-muted-foreground` | Readable body copy (4.5:1+ WCAG contrast) |
| **Success / Unlocked** | `#16A34A` | `--color-accent` | Paid / Unlocked badges & RLS/idempotency verification results |
| **Warning / Pending** | `#D97706` | `--color-warning` | Locked state & Pending Zoho CRM sync indicators |
| **Border** | `#E2E8F0` | `--color-border` | Crisp card, sheet, and table dividers |
| **Focus Ring** | `#2F5CEA` | `--color-ring` | Visible keyboard navigation ring |

---

### 2. Typography

- **Primary UI & Heading Font:** `Plus Jakarta Sans` (`400`, `500`, `600`, `700`, `800`)
- **Monospace Font (Deal IDs & Receipts Only):** `Fira Code` (`400`, `500`, `600`)

---

### 3. Core Component & Layout Patterns

1. **Sign-In View (`LoginView.tsx`)**:
   - **Left Column (`lg:col-span-5`)**: Clean email & password form (`#2F5CEA` primary button) with selected client preview.
   - **Right Column (`lg:col-span-7`)**: Interactive, searchable **20-Client Directory** (`DEMO_CLIENTS`) with filter tabs (`All 20`, `1 Document`, `2–3 Documents`), showing each client’s name, company, email, document count badge, and INR prices with 1-click sign-in.
2. **Header Navigation (`Navbar.tsx`)**:
   - Displays brand identity, signed-in client’s name & email, and 4 global action buttons:
     - **`Logs`**: Opens the global **Account, Payment & CRM Sync Logs** Shadcn `Sheet` (`AccountSyncCard.tsx`).
     - **`Demo Actions`**: Opens the global **Live Walkthrough & Demo Actions** Shadcn `Sheet` (`DemoToolsPanel.tsx`).
     - **`Refresh`**: Re-queries `users`, `documents`, `purchases`, `zoho_sync_logs`, and `document_contents` directly from Supabase under RLS.
     - **`Sign Out`**: Signs out of the current client session and returns to the 20-client Sign-In view (no in-header client switcher dropdown).
3. **Full-Width Multi-Document Cards (`DocumentCard.tsx`)**:
   - **Single Document (`totalDocuments === 1`)**: Automatically expanded (`isExpanded = true`) on sign-in with no collapse toggle needed.
   - **Multiple Documents (`totalDocuments > 1`)**: Expand/collapse header button on each card (`aria-expanded`), with the first document expanded by default plus `Expand All` / `Collapse All` actions.
   - Displays each document's linked **Zoho Deal ID** (`#1466428000000...`), INR price (`formatINR`), payment status (`Locked` vs `Unlocked & Paid`), and Zoho CRM sync status (`CRM Synced` vs `CRM Sync Pending`).
4. **Global Payment & Sync Loading Overlay (`App.tsx`)**:
   - Full-screen backdrop (`fixed inset-0 z-50 bg-[#0B132B]/55 backdrop-blur-sm`) with `#2F5CEA` animated spinner (`role="status"`, `aria-live="polite"`) displayed during:
     - Checkout session creation & redirect (`checkoutLoadingDocId`)
     - Post-checkout Stripe verification & Supabase RLS unlock (`pendingSessionId`)
     - Zoho CRM OAuth 2.0 Deal sync retry (`retryingPurchaseId`)
5. **Global Shadcn `Sheet` Drawers (`sheet.tsx`)**:
   - Built on `@radix-ui/react-dialog` (`Sheet`, `SheetContent`, `SheetHeader`, `SheetBody`, `SheetTitle`, `SheetDescription`).
   - **Sheet 1 (`Logs`)**: Renders `AccountSyncCard.tsx` with account summary, completed ₹ INR payments, target Zoho Deal IDs, sync attempt counts, and retry button.
   - **Sheet 2 (`Demo Actions`)**: Renders `DemoToolsPanel.tsx` with 1-click controls for Requirement 2 (Duplicate Webhook Replay), Requirement 3 (Simulate Zoho Outage toggle), and Requirement 4 (Cross-Client Privacy RLS Audit).
