# Information Still Needed From David

Items required to take the site from build-complete to launch-ready.

## Critical (blocks launch)
1. ~~**Credential wording**~~ ✅ RESOLVED: IEng (Institution of Civil Engineers), PMI-CP, MSc Construction Management. Tech IOSH removed at David's instruction. Optional: awarding university for the MSc if you want it displayed.
2. **Brand name decision** — "Construction Career Edge" is the working brand name. ✅ Domain decided: **linkedinconstructioncvprofile.com** (already set in `src/lib/site.ts`). Confirm whether the displayed brand name stays "Construction Career Edge" or should change to match the domain.
3. **Prices** — real figures for all 9 price points in `src/lib/site.ts` (`prices`), including the new CV + LinkedIn Bundle. (Premium AI Access is already priced: £200/12mo, £20/month — coded in `src/app/api/stripe/checkout/route.ts`.)
4. **Business legal details** — trading name / company number (if any), registered address, jurisdiction for terms (England & Wales assumed).
5. **Stripe account** — set up by you (identity verification required); then the 6 Payment Links.
6. **Business email address** — currently david@dmtecs.com; confirm or provide the new domain mailbox.

## Important (launch week)
7. **Photography** — professional headshot + 2–4 site/industry images you own or have licensed.
8. **Formspree + Calendly accounts** — created under your email (5 minutes each).
9. **Data retention periods** — confirm the bracketed values in the privacy policy (suggested: CV files 90 days post-delivery; enquiries 12 months).
10. **Phone number** — display one or leave hidden (currently hidden).
11. **LinkedIn profile URL** — for the contact page and footer.

## Soon after launch
12. **Legal review** — privacy/terms/disclaimer/refund/cookie pages reviewed by a qualified adviser.
13. **Real testimonials** — collected with permission as first clients complete (templates ready).
14. **Designed lead-magnet PDFs** — current PDFs are functional placeholders generated from `content/lead-magnets/*.md`; a designer (or Canva) can brand them properly.
15. **Coaching call durations/structure** — confirm 45 vs 60 minutes and whether both are offered.
16. **Urgent turnaround offer** — do you offer it, at what premium?
17. ~~**Analytics choice**~~ ✅ BUILT: consent-gated GA4 is integrated — just set `NEXT_PUBLIC_GA_ID` (or leave unset for no analytics). Swap to Plausible later if preferred.
