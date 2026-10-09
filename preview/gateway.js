// Preview-only gateway: serves a deterministic stand-in for the ipify
// Geolocation API under /__ipify-mock and proxies everything else (including
// the dev server websocket) to the CRA dev server. Not used in production.
const http = require("http")
const httpProxy = require("http-proxy")

const PORT = Number(process.env.GATEWAY_PORT || 8080)
const TARGET = process.env.GATEWAY_TARGET || "http://127.0.0.1:3000"
const MOCK_PREFIX = "/__ipify-mock"

const CITIES = [
  { country: "US", region: "California", city: "Mountain View", lat: 37.38605, lng: -122.08385, timezone: "-07:00", postalCode: "94035" },
  { country: "GB", region: "England", city: "London", lat: 51.50853, lng: -0.12574, timezone: "+01:00", postalCode: "EC1A" },
  { country: "DE", region: "Hesse", city: "Frankfurt am Main", lat: 50.11552, lng: 8.68417, timezone: "+02:00", postalCode: "60311" },
  { country: "JP", region: "Tokyo", city: "Tokyo", lat: 35.6895, lng: 139.69171, timezone: "+09:00", postalCode: "100-0001" },
  { country: "SG", region: "Singapore", city: "Singapore", lat: 1.28967, lng: 103.85007, timezone: "+08:00", postalCode: "018989" },
  { country: "AU", region: "New South Wales", city: "Sydney", lat: -33.86785, lng: 151.20732, timezone: "+11:00", postalCode: "2000" },
  { country: "BR", region: "Sao Paulo", city: "Sao Paulo", lat: -23.5475, lng: -46.63611, timezone: "-03:00", postalCode: "01000-000" },
]

function hash(str) {
  let h = 0
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}

function mockLookup(res, url) {
  const ip = (url.searchParams.get("ipAddress") || "8.8.8.8").trim()
  const loc = CITIES[hash(ip) % CITIES.length]
  res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" })
  res.end(JSON.stringify({
    ip,
    location: loc,
    as: { asn: 64500, name: "MOCK-AS", route: "0.0.0.0/0", domain: "example.invalid", type: "Other" },
    isp: "Mock ISP (preview substitute)",
  }))
}

const proxy = httpProxy.createProxyServer({ target: TARGET, ws: true })
proxy.on("error", (err, req, res) => {
  if (res && res.writeHead) {
    res.writeHead(502, { "Content-Type": "text/plain" })
    res.end(`Dev server not ready: ${err.message}`)
  }
})

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://gateway")
  if (url.pathname.startsWith(`${MOCK_PREFIX}/api/v2/`)) return mockLookup(res, url)
  proxy.web(req, res)
})
server.on("upgrade", (req, socket, head) => proxy.ws(req, socket, head))
server.listen(PORT, "0.0.0.0", () => console.log(`Preview gateway on :${PORT} -> ${TARGET}`))
