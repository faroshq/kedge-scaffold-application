// Production static server for the built frontend (dist/). Used by the
// `start` script, which is what the Railpack-built image runs; `vite build`
// runs during the image build. Keep it dependency-free.
//
// Platform contract: bind 0.0.0.0 on process.env.PORT. The platform serves
// this tier at / and routes /api/* to the backend before traffic gets here.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('./dist', import.meta.url))
const port = Number(process.env.PORT || 8080)

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost')
    let file = normalize(join(root, url.pathname))
    if (!file.startsWith(root + sep) && file !== root) file = join(root, 'index.html')
    let stats = await stat(file).catch(() => null)
    if (stats?.isDirectory()) {
      file = join(file, 'index.html')
      stats = await stat(file).catch(() => null)
    }
    if (!stats) file = join(root, 'index.html') // SPA fallback
    const body = await readFile(file)
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(500, { 'content-type': 'text/plain' })
    res.end('server error')
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`[web] serving dist/ on 0.0.0.0:${port}`)
})
