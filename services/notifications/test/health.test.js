const test = require('node:test');
const assert = require('node:assert');
const { start } = require('../src/index.js');

test('notifications health without broker', async () => {
  const { server, base } = await start(0);
  try {
    const r = await fetch(`${base}/health`);
    assert.strictEqual(r.status, 200);
  } finally { server.close(); }
});
