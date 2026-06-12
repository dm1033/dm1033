# Construct CV — Go-Live Guide (single-file site)

`standalone/index.html` is a complete, premium one-page website with every image embedded — no folders, no dependencies. You can open it by double-clicking, and host it anywhere.

**Domain: linkedinconstructioncvprofile.com**

---

## 1. Buy the domain — the simplest way (≈10 minutes, ~£10–£15/year)

Recommended registrar: **Namecheap** (cheap, simple, no aggressive upsells). GoDaddy works identically if you prefer it.

1. Go to **namecheap.com** → type `linkedinconstructioncvprofile.com` in the search box.
2. If available, click **Add to cart** → **Checkout**.
3. **Decline every add-on** except free WhoisGuard/privacy (keep that — it hides your home address from the public register). You do **not** need their hosting, SSL, email or "premium DNS" — all free elsewhere.
4. Create an account, pay (~£10–£15 for the first year), **turn on auto-renew** so you never lose the domain.
5. Done — you own it. Leave the DNS settings alone until step 2 below.

> 💡 While you're there, consider also buying `constructcv.co.uk` / `constructcv.com` (if available) to match the Construct CV brand — short domains are easier to say on the phone and print on cards. Extra domains can simply redirect to the main one (a one-click setting in any registrar).

## 2. Put the site live — the simplest way (free, ≈10 minutes)

**Netlify Drop** — no account needed to test, free forever at this scale:

1. Go to **app.netlify.com/drop**.
2. Drag the `standalone` folder (containing `index.html`) onto the page. Your site is instantly live at a temporary address like `random-name.netlify.app` — check it on your phone.
3. Create the free account when prompted (keeps the site permanent).
4. Connect your domain: **Domain settings → Add custom domain** → enter `linkedinconstructioncvprofile.com`.
5. Netlify shows you two DNS records. In Namecheap: **Domain List → Manage → Advanced DNS**, delete the parking records, add what Netlify shows (an `A` record `@ → 75.2.60.5` and a `CNAME` `www → your-site.netlify.app`).
6. Wait 10–60 minutes for DNS. **HTTPS/SSL switches on automatically and free** — never buy an SSL certificate.

That's it: `https://linkedinconstructioncvprofile.com` is live.

> **Later upgrade:** when you're ready for payments, the AI checker and the blog, deploy the full Next.js site in this repository to Vercel (see `docs/DEPLOYMENT.md`) and point the domain there instead. The single-file site is the perfect launch placeholder and brochure.

## 3. Email on the domain (optional, 5 minutes)

In Namecheap: **Domain → Email Forwarding** → forward `david@linkedinconstructioncvprofile.com` → `david@dmtecs.com`. Free, instant, and the address on your marketing looks the part.

---

## 4. Marketing support — first 14 days

Day-by-day detail lives in `docs/LAUNCH-PLAN-30-DAYS.md`; the short version for this single-pager:

1. **LinkedIn first — it's where your buyers are.** Update your headline and About using `docs/LINKEDIN-PLAN.md` (headline now: "Construction CV, LinkedIn & Career Coach | MSc | IEng (ICE) | PMI-CP | 26+ Years in Construction, Temporary Works, HV & Infrastructure"). Add the new domain to your profile's website field and Featured section.
2. **Announce** with the launch post (post #1 in the plan), linking the new domain. Then 4–5 posts/week from the 30-day calendar — all pre-written.
3. **Direct outreach:** message your 10 closest industry contacts personally; then 5 recruiter connections/day using the templates in `docs/MARKETING-COPY.md` §6.
4. **Email signature:** add "Construct CV — construction CVs & LinkedIn profiles · linkedinconstructioncvprofile.com" to every email you send (you already email contractors daily through DMTECS — free advertising).
5. **Cross-promote from your existing site:** add a banner/link on temporaryworksconsulting.com — "Need your CV to match your experience? → Construct CV". Your TW training delegates (SMSTS/TWC courses) are a warm audience — mention it at the end of every course.
6. **Capture proof:** offer 2–3 founding clients a reduced rate in exchange for honest, permissioned testimonials (request templates in `docs/MARKETING-COPY.md` §7) and add them to the page.

## 5. SEO support — what actually matters for this page

Already built into the file:
- Title, meta description and keywords targeting "construction CV", "civil engineer CV", "temporary works CV", "construction LinkedIn optimisation"
- Open Graph tags (clean previews when shared on LinkedIn/WhatsApp)
- Schema.org structured data (ProfessionalService + Person with your credentials) — helps Google understand who/what/where
- Canonical URL, semantic headings, descriptive image alt text, mobile-first layout, single fast request

Do after launch (≈30 minutes total):
1. **Google Search Console** (search.google.com/search-console): add the domain, verify via the DNS TXT record Namecheap lets you paste in, and request indexing of the homepage.
2. **Google Business Profile** (business.google.com): free listing — "Construct CV", career services, Norwich. Local searches ("CV writer Norwich") convert well.
3. **Bing Webmaster Tools**: one click to import from Search Console.
4. **Backlinks that are easy to get:** link from temporaryworksconsulting.com, your LinkedIn profile/company page, and any directory your consultancy is already in. A handful of real links beats anything bought.
5. **Honest expectations:** a one-page site will rank for your name and brand quickly; competitive terms like "construction CV writer" need the full blog-equipped Next.js site (50-article plan ready in `docs/BLOG-SEO-PLAN.md`). The single-pager's job is converting the traffic you send it from LinkedIn and outreach — which is where your first clients will come from anyway.

---

## Keeping the page updated

Edit `standalone/template.html` (readable version), then rebuild:

```bash
python3 - <<'EOF'
import base64
tpl = open("standalone/template.html").read()
for key in ["logo","hero","robot","ats","linkedin","cvdocs","coach","tablet","portfolio","site","pmi"]:
    b64 = base64.b64encode(open(f"/tmp/imgs/{key}.jpg","rb").read()).decode()
    tpl = tpl.replace("{{IMG:%s}}" % key, f"data:image/jpeg;base64,{b64}")
open("standalone/index.html","w").write(tpl)
EOF
```

(Or just edit `standalone/index.html` directly for text changes — search for the wording you want to change.) Re-drag the folder onto Netlify to publish.
