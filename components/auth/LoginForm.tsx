"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthHeading } from "@/components/auth/AuthHeading";
import { FormAlert } from "@/components/auth/FormAlert";
import { PasswordToggle } from "@/components/auth/PasswordToggle";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import {
  NETWORK_ERROR_MESSAGE,
  SESSION_ERROR_MESSAGE,
  SIGN_IN_FALLBACK_MESSAGE,
  dashboardPathForRole,
  describeSignInError,
  validateLogin,
  type LoginErrors,
} from "@/lib/auth-forms";

export function LoginForm({ justRegistered = false }: { justRegistered?: boolean }) {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function focusPassword() {
    const input = passwordRef.current;
    if (!input) return;
    input.focus();
    input.select();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    setFormError(null);
    const found = validateLogin(email, password);
    setErrors(found);
    if (found.email) return emailRef.current?.focus();
    if (found.password) return passwordRef.current?.focus();

    setLoading(true);
    try {
      const res = await signIn("credentials", { email: email.trim(), password, redirect: false });

      if (!res || !res.ok) {
        // describeSignInError only ever returns text that is safe to show —
        // NextAuth passes through whatever authorize() threw, which can be a
        // database or configuration error.
        setFormError(res ? describeSignInError(res.error) : SIGN_IN_FALLBACK_MESSAGE);
        setLoading(false);
        focusPassword();
        return;
      }

      // The role lives in the session, not in the sign-in response, so it is
      // fetched once here to route to the right dashboard.
      let role: string | undefined;
      try {
        const session = await fetch("/api/auth/session").then((r) => r.json());
        role = session?.user?.role;
      } catch {
        setFormError(SESSION_ERROR_MESSAGE);
        setLoading(false);
        return;
      }

      // Left in the loading state on purpose: the button stays disabled until
      // the navigation replaces this page, so a second click can't submit again.
      router.push(dashboardPathForRole(role));
      router.refresh();
    } catch {
      setFormError(NETWORK_ERROR_MESSAGE);
      setLoading(false);
    }
  }

  return (
    <>
      <AuthHeading title="Sign in" description="Use the email and password for your MediCare+ account." />
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {justRegistered && !formError && (
          <FormAlert tone="success">Your account has been created. Sign in to continue.</FormAlert>
        )}
        {formError && <FormAlert tone="error">{formError}</FormAlert>}

        <TextField
          ref={emailRef}
          fieldSize="lg"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          error={errors.email}
        />

        <TextField
          ref={passwordRef}
          fieldSize="lg"
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={errors.password}
          trailing={
            <PasswordToggle
              visible={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
              controlsId="field-password"
            />
          }
        />

        <Button type="submit" size="lg" loading={loading} className="mt-1 w-full">
          {loading ? "Signing in…" : "Sign in"}
        </Button>

        <p className="text-center text-sm text-ink-500">
          New patient?{" "}
          <Link href="/signup" className="font-medium text-accent-700 underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </>
  );
}
