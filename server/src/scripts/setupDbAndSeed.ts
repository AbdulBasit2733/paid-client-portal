import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { prisma, supabaseAdmin } from '../config/clients';
import { env, isPlaceholderKey } from '../config/env';

const TEST_PASSWORD = 'Password123!';

interface SeedClientSpec {
  email: string;
  name: string;
  zohoDealId: string;
  docTitle: string;
  docDescription: string;
  priceCents: number;
  secretCode: string;
  bodyMarkdown: string;
}

async function ensureSupabaseAuthUser(email: string, name: string): Promise<string> {
  const { data: listData, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  if (listErr) {
    throw new Error(`Failed to list Supabase Auth users: ${listErr.message}`);
  }

  const existing = listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) {
    await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    return existing.id;
  }

  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: name },
  });

  if (createErr || !created.user) {
    throw new Error(`Failed to create Supabase Auth user ${email}: ${createErr?.message}`);
  }

  return created.user.id;
}

async function applyRlsPoliciesSql(): Promise<void> {
  const sqlPath = path.resolve(__dirname, '../../../supabase/migrations/001_rls_policies.sql');
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`RLS migration file not found at ${sqlPath}`);
  }

  const rawSql = fs.readFileSync(sqlPath, 'utf8');

  // Remove full-line SQL comments and split into individual statements for Prisma $executeRawUnsafe
  const cleanSql = rawSql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');

  const statements = cleanSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`[Setup] Applying ${statements.length} PostgreSQL RLS policy statements...`);
  for (const stmt of statements) {
    await prisma.$executeRawUnsafe(stmt);
  }
  console.log(`[Setup] PostgreSQL Row Level Security (RLS) policies applied.`);
}

async function main() {
  console.log(`================================================================`);
  console.log(` Paid Client Access Portal - Database, RLS & Seed Setup`);
  console.log(`================================================================`);

  if (isPlaceholderKey(env.SUPABASE_URL) || isPlaceholderKey(env.SUPABASE_SERVICE_ROLE_KEY)) {
    console.error(
      `[Error] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in server/.env before running db:setup.`
    );
    process.exit(1);
  }

  console.log(`[Setup] Pushing Prisma schema to Supabase PostgreSQL...`);
  try {
    execSync('npx prisma db push --skip-generate', {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '../..'),
      env: {
        ...process.env,
        DATABASE_URL: env.DATABASE_URL,
        DIRECT_URL: env.DIRECT_URL || env.DATABASE_URL,
      },
    });
  } catch {
    console.warn(
      `[Setup] Port 5432 (DIRECT_URL) unreachable on this network; falling back to port 6543 (DATABASE_URL)...`
    );
    try {
      execSync('npx prisma db push --skip-generate', {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '../..'),
        env: {
          ...process.env,
          DATABASE_URL: env.DATABASE_URL,
          DIRECT_URL: env.DATABASE_URL.replace('?pgbouncer=true', ''),
        },
      });
    } catch {
      console.warn(`[Setup] Schema tables already exist in Supabase; continuing to RLS & seeding...`);
    }
  }

  await applyRlsPoliciesSql();

  const clientsToSeed: SeedClientSpec[] = [
    {
      email: 'alice@example.com',
      name: 'Alice Sharma (Apex Advisory)',
      zohoDealId: env.ZOHO_DEAL_ID_ALICE,
      docTitle: '2026 Financial Advisory & Tax Planning Report',
      docDescription:
        'Complete annual wealth strategy, corporate tax optimization breakdown, and quarterly compliance checklist prepared for Apex Advisory.',
      priceCents: 499900, // ₹4,999.00 INR (in paise)
      secretCode: 'APEX-2026-INR-8841',
      bodyMarkdown: [
        '# 2026 Financial Advisory & Tax Planning Report',
        '',
        '**Prepared For:** Alice Sharma — Apex Advisory Pvt. Ltd.',
        `**Account Reference (Zoho Deal ID):** ${env.ZOHO_DEAL_ID_ALICE}`,
        '',
        '## 1. Executive Summary',
        '- **Projected Annual Tax Savings:** ₹18,40,000 across FY 2026–27',
        '- **Recommended Treasury Allocation:** 60% Sovereign & Corporate Bonds, 25% Index Equities, 15% Liquid Reserve',
        '- **Quarterly Advance Tax Schedule:** 15 June, 15 September, 15 December, and 15 March',
        '',
        '## 2. Key Action Items for Q3 & Q4',
        '- Complete Section 80JJAA deduction filings before the statutory audit deadline.',
        '- Rebalance short-term debt instruments into high-grade AAA corporate deposits.',
        '- Review GST input tax credit reconciliation summary with your assigned advisor.',
      ].join('\n'),
    },
    {
      email: 'bob@example.com',
      name: 'Bob Verma (Horizon Growth)',
      zohoDealId: env.ZOHO_DEAL_ID_BOB,
      docTitle: '2026 Business Expansion & Market Strategy Guide',
      docDescription:
        'Regional go-to-market roadmap, unit economics forecast, and enterprise pricing playbook prepared for Horizon Growth.',
      priceCents: 799900, // ₹7,999.00 INR (in paise)
      secretCode: 'HORIZON-2026-INR-9920',
      bodyMarkdown: [
        '# 2026 Business Expansion & Market Strategy Guide',
        '',
        '**Prepared For:** Bob Verma — Horizon Growth Enterprises',
        `**Account Reference (Zoho Deal ID):** ${env.ZOHO_DEAL_ID_BOB}`,
        '',
        '## 1. Expansion Roadmap Overview',
        '- **Target Revenue Run-Rate:** ₹12.5 Crore ARR within 12 months',
        '- **Priority Metro Launch Markets:** Bengaluru, Mumbai, Hyderabad, and Delhi NCR',
        '- **Target Customer Payback Period:** 5.5 months with 78% gross margin',
        '',
        '## 2. Recommended Next Steps',
        '- Finalize enterprise tier pricing at ₹49,000/month with annual billing incentives.',
        '- Onboard 4 regional channel partners in Q3 to accelerate mid-market deal flow.',
      ].join('\n'),
    },
  ];

  for (const spec of clientsToSeed) {
    console.log(`[Setup] Provisioning Supabase Auth user & profile for ${spec.email}...`);
    const userId = await ensureSupabaseAuthUser(spec.email, spec.name);

    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: spec.email,
        name: spec.name,
        zohoDealId: spec.zohoDealId,
      },
      update: {
        email: spec.email,
        name: spec.name,
        zohoDealId: spec.zohoDealId,
      },
    });

    const existingDoc = await prisma.document.findFirst({
      where: { ownerId: userId },
    });

    const document = existingDoc
      ? await prisma.document.update({
          where: { id: existingDoc.id },
          data: {
            title: spec.docTitle,
            description: spec.docDescription,
            priceCents: spec.priceCents,
          },
        })
      : await prisma.document.create({
          data: {
            title: spec.docTitle,
            description: spec.docDescription,
            priceCents: spec.priceCents,
            ownerId: userId,
          },
        });

    await prisma.documentContent.upsert({
      where: { documentId: document.id },
      create: {
        documentId: document.id,
        bodyMarkdown: spec.bodyMarkdown,
        secretCode: spec.secretCode,
      },
      update: {
        bodyMarkdown: spec.bodyMarkdown,
        secretCode: spec.secretCode,
      },
    });

    console.log(
      `  ✓ Seeded Client: ${spec.email} (UUID: ${userId}) | Zoho Deal: ${spec.zohoDealId} | Document: ${document.id}`
    );
  }

  console.log(`\n[Setup] Complete! Both test clients are ready for login:`);
  console.log(`  • Client A: alice@example.com / ${TEST_PASSWORD}`);
  console.log(`  • Client B: bob@example.com   / ${TEST_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error('[Setup] Fatal error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
