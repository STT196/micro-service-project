const test = require('node:test');
const assert = require('node:assert');
const { start } = require('../src/index.js');

test('orders creates without kafka', async () => {
  const { server, base } = await start(0);
  try {
    const r = await fetch(`${base}/orders`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ productId: 'p1', qty: 2 })
    });
    assert.strictEqual(r.status, 201);
    const o = await r.json();
    assert.strictEqual(o.productId, 'p1');
  } finally { server.close(); }
});
