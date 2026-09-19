import { ApiError } from "@/lib/api-client";

// Client-side helpers for the sign-in and sign-up forms.
//
// This file is imported by client components, so it must stay free of zod and
// @prisma/client (lib/validation.ts pulls in both). The rules below therefore
// restate the server's — and tests/auth-forms.test.ts checks them against
// lib/validation.ts so the two cannot drift apart. The server remains the
// authority: anything it rejects that these let through still comes back as a
// field error and is shown under the right field.

// ─────────────────────────── Password ───────────────────────────

export type PasswordRuleId = "length" | "lower" | "upper" | "number";

export interface PasswordRule {
  id: PasswordRuleId;
  /** What the person sees in the live checklist. */
  label: string;
  /** What the person sees as a field error — identical to the server's message. */
  message: string;
  met: boolean;
}

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

export function checkPassword(password: string): PasswordRule[] {
  return [
    {
      id: "length",
      label: `At least ${PASSWORD_MIN_LENGTH} characters`,
      message: `Use at least ${PASSWORD_MIN_LENGTH} characters`,
      met: password.length >= PASSWORD_MIN_LENGTH,
    },
    {
      id: "lower",
      label: "A lowercase letter",
      message: "Include a lowercase letter",
      met: /[a-z]/.test(password),
    },
    {
      id: "upper",
      label: "An uppercase letter",
      message: "Include an uppercase letter",
      met: /[A-Z]/.test(password),
    },
    {
      id: "number",
      label: "A number",
      message: "Include a number",
      met: /[0-9]/.test(password),
    },
  ];
}

export function isPasswordValid(password: string): boolean {
  return password.length <= PASSWORD_MAX_LENGTH && checkPassword(password).every((r) => r.met);
}

// ─────────────────────────── Other fields ───────────────────────────

// Deliberately no stricter than the server's email check: it only catches
// input that cannot be an address, so it never blocks one the server accepts.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Same expression as phoneSchema in lib/validation.ts.
export const PHONE_PATTERN = /^\+?[0-9(][0-9\s\-()]{6,19}$/;

export function validateEmail(value: string): string | undefined {
  const email = value.trim();
  if (!email) return "Email is required";
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address";
  return undefined;
}

/** Keeps digits only, at most three — the server stores age as a string of up to 3 characters. */
export function sanitizeAgeInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 3);
}

// ─────────────────────────── Sign in ───────────────────────────

export interface LoginErrors {
  email?: string;
  password?: string;
}

export function validateLogin(email: string, password: string): LoginErrors {
  const errors: LoginErrors = {};
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  if (!password) errors.password = "Enter your password";
  return errors;
}

/// Where each role lands after sign-in. Mirrors homeForRole() in lib/auth.ts,
/// which cannot be imported here because it pulls in Prisma and bcrypt.
export function dashboardPathForRole(role: string | null | undefined): string {
  if (role === "ADMIN" || role === "STAFF") return "/dashboard/admin";
  if (role === "DOCTOR") return "/dashboard/doc";
  return "/dashboard/user";
}

const RETRY_PATTERN = /^Too many attempts\. Try again in (\d+)s\.?$/;

/// The rate limiter answers "Too many attempts. Try again in 843s." — accurate
/// but awkward. Returns a friendlier sentence, or null if `message` is not that.
export function describeRetry(message: string): string | null {
  const match = RETRY_PATTERN.exec(message.trim());
  if (!match) return null;
  const seconds = Number(match[1]);
  if (seconds < 60) {
    return `Too many attempts. Try again in ${seconds} ${seconds === 1 ? "second" : "seconds"}.`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `Too many attempts. Try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`;
}

export const NETWORK_ERROR_MESSAGE =
  "We couldn't reach the server. Check your connection and try again.";
export const SIGN_IN_FALLBACK_MESSAGE =
  "We couldn't sign you in right now. Please try again in a moment.";
export const SESSION_ERROR_MESSAGE =
  "You're signed in, but we couldn't load your account. Please try signing in again.";

/// Turns NextAuth's `error` string into something safe to show.
///
/// NextAuth surfaces the message of anything authorize() throws, and that can
/// be a database or configuration error. Only two known messages are shown;
/// everything else becomes a generic sentence so internals never reach the page.
export function describeSignInError(code: string | null | undefined): string {
  if (!code || code === "CredentialsSignin") return "Incorrect email or password.";
  return describeRetry(code) ?? SIGN_IN_FALLBACK_MESSAGE;
}

// ─────────────────────────── Sign up ───────────────────────────

export type Gender = "" | "Male" | "Female" | "Other";

export interface SignupForm {
  name: string;
  email: string;
  password: string;
  phone: string;
  age: string;
  gender: Gender;
}

export type SignupField = keyof SignupForm;
export type SignupErrors = Partial<Record<SignupField, string>>;

/// Field order as rendered — used to focus the first invalid field.
export const SIGNUP_FIELD_ORDER: SignupField[] = [
  "name",
  "email",
  "password",
  "age",
  "gender",
  "phone",
];

export function validateSignupField(field: SignupField, form: SignupForm): string | undefined {
  switch (field) {
    case "name":
      return form.name.trim().length < 2 ? "Enter your full name" : undefined;
    case "email":
      return validateEmail(form.email);
    case "password": {
      if (!form.password) return "Choose a password";
      if (form.password.length > PASSWORD_MAX_LENGTH) return "Password is too long";
      return checkPassword(form.password).find((r) => !r.met)?.message;
    }
    case "phone": {
      const phone = form.phone.trim();
      return phone && !PHONE_PATTERN.test(phone) ? "Enter a valid phone number" : undefined;
    }
    default:
      return undefined;
  }
}

export function validateSignup(form: SignupForm): SignupErrors {
  const errors: SignupErrors = {};
  for (const field of SIGNUP_FIELD_ORDER) {
    const message = validateSignupField(field, form);
    if (message) errors[field] = message;
  }
  return errors;
}

export function firstInvalidField(errors: SignupErrors): SignupField | undefined {
  return SIGNUP_FIELD_ORDER.find((field) => errors[field]);
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  age?: string;
  gender?: Exclude<Gender, "">;
}

/// The body sent to POST /api/register.
///
/// Optional fields the person left blank are omitted rather than sent as "".
/// This matters for gender: the API accepts Male, Female or Other or nothing,
/// and rejects "" — so a form that sent "" for "Prefer not to say" failed
/// validation for anyone who did not pick a gender. Omitting is within the
/// existing contract; no server change is needed.
export function buildRegisterPayload(form: SignupForm): RegisterPayload {
  const payload: RegisterPayload = {
    name: form.name.trim(),
    email: form.email.trim(),
    password: form.password,
  };
  const phone = form.phone.trim();
  const age = form.age.trim();
  if (phone) payload.phone = phone;
  if (age) payload.age = age;
  if (form.gender) payload.gender = form.gender;
  return payload;
}

export interface SignupFailure {
  fieldErrors: SignupErrors;
  formError: string | null;
}

const KNOWN_FIELDS = new Set<string>(SIGNUP_FIELD_ORDER);

/// Maps whatever went wrong into field errors plus, at most, one form-level
/// sentence. Server messages are shown only when they are known to be safe
/// (validation feedback and the rate-limit notice); anything else — 5xx, an
/// unexpected 4xx — becomes a generic message.
export function describeSignupError(err: unknown): SignupFailure {
  if (err instanceof ApiError) {
    const fieldErrors: SignupErrors = {};
    for (const [key, messages] of Object.entries(err.fields ?? {})) {
      const message = messages?.[0];
      if (message && KNOWN_FIELDS.has(key)) fieldErrors[key as SignupField] = message;
    }

    if (err.status === 409) {
      return { fieldErrors: { email: "An account with this email already exists" }, formError: null };
    }
    if (Object.keys(fieldErrors).length > 0) return { fieldErrors, formError: null };
    if (err.status === 429) {
      return { fieldErrors: {}, formError: describeRetry(err.message) ?? "Too many attempts. Please try again later." };
    }
    return { fieldErrors: {}, formError: "We couldn't create your account. Please try again." };
  }

  // fetch() rejects with a TypeError when the request never reaches the server.
  if (err instanceof TypeError) return { fieldErrors: {}, formError: NETWORK_ERROR_MESSAGE };

  return { fieldErrors: {}, formError: "We couldn't create your account. Please try again." };
}
