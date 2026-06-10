import { ButtonPrimary, ButtonSecondary } from "./ui";

export default function FinalCta({
  title = "Ready to Make Your Construction Experience Work Harder?",
}: {
  title?: string;
}) {
  return (
    <section className="bg-blueprint">
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-steel-200">
          Clearer, truthful, targeted career documents — built by a 29-year
          construction professional. We cannot guarantee selection, but we can
          make sure your real experience is presented properly.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonPrimary href="/upload-cv">Upload My CV</ButtonPrimary>
          <ButtonSecondary href="/book-a-call" light>
            Book a Call
          </ButtonSecondary>
          <ButtonSecondary href="/pricing" light>
            View Pricing
          </ButtonSecondary>
        </div>
      </div>
    </section>
  );
}
