import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../supabaseClient";
export const statusApi = createApi({
  reducerPath: "/api/status/",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/status/status",
    prepareHeaders: async (headers) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers.set("authorization", `Bearer ${session.access_token}`);
      }
      return headers;
    },
  }),
  endpoints: () => ({}),
  keepUnusedDataFor: 300, // 5 minutes cache
  refetchOnReconnect: false,
  refetchOnFocus: false,
});
