import { useGetActiveWorkspaceQuery } from '@/lib/store/services/workspace';
import { getCurrency, formatCurrencyAmount } from '@/lib/constant/currencies';
import { formatInTimezone, getCurrentTimeInTimezone } from '@/lib/utils/timezone';

export function useWorkspaceSettings() {
  const { data: activeWorkspace, isLoading } = useGetActiveWorkspaceQuery(undefined, {
    pollingInterval: 0, // Disable polling
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchOnMountOrArgChange: false,
  });

  const workspaceData = activeWorkspace?.data;
  const currency = workspaceData?.currency || 'INR';
  const timezone = workspaceData?.timezone || 'UTC';
  
  const currencyInfo = getCurrency(currency);

  const formatCurrency = (amount: number, options?: Intl.NumberFormatOptions) => {
    return formatCurrencyAmount(amount, currency, options);
  };

  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    return formatInTimezone(date, timezone, options);
  };

  const getCurrentTime = () => {
    return getCurrentTimeInTimezone(timezone);
  };

  return {
    workspaceId: workspaceData?.id || null,
    currency,
    currencySymbol: currencyInfo?.symbol || currency,
    currencyName: currencyInfo?.name || currency,
    timezone,
    formatCurrency,
    formatDate,
    getCurrentTime,
    isLoading,
    workspace: workspaceData,
  };
}