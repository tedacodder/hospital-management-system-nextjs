import Link from "next/link";
import { delay } from "@/components/brand/motion";
import { HeroBoard } from "@/components/marketing/HeroBoard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ArrowRightIcon } from "@/components/ui/Icons";

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-x-clip">
      {/* Surface: measurement grid + a single ambient light. Purely decorative. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0" />
        <div className="glow-accent absolute -right-40 -top-40 h-[34rem] w-[34rem]" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-16 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12 lg:pb-28 lg:pt-24">
        <div>
          <p
            className="animate-rise inline-flex items-center gap-2 rounded-md border border-rule-strong bg-surface/70 px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-wider text-ink-700"
            style={delay(0)}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden="true" />
            Patients · Doctors · Clinic staff
          </p>

          <h1
            id="hero-heading"
            className="animate-rise mt-6 text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.03em] text-ink-900 sm:text-6xl lg:text-[3.75rem] xl:text-[4.25rem]"
            style={delay(60)}
          >
            The whole visit,{" "}
            <span className="text-ink-500">in one record.</span>
          </h1>

          <p className="animate-rise mt-6 max-w-xl text-lg leading-relaxed text-ink-700" style={delay(140)}>
            Book against a doctor&apos;s real open slots, keep visits, prescriptions and documents in one
            chart, and see exactly what you owe. One system for the patient, the doctor and the front desk.
          </p>

          <div className="animate-rise mt-8 flex flex-col gap-3 sm:flex-row" style={delay(220)}>
            <ButtonLink href="/signup" size="lg" className="group">
              Create your account
              <ArrowRightIcon className="h-[18px] w-[18px] transition-transform duration-150 group-hover:translate-x-0.5" />
            </ButtonLink>
            <ButtonLink href="/login" variant="secondary" size="lg">
              Sign in
            </ButtonLink>
          </div>

          <div className="animate-rise mt-7 space-y-2 text-sm text-ink-500" style={delay(300)}>
            <p>Public sign-up creates a patient account. Doctors and staff are added by an administrator.</p>
            <p>
              <Link
                href="/emergency"
                className="inline-flex items-center gap-2 font-medium text-ink-700 underline decoration-rule-strong underline-offset-4 transition-colors hover:text-ink-900 hover:decoration-ink-500"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-signal-stop)]" aria-hidden="true" />
                Urgent? See emergency information
              </Link>
            </p>
          </div>
        </div>

        <HeroBoard />
      </div>
    </section>
  );
}
