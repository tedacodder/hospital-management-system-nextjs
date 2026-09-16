-- Patient document attachments.
--
-- Additive only: one new table, no changes to existing ones.

CREATE TABLE "Attachment" (
  "id"           SERIAL       NOT NULL,
  "patientId"    INTEGER      NOT NULL,
  "uploadedById" INTEGER,
  "filename"     TEXT         NOT NULL,
  "mimeType"     TEXT         NOT NULL,
  "sizeBytes"    INTEGER      NOT NULL,
  "storageKey"   TEXT         NOT NULL,
  "description"  TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Attachment_storageKey_key" ON "Attachment"("storageKey");
CREATE INDEX "Attachment_patientId_idx" ON "Attachment"("patientId");
CREATE INDEX "Attachment_createdAt_idx" ON "Attachment"("createdAt");

ALTER TABLE "Attachment"
  ADD CONSTRAINT "Attachment_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attachment"
  ADD CONSTRAINT "Attachment_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
