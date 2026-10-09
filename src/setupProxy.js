// Dev-server only: when IPIFY_PROXY_TARGET is set, forward /ipify/* to it so the browser
// can reach a sandbox-local IPify substitute. Has no effect when the variable is unset.
const { createProxyMiddleware } = require("http-proxy-middleware")

module.exports = function (app) {
  const target = process.env.IPIFY_PROXY_TARGET
  if (!target) return
  app.use(
    "/ipify",
    createProxyMiddleware({ target, changeOrigin: true, pathRewrite: { "^/ipify": "" } })
  )
}
