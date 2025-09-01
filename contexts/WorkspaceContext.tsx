"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useGetActiveWorkspaceQuery } from '@/lib/store/services/workspace';
import { getCurrency, formatCurrencyAmount } from '@/lib/constant/currencies';
import { formatInTimezone, getCurrentTimeInTimezone } from '@/lib/utils/timezone';

interface WorkspaceContextType {
  workspaceId: string | null;
  currency: string;
  currencySymbol: string;
  timezone: string;
  formatCurrency: (amount: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  getCurrentTime: () => Date;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { data: activeWorkspace, isLoading } = useGetActiveWorkspaceQuery(undefined, {
    pollingInterval: 0, // Disable polling
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchOnMountOrArgChange: false,
  });

  const [workspaceData, setWorkspaceData] = useState<{
    workspaceId: string | null;
    currency: string;
    timezone: string;
  }>({
    workspaceId: null,
    currency: 'INR',
    timezone: 'UTC',
  });

  useEffect(() => {
    if (activeWorkspace?.data) {
      setWorkspaceData({
        workspaceId: activeWorkspace.data.id,
        currency: activeWorkspace.data.currency || 'INR',
        timezone: activeWorkspace.data.timezone || 'UTC',
      });
    }
  }, [activeWorkspace]);

  const formatCurrency = (amount: number, options?: Intl.NumberFormatOptions) => {
    return formatCurrencyAmount(amount, workspaceData.currency, options);
  };

  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    return formatInTimezone(date, workspaceData.timezone, options);
  };

  const getCurrentTime = () => {
    return getCurrentTimeInTimezone(workspaceData.timezone);
  };

  const currencyInfo = getCurrency(workspaceData.currency);

  const value: WorkspaceContextType = {
    workspaceId: workspaceData.workspaceId,
    currency: workspaceData.currency,
    currencySymbol: currencyInfo?.symbol || workspaceData.currency,
    timezone: workspaceData.timezone,
    formatCurrency,
    formatDate,
    getCurrentTime,
    isLoading,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}