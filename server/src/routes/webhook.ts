import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma, stripe } from '../config/clients';
import { env } from '../config/env';
import { syncPurchaseToZoho, ZohoSyncOptions } from '../services/zohoService';

export const webhookRouter = Router();

export interface WebhookProcessResult {
  received: boolean;
  ignored?: boolean;
  idempotentSkip?: boolean;
  reason?: string;
  purchaseId?: string;
  zohoSyncStatus?: string;
}

/**
 * Core processor for a verified Stripe Event.
 * Extracted so both the HTTP route and the automated integration test suite can verify
 * signature handling, idempotency, entitlement creation, and Zoho CRM outage resilience.
 */
export async function processVerifiedStripeEvent(
  event: Stripe.Event,
  zohoOptions: ZohoSyncOptions = {}
): Promise<WebhookProcessResult> {
  // Handle only checkout session payment completion events
  if (
    event.type !== 'checkout.session.completed' &&
    event.type !== 'checkout.session.async_payment_succeeded'
  ) {
    return {
      received: true,
      ignored: true,
      reason: `Unhandled event type: ${event.type}`,
    };
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // Requirement 2: Grant access ONLY after successful payment
  if (session.payment_status !== 'paid') {
    return {
      received: true,
      ignored: true,
      reason: `Checkout session ${session.id} payment_status is '${session.payment_status}', not 'paid'.`,
    };
  }

  const userId = session.metadata?.userId || session.client_reference_id;
  const documentId = session.metadata?.documentId;
  let zohoDealId = session.metadata?.zohoDealId;
  const simulateFailureFromMetadata = session.metadata?.simulateZohoFailure === 'true';

  if (!userId || !documentId) {
    throw new Error(
      `Stripe Checkout session ${session.id} is missing required stable metadata (userId, documentId).`
    );
  }

  // Fallback to User's mapped zohoDealId if omitted in metadata
  if (!zohoDealId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error(`User ${userId} referenced in webhook metadata does not exist.`);
    }
    zohoDealId = user.zohoDealId;
  }

  // Level 1 Idempotency: Check if this exact Stripe Event ID was already processed
  const existingEvent = await prisma.webhookEvent.findUnique({
    where: { stripeEventId: event.id },
  });

  // Level 2 Idempotency: Check if entitlement for (userId, documentId) or stripeSessionId already exists
  const existingPurchase = await prisma.purchase.findFirst({
    where: {
      OR: [
        { userId, documentId },
        { stripeSessionId: session.id },
      ],
    },
    include: { zohoSync: true },
  });

  if (existingPurchase) {
    // Ensure the webhook event ID is recorded even if the purchase was reconciled first via verify-session
    if (!existingEvent) {
      await prisma.webhookEvent.upsert({
        where: { stripeEventId: event.id },
        create: {
          stripeEventId: event.id,
          eventType: event.type,
          sessionId: session.id,
          processed: true,
          payload: {
            id: event.id,
            type: event.type,
            sessionId: session.id,
            userId,
            documentId,
            zohoDealId,
          },
        },
        update: { processed: true },
      });
    }

    // If Zoho already succeeded, this repeated webhook delivery is a strict idempotent no-op
    if (existingPurchase.zohoSync?.status === 'SUCCESS') {
      console.log(
        `[Webhook] Idempotent skip: Event ${event.id} / Session ${session.id} already processed and synced to Zoho.`
      );
      return {
        received: true,
        idempotentSkip: true,
        purchaseId: existingPurchase.id,
        zohoSyncStatus: existingPurchase.zohoSync.status,
      };
    }

    // If previous Zoho sync was left PENDING, re-attempt Zoho sync without duplicating entitlement
    const retryResult = await syncPurchaseToZoho(existingPurchase.id, {
      simulateFailure: zohoOptions.simulateFailure ?? simulateFailureFromMetadata,
      mockTransport: zohoOptions.mockTransport,
    });

    return {
      received: true,
      idempotentSkip: true,
      purchaseId: existingPurchase.id,
      zohoSyncStatus: retryResult.syncLog.status,
    };
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id || null;

  // Step 1: Commit entitlement & initial PENDING Zoho log inside an atomic DB transaction
  // This guarantees client document access is granted even if Zoho CRM fails in Step 2!
  const purchase = await prisma.$transaction(async (tx) => {
    const upsertedPurchase = await tx.purchase.upsert({
      where: {
        userId_documentId: {
          userId,
          documentId,
        },
      },
      create: {
        userId,
        documentId,
        zohoDealId,
        stripeSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        stripeEventId: event.id,
        amountCents: session.amount_total ?? 499900,
        currency: session.currency ?? 'inr',
        status: 'PAID',
      },
      update: {
        status: 'PAID',
      },
    });

    // Only create ZohoSyncLog if one does not already exist
    const currentSync = await tx.zohoSyncLog.findUnique({
      where: { purchaseId: upsertedPurchase.id },
    });

    if (!currentSync) {
      await tx.zohoSyncLog.create({
        data: {
          purchaseId: upsertedPurchase.id,
          userId,
          zohoDealId,
          status: 'PENDING',
          attempts: 0,
        },
      });
    }

    // Record the webhook event idempotency key
    await tx.webhookEvent.upsert({
      where: { stripeEventId: event.id },
      create: {
        stripeEventId: event.id,
        eventType: event.type,
        sessionId: session.id,
        processed: true,
        payload: {
          id: event.id,
          type: event.type,
          sessionId: session.id,
          userId,
          documentId,
          zohoDealId,
        },
      },
      update: {
        processed: true,
      },
    });

    return upsertedPurchase;
  });

  // Step 2: Update matching Zoho Deal outside the DB transaction
  // If Zoho is unavailable, client access remains PAID and ZohoSyncLog stays PENDING
  const syncOutcome = await syncPurchaseToZoho(purchase.id, {
    simulateFailure: zohoOptions.simulateFailure ?? simulateFailureFromMetadata,
    mockTransport: zohoOptions.mockTransport,
  });

  return {
    received: true,
    idempotentSkip: Boolean(existingPurchase),
    purchaseId: purchase.id,
    zohoSyncStatus: syncOutcome.syncLog.status,
  };
}

/**
 * POST /api/webhooks/stripe
 * Expects raw request body (`express.raw({ type: 'application/json' })`) to verify `stripe-signature`.
 */
webhookRouter.post('/stripe', async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers['stripe-signature'];

  if (!signature || typeof signature !== 'string') {
    res.status(400).json({ error: 'Missing stripe-signature header.' });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Webhook] Signature verification failed: ${message}`);
    res.status(400).json({ error: `Webhook signature verification failed: ${message}` });
    return;
  }

  try {
    const result = await processVerifiedStripeEvent(event);
    res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Webhook] Error processing event ${event.id}:`, message);
    res.status(500).json({ error: message });
  }
});
