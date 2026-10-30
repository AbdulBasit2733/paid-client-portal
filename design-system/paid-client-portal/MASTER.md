# Design System Master File (`MASTER.md`)

> **LOGIC:** Generated with `ui-ux-pro-max` for the **Client Document Portal (Light Theme SaaS)**.

---

**Project:** Paid Client Portal  
**Category:** Modern B2B/SaaS Client Document Portal (Light Mode)  
**Currency Standard:** Indian Rupee (`INR` / `₹`, stored in paise: `100 paise = ₹1.00`)

---

## Global Rules

### 1. Light Theme Color Palette

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| **Background** | `#F8FAFC` | `--color-background` | Page canvas (Soft Slate 50) |
| **Card Surface** | `#FFFFFF` | `--color-card` | Elevated white cards & header |
| **Foreground** | `#0F172A` | `--color-foreground` | Primary headings & high-contrast text |
| **Body / Muted Text** | `#475569` | `--color-muted-foreground` | Friendly, readable descriptions (4.5:1+ contrast) |
| **Primary Brand** | `#2563EB` | `--color-primary` | Trust Blue primary buttons & active states |
| **On Primary** | `#FFFFFF` | `--color-on-primary` | White button label text |
| **Success / Unlocked** | `#16A34A` | `--color-accent` | Paid / Unlocked badges & verification banners |
| **Warning / Pending** | `#D97706` | `--color-warning` | Locked state & Pending CRM sync badges |
| **Destructive** | `#DC2626` | `--color-destructive` | Error alerts |
| **Muted Surface** | `#F1F5F9` | `--color-muted` | Subtle section backgrounds & pills |
| **Border** | `#E2E8F0` | `--color-border` | Crisp card & input borders |
| **Focus Ring** | `#2563EB` | `--color-ring` | Visible keyboard navigation ring |

### 2. Typography

- **Primary UI & Heading Font:** `Plus Jakarta Sans` (friendly, clean, modern SaaS)
- **Monospace Font (IDs & Receipts Only):** `Fira Code`
- **Google Fonts Import:**
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  ```

### 3. Content & UX Rules (`ponytail` + `ui-ux-pro-max`)

- **Plain, Client-Friendly English**: Never show raw SQL queries, database table names, or developer jargon in the primary client view. Speak directly to the customer (*"Your Documents"*, *"Pay ₹4,999 to Unlock"*, *"Unlocked & Ready to Read"*, *"Account Synced"*).
- **Component-Based Architecture**: Keep each UI responsibility in its own focused component (`Navbar`, `LoginView`, `DocumentCard`, `DocumentReader`, `AccountSyncCard`, `DemoToolsPanel`).
- **Pre-Delivery Accessibility Checklist**:
  - [x] Lucide SVG icons only (no raw emojis as icons)
  - [x] `cursor-pointer` on all interactive buttons/switches
  - [x] Smooth transitions (`150–200ms`)
  - [x] Minimum 4.5:1 contrast ratio on light surfaces
  - [x] Visible `focus-visible:ring-2` keyboard focus states
  - [x] `prefers-reduced-motion` respected
