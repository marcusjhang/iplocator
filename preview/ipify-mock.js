// Deterministic local stand-in for the IPify Geolocation API (geo.ipify.org),
// used only by preview environments without a REACT_APP_API_KEY.
const http = require("http")

const KNOWN = {
  "192.212.174.101": { country: "US", region: "California", city: "South San Gabriel", lat: 34.04915, lng: -118.09462, postalCode: "", timezone: "-07:00", isp: "SpaceX Starlink" },
  "8.8.8.8": { country: "US", region: "California", city: "Mountain View", lat: 37.38605, lng: -122.08385, postalCode: "94035", timezone: "-07:00", isp: "Google LLC" },
  "1.1.1.1": { country: "AU", region: "Queensland", city: "South Brisbane", lat: -27.4766, lng: 153.0166, postalCode: "4101", timezone: "+10:00", isp: "Cloudflare, Inc." },
}
const CITIES = [
  { country: "GB", region: "England", city: "London", lat: 51.5072, lng: -0.1276, timezone: "+01:00" },
  { country: "DE", region: "Berlin", city: "Berlin", lat: 52.52, lng: 13.405, timezone: "+02:00" },
  { country: "JP", region: "Tokyo", city: "Tokyo", lat: 35.6762, lng: 139.6503, timezone: "+09:00" },
  { country: "BR", region: "Sao Paulo", city: "Sao Paulo", lat: -23.5505, lng: -46.6333, timezone: "-03:00" },
]

function lookup(ip) {
  if (KNOWN[ip]) return KNOWN[ip]
  const hash = [...ip].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
  return { ...CITIES[hash % CITIES.length], postalCode: "", isp: "Preview Mock ISP" }
}

const port = Number(process.env.IPIFY_MOCK_PORT || 4010)
http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://localhost")
    res.setHeader("Content-Type", "application/json")
    res.setHeader("Access-Control-Allow-Origin", "*")
    if (!url.pathname.startsWith("/api/v2/country")) {
      res.statusCode = 404
      return res.end(JSON.stringify({ code: 404, messages: "Not found" }))
    }
    const ip = url.searchParams.get("ipAddress") || "192.212.174.101"
    const { isp, ...location } = lookup(ip)
    res.end(JSON.stringify({ ip, location: { ...location, geonameId: 0 }, as: {}, isp }))
  })
  .listen(port, "0.0.0.0", () => console.log(`ipify mock listening on ${port}`))
