"use client"
import React, { useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import AOS from "aos";
import "aos/dist/aos.css";
import "./AboutPage.css";
import PatientNav from "../components/PatientNav";

const About = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <div>
      <PatientNav />
      {/* Hero Section */}
      <section className="about-hero d-flex align-items-center text-center text-white">
        <div className="container" data-aos="fade-up">
          <h1 className="display-4 fw-bold">
            About <span className="text-warning">MediCare+</span>
          </h1>
          <p className="lead mt-3">
            Delivering trusted healthcare solutions with innovation & care.
          </p>
        </div>
      </section>

      {/* About Us Section */}
      <section className="container my-5">
        <div className="row align-items-center">
          <div className="col-md-6" data-aos="fade-right">
            <img
              src="https://images.unsplash.com/photo-1584515933487-779824d29309"
              alt="Hospital"
              className="img-fluid rounded shadow"
            />
          </div>
          <div className="col-md-6" data-aos="fade-left">
            <h2 className="fw-bold">Who We Are</h2>
            <p className="mt-3">
              MediCare+ is a complete Hospital Management System designed to
              make healthcare management simple, efficient, and
              patient-centered. Our platform connects doctors, patients, and
              staff with powerful tools for appointments, billing, and record
              management.
            </p>
            <ul className="list-unstyled mt-3">
              <li>
                <i className="bi bi-check-circle text-primary me-2"></i> Easy
                appointment booking
              </li>
              <li>
                <i className="bi bi-check-circle text-primary me-2"></i> Digital
                patient records
              </li>
              <li>
                <i className="bi bi-check-circle text-primary me-2"></i> Secure
                billing system
              </li>
              <li>
                <i className="bi bi-check-circle text-primary me-2"></i>{" "}
                Doctor-patient communication
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-light py-5">
        <div className="container text-center">
          <h2 className="fw-bold mb-4" data-aos="zoom-in">
            Why Choose Us?
          </h2>
          <div className="row">
            {[
              {
                icon: "bi-shield-check",
                title: "Secure",
                desc: "Your data is safe with advanced security.",
              },
              {
                icon: "bi-speedometer2",
                title: "Efficient",
                desc: "Streamlined workflows save time.",
              },
              {
                icon: "bi-people",
                title: "Patient-Centered",
                desc: "Focused on better patient experience.",
              },
              {
                icon: "bi-laptop",
                title: "Modern",
                desc: "Latest technology in healthcare solutions.",
              },
            ].map((item, index) => (
              <div
                className="col-md-3 mb-4"
                key={index}
                data-aos="fade-up"
                data-aos-delay={index * 200}
              >
                <div className="card h-100 shadow-sm border-0 feature-card">
                  <div className="card-body">
                    <i className={`${item.icon} display-4 text-primary`}></i>
                    <h5 className="mt-3">{item.title}</h5>
                    <p>{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section className="container my-5">
        <h2 className="text-center fw-bold mb-4" data-aos="zoom-in">
          Our Expert Team
        </h2>
        <div className="row text-center">
          {[
            {
              name: "Dr. Sarah Johnson",
              role: "Chief Medical Officer",
              img: "https://randomuser.me/api/portraits/women/44.jpg",
            },
            {
              name: "Dr. James Smith",
              role: "Senior Surgeon",
              img: "https://randomuser.me/api/portraits/men/46.jpg",
            },
            {
              name: "Dr. Emily Brown",
              role: "Pediatrician",
              img: "https://randomuser.me/api/portraits/women/50.jpg",
            },
            {
              name: "Dr. Michael Lee",
              role: "Cardiologist",
              img: "https://randomuser.me/api/portraits/men/52.jpg",
            },
          ].map((doc, index) => (
            <div
              className="col-md-3 mb-4"
              key={index}
              data-aos="fade-up"
              data-aos-delay={index * 200}
            >
              <div className="card team-card shadow border-0">
                <img
                  src={doc.img}
                  alt={doc.name}
                  className="card-img-top rounded-top"
                />
                <div className="card-body">
                  <h5 className="card-title fw-bold">{doc.name}</h5>
                  <p className="text-muted">{doc.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      
      
    </div>
  );
};

export default About;
