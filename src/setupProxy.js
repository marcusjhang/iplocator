// Development-server only: when IPIFY_PROXY_TARGET is set (e.g. in a preview
// environment without an IPify key), forward /ipify requests to that target.
// Unset by default, so `npm start` behaves exactly as before.
const { createProxyMiddleware } = require("http-proxy-middleware")

module.exports = function (app) {
  const target = process.env.IPIFY_PROXY_TARGET
  if (!target) return
  app.use(
    "/ipify",
    createProxyMiddleware({ target, changeOrigin: true, pathRewrite: { "^/ipify": "" } })
  )
}
