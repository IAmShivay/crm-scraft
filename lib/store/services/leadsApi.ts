import { leadsApi } from "../base/leadsapi";

export interface Lead {
  [key: string]: any;
}

export const leadsApis = leadsApi.injectEndpoints({
  endpoints: (builder) => ({
    getLeads: builder.query<Lead[], { userId: string; sourceId: string }>({
      query: ({ userId, sourceId }) => ({
        url: `?action=getLeads&userId=${userId}&sourceId=${sourceId}`,
      }),
    }),
    getLeadsByUser: builder.query<Lead[], { userId: string }>({
      query: ({ userId }) => ({
        url: `?action=getLeadsByUser&userId=${userId}`,
      }),
    }),
    getLeadsByWorkspace: builder.query<Lead[], { workspaceId: string }>({
      query: ({ workspaceId }) => ({
        url: `?action=getLeadsByWorkspace&workspaceId=${workspaceId}`,
      }),
      // Using any to bypass strict tag typing
      providesTags: () => [{ type: "Lead" as const, id: "LIST" }] as any,
    }),
    getLeadById: builder.query<Lead, { id: string }>({
      query: ({ id }) => ({
        url: `?action=getLeadById&id=${id}`,
      }),
    }),
    createLead: builder.mutation<
      Lead,
      { workspaceId: string; body: Partial<Lead> }
    >({
      query: ({ workspaceId, body }) => ({
        url: `?action=createLead&workspaceId=${workspaceId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Lead"] as any,
    }),
    createManyLead: builder.mutation<
      { message: string; data: Lead[] },
      { workspaceId: string; body: Partial<Lead>[] }
    >({
      query: ({ workspaceId, body }) => ({
        url: `?action=createManyLead&workspaceId=${workspaceId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Lead"] as any,
    }),
    updateLead: builder.mutation<any, { id: any; leads: any }>({
      query: ({ id, leads }) => ({
        url: `?action=updateLeadById&id=${id}`,
        method: "PUT",
        body: leads,
      }),
      invalidatesTags: ["Lead"] as any,
    }),
    assignRole: builder.mutation<any, { id: any; data: any; workspaceId: any }>(
      {
        query: ({ id, data, workspaceId }) => ({
          url: `?action=assignRoleById&id=${id}&workspaceId=${workspaceId}`,
          method: "PUT",
          body: data,
        }),
      }
    ),
    updateLeadData: builder.mutation<any, { id: any; leads: any }>({
      query: ({ id, leads }) => ({
        url: `?action=updateLeadData&id=${id}`,
        method: "PUT",
        body: leads,
      }),
    }),
    addNotes: builder.mutation<any, { id: any; Note: any }>({
      query: ({ id, Note }) => ({
        url: `?action=updateNotesById&id=${id}`,
        method: "POST",
        body: Note,
      }),
    }),
    getNotes: builder.query<any, { id: any }>({
      query: ({ id }) => ({
        url: `?action=getNotesById&id=${id}`,
        method: "GET",
      }),
    }),
    leadNotification: builder.query<void, { workspaceId: any }>({
      query: ({ workspaceId }) => ({
        url: `?action=getNotifications&workspaceId=${workspaceId}`,
        method: "GET",
      }),
      providesTags: ["LeadNotification"] as any,
    }),
    deleteLead: builder.mutation<void, { id: string; userId: string }>({
      query: ({ id, userId }) => ({
        url: `${id}?userId=${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["LeadNotification"] as any,
    }),
    bulkDeleteLeads: builder.mutation<void, { id: any; workspaceId: any }>({
      query: ({ id, workspaceId }) => ({
        url: `?action=deleteLeads`,
        method: "DELETE",
        body: { id, workspaceId },
      }),
    }),
  }),
});

export const {
  useGetLeadsQuery,
  useGetLeadsByUserQuery,
  useGetLeadsByWorkspaceQuery,
  useGetLeadByIdQuery,
  useAddNotesMutation,
  useGetNotesQuery,
  useCreateLeadMutation,
  useCreateManyLeadMutation,
  useUpdateLeadMutation,
  useDeleteLeadMutation,
  useUpdateLeadDataMutation,
  useAssignRoleMutation,
  useBulkDeleteLeadsMutation,
  useLeadNotificationQuery,
} = leadsApis;
