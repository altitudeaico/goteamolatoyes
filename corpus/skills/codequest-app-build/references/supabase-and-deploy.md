# Supabase and deployment

Read before any schema change or push.

## Projects

- **Active family project: `kxrhzijqyotyrzhpiflv`** — everything current lives here
- Legacy `pwpxachynrhmkeowxmhg` is paused on free tier, owned by `hello@altitudeai.co`
- Girls team quiz: `jrjmkqzjloikdhhatrwa`
- Boys team quiz: `nqojtmtcffbhwhmlghza`
- Summer Tour: `kxqxokbyvxrjwbegpqso`

Always use the **Supabase MCP**. The Supabase REST API is blocked from the sandbox, so `curl` will fail in ways that look like schema problems but are network blocks. `api.github.com` is blocked too — repo creation and Pages activation are manual.

`apply_migration` for DDL, `execute_sql` for data. Mirror every DDL statement into `migrations/NNN_description.sql` in the repo so the schema has a history.

## Team app tables

| Table | Holds |
|---|---|
| `cq_members` | Family members: id, name, emoji, household |
| `cq_meetings` | id (TEXT), title, summary, held_on (date), recording_url, notes_url |
| `cq_actions` | Things we said we'd do. status open/done, done_at, done_by, done_comment, owners, meeting_id, sort |
| `cq_decisions` | Things we agreed. status open/set, set_at, set_by, set_comment, meeting_id, sort |
| `cq_ideas` | author, topic, body, transcript, source (brief or room), meeting_id |
| `cq_reviews` | Things wanting family eyes: title, blurb, ask, sort |
| `cq_review_notes` | review_id, author, note |

### Ids are TEXT

`cq_meetings.id` is text like `cq_m_a1b2c3d4e5f6`. A foreign key declared `UUID` fails with "Key columns are of incompatible types". Match the parent type, and generate:

```sql
'cq_m_' || substr(md5(random()::text), 1, 12)
```

There is no default on `id` — every insert supplies it explicitly or hits a not-null violation.

### RLS

Granting select to `anon` is not sufficient. Each table needs explicit permissive policies:

```sql
ALTER TABLE cq_thing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_access" ON cq_thing FOR SELECT USING (true);
CREATE POLICY "anon_insert" ON cq_thing FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update" ON cq_thing FOR UPDATE USING (true) WITH CHECK (true);
```

Missing the update policy is the usual cause of "it saves but doesn't stick".

### Keep-alive

Free-tier projects pause after inactivity. `keepalive.yml` pings the database Mondays and Thursdays. If a project has gone quiet, check the workflow before assuming a code fault.

## Adding a meeting

```sql
INSERT INTO cq_meetings (id, title, summary, held_on)
VALUES (
  'cq_m_' || substr(md5(random()::text), 1, 12),
  'Making something people want',
  'Aunty Mai takes us through how you turn an idea into a product people actually want... Kids will need a laptop. If this slot does not work for your house, say so and we will move it.',
  '2026-08-29'
);
```

The app derives the "Bring a laptop" pill by matching `/laptop/i` against the summary, so mention it in plain words rather than assuming a separate field.

## Deploying

GitHub Pages from `altitudeaico/goteamolatoyes`, main branch. Live at
`https://altitudeaico.github.io/goteamolatoyes/codequest/team/`
also reachable via `http://olatoyeacademy.com/codequest`.

```bash
git clone https://x-access-token:TOKEN@github.com/altitudeaico/goteamolatoyes.git
# edit, validate
git -C goteamolatoyes commit -am "message naming the user-visible effect"
git -C goteamolatoyes push
```

Set `user.email` and `user.name` on first use in a fresh sandbox or the commit is refused.

Tokens: a `repo`-scoped token is rejected for anything under `.github/workflows/` — that needs `workflow` scope too. GitHub's secret scanner blocks pushes containing a raw `ghp_` string, so never commit a token, even in documentation; use a placeholder.

Bolaji issues a temporary fine-grained PAT per burst at `https://github.com/settings/tokens?type=beta`. Use it for the session only.

## After pushing

Pages takes up to a minute and caches aggressively. "No change" almost always means cache, not a failed deploy. Verify by fetching the raw file:

```bash
curl -s https://raw.githubusercontent.com/altitudeaico/goteamolatoyes/main/codequest/team/index.html | grep -A5 "functionName"
```

If the change is in raw but not in the browser, it is cache — test in incognito. Note that `altitudeaico.github.io` is not in the sandbox network allowlist, so the live URL cannot be fetched from here; raw.githubusercontent.com can.

Bump the version marker in the footer when a deploy needs to be provable.
