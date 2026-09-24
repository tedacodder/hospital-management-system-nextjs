// Shapes of the responses the patient screens read. These describe what the
// existing API routes already return (see app/api/*); nothing here asks the
// backend for anything new.

export type DoctorRef = { specialization: string; user: { name: string | null } };

export type Appointment = {
  id: number;
  date: string;
  department: string;
  status: string;
  reason: string;
  durationMinutes: number;
  notes: string | null;
  cancelReason: string | null;
  doctor: DoctorRef | null;
};

export type PrescriptionItem = {
  id: number;
  medication: string;
  dosage: string;
  frequency: string;
  durationDays: number | null;
  instructions: string | null;
};

export type Prescription = {
  id: number;
  issuedAt: string;
  status: string;
  notes: string | null;
  doctor: DoctorRef;
  items: PrescriptionItem[];
};

export type InvoiceItem = {
  id: number;
  description: string;
  quantity: number;
  unitPrice: string;
  amount: string;
};

export type Payment = {
  id: number;
  amount: string;
  method: string;
  paidAt: string;
  reference: string | null;
};

export type Invoice = {
  id: number;
  number: string;
  status: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  issuedAt: string;
  dueAt: string | null;
  notes: string | null;
  items: InvoiceItem[];
  payments: Payment[];
};

export type MedicalRecord = {
  id: number;
  details: string;
  visitDate: string;
  diagnosis: string | null;
  symptoms: string | null;
  treatment: string | null;
  notes: string | null;
  doctor: DoctorRef | null;
  prescriptions: { id: number; issuedAt: string; status: string }[];
};

export type DashboardStats = {
  scope: "patient";
  patientId: number | null;
  kpis: {
    upcomingAppointments: number;
    pastAppointments: number;
    activePrescriptions: number;
    outstandingAmount: string;
  };
  nextAppointment: {
    id: number;
    date: string;
    department: string;
    status: string;
    doctor: { user: { name: string | null } } | null;
  } | null;
};
