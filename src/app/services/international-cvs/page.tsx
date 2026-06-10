import type { Metadata } from "next";
import ServicePageTemplate from "@/components/ServicePageTemplate";
import { prices } from "@/lib/site";

export const metadata: Metadata = {
  title: "International Construction CVs — Middle East, Singapore & UK",
  description:
    "Location-targeted construction CVs for UK professionals moving to the Middle East or Singapore, and international engineers applying to UK roles. Sponsorship and relocation positioning included.",
};

export default function InternationalPage() {
  return (
    <ServicePageTemplate
      eyebrow="International CVs"
      title="International / Middle East / Singapore CV Pack"
      intro="Overseas construction markets read CVs differently. Length expectations, project emphasis, mobilisation readiness and sponsorship positioning all change by region. This pack targets your CV at the market you actually want."
      price={prices.internationalPack}
      imageLabel="International skyline / infrastructure photo"
      whoFor={[
        "UK engineers and managers targeting the Middle East (UAE, KSA, Qatar)",
        "Professionals targeting Singapore and wider Asia-Pacific",
        "International engineers applying to UK roles",
        "Professionals targeting mega-projects, data centres, rail and energy",
        "Families planning relocation who need credible mobilisation wording",
      ]}
      included={[
        "Location-targeted CV for your chosen market",
        "Relocation profile and mobilisation readiness wording",
        "Family relocation wording where relevant",
        "Employer sponsorship positioning (stated truthfully)",
        "Major projects / infrastructure emphasis",
        "Regional CV-convention guidance (length, photos, personal details)",
      ]}
      sections={[
        {
          heading: "Why regional targeting matters",
          body: (
            <p>
              A CV that performs well with UK contractors can undersell you in
              Dubai or Singapore — and vice versa. Gulf employers typically want
              more project detail, named mega-projects, clear mobilisation
              status and sometimes different personal information conventions.
              UK employers expect concise, achievement-led documents and clear
              right-to-work status. We build the version your target market
              expects, while keeping every claim truthful.
            </p>
          ),
        },
        {
          heading: "Honest sponsorship positioning",
          body: (
            <p>
              We will position your visa or sponsorship situation clearly and
              truthfully — never disguising it. Misrepresenting right-to-work
              status wastes everyone&apos;s time and can end an application
              permanently. Clear, upfront positioning is the strategy that
              actually works.
            </p>
          ),
        },
      ]}
    />
  );
}
