# Timezone Migration for Workspaces Table

## Overview
This migration adds a `timezone` column to the `workspaces` table to support timezone-specific operations for each workspace.

## Migration File
- **File**: `add_timezone_to_workspaces.sql`
- **Purpose**: Adds timezone support to workspaces

## Schema Changes
- Adds `timezone` column (VARCHAR(50)) with default value 'UTC'
- Creates an index on the timezone column for query performance
- Adds descriptive comment for the column

## How to Apply

### Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `add_timezone_to_workspaces.sql`
4. Execute the query

### Using Supabase CLI
```bash
supabase db push
```

### Direct PostgreSQL Connection
```bash
psql -h your-db-host -U your-db-user -d your-database < add_timezone_to_workspaces.sql
```

## Supported Timezone Values
The timezone column accepts IANA timezone identifiers such as:
- `UTC` (default)
- `America/New_York`
- `Europe/London`
- `Asia/Kolkata`
- `Asia/Tokyo`
- `Australia/Sydney`

For a complete list of valid timezones, see: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

## Application Integration
The timezone field is already integrated in the application:
- Used in `useWorkspaceSettings` hook for date formatting
- Applied in activity logs for proper timestamp display
- Supported in workspace creation and update APIs

## Rollback
If you need to rollback this migration:
```sql
-- Remove the index
DROP INDEX IF EXISTS idx_workspaces_timezone;

-- Remove the column
ALTER TABLE workspaces DROP COLUMN IF EXISTS timezone;
```