"use client";
  
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Navbar from "../components/Navbar";
export default function LoginPage() {
  
    
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.ok) {
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const role = session?.user?.role;

      if (role === "DOCTOR") router.push("/dashboard/doc");
      else if (role === "ADMIN") router.push("/dashboard/admin");
      else router.push("/dashboard/user");
    }
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
          <h2 className="mb-3 text-center">Login</h2>
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
            className="form-control mb-3"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="btn btn-success w-100">Login</button>
        </form>
      </div>
    </>
  );
}
