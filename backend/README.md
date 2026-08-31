# MR Reviewer Backend

This is the Express + Prisma API for the MR Reviewer application. It handles authentication, encrypted credential storage, rule management, review tracking, and the GitLab-related workflow used by the frontend.

## Tech Stack

- Node.js 18+
- TypeScript
- Express 5
- Prisma ORM
- PostgreSQL
- JWT for auth
- AES-256-GCM for credential encryption
- Zod for request validation

## Project Goals

The backend provides a secure API for:

- registering and logging in users
- storing user-specific GitLab and AI credentials securely
- saving custom review rules
- tracking MR review runs and findings
- exposing a REST API consumed by the React frontend

## Folder Structure

```text
backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── config/
│   │   ├── crypto.ts
│   │   ├── db.ts
│   │   └── env.ts
│   ├── middleware/
│   │   └── auth.ts
│   ├── modules/
│   │   ├── auth/
│   │   ├── credentials/
│   │   ├── findings/
│   │   ├── reviews/
│   │   └── rules/
│   └── index.ts
├── .env.example
├── package.json
└── prisma.config.ts
```

## Prerequisites

Before running the backend, make sure you have:

- PostgreSQL installed and running locally or on a reachable server
- Node.js 18 or newer
- npm
- a database created for the project

## Environment Variables

Copy [.env.example](.env.example) to `.env` and fill in the values.

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mrreview"
JWT_SECRET="replace-with-a-long-random-secret-at-least-32-characters"
ENCRYPTION_KEY="64-character-hex-key"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

### Variable descriptions

- `DATABASE_URL`: PostgreSQL connection string used by Prisma.
- `JWT_SECRET`: Secret used to sign user JWTs. It should be long and random.
- `ENCRYPTION_KEY`: 64-character hex string used for AES-256-GCM encryption of stored API keys and PATs.
- `PORT`: Port for the backend API server.
- `FRONTEND_URL`: Allowed CORS origin for the frontend app.

## Installation

From the project root:

```bash
cd backend
npm install
```

## Database Setup

Generate Prisma client and run database migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

If this is the first setup, Prisma will create the database schema defined in `prisma/schema.prisma`.

## Run the Application

Development mode:

```bash
npm run dev
```

Production-like mode:

```bash
npm start
```

The app listens on the `PORT` value from the environment and logs the URL when it starts.

## API Overview

The backend exposes REST routes under `/api`.

### Authentication

- `POST /api/auth/register` — create a new user account
- `POST /api/auth/login` — log in with email/username and password
- `GET /api/auth/me` — get the current user profile from the JWT

Example payload for registration:

```json
{
  "email": "user@example.com",
  "username": "demo_user",
  "password": "securePassword123"
}
```

Example payload for login:

```json
{
  "emailOrUsername": "user@example.com",
  "password": "securePassword123"
}
```

### Credentials

- `GET /api/credentials` — fetch stored GitLab / AI credentials
- `PUT /api/credentials` — upsert credentials
- `DELETE /api/credentials` — clear stored credentials

This endpoint requires authentication.

Credentials are encrypted before storage using the `ENCRYPTION_KEY` and decrypted only when needed.

### Rules

- `GET /api/rules` — list user rules
- `POST /api/rules` — create a rule
- `PATCH /api/rules/:id` — update a rule
- `DELETE /api/rules/:id` — delete a rule

Rules are user-scoped and can be used by the reviewer workflow.

### Reviews

- `GET /api/reviews` — list review runs for the user
- `POST /api/reviews` — create a review run record

### Findings

- `GET /api/findings` — fetch findings for the authenticated user
- `POST /api/findings` — create findings associated with a review run

The exact shape depends on the frontend’s reviewer logic and the rule engine.

### Health Check

- `GET /api/health` — returns status info for uptime checks

## Database Model

The Prisma schema includes core entities:

- `User`
- `UserCredential`
- `Rule`
- `ReviewRun`
- `Finding`
- `PostedComment`

The app stores user state, rule definitions, credential metadata, and MR review results in PostgreSQL.

## Security Notes

- JWT auth is required for most routes.
- Sensitive values like PATs and AI keys are encrypted before persisting.
- CORS is restricted to the configured frontend origin.
- Passwords are hashed with `bcryptjs` before storage.

## Common Troubleshooting

### Prisma client not generated

```bash
npx prisma generate
```

### Database connection issue

Check the `DATABASE_URL` and confirm PostgreSQL is running.

### Invalid env variables

Make sure `.env` exists and contains all required fields, especially:

- `DATABASE_URL`
- `JWT_SECRET`
- `ENCRYPTION_KEY`

### CORS issues

Ensure `FRONTEND_URL` matches your local frontend origin, typically:

```env
FRONTEND_URL="http://localhost:5173"
```

## Useful Commands

```bash
npm run dev
npm start
npx prisma generate
npx prisma migrate dev
npx prisma studio
```

## Notes

This backend is designed to support the browser-based review experience in the frontend and is intended to run alongside the Vite app during local development.
