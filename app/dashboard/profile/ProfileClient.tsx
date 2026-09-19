"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, LoadingRows } from "@/components/ui/Card";
import { SelectField, TextField } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { apiGet, apiSend, ApiError } from "@/lib/api-client";

type Profile = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  phone: string;
  address: string;
  age: string;
  gender: string;
};

export default function ProfileClient() {
  const { update: refreshSession } = useSession();
  const { push } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", age: "", gender: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwFieldErrors, setPwFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    apiGet<Profile>("/profile").then((p) => {
      setProfile(p);
      setForm({ name: p.name ?? "", phone: p.phone, address: p.address, age: p.age, gender: p.gender });
    });
  }, []);

  async function saveProfile() {
    setSavingProfile(true);
    setProfileError(null);
    try {
      const updated = await apiSend<Profile>("PATCH", "/profile", form);
      setProfile(updated);
      await refreshSession();
      push("Profile updated.");
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : "Couldn't save your profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword() {
    setSavingPw(true);
    setPwError(null);
    setPwFieldErrors({});
    try {
      await apiSend("POST", "/profile/password", pw);
      setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
      push("Password changed.");
    } catch (err) {
      if (err instanceof ApiError) {
        setPwFieldErrors(err.fields ?? {});
        if (!err.fields) setPwError(err.message);
      } else {
        setPwError("Couldn't change your password.");
      }
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <AppShell>
      <h1 className="text-xl font-semibold text-ink-900">My profile</h1>

      <div className="mt-5 grid max-w-2xl gap-5">
        <Card>
          <CardHeader title="Personal details" eyebrow={profile?.email} />
          {!profile ? (
            <LoadingRows rows={3} />
          ) : (
            <div className="flex flex-col gap-4">
              <TextField label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <TextField label="Age" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
                <SelectField label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="">Prefer not to say</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </SelectField>
              </div>
              <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <TextField label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />

              {profileError && (
                <p role="alert" className="rounded-md bg-[var(--color-signal-stop-bg)] px-3 py-2 text-sm text-[var(--color-signal-stop)]">
                  {profileError}
                </p>
              )}

              <Button className="self-start" loading={savingProfile} onClick={saveProfile}>
                Save changes
              </Button>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Change password" />
          <div className="flex flex-col gap-4">
            <TextField
              label="Current password"
              type="password"
              value={pw.currentPassword}
              onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
              error={pwFieldErrors.currentPassword?.[0]}
            />
            <TextField
              label="New password"
              type="password"
              hint="At least 10 characters, with upper, lower and a number."
              value={pw.newPassword}
              onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
              error={pwFieldErrors.newPassword?.[0]}
            />
            <TextField
              label="Confirm new password"
              type="password"
              value={pw.confirmPassword}
              onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })}
              error={pwFieldErrors.confirmPassword?.[0]}
            />

            {pwError && (
              <p role="alert" className="rounded-md bg-[var(--color-signal-stop-bg)] px-3 py-2 text-sm text-[var(--color-signal-stop)]">
                {pwError}
              </p>
            )}

            <Button
              className="self-start"
              variant="secondary"
              loading={savingPw}
              disabled={!pw.currentPassword || !pw.newPassword || !pw.confirmPassword}
              onClick={savePassword}
            >
              Update password
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
