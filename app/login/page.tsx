"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", { email, password, redirect: false });

    if (!res || !res.ok) {
      setLoading(false);
      // NextAuth v4 surfaces a thrown authorize() error's message here; an
      // authorize() that returns null (bad credentials) instead comes back as
      // the generic string "CredentialsSignin", which we don't show verbatim.
      setError(
        res?.error && res.error !== "CredentialsSignin" ? res.error : "Incorrect email or password.",
      );
      return;
    }

    // The role lives in the session, not in the sign-in response, so it's
    // fetched once here to route to the right dashboard.
    const session = await fetch("/api/auth/session").then((r) => r.json());
    const role = session?.user?.role;
    router.push(
      role === "ADMIN" || role === "STAFF"
        ? "/dashboard/admin"
        : role === "DOCTOR"
          ? "/dashboard/doc"
          : "/dashboard/user",
    );
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-accent-700 text-sm font-bold text-white">
            M+
          </div>
          <h1 className="text-xl font-semibold text-ink-900">Sign in to MediCare+</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-rule bg-surface p-6">
          {error && (
            <p className="rounded-md bg-[var(--color-signal-stop-bg)] px-3 py-2 text-sm text-[var(--color-signal-stop)]">
              {error}
            </p>
          )}
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" loading={loading} className="mt-1 w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-500">
          New patient?{" "}
          <Link href="/signup" className="font-medium text-accent-700 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
