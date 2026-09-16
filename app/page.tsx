import Link from "next/link";

// The subject here is a clinic booking a patient in — so the hero is the thing
// a first-time visitor actually wants: a way to book, not a stock photo of
// smiling clinicians. Copy states what happens, not brand adjectives.

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-paper">
      <header className="flex items-center justify-between border-b border-rule px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-700 text-xs font-bold text-white">
            M+
          </div>
          <span className="text-sm font-semibold text-ink-900">MediCare+</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/login" className="rounded-md px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-900/5">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-accent-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-600"
          >
            Create account
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
          Book, track and manage your care in one place
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-500">
          See a doctor&apos;s real availability, keep your appointment history and
          prescriptions together, and know exactly what you owe.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-md bg-accent-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-600"
          >
            Book an appointment
          </Link>
          <Link
            href="/emergency"
            className="rounded-md border border-rule-strong px-5 py-2.5 text-sm font-medium text-ink-900 hover:bg-white"
          >
            Emergency information
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl gap-4 px-6 pb-20 sm:grid-cols-3">
        {[
          {
            title: "Real availability",
            body: "Booking shows a doctor's actual open slots, not a form that gets rejected later.",
          },
          {
            title: "One record",
            body: "Visits, diagnoses and prescriptions stay linked and in order, for you and your doctor.",
          },
          {
            title: "Clear billing",
            body: "Every invoice shows what's owed, what's paid, and when it's due.",
          },
        ].map((f) => (
          <div key={f.title} className="rounded-lg border border-rule bg-surface p-5">
            <h2 className="text-sm font-semibold text-ink-900">{f.title}</h2>
            <p className="mt-1.5 text-sm text-ink-500">{f.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
