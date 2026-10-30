import { prisma } from '../config/clients';
import { syncPurchaseToZoho } from '../services/zohoService';

/**
 * CLI Command: `npm run sync:zoho-retry`
 * Requirement 3: Queries all pending or failed Zoho CRM sync logs and retries updating
 * each matching Zoho Deal while keeping client document access untouched.
 */
async function main() {
  console.log(`================================================================`);
  console.log(` Zoho CRM Pending Sync Retry Runner (npm run sync:zoho-retry)`);
  console.log(`================================================================`);

  const pendingLogs = await prisma.zohoSyncLog.findMany({
    where: {
      status: {
        in: ['PENDING', 'FAILED'],
      },
    },
    include: {
      purchase: {
        include: {
          user: true,
          document: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (pendingLogs.length === 0) {
    console.log(`✓ No PENDING or FAILED Zoho CRM sync logs found. All paid purchases are in sync!`);
    return;
  }

  console.log(`Found ${pendingLogs.length} purchase(s) requiring Zoho CRM Deal sync:\n`);

  let succeeded = 0;
  let stillPending = 0;

  for (const log of pendingLogs) {
    console.log(
      `→ Retrying Purchase ${log.purchaseId} | Client: ${log.purchase.user.email} | Zoho Deal: ${log.zohoDealId} (Previous attempts: ${log.attempts})`
    );

    const outcome = await syncPurchaseToZoho(log.purchaseId, {
      simulateFailure: false,
    });

    if (outcome.syncLog.status === 'SUCCESS') {
      succeeded++;
      console.log(
        `  ✓ SUCCESS: Deal ${log.zohoDealId} updated at ${outcome.syncLog.syncedAt?.toISOString()}`
      );
    } else {
      stillPending++;
      console.log(
        `  ✗ PENDING (Attempt #${outcome.syncLog.attempts}): ${outcome.syncLog.lastError}`
      );
    }
  }

  console.log(`\nSummary: ${succeeded} succeeded, ${stillPending} remaining pending.`);
}

main()
  .catch((err) => {
    console.error('[ZohoRetryCLI] Unexpected error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
