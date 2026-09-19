import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = { title: "Sign in · MediCare+" };

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <AuthShell variant="login">
      {children}
    </AuthShell>
  );
}
