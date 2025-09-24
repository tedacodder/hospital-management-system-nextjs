"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("PATIENT");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role }),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) router.push("/login");
  };
  const element = [
    { pathname: "Home", path: "/" },
    { pathname: "Login", path: "/login" },
    { pathname: "Signup", path: "/signup" },
  ];
  return (
    <>
      <Navbar items={element} />
      <div className="container d-flex justify-content-center align-items-center vh-100">
        <form
          onSubmit={handleSubmit}
          className="card p-4 shadow-lg"
          style={{ width: "350px" }}
        >
          <h2 className="mb-3 text-center">Sign Up</h2>
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            className="form-control mb-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="form-control mb-2"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <select
            className="form-control mb-3"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="PATIENT">Patient</option>
            <option value="DOCTOR">Doctor</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button className="btn btn-primary w-100">Register</button>
        </form>
      </div>
    </>
  );
}
