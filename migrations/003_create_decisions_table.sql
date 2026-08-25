-- Create decisions table to replace string array on meetings
CREATE TABLE cq_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES cq_meetings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- open, set
  set_at TIMESTAMPTZ,
  set_by TEXT,
  set_comment TEXT,
  sort INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cq_decisions_meeting ON cq_decisions(meeting_id);
CREATE INDEX idx_cq_decisions_status ON cq_decisions(status);

-- RLS policy: allow select/insert/update for authenticated users
ALTER TABLE cq_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_access" ON cq_decisions FOR SELECT USING (true);
CREATE POLICY "anon_insert" ON cq_decisions FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update" ON cq_decisions FOR UPDATE USING (true) WITH CHECK (true);
