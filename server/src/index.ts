import express from 'express';
import cors from 'cors';
import { env, isPlaceholderKey } from './config/env';
import { checkoutRouter } from './routes/checkout';
import { webhookRouter } from './routes/webhook';
import { zohoRouter } from './routes/zoho';

export const app = express();

app.use(
  cors({
    origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

/**
 * IMPORTANT: Stripe webhook endpoint MUST receive raw request buffer (`express.raw`)
 * BEFORE `express.json()` parses the body so `stripe.webhooks.constructEvent` can verify
 * the cryptographic `stripe-signature` header.
 */
app.use(
  '/api/webhooks',
  express.raw({ type: 'application/json' }),
  webhookRouter
);

// Standard JSON body parser for all non-webhook endpoints
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'paid-client-portal-server',
    timestamp: new Date().toISOString(),
    configStatus: {
      supabaseConfigured: !isPlaceholderKey(env.SUPABASE_URL),
      stripeConfigured: !isPlaceholderKey(env.STRIPE_SECRET_KEY),
      stripeWebhookConfigured: !isPlaceholderKey(env.STRIPE_WEBHOOK_SECRET),
      zohoConfigured: !isPlaceholderKey(env.ZOHO_REFRESH_TOKEN),
    },
  });
});

app.use('/api/checkout', checkoutRouter);
app.use('/api/zoho', zohoRouter);

if (require.main === module) {
  const port = Number(env.PORT) || 4000;
  app.listen(port, () => {
    console.log(`================================================================`);
    console.log(` Paid Client Portal Backend listening on http://localhost:${port}`);
    console.log(` Webhook endpoint: POST http://localhost:${port}/api/webhooks/stripe`);
    console.log(`================================================================`);
  });
}
