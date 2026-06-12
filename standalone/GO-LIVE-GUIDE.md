# Construct CV — Go-Live Guide (single-file site)

`standalone/index.html` is a complete, premium one-page website with every image embedded — no folders, no dependencies. You can open it by double-clicking, and host it anywhere.

**Domain: linkedinconstructioncvprofile.com**

---

## 1. Buy the domain on GoDaddy (≈10 minutes, ~£10–£20 first year)

1. Go to **godaddy.com** (it should show GBP; if not, set United Kingdom in the footer).
2. Type `linkedinconstructioncvprofile.com` in the big search box → if available, **Add to Cart**.
3. **Continue to Cart** — now decline the upsells GoDaddy will push at you:
   - **Full domain privacy upgrade** — NO. Basic privacy is already included free on .com domains and hides your home address.
   - **Website builder / hosting bundle** — NO (hosting is free elsewhere, step 2).
   - **Professional email trial** — NO (free forwarding instead, step 3).
   - **SSL certificate** — NO, never buy SSL; it's automatic and free with the hosting below.
   - **Extra years / "deluxe" anything** — NO; 1 year with auto-renew is fine.
4. Set the term to **1 year**, create your GoDaddy account (use david@dmtecs.com), pay.
5. After purchase: **My Account → Domains** → click the domain → make sure **Auto-renew is ON** (so you never lose it; renewal is pricier than year one — that's normal for GoDaddy).
6. Done — you own it. Leave DNS alone until step 2.

> 💡 While you're in the search box, also check `constructcv.co.uk` / `constructcv.com` to match the Construct CV brand — short domains are easier to say on the phone. Extras can simply redirect to the main domain (GoDaddy: Domain Settings → Forwarding).

## 2. Put the site live — free hosting + GoDaddy DNS (≈10 minutes)

GoDaddy's own hosting costs ~£7+/month and is overkill for one file. Host free on **Netlify** and point the GoDaddy domain at it:

1. Go to **app.netlify.com/drop**.
2. Drag the `standalone` folder (containing `index.html`) onto the page. The site is instantly live at a temporary address like `random-name.netlify.app` — check it on your phone.
3. Create the free Netlify account when prompted (keeps the site permanent).
4. In Netlify: **Domain settings → Add custom domain** → enter `linkedinconstructioncvprofile.com` (choose "add domain" — you're keeping DNS at GoDaddy).
5. In GoDaddy: **My Account → Domains → your domain → DNS** (or "Manage DNS"). Edit the records:
   - Find the existing **A record** with name `@` (GoDaddy's "Parked" record) → **Edit** → change Value/Points-to to **`75.2.60.5`** → Save.
   - Find the **CNAME** with name `www` → **Edit** → change Value to **`your-site-name.netlify.app`** (the exact address Netlify gave you) → Save. If there's no www CNAME, **Add New Record** → Type CNAME, Name `www`, Value `your-site-name.netlify.app`.
   - Delete any other A records on `@` if GoDaddy added several parking ones.
6. Back in Netlify, wait for the domain check to go green (10–60 minutes, occasionally longer). **HTTPS/SSL switches on automatically and free.**

That's it: `https://linkedinconstructioncvprofile.com` is live.

> **All-GoDaddy alternative** (if you'd rather pay to keep everything in one account): buy GoDaddy **Web Hosting (Economy)**, open **cPanel → File Manager → public_html**, upload `index.html`, and enable the free SSL in the hosting dashboard. Works fine — just costs ~£80+/year for what Netlify does free.

> **Later upgrade:** when you're ready for payments, the AI checker and the blog, deploy the full Next.js site in this repository to Vercel (see `docs/DEPLOYMENT.md`) and repoint the same two DNS records at Vercel instead. The single-file site is the perfect launch placeholder and brochure.

## 3. Email on the domain (optional, 5 minutes, free)

GoDaddy includes free forwarding: **Domains → your domain → DNS → Forwarding → Email** (or Products → Email Forwarding) → create `david@linkedinconstructioncvprofile.com` → forward to `david@dmtecs.com`. The address on your marketing looks the part; replies still come from your normal inbox. (Decline the Microsoft 365 upsell unless you actually want a separate mailbox.)

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
for key in ["logo","hero","robot","ats","linkedin","cvdocs","coach","tablet","portfolio","site","pmi","twlogo","villa"]:
    b64 = base64.b64encode(open(f"/tmp/imgs/{key}.jpg","rb").read()).decode()
    tpl = tpl.replace("{{IMG:%s}}" % key, f"data:image/jpeg;base64,{b64}")
open("standalone/index.html","w").write(tpl)
EOF
```

(Or just edit `standalone/index.html` directly for text changes — search for the wording you want to change.) Re-drag the folder onto Netlify to publish.
