import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import Stripe from "stripe";
import { z } from "zod";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PREMIUM_COOKIE, verifyPremiumToken } from "@/lib/premium";

/**
 * AI-powered advisory ATS review.
 *
 * The ANTHROPIC_API_KEY lives ONLY in server environment variables
 * (.env.local locally, project env vars on Vercel/Netlify). It is never
 * exposed to the browser. CV text is processed to generate the review and
 * is not stored by this application.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_CV_CHARS = 20_000;
const MAX_ADVERT_CHARS = 10_000;

/** Structured review schema — what Claude must return. */
const ReviewSchema = z.object({
  summary: z
    .string()
    .describe("3-4 sentence overall assessment, written directly to the candidate."),
  alignmentScore: z
    .number()
    .describe(
      "Advisory alignment estimate 0-100: how well the CV's stated, truthful experience aligns with the advert's requirements. Not a pass/fail prediction.",
    ),
  strengths: z.array(z.string()).describe("What the CV already does well for this role."),
  presentKeywords: z
    .array(z.string())
    .describe("Advert requirements/terminology genuinely evidenced in the CV."),
  missingKeywords: z
    .array(z.string())
    .describe(
      "Advert requirements/terminology not found in the CV. Only items the advert asks for; never advise claiming experience the candidate may not have.",
    ),
  evidenceGaps: z
    .array(z.string())
    .describe(
      "Where the CV asserts capability without project evidence (scope, scale, responsibility, outcome).",
    ),
  formattingRisks: z
    .array(z.string())
    .describe("Structure/formatting issues that may hurt parsing or recruiter scanning."),
  recommendations: z
    .array(z.string())
    .describe("Specific, ethical, prioritised improvements the candidate can act on."),
});

/** Premium-only extras (paid one-off or monthly customers). */
const PremiumExtrasSchema = z.object({
  rewrittenBullets: z
    .array(
      z.object({
        original: z.string().describe("A weak bullet quoted from the CV."),
        improved: z
          .string()
          .describe(
            "A stronger rewrite using ONLY facts present in the CV — action, scale, standard/method, outcome. Never invent values or detail.",
          ),
      }),
    )
    .describe("3-6 of the CV's weakest bullets, rewritten as truthful examples."),
  coverLetterDraft: z
    .string()
    .describe(
      "A complete draft cover letter (250-350 words) tailored to this advert, built strictly from experience evidenced in the CV. British English. No invented claims, no guarantee language.",
    ),
});

const PremiumReviewSchema = ReviewSchema.extend(PremiumExtrasSchema.shape);

export type AtsAiReview = z.infer<typeof ReviewSchema> &
  Partial<z.infer<typeof PremiumExtrasSchema>>;

/** Verify premium access: signature check, plus a live Stripe status check
 *  for subscriptions so cancelled plans lose access automatically. */
async function hasPremiumAccess(): Promise<boolean> {
  const token = verifyPremiumToken((await cookies()).get(PREMIUM_COOKIE)?.value);
  if (!token) return false;
  if (token.kind === "one_time") return true;
  if (!process.env.STRIPE_SECRET_KEY) return false;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const sub = await stripe.subscriptions.retrieve(token.subscriptionId);
    return sub.status === "active" || sub.status === "trialing";
  } catch {
    return false;
  }
}

const SYSTEM_PROMPT = `You are an expert construction-industry CV reviewer working for Construction Career Edge, a UK-based career documents service run by a civil engineer with 29 years' experience across civil engineering, construction management, temporary works, HV infrastructure and safety.

You review a candidate's CV text against a specific job advert and produce an advisory screening-readiness review.

Domain knowledge: you understand UK and international construction roles (site/civil/section/project engineers, temporary works coordinators and supervisors, construction/site/project/contracts managers, quantity surveyors, planners, H&S, BIM), terminology (BS 5975, NEC4, CSCS, SMSTS, Primavera P6, RAMS, ITPs), and how recruiters and applicant tracking systems read CVs.

Hard rules — never break these:
- ADVISORY ONLY. Never state or imply the CV will "pass" or "fail" any ATS, or guarantee interviews, offers or selection. Final hiring decisions rest with employers and recruiters.
- TRUTHFULNESS. Never advise adding keywords, qualifications, titles, project values or experience the CV does not evidence. When listing missing keywords, frame them as "only add if you genuinely have this experience".
- NO TRICKS. Never suggest hidden text, keyword stuffing, white-on-white text, or any deception of screening systems or recruiters.
- Be specific and constructive. Reference actual content from the CV where possible. Use British English.
- alignmentScore is an advisory estimate of how well the stated experience matches the advert's requirements (0-100). Score what is evidenced, not what might exist.`;

/* Naive in-memory rate limit: per-IP, 5 requests / 10 minutes.
   Sufficient for a single serverless instance; swap for Upstash/KV at scale. */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI review is not configured on this deployment." },
      { status: 503 },
    );
  }

  const premium = await hasPremiumAccess();

  // Premium customers get unlimited reviews; free tier is rate-limited.
  if (!premium) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (rateLimited(ip)) {
      return NextResponse.json(
        {
          error:
            "Free review limit reached. Try again in a few minutes — or get unlimited AI reviews with Premium Access.",
          upgrade: true,
        },
        { status: 429 },
      );
    }
  }

  let body: { cv?: string; advert?: string; consent?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const cv = (body.cv ?? "").trim();
  const advert = (body.advert ?? "").trim();

  if (!body.consent) {
    return NextResponse.json(
      { error: "Consent is required before the AI review can run." },
      { status: 400 },
    );
  }
  if (cv.length < 200 || advert.length < 100) {
    return NextResponse.json(
      { error: "Please paste your full CV text and the complete job advert." },
      { status: 400 },
    );
  }
  if (cv.length > MAX_CV_CHARS || advert.length > MAX_ADVERT_CHARS) {
    return NextResponse.json(
      { error: "Input too long. Please paste the CV and advert text only." },
      { status: 400 },
    );
  }

  const client = new Anthropic();

  try {
    const response = await client.messages.parse({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Review this construction CV against the job advert.${
            premium
              ? " This is a PREMIUM review: also rewrite the weakest bullets as truthful examples and draft a tailored cover letter, using only experience evidenced in the CV."
              : ""
          }\n\n<cv>\n${cv}\n</cv>\n\n<job_advert>\n${advert}\n</job_advert>`,
        },
      ],
      output_config: {
        format: zodOutputFormat(premium ? PremiumReviewSchema : ReviewSchema),
      },
    });

    if (!response.parsed_output) {
      return NextResponse.json(
        { error: "The review could not be generated. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ review: response.parsed_output, premium });
  } catch (error) {
    if (
      error instanceof Anthropic.RateLimitError ||
      (error instanceof Anthropic.APIError && error.status === 529)
    ) {
      return NextResponse.json(
        { error: "The AI service is busy. Please try again in a minute." },
        { status: 503 },
      );
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Anthropic API error", error.status, error.message);
      return NextResponse.json(
        { error: "The AI review failed. Please try again later." },
        { status: 502 },
      );
    }
    throw error;
  }
}
