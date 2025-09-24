"use client"
import React, { useState, FormEvent } from "react";
import PatientNav from "../components/PatientNav";
const Appointment = () => {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    contact: "",
    email: "",
    date: "",
    department: "",
    doctor: "",
    reason: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Appointment Data:", formData);
    alert("Appointment submitted successfully!");
    setFormData({
      name: "",
      age: "",
      gender: "",
      contact: "",
      email: "",
      date: "",
      department: "",
      doctor: "",
      reason: "",
    });
  };

  return (
    <>
      <PatientNav />
      <div className="container mt-4 mt-5">
        <div className="card shadow p-4">
          <h3 className="mb-3 text-center">Book an Appointment</h3>
          <form onSubmit={handleSubmit}>
            {/* Patient Name & Age */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Age</label>
                <input
                  type="number"
                  className="form-control"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Gender</label>
                <select
                  className="form-select"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            {/* Contact & Email */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Contact Number</label>
                <input
                  type="tel"
                  className="form-control"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Appointment Date */}
            <div className="mb-3">
              <label className="form-label">Preferred Date</label>
              <input
                type="date"
                className="form-control"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            {/* Department & Doctor */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Department</label>
                <select
                  className="form-select"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select</option>
                  <option>Cardiology</option>
                  <option>Neurology</option>
                  <option>Orthopedics</option>
                  <option>Dermatology</option>
                  <option>Pediatrics</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Preferred Doctor</label>
                <input
                  type="text"
                  className="form-control"
                  name="doctor"
                  value={formData.doctor}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Reason */}
            <div className="mb-3">
              <label className="form-label">Reason for Visit</label>
              <textarea
                className="form-control"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            {/* Submit */}
            <div className="text-center">
              <button type="submit" className="btn btn-primary px-4">
                Book Appointment
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Appointment;
