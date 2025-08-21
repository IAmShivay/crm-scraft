import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  token: string | null;
  session: string | null;
  user: {
    id: string;
    email: string;
    role: "admin" | "sales_agent" | "manager";
  } | null;
}

const initialState: AuthState = {
  token: null,
  user: null,
  session: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: AuthState["user"] }>
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    logout(state) {
      state.token = null;
      state.user = null;
    },
    signup(state, action: PayloadAction<{ token: string; user: AuthState["user"] }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    signin(state, action: PayloadAction<{ token: string; user: AuthState["user"] ,session: string }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.session = action.payload.session;
    },
    verify(state, action: PayloadAction<{ token: string }>) {
      state.token = action.payload.token;
    },
  },
});

export const { setCredentials, logout, signup, signin, verify } = authSlice.actions;
export default authSlice.reducer;