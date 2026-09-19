import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";

// globals.css has always named IBM Plex as the product typeface, but nothing
// loaded it, so every screen fell back to the system font. next/font fetches
// the files at build time and serves them from this origin — no request to
// Google from the visitor's browser. The variables feed --font-sans and
// --font-mono in globals.css.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MediCare+ Hospital Management System",
  description:
    "Appointments, medical records, prescriptions and billing for patients, doctors and clinic staff — in one system.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body className="min-h-screen bg-paper font-sans text-ink-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
