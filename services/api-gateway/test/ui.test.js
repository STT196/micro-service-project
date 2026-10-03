const test = require('node:test');
const assert = require('node:assert');
const { start } = require('../src/index.js');

test('gateway serves shop UI at /', async () => {
  const { server, base } = await start(0);
  try {
    const res = await fetch(`${base}/`);
    assert.strictEqual(res.status, 200);
    assert.match(res.headers.get('content-type'), /html/);
    const html = await res.text();
    assert.ok(html.includes('/api/products') && html.includes('/api/orders'));
  } finally { server.close(); }
});
