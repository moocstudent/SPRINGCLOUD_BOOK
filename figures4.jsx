/* =========================================================
   figures4.jsx — module architecture diagrams (m1-arch … m8-arch)
   ---------------------------------------------------------
   Bigger, system-level architecture views shown on each module
   overview page (ModulePage renders <Figure name={m.arch} />).
   Share FIGN + primitives (FigFrame/FArrow/FBox/FT) from
   figures.jsx via the classic-script global scope. Loaded after
   figures3.jsx, which defines <Figure> (runtime FIGN lookup).
   ========================================================= */

/* ---------------- m1 · monolith → microservices ---------------- */
FIGN["m1-arch"] = function ({ idx }) {
  const L = useL();
  return (
    <FigFrame idx={idx} w={680} h={272} cap={L("从单体到微服务:一个进程、一个共享库,拆成各自独立部署、各自拥有数据的服务。换来的是独立发布与独立扩容,代价是一整套分布式问题——注册发现、远程调用、分布式事务、可观测性——正是后面各模块要逐一解决的。", "From monolith to microservices: one process and one shared database, split into services that deploy independently and each own their data. You gain independent release and scaling, at the cost of a whole set of distributed problems — discovery, remote calls, distributed transactions, observability — which the later modules solve one by one.")}>
      {/* monolith */}
      <text x={150} y={22} textAnchor="middle" style={{ font: "700 12px var(--f-mono)", fill: "var(--muted)" }}>{L("单体", "monolith")}</text>
      <rect x={28} y={34} width={244} height={150} rx="10" fill="none" stroke="var(--hairline-strong)" strokeWidth="1.4" />
      {[[L("订单", "order"), 40, 46], [L("库存", "inventory"), 152, 46], [L("支付", "payment"), 40, 90], [L("用户", "user"), 152, 90]].map(([s, x, y], i) => <FBox key={i} x={x} y={y} w={104} h={34} label={s} tone="p" />)}
      <FBox x={70} y={140} w={160} h={34} label={L("共享数据库", "shared database")} tone="m" />
      <FArrow x1={54} y1={130} x2={90} y2={140} c="var(--muted)" />
      <FArrow x1={204} y1={130} x2={180} y2={140} c="var(--muted)" />
      {/* transform */}
      <FArrow x1={280} y1={108} x2={330} y2={108} c="var(--accent)" wdt={2} />
      <FT x={305} y={98} cls="tk">{L("拆分", "split")}</FT>
      {/* microservices */}
      <text x={505} y={22} textAnchor="middle" style={{ font: "700 12px var(--f-mono)", fill: "var(--primary)" }}>{L("微服务", "microservices")}</text>
      {[[L("订单", "order"), 356], [L("库存", "inventory"), 356 + 158], [L("支付", "payment"), 356, 1], [L("用户", "user"), 356 + 158, 1]].map(([s, x, row], i) => {
        const y = 40 + (i >= 2 ? 96 : 0);
        return (
          <g key={i}>
            <FBox x={x} y={y} w={140} h={34} label={s} tone="a" />
            <FBox x={x + 26} y={y + 40} w={88} h={26} label="DB" tone="m" />
            <FArrow x1={x + 70} y1={y + 34} x2={x + 70} y2={y + 40} c="var(--muted)" />
          </g>
        );
      })}
      <FArrow x1={496} y1={57} x2={514} y2={57} c="var(--muted)" dash />
      <FArrow x1={496} y1={153} x2={514} y2={153} c="var(--muted)" dash />
    </FigFrame>
  );
};

/* ---------------- m2 · registry & discovery ---------------- */
FIGN["m2-arch"] = function ({ idx }) {
  const L = useL();
  return (
    <FigFrame idx={idx} w={680} h={250} cap={L("注册中心是运行时的电话簿:每个实例启动就注册、定期发心跳续租;调用方先向注册中心查到当前存活的实例清单,再发起调用,并在本地缓存这份清单。实例扩容、重启、宕机时,清单随之更新。", "The registry is a runtime phone book: each instance registers on startup and renews with heartbeats; a caller first queries the registry for the currently live instances, then calls one, caching the list locally. As instances scale, restart or die, the list updates.")}>
      <FBox x={270} y={26} w={140} h={40} label={L("注册中心", "Registry")} sub="Nacos / Eureka" tone="ok" />
      <FBox x={30} y={110} w={110} h={44} label={L("调用方", "caller")} sub={L("负载均衡", "load-balancer")} tone="p" />
      <FArrow x1={140} y1={122} x2={266} y2={56} c="var(--muted)" />
      <FT x={196} y={80} cls="tn">{L("① 查询", "① discover")}</FT>
      {/* two services, instances */}
      {[[L("订单服务", "order-svc"), 300], [L("库存服务", "inventory-svc"), 470]].map(([s, x], si) => (
        <g key={si}>
          <FT x={x + 80} y={110} cls="tk">{s}</FT>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <FBox x={x + i * 56} y={122} w={50} h={34} label={`i${i + 1}`} tone="a" />
              <FArrow x1={x + i * 56 + 25} y1={122} x2={340 + si * 20} y2={68} c="var(--muted)" dash />
            </g>
          ))}
        </g>
      ))}
      <FT x={430} y={92} cls="tn">{L("② 注册 + 心跳 ↑", "② register + heartbeat ↑")}</FT>
      <FArrow x1={140} y1={140} x2={296} y2={140} c="var(--primary)" wdt={1.8} />
      <FT x={210} y={158} cls="tn">{L("③ 调用存活实例", "③ call a live instance")}</FT>
    </FigFrame>
  );
};

/* ---------------- m3 · communication, LB, resilience ---------------- */
FIGN["m3-arch"] = function ({ idx }) {
  const L = useL();
  return (
    <FigFrame idx={idx} w={680} h={250} cap={L("一次远程调用的韧性栈:OpenFeign 声明式发起调用,客户端负载均衡在多个实例间按策略分流,熔断器在下游失败率过高时快速失败、走降级,把故障关在边界内。这三层——调用、负载、韧性——是微服务能上线的底线。", "The resilience stack of one remote call: OpenFeign issues it declaratively, the client-side load balancer spreads it across instances by policy, and the circuit breaker fails fast to a fallback when the downstream failure rate is too high, holding the fault at the boundary. These three layers — call, balance, resilience — are the bar for shipping microservices.")}>
      <FBox x={24} y={96} w={120} h={48} label={L("调用方", "caller")} tone="p" />
      <FBox x={168} y={90} w={128} h={60} label="OpenFeign" sub={L("+ 负载均衡", "+ load-balancer")} tone="a" />
      <FArrow x1={144} y1={120} x2={168} y2={120} c="var(--muted)" />
      <FBox x={320} y={90} w={116} h={60} label={L("熔断器", "breaker")} sub={L("关/开/半开", "closed/open/half")} tone="warn" />
      <FArrow x1={296} y1={120} x2={320} y2={120} c="var(--muted)" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <FArrow x1={436} y1={120} x2={498} y2={48 + i * 60} c="var(--muted)" />
          <FBox x={500} y={34 + i * 60} w={150} h={34} label={L(`下游实例 ${i + 1}`, `downstream ${i + 1}`)} tone="ok" />
        </g>
      ))}
      <FArrow x1={378} y1={150} x2={378} y2={180} c="#c0453f" dash />
      <FBox x={330} y={182} w={116} h={30} label={L("降级兜底", "fallback")} tone="bad" />
    </FigFrame>
  );
};

/* ---------------- m4 · gateway & config ---------------- */
FIGN["m4-arch"] = function ({ idx }) {
  const L = useL();
  return (
    <FigFrame idx={idx} w={680} h={252} cap={L("外部世界的唯一入口是 API 网关:它统一做鉴权、限流、路由与灰度,后端服务专心做业务;配置中心把散落在各服务的配置集中管理、不重启即可动态刷新。网关收拢入口,配置中心收拢真相。", "The single front door is the API gateway: it centralises auth, rate limiting, routing and canary so backends focus on business logic; the config server centralises configuration scattered across services and refreshes it dynamically without a restart. The gateway centralises entry, the config server centralises truth.")}>
      <FBox x={24} y={100} w={90} h={44} label={L("客户端", "clients")} tone="m" />
      <FArrow x1={114} y1={122} x2={140} y2={122} c="var(--muted)" />
      <FBox x={142} y={92} w={120} h={62} label={L("API 网关", "API Gateway")} sub={L("鉴权·限流·路由", "auth·limit·route")} tone="p" />
      {[[L("订单", "order"), 60], [L("库存", "inventory"), 120], [L("支付", "payment"), 180]].map(([s, y], i) => (
        <g key={i}>
          <FArrow x1={262} y1={122} x2={330} y2={y + 17} c="var(--muted)" />
          <FBox x={332} y={y} w={150} h={34} label={s} tone="a" />
        </g>
      ))}
      <FBox x={520} y={90} w={140} h={40} label={L("配置中心", "config server")} sub="Nacos / Config" tone="ok" />
      {[60, 120, 180].map((y, i) => <FArrow key={i} x1={520} y1={112} x2={484} y2={y + 17} c="var(--muted)" dash />)}
      <FT x={585} y={150} cls="tn">{L("动态下发配置", "push config live")}</FT>
    </FigFrame>
  );
};

/* ---------------- m5 · messaging, transactions, consistency ---------------- */
FIGN["m5-arch"] = function ({ idx }) {
  const L = useL();
  return (
    <FigFrame idx={idx} w={680} h={258} cap={L("两条协作路线:异步事件——生产者把「订单已创建」发到消息中间件,积分、通知等消费者各自订阅,松耦合、削峰;分布式事务——Seata 协调器把订单、库存、支付三个本地事务绑成一个全局事务,失败就补偿。", "Two ways to cooperate: asynchronous events — a producer publishes 'order created' to a broker and consumers like points and notification each subscribe, loosely coupled and peak-shaving; distributed transactions — a Seata coordinator binds the order, inventory and payment local transactions into one global transaction, compensating on failure.")}>
      <FBox x={24} y={40} w={110} h={40} label={L("订单服务", "order-svc")} tone="p" />
      <FArrow x1={134} y1={60} x2={210} y2={60} c="var(--muted)" />
      <FBox x={212} y={36} w={120} h={48} label={L("消息中间件", "broker")} sub="Kafka / Rabbit" tone="a" />
      {[[L("积分", "points"), 24], [L("通知", "notify"), 96], [L("风控", "risk"), 168]].map(([s, y], i) => (
        <g key={i}>
          <FArrow x1={332} y1={60} x2={498} y2={y + 17} c="var(--muted)" />
          <FBox x={500} y={y} w={150} h={30} label={L(`${s} 消费者`, `${s} consumer`)} tone="ok" />
        </g>
      ))}
      <FT x={415} y={20} cls="tn">{L("事件扇出(异步)", "event fan-out (async)")}</FT>
      {/* distributed tx */}
      <FBox x={212} y={150} w={130} h={42} label="Seata TC" sub={L("全局事务协调", "global-txn coord")} tone="warn" />
      {[[L("订单", "order"), 30], [L("库存", "inventory"), 280], [L("支付", "payment"), 520]].map(([s, x], i) => (
        <g key={i}>
          <FBox x={x} y={210} w={130} h={30} label={L(`${s} 分支`, `${s} branch`)} tone="m" />
          <FArrow x1={277} y1={192} x2={x + 65} y2={210} c="#d98a1f" dash />
        </g>
      ))}
      <FT x={110} y={186} cls="tn">{L("分布式事务", "distributed txn")}</FT>
    </FigFrame>
  );
};

/* ---------------- m6 · observability ---------------- */
FIGN["m6-arch"] = function ({ idx }) {
  const L = useL();
  return (
    <FigFrame idx={idx} w={680} h={244} cap={L("可观测性的管道:每个服务通过埋点/探针产出三种信号——链路(span)、指标、日志——统一发给收集器(OpenTelemetry Collector),再落到各自的后端(Zipkin/Prometheus/Loki),最后在 Grafana 汇成一块看板。一次请求的旅程、系统的健康、故障的细节,都在这里。", "The observability pipeline: each service, instrumented or probed, emits three signals — traces (spans), metrics and logs — to a collector (OpenTelemetry Collector), which lands them in their backends (Zipkin/Prometheus/Loki), finally unified in one Grafana dashboard. A request's journey, the system's health and a failure's details all live here.")}>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <FBox x={24} y={36 + i * 56} w={120} h={40} label={L(`服务 ${i + 1}`, `service ${i + 1}`)} sub={L("埋点/探针", "instrumented")} tone="p" />
          <FArrow x1={144} y1={56 + i * 56} x2={214} y2={112} c="var(--muted)" />
        </g>
      ))}
      <FBox x={216} y={88} w={120} h={48} label={L("收集器", "Collector")} sub="OTel" tone="a" />
      {[[L("链路 Zipkin", "traces Zipkin"), 40], [L("指标 Prometheus", "metrics Prom"), 96], [L("日志 Loki", "logs Loki"), 152]].map(([s, y], i) => (
        <g key={i}>
          <FArrow x1={336} y1={112} x2={404} y2={y + 15} c="var(--muted)" />
          <FBox x={406} y={y} w={150} h={30} label={s} tone="ok" />
          <FArrow x1={556} y1={y + 15} x2={588} y2={112} c="var(--muted)" dash />
        </g>
      ))}
      <FBox x={590} y={90} w={66} h={44} label="Grafana" tone="warn" />
    </FigFrame>
  );
};

/* ---------------- m7 · deploy, scale, multi-region ---------------- */
FIGN["m7-arch"] = function ({ idx }) {
  const L = useL();
  return (
    <FigFrame idx={idx} w={680} h={264} cap={L("生产拓扑:全局流量按地理就近路由到两个机房,每个机房是一套 Kubernetes 集群,服务以多副本 Pod 跑在多个节点上、由 HPA 按负载弹性伸缩;两地数据库之间跨机房复制。任一机房整体故障,流量切到另一座城市继续。", "The production topology: global traffic is geo-routed to two data centres, each a Kubernetes cluster where services run as multi-replica pods across nodes and the HPA scales them elastically with load; the databases replicate across regions. If a whole DC fails, traffic shifts to the other city and continues.")}>
      <FBox x={266} y={22} w={148} h={34} label={L("全局流量路由", "global traffic router")} sub="geo-DNS" tone="warn" />
      {[[L("机房 A", "DC-A"), 24], [L("机房 B", "DC-B"), 356]].map(([dc, x], di) => (
        <g key={di}>
          <rect x={x} y={72} width={300} height={168} rx="10" fill={`color-mix(in srgb, ${di ? "var(--accent)" : "var(--primary)"} 5%, transparent)`} stroke={di ? "var(--accent)" : "var(--primary)"} strokeWidth="1.3" />
          <text x={x + 150} y={90} textAnchor="middle" style={{ font: "700 12px var(--f-mono)", fill: di ? "var(--accent)" : "var(--primary)" }}>{dc} · Kubernetes</text>
          <FArrow x1={di ? 380 : 300} y1={56} x2={x + 150} y2={72} c="var(--muted)" />
          {[0, 1, 2].map((i) => <FBox key={i} x={x + 18 + i * 92} y={104} w={82} h={30} label={`pod ${i + 1}`} tone={di ? "a" : "p"} />)}
          <FBox x={x + 18} y={146} w={120} h={30} label="HPA" sub={L("按负载扩缩", "autoscale")} tone="ok" />
          <FBox x={x + 160} y={146} w={122} h={30} label="DB" tone="m" />
          <FArrow x1={x + 60} y1={146} x2={x + 60} y2={134} c="var(--muted)" />
        </g>
      ))}
      <FArrow x1={324} y1={191} x2={356} y2={191} c="#d98a1f" />
      <FArrow x1={356} y1={198} x2={324} y2={198} c="#d98a1f" />
      <FT x={340} y={216} cls="tn">{L("异步复制", "async repl")}</FT>
    </FigFrame>
  );
};

/* ---------------- m8 · security, resilience, capstone ---------------- */
FIGN["m8-arch"] = function ({ idx }) {
  const L = useL();
  return (
    <FigFrame idx={idx} w={680} h={252} cap={L("零信任的安全架构:用户在网关处用 OAuth2/OIDC 登录、拿到签名 JWT,身份随请求逐跳传递,每个服务本地验签;服务与服务之间还用 mTLS 互验——默认谁都不信,进了内网也不例外。安全不是城墙,是每一栋楼各自上锁。", "A zero-trust security architecture: the user logs in at the gateway with OAuth2/OIDC and gets a signed JWT, identity is carried hop by hop and each service verifies it locally; services also mutually authenticate with mTLS — trust no one by default, not even inside the perimeter. Security is not a city wall but every building locked on its own.")}>
      <FBox x={22} y={100} w={80} h={40} label={L("用户", "user")} tone="m" />
      <FBox x={132} y={30} w={120} h={40} label={L("认证服务器", "auth server")} sub="OAuth2 / OIDC" tone="warn" />
      <FArrow x1={102} y1={112} x2={140} y2={116} c="var(--muted)" />
      <FBox x={132} y={96} w={120} h={54} label={L("API 网关", "API Gateway")} sub={L("签发/校验 JWT", "issue/verify JWT")} tone="p" />
      <FArrow x1={192} y1={70} x2={192} y2={96} c="var(--muted)" dash />
      <rect x={280} y={40} width={380} height={176} rx="10" fill="none" stroke="var(--hairline-strong)" strokeDasharray="5 4" />
      <text x={470} y={34} textAnchor="middle" style={{ font: "600 11px var(--f-mono)", fill: "var(--muted)" }}>{L("内网 · 默认不可信", "internal network · not trusted")}</text>
      {[[L("订单", "order"), 60], [L("库存", "inventory"), 152], [L("支付", "payment"), 244]].map(([s, dx], i) => (
        <FBox key={i} x={300 + dx} y={70 + (i === 1 ? 70 : 0)} w={120} h={40} label={s} sub="🔒 mTLS" tone="a" />
      ))}
      <FArrow x1={252} y1={122} x2={300} y2={90} c="var(--muted)" />
      <FArrow x1={420} y1={90} x2={452} y2={140} c="var(--muted)" />
      <FArrow x1={544} y1={90} x2={452} y2={150} c="var(--muted)" />
      <FT x={470} y={205} cls="tk">{L("JWT 逐跳传递 · 服务间 mTLS 互验", "JWT hop by hop · mTLS between services")}</FT>
    </FigFrame>
  );
};
