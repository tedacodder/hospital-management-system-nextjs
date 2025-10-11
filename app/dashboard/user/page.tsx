"use client";
import React, { useEffect } from "react";
import PatientNav from "../../components/PatientNav";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserByEmail } from "../../redux/store/userSlice";
import { fetchAppointmentsByEmail } from "../../redux/slices/appointmentSlice";
import { RootState, AppDispatch } from "../../redux/store";
import { useSession, signIn } from "next-auth/react";

const formatId = (id: number | string) => {
  return id.toString().padStart(6, "0"); // Example: 1 -> 000001
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString();
};

const Userdashboard = () => {
  const { data: session, status } = useSession();
  const dispatch = useDispatch<AppDispatch>();

  const { user, loading: userLoading, error: userError } = useSelector(
    (state: RootState) => state.user
  );

  const { appointments, loading: apptsLoading, error: apptsError } = useSelector(
    (state: RootState) => state.appointments
  );

  useEffect(() => {
    if (session?.user?.email) {
      dispatch(fetchUserByEmail(session.user.email));
      dispatch(fetchAppointmentsByEmail(session.user.email));
    }
  }, [session?.user?.email, dispatch]);

  if (status === "loading") return <div>Loading session...</div>;
  if (!session) {
    return (
      <div className="text-center mt-5">
        <h2>Please log in</h2>
        <button className="btn btn-primary" onClick={() => signIn()}>
          Log in
        </button>
      </div>
    );
  }

  return (
    <div>
      <PatientNav />
      <div className="container mt-5">
        {/* Patient Info */}
        <div className="card shadow-sm p-3 mb-4">
          <h4 className="mb-3">My Profile</h4>

          {userLoading && <p>Loading your information...</p>}
          {userError && <p className="text-danger">Error: {userError}</p>}

          {!userLoading && user && (
            <div className="row">
              <div className="col-md-6">
                <p>
                  <strong>Name:</strong> {user.name || "N/A"}
                </p>
                <p>
                  <strong>Email:</strong> {user.email || "N/A"}
                </p>
                <p>
                  <strong>Age:</strong> {user.age || "N/A"}
                </p>
                <p>
                  <strong>Gender:</strong> {user.gender || "N/A"}
                </p>
              </div>
              <div className="col-md-6">
                <p>
                  <strong>Patient ID:</strong> {"P-" + formatId(user.id) || "N/A"}
                </p>
                <p>
                  <strong>Contact:</strong> {user.phone || "N/A"}
                </p>
                <p>
                  <strong>Address:</strong> {user.address || "N/A"}
                </p>
              </div>
            </div>
          )}
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
              <p className="display-6">2500 birr</p>
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
          <h4 className="mb-3">My Appointments</h4>
          {apptsLoading && <p>Loading appointments...</p>}
          {apptsError && <p className="text-danger">{apptsError}</p>}
          {!apptsLoading && appointments.length === 0 && <p>No appointments found.</p>}
          {!apptsLoading && appointments.length > 0 && (
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
                    <td>{formatDate(a.date)}</td>
                    <td>{a.doctor?.user?.name || "N/A"}</td>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Userdashboard;
