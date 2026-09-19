import type { CSSProperties } from "react";

/// Sets the stagger delay read by .animate-rise / .animate-float in globals.css.
export function delay(ms: number): CSSProperties {
  return { "--d": `${ms}ms` } as CSSProperties;
}
