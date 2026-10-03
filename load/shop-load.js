import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 100 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
  },
};

const BASE = __ENV.BASE_URL || 'http://shop.local';

export default function () {
  let r = http.get(`${BASE}/api/products`);
  check(r, { 'products 200': (x) => x.status === 200 });

  const name = `k6-${__VU}-${Date.now()}`;
  r = http.post(`${BASE}/api/products`, JSON.stringify({ name, price: 10 },
    { headers: { 'content-type': 'application/json' } }));
  check(r, { 'add product 201': (x) => x.status === 201 });

  const pid = r.status === 201 ? r.json().id : 'p1';
  r = http.post(`${BASE}/api/orders`, JSON.stringify({ productId: pid, qty: 1 }),
    { headers: { 'content-type': 'application/json' } });
  check(r, { 'order 201': (x) => x.status === 201 });

  sleep(0.2);
}

export function handleSummary(data) {
  const m = data.metrics;
  const row = (k) => {
    const v = m[k].values;
    return `<tr><td>${k}</td><td>${v.count ?? ''}</td><td>${v.rate ?? ''}</td><td>${v.avg ?? ''}</td><td>${v['p(95)'] ?? ''}</td><td>${v.max ?? ''}</td></tr>`;
  };
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>shop-load report</title>
<style>body{font-family:system-ui,sans-serif;max-width:900px;margin:2rem auto}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:.3rem .6rem}</style>
</head><body><h1>shop-load report</h1>
<table><tr><th>metric</th><th>count</th><th>rate</th><th>avg</th><th>p95</th><th>max</th></tr>
${row('http_reqs')}${row('http_req_duration')}${row('http_req_failed')}${row('iterations')}${row('vus_max')}
</table><p>threshold failures: ${JSON.stringify(data.root_group.checks || {})}</p></body></html>`;
  return { 'load/shop-report.html': html };
}
