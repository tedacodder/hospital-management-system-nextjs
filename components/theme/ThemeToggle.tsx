"use client";

import { useTheme, type Theme } from "@/components/theme/ThemeProvider";
import { MoonIcon, SunIcon } from "@/components/ui/Icons";

const NEXT: Record<Theme, Theme> = { light: "dark", dark: "system", system: "light" };
const LABEL: Record<Theme, string> = { light: "Light theme", dark: "Dark theme", system: "Matching your system" };

/// One button, three states, cycling on click — light / dark / follow-system.
/// The icon always reflects what's actually on screen (so "system" at night
/// shows the moon), and the accessible label always says which mode is
/// active and what clicking will switch to next.
/// One button, three states, cycling on click — light / dark / follow-system.
/// The icon always reflects what's actually on screen (so "system" at night
/// shows the moon), and the accessible label always says which mode is
/// active and what clicking will switch to next.
///
/// tone="onDark" is for the fixed-dark brand panels (auth header, landing
/// hero) which stay dark in both themes — same white-on-translucent chrome
/// those panels already use elsewhere, not the normal ink/surface pairing.
export function ThemeToggle({ tone = "default", className = "" }: { tone?: "default" | "onDark"; className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const Icon = resolvedTheme === "dark" ? MoonIcon : SunIcon;

  return (
    <button
      type="button"
      onClick={() => setTheme(NEXT[theme])}
      aria-label={`Theme: ${LABEL[theme]}. Click to switch to ${LABEL[NEXT[theme]].toLowerCase()}.`}
      title={LABEL[theme]}
      className={`relative flex h-10 w-10 items-center justify-center rounded-md transition-colors ${
        tone === "onDark" ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-ink-700 hover:bg-ink-900/5 hover:text-ink-900"
      } ${className}`}
    >
      <Icon className="h-[18px] w-[18px]" />
      {theme === "system" && (
        <span
          aria-hidden="true"
          className={`absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full ${
            tone === "onDark" ? "border border-panel bg-accent-400" : "border border-surface bg-accent-600"
          }`}
        />
      )}
    </button>
  );
}
