-- Add agency field to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS agency text;

-- Allow deleting matches (cascade already set, but confirm)
-- No changes needed for delete, it's handled via API
