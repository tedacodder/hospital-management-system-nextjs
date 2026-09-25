// Shapes of the responses the doctor screens read. These describe what the
// existing API routes already return (see app/api/*); nothing here asks the
// backend for anything new.

export type DoctorStats = {
  scope: "doctor";
  doctorId: number | null;
  kpis: {
    todaysAppointments: number;
    upcomingAppointments: number;
    completedAppointments: number;
    totalPatients: number;
  };
  appointmentsByStatus: { status: string; count: number }[];
  appointmentTrend: { date: string; count: number }[];
  todaysSchedule: TodayAppointment[];
};

export type TodayAppointment = {
  id: number;
  date: string;
  status: string;
  reason: string;
  patient: { id: number; mrn: string | null; user: { name: string | null } };
};

export type PatientRow = {
  id: number;
  mrn: string | null;
  dateOfBirth: string | null;
  bloodType: string | null;
  createdAt: string;
  user: { id: number; name: string | null; email: string; phone: string; gender: string; age: string };
  _count: { appointments: number };
};

export type PatientDetail = {
  id: number;
  mrn: string | null;
  dateOfBirth: string | null;
  bloodType: string | null;
  allergies: string | null;
  history: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  createdAt: string;
  user: {
    id: number;
    name: string | null;
    email: string;
    phone: string;
    address: string;
    age: string;
    gender: string;
  };
};

export type ConversationSummary = {
  id: number;
  subject: string | null;
  updatedAt: string;
  participants: { id: number; name: string | null; role: string }[];
  lastMessage: { id: number; body: string; createdAt: string; senderId: number } | null;
  hasUnread: boolean;
};
