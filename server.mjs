import http from 'node:http'
import path from 'node:path'
import sirv from 'sirv'

const port = Number.parseInt(process.env.PORT || '4173', 10)
const distDir = path.join(process.cwd(), 'packages', 'web', 'dist')

const serve = sirv(distDir, {
  single: true,
  etag: true,
  maxAge: 31536000,
  immutable: true,
  setHeaders(res, servedPath) {
    // Never cache the HTML shell; it must always pick up the newest asset hashes.
    if (servedPath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store')
    }
  },
})

const server = http.createServer((req, res) => {
  serve(req, res)
})

server.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`[web] serving ${distDir} on :${port}`)
})
