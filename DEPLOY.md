# Deployment & Configuration — temporaryworksconsulting.com

The premium redesign is an [Eleventy](https://www.11ty.dev/) static site under `site/`. It builds to plain HTML in `_site/`, which you upload to GoDaddy cPanel `public_html/`.

## Build

```sh
npm install        # one-off
npm run serve      # local preview at http://localhost:8080
npm run build      # outputs static HTML to _site/
```

## Source layout

```
site/
├── _data/            site.json, services.json, faqs.json, resources.json  (content)
├── _includes/        base.njk layout + header/footer/sticky-cta partials
├── services/detail.njk   one template → 9 service pages (data-driven)
├── index.njk         homepage
├── services.njk      services landing
├── weekly-support.njk, about.njk, case-studies.njk, resources.njk,
│   contact.njk, faq.njk, privacy.njk, terms.njk, 404.njk
├── sitemap.njk → /sitemap.xml
└── robots.njk  → /robots.txt
static/css/site.css   design system
static/js/main.js     mobile nav toggle
```

To edit content, change the `_data/*.json` files or the page `.njk` files and rebuild. Service pages are generated from `site/_data/services.json` — add an entry to add a page.

## Deploy to GoDaddy cPanel

1. `npm run build`.
2. cPanel → **File Manager** → `public_html/`.
3. Upload the **contents of `_site/`** (not the folder itself) — `index.html`, the section folders, `assets/`, `sitemap.xml`, `robots.txt`, `404.html`.
4. **Custom 404:** cPanel → **Error Pages** → 404 → point to `/404.html`, or add to `public_html/.htaccess`:
   ```apache
   ErrorDocument 404 /404.html
   ```
5. **Force HTTPS + canonical host** in `public_html/.htaccess`:
   ```apache
   RewriteEngine On
   RewriteCond %{HTTPS} !=on
   RewriteRule ^ https://www.temporaryworksconsulting.com%{REQUEST_URI} [L,R=301]
   RewriteCond %{HTTP_HOST} !^www\. [NC]
   RewriteRule ^ https://www.temporaryworksconsulting.com%{REQUEST_URI} [L,R=301]
   ```
6. cPanel → **SSL/TLS** → confirm a cert covers both `www` and apex.

> Optional: cPanel **Git Version Control** can clone this repo on the server; then a `.cpanel.yml` deploy step copies `_site/*` into `public_html/`. Ask if you want that wired up.

## Contact form backend (required before go-live)

The contact form (`site/contact.njk`) currently posts to a placeholder:
`action="https://formspree.io/f/REPLACE_WITH_FORM_ID"`. A static site can't send email by itself — pick one:

- **Formspree / Basin / FormSubmit (easiest):** create a free form, paste the endpoint into the `action`, rebuild. No server code.
- **GoDaddy PHP mailer:** rename `contact.njk` output to a PHP handler and use cPanel's mail. Heavier; ask if you want a PHP version generated.

Until configured, the **Email David** and **Call** buttons (mailto/tel) work as a fallback.

## Company facts now in the site (from your incorporation documents)

These are set in `site/_data/site.json` and shown in the footer, About page and schema:

- **Legal name:** Temporary Works Consulting & Design Ltd & LLC
- **UK company:** Temporary Works Consulting & Design Ltd — **No. 17198188**, incorporated **5 May 2026**, England & Wales
- **Registered office:** 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ
- **Director:** David Miller

**US entity:** Temporary Works Design & Consulting LLC — a **Delaware, USA** single-member LLC formation, held to support international tendering. Presented as a *formation only* (per your instruction), shown in the footer and the About page's "International capability" section.

**Deliberately NOT published** (confidential): date of birth, residential address, the LLC's **EIN (36-5172938)**, and the formation-agent details. Do not add these to the public site.

## Build output

`npm run build` now produces **minified HTML** (comments and redundant whitespace removed, inline CSS minified). JSON-LD `<script>` blocks are preserved verbatim (`minifyJS: false`), so structured data is untouched. Output is in `_site/` ready to upload to `public_html/`.

## Engagement contract template

A draft engagement contract for use with clients is at `legal/Engagement-Contract-Template.md`. It is a **starting template** — have a solicitor review it before using on a live project. The fee/PI/cap amounts and signing details are left as placeholders.

## Add your logos

I wired a logo slot but you didn't attach image files (the two logos showed inline only). To use them:

1. Save the badge logo as `static/img/logo.png` (and the LLC monogram as `static/img/logo-llc.png` if you want it elsewhere).
2. In `site/_data/site.json` set `"hasLogo": true`.
3. Add a 1200×630 social image as `static/img/og-default.jpg`.
4. Rebuild. Until `hasLogo` is true, the header shows the text wordmark (no broken image).

## Placeholders to replace before publishing

| Placeholder | Where | Action |
|---|---|---|
| `REPLACE_WITH_FORM_ID` | `site/contact.njk` | Form endpoint |
| `£[insert]` | `site/weekly-support.njk` | Weekly tier fees |
| `[confirm insurer & cover limits]` | `site/about.njk` | Insurance specifics |
| `[add your confirmed qualifications]` / memberships / experience | `site/about.njk` | Only add what's evidenced |
| `og-default.jpg`, `logo.png` | `static/img/` | Add image files |
| Privacy / Terms | `site/privacy.njk`, `site/terms.njk` | Review templates with your wording |

## Needs your confirmation

1. **"Fully insured".** You've told me the business is fully insured, and the site now states this. The documents you sent prove incorporation, not insurance — please make sure a current insurance certificate is on file and fill in the insurer/cover limits placeholder on the About page. (I did not invent an insurer or amounts.)
2. **Qualifications.** You asked to highlight your qualifications but didn't send specifics. The About page has a placeholder block — send your confirmed qualifications/memberships and I'll add them. I won't invent any.
3. **LLC details.** The site names the dual "Ltd & LLC" structure. If the LLC has its own registration/jurisdiction you want shown, send it.
4. **Sister sites.** Updated to: bre470pilingmatdesign.com, temporaryworkstoolbox.com, **visualscaffolddesign.com** (replaced scaffolddesignvisualiser.com). Confirm these are correct.
5. **Ebook.** Now advertised: homepage promo + a dedicated `/ebook/` page (£29.99, buy-by-email). Add a real checkout link when ready.

## Post-launch SEO checklist

- Submit `https://www.temporaryworksconsulting.com/sitemap.xml` in Google Search Console + Bing Webmaster Tools.
- Validate the homepage and a service page in [Rich Results Test](https://search.google.com/test/rich-results) (expect ProfessionalService, WebSite, BreadcrumbList, Service, FAQPage).
- Run Lighthouse (mobile) on home, a service page, and contact.
- Add real `alt` text when you add imagery (currently text-led, so no missing-alt issues).
