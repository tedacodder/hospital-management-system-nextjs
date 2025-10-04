"use client";
import { ReactNode } from "react";
import { ThemeProvider } from "../context/ThemeContext";
import "bootstrap/dist/css/bootstrap.min.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <main className="">{children}</main>
          <footer className="bg-danger text-white text-center p-4 mt-5">
            <p className="mb-0">Emergency Services. Stay safe.</p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
