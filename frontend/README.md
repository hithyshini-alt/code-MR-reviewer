# MR Reviewer Frontend

This is the React + TypeScript frontend for the MR Reviewer application. It provides the UI for signing in, storing GitLab and AI credentials, managing review rules, reviewing Merge Requests, and submitting findings back to GitLab.

## Tech Stack

- React 19
- TypeScript
- Vite
- MUI (Material UI)
- Emotion
- Fetch API for REST calls

## Features

- user registration and login flow
- persistent session with JWT token storage in localStorage
- GitLab MR URL input and review flow
- custom rule configuration UI
- credential management for GitLab PAT and AI API key
- review history and summary views
- GitLab integration for MR comment posting workflows

## Project Structure

```text
frontend/
├── public/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   ├── main.tsx
│   ├── theme.ts
│   └── index.css
├── .env.example
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── eslint.config.js
└── README.md
```

## Prerequisites

- Node.js 18+
- npm
- the backend running locally on port 3001

## Environment Variables

Create a `.env` file in the `frontend` folder using the example below:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### Variable description

- `VITE_API_BASE_URL`: Base URL for the backend REST API. If omitted, the app falls back to `http://localhost:3001/api`.

## Installation

From the project root:

```bash
cd frontend
npm install
```

## Run the App

Development mode:

```bash
npm run dev
```

The Vite app usually runs at:

```text
http://localhost:5173
```

## Production Build

```bash
npm run build
```

To preview the built app:

```bash
npm run preview
```

## How the Frontend Connects to the Backend

The frontend services in `src/services/` call the backend API using `VITE_API_BASE_URL`:

- `auth.ts` for register/login/me
- `credentials.ts` for managing stored credentials
- `rules.ts` for rule CRUD operations
- `gitlab.ts` for GitLab-related MR API calls

Each request uses the JSON fetch wrapper and attaches the Authorization header when needed.

## Authentication Flow

1. User registers or logs in.
2. The backend responds with a JWT token.
3. The frontend stores the token in localStorage.
4. The app calls `/auth/me` on startup to restore the session.

## Notes

- The app expects the backend to be available and CORS-enabled.
- Sensitive credentials are stored on the backend and encrypted before persistence.
- Local development usually uses the frontend on port 5173 and the backend on port 3001.

## Useful Commands

```bash
npm run dev
npm run build
npm run lint
npm run preview
```
