# CodeQuest handoff package

For Gbenga, from Bolaji. Everything in here is optional. Take what saves you time on M14 and bin the rest, because you know the constraints of the real system and this package does not.

Generated 11 August 2026 from the product simulation at
`https://altitudeaico.github.io/goteamolatoyes/codequest/app/`

---

## What is in the box

| File | What it is |
|---|---|
| `codequest-design-system.css` | The whole visual system as plain global CSS. Tokens plus ready made components |
| `DESIGN_HANDOFF.md` | The reasoning: colour, type, geometry, language rules, UX patterns, screen inventory |
| `CLAUDE.md` | Drop this in your repo root. Instructions for Claude Code so it uses the system correctly |
| `media-manifest.json` | Every image and video we hold, grouped, with sizes and notes |
| `sync-media.sh` | Pulls that media from our host and pushes it into an S3 bucket you control |
| `avatars/` | Seven transparent PNG character cutouts, one per child |

---

## Three minute version

```bash
# 1. see what media exists, transfer nothing
./sync-media.sh --bucket YOUR_BUCKET --dry-run

# 2. take the brand marks and the avatars, which is all the MVP needs
./sync-media.sh --bucket YOUR_BUCKET --groups brand,avatars

# 3. put the stylesheet in your layout, once, globally
cp codequest-design-system.css src/styles/

# 4. give the coding agent its instructions
cp CLAUDE.md /path/to/codequest-repo/CLAUDE.md
```

Then read `DESIGN_HANDOFF.md` when you want the reasoning behind any of it.

---

## The one thing to read before using the CSS

Ship it as a **global** stylesheet, never inside a component scoped `<style>` block.

Astro attaches its scoping attribute at build time to elements that exist in the template. Elements created at runtime with `createElement` never get that attribute, so scoped rules silently do not apply to them. That is the failure mode you already found, where approve and reject rendered as identical grey buttons and no DOM reading test could see it.

Every class in this stylesheet is a plain global class, so a runtime created element is styled the moment it receives a class name.

In Astro, either of these is fine:

```astro
---
import '../styles/codequest-design-system.css';
---
```

```astro
<style is:global>
  @import '../styles/codequest-design-system.css';
</style>
```

---

## About the media

The manifest groups everything by how useful it is to you:

- **brand** and **avatars** are the two groups worth taking now. Crest, social card, the group shot of the seven kids, and seven transparent character cutouts. About 3.5 MB in total
- **transformations** are the per child films from the event. Nice later, not needed for the MVP loop
- **clips** are real kid made content, including Elsie fronting her own studio unprompted a week after the event. Good seed data if you ever demo a feed
- **event_footage** is raw day footage as 360p review proxies. Only take it if you want the raw material. Full quality masters are held separately and are not on the public host

Total across every group is about 128 MB. The default groups are about 3.5 MB.

**Consent matters more than convenience here.** These are real children's faces, and image consent is held per household rather than centrally. Use them inside CodeQuest surfaces. Ask Bolaji before anything external or public facing, and prefer keeping faces behind authentication until per child consent is a thing the product actually records.

---

## Script requirements

`curl`, `python3` and the `aws` cli. No jq needed. Run it from this directory so it can find the manifest.

Re-running is safe. Existing keys are overwritten. Uploads set a sensible content type and a long immutable cache header, which suits content addressed asset paths. If you serve these under a path that can change, drop the cache-control line.

Two behaviours worth knowing: it downloads to a temp directory and checks each file is non-empty before uploading, so a half fetched video never lands in your bucket; and `--dry-run` needs no AWS credentials at all, so it is safe to run first.

---

## What this package deliberately does not contain

No strategy, no pitch material, no business model documents. Those are still being worked through and are not settled enough to hand anyone. This is design and assets only.
