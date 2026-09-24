import { initials } from "@/lib/patient-ui";

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
} as const;

/// Initials in a tinted tile. `tone="brand"` is the solid accent used for the
/// signed-in user; the default is the quiet tint used for other people.
export function Avatar({
  name,
  size = "md",
  tone = "tint",
  className = "",
}: {
  name: string | null | undefined;
  size?: keyof typeof SIZES;
  tone?: "tint" | "brand";
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold ${SIZES[size]} ${
        tone === "brand" ? "bg-accent-700 text-white" : "bg-accent-050 text-accent-700"
      } ${className}`}
    >
      {initials(name)}
    </span>
  );
}
