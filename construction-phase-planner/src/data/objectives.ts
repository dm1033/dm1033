// SMSTS-aligned learning outcomes and their mapping to gameplay steps.
//
// The outcome wording is original, written to align with the published aims of the
// CITB Site Management Safety Training Scheme (site managers able to manage health,
// safety, welfare and environment on site in line with current legislation). The game
// is SMSTS-aligned and not endorsed or approved by CITB.
//
// Every objective must be mapped to at least one DETERMINISTIC step (a phase step the
// delegate always meets — never a random pool event) in EVERY scenario. This is
// enforced by scripts/validate-data.ts, and is what supports the claim that a
// completed playthrough addresses every learning outcome.

export interface LearningObjective {
  id: string
  code: string
  title: string
  description: string
}

export const LEARNING_OBJECTIVES: LearningObjective[] = [
  {
    id: 'lo-law',
    code: 'LO1',
    title: 'Apply health and safety law on site',
    description:
      'Understand the legal framework (HSWA, key regulations, enforcement and penalties) and act on the duties it places on site managers, employers and workers.',
  },
  {
    id: 'lo-cdm',
    code: 'LO2',
    title: 'Fulfil CDM 2015 duties through the project',
    description:
      'Identify duty holders and discharge principal contractor responsibilities: pre-construction information, construction phase plan, notification, and the health and safety file.',
  },
  {
    id: 'lo-ra',
    code: 'LO3',
    title: 'Plan work with risk assessment, method statements and permits',
    description:
      'Prioritise principal risks, review RAMS as a real control, and operate proportionate permit-to-work systems for the highest-risk tasks.',
  },
  {
    id: 'lo-site',
    code: 'LO4',
    title: 'Set up and organise a safe, healthy site',
    description:
      'Plan site layout, welfare, access and egress, traffic management, security and public protection from day one.',
  },
  {
    id: 'lo-highrisk',
    code: 'LO5',
    title: 'Control high-risk activities',
    description:
      'Manage work at height, lifting, excavations, services, structural/temporary works instability, demolition or confined spaces as the project demands — with the hierarchy of control and competent supervision.',
  },
  {
    id: 'lo-health',
    code: 'LO6',
    title: 'Manage occupational health',
    description:
      'Control the slow injuries — dust, noise, vibration, hazardous substances, welfare-related disease — at source, with surveillance where exposure warrants it.',
  },
  {
    id: 'lo-env',
    code: 'LO7',
    title: 'Manage environmental impacts',
    description:
      'Control waste, water pollution, dust, noise and nuisance; prevent and respond to environmental incidents; manage neighbours and stakeholders.',
  },
  {
    id: 'lo-people',
    code: 'LO8',
    title: 'Lead, communicate and engage the workforce',
    description:
      'Induct, brief, consult and engage everyone on site — including workers whose first language is not English — and build a culture where people report and standards hold.',
  },
  {
    id: 'lo-monitor',
    code: 'LO9',
    title: 'Monitor, inspect and keep statutory records',
    description:
      'Run statutory and management inspection regimes, keep honest records, and report and learn from accidents, incidents and near misses.',
  },
  {
    id: 'lo-deliver',
    code: 'LO10',
    title: 'Deliver safely under pressure to handover',
    description:
      'Manage programme and commercial pressure without de-controlling risk, and complete a compliant handover and close-out.',
  },
]

/** scenarioId → objectiveId → deterministic step ids that evidence it. */
export const OBJECTIVE_MAP: Record<string, Record<string, string[]>> = {
  's1-commercial-extension': {
    'lo-law': ['p1-d1', 'p2-d1'],
    'lo-cdm': ['p1-d1', 'p2-d1', 'p3-d1', 'p3-d2', 'p14-d1'],
    'lo-ra': ['p6-d1', 'p7-d1', 'p7-d2', 'p9-permits'],
    'lo-site': ['p4-setup', 'p4-d1', 'p5-d1', 'p5-d2', 'p5-d3'],
    'lo-highrisk': ['p7-d1', 'p8-d1', 'p8-tw', 'p10-d1', 'p10-d2', 'p10-d3'],
    'lo-health': ['p11-d2'],
    'lo-env': ['p11-d1', 'p12-d2'],
    'lo-people': ['p2-d2', 'p5-d2', 'p13-d3'],
    'lo-monitor': ['p9-d1', 'p13-d2'],
    'lo-deliver': ['p13-d1', 'p14-d1'],
  },
  's2-city-refurb': {
    'lo-law': ['p2-d1', 'p12-d2'],
    'lo-cdm': ['p1-d1', 'p2-d1', 'p3-d1', 'p14-d1'],
    'lo-ra': ['p6-d1', 'p7-d1', 'p7-d2', 'p9-permits'],
    'lo-site': ['p4-setup', 'p4-d1', 'p5-d1', 'p5-d2'],
    'lo-highrisk': ['p8-d1', 'p8-tw', 'p10-d1', 'p10-d2', 'p12-d1'],
    'lo-health': ['p7-d2', 'p10-d2', 'p11-d2'],
    'lo-env': ['p11-d1', 'p11-d2', 'p13-d2'],
    'lo-people': ['p2-d2', 'p13-d0'],
    'lo-monitor': ['p9-d1'],
    'lo-deliver': ['p13-d1', 'p14-d1'],
  },
  's3-utilities-roadworks': {
    'lo-law': ['p1-d1', 'p2-d1'],
    'lo-cdm': ['p2-d1', 'p3-d1', 'p14-d1'],
    'lo-ra': ['p6-d1', 'p7-d1', 'p9-permits'],
    'lo-site': ['p4-setup', 'p4-d1', 'p5-d1', 'p5-d2'],
    'lo-highrisk': ['p8-d1', 'p8-tw', 'p10-d1', 'p10-d2', 'p10-d3'],
    'lo-health': ['p11-d2'],
    'lo-env': ['p11-d1'],
    'lo-people': ['p2-d2', 'p13-d2'],
    'lo-monitor': ['p9-d1'],
    'lo-deliver': ['p13-d1', 'p14-d1'],
  },
}
