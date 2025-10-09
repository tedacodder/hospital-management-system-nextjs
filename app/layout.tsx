"use client";
import { ReactNode } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { SessionProvider } from "next-auth/react";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Medicare</title>
      </head>
      <body>
        <ThemeProvider>
          <main className="">
            <SessionProvider>
              <Provider store={store}>{children}</Provider>
            </SessionProvider>
          </main>
          <footer className="bg-primary text-white text-center p-4 ">
            <p>
              &copy; {new Date().getFullYear()} MediCare+ Hospital Management
              System. All rights reserved.
            </p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
