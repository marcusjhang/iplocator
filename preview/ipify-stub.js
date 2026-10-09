// Minimal local stand-in for the geo.ipify.org "country,city" endpoint, used only for
// preview environments without a real ipify API key. Returns deterministic, ipify-shaped
// sample data; it does not perform real geolocation.
const http = require("http")

const PORT = Number(process.env.IPIFY_STUB_PORT || 4010)

const SAMPLES = [
  { country: "US", region: "California", city: "Los Angeles", lat: 34.0522, lng: -118.2437, postalCode: "90001", timezone: "-07:00", isp: "SpaceX Starlink" },
  { country: "GB", region: "England", city: "London", lat: 51.5074, lng: -0.1278, postalCode: "EC1A", timezone: "+01:00", isp: "British Telecommunications PLC" },
  { country: "JP", region: "Tokyo", city: "Tokyo", lat: 35.6762, lng: 139.6503, postalCode: "100-0001", timezone: "+09:00", isp: "NTT Communications" },
  { country: "DE", region: "Berlin", city: "Berlin", lat: 52.52, lng: 13.405, postalCode: "10115", timezone: "+02:00", isp: "Deutsche Telekom AG" },
  { country: "BR", region: "Sao Paulo", city: "Sao Paulo", lat: -23.5505, lng: -46.6333, postalCode: "01000-000", timezone: "-03:00", isp: "Claro S.A." },
]

const KNOWN = {
  "192.212.174.101": SAMPLES[0],
  "8.8.8.8": { country: "US", region: "California", city: "Mountain View", lat: 37.4223, lng: -122.085, postalCode: "94043", timezone: "-07:00", isp: "Google LLC" },
  "1.1.1.1": { country: "AU", region: "Queensland", city: "South Brisbane", lat: -27.4766, lng: 153.0166, postalCode: "4101", timezone: "+10:00", isp: "Cloudflare, Inc" },
}

function lookup(ip) {
  if (KNOWN[ip]) return KNOWN[ip]
  let h = 0
  for (const c of ip) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return SAMPLES[h % SAMPLES.length]
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://localhost")
    if (url.pathname !== "/api/v2/country,city" && url.pathname !== "/api/v2/country%2Ccity") {
      res.writeHead(404, { "Content-Type": "application/json" })
      return res.end(JSON.stringify({ code: 404, messages: "Not found" }))
    }
    const ip = (url.searchParams.get("ipAddress") || "192.212.174.101").trim()
    const loc = lookup(ip)
    const { isp, ...location } = loc
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ ip, location: { ...location, geonameId: 0 }, as: { asn: 0, name: isp, route: "", domain: "", type: "" }, isp }))
  })
  .listen(PORT, "0.0.0.0", () => console.log(`ipify stub listening on ${PORT}`))
