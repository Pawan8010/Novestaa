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
  nodeEnv === 'production' ? 'production' : `"${nodeEnv}" (set NODE_ENV="production" in production)`
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

// 3. SMTP & Resend fallback email transport check
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
    record('PASS', 'SMTP Handshake', `Authenticated on ${smtpHost}:${smtpPort} as ${smtpUser}`);
  } catch (err) {
    record(
      'FAIL',
      'SMTP Handshake',
      err instanceof Error ? err.message : 'SMTP verification failed'
    );
  }
} else if (process.env.RESEND_API_KEY?.trim()) {
  record('WARN', 'Email Transport', 'SMTP not configured; falling back to RESEND_API_KEY');
} else {
  record('FAIL', 'Email Transport', 'Neither SMTP (SMTP_*) nor RESEND_API_KEY is configured');
}

// 4. Shared Cloud Persistence (Upstash Redis REST — optional)
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
    'Not set (using local disk data/submissions.json)'
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
