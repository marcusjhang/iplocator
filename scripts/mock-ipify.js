// Deterministic local stand-in for the geo.ipify.org "country,city" endpoint, used for
// previews when no REACT_APP_API_KEY is available. Not real geolocation data.
const http = require("http")

const PORT = Number(process.env.MOCK_IPIFY_PORT || 4010)

const KNOWN = {
  "192.212.174.101": { country: "US", region: "California", city: "South San Gabriel", lat: 34.04915, lng: -118.09462, postalCode: "", timezone: "-07:00", isp: "Southern California Edison" },
  "8.8.8.8": { country: "US", region: "California", city: "Mountain View", lat: 37.40599, lng: -122.078514, postalCode: "94043", timezone: "-07:00", isp: "Google LLC" },
  "1.1.1.1": { country: "AU", region: "Queensland", city: "South Brisbane", lat: -27.4766, lng: 153.0166, postalCode: "4101", timezone: "+10:00", isp: "Cloudflare, Inc." },
}

const FALLBACK = [
  { country: "GB", region: "England", city: "London", lat: 51.5074, lng: -0.1278, postalCode: "EC1A", timezone: "+01:00", isp: "Mock Telecom UK" },
  { country: "DE", region: "Berlin", city: "Berlin", lat: 52.52, lng: 13.405, postalCode: "10115", timezone: "+02:00", isp: "Mock Netz GmbH" },
  { country: "JP", region: "Tokyo", city: "Tokyo", lat: 35.6762, lng: 139.6503, postalCode: "100-0001", timezone: "+09:00", isp: "Mock Japan KK" },
  { country: "BR", region: "Sao Paulo", city: "Sao Paulo", lat: -23.5505, lng: -46.6333, postalCode: "01000-000", timezone: "-03:00", isp: "Mock Brasil Ltda" },
]

const isIPv4 = (ip) => /^(\d{1,3})(\.\d{1,3}){3}$/.test(ip) && ip.split(".").every((n) => Number(n) <= 255)

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://localhost")
    res.setHeader("Content-Type", "application/json")
    res.setHeader("Access-Control-Allow-Origin", "*")
    if (!url.pathname.endsWith("/api/v2/country,city")) {
      res.writeHead(404)
      return res.end(JSON.stringify({ code: 404, messages: "Not found" }))
    }
    const ip = url.searchParams.get("ipAddress") || "192.212.174.101"
    if (!isIPv4(ip)) {
      res.writeHead(422)
      return res.end(JSON.stringify({ code: 422, messages: "Input correct IPv4 or IPv6 address." }))
    }
    const hash = ip.split(".").reduce((a, n) => a + Number(n), 0)
    const { isp, ...loc } = KNOWN[ip] || FALLBACK[hash % FALLBACK.length]
    res.end(JSON.stringify({ ip, location: { ...loc, geonameId: 0 }, as: { asn: 0, name: "MOCK", route: "", domain: "", type: "" }, isp }))
  })
  .listen(PORT, "0.0.0.0", () => console.log(`mock ipify listening on 0.0.0.0:${PORT}`))
