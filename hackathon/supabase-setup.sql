-- ==========================================
-- OLATOYE ACADEMY HACKATHON - SUPABASE SETUP
-- ==========================================
-- Run this in your Supabase SQL Editor

-- 1. TEAMS TABLE (must be created first - referenced by users)
CREATE TABLE IF NOT EXISTS hackathon_teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '⚡',
  code TEXT NOT NULL UNIQUE,
  members JSONB DEFAULT '[]'::jsonb,
  xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS hackathon_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  secret_code TEXT NOT NULL,
  avatar TEXT DEFAULT '🦸',
  tagline TEXT,
  xp INTEGER DEFAULT 0,
  completed_tasks JSONB DEFAULT '[]'::jsonb,
  current_mission INTEGER DEFAULT 1,
  team_id UUID REFERENCES hackathon_teams(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS hackathon_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES hackathon_users(id),
  mission_id INTEGER NOT NULL,
  text TEXT,
  link TEXT,
  status TEXT DEFAULT 'pending',
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MESSAGES TABLE
-- channel: 'everyone', 'team:<team_id>', or 'dm:<user_id_a>:<user_id_b>' (sorted)
CREATE TABLE IF NOT EXISTS hackathon_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel TEXT NOT NULL,
  sender_id UUID REFERENCES hackathon_users(id),
  sender_name TEXT NOT NULL,
  sender_avatar TEXT NOT NULL,
  body TEXT NOT NULL,
  reactions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_channel ON hackathon_messages(channel, created_at DESC);

-- 5. ENABLE RLS
ALTER TABLE hackathon_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_messages ENABLE ROW LEVEL SECURITY;

-- 6. CREATE POLICIES
CREATE POLICY "Allow all access to hackathon_users" ON hackathon_users
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to hackathon_teams" ON hackathon_teams
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to hackathon_submissions" ON hackathon_submissions
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to hackathon_messages" ON hackathon_messages
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 7. ENABLE REALTIME on messages
ALTER PUBLICATION supabase_realtime ADD TABLE hackathon_messages;

-- 8. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_hackathon_users_xp ON hackathon_users(xp DESC);
CREATE INDEX IF NOT EXISTS idx_hackathon_users_name ON hackathon_users(name);
CREATE INDEX IF NOT EXISTS idx_hackathon_teams_code ON hackathon_teams(code);
