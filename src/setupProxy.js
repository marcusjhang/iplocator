// Dev-server only (react-scripts start). When IPIFY_MOCK_TARGET is set, requests to
// /ipify-mock are forwarded to a local ipify-compatible stub (see preview/ipify-mock.js).
const { createProxyMiddleware } = require("http-proxy-middleware")

module.exports = function (app) {
  const target = process.env.IPIFY_MOCK_TARGET
  if (!target) return
  app.use(
    "/ipify-mock",
    createProxyMiddleware({ target, changeOrigin: true, pathRewrite: { "^/ipify-mock": "" } })
  )
}
