import Link from "next/link";

export const metadata = { title: "Access denied" };

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        403
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">
        You don&rsquo;t have access to this page
      </h1>
      <p className="mt-3 text-slate-600">
        Your account role doesn&rsquo;t permit viewing this area. If you think
        this is a mistake, contact your administrator.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
      >
        Back to home
      </Link>
    </main>
  );
}
