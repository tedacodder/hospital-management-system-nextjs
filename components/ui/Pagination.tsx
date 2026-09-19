import type { ApiMeta } from "@/lib/api-client";

/// Renders nothing when there's only one page, so it's always safe to mount
/// unconditionally under a list.
export function Pagination({
  meta,
  onPageChange,
}: {
  meta: ApiMeta | null;
  onPageChange: (page: number) => void;
}) {
  if (!meta || meta.totalPages <= 1) return null;

  const { page, totalPages, total, pageSize } = meta;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between border-t border-rule px-4 py-3">
      <p className="text-xs text-ink-500">
        {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-md px-2.5 py-1 text-xs font-medium text-ink-700 hover:bg-ink-900/5 disabled:cursor-not-allowed disabled:text-ink-300 disabled:hover:bg-transparent"
        >
          Previous
        </button>
        <span className="px-1 font-mono text-xs text-ink-500">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-md px-2.5 py-1 text-xs font-medium text-ink-700 hover:bg-ink-900/5 disabled:cursor-not-allowed disabled:text-ink-300 disabled:hover:bg-transparent"
        >
          Next
        </button>
      </div>
    </div>
  );
}
