# Novesta — Production Deployment Guide (`novesta.online`)

Deployment guide for the **Novesta** web shell on **Hostinger / Render / Node 22+** with:
- Domain: **`https://novesta.online`**
- Email & SMTP: **`hello@novesta.online`** (with optional Resend API fallback)
- Active routes: **`/`**, **`/careers`**, **`/api/contact`**, **`/api/careers/roles`**, **`/api/careers/apply`**, **`/api/health`**
- Legacy routes redirect cleanly with HTTP `301` to `/`.

## Environment Setup

1. Copy `.env.example` to `.env` (or add variables in your hosting dashboard).
2. Configure:
   - `NODE_ENV="production"`
   - `APP_URL="https://novesta.online"`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `CONTACT_TO_EMAIL`, `CONTACT_BACKUP_EMAIL`
   - Optional fallback: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
   - Optional persistence: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

## Build & Start

```bash
npm ci
npm run build
npm run check:prod
npm start
```

## Post-Deploy Checks

1. Verify `https://novesta.online/api/health` returns `"status": "ok"`.
2. Verify `https://novesta.online/robots.txt` and `https://novesta.online/sitemap.xml` list only `/` and `/careers`.
3. Verify legacy routes return HTTP `301` to `/`.
