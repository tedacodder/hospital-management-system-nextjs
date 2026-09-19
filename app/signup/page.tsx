"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { ApiError, apiSend } from "@/lib/api-client";

// Public signup always creates a PATIENT account — see registerSchema and the
// /api/register route. There is no role selector here; the original form's
// admin option was the privilege-escalation bug fixed in the API rewrite.

type FieldErrors = Record<string, string[]>;

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    age: "",
    gender: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    setLoading(true);

    try {
      await apiSend("POST", "/register", form);
      const res = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (res?.ok) {
        router.push("/dashboard/user");
        return;
      }
      router.push("/login");
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fields ?? {});
        setFormError(err.fields ? null : err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-accent-700 text-sm font-bold text-white">
            M+
          </div>
          <h1 className="text-xl font-semibold text-ink-900">Create your patient account</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-rule bg-surface p-6">
          {formError && (
            <p role="alert" className="rounded-md bg-[var(--color-signal-stop-bg)] px-3 py-2 text-sm text-[var(--color-signal-stop)]">
              {formError}
            </p>
          )}

          <TextField
            label="Full name"
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            error={errors.name?.[0]}
          />
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            error={errors.email?.[0]}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            hint="At least 10 characters, with upper, lower and a number."
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            error={errors.password?.[0]}
          />

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Age"
              inputMode="numeric"
              value={form.age}
              onChange={(e) => set("age", e.target.value)}
              error={errors.age?.[0]}
            />
            <SelectField
              label="Gender"
              value={form.gender}
              onChange={(e) => set("gender", e.target.value)}
              error={errors.gender?.[0]}
            >
              <option value="">Prefer not to say</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </SelectField>
          </div>

          <TextField
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            error={errors.phone?.[0]}
          />

          <Button type="submit" loading={loading} className="mt-1 w-full">
            Create account
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
