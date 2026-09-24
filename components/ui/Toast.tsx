"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Toast = { id: number; message: string; tone: "success" | "error" };

const ToastContext = createContext<{ push: (message: string, tone?: Toast["tone"]) => void }>({
  push: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-20 z-[100] flex flex-col items-stretch gap-2 md:inset-x-auto md:bottom-4 md:right-4 md:items-end"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : undefined}
            className={`animate-pop pointer-events-auto max-w-sm rounded-lg border px-4 py-3 text-sm font-medium shadow-[var(--shadow-float)] ${
              t.tone === "error"
                ? "border-[var(--color-signal-stop)]/20 bg-[var(--color-signal-stop-bg)] text-[var(--color-signal-stop)]"
                : "border-[var(--color-signal-ok)]/20 bg-[var(--color-signal-ok-bg)] text-[var(--color-signal-ok)]"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
