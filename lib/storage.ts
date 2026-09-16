import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { HttpError } from "@/lib/api";

// Local filesystem storage for patient document attachments.
//
// Real limitation, stated plainly: this only works for a single-instance
// deployment with a persistent disk. A multi-instance or serverless
// deployment needs object storage (S3, R2, GCS) instead — swap this file's
// implementation for one backed by that; nothing in the API routes that call
// it would need to change, since they only deal in storageKey strings.

const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(process.cwd(), "uploads");

const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export function isAllowedMimeType(mimeType: string): boolean {
  return mimeType in ALLOWED_MIME_TYPES;
}

async function ensureDir(): Promise<void> {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

/// Generates the on-disk key. This is the ONLY place a storage key is ever
/// constructed — it is always a random UUID plus an extension derived from a
/// checked allowlist, never from the client-supplied filename. That is what
/// makes readUpload/deleteUpload's path-traversal guard sufficient below: a
/// key that came from here can never contain "..", "/", or anything else that
/// would let it escape UPLOAD_DIR.
function generateStorageKey(mimeType: string): string {
  const ext = ALLOWED_MIME_TYPES[mimeType];
  return `${randomUUID()}.${ext}`;
}

/// Rejects any key that isn't exactly what generateStorageKey produces. Called
/// before every filesystem read/delete, so even a bug elsewhere that let a
/// stored key be tampered with (e.g. a compromised row) can't be used to read
/// or delete an arbitrary file on disk.
function assertSafeKey(storageKey: string): void {
  if (!/^[0-9a-f-]{36}\.(pdf|png|jpg|webp)$/i.test(storageKey)) {
    throw new HttpError(400, "Invalid file reference");
  }
}

export async function saveUpload(
  bytes: Uint8Array,
  mimeType: string,
): Promise<{ storageKey: string; sizeBytes: number }> {
  if (!isAllowedMimeType(mimeType)) {
    throw new HttpError(415, "Only PDF, PNG, JPEG, and WebP files are accepted");
  }
  if (bytes.byteLength === 0) {
    throw new HttpError(400, "The file is empty");
  }
  if (bytes.byteLength > MAX_SIZE_BYTES) {
    throw new HttpError(413, "Files must be under 15 MB");
  }

  await ensureDir();
  const storageKey = generateStorageKey(mimeType);
  await writeFile(path.join(UPLOAD_DIR, storageKey), bytes);
  return { storageKey, sizeBytes: bytes.byteLength };
}

export async function readUpload(storageKey: string): Promise<Buffer> {
  assertSafeKey(storageKey);
  try {
    return await readFile(path.join(UPLOAD_DIR, storageKey));
  } catch {
    throw new HttpError(404, "File not found");
  }
}

export async function deleteUpload(storageKey: string): Promise<void> {
  assertSafeKey(storageKey);
  await rm(path.join(UPLOAD_DIR, storageKey), { force: true });
}
