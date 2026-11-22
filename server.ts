import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const DATA_DIR = process.env.DATA_DIR?.trim()
  ? path.resolve(process.env.DATA_DIR.trim())
  : path.resolve(__dirname, 'data');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');

function getBusinessAlertRecipients(): string[] {
  const primary = process.env.CONTACT_TO_EMAIL?.trim() || 'hello@novesta.online';
  const backup = process.env.CONTACT_BACKUP_EMAIL?.trim() || '';
  return Array.from(
    new Set(
      [primary, backup]
        .map((e) => e.trim())
        .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    )
  );
}

interface CareerRoleRecord {
  id: string;
  code: string;
  title: string;
  team: string;
  location: string;
  status: string;
}

interface ContactRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  businessType: string;
  plan: string;
  message: string;
  status: 'Accepted';
  submittedAt: string;
}

interface CareerApplicationRecord {
  id: string;
  role: string;
  fullName: string;
  email: string;
  answer1: string;
  answer2: string;
  answer3: string;
  status: 'Accepted';
  submittedAt: string;
}

interface SubmissionsStore {
  contacts: ContactRecord[];
  applications: CareerApplicationRecord[];
  roles: CareerRoleRecord[];
}

const DEFAULT_CAREER_ROLES: CareerRoleRecord[] = [
  {
    id: 'fullstack-engineer',
    code: '01',
    title: 'Full-Stack Web Engineer',
    team: 'Engineering',
    location: 'Jalgaon / Remote',
    status: 'Accepting applications',
  },
  {
    id: 'seo-maps-specialist',
    code: '02',
    title: 'SEO & Google Maps Specialist',
    team: 'Search & Local Growth',
    location: 'Jalgaon / Remote',
    status: 'Accepting applications',
  },
  {
    id: 'ai-automation-builder',
    code: '03',
    title: 'AI & WhatsApp Automation Builder',
    team: 'Automation',
    location: 'Jalgaon / Remote',
    status: 'Accepting applications',
  },
];

function loadStore(): SubmissionsStore {
  try {
    if (fs.existsSync(SUBMISSIONS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf8'));
      return {
        contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
        applications: Array.isArray(parsed.applications) ? parsed.applications : [],
        roles:
          Array.isArray(parsed.roles) && parsed.roles.length > 0
            ? parsed.roles
            : [...DEFAULT_CAREER_ROLES],
      };
    }
  } catch (err) {
    console.warn('Could not load submissions store:', err);
  }
  return {
    contacts: [],
    applications: [],
    roles: [...DEFAULT_CAREER_ROLES],
  };
}

const UPSTASH_STORE_KEY = 'novesta:store:v1';

function isUpstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  );
}

async function hydrateStoreFromCloud(store: SubmissionsStore): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/\/$/, '');
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return;

  try {
    const res = await fetch(`${url}/get/${encodeURIComponent(UPSTASH_STORE_KEY)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const payload = (await res.json().catch(() => null)) as { result?: string | null } | null;
    if (!payload?.result || typeof payload.result !== 'string') return;
    const parsed = JSON.parse(payload.result) as Partial<SubmissionsStore>;
    if (Array.isArray(parsed.contacts)) store.contacts = parsed.contacts;
    if (Array.isArray(parsed.applications)) store.applications = parsed.applications;
    if (Array.isArray(parsed.roles)) store.roles = parsed.roles;
    console.info('[Novesta Storage] Hydrated shared store from Upstash Redis.');
  } catch (err) {
    console.warn('[Novesta Storage] Could not hydrate from Upstash Redis:', err);
  }
}

function syncStoreToCloud(serialized: string): void {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/\/$/, '');
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return;

  void fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(['SET', UPSTASH_STORE_KEY, serialized]),
  }).catch((err) => {
    console.warn('[Novesta Storage] Upstash sync failed:', err);
  });
}

function saveStore(store: SubmissionsStore): void {
  const serialized = JSON.stringify(store, null, 2);
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = `${SUBMISSIONS_FILE}.tmp`;
    fs.writeFileSync(tmpFile, serialized, 'utf8');
    fs.renameSync(tmpFile, SUBMISSIONS_FILE);
  } catch (err) {
    console.warn('Could not persist submissions store to disk:', err);
  }
  syncStoreToCloud(serialized);
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim() || '';
  const port = Number(process.env.SMTP_PORT?.trim() || '465') || 465;
  const user = process.env.SMTP_USER?.trim() || '';
  const pass = process.env.SMTP_PASS?.trim() || '';
  const secureEnv = process.env.SMTP_SECURE?.trim().toLowerCase();
  const secure = secureEnv ? secureEnv === 'true' || secureEnv === '1' : port === 465;
  const from = process.env.SMTP_FROM?.trim() || '';
  return { host, port, user, pass, secure, from };
}

function isSmtpConfigured(): boolean {
  const smtp = getSmtpConfig();
  return Boolean(smtp.host && smtp.user && smtp.pass);
}

function getEmailTransportMode(): 'smtp' | 'resend' | 'none' {
  if (isSmtpConfigured()) return 'smtp';
  if (process.env.RESEND_API_KEY?.trim()) return 'resend';
  return 'none';
}

interface EmailSendParams {
  to: string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  fromLabel?: string;
}

interface EmailSendResult {
  ok: boolean;
  transport?: 'smtp' | 'resend';
  error?: string;
  status?: number;
  usedFallback?: boolean;
  deliveredTo?: string[];
}

async function sendSmtpEmail(params: EmailSendParams): Promise<EmailSendResult> {
  const smtp = getSmtpConfig();
  if (!smtp.host || !smtp.user || !smtp.pass) {
    return { ok: false, error: 'SMTP credentials not configured' };
  }

  const label = params.fromLabel || 'Novesta';
  const fromAddress = smtp.from || `${label} <${smtp.user}>`;

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    await transporter.sendMail({
      from: fromAddress,
      to: params.to.join(', '),
      ...(params.replyTo ? { replyTo: params.replyTo } : {}),
      subject: params.subject,
      text: params.text,
      ...(params.html ? { html: params.html } : {}),
    });

    return {
      ok: true,
      transport: 'smtp',
      status: 200,
      usedFallback: false,
      deliveredTo: params.to,
    };
  } catch (err) {
    return {
      ok: false,
      transport: 'smtp',
      error: err instanceof Error ? err.message : 'SMTP delivery failed',
    };
  }
}

async function sendResendEmail(params: EmailSendParams): Promise<EmailSendResult> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (!resendApiKey) {
    return { ok: false, error: 'RESEND_API_KEY not configured' };
  }

  const label = params.fromLabel || 'Novesta';
  const fallbackFrom = `${label} <onboarding@resend.dev>`;
  const preferredFrom = process.env.RESEND_FROM_EMAIL?.trim() || fallbackFrom;
  const backupEmail =
    process.env.CONTACT_BACKUP_EMAIL?.trim() || 'novesta111@gmail.com';

  const attemptSend = async (
    fromAddress: string,
    recipients: string[],
    bodyText: string,
    bodyHtml?: string
  ) => {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: recipients,
        ...(params.replyTo ? { reply_to: params.replyTo } : {}),
        subject: params.subject,
        text: bodyText,
        ...(bodyHtml ? { html: bodyHtml } : {}),
      }),
    });
    if (response.ok) {
      return { ok: true, status: response.status };
    }
    const errText = await response.text();
    return { ok: false, status: response.status, error: errText };
  };

  try {
    const first = await attemptSend(preferredFrom, params.to, params.text, params.html);
    if (first.ok) {
      return {
        ok: true,
        transport: 'resend',
        status: first.status,
        usedFallback: preferredFrom === fallbackFrom && Boolean(process.env.RESEND_FROM_EMAIL?.trim()),
        deliveredTo: params.to,
      };
    }

    let latestError = first.error;
    let latestStatus = first.status;

    if (preferredFrom !== fallbackFrom) {
      console.warn(
        'Resend preferred sender failed, retrying via onboarding@resend.dev:',
        first.status,
        first.error
      );
      const retrySender = await attemptSend(fallbackFrom, params.to, params.text, params.html);
      if (retrySender.ok) {
        return {
          ok: true,
          transport: 'resend',
          status: retrySender.status,
          usedFallback: true,
          deliveredTo: params.to,
        };
      }
      latestError = retrySender.error || latestError;
      latestStatus = retrySender.status || latestStatus;
    }

    if (
      latestStatus === 403 ||
      latestStatus === 422 ||
      /testing emails|verify a domain|only send testing/i.test(latestError || '')
    ) {
      const ownerMatch = latestError?.match(/your own email address \(([^)\s]+@[^)\s]+)\)/i);
      const extractedOwnerEmail = ownerMatch?.[1]?.trim();
      const candidates = Array.from(
        new Set(
          [backupEmail, extractedOwnerEmail, 'novesta111@gmail.com'].filter(
            (addr): addr is string => Boolean(addr)
          )
        )
      ).filter(
        (candidate) =>
          !(params.to.length === 1 && params.to[0].toLowerCase() === candidate.toLowerCase())
      );

      for (const fallbackRecipient of candidates) {
        console.warn(
          `Resend sandbox blocked ${params.to.join(', ')}; routing fallback to ${fallbackRecipient}`
        );
        const fallbackText = `[Novesta Fallback Delivery — intended for ${params.to.join(', ')}]\n\n${params.text}`;
        const retryBackup = await attemptSend(fallbackFrom, [fallbackRecipient], fallbackText);
        if (retryBackup.ok) {
          return {
            ok: true,
            transport: 'resend',
            status: retryBackup.status,
            usedFallback: true,
            deliveredTo: [fallbackRecipient],
          };
        }
        latestError = retryBackup.error || latestError;
        latestStatus = retryBackup.status || latestStatus;
      }
    }

    return { ok: false, transport: 'resend', status: latestStatus, error: latestError };
  } catch (err) {
    return { ok: false, transport: 'resend', error: err instanceof Error ? err.message : 'Network error' };
  }
}

async function sendTransactionalEmail(params: EmailSendParams): Promise<EmailSendResult> {
  if (isSmtpConfigured()) {
    const smtpResult = await sendSmtpEmail(params);
    if (smtpResult.ok) {
      return smtpResult;
    }
    console.warn('SMTP failed, checking Resend fallback:', smtpResult.error);
    if (process.env.RESEND_API_KEY?.trim()) {
      const resendResult = await sendResendEmail(params);
      if (resendResult.ok) return resendResult;
      return {
        ok: false,
        transport: 'smtp',
        error: `SMTP: ${smtpResult.error} | Resend: ${resendResult.error}`,
      };
    }
    return smtpResult;
  }

  if (process.env.RESEND_API_KEY?.trim()) {
    return sendResendEmail(params);
  }

  return { ok: false, error: 'No email transport configured (SMTP or RESEND_API_KEY)' };
}

interface ContactPayload {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  businessType?: unknown;
  plan?: unknown;
  message?: unknown;
}

function validateContactPayload(body: ContactPayload): {
  valid: boolean;
  error?: string;
  data?: {
    name: string;
    phone: string;
    email: string;
    businessType: string;
    plan: string;
    message: string;
  };
} {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const businessType =
    typeof body.businessType === 'string' && body.businessType.trim()
      ? body.businessType.trim().slice(0, 80)
      : 'General';
  const plan = typeof body.plan === 'string' ? body.plan.trim().slice(0, 80) : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (name.length < 2 || name.length > 120) {
    return { valid: false, error: 'Please provide your full name (2–120 characters).' };
  }

  if (phone) {
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    if (!/^\+?[0-9]{8,15}$/.test(cleanPhone)) {
      return { valid: false, error: 'Please provide a valid phone or WhatsApp number.' };
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) {
    return { valid: false, error: 'Please provide a valid email address.' };
  }

  if (message.length < 3 || message.length > 2500) {
    return { valid: false, error: 'Please enter a message (3–2500 characters).' };
  }

  return {
    valid: true,
    data: { name, phone, email, businessType, plan, message },
  };
}

const ACTIVE_APP_ROUTES = new Set<string>([
  '/',
  '/upsc-photo-signature-resizer',
  '/ssc-photo-resizer',
  '/ibps-photo-signature-resizer',
  '/passport-photo-maker',
  '/compress-pdf',
  '/merge-pdf',
  '/split-pdf',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/careers',
]);

function shouldRedirectToHome(reqPath: string): boolean {
  const clean = reqPath.replace(/\/+$/, '') || '/';
  if (ACTIVE_APP_ROUTES.has(clean)) return false;
  if (
    reqPath.startsWith('/api/') ||
    reqPath.startsWith('/assets/') ||
    reqPath.startsWith('/@') ||
    reqPath.startsWith('/src/') ||
    reqPath.startsWith('/node_modules/') ||
    reqPath.startsWith('/__')
  ) {
    return false;
  }
  // Do not redirect static file requests with extensions (e.g. /favicon.ico, /ads.txt, /robots.txt)
  if (path.extname(reqPath)) return false;
  return true;
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(express.json({ limit: '128kb' }));

  const resolveBaseUrl = (req: express.Request): string => {
    const envUrl = process.env.APP_URL?.trim();
    if (envUrl && /^https?:\/\//i.test(envUrl) && envUrl !== 'MY_APP_URL') {
      return envUrl.replace(/\/$/, '');
    }
    const proto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim() || req.protocol;
    return `${proto}://${req.get('host')}`;
  };

  const trustedOrigins = new Set(
    [
      'https://novesta.online',
      'https://www.novesta.online',
      process.env.APP_URL?.trim().replace(/\/$/, '') || '',
    ].filter(Boolean)
  );

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (isProduction) {
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    }
    const proto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim() || req.protocol;
    if (isProduction && (proto === 'https' || req.secure)) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    const origin = req.headers.origin;
    if (
      origin &&
      (trustedOrigins.has(origin) ||
        /^https:\/\/[a-z0-9-]+\.onrender\.com$/i.test(origin) ||
        !isProduction)
    ) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
      if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
      }
    }
    next();
  });

  const store = loadStore();
  await hydrateStoreFromCloud(store);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    const mailTransport = getEmailTransportMode();
    const environment = process.env.NODE_ENV?.trim() || 'development';
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      status: 'ok',
      service: 'novesta-web',
      environment,
      mailTransport,
      storageBackend: isUpstashConfigured() ? 'upstash-redis' : 'local-disk',
      totalAcceptedRequests: store.contacts.length + store.applications.length,
    });
  });

  // Live open roles + real-time application counts for /careers
  app.get('/api/careers/roles', (_req, res) => {
    const countsByRole = store.applications.reduce<Record<string, number>>((acc, item) => {
      acc[item.role] = (acc[item.role] || 0) + 1;
      return acc;
    }, {});

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      roles: store.roles.map((role) => ({
        ...role,
        applicantCount: countsByRole[role.title] || 0,
      })),
      totalApplications: store.applications.length,
    });
  });

  // Serve /favicon.ico cleanly
  app.get('/favicon.ico', (_req, res) => {
    const publicIcon = path.resolve(__dirname, 'public/assets/novesta-mark-96.png');
    const distIcon = path.resolve(__dirname, 'dist/assets/novesta-mark-96.png');
    const target = fs.existsSync(distIcon) ? distIcon : publicIcon;
    if (fs.existsSync(target)) {
      res.setHeader('Cache-Control', 'public, max-age=604800');
      res.sendFile(target);
      return;
    }
    res.status(204).end();
  });

  // Google Search Console HTML file verification endpoint
  app.get('/google1e529b83336dbecf.html', (_req, res) => {
    res
      .type('text/html; charset=utf-8')
      .send('google-site-verification: google1e529b83336dbecf.html');
  });

  // ads.txt placeholder until AdSense / publisher approval
  app.get('/ads.txt', (_req, res) => {
    res
      .type('text/plain; charset=utf-8')
      .setHeader('Cache-Control', 'public, max-age=3600')
      .send(
        '# PDFIndia ads.txt placeholder\n# Add your verified publisher line only after site approval.\n'
      );
  });

  // Dynamic robots.txt
  app.get('/robots.txt', (req, res) => {
    const baseUrl = resolveBaseUrl(req);
    res
      .type('text/plain; charset=utf-8')
      .setHeader('Cache-Control', 'public, max-age=3600')
      .send(`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${baseUrl}/sitemap.xml\n`);
  });

  // Dynamic sitemap.xml listing all active PDFIndia routes + /careers
  app.get('/sitemap.xml', (req, res) => {
    const baseUrl = resolveBaseUrl(req);
    const today = new Date().toISOString().split('T')[0];
    const routes = [
      { path: '/', changefreq: 'weekly', priority: '1.0' },
      { path: '/upsc-photo-signature-resizer', changefreq: 'weekly', priority: '0.9' },
      { path: '/ssc-photo-resizer', changefreq: 'weekly', priority: '0.9' },
      { path: '/ibps-photo-signature-resizer', changefreq: 'weekly', priority: '0.9' },
      { path: '/passport-photo-maker', changefreq: 'weekly', priority: '0.9' },
      { path: '/compress-pdf', changefreq: 'weekly', priority: '0.9' },
      { path: '/merge-pdf', changefreq: 'weekly', priority: '0.9' },
      { path: '/split-pdf', changefreq: 'weekly', priority: '0.9' },
      { path: '/about', changefreq: 'monthly', priority: '0.6' },
      { path: '/contact', changefreq: 'monthly', priority: '0.6' },
      { path: '/privacy', changefreq: 'monthly', priority: '0.5' },
      { path: '/terms', changefreq: 'monthly', priority: '0.5' },
      { path: '/careers', changefreq: 'weekly', priority: '0.7' },
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${baseUrl}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;
    res
      .type('application/xml; charset=utf-8')
      .setHeader('Cache-Control', 'public, max-age=3600')
      .send(xml);
  });

  /**
   * Contact Endpoint (SMTP with Resend fallback)
   */
  app.post('/api/contact', async (req, res) => {
    const validation = validateContactPayload(req.body || {});
    if (!validation.valid || !validation.data) {
      res.status(400).json({ error: validation.error || 'Invalid form submission.' });
      return;
    }

    const { name, phone, email, businessType, plan, message } = validation.data;
    const record: ContactRecord = {
      id: `NOV-CON-${Date.now().toString(36).toUpperCase()}`,
      name,
      phone,
      email,
      businessType,
      plan: plan || 'Not specified',
      message,
      status: 'Accepted',
      submittedAt: new Date().toISOString(),
    };

    store.contacts.unshift(record);
    if (store.contacts.length > 200) store.contacts.length = 200;
    saveStore(store);

    const emailResult = await sendTransactionalEmail({
      to: getBusinessAlertRecipients(),
      replyTo: email,
      fromLabel: 'Novesta Website',
      subject: `[Novesta Contact ${record.id}] ${name}`,
      text: [
        `New inquiry from Novesta website`,
        `Reference ID: ${record.id}`,
        ``,
        `Name: ${name}`,
        ...(phone ? [`Phone / WhatsApp: ${phone}`] : []),
        `Email: ${email}`,
        ...(businessType ? [`Category: ${businessType}`] : []),
        ...(plan ? [`Reference: ${plan}`] : []),
        ``,
        `Message:`,
        message,
      ].join('\n'),
    });
    const delivered = emailResult.ok;
    if (!delivered && emailResult.error && !emailResult.error.includes('No email transport')) {
      console.error('Contact email error:', emailResult.error);
    }

    console.info('[Novesta Contact Accepted]', {
      id: record.id,
      name,
      delivered,
    });

    res.status(200).json({
      ok: true,
      delivered,
      request: {
        id: record.id,
        name: record.name,
        businessType: record.businessType,
        plan: record.plan,
        status: record.status,
        submittedAt: record.submittedAt,
      },
      message: delivered
        ? `Request ${record.id} accepted and sent to our team. Expect a reply within 1 business day.`
        : `Request ${record.id} accepted and queued.`,
    });
  });

  /**
   * Real-time Careers Application Endpoint
   */
  app.post('/api/careers/apply', async (req, res) => {
    const body = req.body || {};
    const role = typeof body.role === 'string' ? body.role.trim() : '';
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const answer1 = typeof body.answer1 === 'string' ? body.answer1.trim() : '';
    const answer2 = typeof body.answer2 === 'string' ? body.answer2.trim() : '';
    const answer3 = typeof body.answer3 === 'string' ? body.answer3.trim() : '';
    const confirmed = Boolean(body.confirmed);

    if (role.length < 2 || role.length > 100) {
      res.status(400).json({ error: 'Please enter or choose a role (2–100 characters).' });
      return;
    }
    if (fullName.length < 2 || fullName.length > 120) {
      res.status(400).json({ error: 'Please enter your full name (2–120 characters).' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (
      answer1.length < 2 ||
      answer2.length < 2 ||
      answer3.length < 2 ||
      answer1.length > 3000 ||
      answer2.length > 3000 ||
      answer3.length > 3000
    ) {
      res.status(400).json({
        error: 'Please answer all three questions (at least 2 characters each).',
      });
      return;
    }
    if (!confirmed) {
      res.status(400).json({ error: 'Please confirm you read the expectations above.' });
      return;
    }

    const record: CareerApplicationRecord = {
      id: `NOV-APP-${Date.now().toString(36).toUpperCase()}`,
      role,
      fullName,
      email,
      answer1,
      answer2,
      answer3,
      status: 'Accepted',
      submittedAt: new Date().toISOString(),
    };

    store.applications.unshift(record);
    if (store.applications.length > 200) store.applications.length = 200;
    saveStore(store);

    const emailResult = await sendTransactionalEmail({
      to: getBusinessAlertRecipients(),
      replyTo: email,
      fromLabel: 'Novesta Careers',
      subject: `[Novesta Career Application ${record.id}] ${role} — ${fullName}`,
      text: [
        `New Careers Application`,
        `Reference ID: ${record.id}`,
        ``,
        `Role: ${role}`,
        `Full Name: ${fullName}`,
        `Email: ${email}`,
        ``,
        `01. Work sample / project:`,
        answer1,
        ``,
        `02. Hard problem solved from scratch:`,
        answer2,
        ``,
        `03. Conversion fixes:`,
        answer3,
      ].join('\n'),
    });
    const delivered = emailResult.ok;
    if (!delivered && emailResult.error && !emailResult.error.includes('No email transport')) {
      console.error('Career email error:', emailResult.error);
    }

    const roleCount = store.applications.filter((a) => a.role === role).length;
    console.info('[Novesta Career Application Accepted]', {
      id: record.id,
      role,
      fullName,
      delivered,
    });

    res.status(200).json({
      ok: true,
      delivered,
      application: {
        id: record.id,
        role: record.role,
        fullName: record.fullName,
        status: record.status,
        submittedAt: record.submittedAt,
      },
      roleApplicantCount: roleCount,
      message: delivered
        ? `Application ${record.id} accepted and sent to our team.`
        : `Application ${record.id} accepted! You can also share your reference ID directly on WhatsApp.`,
    });
  });

  // Return 404 JSON for any unknown /api/* route
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  // 301 Permanent Redirects for removed legacy routes to "/"
  app.get(['/admin', '/admin/*'], (_req, res) => {
    res.redirect(301, '/');
  });

  app.get('*', (req, res, next) => {
    if (shouldRedirectToHome(req.path)) {
      res.redirect(301, '/');
      return;
    }
    next();
  });

  if (!isProduction) {
    const publicAssetsPath = path.resolve(__dirname, 'public/assets');
    if (fs.existsSync(publicAssetsPath)) {
      app.use(
        '/assets',
        express.static(publicAssetsPath, {
          maxAge: '1d',
        })
      );
    }
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Zero-dependency Brotli / Gzip compression for static text assets in production
    app.use((req, res, next) => {
      const acceptEncoding = String(req.headers['accept-encoding'] || '');
      const encoding = acceptEncoding.includes('br')
        ? 'br'
        : acceptEncoding.includes('gzip')
          ? 'gzip'
          : null;
      if (!encoding) {
        next();
        return;
      }

      const originalEnd = res.end.bind(res);
      const originalWrite = res.write.bind(res);
      const chunks: Buffer[] = [];
      let decided = false;
      let shouldCompress = false;

      const decideCompression = () => {
        if (decided) return shouldCompress;
        decided = true;
        if (res.getHeader('Content-Encoding')) {
          shouldCompress = false;
          return false;
        }
        const contentType = String(res.getHeader('Content-Type') || '');
        const isCompressibleType =
          /^(text\/|application\/(javascript|json|xml|ld\+json)|image\/svg\+xml)/i.test(
            contentType
          );
        shouldCompress = isCompressibleType && req.method !== 'HEAD';
        return shouldCompress;
      };

      res.write = ((
        chunk: unknown,
        encodingArg?: BufferEncoding | ((error: Error | null | undefined) => void),
        cb?: (error: Error | null | undefined) => void
      ) => {
        if (!decideCompression()) {
          return originalWrite(chunk as never, encodingArg as never, cb as never);
        }
        if (chunk) {
          chunks.push(
            Buffer.isBuffer(chunk)
              ? chunk
              : Buffer.from(
                  String(chunk),
                  typeof encodingArg === 'string' ? encodingArg : 'utf8'
                )
          );
        }
        if (typeof encodingArg === 'function') encodingArg(null);
        else if (typeof cb === 'function') cb(null);
        return true;
      }) as typeof res.write;

      res.end = ((chunk?: unknown, encodingArg?: BufferEncoding | (() => void), cb?: () => void) => {
        if (!decideCompression()) {
          return originalEnd(chunk as never, encodingArg as never, cb as never);
        }
        if (chunk && typeof chunk !== 'function') {
          chunks.push(
            Buffer.isBuffer(chunk)
              ? chunk
              : Buffer.from(
                  String(chunk),
                  typeof encodingArg === 'string' ? encodingArg : 'utf8'
                )
          );
        }
        const combined = Buffer.concat(chunks);
        if (combined.length < 1024) {
          return originalEnd(combined, cb as never);
        }

        res.removeHeader('Content-Length');
        res.setHeader('Vary', 'Accept-Encoding');
        res.setHeader('Content-Encoding', encoding);

        const compressed =
          encoding === 'br'
            ? zlib.brotliCompressSync(combined, {
                params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 },
              })
            : zlib.gzipSync(combined, { level: 6 });
        return originalEnd(compressed, cb as never);
      }) as typeof res.end;

      next();
    });

    const distPath = path.resolve(__dirname, 'dist');
    const assetsPath = path.join(distPath, 'assets');
    if (fs.existsSync(assetsPath)) {
      app.use(
        '/assets',
        express.static(assetsPath, {
          maxAge: '1y',
          immutable: true,
        })
      );
    }

    app.use(express.static(distPath, { index: false, maxAge: '7d' }));

    const indexPath = path.join(distPath, 'index.html');
    const cachedTemplate = fs.existsSync(indexPath)
      ? fs.readFileSync(indexPath, 'utf8')
      : null;

    const ROUTE_SEO: Record<string, { title: string; description: string }> = {
      '/': {
        title: 'PDFIndia — Free Exam Photo, Signature & PDF Tools for India',
        description:
          '100% private, browser-based document prep for Indian exams and portals. Resize UPSC, SSC & IBPS photos, make 35x45mm passport sheets, and compress, merge, or split PDFs locally.',
      },
      '/upsc-photo-signature-resizer': {
        title: 'UPSC Photo & Signature Resizer (20KB–300KB, 350–1000 px) — PDFIndia',
        description:
          'Resize UPSC CSE, NDA, CDS & OTR photos and signatures to 350–1000 px and 20–300 KB JPG locally in your browser.',
      },
      '/ssc-photo-resizer': {
        title: 'SSC Photo & Signature Resizer (20KB–50KB & 10KB–20KB) — PDFIndia',
        description:
          'Resize SSC CGL, CHSL, GD & MTS photos (3.5×4.5 cm, 20–50 KB) and signatures (4.0×2.0 cm, 10–20 KB) locally in your browser.',
      },
      '/ibps-photo-signature-resizer': {
        title: 'IBPS & SBI Photo & Signature Resizer (200×230 px, 140×60 px) — PDFIndia',
        description:
          'Resize IBPS PO, Clerk, RRB & SBI photos (200×230 px) and signatures (140×60 px) privately in your browser.',
      },
      '/passport-photo-maker': {
        title: 'Indian Passport Photo Maker (35×45 mm) & 8-Copy Print Sheet — PDFIndia',
        description:
          'Create 35×45 mm (413×531 px, 300 DPI) passport photos with optional Name & Date strip plus 8-copy A4 or 6×4 printable sheets locally.',
      },
      '/compress-pdf': {
        title: 'Compress PDF Under 200KB, 500KB, 1MB or 2MB Online (Local) — PDFIndia',
        description:
          'Reduce PDF size to under 2MB, 1MB, 500KB, or 200KB for Indian government & exam portals 100% locally in your browser.',
      },
      '/merge-pdf': {
        title: 'Merge PDF & Images to A4 PDF Online (Optional 2MB Cap) — PDFIndia',
        description:
          'Combine PDFs, JPGs, and PNGs into one A4 PDF with drag reorder, 90° rotation, and optional 2MB cap locally.',
      },
      '/split-pdf': {
        title: 'Split PDF & Extract Pages Locally (1, 3-5 Ranges) — PDFIndia',
        description:
          'Extract exact PDF pages or ranges with visual thumbnails and lossless text quality locally in your browser.',
      },
      '/about': {
        title: 'About PDFIndia — A Novesta product',
        description:
          'Learn how PDFIndia prepares Indian exam photos, signatures, and PDFs 100% locally in your browser with zero uploads.',
      },
      '/contact': {
        title: 'Contact PDFIndia — Support & Exam Preset Updates',
        description:
          'Contact PDFIndia for exam preset updates, bug reports, or DPDP privacy requests.',
      },
      '/privacy': {
        title: 'Privacy Policy (DPDP Act) — PDFIndia',
        description:
          '100% local browser processing with zero file uploads, contact delivery, advertising cookie consent, and India DPDP Act rights.',
      },
      '/terms': {
        title: 'Terms of Use — PDFIndia',
        description:
          'Terms of use for PDFIndia. Independent product by Novesta, not affiliated with UPSC, SSC, IBPS, or any government body.',
      },
      '/careers': {
        title: 'Careers at Novesta',
        description: 'Open roles and applications at Novesta.',
      },
    };

    app.get(Array.from(ACTIVE_APP_ROUTES), (req, res) => {
      if (!cachedTemplate) {
        res.status(404).send('Build output not found. Run npm run build first.');
        return;
      }

      const baseUrl = resolveBaseUrl(req);
      const normalizedPath = req.path.replace(/\/+$/, '') || '/';
      const routeMeta = ROUTE_SEO[normalizedPath] || ROUTE_SEO['/'];
      const canonicalUrl = `${baseUrl}${normalizedPath === '/' ? '/' : normalizedPath}`;
      const gscToken =
        process.env.VITE_GSC_VERIFICATION || process.env.GSC_VERIFICATION || '';

      let html = cachedTemplate
        .replace(/<title>.*?<\/title>/, `<title>${routeMeta.title}</title>`)
        .replace(
          /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
          `<meta name="description" content="${routeMeta.description}" />`
        )
        .replace(
          /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
          `<link rel="canonical" href="${canonicalUrl}" />`
        )
        .replace(
          /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
          `<meta property="og:url" content="${canonicalUrl}" />`
        )
        .replace(
          /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
          `<meta property="og:title" content="${routeMeta.title}" />`
        )
        .replace(
          /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
          `<meta property="og:description" content="${routeMeta.description}" />`
        )
        .replace(
          /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
          `<meta name="twitter:title" content="${routeMeta.title}" />`
        )
        .replace(
          /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
          `<meta name="twitter:description" content="${routeMeta.description}" />`
        )
        .replace(/https:\/\/novesta\.(?:online|in)/g, baseUrl);

      if (gscToken && !gscToken.startsWith('REPLACE_')) {
        html = html.replace(
          '</head>',
          `  <meta name="google-site-verification" content="${gscToken}" />\n  </head>`
        );
      }

      res
        .status(200)
        .type('text/html; charset=utf-8')
        .setHeader('Cache-Control', 'no-cache')
        .setHeader('X-Robots-Tag', 'index, follow')
        .send(html);
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Novesta server listening on http://localhost:${PORT}`);
  });

  const shutdown = (signal: string) => {
    console.info(`Received ${signal}; shutting down Novesta server gracefully...`);
    server.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('Failed to start Novesta server:', err);
  process.exit(1);
});
