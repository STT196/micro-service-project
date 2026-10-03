# Mini-Assignment: Shop Microservices on Kubernetes

**Given:** 4 Node.js services (gateway :3000 + UI, products :3001, orders :3002, notifications :3003), Postgres, Redis, Kafka (`orders.created` topic), `docker-compose.yml`. Every service exposes `GET /health` → `{"status":"ok"}` and reads all config from env.

## Part A — Implementation

1. **Namespaces & basics:** Create namespace `shop-learn`. Deploy all 4 services as Deployments + ClusterIP Services. How do Pods discover each other? (Hint: `http://products:3001`.)
2. **Config:** Move `PRODUCTS_URL`, `ORDERS_URL`, `KAFKA_BROKERS`, `KAFKA_TOPIC` into a ConfigMap and the Postgres password into a Secret. Redeploy without rebuilding images.
3. **State:** Deploy Postgres with a PVC (1Gi) and single-node Kafka (StatefulSet + headless Service + PVC). Prove data survives a Pod restart.
4. **Ingress:** Expose only the gateway via NGINX Ingress (`/` → gateway). Show the shop UI in a browser.
5. **Resilience:** Add liveness/readiness probes on `/health`, CPU/memory requests+limits, and an HPA on gateway/products (60% CPU, 2–5 replicas). Demonstrate a rolling update with zero downtime.
6. **End-to-end proof:** POST a product and an order through the UI, then show the event in `kubectl logs deploy/notifications`. Kill the Kafka Pod and prove order creation still returns 201 — why?
7. **Helm (optional):** Package everything as one chart with `values.yaml` (`image.tag`, `ingress.host`, `kafka.enabled`). Install with `kafka.enabled=false` and show the app still works.
8. **Grafana:** Install kube-prometheus-stack, add ServiceMonitors scraping each service's `/metrics`… wait — the app has no `/metrics` endpoint yet. What must be added to the code first, and what 3 panels would you put on a shop dashboard?
9. **ArgoCD:** Write an `Application` manifest pointing at your manifests repo, enable auto-sync, then change a replica count via git and show ArgoCD syncing it to the cluster.

## Part B — Viva questions

- Why is the gateway the only Ingress-exposed service? What breaks if products is exposed directly?
- Gateway returns 502 "upstream unavailable" — which K8s objects would you inspect, in what order?
- Orders publishes to Kafka fire-and-forget. Name one failure mode this hides, and when you'd accept vs. fix it.
- Notifications scales to 3 replicas on one partition: what happens to ordering and duplicates?
- HPA needs what metrics component to function? What does it do when metrics are missing?
- ConfigMap vs Secret: what's actually different inside etcd by default?
- How does a rolling update avoid dropping requests? (probes + termination lifecycle)
- GitOps: what drifts if someone runs `kubectl scale` by hand, and how does ArgoCD respond?

## Part C — Marking guide (100)

| Area | Marks |
|---|---|
| Deployments/Services/Ingress working, UI reachable | 25 |
| ConfigMap/Secret + PVC data survives restart | 15 |
| Probes, limits, HPA + zero-downtime deploy demo | 15 |
| Kafka flow proven + broker-failure behavior explained | 15 |
| Grafana dashboard with live metrics | 10 |
| ArgoCD git-driven sync demo | 10 |
| Viva answers | 10 |

## Part D — Bonus

- Add `GET /metrics` with `prom-client` to one service and graph its request latency.
- Split `orders.created` into 3 partitions and explain what changed for the consumer group.
- Write a NetworkPolicy allowing only gateway → products/orders traffic.
