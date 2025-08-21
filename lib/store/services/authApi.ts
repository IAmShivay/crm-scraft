import { api } from "../base/authapi";

interface LoginRequest {
  email: string;
  password: string;
}

interface SignupRequest extends LoginRequest {
  confirmPassword: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: "admin" | "sales_agent" | "manager";
  };
}
interface VerifyRequest {
  token: string;
}
export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: "?action=signin",
        method: "POST",
        body: credentials,
      }),
    }),
    signup: builder.mutation<AuthResponse, SignupRequest>({
      query: (credentials) => ({
        url: "?action=signup",
        method: "POST",
        body: credentials,
      }),
    }),
    verify: builder.mutation<AuthResponse, VerifyRequest>({
      query: (token) => ({
        url: "?action=verify",
        method: "POST",
        body: { token },
      }),
    }),
    getProfile: builder.query<AuthResponse["user"], void>({
      query: () => "/auth/profile",
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useGetProfileQuery,
  useVerifyMutation,
} = authApi;
