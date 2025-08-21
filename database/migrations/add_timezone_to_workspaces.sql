-- Add timezone field to workspaces table
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';

-- Add a comment explaining the field
COMMENT ON COLUMN workspaces.timezone IS 'IANA timezone identifier for the workspace (e.g., America/New_York, Europe/London, Asia/Kolkata)';

-- Create an index for better query performance when filtering by timezone
CREATE INDEX IF NOT EXISTS idx_workspaces_timezone ON workspaces(timezone);

-- Update existing workspaces to have UTC as default timezone (if needed)
UPDATE workspaces 
SET timezone = 'UTC' 
WHERE timezone IS NULL;