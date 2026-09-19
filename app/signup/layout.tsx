import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = { title: "Create your account · MediCare+" };

export default function SignupLayout({ children }: { children: ReactNode }) {
  return (
    <AuthShell variant="signup"
      width="wide">
      {children}
    </AuthShell>
  );
}
