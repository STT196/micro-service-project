# Shop Microservices for Kubernetes Learning — Design

Date: 2026-10-02
Stack: Node.js Express, Docker, Docker Desktop K8s (cloud-ready later), Helm + CI
Status: Approved — SCOPE SPLIT: assistant builds app only (services + Docker + Compose). User builds all Kubernetes/Helm configs for learning.

## 1. Goal
Learn Kubernetes primitives via a minimal shop: gateway, products, orders, notifications + Postgres + Redis + Kafka.
Assistant scope = app code K8s-ready (`/health`, env-based URLs, Dockerfiles, Compose). User scope = all K8s/Helm.
Success = `docker compose up --build` serves shop + Kafka flow; app exposes contracts user needs for K8s.

## 2. Architecture
```
client -> Ingress -> api-gateway:3000 -> products:3001
                                    \-> orders:3002 -> Postgres, Redis
                                                     -> products:3001 (ClusterIP DNS)
                                                     -> kafka:9092 topic `orders.created` -> notifications:3003 (logs only)
```
Namespace: `shop-learn`. Only gateway exposed via Ingress. Products/orders/notifications are ClusterIP.

## 3. Components
- `services/api-gateway/`: Express proxy, GET `/`, `/health`, routes `/api/*`. No DB. Env: `PRODUCTS_URL`, `ORDERS_URL`.
- `services/products/`: GET/POST `/products`, GET `/health`. In-memory array seeded with 3 items; uses `DATABASE_URL` if set (Postgres). Port 3001.
- `services/orders/`: POST/GET `/orders`, GET `/health`. Validates product via `PRODUCTS_URL`, stores in-memory, publishes to Redis if `REDIS_URL` set + Kafka topic `orders.created` if `KAFKA_BROKERS` set (kafkajs, fire-and-forget, never blocks order creation). Port 3002.
- `services/notifications/`: Kafka consumer only, GET `/health`. Subscribes `orders.created` via `KAFKA_BROKERS`, console.logs payload. Port 3003. Teaches consumer groups + Stateful backing.
- Kafka infra: single-node KRaft (`apache/kafka:3.7` or `bitnami/kafka` if Docker Hub auth needed), headless Service `kafka:9092`, PVC 1Gi, auto-create topic via `KAFKA_AUTO_CREATE_TOPICS_ENABLE=true` for learning only.
- No auth, no frontend. YAGNI: skipped auth, cart, payments, Strimzi operator, Schema Registry, exactly-once semantics.

## 4. Docker / Local Dev
- Each service: `Dockerfile` (node:20-alpine, npm ci --omit=dev, non-root, CMD node src/index.js), `.dockerignore`.
- `docker-compose.yml`: gateway/products/orders/notifications + postgres:16 + redis:7 + kafka (single-node KRaft, port 9092) + kafka-init (creates `orders.created` once), healthchecks, named volumes `pgdata`, `kadata`.
- Image names: `shop/<svc>:local`, overridable via env for cloud registry later.

## 5. Kubernetes (USER-OWNED, assistant creates none)
- Assistant creates NO `k8s/` YAML, no Helm chart, no Kustomize.
- App provides K8s contracts user needs: `GET /health` on every service (200 + `{"status":"ok"}`), stateless services, all config via env (`PORT`, `PRODUCTS_URL`, `ORDERS_URL`, `DATABASE_URL`, `REDIS_URL`, `KAFKA_BROKERS`, `KAFKA_TOPIC`), no hardcoded hosts.
- Suggested user exercises (not built): Deployments + ClusterIP Services, Ingress, ConfigMap/Secret, PVCs for Postgres/Kafka, probes, limits, HPA.

## 6. Helm (USER-OWNED)
User builds chart later for learning. App supports it via env-driven config only (no chart in repo).

## 7. CI (`.github/workflows/ci.yml`)
On push: `node --check` per service + `docker build` per service. No Helm lint (user-owned).

## 8. Verification
1. `docker compose up --build` -> `curl localhost:3000/health`
2. Shop flow: POST product, POST order, GET order via gateway.
3. Kafka flow: POST order -> `docker compose logs notifications` shows `orders.created` event. Kafka skipped gracefully if broker down (orders still 201).

## 9. Non-Goals
No NestJS, no TypeORM/Prisma (raw pg only if needed), no service mesh, no Prometheus/Grafana, no cloud LB/TLS in v1. Add when core works.
