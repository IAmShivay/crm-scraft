import { NextApiRequest, NextApiResponse } from "next";
import { AUTH_MESSAGES } from "@/lib/constant/auth";
import { supabase } from "@/lib/supabaseServer";
import { ActivityLogger, ActivityLogUtils } from "@/lib/services/activityLogger";
import { 
  ActivityType, 
  GetActivityLogsRequest, 
  GetActivityLogsResponse,
  CreateActivityLogRequest,
  ActivityLogStats
} from "@/lib/types/activity-logs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query, headers, body } = req;
  const action = query.action as string;
  
  // Authentication check
  const authHeader = headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
  }

  const token = authHeader.split(" ")[1];

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  if (!user) {
    return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
  }

  switch (method) {
    case "POST":
      return handlePost(req, res, action, user, body);
    case "GET":
      return handleGet(req, res, action, user, query);
    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  action: string,
  user: any,
  body: any
) {
  switch (action) {
    case "createActivityLog": {
      try {
        const {
          workspace_id,
          activity_type,
          activity_description,
          metadata,
          member_email,
          member_name
        }: CreateActivityLogRequest = body;

        // Validate required fields
        if (!workspace_id || !activity_type || !activity_description || !member_email) {
          return res.status(400).json({
            error: "Missing required fields: workspace_id, activity_type, activity_description, and member_email are required"
          });
        }

        // Validate workspace_id is a valid number (bigint)
        if (isNaN(Number(workspace_id))) {
          return res.status(400).json({
            error: "Invalid workspace_id format"
          });
        }

        // Validate activity type
        if (!ActivityLogUtils.isValidActivityType(activity_type)) {
          return res.status(400).json({
            error: "Invalid activity type"
          });
        }

        // Check if user has access to the workspace
        const hasAccess = await checkWorkspaceAccess(workspace_id, user.id);
        if (!hasAccess) {
          return res.status(403).json({ 
            error: "You don't have access to this workspace" 
          });
        }

        // Log the activity
        const result = await ActivityLogger.logActivityFromRequest(req, {
          workspace_id,
          user_id: user.id,
          member_email,
          member_name,
          activity_type,
          activity_description,
          metadata,
        });

        if (!result.success) {
          return res.status(500).json({ error: result.error });
        }

        return res.status(201).json({ 
          message: "Activity logged successfully",
          data: result.data 
        });
      } catch (error) {
        console.error("Error creating activity log:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    }

    default:
      return res.status(400).json({ error: `Unknown action: ${action}` });
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  action: string,
  user: any,
  query: any
) {
  switch (action) {
    case "getActivityLogs": {
      try {
        const {
          workspace_id,
          activity_type,
          start_date,
          end_date,
          limit = 50,
          offset = 0,
          search,
          user_id: filterUserId
        }: GetActivityLogsRequest = query;

        if (!workspace_id) {
          return res.status(400).json({ error: "workspace_id is required" });
        }

        // Check if user has access to the workspace
        const hasAccess = await checkWorkspaceAccess(workspace_id, user.id);
        if (!hasAccess) {
          return res.status(403).json({ 
            error: "You don't have access to this workspace" 
          });
        }

        // Build the query
        let dbQuery = supabase
          .from('member_activity_logs')
          .select('*', { count: 'exact' })
          .eq('workspace_id', workspace_id)
          .order('created_at', { ascending: false });

        // Apply filters
        if (activity_type) {
          dbQuery = dbQuery.eq('activity_type', activity_type);
        }

        if (filterUserId) {
          dbQuery = dbQuery.eq('user_id', filterUserId);
        }

        if (start_date) {
          dbQuery = dbQuery.gte('created_at', start_date);
        }

        if (end_date) {
          dbQuery = dbQuery.lte('created_at', end_date);
        }

        if (search) {
          dbQuery = dbQuery.or(`activity_description.ilike.%${search}%,member_email.ilike.%${search}%,member_name.ilike.%${search}%`);
        }

        // Apply pagination
        const limitNum = Math.min(parseInt(String(limit)) || 50, 100); // Max 100 records
        const offsetNum = parseInt(String(offset)) || 0;
        
        dbQuery = dbQuery.range(offsetNum, offsetNum + limitNum - 1);

        const { data, error, count } = await dbQuery;

        if (error) {
          console.error("Error fetching activity logs:", error);
          return res.status(500).json({ error: error.message });
        }

        const response: GetActivityLogsResponse = {
          data: data || [],
          total: count || 0,
          limit: limitNum,
          offset: offsetNum,
          has_more: (count || 0) > offsetNum + limitNum
        };

        return res.status(200).json(response);
      } catch (error) {
        console.error("Error fetching activity logs:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    }

    case "getActivityLogStats": {
      try {
        const { workspace_id } = query;

        if (!workspace_id) {
          return res.status(400).json({ error: "workspace_id is required" });
        }

        // Check if user has access to the workspace
        const hasAccess = await checkWorkspaceAccess(workspace_id, user.id);
        if (!hasAccess) {
          return res.status(403).json({ 
            error: "You don't have access to this workspace" 
          });
        }

        const stats = await getActivityLogStats(workspace_id);
        return res.status(200).json(stats);
      } catch (error) {
        console.error("Error fetching activity log stats:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    }

    case "getActivityTypes": {
      // Return all available activity types
      const activityTypes = Object.values(ActivityType).map(type => ({
        value: type,
        label: ActivityLogUtils.getActivityTypeDisplayName(type)
      }));

      return res.status(200).json({ data: activityTypes });
    }

    default:
      return res.status(400).json({ error: `Unknown action: ${action}` });
  }
}

/**
 * Check if user has access to the workspace
 */
async function checkWorkspaceAccess(workspaceId: string, userId: string): Promise<boolean> {
  try {
    // Check if user is the workspace owner
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('owner_id')
      .eq('id', workspaceId)
      .single();

    if (workspaceError) {
      console.error("Error checking workspace ownership:", workspaceError);
      return false;
    }

    if (workspace?.owner_id === userId) {
      return true;
    }

    // Check if user is a member of the workspace
    const { data: member, error: memberError } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .eq('status', 'accepted')
      .single();

    if (memberError && memberError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error("Error checking workspace membership:", memberError);
      return false;
    }

    return !!member;
  } catch (error) {
    console.error("Unexpected error checking workspace access:", error);
    return false;
  }
}

/**
 * Get activity log statistics for a workspace
 */
async function getActivityLogStats(workspaceId: string): Promise<ActivityLogStats> {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get total activities
    const { count: totalActivities } = await supabase
      .from('member_activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    // Get activities today
    const { count: activitiesThisDay } = await supabase
      .from('member_activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', today.toISOString());

    // Get activities this week
    const { count: activitiesThisWeek } = await supabase
      .from('member_activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', thisWeek.toISOString());

    // Get activities this month
    const { count: activitiesThisMonth } = await supabase
      .from('member_activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', thisMonth.toISOString());

    // Get most active members (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const { data: memberActivities } = await supabase
      .from('member_activity_logs')
      .select('member_email, member_name')
      .eq('workspace_id', workspaceId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Count activities by member
    const memberCounts = (memberActivities || []).reduce((acc, activity) => {
      const key = activity.member_email;
      if (!acc[key]) {
        acc[key] = {
          member_email: activity.member_email,
          member_name: activity.member_name,
          activity_count: 0
        };
      }
      acc[key].activity_count++;
      return acc;
    }, {} as Record<string, any>);

    const mostActiveMembers = Object.values(memberCounts)
      .sort((a: any, b: any) => b.activity_count - a.activity_count)
      .slice(0, 5);

    // Get activity breakdown by type (last 30 days)
    const { data: activityBreakdown } = await supabase
      .from('member_activity_logs')
      .select('activity_type')
      .eq('workspace_id', workspaceId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    const typeCounts = (activityBreakdown || []).reduce((acc, activity) => {
      const type = activity.activity_type as ActivityType;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<ActivityType, number>);

    const activityBreakdownArray = Object.entries(typeCounts).map(([type, count]) => ({
      activity_type: type as ActivityType,
      count
    }));

    return {
      total_activities: totalActivities || 0,
      activities_today: activitiesThisDay || 0,
      activities_this_week: activitiesThisWeek || 0,
      activities_this_month: activitiesThisMonth || 0,
      most_active_members: mostActiveMembers,
      activity_breakdown: activityBreakdownArray
    };
  } catch (error) {
    console.error("Error getting activity log stats:", error);
    return {
      total_activities: 0,
      activities_today: 0,
      activities_this_week: 0,
      activities_this_month: 0,
      most_active_members: [],
      activity_breakdown: []
    };
  }
}
