# Novesta — Hostinger Production Deployment & Connectivity Guide (`novesta.online`)

This guide takes you from zero to a live, SSL-secured **Novesta** deployment on **Hostinger** with:
- Domain: **`https://novesta.online`** (`www.novesta.online` redirected cleanly)
- Email & SMTP: **`hello@novesta.online`** (customer receipts, founder alerts, contact & careers inquiries)
- Live Payments & Webhooks: **Razorpay Live Mode** (`rzp_live_...` + HMAC-SHA256 verified webhook)
- Founder Admin Workspace: **`https://novesta.online/admin`**

---

## Step 1 — Hostinger Email Setup (`hello@novesta.online`)

1. Open **Hostinger hPanel** → **Emails** → select **`novesta.online`** → **Email Accounts**.
2. Click **Create email account**:
   - Email address: `hello@novesta.online`
   - Password: create a strong password and save it (this becomes `SMTP_PASS`).
3. Open **Domains** → **`novesta.online`** → **DNS / Nameservers** → **DNS Records** and verify these records exist:
   - **MX**: `mx1.hostinger.com` (Priority `5`) and `mx2.hostinger.com` (Priority `10`)
   - **TXT (SPF)**: Host `@` → `v=spf1 include:_spf.mail.hostinger.com ~all`
   - **DKIM**: Ensure Hostinger's default DKIM CNAME/TXT records are enabled under Email Authentication.
   - **TXT (DMARC)**: Host `_dmarc` → `v=DMARC1; p=none; rua=mailto:hello@novesta.online`
4. Keep these SMTP values ready for `.env`:
   ```env
   SMTP_HOST="smtp.hostinger.com"
   SMTP_PORT="465"
   SMTP_SECURE="true"
   SMTP_USER="hello@novesta.online"
   SMTP_PASS="YOUR_MAILBOX_PASSWORD"
   SMTP_FROM="Novesta <hello@novesta.online>"
   ```

---

## Step 2 — Domain DNS Setup (`novesta.online`)

In **Hostinger hPanel → Domains → `novesta.online` → DNS Records**:
- If deploying on **Hostinger VPS**, add/update two **A** records pointing to your VPS IPv4 address:
  - Type: `A` | Name: `@` | Points to: `<YOUR_VPS_IP>` | TTL: `300`
  - Type: `A` | Name: `www` | Points to: `<YOUR_VPS_IP>` | TTL: `300`
- If deploying on **Hostinger Business / Cloud Hosting (Managed Node.js)**, connect `novesta.online` directly inside **Websites → Add Website** and Hostinger manages the A records & SSL automatically.

---

## Step 3 — Razorpay Live Keys & Webhook Setup

1. Log in to **Razorpay Dashboard** and toggle the top bar from **Test Mode** to **Live Mode** (requires completed KYC).
2. Go to **Account & Settings → Website and app settings → API Keys**:
   - Click **Generate Live Key** (if not generated yet).
   - Copy **Key ID** (`rzp_live_...`) → `RAZORPAY_KEY_ID`
   - Copy **Key Secret** → `RAZORPAY_KEY_SECRET`
3. Go to **Account & Settings → Webhooks → + Add New Webhook**:
   - **Webhook URL**: `https://novesta.online/api/payments/razorpay/webhook`
   - **Secret**: Enter a strong random secret (e.g., 32+ characters) → save it as `RAZORPAY_WEBHOOK_SECRET`
   - **Alert Email**: `hello@novesta.online`
   - **Active Events** (check both):
     - `payment.captured`
     - `order.paid`
   - Click **Create Webhook**.

---

## Step 4 — Optional: Google Maps, Analytics & Search Console

1. **Google Maps** (for the Bhopal office embed in Contact):
   - Create/select an API key in Google Cloud Console with **Maps Embed API** & **Maps JavaScript API** enabled.
   - Under **Application restrictions → Websites**, allow `https://novesta.online/*` and `https://www.novesta.online/*`.
   - Set `VITE_GOOGLE_MAPS_API_KEY` in `.env` **before** running `npm run build`.
2. **Google Analytics 4**: Set `VITE_GA4_MEASUREMENT_ID="G-XXXXXXXXXX"` before `npm run build`.
3. **Google Search Console**: `/public/google1e529b83336dbecf.html` is already served at `https://novesta.online/google1e529b83336dbecf.html`. After going live, submit `https://novesta.online/sitemap.xml` in Search Console.

---

## Step 5 — Deploy on Hostinger

### Option A (Recommended): Hostinger VPS (Ubuntu + Node 22 + PM2 + Nginx + SSL)

1. **SSH into your VPS** and install Node.js 22, PM2, Nginx, and Certbot:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt update && sudo apt install -y nodejs nginx certbot python3-certbot-nginx git
   sudo npm install -g pm2
   node -v   # Should be v22.18.0 or higher
   ```

2. **Upload or clone the project** to `/var/www/novesta`:
   ```bash
   sudo mkdir -p /var/www/novesta
   sudo chown -R $USER:$USER /var/www/novesta
   cd /var/www/novesta
   # Clone your repo (or upload project files here)
   git clone <YOUR_REPO_URL> .
   npm ci
   ```

3. **Create `.env` from `.env.example`**:
   ```bash
   cp .env.example .env
   # Generate a 64-character SESSION_SECRET:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   nano .env
   ```
   Fill in every required variable (`SMTP_PASS`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `FOUNDER_ADMIN_KEY`, `SESSION_SECRET`, and optional `VITE_*` keys).
   Restrict permissions so only your user can read `.env`:
   ```bash
   chmod 600 .env
   ```

4. **Build frontend & run automated preflight check** (verifies env, `dist/`, Razorpay keys, and live Hostinger SMTP handshake):
   ```bash
   npm run build
   npm run check:prod
   ```
   Confirm `0 failed` before continuing.

5. **Start the server with PM2**:
   ```bash
   mkdir -p logs
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup
   # Run the sudo command printed by `pm2 startup` so Novesta auto-starts on VPS reboot
   ```

6. **Configure Nginx reverse proxy for `novesta.online`**:
   ```bash
   sudo nano /etc/nginx/sites-available/novesta.online
   ```
   Paste:
   ```nginx
   server {
       listen 80;
       server_name novesta.online www.novesta.online;

       client_max_body_size 10M;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   Enable and test:
   ```bash
   sudo ln -s /etc/nginx/sites-available/novesta.online /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t && sudo systemctl reload nginx
   ```

7. **Issue free Let's Encrypt SSL certificate**:
   ```bash
   sudo certbot --nginx -d novesta.online -d www.novesta.online
   ```
   Choose **Redirect HTTP to HTTPS** when prompted. Certbot automatically renews SSL every 90 days.

---

### Option B: Hostinger Managed Node.js Web App (Business / Cloud Hosting hPanel)

1. In **Hostinger hPanel → Websites → Add Website → Node.js Web App** (connect GitHub repo or upload ZIP).
2. Set:
   - **Domain**: `novesta.online`
   - **Node.js Version**: **22.x** (recommended). *(If only Node 20.x is available, set Start Command to `npm run start:tsx`.)*
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Port**: `3000` (or match the `PORT` env var Hostinger provides — `server.ts` reads `process.env.PORT` automatically).
3. Under **Environment Variables** in hPanel, add all keys from `.env.example` (including `NODE_ENV=production` and `APP_URL=https://novesta.online`).
4. Trigger a deploy and ensure SSL is **Active** under **Security → SSL**.

---

## Step 6 — End-to-End Post-Deployment Verification

1. **Health Endpoint**: Open `https://novesta.online/api/health` — verify `"status": "ok"`, `"environment": "production"`, `"mailTransport": "smtp"`, `"razorpayConfigured": true`, and `"webhookSecretConfigured": true`.
2. **Founder Portal (`/admin`)**:
   - Visit `https://novesta.online/admin` and sign in with `hello@novesta.online` + your `FOUNDER_ADMIN_KEY`.
   - Open **Email & Domain** → click **Verify SMTP Handshake** → then click **Send Test Email** and confirm delivery to `hello@novesta.online`.
   - Check the **Production Readiness Audit** shows all items green.
3. **Contact & Careers Forms**: Submit a test inquiry on `/` and verify it arrives in `hello@novesta.online` and appears in `/admin → Leads`.
4. **Live Payment & Dual Email Confirmation**:
   - Run a small live checkout (or verify a live webhook ping from Razorpay Dashboard → Webhooks).
   - Confirm:
     - Customer receives the automated receipt email with Order ID, Payment ID, Amount Paid, and the exact services checklist.
     - `hello@novesta.online` receives the business notification email with customer details and the Services To Deliver checklist.
     - Order appears under `/admin → Payments & Webhook` with `Customer Mail: Sent`.
5. **SEO & Crawlers**:
   - Check `https://novesta.online/robots.txt` and `https://novesta.online/sitemap.xml`.
   - Submit `https://novesta.online/sitemap.xml` in Google Search Console.
