"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/AppShell";
import { FormAlert } from "@/components/auth/FormAlert";
import { PasswordChecklist } from "@/components/auth/PasswordChecklist";
import { PasswordToggle } from "@/components/auth/PasswordToggle";
import { PageHeader } from "@/components/patient/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, ErrorState } from "@/components/ui/Card";
import { SelectField, TextField } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ApiError, apiSend } from "@/lib/api-client";
import { sanitizeAgeInput } from "@/lib/auth-forms";
import { friendlyError } from "@/lib/patient-ui";
import {
  buildProfilePayload,
  firstFieldMessages,
  firstInvalidPasswordField,
  firstInvalidProfileField,
  isProfileDirty,
  toProfileForm,
  validatePasswordChange,
  validateProfile,
  type PasswordChangeErrors,
  type PasswordChangeField,
  type PasswordChangeForm,
  type ProfileErrors,
  type ProfileField,
  type ProfileForm,
  type ProfileGender,
} from "@/lib/profile-form";
import { useApiResource } from "@/lib/use-api-resource";

type Profile = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  phone: string | null;
  address: string | null;
  age: string | null;
  gender: string | null;
};

const EMPTY_PASSWORDS: PasswordChangeForm = { currentPassword: "", newPassword: "", confirmPassword: "" };

function roleLabel(role: string) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function SectionCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Card padded={false}>
      <div className="border-b border-rule px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-ink-900">{title}</h2>
        <p className="mt-0.5 text-sm text-ink-500">{description}</p>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </Card>
  );
}

export default function ProfileClient() {
  const { update: refreshSession } = useSession();
  const { push } = useToast();
  const profile = useApiResource<Profile>("/profile");

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <PageHeader title="My profile" description="Your details and sign-in security. Changes apply across your account." />

        {profile.error ? (
          <ErrorState message="We couldn't load your profile. Check your connection and try again." onRetry={profile.reload} />
        ) : profile.data === null ? (
          <div className="space-y-5" role="status" aria-label="Loading profile" aria-busy="true">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        ) : (
          // Keyed by user so the forms reset if a different account is ever loaded.
          <div className="space-y-5" key={profile.data.id}>
            <Card>
              <div className="flex items-center gap-4">
                <Avatar name={profile.data.name} size="lg" tone="brand" />
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold tracking-[-0.01em] text-ink-900">{profile.data.name ?? "Your account"}</p>
                  <p className="truncate text-sm text-ink-500">{profile.data.email}</p>
                  <div className="mt-1.5">
                    <Badge tone="info">{roleLabel(profile.data.role)}</Badge>
                  </div>
                </div>
              </div>
            </Card>

            <DetailsForm
              profile={profile.data}
              onSaved={async (updated) => {
                profile.setData(updated);
                await refreshSession();
                push("Profile updated.");
              }}
            />
            <PasswordForm onChanged={() => push("Password changed.")} />
          </div>
        )}
      </div>
    </AppShell>
  );
}

function DetailsForm({ profile, onSaved }: { profile: Profile; onSaved: (updated: Profile) => Promise<void> }) {
  const refs = useRef<Partial<Record<ProfileField, HTMLInputElement | HTMLSelectElement | null>>>({});
  const [saved, setSaved] = useState<ProfileForm>(() => toProfileForm(profile));
  const [form, setForm] = useState<ProfileForm>(saved);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dirty = isProfileDirty(form, saved);

  function bind(field: ProfileField) {
    return (el: HTMLInputElement | HTMLSelectElement | null) => {
      refs.current[field] = el;
    };
  }

  function update(field: ProfileField, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }) as ProfileForm);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving || !dirty) return;

    setFormError(null);
    const found = validateProfile(form);
    setErrors(found);
    const invalid = firstInvalidProfileField(found);
    if (invalid) return void refs.current[invalid]?.focus();

    setSaving(true);
    try {
      const updated = await apiSend<Profile>("PATCH", "/profile", buildProfilePayload(form));
      const next = toProfileForm(updated);
      setSaved(next);
      setForm(next);
      await onSaved(updated);
    } catch (err) {
      const messages = firstFieldMessages(err instanceof ApiError ? err.fields : undefined);
      if (Object.keys(messages).length > 0) {
        setErrors(messages as ProfileErrors);
        setFormError("Some details need another look.");
      } else {
        setFormError(friendlyError(err, "We couldn't save your profile. Please try again."));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Personal details" description="Your name and contact details.">
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
          error={errors.name}
        />

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
            onChange={(e) => update("gender", e.target.value as ProfileGender)}
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
          error={errors.phone}
        />

        <TextField
          ref={bind("address")}
          fieldSize="lg"
          label="Address"
          optional
          autoComplete="street-address"
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
          error={errors.address}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" loading={saving} disabled={!dirty}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          {!dirty && !saving && <p className="text-sm text-ink-500">No unsaved changes.</p>}
        </div>
      </form>
    </SectionCard>
  );
}

function PasswordForm({ onChanged }: { onChanged: () => void }) {
  const refs = useRef<Partial<Record<PasswordChangeField, HTMLInputElement | null>>>({});
  const [pw, setPw] = useState<PasswordChangeForm>(EMPTY_PASSWORDS);
  const [errors, setErrors] = useState<PasswordChangeErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState(false);

  function bind(field: PasswordChangeField) {
    return (el: HTMLInputElement | null) => {
      refs.current[field] = el;
    };
  }

  function update(field: PasswordChangeField, value: string) {
    setPw((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;

    setFormError(null);
    const found = validatePasswordChange(pw);
    setErrors(found);
    const invalid = firstInvalidPasswordField(found);
    if (invalid) return void refs.current[invalid]?.focus();

    setSaving(true);
    try {
      await apiSend("POST", "/profile/password", pw);
      setPw(EMPTY_PASSWORDS);
      setVisible(false);
      onChanged();
    } catch (err) {
      const messages = firstFieldMessages(err instanceof ApiError ? err.fields : undefined);
      if (Object.keys(messages).length > 0) {
        setErrors(messages as PasswordChangeErrors);
      } else {
        setFormError(friendlyError(err, "We couldn't change your password. Please try again."));
      }
    } finally {
      setSaving(false);
    }
  }

  const type = visible ? "text" : "password";
  const toggle = (id: string) => (
    <PasswordToggle visible={visible} onToggle={() => setVisible((v) => !v)} controlsId={id} />
  );

  return (
    <SectionCard title="Password" description="Choose a new password for signing in.">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {formError && <FormAlert tone="error">{formError}</FormAlert>}

        <TextField
          ref={bind("currentPassword")}
          fieldSize="lg"
          label="Current password"
          type={type}
          autoComplete="current-password"
          required
          value={pw.currentPassword}
          onChange={(e) => update("currentPassword", e.target.value)}
          error={errors.currentPassword}
          trailing={toggle("field-current-password")}
        />

        <div className="flex flex-col gap-2.5">
          <TextField
            ref={bind("newPassword")}
            fieldSize="lg"
            label="New password"
            type={type}
            autoComplete="new-password"
            required
            aria-describedby="new-password-requirements"
            value={pw.newPassword}
            onChange={(e) => update("newPassword", e.target.value)}
            error={errors.newPassword}
            trailing={toggle("field-new-password")}
          />
          <PasswordChecklist password={pw.newPassword} id="new-password-requirements" />
        </div>

        <TextField
          ref={bind("confirmPassword")}
          fieldSize="lg"
          label="Confirm new password"
          type={type}
          autoComplete="new-password"
          required
          value={pw.confirmPassword}
          onChange={(e) => update("confirmPassword", e.target.value)}
          error={errors.confirmPassword}
          trailing={toggle("field-confirm-new-password")}
        />

        <div>
          <Button type="submit" size="lg" variant="secondary" loading={saving}>
            {saving ? "Updating…" : "Update password"}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}
