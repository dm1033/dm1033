# AI-Powered ATS Review — Setup

The `/services/ats-cv-review` page has two tiers:

1. **Instant check** — pattern matching that runs entirely in the visitor's browser. No setup, no data leaves the page.
2. **AI advisory review** — sends the pasted CV + advert (with explicit visitor consent) to a server-side route handler (`src/app/api/ats-review/route.ts`), which calls Anthropic's Claude API (`claude-opus-4-8`) and returns a structured review: alignment estimate, strengths, evidenced/missing advert terms, evidence gaps, formatting risks and recommendations.

## Setup

1. Create an API key at https://platform.claude.com (Console → API keys).
2. Local dev: copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY`.
3. Production: add `ANTHROPIC_API_KEY` as an environment variable in the Vercel/Netlify project settings (server-side env var — **never** `NEXT_PUBLIC_`).
4. Redeploy. Without the key, the button returns a friendly "not configured" message and the instant check still works.

## Security and compliance posture (already built in)

- The API key exists only on the server; the browser calls our own `/api/ats-review` endpoint.
- Visitor consent checkbox is required before any text is sent (enforced server-side too).
- Input length caps (20K chars CV / 10K advert) and a per-IP rate limit (5 reviews / 10 min) protect against abuse and runaway cost.
- The system prompt enforces the business's compliance rules: advisory only, no pass/fail claims, no keyword stuffing or fabrication advice, British English, construction-specific judgement.
- CV text is not stored by the application; the privacy policy lists Anthropic as a processor.

## Cost and scaling notes

- Each review is one Claude Opus 4.8 call (roughly 3–8K input + 1–2K output tokens → a few cents per review). Watch usage in the Anthropic Console and set a spend limit there.
- **Free reviews are email-gated**: non-premium visitors must enter name + email (with consent wording) before running an AI review. The lead is posted to your Formspree checklist form automatically once Formspree is connected — every free review feeds the email funnel (Sequence A in docs/EMAIL-FUNNELS.md).
- The in-memory rate limiter resets per serverless instance. If the tool gets popular, move limiting to Upstash Redis / Vercel KV.
- Model and prompt live in `src/app/api/ats-review/route.ts`.

## Deployment impact

The site now includes one server route, so it can no longer be exported as purely static HTML (`output: "export"` / GoDaddy static hosting). Vercel and Netlify deployments are unaffected — everything else still prerenders statically. If you must deploy fully static, delete `src/app/api/` and the AI panel in `src/components/AtsChecker.tsx`; the instant check keeps working.
