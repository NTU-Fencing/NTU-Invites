// ============================================================
//  ANNUAL CONFIG — update this file each year and redeploy
// ============================================================
const CONFIG = {

  // ── EVENT DETAILS ──────────────────────────────────────────
  eventName:  'Open Fencing Championship',
  edition:    'Annual Open Invitational',
  date:       'TBA',               // e.g. '12 April 2026'
  venue:      'TBA',               // e.g. 'OCBC Arena, Singapore'
  contactEmail: 'contact@yourclub.sg',

  // ── REGISTRATION WINDOW ────────────────────────────────────
  regOpen:    false,
  earlyBird:  false,
  // earlyBirdDeadline: '2026-02-28'   // optional, informational only

  // ── PRICES (SGD) ───────────────────────────────────────────
  prices: {
    individual: { normal: 50,  earlyBird: 40  },
    team:       { normal: 120, earlyBird: 100 },
  },

  // ── PAYNOW ─────────────────────────────────────────────────
  uen: '',    // e.g. 'T08SS0123A'

  // ── STRIPE ─────────────────────────────────────────────────
  // Public key only — secret key goes in environment variables
  stripePublicKey: '',   // e.g. 'pk_live_...'

  // ── BACKDROP IMAGE ─────────────────────────────────────────
  backdropImage: '',     // filename in /public, e.g. 'backdrop.jpg'
};

// Works in both browser (window.CONFIG) and Node (module.exports)
if (typeof module !== 'undefined') module.exports = CONFIG;
else window.CONFIG = CONFIG;
