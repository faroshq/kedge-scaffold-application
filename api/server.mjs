// Backend tier of the kedge application scaffold.
//
// The platform contract (do not break these):
//   * Listen on process.env.PORT, bound to 0.0.0.0 — the platform routes
//     /api/* here and the path prefix is preserved.
//   * The database connection comes ONLY from process.env.DATABASE_URL.
//     The in-cluster Postgres has TLS disabled and the URI carries no
//     sslmode, so ssl stays off.
//   * Postgres boots alongside this process — retry the first connection
//     instead of exiting.
//   * Schema setup is idempotent and runs on startup.
//   * /api/health must keep answering; the platform and CI probe it.
import express from 'express'
import pg from 'pg'

const port = Number(process.env.PORT || 8080)
const databaseUrl = process.env.DATABASE_URL || ''

const app = express()
app.use(express.json())

let pool = null
let dbReady = false

async function connectWithRetry() {
  if (!databaseUrl) {
    console.log('[api] DATABASE_URL not set — running without a database')
    return
  }
  pool = new pg.Pool({ connectionString: databaseUrl, ssl: false, max: 5 })
  for (;;) {
    try {
      await pool.query('select 1')
      break
    } catch (err) {
      console.log(`[api] waiting for postgres: ${err.message}`)
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }
  await pool.query(`create table if not exists messages (
    id serial primary key,
    body text not null,
    created_at timestamptz not null default now()
  )`)
  dbReady = true
  console.log('[api] database ready')
}

app.get('/api/health', async (_req, res) => {
  if (!pool) {
    res.json({ ok: true, database: 'not configured' })
    return
  }
  try {
    await pool.query('select 1')
    res.json({ ok: true, database: 'ok' })
  } catch (err) {
    res.status(503).json({ ok: false, database: err.message })
  }
})

app.get('/api/hello', async (_req, res) => {
  let database = 'not configured'
  if (dbReady) {
    const { rows } = await pool.query('select version()')
    database = rows[0].version
  }
  res.json({ message: 'Hello from the kedge application scaffold', database })
})

app.get('/api/messages', async (_req, res) => {
  if (!dbReady) {
    res.status(503).json({ error: 'database not ready' })
    return
  }
  const { rows } = await pool.query(
    'select id, body, created_at from messages order by id desc limit 50'
  )
  res.json(rows)
})

app.post('/api/messages', async (req, res) => {
  if (!dbReady) {
    res.status(503).json({ error: 'database not ready' })
    return
  }
  const body = typeof req.body?.body === 'string' ? req.body.body.trim() : ''
  if (!body) {
    res.status(400).json({ error: 'body is required' })
    return
  }
  const { rows } = await pool.query(
    'insert into messages (body) values ($1) returning id, body, created_at',
    [body]
  )
  res.status(201).json(rows[0])
})

app.listen(port, '0.0.0.0', () => {
  console.log(`[api] listening on 0.0.0.0:${port}`)
})

connectWithRetry()
