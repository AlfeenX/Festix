• # RabbitMQ, Prometheus, dan Grafana di Project Festix

  ## Ringkasan Status

  ┌────────────┬──────────────────────────────────────────┬─────────────────────────────────────────────┐
  │ Tool       │ Kegunaan di Festix                       │ Status Implementasi                         │
  ├────────────┼──────────────────────────────────────────┼─────────────────────────────────────────────┤
  │ RabbitMQ   │ Message broker untuk proses async        │ Sudah diimplementasikan                     │
  │            │ seperti order, payment, ticket           │                                             │
  │            │ generation, dan notification             │                                             │
  │ Prometheus │ Mengambil metrics dari setiap service    │ Sudah diimplementasikan                     │
  │            │ lewat endpoint /metrics                  │                                             │
  │ Grafana    │ Visualisasi metrics dari Prometheus      │ Sudah tersedia, tapi dashboard belum        │
  │            │                                          │ diprovision                                 │
  └────────────┴──────────────────────────────────────────┴─────────────────────────────────────────────┘

  ———

  ## 1. RabbitMQ

  ### Kegunaan

  RabbitMQ dipakai sebagai antrean/event bus agar proses berat atau lanjutan tidak harus dilakukan
  langsung dalam request utama.

  Contoh alur di project ini:

  1. User checkout tiket.
  2. order-service membuat order.
  3. order-service publish message ke queue order.processing.
  4. payment-service publish event payment ke queue lain.
  5. Jika payment sukses, message dikirim ke ticket.generation.
  6. queue-worker consume message tersebut dan generate ticket.
  7. notification-service consume queue notification.send untuk membuat notifikasi user.

  Queue yang dibuat di project:

  order.processing
  payment.processing
  notification.send
  ticket.generation
  dead.letter

  File penting:

  ```txt
  packages/shared/src/rabbitmq.ts
  services/queue-worker/src/index.ts
  services/order-service/src/index.ts
  services/payment-service/src/index.ts
  services/notification-service/src/index.ts
  services/auth-service/src/index.ts
  services/seat-service/src/index.ts

  ### Cara Melihat RabbitMQ

  Jika menjalankan full Docker Compose:

  docker compose up -d --build

  Buka:

  http://localhost:15672

  Login:

  Username: festix
  Password: festix_secret

  Yang bisa dicek:

  - Tab Queues untuk melihat queue seperti order.processing, ticket.generation, dll.
  - Tab Connections untuk melihat service yang connect ke RabbitMQ.
  - Tab Exchanges untuk melihat exchange festix.events.
  - Queue dead.letter untuk melihat message yang gagal diproses.

  ———

  ## 2. Prometheus

  ### Kegunaan

  Prometheus dipakai untuk monitoring metrics dari service-service Festix.

  Setiap service yang memakai createServiceApp() otomatis punya endpoint:

  /metrics

  Metrics yang dikumpulkan:

  http_requests_total
  http_request_duration_seconds
  active_connections
  nodejs_* metrics
  process_* metrics

  File penting:

  packages/shared/src/metrics.ts
  packages/service-common/src/index.ts
  infra/prometheus/prometheus.yml

  Prometheus scrape service berikut:

  nginx-gateway:3000
  auth-service:3001
  event-service:3002
  seat-service:3003
  order-service:3004
  payment-service:3005
  notification-service:3006

  ### Cara Melihat Prometheus

  Buka:

  http://localhost:9090

  Cek target:

  http://localhost:9090/targets

  Contoh query di Prometheus:

  up

  http_requests_total

  http_request_duration_seconds_bucket

  active_connections

  Direct metrics juga bisa dicek, misalnya:

  curl http://localhost:3000/metrics
  curl http://localhost:3001/metrics
  curl http://localhost:3003/metrics

  Catatan: config Prometheus saat ini cocok untuk mode full Docker Compose karena target-nya memakai nama
  container seperti nginx-gateway, auth-service, dll.

  ———

  ## 3. Grafana

  ### Kegunaan

  Grafana dipakai untuk membuat dashboard visual dari metrics Prometheus.

  Di project ini Grafana sudah disiapkan lewat Docker Compose dan sudah otomatis punya datasource
  Prometheus.

  File penting:

  docker-compose.yml
  infra/grafana/provisioning/datasources/prometheus.yml

  Datasource yang diprovision:

  name: Prometheus
  url: http://prometheus:9090

  ### Status Implementasi

  Grafana sudah tersedia, tetapi belum ada dashboard bawaan di repo.

  Artinya:

  - Grafana bisa dibuka.
  - Datasource Prometheus sudah otomatis terpasang.
  - Tapi panel/dashboard harus dibuat manual dulu, kecuali nanti ditambahkan provisioning dashboard.

  ### Cara Melihat Grafana

  Buka:

  http://localhost:3030

  Login:

  Username: admin
  Password: festix

  Lalu cek:

  Connections / Data sources -> Prometheus

  Contoh panel query yang bisa dibuat:

  sum(rate(http_requests_total[1m])) by (service)

  histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))

  up

  ———

  ## Kesimpulan

  RabbitMQ sudah benar-benar dipakai untuk async workflow seperti order, payment, ticket generation, dan
  custom bawaan di repository.