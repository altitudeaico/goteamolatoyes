-- ==========================================
-- OLATOYE ACADEMY HACKATHON - SUPABASE SETUP
-- ==========================================
-- Run this in your Supabase SQL Editor

-- 1. USERS TABLE
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

-- 2. TEAMS TABLE
CREATE TABLE IF NOT EXISTS hackathon_teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '⚡',
  code TEXT NOT NULL UNIQUE,
  members JSONB DEFAULT '[]'::jsonb,
  xp INTEGER DEFAULT 0,
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

-- 4. ENABLE RLS (Row Level Security)
ALTER TABLE hackathon_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_submissions ENABLE ROW LEVEL SECURITY;

-- 5. CREATE POLICIES (Allow all for simplicity - adjust for production)
CREATE POLICY "Allow all access to hackathon_users" ON hackathon_users
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to hackathon_teams" ON hackathon_teams
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to hackathon_submissions" ON hackathon_submissions
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 6. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_hackathon_users_xp ON hackathon_users(xp DESC);
CREATE INDEX IF NOT EXISTS idx_hackathon_users_name ON hackathon_users(name);
CREATE INDEX IF NOT EXISTS idx_hackathon_teams_code ON hackathon_teams(code);
