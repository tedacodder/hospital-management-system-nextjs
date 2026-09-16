"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState, LoadingRows } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { apiGet, apiSend, ApiError } from "@/lib/api-client";

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
  const [items, setItems] = useState<Attachment[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function load() {
    apiGet<Attachment[]>(`/patients/${patientId}/attachments`)
      .then(setItems)
      .catch(() => setItems([]));
  }

  useEffect(load, [patientId]);

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
      const json = await res.json();
      if (!res.ok) throw new ApiError(json?.error?.message ?? "Upload failed", res.status);
      push(`${file.name} uploaded.`);
      load();
    } catch (err) {
      push(err instanceof ApiError ? err.message : "Couldn't upload that file.", "error");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await apiSend("DELETE", `/attachments/${id}`);
      setItems((prev) => prev?.filter((a) => a.id !== id) ?? null);
    } catch (err) {
      push(err instanceof ApiError ? err.message : "Couldn't delete that file.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink-700">Documents</p>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileChosen(file);
          }}
        />
        <Button size="sm" variant="secondary" loading={uploading} onClick={() => fileInput.current?.click()}>
          Upload
        </Button>
      </div>

      {items === null ? (
        <LoadingRows rows={2} />
      ) : items.length === 0 ? (
        <EmptyState title="No documents yet" body="PDF, PNG, JPEG, or WebP, up to 15 MB." />
      ) : (
        <ul className="divide-y divide-rule rounded-md border border-rule">
          {items.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <a
                href={`/api/attachments/${a.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate font-medium text-accent-700 hover:underline"
              >
                {a.filename}
              </a>
              <span className="shrink-0 text-xs text-ink-500">{formatSize(a.sizeBytes)}</span>
              <span className="shrink-0 text-xs text-ink-500">{new Date(a.createdAt).toLocaleDateString()}</span>
              {(canManageAny || a.uploadedBy?.id === myUserId) && (
                <button
                  onClick={() => handleDelete(a.id)}
                  disabled={deletingId === a.id}
                  className="shrink-0 text-xs font-medium text-[var(--color-signal-stop)] hover:underline disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
