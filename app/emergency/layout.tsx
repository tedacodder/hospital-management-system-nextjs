"use client";
import { ReactNode } from "react";
import { ThemeProvider } from "../context/ThemeContext";
import "bootstrap/dist/css/bootstrap.min.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
   
     
        <ThemeProvider>
          <main >{children}</main>
          <footer className="bg-danger text-white text-center p-4 mt-5">
            <p className="mb-0">Emergency Services. Stay safe.</p>
          </footer>
        </ThemeProvider>
     
  );
}
