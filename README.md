# kedge-scaffold-application

The starter project for the [kedge](https://github.com/faroshq/kedge)
`application` template: a working frontend + backend + PostgreSQL hello-world
that new App Studio projects begin from, and whose published images are the
template's one-click demo.

- `web/` — Vite + React frontend, served at `/`. Calls the backend
  **same-origin** at `/api/*`.
- `api/` — Express backend, served at `/api/*`. Connects to Postgres via the
  platform-injected `DATABASE_URL`, retries until the database is up, creates
  its schema idempotently, and answers `/api/health`.

Both tiers read `process.env.PORT` and bind `0.0.0.0`. The full platform
contract lives in [AGENTS.md](AGENTS.md) — read it before changing anything.

## Run locally

```sh
# terminal 1 — backend (any reachable Postgres; optional)
cd api && npm install
PORT=8081 DATABASE_URL=postgres://appuser:pw@localhost:5432/appdb npm run dev

# terminal 2 — frontend (proxies /api to :8081 locally)
cd web && npm install
npm run dev
```

Without `DATABASE_URL` the API runs with the database features disabled.

## Run on kedge

- **One click:** provision the `application` template with its sample values —
  they point at this repository's published images.
- **App Studio:** new projects on the `application` template start from this
  source (development mode, hot reload via `dev_sync`).
- **Production:** images are built by Railpack from `web/` and `api/` — no
  Dockerfiles here, and none needed.

## Images & releases

CI ([build.yaml](.github/workflows/build.yaml)) smoke-tests both tiers
(including a real Postgres for the API), then builds and pushes Railpack
images:

- `ghcr.io/faroshq/kedge-scaffold-application/web`
- `ghcr.io/faroshq/kedge-scaffold-application/api`

tagged `latest` + `sha-<commit>` on `main`, and `<tag>` for git tags
(`v0.1.0`, …). The kedge template pins a **tag** — changing this scaffold does
nothing to the platform until a new tag is cut **and** the template's
`development.scaffold.ref` / sample image tags are bumped to match.

## License

Apache-2.0.
