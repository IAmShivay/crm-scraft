# Activity Logs Implementation

This document describes the member activity tracking system implemented for the CRM workspace.

## Overview

The activity logging system tracks all member activities within workspaces, providing administrators with comprehensive audit trails and monitoring capabilities. The system is designed to be:

- **Non-intrusive**: Logging doesn't interfere with existing functionality
- **Secure**: Only admins can view activity logs
- **Comprehensive**: Tracks all major user actions
- **Performant**: Uses efficient database queries and caching

## Features

### Tracked Activities

- **Authentication**: Login, logout, password changes
- **Workspace Management**: Member additions, role changes, invitations
- **Lead Management**: Creation, updates, status changes, assignments
- **Resource Management**: Status creation, tag management, webhook setup
- **General Activities**: Profile updates, settings changes, data operations

### Dashboard Features

- **Real-time Activity Feed**: See recent member activities
- **Advanced Filtering**: Filter by activity type, date range, members
- **Search Functionality**: Search across descriptions and member names
- **Statistics Dashboard**: View activity summaries and trends
- **Pagination**: Handle large volumes of activity data
- **Export Capabilities**: Export activity logs for reporting

## Implementation Details

### Database Schema

The `member_activity_logs` table includes:
- `id`: UUID primary key
- `workspace_id`: BIGINT foreign key to workspaces (handled as string in JavaScript)
- `user_id`: UUID foreign key to auth.users
- `member_email`: Email of the acting member
- `activity_type`: Enum of activity types
- `activity_description`: Human-readable description
- `metadata`: JSONB field for additional data
- `ip_address`: Client IP address
- `user_agent`: Client user agent
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Security Features

- **Row Level Security (RLS)**: Users can only see logs for their workspaces
- **Admin-only Access**: Only workspace admins can view activity logs
- **Audit Trail Integrity**: No updates or deletes allowed on activity logs
- **Data Protection**: Sensitive information is properly handled

## Setup Instructions

### 1. Database Migration

Run the database migration to create the activity logs table:

```sql
-- Execute the migration file
\i database/migrations/create_member_activity_logs.sql
```

### 2. Environment Setup

Ensure your Supabase configuration includes the new table in your RLS policies.

### 3. Testing the Implementation

Run the validation script:

```bash
node scripts/test-activity-logs.js
```

## Usage

### For Administrators

1. **Access Activity Logs**:
   - Navigate to Workspace Settings
   - Click on the "Activity Logs" tab (only visible to admins)

2. **Filter Activities**:
   - Use the search bar to find specific activities
   - Filter by activity type using the dropdown
   - Set date ranges using the calendar picker

3. **View Statistics**:
   - See activity counts for today, this week, and this month
   - View most active members
   - Analyze activity breakdown by type

### For Developers

#### Adding New Activity Types

1. Add the new activity type to the `ActivityType` enum in `lib/types/activity-logs.ts`
2. Update the database constraint in the migration file
3. Add a helper method to `ActivityLogger` class if needed
4. Update the display name mapping in `ActivityLogUtils`

#### Logging Activities

Use the `ActivityLogger` service to log activities:

```typescript
import { ActivityLogger } from '@/lib/services/activityLogger';

// Log a custom activity
await ActivityLogger.logActivity({
  workspace_id: 'workspace-uuid',
  user_id: 'user-uuid',
  member_email: 'user@example.com',
  activity_type: ActivityType.CUSTOM_ACTION,
  activity_description: 'User performed a custom action',
  metadata: { additional: 'data' },
  ip_address: req.ip,
  user_agent: req.headers['user-agent']
});

// Use helper methods for common activities
await ActivityLogger.logLeadCreated(
  workspaceId,
  userId,
  memberEmail,
  { id: leadId, name: leadName, email: leadEmail }
);
```

#### Using the React Components

```tsx
import ActivityLogsDashboard from '@/components/activity-logs/ActivityLogsDashboard';
import { ActivityLogsWidget } from '@/components/activity-logs/ActivityLogsWidget';

// Full dashboard
<ActivityLogsDashboard workspaceId={workspaceId} />

// Compact widget
<ActivityLogsWidget workspaceId={workspaceId} limit={10} />
```

## API Endpoints

### GET `/api/activity-logs/activity-logs?action=getActivityLogs`

Retrieve activity logs with filtering and pagination.

**Parameters:**
- `workspace_id` (required): Workspace UUID
- `activity_type` (optional): Filter by activity type
- `start_date` (optional): Start date for filtering
- `end_date` (optional): End date for filtering
- `limit` (optional): Number of records (default: 50, max: 100)
- `offset` (optional): Pagination offset
- `search` (optional): Search term

### GET `/api/activity-logs/activity-logs?action=getActivityLogStats`

Get activity statistics for a workspace.

**Parameters:**
- `workspace_id` (required): Workspace UUID

### POST `/api/activity-logs/activity-logs?action=createActivityLog`

Create a new activity log entry.

**Body:**
```json
{
  "workspace_id": "uuid",
  "user_id": "uuid",
  "member_email": "user@example.com",
  "activity_type": "lead_created",
  "activity_description": "User created a new lead",
  "metadata": {}
}
```

## Performance Considerations

- **Indexes**: Optimized database indexes for common query patterns
- **Caching**: Redux Toolkit Query provides automatic caching
- **Pagination**: Large datasets are paginated to maintain performance
- **Async Logging**: Activity logging is non-blocking and won't slow down user actions

## Troubleshooting

### Common Issues

1. **Activity logs not appearing**: Check if the user has admin permissions
2. **Database errors**: Ensure the migration has been run
3. **Permission denied**: Verify RLS policies are correctly configured
4. **Missing activities**: Check if logging is properly integrated in API endpoints

### Debug Mode

Enable debug logging by setting the environment variable:
```bash
DEBUG_ACTIVITY_LOGS=true
```

## Future Enhancements

- **Real-time Updates**: WebSocket integration for live activity feeds
- **Advanced Analytics**: More detailed reporting and analytics
- **Activity Notifications**: Email/SMS notifications for critical activities
- **Data Retention**: Automatic cleanup of old activity logs
- **Bulk Operations**: Bulk export and management capabilities

## Support

For issues or questions regarding the activity logging system, please:
1. Check this documentation
2. Run the test script to validate the implementation
3. Check the browser console for any JavaScript errors
4. Verify database connectivity and permissions
