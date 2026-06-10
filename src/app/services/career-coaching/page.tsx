import type { Metadata } from "next";
import ServicePageTemplate from "@/components/ServicePageTemplate";
import { prices, stripeLinks } from "@/lib/site";

export const metadata: Metadata = {
  title: "Construction Career Coaching — Engineers, Managers & Site Professionals",
  description:
    "Career direction calls for construction professionals: routes into management, temporary works, HV/energy/utilities, overseas relocation and chartership positioning.",
};

export default function CareerCoachingPage() {
  return (
    <ServicePageTemplate
      eyebrow="Career Coaching"
      title="Construction Career Coaching With Someone Who Has Done the Job"
      intro="A focused career call with a 29-year construction professional who has worked across civil engineering, temporary works, HV infrastructure, safety, training and consultancy — not a generic life coach reading from a script."
      price={prices.coachingCall}
      stripeLink={stripeLinks.coachingCall}
      imageLabel="Coaching call illustration — video call with notes"
      whoFor={[
        "Site engineers ready to step towards project management",
        "Engineers and supervisors moving into temporary works (TWS/TWC routes)",
        "Professionals targeting HV, energy, utilities or data centre work",
        "UK professionals considering Middle East, Singapore or other overseas roles",
        "International engineers planning a move to the UK",
        "Professionals preparing chartership / professional membership profiles",
        "Trades moving into supervision and management",
      ]}
      included={[
        "45 or 60-minute career direction call",
        "Honest assessment of your current position and options",
        "Route into management, temporary works or HV/energy/utilities",
        "Overseas relocation positioning where relevant",
        "Chartership / professional membership profile support",
        "Salary and role targeting",
        "Written action plan after the call",
      ]}
      sections={[
        {
          heading: "Typical coaching topics",
          body: (
            <p>
              How do I move from site engineer to project manager? How do I get
              temporary works coordinator experience recognised? Is my
              experience strong enough for the Middle East market? How do I
              position 15 years of trades experience for a supervision role?
              What should I target next to support chartership? These are the
              conversations this call is built for.
            </p>
          ),
        },
        {
          heading: "What coaching is — and isn't",
          body: (
            <p>
              Coaching gives you an experienced, independent view of your
              options, your positioning and your next steps, with a concrete
              action plan. It is not a recruitment service: we do not place
              candidates, do not promise introductions and cannot guarantee any
              role, salary or outcome. Decisions and applications remain yours.
            </p>
          ),
        },
      ]}
    />
  );
}
