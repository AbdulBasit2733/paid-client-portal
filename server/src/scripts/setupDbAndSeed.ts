import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { execSync } from 'child_process';
import { prisma, supabaseAdmin } from '../config/clients';
import { env, isPlaceholderKey } from '../config/env';
import { getZohoAccessToken } from '../services/zohoService';
import { TWENTY_SEED_CLIENTS, SeedDocItem } from '../data/seedClients';

const TEST_PASSWORD = 'Password123!';

function buildMarkdownBody(
  clientName: string,
  company: string,
  doc: SeedDocItem,
  dealId: string
): string {
  return [
    `# ${doc.title}`,
    '',
    `Prepared For: ${clientName} — ${company}`,
    `Account Reference (Zoho CRM Deal ID): ${dealId}`,
    '',
    '## 1. Executive Summary & Key Findings',
    ...doc.summaryPoints.map((pt) => `- ${pt}`),
    '',
    '## 2. Recommended Next Steps & Action Items',
    ...doc.actionItems.map((act) => `- ${act}`),
  ].join('\n');
}

/**
 * Queries existing Deals in Zoho CRM and automatically creates any missing Deals
 * for our 20 seeded clients so every document has a real, live Zoho CRM Deal ID!
 */
async function syncDealsWithZohoCrm(): Promise<Map<string, string>> {
  const dealNameToId = new Map<string, string>();

  // Pre-seed known fallback IDs first
  for (const client of TWENTY_SEED_CLIENTS) {
    for (const doc of client.docs) {
      if (doc.fallbackDealId) {
        dealNameToId.set(doc.dealName, doc.fallbackDealId);
      }
    }
  }

  try {
    const accessToken = await getZohoAccessToken(true);
    const dealsUrl = `${env.ZOHO_API_URL.replace(/\/$/, '')}/crm/v6/Deals`;

    console.log(`[Setup] Fetching existing Deals from Zoho CRM (${dealsUrl})...`);
    const existingRes = await axios.get(
      `${dealsUrl}?fields=id,Deal_Name,Stage,Amount&per_page=200`,
      {
        headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
        timeout: 15000,
      }
    );

    const existingDeals: Array<{ id: string; Deal_Name: string }> =
      existingRes.data?.data || [];
    for (const d of existingDeals) {
      if (d.Deal_Name && d.id) {
        dealNameToId.set(d.Deal_Name.trim(), d.id);
      }
    }

    // Find all seeded documents whose Deal_Name does not exist in Zoho CRM yet
    const missingDealsPayload: Array<{
      Deal_Name: string;
      Stage: string;
      Amount: number;
      Closing_Date: string;
      Description: string;
    }> = [];

    for (const client of TWENTY_SEED_CLIENTS) {
      for (const doc of client.docs) {
        if (!dealNameToId.has(doc.dealName)) {
          missingDealsPayload.push({
            Deal_Name: doc.dealName,
            Stage: 'Qualification',
            Amount: Number((doc.priceCents / 100).toFixed(2)),
            Closing_Date: '2026-12-31',
            Description: `Client Portal Advisory Deal for ${client.name} (${client.company} - ${client.email}) | Document: ${doc.title}`,
          });
        }
      }
    }

    if (missingDealsPayload.length > 0) {
      console.log(
        `[Setup] Creating ${missingDealsPayload.length} new client Deals in Zoho CRM...`
      );
      // Zoho CRM v6 accepts up to 100 records per POST request
      const createRes = await axios.post(
        dealsUrl,
        { data: missingDealsPayload },
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 20000,
        }
      );

      const createdRecords: Array<{
        code?: string;
        details?: { id?: string };
      }> = createRes.data?.data || [];

      createdRecords.forEach((rec, idx) => {
        const dealName = missingDealsPayload[idx]?.Deal_Name;
        if (rec.code === 'SUCCESS' && rec.details?.id && dealName) {
          dealNameToId.set(dealName, rec.details.id);
        }
      });
      console.log(`[Setup] ✓ Created & linked ${createdRecords.length} Deals in Zoho CRM!`);
    } else {
      console.log(`[Setup] ✓ All 28 client Deals already exist in Zoho CRM.`);
    }
  } catch (err) {
    console.warn(
      `[Setup] Zoho CRM live Deal auto-creation skipped (${
        err instanceof Error ? err.message : String(err)
      }). Using deterministic Deal IDs.`
    );
  }

  return dealNameToId;
}

async function applyRlsPoliciesSql(): Promise<void> {
  const sqlPath = path.resolve(__dirname, '../../../supabase/migrations/001_rls_policies.sql');
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`RLS migration file not found at ${sqlPath}`);
  }

  const rawSql = fs.readFileSync(sqlPath, 'utf8');
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
  console.log(` Paid Client Access Portal — 20 Clients, RLS & Zoho Deals Setup`);
  console.log(`================================================================`);

  if (isPlaceholderKey(env.SUPABASE_URL) || isPlaceholderKey(env.SUPABASE_SERVICE_ROLE_KEY)) {
    console.error(
      `[Error] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in server/.env.local before running db:setup.`
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
      `[Setup] Port 5432 unreachable; falling back to port 6543 (DATABASE_URL)...`
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
      console.warn(`[Setup] Schema tables already exist; continuing to RLS & 20-client seeding...`);
    }
  }

  // Ensure documents.zoho_deal_id column exists even if prisma db push was skipped on port 5432
  await prisma.$executeRawUnsafe(
    `ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS zoho_deal_id TEXT;`
  );

  await applyRlsPoliciesSql();

  // Sync or create all 28 Deals in Zoho CRM
  const dealNameToId = await syncDealsWithZohoCrm();

  // Fetch existing Supabase Auth users once
  const { data: listData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 200,
  });
  if (listErr) {
    throw new Error(`Failed to list Supabase Auth users: ${listErr.message}`);
  }
  const existingUsersByEmail = new Map(
    listData.users.map((u) => [u.email?.toLowerCase() || '', u.id])
  );

  let totalDocsSeeded = 0;

  for (let i = 0; i < TWENTY_SEED_CLIENTS.length; i++) {
    const clientSpec = TWENTY_SEED_CLIENTS[i];
    const displayFullName = `${clientSpec.name} (${clientSpec.company})`;

    let userId = existingUsersByEmail.get(clientSpec.email.toLowerCase());
    if (!userId) {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: clientSpec.email,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: displayFullName },
      });
      if (createErr || !created.user) {
        throw new Error(`Failed to create user ${clientSpec.email}: ${createErr?.message}`);
      }
      userId = created.user.id;
    }

    const primaryDealId =
      dealNameToId.get(clientSpec.docs[0].dealName) ||
      clientSpec.docs[0].fallbackDealId ||
      `1466428000000900${String(i + 1).padStart(3, '0')}`;

    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: clientSpec.email,
        name: displayFullName,
        zohoDealId: primaryDealId,
      },
      update: {
        email: clientSpec.email,
        name: displayFullName,
        zohoDealId: primaryDealId,
      },
    });

    // Fetch existing documents for this user
    const existingDocs = await prisma.document.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'asc' },
    });

    for (let docIdx = 0; docIdx < clientSpec.docs.length; docIdx++) {
      const docSpec = clientSpec.docs[docIdx];
      const docDealId =
        dealNameToId.get(docSpec.dealName) ||
        docSpec.fallbackDealId ||
        primaryDealId;

      const matchedExisting =
        existingDocs.find((d) => d.title === docSpec.title) || existingDocs[docIdx];

      const savedDoc = matchedExisting
        ? await prisma.document.update({
            where: { id: matchedExisting.id },
            data: {
              title: docSpec.title,
              description: docSpec.description,
              priceCents: docSpec.priceCents,
              zohoDealId: docDealId,
            },
          })
        : await prisma.document.create({
            data: {
              title: docSpec.title,
              description: docSpec.description,
              priceCents: docSpec.priceCents,
              zohoDealId: docDealId,
              ownerId: userId,
            },
          });

      const markdownBody = buildMarkdownBody(
        clientSpec.name,
        clientSpec.company,
        docSpec,
        docDealId
      );

      await prisma.documentContent.upsert({
        where: { documentId: savedDoc.id },
        create: {
          documentId: savedDoc.id,
          bodyMarkdown: markdownBody,
          secretCode: docSpec.secretCode,
        },
        update: {
          bodyMarkdown: markdownBody,
          secretCode: docSpec.secretCode,
        },
      });

      totalDocsSeeded++;
    }

    console.log(
      `  ✓ [${String(i + 1).padStart(2, '0')}/20] ${clientSpec.email.padEnd(22)} | ${
        clientSpec.docs.length
      } Doc(s) | Primary Zoho Deal: ${primaryDealId}`
    );
  }

  console.log(
    `\n[Setup] Complete! Seeded 20 Client Accounts & ${totalDocsSeeded} Advisory Documents/Deals (Password: ${TEST_PASSWORD}).`
  );
}

main()
  .catch((err) => {
    console.error('[Setup] Fatal error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
