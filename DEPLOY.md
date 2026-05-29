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

## Placeholders to replace before publishing

| Placeholder | Where | Action |
|---|---|---|
| `REPLACE_WITH_FORM_ID` | `site/contact.njk` | Form endpoint |
| `£[insert]` | `site/weekly-support.njk` | Weekly tier fees |
| `[insert confirmed qualifications]` / `[insert memberships]` / `[insert confirmed experience years]` | `site/about.njk` | Only add what's evidenced |
| `og-default.jpg` | `static/img/` | Add a 1200×630 OG image |
| Privacy / Terms | `site/privacy.njk`, `site/terms.njk` | Review templates with your wording |

## Needs your confirmation

1. **Legal name.** Your current live site's schema says **"Temporary Works Design & Consulting LLC"**; your brief says **"Temporary Works Consulting & Design Ltd"**. I used the latter in `site/_data/site.json` — confirm the correct legal entity.
2. **Phone/email.** Reused from the live site: `david@temporaryworksconsulting.com`, `+44 7900 984900`. Confirm both.
3. **Ebook.** The current site sells the "Mastering Temporary Works" ebook (£29.99). It is **not** in this redesign — tell me if you want a page/section for it.
4. **Qualifications & memberships.** Left as placeholders — send the confirmed details to add.

## Post-launch SEO checklist

- Submit `https://www.temporaryworksconsulting.com/sitemap.xml` in Google Search Console + Bing Webmaster Tools.
- Validate the homepage and a service page in [Rich Results Test](https://search.google.com/test/rich-results) (expect ProfessionalService, WebSite, BreadcrumbList, Service, FAQPage).
- Run Lighthouse (mobile) on home, a service page, and contact.
- Add real `alt` text when you add imagery (currently text-led, so no missing-alt issues).
