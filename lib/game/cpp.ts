// Construction Phase Plan (CPP) generator — compiles a draft from the
// delegate's choices, structured around CDM 2015 CPP headings.

import type { CppDraft, CppSection, GameResult, Scenario } from "@/lib/types";
import { riskRatingFor } from "@/lib/game/scoring";

// Maps the stage key to its CPP section heading.
const SECTION_HEADINGS: Record<string, string> = {
  mobilisation: "3. Welfare Facilities & Site Set-up",
  logistics: "4. Site Logistics & Traffic Management",
  groundworks: "5. Excavations & Temporary Works",
  height: "6. Work at Height",
  lifting: "7. Lifting Operations",
  systems: "8. Safe Systems of Work, Permits & Emergency Arrangements",
};

export function generateCpp(result: GameResult, scenario: Scenario): CppDraft {
  const sections: CppSection[] = [];

  sections.push({
    heading: "1. Project Description",
    body: [
      `Project: ${scenario.title} (${scenario.sector}).`,
      scenario.description,
    ],
  });

  sections.push({
    heading: "2. Management of the Work (CDM 2015)",
    body: [
      "Principal Contractor to plan, manage and monitor the construction phase and coordinate the work of all contractors.",
      "Roles: Principal Designer, Principal Contractor, Temporary Works Coordinator and competent supervisors appointed; duties under CDM 2015 communicated at induction.",
      "This Construction Phase Plan is a living document and will be reviewed as the works progress.",
    ],
  });

  for (const choice of result.choices) {
    const heading = SECTION_HEADINGS[choice.stage_key] ?? choice.stage_title;
    const flag = choice.is_ideal ? "Control meets recognised good practice." : "Review recommended — control falls short of best practice.";
    sections.push({
      heading,
      body: [
        `Selected control: ${choice.choice_text}.`,
        `Safety basis: ${choice.safety_impact}`,
        `Compliance basis: ${choice.legal_impact}`,
        flag,
      ],
    });
  }

  const weak = result.choices.filter((c) => !c.is_ideal);
  sections.push({
    heading: "9. Residual Risk Summary",
    body: [
      `Project risk index: ${result.risk_index}/100 (${riskRatingFor(result.risk_index)}).`,
      weak.length === 0
        ? "All selected controls align with recognised good practice; residual risk is managed to a low level."
        : `Controls requiring review (${weak.length}): ${weak.map((c) => c.stage_title).join("; ")}.`,
      "Residual risks to be re-assessed before the relevant work commences and monitored throughout.",
    ],
  });

  return {
    scenario_title: scenario.title,
    generated_label: "Generated from delegate decisions — DRAFT for training purposes only.",
    sections,
  };
}
