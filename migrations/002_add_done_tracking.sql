-- Add columns to track who completed actions and their notes
ALTER TABLE cq_actions 
  ADD COLUMN done_by TEXT,
  ADD COLUMN done_comment TEXT;

-- Create an index for queries
CREATE INDEX idx_cq_actions_done_by ON cq_actions(done_by);
