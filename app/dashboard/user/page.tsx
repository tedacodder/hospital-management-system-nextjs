"use client";
import React from "react";
import PatientNav from "../../components/PatientNav";
// import { user_data, fetchData } from "../auth/imports";
// import { AuthContext } from "../auth/authcontex";
// import { useContext } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
// import { useLocation } from "react-router-dom";
import {prisma} from "@/lib/prisma"
async function  Userdashboard(){
  
  const { data: session, status } = useSession();
  const patient = {
    name: session?.user?.name || "",
    age: 17,
    gender: "",
    id: "",
    email: session?.user?.email || "",
    phone: "",
    // contact:user_data[0].contact
  };
  // if (status === "loading") {
  //   return <p>Loading...</p>;
  // }
  if (!session) {
    return (
      <div>
        <h1>please log in</h1>
        <button onClick={() => signIn()}>LogIn</button>
      </div>
    );
  }
  // const info = await prisma.

  // user_data.map((user) => {
  //   if (user.email === email) {
  //     patient.name = user.first_name + " " + user.last_name;
  //     patient.id = "P" + user.user_id;
  //     patient.email = user.email;
  //     patient.gender = user.gender;
  //     patient.phone = user.phone;
  //   }
  // });
  // console.log(email);
  const appointments = [
    {
      date: "2025-08-20",
      doctor: "Dr. Smith",
      department: "Cardiology",
      status: "Completed",
    },
    {
      date: "2025-08-22",
      doctor: "Dr. Johnson",
      department: "Neurology",
      status: "Scheduled",
    },
    {
      date: "2025-08-24",
      doctor: "Dr. Emily",
      department: "Dermatology",
      status: "Pending",
    },
  ];

  return (
    <div>
      {/* Navbar */}

      <PatientNav />
      <div className="container mt-5">
        {/* Patient Info */}
        <div className="card shadow-sm p-3 mb-4">
          <h4 className="mb-3">My Profile</h4>
          <div className="row">
            <div className="col-md-6">
              <p>
                <strong>Name:</strong> {patient.name}
              </p>
              <p>
                <strong>Email:</strong> {patient.email}
              </p>
              <p>
                <strong>Age:</strong> {patient.age}
              </p>
              <p>
                <strong>Gender:</strong> {patient.gender}
              </p>
            </div>
            <div className="col-md-6">
              <p>
                <strong>Patient ID:</strong> {patient.id}
              </p>
              <p>
                <strong>Contact:</strong> {patient.phone}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="row text-center mb-4">
          <div className="col-md-4">
            <div className="card shadow-sm p-3 bg-light">
              <h5>Total Appointments</h5>
              <p className="display-6">{appointments.length}</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm p-3 bg-light">
              <h5>Pending Bills</h5>
              <p className="display-6">{2500 + " birr"}</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm p-3 bg-light">
              <h5>Prescriptions</h5>
              <p className="display-6">5</p>
            </div>
          </div>
        </div>

        {/* Appointment Table */}
        <div className="card shadow-sm p-3">
          <h4 className="mb-3">Recent Appointments</h4>
          <table className="table table-striped">
            <thead className="table-dark">
              <tr>
                <th>Date</th>
                <th>Doctor</th>
                <th>Department</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a, index) => (
                <tr key={index}>
                  <td>{a.date}</td>
                  <td>{a.doctor}</td>
                  <td>{a.department}</td>
                  <td>
                    <span
                      className={`badge ${
                        a.status === "Completed"
                          ? "bg-success"
                          : a.status === "Scheduled"
                          ? "bg-warning text-dark"
                          : "bg-danger"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};

export default Userdashboard;
