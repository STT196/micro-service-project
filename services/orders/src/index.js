const express = require('express');

let orders = [];
let producer = null;

async function getProducer() {
  if (producer || !process.env.KAFKA_BROKERS) return producer;
  const { Kafka } = require('kafkajs');
  const kafka = new Kafka({ brokers: process.env.KAFKA_BROKERS.split(',') });
  producer = kafka.producer();
  await producer.connect();
  return producer;
}

function fireKafka(evt) {
  (async () => {
    try {
      const p = await getProducer();
      if (!p) return;
      await p.send({
        topic: process.env.KAFKA_TOPIC || 'orders.created',
        messages: [{ value: JSON.stringify(evt) }]
      });
    } catch (e) {
      console.error('kafka publish skipped:', e.message);
    }
  })();
}

function createApp() {
  const app = express();
  app.use(express.json());
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/orders', (req, res) => res.json(orders));
  app.post('/orders', async (req, res) => {
    const { productId, qty } = req.body || {};
    if (!productId || typeof qty !== 'number' || qty <= 0) {
      return res.status(400).json({ error: 'productId and positive qty required' });
    }
    if (process.env.PRODUCTS_URL) {
      try {
        await fetch(`${process.env.PRODUCTS_URL}/products/${productId}`, { signal: AbortSignal.timeout(2000) });
      } catch {
        console.error('product check skipped: products unreachable');
      }
    }
    const order = { id: 'o' + Date.now(), productId, qty, status: 'created' };
    orders.push(order);
    fireKafka({ type: 'orders.created', ...order });
    res.status(201).json(order);
  });
  return app;
}

function start(port = process.env.PORT || 3002) {
  return new Promise((resolve) => {
    const server = createApp().listen(port, () =>
      resolve({ server, base: `http://localhost:${server.address().port}` })
    );
  });
}

if (require.main === module) start();

module.exports = { createApp, start };
