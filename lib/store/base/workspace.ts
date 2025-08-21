import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../supabaseClient";

export const workspaceApi = createApi({
  reducerPath: "/api/workspace/",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/workspace/workspace",
    prepareHeaders: async (headers, { endpoint }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers.set("authorization", `Bearer ${session.access_token}`);
      }
      
      // Check if this is a getActiveWorkspace call and if it's a fresh login
      if (endpoint === 'getActiveWorkspace') {
        const freshLogin = sessionStorage.getItem('fresh_login');
        const loginTimestamp = sessionStorage.getItem('login_timestamp');
        
        if (freshLogin === 'true' && loginTimestamp) {
          const now = Date.now();
          const loginTime = parseInt(loginTimestamp);
          
          // Only send fresh login header within 30 seconds of login
          if (now - loginTime < 30000) {
            headers.set('x-fresh-login', 'true');
            // Clear the flag after sending it once
            sessionStorage.removeItem('fresh_login');
            sessionStorage.removeItem('login_timestamp');
          }
        }
      }
      
      return headers;
    },
  }),
  tagTypes: [
    "Workspace",
    "WorkspaceStats",
    "WorkspaceRevenue",
    "WorkspaceCount",
  ],
  endpoints: () => ({}),
  keepUnusedDataFor: 300, // Increase cache time to 5 minutes
  refetchOnReconnect: true,
  refetchOnFocus: false, // Only refetch when explicitly needed
});
