-- Create member_activity_logs table for tracking workspace member activities
-- This table stores all activities performed by workspace members for audit and monitoring purposes

CREATE TABLE IF NOT EXISTS member_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id BIGINT NOT NULL,
    user_id UUID NOT NULL,
    member_email VARCHAR(255) NOT NULL,
    member_name VARCHAR(255),
    activity_type VARCHAR(100) NOT NULL,
    activity_description TEXT NOT NULL,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE member_activity_logs 
ADD CONSTRAINT fk_member_activity_logs_workspace_id 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE member_activity_logs 
ADD CONSTRAINT fk_member_activity_logs_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_member_activity_logs_workspace_id ON member_activity_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_member_activity_logs_user_id ON member_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_member_activity_logs_activity_type ON member_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_member_activity_logs_created_at ON member_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_activity_logs_member_email ON member_activity_logs(member_email);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_member_activity_logs_workspace_created ON member_activity_logs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_activity_logs_workspace_type ON member_activity_logs(workspace_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_member_activity_logs_workspace_member ON member_activity_logs(workspace_id, member_email);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_member_activity_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER trigger_update_member_activity_logs_updated_at
    BEFORE UPDATE ON member_activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_member_activity_logs_updated_at();

-- Add check constraint for activity_type to ensure valid values
ALTER TABLE member_activity_logs 
ADD CONSTRAINT check_activity_type 
CHECK (activity_type IN (
    'login', 'logout', 'password_change',
    'workspace_join', 'workspace_leave', 'workspace_invite_sent', 
    'workspace_invite_accepted', 'workspace_invite_declined',
    'lead_created', 'lead_updated', 'lead_deleted', 'lead_status_changed', 
    'lead_assigned', 'lead_unassigned',
    'status_created', 'status_updated', 'status_deleted',
    'tag_created', 'tag_updated', 'tag_deleted',
    'webhook_created', 'webhook_updated', 'webhook_deleted',
    'member_added', 'member_removed', 'member_role_changed',
    'profile_updated', 'settings_changed', 'data_export', 'data_import'
));

-- Add RLS (Row Level Security) policies for data protection
ALTER TABLE member_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see activity logs for workspaces they are members of
CREATE POLICY "Users can view activity logs for their workspaces" ON member_activity_logs
    FOR SELECT USING (
        workspace_id IN (
            SELECT workspace_id 
            FROM workspace_members 
            WHERE user_id = auth.uid() 
            AND status = 'accepted'
        )
        OR 
        workspace_id IN (
            SELECT id 
            FROM workspaces 
            WHERE owner_id = auth.uid()
        )
    );

-- Policy: Only authenticated users can insert activity logs
CREATE POLICY "Authenticated users can insert activity logs" ON member_activity_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users cannot update or delete activity logs (audit trail integrity)
CREATE POLICY "No updates allowed on activity logs" ON member_activity_logs
    FOR UPDATE USING (false);

CREATE POLICY "No deletes allowed on activity logs" ON member_activity_logs
    FOR DELETE USING (false);

-- Create a view for easier querying with workspace and member information
CREATE OR REPLACE VIEW member_activity_logs_with_details AS
SELECT 
    mal.*,
    w.name as workspace_name,
    wm.role as member_role,
    wm.status as member_status
FROM member_activity_logs mal
LEFT JOIN workspaces w ON mal.workspace_id = w.id
LEFT JOIN workspace_members wm ON mal.workspace_id = wm.workspace_id 
    AND mal.member_email = wm.email;

-- Grant necessary permissions
GRANT SELECT ON member_activity_logs TO authenticated;
GRANT INSERT ON member_activity_logs TO authenticated;
GRANT SELECT ON member_activity_logs_with_details TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE member_activity_logs IS 'Stores all member activities within workspaces for audit and monitoring purposes';
COMMENT ON COLUMN member_activity_logs.workspace_id IS 'Reference to the workspace where the activity occurred';
COMMENT ON COLUMN member_activity_logs.user_id IS 'Reference to the user who performed the activity';
COMMENT ON COLUMN member_activity_logs.member_email IS 'Email of the member who performed the activity';
COMMENT ON COLUMN member_activity_logs.activity_type IS 'Type of activity performed (enum value)';
COMMENT ON COLUMN member_activity_logs.metadata IS 'Additional activity-specific data stored as JSON';
COMMENT ON COLUMN member_activity_logs.ip_address IS 'IP address from which the activity was performed';
COMMENT ON COLUMN member_activity_logs.user_agent IS 'User agent string of the client that performed the activity';
