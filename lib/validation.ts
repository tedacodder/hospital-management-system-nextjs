import { z } from "zod";
import {
  AppointmentStatus,
  InvoiceStatus,
  NotificationType,
  PaymentMethod,
  PrescriptionStatus,
  Role,
} from "@prisma/client";

// One source of truth for input shapes. API routes parse with these; forms
// reuse them so client and server validation cannot drift apart.

// ─────────────────────────── Primitives ───────────────────────────

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  .transform((v) => v.toLowerCase());

/// Deliberately permissive about formatting, strict about content: digits,
/// spaces, dashes, and parentheses, with an optional leading +. The first
/// character may be a digit or an opening paren — "(555) 123-4567" is a
/// normal US format and must not be rejected just because it doesn't start
/// with a bare digit.
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9(][0-9\s\-()]{6,19}$/, "Enter a valid phone number");

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(128, "Password is too long")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");

export const isoDateTime = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date")
  .transform((v) => new Date(v));

export const idSchema = z.coerce.number().int().positive();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(120).optional(),
  sort: z.string().trim().max(40).optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// ─────────────────────────── Auth ───────────────────────────

/// Public registration. Note the absence of `role` — self-service signup always
/// creates a PATIENT. Elevated accounts are created by an admin only.
export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(120),
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema.optional().or(z.literal("")),
  age: z.string().trim().max(3).optional().or(z.literal("")),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  address: z.string().trim().max(255).optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ─────────────────────────── Users ───────────────────────────

/// Admin-only user creation. This is the only path that may set a role.
export const adminCreateUserSchema = registerSchema.extend({
  role: z.nativeEnum(Role),
  specialization: z.string().trim().min(2).max(120).optional().or(z.literal("")),
  departmentId: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    idSchema.optional()
  ),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: phoneSchema.optional().or(z.literal("")),
  address: z.string().trim().max(255).optional().or(z.literal("")),
  age: z.string().trim().max(3).optional().or(z.literal("")),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
});

// ─────────────────────────── Patients ───────────────────────────

export const patientProfileSchema = z.object({
  dateOfBirth: isoDateTime.optional(),
  bloodType: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .optional(),
  allergies: z.string().trim().max(2000).optional().or(z.literal("")),
  history: z.string().trim().max(5000).optional().or(z.literal("")),
  emergencyContactName: z.string().trim().max(120).optional().or(z.literal("")),
  emergencyContactPhone: phoneSchema.optional().or(z.literal("")),
  emergencyContactRelation: z.string().trim().max(60).optional().or(z.literal("")),
});

export const createPatientSchema = registerSchema
  .omit({ password: true })
  .extend({
    password: passwordSchema.optional(),
  })
  .merge(patientProfileSchema);

// ─────────────────────────── Departments ───────────────────────────

export const departmentSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

// ─────────────────────────── Doctors ───────────────────────────

export const doctorProfileSchema = z.object({
  specialization: z.string().trim().min(2, "Specialization is required").max(120),
  departmentId: idSchema.optional(),
  licenseNumber: z.string().trim().max(60).optional().or(z.literal("")),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  yearsExperience: z.coerce.number().int().min(0).max(70).optional(),
  consultationFee: z.coerce.number().min(0).max(1_000_000).optional(),
  isAcceptingNew: z.boolean().optional(),
});

const HHMM = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

export const availabilitySchema = z
  .object({
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    startTime: z.string().regex(HHMM, "Use 24-hour HH:mm"),
    endTime: z.string().regex(HHMM, "Use 24-hour HH:mm"),
    slotMinutes: z.coerce.number().int().min(5).max(240).default(30),
    isActive: z.boolean().default(true),
  })
  .refine((v) => v.startTime < v.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

// ─────────────────────────── Appointments ───────────────────────────

export const createAppointmentSchema = z.object({
  patientId: idSchema.optional(), // staff booking on behalf of a patient
  doctorId: idSchema.optional(),
  department: z.string().trim().min(2, "Select a department").max(80),
  date: isoDateTime.refine((d) => d.getTime() > Date.now(), {
    message: "Pick a date in the future",
  }),
  durationMinutes: z.coerce.number().int().min(5).max(240).default(30),
  reason: z.string().trim().min(3, "Describe the reason").max(1000),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const updateAppointmentSchema = z.object({
  doctorId: idSchema.nullish(),
  department: z.string().trim().min(2).max(80).optional(),
  date: isoDateTime.optional(),
  durationMinutes: z.coerce.number().int().min(5).max(240).optional(),
  reason: z.string().trim().min(3).max(1000).optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.nativeEnum(AppointmentStatus).optional(),
  cancelReason: z.string().trim().max(500).optional(),
});

export const appointmentQuerySchema = paginationSchema.extend({
  status: z.nativeEnum(AppointmentStatus).optional(),
  doctorId: idSchema.optional(),
  patientId: idSchema.optional(),
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
});

// ─────────────────────────── Medical records ───────────────────────────

export const createRecordSchema = z.object({
  patientId: idSchema,
  appointmentId: idSchema.optional(),
  visitDate: isoDateTime.optional(),
  details: z.string().trim().min(3, "Enter a summary").max(500),
  diagnosis: z.string().trim().max(2000).optional().or(z.literal("")),
  symptoms: z.string().trim().max(2000).optional().or(z.literal("")),
  treatment: z.string().trim().max(4000).optional().or(z.literal("")),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
});

// ─────────────────────────── Prescriptions ───────────────────────────

export const prescriptionItemSchema = z.object({
  medication: z.string().trim().min(2, "Medication is required").max(200),
  dosage: z.string().trim().min(1, "Dosage is required").max(80),
  frequency: z.string().trim().min(1, "Frequency is required").max(80),
  durationDays: z.coerce.number().int().min(1).max(365).optional(),
  instructions: z.string().trim().max(500).optional().or(z.literal("")),
});

export const createPrescriptionSchema = z.object({
  patientId: idSchema,
  medicalRecordId: idSchema.optional(),
  appointmentId: idSchema.optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  items: z.array(prescriptionItemSchema).min(1, "Add at least one medication"),
});

export const updatePrescriptionSchema = z.object({
  status: z.nativeEnum(PrescriptionStatus),
});

export const prescriptionQuerySchema = paginationSchema.extend({
  patientId: idSchema.optional(),
});

// ─────────────────────────── Billing ───────────────────────────

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(2, "Description is required").max(200),
  quantity: z.coerce.number().int().min(1).max(999).default(1),
  unitPrice: z.coerce.number().min(0).max(1_000_000),
});

export const createInvoiceSchema = z.object({
  patientId: idSchema,
  appointmentId: idSchema.optional(),
  dueAt: isoDateTime.optional(),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  items: z.array(invoiceItemSchema).min(1, "Add at least one line item"),
});

export const updateInvoiceSchema = z.object({
  status: z.nativeEnum(InvoiceStatus).optional(),
  dueAt: isoDateTime.optional(),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const createPaymentSchema = z.object({
  amount: z.coerce.number().positive("Enter an amount greater than zero"),
  method: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
  reference: z.string().trim().max(120).optional().or(z.literal("")),
  paidAt: isoDateTime.optional(),
});

// ─────────────────────────── Notifications ───────────────────────────

export const createNotificationSchema = z.object({
  userId: idSchema,
  type: z.nativeEnum(NotificationType).default(NotificationType.SYSTEM),
  title: z.string().trim().min(2).max(140),
  body: z.string().trim().max(1000).optional().or(z.literal("")),
  link: z.string().trim().max(300).optional().or(z.literal("")),
});

// ─────────────────────────── Messaging ───────────────────────────

export const createConversationSchema = z.object({
  participantIds: z.array(idSchema).min(1, "Choose someone to message"),
  subject: z.string().trim().max(140).optional().or(z.literal("")),
  body: z.string().trim().min(1, "Write a message").max(4000),
});

export const createMessageSchema = z.object({
  body: z.string().trim().min(1, "Write a message").max(4000),
});

// ─────────────────────────── Settings ───────────────────────────

export const hospitalSettingsSchema = z.object({
  name: z.string().trim().min(2).max(140),
  addressLine: z.string().trim().max(255).optional().or(z.literal("")),
  phone: phoneSchema.optional().or(z.literal("")),
  email: emailSchema.optional().or(z.literal("")),
  website: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  currency: z.string().trim().min(1).max(8),
  timezone: z.string().trim().min(1).max(64),
  emergencyPhone: phoneSchema.optional().or(z.literal("")),
});
