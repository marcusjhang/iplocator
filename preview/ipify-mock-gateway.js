// Preview-only gateway: serves a deterministic stand-in for the IPify
// Geolocation API under /ipify-mock and proxies everything else (including
// the dev-server websocket) to the CRA dev server. Not used in production.
const http = require("http")
const net = require("net")
const httpProxy = require("http-proxy")

const PORT = Number(process.env.GATEWAY_PORT || 3000)
const TARGET = process.env.GATEWAY_TARGET || "http://127.0.0.1:3001"
const MOCK_PREFIX = "/ipify-mock"

const LOCATIONS = [
  { country: "US", region: "California", city: "Mountain View", lat: 37.40599, lng: -122.078514, postalCode: "94043", timezone: "-07:00", isp: "Google LLC" },
  { country: "US", region: "New York", city: "Brooklyn", lat: 40.65, lng: -73.95, postalCode: "11201", timezone: "-04:00", isp: "SpaceX Starlink" },
  { country: "GB", region: "England", city: "London", lat: 51.50853, lng: -0.12574, postalCode: "EC1A", timezone: "+01:00", isp: "British Telecommunications PLC" },
  { country: "DE", region: "Hesse", city: "Frankfurt am Main", lat: 50.11552, lng: 8.68417, postalCode: "60311", timezone: "+02:00", isp: "Deutsche Telekom AG" },
  { country: "JP", region: "Tokyo", city: "Tokyo", lat: 35.6895, lng: 139.69171, postalCode: "100-0001", timezone: "+09:00", isp: "NTT Communications" },
  { country: "AU", region: "New South Wales", city: "Sydney", lat: -33.86785, lng: 151.20732, postalCode: "2000", timezone: "+11:00", isp: "Cloudflare, Inc." },
  { country: "BR", region: "Sao Paulo", city: "Sao Paulo", lat: -23.5475, lng: -46.63611, postalCode: "01000-000", timezone: "-03:00", isp: "Claro S.A." },
]

const isIp = (value) => net.isIP(value) !== 0

function lookup(ip) {
  let hash = 0
  for (const ch of ip) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  const { isp, ...location } = LOCATIONS[hash % LOCATIONS.length]
  return { ip, location, isp, as: { asn: 15169 + (hash % 1000), name: isp.toUpperCase(), route: `${ip}/24`, domain: "", type: "Content" } }
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" })
  res.end(JSON.stringify(body))
}

const proxy = httpProxy.createProxyServer({ target: TARGET, ws: true })
proxy.on("error", (err, req, res) => {
  if (res && res.writeHead && !res.headersSent) {
    res.writeHead(502, { "Content-Type": "text/plain" })
    res.end(`Dev server not ready: ${err.message}`)
  } else if (res && res.destroy) {
    res.destroy()
  }
})

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost")
  if (url.pathname.startsWith(MOCK_PREFIX)) {
    const ip = (url.searchParams.get("ipAddress") || "").trim()
    if (!isIp(ip)) return sendJson(res, 422, { code: 422, messages: "Input correct IPv4 or IPv6 address." })
    return sendJson(res, 200, lookup(ip))
  }
  proxy.web(req, res)
})
server.on("upgrade", (req, socket, head) => proxy.ws(req, socket, head))
server.listen(PORT, "0.0.0.0", () => console.log(`ipify mock gateway on :${PORT} -> ${TARGET}`))
