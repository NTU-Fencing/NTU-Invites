// api/submit-registration/index.js
// Azure Static Web Apps function — POST /api/submit-registration
// Appends a row to a Google Sheet via the Google Sheets API v4.
// Uses a Google Service Account — no IT admin / Entra ID required.
//
// ── ENV VARIABLES (set in Azure Static Web Apps → Configuration) ──────────────
// GOOGLE_SERVICE_ACCOUNT_EMAIL   — e.g. fencing-reg@your-project.iam.gserviceaccount.com
// GOOGLE_PRIVATE_KEY             — the private key from the JSON key file
//                                  (paste the full -----BEGIN ... END----- block,
//                                   use \n for newlines in the Azure config UI)
// GOOGLE_SHEET_ID                — the long ID from your Sheet URL
//                                  e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
// GOOGLE_SHEET_TAB               — sheet tab name, default "Registrations"
// ─────────────────────────────────────────────────────────────────────────────

const { google } = require('googleapis');

function getSheetClient() {
  // Azure stores env vars as single-line; restore literal newlines in the key
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key:   privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

module.exports = async function (context, req) {
  if (req.method !== 'POST') {
    context.res = { status: 405, body: 'Method not allowed' };
    return;
  }

  const p = req.body;
  if (!p || !p.email || !p.firstName) {
    context.res = { status: 400, body: { error: 'Invalid payload' } };
    return;
  }

  // Validate required env vars
  const requiredEnv = [
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_PRIVATE_KEY',
    'GOOGLE_SHEET_ID',
  ];
  const missing = requiredEnv.filter(k => !process.env[k]);
  if (missing.length) {
    context.log.error('Missing env vars:', missing);
    context.res = { status: 500, body: { error: 'Server misconfiguration', missing } };
    return;
  }

  const sheetId  = process.env.GOOGLE_SHEET_ID;
  const tabName  = process.env.GOOGLE_SHEET_TAB || 'Registrations';
  // Range: append after the header row, all columns A–R (18 columns)
  const range    = `${tabName}!A:R`;

  // Row values — order matches the header row you set up in the sheet:
  // Timestamp | First Name | Last Name | Email | Phone | Nationality |
  // Country/Club | Weapon | Category | Team Name | Base Fee | Stripe Fee |
  // Total Fee | Payment Method | Payment Status | Transaction Ref |
  // Stripe Session ID | Early Bird
  const row = [
    p.timestamp        || new Date().toISOString(),
    p.firstName        || '',
    p.lastName         || '',
    p.email            || '',
    p.phone            || '',
    p.nationality      || '',
    p.countryClub      || '',
    p.weapon           || '',
    p.category         || '',
    p.teamName         || '',
    p.baseFee          != null ? p.baseFee   : '',
    p.stripeFee        != null ? p.stripeFee : '',
    p.totalFee         != null ? p.totalFee  : '',
    p.paymentMethod    || '',
    p.paymentStatus    || '',
    p.transactionRef   || '',
    p.stripeSessionId  || '',
    p.earlyBird        || 'No',
  ];

  try {
    const sheets = getSheetClient();

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption:  'USER_ENTERED',  // lets Sheets parse dates / numbers
      insertDataOption:  'INSERT_ROWS',
      requestBody: {
        values: [row],
      },
    });

    context.log.info('Registration saved to Google Sheet:', p.email);
    context.res = { status: 202, body: { ok: true } };

  } catch (err) {
    context.log.error('Google Sheets API error:', err.message);
    context.res = {
      status: 500,
      body: { error: 'Failed to write to Google Sheet', detail: err.message },
    };
  }
};
