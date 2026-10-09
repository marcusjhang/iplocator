// Deterministic stand-in for the IPify Geolocation API (country,city endpoint),
// used only by preview environments that have no IPify API key.
// Usage: node preview/ipify-mock.js  (listens on IPIFY_MOCK_PORT, default 4010)
const http = require("http")

const KNOWN = {
  "192.212.174.101": { country: "US", region: "California", city: "South San Gabriel", lat: 34.04915, lng: -118.09462, postalCode: "", timezone: "-07:00", isp: "Southern California Edison" },
  "8.8.8.8": { country: "US", region: "California", city: "Mountain View", lat: 37.38605, lng: -122.08385, postalCode: "94035", timezone: "-07:00", isp: "Google LLC" },
  "1.1.1.1": { country: "AU", region: "Queensland", city: "South Brisbane", lat: -27.47612, lng: 153.01701, postalCode: "4101", timezone: "+10:00", isp: "Cloudflare, Inc." },
}

const FALLBACKS = [
  { country: "GB", region: "England", city: "London", lat: 51.50853, lng: -0.12574, postalCode: "EC1A", timezone: "+01:00", isp: "Example Broadband Ltd" },
  { country: "DE", region: "Berlin", city: "Berlin", lat: 52.52437, lng: 13.41053, postalCode: "10115", timezone: "+02:00", isp: "Beispiel Netz GmbH" },
  { country: "JP", region: "Tokyo", city: "Tokyo", lat: 35.6895, lng: 139.69171, postalCode: "100-0001", timezone: "+09:00", isp: "Sample Telecom KK" },
  { country: "BR", region: "Sao Paulo", city: "Sao Paulo", lat: -23.5475, lng: -46.63611, postalCode: "01000-000", timezone: "-03:00", isp: "Provedor Exemplo" },
]

function lookup(ip) {
  const known = KNOWN[ip]
  if (known) return known
  let hash = 0
  for (const ch of ip) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return FALLBACKS[hash % FALLBACKS.length]
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost")
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Content-Type", "application/json")
  if (url.pathname !== "/api/v2/country,city" && url.pathname !== "/api/v2/country%2Ccity") {
    res.statusCode = 404
    return res.end(JSON.stringify({ code: 404, messages: "Not found" }))
  }
  const ip = (url.searchParams.get("ipAddress") || "").trim() || "192.212.174.101"
  const { isp, ...location } = lookup(ip)
  res.end(JSON.stringify({ ip, location: { ...location, geonameId: 0 }, as: { asn: 0, name: isp, route: "", domain: "", type: "" }, isp }))
})

const port = Number(process.env.IPIFY_MOCK_PORT || 4010)
server.listen(port, "0.0.0.0", () => console.log(`IPify mock listening on ${port}`))
