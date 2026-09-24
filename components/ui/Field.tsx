import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

// Every field shares one layout: label, control, optional hint, and an error
// slot beneath. `md` is the dense size the dashboards use; `lg` is the roomier
// size for the public sign-in and sign-up forms (16px text, so iOS Safari does
// not zoom the page on focus, and a border dark enough to identify the field).

export type FieldSize = "md" | "lg";

function FieldShell({
  label,
  htmlFor,
  error,
  hint,
  messageId,
  optional,
  size,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  messageId: string;
  optional?: boolean;
  size: FieldSize;
  children: ReactNode;
}) {
  const labelEl = (
    <label htmlFor={htmlFor} className="text-sm font-medium text-ink-700">
      {label}
    </label>
  );

  return (
    <div className="flex flex-col gap-1.5">
      {optional ? (
        <div className="flex items-baseline justify-between gap-2">
          {labelEl}
          <span className="text-xs text-ink-500">Optional</span>
        </div>
      ) : (
        labelEl
      )}
      {children}
      {error ? (
        <p
          id={messageId}
          role="alert"
          className={`text-xs text-[var(--color-signal-stop)] ${size === "lg" ? "animate-rise" : ""}`}
        >
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-xs text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const CONTROL_CLASSES: Record<FieldSize, string> = {
  md: "h-10 rounded-md border border-rule-strong bg-white px-3 text-sm text-ink-900 placeholder:text-ink-300 focus-visible:border-accent-600 disabled:bg-paper disabled:text-ink-500",
  lg: "h-11 w-full rounded-lg border border-control bg-white px-3.5 text-[1rem] text-ink-900 placeholder:text-ink-500 transition-[border-color,box-shadow] duration-150 hover:border-ink-500 focus-visible:border-accent-600 focus-visible:shadow-[0_0_0_4px_rgb(26_145_135/0.16)] disabled:bg-paper disabled:text-ink-500",
};
const ERROR_CLASSES: Record<FieldSize, string> = {
  md: "border-[var(--color-signal-stop)]",
  lg: "border-[var(--color-signal-stop)] hover:border-[var(--color-signal-stop)] focus-visible:border-[var(--color-signal-stop)] focus-visible:shadow-[0_0_0_4px_rgb(163_32_32/0.14)]",
};

/// Merges the field's own message id with any id the caller wants described
/// too (e.g. a live password-requirements list) instead of one overwriting the other.
function describedBy(...ids: Array<string | false | undefined>): string | undefined {
  const joined = ids.filter(Boolean).join(" ");
  return joined || undefined;
}

function defaultId(label: string): string {
  return `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  fieldSize?: FieldSize;
  /** Rendered inside the right edge of the control, e.g. a show/hide button. */
  trailing?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    label,
    error,
    hint,
    optional,
    fieldSize = "md",
    trailing,
    id,
    className = "",
    "aria-describedby": extraDescribedBy,
    ...rest
  },
  ref,
) {
  const fieldId = id ?? defaultId(label);
  const messageId = `${fieldId}-message`;

  const input = (
    <input
      ref={ref}
      id={fieldId}
      aria-invalid={Boolean(error)}
      aria-describedby={describedBy(Boolean(error || hint) && messageId, extraDescribedBy)}
      className={`${CONTROL_CLASSES[fieldSize]} ${error ? ERROR_CLASSES[fieldSize] : ""} ${trailing ? "pr-12" : ""} ${className}`}
      {...rest}
    />
  );

  return (
    <FieldShell
      label={label}
      htmlFor={fieldId}
      error={error}
      hint={hint}
      messageId={messageId}
      optional={optional}
      size={fieldSize}
    >
      {trailing ? (
        <div className="relative">
          {input}
          <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>
        </div>
      ) : (
        input
      )}
    </FieldShell>
  );
});

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  fieldSize?: FieldSize;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  {
    label,
    error,
    hint,
    optional,
    fieldSize = "md",
    id,
    className = "",
    children,
    "aria-describedby": extraDescribedBy,
    ...rest
  },
  ref,
) {
  const fieldId = id ?? defaultId(label);
  const messageId = `${fieldId}-message`;

  const select = (
    <select
      ref={ref}
      id={fieldId}
      aria-invalid={Boolean(error)}
      aria-describedby={describedBy(Boolean(error || hint) && messageId, extraDescribedBy)}
      className={`${CONTROL_CLASSES[fieldSize]} ${error ? ERROR_CLASSES[fieldSize] : ""} ${fieldSize === "lg" ? "appearance-none pr-10" : ""} ${className}`}
      {...rest}
    >
      {children}
    </select>
  );

  return (
    <FieldShell
      label={label}
      htmlFor={fieldId}
      error={error}
      hint={hint}
      messageId={messageId}
      optional={optional}
      size={fieldSize}
    >
      {fieldSize === "lg" ? (
        <div className="relative">
          {select}
          <svg
            viewBox="0 0 20 20"
            className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m5 8 5 5 5-5" />
          </svg>
        </div>
      ) : (
        select
      )}
    </FieldShell>
  );
});

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  fieldSize?: FieldSize;
}

/// A textarea is as tall as its rows, not as tall as a single-line control, so
/// the fixed control height is dropped rather than overridden with h-auto.
function textAreaClasses(size: FieldSize): string {
  return CONTROL_CLASSES[size].replace(/\bh-1[01]\b/, "");
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  function TextAreaField(
    { label, error, hint, optional, fieldSize = "md", id, className = "", "aria-describedby": extraDescribedBy, ...rest },
    ref,
  ) {
    const fieldId = id ?? defaultId(label);
    const messageId = `${fieldId}-message`;
    return (
      <FieldShell
        label={label}
        htmlFor={fieldId}
        error={error}
        hint={hint}
        messageId={messageId}
        optional={optional}
        size={fieldSize}
      >
        <textarea
          ref={ref}
          id={fieldId}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy(Boolean(error || hint) && messageId, extraDescribedBy)}
          className={`${textAreaClasses(fieldSize)} min-h-24 w-full resize-y py-2.5 ${error ? ERROR_CLASSES[fieldSize] : ""} ${className}`}
          {...rest}
        />
      </FieldShell>
    );
  },
);
