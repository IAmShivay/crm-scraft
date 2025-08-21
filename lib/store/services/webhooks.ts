import { webhookApi } from "../base/webhooks";

// Using any types for flexibility
interface WebhookRequest {
  status: boolean;
  type: string;
  name: string;
  webhook_url?: string;
  [key: string]: any; // Allow any additional properties
}

interface WebhookResponse {
  [key: string]: any;
}

export const webhookApis = webhookApi.injectEndpoints({
  endpoints: (builder) => ({
    // Create a new webhook
    webhook: builder.mutation<any, any>({
      query: (credentials) => ({
        url: "?action=createWebhook",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Webhook"],
    }),

    // Update an existing webhook
    updateWebhook: builder.mutation<any, any>({
      query: ({ data, id }) => ({
        url: `?action=updateWebhook&id=${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }: any) => [
        { type: "Webhook", id },
        "WebhookSource",
      ],
    }),

    // Delete an existing webhook
    deleteWebhook: builder.mutation<any, any>({
      query: ({ id }) => ({
        url: `?action=deleteWebhook`,
        method: "DELETE",
        body: { id },
      }),
      invalidatesTags: (result, error, { id }: any) => [
        { type: "Webhook", id },
        "WebhookSource",
      ],
    }),

    // Fetch webhooks
    getWebhooks: builder.query<any, any>({
      query: ({ id }) => ({
        url: `?action=getWebhooks&id=${id}`, // Include the id as a query parameter
        method: "GET",
      }),
      providesTags: (result, error, { id }: any) => [
        { type: "Webhook", id },
        "WebhookSource",
      ],
      transformResponse: (response: any) => {
        if (!response) return [];
        return response;
      },
      keepUnusedDataFor: 300, // 5 minutes
    }),

    getWebhooksBySourceId: builder.query<any, any>({
      query: ({ id, workspaceId }: any) => ({
        url: `?action=getWebhooksBySourceId&sourceId=${id || ""}&workspaceId=${
          workspaceId || ""
        }`,
        method: "GET",
      }),
      providesTags: (result, error, { id }: any) => [
        { type: "WebhookSource", id: id || "LIST" },
      ],
      transformResponse: (response: any) => {
        if (!response) return { name: "None" };
        return response;
      },
      keepUnusedDataFor: 300, // 5 minutes
      // Use the skip option when calling the hook instead
      // This removes the problematic property causing the TypeScript error
    }),

    changeWebhookStatus: builder.mutation<any, any>({
      query: ({ id, status }) => ({
        url: `?action=changeWebhookStatus`,
        method: "PUT",
        body: { id, status },
      }),
      invalidatesTags: (result, error, { id }: any) => [
        { type: "Webhook", id },
      ],
    }),
  }),
});

// Export hooks for the mutations and queries
export const {
  useWebhookMutation,
  useUpdateWebhookMutation,
  useDeleteWebhookMutation,
  useGetWebhooksQuery,
  useChangeWebhookStatusMutation,
  useGetWebhooksBySourceIdQuery,
} = webhookApis;
