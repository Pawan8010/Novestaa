# Novesta — Digital Growth Agency Website

**Tagline:** Grow Online. Sell More. Rank Higher.

Novesta helps offline and growing businesses—hotels, restaurants, cafes, retail shops, clinics, startups, and local service providers—launch fast websites, direct ordering/booking products, Google Maps & Search visibility, and AI/WhatsApp automation.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4
- **Motion & Icons:** Framer Motion (`motion/react`) + `lucide-react`
- **Maps:** `@vis.gl/react-google-maps` (`AdvancedMarker`, `Pin`, `InfoWindow`)
- **Backend:** Express (`server.ts`) with validated `POST /api/contact` email delivery (Resend REST API) and dynamic `/sitemap.xml` + `/robots.txt`

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your environment variables:
   - `RESEND_API_KEY`: API key from [resend.com](https://resend.com) to send contact leads to `novesta111@gmail.com`.
   - `VITE_GOOGLE_MAPS_API_KEY`: Google Maps JavaScript API key (HTTP referrer restricted).
   - `VITE_GA4_MEASUREMENT_ID`: Optional Google Analytics 4 ID.
3. Start the full-stack development server on port `3000`:
   ```bash
   npm run dev
   ```
4. Type-check and build for production:
   ```bash
   npm run lint
   npm run build
   npm run start
   ```

## Placeholders to Replace Before Launch

All business copy, stats, and placeholders are centralized in `src/config/site.ts` and `index.html`:

1. **Founder Photo (`src/config/site.ts`)**: Replace `founder.photoUrl` with your WebP/PNG portrait path (e.g. `/assets/founder-pawan.webp`).
2. **Office Street Address & Coordinates (`src/config/site.ts` & `index.html`)**: Update `contact.address.line1`, `postalCode`, `full`, and `coordinates` (`lat`, `lng`) from Jalgaon defaults to your exact office address.
3. **Social Links (`src/config/site.ts`)**: Replace placeholder Instagram, Facebook, X, and LinkedIn URLs in `siteConfig.socials`.
4. **Results & Stats (`src/config/site.ts`)**: Replace the placeholder benchmark numbers in `siteConfig.results.stats` with verified client case study figures.
5. **Testimonials (`src/config/site.ts`)**: Replace the 3 placeholder quotes and names in `siteConfig.testimonials` with real client quotes.
6. **SEO & Analytics (`src/config/site.ts` & `index.html`)**: Replace `seo.canonicalBaseUrl` (`https://novesta.in`), GA4 `G-XXXXXXXXXX`, and Google Search Console `google-site-verification` token.

## Deployment

### Option 1: Cloud Run / Node Hosting (Full-Stack with `/api/contact`)
1. Set environment variables (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CONTACT_TO_EMAIL`, `VITE_GOOGLE_MAPS_API_KEY`, `APP_URL`, `NODE_ENV=production`).
2. Build client assets: `npm run build`
3. Start server: `npm run start` (`node server.ts` on port `3000` or `PORT`).

### Option 2: Vercel
1. Connect repository to Vercel.
2. Add the same environment variables in Vercel Project Settings.
3. If deploying strictly as static Vite + serverless, move `POST /api/contact` logic into `/api/contact.ts` Vercel Serverless Function or deploy the Node server.

### Option 3: Firebase Hosting (+ Cloud Run / Cloud Functions for `/api/contact`)
1. Run `npm run build` to output static assets into `dist/`.
2. Configure `firebase.json` with `public: "dist"`, clean URL rewrites (`** -> /index.html`), and optional `/api/**` rewrite to Cloud Run / Functions.
3. Run `firebase deploy`.
