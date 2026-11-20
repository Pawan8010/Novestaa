import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import crypto from 'node:crypto';
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
const AUTH_SECRET_FILE = path.join(DATA_DIR, 'auth-secret.txt');

const DEFAULT_FOUNDER_EMAILS = [
  'rajputpawan9765@gmail.com',
  'hello@novesta.online',
  'novesta111@gmail.com',
  'rajputpavan168@gmail.com',
  'rajputpawan168@gmail.com',
];

function getAllowedFounderEmails(): string[] {
  const custom = process.env.FOUNDER_EMAILS?.split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (custom && custom.length > 0) {
    return Array.from(new Set([...custom, 'rajputpawan9765@gmail.com']));
  }
  return DEFAULT_FOUNDER_EMAILS;
}

function getBusinessAlertRecipients(): string[] {
  const primary = process.env.CONTACT_TO_EMAIL?.trim() || 'hello@novesta.online';
  const backup = process.env.FOUNDER_BACKUP_EMAIL?.trim() || '';
  return Array.from(
    new Set(
      [primary, backup]
        .map((e) => e.trim())
        .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    )
  );
}

function getSessionSecret(): string {
  if (process.env.SESSION_SECRET?.trim()) {
    return process.env.SESSION_SECRET.trim();
  }
  try {
    if (fs.existsSync(AUTH_SECRET_FILE)) {
      const existing = fs.readFileSync(AUTH_SECRET_FILE, 'utf8').trim();
      if (existing.length >= 32) return existing;
    }
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(AUTH_SECRET_FILE, generated, 'utf8');
    return generated;
  } catch {
    return crypto.randomBytes(32).toString('hex');
  }
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

interface FeedbackEntry {
  id: string;
  name: string;
  business: string;
  rating: number;
  comment: string;
  createdAt: string;
  isSample?: boolean;
}

interface PaymentRecord {
  id: string;
  orderId: string;
  paymentId?: string;
  planId: string;
  planName: string;
  billing?: string;
  services?: string[];
  amountInr: number;
  amountPaise: number;
  currency: 'INR';
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  businessName: string;
  status: 'Created' | 'Paid (Verified)' | 'Captured (Webhook)' | 'Failed';
  webhookVerified?: boolean;
  webhookEvent?: string;
  customerEmailSent?: boolean;
  adminEmailSent?: boolean;
  confirmationEmailsSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface SubmissionsStore {
  contacts: ContactRecord[];
  applications: CareerApplicationRecord[];
  roles: CareerRoleRecord[];
  payments: PaymentRecord[];
  feedbacks: FeedbackEntry[];
}

const AUTHORITATIVE_PLANS: Record<
  string,
  { id: string; name: string; billing: string; amountInr: number; features: string[] }
> = {
  'large-business-all-services': {
    id: 'large-business-all-services',
    name: 'Large Business · All Services',
    billing: 'for 2 years',
    amountInr: 30000,
    features: [
      'Website & custom web app built free',
      'Full SEO, Google ranking & Google Maps dominance',
      'Social media marketing (Instagram, Facebook, X)',
      'Zomato, Swiggy, Booking.com, MakeMyTrip, JustDial sync',
      'AI chatbot, WhatsApp automation & analytics dashboard',
      'Dedicated 2-year support & business scaling',
    ],
  },
  'medium-business-full-growth': {
    id: 'medium-business-full-growth',
    name: 'Medium Business · All Services & CRM',
    billing: 'for 2 years',
    amountInr: 17000,
    features: [
      'Website + direct ordering or booking product included',
      'Customer management & automated WhatsApp follow-ups',
      'SEO, Google Maps & Business Profile optimization',
      'Social media growth & local directory alignment',
      '2-year complete business & customer operations support',
    ],
  },
  'small-business-service-2yr': {
    id: 'small-business-service-2yr',
    name: 'Small Business · Services & Support',
    billing: 'for 2 years',
    amountInr: 7000,
    features: [
      'Fast mobile-first business website included',
      'Google Maps & Business Profile setup',
      'Essential local SEO & WhatsApp inquiry capture',
      '2-year priority technical support & content updates',
    ],
  },
  'medium-business-website': {
    id: 'medium-business-website',
    name: 'Medium Business · Website Only',
    billing: 'one-time',
    amountInr: 10000,
    features: [
      'Multi-page mobile-first responsive architecture',
      'Product catalog, menu, or booking inquiry flow',
      'Technical SEO, Schema markup & Google Map embed',
    ],
  },
  'small-business-website': {
    id: 'small-business-website',
    name: 'Small Business · Website Only',
    billing: 'one-time',
    amountInr: 5000,
    features: [
      'Clean mobile-first responsive business website',
      'SEO-ready setup & fast page loading',
      'Contact form, WhatsApp button & Google Map',
    ],
  },
};

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
        payments: Array.isArray(parsed.payments) ? parsed.payments : [],
        feedbacks: Array.isArray(parsed.feedbacks) ? parsed.feedbacks : [],
      };
    }
  } catch (err) {
    console.warn('Could not load submissions store:', err);
  }
  return {
    contacts: [],
    applications: [],
    roles: [...DEFAULT_CAREER_ROLES],
    payments: [],
    feedbacks: [],
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
    if (Array.isArray(parsed.payments)) store.payments = parsed.payments;
    if (Array.isArray(parsed.feedbacks)) store.feedbacks = parsed.feedbacks;
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

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
    return { ok: false, error: 'Hostinger SMTP credentials not configured' };
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
    process.env.FOUNDER_BACKUP_EMAIL?.trim() || 'novesta111@gmail.com';

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
    console.warn('Hostinger SMTP failed, checking Resend fallback:', smtpResult.error);
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

function buildPaymentHtml(params: {
  eyebrow: string;
  headline: string;
  intro: string;
  servicesHeading: string;
  services: string[];
  metaRows: Array<[string, string]>;
  footerNote: string;
}): string {
  const rowsHtml = params.metaRows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #e6e7ea;color:#5a606d;font-size:13px;">${escapeHtml(label)}</td><td style="padding:8px 0;border-bottom:1px solid #e6e7ea;color:#111317;font-size:13px;font-weight:600;text-align:right;">${escapeHtml(value)}</td></tr>`
    )
    .join('');

  const servicesHtml = params.services
    .map(
      (svc) =>
        `<li style="margin:6px 0;color:#111317;font-size:14px;line-height:1.5;">&#10003;&nbsp; ${escapeHtml(svc)}</li>`
    )
    .join('');

  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f5f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111317;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e4e9;border-radius:14px;overflow:hidden;">
      <div style="background:#111317;color:#ffffff;padding:24px 28px;">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#a0a5b1;">${escapeHtml(params.eyebrow)}</p>
        <h1 style="margin:0;font-size:22px;font-weight:600;">${escapeHtml(params.headline)}</h1>
      </div>
      <div style="padding:24px 28px;">
        <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#323640;">${escapeHtml(params.intro)}</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:22px;">${rowsHtml}</table>
        <div style="background:#f8f9fb;border:1px solid #e2e4e9;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
          <p style="margin:0 0 10px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#5a606d;">${escapeHtml(params.servicesHeading)}</p>
          <ul style="margin:0;padding:0;list-style:none;">${servicesHtml}</ul>
        </div>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#5a606d;">${escapeHtml(params.footerNote)}</p>
      </div>
    </div>
  </body>
</html>`;
}

const paymentEmailLocks = new Set<string>();

async function sendPaymentConfirmationEmails(
  record: PaymentRecord,
  store: SubmissionsStore
): Promise<{ alreadySent?: boolean; customerEmailSent: boolean; adminEmailSent: boolean }> {
  if (record.confirmationEmailsSentAt || paymentEmailLocks.has(record.orderId)) {
    return {
      alreadySent: true,
      customerEmailSent: Boolean(record.customerEmailSent),
      adminEmailSent: Boolean(record.adminEmailSent),
    };
  }
  paymentEmailLocks.add(record.orderId);
  try {

  const planInfo = AUTHORITATIVE_PLANS[record.planId];
  const billing = record.billing || planInfo?.billing || 'standard plan';
  const services =
    record.services && record.services.length > 0
      ? record.services
      : planInfo?.features || [
          'Dedicated Novesta digital growth onboarding & setup',
          'Direct WhatsApp & priority support',
        ];
  record.billing = billing;
  record.services = services;

  const businessEmail = process.env.CONTACT_TO_EMAIL?.trim() || 'hello@novesta.online';
  const amountText = `₹${record.amountInr.toLocaleString('en-IN')}`;
  const serviceBulletLines = services.map((s) => `  • ${s}`).join('\n');

  let customerEmailSent = false;
  if (record.customerEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.customerEmail)) {
    const customerText = [
      `Hi ${record.customerName},`,
      ``,
      `Thank you for your payment! Your order with Novesta is confirmed.`,
      ``,
      `PAYMENT SUMMARY`,
      `  Receipt ID: ${record.id}`,
      `  Plan: ${record.planName} (${billing})`,
      `  Amount Paid: ${amountText} INR`,
      `  Order ID: ${record.orderId}`,
      ...(record.paymentId ? [`  Payment ID: ${record.paymentId}`] : []),
      `  Business: ${record.businessName}`,
      ``,
      `SERVICES YOU WILL RECEIVE`,
      serviceBulletLines,
      ``,
      `NEXT STEPS`,
      `Our onboarding team will contact you on WhatsApp (${record.customerPhone}) and email within 1 business day to collect your brand details and begin setup.`,
      ``,
      `Questions anytime? Reply directly to this email (${businessEmail}) or message +91 8010927311.`,
      ``,
      `— Team Novesta (novesta.online)`,
    ].join('\n');

    const customerHtml = buildPaymentHtml({
      eyebrow: 'NOVESTA PAYMENT RECEIPT',
      headline: `Payment Confirmed — ${amountText}`,
      intro: `Hi ${record.customerName}, thank you for choosing Novesta. Your payment has been verified and onboarding for ${record.businessName} starts right away.`,
      servicesHeading: 'Services You Will Receive',
      services,
      metaRows: [
        ['Receipt ID', record.id],
        ['Plan Purchased', `${record.planName} (${billing})`],
        ['Amount Paid', `${amountText} INR`],
        ['Razorpay Order ID', record.orderId],
        ...(record.paymentId ? ([['Razorpay Payment ID', record.paymentId]] as [string, string][]) : []),
        ['Registered Phone', record.customerPhone || 'Not provided'],
      ],
      footerNote: `Need immediate assistance? Reply to ${businessEmail} or WhatsApp +91 8010927311 with Receipt ${record.id}.`,
    });

    const customerRes = await sendTransactionalEmail({
      to: [record.customerEmail],
      replyTo: businessEmail,
      fromLabel: 'Novesta Billing',
      subject: `[Novesta] Payment Confirmed — ${record.planName} (Receipt ${record.id})`,
      text: customerText,
      html: customerHtml,
    });
    customerEmailSent = customerRes.ok;
    if (!customerRes.ok) {
      console.warn('Could not email customer payment confirmation:', customerRes.error);
    }
  }

  const adminText = [
    `New Razorpay Payment Confirmed on Novesta`,
    ``,
    `CUSTOMER DETAILS`,
    `  Name: ${record.customerName}`,
    `  Business: ${record.businessName}`,
    `  Email: ${record.customerEmail || 'Not provided'}`,
    `  Phone / WhatsApp: ${record.customerPhone || 'Not provided'}`,
    ``,
    `PAYMENT DETAILS`,
    `  Receipt ID: ${record.id}`,
    `  Plan: ${record.planName} (${billing})`,
    `  Amount Paid: ${amountText} INR`,
    `  Order ID: ${record.orderId}`,
    ...(record.paymentId ? [`  Payment ID: ${record.paymentId}`] : []),
    `  Status: ${record.status}`,
    `  Customer Email Sent: ${customerEmailSent ? 'Yes' : 'No (check SMTP/Resend logs)'}`,
    ``,
    `SERVICES INCLUDED TO DELIVER`,
    serviceBulletLines,
  ].join('\n');

  const adminHtml = buildPaymentHtml({
    eyebrow: 'NOVESTA REVENUE ALERT',
    headline: `Received ${amountText} — ${record.customerName}`,
    intro: `${record.customerName} (${record.businessName}) completed online payment for ${record.planName}. Deliver the onboarding & service checklist below:`,
    servicesHeading: 'Services To Deliver For This Plan',
    services,
    metaRows: [
      ['Customer', `${record.customerName} (${record.businessName})`],
      ['Customer Email', record.customerEmail || 'Not provided'],
      ['Phone / WhatsApp', record.customerPhone || 'Not provided'],
      ['Receipt ID', record.id],
      ['Plan & Billing', `${record.planName} (${billing})`],
      ['Amount Paid', `${amountText} INR`],
      ['Order ID', record.orderId],
      ...(record.paymentId ? ([['Payment ID', record.paymentId]] as [string, string][]) : []),
      ['Customer Confirmation Sent', customerEmailSent ? 'Yes' : 'Not sent / fallback'],
    ],
    footerNote: `Reply directly to this email to message ${record.customerEmail || 'the customer'}.`,
  });

  const adminRes = await sendTransactionalEmail({
    to: getBusinessAlertRecipients(),
    replyTo: record.customerEmail || undefined,
    fromLabel: 'Novesta Payments',
    subject: `[Novesta Payment Received] ${amountText} — ${record.planName} (${record.customerName})`,
    text: adminText,
    html: adminHtml,
  });
  const adminEmailSent = adminRes.ok;
  if (!adminRes.ok) {
    console.warn('Could not email Novesta payment notification:', adminRes.error);
  }

  record.customerEmailSent = customerEmailSent;
  record.adminEmailSent = adminEmailSent;
  if (customerEmailSent || adminEmailSent) {
    record.confirmationEmailsSentAt = new Date().toISOString();
  }
  saveStore(store);

  return { customerEmailSent, adminEmailSent };
  } finally {
    paymentEmailLocks.delete(record.orderId);
  }
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
    typeof body.businessType === 'string' ? body.businessType.trim() : '';
  const plan = typeof body.plan === 'string' ? body.plan.trim().slice(0, 80) : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (name.length < 2 || name.length > 120) {
    return { valid: false, error: 'Please provide your full name (2–120 characters).' };
  }

  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  if (!/^\+?[0-9]{8,15}$/.test(cleanPhone)) {
    return { valid: false, error: 'Please provide a valid phone or WhatsApp number.' };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) {
    return { valid: false, error: 'Please provide a valid email address.' };
  }

  if (!businessType || businessType.length > 80) {
    return { valid: false, error: 'Please select a business type.' };
  }

  if (message.length < 3 || message.length > 2500) {
    return { valid: false, error: 'Please enter a message (3–2500 characters).' };
  }

  return {
    valid: true,
    data: { name, phone, email, businessType, plan, message },
  };
}

const FOUNDER_COOKIE_NAME = 'novesta_founder_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    try {
      result[key] = decodeURIComponent(val);
    } catch {
      result[key] = val;
    }
  }
  return result;
}

function signSessionToken(email: string, secret: string): string {
  const payload = Buffer.from(
    JSON.stringify({ email, exp: Date.now() + SESSION_TTL_MS }),
    'utf8'
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifySessionToken(
  token: string | undefined,
  secret: string
): { valid: boolean; email?: string } {
  if (!token) return { valid: false };
  const parts = token.split('.');
  if (parts.length !== 2) return { valid: false };
  const [payload, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return { valid: false };
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof parsed.email !== 'string' || typeof parsed.exp !== 'number') {
      return { valid: false };
    }
    if (Date.now() > parsed.exp) {
      return { valid: false };
    }
    return { valid: true, email: parsed.email };
  } catch {
    return { valid: false };
  }
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(
    express.json({
      limit: '128kb',
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
      },
    })
  );

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
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Razorpay-Signature');
      if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
      }
    }
    next();
  });

  const getRazorpayMode = (): 'live' | 'test' | 'unconfigured' => {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim() || '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || '';
    if (!keyId || !keySecret) return 'unconfigured';
    if (keyId.startsWith('rzp_live_')) return 'live';
    return 'test';
  };

  const getProductionReadiness = (baseUrl: string) => {
    const razorpayMode = getRazorpayMode();
    const smtpActive = isSmtpConfigured();
    const resendActive = Boolean(process.env.RESEND_API_KEY?.trim());
    const webhookSecretConfigured = Boolean(process.env.RAZORPAY_WEBHOOK_SECRET?.trim());
    const founderPasskeyConfigured = Boolean(process.env.FOUNDER_ADMIN_KEY?.trim());
    const sessionSecretExplicit = Boolean(
      process.env.SESSION_SECRET?.trim() && process.env.SESSION_SECRET.trim().length >= 32
    );
    const mapsKeyConfigured = Boolean(
      process.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || process.env.GOOGLE_MAPS_API_KEY?.trim()
    );
    const distBuilt = fs.existsSync(path.resolve(__dirname, 'dist', 'index.html'));
    const appUrlIsHttps = /^https:\/\//i.test(baseUrl);

    return {
      nodeEnv: process.env.NODE_ENV?.trim() || 'development',
      appUrl: baseUrl,
      appUrlIsHttps,
      smtpConfigured: smtpActive,
      resendConfigured: resendActive,
      emailTransport: getEmailTransportMode(),
      razorpayMode,
      razorpayWebhookSecretConfigured: webhookSecretConfigured,
      founderPasskeyConfigured,
      sessionSecretExplicit,
      mapsKeyConfigured,
      distBuilt,
      readyForLiveTraffic: Boolean(
        smtpActive &&
          razorpayMode === 'live' &&
          webhookSecretConfigured &&
          founderPasskeyConfigured &&
          appUrlIsHttps
      ),
    };
  };

  const store = loadStore();
  await hydrateStoreFromCloud(store);
  const sessionSecret = getSessionSecret();
  const otpChallenges = new Map<
    string,
    { codeHash: string; expiresAt: number; attempts: number }
  >();

  const getAuthenticatedFounder = (req: express.Request): string | null => {
    const authHeader = req.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const bearerToken = authHeader.slice(7).trim();
      const verifiedBearer = verifySessionToken(bearerToken, sessionSecret);
      if (verifiedBearer.valid && verifiedBearer.email) {
        return verifiedBearer.email;
      }
    }
    const cookies = parseCookies(req.headers.cookie);
    const verified = verifySessionToken(cookies[FOUNDER_COOKIE_NAME], sessionSecret);
    return verified.valid && verified.email ? verified.email : null;
  };

  const setFounderSessionCookie = (
    req: express.Request,
    res: express.Response,
    email: string
  ): string => {
    const token = signSessionToken(email, sessionSecret);
    const proto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim() || req.protocol;
    const isHttps = proto === 'https' || req.secure;
    const cookieParts = [
      `${FOUNDER_COOKIE_NAME}=${encodeURIComponent(token)}`,
      'Path=/',
      `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
      'HttpOnly',
      isHttps ? 'SameSite=None' : 'SameSite=Lax',
    ];
    if (isHttps) {
      cookieParts.push('Secure');
    }
    res.setHeader('Set-Cookie', cookieParts.join('; '));
    return token;
  };

  // Health check endpoint (Render & production monitoring)
  app.get('/api/health', (_req, res) => {
    const mode = getRazorpayMode();
    const mailTransport = getEmailTransportMode();
    const environment = process.env.NODE_ENV?.trim() || 'development';
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      status: 'ok',
      service: 'novesta-web',
      environment,
      env: environment,
      mailTransport,
      emailTransport: mailTransport,
      razorpayConfigured: mode !== 'unconfigured',
      razorpayMode: mode,
      webhookSecretConfigured: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET?.trim()),
      storageBackend: isUpstashConfigured() ? 'upstash-redis' : 'local-disk',
      totalAcceptedRequests: store.contacts.length + store.applications.length,
    });
  });

  // Live open roles + real-time application counts
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

  // Founder Auth & Admin Endpoints (strictly founder-only)
  app.get('/api/admin/session', (req, res) => {
    const founderEmail = getAuthenticatedFounder(req);
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      authenticated: Boolean(founderEmail),
      email: founderEmail || undefined,
      emailOtpEnabled: getEmailTransportMode() !== 'none',
      passkeyEnabled: Boolean(process.env.FOUNDER_ADMIN_KEY?.trim()),
    });
  });

  app.post('/api/admin/logout', (req, res) => {
    const proto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim() || req.protocol;
    const isHttps = proto === 'https' || req.secure;
    const clearParts = [
      `${FOUNDER_COOKIE_NAME}=`,
      'Path=/',
      'Max-Age=0',
      'HttpOnly',
      isHttps ? 'SameSite=None' : 'SameSite=Lax',
    ];
    if (isHttps) clearParts.push('Secure');
    res.setHeader('Set-Cookie', clearParts.join('; '));
    res.json({ ok: true });
  });

  app.post('/api/admin/request-otp', async (req, res) => {
    const rawEmail = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const allowedEmails = getAllowedFounderEmails();
    if (!rawEmail || !allowedEmails.includes(rawEmail)) {
      res.status(403).json({
        error: 'Access restricted: only the Novesta founder email can request an admin code.',
      });
      return;
    }

    if (getEmailTransportMode() === 'none') {
      res.status(503).json({
        error: 'Email verification is unavailable without Hostinger SMTP or RESEND_API_KEY configured.',
      });
      return;
    }

    const code = String(crypto.randomInt(100000, 1000000));
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    otpChallenges.set(rawEmail, {
      codeHash,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    });

    const result = await sendTransactionalEmail({
      to: [rawEmail],
      fromLabel: 'Novesta Security',
      subject: `[Novesta Founder Login] Your verification code: ${code}`,
      text: [
        `Your Novesta Founder Admin verification code is: ${code}`,
        ``,
        `This code expires in 10 minutes. If you did not request this login, you can safely ignore this email.`,
      ].join('\n'),
    });

    if (!result.ok) {
      console.error('OTP delivery error:', result.error);
      res.status(502).json({
        error:
          'Could not deliver verification email to that address right now. Sign in using your Founder Passkey instead.',
      });
      return;
    }

    res.json({
      ok: true,
      message: `Verification code sent to ${rawEmail}. Check your inbox and enter the 6-digit code.`,
    });
  });

  app.post('/api/admin/verify-otp', (req, res) => {
    const rawEmail = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const code = typeof req.body?.code === 'string' ? req.body.code.replace(/\D/g, '') : '';

    const challenge = otpChallenges.get(rawEmail);
    if (!challenge || Date.now() > challenge.expiresAt) {
      otpChallenges.delete(rawEmail);
      res.status(401).json({ error: 'Code expired or invalid. Please request a new code.' });
      return;
    }

    if (challenge.attempts >= 5) {
      otpChallenges.delete(rawEmail);
      res.status(429).json({ error: 'Too many failed attempts. Please request a new code.' });
      return;
    }

    const inputHash = crypto.createHash('sha256').update(code).digest('hex');
    const a = Buffer.from(inputHash);
    const b = Buffer.from(challenge.codeHash);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      challenge.attempts += 1;
      res.status(401).json({ error: 'Incorrect verification code. Please check your email.' });
      return;
    }

    otpChallenges.delete(rawEmail);
    const token = setFounderSessionCookie(req, res, rawEmail);
    res.json({ ok: true, email: rawEmail, token });
  });

  app.post('/api/admin/login-key', (req, res) => {
    const configuredKey = process.env.FOUNDER_ADMIN_KEY?.trim();
    if (!configuredKey) {
      res.status(403).json({
        error: 'Founder passkey login is not configured in environment variables. Use Email Verification Code instead.',
      });
      return;
    }

    const submittedKey = typeof req.body?.passkey === 'string' ? req.body.passkey.trim() : '';
    const expectedBuf = Buffer.from(configuredKey, 'utf8');
    const providedBuf = Buffer.from(submittedKey, 'utf8');
    if (
      providedBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(providedBuf, expectedBuf)
    ) {
      res.status(401).json({ error: 'Invalid founder passkey.' });
      return;
    }

    const primaryEmail = getAllowedFounderEmails()[0] || 'hello@novesta.online';
    const token = setFounderSessionCookie(req, res, primaryEmail);
    res.json({ ok: true, email: primaryEmail, token });
  });

  app.get('/api/admin/submissions', (req, res) => {
    const founderEmail = getAuthenticatedFounder(req);
    if (!founderEmail) {
      res.status(401).json({ error: 'Founder authentication required.' });
      return;
    }

    const baseUrl = resolveBaseUrl(req);
    const resendFromEnv = process.env.RESEND_FROM_EMAIL?.trim() || '';
    const smtp = getSmtpConfig();
    const transportMode = getEmailTransportMode();
    const smtpActive = isSmtpConfigured();

    res.json({
      roles: store.roles,
      applications: store.applications,
      contacts: store.contacts,
      payments: store.payments,
      feedbacks: store.feedbacks,
      razorpaySetup: {
        keyConfigured: Boolean(
          process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim()
        ),
        webhookSecretConfigured: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET?.trim()),
        webhookUrl: `${baseUrl}/api/payments/razorpay/webhook`,
        recommendedEvents: ['payment.captured', 'order.paid', 'payment.failed'],
      },
      emailSetup: {
        transport: transportMode,
        smtpConfigured: smtpActive,
        smtpHost: smtp.host || 'smtp.hostinger.com',
        smtpPort: smtp.port,
        smtpUser: smtp.user || 'hello@novesta.online',
        resendKeyConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
        fromAddress: smtpActive
          ? smtp.from || `Novesta <${smtp.user}>`
          : resendFromEnv || 'Novesta <onboarding@resend.dev>',
        toAddress: process.env.CONTACT_TO_EMAIL?.trim() || 'hello@novesta.online',
        backupEmail: process.env.FOUNDER_BACKUP_EMAIL?.trim() || 'novesta111@gmail.com',
        customDomainConfigured: Boolean(
          smtpActive || (resendFromEnv && !resendFromEnv.includes('onboarding@resend.dev'))
        ),
      },
      productionReadiness: getProductionReadiness(baseUrl),
    });
  });

  app.post('/api/admin/verify-smtp', async (req, res) => {
    const founderEmail = getAuthenticatedFounder(req);
    if (!founderEmail) {
      res.status(401).json({ error: 'Founder authentication required.' });
      return;
    }

    const smtp = getSmtpConfig();
    if (!smtp.host || !smtp.user || !smtp.pass) {
      res.status(400).json({
        ok: false,
        error:
          'Hostinger SMTP credentials are incomplete on the server. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in .env.',
      });
      return;
    }

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
        socketTimeout: 12000,
      });

      await transporter.verify();
      res.json({
        ok: true,
        message: `Verified authenticated TLS/SMTP connection to ${smtp.host}:${smtp.port} as ${smtp.user}.`,
      });
    } catch (err) {
      res.status(502).json({
        ok: false,
        error:
          err instanceof Error
            ? `SMTP handshake failed: ${err.message}`
            : 'SMTP handshake failed.',
      });
    }
  });

  app.post('/api/admin/test-email', async (req, res) => {
    const founderEmail = getAuthenticatedFounder(req);
    if (!founderEmail) {
      res.status(401).json({ error: 'Founder authentication required.' });
      return;
    }

    const toAddress = process.env.CONTACT_TO_EMAIL?.trim() || 'hello@novesta.online';
    const result = await sendTransactionalEmail({
      to: [toAddress],
      replyTo: founderEmail,
      subject: 'Novesta Email & Domain Verification Test',
      text: [
        'Novesta transactional email diagnostic test.',
        `Active Transport: ${getEmailTransportMode().toUpperCase()}`,
        `Triggered by: ${founderEmail}`,
        `Target Inbox: ${toAddress}`,
        `Timestamp: ${new Date().toISOString()}`,
      ].join('\n'),
    });

    if (!result.ok) {
      res.status(502).json({
        ok: false,
        error: result.error || 'Email dispatch failed.',
        status: result.status,
      });
      return;
    }

    const delivered = result.deliveredTo?.join(', ') || toAddress;
    res.json({
      ok: true,
      transport: result.transport,
      deliveredTo: result.deliveredTo || [toAddress],
      usedFallback: Boolean(result.usedFallback),
      message:
        result.transport === 'smtp'
          ? `Test email delivered directly via Hostinger SMTP (${getSmtpConfig().host}) to ${delivered}.`
          : result.usedFallback
            ? `Delivered via Resend fallback to ${delivered}. Configure Hostinger SMTP or verify novesta.online DNS in Resend for direct customer receipts.`
            : `Test email delivered directly to ${delivered}.`,
    });
  });

  app.post('/api/admin/roles', (req, res) => {
    const founderEmail = getAuthenticatedFounder(req);
    if (!founderEmail) {
      res.status(401).json({ error: 'Founder authentication required.' });
      return;
    }

    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const team = typeof req.body?.team === 'string' ? req.body.team.trim() : '';
    const location = typeof req.body?.location === 'string' ? req.body.location.trim() : '';
    const status =
      typeof req.body?.status === 'string' && req.body.status.trim()
        ? req.body.status.trim()
        : 'Accepting applications';

    if (title.length < 2 || title.length > 100) {
      res.status(400).json({ error: 'Role title must be 2–100 characters.' });
      return;
    }
    if (team.length < 2 || team.length > 80) {
      res.status(400).json({ error: 'Team / department must be 2–80 characters.' });
      return;
    }
    if (location.length < 2 || location.length > 80) {
      res.status(400).json({ error: 'Location must be 2–80 characters.' });
      return;
    }

    const nextNumber = store.roles.length + 1;
    const code = String(nextNumber).padStart(2, '0');
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 40);
    const id = `${baseSlug || 'role'}-${Date.now().toString(36)}`;

    const newRole: CareerRoleRecord = {
      id,
      code,
      title,
      team,
      location,
      status: status.slice(0, 40),
    };

    store.roles.push(newRole);
    saveStore(store);

    res.status(201).json({ ok: true, role: newRole, roles: store.roles });
  });

  app.put('/api/admin/roles/:id', (req, res) => {
    const founderEmail = getAuthenticatedFounder(req);
    if (!founderEmail) {
      res.status(401).json({ error: 'Founder authentication required.' });
      return;
    }

    const roleId = req.params.id;
    const target = store.roles.find((r) => r.id === roleId);
    if (!target) {
      res.status(404).json({ error: 'Role not found.' });
      return;
    }

    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : target.title;
    const team = typeof req.body?.team === 'string' ? req.body.team.trim() : target.team;
    const location =
      typeof req.body?.location === 'string' ? req.body.location.trim() : target.location;
    const status = typeof req.body?.status === 'string' ? req.body.status.trim() : target.status;
    const code =
      typeof req.body?.code === 'string' && req.body.code.trim()
        ? req.body.code.trim().slice(0, 6)
        : target.code;

    if (title.length < 2 || title.length > 100) {
      res.status(400).json({ error: 'Role title must be 2–100 characters.' });
      return;
    }
    if (team.length < 2 || team.length > 80) {
      res.status(400).json({ error: 'Team / department must be 2–80 characters.' });
      return;
    }
    if (location.length < 2 || location.length > 80) {
      res.status(400).json({ error: 'Location must be 2–80 characters.' });
      return;
    }

    target.code = code;
    target.title = title;
    target.team = team;
    target.location = location;
    target.status = status.slice(0, 40) || 'Accepting applications';
    saveStore(store);

    res.json({ ok: true, role: target, roles: store.roles });
  });

  app.delete('/api/admin/roles/:id', (req, res) => {
    const founderEmail = getAuthenticatedFounder(req);
    if (!founderEmail) {
      res.status(401).json({ error: 'Founder authentication required.' });
      return;
    }

    const roleId = req.params.id;
    const before = store.roles.length;
    store.roles = store.roles
      .filter((r) => r.id !== roleId)
      .map((r, index) => ({ ...r, code: String(index + 1).padStart(2, '0') }));

    if (store.roles.length === before) {
      res.status(404).json({ error: 'Role not found.' });
      return;
    }

    saveStore(store);
    res.json({ ok: true, roles: store.roles });
  });

  app.post('/api/admin/roles/reset', (req, res) => {
    const founderEmail = getAuthenticatedFounder(req);
    if (!founderEmail) {
      res.status(401).json({ error: 'Founder authentication required.' });
      return;
    }
    store.roles = [...DEFAULT_CAREER_ROLES];
    saveStore(store);
    res.json({ ok: true, roles: store.roles });
  });

  app.delete('/api/admin/applications/:id', (req, res) => {
    const founderEmail = getAuthenticatedFounder(req);
    if (!founderEmail) {
      res.status(401).json({ error: 'Founder authentication required.' });
      return;
    }
    const appId = req.params.id;
    const before = store.applications.length;
    store.applications = store.applications.filter((a) => a.id !== appId);
    if (store.applications.length === before) {
      res.status(404).json({ error: 'Application not found.' });
      return;
    }
    saveStore(store);
    res.json({ ok: true, applications: store.applications });
  });

  app.delete('/api/admin/contacts/:id', (req, res) => {
    const founderEmail = getAuthenticatedFounder(req);
    if (!founderEmail) {
      res.status(401).json({ error: 'Founder authentication required.' });
      return;
    }
    const leadId = req.params.id;
    const before = store.contacts.length;
    store.contacts = store.contacts.filter((c) => c.id !== leadId);
    if (store.contacts.length === before) {
      res.status(404).json({ error: 'Consultation lead not found.' });
      return;
    }
    saveStore(store);
    res.json({ ok: true, contacts: store.contacts });
  });

  app.put('/api/admin/feedback/:id', (req, res) => {
    const founderEmail = getAuthenticatedFounder(req);
    if (!founderEmail) {
      res.status(401).json({ error: 'Founder authentication required.' });
      return;
    }
    const feedbackId = req.params.id;
    const target = store.feedbacks.find((f) => f.id === feedbackId);
    if (!target) {
      res.status(404).json({ error: 'Feedback entry not found.' });
      return;
    }

    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : target.name;
    const business =
      typeof req.body?.business === 'string' ? req.body.business.trim() : target.business;
    const comment =
      typeof req.body?.comment === 'string' ? req.body.comment.trim() : target.comment;
    const ratingNum =
      req.body?.rating !== undefined ? Number(req.body.rating) : target.rating;

    if (name.length < 2 || name.length > 80) {
      res.status(400).json({ error: 'Name must be 2–80 characters.' });
      return;
    }
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      res.status(400).json({ error: 'Rating must be between 1 and 5.' });
      return;
    }
    if (comment.length < 3 || comment.length > 600) {
      res.status(400).json({ error: 'Comment must be 3–600 characters.' });
      return;
    }

    target.name = name;
    target.business = business.slice(0, 80) || 'Verified Client';
    target.rating = ratingNum;
    target.comment = comment;
    saveStore(store);
    res.json({ ok: true, item: target, feedbacks: store.feedbacks });
  });

  app.delete('/api/admin/feedback/:id', (req, res) => {
    const founderEmail = getAuthenticatedFounder(req);
    if (!founderEmail) {
      res.status(401).json({ error: 'Founder authentication required.' });
      return;
    }
    const feedbackId = req.params.id;
    const before = store.feedbacks.length;
    store.feedbacks = store.feedbacks.filter((f) => f.id !== feedbackId);
    if (store.feedbacks.length === before) {
      res.status(404).json({ error: 'Feedback entry not found.' });
      return;
    }
    saveStore(store);
    res.json({ ok: true, feedbacks: store.feedbacks });
  });

  app.delete('/api/admin/payments/:id', (req, res) => {
    const founderEmail = getAuthenticatedFounder(req);
    if (!founderEmail) {
      res.status(401).json({ error: 'Founder authentication required.' });
      return;
    }
    const paymentId = req.params.id;
    const before = store.payments.length;
    store.payments = store.payments.filter((p) => p.id !== paymentId);
    if (store.payments.length === before) {
      res.status(404).json({ error: 'Payment record not found.' });
      return;
    }
    saveStore(store);
    res.json({ ok: true, payments: store.payments });
  });

  // Public feedback endpoints (persisted in submissions store, displayed live on site, + emails founder)
  app.get('/api/feedback', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const items = store.feedbacks;
    const totalCount = items.length;
    const averageRating =
      totalCount > 0
        ? Number(
            (items.reduce((sum, item) => sum + item.rating, 0) / totalCount).toFixed(1)
          )
        : 0;
    res.json({ items, totalCount, averageRating });
  });

  app.post('/api/feedback', async (req, res) => {
    const body = req.body || {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const business = typeof body.business === 'string' ? body.business.trim() : '';
    const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
    const ratingNum = Number(body.rating);

    if (name.length < 2 || name.length > 80) {
      res.status(400).json({ error: 'Please enter your name (2–80 characters).' });
      return;
    }
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      res.status(400).json({ error: 'Please choose a rating between 1 and 5 stars.' });
      return;
    }
    if (comment.length < 3 || comment.length > 600) {
      res.status(400).json({ error: 'Please write feedback between 3 and 600 characters.' });
      return;
    }

    const businessLabel = business.slice(0, 80) || 'Verified Client';
    const entry: FeedbackEntry = {
      id: `NOV-FB-${Date.now().toString(36).toUpperCase()}`,
      name,
      business: businessLabel,
      rating: ratingNum,
      comment,
      createdAt: new Date().toISOString(),
    };

    store.feedbacks.unshift(entry);
    if (store.feedbacks.length > 200) store.feedbacks.length = 200;
    saveStore(store);

    const emailResult = await sendTransactionalEmail({
      to: getBusinessAlertRecipients(),
      fromLabel: 'Novesta Feedback',
      subject: `[Novesta Public Feedback] ${ratingNum}/5 from ${name}`,
      text: [
        `New public feedback published on Novesta (${entry.id})`,
        ``,
        `Name: ${name}`,
        `Business / Role: ${businessLabel}`,
        `Rating: ${ratingNum} / 5`,
        ``,
        `Feedback:`,
        comment,
      ].join('\n'),
    });

    res.status(200).json({
      ok: true,
      delivered: emailResult.ok,
      item: entry,
      items: store.feedbacks,
      message: 'Thank you! Your feedback is now published on the website.',
    });
  });

  /**
   * Razorpay Online Payments & Signed Webhook Integration
   */
  app.get('/api/payments/config', (_req, res) => {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim() || '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || '';
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      enabled: Boolean(keyId && keySecret),
      currency: 'INR',
      plans: Object.values(AUTHORITATIVE_PLANS),
    });
  });

  app.post(['/api/payments/create-order', '/api/payments/razorpay/order'], async (req, res) => {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!keyId || !keySecret) {
      res.status(503).json({
        error: 'Online checkout is temporarily unavailable. Please use WhatsApp or the consultation form.',
      });
      return;
    }

    const body = req.body || {};
    const planId = typeof body.planId === 'string' ? body.planId.trim() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const businessName =
      typeof body.businessName === 'string' ? body.businessName.trim().slice(0, 120) : '';

    const plan = AUTHORITATIVE_PLANS[planId];
    if (!plan) {
      res.status(400).json({ error: 'Invalid pricing plan selected.' });
      return;
    }
    if (name.length < 2 || name.length > 120) {
      res.status(400).json({ error: 'Please enter your full name (2–120 characters).' });
      return;
    }
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    if (!/^\+?[0-9]{8,15}$/.test(cleanPhone)) {
      res.status(400).json({ error: 'Please enter a valid 10-digit phone or WhatsApp number.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    const receipt = `NOV-${Date.now().toString(36).toUpperCase()}`;
    const amountPaise = plan.amountInr * 100;
    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;

    try {
      const rpResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: 'INR',
          receipt,
          notes: {
            planId: plan.id,
            planName: plan.name,
            customerName: name,
            customerPhone: phone,
            customerEmail: email,
            businessName: businessName || 'Not specified',
          },
        }),
      });

      const rpData = (await rpResponse.json().catch(() => ({}))) as {
        id?: string;
        amount?: number;
        currency?: string;
        error?: { description?: string };
      };

      if (!rpResponse.ok || !rpData.id) {
        console.error('Razorpay order error:', rpResponse.status, rpData);
        res.status(502).json({
          error: rpData.error?.description || 'Could not initialize Razorpay checkout order.',
        });
        return;
      }

      const now = new Date().toISOString();
      const paymentRecord: PaymentRecord = {
        id: receipt,
        orderId: rpData.id,
        planId: plan.id,
        planName: plan.name,
        billing: plan.billing,
        services: plan.features,
        amountInr: plan.amountInr,
        amountPaise,
        currency: 'INR',
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        businessName: businessName || 'Not specified',
        status: 'Created',
        createdAt: now,
        updatedAt: now,
      };

      store.payments.unshift(paymentRecord);
      if (store.payments.length > 200) store.payments.length = 200;
      saveStore(store);

      res.json({
        ok: true,
        keyId,
        orderId: rpData.id,
        amount: amountPaise,
        amountInr: plan.amountInr,
        currency: 'INR',
        receipt,
        plan,
      });
    } catch (err) {
      console.error('Razorpay network error:', err);
      res.status(500).json({ error: 'Network error connecting to Razorpay.' });
    }
  });

  app.post(['/api/payments/verify', '/api/payments/razorpay/verify'], async (req, res) => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!keySecret) {
      res.status(503).json({ error: 'Payment verification unavailable.' });
      return;
    }

    const orderId =
      typeof req.body?.razorpay_order_id === 'string' ? req.body.razorpay_order_id.trim() : '';
    const paymentId =
      typeof req.body?.razorpay_payment_id === 'string' ? req.body.razorpay_payment_id.trim() : '';
    const signature =
      typeof req.body?.razorpay_signature === 'string' ? req.body.razorpay_signature.trim() : '';

    if (!orderId || !paymentId || !signature) {
      res.status(400).json({ error: 'Incomplete payment verification payload.' });
      return;
    }

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const providedBuf = Buffer.from(signature, 'utf8');
    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    if (
      providedBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(providedBuf, expectedBuf)
    ) {
      res.status(400).json({ error: 'Payment signature verification failed.' });
      return;
    }

    const record = store.payments.find((p) => p.orderId === orderId);
    const now = new Date().toISOString();
    let customerEmailSent = false;
    let adminEmailSent = false;

    if (record) {
      record.paymentId = paymentId;
      record.status = 'Paid (Verified)';
      record.updatedAt = now;
      saveStore(store);

      const emailStatus = await sendPaymentConfirmationEmails(record, store);
      customerEmailSent = emailStatus.customerEmailSent;
      adminEmailSent = emailStatus.adminEmailSent;
    }

    const planInfo = record ? AUTHORITATIVE_PLANS[record.planId] : undefined;
    const services =
      record?.services && record.services.length > 0
        ? record.services
        : planInfo?.features || [];

    res.json({
      ok: true,
      receipt: record?.id || orderId,
      orderId,
      paymentId,
      planName: record?.planName || 'Novesta Plan',
      billing: record?.billing || planInfo?.billing || '',
      amountInr: record?.amountInr || 0,
      customerEmail: record?.customerEmail || '',
      customerEmailSent,
      adminEmailSent,
      services,
      status: 'Paid (Verified)',
      paidAt: now,
    });
  });

  app.get(['/api/payments/razorpay/webhook', '/api/payments/webhook'], (_req, res) => {
    res.json({
      ok: true,
      status: 'ready',
      method: 'POST',
      webhookSecretConfigured: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET?.trim()),
      emailTransport: getEmailTransportMode(),
      events: ['payment.captured', 'order.paid', 'payment.failed'],
    });
  });

  app.post(['/api/payments/razorpay/webhook', '/api/payments/webhook'], async (req, res) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
    const signature = (req.headers['x-razorpay-signature'] as string | undefined)?.trim() || '';
    const rawBody = (req as express.Request & { rawBody?: Buffer }).rawBody;

    if (isProduction && !webhookSecret) {
      console.error('[Novesta Razorpay Webhook] Rejected unsigned webhook in production: RAZORPAY_WEBHOOK_SECRET not set.');
      res.status(503).json({
        error: 'Webhook signature verification secret is not configured on the server.',
      });
      return;
    }

    if (webhookSecret) {
      if (!signature || !rawBody) {
        res.status(401).json({ error: 'Missing webhook signature or payload.' });
        return;
      }
      const expected = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');
      const sigBuf = Buffer.from(signature, 'utf8');
      const expBuf = Buffer.from(expected, 'utf8');
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        res.status(401).json({ error: 'Invalid Razorpay webhook signature.' });
        return;
      }
    }

    const eventName = typeof req.body?.event === 'string' ? req.body.event : 'unknown';
    const paymentEntity = req.body?.payload?.payment?.entity;
    const orderEntity = req.body?.payload?.order?.entity;
    const orderId =
      (typeof paymentEntity?.order_id === 'string' && paymentEntity.order_id) ||
      (typeof orderEntity?.id === 'string' && orderEntity.id) ||
      '';
    const paymentId = typeof paymentEntity?.id === 'string' ? paymentEntity.id : undefined;

    let targetRecord: PaymentRecord | undefined;

    if (orderId) {
      const now = new Date().toISOString();
      const existing = store.payments.find((p) => p.orderId === orderId);
      if (existing) {
        if (paymentId) existing.paymentId = paymentId;
        existing.webhookVerified = Boolean(webhookSecret);
        existing.webhookEvent = eventName;
        if (eventName === 'payment.captured' || eventName === 'order.paid') {
          existing.status =
            existing.status === 'Paid (Verified)' ? 'Paid (Verified)' : 'Captured (Webhook)';
        } else if (eventName === 'payment.failed' && existing.status === 'Created') {
          existing.status = 'Failed';
        }
        existing.updatedAt = now;
        saveStore(store);
        targetRecord = existing;
      } else if (eventName === 'payment.captured' || eventName === 'order.paid') {
        const amountPaise = Number(paymentEntity?.amount || orderEntity?.amount || 0);
        const notes = paymentEntity?.notes || orderEntity?.notes || {};
        const notePlanId = typeof notes.planId === 'string' ? notes.planId : 'external';
        const matchedPlan = AUTHORITATIVE_PLANS[notePlanId];
        targetRecord = {
          id: `NOV-WH-${Date.now().toString(36).toUpperCase()}`,
          orderId,
          paymentId,
          planId: notePlanId,
          planName:
            typeof notes.planName === 'string'
              ? notes.planName
              : matchedPlan?.name || 'Razorpay Payment',
          billing: matchedPlan?.billing || 'standard plan',
          services: matchedPlan?.features || [
            'Custom Novesta digital growth onboarding & setup',
          ],
          amountInr: Math.round(amountPaise / 100),
          amountPaise,
          currency: 'INR',
          customerName: typeof notes.customerName === 'string' ? notes.customerName : 'Razorpay Customer',
          customerPhone:
            typeof paymentEntity?.contact === 'string'
              ? paymentEntity.contact
              : typeof notes.customerPhone === 'string'
                ? notes.customerPhone
                : '',
          customerEmail:
            typeof paymentEntity?.email === 'string'
              ? paymentEntity.email
              : typeof notes.customerEmail === 'string'
                ? notes.customerEmail
                : '',
          businessName: typeof notes.businessName === 'string' ? notes.businessName : 'Not specified',
          status: 'Captured (Webhook)',
          webhookVerified: Boolean(webhookSecret),
          webhookEvent: eventName,
          createdAt: now,
          updatedAt: now,
        };
        store.payments.unshift(targetRecord);
        saveStore(store);
      }
    }

    if (
      targetRecord &&
      (eventName === 'payment.captured' || eventName === 'order.paid') &&
      !targetRecord.confirmationEmailsSentAt
    ) {
      await sendPaymentConfirmationEmails(targetRecord, store);
    }

    console.info('[Novesta Razorpay Webhook]', {
      event: eventName,
      orderId,
      paymentId,
      signatureVerified: Boolean(webhookSecret),
    });

    res.status(200).json({ ok: true, received: true, event: eventName });
  });

  // Serve /favicon.ico cleanly from optimized 3.5 KB PNG so browsers never download 467 KB or hit 404
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

  // Dynamic robots.txt & sitemap.xml using APP_URL or live request origin
  app.get('/robots.txt', (req, res) => {
    const baseUrl = resolveBaseUrl(req);
    res
      .type('text/plain; charset=utf-8')
      .setHeader('Cache-Control', 'public, max-age=3600')
      .send(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\n\nSitemap: ${baseUrl}/sitemap.xml\n`);
  });

  app.get('/sitemap.xml', (req, res) => {
    const baseUrl = resolveBaseUrl(req);
    const today = new Date().toISOString().split('T')[0];
    const routes = [
      { path: '/', changefreq: 'weekly', priority: '1.0' },
      { path: '/careers', changefreq: 'weekly', priority: '0.8' },
      { path: '/privacy', changefreq: 'monthly', priority: '0.4' },
      { path: '/terms', changefreq: 'monthly', priority: '0.4' },
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
   * Real-time Consultation Request Endpoint
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
      subject: `[Novesta Lead ${record.id}] ${businessType}${plan ? ` (${plan})` : ''} — ${name}`,
      text: [
        `New consultation inquiry from Novesta website`,
        `Reference ID: ${record.id}`,
        ``,
        `Name: ${name}`,
        `Phone / WhatsApp: ${phone}`,
        `Email: ${email}`,
        `Business Type: ${businessType}`,
        `Selected Plan: ${plan || 'Not specified'}`,
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
      businessType,
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
        : `Request ${record.id} accepted and queued. You can also share this reference directly on WhatsApp.`,
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
        `03. Local conversion fixes:`,
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
        ? `Application ${record.id} accepted and sent to the founder.`
        : `Application ${record.id} accepted! You can also share your reference ID directly on WhatsApp.`,
    });
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
    // Enable zero-dependency Brotli / Gzip compression for static JS, CSS, JSON, SVG, and HTML in production
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

      res.write = ((chunk: unknown, encodingArg?: BufferEncoding | ((error: Error | null | undefined) => void), cb?: (error: Error | null | undefined) => void) => {
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

    // Serve remaining public/dist assets without shadowing / -> SEO HTML injector
    app.use(express.static(distPath, { index: false, maxAge: '7d' }));

    const indexPath = path.join(distPath, 'index.html');
    const cachedTemplate = fs.existsSync(indexPath)
      ? fs.readFileSync(indexPath, 'utf8')
      : null;

    const ROUTE_SEO: Record<string, { title: string; description: string }> = {
      '/': {
        title: 'Novesta — Grow Online. Sell More. Rank Higher.',
        description:
          'Novesta builds fast websites, online ordering systems, Google Maps rankings, SEO, and AI WhatsApp automation to grow your business online.',
      },
      '/careers': {
        title: 'Careers at Novesta — Engineering & Growth Roles',
        description:
          'Join Novesta in Jalgaon or remotely. Build high-speed websites, SEO engines, Google Maps visibility, and AI WhatsApp automation.',
      },
      '/privacy': {
        title: 'Privacy Policy — Novesta Digital Growth',
        description:
          "Read Novesta's privacy policy covering inquiry data, consultation requests, analytics, and embedded Google Maps usage details.",
      },
      '/terms': {
        title: 'Terms of Service — Novesta Digital Growth',
        description:
          "Review Novesta's terms of service covering project scope, client code and domain ownership, and third-party platform integrations.",
      },
    };

    app.get(['/', '/careers', '/privacy', '/terms', '/admin', '*'], (req, res) => {
      if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'API endpoint not found' });
        return;
      }

      if (!cachedTemplate) {
        res.status(404).send('Build output not found. Run npm run build first.');
        return;
      }

      const baseUrl = resolveBaseUrl(req);
      const isPrivateAdmin = req.path === '/admin';
      const normalizedPath = ROUTE_SEO[req.path] ? req.path : '/';
      const routeMeta = ROUTE_SEO[normalizedPath];
      const canonicalUrl = `${baseUrl}${normalizedPath === '/' ? '/' : normalizedPath}`;
      const ogImageUrl = `${baseUrl}/assets/aistudio/Novesta_72b3be73.png`;
      const gscToken =
        process.env.VITE_GSC_VERIFICATION || process.env.GSC_VERIFICATION || '';

      let html = cachedTemplate
        .replace(
          /<title>.*?<\/title>/,
          `<title>${isPrivateAdmin ? 'Founder Access — Novesta' : routeMeta.title}</title>`
        )
        .replace(
          /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
          isPrivateAdmin
            ? '<meta name="robots" content="noindex, nofollow" />'
            : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />'
        )
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
          /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
          `<meta property="og:image" content="${ogImageUrl}" />`
        )
        .replace(
          /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
          `<meta name="twitter:title" content="${routeMeta.title}" />`
        )
        .replace(
          /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
          `<meta name="twitter:description" content="${routeMeta.description}" />`
        )
        .replace(
          /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
          `<meta name="twitter:image" content="${ogImageUrl}" />`
        )
        .replace(/https:\/\/novesta\.(?:online|in)/g, baseUrl)
        .replace(/"\/assets\/aistudio\/Novesta_72b3be73\.png"/g, `"${ogImageUrl}"`);

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
        .setHeader('X-Robots-Tag', isPrivateAdmin ? 'noindex, nofollow' : 'index, follow')
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
