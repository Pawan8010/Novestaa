import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const checks = [];

function record(status, label, detail) {
  checks.push({ status, label, detail });
  const badge = status === 'PASS' ? '[PASS]' : status === 'WARN' ? '[WARN]' : '[FAIL]';
  console.log(`${badge} ${label} — ${detail}`);
}

console.log('\nNovesta Production Readiness Preflight\n======================================');

// 1. Runtime & Domain
const nodeEnv = process.env.NODE_ENV?.trim() || 'development';
record(
  nodeEnv === 'production' ? 'PASS' : 'WARN',
  'NODE_ENV',
  nodeEnv === 'production' ? 'production' : `"${nodeEnv}" (set NODE_ENV="production" on Hostinger)`
);

const appUrl = process.env.APP_URL?.trim() || '';
if (/^https:\/\/[^/\s]+/i.test(appUrl)) {
  record('PASS', 'APP_URL', appUrl);
} else {
  record('FAIL', 'APP_URL', 'Missing or not HTTPS (set APP_URL="https://novesta.online")');
}

// 2. Frontend build output
const distIndex = path.join(rootDir, 'dist', 'index.html');
if (fs.existsSync(distIndex)) {
  record('PASS', 'Frontend Build (dist/)', 'dist/index.html present');
} else {
  record('FAIL', 'Frontend Build (dist/)', 'Missing dist/index.html — run "npm run build"');
}

// 3. Founder security
const adminKey = process.env.FOUNDER_ADMIN_KEY?.trim() || '';
record(
  adminKey.length >= 12 ? 'PASS' : adminKey.length > 0 ? 'WARN' : 'FAIL',
  'FOUNDER_ADMIN_KEY',
  adminKey.length >= 12
    ? 'Configured (strong length)'
    : adminKey.length > 0
      ? 'Configured, but shorter than 12 characters'
      : 'Not set'
);

const sessionSecret = process.env.SESSION_SECRET?.trim() || '';
record(
  sessionSecret.length >= 32 ? 'PASS' : 'WARN',
  'SESSION_SECRET',
  sessionSecret.length >= 32
    ? 'Configured (32+ chars)'
    : 'Not explicitly set in .env (recommended: 64-char hex string)'
);

// 4. Razorpay Live Checkout & Webhook
const rpKeyId = process.env.RAZORPAY_KEY_ID?.trim() || '';
const rpSecret = process.env.RAZORPAY_KEY_SECRET?.trim() || '';
const rpWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || '';

if (rpKeyId && rpSecret) {
  if (rpKeyId.startsWith('rzp_live_')) {
    record('PASS', 'Razorpay API Keys', 'Live mode keys configured (rzp_live_...)');
  } else if (rpKeyId.startsWith('rzp_test_')) {
    record('WARN', 'Razorpay API Keys', 'Test mode keys configured (rzp_test_...) — switch to rzp_live_ for launch');
  } else {
    record('WARN', 'Razorpay API Keys', 'Configured (unrecognized key prefix)');
  }
} else {
  record('FAIL', 'Razorpay API Keys', 'Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET');
}

record(
  rpWebhookSecret.length >= 12 ? 'PASS' : rpWebhookSecret ? 'WARN' : 'FAIL',
  'RAZORPAY_WEBHOOK_SECRET',
  rpWebhookSecret ? 'Configured' : 'Not set (required in production for webhook verification)'
);

// 5. Maps key
const mapsKey =
  process.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || process.env.GOOGLE_MAPS_API_KEY?.trim() || '';
record(
  mapsKey ? 'PASS' : 'WARN',
  'VITE_GOOGLE_MAPS_API_KEY',
  mapsKey ? 'Configured (ensure npm run build was run after setting it)' : 'Not set (fallback map link will be used)'
);

// 6. Hostinger SMTP & live handshake test
const smtpHost = process.env.SMTP_HOST?.trim() || '';
const smtpPort = Number(process.env.SMTP_PORT?.trim() || '465') || 465;
const smtpUser = process.env.SMTP_USER?.trim() || '';
const smtpPass = process.env.SMTP_PASS?.trim() || '';
const smtpSecureEnv = process.env.SMTP_SECURE?.trim().toLowerCase();
const smtpSecure = smtpSecureEnv ? smtpSecureEnv === 'true' || smtpSecureEnv === '1' : smtpPort === 465;

if (smtpHost && smtpUser && smtpPass) {
  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 12000,
    });
    await transporter.verify();
    record('PASS', 'Hostinger SMTP Handshake', `Authenticated on ${smtpHost}:${smtpPort} as ${smtpUser}`);
  } catch (err) {
    record(
      'FAIL',
      'Hostinger SMTP Handshake',
      err instanceof Error ? err.message : 'SMTP verification failed'
    );
  }
} else if (process.env.RESEND_API_KEY?.trim()) {
  record('WARN', 'Email Transport', 'Hostinger SMTP not configured; falling back to RESEND_API_KEY');
} else {
  record('FAIL', 'Email Transport', 'Neither Hostinger SMTP (SMTP_*) nor RESEND_API_KEY is configured');
}

// 7. Shared Cloud Persistence (Upstash Redis REST — optional for VPS, recommended for Render Free Tier)
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/\/$/, '') || '';
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || '';
if (upstashUrl && upstashToken) {
  try {
    const pingRes = await fetch(`${upstashUrl}/ping`, {
      headers: { Authorization: `Bearer ${upstashToken}` },
    });
    const pingData = await pingRes.json().catch(() => ({}));
    if (pingRes.ok && pingData?.result === 'PONG') {
      record('PASS', 'Upstash Redis Cloud Sync', `Connected (${upstashUrl})`);
    } else {
      record('FAIL', 'Upstash Redis Cloud Sync', `Unexpected response HTTP ${pingRes.status}`);
    }
  } catch (err) {
    record(
      'FAIL',
      'Upstash Redis Cloud Sync',
      err instanceof Error ? err.message : 'Upstash ping failed'
    );
  }
} else {
  record(
    'WARN',
    'Upstash Redis Cloud Sync',
    'Not set (using local disk data/submissions.json — add Upstash keys on Render Free Tier)'
  );
}

const failures = checks.filter((c) => c.status === 'FAIL').length;
const warnings = checks.filter((c) => c.status === 'WARN').length;

console.log('\n--------------------------------------');
console.log(`Summary: ${checks.length - failures - warnings} passed, ${warnings} warnings, ${failures} failed.`);
if (failures > 0) {
  console.log('Resolve all [FAIL] items in .env before starting production traffic.\n');
  process.exit(1);
} else {
  console.log('Server environment is ready for production.\n');
  process.exit(0);
}
