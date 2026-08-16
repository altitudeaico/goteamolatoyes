# 0002 · Corpus in git, live data in Supabase

**Date:** 16 August 2026
**Status:** decided

## The question

Where does the record of this project live?

## Decision

**Narrative, decisions, events, quotes and the index of builds live in git**, in this directory. Versioned, diffable, readable without credentials, consumable by any AI without a key, and free.

**Live application data lives in Supabase**: accounts, XP, submissions, anything an app writes or queries in real time.

## Why

A corpus in a database is harder to read, harder to review, and needs credentials to reach, which means in practice nobody reads it. A corpus in git gets provenance for free, because the commit history is the audit trail.

The failure mode this avoids is a corpus nobody can open.

## Consequence

Anything that needs querying rather than reading is a candidate for a Supabase table, and `artifacts/builds.json` is the first thing that might graduate, if a gallery ever needs to query it. Until something needs a query, it stays a file.
