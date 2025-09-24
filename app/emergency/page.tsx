"use client"
import React, { useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import AOS from "aos";
import "aos/dist/aos.css";
import "./EmergencyPage.css";

import PatientNav from "../components/PatientNav";

const Emergency = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <>
      <PatientNav />
      <div>
        {/* Hero Section */}
        <section className="emergency-hero d-flex align-items-center text-center text-white">
          <div className="container" data-aos="fade-down">
            <h1 className="display-3 fw-bold text-danger">🚨 Emergency</h1>
            <p className="lead mt-3">
              If you are facing a medical emergency, please call immediately.
            </p>
            <h2 className="fw-bold mt-4">
              <i className="bi bi-telephone-inbound-fill me-2"></i> Dial:{" "}
              <span className="text-warning">+91 112 / 911</span>
            </h2>
            <a href="tel:112" className="btn btn-danger btn-lg mt-3 shadow-lg">
              📞 Call Now
            </a>
          </div>
        </section>

        {/* Quick Emergency Numbers */}
        <section className="container my-5">
          <h2 className="text-center fw-bold mb-4" data-aos="zoom-in">
            Quick Emergency Numbers
          </h2>
          <div className="row text-center">
            {[
              { icon: "bi-truck", title: "Ambulance", number: "+91 102" },
              {
                icon: "bi-shield-fill-exclamation",
                title: "Police",
                number: "+25191 100",
              },
              { icon: "bi-fire", title: "Fire Brigade", number: "+91 101" },
            ].map((item, index) => (
              <div
                className="col-md-4 mb-4"
                key={index}
                data-aos="fade-up"
                data-aos-delay={index * 200}
              >
                <div className="card emergency-card shadow-sm border-0">
                  <div className="card-body">
                    <i className={`${item.icon} display-4 text-danger`}></i>
                    <h5 className="mt-3">{item.title}</h5>
                    <p className="fw-bold">{item.number}</p>
                    <a
                      href={`tel:${item.number.replace(/\D/g, "")}`}
                      className="btn btn-outline-danger"
                    >
                      Call Now
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Emergency Guidelines */}
        <section className="bg-light py-5">
          <div className="container">
            <h2 className="fw-bold text-center mb-4" data-aos="fade-down">
              Emergency Guidelines
            </h2>
            <div className="row">
              <div className="col-md-6" data-aos="fade-right">
                <ul className="list-group list-group-flush">
                  <li className="list-group-item">
                    <i className="bi bi-check-circle text-danger me-2"></i> Stay
                    calm and assess the situation.
                  </li>
                  <li className="list-group-item">
                    <i className="bi bi-check-circle text-danger me-2"></i> Call
                    the appropriate emergency number.
                  </li>
                  <li className="list-group-item">
                    <i className="bi bi-check-circle text-danger me-2"></i>{" "}
                    Provide first aid if trained.
                  </li>
                  <li className="list-group-item">
                    <i className="bi bi-check-circle text-danger me-2"></i>{" "}
                    Share your exact location.
                  </li>
                  <li className="list-group-item">
                    <i className="bi bi-check-circle text-danger me-2"></i>{" "}
                    Follow instructions from emergency responders.
                  </li>
                </ul>
              </div>
              <div className="col-md-6 text-center" data-aos="fade-left">
                <img
                  src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3"
                  alt="Emergency"
                  className="img-fluid rounded shadow"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Emergency Contact Form */}
        <section className="container my-5">
          <h2 className="text-center fw-bold mb-4" data-aos="zoom-in">
            Request Emergency Assistance
          </h2>
          <form
            className="row g-3 shadow p-4 rounded bg-light"
            data-aos="fade-up"
          >
            <div className="col-md-6">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter your name"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-control"
                placeholder="Enter your phone"
                required
              />
            </div>
            <div className="col-12">
              <label className="form-label">Emergency Details</label>
              <textarea
                className="form-control"
                placeholder="Describe the emergency..."
                required
              ></textarea>
            </div>
            <div className="col-12 text-center">
              <button type="submit" className="btn btn-danger btn-lg shadow">
                🚑 Send Alert
              </button>
            </div>
          </form>
        </section>

        {/* Footer */}
        <footer className="bg-danger text-white text-center p-4 mt-5">
          <p className="mb-0">
            &copy; {new Date().getFullYear()} MediCare+ Emergency Services. Stay
            safe.
          </p>
        </footer>
      </div>
    </>
  );
};

export default Emergency;
