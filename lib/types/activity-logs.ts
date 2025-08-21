// Activity Log Types for Member Activity Tracking
export interface MemberActivityLog {
  id: string;
  workspace_id: string; // bigint stored as string in JavaScript
  user_id: string;
  member_email: string;
  member_name?: string;
  activity_type: ActivityType;
  activity_description: string;
  metadata?: ActivityMetadata;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

// Enum for different types of activities that can be tracked
export enum ActivityType {
  // Authentication activities
  LOGIN = 'login',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  
  // Workspace activities
  WORKSPACE_JOIN = 'workspace_join',
  WORKSPACE_LEAVE = 'workspace_leave',
  WORKSPACE_INVITE_SENT = 'workspace_invite_sent',
  WORKSPACE_INVITE_ACCEPTED = 'workspace_invite_accepted',
  WORKSPACE_INVITE_DECLINED = 'workspace_invite_declined',
  
  // Lead management activities
  LEAD_CREATED = 'lead_created',
  LEAD_UPDATED = 'lead_updated',
  LEAD_DELETED = 'lead_deleted',
  LEAD_STATUS_CHANGED = 'lead_status_changed',
  LEAD_ASSIGNED = 'lead_assigned',
  LEAD_UNASSIGNED = 'lead_unassigned',
  
  // Status management activities
  STATUS_CREATED = 'status_created',
  STATUS_UPDATED = 'status_updated',
  STATUS_DELETED = 'status_deleted',
  
  // Tag management activities
  TAG_CREATED = 'tag_created',
  TAG_UPDATED = 'tag_updated',
  TAG_DELETED = 'tag_deleted',
  
  // Webhook activities
  WEBHOOK_CREATED = 'webhook_created',
  WEBHOOK_UPDATED = 'webhook_updated',
  WEBHOOK_DELETED = 'webhook_deleted',
  
  // Member management activities
  MEMBER_ADDED = 'member_added',
  MEMBER_REMOVED = 'member_removed',
  MEMBER_ROLE_CHANGED = 'member_role_changed',
  
  // General activities
  PROFILE_UPDATED = 'profile_updated',
  SETTINGS_CHANGED = 'settings_changed',
  DATA_EXPORT = 'data_export',
  DATA_IMPORT = 'data_import',
}

// Metadata interface for storing additional activity-specific information
export interface ActivityMetadata {
  // For lead activities
  lead_id?: string;
  lead_name?: string;
  lead_email?: string;
  old_status?: string;
  new_status?: string;
  assigned_to?: string;
  
  // For member activities
  target_member_id?: string;
  target_member_email?: string;
  old_role?: string;
  new_role?: string;
  
  // For status/tag activities
  status_id?: string;
  status_name?: string;
  tag_id?: string;
  tag_name?: string;
  
  // For webhook activities
  webhook_id?: string;
  webhook_name?: string;
  webhook_url?: string;
  
  // For workspace activities
  workspace_name?: string;
  invite_id?: string;
  
  // General metadata
  resource_id?: string;
  resource_type?: string;
  changes?: Record<string, any>;
  additional_info?: Record<string, any>;
}

// Request/Response types for API
export interface CreateActivityLogRequest {
  workspace_id: string;
  user_id: string;
  member_email: string;
  member_name?: string;
  activity_type: ActivityType;
  activity_description: string;
  metadata?: ActivityMetadata;
  ip_address?: string;
  user_agent?: string;
}

export interface GetActivityLogsRequest {
  workspace_id: string;
  user_id?: string;
  activity_type?: ActivityType;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
  search?: string;
}

export interface GetActivityLogsResponse {
  data: MemberActivityLog[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// Filter options for the dashboard
export interface ActivityLogFilters {
  activity_types?: ActivityType[];
  date_range?: {
    start: string;
    end: string;
  };
  members?: string[];
  search_term?: string;
}

// Dashboard summary statistics
export interface ActivityLogStats {
  total_activities: number;
  activities_today: number;
  activities_this_week: number;
  activities_this_month: number;
  most_active_members: Array<{
    member_email: string;
    member_name?: string;
    activity_count: number;
  }>;
  activity_breakdown: Array<{
    activity_type: ActivityType;
    count: number;
  }>;
}

// Database table schema for reference (Supabase)
export interface MemberActivityLogTable {
  id: string; // UUID primary key
  workspace_id: string; // BIGINT foreign key to workspaces table (stored as string in JS)
  user_id: string; // UUID foreign key to auth.users (Supabase auth)
  member_email: string; // Email of the member performing the activity
  member_name: string | null; // Name of the member (optional)
  activity_type: string; // Activity type enum as string
  activity_description: string; // Human-readable description
  metadata: any | null; // JSONB field for additional data
  ip_address: string | null; // IP address of the user
  user_agent: string | null; // User agent string
  created_at: string; // Timestamp with timezone
  updated_at: string; // Timestamp with timezone
}
