"use client";
import Navbar from "../components/Navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import AOS from "aos";
import Link from "next/link";
import "./HomePage.css";

import "aos/dist/aos.css";

import { useEffect } from "react";

function Home() {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);
  const element = [
    { pathname: "Home", path: "/" },
    { pathname: "Login", path: "/login" },
    { pathname: "Signup", path: "/signup" },
  ];
  return (
    <>
      <Navbar items={element} />
      {/* Hero Section */}
      <div className="m-0 p-0">
        <section className="hero-section text-center d-flex align-items-center justify-content-center">
          <div className="container" data-aos="fade-up">
            <h1 className="display-3 fw-bold text-white">
              Welcome to <span className="text-warning">MediCare+</span>
            </h1>
            <p className="lead text-light mt-3">
              Your trusted partner in healthcare. Manage doctors, patients,
              appointments, and billing—all in one place.
            </p>
            <div className="mt-4">
              <Link
                href="/login"
                className="btn btn-warning btn-lg m-2 shadow-lg"
              >
                Book Appointment
              </Link>
              <Link
                href="/about"
                className="btn btn-outline-light btn-lg m-2 shadow-lg"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container my-5">
          <h2 className="text-center fw-bold mb-4" data-aos="zoom-in">
            Our Services
          </h2>
          <div className="row text-center">
            {[
              {
                icon: "bi-calendar-check",
                title: "Appointments",
                desc: "Easy scheduling and management of patient appointments.",
              },
              {
                icon: "bi-person-badge",
                title: "Doctors",
                desc: "Manage doctor profiles, schedules, and specialties.",
              },
              {
                icon: "bi-people",
                title: "Patients",
                desc: "Keep track of patient records and medical history.",
              },
              {
                icon: "bi-receipt",
                title: "Billing",
                desc: "Simplified billing and payment management system.",
              },
            ].map((service, index) => (
              <div
                className="col-md-3 mb-4"
                key={index}
                data-aos="fade-up"
                data-aos-delay={index * 200}
              >
                <div className="card h-100 shadow service-card">
                  <div className="card-body">
                    <i className={`${service.icon} display-4 text-primary`}></i>
                    <h5 className="card-title mt-3">{service.title}</h5>
                    <p className="card-text">{service.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-primary text-white text-center p-4 mt-5">
          <p className="mb-0">
            &copy; {new Date().getFullYear()} MediCare+ Hospital Management
            System. All rights reserved.
          </p>
        </footer>
      </div>
    </>
  );
}
export default Home;
