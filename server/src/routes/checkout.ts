import { Router, Response } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma, stripe } from '../config/clients';
import { env, isPlaceholderKey } from '../config/env';
import { AuthenticatedRequest, requireSupabaseAuth } from '../middleware/auth';
import { processVerifiedStripeEvent } from './webhook';

export const checkoutRouter = Router();

const createSessionSchema = z.object({
  documentId: z.string().uuid(),
  simulateZohoFailure: z.boolean().optional().default(false),
});

const verifySessionSchema = z.object({
  sessionId: z.string().min(1),
});

/**
 * POST /api/checkout/create-session
 * Authenticates the client via Supabase JWT, looks up their stable User ID and Zoho Deal ID,
 * and creates a Stripe Checkout Session carrying those stable IDs in metadata.
 */
checkoutRouter.post(
  '/create-session',
  requireSupabaseAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const parsed = createSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Invalid checkout request payload.',
          details: parsed.error.flatten(),
        });
        return;
      }

      const { documentId, simulateZohoFailure } = parsed.data;
      const authUser = req.user!;

      const user = await prisma.user.findUnique({
        where: { id: authUser.id },
      });

      if (!user) {
        res.status(404).json({
          error:
            'Client profile not found in public.users. Run `npm run db:setup` in server/ to seed client profiles.',
        });
        return;
      }

      const document = await prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        res.status(404).json({ error: 'Requested document does not exist.' });
        return;
      }

      // Enforce tenant isolation: if document is assigned to a specific client, only that client may purchase it
      if (document.ownerId && document.ownerId !== user.id) {
        res.status(403).json({
          error: 'Access denied: This document is assigned to a different client account.',
        });
        return;
      }

      // Check if client already has a PAID entitlement for this document
      const existingPurchase = await prisma.purchase.findUnique({
        where: {
          userId_documentId: {
            userId: user.id,
            documentId: document.id,
          },
        },
      });

      if (existingPurchase && existingPurchase.status === 'PAID') {
        res.status(409).json({
          error: 'Document access is already unlocked for this client.',
          purchaseId: existingPurchase.id,
        });
        return;
      }

      if (isPlaceholderKey(env.STRIPE_SECRET_KEY)) {
        res.status(503).json({
          error:
            'STRIPE_SECRET_KEY is not configured in server/.env yet. Add your Stripe test secret key to create live Checkout sessions.',
        });
        return;
      }

      const stableMetadata = {
        userId: user.id,
        documentId: document.id,
        zohoDealId: user.zohoDealId,
        simulateZohoFailure: String(Boolean(simulateZohoFailure)),
      };

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        billing_address_collection: 'auto',
        client_reference_id: user.id,
        customer_email: user.email,
        line_items: [
          {
            price_data: {
              currency: 'inr',
              unit_amount: document.priceCents,
              product_data: {
                name: document.title,
                description: document.description,
              },
            },
            quantity: 1,
          },
        ],
        metadata: stableMetadata,
        payment_intent_data: {
          metadata: stableMetadata,
        },
        success_url: `${env.CLIENT_URL}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.CLIENT_URL}/?checkout=cancelled`,
      });

      res.json({
        sessionId: session.id,
        url: session.url,
        metadata: stableMetadata,
      });
    } catch (err) {
      console.error('[Checkout] Failed to create Stripe Checkout session:', err);
      res.status(500).json({
        error: 'Failed to create Stripe Checkout session.',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }
);

/**
 * POST /api/checkout/verify-session
 * Verifies a completed Stripe Checkout session directly with Stripe on the server when the
 * browser returns from Stripe Checkout (`?checkout=success&session_id=cs_test_...`).
 * Uses the exact same idempotent `processVerifiedStripeEvent` pipeline as the webhook route
 * so that whichever arrives first (webhook or redirect) grants access once without duplication.
 */
checkoutRouter.post(
  '/verify-session',
  requireSupabaseAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const parsed = verifySessionSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Missing or invalid sessionId.' });
        return;
      }

      const { sessionId } = parsed.data;
      const authUser = req.user!;

      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== 'paid') {
        res.status(400).json({
          error: `Payment is not completed yet (payment_status: '${session.payment_status}').`,
        });
        return;
      }

      const sessionUserId = session.metadata?.userId || session.client_reference_id;
      if (sessionUserId !== authUser.id) {
        res.status(403).json({
          error: 'Access denied: This Stripe Checkout session belongs to a different client.',
        });
        return;
      }

      // Look up the matching Stripe checkout.session.completed event if already created by Stripe
      const recentEvents = await stripe.events.list({
        type: 'checkout.session.completed',
        limit: 15,
      });
      const matchedEvent = recentEvents.data.find(
        (evt) => (evt.data.object as Stripe.Checkout.Session).id === session.id
      );

      const stripeEvent: Stripe.Event =
        matchedEvent ??
        ({
          id: `evt_session_${session.id}`,
          object: 'event',
          type: 'checkout.session.completed',
          data: { object: session },
        } as unknown as Stripe.Event);

      const result = await processVerifiedStripeEvent(stripeEvent);
      res.json(result);
    } catch (err) {
      console.error('[CheckoutVerify] Failed to verify Stripe Checkout session:', err);
      res.status(500).json({
        error: 'Failed to verify Stripe Checkout session.',
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }
);
