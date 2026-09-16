-- Platform foundation.
--
-- This migration is ADDITIVE ONLY. It creates new tables, adds new nullable or
-- defaulted columns to existing tables, and adds indexes. It does not drop or
-- retype any existing column, so rows already in User / Patient / Doctor /
-- Appointment / MedicalRecord survive unchanged.
--
-- The one constraint that can fail on existing data is the double-booking guard
-- at the end. If it errors, resolve the duplicate (doctorId, date) rows first.

-- ─────────────────── Enum additions ───────────────────

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'STAFF';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'NO_SHOW';

-- ─────────────────── New enums ───────────────────

CREATE TYPE "PrescriptionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_MONEY', 'INSURANCE');
CREATE TYPE "NotificationType" AS ENUM ('APPOINTMENT', 'PRESCRIPTION', 'BILLING', 'MESSAGE', 'SYSTEM');

-- ─────────────────── User ───────────────────

ALTER TABLE "User"
  ADD COLUMN "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "isActive"    BOOLEAN      NOT NULL DEFAULT true,
  ADD COLUMN "lastLoginAt" TIMESTAMP(3);

CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- ─────────────────── Department ───────────────────

CREATE TABLE "Department" (
  "id"          SERIAL       NOT NULL,
  "name"        TEXT         NOT NULL,
  "description" TEXT,
  "isActive"    BOOLEAN      NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- ─────────────────── HospitalSettings ───────────────────

CREATE TABLE "HospitalSettings" (
  "id"             INTEGER      NOT NULL DEFAULT 1,
  "name"           TEXT         NOT NULL DEFAULT 'Hospital Management System',
  "addressLine"    TEXT         NOT NULL DEFAULT '',
  "phone"          TEXT         NOT NULL DEFAULT '',
  "email"          TEXT         NOT NULL DEFAULT '',
  "website"        TEXT         NOT NULL DEFAULT '',
  "logoUrl"        TEXT,
  "currency"       TEXT         NOT NULL DEFAULT 'ETB',
  "timezone"       TEXT         NOT NULL DEFAULT 'Africa/Addis_Ababa',
  "emergencyPhone" TEXT         NOT NULL DEFAULT '',
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HospitalSettings_pkey" PRIMARY KEY ("id")
);

-- ─────────────────── Patient ───────────────────

ALTER TABLE "Patient"
  ADD COLUMN "mrn"                      TEXT,
  ADD COLUMN "dateOfBirth"              TIMESTAMP(3),
  ADD COLUMN "bloodType"                TEXT,
  ADD COLUMN "allergies"                TEXT,
  ADD COLUMN "history"                  TEXT,
  ADD COLUMN "emergencyContactName"     TEXT,
  ADD COLUMN "emergencyContactPhone"    TEXT,
  ADD COLUMN "emergencyContactRelation" TEXT,
  ADD COLUMN "createdAt"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "Patient_mrn_key" ON "Patient"("mrn");

-- Backfill a medical record number for every pre-existing patient.
UPDATE "Patient" SET "mrn" = 'P-' || LPAD("id"::text, 6, '0') WHERE "mrn" IS NULL;

-- ─────────────────── Doctor ───────────────────

ALTER TABLE "Doctor"
  ADD COLUMN "departmentId"    INTEGER,
  ADD COLUMN "licenseNumber"   TEXT,
  ADD COLUMN "bio"             TEXT,
  ADD COLUMN "yearsExperience" INTEGER,
  ADD COLUMN "consultationFee" DECIMAL(12,2),
  ADD COLUMN "isAcceptingNew"  BOOLEAN      NOT NULL DEFAULT true,
  ADD COLUMN "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "Doctor_licenseNumber_key" ON "Doctor"("licenseNumber");
CREATE INDEX "Doctor_departmentId_idx" ON "Doctor"("departmentId");
CREATE INDEX "Doctor_specialization_idx" ON "Doctor"("specialization");

ALTER TABLE "Doctor"
  ADD CONSTRAINT "Doctor_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────── DoctorAvailability ───────────────────

CREATE TABLE "DoctorAvailability" (
  "id"          SERIAL       NOT NULL,
  "doctorId"    INTEGER      NOT NULL,
  "dayOfWeek"   INTEGER      NOT NULL,
  "startTime"   TEXT         NOT NULL,
  "endTime"     TEXT         NOT NULL,
  "slotMinutes" INTEGER      NOT NULL DEFAULT 30,
  "isActive"    BOOLEAN      NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DoctorAvailability_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DoctorAvailability_doctorId_idx" ON "DoctorAvailability"("doctorId");
CREATE UNIQUE INDEX "DoctorAvailability_doctorId_dayOfWeek_startTime_key"
  ON "DoctorAvailability"("doctorId", "dayOfWeek", "startTime");

ALTER TABLE "DoctorAvailability"
  ADD CONSTRAINT "DoctorAvailability_doctorId_fkey"
  FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────── Appointment ───────────────────

ALTER TABLE "Appointment"
  ADD COLUMN "durationMinutes" INTEGER      NOT NULL DEFAULT 30,
  ADD COLUMN "notes"           TEXT,
  ADD COLUMN "cancelledAt"     TIMESTAMP(3),
  ADD COLUMN "cancelReason"    TEXT,
  ADD COLUMN "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");
CREATE INDEX "Appointment_doctorId_idx" ON "Appointment"("doctorId");
CREATE INDEX "Appointment_date_idx" ON "Appointment"("date");
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- ─────────────────── MedicalRecord ───────────────────

ALTER TABLE "MedicalRecord"
  ADD COLUMN "doctorId"      INTEGER,
  ADD COLUMN "appointmentId" INTEGER,
  ADD COLUMN "visitDate"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "diagnosis"     TEXT,
  ADD COLUMN "symptoms"      TEXT,
  ADD COLUMN "treatment"     TEXT,
  ADD COLUMN "notes"         TEXT,
  ADD COLUMN "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Pre-existing rows had no explicit visit date; use their creation time.
UPDATE "MedicalRecord" SET "visitDate" = "createdAt";

CREATE INDEX "MedicalRecord_patientId_idx" ON "MedicalRecord"("patientId");
CREATE INDEX "MedicalRecord_doctorId_idx" ON "MedicalRecord"("doctorId");
CREATE INDEX "MedicalRecord_appointmentId_idx" ON "MedicalRecord"("appointmentId");
CREATE INDEX "MedicalRecord_visitDate_idx" ON "MedicalRecord"("visitDate");

ALTER TABLE "MedicalRecord"
  ADD CONSTRAINT "MedicalRecord_doctorId_fkey"
  FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MedicalRecord"
  ADD CONSTRAINT "MedicalRecord_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────── Prescription ───────────────────

CREATE TABLE "Prescription" (
  "id"              SERIAL               NOT NULL,
  "patientId"       INTEGER              NOT NULL,
  "doctorId"        INTEGER              NOT NULL,
  "status"          "PrescriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "medicalRecordId" INTEGER,
  "appointmentId"   INTEGER,
  "issuedAt"        TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes"           TEXT,
  "createdAt"       TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Prescription_patientId_idx" ON "Prescription"("patientId");
CREATE INDEX "Prescription_doctorId_idx" ON "Prescription"("doctorId");
CREATE INDEX "Prescription_medicalRecordId_idx" ON "Prescription"("medicalRecordId");
CREATE INDEX "Prescription_issuedAt_idx" ON "Prescription"("issuedAt");

ALTER TABLE "Prescription"
  ADD CONSTRAINT "Prescription_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Prescription"
  ADD CONSTRAINT "Prescription_doctorId_fkey"
  FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Prescription"
  ADD CONSTRAINT "Prescription_medicalRecordId_fkey"
  FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Prescription"
  ADD CONSTRAINT "Prescription_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "PrescriptionItem" (
  "id"             SERIAL       NOT NULL,
  "prescriptionId" INTEGER      NOT NULL,
  "medication"     TEXT         NOT NULL,
  "dosage"         TEXT         NOT NULL,
  "frequency"      TEXT         NOT NULL,
  "durationDays"   INTEGER,
  "instructions"   TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PrescriptionItem_prescriptionId_idx" ON "PrescriptionItem"("prescriptionId");

ALTER TABLE "PrescriptionItem"
  ADD CONSTRAINT "PrescriptionItem_prescriptionId_fkey"
  FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────── Billing ───────────────────

CREATE TABLE "Invoice" (
  "id"            SERIAL          NOT NULL,
  "number"        TEXT            NOT NULL,
  "status"        "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  "patientId"     INTEGER         NOT NULL,
  "appointmentId" INTEGER,
  "issuedAt"      TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueAt"         TIMESTAMP(3),
  "notes"         TEXT,
  "subtotal"      DECIMAL(12,2)   NOT NULL DEFAULT 0,
  "discount"      DECIMAL(12,2)   NOT NULL DEFAULT 0,
  "tax"           DECIMAL(12,2)   NOT NULL DEFAULT 0,
  "total"         DECIMAL(12,2)   NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");
CREATE INDEX "Invoice_patientId_idx" ON "Invoice"("patientId");
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX "Invoice_issuedAt_idx" ON "Invoice"("issuedAt");

ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "InvoiceItem" (
  "id"          SERIAL        NOT NULL,
  "invoiceId"   INTEGER       NOT NULL,
  "description" TEXT          NOT NULL,
  "quantity"    INTEGER       NOT NULL DEFAULT 1,
  "unitPrice"   DECIMAL(12,2) NOT NULL,
  "amount"      DECIMAL(12,2) NOT NULL,
  "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

ALTER TABLE "InvoiceItem"
  ADD CONSTRAINT "InvoiceItem_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Payment" (
  "id"           SERIAL          NOT NULL,
  "invoiceId"    INTEGER         NOT NULL,
  "amount"       DECIMAL(12,2)   NOT NULL,
  "method"       "PaymentMethod" NOT NULL DEFAULT 'CASH',
  "reference"    TEXT,
  "paidAt"       TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "recordedById" INTEGER,
  "createdAt"    TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");
CREATE INDEX "Payment_paidAt_idx" ON "Payment"("paidAt");

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_recordedById_fkey"
  FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────── Notification ───────────────────

CREATE TABLE "Notification" (
  "id"        SERIAL             NOT NULL,
  "userId"    INTEGER            NOT NULL,
  "type"      "NotificationType" NOT NULL DEFAULT 'SYSTEM',
  "title"     TEXT               NOT NULL,
  "body"      TEXT,
  "link"      TEXT,
  "isRead"    BOOLEAN            NOT NULL DEFAULT false,
  "readAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────── Messaging ───────────────────

CREATE TABLE "Conversation" (
  "id"        SERIAL       NOT NULL,
  "subject"   TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Conversation_updatedAt_idx" ON "Conversation"("updatedAt");

CREATE TABLE "ConversationParticipant" (
  "id"             SERIAL       NOT NULL,
  "conversationId" INTEGER      NOT NULL,
  "userId"         INTEGER      NOT NULL,
  "lastReadAt"     TIMESTAMP(3),
  "joinedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key"
  ON "ConversationParticipant"("conversationId", "userId");
CREATE INDEX "ConversationParticipant_userId_idx" ON "ConversationParticipant"("userId");

ALTER TABLE "ConversationParticipant"
  ADD CONSTRAINT "ConversationParticipant_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationParticipant"
  ADD CONSTRAINT "ConversationParticipant_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Message" (
  "id"             SERIAL       NOT NULL,
  "conversationId" INTEGER      NOT NULL,
  "senderId"       INTEGER      NOT NULL,
  "body"           TEXT         NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

ALTER TABLE "Message"
  ADD CONSTRAINT "Message_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message"
  ADD CONSTRAINT "Message_senderId_fkey"
  FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────── AuditLog ───────────────────

CREATE TABLE "AuditLog" (
  "id"        SERIAL       NOT NULL,
  "actorId"   INTEGER,
  "action"    TEXT         NOT NULL,
  "entity"    TEXT         NOT NULL,
  "entityId"  TEXT,
  "summary"   TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────── Double-booking guard ───────────────────
-- Added last so that if existing data violates it, everything above has already
-- been applied and only this statement needs attention.

CREATE UNIQUE INDEX "doctor_slot_unique" ON "Appointment"("doctorId", "date");
