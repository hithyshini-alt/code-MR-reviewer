# GitLab MR Reviewer (Frontend)

Basic React + TypeScript + MUI app to review GitLab Merge Request diff changes and post comments back to the MR.

## Features

- Paste a GitLab MR URL (example: `https://git.example.com/group/project/-/merge_requests/123`)
- Provide a GitLab Personal Access Token (`api` scope)
- Run rule-based checks on added diff lines:
  - No `sx` prop usage
  - No deprecated HTML tags
  - Optional chaining must be used
- Edit the comment text for each rule
- Post findings back to the Merge Request as GitLab notes

## Run locally

```bash
npm install
npm run dev
```

## Important notes

- This is a frontend-only prototype; the token is used directly from the browser.
- Your GitLab server must allow API access from your app origin (CORS).
- Comments are posted as MR notes (not inline line comments).
