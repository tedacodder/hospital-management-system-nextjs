/// A single loading placeholder. Purely visual (aria-hidden): the surrounding
/// list or panel should carry the role="status" / aria-busy announcement.
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}
