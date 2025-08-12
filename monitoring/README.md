Monitoring = **tracking system health & performance** (CPU, memory, errors, requests) to spot issues early.

Prometheus = **a monitoring tool** that:

* Collects data from apps/services via HTTP (`/metrics` endpoint).
* Stores it in a time-series database.
* Lets you query with **PromQL** and set alerts.

Example metric:

```
http_requests_total{method="GET", status="200"} 1024
```

Grafana is a **visualization tool** for monitoring data. It takes metrics from sources like Prometheus and turns them into **dashboards** with graphs, gauges, and alerts.

Think: Prometheus collects the data, Grafana makes it look beautiful and easy to understand.
You can set live charts, thresholds, and alerts for quick decision-making.

Elasticsearch = **search & analytics engine** that stores and quickly searches large amounts of data (often logs).

Kibana = **visualization tool** for Elasticsearch data.

* Elasticsearch stores the data.
* Kibana lets you search, filter, and make dashboards from it.

Often used together in the **ELK stack** (Elasticsearch, Logstash, Kibana) for log monitoring.
