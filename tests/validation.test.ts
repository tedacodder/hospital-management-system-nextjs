import { describe, expect, it } from "vitest";
import {
  availabilitySchema,
  changePasswordSchema,
  createAppointmentSchema,
  passwordSchema,
  phoneSchema,
  registerSchema,
} from "@/lib/validation";

describe("passwordSchema", () => {
  it("accepts a password meeting every rule", () => {
    expect(passwordSchema.safeParse("Str0ngPassword").success).toBe(true);
  });

  it.each([
    ["short1A", "too short"],
    ["alllowercase1", "no uppercase"],
    ["ALLUPPERCASE1", "no lowercase"],
    ["NoDigitsHere", "no digit"],
  ])("rejects %s (%s)", (value) => {
    expect(passwordSchema.safeParse(value).success).toBe(false);
  });
});

describe("phoneSchema", () => {
  it("accepts common phone formats", () => {
    for (const value of ["+1 555-123-4567", "0911223344", "(555) 123 4567"]) {
      expect(phoneSchema.safeParse(value).success).toBe(true);
    }
  });

  it("rejects letters and too-short input", () => {
    expect(phoneSchema.safeParse("call-me-maybe").success).toBe(false);
    expect(phoneSchema.safeParse("123").success).toBe(false);
  });
});

describe("registerSchema", () => {
  const base = {
    name: "Jordan Patient",
    email: "Jordan@Example.com",
    password: "Str0ngPassword",
  };

  it("lowercases the email on parse", () => {
    const result = registerSchema.parse(base);
    expect(result.email).toBe("jordan@example.com");
  });

  it("has no field that accepts a role — self-service signup cannot elevate", () => {
    // The privilege-escalation bug this schema replaced let a signup request
    // set its own role. Asserting the shape has no such key is a regression
    // guard against that bug coming back.
    expect("role" in registerSchema.shape).toBe(false);
  });

  it("rejects a missing name", () => {
    expect(registerSchema.safeParse({ ...base, name: "" }).success).toBe(false);
  });
});

describe("availabilitySchema", () => {
  it("accepts a valid window", () => {
    const result = availabilitySchema.safeParse({
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "17:00",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an end time before the start time", () => {
    const result = availabilitySchema.safeParse({
      dayOfWeek: 1,
      startTime: "17:00",
      endTime: "09:00",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a day of week outside 0-6", () => {
    const result = availabilitySchema.safeParse({
      dayOfWeek: 7,
      startTime: "09:00",
      endTime: "17:00",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed time string", () => {
    const result = availabilitySchema.safeParse({
      dayOfWeek: 1,
      startTime: "9am",
      endTime: "17:00",
    });
    expect(result.success).toBe(false);
  });
});

describe("createAppointmentSchema", () => {
  it("rejects a date in the past", () => {
    const result = createAppointmentSchema.safeParse({
      department: "Cardiology",
      date: "2020-01-01T09:00:00.000Z",
      reason: "Routine check-up",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a future date with a reason", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const result = createAppointmentSchema.safeParse({
      department: "Cardiology",
      date: future,
      reason: "Routine check-up",
    });
    expect(result.success).toBe(true);
  });
});

describe("changePasswordSchema", () => {
  it("rejects mismatched confirmation", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "whatever",
      newPassword: "Str0ngPassword",
      confirmPassword: "Different1Password",
    });
    expect(result.success).toBe(false);
  });

  it("accepts matching passwords", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "whatever",
      newPassword: "Str0ngPassword",
      confirmPassword: "Str0ngPassword",
    });
    expect(result.success).toBe(true);
  });
});
