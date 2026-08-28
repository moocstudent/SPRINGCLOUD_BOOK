/* =========================================================
   figures3.jsx — lecture figures for Module VII–VIII (sc17–sc24)
   + the <Figure> component and window export.
   Shares FIGN + primitives from figures.jsx (global scope).
   ========================================================= */

/* ---------------- sc17 · P99 vs average ---------------- */
FIGN["sc17-p99"] = function ({ idx }) {
  const L = useL();
  const base = 40, y0 = 22, h0 = 140, wid = 600;
  const bars = [0.05, 0.62, 0.14, 0.05, 0.03, 0.02, 0.015, 0.03, 0.05]; // last bucket = tail
  const labels = ["10", "20", "40", "80", "160", "300", "600", "1s", "2s"];
  const bw = wid / bars.length;
  const avgX = base + 2.2 * bw, p99X = base + 7.6 * bw;
  return (
    <FigFrame idx={idx} h={210} cap={L("延迟分布是长尾的:平均值落在左边的高峰里(看起来很健康),但 P99 在右边的尾巴上。请求量一大,平均值几乎不动、P99 却爆表——真正决定体验的是尾延迟。", "The latency distribution is long-tailed: the average sits in the tall left peak (looks healthy), but P99 lives in the right tail. As load rises, the average barely moves while P99 blows out — tail latency is what decides experience.")}>
      <line x1={base} y1={y0 + h0} x2={base + wid} y2={y0 + h0} stroke="var(--hairline-strong)" />
      {bars.map((b, i) => {
        const bh = b / 0.62 * h0, x = base + i * bw + 6;
        const tail = i >= 5;
        return <g key={i}>
          <rect x={x} y={y0 + h0 - bh} width={bw - 12} height={bh} rx="2" fill={`color-mix(in srgb, ${tail ? "#c0453f" : "var(--primary)"} 78%, transparent)`} stroke={tail ? "#c0453f" : "var(--primary)"} />
          <FT x={x + (bw - 12) / 2} y={y0 + h0 + 14} cls="tn">{labels[i]}</FT>
        </g>;
      })}
      <line x1={avgX} y1={y0} x2={avgX} y2={y0 + h0} stroke="var(--accent)" strokeWidth="1.6" strokeDasharray="4 3" />
      <FT x={avgX} y={y0 - 6} cls="tk">{L("平均 ~40ms", "avg ~40ms")}</FT>
      <line x1={p99X} y1={y0} x2={p99X} y2={y0 + h0} stroke="#c0453f" strokeWidth="1.6" strokeDasharray="4 3" />
      <FT x={p99X} y={y0 - 6} cls="tk">P99 ~1.2s</FT>
      <FT x={base + wid / 2} y={y0 + h0 + 30} cls="tm">{L("延迟(ms)→", "latency (ms) →")}</FT>
    </FigFrame>
  );
};

/* ---------------- sc18 · traceId correlation ---------------- */
FIGN["sc18-corr"] = function ({ idx }) {
  const L = useL();
  const mixed = ["a1", "c3", "a1", "b2", "a1", "c3", "b2", "a1"];
  const colors = { a1: "var(--primary)", b2: "var(--muted)", c3: "var(--accent)" };
  return (
    <FigFrame idx={idx} h={200} cap={L("没有关联,一次请求的日志被别的请求的日志隔开,只能逐行猜;给每条日志打上同一个 TraceId,一过滤就把它们按序拼成一条完整故事——这也是链路追踪用的同一个 ID。", "Without correlation, one request's logs are separated by others' and you squint line by line; stamp every log with the same TraceId and one filter stitches them, in order, into a complete story — the same id tracing uses.")}>
      <FT x={150} y={22} cls="tk">{L("全系统日志(混在一起)", "all logs (mixed)")}</FT>
      {mixed.map((t, i) => (
        <g key={i}>
          <rect x={40} y={34 + i * 18} width={220} height={14} rx="2" fill={`color-mix(in srgb, ${colors[t]} 22%, transparent)`} stroke={colors[t]} strokeWidth="0.8" />
          <text x={48} y={44 + i * 18} style={{ font: "600 9px var(--f-mono)", fill: colors[t] }}>{t}</text>
        </g>
      ))}
      <FArrow x1={272} y1={110} x2={342} y2={110} c="var(--muted)" wdt={1.6} />
      <FT x={307} y={100} cls="tn">{L("按 a1 过滤", "filter a1")}</FT>
      <FT x={500} y={22} cls="tk">{L("一次请求,按序", "one request, in order")}</FT>
      {mixed.filter((t) => t === "a1").map((t, i) => (
        <g key={i}>
          <rect x={370} y={34 + i * 22} width={270} height={17} rx="2" fill="color-mix(in srgb, var(--primary) 16%, transparent)" stroke="var(--primary)" />
          <text x={379} y={46 + i * 22} style={{ font: "600 9px var(--f-mono)", fill: "var(--primary)" }}>a1</text>
          <text x={400} y={46 + i * 22} className="tn">{[L("网关 收到请求", "gateway recv"), L("订单 创建", "order create"), L("库存 扣减", "inventory dec"), L("支付 银行 812ms", "payment bank 812ms")][i]}</text>
        </g>
      ))}
    </FigFrame>
  );
};

/* ---------------- sc19 · placement & blast radius ---------------- */
FIGN["sc19-placement"] = function ({ idx }) {
  const L = useL();
  const machines = [
    { down: false, svcs: [L("网关", "gw"), L("订单", "order")] },
    { down: true, svcs: [L("库存", "inv"), L("支付", "pay")] },
    { down: false, svcs: [L("订单", "order"), L("支付", "pay")] },
  ];
  return (
    <FigFrame idx={idx} h={200} cap={L("放置就是把服务装箱到机器上。用反亲和把同一服务的副本分散到不同机器:即使 machine-1 宕机,订单和支付在别的机器上都还有存活副本,下单链路照常——单点故障只吃掉一小块。", "Placement is bin-packing services onto machines. Anti-affinity spreads a service's replicas across machines: even with machine-1 down, order and payment still have live replicas elsewhere and checkout runs — a single failure eats only a slice.")}>
      {machines.map((m, i) => {
        const x = 60 + i * 200;
        return (
          <g key={i}>
            <rect x={x} y={40} width={160} height={100} rx="8" fill={m.down ? "color-mix(in srgb,#c0453f 8%,transparent)" : "var(--surface-2)"} stroke={m.down ? "#c0453f" : "var(--hairline-strong)"} strokeWidth="1.4" opacity={m.down ? 0.6 : 1} />
            <text x={x + 80} y={32} textAnchor="middle" style={{ font: "600 11px var(--f-mono)", fill: m.down ? "#c0453f" : "var(--muted)" }}>{m.down ? `✗ machine-${i}` : `machine-${i}`}</text>
            {m.svcs.map((s, j) => <FBox key={j} x={x + 16} y={54 + j * 40} w={128} h={30} label={s} tone={m.down ? "m" : "p"} />)}
          </g>
        );
      })}
      <FT x={340} y={172} cls="tk">{L("宕一台,下单链路仍存活 ✓", "one machine down, checkout still alive ✓")}</FT>
    </FigFrame>
  );
};

/* ---------------- sc20 · HPA scaling with cold-start gap ---------------- */
FIGN["sc20-hpa"] = function ({ idx }) {
  const L = useL();
  const base = 46, y0 = 20, h0 = 130, wid = 600, steps = 60;
  const traf = (t) => 300 + 2200 * Math.exp(-Math.pow((t - 30) / 11, 2));
  const cap = (t) => { const target = traf(Math.max(0, t - 6)); return Math.min(traf(t) * 1.05, 300 + Math.max(0, target - 300)); };
  const yMax = 2600;
  const px = (i) => base + (i / (steps - 1)) * wid;
  const py = (v) => y0 + h0 - (v / yMax) * h0;
  const tPath = Array.from({ length: steps }, (_, i) => `${i ? "L" : "M"}${px(i).toFixed(1)},${py(traf(i)).toFixed(1)}`).join(" ");
  const cPath = Array.from({ length: steps }, (_, i) => `${i ? "L" : "M"}${px(i).toFixed(1)},${py(cap(i)).toFixed(1)}`).join(" ");
  return (
    <FigFrame idx={idx} h={200} cap={L("HPA 让副本追流量,但扩容不是瞬时的:从决定扩容到新副本就绪有几十秒冷启动。在这段空档里流量已超过现有能力(蓝线掉到灰线下方的阴影区)——全是超时。", "The HPA makes replicas chase traffic, but scaling is not instant: from the decision to a ready replica is tens of seconds of cold start. In that gap load exceeds current capacity (the shaded area where blue dips under grey) — all timeouts.")}>
      <line x1={base} y1={y0 + h0} x2={base + wid} y2={y0 + h0} stroke="var(--hairline-strong)" />
      <path d={`${tPath} L${px(steps - 1)},${y0 + h0} L${px(0)},${y0 + h0} Z`} fill="color-mix(in srgb,#c0453f 12%,transparent)" stroke="none" />
      <path d={`${cPath} L${px(steps - 1)},${y0 + h0} L${px(0)},${y0 + h0} Z`} fill="var(--bg)" stroke="none" />
      <path d={tPath} fill="none" stroke="var(--muted)" strokeWidth="1.8" />
      <path d={cPath} fill="none" stroke="var(--primary)" strokeWidth="2" />
      <FT x={px(30)} y={py(traf(30)) - 8} cls="tn">{L("流量峰", "traffic peak")}</FT>
      <FT x={px(37)} y={py(500) + 4} anchor="start" cls="tk">{L("冷启动缺口=超时", "cold-start gap = timeouts")}</FT>
      <FT x={base + 4} y={y0 + 10} anchor="start" cls="tn">{L("灰=流量 蓝=处理能力", "grey=load blue=capacity")}</FT>
    </FigFrame>
  );
};

/* ---------------- sc21 · multi-DC replication ---------------- */
FIGN["sc21-multidc"] = function ({ idx }) {
  const L = useL();
  return (
    <FigFrame idx={idx} h={200} cap={L("异地多活:两个机房同时对外服务,数据异步复制(有约几十毫秒延迟)。机房 A 整体故障,流量切到 B——异步复制下,还没复制过去的那几条写入丢了(RPO>0);同步复制 RPO=0 但每次写都要多等一个跨机房往返。", "Active-active: two DCs serve at once, data replicating asynchronously (tens of ms of lag). DC-A fails wholesale, traffic shifts to B — under async, the writes not yet replicated are lost (RPO>0); sync gives RPO=0 but every write pays a cross-DC round trip.")}>
      <rect x={60} y={54} width={200} height={100} rx="10" fill="color-mix(in srgb,#c0453f 8%,transparent)" stroke="#c0453f" strokeWidth="1.6" opacity={0.65} />
      <text x={160} y={44} textAnchor="middle" style={{ font: "700 13px var(--f-mono)", fill: "#c0453f" }}>✗ DC-A</text>
      <FBox x={80} y={72} w={72} h={30} label={L("服务", "services")} tone="m" />
      <FBox x={168} y={72} w={72} h={30} label="DB" tone="m" />
      <FT x={160} y={130} cls="tn">{L("整体故障", "region outage")}</FT>
      <FArrow x1={262} y1={90} x2={418} y2={90} c="var(--accent)" wdt={1.8} />
      <FT x={340} y={80} cls="tk">{L("异步复制 ~60ms", "async ~60ms")}</FT>
      <FT x={340} y={112} cls="tn">{L("RPO = 未复制的写", "RPO = unreplicated writes")}</FT>
      <rect x={420} y={54} width={200} height={100} rx="10" fill="color-mix(in srgb,var(--primary) 6%,transparent)" stroke="var(--primary)" strokeWidth="1.6" />
      <text x={520} y={44} textAnchor="middle" style={{ font: "700 13px var(--f-mono)", fill: "var(--primary)" }}>DC-B</text>
      <FBox x={440} y={72} w={72} h={30} label={L("服务", "services")} tone="p" />
      <FBox x={528} y={72} w={72} h={30} label="DB" tone="p" />
      <FT x={520} y={130} cls="tn">{L("接管,继续服务", "takes over, keeps serving")}</FT>
    </FigFrame>
  );
};

/* ---------------- sc22 · JWT hop-by-hop ---------------- */
FIGN["sc22-jwt"] = function ({ idx }) {
  const L = useL();
  const nodes = [L("网关 🔑", "gateway 🔑"), "svc-1 🔒", "svc-2 🔒", "svc-3 🔒"];
  return (
    <FigFrame idx={idx} h={186} cap={L("用户在网关用 OAuth2/OIDC 登录、拿到签名的 JWT;之后 JWT 逐跳传递,每个服务本地验签确认身份,不必回认证中心。零信任更进一步:服务间用 mTLS 互验,默认谁都不信,代价是每跳的握手开销。", "The user logs in at the gateway with OAuth2/OIDC and gets a signed JWT; it is then passed hop by hop and each service verifies it locally, with no round-trip to the auth server. Zero trust goes further: services mutually authenticate with mTLS, trusting no one — at a per-hop handshake cost.")}>
      <FBox x={30} y={90} w={70} h={38} label={L("登录", "login")} tone="m" />
      <FArrow x1={100} y1={109} x2={140} y2={109} c="var(--muted)" />
      {nodes.map((n, i) => {
        const x = 142 + i * 128;
        return <g key={i}>
          <FBox x={x} y={86} w={110} h={46} label={n} tone={i === 0 ? "p" : "a"} />
          {i < nodes.length - 1 && <FArrow x1={x + 110} y1={109} x2={x + 128} y2={109} c="var(--muted)" />}
        </g>;
      })}
      <FT x={340} y={70} cls="tn">{L("JWT 逐跳传递,每跳验签", "JWT passed & verified each hop")}</FT>
      <FT x={340} y={158} cls="tk">{L("内网不是可信网", "the internal network is not trusted")}</FT>
    </FigFrame>
  );
};

/* ---------------- sc23 · chaos blast radius ---------------- */
FIGN["sc23-chaos"] = function ({ idx }) {
  const L = useL();
  return (
    <FigFrame idx={idx} h={210} cap={L("混沌工程主动往依赖里注入故障(这里打挂支付),再验证稳态假设是否守住。开了韧性(熔断/超时/隔离),故障被关在支付边界内,订单与下单降级但存活;关了韧性,它会一路级联到下单。", "Chaos engineering injects failure into a dependency (here payment), then checks whether the steady-state hypothesis holds. With resilience (breaker/timeout/bulkhead) the fault is contained at payment's boundary and order/checkout degrade but survive; without it, the fault cascades all the way to checkout.")}>
      <FBox x={290} y={26} w={110} h={38} label={L("下单 ✓", "checkout ✓")} tone="ok" />
      <FArrow x1={345} y1={64} x2={345} y2={80} c="var(--muted)" />
      <FBox x={290} y={82} w={110} h={38} label={L("订单 ✓", "order ✓")} tone="ok" />
      <FArrow x1={330} y1={120} x2={230} y2={140} c="var(--muted)" />
      <FArrow x1={360} y1={120} x2={430} y2={140} c="var(--muted)" />
      <FBox x={150} y={142} w={110} h={38} label={L("库存 ✓", "inventory ✓")} tone="p" />
      <FBox x={378} y={142} w={120} h={38} label={L("支付 ✗ 注入", "payment ✗ inject")} tone="bad" />
      <FArrow x1={438} y1={180} x2={438} y2={196} c="#c0453f" />
      <FBox x={378} y={186} w={120} h={30} label={L("银行接口", "bank API")} tone="m" />
      <rect x={366} y={130} width={144} height={92} rx="8" fill="none" stroke="#d98a1f" strokeDasharray="4 3" />
      <FT x={438} y={128} cls="tk">{L("韧性把它关在这里", "resilience contains it here")}</FT>
    </FigFrame>
  );
};

/* ---------------- sc24 · full architecture ---------------- */
FIGN["sc24-arch"] = function ({ idx }) {
  const L = useL();
  return (
    <FigFrame idx={idx} h={244} cap={L("全景:客户端经网关(鉴权/限流)进入服务集群;服务通过注册中心相互发现、由配置中心统一配置、用 OpenFeign+熔断互调、用 Seata 保事务、发事件异步协作;链路追踪/指标/日志贯穿全程;整体容器化后在 K8s 上弹性伸缩、跨机房多活。", "The whole picture: clients enter through the gateway (auth/rate-limit); services discover each other via the registry, share config centrally, call over OpenFeign with breakers, keep transactions with Seata, and cooperate through events; tracing/metrics/logs thread it all; containerised, it autoscales on Kubernetes across regions.")}>
      <FBox x={24} y={100} w={64} h={40} label={L("客户端", "clients")} tone="m" />
      <FArrow x1={88} y1={120} x2={112} y2={120} c="var(--muted)" />
      <FBox x={114} y={96} w={78} h={48} label={L("网关", "Gateway")} tone="p" />
      {[[L("订单", "order"), 40], [L("库存", "inventory"), 96], [L("支付", "payment"), 152]].map(([s, y], i) => (
        <g key={i}>
          <FArrow x1={192} y1={120} x2={228} y2={y + 16} c="var(--muted)" />
          <FBox x={230} y={y} w={110} h={32} label={s} tone="a" />
          <FBox x={356} y={y} w={64} h={32} label="DB" tone="m" />
          <FArrow x1={340} y1={y + 16} x2={356} y2={y + 16} c="var(--muted)" />
        </g>
      ))}
      <FBox x={470} y={40} w={150} h={34} label={L("注册中心", "registry")} tone="ok" />
      <FBox x={470} y={82} w={150} h={34} label={L("配置中心", "config server")} tone="ok" />
      <FBox x={470} y={124} w={150} h={34} label={L("Seata 事务", "Seata txn")} tone="ok" />
      <FBox x={470} y={166} w={150} h={34} label={L("追踪/指标/日志", "trace/metric/log")} tone="warn" />
      <rect x={14} y={216} width={606} height={22} rx="6" fill="color-mix(in srgb,var(--primary) 8%,transparent)" stroke="var(--primary)" strokeDasharray="4 3" />
      <FT x={317} y={231} cls="tk">{L("容器化 · Kubernetes 弹性伸缩 · 异地多活", "containerised · Kubernetes autoscaling · active-active across regions")}</FT>
    </FigFrame>
  );
};

/* ---------------- sc27 · service mesh ---------------- */
FIGN["sc27-mesh"] = function ({ idx }) {
  const L = useL();
  return (
    <FigFrame idx={idx} h={228} cap={L("服务网格在每个 Pod 旁注入一个 sidecar 代理(Envoy),所有服务间流量都经过它:mTLS、重试、熔断、灰度、遥测都在这一层完成,与应用语言无关。控制平面(Istiod)统一给所有 sidecar 下发配置。代价是每一跳都要多穿过两个代理的延迟税。", "A service mesh injects a sidecar proxy (Envoy) beside each pod, and all service-to-service traffic passes through it: mTLS, retries, breaking, canary and telemetry all happen at this layer, independent of the app's language. The control plane (Istiod) pushes configuration uniformly to every sidecar. The price is a latency tax — every hop crosses two extra proxies.")}>
      {/* control plane */}
      <FBox x={266} y={20} w={150} h={30} label={L("控制平面 · Istiod", "control plane · Istiod")} tone="a" />
      <FArrow x1={330} y1={50} x2={232} y2={104} c="var(--muted)" dash />
      <FArrow x1={352} y1={50} x2={458} y2={104} c="var(--muted)" dash />
      <FT x={488} y={74} anchor="start" cls="tn">{L("下发配置", "pushes config")}</FT>

      {/* pod A */}
      <rect x={38} y={96} width={252} height={64} rx="10" fill="none" stroke="var(--hairline-strong)" strokeWidth="1.3" />
      <FT x={164} y={174} cls="tn">Pod A</FT>
      <FBox x={52} y={110} w={110} h={38} label={L("订单", "order")} tone="m" />
      <FBox x={176} y={110} w={100} h={38} label="Envoy" sub="sidecar" tone="p" />
      <FArrow x1={162} y1={129} x2={176} y2={129} c="var(--muted)" />

      {/* pod B */}
      <rect x={390} y={96} width={252} height={64} rx="10" fill="none" stroke="var(--hairline-strong)" strokeWidth="1.3" />
      <FT x={516} y={174} cls="tn">Pod B</FT>
      <FBox x={404} y={110} w={100} h={38} label="Envoy" sub="sidecar" tone="p" />
      <FBox x={518} y={110} w={110} h={38} label={L("库存", "inventory")} tone="m" />
      <FArrow x1={504} y1={129} x2={518} y2={129} c="var(--muted)" />

      {/* mesh hop */}
      <FArrow x1={276} y1={129} x2={404} y2={129} c="var(--primary)" wdt={2} />
      <FT x={340} y={120} cls="tk">{L("mTLS · 重试 · 遥测", "mTLS · retry · telemetry")}</FT>

      <FT x={340} y={200} cls="tm">{L("数据平面:每个 Pod 一个 sidecar,组成网格", "data plane: one sidecar per pod forms the mesh")}</FT>
    </FigFrame>
  );
};

/* ---------------- sc30 · head vs tail sampling ---------------- */
FIGN["sc30-sample"] = function ({ idx }) {
  const L = useL();
  return (
    <FigFrame idx={idx} h={214} cap={L("头部采样在请求刚进来时就掷骰子决定采不采,把决定通过 traceparent 的 sampled 位传给全链路——简单便宜、一条 trace 全采或全不采,但你在还不知道结果时就决定了,那条出错的可能被丢。尾部采样先把所有 span 缓存进收集器,等 trace 完成、知道了结果再决定——错误和慢的全留,代价是重得多的缓冲。", "Head sampling rolls the die when the request arrives and propagates the decision to the whole chain via the sampled bit of traceparent — simple, cheap, all-or-nothing per trace, but you decide before you know the outcome, so the errored one may be dropped. Tail sampling buffers all spans in a collector and decides after the trace completes and the outcome is known — keeping every error and slow trace, at the cost of much heavier buffering.")}>
      {/* head */}
      <text x={168} y={20} textAnchor="middle" style={{ font: "700 12px var(--f-mono)", fill: "#d98a1f" }}>{L("头部采样 · 起点决定", "head-based · decide at head")}</text>
      <FBox x={28} y={54} w={104} h={44} label={L("网关", "gateway")} sub={L("掷骰 10%", "roll 10%")} tone="warn" />
      <FArrow x1={132} y1={76} x2={214} y2={60} c="var(--muted)" />
      <FArrow x1={132} y1={82} x2={214} y2={110} c="#c0453f" />
      <FT x={175} y={44} cls="tn">{L("sampled 位传播", "sampled bit →")}</FT>
      <FBox x={216} y={46} w={104} h={28} label={L("普通 · 采", "normal · kept")} tone="ok" />
      <FBox x={216} y={96} w={104} h={28} label={L("出错 · 被丢", "error · dropped")} tone="bad" />
      <FT x={168} y={150} cls="tk">{L("对错误一视同仁 → 可能丢掉故障", "blind to outcome → may drop the failure")}</FT>

      <line x1={338} y1={28} x2={338} y2={196} stroke="var(--hairline-strong)" strokeDasharray="4 3" />

      {/* tail */}
      <text x={510} y={20} textAnchor="middle" style={{ font: "700 12px var(--f-mono)", fill: "var(--primary)" }}>{L("尾部采样 · 完成后决定", "tail-based · decide after")}</text>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <FBox x={356} y={40 + i * 34} w={78} h={26} label={`svc-${i + 1}`} tone="p" />
          <FArrow x1={434} y1={53 + i * 34} x2={480} y2={92} c="var(--muted)" />
        </g>
      ))}
      <FBox x={482} y={68} w={96} h={50} label={L("收集器", "collector")} sub={L("缓冲全部 span", "buffer all spans")} tone="a" />
      <FArrow x1={578} y1={93} x2={606} y2={93} c="var(--muted)" />
      <FT x={612} y={70} anchor="end" cls="tn">✓</FT>
      <FT x={510} y={150} cls="tk">{L("错误全留 · 正常 p%", "keep all errors · normal p%")}</FT>
    </FigFrame>
  );
};

/* =========================================================
   <Figure> — resolves a name to a registered figure component
   ========================================================= */
function Figure({ name, idx }) {
  const F = FIGN[name];
  if (!F) return null;
  return <F idx={idx} />;
}

window.FIGN = FIGN;
window.Figure = Figure;
