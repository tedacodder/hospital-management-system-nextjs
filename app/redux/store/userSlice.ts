import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

// User type
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  age: string;
  gender: string;
  phone: string;
  address: string;
}

// Slice state
interface UserState {
  users: User[];       // All users
  user: User | null;   // Single user by email
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  users: [],
  user: null,
  loading: false,
  error: null,
};

// Fetch all users
export const fetchAllUsers = createAsyncThunk<User[], void, { rejectValue: string }>(
  "user/fetchAll",
  async (_, thunkAPI) => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (!res.ok) return thunkAPI.rejectWithValue(data.error || "Failed to fetch users");
      return data as User[];
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

// Fetch user by email
export const fetchUserByEmail = createAsyncThunk<User, string, { rejectValue: string }>(
  "user/fetchByEmail",
  async (email, thunkAPI) => {
    try {
      const res = await fetch(`/api/users?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) return thunkAPI.rejectWithValue(data.error || "Failed to fetch user");
      return data.user as User;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUser: (state) => {
      state.user = null;
      state.error = null;
      state.loading = false;
    },
    clearUsers: (state) => {
      state.users = [];
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    // Fetch all users
    builder.addCase(fetchAllUsers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAllUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
      state.loading = false;
      state.users = action.payload;
    });
    builder.addCase(fetchAllUsers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch user by email
    builder.addCase(fetchUserByEmail.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUserByEmail.fulfilled, (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.user = action.payload;
    });
    builder.addCase(fetchUserByEmail.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearUser, clearUsers } = userSlice.actions;
export default userSlice.reducer;
