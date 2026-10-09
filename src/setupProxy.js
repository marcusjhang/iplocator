// Dev-server only (react-scripts start). When IPIFY_PROXY_TARGET is set, requests to
// /ipify are forwarded to that target, e.g. a local ipify stub for preview environments.
// Use together with REACT_APP_IPIFY_BASE_URL=/ipify. Has no effect when the variable is unset.
const { createProxyMiddleware } = require("http-proxy-middleware")

module.exports = function (app) {
  const target = process.env.IPIFY_PROXY_TARGET
  if (!target) return
  app.use(
    "/ipify",
    createProxyMiddleware({ target, changeOrigin: true, pathRewrite: { "^/ipify": "" } })
  )
}
