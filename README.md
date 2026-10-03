# Shop microservices (K8s-ready app, no K8s manifests)

4 Express services + Postgres + Redis + single-node Kafka (KRaft).

## Run

```bash
docker compose up --build -d
curl http://localhost:3000/health
curl http://localhost:3000/api/products
curl -X POST http://localhost:3000/api/orders -H "content-type: application/json" -d '{"productId":"p1","qty":1}'
docker compose logs notifications
```

## Contracts for your K8s work

| Service | Port | Health | Env |
|---|---|---|---|
| gateway | 3000 | GET /health | PORT, PRODUCTS_URL, ORDERS_URL |
| products | 3001 | GET /health | PORT, DATABASE_URL (optional) |
| orders | 3002 | GET /health | PORT, PRODUCTS_URL, DATABASE_URL, REDIS_URL, KAFKA_BROKERS, KAFKA_TOPIC |
| notifications | 3003 | GET /health | PORT, KAFKA_BROKERS, KAFKA_TOPIC, KAFKA_GROUP |

- All config via env, no hardcoded hosts (defaults are localhost for dev, compose overrides to service DNS).
- Kafka publish is fire-and-forget: orders returns 201 even if broker is down.
- Stateless services, in-memory stores (Postgres/Redis URLs reserved for your K8s work).

## Tests

```bash
node --test services/*/test/*.test.js
```
