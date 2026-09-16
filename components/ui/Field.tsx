import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

// Every field shares one layout: label, control, optional hint, and an error
// slot that always reserves space so the form doesn't jump when it appears.

function FieldShell({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink-700">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-[var(--color-signal-stop)]">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

const controlClasses =
  "h-10 rounded-md border border-rule-strong bg-white px-3 text-sm text-ink-900 placeholder:text-ink-300 focus-visible:border-accent-600 disabled:bg-paper disabled:text-ink-500";
const errorControlClasses = "border-[var(--color-signal-stop)]";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, id, className = "", ...rest },
  ref,
) {
  const fieldId = id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <FieldShell label={label} htmlFor={fieldId} error={error} hint={hint}>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={Boolean(error)}
        className={`${controlClasses} ${error ? errorControlClasses : ""} ${className}`}
        {...rest}
      />
    </FieldShell>
  );
});

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, error, hint, id, className = "", children, ...rest },
  ref,
) {
  const fieldId = id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <FieldShell label={label} htmlFor={fieldId} error={error} hint={hint}>
      <select
        ref={ref}
        id={fieldId}
        aria-invalid={Boolean(error)}
        className={`${controlClasses} ${error ? errorControlClasses : ""} ${className}`}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
});

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  function TextAreaField({ label, error, hint, id, className = "", ...rest }, ref) {
    const fieldId = id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
    return (
      <FieldShell label={label} htmlFor={fieldId} error={error} hint={hint}>
        <textarea
          ref={ref}
          id={fieldId}
          aria-invalid={Boolean(error)}
          className={`${controlClasses} h-auto min-h-24 resize-y py-2 ${error ? errorControlClasses : ""} ${className}`}
          {...rest}
        />
      </FieldShell>
    );
  },
);
