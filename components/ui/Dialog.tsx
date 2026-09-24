"use client";

import { useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "@/components/ui/Icons";
import { useModal } from "@/components/ui/useModal";

/// A modal dialog. On phones it rises from the bottom as a sheet; from sm up it
/// is centred. Focus moves into the dialog on open, is kept inside while it is
/// open, and returns to whatever opened it on close.
export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const onCloseRef = useModal(open, panelRef, onClose, closeRef);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="animate-fade absolute inset-0 bg-ink-900/50" onClick={() => onCloseRef.current()} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-pop relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-xl border border-rule bg-surface p-5 shadow-[var(--shadow-float)] sm:rounded-xl sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold tracking-[-0.01em] text-ink-900">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => onCloseRef.current()}
            aria-label="Close dialog"
            className="-mr-1.5 -mt-1 flex h-9 w-9 items-center justify-center rounded-md text-ink-500 transition-colors hover:bg-ink-900/5 hover:text-ink-900"
          >
            <CloseIcon className="h-[18px] w-[18px]" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
