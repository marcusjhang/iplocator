// Dev-server only: when IPIFY_PROXY_TARGET is set, forward /ipify-proxy requests to that
// ipify-compatible endpoint (e.g. a local mock for previews without an API key).
const { createProxyMiddleware } = require("http-proxy-middleware")

module.exports = function (app) {
  const target = process.env.IPIFY_PROXY_TARGET
  if (!target) return
  app.use(
    "/ipify-proxy",
    createProxyMiddleware({ target, changeOrigin: true, pathRewrite: { "^/ipify-proxy": "" } })
  )
}
