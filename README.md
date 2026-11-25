# Sweety Beauty Parlour — Lawar, Meerut

Frosted-glass salon website and automated WhatsApp booking & inquiry platform for **Sweety Beauty Parlour** (Main Market Road, Near Lawar Bus Stand, Lawar, Meerut, UP 250222).

## Features

- **Curated Rate Card & Bridal Showcase**: Category-filtered services across Bridal, Skin & Facial, Hair & Styling, and Mehndi & Nails with INR pricing and studio durations.
- **Automated WhatsApp Booking & Inquiry Hub**: Validates 10-digit Indian mobile numbers, logs bookings/inquiries with reference IDs (`SBP-BK-*` / `SBP-INQ-*`), generates pre-filled `https://wa.me/...` links with a live message preview, and optionally dispatches directly via Meta WhatsApp Cloud API v21.0.
- **Detailed Admin Parlour Desk**: Passcode-protected management modal (`scrypt` + HMAC-SHA256 session tokens) featuring KPI revenue/advance summaries, client search & status filters, walk-in booking entry, full booking detail editing (date, slot, stylist, advance paid, balance due, staff notes), direct WhatsApp client reply links, and CSV export.
- **Light & Dark Glassmorphism Theme**: Toggleable in the top header beside **Book on WhatsApp** and in the footer, persisted in `localStorage`.
- **SEO & Structured Data Ready**: Full OpenGraph/Twitter cards, local geo metadata (`IN-UP`, `Lawar, Meerut`), `BeautySalon` + `OfferCatalog` + `FAQPage` JSON-LD structured data, dynamic `robots.txt`, `sitemap.xml`, and branded SVG favicon.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables by copying `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   - `PARLOUR_WHATSAPP_NUMBER`: Parlour WhatsApp number in international format without `+` (e.g., `919876543210`).
   - `ADMIN_PASSCODE`: Passcode for signing in to **Admin Desk**. (If left unset, the Admin Desk UI offers a one-time first-run passcode setup stored hashed in `data/parlour-store.json`.)
   - `WHATSAPP_ACCESS_TOKEN` & `WHATSAPP_PHONE_NUMBER_ID` *(optional)*: Enable server-side automated WhatsApp Cloud API messages alongside the direct `wa.me` hand-off.

3. Run in development (Express API + Vite on port `3000`):
   ```bash
   npm run dev
   ```

4. Run type-check, tests, and production build:
   ```bash
   npm run lint
   npx tsx --test src/utils/parlour.test.ts
   npm run build
   NODE_ENV=production npm start
   ```

## Deploying on Vercel

This repository includes `vercel.json` and `api/index.ts` so both the Vite frontend and `/api/*`, `/robots.txt`, and `/sitemap.xml` routes run cleanly on Vercel.

In your Vercel project's **Settings → Environment Variables**, configure:
- `PARLOUR_WHATSAPP_NUMBER` (e.g., `919876543210`)
- `ADMIN_PASSCODE` (recommended on serverless deployments so Admin Desk login works consistently across cold starts)
- `SESSION_SECRET` (random 32+ character string so admin sessions stay valid across serverless instances)

