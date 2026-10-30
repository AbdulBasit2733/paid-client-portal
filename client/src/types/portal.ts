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
  zoho_deal_id: string | null;
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

export interface WebhookReplayResult {
  testedAt: string;
  replayedEventId: string;
  idempotentSkip: boolean;
  totalPurchasesForDoc: number;
  zohoSyncStatus: string;
}

export interface DemoClientAccount {
  id: number;
  shortName: string;
  fullName: string;
  company: string;
  email: string;
  password: string;
  docsCount: number;
  primaryDocSummary: string;
  priceLabel: string;
}

export const DEMO_CLIENTS: DemoClientAccount[] = [
  {
    id: 1,
    shortName: 'Alice Sharma',
    fullName: 'Alice Sharma',
    company: 'Apex Advisory Pvt. Ltd.',
    email: 'alice@example.com',
    password: 'Password123!',
    docsCount: 1,
    primaryDocSummary: '2026 Financial Advisory & Tax Planning Report',
    priceLabel: '₹4,999',
  },
  {
    id: 2,
    shortName: 'Bob Verma',
    fullName: 'Bob Verma',
    company: 'Horizon Growth Enterprises',
    email: 'bob@example.com',
    password: 'Password123!',
    docsCount: 2,
    primaryDocSummary: 'Expansion Strategy Guide + Q3 GST Audit (2 Docs)',
    priceLabel: '₹7,999 & ₹3,499',
  },
  {
    id: 3,
    shortName: 'Aarav Mehta',
    fullName: 'Aarav Mehta',
    company: 'FinEdge Capital',
    email: 'aarav@example.com',
    password: 'Password123!',
    docsCount: 3,
    primaryDocSummary: 'Series A Valuation + FEMA + ESOP Blueprint (3 Docs)',
    priceLabel: '₹14,999 – ₹6,499',
  },
  {
    id: 4,
    shortName: 'Priya Nair',
    fullName: 'Priya Nair',
    company: 'Verdant MedTech',
    email: 'priya@example.com',
    password: 'Password123!',
    docsCount: 1,
    primaryDocSummary: 'CDSCO Medical Device Regulatory Clearance Report',
    priceLabel: '₹9,499',
  },
  {
    id: 5,
    shortName: 'Rohan Kulkarni',
    fullName: 'Rohan Kulkarni',
    company: 'Sahyadri Logistics',
    email: 'rohan@example.com',
    password: 'Password123!',
    docsCount: 2,
    primaryDocSummary: 'Warehouse Lease + Fleet Financing Term Sheet (2 Docs)',
    priceLabel: '₹5,499 & ₹11,999',
  },
  {
    id: 6,
    shortName: 'Ananya Iyer',
    fullName: 'Ananya Iyer',
    company: 'Dakshin SaaS Labs',
    email: 'ananya@example.com',
    password: 'Password123!',
    docsCount: 1,
    primaryDocSummary: 'SaaS Export LUT & Zero-Rated GST Advisory',
    priceLabel: '₹4,499',
  },
  {
    id: 7,
    shortName: 'Vikram Singhania',
    fullName: 'Vikram Singhania',
    company: 'Indus InfraCorp',
    email: 'vikram@example.com',
    password: 'Password123!',
    docsCount: 2,
    primaryDocSummary: 'EPC Contract Review + Project Finance DSCR (2 Docs)',
    priceLabel: '₹18,999 & ₹12,499',
  },
  {
    id: 8,
    shortName: 'Neha Gupta',
    fullName: 'Neha Gupta',
    company: 'Bloom Retail India',
    email: 'neha@example.com',
    password: 'Password123!',
    docsCount: 1,
    primaryDocSummary: 'D2C Brand Trademark & IP Protection Dossier',
    priceLabel: '₹3,999',
  },
  {
    id: 9,
    shortName: 'Kabir Malhotra',
    fullName: 'Kabir Malhotra',
    company: 'NorthStar Hospitality',
    email: 'kabir@example.com',
    password: 'Password123!',
    docsCount: 2,
    primaryDocSummary: 'Hotel Franchise Due Diligence + GST ITC Audit (2 Docs)',
    priceLabel: '₹9,999 & ₹4,999',
  },
  {
    id: 10,
    shortName: 'Divya Reddy',
    fullName: 'Divya Reddy',
    company: 'Deccan BioSciences',
    email: 'divya@example.com',
    password: 'Password123!',
    docsCount: 1,
    primaryDocSummary: 'R&D Tax Deduction (Section 35) Certification',
    priceLabel: '₹7,499',
  },
  {
    id: 11,
    shortName: 'Siddharth Joshi',
    fullName: 'Siddharth Joshi',
    company: 'Pune AutoComponents',
    email: 'siddharth@example.com',
    password: 'Password123!',
    docsCount: 2,
    primaryDocSummary: 'EV Vendor Contract + Auto PLI Subsidy Report (2 Docs)',
    priceLabel: '₹6,999 & ₹13,999',
  },
  {
    id: 12,
    shortName: 'Meera Krishnan',
    fullName: 'Meera Krishnan',
    company: 'Kaveri Textiles',
    email: 'meera@example.com',
    password: 'Password123!',
    docsCount: 1,
    primaryDocSummary: 'Export Duty Drawback & RoDTEP Claim Audit',
    priceLabel: '₹5,999',
  },
  {
    id: 13,
    shortName: 'Arjun Kapoor',
    fullName: 'Arjun Kapoor',
    company: 'Velocity FinTech',
    email: 'arjun@example.com',
    password: 'Password123!',
    docsCount: 2,
    primaryDocSummary: 'RBI Payment Aggregator + DPDP Act Audit (2 Docs)',
    priceLabel: '₹19,999 & ₹10,999',
  },
  {
    id: 14,
    shortName: 'Pooja Deshmukh',
    fullName: 'Pooja Deshmukh',
    company: 'Konkan AgroExports',
    email: 'pooja@example.com',
    password: 'Password123!',
    docsCount: 1,
    primaryDocSummary: 'APEDA Export Compliance & Forex Hedging Note',
    priceLabel: '₹4,299',
  },
  {
    id: 15,
    shortName: 'Karan Thakur',
    fullName: 'Karan Thakur',
    company: 'Himalayan Renewables',
    email: 'karan@example.com',
    password: 'Password123!',
    docsCount: 1,
    primaryDocSummary: 'Solar PPA Tariff & Carbon Credit Valuation',
    priceLabel: '₹15,999',
  },
  {
    id: 16,
    shortName: 'Sneha Chatterjee',
    fullName: 'Sneha Chatterjee',
    company: 'Bengal EdTech',
    email: 'sneha@example.com',
    password: 'Password123!',
    docsCount: 1,
    primaryDocSummary: 'Angel Round SHA & Founder Vesting Schedule',
    priceLabel: '₹6,499',
  },
  {
    id: 17,
    shortName: 'Rahul Choudhary',
    fullName: 'Rahul Choudhary',
    company: 'Thar Solar & Infra',
    email: 'rahul@example.com',
    password: 'Password123!',
    docsCount: 1,
    primaryDocSummary: 'Land Acquisition Title & Encumbrance Report',
    priceLabel: '₹8,499',
  },
  {
    id: 18,
    shortName: 'Tanvi Shah',
    fullName: 'Tanvi Shah',
    company: 'Sabarmati Pharma',
    email: 'tanvi@example.com',
    password: 'Password123!',
    docsCount: 1,
    primaryDocSummary: 'Transfer Pricing Study & Form 3CEB Report',
    priceLabel: '₹11,499',
  },
  {
    id: 19,
    shortName: 'Aditya Rao',
    fullName: 'Aditya Rao',
    company: 'Coastal Marine Services',
    email: 'aditya@example.com',
    password: 'Password123!',
    docsCount: 1,
    primaryDocSummary: 'Customs Bonded Warehouse Licensing Dossier',
    priceLabel: '₹7,999',
  },
  {
    id: 20,
    shortName: 'Ishita Banerjee',
    fullName: 'Ishita Banerjee',
    company: 'MetroPolis Coworking',
    email: 'ishita@example.com',
    password: 'Password123!',
    docsCount: 1,
    primaryDocSummary: 'Commercial Fit-Out Depreciation & Tax Schedule',
    priceLabel: '₹5,299',
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
