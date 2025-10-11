// redux/slices/appointmentSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";

// types
export interface Appointment {
  id: number;
  date: string;
  reason: string;
  department: string;
  createdAt?: string;
  patient?: any;
  doctor?: any;
}

interface AppointmentState {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
}

const initialState: AppointmentState = {
  appointments: [],
  loading: false,
  error: null,
};

// fetch appointments for patient by user email
export const fetchAppointmentsByEmail = createAsyncThunk<
  Appointment[],
  string,
  { rejectValue: string }
>("appointments/fetchByEmail", async (email, thunkAPI) => {
  try {
    const res = await fetch(`/api/appointments?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.error || "Failed to fetch appointments");
    // endpoint returns { appointments: [...] }
    return data.appointments as Appointment[];
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err.message);
  }
});

// create appointment
export const createAppointment = createAsyncThunk<
  Appointment,
  Record<string, any>,
  { rejectValue: string }
>("appointments/create", async (payload, thunkAPI) => {
  try {
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.error || "Failed to create appointment");
    // endpoint returns { appointment: {...} }
    return data.appointment as Appointment;
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err.message);
  }
});

const appointmentSlice = createSlice({
  name: "appointments",
  initialState,
  reducers: {
    clearAppointments(state) {
      state.appointments = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchAppointmentsByEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppointmentsByEmail.fulfilled, (state, action: PayloadAction<Appointment[]>) => {
        state.loading = false;
        state.appointments = action.payload;
      })
      .addCase(fetchAppointmentsByEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(createAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAppointment.fulfilled, (state, action: PayloadAction<Appointment>) => {
        state.loading = false;
        // prepend to appointments
        state.appointments = [action.payload, ...state.appointments];
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAppointments } = appointmentSlice.actions;
export const selectAppointments = (state: RootState) => state.appointments;
export default appointmentSlice.reducer;
