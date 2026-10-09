// Preview-only front server. Answers IPify-shaped requests under /ipify-stub with
// deterministic substitute data (no IPify key is configured for previews) and proxies
// everything else, including the dev-server websocket, to the CRA dev server.
const http = require("http")
const httpProxy = require("http-proxy")

const PORT = Number(process.env.PREVIEW_PORT || 3000)
const TARGET = process.env.PREVIEW_TARGET || "http://127.0.0.1:3001"

const LOCATIONS = [
  { country: "US", region: "California", city: "South San Gabriel", lat: 34.04915, lng: -118.09462, timezone: "-07:00", isp: "SpaceX Starlink (preview stub)" },
  { country: "GB", region: "England", city: "London", lat: 51.50853, lng: -0.12574, timezone: "+01:00", isp: "British Telecom (preview stub)" },
  { country: "DE", region: "Berlin", city: "Berlin", lat: 52.52437, lng: 13.41053, timezone: "+02:00", isp: "Deutsche Telekom (preview stub)" },
  { country: "JP", region: "Tokyo", city: "Tokyo", lat: 35.6895, lng: 139.69171, timezone: "+09:00", isp: "NTT Communications (preview stub)" },
  { country: "AU", region: "New South Wales", city: "Sydney", lat: -33.86785, lng: 151.20732, timezone: "+11:00", isp: "Telstra (preview stub)" },
  { country: "BR", region: "Sao Paulo", city: "Sao Paulo", lat: -23.5475, lng: -46.63611, timezone: "-03:00", isp: "Vivo (preview stub)" },
]

function lookup(ip) {
  let h = 2166136261
  for (const c of ip) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0
  const loc = LOCATIONS[ip === "192.212.174.101" ? 0 : h % LOCATIONS.length]
  const { isp, ...location } = loc
  return { ip, location: { ...location, postalCode: "", geonameId: 0 }, isp, as: {} }
}

const proxy = httpProxy.createProxyServer({ target: TARGET, ws: true, changeOrigin: false })
proxy.on("error", (err, req, res) => {
  if (res && res.writeHead && !res.headersSent) {
    res.writeHead(502, { "Content-Type": "text/plain" })
    res.end("Dev server not ready yet: " + err.message)
  }
})

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://preview")
  if (url.pathname.startsWith("/ipify-stub/api/v2/")) {
    const ip = (url.searchParams.get("ipAddress") || "").trim() || "192.212.174.101"
    res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" })
    res.end(JSON.stringify(lookup(ip)))
    return
  }
  proxy.web(req, res)
})
server.on("upgrade", (req, socket, head) => proxy.ws(req, socket, head))
server.listen(PORT, "0.0.0.0", () => console.log(`preview server on :${PORT} -> ${TARGET}`))
