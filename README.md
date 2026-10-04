# HireTrack

HireTrack is a full-stack job application and interview tracker built with React, Express, MongoDB, and Mongoose.

## Requirements

- Node.js and npm
- MongoDB (local or hosted)

## Configuration

Copy `.env.example` to `.env` and set `MONGO_URI` and a strong, private `JWT_SECRET`.
For a non-default frontend URL, set `CLIENT_URL` in `.env`.
If Vite selects a different port because its default port is occupied, set `CLIENT_URL`
to the exact origin printed by Vite (for example, `http://localhost:5175`) and restart
the backend so CORS allows that frontend.

Copy `client/.env.example` to `client/.env` if the API is not available at
`http://localhost:5000/api`, then set `VITE_API_URL` to the API base URL.

Do not commit `.env` files or real secrets.

## Install and run

From the repository root:

```bash
npm install
npm --prefix client install
npm run dev
```

The frontend runs on Vite's development port (normally `http://localhost:5173`) and the API on port `5000` unless `PORT` is set.
MongoDB must be reachable before the backend starts.

## Available scripts

- `npm run dev` starts the frontend and backend together.
- `npm run dev:server` starts the backend with nodemon.
- `npm run dev:client` starts the Vite development server.
- `npm --prefix client run lint` runs the frontend linter.
- `npm --prefix client run build` builds the frontend for production.

## Features

- JWT authentication and protected routes
- Per-user application and interview tracking
- Application Kanban board
- Saved jobs with filtering, sorting, pagination, and deadline tracking
- Saved-job conversion to an application
- Interview scheduling and application linking
