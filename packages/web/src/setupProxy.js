const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    createProxyMiddleware('/v1', {
      target: 'http://localhost:4000',
      changeOrigin: true,
    })
  );

  app.use(
    createProxyMiddleware('/v1', {
      target: 'ws://localhost:4000',
      ws: true,
      changeOrigin: true,
    })
  );
};
