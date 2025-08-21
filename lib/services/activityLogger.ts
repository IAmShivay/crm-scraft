import { supabase } from '../supabaseServer';
import { 
  ActivityType, 
  CreateActivityLogRequest, 
  ActivityMetadata,
  MemberActivityLog 
} from '../types/activity-logs';

/**
 * Activity Logger Service
 * Centralized service for logging member activities within workspaces
 */
export class ActivityLogger {
  /**
   * Check if a specific activity was recently logged for the same user
   * @param workspaceId Workspace ID
   * @param userId User ID
   * @param activityType Activity type to check
   * @param cooldownMinutes Cooldown period in minutes (default: 3)
   * @returns Promise<boolean> true if recent activity exists, false otherwise
   */
  static async hasRecentActivity(
    workspaceId: string,
    userId: string,
    activityType: ActivityType,
    cooldownMinutes: number = 60
  ): Promise<boolean> {
    try {
      const cooldownTime = new Date();
      cooldownTime.setMinutes(cooldownTime.getMinutes() - cooldownMinutes);

      const { data, error } = await supabase
        .from('member_activity_logs')
        .select('id, created_at')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .eq('activity_type', activityType)
        .gte('created_at', cooldownTime.toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error(`Error checking recent ${activityType} activity:`, error);
        // If there's an error checking, allow logging to prevent blocking user
        return false;
      }

      const hasRecentActivity = data && data.length > 0;
      if (hasRecentActivity) {
        console.log(`${activityType} activity cooling period active for user ${userId} in workspace ${workspaceId}. Last activity: ${data[0].created_at}`);
      }

      return hasRecentActivity;
    } catch (error) {
      console.error(`Unexpected error checking recent ${activityType} activity:`, error);
      // If there's an error checking, allow logging to prevent blocking user
      return false;
    }
  }

  /**
   * Log a member activity with cooling period for login activities
   * @param params Activity log parameters
   * @returns Promise with the created activity log or error
   */
  static async logActivity(params: CreateActivityLogRequest): Promise<{
    success: boolean;
    data?: MemberActivityLog;
    error?: string;
    message?: string;
  }> {
    try {
      console.log('ActivityLogger.logActivity called with params:', params);

      // Validate required parameters
      if (!params.workspace_id || !params.user_id || !params.member_email || !params.activity_type) {
        const error = 'Missing required parameters: workspace_id, user_id, member_email, and activity_type are required';
        console.error('ActivityLogger validation failed:', error);
        return {
          success: false,
          error
        };
      }

      // Apply cooling period for login activities
      if (params.activity_type === ActivityType.LOGIN) {
        const hasRecentLogin = await this.hasRecentActivity(
          params.workspace_id,
          params.user_id,
          ActivityType.LOGIN
        );

        if (hasRecentLogin) {
          console.log(`Login activity skipped due to cooling period for user ${params.user_id} in workspace ${params.workspace_id}`);
          return {
            success: true,
            message: 'Login activity skipped due to cooling period'
          };
        }
      }

      // Prepare the activity log data
      const activityLogData = {
        workspace_id: params.workspace_id,
        user_id: params.user_id,
        member_email: params.member_email,
        member_name: params.member_name || null,
        activity_type: params.activity_type,
        activity_description: params.activity_description,
        metadata: params.metadata || null,
        ip_address: params.ip_address || null,
        user_agent: params.user_agent || null,
      };

      // Insert the activity log into the database
      console.log('ActivityLogger: Attempting database insert with data:', activityLogData);
      const { data, error } = await supabase
        .from('member_activity_logs')
        .insert(activityLogData)
        .select()
        .single();

      if (error) {
        console.error('ActivityLogger: Database insert error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('ActivityLogger: Database insert successful:', data);

      return {
        success: true,
        data: data as MemberActivityLog
      };
    } catch (error) {
      console.error('Unexpected error in logActivity:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while logging the activity'
      };
    }
  }

  /**
   * Log user login activity with cooling period
   * Only logs if no login activity exists within the last 3 minutes for the same user
   */
  static async logLogin(
    workspaceId: string,
    userId: string,
    memberEmail: string,
    memberName?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    // Check if there's a recent login activity within the cooling period
    const hasRecentLogin = await this.hasRecentActivity(workspaceId, userId, ActivityType.LOGIN);

    if (hasRecentLogin) {
      console.log(`Login activity skipped due to cooling period for user ${userId} in workspace ${workspaceId}`);
      return {
        success: true,
        message: 'Login activity skipped due to cooling period'
      };
    }

    return this.logActivity({
      workspace_id: workspaceId,
      user_id: userId,
      member_email: memberEmail,
      member_name: memberName,
      activity_type: ActivityType.LOGIN,
      activity_description: `${memberEmail} logged into the workspace`,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  /**
   * Log user logout activity
   */
  static async logLogout(
    workspaceId: string,
    userId: string,
    memberEmail: string,
    memberName?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    return this.logActivity({
      workspace_id: workspaceId,
      user_id: userId,
      member_email: memberEmail,
      member_name: memberName,
      activity_type: ActivityType.LOGOUT,
      activity_description: `${memberEmail} logged out of the workspace`,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  /**
   * Log lead creation activity
   */
  static async logLeadCreated(
    workspaceId: string,
    userId: string,
    memberEmail: string,
    leadData: { id: string; name: string; email: string },
    memberName?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const metadata: ActivityMetadata = {
      lead_id: leadData.id,
      lead_name: leadData.name,
      lead_email: leadData.email,
      resource_type: 'lead',
      resource_id: leadData.id,
    };

    return this.logActivity({
      workspace_id: workspaceId,
      user_id: userId,
      member_email: memberEmail,
      member_name: memberName,
      activity_type: ActivityType.LEAD_CREATED,
      activity_description: `${memberEmail} created a new lead: ${leadData.name} (${leadData.email})`,
      metadata,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  /**
   * Log lead status change activity
   */
  static async logLeadStatusChanged(
    workspaceId: string,
    userId: string,
    memberEmail: string,
    leadData: { id: string; name: string; email: string },
    oldStatus: string,
    newStatus: string,
    memberName?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const metadata: ActivityMetadata = {
      lead_id: leadData.id,
      lead_name: leadData.name,
      lead_email: leadData.email,
      old_status: oldStatus,
      new_status: newStatus,
      resource_type: 'lead',
      resource_id: leadData.id,
    };

    return this.logActivity({
      workspace_id: workspaceId,
      user_id: userId,
      member_email: memberEmail,
      member_name: memberName,
      activity_type: ActivityType.LEAD_STATUS_CHANGED,
      activity_description: `${memberEmail} changed lead status for ${leadData.name} from "${oldStatus}" to "${newStatus}"`,
      metadata,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  /**
   * Log member addition activity
   */
  static async logMemberAdded(
    workspaceId: string,
    userId: string,
    memberEmail: string,
    targetMemberEmail: string,
    role: string,
    memberName?: string,
    targetMemberName?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const metadata: ActivityMetadata = {
      target_member_email: targetMemberEmail,
      new_role: role,
      resource_type: 'member',
    };

    return this.logActivity({
      workspace_id: workspaceId,
      user_id: userId,
      member_email: memberEmail,
      member_name: memberName,
      activity_type: ActivityType.MEMBER_ADDED,
      activity_description: `${memberEmail} added ${targetMemberEmail} to the workspace with role: ${role}`,
      metadata,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  /**
   * Log member role change activity
   */
  static async logMemberRoleChanged(
    workspaceId: string,
    userId: string,
    memberEmail: string,
    targetMemberEmail: string,
    oldRole: string,
    newRole: string,
    memberName?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const metadata: ActivityMetadata = {
      target_member_email: targetMemberEmail,
      old_role: oldRole,
      new_role: newRole,
      resource_type: 'member',
    };

    return this.logActivity({
      workspace_id: workspaceId,
      user_id: userId,
      member_email: memberEmail,
      member_name: memberName,
      activity_type: ActivityType.MEMBER_ROLE_CHANGED,
      activity_description: `${memberEmail} changed ${targetMemberEmail}'s role from "${oldRole}" to "${newRole}"`,
      metadata,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  /**
   * Log webhook creation activity
   */
  static async logWebhookCreated(
    workspaceId: string,
    userId: string,
    memberEmail: string,
    webhookData: { id: string; name: string; url: string },
    memberName?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const metadata: ActivityMetadata = {
      webhook_id: webhookData.id,
      webhook_name: webhookData.name,
      webhook_url: webhookData.url,
      resource_type: 'webhook',
      resource_id: webhookData.id,
    };

    return this.logActivity({
      workspace_id: workspaceId,
      user_id: userId,
      member_email: memberEmail,
      member_name: memberName,
      activity_type: ActivityType.WEBHOOK_CREATED,
      activity_description: `${memberEmail} created a new webhook: ${webhookData.name}`,
      metadata,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  /**
   * Log status creation activity
   */
  static async logStatusCreated(
    workspaceId: string,
    userId: string,
    memberEmail: string,
    statusData: { id: string; name: string; color: string },
    memberName?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const metadata: ActivityMetadata = {
      status_id: statusData.id,
      status_name: statusData.name,
      resource_type: 'status',
      resource_id: statusData.id,
      additional_info: { color: statusData.color },
    };

    return this.logActivity({
      workspace_id: workspaceId,
      user_id: userId,
      member_email: memberEmail,
      member_name: memberName,
      activity_type: ActivityType.STATUS_CREATED,
      activity_description: `${memberEmail} created a new status: ${statusData.name}`,
      metadata,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  /**
   * Log workspace invite sent activity
   */
  static async logWorkspaceInviteSent(
    workspaceId: string,
    userId: string,
    memberEmail: string,
    inviteeEmail: string,
    role: string,
    memberName?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const metadata: ActivityMetadata = {
      target_member_email: inviteeEmail,
      new_role: role,
      resource_type: 'invite',
    };

    return this.logActivity({
      workspace_id: workspaceId,
      user_id: userId,
      member_email: memberEmail,
      member_name: memberName,
      activity_type: ActivityType.WORKSPACE_INVITE_SENT,
      activity_description: `${memberEmail} sent a workspace invitation to ${inviteeEmail} with role: ${role}`,
      metadata,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  /**
   * Extract IP address from request
   */
  static getClientIP(req: any): string | undefined {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0] : req.connection?.remoteAddress;
    return ip;
  }

  /**
   * Extract user agent from request
   */
  static getUserAgent(req: any): string | undefined {
    return req.headers['user-agent'];
  }

  /**
   * Helper function to log activity with request context
   */
  static async logActivityFromRequest(
    req: any,
    params: Omit<CreateActivityLogRequest, 'ip_address' | 'user_agent'>
  ) {
    return this.logActivity({
      ...params,
      ip_address: this.getClientIP(req),
      user_agent: this.getUserAgent(req),
    });
  }
}

/**
 * Utility functions for activity logging
 */
export class ActivityLogUtils {
  /**
   * Generate a human-readable description for generic activities
   */
  static generateDescription(
    activityType: ActivityType,
    memberEmail: string,
    resourceName?: string,
    additionalInfo?: string
  ): string {
    const baseDescriptions: Record<ActivityType, string> = {
      [ActivityType.LOGIN]: `${memberEmail} logged into the workspace`,
      [ActivityType.LOGOUT]: `${memberEmail} logged out of the workspace`,
      [ActivityType.PASSWORD_CHANGE]: `${memberEmail} changed their password`,
      [ActivityType.WORKSPACE_JOIN]: `${memberEmail} joined the workspace`,
      [ActivityType.WORKSPACE_LEAVE]: `${memberEmail} left the workspace`,
      [ActivityType.WORKSPACE_INVITE_SENT]: `${memberEmail} sent a workspace invitation`,
      [ActivityType.WORKSPACE_INVITE_ACCEPTED]: `${memberEmail} accepted a workspace invitation`,
      [ActivityType.WORKSPACE_INVITE_DECLINED]: `${memberEmail} declined a workspace invitation`,
      [ActivityType.LEAD_CREATED]: `${memberEmail} created a new lead${resourceName ? `: ${resourceName}` : ''}`,
      [ActivityType.LEAD_UPDATED]: `${memberEmail} updated a lead${resourceName ? `: ${resourceName}` : ''}`,
      [ActivityType.LEAD_DELETED]: `${memberEmail} deleted a lead${resourceName ? `: ${resourceName}` : ''}`,
      [ActivityType.LEAD_STATUS_CHANGED]: `${memberEmail} changed lead status${resourceName ? ` for ${resourceName}` : ''}`,
      [ActivityType.LEAD_ASSIGNED]: `${memberEmail} assigned a lead${resourceName ? `: ${resourceName}` : ''}`,
      [ActivityType.LEAD_UNASSIGNED]: `${memberEmail} unassigned a lead${resourceName ? `: ${resourceName}` : ''}`,
      [ActivityType.STATUS_CREATED]: `${memberEmail} created a new status${resourceName ? `: ${resourceName}` : ''}`,
      [ActivityType.STATUS_UPDATED]: `${memberEmail} updated a status${resourceName ? `: ${resourceName}` : ''}`,
      [ActivityType.STATUS_DELETED]: `${memberEmail} deleted a status${resourceName ? `: ${resourceName}` : ''}`,
      [ActivityType.TAG_CREATED]: `${memberEmail} created a new tag${resourceName ? `: ${resourceName}` : ''}`,
      [ActivityType.TAG_UPDATED]: `${memberEmail} updated a tag${resourceName ? `: ${resourceName}` : ''}`,
      [ActivityType.TAG_DELETED]: `${memberEmail} deleted a tag${resourceName ? `: ${resourceName}` : ''}`,
      [ActivityType.WEBHOOK_CREATED]: `${memberEmail} created a new webhook${resourceName ? `: ${resourceName}` : ''}`,
      [ActivityType.WEBHOOK_UPDATED]: `${memberEmail} updated a webhook${resourceName ? `: ${resourceName}` : ''}`,
      [ActivityType.WEBHOOK_DELETED]: `${memberEmail} deleted a webhook${resourceName ? `: ${resourceName}` : ''}`,
      [ActivityType.MEMBER_ADDED]: `${memberEmail} added a new member to the workspace`,
      [ActivityType.MEMBER_REMOVED]: `${memberEmail} removed a member from the workspace`,
      [ActivityType.MEMBER_ROLE_CHANGED]: `${memberEmail} changed a member's role`,
      [ActivityType.PROFILE_UPDATED]: `${memberEmail} updated their profile`,
      [ActivityType.SETTINGS_CHANGED]: `${memberEmail} changed workspace settings`,
      [ActivityType.DATA_EXPORT]: `${memberEmail} exported workspace data`,
      [ActivityType.DATA_IMPORT]: `${memberEmail} imported data into the workspace`,
    };

    let description = baseDescriptions[activityType] || `${memberEmail} performed an activity`;

    if (additionalInfo) {
      description += ` - ${additionalInfo}`;
    }

    return description;
  }

  /**
   * Validate activity type
   */
  static isValidActivityType(activityType: string): activityType is ActivityType {
    return Object.values(ActivityType).includes(activityType as ActivityType);
  }

  /**
   * Get activity type display name
   */
  static getActivityTypeDisplayName(activityType: ActivityType): string {
    const displayNames: Record<ActivityType, string> = {
      [ActivityType.LOGIN]: 'Login',
      [ActivityType.LOGOUT]: 'Logout',
      [ActivityType.PASSWORD_CHANGE]: 'Password Change',
      [ActivityType.WORKSPACE_JOIN]: 'Workspace Join',
      [ActivityType.WORKSPACE_LEAVE]: 'Workspace Leave',
      [ActivityType.WORKSPACE_INVITE_SENT]: 'Invite Sent',
      [ActivityType.WORKSPACE_INVITE_ACCEPTED]: 'Invite Accepted',
      [ActivityType.WORKSPACE_INVITE_DECLINED]: 'Invite Declined',
      [ActivityType.LEAD_CREATED]: 'Lead Created',
      [ActivityType.LEAD_UPDATED]: 'Lead Updated',
      [ActivityType.LEAD_DELETED]: 'Lead Deleted',
      [ActivityType.LEAD_STATUS_CHANGED]: 'Lead Status Changed',
      [ActivityType.LEAD_ASSIGNED]: 'Lead Assigned',
      [ActivityType.LEAD_UNASSIGNED]: 'Lead Unassigned',
      [ActivityType.STATUS_CREATED]: 'Status Created',
      [ActivityType.STATUS_UPDATED]: 'Status Updated',
      [ActivityType.STATUS_DELETED]: 'Status Deleted',
      [ActivityType.TAG_CREATED]: 'Tag Created',
      [ActivityType.TAG_UPDATED]: 'Tag Updated',
      [ActivityType.TAG_DELETED]: 'Tag Deleted',
      [ActivityType.WEBHOOK_CREATED]: 'Webhook Created',
      [ActivityType.WEBHOOK_UPDATED]: 'Webhook Updated',
      [ActivityType.WEBHOOK_DELETED]: 'Webhook Deleted',
      [ActivityType.MEMBER_ADDED]: 'Member Added',
      [ActivityType.MEMBER_REMOVED]: 'Member Removed',
      [ActivityType.MEMBER_ROLE_CHANGED]: 'Role Changed',
      [ActivityType.PROFILE_UPDATED]: 'Profile Updated',
      [ActivityType.SETTINGS_CHANGED]: 'Settings Changed',
      [ActivityType.DATA_EXPORT]: 'Data Export',
      [ActivityType.DATA_IMPORT]: 'Data Import',
    };

    return displayNames[activityType] || activityType;
  }
}
