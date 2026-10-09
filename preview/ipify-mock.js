// Local, deterministic stand-in for the geo.ipify.org "country,city" API, used only for
// preview environments without a REACT_APP_API_KEY. Responses are MOCK data, not real lookups.
const http = require("http")

const PORT = Number(process.env.IPIFY_MOCK_PORT || 4010)

const KNOWN = {
  "192.212.174.101": { country: "US", region: "California", city: "South San Gabriel", lat: 34.04915, lng: -118.09462, timezone: "-07:00", isp: "Southern California Edison (mock)" },
  "8.8.8.8": { country: "US", region: "California", city: "Mountain View", lat: 37.40599, lng: -122.078514, timezone: "-07:00", isp: "Google LLC (mock)" },
  "1.1.1.1": { country: "AU", region: "Queensland", city: "South Brisbane", lat: -27.47612, lng: 153.01809, timezone: "+10:00", isp: "Cloudflare, Inc. (mock)" },
}

const CITIES = [
  { country: "GB", region: "England", city: "London", lat: 51.50853, lng: -0.12574, timezone: "+01:00" },
  { country: "JP", region: "Tokyo", city: "Tokyo", lat: 35.6895, lng: 139.69171, timezone: "+09:00" },
  { country: "DE", region: "Berlin", city: "Berlin", lat: 52.52437, lng: 13.41053, timezone: "+02:00" },
  { country: "BR", region: "Sao Paulo", city: "Sao Paulo", lat: -23.5475, lng: -46.63611, timezone: "-03:00" },
  { country: "SG", region: "Singapore", city: "Singapore", lat: 1.28967, lng: 103.85007, timezone: "+08:00" },
]

function lookup(ip) {
  if (KNOWN[ip]) return KNOWN[ip]
  let h = 0
  for (const c of ip) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return { ...CITIES[h % CITIES.length], isp: "Example ISP (mock)" }
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://localhost")
    res.setHeader("Content-Type", "application/json")
    res.setHeader("Access-Control-Allow-Origin", "*")
    if (url.pathname !== "/api/v2/country,city") {
      res.statusCode = 404
      return res.end(JSON.stringify({ code: 404, messages: "Not found" }))
    }
    const ip = url.searchParams.get("ipAddress") || "192.212.174.101"
    const { isp, ...loc } = lookup(ip)
    res.end(JSON.stringify({ ip, location: { ...loc, postalCode: "", geonameId: 0 }, as: {}, isp }))
  })
  .listen(PORT, "127.0.0.1", () => console.log(`ipify mock listening on http://127.0.0.1:${PORT}`))
