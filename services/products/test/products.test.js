const test = require('node:test');
const assert = require('node:assert');
const { start } = require('../src/index.js');

test('products CRUD', async () => {
  const { server, base } = await start(0);
  try {
    let r = await fetch(`${base}/products`);
    assert.strictEqual(r.status, 200);
    const list = await r.json();
    assert.ok(Array.isArray(list) && list.length >= 3);
    r = await fetch(`${base}/products`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'kbd', price: 49 })
    });
    assert.strictEqual(r.status, 201);
  } finally { server.close(); }
});
