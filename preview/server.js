// Preview-only front server. Serves a deterministic stand-in for the
// geo.ipify.org "country,city" endpoint under /ipify-mock and proxies every
// other request (including the dev-server websocket) to the CRA dev server.
// Not used by the application itself; enable it with
// REACT_APP_IPIFY_BASE_URL=/ipify-mock.
const http = require("http")
const net = require("net")

const PORT = Number(process.env.PREVIEW_PORT || 3000)
const TARGET_HOST = process.env.PREVIEW_TARGET_HOST || "127.0.0.1"
const TARGET_PORT = Number(process.env.PREVIEW_TARGET_PORT || 3001)
const MOCK_PREFIX = "/ipify-mock"

const PLACES = [
  { country: "US", region: "California", city: "Mountain View", lat: 37.38605, lng: -122.08385, postalCode: "94035", timezone: "-07:00", isp: "Google LLC" },
  { country: "US", region: "New York", city: "Brooklyn", lat: 40.65010, lng: -73.94958, postalCode: "11201", timezone: "-04:00", isp: "Example Cable Co." },
  { country: "GB", region: "England", city: "London", lat: 51.50853, lng: -0.12574, postalCode: "EC1A", timezone: "+01:00", isp: "Example Broadband Ltd" },
  { country: "DE", region: "Berlin", city: "Berlin", lat: 52.52437, lng: 13.41053, postalCode: "10115", timezone: "+02:00", isp: "Example Telekom AG" },
  { country: "JP", region: "Tokyo", city: "Tokyo", lat: 35.6895, lng: 139.69171, postalCode: "100-0001", timezone: "+09:00", isp: "Example Net KK" },
  { country: "AU", region: "New South Wales", city: "Sydney", lat: -33.86785, lng: 151.20732, postalCode: "2000", timezone: "+11:00", isp: "Example Telecom Pty" },
  { country: "BR", region: "Sao Paulo", city: "Sao Paulo", lat: -23.5475, lng: -46.63611, postalCode: "01000-000", timezone: "-03:00", isp: "Example Telecom SA" },
]

const FIXED = {
  "192.212.174.101": { country: "US", region: "California", city: "South San Gabriel", lat: 34.04915, lng: -118.09462, postalCode: "", timezone: "-07:00", isp: "Southern California Edison" },
  "8.8.8.8": PLACES[0],
}

function isIp(value) {
  return net.isIP(value) !== 0
}

function lookup(ip) {
  if (FIXED[ip]) return FIXED[ip]
  let hash = 0
  for (const ch of ip) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return PLACES[hash % PLACES.length]
}

function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json", "access-control-allow-origin": "*" })
  res.end(JSON.stringify(body))
}

function handleMock(req, res, url) {
  if (url.pathname !== `${MOCK_PREFIX}/api/v2/country,city`) {
    return sendJson(res, 404, { code: 404, messages: "Not found" })
  }
  const ip = (url.searchParams.get("ipAddress") || "").trim() || "192.212.174.101"
  if (!isIp(ip)) {
    return sendJson(res, 422, { code: 422, messages: "Input correct IPv4 or IPv6 address." })
  }
  const { isp, ...location } = lookup(ip)
  sendJson(res, 200, {
    ip,
    location: { ...location, geonameId: 0 },
    domains: [],
    as: { asn: 0, name: isp, route: "", domain: "", type: "" },
    isp,
  })
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://preview.local")
  if (url.pathname.startsWith(MOCK_PREFIX)) return handleMock(req, res, url)
  const upstream = http.request(
    { host: TARGET_HOST, port: TARGET_PORT, method: req.method, path: req.url, headers: req.headers },
    (up) => {
      res.writeHead(up.statusCode, up.headers)
      up.pipe(res)
    }
  )
  upstream.on("error", () => {
    if (!res.headersSent) res.writeHead(502, { "content-type": "text/plain" })
    res.end("Dev server is starting, retry shortly.")
  })
  req.pipe(upstream)
})

server.on("upgrade", (req, socket, head) => {
  const upstream = net.connect(TARGET_PORT, TARGET_HOST, () => {
    let raw = `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`
    for (let i = 0; i < req.rawHeaders.length; i += 2) raw += `${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}\r\n`
    upstream.write(raw + "\r\n")
    if (head && head.length) upstream.write(head)
    upstream.pipe(socket)
    socket.pipe(upstream)
  })
  upstream.on("error", () => socket.destroy())
  socket.on("error", () => upstream.destroy())
})

server.listen(PORT, "0.0.0.0", () => {
  console.log(`preview server on :${PORT} -> ${TARGET_HOST}:${TARGET_PORT}, ipify stand-in at ${MOCK_PREFIX}`)
})
