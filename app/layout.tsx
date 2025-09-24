"use client";
import { ReactNode } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { SessionProvider } from "next-auth/react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import { motion, AnimatePresence } from "framer-motion";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <div className="container-fluid ">
            <AnimatePresence mode="wait">
              <motion.div
                key={Math.random()}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
              >
                <SessionProvider>{children}</SessionProvider>
              </motion.div>
            </AnimatePresence>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
