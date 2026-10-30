import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { env } from './env';

export const prisma = new PrismaClient();

export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
});
