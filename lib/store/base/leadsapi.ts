import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../supabaseClient";
export const leadsApi = createApi({
  reducerPath: "/api/leads/",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/leads/leads",
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
  keepUnusedDataFor: 60,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});
