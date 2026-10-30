import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load env in priority order: server/.env.local -> server/.env -> root .env.local -> root .env
const serverRoot = path.resolve(__dirname, '../..');
const workspaceRoot = path.resolve(serverRoot, '..');

dotenv.config({ path: path.join(serverRoot, '.env.local') });
dotenv.config({ path: path.join(serverRoot, '.env') });
dotenv.config({ path: path.join(workspaceRoot, '.env.local') });
dotenv.config({ path: path.join(workspaceRoot, '.env') });

const envSchema = z.object({
  PORT: z.string().default('4000'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/postgres'),
  DIRECT_URL: z.string().optional(),

  // Supabase (Server-side validation & admin seeding)
  SUPABASE_URL: z.string().default('https://your-project-id.supabase.co'),
  SUPABASE_ANON_KEY: z.string().default('your-supabase-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('your-supabase-service-role-key'),

  // Stripe (Server-side only)
  STRIPE_SECRET_KEY: z.string().default('sk_test_placeholder'),
  STRIPE_WEBHOOK_SECRET: z.string().default('whsec_placeholder'),

  // Zoho CRM OAuth 2.0 (Server-side only)
  ZOHO_CLIENT_ID: z.string().default('1000.PLACEHOLDER_CLIENT_ID'),
  ZOHO_CLIENT_SECRET: z.string().default('placeholder_client_secret'),
  ZOHO_REFRESH_TOKEN: z.string().default('1000.placeholder_refresh_token'),
  ZOHO_ACCOUNTS_URL: z.string().default('https://accounts.zoho.com'),
  ZOHO_API_URL: z.string().default('https://www.zohoapis.com'),
  ZOHO_PAID_STAGE: z.string().default('Closed Won'),
  ZOHO_FORCE_FAIL: z.string().default('false'),

  // Stable mapped Zoho Deal IDs for seeded test clients
  ZOHO_DEAL_ID_ALICE: z.string().default('615294000000491001'),
  ZOHO_DEAL_ID_BOB: z.string().default('615294000000491002'),
});

export const env = envSchema.parse(process.env);

export function isPlaceholderKey(value: string): boolean {
  return (
    !value ||
    value.includes('placeholder') ||
    value.includes('PLACEHOLDER') ||
    value.includes('your-project-id') ||
    value.includes('your-supabase') ||
    value.includes('XXXX') ||
    value.includes('xxxx')
  );
}
