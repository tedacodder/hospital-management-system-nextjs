import { checkPassword } from "@/lib/auth-forms";
import { CheckIcon } from "@/components/ui/Icons";

/// Live list of the password rules. State is carried by an icon and hidden
/// text as well as colour, so it is not conveyed by colour alone.
export function PasswordChecklist({ password, id }: { password: string; id: string }) {
  const rules = checkPassword(password);
  return (
    <ul id={id} aria-label="Password requirements" className="mt-0.5 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
      {rules.map((r) => (
        <li
          key={r.id}
          className={`flex items-center gap-2 text-xs transition-colors duration-150 ${
            r.met ? "text-[var(--color-signal-ok)]" : "text-ink-500"
          }`}
        >
          <span
            aria-hidden="true"
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-150 ${
              r.met
                ? "border-[var(--color-signal-ok)] bg-[var(--color-signal-ok)] text-white"
                : "border-control bg-surface"
            }`}
          >
            {r.met && <CheckIcon className="h-2.5 w-2.5" strokeWidth={2.4} />}
          </span>
          <span>
            {r.label}
            <span className="sr-only">{r.met ? " — met" : " — not met"}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
