import { statusApi } from "../base/status";

// Define types for the API
interface Status {
  id: string; // or number, depending on your backend
  name: string;
  description?: string;
  workspaceId: string; // Include workspaceId if applicable
}

interface NewStatus {
  id?: string;
  name: string;
  color: string;
  countInStatistics: boolean;
  showInWorkspace: boolean;
}

interface UpdatedStatus extends Partial<NewStatus> {
  id: string; // `id` is required for update
}

// Define the RTK Query API
export const statusApis = statusApi.injectEndpoints({
  endpoints: (builder) => ({
    addStatus: builder.mutation<
      Status,
      { statusData: NewStatus; workspaceId: string }
    >({
      query: ({ statusData, workspaceId }) => ({
        url: `?action=createStatus&workspaceId=${workspaceId}`,
        method: "POST",
        body: statusData,
      }),
    }),
    updateStatus: builder.mutation<void, { id: any; updatedStatus: any }>({
      query: ({ id, ...updatedStatus }) => ({
        url: `?action=updateStatus&id=${id}`,
        method: "PUT",
        body: updatedStatus,
      }),
    }),
    deleteStatus: builder.mutation<void, { id: any; workspace_id: string }>({
      query: ({ id, workspace_id }) => ({
        url: `?action=deleteStatus&id=${id}`,
        method: "DELETE",
      }),
    }),
    getStatus: builder.query<Status, any>({
      query: (workspaceId) => ({
        url: `?action=getStatus&workspaceId=${workspaceId}`,
        method: "GET",
      }),
    }),
  }),
});

// Export hooks for usage in components
export const {
  useAddStatusMutation,
  useUpdateStatusMutation,
  useDeleteStatusMutation,
  useGetStatusQuery,
} = statusApis;
