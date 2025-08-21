import { api } from '../../base/authapi';
import type { Lead } from './types';

export const leadsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getLeads: builder.query<Lead[], void>({
      query: () => 'leads',
    }),
    getLead: builder.query<Lead, string>({
      query: (id) => `leads/${id}`,
    }),
    createLead: builder.mutation<Lead, Partial<Lead>>({
      query: (body) => ({
        url: 'leads',
        method: 'POST',
        body,
      }),
    }),
    updateLead: builder.mutation<Lead, { id: string; body: Partial<Lead> }>({
      query: ({ id, body }) => ({
        url: `leads/${id}`,
        method: 'PATCH',
        body,
      }),
    }),
    deleteLead: builder.mutation<void, string>({
      query: (id) => ({
        url: `leads/${id}`,
        method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useGetLeadsQuery,
  useGetLeadQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useDeleteLeadMutation,
} = leadsApi;