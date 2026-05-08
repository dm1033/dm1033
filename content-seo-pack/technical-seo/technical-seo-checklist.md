# Technical SEO Checklist — Both Live Sites

Run this against the live sites. Most items can be checked free with: Chrome DevTools → Lighthouse, Google Search Console, [PageSpeed Insights](https://pagespeed.web.dev/), [Screaming Frog SEO Spider (free up to 500 URLs)](https://www.screamingfrog.co.uk/seo-spider/).

## 1. Indexing & crawl

- [ ] Each domain is verified in Google Search Console.
- [ ] Sitemap submitted in Search Console (`/sitemap.xml`).
- [ ] `robots.txt` allows crawl, points to sitemap, and does not block important paths.
- [ ] No accidental `noindex` on important pages (check `<meta name="robots">` and HTTP headers).
- [ ] Canonical URL on every page matches the page's preferred URL (no http vs https or www vs non-www mismatch).
- [ ] HTTPS enforced; HTTP redirects 301 to HTTPS.
- [ ] Single canonical host: pick `www.` or non-`www.` and 301 the other.

## 2. On-page SEO

- [ ] Every page has a unique `<title>` (50–60 chars).
- [ ] Every page has a unique `<meta name="description">` (140–160 chars).
- [ ] Exactly one `<h1>` per page.
- [ ] Heading hierarchy is sensible (H1 → H2 → H3, no jumps).
- [ ] Internal links between related service pages (already drafted in each page file).
- [ ] No orphaned pages (every important page is linked from somewhere in main nav, footer or related-service section).
- [ ] No duplicate content between pages — each service page is meaningfully different.

## 3. Schema / structured data

- [ ] ProfessionalService / EngineeringService JSON-LD on the homepage of `temporaryworksconsulting.com`.
- [ ] WebSite JSON-LD on the homepage of each domain.
- [ ] FAQPage JSON-LD only on the FAQ page (don't duplicate elsewhere).
- [ ] BreadcrumbList JSON-LD on every page that sits below the homepage.
- [ ] SoftwareApplication JSON-LD on the homepage of `bre470pilingmatdesign.com`.
- [ ] Validate every block in the [Schema.org Validator](https://validator.schema.org/) and Google's [Rich Results Test](https://search.google.com/test/rich-results).

## 4. Images

- [ ] All meaningful `<img>` elements have descriptive `alt` text (e.g. "BRE 470 piling mat layout under a CFA piling rig", not "image1").
- [ ] Decorative images use empty `alt=""` so screen readers skip them.
- [ ] Images are compressed (WebP / AVIF where supported, JPEG otherwise) — target <200 KB each.
- [ ] Images include `width` and `height` attributes to prevent layout shift.
- [ ] `loading="lazy"` on images below the fold.
- [ ] Hero / OG image is 1200×630 for proper Open Graph display.

## 5. Performance

- [ ] Lighthouse mobile **Performance ≥ 80**, **Accessibility ≥ 95**, **Best Practices ≥ 95**, **SEO ≥ 95**.
- [ ] LCP under 2.5 s on mobile.
- [ ] CLS below 0.1.
- [ ] Defer non-critical JS / CSS where possible.
- [ ] No render-blocking third-party scripts in the head where avoidable.
- [ ] Use a CDN / caching where the host supports it.

## 6. Mobile & accessibility

- [ ] Site is fully responsive (no horizontal scroll on common mobile widths: 360, 390, 414 px).
- [ ] Tap targets are ≥ 44 px (especially nav links and CTAs).
- [ ] Forms are usable on mobile (correct `inputmode`, `autocomplete` attributes).
- [ ] Colour contrast meets WCAG AA (4.5:1 for body text).
- [ ] Skip-to-content link present.
- [ ] All interactive elements are keyboard-accessible.

## 7. Internal links & broken links

- [ ] Run a Screaming Frog crawl on each domain — fix any 404s.
- [ ] No 302s where 301s would be correct (e.g. trailing-slash redirects).
- [ ] Redirect chains (>1 hop) eliminated.
- [ ] External links to relevant authoritative sources (BS, BRE, TWf, CIRIA) where cited use `rel="noopener"` if `target="_blank"`.

## 8. Cross-site linking

- [ ] Every page on `temporaryworksconsulting.com` that mentions BRE 470 or piling mats links to `bre470pilingmatdesign.com`.
- [ ] `bre470pilingmatdesign.com` has at least one prominent link back to `temporaryworksconsulting.com` (in nav, footer, or About).
- [ ] Both domains list each other in `sameAs` of their JSON-LD.

## 9. Analytics & ownership

- [ ] Google Search Console verified for both domains.
- [ ] Bing Webmaster Tools verified for both domains.
- [ ] Analytics in place (Google Analytics 4, Plausible or similar) — check it's not double-loading.
- [ ] Cookie / privacy notice if analytics or marketing cookies are used.

## 10. Content hygiene

- [ ] No "Lorem ipsum" or template placeholder text live anywhere.
- [ ] No `[CONTACT_EMAIL]` or other placeholder tokens left from this pack.
- [ ] Year in copyright is current.
- [ ] Privacy policy page present.
- [ ] Cookies policy page present (if any non-essential cookies are used).
