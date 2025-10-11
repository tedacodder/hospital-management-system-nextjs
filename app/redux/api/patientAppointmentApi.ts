// redux/api/patientAppointmentApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const patientAppointment = createApi({
  reducerPath: "patientAppointment",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Patients", "Appointments"],
  endpoints: (builder) => ({
    // Fetch all patients
    getPatients: builder.query({
      query: () => "/patients",
      providesTags: ["Patients"],
    }),

    // Add a new patient
    addPatient: builder.mutation({
      query: (patient) => ({
        url: "/patients",
        method: "POST",
        body: patient,
      }),
      invalidatesTags: ["Patients"],
    }),

    // Fetch all appointments or by patient email
    getAppointments: builder.query({
      query: (email?: string) =>
        email ? `/appointments?email=${email}` : "/appointments",
      providesTags: ["Appointments"],
    }),

    // Schedule new appointment
    addAppointment: builder.mutation({
      query: (appointment) => ({
        url: "/appointments",
        method: "POST",
        body: appointment,
      }),
      invalidatesTags: ["Appointments"],
    }),

    // Fetch appointments specifically for a patient (alias)
    getAppointmentsByPatient: builder.query({
      query: (email: string) => `/appointments?email=${email}`,
      providesTags: ["Appointments"],
    }),

    // Create appointment specifically for a patient (alias)
    createAppointment: builder.mutation({
      query: (body) => ({
        url: "/appointments",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Appointments"],
    }),
  }),
});

// Export hooks for components
export const {
  useGetPatientsQuery,
  useAddPatientMutation,
  useGetAppointmentsQuery,
  useAddAppointmentMutation,
  useGetAppointmentsByPatientQuery,
  useCreateAppointmentMutation,
} = patientAppointment;
