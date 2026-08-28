/* =========================================================
   code.jsx — <CodeLab> + the listings for sc1–sc12
   ---------------------------------------------------------
   Every chapter ships the same job from three angles: the
   Java service code, the application.yml, and a deploy
   manifest (Dockerfile / compose / k8s / shell). Sources are
   normal template literals — write \${...} for a literal
   Spring placeholder (String.raw would still interpolate it).
   code2.jsx extends the same CODE registry for sc13–sc24.
   ========================================================= */

const KW = {
  java: "public private protected class interface extends implements static final void int long short byte char boolean float double new return if else for while do switch case break continue try catch finally throw throws import package this super null true false instanceof synchronized var record enum default abstract",
  yaml: "true false null yes no on off",
  sql: "CREATE TABLE PRIMARY KEY NOT NULL UNIQUE INDEX INSERT INTO VALUES SELECT FROM WHERE UPDATE SET DELETE ALTER ADD COLUMN DEFAULT AUTO_INCREMENT BIGINT VARCHAR INT DATETIME TIMESTAMP ENGINE CHANGE MASTER TO START SLAVE bigint varchar int datetime timestamp create table primary key not null unique index insert into values select from where",
  dockerfile: "FROM AS RUN CMD COPY ADD ENV EXPOSE WORKDIR ENTRYPOINT ARG LABEL USER VOLUME HEALTHCHECK",
  sh: "if then else fi for do done while case esac function echo export local return sudo curl docker kubectl mvn java set",
  xml: "",
  properties: "true false",
  proto: "syntax package message repeated optional required reserved enum service rpc returns stream string int32 int64 uint32 uint64 sint32 bool bytes double float map option",
};
const CODE_RE = {
  java: /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(\b\d[\w.]*)|(@?[A-Za-z_][A-Za-z0-9_]*)/g,
  yaml: /(#[^\n]*)|("(?:\\.|[^"\\\n])*"|'(?:[^'\n])*')|(\b\d[\w.]*)|([A-Za-z_][A-Za-z0-9_.-]*)/g,
  properties: /(#[^\n]*)|("(?:\\.|[^"\\\n])*")|(\b\d[\w.]*)|([A-Za-z_][A-Za-z0-9_.-]*)/g,
  sql: /(--[^\n]*|\/\*[\s\S]*?\*\/)|('(?:[^'\n])*'|"(?:[^"\n]*)")|(\b\d[\w.]*)|([A-Za-z_][A-Za-z0-9_]*)/g,
  dockerfile: /(#[^\n]*)|("(?:\\.|[^"\\\n])*")|(\b\d[\w.]*)|([A-Za-z_][A-Za-z0-9_]*)/g,
  sh: /(#[^\n]*)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(\b\d[\w.]*)|([A-Za-z_][A-Za-z0-9_]*)/g,
  xml: /(<!--[\s\S]*?-->)|("(?:[^"\n]*)")|(\b\d[\w.]*)|(<\/?[A-Za-z_][A-Za-z0-9_.:-]*|[A-Za-z_][A-Za-z0-9_.:-]*)/g,
  proto: /(\/\/[^\n]*)|("(?:\\.|[^"\\\n])*")|(\b\d[\w.]*)|([A-Za-z_][A-Za-z0-9_]*)/g,
};
const escHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// Small, dependency-free highlighter: comments, strings, numbers, keywords.
// For XML, group 4 captures "<tag" opens and colours them as keywords.
function highlight(src, k) {
  const re = CODE_RE[k] || CODE_RE.java;
  const kws = new Set((KW[k] || "").split(/\s+/).filter(Boolean));
  re.lastIndex = 0;
  let out = "", last = 0, m;
  while ((m = re.exec(src)) !== null) {
    out += escHtml(src.slice(last, m.index));
    if (m[1]) out += `<span class="cm">${escHtml(m[1])}</span>`;
    else if (m[2]) out += `<span class="st">${escHtml(m[2])}</span>`;
    else if (m[3]) out += `<span class="nu">${escHtml(m[3])}</span>`;
    else if (m[4]) {
      const w = m[4];
      const isTag = k === "xml" && w[0] === "<";
      const isKw = kws.has(w) || (k === "java" && w[0] === "@");
      out += (isTag || isKw) ? `<span class="kw">${escHtml(w)}</span>` : escHtml(w);
    }
    last = m.index + m[0].length;
  }
  out += escHtml(src.slice(last));
  return out;
}

const CodeLab = ({ id }) => {
  const t = useT();
  const lang = useLang();
  const entry = CODE[id];
  const [tab, setTab] = React.useState(0);
  const [copied, setCopied] = React.useState(false);
  React.useEffect(() => { setTab(0); }, [id]);
  if (!entry) return null;
  const cur = entry.tabs[Math.min(tab, entry.tabs.length - 1)];
  const copy = () => {
    try {
      navigator.clipboard.writeText(cur.src);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (e) { /* clipboard unavailable */ }
  };
  return (
    <div className="sc-code-lab">
      <div className="cl-head">
        {entry.tabs.map((x, i) => (
          <button key={i} className={`sc-tab ${i === tab ? "on" : ""}`} onClick={() => setTab(i)}>{x.lang}</button>
        ))}
        <span className="cl-file">{cur.file}</span>
        <button className={`cl-copy ${copied ? "done" : ""}`} onClick={copy}>{copied ? t("copied_btn") : t("copy_btn")}</button>
      </div>
      <pre><code dangerouslySetInnerHTML={{ __html: highlight(cur.src, cur.k) }} /></pre>
      {cur.run ? <div className="cl-run">{cur.run}</div> : null}
      {entry.note ? <div className="cl-note">{pick(lang, entry.note)}</div> : null}
    </div>
  );
};

const CODE = {};

/* ============ FD1 · sc1 — the remote boundary ============ */
CODE.sc1 = {
  note: {
    zh: "拆开之后,一个本地方法调用变成了远程调用:同样一行 inventory.check(),现在会超时、会失败、会在网络分区时消失。三个视角——Java 里那行「看起来像本地」的调用、YAML 里的服务身份、以及 compose 里两个各自独立的进程——就是分布式税的起点。",
    en: "After the split, a local method call becomes a remote one: the same inventory.check() now times out, fails, and vanishes during a partition. Three angles — the 'looks local' call in Java, the service identity in YAML, and two independent processes in compose — are where the distributed tax begins.",
  },
  tabs: [
    {
      lang: "Java", k: "java", file: "OrderService.java",
      run: "// 这一行是网络调用,不是方法调用 —— 它会超时",
      src: `@Service
public class OrderService {

    private final InventoryClient inventory;   // a Feign client — a remote call

    public OrderService(InventoryClient inventory) {
        this.inventory = inventory;
    }

    public Order place(OrderRequest req) {
        // Looks exactly like a local method call. It is NOT.
        // Across the wire this can time out, throw, or hang for 30s.
        boolean ok = inventory.check(req.sku(), req.qty());
        if (!ok) throw new OutOfStockException(req.sku());
        return save(new Order(req));
    }
}

@FeignClient(name = "inventory-service")   // resolved via the registry
interface InventoryClient {
    @GetMapping("/stock/{sku}")
    boolean check(@PathVariable String sku, @RequestParam int qty);
}`,
    },
    {
      lang: "application.yml", k: "yaml", file: "order-service/application.yml",
      src: `spring:
  application:
    name: order-service          # this is the service's identity in the registry
server:
  port: 8081

# every remote call needs a deadline — a call with no timeout is a leak
spring.cloud.openfeign.client.config.default:
  connect-timeout: 1000
  read-timeout: 2000`,
    },
    {
      lang: "docker-compose", k: "yaml", file: "docker-compose.yml",
      run: "docker compose up   # two services, two processes, one network",
      src: `services:
  order-service:
    image: shop/order-service:1.0
    ports: ["8081:8081"]
  inventory-service:
    image: shop/inventory-service:1.0
    ports: ["8082:8082"]
  # Two independent deployables. Either can be released, scaled, or
  # crash on its own — that independence is the whole point, and the price.`,
    },
  ],
};

/* ============ FD2 · sc2 — version alignment ============ */
CODE.sc2 = {
  note: {
    zh: "版本地狱的解法只有一个:用 BOM 锁死三条线。Spring Boot、Spring Cloud、Spring Cloud Alibaba 的版本必须严格对齐(这里是 Boot 3.2 ↔ Cloud 2023.0.x ↔ Alibaba 2023.0.1.x),对不齐轻则某个自动配置不生效,重则启动直接报一堆看不懂的 NoSuchMethodError。",
    en: "There is one cure for version hell: lock all three lines with BOMs. Spring Boot, Spring Cloud and Spring Cloud Alibaba must align strictly (here Boot 3.2 ↔ Cloud 2023.0.x ↔ Alibaba 2023.0.1.x). A mismatch either silently disables an auto-configuration or greets you at startup with a wall of NoSuchMethodError.",
  },
  tabs: [
    {
      lang: "pom.xml", k: "xml", file: "pom.xml",
      run: "mvn -q dependency:tree | grep spring-cloud   # verify the aligned train",
      src: `<parent>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-parent</artifactId>
  <version>3.2.5</version>              <!-- line 1: Spring Boot -->
</parent>

<dependencyManagement>
  <dependencies>
    <dependency>                        <!-- line 2: Spring Cloud (Leyton) -->
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-dependencies</artifactId>
      <version>2023.0.1</version>
      <type>pom</type><scope>import</scope>
    </dependency>
    <dependency>                        <!-- line 3: Spring Cloud Alibaba -->
      <groupId>com.alibaba.cloud</groupId>
      <artifactId>spring-cloud-alibaba-dependencies</artifactId>
      <version>2023.0.1.0</version>
      <type>pom</type><scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>`,
    },
    {
      lang: "Java", k: "java", file: "Application.java",
      src: `@SpringBootApplication
@EnableDiscoveryClient          // one annotation, provider-agnostic:
public class Application {       // works with Nacos, Eureka or Consul
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
// Note: no version numbers here. The BOM decided them. Never pin a
// spring-cloud-* starter version by hand — let the imported BOM win.`,
    },
    {
      lang: "starters", k: "yaml", file: "which-starters.yml",
      src: `# pick components, not versions — the BOM supplies versions
dependencies:
  - spring-cloud-starter-alibaba-nacos-discovery   # registry (Alibaba)
  - spring-cloud-starter-alibaba-nacos-config       # config    (Alibaba)
  - spring-cloud-starter-loadbalancer               # LB        (official)
  - spring-cloud-starter-circuitbreaker-resilience4j # resilience (official)
  - spring-cloud-starter-gateway                    # gateway   (official)
# dead — do NOT add on Spring Boot 3:
#   spring-cloud-starter-netflix-ribbon / -hystrix / -zuul`,
    },
  ],
};

/* ============ FD3 · sc3 — database per service ============ */
CODE.sc3 = {
  note: {
    zh: "拆分的铁律:每个服务拥有自己的数据,绝不共享数据库。订单服务只能通过库存服务的 API 读库存,不能直接连库存的库——一旦两个服务连同一个库、共享一张表,你就没真正拆开,只是造了个连体的分布式单体。",
    en: "The iron rule of decomposition: each service owns its data and never shares a database. The order service reads stock only through the inventory service's API, never by connecting to inventory's database — the moment two services share a schema, you have not split them, you have built a conjoined distributed monolith.",
  },
  tabs: [
    {
      lang: "Java", k: "java", file: "OrderService.java",
      src: `@Service
public class OrderService {
    private final OrderRepository orders;      // OK: my own database
    private final InventoryClient inventory;   // OK: the other service's API

    // WRONG, never do this:
    //   private final InventoryRepository inventoryRepo;  // reaching into
    //                                                     // another service's DB
    public Order place(OrderRequest req) {
        if (!inventory.reserve(req.sku(), req.qty()))   // behaviour, over the wire
            throw new OutOfStockException(req.sku());
        return orders.save(new Order(req));             // my data, my transaction
    }
}`,
    },
    {
      lang: "application.yml", k: "yaml", file: "order-service/application.yml",
      src: `spring:
  application:
    name: order-service
  datasource:
    # the order service points at ITS OWN schema. inventory has another.
    url: jdbc:mysql://order-db:3306/order_db
    username: order
    password: \${ORDER_DB_PW}       # \${...} = injected from the environment`,
    },
    {
      lang: "schemas.sql", k: "sql", file: "schemas.sql",
      run: "# one schema per service — no cross-service foreign keys",
      src: `-- order-db (owned by order-service)
CREATE TABLE orders (
  id        BIGINT PRIMARY KEY AUTO_INCREMENT,
  sku       VARCHAR(64) NOT NULL,   -- a plain copy, NOT a foreign key into
  qty       INT NOT NULL,           -- inventory's table (that would couple them)
  status    VARCHAR(16) NOT NULL
);

-- inventory-db (owned by inventory-service, a DIFFERENT database)
CREATE TABLE stock (
  sku       VARCHAR(64) PRIMARY KEY,
  on_hand   INT NOT NULL
);`,
    },
  ],
};

/* ============ RD1 · sc4 — registry client ============ */
CODE.sc4 = {
  note: {
    zh: "注册与发现的客户端只需一个注解加几行配置。关键是那几个时间参数:心跳间隔和超时倍数共同决定了「实例挂了多久才被发现」,而客户端本地缓存让注册中心短暂不可用时你仍能调用到已知实例。",
    en: "The register-and-discover client is one annotation plus a few lines of config. What matters are the timing parameters: the heartbeat interval and timeout multiple together decide how long a dead instance goes unnoticed, and the client-side cache lets you keep calling known instances when the registry is briefly unavailable.",
  },
  tabs: [
    {
      lang: "Java", k: "java", file: "DiscoveryDemo.java",
      src: `@SpringBootApplication
@EnableDiscoveryClient          // register on startup, renew with heartbeats
public class Application { public static void main(String[] a){ SpringApplication.run(Application.class,a);} }

@RestController
class WhereController {
    private final DiscoveryClient discovery;
    WhereController(DiscoveryClient d){ this.discovery = d; }

    @GetMapping("/instances")
    List<String> instances() {
        // the live list the registry currently believes in — it changes
        return discovery.getInstances("inventory-service").stream()
                 .map(i -> i.getHost() + ":" + i.getPort()).toList();
    }
}`,
    },
    {
      lang: "application.yml", k: "yaml", file: "application.yml",
      src: `spring:
  cloud:
    nacos:
      discovery:
        server-addr: nacos:8848
        heart-beat-interval: 5000     # send a heartbeat every 5s
        heart-beat-timeout: 15000     # missed for 15s → unhealthy
        ip-delete-timeout: 30000      # gone for 30s → removed from the list
# short timeouts = fast detection but more false removals on a GC pause;
# long timeouts = fewer false removals but traffic hits dead nodes longer.`,
    },
    {
      lang: "shell", k: "sh", file: "verify.sh",
      run: "sh verify.sh   # watch an instance appear, then disappear",
      src: `# bring up two instances of inventory on different ports
SERVER_PORT=8082 java -jar inventory.jar &
SERVER_PORT=8083 java -jar inventory.jar &
sleep 8
curl -s localhost:8081/instances     # -> two entries
# kill one and watch the registry take ~30s to drop it
kill %2
sleep 35
curl -s localhost:8081/instances     # -> one entry (after the timeout)`,
    },
  ],
};

/* ============ RD2 · sc5 — Eureka server + self-preservation ============ */
CODE.sc5 = {
  note: {
    zh: "Eureka Server 用一个注解就起来了,重点全在配置:自我保护(renewalPercentThreshold=0.85)决定了它在大面积心跳丢失时是保住整张表还是清空;而两个 Eureka 互相把对方当 peer 注册,就组成了一个高可用集群。",
    en: "An Eureka server is one annotation; the substance is in the config. Self-preservation (renewalPercentThreshold=0.85) decides whether it keeps the whole table or wipes it on a mass heartbeat loss, and two Eurekas each registering the other as a peer form a highly available cluster.",
  },
  tabs: [
    {
      lang: "Java", k: "java", file: "EurekaServer.java",
      src: `@SpringBootApplication
@EnableEurekaServer            // this app IS the registry
public class EurekaServer {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServer.class, args);
    }
}
// Clients add @EnableDiscoveryClient and point eureka.client.service-url
// at this server (or at the peer list, for HA).`,
    },
    {
      lang: "application.yml", k: "yaml", file: "eureka-server/application.yml",
      src: `eureka:
  server:
    enable-self-preservation: true     # keep stale entries during a partition
    renewal-percent-threshold: 0.85    # engage when renewals drop below 85%
    eviction-interval-timer-in-ms: 60000
  instance:
    hostname: eureka-a
  client:                              # peer replication: register with the OTHER
    register-with-eureka: true
    fetch-registry: true
    service-url:
      defaultZone: http://eureka-b:8761/eureka/`,
    },
    {
      lang: "compose", k: "yaml", file: "docker-compose.yml",
      run: "docker compose up   # a two-peer HA Eureka cluster",
      src: `services:
  eureka-a:
    image: shop/eureka:1.0
    environment: [ "EUREKA_INSTANCE_HOSTNAME=eureka-a" ]
    ports: ["8761:8761"]
  eureka-b:
    image: shop/eureka:1.0
    environment: [ "EUREKA_INSTANCE_HOSTNAME=eureka-b" ]
    ports: ["8762:8761"]
  # each registers with the other; a client fetches from whichever answers.`,
    },
  ],
};

/* ============ RD3 · sc6 — Nacos CP/AP ============ */
CODE.sc6 = {
  note: {
    zh: "Nacos 用 namespace 隔离环境、group 隔离业务;而 ephemeral 这个开关直接选择了一致性模型:临时实例走 AP(Distro,高可用),持久实例走 CP(Raft,强一致)。服务发现用 AP,配置用 CP——这不是随便选的。",
    en: "Nacos isolates environments with namespaces and business lines with groups; the ephemeral flag picks the consistency model outright: ephemeral instances use AP (Distro, highly available), persistent ones use CP (Raft, strongly consistent). Discovery uses AP, config uses CP — not an arbitrary choice.",
  },
  tabs: [
    {
      lang: "Java", k: "java", file: "Application.java",
      src: `@SpringBootApplication
@EnableDiscoveryClient
public class Application {
    public static void main(String[] a){ SpringApplication.run(Application.class, a); }
}
// The registry client is provider-agnostic. Swapping Eureka for Nacos is
// a dependency + a few YAML keys — the @EnableDiscoveryClient code is identical.`,
    },
    {
      lang: "application.yml", k: "yaml", file: "application.yml",
      src: `spring:
  cloud:
    nacos:
      discovery:
        server-addr: nacos:8848
        namespace: prod            # isolate dev / test / prod
        group: SHOP_GROUP          # isolate business lines
        ephemeral: true            # true  -> AP (Distro): stays up under partition
                                   # false -> CP (Raft):  needs a quorum to write
        cluster-name: hangzhou     # zone-aware routing hint`,
    },
    {
      lang: "notes", k: "properties", file: "cp-vs-ap.txt",
      src: `# Why discovery = AP and config = CP
#
# Discovery (ephemeral, AP):
#   a slightly stale instance list is survivable — you might call a
#   just-dead node and the breaker handles it. Availability wins.
#
# Config (persistent, CP):
#   half the fleet on a NEW switch and half on the OLD is a disaster.
#   Everyone must read the same value. Consistency wins, even if a
#   minority partition must reject writes to get it.`,
    },
  ],
};

/* ============ CM1 · sc7 — OpenFeign timeouts + fallback ============ */
CODE.sc7 = {
  note: {
    zh: "Feign 让远程调用像本地方法,但你必须替它补上本地方法没有的东西:超时和降级。这里显式设了 connect/read 超时,并给了 fallback;注意重试要极其克制——默认关闭,开也要配退避,否则下游正吃力时你的重试会把它彻底压垮。",
    en: "Feign makes a remote call look local, but you must add what a local method never needed: timeouts and a fallback. Here connect/read timeouts are explicit and a fallback is supplied. Be miserly with retries — off by default, and only ever with backoff, or your retries finish off a struggling downstream.",
  },
  tabs: [
    {
      lang: "Java", k: "java", file: "InventoryClient.java",
      src: `@FeignClient(name = "inventory-service", fallback = InventoryFallback.class)
public interface InventoryClient {
    @GetMapping("/stock/{sku}")
    boolean check(@PathVariable String sku, @RequestParam int qty);
}

@Component
class InventoryFallback implements InventoryClient {
    // when the call fails/opens, degrade gracefully instead of throwing up the chain
    public boolean check(String sku, int qty) {
        return false;   // "assume out of stock" is safer than a 500 to the user
    }
}`,
    },
    {
      lang: "application.yml", k: "yaml", file: "application.yml",
      src: `spring:
  cloud:
    openfeign:
      client:
        config:
          inventory-service:
            connect-timeout: 1000     # ms to establish the connection
            read-timeout: 2000        # ms to wait for the response
      circuitbreaker:
        enabled: true                 # let Resilience4j wrap every Feign call

# Retries are OFF by default. If you must, add backoff + jitter (see CM3) —
# never a naive fixed-interval retry against an overloaded downstream.`,
    },
    {
      lang: "storm", k: "properties", file: "retry-storm.txt",
      src: `# The retry storm, in numbers
#
#   incoming        = 1000 rps
#   retries         = 2   (so up to 3 attempts each)
#   offered to down = 1000 x 3 = 3000 rps
#
# If the downstream serves 1000 rps, it is now at 300% load and collapses,
# which makes MORE calls fail, which triggers MORE retries. Feedback loop.
# The fix is not "no retries" — it is backoff + jitter + a circuit breaker.`,
    },
  ],
};

/* ============ CM2 · sc8 — client-side load balancing ============ */
CODE.sc8 = {
  note: {
    zh: "Spring Cloud LoadBalancer 取代了退役的 Ribbon。默认是轮询,而轮询在实例快慢不一时会把等量流量打给慢节点、拉爆 P99。换一个基于「最少请求数/响应时间」的策略,让流量按能力分配——客户端负载均衡的价值就在于它看得到每个实例的负载。",
    en: "Spring Cloud LoadBalancer replaced the retired Ribbon. The default is round-robin, which sends equal traffic to a slow node and blows up P99 when instances differ. Switch to a request-count / response-time strategy so traffic follows capacity — the value of client-side LB is that it sees each instance's load.",
  },
  tabs: [
    {
      lang: "Java", k: "java", file: "LbConfig.java",
      src: `@Configuration
@LoadBalancerClient(name = "inventory-service", configuration = InvLbConfig.class)
class ClientConfig {
    @Bean
    @LoadBalanced                        // teach RestClient/WebClient to resolve by service name
    RestClient.Builder restClientBuilder() { return RestClient.builder(); }
}

class InvLbConfig {
    @Bean
    ReactorLoadBalancer<ServiceInstance> lb(Environment env,
            LoadBalancerClientFactory factory) {
        String name = env.getProperty(LoadBalancerClientFactory.PROPERTY_NAME);
        // round-robin is the default; this picks a load-aware strategy instead
        return new RandomLoadBalancer(
            factory.getLazyProvider(name, ServiceInstanceListSupplier.class), name);
    }
}`,
    },
    {
      lang: "application.yml", k: "yaml", file: "application.yml",
      src: `spring:
  cloud:
    loadbalancer:
      health-check:
        interval: 5s              # only route to instances that pass health checks
      # enable a supplier that tracks in-flight requests, so the balancer
      # can prefer the least-loaded instance instead of blind round-robin
      configurations: request-based-sticky-session`,
    },
    {
      lang: "shell", k: "sh", file: "uneven.sh",
      run: "sh uneven.sh   # one fast instance, one throttled — watch P99",
      src: `# start a fast instance and a deliberately slow one
SERVER_PORT=8082 java -jar inventory.jar &
SERVER_PORT=8083 java -Dslow.ms=300 -jar inventory.jar &   # the slow node
# hammer through the gateway and read percentiles from Actuator
curl -s "localhost:8081/actuator/metrics/http.server.requests?tag=uri:/checkout" \\
  | grep -E "0.99|mean"
# round-robin: P99 tracks the SLOW node. least-loaded: P99 stays near the fast one.`,
    },
  ],
};

/* ============ CM3 · sc9 — Resilience4j breaker + bulkhead ============ */
CODE.sc9 = {
  note: {
    zh: "本书最该背下来的一段。@CircuitBreaker 给下游调用套上三态保险丝:失败率超阈值就打开、快速失败、走 fallback,不再把线程堵在超时上;@Bulkhead 给这个下游单独隔一个线程池,让它的故障淹不到别的调用。阈值和半开探针数都在 YAML 里。",
    en: "The one snippet to memorise. @CircuitBreaker wraps a downstream call in a three-state fuse: cross the failure threshold and it opens, fails fast to the fallback, and stops blocking threads on timeouts; @Bulkhead gives this downstream its own thread pool so its failure cannot drown other calls. Thresholds and half-open probes live in YAML.",
  },
  tabs: [
    {
      lang: "Java", k: "java", file: "PaymentGateway.java",
      src: `@Service
public class PaymentGateway {

    @CircuitBreaker(name = "bank", fallbackMethod = "queued")
    @Bulkhead(name = "bank", type = Bulkhead.Type.THREADPOOL)   // isolate the pool
    @Retry(name = "bank")                                       // backoff-configured retry
    public PayResult charge(Charge c) {
        return bankApi.charge(c);        // the slow, sometimes-failing dependency
    }

    // called when the breaker is OPEN or the call fails — degrade, don't cascade
    private PayResult queued(Charge c, Throwable t) {
        outbox.save(c);                  // accept now, settle later
        return PayResult.accepted("queued");
    }
}`,
    },
    {
      lang: "application.yml", k: "yaml", file: "application.yml",
      src: `resilience4j:
  circuitbreaker:
    instances:
      bank:
        failure-rate-threshold: 50           # open at 50% failures
        sliding-window-size: 20              # measured over the last 20 calls
        wait-duration-in-open-state: 10s     # stay open 10s, then probe
        permitted-number-of-calls-in-half-open-state: 3   # 3 probes on half-open
  bulkhead:
    instances:
      bank: { max-concurrent-calls: 20 }     # cap concurrency to this dependency
  retry:
    instances:
      bank: { max-attempts: 3, wait-duration: 200ms, enable-exponential-backoff: true }`,
    },
    {
      lang: "cascade", k: "properties", file: "why-it-matters.txt",
      src: `# Without a breaker, a slow downstream exhausts the caller
#
#   caller threads   = 200
#   call timeout     = 2s
#   incoming         = 400 rps
#   threads needed   = 400 x 2s = 800   >>  200  -> POOL EXHAUSTED
#
# The caller now refuses service too, and the fault cascades upward.
# With the breaker OPEN, failed calls return in ~0ms via fallback:
#   threads needed  ~= 400 x 0.005s = 2   ->  caller stays alive.`,
    },
  ],
};

/* ============ GW1 · sc10 — Spring Cloud Gateway routes ============ */
CODE.sc10 = {
  note: {
    zh: "网关的路由由断言和过滤器组成。这里演示两条关键路由:一条按路径把 /api/orders 转给订单服务并剥掉前缀;一条用权重把 90%/10% 的流量分给订单服务的 v1/v2,实现金丝雀发布——出问题把权重调回 100/0 即可一键回切。",
    en: "A gateway route is predicates plus filters. Two key routes here: one matches /api/orders by path, forwards to the order service and strips the prefix; the other splits 90%/10% between order-service v1 and v2 by weight — a canary you roll back by resetting the weight to 100/0.",
  },
  tabs: [
    {
      lang: "application.yml", k: "yaml", file: "gateway/application.yml",
      src: `spring:
  cloud:
    gateway:
      routes:
        - id: orders
          uri: lb://order-service          # lb:// = resolve via the registry + LB
          predicates:
            - Path=/api/orders/**            # match by path
          filters:
            - StripPrefix=1                  # /api/orders/42 -> /orders/42
        - id: orders-canary                  # weighted canary
          uri: lb://order-service-v2
          predicates:
            - Path=/api/orders/**
            - Weight=orders, 10              # 10% here, 90% to the route above
          filters:
            - StripPrefix=1`,
    },
    {
      lang: "Java", k: "java", file: "Routes.java",
      src: `// the same routes, expressed in Java for dynamic/conditional logic
@Bean
RouteLocator routes(RouteLocatorBuilder b) {
    return b.routes()
        .route("orders", r -> r.path("/api/orders/**")
            .filters(f -> f.stripPrefix(1)
                           .addRequestHeader("X-Gateway", "true"))
            .uri("lb://order-service"))
        .route("beta", r -> r.path("/api/orders/**")
            .and().header("X-Beta", "true")   // header predicate: beta users -> v2
            .filters(f -> f.stripPrefix(1))
            .uri("lb://order-service-v2"))
        .build();
}`,
    },
    {
      lang: "shell", k: "sh", file: "canary.sh",
      run: "sh canary.sh   # 1000 requests, ~100 should land on v2",
      src: `# fire 1000 requests and count which version answered (via a response header)
for i in $(seq 1 1000); do
  curl -s -o /dev/null -D - localhost:8080/api/orders/ping | grep -i X-Version
done | sort | uniq -c
# expected: ~900 v1, ~100 v2. See a spike in v2 errors? set Weight back to 100.`,
    },
  ],
};

/* ============ GW2 · sc11 — gateway auth + rate limit ============ */
CODE.sc11 = {
  note: {
    zh: "网关是做鉴权和限流最合适的地方:JWT 在这里验一次、身份透传给后端;令牌桶(replenishRate=持续速率,burstCapacity=可容忍突发)把突发削平,超出的请求直接 429。KeyResolver 决定按谁限流——这里按用户。",
    en: "The gateway is the right place for auth and rate limiting: validate the JWT once here and pass identity downstream; a token bucket (replenishRate = sustained rate, burstCapacity = tolerated burst) shaves bursts and 429s the overflow. The KeyResolver decides what to limit by — here, per user.",
  },
  tabs: [
    {
      lang: "application.yml", k: "yaml", file: "gateway/application.yml",
      src: `spring:
  cloud:
    gateway:
      routes:
        - id: orders
          uri: lb://order-service
          predicates: [ "Path=/api/orders/**" ]
          filters:
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 100    # 100 req/s sustained
                redis-rate-limiter.burstCapacity: 200    # tolerate a burst of 200
                key-resolver: "#{@userKeyResolver}"
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://auth.shop.com/realms/shop  # validate JWTs here, once`,
    },
    {
      lang: "Java", k: "java", file: "GatewaySecurity.java",
      src: `@Bean
KeyResolver userKeyResolver() {
    // rate-limit per authenticated user (fall back to client IP)
    return exchange -> exchange.getPrincipal()
        .map(Principal::getName)
        .defaultIfEmpty(exchange.getRequest().getRemoteAddress().getHostString());
}

@Bean
SecurityWebFilterChain security(ServerHttpSecurity http) {
    return http
        .authorizeExchange(e -> e.pathMatchers("/api/**").authenticated()
                                 .anyExchange().permitAll())
        .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults())) // verify signature
        .build();
}`,
    },
    {
      lang: "compose", k: "yaml", file: "docker-compose.yml",
      run: "docker compose up redis   # the rate limiter needs a shared bucket",
      src: `services:
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    # the token bucket lives in Redis so the limit is shared across all
    # gateway replicas — otherwise each replica would allow the full rate.`,
    },
  ],
};

/* ============ GW3 · sc12 — config refresh ============ */
CODE.sc12 = {
  note: {
    zh: "配置中心让你不重启就改配置:改一个值,通过 Spring Cloud Bus 广播到所有实例,标了 @RefreshScope 的 Bean 被重建以读取新值。但刷新不是原子的——广播和重建都要时间,存在一段「新旧混跑」的窗口,所以对必须一致的配置要灰度、要版本化。",
    en: "A config server lets you change config without a restart: change a value, broadcast it over Spring Cloud Bus, and beans marked @RefreshScope rebuild to read the new value. But refresh is not atomic — broadcast and rebuild take time, leaving a 'mixed old and new' window, so canary and version anything two services must agree on.",
  },
  tabs: [
    {
      lang: "Java", k: "java", file: "ShippingProps.java",
      src: `@Component
@RefreshScope                       // rebuilt on a config change — picks up new values
@ConfigurationProperties(prefix = "shipping")
public class ShippingProps {
    private int freeThreshold;      // e.g. free shipping over this amount
    private boolean expressEnabled; // a feature flag flipped at runtime
    // getters/setters...
    // Because this bean is @RefreshScope, /actuator/busrefresh rebinds it
    // WITHOUT a restart. Beans that read it see the new values on next call.
}`,
    },
    {
      lang: "application.yml", k: "yaml", file: "application.yml",
      src: `spring:
  application:
    name: order-service
  config:
    import: nacos:order-service.yml   # or a Spring Cloud Config server
  cloud:
    bus:
      enabled: true                   # broadcast refresh events to all instances
management:
  endpoints:
    web:
      exposure:
        include: busrefresh, refresh  # expose the refresh trigger`,
    },
    {
      lang: "shell", k: "sh", file: "refresh.sh",
      run: "sh refresh.sh   # push once, watch it ripple across instances",
      src: `# after editing shipping.express-enabled in the config store, broadcast:
curl -X POST localhost:8081/actuator/busrefresh
# every instance rebuilds its @RefreshScope beans — but NOT at the same instant.
# For a few seconds some instances answer with the OLD value and some the NEW.
# For a flag two services must agree on: roll it out to one instance first,
# verify, then the rest — and keep both code paths valid during the window.`,
    },
  ],
};

/* ============ CM4 · sc26 — gRPC vs REST ============ */
CODE.sc26 = {
  note: {
    zh: "同一个「取订单 + 订阅订单更新」的能力,三个视角。gRPC 从一份 .proto 契约生成强类型的客户端和服务端桩,一元调用和服务端流都是原生的;REST 用 @RestController 把同样的能力做成 JSON over HTTP,通用、可 curl、可缓存,但流式只能退回 SSE。对内高频调用选上面的 gRPC,系统边缘对外选下面的 REST。",
    en: "The same capability — fetch an order, subscribe to order updates — from three angles. gRPC generates typed client and server stubs from one .proto contract, with unary and server-streaming native; REST exposes the same capability as JSON over HTTP with a @RestController — universal, curl-able, cacheable — but streaming falls back to SSE. Use the gRPC above for chatty internal calls, the REST below at the edge.",
  },
  tabs: [
    {
      lang: "order.proto", k: "proto", file: "order.proto",
      run: "protoc --java_out=. --grpc-java_out=. order.proto   # generates the stubs",
      src: `syntax = "proto3";
package shop.order;
option java_package = "com.shop.order.grpc";

service OrderService {
  rpc GetOrder    (OrderId) returns (Order);          // unary
  rpc WatchOrders (OrderId) returns (stream Order);   // server streaming
}

message OrderId { int64 id = 1; }
message Order {
  int64  id     = 1;      // field numbers, not names, go on the wire (compact)
  string sku    = 2;
  int32  qty    = 3;
  string status = 4;
}
// One contract, many languages, checked at compile time.`,
    },
    {
      lang: "gRPC (Java)", k: "java", file: "OrderGrpcService.java",
      src: `// extend the GENERATED base class; grpc-spring-boot-starter wires it up
@GrpcService
public class OrderGrpcService extends OrderServiceGrpc.OrderServiceImplBase {

    @Override
    public void getOrder(OrderId req, StreamObserver<Order> obs) {
        Order o = repo.find(req.getId());     // typed, generated message
        obs.onNext(o);                        // Protobuf on the wire (~¼ of JSON)
        obs.onCompleted();
    }

    @Override
    public void watchOrders(OrderId req, StreamObserver<Order> obs) {
        // server streaming: push updates over ONE HTTP/2 stream, no polling
        events.subscribe(req.getId(), obs::onNext);
    }
}`,
    },
    {
      lang: "REST (Java)", k: "java", file: "OrderController.java",
      run: "curl localhost:8081/orders/5001    # human-readable, no tooling needed",
      src: `// the SAME capability as JSON over HTTP — universal, curl-able, cacheable
@RestController
@RequestMapping("/orders")
public class OrderController {

    @GetMapping("/{id}")                      // unary: plain request-response
    public OrderDto getOrder(@PathVariable long id) {
        return OrderDto.from(repo.find(id));  // serialized to JSON (verbose, readable)
    }

    // streaming is not native to REST — fall back to Server-Sent Events
    @GetMapping(value = "/{id}/watch", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<OrderDto> watch(@PathVariable long id) {
        return events.stream(id).map(OrderDto::from);
    }
}`,
    },
  ],
};
