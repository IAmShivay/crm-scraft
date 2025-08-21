"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Activity,
  Search,
  Filter,
  Users,
  TrendingUp,
  RefreshCw,
  Eye,
  AlertCircle,
  Mail,
  Calendar as CalendarIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useGetActivityLogsQuery,
  useGetActivityLogStatsQuery,
  useGetActivityTypesQuery
} from "@/lib/store/services/activityLogs";
import {
  ActivityType,
  MemberActivityLog,
  ActivityLogFilters
} from "@/lib/types/activity-logs";

interface ActivityLogsDashboardProps {
  workspaceId: string;
  className?: string;
}

export default function ActivityLogsDashboard({
  workspaceId,
  className
}: ActivityLogsDashboardProps) {
  // State for filters and pagination
  const [filters, setFilters] = useState<ActivityLogFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Combine search terms for API query
  const combinedSearch = [searchTerm, emailSearch].filter(Boolean).join(" ");

  // API queries
  const {
    data: activityLogsData,
    isLoading: isLoadingLogs,
    error: logsError,
    refetch: refetchLogs
  } = useGetActivityLogsQuery({
    workspace_id: workspaceId,
    search: combinedSearch || undefined,
    activity_type: filters.activity_types?.[0],
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
  });

  const {
    data: statsData,
    isLoading: isLoadingStats,
    error: statsError
  } = useGetActivityLogStatsQuery({ workspace_id: workspaceId });

  const {
    data: activityTypesData,
    isLoading: isLoadingTypes
  } = useGetActivityTypesQuery();

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm, emailSearch]);

  const handleFilterChange = (key: keyof ActivityLogFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
    setEmailSearch("");
    setCurrentPage(1);
  };

  if (logsError || statsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load activity logs. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("space-y-6 pb-6", className)}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                statsData?.total_activities || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                statsData?.activities_today || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                statsData?.activities_this_week || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                statsData?.activities_this_month || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Search Row */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* General Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search activities or descriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Email Search */}
              <div className="flex-1">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by member email..."
                    value={emailSearch}
                    onChange={(e) => setEmailSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              {/* Activity Type Filter */}
              <Select
                value={filters.activity_types?.[0] || "all"}
                onValueChange={(value) =>
                  handleFilterChange("activity_types", value === "all" ? undefined : [value as ActivityType])
                }
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {activityTypesData?.data?.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Action Buttons */}
              <div className="flex gap-2 w-full md:w-auto">
                <Button variant="outline" onClick={clearFilters} className="flex-1 md:flex-none">
                  Clear
                </Button>
                <Button variant="outline" onClick={() => refetchLogs()} className="flex-1 md:flex-none">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Activity Logs
                {activityLogsData && (
                  <Badge variant="secondary" className="ml-2">
                    {activityLogsData.total} total
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Recent member activities in your workspace
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchLogs()}>
              <Eye className="h-4 w-4 mr-2" />
              View All Activity
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingLogs ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : activityLogsData?.data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activity logs found</p>
              <p className="text-sm">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <ActivityLogsList
              logs={activityLogsData?.data || []}
              onPageChange={setCurrentPage}
              currentPage={currentPage}
              totalPages={Math.ceil((activityLogsData?.total || 0) / pageSize)}
              hasMore={activityLogsData?.has_more || false}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Activity Logs List Component
interface ActivityLogsListProps {
  logs: MemberActivityLog[];
  onPageChange: (page: number) => void;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

function ActivityLogsList({
  logs,
  onPageChange,
  currentPage,
  totalPages,
  hasMore
}: ActivityLogsListProps) {
  const getActivityIcon = (activityType: ActivityType) => {
    const iconMap: Record<string, React.ReactNode> = {
      login: <Users className="h-4 w-4" />,
      logout: <Users className="h-4 w-4" />,
      lead_created: <TrendingUp className="h-4 w-4" />,
      lead_updated: <TrendingUp className="h-4 w-4" />,
      member_added: <Users className="h-4 w-4" />,
      webhook_created: <Activity className="h-4 w-4" />,
      default: <Activity className="h-4 w-4" />
    };

    return iconMap[activityType] || iconMap.default;
  };

  const getActivityColor = (activityType: ActivityType) => {
    const colorMap: Record<string, string> = {
      login: "bg-green-100 text-green-800",
      logout: "bg-gray-100 text-gray-800",
      lead_created: "bg-blue-100 text-blue-800",
      lead_updated: "bg-yellow-100 text-yellow-800",
      lead_deleted: "bg-red-100 text-red-800",
      member_added: "bg-purple-100 text-purple-800",
      member_removed: "bg-red-100 text-red-800",
      webhook_created: "bg-indigo-100 text-indigo-800",
      default: "bg-gray-100 text-gray-800"
    };

    return colorMap[activityType] || colorMap.default;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Activity Items */}
      <div className="space-y-3">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-start space-x-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            {/* Activity Icon */}
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full",
              getActivityColor(log.activity_type)
            )}>
              {getActivityIcon(log.activity_type)}
            </div>

            {/* Activity Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {log.activity_description}
                </p>
                <time className="text-xs text-muted-foreground">
                  {formatTimeAgo(log.created_at)}
                </time>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  by {log.member_name || log.member_email}
                </span>
                <Badge variant="outline" className="text-xs">
                  {log.activity_type.replace(/_/g, ' ')}
                </Badge>
              </div>

              {/* Metadata */}
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <details className="cursor-pointer">
                    <summary className="hover:text-foreground">View details</summary>
                    <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || !hasMore}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
