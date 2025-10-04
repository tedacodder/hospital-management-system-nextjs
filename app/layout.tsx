"use client";
import { ReactNode } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { SessionProvider } from "next-auth/react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <main className=""><SessionProvider>{children}</SessionProvider></main>
          <footer className="bg-primary text-white text-center p-4 ">
            <p className="">
              &copy; {new Date().getFullYear()} MediCare+ Hospital Management
              System. All rights reserved.
            </p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
