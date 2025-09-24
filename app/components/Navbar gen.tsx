// app/components/Navbar.tsx
"use client";

import Link from "next/link";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <nav
      className={`navbar navbar-expand-lg ${
        darkMode ? "navbar-dark bg-dark" : "navbar-dark bg-primary"
      }`}
    >
      <div className="container-fluid">
        <Link className="navbar-brand" href="/">
          HospitalMS
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item me-3">
              <Link className="nav-link" href="/patients">
                Patients
              </Link>
            </li>
            <li className="nav-item me-3">
              <Link className="nav-link" href="/doctors">
                Doctors
              </Link>
            </li>
            <li className="nav-item me-3">
              <Link className="nav-link" href="/admin">
                Admin
              </Link>
            </li>
            <li className="nav-item">
              <button
                className={`btn ${darkMode ? "btn-light" : "btn-dark"}`}
                onClick={toggleTheme}
              >
                {darkMode ? "Light 🌞" : "Dark 🌙"}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
