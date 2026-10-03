const test = require('node:test');
const assert = require('node:assert');
const { start } = require('../src/index.js');

test('gateway health returns ok', async () => {
  const { server, base } = await start(0);
  try {
    const res = await fetch(`${base}/health`);
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(await res.json(), { status: 'ok' });
  } finally { server.close(); }
});
