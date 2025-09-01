"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetLeadsByWorkspaceQuery } from "@/lib/store/services/leadsApi";
import {
  useGetActiveWorkspaceQuery,
  useGetCountByWorkspaceQuery,
  useGetRevenueByWorkspaceQuery,
  useGetROCByWorkspaceQuery,
  useGetWorkspaceDetailsAnalyticsQuery,
} from "@/lib/store/services/workspace";
import { RootState } from "@/lib/store/store";
import { IndianRupee, TrendingUp, Users } from "lucide-react";
import React, { useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { logger } from "@/lib/logger";

// Enhanced TypeScript Interfaces
interface LeadMetrics {
  total: number;
  byStatus: Array<{ status: string; count: number }>;
  bySource: Array<{ source: string; count: number }>;
  monthlyGrowth: number;
}

interface AnalyticsData {
  leads: LeadMetrics;
  revenue: {
    total: number;
    monthlyGrowth: number;
  };
  chartData: Array<{
    month: string;
    leads: number;
    revenue: number;
    processedLeads: number;
    conversionRate: number;
  }>;
}

const CHART_COLORS = ["#0088FE", "#f1c232", "#38761d", "#FF8042"];

const AnalyticsClient = React.memo(() => {
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

  const {
    data: activeWorkspace,
    isLoading: isLoadingWorkspace,
    refetch: refetchWorkspace,
  } = useGetActiveWorkspaceQuery<any>(undefined, {
    pollingInterval: 0,
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchOnMountOrArgChange: false,
  });

  const {
    data: analyticsDetails,
    isLoading: isLoadingAnalytics,
    refetch: refetchAnalytics,
  } = useGetRevenueByWorkspaceQuery(activeWorkspace?.data?.id, {
    skip: !activeWorkspace?.data?.id,
    pollingInterval: 0,
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchOnMountOrArgChange: false,
  });

  const {
    data: totalLeads,
    isLoading: loadingTotalLeads,
    refetch: refetchTotalLeads,
  } = useGetLeadsByWorkspaceQuery(
    { workspaceId: activeWorkspace?.data?.id },
    { 
      skip: !activeWorkspace?.data?.id,
      pollingInterval: 0,
      refetchOnFocus: false,
      refetchOnReconnect: false,
      refetchOnMountOrArgChange: false,
    }
  );

  const {
    data: analyticsDatas,
    isLoading: isLoadingAnalyticsData,
    refetch: refetchAnalyticsData,
  } = useGetWorkspaceDetailsAnalyticsQuery(activeWorkspace?.data?.id, {
    skip: !activeWorkspace?.data?.id,
    pollingInterval: 0,
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchOnMountOrArgChange: false,
  });

  const {
    data: ROC,
    isLoading: isRocLoading,
    refetch: refetchROC,
  } = useGetROCByWorkspaceQuery(activeWorkspace?.data?.id, {
    skip: !activeWorkspace?.data?.id,
    pollingInterval: 0,
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchOnMountOrArgChange: false,
  });

  const {
    data: workspaceCount,
    isLoading: isCountLoading,
    refetch: refetchWorkspaceCount,
  } = useGetCountByWorkspaceQuery(activeWorkspace?.data?.id, {
    skip: !activeWorkspace?.data?.id,
    pollingInterval: 0,
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchOnMountOrArgChange: false,
  });

  // Listen for workspace changes in Redux and refetch data
  useEffect(() => {
    if (workspaceChangeCounter > prevWorkspaceChangeCounterRef.current) {
      prevWorkspaceChangeCounterRef.current = workspaceChangeCounter;

      logger.debug("Workspace changed in Redux, refetching analytics data...");

      // Force refetch all data
      refetchWorkspace();
      if (activeWorkspace?.data?.id) {
        refetchAnalytics();
        refetchTotalLeads();
        refetchAnalyticsData();
        refetchROC();
        refetchWorkspaceCount();
      }
    }
  }, [
    workspaceChangeCounter,
    refetchWorkspace,
    refetchAnalytics,
    refetchTotalLeads,
    refetchAnalyticsData,
    refetchROC,
    refetchWorkspaceCount,
    activeWorkspace?.data?.id,
  ]);

  // Performance: Remove excessive logging in production
  useEffect(() => {
    logger.debug("Analytics Data:", {
      workspaceId: activeWorkspace?.data?.id,
      reduxActiveWorkspaceId,
      workspaceChangeCounter,
      analyticsDetails,
      ROC,
      workspaceCount,
    });
  }, [
    activeWorkspace?.data?.id,
    reduxActiveWorkspaceId,
    workspaceChangeCounter,
    analyticsDetails,
    ROC,
    workspaceCount,
  ]);

  const arrivedLeadsCount = workspaceCount?.arrivedLeadsCount ?? 0;

  const analyticsData = useMemo(
    () => ({
      leads: {
        total: ROC?.total_leads ?? 0,
        monthlyGrowth: 12.5,
        byStatus: [
          { status: "Converted", count: ROC?.converted_leads ?? 0 },
          { status: "Arrived", count: arrivedLeadsCount },
          {
            status: "Processed",
            count: (ROC?.total_leads ?? 0) - arrivedLeadsCount,
          },
          { status: "Total Leads", count: ROC?.total_leads ?? 0 },
        ],
        bySource: analyticsDatas?.data?.map((item: any) => ({
          source: item.name,
          count: item.count,
        })) || [
          { source: "Website", count: 45 },
          { source: "Referral", count: 30 },
          { source: "Social Media", count: 25 },
          { source: "Other", count: 10 },
        ],
      },
      revenue: {
        total: analyticsDetails?.totalRevenue ?? 0,
        monthlyGrowth: 8.2,
      },
      chartData: ROC?.monthly_stats?.map((stat: any) => ({
        month: stat.month,
        leads: stat.total_leads,
        revenue: stat.revenue,
        processedLeads: stat.processed_leads,
        conversionRate: stat.conversion_rate,
      })) || [
        {
          month: "Jan",
          leads: 100,
          revenue: 5000,
          processedLeads: 80,
          conversionRate: 20,
        },
        {
          month: "Feb",
          leads: 120,
          revenue: 6000,
          processedLeads: 90,
          conversionRate: 25,
        },
        {
          month: "Mar",
          leads: 140,
          revenue: 7000,
          processedLeads: 100,
          conversionRate: 30,
        },
      ],
    }),
    [ROC, arrivedLeadsCount, analyticsDatas, analyticsDetails]
  );


  return (
    <div
      className={`transition-all duration-300 px-4 py-6 
      ${
        isCollapsed
          ? "lg:ml-[80px] md:ml-[80px]"
          : "lg:ml-[250px] md:ml-[250px]"
      } w-auto`}
    >
      <h1 className="text-3xl font-bold mb-6">Sales Analytics</h1>

      {/* Performance Metrics Grid */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {/* Total Leads */}
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Total Leads</p>
              <p className="text-2xl font-bold">{analyticsData.leads.total}</p>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">
                ₹{analyticsData.revenue.total.toLocaleString("en-US")}
              </p>
            </div>
            <IndianRupee className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>

        {/* Growth Trend */}
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Growth Trend</p>
              <p className="text-2xl font-bold">Positive</p>
            </div>
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Advanced Visualizations */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Leads by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Leads Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.leads.byStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {analyticsData.leads.byStatus.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Rate Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="conversionRate"
                  stroke="#82ca9d"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leads by Source */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.leads.bySource}
                  dataKey="count"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {analyticsData.leads.bySource.map(
                    (entry: any, index: any) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    )
                  )}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Graphs */}
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* Leads and Revenue Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Leads vs Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="leads" fill="#8884d8" />
                <Bar dataKey="revenue" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Processed Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Processed Leads Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="processedLeads"
                  stroke="#8884d8"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

export { AnalyticsClient };
