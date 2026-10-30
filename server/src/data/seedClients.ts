export interface SeedDocItem {
  title: string;
  dealName: string;
  description: string;
  priceCents: number; // Stored in paise (100 paise = ₹1.00)
  secretCode: string;
  summaryPoints: string[];
  actionItems: string[];
  fallbackDealId?: string;
}

export interface SeedClientDefinition {
  email: string;
  name: string;
  company: string;
  docs: SeedDocItem[];
}

export const TWENTY_SEED_CLIENTS: SeedClientDefinition[] = [
  {
    email: 'alice@example.com',
    name: 'Alice Sharma',
    company: 'Apex Advisory Pvt. Ltd.',
    docs: [
      {
        title: '2026 Financial Advisory & Tax Planning Report',
        dealName: 'Apex Capital — Q4 M&A Portal Access',
        description:
          'Complete annual wealth strategy, corporate tax optimization breakdown, and quarterly compliance checklist prepared for Apex Advisory.',
        priceCents: 499900, // ₹4,999
        secretCode: 'APEX-2026-INR-8841',
        fallbackDealId: '1466428000000480422',
        summaryPoints: [
          'Projected Annual Tax Savings: ₹18,40,000 across FY 2026–27',
          'Recommended Treasury Allocation: 60% Sovereign & Corporate Bonds, 25% Index Equities, 15% Liquid Reserve',
          'Quarterly Advance Tax Schedule: 15 June, 15 September, 15 December, and 15 March',
        ],
        actionItems: [
          'Complete Section 80JJAA deduction filings before the statutory audit deadline.',
          'Rebalance short-term debt instruments into high-grade AAA corporate deposits.',
          'Review GST input tax credit reconciliation summary with your assigned advisor.',
        ],
      },
    ],
  },
  {
    email: 'bob@example.com',
    name: 'Bob Verma',
    company: 'Horizon Growth Enterprises',
    docs: [
      {
        title: '2026 Business Expansion & Market Strategy Guide',
        dealName: 'Horizon Ventures — Series B Audit Access',
        description:
          'Regional go-to-market roadmap, unit economics forecast, and enterprise pricing playbook prepared for Horizon Growth.',
        priceCents: 799900, // ₹7,999
        secretCode: 'HORIZON-2026-INR-9920',
        fallbackDealId: '1466428000000480456',
        summaryPoints: [
          'Target Revenue Run-Rate: ₹12.5 Crore ARR within 12 months',
          'Priority Metro Launch Markets: Bengaluru, Mumbai, Hyderabad, and Delhi NCR',
          'Target Customer Payback Period: 5.5 months with 78% gross margin',
        ],
        actionItems: [
          'Finalize enterprise tier pricing at ₹49,000/month with annual billing incentives.',
          'Onboard 4 regional channel partners in Q3 to accelerate mid-market deal flow.',
        ],
      },
      {
        title: 'Q3 GST & Statutory Compliance Audit Report',
        dealName: 'Horizon Growth — Q3 GST & Statutory Audit',
        description:
          'State-wise GSTR-2B vs Purchase Register reconciliation, input credit optimization, and e-invoicing compliance verification.',
        priceCents: 349900, // ₹3,499
        secretCode: 'HORIZON-GST-2026-3310',
        summaryPoints: [
          'Unclaimed Input Tax Credit Recovered: ₹4,12,500 across Maharashtra & Karnataka GSTINs',
          'Zero late-fee exposure verified across all 6 monthly return filings',
        ],
        actionItems: [
          'Issue vendor follow-up notices for 3 pending GSTR-1 invoice uploads before the 11th.',
          'Update HSN summary codes on interstate supply credit notes.',
        ],
      },
    ],
  },
  {
    email: 'aarav@example.com',
    name: 'Aarav Mehta',
    company: 'FinEdge Capital',
    docs: [
      {
        title: 'Series A Valuation & Cap-Table Dossier',
        dealName: 'FinEdge Capital — Series A Valuation Dossier',
        description:
          'DCF & comparable transaction valuation model (Rule 11UA compliant) with post-money dilution waterfall for Series A.',
        priceCents: 1499900, // ₹14,999
        secretCode: 'FINEDGE-VAL-2026-1001',
        summaryPoints: [
          'Certified Fair Market Value: ₹84.5 Crore Pre-Money Valuation',
          'Founder Equity Retention Post-Series A: 68.4% fully diluted',
        ],
        actionItems: [
          'Obtain Merchant Banker valuation certificate prior to private placement offer letter (PAS-4).',
          'File Form PAS-3 within 15 days of share allotment.',
        ],
      },
      {
        title: 'FEMA & Cross-Border Remittance Legal Opinion',
        dealName: 'FinEdge Capital — FEMA Cross-Border Opinion',
        description:
          'RBI FIRMS portal Form FC-GPR filing checklist and pricing guidelines review for foreign institutional investors.',
        priceCents: 649900, // ₹6,499
        secretCode: 'FINEDGE-FEMA-2026-1002',
        summaryPoints: [
          '100% Automatic Route FDI eligibility confirmed under current sector norms',
          'FIRC & KYC verification completed with Authorized Dealer Category-I Bank',
        ],
        actionItems: [
          'Submit Single Master Form (SMF) FC-GPR within 30 days of share issue.',
        ],
      },
      {
        title: 'Employee Stock Option (ESOP) Trust Blueprint',
        dealName: 'FinEdge Capital — ESOP 2026 Structuring',
        description:
          '4-year graded vesting policy, exercise tax calculation guide, and compensation committee resolution templates.',
        priceCents: 899900, // ₹8,999
        secretCode: 'FINEDGE-ESOP-2026-1003',
        summaryPoints: [
          'ESOP Pool Size: 7.5% of diluted equity reserved for key engineering & leadership hires',
          '1-year cliff followed by quarterly vesting over 36 months',
        ],
        actionItems: [
          'Pass Special Resolution in EGM and file Form MGT-14 with ROC.',
        ],
      },
    ],
  },
  {
    email: 'priya@example.com',
    name: 'Priya Nair',
    company: 'Verdant MedTech',
    docs: [
      {
        title: 'CDSCO Medical Device Regulatory Clearance Report',
        dealName: 'Verdant MedTech — CDSCO Regulatory Clearance',
        description:
          'Class B diagnostic device manufacturing license dossier (Form MD-5) and ISO 13485 quality management audit.',
        priceCents: 949900, // ₹9,499
        secretCode: 'VERDANT-MED-2026-4001',
        summaryPoints: [
          'Technical Device Master File (DMF) & Plant Master File (PMF) 100% compliant',
          'Estimated State Licensing Authority approval timeline: 45 working days',
        ],
        actionItems: [
          'Upload notarized test batch stability reports on the CDSCO Sugam portal.',
        ],
      },
    ],
  },
  {
    email: 'rohan@example.com',
    name: 'Rohan Kulkarni',
    company: 'Sahyadri Logistics',
    docs: [
      {
        title: 'Warehouse Lease & Stamp Duty Assessment',
        dealName: 'Sahyadri Logistics — Warehouse Lease Assessment',
        description:
          'Legal title search and Maharashtra Stamp Act duty calculation for the 1,20,000 sq.ft. Bhiwandi fulfillment hub.',
        priceCents: 549900, // ₹5,499
        secretCode: 'SAHYADRI-LGL-2026-5001',
        summaryPoints: [
          '30-year clear & marketable land title verified across 7/12 revenue extracts',
          'Lock-in period negotiated down from 5 years to 36 months',
        ],
        actionItems: [
          'Complete e-SBTR stamp duty payment prior to Sub-Registrar execution appointment.',
        ],
      },
      {
        title: 'Fleet Financing & Working Capital Term Sheet',
        dealName: 'Sahyadri Logistics — Fleet Financing Term Sheet',
        description:
          'Comparative interest rate & hypothecation analysis for 45 commercial EV delivery vehicles.',
        priceCents: 1199900, // ₹11,999
        secretCode: 'SAHYADRI-FIN-2026-5002',
        summaryPoints: [
          'Approved Term Loan Facility: ₹6.8 Crore at 8.95% p.a. reducing balance',
          'Interest coverage ratio maintained at 3.4x across 60-month tenure',
        ],
        actionItems: [
          'File ROC charge creation Form CHG-1 within 30 days of sanction disbursement.',
        ],
      },
    ],
  },
  {
    email: 'ananya@example.com',
    name: 'Ananya Iyer',
    company: 'Dakshin SaaS Labs',
    docs: [
      {
        title: 'SaaS Export LUT & Zero-Rated GST Advisory',
        dealName: 'Dakshin SaaS — Export LUT & GST Advisory',
        description:
          'Letter of Undertaking (Form GST RFD-11) filing confirmation and accumulated ITC refund calculation for overseas SaaS subscriptions.',
        priceCents: 449900, // ₹4,499
        secretCode: 'DAKSHIN-SAAS-2026-6001',
        summaryPoints: [
          '100% Zero-Rated Export status confirmed on USD/EUR software subscriptions',
          'Eligible quarterly GST refund claim: ₹7,85,000',
        ],
        actionItems: [
          'Attach BRC/FIRC realization statements with Form GST RFD-01 application.',
        ],
      },
    ],
  },
  {
    email: 'vikram@example.com',
    name: 'Vikram Singhania',
    company: 'Indus InfraCorp',
    docs: [
      {
        title: 'EPC Contract Risk & Arbitration Review',
        dealName: 'Indus InfraCorp — EPC Contract Risk Review',
        description:
          'Price escalation clause audit, liquidated damages cap analysis, and bank guarantee release schedule for highway EPC package.',
        priceCents: 1899900, // ₹18,999
        secretCode: 'INDUS-EPC-2026-7001',
        summaryPoints: [
          'Maximum Liquidated Damages capped at 5% of total contract value',
          'WPI-linked steel & bitumen escalation formula approved',
        ],
        actionItems: [
          'Submit Performance Bank Guarantee within 14 days of Letter of Award (LOA).',
        ],
      },
      {
        title: 'Project Finance Debt Coverage Report',
        dealName: 'Indus InfraCorp — Project Finance DSCR Report',
        description:
          'Consortium lender cash-flow waterfall and Debt Service Coverage Ratio (DSCR) sensitivity model.',
        priceCents: 1249900, // ₹12,499
        secretCode: 'INDUS-DSCR-2026-7002',
        summaryPoints: [
          'Average DSCR of 1.62x maintained across 10-year repayment schedule',
          'Escrow Trust & Retention Account (TRA) agreement finalized',
        ],
        actionItems: [
          'Execute Independent Engineer certification prior to Tranche-2 drawdown.',
        ],
      },
    ],
  },
  {
    email: 'neha@example.com',
    name: 'Neha Gupta',
    company: 'Bloom Retail India',
    docs: [
      {
        title: 'D2C Brand Trademark & IP Protection Dossier',
        dealName: 'Bloom Retail — Trademark & IP Dossier',
        description:
          'Trademark Class 3 & Class 35 clearance search, Madrid Protocol international filing roadmap, and packaging copyright review.',
        priceCents: 399900, // ₹3,999
        secretCode: 'BLOOM-IP-2026-8001',
        summaryPoints: [
          'Zero phonetic or visual conflict found across Indian Trade Marks Registry Class 3',
          'Expedited TM-M examination approved within 30 days',
        ],
        actionItems: [
          'Execute Form TM-48 authorization to complete wordmark and device mark filings.',
        ],
      },
    ],
  },
  {
    email: 'kabir@example.com',
    name: 'Kabir Malhotra',
    company: 'NorthStar Hospitality',
    docs: [
      {
        title: 'Hotel Franchise Agreement Due Diligence',
        dealName: 'NorthStar Hospitality — Franchise Due Diligence',
        description:
          'Management fee structure, GOP incentive split, and territorial exclusivity review for 140-key boutique resort.',
        priceCents: 999900, // ₹9,999
        secretCode: 'NORTHSTAR-HTL-2026-9001',
        summaryPoints: [
          'Base Management Fee reduced from 3.5% to 2.75% of Gross Operating Revenue',
          '15 km radius territorial non-compete clause secured',
        ],
        actionItems: [
          'Attach approved FF&E brand specification schedule as Annexure-C.',
        ],
      },
      {
        title: 'FY26 Hospitality Input Tax Credit Audit',
        dealName: 'NorthStar Hospitality — FY26 GST ITC Audit',
        description:
          'Room tariff slab classification (12% vs 18% GST) and F&B input credit bifurcation report.',
        priceCents: 499900, // ₹4,999
        secretCode: 'NORTHSTAR-ITC-2026-9002',
        summaryPoints: [
          'Banquet & corporate event billing reconciled with zero tax shortfall',
          'Annual GSTR-9 & 9C draft prepared for statutory sign-off',
        ],
        actionItems: [
          'Update POS billing rules for seasonal room packages above ₹7,500/night.',
        ],
      },
    ],
  },
  {
    email: 'divya@example.com',
    name: 'Divya Reddy',
    company: 'Deccan BioSciences',
    docs: [
      {
        title: 'R&D Tax Deduction (Section 35) Certification',
        dealName: 'Deccan BioSciences — R&D Tax Certification',
        description:
          'DSIR in-house R&D unit recognition renewal and capital/revenue scientific expenditure audit for Hyderabad lab.',
        priceCents: 749900, // ₹7,499
        secretCode: 'DECCAN-BIO-2026-1010',
        summaryPoints: [
          '₹3.4 Crore of laboratory equipment & clinical consumables verified for R&D tax deduction',
          'Form 3CK & 3CL documentation ready for DSIR electronic submission',
        ],
        actionItems: [
          'Maintain separate books of account and project-wise timesheets for R&D personnel.',
        ],
      },
    ],
  },
  {
    email: 'siddharth@example.com',
    name: 'Siddharth Joshi',
    company: 'Pune AutoComponents',
    docs: [
      {
        title: 'EV Supply Chain Vendor Contract Review',
        dealName: 'Pune Auto — EV Vendor Contract Review',
        description:
          'OEM warranty indemnity, tooling ownership, and raw material indexation schedule for tier-1 EV powertrain supply.',
        priceCents: 699900, // ₹6,999
        secretCode: 'PUNE-AUTO-2026-1101',
        summaryPoints: [
          ' dedicated die & mold tooling title vested with OEM buyer upon 100% amortization',
          'Quarterly aluminum & copper LME price pass-through clause finalized',
        ],
        actionItems: [
          'Sign mutual Non-Disclosure & IP Assignment addendum with tier-2 sub-vendors.',
        ],
      },
      {
        title: 'Industrial Subsidy & PLI Scheme Eligibility Report',
        dealName: 'Pune Auto — PLI & State Subsidy Report',
        description:
          'Maharashtra Package Scheme of Incentives (PSI) mega-project SGST refund and Auto PLI domestic value addition calculation.',
        priceCents: 1399900, // ₹13,999
        secretCode: 'PUNE-PLI-2026-1102',
        summaryPoints: [
          'Domestic Value Addition (DVA) certified at 56.4% (exceeding 50% PLI threshold)',
          'Estimated 7-year state industrial subsidy entitlement: ₹9.2 Crore',
        ],
        actionItems: [
          'Submit quarterly capex investment certificate to the Directorate of Industries.',
        ],
      },
    ],
  },
  {
    email: 'meera@example.com',
    name: 'Meera Krishnan',
    company: 'Kaveri Textiles',
    docs: [
      {
        title: 'Export Duty Drawback & RoDTEP Claim Audit',
        dealName: 'Kaveri Textiles — Export RoDTEP Audit',
        description:
          'Shipping bill ICEGATE scroll verification and RoDTEP e-scrip ledger reconciliation for EU & UK apparel exports.',
        priceCents: 599900, // ₹5,999
        secretCode: 'KAVERI-EXP-2026-1201',
        summaryPoints: [
          '₹14,20,000 in transferable RoDTEP duty credit scrips generated on ICEGATE portal',
          '100% EGM (Export General Manifest) filing compliance across Tuticorin & Chennai ports',
        ],
        actionItems: [
          'Complete annual e-BRC realization linking before DGFT closure deadline.',
        ],
      },
    ],
  },
  {
    email: 'arjun@example.com',
    name: 'Arjun Kapoor',
    company: 'Velocity FinTech',
    docs: [
      {
        title: 'RBI Payment Aggregator Compliance Checklist',
        dealName: 'Velocity FinTech — RBI PA Compliance Dossier',
        description:
          'Net-worth certification, nodal/escrow account governance, and PCI-DSS 4.0 readiness dossier for RBI PA authorization.',
        priceCents: 1999900, // ₹19,999
        secretCode: 'VELOCITY-RBI-2026-1301',
        summaryPoints: [
          'Statutory Net Worth verified at ₹28.4 Crore (above ₹25 Crore RBI mandate)',
          'CERT-In empaneled System Audit Report (SAR) completed with zero critical findings',
        ],
        actionItems: [
          'File quarterly cybersecurity & escrow balance certificates with RBI DPSS.',
        ],
      },
      {
        title: 'Data Localization & DPDP Act Audit Report',
        dealName: 'Velocity FinTech — DPDP Act & Data Audit',
        description:
          'RBI payment system data localization verification and Digital Personal Data Protection (DPDP) Act consent architecture.',
        priceCents: 1099900, // ₹10,999
        secretCode: 'VELOCITY-DPDP-2026-1302',
        summaryPoints: [
          '100% end-to-end transaction logs stored exclusively in Mumbai & Hyderabad AWS regions',
          'Multilingual notice & granular consent revocation workflow verified',
        ],
        actionItems: [
          'Appoint designated Data Protection Officer (DPO) and publish grievance redressal SLA.',
        ],
      },
    ],
  },
  {
    email: 'pooja@example.com',
    name: 'Pooja Deshmukh',
    company: 'Konkan AgroExports',
    docs: [
      {
        title: 'APEDA Export Compliance & Forex Hedging Note',
        dealName: 'Konkan Agro — APEDA & Forex Advisory',
        description:
          'Phytosanitary certification workflow, cold-chain subsidy claim, and USD/INR forward contract hedging strategy.',
        priceCents: 429900, // ₹4,299
        secretCode: 'KONKAN-AGRO-2026-1401',
        summaryPoints: [
          '70% of Q2 export receivables hedged at ₹84.15/USD via 90-day forward contracts',
          'APEDA packhouse recognition renewed for 3 years',
        ],
        actionItems: [
          'Submit cold-chain transport assistance claim within 60 days of bill of lading date.',
        ],
      },
    ],
  },
  {
    email: 'karan@example.com',
    name: 'Karan Thakur',
    company: 'Himalayan Renewables',
    docs: [
      {
        title: 'Solar PPA Tariff & Carbon Credit Valuation',
        dealName: 'Himalayan Renewables — Solar PPA Valuation',
        description:
          '25-year Open Access Group Captive Power Purchase Agreement (PPA) financial model and Verra VCS carbon credit forecast.',
        priceCents: 1599900, // ₹15,999
        secretCode: 'HIMALAYA-PPA-2026-1501',
        summaryPoints: [
          'Levelized Tariff locked at ₹3.85/kWh with 26% captive equity shareholding compliance',
          'Estimated annual carbon credit revenue: ₹68,00,000 (42,000 VCUs/year)',
        ],
        actionItems: [
          'Execute State Transmission Utility (STU) wheeling & banking agreement.',
        ],
      },
    ],
  },
  {
    email: 'sneha@example.com',
    name: 'Sneha Chatterjee',
    company: 'Bengal EdTech',
    docs: [
      {
        title: 'Angel Round SHA & Founder Vesting Schedule',
        dealName: 'Bengal EdTech — Angel Round SHA Advisory',
        description:
          'Shareholders Agreement (SHA) term review, anti-dilution protection analysis, and DPIIT Startup India Section 80-IAC application.',
        priceCents: 649900, // ₹6,499
        secretCode: 'BENGAL-ED-2026-1601',
        summaryPoints: [
          'Broad-based weighted average anti-dilution protection secured (replacing full ratchet)',
          'DPIIT Certificate of Recognition active for angel tax exemption',
        ],
        actionItems: [
          'Convene Board Meeting to approve Compulsorily Convertible Preference Shares (CCPS) allotment.',
        ],
      },
    ],
  },
  {
    email: 'rahul@example.com',
    name: 'Rahul Choudhary',
    company: 'Thar Solar & Infra',
    docs: [
      {
        title: 'Land Acquisition Title & Encumbrance Report',
        dealName: 'Thar Solar — Land Title & CLU Report',
        description:
          '30-year revenue record chain verification, non-agricultural Change of Land Use (CLU) approval, and right-of-way easement check.',
        priceCents: 849900, // ₹8,499
        secretCode: 'THAR-LAND-2026-1701',
        summaryPoints: [
          '240 acres of contiguous solar park land verified free of bank mortgages or litigation',
          '33kV transmission line right-of-way agreements registered',
        ],
        actionItems: [
          'Complete mutation entry in local Tehsil revenue records post-sale deed registration.',
        ],
      },
    ],
  },
  {
    email: 'tanvi@example.com',
    name: 'Tanvi Shah',
    company: 'Sabarmati Pharma',
    docs: [
      {
        title: 'Transfer Pricing Study & Form 3CEB Report',
        dealName: 'Sabarmati Pharma — Transfer Pricing Study',
        description:
          'Transactional Net Margin Method (TNMM) benchmarking analysis for API exports to US & European subsidiary entities.',
        priceCents: 1149900, // ₹11,499
        secretCode: 'SABARMATI-TP-2026-1801',
        summaryPoints: [
          'Operating margin of 16.8% falls comfortably within the 35th–65th arm’s-length interquartile range',
          'Master File (Form 3CEAA) & Local File documentation completed',
        ],
        actionItems: [
          'Upload CA-signed Form 3CEB on the Income Tax e-Filing portal before 31 October.',
        ],
      },
    ],
  },
  {
    email: 'aditya@example.com',
    name: 'Aditya Rao',
    company: 'Coastal Marine Services',
    docs: [
      {
        title: 'Customs Bonded Warehouse Licensing Dossier',
        dealName: 'Coastal Marine — Customs Bonded Warehouse',
        description:
          'Section 58 & Section 65 MOOWR (Manufacture and Other Operations in Warehouse Regulations) duty deferment application.',
        priceCents: 799900, // ₹7,999
        secretCode: 'COASTAL-MAR-2026-1901',
        summaryPoints: [
          '100% Customs Duty & IGST deferment approved on imported marine spares & equipment',
          'Solvency certificate and Triple Duty Bond format vetted',
        ],
        actionItems: [
          'Install customs-compliant digital inventory audit trail software prior to physical inspection.',
        ],
      },
    ],
  },
  {
    email: 'ishita@example.com',
    name: 'Ishita Banerjee',
    company: 'MetroPolis Coworking',
    docs: [
      {
        title: 'Commercial Fit-Out Depreciation & Tax Schedule',
        dealName: 'MetroPolis Coworking — Depreciation & Tax Advisory',
        description:
          'Component-wise fixed asset capitalization (HVAC, modular workstations, IT networking) and Section 194-I TDS compliance.',
        priceCents: 529900, // ₹5,299
        secretCode: 'METROPOLIS-TAX-2026-2001',
        summaryPoints: [
          'Accelerated 40% depreciation schedule mapped for server & networking infrastructure',
          'Lower TDS deduction certificate (Form 13) workflow prepared for enterprise tenants',
        ],
        actionItems: [
          'Update fixed asset register with QR-coded physical verification tags before Q4 audit.',
        ],
      },
    ],
  },
];
