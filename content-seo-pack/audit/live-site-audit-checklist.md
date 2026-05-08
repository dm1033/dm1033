# Live-Site Audit Checklist

**Important:** the source files for the live websites are not in this repo, so this is a checklist to run **against the live sites** rather than findings about specific files. Work through this on each domain.

The fixes you'll make will mostly be paste-jobs from the rest of this pack:
- New / improved page copy → from `pages/`
- Per-page metadata → from `meta-tags/meta-tags.md`
- Schema blocks → from `schema/`
- Sitemap and robots → from `technical-seo/`

---

## Phase 1 — Discovery (do once, ~30 minutes per site)

### 1.1 Map the existing structure
- [ ] Crawl each domain with [Screaming Frog SEO Spider (free, ≤500 URLs)](https://www.screamingfrog.co.uk/seo-spider/).
- [ ] Export the crawl. Note:
  - Total indexed pages
  - Page titles, descriptions, H1s
  - 404s, 301s, 302s
  - Pages with missing or duplicate `<title>`
  - Pages with missing or duplicate `<meta name="description">`
  - Pages with missing or multiple `<h1>`
  - Pages without canonical URLs
  - Internal-link counts (orphans / hubs)

### 1.2 Verify in Google
- [ ] `site:temporaryworksconsulting.com` — note pages indexed by Google.
- [ ] `site:bre470pilingmatdesign.com` — same.
- [ ] Compare against Screaming Frog crawl. Pages crawled but not indexed are a flag.

### 1.3 Search Console & Bing Webmaster
- [ ] Both domains verified in Google Search Console.
- [ ] Both domains verified in Bing Webmaster Tools.
- [ ] Sitemaps submitted in both.
- [ ] Coverage report reviewed (any "Excluded" / "Error" pages noted).

### 1.4 Lighthouse / PageSpeed
- [ ] Run Lighthouse (mobile) on the homepage, one service page, and the FAQ page.
- [ ] Record Performance / Accessibility / Best Practices / SEO scores.
- [ ] Note Core Web Vitals: LCP, CLS, INP.

---

## Phase 2 — Compare against this pack

For each page on the live site:

### 2.1 Information architecture
- [ ] Does the live site have all 9 service pages from `pages/`? If not, list what's missing.
- [ ] Are the URLs sensible and lower-case-hyphenated (e.g. `/services/temporary-works-design`)?
- [ ] Is there a single canonical FAQ page, About page and Contact page?

### 2.2 Page-level SEO
For each page, check against `meta-tags/meta-tags.md`:
- [ ] `<title>` matches (or is at least equivalent in keyword target).
- [ ] `<meta name="description">` present and unique.
- [ ] Canonical URL set.
- [ ] OG title, description and image set.
- [ ] Twitter card set.

### 2.3 Headings and copy
- [ ] Exactly one `<h1>` matching the page topic.
- [ ] H2 structure roughly mirrors the page file in `pages/`.
- [ ] No copy that is overstated (e.g. "guarantees compliance", "industry-leading") — replace with cautious wording.
- [ ] No content claiming clients, accreditations or testimonials that aren't real.

### 2.4 Schema
- [ ] ProfessionalService / EngineeringService JSON-LD on the homepage of `temporaryworksconsulting.com` (`schema/organization-professionalservice.json`).
- [ ] WebSite JSON-LD per domain — `schema/website.json` on TWC, `schema/website-bre470.json` on the BRE 470 site (these are different entities; do not share one file).
- [ ] FAQPage JSON-LD on the FAQ page.
- [ ] BreadcrumbList JSON-LD on every non-homepage page.
- [ ] SoftwareApplication JSON-LD on the homepage of `bre470pilingmatdesign.com`.
- [ ] All blocks pass [Rich Results Test](https://search.google.com/test/rich-results).

### 2.5 Cross-site linking
- [ ] Every BRE 470 / piling mat / working platform / crane mat mention on the consultancy site links to `bre470pilingmatdesign.com`.
- [ ] The tool site links back to the consultancy site at least in nav / footer / About.

---

## Phase 3 — Fix list (typical findings on small consultancy sites)

These are the issues that show up most often on similar small-consultancy websites. Run through the list and tick each off as you confirm the live site is or isn't affected.

### Likely SEO findings
- [ ] Title tag is just the business name on every page (no keyword targeting).
- [ ] Meta description missing on some / all pages.
- [ ] More than one H1 on the homepage.
- [ ] Service offers listed as a single bullet list rather than dedicated pages.
- [ ] Internal links inconsistent (different service pages have different nav).
- [ ] Mixed use of `www.` and non-`www.`, or http and https.
- [ ] No FAQ page.
- [ ] No structured data.
- [ ] Sitemap missing or out of date.
- [ ] `robots.txt` missing or accidentally blocking pages.

### Likely content findings
- [ ] Vague service descriptions ("we provide engineering solutions").
- [ ] Long paragraphs without sub-headings.
- [ ] Few or no calls to action.
- [ ] Contact form buried below the fold.
- [ ] No clear referral from the consultancy site to the BRE 470 tool.
- [ ] BRE 470 tool described in a way that overstates its scope.

### Likely technical findings
- [ ] Hero image > 500 KB.
- [ ] Images without `alt` text.
- [ ] No favicon / no apple-touch-icon.
- [ ] No 404 page customisation (uses host default).
- [ ] No HTTPS redirect (or only partial).
- [ ] No accessibility considerations (low-contrast text, small tap targets).

---

## Phase 4 — Apply changes

Sequence:

1. **Content** — Replace each page's body with the corresponding file in `pages/`, adjusted for your CMS layout.
2. **Metadata** — Apply each page's title / description / canonical / OG / Twitter from `meta-tags/meta-tags.md`.
3. **Schema** — Add JSON-LD blocks from `schema/` into each page's `<head>` (or your CMS's "custom code" slot).
4. **Sitemap & robots** — Replace per domain: `technical-seo/sitemap.xml` + `technical-seo/robots.txt` on `temporaryworksconsulting.com`; `technical-seo/sitemap-bre470.xml` + `technical-seo/robots-bre470.txt` on `bre470pilingmatdesign.com` (rename to `sitemap.xml` / `robots.txt` at that domain root).
5. **Cross-site linking** — Add tool callouts and cross-site footer links per `conversion/conversion-improvements.md`.
6. **Conversion** — Apply CTAs, footer, contact-form changes from `conversion/conversion-improvements.md`.
7. **Submit** — Re-submit each sitemap in Google Search Console and Bing Webmaster Tools.

---

## Phase 5 — Verification (1–2 weeks after launch)

- [ ] Re-run Screaming Frog — confirm no 404s, no missing metadata.
- [ ] Re-run Lighthouse on homepage / service / FAQ — confirm SEO score ≥ 95.
- [ ] Check Search Console "Coverage" report for new errors.
- [ ] Confirm rich results in Google's Rich Results Test for FAQPage, BreadcrumbList, ProfessionalService.
- [ ] Confirm enquiry form is delivering to the inbox (test from an external address).
- [ ] Review first month of Search Console "Performance" — note any new keywords appearing.

---

## Recommended next actions (priority order)

1. Decide the canonical host (www vs non-www) and force redirect.
2. Apply per-page metadata from `meta-tags/meta-tags.md`.
3. Add the ProfessionalService and WebSite JSON-LD blocks.
4. Replace homepage and the 9 service pages with the copy in `pages/`.
5. Publish FAQ page with FAQPage JSON-LD.
6. Replace `sitemap.xml` and `robots.txt`.
7. Apply cross-site linking and the BRE 470 tool callouts.
8. Set up Google Business Profile per `marketing/google-business-profile.md`.
9. Schedule the first three blog posts from `blog-plan/blog-content-plan-10.md`.
10. Start a regular outreach cadence using `marketing/email-outreach-template.md` and the LinkedIn variants.
