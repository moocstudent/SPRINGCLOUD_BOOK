/* =========================================================
   code2.jsx — CODE listings for sc13–sc24
   Extends the CODE registry defined in code.jsx (same scope).
   Sources are normal template literals; write \${...} for a
   literal Spring/shell placeholder.
   ========================================================= */

/* ============ TX1 · sc13 — Spring Cloud Stream ============ */
CODE.sc13 = {
  note: {
    zh: "事件驱动:订单服务只管发出「订单已创建」,谁关心谁订阅。Spring Cloud Stream 的函数式模型(Supplier/Function/Consumer + binder)屏蔽了底层是 Kafka 还是 RabbitMQ。分区数决定消费并行度,消费者多于分区就有人空转。",
    en: "Event-driven: the order service just emits 'order created', and whoever cares subscribes. Spring Cloud Stream's functional model (Supplier/Function/Consumer + binder) hides whether the substrate is Kafka or RabbitMQ. Partition count sets consumer parallelism; more consumers than partitions and some sit idle.",
  },
  tabs: [
    {
      lang: "Java", k: "java", file: "Events.java",
      src: `// PRODUCER: publish by returning from a StreamBridge or a Supplier
@Service
class OrderService {
    private final StreamBridge bus;
    OrderService(StreamBridge bus){ this.bus = bus; }
    void place(Order o) {
        save(o);
        bus.send("orderCreated-out-0", new OrderCreated(o.id(), o.sku()));  // fire & forget
    }
}

// CONSUMER: a bean named after the binding — no broker code, no coupling
@Bean
Consumer<OrderCreated> points() {
    return evt -> loyalty.award(evt.customerId(), 10);   // reacts asynchronously
}`,
    },
    {
      lang: "application.yml", k: "yaml", file: "application.yml",
      src: `spring:
  cloud:
    stream:
      bindings:
        orderCreated-out-0: { destination: order.created }
        points-in-0:
          destination: order.created
          group: loyalty            # a consumer group -> competing consumers
          consumer:
            concurrency: 3          # up to 3 threads, capped by partition count
      kafka:
        binder: { brokers: kafka:9092 }
        bindings:
          orderCreated-out-0:
            producer: { partition-count: 4 }   # 4 partitions = max parallelism 4`,
    },
    {
      lang: "compose", k: "yaml", file: "docker-compose.yml",
      run: "docker compose up kafka   # swap the binder dep for RabbitMQ, code unchanged",
      src: `services:
  kafka:
    image: bitnami/kafka:3.7
    environment:
      - KAFKA_CFG_NODE_ID=1
      - KAFKA_CFG_PROCESS_ROLES=broker,controller
    ports: ["9092:9092"]
  # The binder is a dependency choice. Switch to spring-cloud-stream-binder-rabbit
  # and the Java above does not change a line — that is the point of Stream.`,
    },
  ],
};

/* ============ TX2 · sc14 — Seata distributed transaction ============ */
CODE.sc14 = {
  note: {
    zh: "一次下单要跨订单、库存、支付三个库。@GlobalTransactional 起一个全局事务,任何一个分支失败,Seata 就自动回滚/补偿所有分支。AT 模式最省心:它在每个分支记 undo_log,失败时按 undo_log 反向补偿——代价是那张 undo_log 表必须存在。",
    en: "One checkout spans three databases — order, inventory, payment. @GlobalTransactional opens a global transaction, and if any branch fails Seata rolls back or compensates all of them. AT mode is the least effort: it records an undo_log per branch and compensates from it on failure — at the cost that the undo_log table must exist.",
  },
  tabs: [
    {
      lang: "Java", k: "java", file: "CheckoutService.java",
      src: `@Service
public class CheckoutService {

    @GlobalTransactional(name = "checkout", rollbackFor = Exception.class)
    public void checkout(Cart cart) {
        orderClient.create(cart);            // branch 1: order-db
        inventoryClient.deduct(cart);        // branch 2: inventory-db
        paymentClient.charge(cart.total());  // branch 3: payment-db
        // If payment throws, Seata compensates branches 1 and 2 automatically.
        // Note: compensation is NOT a DB rollback — the branch txns already
        // committed locally; Seata undoes them from each undo_log.
    }
}`,
    },
    {
      lang: "application.yml", k: "yaml", file: "application.yml",
      src: `seata:
  enabled: true
  application-id: order-service
  tx-service-group: shop_tx_group
  service:
    vgroup-mapping:
      shop_tx_group: default
  registry:
    type: nacos                     # Seata TC (coordinator) discovered via Nacos
    nacos: { server-addr: nacos:8848 }
  data-source-proxy-mode: AT        # AT | TCC | SAGA | XA`,
    },
    {
      lang: "undo_log.sql", k: "sql", file: "undo_log.sql",
      run: "# AT mode requires this table in EVERY business database",
      src: `-- Seata AT mode keeps a before/after image here to compensate on failure
CREATE TABLE undo_log (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  branch_id     BIGINT NOT NULL,
  xid           VARCHAR(128) NOT NULL,
  context       VARCHAR(128) NOT NULL,
  rollback_info LONGBLOB NOT NULL,      -- the undo image
  log_status    INT NOT NULL,
  log_created   DATETIME NOT NULL,
  log_modified  DATETIME NOT NULL,
  UNIQUE INDEX ux_undo (xid, branch_id)
);`,
    },
  ],
};

/* ============ TX3 · sc15 — idempotency + outbox ============ */
CODE.sc15 = {
  note: {
    zh: "消息至少投递一次,所以同一条可能来两次。幂等:处理前先拿唯一业务 ID 去插一张去重表,插不进去(唯一键冲突)就说明处理过、直接跳过。发件箱:把「写业务」和「记消息」放进同一个本地事务,再由中继投递——崩溃也不丢事件、不发假事件。",
    en: "Messages are delivered at least once, so the same one may arrive twice. Idempotency: before processing, insert the unique business id into a dedup table — a unique-key clash means already handled, so skip. Outbox: write the business change and the outgoing message in one local transaction, and let a relay publish it — no lost or false events on a crash.",
  },
  tabs: [
    {
      lang: "Java", k: "java", file: "Consumers.java",
      src: `@Transactional
public void onPaymentEvent(PaymentEvent e) {
    // IDEMPOTENCY: the unique key does the dedup for us
    if (!dedup.tryInsert(e.messageId())) return;   // seen before -> skip, no double charge
    ledger.record(e);                              // safe to run exactly once
}

// OUTBOX: business write + message row commit together, or not at all
@Transactional
public Order place(OrderRequest r) {
    Order o = orders.save(new Order(r));           // business data
    outbox.save(new OutboxMsg("order.created", o.id()));  // the event, same txn
    return o;                                      // a relay publishes the outbox row later
}`,
    },
    {
      lang: "tables.sql", k: "sql", file: "tables.sql",
      src: `-- dedup: the UNIQUE(message_id) is the whole mechanism
CREATE TABLE processed_msg (
  message_id VARCHAR(64) PRIMARY KEY,     -- second insert of the same id fails
  handled_at DATETIME NOT NULL
);

-- outbox: written in the SAME local transaction as the business change
CREATE TABLE outbox (
  id         BIGINT PRIMARY KEY AUTO_INCREMENT,
  topic      VARCHAR(64) NOT NULL,
  payload    LONGBLOB NOT NULL,
  published  BOOLEAN NOT NULL DEFAULT FALSE,  -- a relay flips this after sending
  created_at DATETIME NOT NULL
);`,
    },
    {
      lang: "relay", k: "properties", file: "why-outbox.txt",
      src: `# The dual-write problem the outbox solves
#
#   update DB, then send message   -> crash after commit = LOST event
#   send message, then update DB    -> crash after send   = FALSE event
#
# Outbox: DB row + message row in ONE local transaction (atomic).
# A separate relay polls unpublished rows and sends them, marking each
# published only after the broker acks. Crash anywhere = at-least-once,
# and the consumer's idempotency (left) makes at-least-once safe.`,
    },
  ],
};

/* ============ OB1 · sc16 — distributed tracing ============ */
CODE.sc16 = {
  note: {
    zh: "Spring Boot 3 用 Micrometer Tracing(取代 Sleuth)自动给每条请求打 traceId 并在服务间通过 W3C traceparent 头传递,你几乎不用写代码。采样率是成本与可见性的取舍:全量最全但最贵,生产上常按 10% 采样、对错误全采。",
    en: "Spring Boot 3 uses Micrometer Tracing (which replaced Sleuth) to stamp every request with a traceId and propagate it via the W3C traceparent header — almost no code required. The sampling rate trades cost against visibility: full is fullest but priciest; production often samples ~10% and captures all errors.",
  },
  tabs: [
    {
      lang: "Java", k: "java", file: "OrderController.java",
      src: `@RestController
class OrderController {
    private static final Logger log = LoggerFactory.getLogger(OrderController.class);

    @GetMapping("/orders/{id}")
    Order get(@PathVariable String id) {
        // No tracing code here. Micrometer auto-instruments the incoming request,
        // the outgoing Feign/RestClient calls, and propagates the traceparent
        // header across the chain. The traceId is even in the log line's MDC:
        log.info("fetching order {}", id);   // -> includes [traceId,spanId] automatically
        return service.get(id);
    }
}`,
    },
    {
      lang: "application.yml", k: "yaml", file: "application.yml",
      src: `management:
  tracing:
    sampling:
      probability: 0.10          # sample 10% of requests (1.0 = everything)
  zipkin:
    tracing:
      endpoint: http://zipkin:9411/api/v2/spans
# dependencies: micrometer-tracing-bridge-brave + zipkin-reporter-brave
logging:
  pattern:
    level: "%5p [\${spring.application.name},%X{traceId:-},%X{spanId:-}]"`,
    },
    {
      lang: "compose", k: "yaml", file: "docker-compose.yml",
      run: "docker compose up zipkin   # then open http://localhost:9411",
      src: `services:
  zipkin:
    image: openzipkin/zipkin:3
    ports: ["9411:9411"]
    # every service reports spans here; Zipkin stitches them by traceId into
    # the waterfall you saw in the bench — one slow span, found in one click.`,
    },
  ],
};

/* ============ OB2 · sc17 — metrics & SLO ============ */
CODE.sc17 = {
  note: {
    zh: "Actuator 暴露指标、Prometheus 来抓、Grafana 画图。关键是别只看平均值:配置里打开 histogram 和 P95/P99 分位,再定一条 SLO(如「99% 快于 300ms」)。分位数不能跨实例求平均——必须在 Prometheus 里用 histogram_quantile 从直方图算。",
    en: "Actuator exposes metrics, Prometheus scrapes, Grafana draws. The point is not to watch the average: enable histograms and P95/P99 in config, then set an SLO ('99% faster than 300ms'). Percentiles cannot be averaged across instances — compute them in Prometheus with histogram_quantile over the histogram.",
  },
  tabs: [
    {
      lang: "application.yml", k: "yaml", file: "application.yml",
      src: `management:
  endpoints:
    web: { exposure: { include: prometheus, health } }
  metrics:
    distribution:
      # emit a histogram so percentiles are computable server-side
      percentiles-histogram: { http.server.requests: true }
      slo:
        http.server.requests: 200ms, 300ms, 500ms   # SLO buckets
      percentiles:
        http.server.requests: 0.95, 0.99            # client-side P95/P99 too`,
    },
    {
      lang: "prometheus.yml", k: "yaml", file: "prometheus.yml",
      src: `scrape_configs:
  - job_name: shop-services
    metrics_path: /actuator/prometheus
    scrape_interval: 10s
    static_configs:
      - targets: [ "order-service:8081", "inventory-service:8082" ]
# Grafana query for the P99 (NEVER avg the percentile across pods):
#   histogram_quantile(0.99,
#     sum by (le) (rate(http_server_requests_seconds_bucket[5m])))`,
    },
    {
      lang: "Java", k: "java", file: "Timed.java",
      src: `@RestController
class CheckoutController {
    // @Timed records rate, errors and a latency distribution for this endpoint
    @Timed(value = "checkout", histogram = true, percentiles = {0.95, 0.99})
    @PostMapping("/checkout")
    Receipt checkout(@RequestBody Cart cart) {
        return service.checkout(cart);
    }
    // The average can sit at 40ms while P99 is 1.2s. Alert on the SLO burn
    // rate (error budget), not on the mean.
}`,
    },
  ],
};

/* ============ OB3 · sc18 — log aggregation ============ */
CODE.sc18 = {
  note: {
    zh: "容器一销毁本地日志就没了,所以日志必须集中(ELK/Loki)并按 traceId 关联。用 JSON 结构化输出、把 traceId 放进每条日志,查一次请求就是按一个 ID 过滤——和链路追踪共用同一个 ID。这里是 logback 的 JSON + MDC 配置。",
    en: "Local logs vanish when a container dies, so logs must be centralised (ELK/Loki) and correlated by traceId. Emit structured JSON and put the traceId in every line, so finding one request is filtering by one id — the same id tracing uses. Here is the logback JSON + MDC config.",
  },
  tabs: [
    {
      lang: "logback-spring.xml", k: "xml", file: "logback-spring.xml",
      src: `<configuration>
  <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
    <!-- structured JSON: machine-searchable, and carries the trace context -->
    <encoder class="net.logstash.logback.encoder.LogstashEncoder">
      <includeMdcKeyName>traceId</includeMdcKeyName>
      <includeMdcKeyName>spanId</includeMdcKeyName>
    </encoder>
  </appender>
  <root level="INFO">
    <appender-ref ref="JSON"/>
  </root>
</configuration>`,
    },
    {
      lang: "application.yml", k: "yaml", file: "application.yml",
      src: `# Micrometer puts traceId/spanId into the MDC automatically (see OB1).
# The JSON encoder above then ships them on every line, so in Kibana/Grafana
# you filter:   traceId = "3f9a1c..."   and get this one request's whole story,
# ordered, across gateway + order + inventory + payment.
logging:
  level:
    com.shop: INFO
# Sampling trade: keep 100% of ERROR logs, sample INFO — you cannot afford to
# store everything, but must be able to find the incident when it happens.`,
    },
    {
      lang: "compose", k: "yaml", file: "docker-compose.yml",
      run: "docker compose up loki grafana   # lighter than a full ELK stack",
      src: `services:
  loki:
    image: grafana/loki:3.0
    ports: ["3100:3100"]
  promtail:
    image: grafana/promtail:3.0    # ships each container's stdout to Loki
    volumes: [ "/var/log:/var/log" ]
  grafana:
    image: grafana/grafana:11
    ports: ["3000:3000"]`,
    },
  ],
};

/* ============ OP1 · sc19 — containerise & place ============ */
CODE.sc19 = {
  note: {
    zh: "先用多阶段 Dockerfile 把服务打成不可变镜像(「我机器上能跑」从此失效)。再用 K8s 的 requests/limits 做资源装箱,用 podAntiAffinity 把同一服务的副本强制分散到不同节点——这样任何一台机器宕机都只吃掉系统的一小块,而不是整条下单链路。",
    en: "First a multi-stage Dockerfile packs the service into an immutable image ('works on my machine' dies here). Then Kubernetes requests/limits bin-pack by resource, and podAntiAffinity forces a service's replicas onto different nodes — so any one machine failing eats only a slice, not the whole checkout chain.",
  },
  tabs: [
    {
      lang: "Dockerfile", k: "dockerfile", file: "Dockerfile",
      run: "docker build -t shop/order-service:1.0 .",
      src: `# stage 1: build
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY . .
RUN mvn -q -DskipTests package

# stage 2: a small runtime image — immutable, identical everywhere
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /src/target/order-service.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java","-XX:MaxRAMPercentage=75","-jar","app.jar"]`,
    },
    {
      lang: "deployment.yaml", k: "yaml", file: "k8s/order-deployment.yaml",
      src: `apiVersion: apps/v1
kind: Deployment
metadata: { name: order-service }
spec:
  replicas: 3
  selector: { matchLabels: { app: order-service } }
  template:
    metadata: { labels: { app: order-service } }
    spec:
      containers:
        - name: order
          image: shop/order-service:1.0
          resources:                         # bin-packing: the scheduler reads these
            requests: { cpu: "250m", memory: "512Mi" }
            limits:   { cpu: "1",    memory: "768Mi" }
      affinity:
        podAntiAffinity:                     # spread replicas across nodes
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector: { matchLabels: { app: order-service } }
              topologyKey: kubernetes.io/hostname`,
    },
    {
      lang: "blast-radius", k: "properties", file: "blast-radius.txt",
      src: `# Placement is disaster-recovery design, not trivia.
#
#   3 replicas, podAntiAffinity by hostname  -> one per node
#   node-2 dies                              -> 1 of 3 order pods gone,
#                                               2 still serving. Checkout lives.
#
# WITHOUT anti-affinity the scheduler MAY stack all 3 on node-2 to bin-pack
# tightly. Then node-2 dying = order-service is entirely DOWN = checkout broken.
# Co-locating order + payment on one node makes that node a single point.`,
    },
  ],
};

/* ============ OP2 · sc20 — HPA autoscaling ============ */
CODE.sc20 = {
  note: {
    zh: "HPA 按 CPU 或每秒请求把副本在 min/max 之间自动增减。三个必须调的地方:目标利用率(留多少余量=成本 vs 延迟)、readinessProbe(没就绪就别接流量,否则冷启动期间照样超时)、以及 behavior 里的稳定窗口(防止流量在阈值附近抖动时副本数疯狂横跳)。",
    en: "The HPA scales replicas between min and max on CPU or requests-per-second. Three things you must tune: the target utilisation (headroom = cost vs latency), the readinessProbe (don't take traffic before ready, or you time out during cold start), and the stabilisation window in behavior (stops the replica count thrashing when traffic hovers at the threshold).",
  },
  tabs: [
    {
      lang: "hpa.yaml", k: "yaml", file: "k8s/order-hpa.yaml",
      run: "kubectl apply -f k8s/order-hpa.yaml",
      src: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: order-hpa }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: order-service }
  minReplicas: 3
  maxReplicas: 14
  metrics:
    - type: Resource
      resource: { name: cpu, target: { type: Utilization, averageUtilization: 60 } }
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 120    # wait 2 min before scaling down (anti-flap)
    scaleUp:
      stabilizationWindowSeconds: 0      # scale up promptly`,
    },
    {
      lang: "readiness.yaml", k: "yaml", file: "k8s/order-deployment.yaml",
      src: `containers:
  - name: order
    image: shop/order-service:1.0
    readinessProbe:                      # do NOT route traffic until truly ready
      httpGet: { path: /actuator/health/readiness, port: 8081 }
      initialDelaySeconds: 20            # JVM warm-up: the cold-start gap
      periodSeconds: 5
    startupProbe:                        # give a slow JVM time before liveness kicks in
      httpGet: { path: /actuator/health/liveness, port: 8081 }
      failureThreshold: 30
      periodSeconds: 5
# Cold start is the trap: scaling is decided in ms but a new pod needs tens of
# seconds to serve. Mitigate with smaller images, CRaC, or a GraalVM native image.`,
    },
    {
      lang: "shell", k: "sh", file: "watch.sh",
      run: "sh watch.sh   # drive load, watch replicas chase it",
      src: `kubectl get hpa order-hpa --watch        # TARGETS / REPLICAS live
# in another shell, generate a spike:
kubectl run load --image=williamyeh/hey --restart=Never -- \\
  -z 3m -c 200 http://order-service:8081/checkout
# observe: CPU climbs -> HPA raises replicas -> but timeouts appear during the
# cold-start gap. Then it settles; after the spike, scale-down waits the window.`,
    },
  ],
};

/* ============ OP3 · sc21 — cross-DC replication ============ */
CODE.sc21 = {
  note: {
    zh: "异地多活的地基是跨机房数据复制。异步复制写得快但故障时会丢还没复制过去的数据(RPO>0);半同步复制在「至少一个从库确认」后才返回,把 RPO 压到接近 0,代价是每次写多等一个跨机房往返。流量则按地理就近路由,故障时切走。",
    en: "The foundation of active-active is cross-DC replication. Async replication is fast but loses not-yet-replicated data on failure (RPO>0); semi-sync returns only after at least one replica acks, driving RPO near 0 at the cost of a cross-DC round trip per write. Traffic is geo-routed to the nearest DC and shifted away on failure.",
  },
  tabs: [
    {
      lang: "my.cnf", k: "properties", file: "dc-a/my.cnf",
      src: `# DC-A primary: semi-synchronous replication to DC-B
[mysqld]
server_id                       = 1
log_bin                         = mysql-bin
rpl_semi_sync_master_enabled    = 1        # wait for a replica ack...
rpl_semi_sync_master_timeout    = 1000     # ...but fall back to async after 1s
# RPO trade lives here:
#   semi-sync ack  -> RPO ~ 0     (write waits ~1 cross-DC RTT)
#   async fallback -> RPO > 0     (a failover loses in-flight writes)`,
    },
    {
      lang: "shell", k: "sh", file: "setup-replica.sh",
      run: "# run on the DC-B replica to follow the DC-A primary",
      src: `# point the DC-B database at the DC-A primary
mysql -h dc-b-db <<'SQL'
CHANGE MASTER TO
  MASTER_HOST = 'dc-a-db.internal',
  MASTER_USER = 'repl',
  MASTER_AUTO_POSITION = 1;         -- GTID-based, survives failover
START SLAVE;
SQL
# check the lag that becomes a "cannot read my own write" window:
mysql -h dc-b-db -e "SHOW SLAVE STATUS\\G" | grep Seconds_Behind_Master`,
    },
    {
      lang: "traffic.yaml", k: "yaml", file: "geo-routing.yaml",
      src: `# route users to their nearest DC; on a DC failure, shift its share away
routing:
  policy: geo-proximity
  endpoints:
    - dc: dc-a
      region: cn-east
      weight: 100          # normally all east traffic here
    - dc: dc-b
      region: cn-south
      weight: 100
  failover:
    dc-a:
      shift-to: dc-b       # RTO ~ seconds if dc-b is already active-active
      # if dc-b were only a read replica, you must first PROMOTE it -> longer RTO`,
    },
  ],
};

/* ============ HA1 · sc22 — resource-server security ============ */
CODE.sc22 = {
  note: {
    zh: "内网不是可信网。用户在网关用 OAuth2/OIDC 拿到签名 JWT,之后每个服务作为资源服务器本地验签(通过 JWKS 拿公钥,不必回认证中心),从令牌里解出用户和权限。JWT 自包含、快,但过期前难吊销;要即时吊销就换不透明令牌。",
    en: "The internal network is not trusted. The user gets a signed JWT at the gateway via OAuth2/OIDC, then each service, as a resource server, verifies it locally (fetching the public key via JWKS, no round-trip to the auth server) and reads the user and scopes from it. A JWT is self-contained and fast but hard to revoke before expiry; use opaque tokens when you need instant revocation.",
  },
  tabs: [
    {
      lang: "Java", k: "java", file: "SecurityConfig.java",
      src: `@Configuration
@EnableMethodSecurity                 // enables @PreAuthorize on methods
class SecurityConfig {
    @Bean
    SecurityFilterChain chain(HttpSecurity http) throws Exception {
        return http
            .authorizeHttpRequests(a -> a
                .requestMatchers("/actuator/health").permitAll()
                .anyRequest().authenticated())
            // verify the JWT locally on every request — no auth-server call
            .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
            .build();
    }
}

@RestController
class OrderController {
    @PreAuthorize("hasAuthority('SCOPE_orders:write')")   // scope straight from the JWT
    @PostMapping("/orders") Order create(@RequestBody OrderRequest r) { return svc.create(r); }
}`,
    },
    {
      lang: "application.yml", k: "yaml", file: "application.yml",
      src: `spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          # the service fetches the signing public keys from here (JWKS) and
          # caches them; validation is then local, fast, and offline-capable
          issuer-uri: https://auth.shop.com/realms/shop
          # jwk-set-uri is derived from the issuer, or set it explicitly:
          # jwk-set-uri: https://auth.shop.com/realms/shop/protocol/openid-connect/certs`,
    },
    {
      lang: "tradeoff", k: "properties", file: "jwt-vs-opaque.txt",
      src: `# JWT vs opaque token
#
#                 verify cost         revocation
#   JWT           local, ~0.1ms       hard (valid until exp) -> use SHORT expiry
#   opaque        call auth server    instant (server checks a store)
#
# Most microservice stacks pick JWT + short TTL + a refresh token, and accept
# that a compromised token is valid until it expires (minutes, not days).
# mTLS between services (zero trust) stops a breached service from moving laterally.`,
    },
  ],
};

/* ============ HA2 · sc23 — chaos engineering ============ */
CODE.sc23 = {
  note: {
    zh: "没验证过的容错就该假设它是坏的。混沌工程先定义可度量的稳态假设(下单成功率>99%),再在受控范围注入故障——这里用 Chaos Mesh 给支付调用注入延迟和错误,然后看熔断/超时是否真的把爆炸半径关住。守住了才算数,守不住就在演习里、而不是事故里发现问题。",
    en: "Fault-tolerance you have not verified should be assumed broken. Chaos engineering first defines a measurable steady-state hypothesis (checkout success > 99%), then injects failure within a bounded scope — here Chaos Mesh injects latency and errors into the payment call — and checks whether breaking/timeouts really hold the blast radius. It only counts if it holds; if not, you found it in a drill, not an incident.",
  },
  tabs: [
    {
      lang: "networkchaos.yaml", k: "yaml", file: "chaos/payment-latency.yaml",
      run: "kubectl apply -f chaos/payment-latency.yaml",
      src: `apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata: { name: payment-latency }
spec:
  action: delay
  mode: all
  selector:
    labelSelectors: { app: payment-service }   # bound the blast radius
  delay:
    latency: "800ms"                            # inject the fault
    jitter: "200ms"
  duration: "5m"                                # self-reverting — a drill, not an outage`,
    },
    {
      lang: "Java", k: "java", file: "SteadyState.java",
      src: `// the steady-state hypothesis, checked continuously during the experiment
@Component
class SteadyStateProbe {
    @Scheduled(fixedRate = 5000)
    void check() {
        double success = metrics.successRate("checkout", Duration.ofMinutes(1));
        double p99     = metrics.percentile("checkout", 0.99);
        // hypothesis: checkout stays healthy EVEN WHILE payment is degraded
        boolean holds = success > 0.99 && p99 < Duration.ofMillis(800).toNanos();
        if (!holds) alert.page("steady state broken under chaos: success=" + success);
        // holds  -> your breaker/timeout/bulkhead actually work.
        // broken -> you found a miswired breaker in a drill, not at 3am.
    }
}`,
    },
    {
      lang: "shell", k: "sh", file: "drill.sh",
      run: "sh drill.sh   # start small, widen only if steady state holds",
      src: `# 1. record the steady state BEFORE injecting
curl -s localhost:9090/api/v1/query?query=checkout_success_rate
# 2. inject (start with ONE pod, not the whole service)
kubectl apply -f chaos/payment-latency.yaml
# 3. watch the hypothesis; if checkout success stays > 99%, resilience works
# 4. the experiment auto-reverts after 5m; widen scope only if it held`,
    },
  ],
};

/* ============ HA3 · sc24 — the whole system ============ */
CODE.sc24 = {
  note: {
    zh: "综合实战:一条 /checkout 请求把整本书串起来。Java 是编排(网关进来 → 订单 → Feign 调库存带熔断 → Seata 分布式事务 → 发事件异步消费);compose 是把注册中心、网关、服务、追踪、消息全拉起来的一键环境;shell 是打一条真实请求走完全场。",
    en: "The capstone: one /checkout request ties the whole book together. Java is the orchestration (in through the gateway → order → Feign to inventory with a breaker → Seata distributed transaction → emit an event consumed asynchronously); compose is a one-command environment bringing up registry, gateway, services, tracing and messaging; shell fires one real request through the whole system.",
  },
  tabs: [
    {
      lang: "Java", k: "java", file: "CheckoutOrchestration.java",
      src: `@Service
public class CheckoutService {

    @GlobalTransactional(name = "checkout")          // Seata: TX2
    public Receipt checkout(Cart cart) {
        boolean ok = inventory.reserve(cart);        // OpenFeign + breaker: CM1/CM3
        if (!ok) throw new OutOfStockException();
        PayResult pay = payment.charge(cart.total()); // resilient call: CM3
        Order order = orders.save(new Order(cart, pay));
        events.publish(new OrderCreated(order.id())); // Stream, async consumers: TX1
        return Receipt.of(order);                     // whole thing traced end-to-end: OB1
    }
}
// Discovery (RD), gateway (GW), config (GW3), autoscaling (OP2), active-active
// (OP3) surround this method. It is small BECAUSE the platform does the rest.`,
    },
    {
      lang: "compose", k: "yaml", file: "docker-compose.yml",
      run: "docker compose up   # the whole stack, one command",
      src: `services:
  nacos:     { image: nacos/nacos-server:v2.3.2, ports: ["8848:8848"] }
  gateway:   { image: shop/gateway:1.0,   ports: ["8080:8080"] }
  order:     { image: shop/order:1.0 }
  inventory: { image: shop/inventory:1.0 }
  payment:   { image: shop/payment:1.0 }
  seata:     { image: seataio/seata-server:2.0 }
  kafka:     { image: bitnami/kafka:3.7 }
  zipkin:    { image: openzipkin/zipkin:3, ports: ["9411:9411"] }
  # registry + gateway + services + transactions + messaging + tracing`,
    },
    {
      lang: "shell", k: "sh", file: "checkout.sh",
      run: "sh checkout.sh   # one request, through the entire system",
      src: `# 1. get a token from the auth server (HA1)
TOKEN=$(curl -s auth/token -d grant_type=client_credentials | jq -r .access_token)
# 2. fire the checkout through the gateway (GW): auth, rate-limit, route
curl -s -X POST localhost:8080/api/checkout \\
  -H "Authorization: Bearer \$TOKEN" \\
  -d '{"sku":"SKU-9","qty":2}'
# 3. watch it in Zipkin: gateway -> order -> inventory -> payment -> event
open http://localhost:9411
# every module of this book is on that one trace.`,
    },
  ],
};

/* ============ TX4 · sc25 — Kafka vs RabbitMQ ============ */
CODE.sc25 = {
  note: {
    zh: "Spring Cloud Stream 的威力在这里体现:同一段函数式代码,换一个 binder 依赖、改一段 YAML,就能从 Kafka 切到 RabbitMQ,业务代码一行不动。但两段 YAML 长得不一样,恰恰暴露了两者的内核:Kafka 配的是分区、消费组、offset 起点;RabbitMQ 配的是交换机类型、路由键、绑定——选型决定的是能力,binder 决定的只是接线。",
    en: "This is where Spring Cloud Stream earns its keep: the same functional code moves from Kafka to RabbitMQ by swapping a binder dependency and a slice of YAML, with the business code untouched. But the two YAMLs look different, and that difference exposes the two cores: Kafka configures partitions, consumer groups and the offset start; RabbitMQ configures the exchange type, routing key and bindings. The choice decides the capability; the binder decides only the wiring.",
  },
  tabs: [
    {
      lang: "Java", k: "java", file: "OrderEvents.java",
      run: "// identical for Kafka AND RabbitMQ — the binder is a config choice",
      src: `// PRODUCER
@Service
class OrderService {
    private final StreamBridge bus;
    OrderService(StreamBridge bus){ this.bus = bus; }
    void place(Order o){ bus.send("orderCreated-out-0", new OrderCreated(o.id())); }
}

// CONSUMER — a bean named after the binding
@Bean
Consumer<OrderCreated> points(){
    return evt -> loyalty.award(evt.customerId(), 10);
}
// Not one line here mentions Kafka or RabbitMQ. Switching brokers is a
// dependency swap (spring-cloud-stream-binder-kafka <-> -rabbit) plus YAML.`,
    },
    {
      lang: "kafka.yml", k: "yaml", file: "application-kafka.yml",
      src: `spring:
  cloud:
    stream:
      bindings:
        orderCreated-out-0: { destination: order.created }
        points-in-0:
          destination: order.created
          group: loyalty
          consumer: { concurrency: 3 }        # capped by partition count
      kafka:
        binder: { brokers: kafka:9092 }
        bindings:
          orderCreated-out-0:
            producer: { partition-count: 4 }   # throughput scales with partitions
          points-in-0:
            consumer: { start-offset: earliest } # replay: re-read from offset 0`,
    },
    {
      lang: "rabbit.yml", k: "yaml", file: "application-rabbit.yml",
      src: `spring:
  cloud:
    stream:
      bindings:
        orderCreated-out-0: { destination: order.created }
        points-in-0:
          destination: order.created
          group: loyalty                       # -> a durable queue bound to the exchange
      rabbit:
        bindings:
          orderCreated-out-0:
            producer:
              exchange-type: topic             # routing lives in the exchange
              routing-key-expression: headers['region']
          points-in-0:
            consumer:
              # once acked a message is gone — no "start-offset: earliest" here,
              # because RabbitMQ classic queues cannot rewind. (Streams plugin can.)
              acknowledge-mode: AUTO`,
    },
  ],
};

/* ============ OP4 · sc27 — service mesh ============ */
CODE.sc27 = {
  note: {
    zh: "网格把治理搬到基础设施:第一段 Istio 的 VirtualService/DestinationRule 用 YAML 声明了灰度权重、重试、超时、熔断(outlierDetection)和自动 mTLS——这些原本是 Resilience4j 注解和网关配置。第二段是关键:一旦网格接管,你就要把应用里的 @Retry/@CircuitBreaker 删掉,否则两边都重试会翻倍成风暴;只留下网格无法理解的业务兜底逻辑。第三段是 sidecar 注入——给命名空间打个标签,每个 Pod 就自动多出一个 Envoy 容器(2/2)。",
    en: "The mesh moves governance into infrastructure: the first listing's Istio VirtualService/DestinationRule declares in YAML the canary weight, retries, timeout, breaking (outlierDetection) and automatic mTLS — things that used to be Resilience4j annotations and gateway config. The second is the key point: once the mesh takes over, delete the app's @Retry/@CircuitBreaker, or retrying in both doubles into a storm; keep only the business fallback the mesh cannot understand. The third is sidecar injection — label the namespace and every pod gains an Envoy container (2/2).",
  },
  tabs: [
    {
      lang: "istio (traffic)", k: "yaml", file: "order-traffic.yaml",
      run: "kubectl apply -f order-traffic.yaml   # applied by the Envoy sidecars",
      src: `# what used to be @Retry / @CircuitBreaker / gateway weight now lives here —
# language-agnostic, enforced by the sidecars, no app change.
apiVersion: networking.istio.io/v1
kind: VirtualService
metadata: { name: order }
spec:
  hosts: [ order ]
  http:
    - route:
        - destination: { host: order, subset: v1 }
          weight: 90          # canary split, service-to-service (not only at the edge)
        - destination: { host: order, subset: v2 }
          weight: 10
      retries: { attempts: 3, perTryTimeout: 500ms }   # replaces @Retry
      timeout: 2s
---
apiVersion: networking.istio.io/v1
kind: DestinationRule
metadata: { name: order }
spec:
  host: order
  trafficPolicy:
    tls: { mode: ISTIO_MUTUAL }        # automatic mTLS — no code, no certs to manage
    outlierDetection:                  # this IS the circuit breaker
      consecutive5xxErrors: 5
      baseEjectionTime: 30s
  subsets:
    - { name: v1, labels: { version: v1 } }
    - { name: v2, labels: { version: v2 } }`,
    },
    {
      lang: "Spring (delete)", k: "java", file: "InventoryClient.java",
      src: `// BEFORE the mesh — resilience lived in the app (Module III):
@CircuitBreaker(name = "inventory", fallbackMethod = "queued")
@Retry(name = "inventory")
public boolean reserve(Cart c){ return inventory.reserve(c); }

// AFTER adopting the mesh — the sidecar does retries, timeouts, breaking and
// mTLS. DELETE those annotations. Doing BOTH double-retries into a storm.
public boolean reserve(Cart c){ return inventory.reserve(c); }

// Keep ONLY what the mesh cannot know: business-specific fallback.
public boolean reserveOrBackorder(Cart c){
    try { return inventory.reserve(c); }
    catch (Exception e){ return backorder(c); }   // a business decision, stays in code
}`,
    },
    {
      lang: "sidecar inject", k: "yaml", file: "namespace.yaml",
      run: "istioctl install -y && kubectl apply -f namespace.yaml",
      src: `# label the namespace; Istio auto-injects an Envoy sidecar into every pod
apiVersion: v1
kind: Namespace
metadata:
  name: shop
  labels: { istio-injection: enabled }
---
# after this, every pod runs TWO containers: your app + istio-proxy
#  $ kubectl get pod -n shop
#  NAME                READY   STATUS
#  order-7d9f...       2/2     Running    <- app + Envoy sidecar
#  inventory-5c8a...   2/2     Running    <- the "2/2" IS the sidecar`,
    },
  ],
};
