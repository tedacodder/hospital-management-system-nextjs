"use client";
import React, { useState } from "react";
import Dashboard from "../../components/Dashboard";
interface Appointment {
  time: string;
  patient: string;
  type: string;
  status: "confirmed" | "pending" | "urgent";
}

interface Patient {
  name: string;
  id: string;
  lastVisit: string;
  condition: string;
}

interface NewPatient {
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  address: string;
  medicalHistory: string;
}

interface NewAppointment {
  patient: string;
  date: string;
  time: string;
  type: string;
  notes: string;
}

interface Prescription {
  patient: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface ModalProps {
  show: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ show, title, children, onClose }) => {
  if (!show) return null;
  return (
    <div
      className="modal-overlay position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
      style={{ background: "rgba(0,0,0,0.5)", zIndex: 2000 }}
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains("modal-overlay"))
          onClose();
      }}
    >
      <div
        className="modal-content bg-white rounded shadow"
        style={{ maxWidth: "42rem", width: "90%" }}
      >
        <div className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="mb-0">{title}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [appointments] = useState<Appointment[]>([
    {
      time: "09:00 AM",
      patient: "John Smith",
      type: "Regular Checkup",
      status: "confirmed",
    },
    {
      time: "10:30 AM",
      patient: "Mary Johnson",
      type: "Follow-up",
      status: "confirmed",
    },
    {
      time: "11:00 AM",
      patient: "Robert Brown",
      type: "Consultation",
      status: "pending",
    },
    {
      time: "02:00 PM",
      patient: "Lisa Davis",
      type: "Emergency",
      status: "urgent",
    },
    {
      time: "03:30 PM",
      patient: "Mike Wilson",
      type: "Regular Checkup",
      status: "confirmed",
    },
  ]);

  const [recentPatients, setRecentPatients] = useState<Patient[]>([
    {
      name: "John Smith",
      id: "P001",
      lastVisit: "2024-01-15",
      condition: "Hypertension",
    },
    {
      name: "Mary Johnson",
      id: "P002",
      lastVisit: "2024-01-14",
      condition: "Diabetes",
    },
    {
      name: "Robert Brown",
      id: "P003",
      lastVisit: "2024-01-13",
      condition: "Asthma",
    },
    {
      name: "Lisa Davis",
      id: "P004",
      lastVisit: "2024-01-12",
      condition: "Migraine",
    },
  ]);

  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  const [newPatient, setNewPatient] = useState<NewPatient>({
    firstName: "",
    lastName: "",
    age: 0,
    gender: "",
    phone: "",
    email: "",
    address: "",
    medicalHistory: "",
  });

  const [newAppointment, setNewAppointment] = useState<NewAppointment>({
    patient: "",
    date: "",
    time: "",
    type: "",
    notes: "",
  });

  const [newPrescription, setNewPrescription] = useState<Prescription>({
    patient: "",
    medication: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  });

  const handleAddPatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patientId = `P${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`;
    const fullName = `${newPatient.firstName} ${newPatient.lastName}`;
    setRecentPatients([
      ...recentPatients,
      {
        name: fullName,
        id: patientId,
        lastVisit: new Date().toISOString().slice(0, 10),
        condition: "New",
      },
    ]);
    setShowAddPatientModal(false);
    setNewPatient({
      firstName: "",
      lastName: "",
      age: 0,
      gender: "",
      phone: "",
      email: "",
      address: "",
      medicalHistory: "",
    });
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Schedule Appointment:", newAppointment);
    setShowScheduleModal(false);
    setNewAppointment({ patient: "", date: "", time: "", type: "", notes: "" });
  };

  const handlePrescriptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Prescription:", newPrescription);
    setShowPrescriptionModal(false);
    setNewPrescription({
      patient: "",
      medication: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "#198754";
      case "pending":
        return "#ffc107";
      case "urgent":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  return (
    <div>
      {/* Stats, Appointments, Quick Actions same as previous example */}
      <Dashboard />
      {/* Quick Actions */}
      <div className="col-lg-4">
        <div className="card h-100">
          <div className="card-header">
            <h5 className="mb-0">Quick Actions</h5>
          </div>
          <div className="card-body">
            <button
              className="quick-action-btn w-100 mb-2"
              onClick={() => setShowAddPatientModal(true)}
            >
              <i className="bi bi-person-plus me-2"></i>Add Patient
            </button>
            <button
              className="quick-action-btn w-100 mb-2"
              onClick={() => setShowScheduleModal(true)}
            >
              <i className="bi bi-calendar-plus me-2"></i>Schedule Appointment
            </button>
            <button
              className="quick-action-btn w-100 mb-2"
              onClick={() => setShowPrescriptionModal(true)}
            >
              <i className="bi bi-capsule me-2"></i>Write Prescription
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal
        show={showAddPatientModal}
        title="Add New Patient"
        onClose={() => setShowAddPatientModal(false)}
      >
        <form onSubmit={handleAddPatientSubmit}>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label">First Name</label>
              <input
                type="text"
                className="form-control"
                value={newPatient.firstName}
                onChange={(e) =>
                  setNewPatient({ ...newPatient, firstName: e.target.value })
                }
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-control"
                value={newPatient.lastName}
                onChange={(e) =>
                  setNewPatient({ ...newPatient, lastName: e.target.value })
                }
              />
            </div>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label">Age</label>
              <input
                type="number"
                className="form-control"
                value={newPatient.age}
                onChange={(e) =>
                  setNewPatient({ ...newPatient, age: +e.target.value })
                }
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Gender</label>
              <select
                className="form-select"
                value={newPatient.gender}
                onChange={(e) =>
                  setNewPatient({ ...newPatient, gender: e.target.value })
                }
              >
                <option value="">Select gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Phone</label>
            <input
              type="tel"
              className="form-control"
              value={newPatient.phone}
              onChange={(e) =>
                setNewPatient({ ...newPatient, phone: e.target.value })
              }
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={newPatient.email}
              onChange={(e) =>
                setNewPatient({ ...newPatient, email: e.target.value })
              }
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Address</label>
            <textarea
              className="form-control"
              rows={2}
              value={newPatient.address}
              onChange={(e) =>
                setNewPatient({ ...newPatient, address: e.target.value })
              }
            ></textarea>
          </div>
          <div className="mb-4">
            <label className="form-label">Medical History</label>
            <textarea
              className="form-control"
              rows={3}
              value={newPatient.medicalHistory}
              onChange={(e) =>
                setNewPatient({ ...newPatient, medicalHistory: e.target.value })
              }
            ></textarea>
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowAddPatientModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Patient
            </button>
          </div>
        </form>
      </Modal>

      {/* Schedule Appointment Modal */}
      <Modal
        show={showScheduleModal}
        title="Schedule Appointment"
        onClose={() => setShowScheduleModal(false)}
      >
        <form onSubmit={handleScheduleSubmit}>
          <div className="mb-3">
            <label className="form-label">Patient</label>
            <input
              type="text"
              className="form-control"
              value={newAppointment.patient}
              onChange={(e) =>
                setNewAppointment({
                  ...newAppointment,
                  patient: e.target.value,
                })
              }
            />
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-control"
                value={newAppointment.date}
                onChange={(e) =>
                  setNewAppointment({ ...newAppointment, date: e.target.value })
                }
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Time</label>
              <input
                type="time"
                className="form-control"
                value={newAppointment.time}
                onChange={(e) =>
                  setNewAppointment({ ...newAppointment, time: e.target.value })
                }
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Appointment Type</label>
            <select
              className="form-select"
              value={newAppointment.type}
              onChange={(e) =>
                setNewAppointment({ ...newAppointment, type: e.target.value })
              }
            >
              <option>Regular Consultation</option>
              <option>Follow-up</option>
              <option>Emergency</option>
              <option>Procedure</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="form-label">Notes</label>
            <textarea
              className="form-control"
              rows={3}
              value={newAppointment.notes}
              onChange={(e) =>
                setNewAppointment({ ...newAppointment, notes: e.target.value })
              }
            ></textarea>
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowScheduleModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Schedule
            </button>
          </div>
        </form>
      </Modal>

      {/* Write Prescription Modal */}
      <Modal
        show={showPrescriptionModal}
        title="Write Prescription"
        onClose={() => setShowPrescriptionModal(false)}
      >
        <form onSubmit={handlePrescriptionSubmit}>
          <div className="mb-3">
            <label className="form-label">Patient</label>
            <input
              type="text"
              className="form-control"
              value={newPrescription.patient}
              onChange={(e) =>
                setNewPrescription({
                  ...newPrescription,
                  patient: e.target.value,
                })
              }
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Medication</label>
            <input
              type="text"
              className="form-control"
              value={newPrescription.medication}
              onChange={(e) =>
                setNewPrescription({
                  ...newPrescription,
                  medication: e.target.value,
                })
              }
            />
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label">Dosage</label>
              <input
                type="text"
                className="form-control"
                value={newPrescription.dosage}
                onChange={(e) =>
                  setNewPrescription({
                    ...newPrescription,
                    dosage: e.target.value,
                  })
                }
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Frequency</label>
              <input
                type="text"
                className="form-control"
                value={newPrescription.frequency}
                onChange={(e) =>
                  setNewPrescription({
                    ...newPrescription,
                    frequency: e.target.value,
                  })
                }
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Duration</label>
              <input
                type="text"
                className="form-control"
                value={newPrescription.duration}
                onChange={(e) =>
                  setNewPrescription({
                    ...newPrescription,
                    duration: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="form-label">Instructions</label>
            <textarea
              className="form-control"
              rows={3}
              value={newPrescription.instructions}
              onChange={(e) =>
                setNewPrescription({
                  ...newPrescription,
                  instructions: e.target.value,
                })
              }
            ></textarea>
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowPrescriptionModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Submit
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
