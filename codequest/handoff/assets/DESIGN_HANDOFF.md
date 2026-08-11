# CodeQuest design handoff
## From the product simulation to the build, for M14

Companion file: `codequest-design-system.css`. Drop it in, use the class names, and most of this document is already done.

This is an offer, not a spec handed down. The build has made decisions the simulation never had to face, and where the two disagree the build is usually right. Everything here is meant to save time on M14, not to add scope to it.

---

## 1. Start here: the Astro scoped CSS trap, solved

The M16 finding that every dynamically rendered element was unstyled, because Astro scoped styles never reach elements built with `createElement`, is exactly why this stylesheet is written the way it is.

- Every rule is a **plain global class**. No `:where` scoping, no component nesting, no build-time attribute needed.
- Import it **once in a layout**, either as a `<link>` or inside `<style is:global>`. Never inside a component's scoped `<style>` block.
- Any element created at runtime gets styled the moment it receives a class, with no build step involved.

Two related guards worth adding while it is fresh:

**A rule that fails loudly.** Approve and reject rendering as identical grey buttons was invisible to DOM-reading tests because an unapplied rule and an unwritten rule look the same from the DOM. A cheap guard is one assertion per critical control that reads `getComputedStyle`, not attributes. Three lines in a browser test: the approve button's background is not transparent, and approve and reject do not have the same background. That single check would have caught the whole class of bug.

**Distinguish by shape, not colour alone.** In this system approve is a solid green pill and reject is a white outlined danger button. Even with the stylesheet missing entirely, one is a filled button and one is not.

---

## 2. What to carry over

### Colour

One canvas, one ink, five accents, one accent per section. The section colour is the navigation aid: a child who cannot yet read the tab labels navigates by colour.

- Purple, the primary action colour and Home
- Teal, making and progress and "this one is yours"
- Coral, videos and recording and likes
- Amber, games and lessons and stars
- Green, safety and approved and success, and used nowhere else

Green earning its exclusivity matters. If green only ever means safe or approved, a parent learns the language in one session.

### Type

Nunito throughout, weights 600 to 900. It is rounded enough to read as a children's product and neutral enough that a parent does not feel patronised. Sizes are in the stylesheet as tokens.

If you would rather pick the display face by eye, as planned, the constraints that matter are: rounded terminals, a true 800 or 900 weight, and legible numerals, since levels, counts and PINs are all numeric.

### Shape and depth

Large radii, 18px to 22px on cards. White cards on a near-white canvas separated by a soft shadow rather than a hard border. This is what makes it read as a modern kids app rather than a form.

### Geometry, the thing that bites

Fixed header and fixed tab bar mean scrolling content must pad for both. The tokens are `--cq-scroll-top: 102px` and `--cq-scroll-bottom: 120px`, with safe area insets added. If either piece of chrome changes height, change the token, never the individual screens. Getting this wrong hides the first card on every screen, which is the failure the simulation had until it was audited screen by screen.

---

## 3. The language rules, which matter more than the colours

The simulation was shown to a parent who is not technical and to a child. Both bounced off invented vocabulary. Everything was rewritten to this standard, and the same standard would serve the build well.

**Only use words a seven year old and a first time parent already own.** Home, make, games, videos, levels, share, parent. The public site already does this beautifully. The line "A child builds a game. A grown-up checks it over. Minutes later it is live on the internet at its own address" is the clearest statement of the product anyone has written so far.

**Never render internal vocabulary in a UI string.** Guardian is a fine subdomain and a fine table name. On screen it is "parent" or "grown-up". Same for any ULID, slug or state machine name.

**Buttons are verbs in sentence case.** "Keep making my game", "Share my game", "Look and approve". Never all caps, never a noun on its own.

**Say what will happen next.** "Your parent checks it first. Then it goes up." A child who knows the next step does not need a manual.

**One naming collision to settle.** The build uses builder as the everyday word for any child, in "I'm a builder" and "a builder name and a PIN". The draft progression ladder uses Builder as a level a child earns after three projects. Both cannot ship. Recommendation is the build keeps the plain word and the ladder renames its level, since the sign-in screen is seen far more often than any progress screen.

---

## 4. Three UX patterns worth porting, in priority order

### First run explanation

A brand new family lands in a product with nothing in it. The simulation opens with a three step tour: kids make real games, parents say yes first, here are your tabs. Then a one time tip bubble on each screen's first visit, dismissed with "Got it" and never seen again.

Cheap to build, and it is the difference between a pilot family understanding the product in ten seconds and asking someone to explain it.

### Empty states with a next action

Never render a bare empty list. Art, one sentence, one button. The gallery before the first project, the parent queue with nothing waiting, a child's first sign-in. The `cq-empty` class is in the stylesheet.

Suggested copy for the parent queue when empty: "Nothing waiting. When your child shares a game, it comes to you first."

### Status the child can read at a glance

A submitted project has three states and each needs a word and a colour a child understands without help:

- Waiting for your grown-up, amber
- Live, green
- Needs changes, coral, with the parent's note underneath in their own words

The badge classes are in the stylesheet.

---

## 5. Screen inventory in the simulation, mapped to the build

Marked with whether it is useful to the MVP now or later.

| Simulation screen | Useful to the MVP | What to take |
|---|---|---|
| Family sign-in | Now | Kid profiles as large tap targets rather than a typed name. Pairs well with the QR route |
| Home | Now | The single primary action card. One clear next thing, always |
| Parent zone | Now | The green safety banner at the top, approval rows, per-child switches |
| A child's project page | Now | Title, play, share link, QR, plus counts when they exist. This is the surface a child sends to a friend |
| Games grid | Now | Tile grid with the child's own project outlined in teal |
| Make | Later | Only relevant if an in-app editor is ever scoped |
| Videos and lessons | Later | Whole feature, deferred |
| Levels | Later | Deferred, but settle the naming collision now |
| The big day archive | Later | Event content, lives fine on the existing site |

---

## 6. If it helps, a prompt for the coding agent

Paste alongside the stylesheet:

> Use the attached `codequest-design-system.css` as the single source of truth for visual design. Import it once as a global stylesheet in the layout, never inside a component scoped style block, because dynamically created elements do not receive Astro's scoped attribute.
>
> Build screens from the existing classes: `cq-scroll` for any scrolling region, `cq-card` for surfaces, `cq-btn` with a modifier for actions, `cq-hd` for headers, `cq-tabs` for navigation, `cq-empty` for empty states, `cq-safe` for the parent safety banner, `cq-badge` for status.
>
> Rules that must hold. Every scrolling region uses `cq-scroll` so content clears the fixed header and tab bar. Approve and reject never render as the same shape: approve is `cq-btn cq-btn--green`, reject is `cq-btn cq-btn--danger`. Every interactive target is at least 44px. Button labels are verbs in sentence case. No internal vocabulary in any user facing string: no guardian, no ULID, no state machine names. Every list has an empty state with art, one sentence and one action.
>
> Add one browser assertion per critical control that reads `getComputedStyle` rather than the DOM, to catch styles that fail to apply.

---

## 7. What the simulation got wrong, that the build got right

Listed so the simulation can be corrected rather than copied blindly. These are being fixed in the mockup.

1. Published projects show a parent-chosen display name, never a child's real name. The simulation shows real first names throughout.
2. Approval has two outcomes. The simulation only ever modelled approve, which removes the most educational moment in the loop.
3. Uploads are validated and can be refused before a parent sees them. The simulation has no concept of validation.
4. QR sign-in is a better answer for the youngest children than a typed name and PIN.
5. Takedown and reporting exist and should be visible in the parent area.
