"use client";

import { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "aos/dist/aos.css";
import AOS from "aos";
type Patient = {
  id: number;
  patientId: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  lastVisit: string;
  status: string;
  phone?: string;
  email?: string;
  address?: string;
  medicalHistory?: string;
};

type Appointment = {
  id: number;
  patientId: string;
  date: string;
  time: string;
  type: string;
  notes?: string;
};

export default function DashboardPage() {
  useEffect(() => {
    AOS.init({
      duration: 700,
      once: true,
    });
  }, []);

  const [now, setNow] = useState<Date>(new Date());

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<
    | "home"
    | "patients"
    | "appointments"
    | "records"
    | "prescriptions"
    | "lab"
    | "schedule"
  >("home");

  const [patients, setPatients] = useState<Patient[]>([
    {
      id: 1,
      patientId: "P001",
      firstName: "John",
      lastName: "Smith",
      age: 44,
      gender: "Male",
      lastVisit: "2024-04-20",
      status: "Scheduled",
      phone: "(555) 111-2222",
    },
    {
      id: 2,
      patientId: "P002",
      firstName: "Emily",
      lastName: "Johnson",
      age: 25,
      gender: "Female",
      lastVisit: "2024-04-18",
      status: "Completed",
      phone: "(555) 222-3333",
    },
    {
      id: 3,
      patientId: "P003",
      firstName: "Michael",
      lastName: "Williams",
      age: 42,
      gender: "Male",
      lastVisit: "2024-04-15",
      status: "Completed",
      phone: "(555) 333-4444",
    },
    {
      id: 4,
      patientId: "P004",
      firstName: "Sarah",
      lastName: "Brown",
      age: 46,
      gender: "Female",
      lastVisit: "2024-04-10",
      status: "Completed",
      phone: "(555) 444-5555",
    },
    {
      id: 5,
      patientId: "P005",
      firstName: "David",
      lastName: "Miller",
      age: 27,
      gender: "Male",
      lastVisit: "2024-04-05",
      status: "Completed",
      phone: "(555) 555-6666",
    },
    {
      id: 6,
      patientId: "P006",
      firstName: "Emma",
      lastName: "Davis",
      age: 25,
      gender: "Female",
      lastVisit: "2024-04-02",
      status: "Completed",
      phone: "(555) 666-7777",
    },
  ]);

  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // modal states and form states
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");

  const [schedPatientId, setSchedPatientId] = useState("");
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("");
  const [schedType, setSchedType] = useState("Regular Consultation");
  const [schedNotes, setSchedNotes] = useState("");

  const [presPatientId, setPresPatientId] = useState("");
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("Once daily");
  const [duration, setDuration] = useState("");
  const [instructions, setInstructions] = useState("");

  // UI feedback
  const [alert, setAlert] = useState<{
    type: "success" | "danger";
    message: string;
  } | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // re-init AOS on dynamic content change
    (async () => {
      const AOS = (await import("aos")).default;
      AOS.refresh();
    })();
  }, [patients, appointments]);

  // helpers
  const nextPatientId = () => `P${String(100 + patients.length + 1).slice(1)}`;

  const handleAddPatient = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setAlert({
        type: "danger",
        message: "First and last name are required.",
      });
      return;
    }
    const pid = nextPatientId();
    const newPatient: Patient = {
      id: patients.length + 1,
      patientId: pid,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      age: typeof age === "number" ? age : 0,
      gender,
      lastVisit: new Date().toISOString().slice(0, 10),
      status: "Scheduled",
      phone,
      email,
      address,
      medicalHistory,
    };
    setPatients((p) => [newPatient, ...p]);
    setAlert({
      type: "success",
      message: `Patient ${newPatient.firstName} ${newPatient.lastName} added (ID: ${pid}).`,
    });
    setFirstName("");
    setLastName("");
    setAge("");
    setGender("");
    setPhone("");
    setEmail("");
    setAddress("");
    setMedicalHistory("");
    setShowPatientModal(false);
  };

  const handleSchedule = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!schedPatientId || !schedDate || !schedTime) {
      setAlert({
        type: "danger",
        message: "Please select patient, date and time.",
      });
      return;
    }
    const newAppt: Appointment = {
      id: appointments.length + 1,
      patientId: schedPatientId,
      date: schedDate,
      time: schedTime,
      type: schedType,
      notes: schedNotes,
    };
    setAppointments((a) => [newAppt, ...a]);
    setAlert({ type: "success", message: "Appointment scheduled." });
    setSchedPatientId("");
    setSchedDate("");
    setSchedTime("");
    setSchedType("Regular Consultation");
    setSchedNotes("");
    setShowAppointmentModal(false);
  };

  const handlePrescription = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!presPatientId || !medication) {
      setAlert({
        type: "danger",
        message: "Please select patient and medication.",
      });
      return;
    }
    // For demo we only keep local list (not shown). Reset and close
    setAlert({ type: "success", message: "Prescription created." });
    setPresPatientId("");
    setMedication("");
    setDosage("");
    setFrequency("Once daily");
    setDuration("");
    setInstructions("");
    setShowPrescriptionModal(false);
  };

  // responsive: collapse sidebar on small screens
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 992) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside
        className={`position-fixed sidebar bg-white shadow-sm ${
          sidebarOpen ? "" : "collapsed"
        }`}
        style={{ width: 260, zIndex: 1040 }}
      >
        <div
          className="sidebar-header p-4 text-center text-white"
          style={{ background: "#5D5CDE" }}
        >
          <h5 className="mb-0">🏥 MediCare</h5>
        </div>
        <nav className="mt-4">
          {[
            { key: "home", icon: "bi-house-door-fill", label: "Home" },
            { key: "patients", icon: "bi-people-fill", label: "Patients" },
            {
              key: "appointments",
              icon: "bi-calendar-event",
              label: "Appointments",
            },
            {
              key: "records",
              icon: "bi-clipboard2-data",
              label: "Medical Records",
            },
            {
              key: "prescriptions",
              icon: "bi-capsule",
              label: "Prescriptions",
            },
            { key: "lab", icon: "bi-test-tube", label: "Lab Results" },
            { key: "schedule", icon: "bi-clock", label: "My Schedule" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setActiveItem(item.key as any);
                if (window.innerWidth < 992) setSidebarOpen(false);
              }}
              className={`nav-item btn w-100 text-start ${
                activeItem === item.key ? "active text-white" : "text-muted"
              }`}
              style={{
                borderRadius: 8,
                margin: "6px 12px",
                background: activeItem === item.key ? "#5D5CDE" : "transparent",
              }}
            >
              <i className={`bi ${item.icon} me-2`}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div
          className="doctor-profile p-3 "
          style={{ position: "absolute", bottom: -150, width: "100%" }}
        >
          <div className="d-flex align-items-center mt-auto">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold me-3"
              style={{
                width: "2.5rem",
                height: "2.5rem",
                background: "var(--primary-color, #5D5CDE)",
              }}
            >
              Dr
            </div>
            <div className="flex-fill  text-center border-top pt-3">
              <div className="fw-medium small">Dr. Abel Girma</div>
              <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                Cardiology
              </div>
            </div>
          </div>
        </div>

        {/* mobile toggle */}
        <button
          className="d-lg-none position-absolute"
          style={{ bottom: 12, right: 12 }}
          onClick={() => setSidebarOpen(false)}
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </aside>

      {/* Main content */}
      <main
        className="main-content flex-grow-1"
        style={{
          marginLeft: sidebarOpen ? 260 : 0,
          transition: "margin 200ms",
        }}
      >
        <header className="bg-white border-bottom shadow-sm">
          <div className="d-flex align-items-center justify-content-between p-3">
            <div className="d-flex align-items-center">
              <button
                className="btn btn-outline-secondary d-lg-none me-3"
                onClick={() => setSidebarOpen(true)}
              >
                <i className="bi bi-list"></i>
              </button>
              <h4 className="mb-0">
                {activeItem === "home"
                  ? "Dashboard"
                  : activeItem.charAt(0).toUpperCase() + activeItem.slice(1)}
              </h4>
            </div>
            <div className="d-flex align-items-center">
              <button
                className="btn btn-outline-danger position-relative me-3"
                onClick={() =>
                  setAlert({
                    type: "success",
                    message: "Emergency services notified.",
                  })
                }
              >
                <i className="bi bi-star-fill"></i>
              </button>
              <button className="btn btn-outline-secondary position-relative me-3">
                <i className="bi bi-bell"></i>
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  3
                </span>
              </button>
              <div className="text-end">
                <div className="fw-medium small">
                  {now.toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                  {now.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4">
          {/* Alerts */}
          {alert && (
            <div
              className={`alert alert-${
                alert.type === "success" ? "success" : "danger"
              } alert-dismissible`}
              role="alert"
            >
              {alert.message}
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setAlert(null)}
              />
            </div>
          )}

          {/* Stat cards */}
          <div className="row g-4 mb-4 bg-primary" data-aos="fade-up">
            <div className="col-lg-3 col-md-6 ">
              <div className="stat-card  p-3 rounded shadow-sm bg-warning text-white">
                <div className="d-flex align-items-center justify-content-between ">
                  <div>
                    <div className="opacity-75">Upcoming Appointments</div>
                    <div className="h2 fw-bold">8</div>
                  </div>
                  <div style={{ fontSize: "2rem" }}>📅</div>
                </div>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div
                className="stat-card bg-danger p-3 rounded shadow-sm"
                data-aos="fade-up"
                data-aos-delay="80"
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <div className="opacity-75">New Patients</div>
                    <div className="h2 fw-bold">3</div>
                  </div>
                  <div style={{ fontSize: "2rem" }}>🧑‍⚕️</div>
                </div>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div
                className="stat-card bg-info text-white p-3 rounded shadow-sm"
                data-aos="fade-up"
                data-aos-delay="160"
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <div className="opacity-75">Total Patients</div>
                    <div className="h2 fw-bold">{patients.length}</div>
                  </div>
                  <div style={{ fontSize: "2rem" }}>👥</div>
                </div>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div
                className="stat-card bg-success p-3 rounded shadow-sm"
                data-aos="fade-up"
                data-aos-delay="240"
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <div className="opacity-75">Appointments Today</div>
                    <div className="h2 fw-bold">5</div>
                  </div>
                  <div style={{ fontSize: "2rem" }}>⏰</div>
                </div>
              </div>
            </div>
          </div>

          {/* Appointments + Quick Actions */}
          <div className="row g-4 mb-4">
            <div className="col-lg-8" data-aos="fade-right">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Today's Appointments</h5>
                  <button className="btn btn-sm btn-outline-primary">
                    View All
                  </button>
                </div>
                <div className="card-body">
                  {appointments.length === 0 ? (
                    <div className="text-muted">No appointments scheduled.</div>
                  ) : (
                    appointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="d-flex align-items-center justify-content-between p-3 border rounded mb-2"
                      >
                        <div className="d-flex align-items-center">
                          <div
                            className="rounded-circle me-3"
                            style={{
                              width: 8,
                              height: 8,
                              background:
                                apt.type === "Emergency"
                                  ? "#dc3545"
                                  : "#198754",
                            }}
                          />
                          <div>
                            <div className="fw-medium">
                              {patients.find(
                                (p) => p.patientId === apt.patientId
                              )?.firstName ?? ""}{" "}
                              {patients.find(
                                (p) => p.patientId === apt.patientId
                              )?.lastName ?? ""}
                            </div>
                            <small className="text-muted">{apt.type}</small>
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="fw-medium">{apt.time}</div>
                          <small className="text-muted text-capitalize">
                            {apt.type}
                          </small>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-4" data-aos="fade-left">
              <div className="card h-100">
                <div className="card-header">
                  <h5 className="mb-0">Quick Actions</h5>
                </div>
                <div className="card-body d-flex flex-column">
                  <button
                    className="quick-action-btn btn btn-light mb-2 text-start"
                    onClick={() => setShowPatientModal(true)}
                  >
                    <i className="bi bi-person-plus me-2" /> Add Patient
                  </button>
                  <button
                    className="quick-action-btn btn btn-light mb-2 text-start"
                    onClick={() => setShowAppointmentModal(true)}
                  >
                    <i className="bi bi-calendar-plus me-2" /> Schedule
                    Appointment
                  </button>
                  <button
                    className="quick-action-btn btn btn-light mb-2 text-start"
                    onClick={() => setShowPrescriptionModal(true)}
                  >
                    <i className="bi bi-capsule me-2" /> Write Prescription
                  </button>
                  <button
                    className="quick-action-btn btn btn-light mb-2 text-start"
                    onClick={() =>
                      setAlert({
                        type: "success",
                        message: "Viewing lab results (demo).",
                      })
                    }
                  >
                    <i className="bi bi-clipboard2-data me-2" /> View Lab
                    Results
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="row g-4">
            <div className="col-lg-6" data-aos="zoom-in">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Recent Patients</h5>
                </div>
                <div className="card-body">
                  {patients.map((p) => (
                    <div
                      key={p.patientId}
                      className="d-flex align-items-center justify-content-between p-3 border rounded mb-2"
                    >
                      <div>
                        <div className="fw-medium">
                          {p.firstName} {p.lastName}
                        </div>
                        <small className="text-muted">
                          {p.medicalHistory ?? ""}
                        </small>
                      </div>
                      <div className="text-end">
                        <small className="text-muted">{p.patientId}</small>
                        <br />
                        <small className="text-muted">{p.lastVisit}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-lg-6" data-aos="zoom-in" data-aos-delay="120">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Pending Lab Results</h5>
                </div>
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between p-3 border rounded mb-2">
                    <div>
                      <div className="fw-medium">John Smith</div>
                      <small className="text-muted">Blood Sugar</small>
                    </div>
                    <div className="text-end">
                      <span className="badge bg-warning">High</span>
                      <br />
                      <small className="text-muted">pending</small>
                    </div>
                  </div>
                  <div className="d-flex align-items-center justify-content-between p-3 border rounded mb-2">
                    <div>
                      <div className="fw-medium">Robert Brown</div>
                      <small className="text-muted">X-Ray Chest</small>
                    </div>
                    <div className="text-end">
                      <span className="badge bg-danger">Urgent</span>
                      <br />
                      <small className="text-muted">pending</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Management */}
          <div className="card mt-4" data-aos="fade-up">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Patient Management</h5>
              <button
                className="btn btn-primary"
                onClick={() => setShowPatientModal(true)}
              >
                Add New Patient
              </button>
            </div>
            <div className="card-body">
              <div className="row g-3 mb-4">
                <div className="col-md-8">
                  <input
                    className="form-control"
                    placeholder="Search patients..."
                  />
                </div>
                <div className="col-md-4">
                  <select className="form-select">
                    <option>All Patients</option>
                    <option>Today's Appointments</option>
                    <option>Critical Patients</option>
                    <option>Follow-up Required</option>
                  </select>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Patient ID</th>
                      <th>Name</th>
                      <th>Age</th>
                      <th>Contact</th>
                      <th>Last Visit</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((p) => (
                      <tr key={p.patientId}>
                        <td className="fw-medium">{p.patientId}</td>
                        <td>
                          {p.firstName} {p.lastName}
                        </td>
                        <td>{p.age}</td>
                        <td>{p.phone ?? ""}</td>
                        <td>{p.lastVisit}</td>
                        <td>
                          <span
                            className={`badge ${
                              p.status === "Active" || p.status === "Completed"
                                ? "bg-success"
                                : p.status === "Critical"
                                ? "bg-danger"
                                : "bg-secondary"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary me-1">
                            View
                          </button>
                          <button className="btn btn-sm btn-outline-success me-1">
                            Edit
                          </button>
                          <button className="btn btn-sm btn-outline-danger">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ADD PATIENT MODAL */}
      <Modal show={showPatientModal} onHide={() => setShowPatientModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Patient</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleAddPatient}>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label">First Name</label>
                <input
                  className="form-control"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Last Name</label>
                <input
                  className="form-control"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label">Age</label>
                <input
                  type="number"
                  className="form-control"
                  value={age as any}
                  onChange={(e) =>
                    setAge(e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Gender</label>
                <select
                  className="form-select"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
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
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Address</label>
              <textarea
                className="form-control"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Medical History</label>
              <textarea
                className="form-control"
                rows={3}
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
              />
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowPatientModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Add Patient
              </button>
            </div>
          </form>
        </Modal.Body>
      </Modal>

      {/* SCHEDULE APPOINTMENT MODAL */}
      <Modal
        show={showAppointmentModal}
        onHide={() => setShowAppointmentModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Schedule Appointment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSchedule}>
            <div className="mb-3">
              <label className="form-label">Select Patient</label>
              <select
                className="form-select"
                value={schedPatientId}
                onChange={(e) => setSchedPatientId(e.target.value)}
              >
                <option value="">Choose a patient</option>
                {patients.map((p) => (
                  <option key={p.patientId} value={p.patientId}>
                    {p.firstName} {p.lastName} ({p.patientId})
                  </option>
                ))}
              </select>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={schedDate}
                  onChange={(e) => setSchedDate(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Time</label>
                <input
                  type="time"
                  className="form-control"
                  value={schedTime}
                  onChange={(e) => setSchedTime(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Appointment Type</label>
              <select
                className="form-select"
                value={schedType}
                onChange={(e) => setSchedType(e.target.value)}
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
                value={schedNotes}
                onChange={(e) => setSchedNotes(e.target.value)}
              />
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAppointmentModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Schedule
              </button>
            </div>
          </form>
        </Modal.Body>
      </Modal>

      {/* PRESCRIPTION MODAL */}
      <Modal
        show={showPrescriptionModal}
        onHide={() => setShowPrescriptionModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Write Prescription</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handlePrescription}>
            <div className="mb-3">
              <label className="form-label">Patient</label>
              <select
                className="form-select"
                value={presPatientId}
                onChange={(e) => setPresPatientId(e.target.value)}
              >
                <option value="">Choose a patient</option>
                {patients.map((p) => (
                  <option key={p.patientId} value={p.patientId}>
                    {p.firstName} {p.lastName} ({p.patientId})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Medication</label>
              <input
                className="form-control"
                value={medication}
                onChange={(e) => setMedication(e.target.value)}
              />
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <label className="form-label">Dosage</label>
                <input
                  className="form-control"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Frequency</label>
                <select
                  className="form-select"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                >
                  <option>Once daily</option>
                  <option>Twice daily</option>
                  <option>Three times daily</option>
                  <option>As needed</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Duration</label>
                <input
                  className="form-control"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label">Instructions</label>
              <textarea
                className="form-control"
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
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
                Generate Prescription
              </button>
            </div>
          </form>
        </Modal.Body>
      </Modal>

      <style jsx global>{`
        .sidebar.collapsed {
          transform: translateX(-100%);
        }
        .sidebar {
          transition: transform 210ms ease;
        }
        .nav-item.active {
          background: #4a49c7;
        }
        .quick-action-btn {
          width: 100%;
          text-align: left;
          padding: 0.75rem;
          border-radius: 8px;
        }
        @media (max-width: 991.98px) {
          .main-content {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
