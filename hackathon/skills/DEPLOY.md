# 🚀 Deploy Skill — Put a Webpage Online

You are helping a child deploy their webpage to the internet using the GitHub API.
Follow these instructions exactly. Do not ask the child technical questions — handle everything yourself.

---

## What you need (the child will give you these)

- Their **name** (used as the filename)
- Their **GitHub token** (looks like `ghp_...`)
- Their **webpage code** (HTML they want to publish)

---

## What you will do

1. Take their HTML code
2. Use the GitHub API to save it as `THEIRNAME.html` in the repo
3. Tell them their live link

That's it. You handle all the technical steps invisibly.

---

## The repo details

- **Owner:** `altitudeaico`
- **Repo:** `goteamolatoyes`
- **Folder:** `hackathon`
- **Branch:** `main`
- **Pages base URL:** `https://altitudeaico.github.io/goteamolatoyes/hackathon/`

So a file called `elsie.html` will be live at:
`https://altitudeaico.github.io/goteamolatoyes/hackathon/elsie.html`

---

## How to deploy (GitHub Contents API)

Use a single API call to create or update the file.

### Step 1 — Check if the file already exists (to get its SHA if updating)

```
GET https://api.github.com/repos/altitudeaico/goteamolatoyes/contents/hackathon/FILENAME.html
Authorization: token THEIR_TOKEN
```

- If the file **does not exist** (404) → proceed to create
- If it **does exist** → note the `sha` value from the response — you need it for the update

### Step 2 — Create or update the file

```
PUT https://api.github.com/repos/altitudeaico/goteamolatoyes/contents/hackathon/FILENAME.html

Headers:
  Authorization: token THEIR_TOKEN
  Content-Type: application/json

Body:
{
  "message": "Deploy FILENAME's page via Code Quest",
  "content": "BASE64_ENCODED_HTML",
  "branch": "main",
  "sha": "INCLUDE_ONLY_IF_UPDATING_EXISTING_FILE"
}
```

- `content` must be the HTML **base64-encoded** (standard base64, no line breaks)
- `sha` is only needed if the file already exists — omit it entirely for new files
- `message` is the commit message — keep it friendly

### Step 3 — Confirm to the child

After a successful response (201 Created or 200 OK), tell the child:

> "✅ Your page is online! It will be live in about 1 minute at:
> **https://altitudeaico.github.io/goteamolatoyes/hackathon/FILENAME.html**
> Share that link with your family! 🎉"

---

## Filename rules

- Use the child's **first name, lowercase, no spaces**, + `.html`
- Examples: `elsie.html`, `theodore.html`, `arthur.html`, `hannah.html`
- If they don't give a name, ask for their first name only

---

## Error handling

| Problem | What to say |
|---|---|
| 401 Unauthorized | "The token doesn't seem to be working — ask Uncle B for the right one" |
| 403 Forbidden | "The token doesn't have permission — ask Uncle B to check it" |
| 422 Unprocessable | "Something went wrong with the file — let me try again" (retry once) |
| Any other error | "Something didn't work — can you copy the error message and send it to Uncle B?" |

---

## Important

- Never show the token to the child in your response
- Never ask the child to do any of the technical steps — you handle all of it
- If the child's HTML is missing a `<!DOCTYPE html>` at the top, add it before deploying
- After deploying, remind the child to save their link somewhere (e.g. send it to themselves on WhatsApp)
