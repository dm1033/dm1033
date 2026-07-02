# Conversion Improvements

Practical changes to make both sites convert visitors into enquiries. Apply once the page content above is in place.

---

## 1. Calls to action

### Primary CTA hierarchy (every page)
1. **Request a Quote** — links to `/contact` form
2. **Email David** — `mailto:[CONTACT_EMAIL]`
3. **Try the BRE 470 Tool** — links to `bre470pilingmatdesign.com` (where BRE 470 / piling / cranes / working platforms are mentioned)

### Where CTAs must appear
- Above the fold on the homepage
- At the end of every service page (paired primary + secondary)
- In the sticky header (or sticky bottom bar on mobile)
- In the footer
- After the FAQ section on every page that has one
- After every blog post

### CTA wording (use the imperative, single ask)

✅ Good:
- "Request a Quote"
- "Email David"
- "Send a Brief"
- "Try the BRE 470 Tool"

❌ Avoid:
- "Get in touch" (vague)
- "Submit" (form button — use "Request a Quote" instead)
- "Click here" (unhelpful and bad for accessibility)

---

## 2. Contact form

### Reduce friction
- 5–8 fields max. Anything more loses people.
- Mark only Name, Email and Message as required.
- Allow file attachments (drawings, GI extract).
- Include a "Type of support required" multi-select to qualify enquiries fast.
- Add a single-line privacy acknowledgement, not a wall of text.

### Reassure
- Add this short line under the form:
  > "Enquiries are reviewed personally by David. A fee proposal usually follows within 1 UK working day."

### Confirm
- Show a clear thank-you message after submission (or redirect to `/contact/thanks`) with what happens next.
- Send an immediate auto-acknowledgement email containing what was submitted, plus David's direct email.

---

## 3. Trust-building service statements

Add a "Why work with Temporary Works Consulting" strip to the homepage and to every service page:

- **Specialist focus.** Temporary works is the core service — not an add-on.
- **Direct engineer contact.** David handles design and checking personally.
- **Responsive turnaround.** Set up for short-notice and overflow work.
- **UK and international.** Experience across both.
- **Practical, construction-focused.** Designs are written to be built.
- **In accordance with relevant standards.** BS 5975:2024, Eurocodes, BRE 470, TWf and CIRIA guidance, applied as relevant to each project.

> **Compliance:** do not turn these into accreditation claims (e.g. "BSI-certified", "ISO-accredited") unless you actually hold the certification. The wording above is positioning, not a claim of certification.

---

## 4. Service cards (homepage and services index)

A consistent card pattern across the site helps scanning.

Each card:
- **Title** (matches service page H1)
- **One-line value statement** (≤ 100 chars)
- **3-bullet "what's covered"**
- **CTA: Read more →**

Example:

> ### Temporary Works Design
> Calculations, drawings and design briefs — written to be built.
> - Falsework, formwork, propping, shoring
> - Working platforms (BRE 470)
> - Excavation support
>
> [Read more →](/services/temporary-works-design)

---

## 5. Footer (suggested)

Three columns, then a baseline.

**Column 1 — Services**
Links to all 9 service pages.

**Column 2 — Company**
- About
- FAQ
- Contact
- Privacy policy
- Cookies policy

**Column 3 — Sites & Contact**
- temporaryworksconsulting.com
- bre470pilingmatdesign.com
- [CONTACT_EMAIL]
- [LINKEDIN_URL]

**Baseline**
- "© [YEAR] Temporary Works Consulting. All rights reserved."
- "Designs are produced in accordance with relevant standards and principles, subject to project-specific information."

---

## 6. Cross-site referrals

### From temporaryworksconsulting.com → bre470pilingmatdesign.com
- Link from the homepage hero / mid-page banner.
- Link from the BRE 470 service page (multiple natural places).
- Link from the crane/piling mat service page.
- Link from blog posts on BRE 470, piling mats and crane mats.
- Link from the footer of every page.

### From bre470pilingmatdesign.com → temporaryworksconsulting.com
- Header link: "Project-specific design"
- Below the tool result: "Need a project-specific BRE 470 design or CAT 3 check? See temporaryworksconsulting.com →"
- Footer link on every page.
- About / How-it-works page link.

---

## 7. Speed wins (first 5 to do)

1. Compress and convert hero image to WebP / AVIF.
2. Set explicit `width` and `height` on every `<img>`.
3. Add `loading="lazy"` to images below the fold.
4. Defer non-critical third-party scripts.
5. Replace any "Google Fonts in the head" with `font-display: swap` and preconnect.

---

## 8. Quick A/B ideas (once traffic supports it)

- Hero headline: "Specialist Temporary Works Design" vs. "Temporary Works Design — UK & International"
- CTA label: "Request a Quote" vs. "Send a Brief"
- Form length: 5 fields vs. 8 fields
- Tool callout placement: above-the-fold strip vs. mid-page band

Don't run more than one test at a time, and don't bother until enquiries are in the dozens per month.
