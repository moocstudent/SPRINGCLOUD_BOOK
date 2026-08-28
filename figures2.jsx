/* =========================================================
   figures2.jsx — lecture figures for Module IV–V (sc10–sc16)
   Shares FIGN + primitives (FigFrame/FArrow/FBox/FT) from
   figures.jsx via the classic-script global scope.
   ========================================================= */

/* ---------------- sc10 · gateway routing + canary ---------------- */
FIGN["sc10-gateway"] = function ({ idx }) {
  const L = useL();
  return (
    <FigFrame idx={idx} h={206} cap={L("网关是唯一入口:断言(路径/请求头/权重)决定请求走哪条路由,过滤器统一做鉴权与限流。权重路由把 10% 流量切到 v2 金丝雀,出问题只影响这一小块,一键回切。", "The gateway is the single entry: predicates (path/header/weight) decide the route, filters do auth and rate-limiting in one place. Weighted routing sends 10% to a v2 canary — trouble hits only that slice, and one switch rolls back.")}>
      <FBox x={30} y={78} w={70} h={44} label={L("客户端", "clients")} tone="m" />
      <FArrow x1={100} y1={100} x2={150} y2={100} c="var(--primary)" />
      <FBox x={152} y={66} w={110} h={68} label={L("网关", "Gateway")} sub={L("断言+过滤器", "predicate+filter")} tone="p" />
      <FArrow x1={262} y1={84} x2={470} y2={54} c="var(--muted)" />
      <FArrow x1={262} y1={116} x2={470} y2={150} c="var(--accent)" />
      <FT x={365} y={54} cls="tn">90%</FT>
      <FT x={365} y={150} cls="tn">10%</FT>
      <FBox x={472} y={34} w={150} h={42} label={L("订单服务 v1", "order-svc v1")} sub={L("稳定", "stable")} tone="ok" />
      <FBox x={472} y={132} w={150} h={42} label={L("订单服务 v2", "order-svc v2")} sub={L("金丝雀", "canary")} tone="a" />
    </FigFrame>
  );
};

/* ---------------- sc11 · token bucket ---------------- */
FIGN["sc11-bucket"] = function ({ idx }) {
  const L = useL();
  return (
    <FigFrame idx={idx} h={210} cap={L("令牌桶:系统按固定速率往桶里放令牌(持续速率),桶容量就是可容忍的突发。请求消耗令牌,桶空了就返回 429。十倍尖峰被削平成后端扛得住的稳定速率。", "Token bucket: the system drops tokens at a fixed rate (sustained rate), the bucket capacity is the tolerated burst. Requests consume tokens; an empty bucket returns 429. A tenfold spike is shaved into a rate the backend survives.")}>
      <FArrow x1={90} y1={30} x2={90} y2={70} c="var(--accent)" />
      <FT x={90} y={22} cls="tn">{L("令牌流入", "refill")}</FT>
      <rect x={50} y={72} width={80} height={90} rx="4" fill="none" stroke="var(--primary)" strokeWidth="1.6" />
      {[0, 1, 2].map((i) => <circle key={i} cx={70 + i * 20} cy={145} r="6" fill="color-mix(in srgb, var(--accent) 80%, transparent)" stroke="var(--accent)" />)}
      <FT x={90} y={178} cls="tn">{L("桶容量=突发", "capacity=burst")}</FT>
      <FArrow x1={150} y1={60} x2={200} y2={100} c="#c0453f" wdt={2} />
      <FT x={205} y={52} anchor="start" cls="tn">{L("10× 尖峰", "10× spike")}</FT>
      <FBox x={205} y={82} w={90} h={44} label={L("限流器", "limiter")} tone="p" />
      <FArrow x1={295} y1={96} x2={430} y2={96} c="var(--primary)" wdt={2} />
      <FT x={362} y={86} cls="tn">{L("稳定速率", "steady rate")}</FT>
      <FBox x={432} y={74} w={120} h={60} label={L("后端", "backend")} sub={L("扛得住", "survives")} tone="ok" />
      <FArrow x1={250} y1={126} x2={250} y2={170} c="#c0453f" dash />
      <FBox x={214} y={172} w={72} h={30} label="429" tone="bad" />
    </FigFrame>
  );
};

/* ---------------- sc12 · non-atomic config refresh ---------------- */
FIGN["sc12-refresh"] = function ({ idx }) {
  const L = useL();
  const y = 60, n = 8, x0 = 60, dx = 70;
  const flip = 3; // scrub position
  return (
    <FigFrame idx={idx} h={190} cap={L("推送新配置时,实例不是同时生效的:消息传播与 Bean 重建都要时间,于是存在一段「一部分新、一部分旧」的窗口。若两个服务必须一致,这几秒就可能出诡异现象。灰度可缩小它。", "A config push does not take effect at once: propagation and bean rebuild take time, so there is a window of 'some new, some old'. If two services must agree, those seconds can cause bizarre behaviour. Canary shrinks it.")}>
      {Array.from({ length: n }, (_, i) => {
        const isNew = i < flip;
        return <FBox key={i} x={x0 + i * dx} y={y} w={54} h={40} label={isNew ? "v2" : "v1"} tone={isNew ? "ok" : "m"} />;
      })}
      <rect x={x0 - 6} y={y - 14} width={flip * dx + 6} height={68} rx="4" fill="none" stroke="var(--ok, #2e9e6b)" strokeDasharray="3 3" />
      <rect x={x0 + flip * dx - 4} y={y - 22} width={(n - flip) * dx} height={84} rx="4" fill="color-mix(in srgb,#d98a1f 12%,transparent)" stroke="#d98a1f" strokeDasharray="4 3" />
      <FT x={x0 + flip * dx + (n - flip) * dx / 2} y={y - 28} cls="tk">{L("混跑窗口:一半新一半旧", "mixed window: half new, half old")}</FT>
      <FArrow x1={x0} y1={y + 62} x2={x0 + n * dx - 16} y2={y + 62} c="var(--muted)" />
      <FT x={x0 + n * dx / 2} y={y + 78} cls="tn">{L("时间 / 传播 →", "time / propagation →")}</FT>
    </FigFrame>
  );
};

/* ---------------- sc13 · partitions & consumers ---------------- */
FIGN["sc13-stream"] = function ({ idx }) {
  const L = useL();
  return (
    <FigFrame idx={idx} h={214} cap={L("分区数是消费并行度的硬上限:4 个分区各分给一个消费者,第 5、6 个消费者拿不到分区、纯粹空转。生产超过消费能力,积压就堆积。想提速,先加分区。", "Partition count is the hard ceiling on consumer parallelism: 4 partitions each go to one consumer, and the 5th/6th consumers get none and sit idle. When production exceeds capacity, lag piles up. To go faster, add partitions first.")}>
      <FBox x={30} y={82} w={84} h={44} label={L("生产者", "producer")} tone="p" />
      {[0, 1, 2, 3].map((i) => <FBox key={i} x={180} y={26 + i * 42} w={90} h={32} label={`P${i}`} tone="a" />)}
      <FT x={225} y={18} cls="tn">{L("4 个分区", "4 partitions")}</FT>
      {[0, 1, 2, 3].map((i) => <FArrow key={i} x1={114} y1={104} x2={180} y2={42 + i * 42} c="var(--muted)" />)}
      {[0, 1, 2, 3].map((i) => <FArrow key={i} x1={270} y1={42 + i * 42} x2={420} y2={42 + i * 42} c="var(--muted)" />)}
      {[0, 1, 2, 3].map((i) => <FBox key={i} x={422} y={26 + i * 42} w={100} h={32} label={`C${i}`} tone="ok" />)}
      <FBox x={422} y={26 + 4 * 42} w={100} h={32} label="C4 💤" tone="warn" />
      <FT x={560} y={26 + 4 * 42 + 20} anchor="start" cls="tn">{L("空转", "idle")}</FT>
    </FigFrame>
  );
};

/* ---------------- sc14 · Saga compensation vs 2PC lock ---------------- */
FIGN["sc14-saga"] = function ({ idx }) {
  const L = useL();
  const steps = [L("订单", "order"), L("库存", "inventory"), L("支付", "payment")];
  const x0 = 60, dx = 180, y = 54;
  return (
    <FigFrame idx={idx} h={218} cap={L("Saga:一串本地事务,每步配一个补偿。第 3 步失败,就反向补偿前两步——注意补偿不是回滚,而是「再操作一次抵消」,中间有一段可观测的不一致窗口。它用短锁换来了非阻塞。", "Saga: a chain of local transactions, each with a compensation. Step 3 fails, so compensate the first two in reverse — note a compensation is not a rollback but 'an offsetting action', with an observable inconsistency window in between. It trades short locks for non-blocking.")}>
      {steps.map((s, i) => (
        <g key={i}>
          <FBox x={x0 + i * dx} y={y} w={120} h={44} label={s} sub={i === 2 ? L("失败 ✗", "fails ✗") : L("已提交 ✓", "committed ✓")} tone={i === 2 ? "bad" : "ok"} />
          {i < 2 && <FArrow x1={x0 + i * dx + 120} y1={y + 22} x2={x0 + (i + 1) * dx} y2={y + 22} c="var(--primary)" />}
        </g>
      ))}
      {[0, 1].map((i) => (
        <g key={i}>
          <path d={`M${x0 + (i + 1) * dx + 20} ${y + 44} q -${dx / 2} 60 -${dx - 40} 0`} fill="none" stroke="#d98a1f" strokeWidth="1.5" strokeDasharray="4 3" />
          <FBox x={x0 + i * dx + 20} y={y + 92} w={80} h={30} label={L("补偿", "compensate")} tone="warn" />
        </g>
      ))}
      <FT x={x0 + dx} y={y + 148} cls="tn">{L("← 反向补偿,存在不一致窗口", "← compensate in reverse, an inconsistency window exists")}</FT>
    </FigFrame>
  );
};

/* ---------------- sc15 · outbox pattern ---------------- */
FIGN["sc15-outbox"] = function ({ idx }) {
  const L = useL();
  return (
    <FigFrame idx={idx} h={196} cap={L("发件箱模式:把「业务数据」和「要发的消息」写进同一个本地事务(要么都成、要么都败),再由单独的中继可靠地把消息投递出去——这样崩溃既不会丢事件、也不会发假事件。", "The outbox pattern: write the business data and the outgoing message in one local transaction (both commit or neither), and a separate relay delivers the message reliably — so a crash neither loses an event nor emits a false one.")}>
      <rect x={40} y={44} width={230} height={110} rx="8" fill="none" stroke="var(--primary)" strokeWidth="1.4" strokeDasharray="5 3" />
      <FT x={155} y={38} cls="tk">{L("一个本地事务", "one local transaction")}</FT>
      <FBox x={58} y={70} w={90} h={60} label={L("业务表", "business")} sub={L("扣库存", "update")} tone="p" />
      <FBox x={162} y={70} w={90} h={60} label="outbox" sub={L("待发消息", "pending msg")} tone="a" />
      <FArrow x1={270} y1={100} x2={330} y2={100} c="var(--muted)" />
      <FBox x={332} y={78} w={90} h={44} label={L("中继", "relay")} tone="m" />
      <FArrow x1={422} y1={100} x2={478} y2={100} c="var(--muted)" />
      <FBox x={480} y={78} w={90} h={44} label={L("消息中间件", "broker")} tone="ok" />
    </FigFrame>
  );
};

/* ---------------- sc16 · trace waterfall ---------------- */
FIGN["sc16-trace"] = function ({ idx }) {
  const L = useL();
  const total = 900, x0 = 120, wid = 480, rowH = 30, y0 = 34;
  const spans = [
    [L("网关", "gateway"), 0, 900, "m"],
    [L("订单", "order"), 40, 820, "p"],
    [L("库存", "inventory"), 70, 90, "p"],
    [L("支付", "payment"), 180, 660, "bad"],
    [L("银行接口", "bank API"), 210, 600, "bad"],
  ];
  return (
    <FigFrame idx={idx} h={206} cap={L("链路追踪把一次请求在每个服务停留的时间画成瀑布图。同一个 TraceId 串起所有 span,一眼看出这次 900ms 里有 660ms 卡在支付调用银行接口那一跳——不用逐台看日志。", "Tracing draws the time a request spends at each service as a waterfall. One TraceId stitches all spans, and you see at a glance that of 900ms, 660 was stuck in payment's call to the bank — no log-by-log hunting.")}>
      {spans.map(([name, s, d, tone], i) => {
        const x = x0 + (s / total) * wid, w = Math.max(3, (d / total) * wid);
        return (
          <g key={i}>
            <text x={x0 - 10} y={y0 + i * rowH + 14} textAnchor="end" className="tm">{name}</text>
            <rect x={x} y={y0 + i * rowH} width={w} height={20} rx="3" fill={`color-mix(in srgb, ${FTONE[tone]} ${tone === "m" ? 30 : 82}%, transparent)`} stroke={FTONE[tone]} />
            <text x={x + w + 5} y={y0 + i * rowH + 14} className="tn">{d}ms</text>
          </g>
        );
      })}
      <FT x={x0 + wid / 2} y={y0 + 5 * rowH + 16} cls="tn">{L("时间 →", "time →")}</FT>
    </FigFrame>
  );
};

/* ---------------- sc25 · Kafka vs RabbitMQ ---------------- */
FIGN["sc25-mq"] = function ({ idx }) {
  const L = useL();
  return (
    <FigFrame idx={idx} h={228} cap={L("Kafka 是分区提交日志:消息按序追加、按保留期留存,消费者用 offset 自己拉、能倒回去重放,吞吐随分区扩展。RabbitMQ 是智能 broker:生产者发给交换机,按规则路由到队列,消费者被推送、逐条 ack,消息一旦确认就删除、默认不能重放。", "Kafka is a partitioned commit log: messages are appended in order and kept for a retention period, consumers pull by offset and can rewind to replay, throughput scales with partitions. RabbitMQ is a smart broker: producers publish to an exchange, it routes to queues by rules, consumers are pushed messages and ack each one, and a message is deleted once acked — no replay by default.")}>
      {/* Kafka side */}
      <text x={168} y={20} textAnchor="middle" style={{ font: "700 12px var(--f-mono)", fill: "var(--primary)" }}>Kafka · {L("分区日志", "partitioned log")}</text>
      <FBox x={20} y={44} w={64} h={34} label={L("生产者", "producer")} tone="m" />
      <FArrow x1={84} y1={61} x2={104} y2={61} c="var(--muted)" />
      {[0, 1, 2, 3, 4].map((o) => (
        <g key={o}>
          <rect x={106 + o * 44} y={46} width={42} height={30} rx="3" fill="color-mix(in srgb, var(--primary) 14%, transparent)" stroke="var(--primary)" />
          <text x={127 + o * 44} y={65} textAnchor="middle" style={{ font: "600 11px var(--f-mono)", fill: "var(--ink)" }}>{o}</text>
        </g>
      ))}
      <FT x={106 + 2 * 44 + 20} y={40} cls="tn">{L("offset(追加,保留)", "offset (append, retained)")}</FT>
      <FArrow x1={127 + 4 * 44} y1={96} x2={127 + 4 * 44} y2={80} c="#2e9e6b" />
      <FT x={127 + 4 * 44} y={110} cls="tn">{L("消费者A · 最新", "consumer A · head")}</FT>
      <FArrow x1={127 + 1 * 44} y1={130} x2={127 + 1 * 44} y2={80} c="#d98a1f" />
      <FT x={127 + 1 * 44} y={144} cls="tk">{L("消费者B · 回放", "consumer B · replay")}</FT>

      <line x1={334} y1={30} x2={334} y2={210} stroke="var(--hairline-strong)" strokeDasharray="4 3" />

      {/* RabbitMQ side */}
      <text x={508} y={20} textAnchor="middle" style={{ font: "700 12px var(--f-mono)", fill: "var(--accent)" }}>RabbitMQ · {L("交换机路由", "exchange routing")}</text>
      <FBox x={352} y={70} w={60} h={34} label={L("生产者", "producer")} tone="m" />
      <FArrow x1={412} y1={87} x2={432} y2={87} c="var(--muted)" />
      <FBox x={434} y={68} w={66} h={40} label={L("交换机", "exchange")} sub="topic" tone="a" />
      <FArrow x1={500} y1={80} x2={528} y2={58} c="var(--muted)" />
      <FArrow x1={500} y1={96} x2={528} y2={118} c="var(--muted)" />
      <FBox x={530} y={42} w={70} h={30} label={L("队列1", "queue 1")} tone="a" />
      <FBox x={530} y={104} w={70} h={30} label={L("队列2", "queue 2")} tone="a" />
      <FArrow x1={600} y1={57} x2={624} y2={57} c="var(--muted)" />
      <FArrow x1={600} y1={119} x2={624} y2={119} c="var(--muted)" />
      <text x={634} y={61} textAnchor="middle" style={{ font: "600 11px var(--f-mono)", fill: "#2e9e6b" }}>✓</text>
      <text x={634} y={123} textAnchor="middle" style={{ font: "600 11px var(--f-mono)", fill: "#2e9e6b" }}>✓</text>
      <FT x={545} y={160} cls="tk">{L("逐条 ack → 删除,不可重放", "ack each → deleted, no replay")}</FT>
    </FigFrame>
  );
};

/* ---------------- sc26 · gRPC vs REST ---------------- */
FIGN["sc26-grpc"] = function ({ idx }) {
  const L = useL();
  return (
    <FigFrame idx={idx} h={224} cap={L("同一条消息:REST 用 JSON 文本(冗长、人可读、任何客户端和 HTTP 缓存都能用),gRPC 用 Protobuf 二进制(紧凑、约 JSON 的四分之一)跑在 HTTP/2 上(多路复用、原生流式、强类型 .proto 契约)。经验法则:服务之间用 gRPC,系统边缘对外用 REST。", "The same message: REST uses JSON text (verbose, human-readable, works with any client and HTTP caching), gRPC uses Protobuf binary (compact, about a quarter of JSON) over HTTP/2 (multiplexed, native streaming, a strong typed .proto contract). Rule of thumb: gRPC between services, REST at the edge.")}>
      {/* REST side */}
      <text x={170} y={20} textAnchor="middle" style={{ font: "700 12px var(--f-mono)", fill: "var(--accent)" }}>REST · JSON + HTTP</text>
      <FBox x={24} y={44} w={62} h={32} label={L("客户端", "client")} tone="m" />
      <FArrow x1={86} y1={60} x2={110} y2={60} c="var(--muted)" />
      <FT x={168} y={40} cls="tn">HTTP/1.1</FT>
      <rect x={110} y={48} width={200} height={24} rx="3" fill="color-mix(in srgb, var(--accent) 14%, transparent)" stroke="var(--accent)" />
      <text x={210} y={64} textAnchor="middle" style={{ font: "500 10px var(--f-mono)", fill: "var(--ink)" }}>{"{ \"orderId\": 5001, ... }  ~280B"}</text>
      <FT x={170} y={92} cls="tk">{L("任何客户端可读 · 可缓存", "any client, readable · cacheable")}</FT>

      <line x1={334} y1={30} x2={334} y2={206} stroke="var(--hairline-strong)" strokeDasharray="4 3" />

      {/* gRPC side */}
      <text x={508} y={20} textAnchor="middle" style={{ font: "700 12px var(--f-mono)", fill: "var(--primary)" }}>gRPC · Protobuf + HTTP/2</text>
      <FBox x={352} y={44} w={62} h={32} label={L("桩", "stub")} tone="m" />
      <FArrow x1={414} y1={60} x2={438} y2={60} c="var(--muted)" />
      <FT x={500} y={40} cls="tn">HTTP/2 · {L("多路复用", "multiplexed")}</FT>
      <rect x={438} y={48} width={52} height={24} rx="3" fill="color-mix(in srgb, var(--primary) 20%, transparent)" stroke="var(--primary)" />
      <text x={464} y={64} textAnchor="middle" style={{ font: "500 9px var(--f-mono)", fill: "var(--ink)" }}>~66B</text>
      <FT x={545} y={64} anchor="start" cls="tk">{L("← 约 JSON 的 1/4", "← ~¼ of JSON")}</FT>
      <FT x={508} y={92} cls="tk">{L(".proto 强类型 · 四种流式", ".proto typed · streaming")}</FT>

      {/* size bars for direct comparison */}
      <FT x={40} y={128} anchor="start" cls="tm">{L("线上报文大小对比 / payload on the wire", "payload size on the wire")}</FT>
      <FT x={40} y={150} anchor="start" cls="tn">JSON</FT>
      <rect x={110} y={140} width={230} height={14} rx="3" fill="color-mix(in srgb, var(--accent) 60%, transparent)" stroke="var(--accent)" />
      <text x={346} y={151} className="tn">~280B</text>
      <FT x={40} y={172} anchor="start" cls="tn">Protobuf</FT>
      <rect x={110} y={162} width={54} height={14} rx="3" fill="color-mix(in srgb, var(--primary) 70%, transparent)" stroke="var(--primary)" />
      <text x={170} y={173} className="tn">~66B</text>
    </FigFrame>
  );
};

/* ---------------- sc28 · API versioning ---------------- */
FIGN["sc28-version"] = function ({ idx }) {
  const L = useL();
  return (
    <FigFrame idx={idx} h={214} cap={L("破坏性改动时,让新旧版本并行:网关按 /v1、/v2(或请求头、媒体类型)把调用方路由到对应版本。老调用方继续用 v1、不受影响,你用 Deprecation / Sunset 响应头通知截止日期,等大家迁移到 v2 后再退役 v1。加法改动则根本不需要新版本。", "For a breaking change, run the old and new versions in parallel: the gateway routes callers to the right version by /v1, /v2 (or a header, or a media type). Old callers stay on v1, untouched; you announce the deadline with Deprecation / Sunset headers, and retire v1 once everyone has migrated to v2. An additive change needs no new version at all.")}>
      <FBox x={24} y={72} w={62} h={36} label={L("调用方", "callers")} tone="m" />
      <FArrow x1={86} y1={90} x2={110} y2={90} c="var(--muted)" />
      <FBox x={112} y={66} w={104} h={48} label={L("网关", "Gateway")} sub={L("按版本路由", "route by version")} tone="p" />
      <FArrow x1={216} y1={78} x2={352} y2={54} c="#d98a1f" />
      <FArrow x1={216} y1={102} x2={352} y2={140} c="#2e9e6b" />
      <FT x={288} y={56} cls="tn">/v1/**</FT>
      <FT x={288} y={140} cls="tn">/v2/**</FT>
      <FBox x={354} y={36} w={150} h={40} label={L("订单 v1", "order v1")} sub={L("弃用 · 日落 2026-12", "deprecated · sunset 2026-12")} tone="warn" />
      <FBox x={354} y={120} w={150} h={40} label={L("订单 v2", "order v2")} sub={L("当前", "current")} tone="ok" />
      <FT x={520} y={60} anchor="start" cls="tn">{L("← 老调用方仍可用", "← old callers still work")}</FT>
      <line x1={40} y1={182} x2={640} y2={182} stroke="var(--hairline)" strokeDasharray="3 3" />
      <FT x={40} y={200} anchor="start" cls="tm">{L("版本可放在:", "the version can live in:")}</FT>
      <FT x={168} y={200} anchor="start" cls="tk">URI /v2/orders</FT>
      <FT x={330} y={200} anchor="start" cls="tk">X-API-Version: 2</FT>
      <FT x={490} y={200} anchor="start" cls="tk">Accept: …v2+json</FT>
    </FigFrame>
  );
};

/* ---------------- sc29 · distributed rate limiting ---------------- */
FIGN["sc29-dlimit"] = function ({ idx }) {
  const L = useL();
  return (
    <FigFrame idx={idx} h={214} cap={L("目标是全局每秒 1000 次。左:每个网关一个本地桶,各设 1000——十个网关加起来放进一万,超十倍。本地的桶不会相加成一个全局桶。右:所有网关对 Redis 上同一个计数器原子地检查并扣减,于是无论多少网关,全局额度都精确是 1000/s——代价是每请求一次 Redis 往返。", "The target is 1000 requests per second globally. Left: each gateway has its own local bucket set to 1000 — ten gateways admit ten thousand, ten times over. Local buckets do not add up into one global bucket. Right: all gateways atomically check-and-decrement one counter in Redis, so however many gateways there are the global quota is exactly 1000/s — at the cost of a Redis round-trip per request.")}>
      {/* left: local buckets */}
      <text x={168} y={20} textAnchor="middle" style={{ font: "700 12px var(--f-mono)", fill: "#d98a1f" }}>{L("本地桶 · N× 超额", "local buckets · N× over")}</text>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <FBox x={28} y={40 + i * 42} w={116} h={32} label={L("网关", "gateway")} sub="1000/s" tone="warn" />
          <FArrow x1={144} y1={56 + i * 42} x2={236} y2={98} c="var(--muted)" />
        </g>
      ))}
      <FBox x={238} y={78} w={80} h={40} label="10000/s" sub={L("✗ 10 倍", "✗ 10×")} tone="bad" />
      <FT x={168} y={182} cls="tk">{L("各放各的,不相加", "each admits alone, no sum")}</FT>

      <line x1={334} y1={28} x2={334} y2={196} stroke="var(--hairline-strong)" strokeDasharray="4 3" />

      {/* right: shared Redis */}
      <text x={508} y={20} textAnchor="middle" style={{ font: "700 12px var(--f-mono)", fill: "var(--primary)" }}>{L("共享 Redis · 精确", "shared Redis · exact")}</text>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <FBox x={360} y={40 + i * 42} w={104} h={32} label={L("网关", "gateway")} tone="p" />
          <FArrow x1={464} y1={56 + i * 42} x2={532} y2={98} c="var(--muted)" />
        </g>
      ))}
      <FBox x={534} y={78} w={96} h={40} label="Redis" sub={L("1000/s ✓", "1000/s ✓")} tone="ok" />
      <FT x={508} y={182} cls="tk">{L("同一个计数器,原子扣减", "one counter, atomic decrement")}</FT>
    </FigFrame>
  );
};
