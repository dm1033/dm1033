# Temporary Works Consulting — Content & SEO Pack

Content, metadata, schema and marketing assets for:

1. **temporaryworksconsulting.com** — main consultancy site (GoDaddy cPanel)
2. **bre470pilingmatdesign.com** — BRE 470 piling mat / working platform design tool (Manus)

## Two ways to use this pack

### 1. Build to HTML with the included Eleventy scaffold (recommended for TWC)

The repo root has an Eleventy scaffold that builds the markdown in `pages/` into a static HTML site you can upload to GoDaddy cPanel's `public_html/`. From the repo root:

```sh
npm install
npm run build      # output goes to _site/
npm run serve      # local preview at http://localhost:8080
```

Then upload the contents of `_site/` to `public_html/` via cPanel File Manager (or rsync). Re-run `npm run build` after any content edit.

The scaffold reads YAML frontmatter from each `pages/*.md` file (title, description, canonical, permalink, schema_files) and applies the layout in `src/_includes/base.njk`, which injects `<title>`, meta description, canonical, Open Graph, Twitter cards and the JSON-LD blocks you list in `schema_files`.

### 2. Paste the markdown bodies into a CMS (use this for the Manus site)

Each `pages/*.md` file is also valid pasted body content. The YAML frontmatter at the top is delimited by `---` and can be skipped or removed for CMSs that don't parse it. Apply per-page metadata from `meta-tags/meta-tags.md` separately in the CMS's SEO settings.

## Contents

```
content-seo-pack/
├── pages/                  Page-by-page copy with H1/H2 structure
│   ├── homepage.md
│   ├── about.md
│   ├── contact.md
│   ├── faq.md
│   ├── temporary-works-design.md
│   ├── design-checking-cat-checks.md
│   ├── crane-piling-mat-design.md
│   ├── bre470-working-platform-design.md
│   ├── excavation-support-design.md
│   ├── hoarding-propping-shoring-design.md
│   ├── rams-itps-safety-documentation.md
│   ├── bs5975-temporary-works-consultancy.md
│   └── breeam-iso-management-systems.md
├── meta-tags/
│   └── meta-tags.md        SEO title, meta description, OG, Twitter, canonical for every page
├── schema/                 JSON-LD blocks to drop into <head>
│   ├── organization-professionalservice.json   (TWC homepage)
│   ├── website.json                            (TWC homepage)
│   ├── website-bre470.json                     (BRE 470 site homepage)
│   ├── faqpage.json                            (TWC /faq page only)
│   ├── breadcrumblist-template.json            (per-page template)
│   └── bre470-softwareapplication.json         (BRE 470 site homepage)
├── technical-seo/
│   ├── sitemap.xml                             (TWC)
│   ├── sitemap-bre470.xml                      (BRE 470 site)
│   ├── robots.txt                              (TWC)
│   ├── robots-bre470.txt                       (BRE 470 site)
│   └── technical-seo-checklist.md
├── marketing/
│   ├── linkedin-company-post.md
│   ├── linkedin-personal-david.md
│   ├── x-post.md
│   ├── google-business-profile.md
│   ├── email-outreach-template.md
│   ├── banner-ad-copy.md
│   └── blog-ideas-quick-5.md
├── blog-plan/
│   └── blog-content-plan-10.md
├── conversion/
│   └── conversion-improvements.md
└── audit/
    └── live-site-audit-checklist.md
```

## Placeholders to fill in before publishing

Search and replace these across the pack:

- `[CONTACT_EMAIL]` — David's contact email
- `[CONTACT_PHONE]` — Optional phone number, or remove
- `[BUSINESS_LOCATION]` — Town/city or "United Kingdom" if no public address
- `[YEAR_FOUNDED]` — Year the consultancy was founded (omit if unsure)
- `[LINKEDIN_URL]` — David's or the business's LinkedIn URL
- `[LOGO_URL]` — Absolute URL to the logo image (used in JSON-LD)

## How to use

1. Open each page file in `pages/` and paste the body into the equivalent live-site page.
2. Apply the metadata from `meta-tags/meta-tags.md` to each page's SEO settings.
3. Add the JSON-LD blocks from `schema/` into each page's `<head>`. Domain mapping:
   - **temporaryworksconsulting.com** — `organization-professionalservice.json` and `website.json` site-wide; `faqpage.json` on `/faq` only; `breadcrumblist-template.json` per non-home page.
   - **bre470pilingmatdesign.com** — `website-bre470.json` and `bre470-softwareapplication.json` on the homepage; `breadcrumblist-template.json` per non-home page (with the breadcrumb URLs adjusted to the bre470 domain).
4. Replace `sitemap.xml` and `robots.txt` on each live site with the right versions:
   - TWC → `technical-seo/sitemap.xml` and `technical-seo/robots.txt`
   - BRE 470 site → `technical-seo/sitemap-bre470.xml` (rename to `sitemap.xml` at that domain root) and `technical-seo/robots-bre470.txt` (rename to `robots.txt` at that domain root)
5. Work through `audit/live-site-audit-checklist.md` against the live sites and fix the items that apply.
6. Use `marketing/` and `blog-plan/` to start outbound and content marketing.

## Compliance notes

- No qualifications, accreditations, client names, or testimonials are invented in this pack.
- Engineering language is qualified: "supporting", "assisting", "designed in accordance with relevant principles", "subject to project-specific information".
- The BRE 470 tool is described as a practical aid, not a substitute for project-specific design.
