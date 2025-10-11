import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { appointment } from "./api/appointment";
import { patient } from "./api/patients";
import { patientAppointment } from "./api/patientAppointmentApi";
import userReducer from "./store/userSlice";
import appointmentsReducer from "./slices/appointmentSlice";

export const store = configureStore({
  reducer: {
    // RTK Query reducers
    [appointment.reducerPath]: appointment.reducer,
    [patient.reducerPath]: patient.reducer,
    [patientAppointment.reducerPath]: patientAppointment.reducer, // ✅ new API

    // Regular slices
    user: userReducer,
    appointments: appointmentsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(appointment.middleware)
      .concat(patient.middleware)
      .concat(patientAppointment.middleware), // ✅ include middleware
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
