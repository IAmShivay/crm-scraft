import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Lead, LeadsState } from './types';

const initialState: LeadsState = {
  selectedLead: null,
  filters: {
    status: [],
    search: '',
  },
};

const leadsSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    setSelectedLead: (state, action: PayloadAction<Lead | null>) => {
      state.selectedLead = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<LeadsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
});

export const { setSelectedLead, setFilters } = leadsSlice.actions;
export default leadsSlice.reducer;