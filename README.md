# Construction Career Edge

> CVs, LinkedIn Profiles and Career Coaching for Construction Professionals
> *Construction CVs, LinkedIn Profiles and Career Coaching — Built by a Civil Engineer Who Understands the Industry*

A complete, live-ready website + marketing system for the construction CV / LinkedIn / career-coaching business led by David Miller — MSc Construction Management, PMI-CP, IEng (Institution of Civil Engineers), 29 years in civil engineering, construction management, temporary works, HV infrastructure, safety, training and consultancy.

**Live domain:** [linkedinconstructioncvprofile.com](https://linkedinconstructioncvprofile.com) (configured in `src/lib/site.ts`).

## Quick start

```bash
npm install
npm run dev      # → http://localhost:3000
npm run build    # production build
npm run pdfs     # regenerate placeholder lead-magnet PDFs
```

## Stack
Next.js 15 (App Router, fully static output) · TypeScript · Tailwind CSS 4 · Stripe Payment Links · Formspree forms · Calendly booking. **No backend, no secrets in the codebase.**

## Start here
1. **`docs/SETUP-GUIDE.md`** — master setup guide + repository map
2. **`src/lib/site.ts`** — every launch placeholder (Stripe links, forms, prices, credentials)
3. **`docs/INFO-NEEDED.md`** — what David still needs to provide

## Documentation
| File | Contents |
|---|---|
| `docs/SETUP-GUIDE.md` | Master guide, repo map, compliance posture, upgrade path |
| `docs/STRIPE-SETUP.md` | Products, Payment Links, success-page flow, testing |
| `docs/FORMS-AND-BOOKING-SETUP.md` | Formspree (incl. CV upload), Calendly, notifications |
| `docs/DEPLOYMENT.md` | Vercel / Netlify / GoDaddy, domain, SSL, analytics, Search Console |
| `docs/BLOG-SEO-PLAN.md` | 50 articles with keywords, intent, meta, CTA, internal links |
| `docs/MARKETING-COPY.md` | Headlines, social posts, LinkedIn posts, emails, outreach, scripts |
| `docs/EMAIL-FUNNELS.md` | Lead-magnet sequence + customer onboarding sequence (full copy) |
| `docs/LINKEDIN-PLAN.md` | David's profile copy, 30 days of posts, recruiter networking plan |
| `docs/LAUNCH-PLAN-30-DAYS.md` | Day-by-day launch plan |
| `docs/INFO-NEEDED.md` | Outstanding decisions and information |

## Brand name
Working placeholder: **Construction Career Edge**. Shortlist considered: Construction CV Doctor · Built Environment Careers · Site to Senior · Construction Profile Pro · Civil Engineering Career Coach · The Construction CV Consultant · Contractor Career Coach · Engineering Career Edge. To rename: update `src/lib/site.ts` (`name`, `tagline`) and the logo initials in `Header.tsx`/`Footer.tsx`.

## Compliance commitments (baked into the site)
- No guaranteed interviews, offers, ATS passes, AI approval or salary increases — anywhere.
- Compliant vocabulary throughout: ATS-aware, recruiter-readable, keyword-aligned, structured for screening systems; "cannot guarantee selection"; "final hiring decisions remain with employers and recruiters".
- No unethical techniques promoted: no hidden text, keyword stuffing, fake qualifications/experience/titles/values/references, or AI-deception tricks.
- The free ATS checker is explicitly advisory, never pass/fail, and runs entirely in the visitor's browser (no CV upload).
- Consent checkbox required on CV uploads; GDPR-oriented privacy, retention and deletion commitments.
- Testimonials only when real and permissioned.
