# CodeQuest design system instructions

Rules for working on the CodeQuest frontends. These exist because each one has already cost a debugging session somewhere.

## The stylesheet

`codequest-design-system.css` is the single source of truth for visual design.

- Import it **once, globally**, in a layout. Never inside a component scoped `<style>` block.
- Reason: Astro adds its scoping attribute at build time to elements present in the template. Elements built at runtime with `createElement` never receive it, so scoped rules do not apply and the element renders unstyled. From the DOM, an unapplied rule and an unwritten rule look identical, so tests that read attributes cannot catch it.
- Do not add new colours, radii or shadows. If something is missing, add a token to the stylesheet rather than a one off value in a component.

## Class vocabulary

Build from these rather than inventing new ones.

| Need | Class |
|---|---|
| Scrolling region of a screen | `cq-scroll` |
| Raised surface | `cq-card`, plus `cq-card--row` for icon and text side by side |
| Leading icon chip | `cq-icon` plus a tint, `cq-icon--teal` and so on |
| Action | `cq-btn` plus a modifier |
| Screen header | `cq-hd`, with `cq-hd-btn` for back and icon buttons |
| Bottom navigation | `cq-tabs`, active item gets `is-on` |
| Progress | `cq-progress`, or `cq-stars` for milestone counts |
| Project or game tile | `cq-tile`, plus `cq-tile--mine` for the user's own |
| Status pill | `cq-badge`, plus `--pending` or `--changes` |
| Parent safety banner | `cq-safe` |
| Approval row | `cq-appr` |
| Toggle | `cq-sw`, on state is `is-on` |
| Bottom sheet | `cq-sheet` with `cq-sheet__body`, open state `is-open` |
| Transient message | `cq-toast`, visible state `is-on` |
| First visit hint | `cq-tip` |
| Empty list | `cq-empty` |

## Hard rules

**Chrome geometry.** Every scrolling region uses `cq-scroll`. The header and tab bar are fixed and overlap content otherwise. Heights live in `--cq-header-h`, `--cq-tabbar-h`, `--cq-scroll-top`, `--cq-scroll-bottom`. If chrome height changes, change the token, never individual screens.

**Approve and reject are never the same shape.** Approve is `cq-btn cq-btn--green`, reject is `cq-btn cq-btn--danger`, which is outlined rather than filled. They must stay distinguishable if the stylesheet fails to load entirely, so never rely on colour alone.

**Green means safe or approved, and nothing else.** Do not use it for general emphasis. Parents learn the colour in one session and that only works if it is exclusive.

**Touch targets are at least 44px.** Users are as young as six.

**Status text flips white on dark backgrounds.** Any screen with a dark backdrop behind the status bar needs light status text. Dark on dark is the most common contrast failure in this layout.

## Language rules

The audience is a child of about seven and a parent who is not technical. Both bounced off invented vocabulary in testing.

- Only words a seven year old and a first time parent already own: home, make, games, videos, levels, share, parent, grown-up.
- **Never render internal vocabulary in a user facing string.** No guardian, no ULID, no bucket names, no state machine names. Guardian is fine as a subdomain or a table; on screen it is parent or grown-up.
- Buttons are verbs in sentence case: "Keep making my game", "Share my game", "Look and approve". Never all caps. Never a bare noun.
- Say what happens next: "Your parent checks it first. Then it goes up."
- Error and empty copy never blames the user. A mistyped address gets "We could not find that page", not "Access Denied".

## Every list needs an empty state

Never render a bare empty list. Use `cq-empty` with art, one sentence, and one action. This applies to the gallery before the first project, the parent queue with nothing waiting, and a child's first sign in.

Suggested copy for the parent queue: "Nothing waiting. When your child shares a game, it comes to you first."

## Testing

Add at least one assertion per critical control that reads computed style rather than the DOM:

```js
const s = getComputedStyle(approveBtn);
expect(s.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
expect(s.backgroundColor).not.toBe(getComputedStyle(rejectBtn).backgroundColor);
```

DOM assertions cannot distinguish a rule that failed to apply from a rule that was never written. Computed style can.

Walk the app in a real browser before calling any milestone done, and record findings rather than fixing them mid walk.

## Media assets

`media-manifest.json` lists everything available, and `sync-media.sh` moves it into S3. The avatars are real children's faces: keep them behind authentication unless per child consent is recorded, and do not use them in external marketing without asking.
