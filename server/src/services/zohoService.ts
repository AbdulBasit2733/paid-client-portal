import axios from 'axios';
import { prisma } from '../config/clients';
import { env, isPlaceholderKey } from '../config/env';

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

let cachedZohoToken: CachedToken | null = null;

/**
 * Exchanges ZOHO_REFRESH_TOKEN for an active OAuth 2.0 access_token.
 * Caches the token in memory until 5 minutes before expiration.
 */
export async function getZohoAccessToken(forceRefresh = false): Promise<string> {
  const now = Date.now();
  if (!forceRefresh && cachedZohoToken && cachedZohoToken.expiresAt > now) {
    return cachedZohoToken.accessToken;
  }

  if (
    isPlaceholderKey(env.ZOHO_CLIENT_ID) ||
    isPlaceholderKey(env.ZOHO_CLIENT_SECRET) ||
    isPlaceholderKey(env.ZOHO_REFRESH_TOKEN)
  ) {
    throw new Error(
      'Zoho OAuth credentials are not configured yet (using placeholder values in .env).'
    );
  }

  const tokenUrl = `${env.ZOHO_ACCOUNTS_URL.replace(/\/$/, '')}/oauth/v2/token`;
  const params = new URLSearchParams({
    refresh_token: env.ZOHO_REFRESH_TOKEN,
    client_id: env.ZOHO_CLIENT_ID,
    client_secret: env.ZOHO_CLIENT_SECRET,
    grant_type: 'refresh_token',
  });

  const response = await axios.post(tokenUrl, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 10000,
  });

  if (response.data?.error) {
    throw new Error(`Zoho OAuth Token Error: ${response.data.error}`);
  }

  const accessToken = response.data?.access_token;
  if (!accessToken) {
    throw new Error('Zoho OAuth response did not include an access_token.');
  }

  const expiresInSec = Number(response.data?.expires_in || 3600);
  cachedZohoToken = {
    accessToken,
    expiresAt: now + Math.max(expiresInSec - 300, 60) * 1000,
  };

  return accessToken;
}

export interface ZohoSyncOptions {
  simulateFailure?: boolean;
  /**
   * Optional mock transport used ONLY in automated self-verification tests.
   */
  mockTransport?: (dealId: string, payload: Record<string, unknown>) => Promise<{ status: string }>;
}

/**
 * Synchronizes a verified Purchase entitlement to its mapped Zoho CRM Deal.
 *
 * Requirement 2 (Idempotency):
 *   If ZohoSyncLog.status === 'SUCCESS', returns immediately without calling Zoho again.
 *
 * Requirement 3 (Resilience & Retry):
 *   Never revokes or modifies the client's Purchase status if Zoho is unavailable.
 *   Records status='PENDING', increments attempts, and stores lastError so it can
 *   be retried via the UI button (`POST /api/zoho/retry/:purchaseId`) or CLI (`npm run sync:zoho-retry`).
 */
export async function syncPurchaseToZoho(
  purchaseId: string,
  options: ZohoSyncOptions = {}
) {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      user: true,
      document: true,
      zohoSync: true,
    },
  });

  if (!purchase) {
    throw new Error(`Purchase ${purchaseId} not found.`);
  }

  // Requirement 2: Do not duplicate Zoho update if already synced
  if (purchase.zohoSync?.status === 'SUCCESS') {
    return {
      alreadySynced: true,
      syncLog: purchase.zohoSync,
    };
  }

  const dealId = purchase.zohoDealId || purchase.user.zohoDealId;
  const currencyUpper = (purchase.currency || 'inr').toUpperCase();
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currencyUpper,
  }).format(purchase.amountCents / 100);
  const paidTimestamp = purchase.grantedAt.toISOString();

  const zohoDealPayload = {
    data: [
      {
        id: dealId,
        Stage: env.ZOHO_PAID_STAGE || 'Closed Won',
        Amount: Number((purchase.amountCents / 100).toFixed(2)),
        Description: `Paid Client Portal Access Confirmed | Document: ${purchase.document.title} (${formattedAmount} ${currencyUpper}) | Stripe Session: ${purchase.stripeSessionId} | Client ID: ${purchase.userId} | Paid At: ${paidTimestamp}`,
      },
    ],
  };

  try {
    const shouldSimulateFailure =
      options.simulateFailure === true || env.ZOHO_FORCE_FAIL.toLowerCase() === 'true';

    if (shouldSimulateFailure) {
      throw new Error(
        'Simulated Zoho CRM outage (simulateFailure=true or ZOHO_FORCE_FAIL=true). Client document access remains active.'
      );
    }

    let zohoResponseData: unknown;

    if (options.mockTransport) {
      zohoResponseData = await options.mockTransport(dealId, zohoDealPayload);
    } else {
      let accessToken = await getZohoAccessToken(false);
      const dealUrl = `${env.ZOHO_API_URL.replace(/\/$/, '')}/crm/v6/Deals/${dealId}`;

      try {
        const res = await axios.put(dealUrl, zohoDealPayload, {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        });
        zohoResponseData = res.data;
      } catch (err: unknown) {
        // Retry once with forced token refresh on 401
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          accessToken = await getZohoAccessToken(true);
          const retryRes = await axios.put(dealUrl, zohoDealPayload, {
            headers: {
              Authorization: `Zoho-oauthtoken ${accessToken}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          });
          zohoResponseData = retryRes.data;
        } else {
          throw err;
        }
      }

      // Verify Zoho per-record status code
      const recordResult = (
        zohoResponseData as { data?: Array<{ status?: string; code?: string; message?: string }> }
      )?.data?.[0];

      if (recordResult && recordResult.status === 'error') {
        throw new Error(
          `Zoho CRM API rejected Deal update (${recordResult.code}): ${recordResult.message}`
        );
      }
    }

    const updatedLog = await prisma.zohoSyncLog.upsert({
      where: { purchaseId: purchase.id },
      create: {
        purchaseId: purchase.id,
        userId: purchase.userId,
        zohoDealId: dealId,
        status: 'SUCCESS',
        attempts: 1,
        lastError: null,
        zohoPayload: zohoResponseData as object,
        syncedAt: new Date(),
      },
      update: {
        status: 'SUCCESS',
        attempts: { increment: 1 },
        lastError: null,
        zohoPayload: zohoResponseData as object,
        syncedAt: new Date(),
      },
    });

    return {
      alreadySynced: false,
      syncLog: updatedLog,
    };
  } catch (err: unknown) {
    let errorMessage = err instanceof Error ? err.message : String(err);
    if (axios.isAxiosError(err) && err.response?.data) {
      errorMessage = `${err.message} - ${JSON.stringify(err.response.data)}`;
    }

    console.warn(
      `[ZohoSync] Deal ${dealId} update failed for purchase ${purchase.id}. Recording PENDING for retry. Reason: ${errorMessage}`
    );

    // Requirement 3: Keep client access valid; record pending CRM update for retry
    const pendingLog = await prisma.zohoSyncLog.upsert({
      where: { purchaseId: purchase.id },
      create: {
        purchaseId: purchase.id,
        userId: purchase.userId,
        zohoDealId: dealId,
        status: 'PENDING',
        attempts: 1,
        lastError: errorMessage,
        zohoPayload: zohoDealPayload as object,
      },
      update: {
        status: 'PENDING',
        attempts: { increment: 1 },
        lastError: errorMessage,
        zohoPayload: zohoDealPayload as object,
      },
    });

    return {
      alreadySynced: false,
      syncLog: pendingLog,
    };
  }
}
