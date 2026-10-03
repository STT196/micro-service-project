const SEED = [
  { id: 'p1', name: 'laptop', price: 999 },
  { id: 'p2', name: 'mouse', price: 25 },
  { id: 'p3', name: 'keyboard', price: 75 }
];

function createMemoryStore(seed = SEED) {
  const items = seed.map((p) => ({ ...p }));
  return {
    async list() { return items; },
    async get(id) { return items.find((i) => i.id === id); },
    async add(p) { items.push(p); return p; }
  };
}

// Shared store: every replica reads/writes the same table, so concurrent
// pods can no longer diverge (split-brain). `pool` is a pg Pool (or stub).
async function createPgStore(pool, seed = SEED) {
  await pool.query(
    'CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT NOT NULL, price DOUBLE PRECISION NOT NULL)'
  );
  for (const p of seed) {
    await pool.query(
      'INSERT INTO products (id, name, price) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
      [p.id, p.name, p.price]
    );
  }
  return {
    async list() {
      const { rows } = await pool.query('SELECT id, name, price FROM products ORDER BY id');
      return rows;
    },
    async get(id) {
      const { rows } = await pool.query('SELECT id, name, price FROM products WHERE id = $1', [id]);
      return rows[0];
    },
    async add(p) {
      await pool.query('INSERT INTO products (id, name, price) VALUES ($1, $2, $3)', [p.id, p.name, p.price]);
      return p;
    }
  };
}

module.exports = { SEED, createMemoryStore, createPgStore };
