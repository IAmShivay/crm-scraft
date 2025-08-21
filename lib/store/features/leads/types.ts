export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'new' | 'in_progress' | 'closed';
  createdAt: string;
}

export interface LeadsState {
  selectedLead: Lead | null;
  filters: {
    status: string[];
    search: string;
  };
}