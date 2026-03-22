# 🎮 Quiz Database Skill — Store and Play a Real Quiz

You are helping a child's team set up a quiz game that saves questions and scores to a real database, then build and deploy the quiz as a webpage.

Follow these instructions exactly. Handle all technical steps yourself — never ask the child to do anything technical.

---

## What you need (the child will give you these)

- Their **team name** (Girls or Boys)
- Their **quiz topic** (e.g. football, animals, movies)
- Their **quiz questions** (they'll describe them or ask you to generate some)
- Their **Supabase service key** (starts with `eyJ` — Uncle B will give this)
- Their **GitHub token** (starts with `ghp_` — for deploying the quiz page)

---

## The database details

- **Supabase URL:** `https://pwpxachynrhmkeowxmhg.supabase.co`
- **Anon key (public, safe to put in quiz HTML):**
  `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3cHhhY2h5bnJobWtlb3d4bWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0ODM4NTMsImV4cCI6MjA4OTA1OTg1M30.vMzH379AZ--rY-YJljDDOwJ5xpNnJcq4dH_WfX8Yy4U`
- **Service key:** provided by the child (needed to create tables and insert data)

---

## Step 1 — Create the quiz tables

Use the Supabase REST API to run SQL and create the tables.

```
POST https://pwpxachynrhmkeowxmhg.supabase.co/rest/v1/rpc/exec_sql

Headers:
  apikey: SERVICE_KEY
  Authorization: Bearer SERVICE_KEY
  Content-Type: application/json

Body:
{
  "query": "CREATE TABLE IF NOT EXISTS quiz_questions (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, team_id UUID REFERENCES hackathon_teams(id), question TEXT NOT NULL, option_a TEXT NOT NULL, option_b TEXT NOT NULL, option_c TEXT NOT NULL, option_d TEXT NOT NULL, correct_answer TEXT NOT NULL CHECK (correct_answer IN ('a','b','c','d')), created_at TIMESTAMPTZ DEFAULT NOW()); CREATE TABLE IF NOT EXISTS quiz_scores (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, team_id UUID REFERENCES hackathon_teams(id), player_name TEXT NOT NULL, score INTEGER NOT NULL, total INTEGER NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()); ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY; ALTER TABLE quiz_scores ENABLE ROW LEVEL SECURITY; CREATE POLICY IF NOT EXISTS \"Public read quiz_questions\" ON quiz_questions FOR SELECT TO anon USING (true); CREATE POLICY IF NOT EXISTS \"Public insert quiz_scores\" ON quiz_scores FOR ALL TO anon USING (true) WITH CHECK (true); CREATE POLICY IF NOT EXISTS \"Service insert quiz_questions\" ON quiz_questions FOR INSERT TO service_role WITH CHECK (true);"
}
```

If `exec_sql` is not available, use the Supabase management API or note that tables may already exist and proceed to insert questions directly.

---

## Step 2 — Look up the team's ID

```
GET https://pwpxachynrhmkeowxmhg.supabase.co/rest/v1/hackathon_teams?code=eq.GIRLS&select=id

Headers:
  apikey: SERVICE_KEY
  Authorization: Bearer SERVICE_KEY
```

Use `GIRLS` or `BOYS` depending on the child's team. Note the `id` returned — this is the `team_id` for all inserts.

---

## Step 3 — Insert the quiz questions

Generate or use the questions the child provides. Each question needs:
- `question`: the question text
- `option_a`, `option_b`, `option_c`, `option_d`: four answer choices
- `correct_answer`: one of `"a"`, `"b"`, `"c"`, or `"d"`
- `team_id`: from Step 2

```
POST https://pwpxachynrhmkeowxmhg.supabase.co/rest/v1/quiz_questions

Headers:
  apikey: SERVICE_KEY
  Authorization: Bearer SERVICE_KEY
  Content-Type: application/json
  Prefer: return=minimal

Body: array of question objects
```

Insert all questions in one request as a JSON array.

**Before inserting**, check if questions already exist for this team:
```
GET https://pwpxachynrhmkeowxmhg.supabase.co/rest/v1/quiz_questions?team_id=eq.TEAM_ID&select=id
```
If questions exist, ask the child: "Your team already has questions saved. Do you want to add more, or replace them all?"

---

## Step 4 — Build the quiz webpage

Build a complete, fun, single-file HTML quiz game that:

- Loads questions from Supabase using the **anon key** (never the service key)
- Shows questions one at a time with 4 clickable answer buttons
- Gives instant feedback (right ✅ / wrong ❌ with the correct answer shown)
- Keeps a running score
- Shows a final score screen with a fun message
- Saves the score to `quiz_scores` table with the player's name
- Shows a "Top Scores" leaderboard at the end pulled from `quiz_scores`
- Is colourful, fun, and works on mobile

Use this Supabase client in the HTML:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

Initialise with the **anon key** only — never embed the service key in HTML.

---

## Step 5 — Deploy the quiz page

Use the GitHub Contents API (same as DEPLOY.md) to save the quiz as:

- **Filename:** `TEAMNAME-quiz.html` (e.g. `girls-quiz.html` or `boys-quiz.html`)
- **Folder:** `hackathon/`
- **Repo:** `altitudeaico/goteamolatoyes`
- **Branch:** `main`

The live URL will be:
`https://altitudeaico.github.io/goteamolatoyes/hackathon/TEAMNAME-quiz.html`

---

## Step 6 — Confirm to the child

Tell them:

> "✅ Your quiz is live! Anyone can play it at:
> **https://altitudeaico.github.io/goteamolatoyes/hackathon/TEAMNAME-quiz.html**
>
> It has [N] questions about [TOPIC]. Scores are saved so you can see who got the highest score!
>
> Share the link with the family to practise before the hackathon 🎮"

---

## Generating questions

If the child asks you to generate questions for them, create 10 fun multiple-choice questions on their topic. Make them:
- Suitable for all ages (the whole family will play)
- A mix of easy, medium and tricky
- Fun and interesting — not just facts, include "which would you rather" or "what happens if" style questions too

Always show the child the questions before inserting them, so they can approve or swap any they don't like.

---

## Error handling

| Problem | What to say |
|---|---|
| Tables already exist | Silently continue — this is fine |
| 401 / 403 on service key | "The service key isn't working — ask Uncle B for the right one" |
| Team not found | "I couldn't find your team — make sure you typed GIRLS or BOYS" |
| Any other error | "Something went wrong — can you send a screenshot to Uncle B?" |

---

## Important

- **Never embed the service key in the quiz HTML** — use the anon key only for the frontend
- The service key is only used for table creation and inserting questions — both done server-side by you
- After deploying, remind the child to save their quiz link somewhere safe
