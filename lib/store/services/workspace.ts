import { workspaceApi } from "../base/workspace";

// Using any types for flexibility
interface WorkspaceRequest {
  id?: string; // Optional for create/update, required for delete
  name: string;
  description?: string;
  status: boolean;
  [key: string]: any; // Allow any additional properties
}

interface WorkspaceResponse {
  [key: string]: any;
}

export const workspaceApis = workspaceApi.injectEndpoints({
  endpoints: (builder) => ({
    // Create a new workspace
    createWorkspace: builder.mutation<any, any>({
      query: (data) => ({
        url: "?action=createWorkspace",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Workspace"],
    }),

    // Update an existing workspace
    updateWorkspace: builder.mutation<any, any>({
      query: (data) => ({
        url: "?action=updateWorkspaceDetails",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Workspace"],
    }),

    // Delete an existing workspace
    deleteWorkspace: builder.mutation<any, any>({
      query: ({ id }) => ({
        url: `?action=deleteWorkspace`,
        method: "DELETE",
        body: { id },
      }),
      invalidatesTags: ["Workspace"],
    }),

    // Fetch all workspaces
    getWorkspaces: builder.query<any, any>({
      query: () => ({
        url: "?action=getWorkspaces",
        method: "GET",
      }),
      providesTags: ["Workspace"],
      keepUnusedDataFor: 600, // 10 minutes
    }),

    // Fetch workspaces by ID
    getWorkspacesById: builder.query<any, any>({
      query: (id) => ({
        url: `?action=getWorkspacesById&workspaceId=${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Workspace", id }],
      keepUnusedDataFor: 600, // 10 minutes
      // Remove skip property - handle in component instead
    }),

    // Fetch workspaces by owner ID
    getWorkspacesByOwnerId: builder.query<any, any>({
      query: ({ ownerId }) => ({
        url: `?action=getWorkspaces&ownerId=${ownerId}`,
        method: "GET",
      }),
      providesTags: ["Workspace"],
    }),

    getActiveWorkspace: builder.query<any, any>({
      query: () => ({
        url: `?action=getActiveWorkspace`,
        method: "GET",
      }),
      providesTags: ["Workspace"],
      keepUnusedDataFor: 600, // 10 minutes
    }),

    getRevenueByWorkspace: builder.query<any, any>({
      query: (id) => ({
        url: `?action=getLeadsRevenueByWorkspace&workspaceId=${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "WorkspaceRevenue", id }],
      transformResponse: (response: any) => {
        if (!response) return { totalRevenue: 0, change: "+0%" };
        return {
          ...response,
          totalRevenue: response.totalRevenue || 0,
          change: response.change || "+0%",
        };
      },
      keepUnusedDataFor: 300, // 5 minutes
      // Remove skip property - handle in component instead
    }),

    getCountByWorkspace: builder.query<any, any>({
      query: (id) => ({
        url: `?action=getArrivedLeadsCount&workspaceId=${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "WorkspaceCount", id }],
      transformResponse: (response: any) => {
        if (!response) return { arrivedLeadsCount: 0 };
        return {
          ...response,
          arrivedLeadsCount: response.arrivedLeadsCount || 0,
        };
      },
      keepUnusedDataFor: 300, // 5 minutes
      // Remove skip property - handle in component instead
    }),

    getROCByWorkspace: builder.query<any, any>({
      query: (id) => ({
        url: `?action=getTotalLeadsCount&workspaceId=${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "WorkspaceStats", id }],
      transformResponse: (response: any) => {
        if (!response)
          return { conversion_rate: 0, monthly_stats: [], top_source_id: null };
        return {
          ...response,
          conversion_rate: response.conversion_rate || 0,
          monthly_stats: response.monthly_stats || [],
          top_source_id: response.top_source_id || null,
        };
      },
      keepUnusedDataFor: 300, // 5 minutes
      // Remove skip property - handle in component instead
    }),

    getWorkspaceMembers: builder.query<any, any>({
      query: (workspaceId) => ({
        url: `?action=getWorkspaceMembers&workspaceId=${workspaceId}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Workspace", id }],
      // Remove skip property - handle in component instead
    }),

    getQualifiedCount: builder.query<any, any>({
      query: (workspaceId) => ({
        url: `?action=getQualifiedLeadsCount&workspaceId=${workspaceId}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "WorkspaceStats", id }],
      transformResponse: (response: any) => {
        if (!response) return { qualifiedLeadsCount: 0 };
        return {
          ...response,
          qualifiedLeadsCount: response.qualifiedLeadsCount || 0,
        };
      },
      keepUnusedDataFor: 300, // 5 minutes
      // Remove skip property - handle in component instead
    }),

    getWorkspaceDetailsAnalytics: builder.query<any, any>({
      query: (workspaceId) => ({
        url: `?action=getWorkspaceAnalytics&workspaceId=${workspaceId}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "WorkspaceStats", id }],
      // Remove skip property - handle in component instead
    }),

    // Update the status of a workspace
    updateWorkspaceStatus: builder.mutation<any, any>({
      query: ({ id, status }) => ({
        url: "?action=updateWorkspaceStatus",
        method: "PUT",
        body: { id, status },
      }),
      invalidatesTags: (result, error, { id }: any) => [
        { type: "Workspace", id },
      ],
    }),
  }),
});

// Export hooks for the workspace mutations and queries
export const {
  useGetActiveWorkspaceQuery,
  useCreateWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useDeleteWorkspaceMutation,
  useGetWorkspacesQuery,
  useGetWorkspacesByOwnerIdQuery,
  useUpdateWorkspaceStatusMutation,
  useGetWorkspacesByIdQuery,
  useGetRevenueByWorkspaceQuery,
  useGetCountByWorkspaceQuery,
  useGetROCByWorkspaceQuery,
  useGetWorkspaceMembersQuery,
  useGetQualifiedCountQuery,
  useGetWorkspaceDetailsAnalyticsQuery,
} = workspaceApis;
