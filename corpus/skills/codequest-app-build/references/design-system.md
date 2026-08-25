# Design system

Read this before writing any markup or CSS for a Code Quest team app. The system is locked. Do not introduce new colours, radii or font stacks.

## Tokens

```css
:root{
  --bg:#FBFBFD; --card:#FFFFFF; --ink:#1D1D1F; --mut:#86868B;
  --soft:#F1F1F4; --line:#E8E8ED;
  --teal:#0D9488; --indigo:#4F46E5; --amber:#B45309; --rose:#C2410C;
  --sh:0 2px 14px rgba(0,0,0,.04); --shl:0 10px 32px rgba(0,0,0,.09);
  --sans:'Inter',-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif;
}
```

Teal is the action colour and the "done" colour. Indigo is for explanatory asides. Rose is for recording and errors. Amber is for pending states. Body is capped at 720px and centred, with bottom padding that respects `env(safe-area-inset-bottom)`.

Mobile is the primary target. Everything must work with one thumb on a phone held in one hand.

## Type scale

- `h2` page titles: `clamp(28px,6.5vw,38px)`, weight 700, letter-spacing -.04em
- `.lede` standfirst: 16.5px, colour #6B6B70
- `.eyebrow` section label: 12px, uppercase, .1em tracking, muted
- `.card h3`: 17px weight 600
- `.card p`: 15px, muted, line-height 1.55
- Body copy never below 13px

Tap targets never below 44px. Inputs are 17px to stop iOS zooming on focus.

## Core components

**`.card`** — white, 1px `--line` border, 20px radius, 18px padding, 14px top margin, `--sh` shadow. The default container for anything that is a discrete thing: a meeting, an action, a decision, a review.

**`.card.isdone`** — a completed record. Background #F7FAF8, border #DCEBE2, muted heading. Reads as settled without disappearing.

**`.donenote`** — the audit trail inside a done card. Top border in #DCEBE2, a teal bold line ("✓ Done by Uncle Ayo", "✓ Agreed by Aunty Mai"), then the note in #5A5A60 at 14.5px.

**`.up`** — the upcoming item. Teal gradient, white text, 24px radius, `--shl`. Contains `.when` (uppercase relative label plus date), an `h3`, a `p`, and optionally a `.bring` pill on a translucent white background for things to bring. This is the only saturated block in the app; it earns attention because it is the answer to the question people opened the app with. Never use it for more than the genuinely imminent.

**`.btn`** — full width, 99px radius, 17px weight 600, 17px padding. `.teal` for the primary action, `.ghost` (soft grey) for secondary.

**`.linkbtn`** — a quiet underlined text button, muted, 13.5px. For reversals and anything you do not want people doing by accident.

**`.sheet`** — modal panel. 24px radius, 24px padding, max-width 420px, `--shl`, on a `rgba(0,0,0,.3)` scrim that fills the viewport with `display:grid;place-items:center`. Inside: `h3` at 20px/700, a muted `p` explaining why, a textarea, then `.row` with two equal buttons — ghost cancel on the left, teal confirm on the right.

**`.chip`** — pill, used for filters, attendee names and back links. `.chip.on` inverts to ink background.

**`.tabs`** — sticky segmented control on `--soft`, active tab white with shadow. Four tabs maximum; the labels are plain English, not nouns from the schema.

**`.empty`** — centred emoji, a bold line, and a sentence saying what will appear here and when.

**`.hiw`** — the explanatory aside, indigo on #F5F7FF. Always a `<details>` with a styled `summary`, never permanently open.

## Modal pattern

Build modals in JS, append to body, remove on dismiss. Always support three exits: cancel button, scrim click, and successful submit. Focus the textarea on open. Validate before closing — if the note is empty, toast and keep the sheet up rather than silently discarding.

```js
modal.addEventListener("click", function(e){
  if (e.target === modal) modal.remove();
});
```

## Building elements safely

Use `document.createElement` and `textContent` for anything a family member typed. String-concatenated `innerHTML` with user data breaks on apostrophes and is unsafe. Static chrome via `innerHTML` is fine; the moment a value comes from the database, switch to text nodes.

## Feedback

One toast component, 2.6 seconds, plain language. "Ticked off", "Back on the list", "Couldn't save that". Never surface a status code or an exception message to the family — log it to console and toast something human.
