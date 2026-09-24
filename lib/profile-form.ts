import { PHONE_PATTERN, checkPassword, PASSWORD_MAX_LENGTH } from "@/lib/auth-forms";

// Client-side rules for the profile screen. They restate updateProfileSchema
// and changePasswordSchema (lib/validation.ts) for the browser, which cannot
// import that file. The server remains the authority: these only catch the
// obvious mistakes before a round trip, and tests/profile-form.test.ts checks
// them against the real schemas.

export type ProfileGender = "" | "Male" | "Female" | "Other";

export interface ProfileForm {
  name: string;
  phone: string;
  address: string;
  age: string;
  gender: ProfileGender;
}

export type ProfileField = keyof ProfileForm;
export type ProfileErrors = Partial<Record<ProfileField, string>>;

export const PROFILE_FIELD_ORDER: ProfileField[] = ["name", "age", "gender", "phone", "address"];

const GENDERS: ProfileGender[] = ["Male", "Female", "Other"];

/// Normalises what the profile API returns into form state. The columns are
/// non-null strings, but anything unexpected becomes an empty field rather
/// than the text "null" or an uncontrolled input.
export function toProfileForm(profile: {
  name: string | null;
  phone: string | null;
  address: string | null;
  age: string | null;
  gender: string | null;
}): ProfileForm {
  return {
    name: profile.name ?? "",
    phone: profile.phone ?? "",
    address: profile.address ?? "",
    age: profile.age ?? "",
    gender: GENDERS.includes(profile.gender as ProfileGender) ? (profile.gender as ProfileGender) : "",
  };
}

export function validateProfileField(field: ProfileField, form: ProfileForm): string | undefined {
  switch (field) {
    case "name":
      return form.name.trim().length < 2 ? "Enter your full name" : undefined;
    case "phone": {
      const phone = form.phone.trim();
      return phone && !PHONE_PATTERN.test(phone) ? "Enter a valid phone number" : undefined;
    }
    case "age": {
      const age = form.age.trim();
      return age && !/^\d{1,3}$/.test(age) ? "Enter your age in years" : undefined;
    }
    case "address":
      return form.address.trim().length > 255 ? "Keep the address under 255 characters" : undefined;
    default:
      return undefined;
  }
}

export function validateProfile(form: ProfileForm): ProfileErrors {
  const errors: ProfileErrors = {};
  for (const field of PROFILE_FIELD_ORDER) {
    const message = validateProfileField(field, form);
    if (message) errors[field] = message;
  }
  return errors;
}

export function firstInvalidProfileField(errors: ProfileErrors): ProfileField | undefined {
  return PROFILE_FIELD_ORDER.find((field) => errors[field]);
}

export interface ProfilePayload {
  name: string;
  phone: string;
  address: string;
  age: string;
  gender?: Exclude<ProfileGender, "">;
}

/// The API's gender field is an enum with no "none" value, so "prefer not to
/// say" must be *absent* from the request, not sent as an empty string.
export function buildProfilePayload(form: ProfileForm): ProfilePayload {
  return {
    name: form.name.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
    age: form.age.trim(),
    ...(form.gender ? { gender: form.gender } : {}),
  };
}

export function isProfileDirty(current: ProfileForm, saved: ProfileForm): boolean {
  return PROFILE_FIELD_ORDER.some((field) => current[field].trim() !== saved[field].trim());
}

/// First message per field from an ApiError's `fields` map.
export function firstFieldMessages(fields: Record<string, string[]> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, messages] of Object.entries(fields ?? {})) {
    if (messages[0]) out[key] = messages[0];
  }
  return out;
}

// ───────────────────────────── Password change ─────────────────────────────

export interface PasswordChangeForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type PasswordChangeField = keyof PasswordChangeForm;
export type PasswordChangeErrors = Partial<Record<PasswordChangeField, string>>;

export const PASSWORD_CHANGE_FIELD_ORDER: PasswordChangeField[] = ["currentPassword", "newPassword", "confirmPassword"];

export function validatePasswordChange(form: PasswordChangeForm): PasswordChangeErrors {
  const errors: PasswordChangeErrors = {};
  if (!form.currentPassword) errors.currentPassword = "Enter your current password";

  if (!form.newPassword) errors.newPassword = "Choose a new password";
  else if (form.newPassword.length > PASSWORD_MAX_LENGTH) errors.newPassword = "Password is too long";
  else {
    const unmet = checkPassword(form.newPassword).find((r) => !r.met);
    if (unmet) errors.newPassword = unmet.message;
  }

  if (form.confirmPassword !== form.newPassword) errors.confirmPassword = "Passwords do not match";
  return errors;
}

export function firstInvalidPasswordField(errors: PasswordChangeErrors): PasswordChangeField | undefined {
  return PASSWORD_CHANGE_FIELD_ORDER.find((field) => errors[field]);
}
