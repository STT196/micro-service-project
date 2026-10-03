const express = require('express');

function createApp() {
  const app = express();
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  return app;
}

async function startConsumer() {
  if (!process.env.KAFKA_BROKERS) {
    console.log('kafka disabled, consumer idle');
    return;
  }
  const { Kafka } = require('kafkajs');
  const kafka = new Kafka({ brokers: process.env.KAFKA_BROKERS.split(',') });
  const consumer = kafka.consumer({ groupId: process.env.KAFKA_GROUP || 'notifications' });
  await consumer.connect();
  await consumer.subscribe({ topic: process.env.KAFKA_TOPIC || 'orders.created', fromBeginning: false });
  await consumer.run({
    eachMessage: async ({ message }) => console.log('order-created', message.value.toString())
  });
}

function start(port = process.env.PORT || 3003) {
  return new Promise((resolve) => {
    const server = createApp().listen(port, () =>
      resolve({ server, base: `http://localhost:${server.address().port}` })
    );
  });
}

if (require.main === module) {
  start();
  startConsumer().catch((e) => console.error('consumer error', e.message));
}

module.exports = { createApp, start };
