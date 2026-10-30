export interface UserProfileRow {
  id: string;
  email: string;
  name: string;
  zoho_deal_id: string;
  stripe_customer_id: string | null;
}

export interface DocumentRow {
  id: string;
  title: string;
  description: string;
  price_cents: number; // Stored in paise (100 paise = ₹1.00 INR)
  owner_id: string | null;
}

export interface DocumentContentRow {
  id: string;
  document_id: string;
  body_markdown: string;
  secret_code: string;
  updated_at: string;
}

export interface PurchaseRow {
  id: string;
  user_id: string;
  document_id: string;
  zoho_deal_id: string;
  stripe_session_id: string;
  stripe_event_id: string;
  amount_cents: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'REFUNDED';
  granted_at: string;
}

export interface ZohoSyncLogRow {
  id: string;
  purchase_id: string;
  user_id: string;
  zoho_deal_id: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  attempts: number;
  last_error: string | null;
  synced_at: string | null;
  updated_at: string;
}

export interface RlsAuditResult {
  testedAt: string;
  ownPurchasesCount: number;
  foreignPurchasesReturned: number;
  unlockedContentsCount: number;
  directInsertBlocked: boolean;
}

export interface DemoClientAccount {
  shortName: string;
  fullName: string;
  company: string;
  email: string;
  password: string;
  priceLabel: string;
}

export const DEMO_CLIENTS: DemoClientAccount[] = [
  {
    shortName: 'Alice Sharma',
    fullName: 'Alice Sharma',
    company: 'Apex Advisory Pvt. Ltd.',
    email: 'alice@example.com',
    password: 'Password123!',
    priceLabel: '₹4,999',
  },
  {
    shortName: 'Bob Verma',
    fullName: 'Bob Verma',
    company: 'Horizon Growth Enterprises',
    email: 'bob@example.com',
    password: 'Password123!',
    priceLabel: '₹7,999',
  },
];

/**
 * Formats an amount in paise (100 paise = ₹1.00) into Indian Rupees (e.g., ₹4,999).
 */
export function formatINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  }).format(rupees);
}
