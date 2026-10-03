const express = require('express');
const { createMemoryStore, createPgStore } = require('./store');

async function createApp({ store } = {}) {
  if (!store) {
    if (process.env.DATABASE_URL) {
      const { Pool } = require('pg');
      store = await createPgStore(new Pool({ connectionString: process.env.DATABASE_URL }));
    } else {
      store = createMemoryStore();
    }
  }
  const app = express();
  app.use(express.json());
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/products', async (req, res) => res.json(await store.list()));
  app.get('/products/:id', async (req, res) => {
    const p = await store.get(req.params.id);
    return p ? res.json(p) : res.status(404).json({ error: 'not found' });
  });
  app.post('/products', async (req, res) => {
    const { name, price } = req.body || {};
    if (!name || typeof price !== 'number') return res.status(400).json({ error: 'name and numeric price required' });
    const p = { id: 'p' + Date.now(), name, price };
    await store.add(p);
    res.status(201).json(p);
  });
  return app;
}

function start(port = process.env.PORT || 3001) {
  return new Promise((resolve) => {
    createApp().then((app) => {
      const server = app.listen(port, () =>
        resolve({ server, base: `http://localhost:${server.address().port}` })
      );
    });
  });
}

if (require.main === module) start();

module.exports = { createApp, start };
