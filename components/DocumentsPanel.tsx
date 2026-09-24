"use client";

import { useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/Card";
import { FileIcon, TrashIcon, UploadIcon } from "@/components/ui/Icons";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ApiError, apiGet, apiSend } from "@/lib/api-client";
import { formatDate, friendlyError } from "@/lib/patient-ui";
import { useApiResource } from "@/lib/use-api-resource";

type Attachment = {
  id: number;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  description: string | null;
  createdAt: string;
  uploadedBy: { id: number; name: string | null; role: string } | null;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ACCEPTED = "application/pdf,image/png,image/jpeg,image/webp";

const TYPE_LABEL: Record<string, string> = {
  "application/pdf": "PDF",
  "image/png": "PNG",
  "image/jpeg": "JPG",
  "image/webp": "WEBP",
};

/// Shown on both the patient's own dashboard and the doctor/staff view of a
/// patient's chart. Upload is allowed wherever this is rendered — the API
/// enforces exactly who that can be (assertCanAccessPatient), so this
/// component doesn't need its own role check.
export function DocumentsPanel({
  patientId,
  myUserId,
  canManageAny = false,
}: {
  patientId: number;
  myUserId?: number;
  /// True for staff/admin, who may delete any upload per the API rule in
  /// DELETE /api/attachments/[id]. Everyone else may only delete their own.
  canManageAny?: boolean;
}) {
  const { push } = useToast();
  const files = useApiResource<Attachment[]>(`/patients/${patientId}/attachments`);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFileChosen(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/patients/${patientId}/attachments`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new ApiError(json?.error?.message ?? "Upload failed", res.status);
      push(`${file.name} uploaded.`);
      // Quiet refresh: the list stays on screen while the new file is fetched.
      const next = await apiGet<Attachment[]>(`/patients/${patientId}/attachments`);
      files.setData(next);
    } catch (err) {
      push(friendlyError(err, "Couldn't upload that file. Please try again."), "error");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await apiSend("DELETE", `/attachments/${id}`);
      files.setData((prev) => prev?.filter((a) => a.id !== id) ?? null);
      setConfirmId(null);
    } catch (err) {
      push(friendlyError(err, "Couldn't delete that file. Please try again."), "error");
    } finally {
      setDeletingId(null);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && !uploading) handleFileChosen(file);
  }

  const items = files.data;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-ink-900">Documents</h3>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          aria-label="Choose a file to upload"
          tabIndex={-1}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileChosen(file);
          }}
        />
        <Button size="sm" variant="secondary" loading={uploading} onClick={() => fileInput.current?.click()}>
          <UploadIcon className="h-4 w-4" />
          {uploading ? "Uploading…" : "Upload"}
        </Button>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-lg transition-colors ${dragging ? "bg-accent-050 ring-2 ring-accent-600 ring-offset-2" : ""}`}
      >
        {files.error ? (
          <ErrorState message="We couldn't load the documents." onRetry={files.reload} />
        ) : items === null ? (
          <div className="space-y-2" role="status" aria-label="Loading documents" aria-busy="true">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<FileIcon />}
            title="No documents yet"
            body="Upload or drop a PDF, PNG, JPEG or WebP file, up to 15 MB."
          />
        ) : (
          <ul className="divide-y divide-rule overflow-hidden rounded-lg border border-rule">
            {items.map((a) => {
              const canDelete = canManageAny || a.uploadedBy?.id === myUserId;
              const confirming = confirmId === a.id;
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-surface px-3.5 py-3 sm:flex-nowrap">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-050 font-mono text-[0.625rem] font-semibold text-accent-700">
                    {TYPE_LABEL[a.mimeType] ?? "FILE"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <a
                      href={`/api/attachments/${a.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sm font-medium text-ink-900 underline-offset-4 hover:text-accent-700 hover:underline"
                    >
                      {a.filename}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                    <p className="truncate text-xs text-ink-500">
                      {formatSize(a.sizeBytes)} · {formatDate(a.createdAt)}
                      {a.uploadedBy?.name ? ` · ${a.uploadedBy.name}` : ""}
                    </p>
                  </div>
                  {canDelete &&
                    (confirming ? (
                      <div className="flex shrink-0 items-center gap-1.5" role="group" aria-label={`Delete ${a.filename}?`}>
                        <Button size="sm" variant="danger" loading={deletingId === a.id} onClick={() => handleDelete(a.id)}>
                          Delete
                        </Button>
                        <Button size="sm" variant="ghost" disabled={deletingId === a.id} onClick={() => setConfirmId(null)}>
                          Keep
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(a.id)}
                        aria-label={`Delete ${a.filename}`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-500 transition-colors hover:bg-[var(--color-signal-stop-bg)] hover:text-[var(--color-signal-stop)]"
                      >
                        <TrashIcon className="h-[18px] w-[18px]" />
                      </button>
                    ))}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
