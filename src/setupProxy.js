// Dev-server only: when IPIFY_PROXY_TARGET is set (e.g. in preview environments),
// forward same-origin /ipify requests to that ipify-compatible endpoint.
const { createProxyMiddleware } = require("http-proxy-middleware")

module.exports = function (app) {
  const target = process.env.IPIFY_PROXY_TARGET
  if (!target) return
  app.use(
    "/ipify",
    createProxyMiddleware({ target, changeOrigin: true, pathRewrite: { "^/ipify": "" } })
  )
}
