import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'new' | 'in_progress' | 'closed';
  createdAt: string;
}

interface LeadsState {
  selectedLead: Lead | null;
  filters: {
    status: string[];
    search: string;
  };
}

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