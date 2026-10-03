const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/index.js');
const { createPgStore, createMemoryStore } = require('../src/store.js');

test('two app instances sharing a store see each other writes (no split-brain)', async () => {
  const store = createMemoryStore();
  const a = await createApp({ store });
  const b = await createApp({ store });
  const sa = a.listen(0);
  await new Promise((r) => sa.on('listening', r));
  const sb = b.listen(0);
  await new Promise((r) => sb.on('listening', r));
  try {
    const baseA = `http://localhost:${sa.address().port}`;
    const baseB = `http://localhost:${sb.address().port}`;
    const r = await fetch(`${baseA}/products`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'shared', price: 7 })
    });
    assert.strictEqual(r.status, 201);
    const list = await (await fetch(`${baseB}/products`)).json();
    assert.ok(list.some((p) => p.name === 'shared'), 'write via A must be visible via B');
  } finally { sa.close(); sb.close(); }
});

test('pg store persists through SQL, not process memory', async () => {
  const seen = [];
  let rows = [];
  const pool = {
    query: async (sql, params) => {
      seen.push(sql);
      if (sql.startsWith('INSERT')) {
        rows.push({ id: params[0], name: params[1], price: params[2] });
        return { rows: [] };
      }
      if (sql.startsWith('SELECT')) return { rows };
      return { rows: [] };
    }
  };
  const store = await createPgStore(pool, []);
  await store.add({ id: 'p9', name: 'dbitem', price: 3 });
  assert.ok(seen.some((s) => s.startsWith('INSERT')), 'add must issue INSERT');
  const list = await store.list();
  assert.ok(list.some((p) => p.name === 'dbitem'), 'list must come from SELECT results');
});
