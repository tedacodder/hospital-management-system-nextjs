import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "About" };

export default async function AboutPage() {
  const [departments, doctorCount] = await Promise.all([
    prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.doctor.count(),
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <Link href="/" className="text-sm text-accent-700 hover:underline">
        ← Back home
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-ink-900">About MediCare+</h1>
      <p className="mt-3 text-ink-700">
        MediCare+ coordinates appointments, medical records, prescriptions and
        billing for patients, doctors and administrative staff in one system.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-rule bg-surface p-4">
          <p className="font-mono text-2xl font-semibold text-ink-900">{doctorCount}</p>
          <p className="text-sm text-ink-500">Doctors on staff</p>
        </div>
        <div className="rounded-lg border border-rule bg-surface p-4">
          <p className="font-mono text-2xl font-semibold text-ink-900">{departments.length}</p>
          <p className="text-sm text-ink-500">Departments</p>
        </div>
      </div>

      {departments.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-semibold text-ink-900">Departments</h2>
          <ul className="mt-3 divide-y divide-rule rounded-lg border border-rule bg-surface">
            {departments.map((d) => (
              <li key={d.id} className="px-4 py-3">
                <p className="text-sm font-medium text-ink-900">{d.name}</p>
                {d.description && <p className="mt-0.5 text-sm text-ink-500">{d.description}</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
