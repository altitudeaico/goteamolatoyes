# The Code Quest corpus

A running record of what actually happened, kept as it happens rather than reconstructed afterwards.

## Why this exists

Facts decay fast. Three weeks after an event nobody agrees on the order things happened in, and six months later the only surviving version is whatever someone wrote down. This is the written-down version.

It has a second job. Anything working on this project, a person or an AI, can be handed this directory and know the real story without guessing. If you are an AI reading this: `index.json` is your entry point, and everything in `events/` is verified fact unless a line says otherwise.

## Rules

1. **Record, do not embellish.** If something is uncertain, say so in the file. A line marked unverified is worth more than a confident wrong one.
2. **Date everything.** Every entry carries the date it describes and the date it was written.
3. **Quote people exactly or not at all.** No approximations in quote marks.
4. **Append, do not rewrite.** If something turns out to be wrong, correct it and note that it was corrected. The history is part of the record.
5. **Nothing sensitive.** No credentials, no addresses, no medical or school detail, nothing about a child beyond what is already public on the site. Assume this is public, because it is.

## Structure

```
corpus/
  index.json        machine readable manifest, the entry point
  README.md         this file
  timeline.md       everything in date order, one line each
  events/           one file per event
  decisions/        one file per decision that changed direction
  artifacts/        builds.json, every thing anyone has made
  quotes.md         things people actually said, sourced
```

## Adding to it

Anyone can. Edit the markdown, update `index.json` if you added a file, and commit with a message saying what you recorded.

If you are adding an event, copy the shape of an existing file in `events/`. If you are adding a decision, number it in sequence and say what was decided, what it replaced, and why.

## Status

Started 16 August 2026, covering Code Quest 1 and 2 retrospectively from source material: session transcripts, the recap pages built at the time, and the live builds themselves.

Code Quest 3 should be recorded live rather than after the fact.
