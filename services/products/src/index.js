const express = require('express');

let items = [
  { id: 'p1', name: 'laptop', price: 999 },
  { id: 'p2', name: 'mouse', price: 25 },
  { id: 'p3', name: 'keyboard', price: 75 }
];

function createApp() {
  const app = express();
  app.use(express.json());
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/products', (req, res) => res.json(items));
  app.get('/products/:id', (req, res) => {
    const p = items.find((i) => i.id === req.params.id);
    return p ? res.json(p) : res.status(404).json({ error: 'not found' });
  });
  app.post('/products', (req, res) => {
    const { name, price } = req.body || {};
    if (!name || typeof price !== 'number') return res.status(400).json({ error: 'name and numeric price required' });
    const p = { id: 'p' + Date.now(), name, price };
    items.push(p);
    res.status(201).json(p);
  });
  return app;
}

function start(port = process.env.PORT || 3001) {
  return new Promise((resolve) => {
    const server = createApp().listen(port, () =>
      resolve({ server, base: `http://localhost:${server.address().port}` })
    );
  });
}

if (require.main === module) start();

module.exports = { createApp, start };
