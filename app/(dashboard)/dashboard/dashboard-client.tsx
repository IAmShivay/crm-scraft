"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetWebhooksBySourceIdQuery } from "@/lib/store/services/webhooks";
import {
  useGetActiveWorkspaceQuery,
  useGetCountByWorkspaceQuery,
  useGetQualifiedCountQuery,
  useGetRevenueByWorkspaceQuery,
  useGetROCByWorkspaceQuery,
} from "@/lib/store/services/workspace";
import { setActiveWorkspaceId } from "@/lib/store/slices/sideBar";
import { RootState } from "@/lib/store/store";
import { Award, TrendingUp, UserPlus, Users } from "lucide-react";
import React, { lazy, Suspense, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { formatCurrency, formatAmount, formatPercentage, formatChange, getChangeColorClass } from "./utils";
import { logger } from "@/lib/logger";

// Dynamically import heavy components for code splitting
const DashboardChart = lazy(
  () => import("@/components/dashboard/dashboard-chart")
);
const ActivityLogsWidget = lazy(
  () => import("@/components/activity-logs/ActivityLogsWidget")
);

// Prefetch critical data
export function prefetchDashboardData(workspaceId: string) {
  if (!workspaceId) return;

  // Prefetch API calls that will be needed
  fetch(
    `/api/workspace/workspace?action=getRevenueByWorkspace&workspaceId=${workspaceId}`
  );
  fetch(
    `/api/workspace/workspace?action=getTotalLeadsCount&workspaceId=${workspaceId}`
  );
  fetch(
    `/api/workspace/workspace?action=getQualifiedLeadsCount&workspaceId=${workspaceId}`
  );
  fetch(
    `/api/workspace/workspace?action=getArrivedLeadsCount&workspaceId=${workspaceId}`
  );
}

const DashboardClient = React.memo(() => {
  const dispatch = useDispatch();
  const isCollapsed = useSelector(
    (state: RootState) => state.sidebar.isCollapsed
  );

  // Get the active workspace ID from Redux
  const reduxActiveWorkspaceId = useSelector(
    (state: RootState) => state.sidebar.activeWorkspaceId
  );

  // Track workspace changes
  const workspaceChangeCounter = useSelector(
    (state: RootState) => state.sidebar.workspaceChangeCounter
  );

  // Keep track of previous workspace change counter
  const prevWorkspaceChangeCounterRef = useRef(workspaceChangeCounter);

  // Use SWR-like pattern with stale-while-revalidate
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Step 1: Get active workspace with optimized settings
  const {
    data: activeWorkspace,
    isLoading: isWorkspaceLoading,
    refetch: refetchActiveWorkspace,
  } = useGetActiveWorkspaceQuery(undefined, {
    pollingInterval: 0, // Disable polling completely
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchOnMountOrArgChange: false,
  });

  const workspaceId = activeWorkspace?.data?.id;
  const workspaceCurrency = activeWorkspace?.data?.currency || 'INR';
  const workspaceTimezone = activeWorkspace?.data?.timezone || 'UTC';
  
  // Get currency symbol - memoized for performance
  const getCurrencySymbol = useCallback((currency: string) => {
    const symbols: Record<string, string> = {
      USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥',
      CNY: '¥', AUD: 'A$', CAD: 'C$', CHF: 'Fr', HKD: 'HK$',
      SGD: 'S$', SEK: 'kr', NOK: 'kr', NZD: 'NZ$', MXN: '$',
      ZAR: 'R', BRL: 'R$', RUB: '₽', KRW: '₩', AED: 'د.إ',
      SAR: '﷼', THB: '฿', IDR: 'Rp', MYR: 'RM', PHP: '₱'
    };
    return symbols[currency] || currency;
  }, []);
  
  const currencySymbol = getCurrencySymbol(workspaceCurrency);

  // Memoized click handler
  const handleStatClick = useCallback(() => {
    logger.debug("clicked");
  }, []);

  useEffect(() => {
    if (workspaceId && workspaceId !== reduxActiveWorkspaceId) {
      dispatch(setActiveWorkspaceId(workspaceId));
    }
  }, [workspaceId, reduxActiveWorkspaceId, dispatch]);

  useEffect(() => {
    if (workspaceChangeCounter > prevWorkspaceChangeCounterRef.current) {
      prevWorkspaceChangeCounterRef.current = workspaceChangeCounter;

      logger.debug("Workspace changed in Redux, refetching data...");

      // Force refetch all data
      refetchActiveWorkspace();
    }
  }, [workspaceChangeCounter, refetchActiveWorkspace]);

  // Prefetch data when workspace ID is available
  useEffect(() => {
    if (workspaceId) {
      prefetchDashboardData(workspaceId);
    }
  }, [workspaceId]);

  // Step 2: Fetch all other data with aggressive caching
  const {
    data: workspaceRevenue,
    isLoading: isRevenueLoading,
    refetch: refetchRevenue,
  } = useGetRevenueByWorkspaceQuery(workspaceId, {
    skip: !workspaceId,
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
    pollingInterval: 0,
  });

  const {
    data: ROC,
    isLoading: isRocLoading,
    refetch: refetchROC,
  } = useGetROCByWorkspaceQuery(workspaceId, {
    skip: !workspaceId,
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
    pollingInterval: 0,
  });

  const {
    data: qualifiedCount,
    isLoading: isQualifiedCountLoading,
    refetch: refetchQualifiedCount,
  } = useGetQualifiedCountQuery(workspaceId, {
    skip: !workspaceId,
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
    pollingInterval: 0,
  });

  const {
    data: workspaceCount,
    isLoading: isCountLoading,
    refetch: refetchCount,
  } = useGetCountByWorkspaceQuery(workspaceId, {
    skip: !workspaceId,
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
    pollingInterval: 0,
  });

  const {
    data: webhooks,
    isLoading: isWebhooksLoading,
    refetch: refetchWebhooks,
  } = useGetWebhooksBySourceIdQuery(
    {
      workspaceId: workspaceId,
      id: ROC?.top_source_id,
    },
    {
      skip: !workspaceId || !ROC?.top_source_id,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
      pollingInterval: 0,
    }
  );

  // Refetch all data when workspace ID changes
  useEffect(() => {
    if (workspaceId) {
      refetchRevenue();
      refetchROC();
      refetchQualifiedCount();
      refetchCount();
      if (ROC?.top_source_id) {
        refetchWebhooks();
      }
    }
  }, [
    workspaceId,
    refetchRevenue,
    refetchROC,
    refetchQualifiedCount,
    refetchCount,
    refetchWebhooks,
    ROC?.top_source_id,
  ]);

  // Track when initial data is loaded
  useEffect(() => {
    if (!isWorkspaceLoading && workspaceId) {
      setIsInitialLoad(false);
    }
  }, [isWorkspaceLoading, workspaceId]);

  const { arrivedLeadsCount } = workspaceCount || { arrivedLeadsCount: 0 };
  const updatedRevenue = workspaceRevenue?.totalRevenue?.toFixed(2) || "0";
  const { monthly_stats } = ROC || { monthly_stats: [] };

  // Performance: Remove excessive logging in production
  useEffect(() => {
    logger.debug("Dashboard Data:", {
      workspaceId,
      reduxActiveWorkspaceId,
      workspaceChangeCounter,
      revenue: workspaceRevenue,
      ROC,
      qualifiedCount,
      workspaceCount,
      webhooks,
    });
  }, [
    workspaceId,
    reduxActiveWorkspaceId,
    workspaceChangeCounter,
    workspaceRevenue,
    ROC,
    qualifiedCount,
    workspaceCount,
    webhooks,
  ]);

  const dashboardStats = useMemo(() => [
    {
      title: "Revenue",
      value: formatCurrency(updatedRevenue, currencySymbol),
      change: formatChange(workspaceRevenue?.change || "0"),
      isLoading: isRevenueLoading && !isInitialLoad,
    },
    {
      icon: <UserPlus className="text-orange-500" />,
      title: "Qualified Leads",
      value: formatAmount(qualifiedCount?.qualifiedLeadsCount || "0"),
      isLoading: isQualifiedCountLoading && !isInitialLoad,
    },
    {
      icon: <Users className="text-blue-500" />,
      title: "New Leads",
      value: formatAmount(arrivedLeadsCount || 0),
      change: formatChange("8.3"),
      isLoading: isCountLoading && !isInitialLoad,
    },
    {
      icon: <TrendingUp className="text-purple-500" />,
      title: "Conversion Rate",
      value: formatPercentage(ROC?.conversion_rate || 0),
      change: formatChange("3.2"),
      isLoading: isRocLoading && !isInitialLoad,
    },
    {
      icon: <Award className="text-yellow-500" />,
      title: "Top Performing Sources",
      value: webhooks?.name || "None",
      change: "5 Deals",
      isLoading: isWebhooksLoading && !isInitialLoad,
    },
  ], [
    updatedRevenue,
    currencySymbol,
    workspaceRevenue?.change,
    isRevenueLoading,
    isInitialLoad,
    qualifiedCount?.qualifiedLeadsCount,
    isQualifiedCountLoading,
    arrivedLeadsCount,
    isCountLoading,
    ROC?.conversion_rate,
    isRocLoading,
    webhooks?.name,
    isWebhooksLoading
  ]);

  const salesData = useMemo(() => 
    monthly_stats?.map((stat: { month: string; convertedLeads: number }) => ({
      month: stat.month,
      sales: stat.convertedLeads,
    })) || [], [monthly_stats]
  );

  return (
    <div
      className={`flex flex-col gap-4 md:gap-6 transition-all duration-500 ease-in-out px-2 py-6 w-auto
      ${isCollapsed ? "md:ml-[80px]" : "md:ml-[250px]"}
      min-h-screen `}
    >
      {/* Dashboard Header */}
      <div className="mb-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Track your sales performance and lead activity
          {workspaceCurrency && workspaceCurrency !== 'INR' && (
            <span className="ml-2 text-xs">
              • Currency: {workspaceCurrency} ({currencySymbol})
            </span>
          )}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6">
        {dashboardStats.map((stat, index) => (
          <Card
            key={index}
            className={`hover:shadow-md transition-shadow ${
              index === dashboardStats.length - 1
                ? "col-span-full sm:col-auto"
                : ""
            }`}
          >
            <CardContent className="p-4 sm:p-6 flex items-center justify-between space-x-4 sm:space-x-6">
              <div className="shrink-0">{stat.icon}</div>
              <div className="min-w-0 md:flex-grow">
                <p className="text-xs sm:text-sm text-muted-foreground truncate mb-1">
                  {stat.title}
                </p>
                {stat.isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <>
                                         <p
                       className="text-lg sm:text-xl font-semibold truncate cursor-pointer"
                       onClick={handleStatClick}
                     >
                      {stat.value}
                    </p>
                    {stat.change && (
                      <p className={`text-xs sm:text-sm ${getChangeColorClass(stat.change)}`}>
                        {stat.change}
                      </p>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid - Chart and Activity Logs Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Sales Chart - Takes 2/3 of the space on large screens */}
        <Card className="lg:col-span-2">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">
            Monthly Sales Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Suspense
            fallback={
              <div className="w-full h-[300px] sm:h-[350px] flex items-center justify-center">
                <Skeleton className="h-[250px] w-full rounded" />
              </div>
            }
          >
            <DashboardChart
              data={salesData}
              isLoading={isRocLoading && !isInitialLoad}
            />
          </Suspense>
        </CardContent>
      </Card>

      {/* Activity Logs Widget - Takes 1/3 of the space on large screens */}
      {workspaceId && (
        <Suspense
          fallback={
            <Card className="w-full">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-48" />
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          }
        >
          <ActivityLogsWidget
            workspaceId={workspaceId.toString()}
            limit={5}
            className="w-full h-fit"
          />
        </Suspense>
      )}
         </div>
     </div>
   );
 });

export default DashboardClient;
