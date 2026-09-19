import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-client";
import {
  NETWORK_ERROR_MESSAGE,
  PHONE_PATTERN,
  SIGN_IN_FALLBACK_MESSAGE,
  buildRegisterPayload,
  checkPassword,
  dashboardPathForRole,
  describeRetry,
  describeSignInError,
  describeSignupError,
  firstInvalidField,
  isPasswordValid,
  sanitizeAgeInput,
  validateEmail,
  validateLogin,
  validateSignup,
  validateSignupField,
  type SignupForm,
} from "@/lib/auth-forms";
import { emailSchema, passwordSchema, phoneSchema, registerSchema } from "@/lib/validation";

// lib/auth-forms.ts restates the server's rules because it ships to the
// browser and cannot import lib/validation.ts (zod and the Prisma client).
// These tests are what stop the two copies drifting apart.

const blankForm: SignupForm = {
  name: "Jordan Patient",
  email: "Jordan@Example.com",
  password: "Str0ngPassword",
  phone: "",
  age: "",
  gender: "",
};

describe("password rules stay in step with passwordSchema", () => {
  const samples: Array<[string, string]> = [
    ["valid", "Str0ngPassword"],
    ["exactly ten characters", "Aa1aaaaaaa"],
    ["nine characters", "Aa1aaaaaa"],
    ["no uppercase", "alllowercase1"],
    ["no lowercase", "ALLUPPERCASE1"],
    ["no digit", "NoDigitsHere"],
    ["too long", `Aa1${"a".repeat(130)}`],
    ["empty", ""],
  ];

  it.each(samples)("agrees with the server on: %s", (_label, value) => {
    expect(isPasswordValid(value)).toBe(passwordSchema.safeParse(value).success);
  });

  it("uses the server's own wording for the first unmet rule", () => {
    for (const [, value] of samples) {
      if (!value || value.length > 128) continue;
      const parsed = passwordSchema.safeParse(value);
      if (parsed.success) continue;
      const serverMessages = parsed.error.issues.map((i) => i.message);
      const clientMessage = validateSignupField("password", { ...blankForm, password: value });
      expect(serverMessages).toContain(clientMessage);
    }
  });

  it("reports each rule independently for the live checklist", () => {
    const rules = checkPassword("abc");
    expect(rules.map((r) => [r.id, r.met])).toEqual([
      ["length", false],
      ["lower", true],
      ["upper", false],
      ["number", false],
    ]);
  });
});

describe("phone and email checks never block what the server accepts", () => {
  it.each(["+1 555-123-4567", "0911223344", "(555) 123 4567", " 0911223344 "])(
    "accepts phone %j",
    (value) => {
      expect(phoneSchema.safeParse(value).success).toBe(true);
      expect(PHONE_PATTERN.test(value.trim())).toBe(true);
    },
  );

  it.each(["call-me-maybe", "123", "++123456789"])("rejects phone %j like the server", (value) => {
    expect(phoneSchema.safeParse(value).success).toBe(false);
    expect(PHONE_PATTERN.test(value.trim())).toBe(false);
  });

  it.each(["jordan@example.com", "first.last+tag@sub.example.co.uk", "  padded@example.com  "])(
    "accepts email %j",
    (value) => {
      expect(emailSchema.safeParse(value).success).toBe(true);
      expect(validateEmail(value)).toBeUndefined();
    },
  );

  it.each(["", "nope", "a@b", "a b@example.com"])("rejects email %j like the server", (value) => {
    expect(emailSchema.safeParse(value).success).toBe(false);
    expect(validateEmail(value)).toBeDefined();
  });
});

describe("register payload", () => {
  it("documents why blanks are omitted: the API rejects gender ''", () => {
    // This is the failure the original signup form hit for anyone who left
    // gender on "Prefer not to say". If the server ever starts accepting "",
    // this test can be deleted along with the omission logic.
    expect(registerSchema.safeParse({ ...blankForm }).success).toBe(false);
  });

  it("omits blank optional fields so the default form is accepted", () => {
    const payload = buildRegisterPayload(blankForm);
    expect(Object.keys(payload).sort()).toEqual(["email", "name", "password"]);
    expect(registerSchema.safeParse(payload).success).toBe(true);
  });

  it("keeps filled optional fields, trimmed", () => {
    const payload = buildRegisterPayload({
      ...blankForm,
      name: "  Jordan Patient ",
      phone: " +1 555 123 4567 ",
      age: "34",
      gender: "Female",
    });
    expect(payload).toMatchObject({
      name: "Jordan Patient",
      phone: "+1 555 123 4567",
      age: "34",
      gender: "Female",
    });
    expect(registerSchema.safeParse(payload).success).toBe(true);
  });

  it("never includes a role — self-service signup cannot elevate", () => {
    expect("role" in buildRegisterPayload(blankForm)).toBe(false);
  });
});

describe("signup validation", () => {
  const empty: SignupForm = { name: "", email: "", password: "", phone: "", age: "", gender: "" };

  it("requires name, email and password but nothing else", () => {
    expect(Object.keys(validateSignup(empty)).sort()).toEqual(["email", "name", "password"]);
  });

  it("passes a complete form", () => {
    expect(validateSignup(blankForm)).toEqual({});
  });

  it("flags a malformed optional phone number", () => {
    expect(validateSignup({ ...blankForm, phone: "abc" }).phone).toBe("Enter a valid phone number");
  });

  it("finds the first invalid field in on-screen order", () => {
    expect(firstInvalidField({ password: "x", email: "y" })).toBe("email");
    expect(firstInvalidField({})).toBeUndefined();
  });

  it("keeps age to three digits", () => {
    expect(sanitizeAgeInput("a3b4c5d6")).toBe("345");
    expect(sanitizeAgeInput("")).toBe("");
  });
});

describe("login validation and routing", () => {
  it("requires an email and a password", () => {
    expect(validateLogin("", "")).toEqual({
      email: "Email is required",
      password: "Enter your password",
    });
    expect(validateLogin("a@example.com", "x")).toEqual({});
  });

  it.each([
    ["ADMIN", "/dashboard/admin"],
    ["STAFF", "/dashboard/admin"],
    ["DOCTOR", "/dashboard/doc"],
    ["PATIENT", "/dashboard/user"],
    [undefined, "/dashboard/user"],
    [null, "/dashboard/user"],
  ])("routes %s to %s", (role, path) => {
    expect(dashboardPathForRole(role)).toBe(path);
  });
});

describe("rate-limit wording", () => {
  it("reads seconds, minutes and singulars naturally", () => {
    expect(describeRetry("Too many attempts. Try again in 30s.")).toBe(
      "Too many attempts. Try again in 30 seconds.",
    );
    expect(describeRetry("Too many attempts. Try again in 1s.")).toBe(
      "Too many attempts. Try again in 1 second.",
    );
    expect(describeRetry("Too many attempts. Try again in 60s.")).toBe(
      "Too many attempts. Try again in 1 minute.",
    );
    expect(describeRetry("Too many attempts. Try again in 843s.")).toBe(
      "Too many attempts. Try again in 15 minutes.",
    );
  });

  it("returns null for anything else", () => {
    expect(describeRetry("Something else")).toBeNull();
  });
});

describe("sign-in errors never expose backend detail", () => {
  it("maps bad credentials and missing codes to one message", () => {
    expect(describeSignInError("CredentialsSignin")).toBe("Incorrect email or password.");
    expect(describeSignInError(undefined)).toBe("Incorrect email or password.");
    expect(describeSignInError(null)).toBe("Incorrect email or password.");
  });

  it("humanises the rate-limit notice", () => {
    expect(describeSignInError("Too many attempts. Try again in 120s.")).toBe(
      "Too many attempts. Try again in 2 minutes.",
    );
  });

  it.each([
    "Invalid `prisma.user.findUnique()` invocation: Can't reach database server at `db:5432`",
    "Configuration",
    "connect ECONNREFUSED 127.0.0.1:5432",
  ])("replaces %j with a generic message", (code) => {
    const shown = describeSignInError(code);
    expect(shown).toBe(SIGN_IN_FALLBACK_MESSAGE);
    expect(shown).not.toContain("prisma");
    expect(shown).not.toContain("5432");
  });
});

describe("signup errors", () => {
  it("places server validation messages under their fields", () => {
    const err = new ApiError("Validation failed", 422, {
      email: ["Enter a valid email address"],
      password: ["Include a number"],
    });
    expect(describeSignupError(err)).toEqual({
      fieldErrors: { email: "Enter a valid email address", password: "Include a number" },
      formError: null,
    });
  });

  it("ignores field names the form does not have", () => {
    const err = new ApiError("Validation failed", 422, { role: ["Nope"] });
    const result = describeSignupError(err);
    expect(result.fieldErrors).toEqual({});
    expect(result.formError).toBe("We couldn't create your account. Please try again.");
  });

  it("turns a duplicate email into an email field error", () => {
    const result = describeSignupError(new ApiError("An account with that email already exists", 409));
    expect(result.fieldErrors.email).toBe("An account with this email already exists");
    expect(result.formError).toBeNull();
  });

  it("humanises the rate-limit notice", () => {
    const result = describeSignupError(new ApiError("Too many attempts. Try again in 3000s.", 429));
    expect(result.formError).toBe("Too many attempts. Try again in 50 minutes.");
  });

  it("never shows an unexpected server message", () => {
    const result = describeSignupError(new ApiError("Invalid `prisma.user.create()` invocation", 500));
    expect(result.formError).toBe("We couldn't create your account. Please try again.");
  });

  it("recognises a network failure", () => {
    expect(describeSignupError(new TypeError("Failed to fetch")).formError).toBe(NETWORK_ERROR_MESSAGE);
  });

  it("falls back to a generic message for anything else", () => {
    expect(describeSignupError(new Error("boom")).formError).toBe(
      "We couldn't create your account. Please try again.",
    );
  });
});
