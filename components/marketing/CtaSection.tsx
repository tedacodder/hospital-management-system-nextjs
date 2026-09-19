import { ButtonLink } from "@/components/ui/ButtonLink";
import { ArrowRightIcon } from "@/components/ui/Icons";

export function CtaSection() {
  return (
    <section aria-labelledby="cta-heading" className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 sm:pb-28">
      <div className="reveal relative overflow-hidden rounded-xl bg-accent-700 px-6 py-12 text-center sm:px-10 sm:py-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="bg-grid-dark absolute inset-0 opacity-70" />
        </div>
        <div className="relative mx-auto max-w-2xl">
          <h2 id="cta-heading" className="text-[1.75rem] font-semibold leading-[1.12] tracking-[-0.025em] text-white sm:text-4xl">
            Bring the whole visit into one record.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/80 sm:text-lg">
            Create a patient account in a few fields, or sign in to your workspace.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/signup" variant="light" size="lg" className="group">
              Create your account
              <ArrowRightIcon className="h-[18px] w-[18px] transition-transform duration-150 group-hover:translate-x-0.5" />
            </ButtonLink>
            <ButtonLink href="/login" variant="outlineLight" size="lg">
              Sign in
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
