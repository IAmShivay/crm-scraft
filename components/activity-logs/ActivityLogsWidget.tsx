"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Activity,
  Users,
  TrendingUp,
  Eye,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  useGetRecentActivityLogsQuery,
  useGetActivityLogStatsQuery
} from "@/lib/store/services/activityLogs";
import { 
  ActivityType, 
  MemberActivityLog 
} from "@/lib/types/activity-logs";

interface ActivityLogsWidgetProps {
  workspaceId: string;
  className?: string;
  onViewAll?: () => void;
  limit?: number;
}

export default function ActivityLogsWidget({
  workspaceId,
  className,
  onViewAll,
  limit = 10
}: ActivityLogsWidgetProps) {
  const router = useRouter();

  const {
    data: recentLogsData,
    isLoading: isLoadingLogs,
    error: logsError
  } = useGetRecentActivityLogsQuery({
    workspace_id: workspaceId,
    limit
  });

  const {
    data: statsData,
    isLoading: isLoadingStats
  } = useGetActivityLogStatsQuery({ workspace_id: workspaceId });

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      // Navigate to workspace settings activity tab
      router.push(`/workspace/${workspaceId}?tab=activity`);
    }
  };

  const getActivityIcon = (activityType: ActivityType) => {
    const iconMap: Record<string, React.ReactNode> = {
      login: <Users className="h-3 w-3" />,
      logout: <Users className="h-3 w-3" />,
      lead_created: <TrendingUp className="h-3 w-3" />,
      lead_updated: <TrendingUp className="h-3 w-3" />,
      member_added: <Users className="h-3 w-3" />,
      webhook_created: <Activity className="h-3 w-3" />,
      default: <Activity className="h-3 w-3" />
    };
    
    return iconMap[activityType] || iconMap.default;
  };

  const getActivityColor = (activityType: ActivityType) => {
    const colorMap: Record<string, string> = {
      login: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      logout: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      lead_created: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      lead_updated: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
      lead_deleted: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      member_added: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
      member_removed: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      webhook_created: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
      default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
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

  const truncateDescription = (description: string, maxLength: number = 60) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  if (logsError) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load recent activities.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest member activities in your workspace
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleViewAll}>
            <Eye className="h-4 w-4 mr-2" />
            View All
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <Skeleton className="h-6 w-8 mx-auto" />
              ) : (
                statsData?.activities_today || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Today</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <Skeleton className="h-6 w-8 mx-auto" />
              ) : (
                statsData?.activities_this_week || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">This Week</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <Skeleton className="h-6 w-8 mx-auto" />
              ) : (
                statsData?.total_activities || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="space-y-3">
          {isLoadingLogs ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2 w-1/2" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            ))
          ) : recentLogsData?.data.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent activities</p>
            </div>
          ) : (
            recentLogsData?.data.map((log) => (
              <div
                key={log.id}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Activity Icon */}
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full",
                  getActivityColor(log.activity_type)
                )}>
                  {getActivityIcon(log.activity_type)}
                </div>

                {/* Activity Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {truncateDescription(log.activity_description)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground truncate">
                      {log.member_name || log.member_email}
                    </span>
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {log.activity_type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>

                {/* Time */}
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTimeAgo(log.created_at)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* View All Button */}
        {recentLogsData?.data && recentLogsData.data.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" size="sm" className="w-full" onClick={handleViewAll}>
              <Eye className="h-4 w-4 mr-2" />
              View All Activities
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Export a compact version for smaller spaces
export function ActivityLogsCompactWidget({ 
  workspaceId, 
  className 
}: { 
  workspaceId: string; 
  className?: string; 
}) {
  return (
    <ActivityLogsWidget 
      workspaceId={workspaceId}
      className={className}
      limit={5}
    />
  );
}
