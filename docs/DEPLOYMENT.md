# Deployment Guide

The site is a standard Next.js 15 app that prerenders every page (all routes are static). Recommended host: **Vercel** (zero-config for Next.js). Netlify works equally well. GoDaddy shared hosting can serve a static export but is the least convenient option.

## Prerequisites
- The GitHub repository containing this code
- A domain (e.g. from GoDaddy — see "Custom domain" below)

## Option 1 — Vercel (recommended)
1. Sign up at https://vercel.com with your GitHub account.
2. **Add New → Project** → import this repository.
3. Framework preset: Next.js (auto-detected). No environment variables needed.
4. Deploy. You get `https://your-project.vercel.app` in ~2 minutes.
5. Every push to the production branch auto-deploys; pull requests get preview URLs.

## Option 2 — Netlify
1. Sign up at https://netlify.com → **Add new site → Import an existing project** → pick the repo.
2. Build command: `npm run build`. Netlify's Next.js runtime is auto-detected.
3. Deploy. (If you prefer Netlify Forms over Formspree, see the forms guide.)

## Option 3 — GoDaddy (static hosting)
GoDaddy shared hosting can't run Next.js itself, but this site can be exported as plain HTML:
1. In `next.config.ts` add `output: "export"` and run `npm run build` — static files land in `out/`.
2. Upload the contents of `out/` to GoDaddy's `public_html` via cPanel File Manager or FTP.
3. Re-upload after every change. (This is why Vercel/Netlify are recommended — even with a GoDaddy domain, host the site on Vercel and just point the domain at it.)

## Custom domain + SSL
With a domain bought at GoDaddy (or anywhere):
1. In Vercel/Netlify: Project → **Domains** → add `yourdomain.com` and `www.yourdomain.com`.
2. In GoDaddy DNS management, add the records the host shows you — typically an `A` record for the apex (Vercel: `76.76.21.21`) and a `CNAME` for `www` (e.g. `cname.vercel-dns.com`).
3. Wait for DNS propagation (minutes to a few hours). **SSL is automatic and free** on both hosts — no certificate purchase needed; don't buy GoDaddy's SSL upsell.
4. Update `url` in `src/lib/site.ts` to the real domain (used for sitemap/SEO), then redeploy.

## Pre-launch checklist (in code)
- [ ] `src/lib/site.ts`: real domain in `url`
- [ ] `src/lib/site.ts`: real Stripe Payment Links (see STRIPE-SETUP.md)
- [ ] `src/lib/site.ts`: real Formspree IDs + Calendly link (see FORMS-AND-BOOKING-SETUP.md)
- [ ] `src/lib/site.ts`: real prices in `prices`
- [ ] Credentials wording confirmed (About page / site.ts founder credentials)
- [ ] Legal pages: fill bracketed placeholders, set "last updated" dates, get them reviewed
- [ ] Replace `ImagePlaceholder` components with real photography (hero, headshot, etc.)
- [ ] Replace placeholder PDFs in `public/downloads/` with designed versions (optional at launch)

## Analytics
Two good options:
- **Plausible / Fathom** (paid, cookie-free, GDPR-simple): add their one-line script to `src/app/layout.tsx`; no consent banner changes needed.
- **Google Analytics 4** (free): only load it after the user clicks "Accept" on the cookie banner. The banner already stores the choice in `localStorage` under `cce-cookie-consent` — gate the GA script on that value. Update the Cookie Policy page with the cookies used.

## Google Search Console + sitemap
1. https://search.google.com/search-console → **Add property** → Domain → verify via the DNS TXT record (added in GoDaddy DNS).
2. The sitemap is generated automatically at `https://yourdomain.com/sitemap.xml` (and robots.txt at `/robots.txt`).
3. In Search Console: **Sitemaps** → submit `sitemap.xml`.
4. Request indexing of the homepage and key service pages.
5. Also register with Bing Webmaster Tools (imports from GSC in one click).

## Local development
```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (also catches type errors)
npm run pdfs       # regenerate placeholder lead-magnet PDFs
```
