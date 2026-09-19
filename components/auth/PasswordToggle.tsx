"use client";

import { EyeIcon, EyeOffIcon } from "@/components/ui/Icons";

/// Show/hide button that sits inside a password field's right edge. One fixed
/// label with aria-pressed, so a screen reader announces "Show password,
/// toggle button, pressed" rather than a label that changes under it.
export function PasswordToggle({
  visible,
  onToggle,
  controlsId,
}: {
  visible: boolean;
  onToggle: () => void;
  controlsId: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Show password"
      aria-pressed={visible}
      aria-controls={controlsId}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-500 transition-colors hover:bg-ink-900/5 hover:text-ink-900"
    >
      {visible ? <EyeOffIcon className="h-[18px] w-[18px]" /> : <EyeIcon className="h-[18px] w-[18px]" />}
    </button>
  );
}
