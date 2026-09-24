import { describe, expect, it } from "vitest";
import {
  buildProfilePayload,
  firstFieldMessages,
  firstInvalidPasswordField,
  firstInvalidProfileField,
  isProfileDirty,
  toProfileForm,
  validatePasswordChange,
  validateProfile,
  type ProfileForm,
} from "@/lib/profile-form";
import { changePasswordSchema, updateProfileSchema } from "@/lib/validation";

const filled: ProfileForm = {
  name: "Selam Tesfaye",
  phone: "+251 911 234 567",
  address: "Bole, Addis Ababa",
  age: "34",
  gender: "Female",
};

describe("toProfileForm", () => {
  it("turns unexpected values into empty fields", () => {
    expect(toProfileForm({ name: null, phone: null, address: null, age: null, gender: null })).toEqual({
      name: "",
      phone: "",
      address: "",
      age: "",
      gender: "",
    });
    expect(toProfileForm({ name: "A B", phone: "", address: "", age: "", gender: "Unlisted" }).gender).toBe("");
  });
});

describe("buildProfilePayload", () => {
  it("omits gender when the person prefers not to say", () => {
    const payload = buildProfilePayload({ ...filled, gender: "" });
    expect("gender" in payload).toBe(false);
  });

  it("is accepted by the server schema in both the filled and the blank case", () => {
    expect(updateProfileSchema.safeParse(buildProfilePayload(filled)).success).toBe(true);
    // Every optional field blank, gender unset: what a fresh account looks like.
    const blank = buildProfilePayload({ name: "Selam Tesfaye", phone: "", address: "", age: "", gender: "" });
    expect(updateProfileSchema.safeParse(blank).success).toBe(true);
  });

  it("documents why: the old payload, with gender as an empty string, is rejected", () => {
    expect(updateProfileSchema.safeParse({ name: "Selam Tesfaye", phone: "", address: "", age: "", gender: "" }).success).toBe(false);
  });
});

describe("validateProfile", () => {
  it("accepts a complete, sensible profile", () => {
    expect(validateProfile(filled)).toEqual({});
  });

  it("accepts a profile with every optional field blank", () => {
    expect(validateProfile({ name: "Selam Tesfaye", phone: "", address: "", age: "", gender: "" })).toEqual({});
  });

  it("flags a missing name, a bad phone number and a non-numeric age", () => {
    const errors = validateProfile({ ...filled, name: " ", phone: "abc", age: "4x" });
    expect(Object.keys(errors).sort()).toEqual(["age", "name", "phone"]);
    expect(firstInvalidProfileField(errors)).toBe("name");
  });

  it("agrees with the server schema about what is valid", () => {
    const cases: ProfileForm[] = [
      filled,
      { ...filled, phone: "12" },
      { ...filled, name: "A" },
      { ...filled, phone: "" },
      { ...filled, address: "x".repeat(256) },
    ];
    for (const form of cases) {
      const client = Object.keys(validateProfile(form)).length === 0;
      const server = updateProfileSchema.safeParse(buildProfilePayload(form)).success;
      expect(client).toBe(server);
    }
  });
});

describe("isProfileDirty", () => {
  it("ignores surrounding whitespace and detects real edits", () => {
    expect(isProfileDirty({ ...filled, name: "  Selam Tesfaye " }, filled)).toBe(false);
    expect(isProfileDirty({ ...filled, phone: "+251 911 000 000" }, filled)).toBe(true);
    expect(isProfileDirty({ ...filled, gender: "" }, filled)).toBe(true);
  });
});

describe("firstFieldMessages", () => {
  it("keeps the first message per field", () => {
    expect(firstFieldMessages({ phone: ["Enter a valid phone number", "Too short"], name: [] })).toEqual({
      phone: "Enter a valid phone number",
    });
    expect(firstFieldMessages(undefined)).toEqual({});
  });
});

describe("validatePasswordChange", () => {
  const ok = { currentPassword: "OldPassw0rd!", newPassword: "NewPassw0rd!x", confirmPassword: "NewPassw0rd!x" };

  it("accepts a valid change", () => {
    expect(validatePasswordChange(ok)).toEqual({});
  });

  it("flags each problem on its own field", () => {
    const errors = validatePasswordChange({ currentPassword: "", newPassword: "short", confirmPassword: "different" });
    expect(Object.keys(errors).sort()).toEqual(["confirmPassword", "currentPassword", "newPassword"]);
    expect(firstInvalidPasswordField(errors)).toBe("currentPassword");
  });

  it("catches a mismatch the way the server does", () => {
    const form = { ...ok, confirmPassword: "NewPassw0rd!y" };
    expect(validatePasswordChange(form).confirmPassword).toBe("Passwords do not match");
    expect(changePasswordSchema.safeParse(form).success).toBe(false);
  });

  it("agrees with the server schema on a spread of new passwords", () => {
    for (const newPassword of ["NewPassw0rd!x", "alllowercase1", "ALLUPPERCASE1", "NoDigitsHereAtAll", "Sh0rt", ""]) {
      const form = { currentPassword: "OldPassw0rd!", newPassword, confirmPassword: newPassword };
      const client = Object.keys(validatePasswordChange(form)).length === 0;
      expect(client).toBe(changePasswordSchema.safeParse(form).success);
    }
  });
});
