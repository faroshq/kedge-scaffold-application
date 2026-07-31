import { useCallback, useEffect, useState } from 'react'

// All backend calls are same-origin under /api/* — never an absolute URL.
// The platform routes /api/* to the backend tier on the same public host.
export default function App() {
  const [hello, setHello] = useState(null)
  const [health, setHealth] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const [helloRes, healthRes, messagesRes] = await Promise.all([
        fetch('/api/hello'),
        fetch('/api/health'),
        fetch('/api/messages'),
      ])
      setHello(await helloRes.json())
      setHealth(await healthRes.json())
      setMessages(messagesRes.ok ? await messagesRes.json() : [])
      setError(null)
    } catch (err) {
      setError(String(err))
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function submit(event) {
    event.preventDefault()
    const body = draft.trim()
    if (!body) return
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body }),
    })
    setDraft('')
    refresh()
  }

  return (
    <main className="shell">
      <h1>It runs.</h1>
      <p className="subtitle">
        This is the <strong>kedge application scaffold</strong> — a working
        frontend + backend + Postgres. Replace it with your app.
      </p>

      {error && <p className="error">API unreachable: {error}</p>}

      <section className="card">
        <h2>Backend says</h2>
        <p>{hello ? hello.message : 'loading…'}</p>
        {hello && <p className="fineprint">{hello.database}</p>}
        <p className="fineprint">
          health: {health ? (health.ok ? `ok (db ${health.database})` : 'degraded') : '…'}
        </p>
      </section>

      <section className="card">
        <h2>Messages (stored in Postgres)</h2>
        <form onSubmit={submit}>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write something…"
          />
          <button type="submit">Save</button>
        </form>
        <ul>
          {messages.map((message) => (
            <li key={message.id}>{message.body}</li>
          ))}
          {messages.length === 0 && <li className="fineprint">nothing yet</li>}
        </ul>
      </section>
    </main>
  )
}
