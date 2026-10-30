import axios from 'axios';
import { env, isPlaceholderKey } from '../config/env';

const ZOHO_DATA_CENTERS = [
  { accountsUrl: 'https://accounts.zoho.com', apiUrl: 'https://www.zohoapis.com', region: 'US/Global (.com)' },
  { accountsUrl: 'https://accounts.zoho.in', apiUrl: 'https://www.zohoapis.in', region: 'India (.in)' },
  { accountsUrl: 'https://accounts.zoho.eu', apiUrl: 'https://www.zohoapis.eu', region: 'Europe (.eu)' },
  { accountsUrl: 'https://accounts.zoho.com.au', apiUrl: 'https://www.zohoapis.com.au', region: 'Australia (.com.au)' },
  { accountsUrl: 'https://accounts.zoho.jp', apiUrl: 'https://www.zohoapis.jp', region: 'Japan (.jp)' },
  { accountsUrl: 'https://accounts.zohocloud.ca', apiUrl: 'https://www.zohoapis.ca', region: 'Canada (.ca)' },
];

/**
 * CLI Utility: `npm run zoho:token -- <GRANT_TOKEN>`
 * Exchanges a Zoho API Console "Self Client" Grant Token (code) for a permanent ZOHO_REFRESH_TOKEN.
 * Automatically tries the configured ZOHO_ACCOUNTS_URL first, then falls back across Zoho data centers
 * if `invalid_client` occurs due to a region mismatch.
 */
async function main() {
  const grantToken = process.argv[2];
  if (!grantToken) {
    console.error('Usage: npm run zoho:token -- <ZOHO_SELF_CLIENT_GRANT_TOKEN>');
    console.error('Example: npm run zoho:token -- 1000.abc123def456...');
    process.exit(1);
  }

  if (isPlaceholderKey(env.ZOHO_CLIENT_ID) || isPlaceholderKey(env.ZOHO_CLIENT_SECRET)) {
    console.error(
      'Error: ZOHO_CLIENT_ID or ZOHO_CLIENT_SECRET is missing or still set to a placeholder in server/.env.local or server/.env.'
    );
    process.exit(1);
  }

  // Prioritize the user's configured ZOHO_ACCOUNTS_URL first, then try other Zoho DCs
  const configuredBase = env.ZOHO_ACCOUNTS_URL.replace(/\/$/, '');
  const orderedCenters = [
    ...ZOHO_DATA_CENTERS.filter((dc) => dc.accountsUrl === configuredBase),
    ...ZOHO_DATA_CENTERS.filter((dc) => dc.accountsUrl !== configuredBase),
  ];

  for (const dc of orderedCenters) {
    const tokenUrl = `${dc.accountsUrl}/oauth/v2/token`;
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: env.ZOHO_CLIENT_ID.trim(),
      client_secret: env.ZOHO_CLIENT_SECRET.trim(),
      code: grantToken.trim(),
    });

    console.log(`Exchanging grant token with ${tokenUrl} (${dc.region})...`);
    const response = await axios.post(tokenUrl, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (response.data?.error === 'invalid_client') {
      console.log(`  -> Not on ${dc.region} (invalid_client), checking next Zoho data center...`);
      continue;
    }

    if (response.data?.error) {
      console.error(`\nZoho Error on ${dc.region}: ${response.data.error}`);
      if (response.data.error === 'invalid_code') {
        console.error(
          'Note: Zoho Grant Tokens are single-use and expire after 3–10 minutes. Generate a fresh code in Zoho API Console -> Self Client -> Generate Code and re-run this command.'
        );
      }
      process.exit(1);
    }

    console.log(`\n✓ Successfully exchanged Zoho Grant Token on ${dc.region}!`);
    console.log(`Add/update the following lines in server/.env.local (or server/.env):\n`);
    console.log(`ZOHO_REFRESH_TOKEN="${response.data.refresh_token}"`);
    console.log(`ZOHO_ACCOUNTS_URL="${dc.accountsUrl}"`);
    console.log(`ZOHO_API_URL="${dc.apiUrl}"\n`);
    return;
  }

  console.error(
    '\nZoho Error: invalid_client across all Zoho data centers. Double-check that ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET in server/.env.local exactly match your Zoho Self Client.'
  );
  process.exit(1);
}

main().catch((err) => {
  console.error('Failed to exchange Zoho token:', err instanceof Error ? err.message : err);
  process.exit(1);
});
