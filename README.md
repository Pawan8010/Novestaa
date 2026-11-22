# Novesta — Free Exam Photo & PDF Tools Shell

Clean, deployable web shell for Novesta (`https://novesta.online`), preserving the `/careers` workflow and SMTP/Resend email transport.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4 + `lucide-react`
- **Backend:** Express (`server.ts`) with:
  - `POST /api/contact` (SMTP primary via Nodemailer with Resend REST API fallback)
  - `GET /api/careers/roles` & `POST /api/careers/apply`
  - `GET /api/health`
  - Dynamic `/sitemap.xml` and `/robots.txt` listing `/` and `/careers`
  - HTTP `301` redirects from removed legacy routes to `/`

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and configure SMTP (`SMTP_*`) and/or `RESEND_API_KEY`.
3. Start the dev server on port `3000`:
   ```bash
   npm run dev
   ```
4. Type-check and build for production:
   ```bash
   npm run lint
   npm run build
   npm run start
   ```
