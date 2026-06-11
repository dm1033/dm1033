import type { Metadata } from "next";
import Link from "next/link";
import ArticleLayout from "@/components/ArticleLayout";

export const metadata: Metadata = {
  title: "How to Move into Temporary Works Coordination",
  description:
    "Training, appointments and the evidence trail: a realistic route into temporary works coordination for engineers and supervisors.",
};

export default function TemporaryWorksPage() {
  return (
    <ArticleLayout
      title="How to Move into Temporary Works Coordination"
      intro="Temporary works is one of construction's most in-demand specialisms — and one of the most misunderstood routes in. The credential matters, but the appointment and the evidence matter more."
      date="June 2026"
      readMins={8}
    >
      <h2>Understand the structure first</h2>
      <p>
        Under BS 5975, temporary works roles are <strong>appointments</strong>,
        not just job titles: the Temporary Works Coordinator (TWC) manages the
        TW process on a project; Temporary Works Supervisors (TWS) assist
        under them; designers and design checkers sit on the engineering
        side. You are appointed by an organisation, in writing, based on
        competence — training alone doesn&apos;t make you a TWC.
      </p>

      <h2>The realistic route</h2>
      <ol>
        <li>
          <strong>Capture the TW exposure you already have.</strong> Most site
          engineers and supervisors already touch temporary works weekly:
          design briefs raised, excavation support checked, permits to
          load/strike, scaffold interfaces, crane pads. Write it down —
          this is your evidence base.
        </li>
        <li>
          <strong>Get the training.</strong> The CITB TWSTC (supervisor) and
          TWCTC (coordinator) courses are the recognised baseline. Book the
          level that matches your next step, not your ambition.
        </li>
        <li>
          <strong>Seek the TWS appointment.</strong> Ask your employer for a
          formal TWS appointment on your current project — it&apos;s the
          natural first rung and most contractors welcome the request.
        </li>
        <li>
          <strong>Build the register evidence.</strong> Volume and complexity
          count: how many live TW items, what design check categories, which
          scheme types (falsework, formwork, excavation support, propping,
          platforms).
        </li>
        <li>
          <strong>Step to TWC</strong> when you can evidence managing the
          process — briefs, registers, design interfaces, permits —
          not just attending it.
        </li>
      </ol>

      <h2>How to present it on your CV</h2>
      <ul>
        <li>Name the appointments and who appointed you: &quot;Appointed TWS (2023), TWC (2025)&quot;</li>
        <li>State training in full: &quot;CITB Temporary Works Coordinator Training Course (TWCTC), 2024&quot;</li>
        <li>Quantify truthfully: &quot;managed TW register of 60+ items across 3 sites&quot;</li>
        <li>Put &quot;Temporary Works&quot; in your profile line and LinkedIn headline — recruiters search the words</li>
      </ul>
      <p>
        The free{" "}
        <Link href="/free-cv-checklist" className="font-semibold underline">
          Temporary Works Career Profile Checklist
        </Link>{" "}
        walks through the full evidence list.
      </p>

      <h2>When the route isn't obvious</h2>
      <p>
        From the tools, from QS, from design — the entry point differs by
        background, employer size and sector. A{" "}
        <Link href="/services/career-coaching" className="font-semibold underline">
          career coaching call
        </Link>{" "}
        with someone who has spent decades in temporary works maps your
        specific next step, honestly.
      </p>
    </ArticleLayout>
  );
}
