const express = require('express');

function createApp() {
  const app = express();
  app.use(express.json());
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.use(express.static(require('path').join(__dirname, '..', 'public')));
  const proxy = (target) => async (req, res) => {
    try {
      const url = target + req.originalUrl.replace(/^\/api/, '');
      const r = await fetch(url, {
        method: req.method,
        headers: { 'content-type': 'application/json' },
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
        signal: AbortSignal.timeout(5000)
      });
      res.status(r.status).send(await r.text());
    } catch {
      res.status(502).json({ error: 'upstream unavailable' });
    }
  };
  app.use('/api/products', proxy(process.env.PRODUCTS_URL || 'http://localhost:3001'));
  app.use('/api/orders', proxy(process.env.ORDERS_URL || 'http://localhost:3002'));
  return app;
}

function start(port = process.env.PORT || 3000) {
  return new Promise((resolve) => {
    const server = createApp().listen(port, () =>
      resolve({ server, base: `http://localhost:${server.address().port}` })
    );
  });
}

if (require.main === module) start();

module.exports = { createApp, start };
