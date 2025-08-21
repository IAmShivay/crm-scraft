-- Add currency field to workspaces table
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR';

-- Add a comment explaining the field
COMMENT ON COLUMN workspaces.currency IS 'ISO 4217 currency code for the workspace (e.g., USD, EUR, INR)';

-- Create an index for better query performance when filtering by currency
CREATE INDEX IF NOT EXISTS idx_workspaces_currency ON workspaces(currency);

-- Update existing workspaces to have INR as default currency (if needed)
UPDATE workspaces 
SET currency = 'INR' 
WHERE currency IS NULL;