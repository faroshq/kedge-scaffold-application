# Rules for coding agents working in this repository

This project runs on the kedge `application` template: one public URL, the
frontend served at `/`, the backend at `/api/*`, and a managed PostgreSQL
database. These rules are the platform contract — code that breaks them will
not run, however correct it looks.

## Layout (fixed)

- `web/` — the frontend. Vite-based, Node.js. Built to static files in
  production.
- `api/` — the backend. Node.js HTTP server.

All source lives under one of these two directories. Files outside them are
not part of any component and never reach the runtime.

## Networking

1. **Read the port from `process.env.PORT` and bind `0.0.0.0`.** Never
   hardcode a port number in server code, and never bind `127.0.0.1`.
2. **The browser calls the backend at `/api/*` on the same origin** —
   `fetch('/api/items')`. There is no separate backend host. Never write an
   absolute backend URL (no `http://localhost:…`, no environment hostname) —
   it will break in production even if it appears to work in a preview.
3. The backend receives paths with the `/api` prefix intact (`/api/items`,
   not `/items`). Keep all routes under `/api/`.
4. Keep `/api/health` working — the platform and CI probe it.

## Database

5. **Connect only via `process.env.DATABASE_URL`.** Never construct a DSN,
   never read Kubernetes Secrets, never store credentials in code or env
   maps. The URI has no `sslmode` and the in-cluster Postgres has TLS
   disabled — keep `ssl: false`.
6. Postgres may boot after the backend: **retry the initial connection**,
   don't exit.
7. Schema changes run on startup and must be **idempotent**
   (`create table if not exists …`).

## Scripts (both `web/package.json` and `api/package.json`)

8. Keep **both** `dev` and `start` working at all times:
   - `dev` is what the development sandbox runs (hot reload).
   - `start` is what the production image runs. `web`'s `start` serves the
     `vite build` output; `api`'s runs the server directly.
9. Do not add a Dockerfile — production images are built by Railpack from
   these directories. Do not create Kubernetes Services, Ingresses, routes,
   or manifests — the platform provisions all of that.

## Development sandbox

10. The sandbox runs **Node.js only** — no Go, Python, Ruby, Java, or .NET.
    Adding source in another language will silently never run.
