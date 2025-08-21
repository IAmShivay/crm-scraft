import { activityLogsApi } from "../base/activityLogs";
import { 
  MemberActivityLog,
  CreateActivityLogRequest,
  GetActivityLogsRequest,
  GetActivityLogsResponse,
  ActivityLogStats,
  ActivityType
} from "../../types/activity-logs";

export const activityLogsApis = activityLogsApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get activity logs with filtering and pagination
    getActivityLogs: builder.query<GetActivityLogsResponse, GetActivityLogsRequest>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        
        // Add required workspace_id
        searchParams.append('workspace_id', params.workspace_id);
        
        // Add optional parameters
        if (params.user_id) searchParams.append('user_id', params.user_id);
        if (params.activity_type) searchParams.append('activity_type', params.activity_type);
        if (params.start_date) searchParams.append('start_date', params.start_date);
        if (params.end_date) searchParams.append('end_date', params.end_date);
        if (params.limit) searchParams.append('limit', params.limit.toString());
        if (params.offset) searchParams.append('offset', params.offset.toString());
        if (params.search) searchParams.append('search', params.search);

        return {
          url: `?action=getActivityLogs&${searchParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: (result, error, params) => [
        { type: "ActivityLog", id: "LIST" },
        { type: "ActivityLog", id: params.workspace_id },
      ],
      keepUnusedDataFor: 300, // 5 minutes
    }),

    // Get activity log statistics
    getActivityLogStats: builder.query<ActivityLogStats, { workspace_id: string }>({
      query: ({ workspace_id }) => ({
        url: `?action=getActivityLogStats&workspace_id=${workspace_id}`,
        method: "GET",
      }),
      providesTags: (result, error, { workspace_id }) => [
        { type: "ActivityLogStats", id: workspace_id },
      ],
      keepUnusedDataFor: 600, // 10 minutes for stats
    }),

    // Get available activity types
    getActivityTypes: builder.query<{ data: Array<{ value: ActivityType; label: string }> }, void>({
      query: () => ({
        url: "?action=getActivityTypes",
        method: "GET",
      }),
      providesTags: ["ActivityTypes"],
      keepUnusedDataFor: 3600, // 1 hour - activity types don't change often
    }),

    // Create a new activity log
    createActivityLog: builder.mutation<{ message: string; data: MemberActivityLog }, CreateActivityLogRequest>({
      query: (body) => ({
        url: "?action=createActivityLog",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { workspace_id }) => [
        { type: "ActivityLog", id: "LIST" },
        { type: "ActivityLog", id: workspace_id },
        { type: "ActivityLogStats", id: workspace_id },
      ],
    }),

    // Get activity logs for a specific member
    getMemberActivityLogs: builder.query<GetActivityLogsResponse, { workspace_id: string; member_email: string; limit?: number; offset?: number }>({
      query: ({ workspace_id, member_email, limit = 50, offset = 0 }) => ({
        url: `?action=getActivityLogs&workspace_id=${workspace_id}&search=${encodeURIComponent(member_email)}&limit=${limit}&offset=${offset}`,
        method: "GET",
      }),
      providesTags: (result, error, { workspace_id, member_email }) => [
        { type: "ActivityLog", id: `member-${member_email}` },
        { type: "ActivityLog", id: workspace_id },
      ],
      keepUnusedDataFor: 300,
    }),

    // Get recent activity logs (last 24 hours)
    getRecentActivityLogs: builder.query<GetActivityLogsResponse, { workspace_id: string; limit?: number }>({
      query: ({ workspace_id, limit = 20 }) => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        return {
          url: `?action=getActivityLogs&workspace_id=${workspace_id}&start_date=${yesterday.toISOString()}&limit=${limit}&offset=0`,
          method: "GET",
        };
      },
      providesTags: (result, error, { workspace_id }) => [
        { type: "ActivityLog", id: `recent-${workspace_id}` },
      ],
      keepUnusedDataFor: 60, // 1 minute for recent activities
    }),

    // Get activity logs by type
    getActivityLogsByType: builder.query<GetActivityLogsResponse, { workspace_id: string; activity_type: ActivityType; limit?: number; offset?: number }>({
      query: ({ workspace_id, activity_type, limit = 50, offset = 0 }) => ({
        url: `?action=getActivityLogs&workspace_id=${workspace_id}&activity_type=${activity_type}&limit=${limit}&offset=${offset}`,
        method: "GET",
      }),
      providesTags: (result, error, { workspace_id, activity_type }) => [
        { type: "ActivityLog", id: `type-${activity_type}` },
        { type: "ActivityLog", id: workspace_id },
      ],
      keepUnusedDataFor: 300,
    }),

    // Get activity logs for date range
    getActivityLogsDateRange: builder.query<GetActivityLogsResponse, { 
      workspace_id: string; 
      start_date: string; 
      end_date: string; 
      limit?: number; 
      offset?: number 
    }>({
      query: ({ workspace_id, start_date, end_date, limit = 50, offset = 0 }) => ({
        url: `?action=getActivityLogs&workspace_id=${workspace_id}&start_date=${start_date}&end_date=${end_date}&limit=${limit}&offset=${offset}`,
        method: "GET",
      }),
      providesTags: (result, error, { workspace_id }) => [
        { type: "ActivityLog", id: `daterange-${workspace_id}` },
      ],
      keepUnusedDataFor: 300,
    }),
  }),
  overrideExisting: false,
});

// Export hooks for the activity logs mutations and queries
export const {
  useGetActivityLogsQuery,
  useGetActivityLogStatsQuery,
  useGetActivityTypesQuery,
  useCreateActivityLogMutation,
  useGetMemberActivityLogsQuery,
  useGetRecentActivityLogsQuery,
  useGetActivityLogsByTypeQuery,
  useGetActivityLogsDateRangeQuery,
  
  // Lazy queries for conditional loading
  useLazyGetActivityLogsQuery,
  useLazyGetMemberActivityLogsQuery,
  useLazyGetActivityLogsByTypeQuery,
  useLazyGetActivityLogsDateRangeQuery,
} = activityLogsApis;

// Utility functions for working with activity logs
export const activityLogsUtils = {
  /**
   * Build query parameters for activity logs
   */
  buildActivityLogsParams: (filters: {
    workspace_id: string;
    activity_types?: ActivityType[];
    date_range?: { start: string; end: string };
    members?: string[];
    search_term?: string;
    limit?: number;
    offset?: number;
  }): GetActivityLogsRequest => {
    const params: GetActivityLogsRequest = {
      workspace_id: filters.workspace_id,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    };

    if (filters.date_range) {
      params.start_date = filters.date_range.start;
      params.end_date = filters.date_range.end;
    }

    if (filters.search_term) {
      params.search = filters.search_term;
    }

    // Note: For multiple activity types and members, we'll need to handle this in the component
    // as the current API doesn't support multiple values for these filters
    if (filters.activity_types && filters.activity_types.length === 1) {
      params.activity_type = filters.activity_types[0];
    }

    return params;
  },

  /**
   * Format activity log for display
   */
  formatActivityLog: (log: MemberActivityLog) => ({
    ...log,
    formatted_date: new Date(log.created_at).toLocaleString(),
    time_ago: getTimeAgo(new Date(log.created_at)),
  }),

  /**
   * Group activity logs by date
   */
  groupActivityLogsByDate: (logs: MemberActivityLog[]) => {
    return logs.reduce((groups, log) => {
      const date = new Date(log.created_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(log);
      return groups;
    }, {} as Record<string, MemberActivityLog[]>);
  },

  /**
   * Filter activity logs by criteria
   */
  filterActivityLogs: (
    logs: MemberActivityLog[],
    filters: {
      activity_types?: ActivityType[];
      members?: string[];
      search_term?: string;
    }
  ) => {
    return logs.filter(log => {
      // Filter by activity types
      if (filters.activity_types && filters.activity_types.length > 0) {
        if (!filters.activity_types.includes(log.activity_type)) {
          return false;
        }
      }

      // Filter by members
      if (filters.members && filters.members.length > 0) {
        if (!filters.members.includes(log.member_email)) {
          return false;
        }
      }

      // Filter by search term
      if (filters.search_term) {
        const searchTerm = filters.search_term.toLowerCase();
        const searchableText = [
          log.activity_description,
          log.member_email,
          log.member_name || '',
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  },
};

/**
 * Helper function to get time ago string
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  }

  return date.toLocaleDateString();
}
