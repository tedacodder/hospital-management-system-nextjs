"use client"
import React, { useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import AOS from "aos";
import "aos/dist/aos.css";
import "./DoctorDashboard.css";
import DocNav from "../../components/DocNav";

const Doctorsdb = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <>
      <DocNav />

      <div className="d-flex m-4">
        {/* Sidebar */}
        <div className="sidebar bg-primary text-white p-3">
          <h3 className="fw-bold mb-4">MediCare+</h3>
          <ul className="nav flex-column">
            <li className="nav-item mb-2">
              <a href="#" className="nav-link text-white">
                <i className="bi bi-house-door me-2"></i> Dashboard
              </a>
            </li>
            <li className="nav-item mb-2">
              <a href="#" className="nav-link text-white">
                <i className="bi bi-calendar-check me-2"></i> Appointments
              </a>
            </li>
            <li className="nav-item mb-2">
              <a href="#" className="nav-link text-white">
                <i className="bi bi-people me-2"></i> Patients
              </a>
            </li>
            <li className="nav-item mb-2">
              <a href="#" className="nav-link text-white">
                <i className="bi bi-chat-dots me-2"></i> Messages
              </a>
            </li>
            <li className="nav-item mb-2">
              <a href="#" className="nav-link text-white">
                <i className="bi bi-person-circle me-2"></i> Profile
              </a>
            </li>
          </ul>
        </div>

        {/* Main Content */}
        <div className="content flex-grow-1 p-4">
          <h2 className="fw-bold mb-4" data-aos="fade-down">
            👨‍⚕️ Doctor Dashboard
          </h2>

          {/* Stats */}
          <div className="row mb-4">
            {[
              { icon: "bi-calendar-check", title: "Appointments", count: 12 },
              { icon: "bi-people", title: "Patients", count: 48 },
              { icon: "bi-chat-dots", title: "Messages", count: 5 },
              { icon: "bi-bell", title: "Notifications", count: 3 },
            ].map((stat, index) => (
              <div
                className="col-md-3 mb-3"
                key={index}
                data-aos="fade-up"
                data-aos-delay={index * 200}
              >
                <div className="card stat-card shadow-sm">
                  <div className="card-body text-center">
                    <i className={`${stat.icon} display-6 text-primary`}></i>
                    <h5 className="mt-2">{stat.title}</h5>
                    <p className="fw-bold fs-4">{stat.count}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Upcoming Appointments */}
          <div className="card shadow-sm mb-4" data-aos="fade-right">
            <div className="card-header bg-primary text-white fw-bold">
              Upcoming Appointments
            </div>
            <div className="card-body">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>John Doe</td>
                    <td>28 Aug 2025</td>
                    <td>10:30 AM</td>
                    <td>General Checkup</td>
                    <td>
                      <span className="badge bg-success">Confirmed</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Emily Smith</td>
                    <td>28 Aug 2025</td>
                    <td>11:15 AM</td>
                    <td>Cardiology</td>
                    <td>
                      <span className="badge bg-warning">Pending</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Michael Lee</td>
                    <td>29 Aug 2025</td>
                    <td>09:00 AM</td>
                    <td>Pediatrics</td>
                    <td>
                      <span className="badge bg-success">Confirmed</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Patient List */}
          <div className="card shadow-sm mb-4" data-aos="fade-left">
            <div className="card-header bg-primary text-white fw-bold">
              My Patients
            </div>
            <div className="card-body">
              <ul className="list-group">
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  John Doe <span className="badge bg-info">Diabetes</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Emily Smith <span className="badge bg-info">Cardiac</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Michael Lee <span className="badge bg-info">Pediatric</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Messages */}
          <div className="card shadow-sm" data-aos="fade-up">
            <div className="card-header bg-primary text-white fw-bold">
              Messages
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                <strong>Patient John Doe:</strong> "Doctor, should I continue
                the same medication?"
              </div>
              <div className="alert alert-warning">
                <strong>Admin:</strong> "Reminder: Staff meeting at 5 PM today."
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Doctorsdb;
