# Temporary Works Consulting — Content & SEO Pack

Paste-ready content, metadata, schema and marketing assets for:

1. **temporaryworksconsulting.com** — main consultancy site
2. **bre470pilingmatdesign.com** — BRE 470 piling mat / working platform design tool

## Why this is a pack, not a code edit

The current repo contains no website source files (no HTML, no framework, no CMS export). Both live sites are hosted elsewhere. So this pack is structured for **direct copy-paste into whatever platform hosts the live sites** (Wix, Squarespace, WordPress, Webflow, Framer, custom HTML, etc.).

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
│   ├── organization-professionalservice.json
│   ├── website.json
│   ├── faqpage.json
│   ├── breadcrumblist-template.json
│   └── bre470-softwareapplication.json
├── technical-seo/
│   ├── sitemap.xml
│   ├── sitemap-bre470.xml
│   ├── robots.txt
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
3. Add the JSON-LD blocks from `schema/` into the page `<head>` (one per page, plus FAQPage on the FAQ page only).
4. Replace `sitemap.xml` and `robots.txt` on each live site with the versions in `technical-seo/`.
5. Work through `audit/live-site-audit-checklist.md` against the live sites and fix the items that apply.
6. Use `marketing/` and `blog-plan/` to start outbound and content marketing.

## Compliance notes

- No qualifications, accreditations, client names, or testimonials are invented in this pack.
- Engineering language is qualified: "supporting", "assisting", "designed in accordance with relevant principles", "subject to project-specific information".
- The BRE 470 tool is described as a practical aid, not a substitute for project-specific design.
