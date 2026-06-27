// SiteSafe content authoring + build.
// Single source of truth for the 5 seed scenarios. Run with: npm run build:content
// Emits:  content/scenarios.json  (app fallback / demo mode)
//         supabase/seed.sql        (database seed)
//
// IDs are deterministic (derived from stable keys) so re-running is idempotent.

import { createHash } from "node:crypto";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

/** Deterministic UUID v5-style from a string. */
function uuid(seed) {
  const h = createHash("sha1").update(seed).digest("hex");
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    "5" + h.slice(13, 16),
    ((parseInt(h.slice(16, 18), 16) & 0x3f) | 0x80).toString(16) + h.slice(18, 20),
    h.slice(20, 32),
  ].join("-");
}

// Decision helper: keeps authoring compact.
const d = (choice_text, o) => ({
  choice_text,
  safety_impact: o.safety,
  legal_impact: o.legal,
  explanation: o.why,
  score_effect: o.score,
  risk_effect: o.risk,
  is_ideal: !!o.ideal,
  layout_effect: { add: o.add || [], note: o.note || "" },
});

// Standard score/risk bands.
const IDEAL = { score: 10, risk: -12, ideal: true };
const PART = { score: 5, risk: -3 };
const POOR = { score: -3, risk: 12 };

// Shared 6-stage spine metadata (CDM 2015 / SMSTS aligned).
const STAGE_META = {
  mobilisation: {
    title: "Site Mobilisation, Welfare & Security",
    phase: "Pre-construction / Set-up",
    learning_outcome:
      "Establish compliant welfare facilities and a secure site boundary in line with CDM 2015 Schedule 2 and the principal contractor's duties.",
  },
  logistics: {
    title: "Site Logistics & Traffic Management",
    phase: "Set-up",
    learning_outcome:
      "Segregate vehicles from pedestrians and plan safe access, egress and deliveries (HSG144 principles).",
  },
  groundworks: {
    title: "Excavations & Temporary Works",
    phase: "Substructure",
    learning_outcome:
      "Prevent excavation collapse and control temporary works under BS 5975 with a Temporary Works Coordinator.",
  },
  height: {
    title: "Work at Height & Access",
    phase: "Superstructure",
    learning_outcome:
      "Select and control safe access for work at height following the Work at Height Regulations 2005 hierarchy.",
  },
  lifting: {
    title: "Lifting Operations & Plant",
    phase: "Superstructure",
    learning_outcome:
      "Plan and supervise lifting operations under LOLER 1998 / PUWER 1998 with a competent Appointed Person.",
  },
  systems: {
    title: "Safe Systems: RAMS, Permits, ITPs & Emergency Planning",
    phase: "Throughout construction",
    learning_outcome:
      "Implement risk assessments and method statements, permits-to-work, inspection & test plans and emergency arrangements.",
  },
};

const STAGE_ORDER = ["mobilisation", "logistics", "groundworks", "height", "lifting", "systems"];

// ── Scenarios ───────────────────────────────────────────────────────────────
// Each scenario provides a prompt + 3 decisions (ideal / partial / poor) per stage.

const scenarios = [
  {
    slug: "city-centre-tower",
    title: "City-Centre Office Tower",
    sector: "Commercial",
    difficulty: "advanced",
    summary:
      "A 14-storey office tower on a tight city-centre plot bounded by public footways, a busy road and a neighbouring occupied building.",
    description:
      "You are the principal contractor's site manager mobilising a constrained urban site. The basement requires deep excavation against existing party walls, a tower crane will oversail the public highway, and pedestrian footfall around the hoarding line is heavy. Decisions must protect the public as well as the workforce.",
    image_key: "tower",
    stages: {
      mobilisation: {
        prompt:
          "The plot opens directly onto a public footway. How do you set up the boundary and welfare before works start?",
        decisions: [
          d("Erect solid hoarding to the footway line with managed gates, and install heated welfare units (toilets, drying room, canteen) sized for peak workforce", {
            ...IDEAL,
            safety: "Protects the public and provides compliant welfare from day one.",
            legal: "Meets CDM 2015 Schedule 2 welfare duties and protects non-workers under the principal contractor's duties.",
            why: "On a public-facing urban site, solid hoarding is required to protect passers-by, and welfare must be available before work begins, not retro-fitted.",
            add: ["hoarding", "security_gate", "welfare_unit", "site_office", "cctv"],
            note: "Secure public-facing boundary with full welfare.",
          }),
          d("Put up Heras mesh fencing and bring a single portable toilet, adding more welfare once the team grows", {
            ...PART,
            safety: "Basic separation but mesh is easily breached and welfare is inadequate.",
            legal: "Partially compliant — welfare provision falls short of Schedule 2 for the planned numbers.",
            why: "Temporary fencing rarely suffices on a busy public frontage and welfare must match the actual workforce, not be scaled up reactively.",
            add: ["heras_fencing", "welfare_unit"],
            note: "Weak boundary, minimal welfare.",
          }),
          d("Start groundworks immediately and arrange fencing and welfare in the first fortnight", {
            ...POOR,
            safety: "Leaves the public exposed to site hazards and workers without facilities.",
            legal: "Breaches CDM 2015 — welfare and public protection must be in place from the outset.",
            why: "Beginning work without a secure boundary or welfare is a serious breach and a common cause of enforcement action.",
            add: [],
            note: "No boundary or welfare in place.",
          }),
        ],
      },
      logistics: {
        prompt:
          "Deliveries arrive off a busy road and the public walks past the gate. How do you manage traffic and pedestrians?",
        decisions: [
          d("Implement a gate-booking system, a banksman/traffic marshal, segregated pedestrian routes and a wheel-wash, with a one-way internal flow", {
            ...IDEAL,
            safety: "Eliminates uncontrolled vehicle/pedestrian conflict at the interface.",
            legal: "Aligns with HSG144 and CDM 2015 traffic management duties.",
            why: "Booked deliveries, marshalling and physical segregation are the recognised controls where site traffic meets the public.",
            add: ["vehicle_route", "pedestrian_route", "banksman", "wheel_wash", "one_way_system", "signage"],
            note: "Segregated, marshalled logistics.",
          }),
          d("Post warning signage and ask drivers to sound the horn when reversing across the footway", {
            ...PART,
            safety: "Raises awareness but relies on behaviour rather than separation.",
            legal: "Falls short — reliance on signage alone is low in the hierarchy of control.",
            why: "Signage supports but cannot replace physical segregation and marshalling at a public interface.",
            add: ["signage", "vehicle_route"],
            note: "Signage only; no segregation.",
          }),
          d("Let deliveries arrive ad-hoc and reverse off the road when there is a gap in pedestrians", {
            ...POOR,
            safety: "High risk of striking pedestrians during uncontrolled reversing.",
            legal: "Breaches traffic management duties; reversing is a leading cause of site fatalities.",
            why: "Uncontrolled reversing across a public footway is one of the most dangerous activities on an urban site.",
            add: ["vehicle_route"],
            note: "Uncontrolled reversing.",
          }),
        ],
      },
      groundworks: {
        prompt:
          "The basement needs a 6 m deep excavation next to an occupied neighbouring building. How do you proceed?",
        decisions: [
          d("Appoint a Temporary Works Coordinator, install a designed propped retaining system with a permit-to-dig and daily inspections by a competent person", {
            ...IDEAL,
            safety: "Prevents collapse and protects the adjacent structure.",
            legal: "Meets BS 5975 and CDM 2015; the TWC owns the temporary works register.",
            why: "Deep excavation beside occupied structures demands designed support, a TWC and inspection before each shift.",
            add: ["excavation_support", "dewatering", "exclusion_zone", "signage"],
            note: "Designed, propped, inspected excavation.",
          }),
          d("Batter the excavation back where space allows and use a trench box for the deeper sections", {
            ...PART,
            safety: "Reasonable for open ground but battering is not feasible against the boundary.",
            legal: "Partially compliant — needs design verification next to the neighbour.",
            why: "Battering and trench boxes suit open excavations but a constrained deep dig against a party wall needs an engineered solution.",
            add: ["trench_box", "exclusion_zone"],
            note: "Trench box; no full temporary works design.",
          }),
          d("Dig the basement with vertical faces and shore only if the ground starts to move", {
            ...POOR,
            safety: "Very high collapse risk and threatens the neighbouring building.",
            legal: "Serious breach of CDM 2015 and BS 5975 — excavations must be supported in advance.",
            why: "Waiting for signs of movement is too late; excavation collapses are sudden and frequently fatal.",
            add: [],
            note: "Unsupported deep excavation.",
          }),
        ],
      },
      height: {
        prompt:
          "The frame rises 14 storeys with façade works over the public footway. How is work at height accessed and protected?",
        decisions: [
          d("Erect a designed, independently-tied scaffold with double guardrails, toes boards, brick guards and a protected pavement gantry, inspected weekly and tagged", {
            ...IDEAL,
            safety: "Collective protection for workers and the public below.",
            legal: "Meets WAHR 2005 hierarchy, TG20/SG4 and statutory 7-day scaffold inspection.",
            why: "Collective edge protection plus public protection (gantry/fans) is the correct top-of-hierarchy solution for tall public-facing façades.",
            add: ["scaffold", "edge_protection", "signage", "exclusion_zone"],
            note: "Tied scaffold with public gantry.",
          }),
          d("Use MEWPs for the façade and harnesses clipped to the basket for higher lifts", {
            ...PART,
            safety: "Workable but exposes the footway and depends on rescue planning.",
            legal: "Acceptable with controls but lower in the hierarchy than collective protection.",
            why: "MEWPs are valid but for a full tall façade over the public, scaffold with collective protection is preferable.",
            add: ["mewp", "exclusion_zone"],
            note: "MEWP access; PPE-reliant.",
          }),
          d("Have operatives work off ladders and step-platforms and clip a lanyard where they can", {
            ...POOR,
            safety: "Falls from height risk for workers and dropped-object risk to the public.",
            legal: "Breaches WAHR 2005 — ladders are not suitable for sustained façade work.",
            why: "Ladders for prolonged work at height are a primary cause of fall fatalities and are top of HSE's enforcement list.",
            add: [],
            note: "Ladder access; no collective protection.",
          }),
        ],
      },
      lifting: {
        prompt:
          "A tower crane will oversail the public highway to feed the build. How is the lifting operation controlled?",
        decisions: [
          d("Appoint a competent Appointed Person, produce a lift plan, fit anti-collision/zoning to prevent oversailing the public when loaded, and use slinger/signallers", {
            ...IDEAL,
            safety: "Removes the risk of loads passing over the public.",
            legal: "Meets LOLER 1998 and BS 7121; oversailing agreements and zoning are in place.",
            why: "An Appointed Person, a written lift plan and load-zoning are mandatory where a crane interfaces with the public.",
            add: ["tower_crane", "exclusion_zone", "banksman", "signage"],
            note: "Planned lifts with load zoning.",
          }),
          d("Use the crane with experienced operators and stop lifts manually when people are below", {
            ...PART,
            safety: "Relies on vigilance rather than engineered zoning.",
            legal: "Partially compliant — a documented lift plan and AP are still required.",
            why: "Manual stopping is a weak control compared with anti-collision zoning and a formal lift plan.",
            add: ["tower_crane", "exclusion_zone"],
            note: "Crane without formal zoning.",
          }),
          d("Run lifts as needed and rely on the operator to judge when it is safe to swing over the road", {
            ...POOR,
            safety: "Loads over the public risk fatal dropped-object incidents.",
            legal: "Serious breach of LOLER and BS 7121; lifting must be planned by a competent person.",
            why: "Unplanned lifting over the public is among the highest-consequence failures on a city site.",
            add: ["tower_crane"],
            note: "Unplanned lifting over the public.",
          }),
        ],
      },
      systems: {
        prompt:
          "How will you run safe systems of work, inspections and emergencies across the project?",
        decisions: [
          d("Brief task-specific RAMS, operate permits-to-work for high-risk tasks, maintain an ITP for quality holds, and rehearse an emergency/rescue plan with marked fire points and first aid", {
            ...IDEAL,
            safety: "Controls are matched to each task and emergencies are planned for.",
            legal: "Meets CDM 2015, MHSWR 1999 and first-aid/fire duties.",
            why: "RAMS, permits, ITPs and a tested emergency plan together form the project's safe system of work.",
            add: ["fire_point", "first_aid", "signage"],
            note: "Full RAMS / permits / ITP / emergency regime.",
          }),
          d("Hold a generic site induction and a single overarching method statement covering all activities", {
            ...PART,
            safety: "Provides a baseline but misses task-specific high-risk controls.",
            legal: "Partially compliant — RAMS must be specific to the activity and place.",
            why: "Generic documents do not control specific high-risk tasks; permits and task RAMS are needed.",
            add: ["first_aid"],
            note: "Generic method statement only.",
          }),
          d("Rely on experienced operatives to work safely and deal with incidents if they arise", {
            ...POOR,
            safety: "No structured control or emergency preparedness.",
            legal: "Breaches CDM 2015 and MHSWR — risk assessment is a legal duty.",
            why: "Experience is not a substitute for documented, communicated safe systems and emergency planning.",
            add: [],
            note: "No formal safe systems.",
          }),
        ],
      },
    },
  },

  {
    slug: "motorway-bridge",
    title: "Motorway Bridge Replacement",
    sector: "Highways",
    difficulty: "advanced",
    summary:
      "Replacing an overbridge above a live motorway, working within night-time possessions with heavy beam lifts and traffic management.",
    description:
      "You are managing a highways scheme to demolish and replace an overbridge spanning a live three-lane motorway. Work happens largely at night under traffic management, with abnormal-load deliveries and tandem crane lifts of bridge beams. Worker safety, road-user safety and possession discipline all matter.",
    image_key: "bridge",
    stages: {
      mobilisation: {
        prompt:
          "A compound is needed beside the carriageway for night works. How do you set up welfare and security?",
        decisions: [
          d("Establish a fenced compound set back behind safety barrier, with lit welfare cabins, drying rooms and secure plant storage suitable for night-shift numbers", {
            ...IDEAL,
            safety: "Keeps the workforce clear of live traffic and supports night working.",
            legal: "Meets CDM 2015 Schedule 2 and roadworks safety guidance.",
            why: "Night highway works require a properly set-back, lit and secure compound with full welfare for shift workers.",
            add: ["hoarding", "security_gate", "welfare_unit", "site_office", "material_storage"],
            note: "Set-back lit compound with welfare.",
          }),
          d("Place welfare cabins on the verge close to the works with cone separation from traffic", {
            ...PART,
            safety: "Welfare is provided but proximity to live traffic adds risk.",
            legal: "Partially compliant — separation from live lanes is inadequate.",
            why: "Cones are not a vehicle-restraint system; welfare should sit behind hardened protection.",
            add: ["welfare_unit", "signage"],
            note: "Verge-side welfare, cone separation.",
          }),
          d("Use the existing layby with no dedicated welfare for the first shifts", {
            ...POOR,
            safety: "Workforce exposed to traffic with no facilities.",
            legal: "Breaches CDM 2015 welfare duties.",
            why: "Operating night shifts without compliant, protected welfare is unacceptable and unsafe.",
            add: [],
            note: "No compound or welfare.",
          }),
        ],
      },
      logistics: {
        prompt:
          "Live traffic runs beneath and beside the works. How do you manage traffic and protect the workforce?",
        decisions: [
          d("Install a designed temporary traffic management scheme (lane closures, TTRO, hardened barrier between works and live lanes) with safety-zone widths to Chapter 8", {
            ...IDEAL,
            safety: "Physically separates the workforce from live traffic.",
            legal: "Complies with the Traffic Signs Manual Chapter 8 and a Temporary Traffic Regulation Order.",
            why: "Hardened barriers and correct safety zones are the recognised controls for working adjacent to live high-speed traffic.",
            add: ["vehicle_route", "edge_protection", "signage", "exclusion_zone"],
            note: "Chapter 8 TM with hardened barrier.",
          }),
          d("Use cones and chevron signs to close off a working lane with a speed-limit request", {
            ...PART,
            safety: "Provides demarcation but no physical restraint from errant vehicles.",
            legal: "Partially compliant — high-speed works need barrier protection, not cones alone.",
            why: "Cones channel traffic but will not stop an incursion; barrier protection is needed at motorway speeds.",
            add: ["vehicle_route", "signage"],
            note: "Cones only; no barrier.",
          }),
          d("Keep all lanes running and ask the team to work quickly between traffic gaps", {
            ...POOR,
            safety: "Extreme risk of operatives being struck by live traffic.",
            legal: "Serious breach of traffic management and CDM duties.",
            why: "Working in or beside live high-speed lanes without closure or protection is potentially fatal.",
            add: [],
            note: "No traffic management.",
          }),
        ],
      },
      groundworks: {
        prompt:
          "New bridge abutments require excavation and piling close to the carriageway. How is this controlled?",
        decisions: [
          d("Appoint a TWC, use designed shoring/casings to BS 5975, a permit-to-dig with services located (CAT scan/GPR), and exclusion zones around piling rigs", {
            ...IDEAL,
            safety: "Prevents collapse and strikes on buried services and plant.",
            legal: "Meets BS 5975, CDM 2015 and HSG47 (avoiding underground services).",
            why: "Excavation/piling beside a carriageway needs designed support, service location and rig exclusion zones.",
            add: ["excavation_support", "exclusion_zone", "signage", "dewatering"],
            note: "Designed support with service location.",
          }),
          d("Locate services from existing drawings and batter the excavation where the verge allows", {
            ...PART,
            safety: "Some control but drawings are often inaccurate and battering is space-limited.",
            legal: "Partially compliant — HSG47 expects on-site detection, not drawings alone.",
            why: "Record drawings must be verified on site; battering may not fit beside the carriageway.",
            add: ["trench_box", "exclusion_zone"],
            note: "Drawings only; partial support.",
          }),
          d("Excavate to vertical faces and keep the piling rig working close to the open edge", {
            ...POOR,
            safety: "Collapse and rig-overturn risk near the carriageway.",
            legal: "Breaches BS 5975 and CDM 2015.",
            why: "Unsupported faces and rigs at the edge of excavations are a recognised cause of collapses and overturns.",
            add: [],
            note: "Unsupported excavation by carriageway.",
          }),
        ],
      },
      height: {
        prompt:
          "Demolition and deck works occur above the live (or possessed) carriageway. How do you protect against falls and debris?",
        decisions: [
          d("Use a fully boarded, netted and fanned access with debris containment over the carriageway, mobile elevating platforms with rescue plans, and a possession before any over-road work", {
            ...IDEAL,
            safety: "Protects workers from falls and the road from falling debris.",
            legal: "Meets WAHR 2005 and possession rules; debris netting protects road users.",
            why: "Over-road work requires collective fall protection plus debris containment and is only done within a possession.",
            add: ["scaffold", "edge_protection", "exclusion_zone", "signage"],
            note: "Netted/fanned access within possession.",
          }),
          d("Provide harnesses and nets and allow over-road work with a lane closed beneath", {
            ...PART,
            safety: "Reduces consequences but relies partly on PPE.",
            legal: "Acceptable with controls but collective debris protection is preferred.",
            why: "Closing the lane below helps, but collective protection and containment should lead over PPE.",
            add: ["edge_protection", "exclusion_zone"],
            note: "PPE-reliant over-road work.",
          }),
          d("Let the team remove the deck over running traffic during quiet periods", {
            ...POOR,
            safety: "Falling debris and falls of persons onto live traffic.",
            legal: "Serious breach of WAHR 2005 and possession discipline.",
            why: "Demolition over live traffic is one of the highest-risk activities and must never proceed without a possession and containment.",
            add: [],
            note: "Over-road demolition, no protection.",
          }),
        ],
      },
      lifting: {
        prompt:
          "Bridge beams must be lifted in within a short night possession. How is the lift planned?",
        decisions: [
          d("Appoint an Appointed Person, produce a contract lift / tandem-lift plan, validate ground bearing and crane pads, set exclusion zones and rehearse the sequence within the possession window", {
            ...IDEAL,
            safety: "Controls the heavy lift and keeps everyone clear.",
            legal: "Meets LOLER 1998 and BS 7121 for tandem and contract lifts.",
            why: "Heavy beam lifts demand an AP, a detailed plan, verified ground conditions and rehearsed timing within the possession.",
            add: ["mobile_crane", "exclusion_zone", "banksman", "signage"],
            note: "Planned tandem lift with exclusion zones.",
          }),
          d("Use an experienced crane crew with a basic lift plan and outrigger mats", {
            ...PART,
            safety: "Competent crew but the plan lacks tandem-lift and ground detail.",
            legal: "Partially compliant for a complex tandem lift.",
            why: "Complex tandem lifts need more than a basic plan — ground bearing and synchronised control are critical.",
            add: ["mobile_crane", "exclusion_zone"],
            note: "Basic plan; limited detail.",
          }),
          d("Bring the cranes on the night and work out the lift sequence on site to save planning time", {
            ...POOR,
            safety: "High risk of overturn or dropped beam over the carriageway.",
            legal: "Serious breach of LOLER/BS 7121.",
            why: "Improvised heavy lifts over a motorway are extremely dangerous and indefensible.",
            add: ["mobile_crane"],
            note: "Unplanned heavy lift.",
          }),
        ],
      },
      systems: {
        prompt:
          "How will you run safe systems, possession control and emergencies for night working?",
        decisions: [
          d("Operate task RAMS, permits for hot works/lifting/over-road work, an ITP for the new deck, possession sign-on/off, and an emergency plan including incursion and casualty rescue", {
            ...IDEAL,
            safety: "Controls each high-risk task and prepares for incursions and casualties.",
            legal: "Meets CDM 2015, possession rules and emergency planning duties.",
            why: "Night highway works need permits, possession discipline, ITPs and a tested incursion/rescue plan.",
            add: ["fire_point", "first_aid", "signage"],
            note: "Permits, ITP and incursion plan.",
          }),
          d("Use a standard induction and rely on the TM contractor to manage possessions", {
            ...PART,
            safety: "Baseline only; task-specific and incursion controls are thin.",
            legal: "Partially compliant — the PC retains responsibility for safe systems.",
            why: "The principal contractor cannot delegate away its duty to operate task-specific safe systems.",
            add: ["first_aid"],
            note: "Generic systems; delegated TM.",
          }),
          d("Keep paperwork light to maximise productive time in the possession", {
            ...POOR,
            safety: "No structured control of high-risk night tasks.",
            legal: "Breaches CDM 2015 and MHSWR.",
            why: "Cutting safe-system documentation to save time directly increases the chance of a serious incident.",
            add: [],
            note: "Minimal safe systems.",
          }),
        ],
      },
    },
  },

  {
    slug: "primary-school",
    title: "New Primary School",
    sector: "Education",
    difficulty: "intermediate",
    summary:
      "Building a new primary school on land adjacent to an occupied, operating school — safeguarding and segregation are paramount.",
    description:
      "You are mobilising a new-build primary school next to a school that remains open throughout. Children, parents and staff are present daily. The build involves groundworks, a steel and timber frame, and roof works, with shared access near the existing school gate. Safeguarding and total segregation of the public drive the safety strategy.",
    image_key: "school",
    stages: {
      mobilisation: {
        prompt:
          "Children and parents pass the site daily. How do you secure the boundary and provide welfare?",
        decisions: [
          d("Install full-height solid hoarding with anti-climb measures, lockable gates away from the school entrance, CCTV, and welfare cabins with separate site access", {
            ...IDEAL,
            safety: "Prevents children entering and keeps site and school populations apart.",
            legal: "Meets CDM 2015 Schedule 2 and safeguarding expectations for work near schools.",
            why: "Solid anti-climb hoarding, segregated gates and CCTV are essential where children are present daily.",
            add: ["hoarding", "security_gate", "cctv", "welfare_unit", "site_office"],
            note: "Anti-climb hoarding, segregated access.",
          }),
          d("Erect timber hoarding but share the existing school gate for site access at agreed times", {
            ...PART,
            safety: "Boundary is solid but shared access creates child/vehicle conflict.",
            legal: "Partially compliant — shared access undermines segregation.",
            why: "Site traffic must not share an entrance used by children even at staggered times.",
            add: ["hoarding", "welfare_unit"],
            note: "Shared gate with school.",
          }),
          d("Use Heras fencing with privacy netting and rely on supervision to keep children out", {
            ...POOR,
            safety: "Fencing is easily breached by children; serious safeguarding risk.",
            legal: "Breaches CDM 2015 and safeguarding duties.",
            why: "Mesh fencing is inadequate next to an occupied school and invites unauthorised access.",
            add: ["heras_fencing"],
            note: "Mesh fence next to school.",
          }),
        ],
      },
      logistics: {
        prompt:
          "Deliveries must arrive without crossing paths with children at drop-off and pick-up. What is your plan?",
        decisions: [
          d("Agree a delivery management plan banning deliveries during drop-off/pick-up windows, with a dedicated site entrance, banksman and segregated pedestrian routes", {
            ...IDEAL,
            safety: "Removes vehicle/child conflict entirely at peak times.",
            legal: "Aligns with HSG144 and safeguarding; timing controls are enforceable.",
            why: "Curfewed deliveries plus a separate entrance and marshalling protect children at the most dangerous times.",
            add: ["vehicle_route", "pedestrian_route", "banksman", "signage", "wheel_wash"],
            note: "Curfewed deliveries, dedicated gate.",
          }),
          d("Schedule most deliveries outside school hours but accept some during the day with a marshal", {
            ...PART,
            safety: "Reduces but does not remove daytime conflict.",
            legal: "Partially compliant — any delivery during peak windows is a risk.",
            why: "A marshal helps, but deliveries should be fully excluded during drop-off and pick-up.",
            add: ["vehicle_route", "banksman", "signage"],
            note: "Partial delivery curfew.",
          }),
          d("Let deliveries arrive whenever suppliers can make it and manage on the day", {
            ...POOR,
            safety: "Vehicles and children sharing space at peak times.",
            legal: "Breaches traffic management and safeguarding duties.",
            why: "Uncontrolled deliveries near a live school gate are a foreseeable and serious danger to children.",
            add: ["vehicle_route"],
            note: "Uncontrolled deliveries.",
          }),
        ],
      },
      groundworks: {
        prompt:
          "Foundations and drainage need excavation close to the site boundary with the live school. How do you control it?",
        decisions: [
          d("Use a permit-to-dig with services scanned, designed trench support, edge protection and barriered exclusion zones, inspected daily by a competent person", {
            ...IDEAL,
            safety: "Prevents collapse and keeps open excavations away from children.",
            legal: "Meets CDM 2015, BS 5975 and HSG47.",
            why: "Open excavations near a school must be supported, fenced and inspected, with services located first.",
            add: ["excavation_support", "exclusion_zone", "edge_protection", "signage"],
            note: "Supported, fenced excavations.",
          }),
          d("Trench-box the deeper runs and barrier off open excavations at the end of each day", {
            ...PART,
            safety: "Reasonable support but daytime open edges remain a risk.",
            legal: "Partially compliant — exclusion should be continuous, not end-of-day only.",
            why: "Open excavations need protecting throughout the day, not just when the team leaves.",
            add: ["trench_box", "exclusion_zone"],
            note: "End-of-day barriers only.",
          }),
          d("Dig and backfill quickly each day, leaving faces unsupported while open", {
            ...POOR,
            safety: "Collapse risk and unguarded edges near children.",
            legal: "Breaches CDM 2015 and BS 5975.",
            why: "Speed does not justify unsupported excavations, especially adjacent to a school.",
            add: [],
            note: "Unsupported open excavations.",
          }),
        ],
      },
      height: {
        prompt:
          "The frame and pitched roof require work at height near the boundary. How is access controlled?",
        decisions: [
          d("Erect a tied, inspected scaffold with double guardrails, toe boards and brick guards, plus roof edge protection and netting, with no work over the boundary line", {
            ...IDEAL,
            safety: "Collective protection and no dropped-object risk to the school side.",
            legal: "Meets WAHR 2005 and the 7-day inspection regime.",
            why: "Scaffold with collective protection and debris control is the right approach near an occupied building.",
            add: ["scaffold", "edge_protection", "signage"],
            note: "Tied scaffold with edge/debris protection.",
          }),
          d("Use MEWPs for the frame and a scaffold only at the roof, with harnesses as backup", {
            ...PART,
            safety: "Acceptable but MEWP positioning near the boundary needs care.",
            legal: "Compliant with controls; mixed methods need clear planning.",
            why: "MEWPs are fine away from the boundary; collective protection should still lead at the roof.",
            add: ["mewp", "edge_protection"],
            note: "Mixed MEWP/scaffold access.",
          }),
          d("Have roofers use ladders and roof ladders with a lanyard where anchors exist", {
            ...POOR,
            safety: "High fall and dropped-object risk near children.",
            legal: "Breaches WAHR 2005.",
            why: "Ladder-based roof work without collective protection is unsafe and indefensible next to a school.",
            add: [],
            note: "Ladder roof access.",
          }),
        ],
      },
      lifting: {
        prompt:
          "Steel frame members and roof trusses need lifting near the boundary. How do you plan lifts?",
        decisions: [
          d("Use a mobile crane with an Appointed Person, lift plan, validated ground bearing, exclusion zones excluding the school side, and lifts only outside school hours where over-boundary risk exists", {
            ...IDEAL,
            safety: "Keeps suspended loads away from children and staff.",
            legal: "Meets LOLER 1998 and BS 7121.",
            why: "Planned lifts with exclusion zones and timing controls protect the adjacent school during lifting.",
            add: ["mobile_crane", "exclusion_zone", "banksman", "signage"],
            note: "Planned lifts, school-side excluded.",
          }),
          d("Use a telehandler and crane with a banksman and cordon the immediate lift area", {
            ...PART,
            safety: "Local control but no formal lift plan or timing strategy.",
            legal: "Partially compliant — an AP and written plan are expected.",
            why: "Cordoning the lift area helps but a documented plan and AP are still required.",
            add: ["mobile_crane", "exclusion_zone"],
            note: "Cordon only; no formal plan.",
          }),
          d("Lift members as the steel arrives and keep the team clear by shouting warnings", {
            ...POOR,
            safety: "Suspended loads near an occupied school with no planning.",
            legal: "Serious breach of LOLER/BS 7121.",
            why: "Unplanned lifting beside a live school is an unacceptable risk to children and workers.",
            add: ["mobile_crane"],
            note: "Unplanned lifting.",
          }),
        ],
      },
      systems: {
        prompt:
          "How will you run safe systems, safeguarding and emergencies alongside a live school?",
        decisions: [
          d("Brief task RAMS, operate permits for high-risk work, keep an ITP, brief all staff on safeguarding (DBS, no contact with pupils), and agree a joint emergency/evacuation plan with the school", {
            ...IDEAL,
            safety: "Controls tasks and protects children; emergencies are coordinated.",
            legal: "Meets CDM 2015, MHSWR and safeguarding obligations.",
            why: "Working beside a school adds safeguarding and joint emergency planning to the standard safe-system regime.",
            add: ["fire_point", "first_aid", "signage"],
            note: "RAMS, permits, ITP, safeguarding, joint emergency plan.",
          }),
          d("Use a standard induction with a safeguarding mention and the contractor's generic emergency plan", {
            ...PART,
            safety: "Baseline only; safeguarding and coordination are thin.",
            legal: "Partially compliant — safeguarding near schools needs more rigour.",
            why: "A passing mention of safeguarding is insufficient where children are present daily.",
            add: ["first_aid"],
            note: "Generic systems, light safeguarding.",
          }),
          d("Rely on the fence to keep children out and deal with safety matters as they come up", {
            ...POOR,
            safety: "No structured task control or safeguarding regime.",
            legal: "Breaches CDM 2015 and safeguarding duties.",
            why: "A fence alone is not a safe system of work, and safeguarding cannot be left to chance.",
            add: [],
            note: "No formal systems.",
          }),
        ],
      },
    },
  },

  {
    slug: "housing-development",
    title: "Residential Housing Development",
    sector: "Residential",
    difficulty: "foundation",
    summary:
      "A greenfield housing development of multiple plots with groundworks, timber-frame erection and high delivery volumes.",
    description:
      "You are setting up a residential development of detached and terraced homes across several plots. The work includes drainage and foundations, timber-frame and roof erection, and frequent material deliveries on shared estate roads. Early plots will be occupied while later plots are still under construction, so public interface grows over time.",
    image_key: "housing",
    stages: {
      mobilisation: {
        prompt:
          "How do you set up the compound, welfare and site security on the greenfield plot?",
        decisions: [
          d("Establish a central compound with Heras fencing on a secure perimeter, welfare cabins (toilets, canteen, drying room) sized for the workforce, signage and a controlled single entrance", {
            ...IDEAL,
            safety: "Secure perimeter and proper welfare from the start.",
            legal: "Meets CDM 2015 Schedule 2 welfare duties.",
            why: "Even on greenfield sites a secure perimeter and full welfare must be in place before work begins.",
            add: ["heras_fencing", "security_gate", "welfare_unit", "site_office", "signage"],
            note: "Secure compound with welfare.",
          }),
          d("Bring welfare cabins but leave the perimeter open where it backs onto fields", {
            ...PART,
            safety: "Welfare is fine but an open perimeter invites trespass.",
            legal: "Partially compliant — the site must be secured against unauthorised access.",
            why: "Open boundaries risk public and child access, theft and vandalism, even in rural settings.",
            add: ["welfare_unit", "site_office"],
            note: "Welfare provided, perimeter open.",
          }),
          d("Start the show-home plot first and add welfare and fencing once the team is established", {
            ...POOR,
            safety: "Workforce without facilities and an unsecured site.",
            legal: "Breaches CDM 2015 welfare duties.",
            why: "Welfare and security are prerequisites, not later additions.",
            add: [],
            note: "No welfare or security at start.",
          }),
        ],
      },
      logistics: {
        prompt:
          "Estate roads carry both deliveries and (later) residents. How do you manage traffic and pedestrians?",
        decisions: [
          d("Operate a logistics plan with a delivery booking system, banksman, signed haul routes, a wheel-wash, speed limits, and physical segregation of occupied plots from construction traffic", {
            ...IDEAL,
            safety: "Separates residents and pedestrians from site vehicles.",
            legal: "Aligns with HSG144 and the duty to protect the public.",
            why: "Booked deliveries, haul routes and segregation of occupied areas are key as the site becomes part-occupied.",
            add: ["vehicle_route", "pedestrian_route", "banksman", "wheel_wash", "signage"],
            note: "Booked deliveries, segregated occupied plots.",
          }),
          d("Sign the haul route and ask drivers to keep speeds low around occupied plots", {
            ...PART,
            safety: "Some control but relies on driver behaviour.",
            legal: "Partially compliant — physical segregation of residents is expected.",
            why: "Signs and goodwill do not reliably protect residents living among active construction.",
            add: ["vehicle_route", "signage"],
            note: "Signed route, no segregation.",
          }),
          d("Let deliveries find their own way around the plots as access changes day to day", {
            ...POOR,
            safety: "Vehicles and residents mixing on shared roads.",
            legal: "Breaches traffic management and public-protection duties.",
            why: "Ad-hoc routing around occupied homes endangers residents, especially children.",
            add: ["vehicle_route"],
            note: "Ad-hoc delivery routing.",
          }),
        ],
      },
      groundworks: {
        prompt:
          "Foundations and deep drainage runs are needed across the plots. How do you control excavations?",
        decisions: [
          d("Issue permits-to-dig with services located (CAT/GPR), use trench boxes/shoring for runs over 1.2 m, provide edge protection and barriers, and inspect daily", {
            ...IDEAL,
            safety: "Prevents collapse and service strikes across many small excavations.",
            legal: "Meets CDM 2015, BS 5975 and HSG47.",
            why: "Repetitive trenching is a common killer; support, service location and inspection are essential.",
            add: ["excavation_support", "trench_box", "exclusion_zone", "edge_protection"],
            note: "Permits, support and inspection.",
          }),
          d("Use trench boxes on the deep drainage but batter the shallow foundation digs", {
            ...PART,
            safety: "Good for drainage; shallow digs still need attention to ground and edges.",
            legal: "Partially compliant — service location and edge protection still required.",
            why: "Even shallow excavations need service checks and edge protection where people pass.",
            add: ["trench_box", "exclusion_zone"],
            note: "Partial support; limited controls.",
          }),
          d("Dig foundations and drainage to vertical faces and work in them briefly to keep pace", {
            ...POOR,
            safety: "Trench collapse risk — a leading cause of construction deaths.",
            legal: "Breaches CDM 2015 and BS 5975.",
            why: "Entering unsupported trenches, even briefly, has killed many workers; it is never acceptable.",
            add: [],
            note: "Unsupported trenches.",
          }),
        ],
      },
      height: {
        prompt:
          "Timber frames and pitched roofs are erected across the plots. How is work at height managed?",
        decisions: [
          d("Use proprietary edge protection systems, tied scaffold for roof works with guardrails and toe boards, safety nets under the roof during erection, and trained operatives", {
            ...IDEAL,
            safety: "Collective protection during the highest-risk roof phase.",
            legal: "Meets WAHR 2005; nets provide collective fall arrest.",
            why: "Roof erection is high risk; scaffold, edge protection and safety nets are the standard controls.",
            add: ["scaffold", "edge_protection", "signage"],
            note: "Scaffold, edge protection and nets.",
          }),
          d("Erect scaffold to the eaves and use harnesses for the roof, with a roof ladder", {
            ...PART,
            safety: "Eaves protection is good but roof work leans on PPE.",
            legal: "Acceptable with rescue plan but collective protection is preferred.",
            why: "Harnesses require anchor points and rescue plans; nets/edge protection rank higher.",
            add: ["scaffold", "edge_protection"],
            note: "Scaffold to eaves; PPE on roof.",
          }),
          d("Have the frame and roof crews work off the structure using ladders to access levels", {
            ...POOR,
            safety: "Falls during frame and roof erection.",
            legal: "Breaches WAHR 2005.",
            why: "Climbing the frame and ladder access for roof work are frequent causes of serious falls.",
            add: [],
            note: "Ladder access, no edge protection.",
          }),
        ],
      },
      lifting: {
        prompt:
          "Timber-frame panels and roof trusses are delivered and lifted into place. How do you plan lifting?",
        decisions: [
          d("Use a lorry-loader/telehandler with trained operators and slingers, a lift plan, exclusion zones, and a banksman, checking ground and proximity to occupied plots", {
            ...IDEAL,
            safety: "Controls panel lifts and keeps residents and workers clear.",
            legal: "Meets LOLER 1998 and PUWER 1998.",
            why: "Even routine frame lifts need a plan, competent operators, exclusion zones and ground checks.",
            add: ["mobile_crane", "exclusion_zone", "banksman", "signage"],
            note: "Planned panel lifts with exclusion zones.",
          }),
          d("Use the delivery lorry's crane with the driver slinging loads and a spotter nearby", {
            ...PART,
            safety: "Workable but the driver may not be a competent slinger and planning is light.",
            legal: "Partially compliant — competence and a lift plan must be assured.",
            why: "Lorry-loader lifts still need competent slinging, planning and exclusion zones.",
            add: ["mobile_crane", "exclusion_zone"],
            note: "Driver-slung loads; light planning.",
          }),
          d("Lift panels straight off the lorry near occupied plots without a set exclusion zone", {
            ...POOR,
            safety: "Suspended loads over or near residents and workers.",
            legal: "Breaches LOLER/PUWER.",
            why: "Unplanned lifting beside occupied homes risks struck-by and dropped-load incidents.",
            add: ["mobile_crane"],
            note: "Unplanned lifting near homes.",
          }),
        ],
      },
      systems: {
        prompt:
          "How will you run safe systems, inspections and emergencies across a phased, part-occupied site?",
        decisions: [
          d("Brief task RAMS, permits for excavations and lifting, ITPs for foundations and drainage, COSHH controls, and an emergency plan with fire points and first aid covering occupied plots", {
            ...IDEAL,
            safety: "Matches controls to tasks and covers residents in emergencies.",
            legal: "Meets CDM 2015, MHSWR and COSHH 2002.",
            why: "A phased, part-occupied site needs task RAMS, permits, ITPs and an emergency plan that includes residents.",
            add: ["fire_point", "first_aid", "signage"],
            note: "RAMS, permits, ITP, emergency plan.",
          }),
          d("Run a standard induction and a generic risk assessment covering the whole site", {
            ...PART,
            safety: "Baseline only; misses task and occupancy-specific risks.",
            legal: "Partially compliant — RAMS must be task-specific.",
            why: "Generic documents do not address the changing risks of a phased, occupied development.",
            add: ["first_aid"],
            note: "Generic risk assessment.",
          }),
          d("Keep things flexible and brief the team verbally each morning", {
            ...POOR,
            safety: "No documented control or emergency preparedness.",
            legal: "Breaches CDM 2015 and MHSWR.",
            why: "Verbal-only briefings are not a safe system of work and leave emergencies unplanned.",
            add: [],
            note: "Verbal briefings only.",
          }),
        ],
      },
    },
  },

  {
    slug: "distribution-warehouse",
    title: "Distribution Warehouse",
    sector: "Industrial",
    difficulty: "intermediate",
    summary:
      "A large-footprint distribution warehouse with piled foundations, a steel portal frame, cladding at height and MEWP access.",
    description:
      "You are managing construction of a large distribution centre. The works include piling and ground-bearing slabs, erection of a tall steel portal frame, roof and wall cladding using MEWPs, and significant plant movements across an open site. Scale, simultaneous trades and work at height dominate the risk picture.",
    image_key: "warehouse",
    stages: {
      mobilisation: {
        prompt:
          "On a large open plot, how do you establish the boundary, welfare and security?",
        decisions: [
          d("Secure the full perimeter with fencing and lockable gates, provide a welfare village (toilets, canteen, drying rooms) scaled for a large workforce, a site office, signage and CCTV", {
            ...IDEAL,
            safety: "Controls access to a large site and supports a big workforce.",
            legal: "Meets CDM 2015 Schedule 2 for the planned numbers.",
            why: "Large sites need a fully secured perimeter and welfare scaled to the peak workforce from the outset.",
            add: ["heras_fencing", "security_gate", "welfare_unit", "site_office", "cctv", "material_storage"],
            note: "Full perimeter, welfare village.",
          }),
          d("Fence the active working zone now and extend the perimeter as the build spreads out", {
            ...PART,
            safety: "Active area secured but the wider plot is exposed.",
            legal: "Partially compliant — the whole site under your control must be secured.",
            why: "Leaving large areas of the site unsecured invites unauthorised access and plant theft.",
            add: ["heras_fencing", "welfare_unit", "site_office"],
            note: "Partial perimeter only.",
          }),
          d("Rely on the site's distance from the public and minimal welfare until numbers build", {
            ...POOR,
            safety: "Workforce without adequate facilities; site insecure.",
            legal: "Breaches CDM 2015 welfare duties.",
            why: "Remoteness does not remove the duty to secure the site and provide proper welfare.",
            add: [],
            note: "Minimal welfare and security.",
          }),
        ],
      },
      logistics: {
        prompt:
          "Heavy plant and deliveries move across a large open site alongside trades on foot. How do you manage it?",
        decisions: [
          d("Establish one-way haul roads, segregated pedestrian walkways, designated laydown areas, a banksman regime, speed limits and a wheel-wash, reviewed as the build progresses", {
            ...IDEAL,
            safety: "Separates plant from people across a busy, changing site.",
            legal: "Aligns with HSG144 and workplace transport guidance.",
            why: "On large plant-heavy sites, segregated routes, laydown discipline and marshalling prevent struck-by incidents.",
            add: ["vehicle_route", "pedestrian_route", "one_way_system", "banksman", "wheel_wash", "lay_down_area", "signage"],
            note: "Segregated haul roads and walkways.",
          }),
          d("Mark walking routes with cones and brief plant operators to watch for pedestrians", {
            ...PART,
            safety: "Some demarcation but relies on operator vigilance.",
            legal: "Partially compliant — physical segregation is preferred.",
            why: "Cones and briefings are weaker than defined, segregated routes on a large plant site.",
            add: ["vehicle_route", "pedestrian_route", "signage"],
            note: "Cone-marked routes.",
          }),
          d("Let plant and people share the open site and manage interactions informally", {
            ...POOR,
            safety: "High struck-by risk from plant movements.",
            legal: "Breaches workplace transport and CDM duties.",
            why: "Mixing plant and pedestrians without segregation is a leading cause of serious site injuries.",
            add: ["vehicle_route"],
            note: "No segregation of plant and people.",
          }),
        ],
      },
      groundworks: {
        prompt:
          "The frame sits on piled foundations across the footprint. How do you control piling and excavation?",
        decisions: [
          d("Use a piling mat designed and certified (e.g. to BRE 470) with a TWC, exclusion zones around rigs, service location, and inspection of mats and excavations", {
            ...IDEAL,
            safety: "Prevents rig overturn and collapse; keeps people clear of rigs.",
            legal: "Meets BS 5975, CDM 2015 and HSG47; piling mats per BRE 470.",
            why: "Piling rigs must work off a designed, certified mat with exclusion zones — overturns are catastrophic.",
            add: ["excavation_support", "exclusion_zone", "signage", "material_storage"],
            note: "Certified piling mat, rig exclusion zones.",
          }),
          d("Lay a granular working platform by experience and keep people back from the rigs", {
            ...PART,
            safety: "Better than nothing but an unverified platform may fail under the rig.",
            legal: "Partially compliant — the platform should be designed and certified.",
            why: "Working platforms for piling rigs must be engineered and signed off, not judged by eye.",
            add: ["exclusion_zone", "signage"],
            note: "Uncertified working platform.",
          }),
          d("Track the piling rig straight onto the formation and pile as the ground allows", {
            ...POOR,
            safety: "Rig overturn risk on inadequate ground.",
            legal: "Breaches BS 5975 and CDM 2015.",
            why: "Operating heavy piling rigs without a designed platform is a known cause of fatal overturns.",
            add: [],
            note: "No designed piling platform.",
          }),
        ],
      },
      height: {
        prompt:
          "Tall steel frame, roof and wall cladding require work at height across a big footprint. How is access controlled?",
        decisions: [
          d("Use MEWPs matched to the task with trained operators, harness/restraint where specified, exclusion zones beneath, rescue plans, and edge protection / nets on the roof", {
            ...IDEAL,
            safety: "Provides safe access and arrests falls on the roof.",
            legal: "Meets WAHR 2005; MEWP operators trained (e.g. IPAF), rescue planned.",
            why: "Large cladding/roof works are typically MEWP-led with collective roof protection and rescue arrangements.",
            add: ["mewp", "edge_protection", "exclusion_zone", "signage"],
            note: "MEWP access with roof nets/edge protection.",
          }),
          d("Use MEWPs for cladding and scaffold towers at the gable ends, harnesses on the roof", {
            ...PART,
            safety: "Reasonable but roof work leans on PPE without nets.",
            legal: "Acceptable with rescue plan; collective protection preferred on the roof.",
            why: "MEWPs and towers are valid; the roof phase should still prioritise nets/edge protection.",
            add: ["mewp", "edge_protection"],
            note: "MEWP/tower mix; PPE on roof.",
          }),
          d("Erect the frame and clad using ladders and the steelwork itself for access", {
            ...POOR,
            safety: "Severe fall risk on a tall frame.",
            legal: "Breaches WAHR 2005.",
            why: "Climbing steel and using ladders for tall cladding work is extremely dangerous and non-compliant.",
            add: [],
            note: "Ladder/steel-climbing access.",
          }),
        ],
      },
      lifting: {
        prompt:
          "Steel portal frame members are lifted by mobile crane across the site. How do you plan the lifts?",
        decisions: [
          d("Appoint an Appointed Person, produce lift plans per area, validate ground bearing for crane outriggers, set exclusion zones, use trained slingers/signallers and coordinate with other trades", {
            ...IDEAL,
            safety: "Controls heavy steel lifts amid simultaneous trades.",
            legal: "Meets LOLER 1998 and BS 7121.",
            why: "Repeated heavy lifts across a busy site need an AP, area lift plans, ground validation and trade coordination.",
            add: ["mobile_crane", "exclusion_zone", "banksman", "signage"],
            note: "Area lift plans with exclusion zones.",
          }),
          d("Use a competent crane crew with a standard lift plan and outrigger mats", {
            ...PART,
            safety: "Competent crew but coordination with other trades is informal.",
            legal: "Partially compliant — area-specific plans and coordination expected.",
            why: "Standard plans miss the coordination needed where many trades work beneath lifts.",
            add: ["mobile_crane", "exclusion_zone"],
            note: "Standard plan; informal coordination.",
          }),
          d("Lift steel as it arrives and keep other trades working in the same area to hold the programme", {
            ...POOR,
            safety: "Loads over working trades; struck-by and dropped-load risk.",
            legal: "Breaches LOLER/BS 7121.",
            why: "Lifting over working people to protect the programme is a classic, dangerous false economy.",
            add: ["mobile_crane"],
            note: "Lifting over working trades.",
          }),
        ],
      },
      systems: {
        prompt:
          "How will you run safe systems, inspection regimes and emergencies on a large multi-trade site?",
        decisions: [
          d("Operate task RAMS, permits for piling/lifting/hot works, ITPs for piling, slab and frame, daily coordination of simultaneous operations, and an emergency plan with fire points, first aid and rescue", {
            ...IDEAL,
            safety: "Controls each task and the interfaces between trades.",
            legal: "Meets CDM 2015 and MHSWR; ITPs assure quality holds.",
            why: "Large multi-trade sites need permits, ITPs, daily SIMOPS coordination and a tested emergency plan.",
            add: ["fire_point", "first_aid", "signage"],
            note: "RAMS, permits, ITP, SIMOPS coordination.",
          }),
          d("Use task RAMS and a standard emergency plan but coordinate trades only at weekly meetings", {
            ...PART,
            safety: "Good documents but weak day-to-day interface control.",
            legal: "Partially compliant — simultaneous operations need closer coordination.",
            why: "Weekly coordination is too coarse where many trades share space daily.",
            add: ["first_aid"],
            note: "Weekly-only coordination.",
          }),
          d("Issue generic RAMS and let supervisors sort out clashes between trades as they happen", {
            ...POOR,
            safety: "Uncontrolled interfaces between high-risk activities.",
            legal: "Breaches CDM 2015 and MHSWR.",
            why: "Leaving high-risk interfaces to chance on a large site invites serious incidents.",
            add: [],
            note: "Generic RAMS, no coordination.",
          }),
        ],
      },
    },
  },
];

// ── Assemble normalised objects with deterministic IDs ───────────────────────

function buildScenario(s, sIndex) {
  const scenario_id = uuid(`scenario:${s.slug}`);
  const stages = STAGE_ORDER.map((key, i) => {
    const meta = STAGE_META[key];
    const def = s.stages[key];
    const stage_id = uuid(`stage:${s.slug}:${key}`);
    const decisions = def.decisions.map((dec, j) => ({
      id: uuid(`decision:${s.slug}:${key}:${j}`),
      stage_id,
      choice_text: dec.choice_text,
      safety_impact: dec.safety_impact,
      legal_impact: dec.legal_impact,
      explanation: dec.explanation,
      score_effect: dec.score_effect,
      risk_effect: dec.risk_effect,
      is_ideal: dec.is_ideal,
      layout_effect: dec.layout_effect,
      sort_order: j,
    }));
    return {
      id: stage_id,
      scenario_id,
      key,
      title: meta.title,
      phase: meta.phase,
      learning_outcome: meta.learning_outcome,
      prompt: def.prompt,
      sort_order: i,
      decisions,
    };
  });
  return {
    id: scenario_id,
    slug: s.slug,
    title: s.title,
    sector: s.sector,
    difficulty: s.difficulty,
    summary: s.summary,
    description: s.description,
    image_key: s.image_key,
    is_published: true,
    sort_order: sIndex,
    stages,
  };
}

const built = scenarios.map(buildScenario);

// ── Write content/scenarios.json ─────────────────────────────────────────────

mkdirSync(resolve(root, "content"), { recursive: true });
writeFileSync(
  resolve(root, "content/scenarios.json"),
  JSON.stringify({ scenarios: built }, null, 2) + "\n",
);

// ── Write supabase/seed.sql ──────────────────────────────────────────────────

const q = (v) => {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  return "'" + String(v).replace(/'/g, "''") + "'";
};
const jsonb = (v) => "'" + JSON.stringify(v).replace(/'/g, "''") + "'::jsonb";

let sql = `-- SiteSafe seed data — GENERATED by scripts/build-content.mjs. Do not edit by hand.
-- Idempotent: clears and re-inserts the five seed scenarios.
begin;

delete from decisions where stage_id in (
  select id from stages where scenario_id in (select id from scenarios where slug in (${built
    .map((s) => q(s.slug))
    .join(", ")}))
);
delete from stages where scenario_id in (select id from scenarios where slug in (${built
  .map((s) => q(s.slug))
  .join(", ")}));
delete from scenarios where slug in (${built.map((s) => q(s.slug)).join(", ")});

`;

for (const s of built) {
  sql += `insert into scenarios (id, slug, title, sector, difficulty, summary, description, image_key, is_published, sort_order) values (${q(
    s.id,
  )}, ${q(s.slug)}, ${q(s.title)}, ${q(s.sector)}, ${q(s.difficulty)}, ${q(s.summary)}, ${q(
    s.description,
  )}, ${q(s.image_key)}, ${q(s.is_published)}, ${q(s.sort_order)});\n`;
  for (const st of s.stages) {
    sql += `insert into stages (id, scenario_id, key, title, phase, learning_outcome, prompt, sort_order) values (${q(
      st.id,
    )}, ${q(st.scenario_id)}, ${q(st.key)}, ${q(st.title)}, ${q(st.phase)}, ${q(
      st.learning_outcome,
    )}, ${q(st.prompt)}, ${q(st.sort_order)});\n`;
    for (const dec of st.decisions) {
      sql += `insert into decisions (id, stage_id, choice_text, safety_impact, legal_impact, explanation, score_effect, risk_effect, is_ideal, layout_effect, sort_order) values (${q(
        dec.id,
      )}, ${q(dec.stage_id)}, ${q(dec.choice_text)}, ${q(dec.safety_impact)}, ${q(
        dec.legal_impact,
      )}, ${q(dec.explanation)}, ${q(dec.score_effect)}, ${q(dec.risk_effect)}, ${q(
        dec.is_ideal,
      )}, ${jsonb(dec.layout_effect)}, ${q(dec.sort_order)});\n`;
    }
    sql += "\n";
  }
}

sql += "commit;\n";

mkdirSync(resolve(root, "supabase"), { recursive: true });
writeFileSync(resolve(root, "supabase/seed.sql"), sql);

const decisionCount = built.reduce(
  (a, s) => a + s.stages.reduce((b, st) => b + st.decisions.length, 0),
  0,
);
console.log(
  `Built ${built.length} scenarios, ${built.reduce((a, s) => a + s.stages.length, 0)} stages, ${decisionCount} decisions.`,
);
console.log("→ content/scenarios.json");
console.log("→ supabase/seed.sql");
