---
name: codequest-team-apps
description: Build, extend, debug and QA the single-file HTML apps in the #GoTeamOlatoyes / Code Quest family platform — the team coordination app at /codequest/team/, the Code Quest archives, quiz apps and any similar Supabase-backed family or team-working app. Use this skill WHENEVER Bolaji asks to add a feature, fix a bug, restore missing content, change copy, review the UX, or "do a dev burst" on any of these apps, and also whenever he says things like "the tab is empty", "it's not saving", "review the whole app", "act as a product manager", "add a meeting", "make it proper", or hands over a PAT to push changes. Trigger it even for a one-line tweak, because the app has a locked design system, a house voice (the Elsie test), a set of hard-won failure modes (silent save failures, orphaned divs, GitHub Pages cache) and a mandatory validate-before-push loop that get broken the moment work is done freehand.
---

# Code Quest team apps

Single-file HTML apps for an extended family spread across four households. The audience is not developers. It is a seven year old, a grandmother in Radlett, and busy parents on phones in Middleton and New York. Every decision follows from that.

## The one rule

**Build first, ask nothing.** Bolaji sends fragments and expects a working, pushed change. Do not open with clarifying questions. If something is genuinely ambiguous, pick the reading that serves the family and say what you assumed in one line at the end.

## Architecture

One `index.html` per app. No build step, no framework, no bundler. Vanilla ES5-flavoured JS inside a single `<script>` IIFE with `"use strict"`. Inline `<style>` at the top. Data in Supabase, read and written over the REST API with the anon key in the file.

Hosting is GitHub Pages off `altitudeaico/goteamolatoyes`. The team app lives at `codequest/team/index.html`, served from `https://altitudeaico.github.io/goteamolatoyes/codequest/team/`.

Active family Supabase project: `kxrhzijqyotyrzhpiflv`. Use the Supabase MCP for all schema work — the REST API is blocked from the sandbox, so `curl` against Supabase will fail and mislead you.

Read `references/supabase-and-deploy.md` before any schema change or push.
Read `references/design-system.md` before writing any markup or CSS.

## The voice: the Elsie test

Every word must be one a seven year old and a first-time parent already own. No invented vocabulary, no product jargon, no em dashes in anything the family reads.

| Never | Instead |
|---|---|
| "Set this decision" | "We've agreed this" |
| "Mark as complete" | "I've done this" |
| "Submit feedback" | "Send it" |
| "No items found" | "Nothing here yet" |
| "What was brought in" / "What came out of the room" | "Sent in before the call" / "Said on the call" |

Two headings that a reader cannot tell apart are a bug, not a style preference. If you have to think about which one something belongs under, rename both.

Placeholders should be half-written sentences, not instructions. `"I sent it over on Tuesday and..."` gets far more out of people than `"Enter your notes"`.

Titles carry the meaning. A meeting called "Code Quest Session: Product & Market" is a calendar entry. "Making something people want" is an invitation.

## UX principles, learned the hard way

**Answer the opening question first.** Everyone opens this app asking *when are we next on and what do I need to bring*. That belongs at the top of the first screen, visually distinct (the `.up` gradient card), with a relative label — "In 4 days", "Tomorrow" — not just a date. Past items go below under "Already happened".

**Never make the whole card a tap target.** A click handler on a card fires when someone scrolls with a thumb. Destructive or state-changing actions get their own explicit button with a verb on it.

**If you collect it, show it.** Mandatory comments that are never rendered are worse than no comments — you have made people do work that disappears. Every captured note must surface on the card, attributed by name.

**Completed things stay completed.** Decisions and finished actions are records, not toggles. If reversal is allowed at all, it is a quiet secondary link ("Put it back on the list"), never the same tap that created the record.

**Explain once, not every visit.** Onboarding copy goes in `<details>`. Present on visit one, folded away by visit twenty.

**Empty states say what happens next.** "Nothing outstanding" is a dead end. "Everything we agreed is done. New things land here after each meeting." tells you the screen is working.

**Invitation, not notification.** The Middleton household needs to feel consulted rather than informed. Meeting copy carries a line like "If this slot does not work for your house, say so and we will move it." Volume of polished output reads as decided — soften the framing to match.

## The failure modes that have actually bitten

These are real bugs that shipped. Check for each one.

**1. Undeclared variables resolve to DOM elements.** `var user = who || "anonymous"` looks fine and is catastrophic. There is no `who` variable — browsers expose element IDs as globals, so this returned `<div id="who">`, the PATCH body serialised a DOM node, Postgres rejected it, and the save failed. Use `me ? me.name : "Someone"`. Grep for any bare identifier that matches an element ID.

**2. Optimistic repaint hides server failures.** Never set local state and repaint before the fetch resolves. The card shows as done, the save 400s, and it reverts on refresh — which the user experiences as "it erased my work". Always:

```js
fetch(url, {method:"PATCH", headers:H, body:...})
  .then(function(r){
    if (r.ok){ /* mutate local state, repaint, toast */ }
    else toast("Couldn't save that");
  })
  .catch(function(){ toast("Couldn't save that"); });
```

**3. Orphaned markup when editing views.** Each tab is `<div class="view" id="v-NAME">`. Miscounting a closing `</div>` pushes a view's contents outside every view container, and it renders nowhere — the tab looks empty while the code looks correct. After any structural edit, verify every `id="v-*"` opens and closes and that each view's render targets sit inside it.

**4. Silent fetch failures.** Every loader needs a `.catch` that logs and toasts. Without one, a single failing request leaves a blank tab and no signal.

**5. Supabase id columns are TEXT, not UUID.** `cq_meetings.id` is text like `cq_m_a1b2c3`. Foreign keys typed `UUID` fail with "incompatible types". Match the existing type and generate ids as `'cq_x_' || substr(md5(random()::text), 1, 12)`. Inserts must supply `id` explicitly — there is no default.

**6. `grant select to anon` is not enough.** Every table also needs an explicit permissive RLS policy per operation, or reads return empty and writes fail.

**7. GitHub Pages caches hard.** A correct push that "shows no change" is almost always cache. Test in incognito. Bump the version marker in the footer when you need certainty.

**8. Emoji and file writes.** When patching these files with Python, read and write binary (`rb`/`wb`) or use `str.replace(old, new, 1)` — the files contain emoji and a careless rewrite mangles them.

## Validate before every push

Brace counting is a weak check that passes on genuinely broken code. Extract the script block and run it through node:

```bash
python3 - <<'EOF'
import re
s = open('codequest/team/index.html').read()
m = re.search(r'<script>\n(.*)\n</script>', s, re.DOTALL)
open('/tmp/check.js','w').write(m.group(1))
EOF
node --check /tmp/check.js && echo "JS SYNTAX OK"
```

Then confirm div balance and that no dead references survive an edit (`toggleAct`, `fillList("mDecisions")` and similar leftovers).

Never layer a fix onto broken code. If a change went wrong, revert to the last good commit and reapply cleanly.

## When asked to review the app

A review means reading the file end to end and naming specific defects with evidence, not running a checklist of "is the function present". Structural checks pass on apps that are completely broken to a user.

Lead with the defect that is costing the most, explain the mechanism in one or two sentences, then fix. Order the findings by user cost, not by how interesting they are to fix. Silent data loss outranks spacing.

Do not ask the user to describe what they see when you can read the code and find it yourself.

## Doing the work

1. Clone with the PAT, read the current file — never work from memory of it
2. Make the change with `str_replace` on exact current content
3. Validate with `node --check` on the extracted script
4. Commit with a message naming the user-visible effect
5. Push, then give the live link

Bolaji supplies a temporary PAT for a burst. Use it for the session and treat it as discarded afterwards. Push format:

```
https://x-access-token:TOKEN@github.com/altitudeaico/goteamolatoyes.git
```

Schema changes go through the Supabase MCP (`apply_migration` for DDL, `execute_sql` for data), and the same SQL is committed to `migrations/NNN_name.sql` so the change is on the record.

## Family facts that must not be got wrong

Titles always: Uncle B, Uncle Ayo, Aunty Lina, Uncle Gbenga, Aunty Mai, Aunty Funms, Grandma.

Sophia is not Safia. Aunty Mai prefers Mai over May May, and the Code Quest repositioning is attributed to her. Grandma is an equal family member, never a "special guest". Elsie's Butterflii Art Studio is a real business, not a child's project.

Households: Gravesend (Uncle B, Aunty Funms, Elsie, Emma), Middleton (Uncle Ayo, Aunty Lina, Hannah, Sophia, Ezekiel), New York (Uncle Gbenga, Aunty Mai, Theodore, Arthur), Radlett (Grandma).

Building is the identity. Coding is only the first medium.
