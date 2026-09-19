"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthHeading } from "@/components/auth/AuthHeading";
import { FormAlert } from "@/components/auth/FormAlert";
import { PasswordChecklist } from "@/components/auth/PasswordChecklist";
import { PasswordToggle } from "@/components/auth/PasswordToggle";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { CheckIcon } from "@/components/ui/Icons";
import { apiSend } from "@/lib/api-client";
import {
  buildRegisterPayload,
  describeSignupError,
  firstInvalidField,
  sanitizeAgeInput,
  validateSignup,
  validateSignupField,
  type Gender,
  type SignupErrors,
  type SignupField,
  type SignupForm as SignupFormState,
} from "@/lib/auth-forms";

// Public signup always creates a PATIENT account — see registerSchema and the
// /api/register route. There is deliberately no role selector.

const EMPTY: SignupFormState = { name: "", email: "", password: "", phone: "", age: "", gender: "" };

type FieldElement = HTMLInputElement | HTMLSelectElement;

export function SignupForm() {
  const router = useRouter();
  const refs = useRef<Partial<Record<SignupField, FieldElement | null>>>({});

  const [form, setForm] = useState<SignupFormState>(EMPTY);
  const [errors, setErrors] = useState<SignupErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  function bind(field: SignupField) {
    return (el: FieldElement | null) => {
      refs.current[field] = el;
    };
  }

  function focusField(field: SignupField | undefined) {
    if (field) refs.current[field]?.focus();
  }

  function update(field: SignupField, value: string) {
    const next = { ...form, [field]: value } as SignupFormState;
    setForm(next);
    // Once a field has an error, re-check it as the person types so the message
    // clears the moment it is fixed instead of waiting for the next submit.
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateSignupField(field, next) }));
    }
  }

  function onBlur(field: SignupField) {
    // Only speak up about a field the person has actually filled in; an empty
    // required field is reported on submit, not the instant they tab past it.
    if (!form[field]) return;
    setErrors((prev) => ({ ...prev, [field]: validateSignupField(field, form) }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    setFormError(null);
    const found = validateSignup(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return focusField(firstInvalidField(found));

    setLoading(true);
    try {
      await apiSend("POST", "/register", buildRegisterPayload(form));
    } catch (err) {
      const failure = describeSignupError(err);
      setErrors(failure.fieldErrors);
      setFormError(failure.formError);
      setLoading(false);
      focusField(firstInvalidField(failure.fieldErrors));
      return;
    }

    // From here the account exists, so nothing below is reported as a failure
    // to create it. Worst case the person is sent to sign in themselves.
    setCreated(true);
    try {
      const res = await signIn("credentials", { email: form.email.trim(), password: form.password, redirect: false });
      if (res?.ok) {
        router.push("/dashboard/user");
        return;
      }
    } catch {
      // fall through to the sign-in page
    }
    router.push("/login?registered=1");
  }

  if (created) {
    return (
      <div role="status" className="animate-rise flex flex-col items-center py-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-signal-ok-bg)] text-[var(--color-signal-ok)]">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path className="tick-in" d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </span>
        <h2 className="mt-4 text-xl font-semibold text-ink-900">Your account is ready</h2>
        <p className="mt-1.5 flex items-center gap-2 text-sm text-ink-500">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-300 border-t-transparent" aria-hidden="true" />
          Taking you to your dashboard…
        </p>
      </div>
    );
  }

  const passwordMessageId = "password-requirements";

  return (
    <>
      <AuthHeading
        title="Create your patient account"
        description="Name, email and a password are all you need. The rest is optional."
      />
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {formError && <FormAlert tone="error">{formError}</FormAlert>}

        <TextField
          ref={bind("name")}
          fieldSize="lg"
          label="Full name"
          autoComplete="name"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          onBlur={() => onBlur("name")}
          error={errors.name}
        />

        <TextField
          ref={bind("email")}
          fieldSize="lg"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          onBlur={() => onBlur("email")}
          error={errors.email}
        />

        <div className="flex flex-col gap-2.5">
          <TextField
            ref={bind("password")}
            fieldSize="lg"
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            aria-describedby={passwordMessageId}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            error={errors.password}
            trailing={
              <PasswordToggle
                visible={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
                controlsId="field-password"
              />
            }
          />
          <PasswordChecklist password={form.password} id={passwordMessageId} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            ref={bind("age")}
            fieldSize="lg"
            label="Age"
            optional
            inputMode="numeric"
            autoComplete="off"
            maxLength={3}
            value={form.age}
            onChange={(e) => update("age", sanitizeAgeInput(e.target.value))}
            error={errors.age}
          />
          <SelectField
            ref={bind("gender")}
            fieldSize="lg"
            label="Gender"
            optional
            autoComplete="sex"
            value={form.gender}
            onChange={(e) => update("gender", e.target.value as Gender)}
            error={errors.gender}
          >
            <option value="">Prefer not to say</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </SelectField>
        </div>

        <TextField
          ref={bind("phone")}
          fieldSize="lg"
          label="Phone"
          optional
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          onBlur={() => onBlur("phone")}
          error={errors.phone}
        />

        <Button type="submit" size="lg" loading={loading} className="mt-1 w-full">
          {loading ? "Creating your account…" : "Create account"}
        </Button>

        <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-500">
          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-600" />
          Sign-up creates a patient account. Doctors and staff accounts are set up by an administrator.
        </p>

        <p className="text-center text-sm text-ink-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent-700 underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </>
  );
}
