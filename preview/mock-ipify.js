// Deterministic local stand-in for the IPify Geolocation API (country,city endpoint),
// used only for preview environments without a REACT_APP_API_KEY. All data is fake.
const http = require("http")

const PORT = Number(process.env.MOCK_IPIFY_PORT || 4010)

const places = [
  { country: "US", region: "California", city: "Los Angeles", lat: 34.0522, lng: -118.2437, timezone: "-07:00" },
  { country: "GB", region: "England", city: "London", lat: 51.5074, lng: -0.1278, timezone: "+01:00" },
  { country: "JP", region: "Tokyo", city: "Tokyo", lat: 35.6762, lng: 139.6503, timezone: "+09:00" },
  { country: "DE", region: "Berlin", city: "Berlin", lat: 52.52, lng: 13.405, timezone: "+02:00" },
  { country: "BR", region: "Sao Paulo", city: "Sao Paulo", lat: -23.5505, lng: -46.6333, timezone: "-03:00" },
]

function lookup(ip) {
  let h = 0
  for (const c of ip) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const place = places[h % places.length]
  return {
    ip,
    location: { ...place, postalCode: "", geonameId: 0 },
    as: { asn: 64500 + (h % 100), name: "MOCK-AS", route: "", domain: "", type: "" },
    isp: `Mock ISP ${(h % 900) + 100} (preview stub)`,
  }
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
    res.end(JSON.stringify(lookup(ip)))
  })
  .listen(PORT, "0.0.0.0", () => console.log(`mock IPify listening on ${PORT}`))
