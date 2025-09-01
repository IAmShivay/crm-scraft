import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../supabaseClient";

export const activityLogsApi = createApi({
  reducerPath: "/api/activity-logs/",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/activity-logs/activity-logs",
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
  tagTypes: [
    "ActivityLog",
    "ActivityLogStats",
    "ActivityTypes",
  ],
  endpoints: () => ({}),
  keepUnusedDataFor: 300, // 5 minutes cache
  refetchOnReconnect: false,
  refetchOnFocus: false,
});
