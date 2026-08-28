/* =========================================================
   figures.jsx — static lecture figures (Module I–III, sc1–sc9)
   ---------------------------------------------------------
   Chapter notes carry a line like `@fig sc1-tax`, which
   pages.jsx replaces with <Figure name="sc1-tax" idx={n} />.
   Each figure is a dependency-free, theme-aware SVG using the
   shared primitives below and the site language (useL()).
   Keep in-SVG text to SHORT labels; put full sentences in the
   `cap` (an HTML figcaption the browser wraps). figures3.jsx
   defines <Figure> + the window export.
   ========================================================= */

const FIGN = {};
const FTONE = { p: "var(--primary)", a: "var(--accent)", m: "var(--muted)", bad: "#c0453f", ok: "#2e9e6b", warn: "#d98a1f", n: "var(--surface-2)" };

function FigFrame({ w = 680, h = 220, cap, idx, children }) {
  const L = useL();
  return (
    <figure className="sc-fig">
      <svg className="sc-fig-svg" viewBox={`0 0 ${w} ${h}`} width="100%" preserveAspectRatio="xMidYMid meet" role="img">
        {children}
      </svg>
      {cap ? <figcaption>{idx ? <span className="fno">{L(`图 ${idx}`, `Fig. ${idx}`)}</span> : null}{cap}</figcaption> : null}
    </figure>
  );
}
function FArrow({ x1, y1, x2, y2, dash, c = "var(--muted)", wdt = 1.3 }) {
  const ang = Math.atan2(y2 - y1, x2 - x1), s = 5.5;
  const tip = `${x2},${y2} ${(x2 - s * Math.cos(ang - 0.42)).toFixed(1)},${(y2 - s * Math.sin(ang - 0.42)).toFixed(1)} ${(x2 - s * Math.cos(ang + 0.42)).toFixed(1)},${(y2 - s * Math.sin(ang + 0.42)).toFixed(1)}`;
  return <g><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={wdt} strokeDasharray={dash ? "4 3" : ""} /><polygon points={tip} fill={c} /></g>;
}
function FBox({ x, y, w, h, label, sub, tone = "n" }) {
  const solid = tone !== "n";
  const c = FTONE[tone] || FTONE.n;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="6" fill={solid ? `color-mix(in srgb, ${c} 84%, transparent)` : "var(--surface-2)"} stroke={c} strokeWidth="1.2" />
      <text x={x + w / 2} y={y + h / 2 + (sub ? -3 : 1)} textAnchor="middle" dominantBaseline="middle" style={{ font: "600 11.5px var(--f-mono)", fill: solid ? "#fff" : "var(--ink)" }}>{label}</text>
      {sub ? <text x={x + w / 2} y={y + h / 2 + 11} textAnchor="middle" style={{ font: "500 8.5px var(--f-mono)", fill: solid ? "rgba(255,255,255,.85)" : "var(--muted)" }}>{sub}</text> : null}
    </g>
  );
}
function FT({ x, y, children, anchor = "middle", cls = "tm" }) {
  return <text x={x} y={y} textAnchor={anchor} className={cls}>{children}</text>;
}

/* ---------------- sc1 · the availability tax ---------------- */
FIGN["sc1-tax"] = function ({ idx }) {
  const L = useL();
  const base = 40, top = 24, h0 = 150;
  const Ns = [1, 3, 5, 10, 15];
  const av = (n) => Math.pow(0.999, n);
  return (
    <FigFrame idx={idx} h={210} cap={L("单服务 99.9%,串成 N 个的调用链后整体可用率是 0.999 的 N 次方——N=10 时掉到 99.0%,你没做错什么却损失了十倍可用率。", "Each service is 99.9%, but a chain of N has composite availability 0.999^N — at N=10 it falls to 99.0%. You did nothing wrong and lost a factor of ten.")}>
      <line x1={base} y1={top + h0} x2={640} y2={top + h0} stroke="var(--hairline-strong)" />
      <line x1={base} y1={top} x2={base} y2={top + h0} stroke="var(--hairline-strong)" />
      <line x1={base} y1={top + h0 * (1 - (av(1) - 0.98) / 0.02)} x2={640} y2={top + h0 * (1 - (av(1) - 0.98) / 0.02)} stroke="var(--accent)" strokeDasharray="4 3" />
      <FT x={636} y={top + h0 * (1 - (av(1) - 0.98) / 0.02) - 5} anchor="end" cls="tn">{L("单体 99.9%", "monolith 99.9%")}</FT>
      {Ns.map((n, i) => {
        const x = base + 60 + i * 115, a = av(n), bh = h0 * (a - 0.98) / 0.02;
        const tone = a < 0.985 ? "bad" : a < 0.995 ? "warn" : "p";
        return (
          <g key={n}>
            <rect x={x} y={top + h0 - bh} width={64} height={bh} rx="3" fill={`color-mix(in srgb, ${FTONE[tone]} 78%, transparent)`} stroke={FTONE[tone]} />
            <text x={x + 32} y={top + h0 - bh - 6} textAnchor="middle" style={{ font: "600 11px var(--f-mono)", fill: "var(--ink)" }}>{pct2(a)}</text>
            <FT x={x + 32} y={top + h0 + 16} cls="tn">{`N=${n}`}</FT>
          </g>
        );
      })}
      <FT x={base + 60 + 2 * 115 + 32} y={top + h0 + 30} cls="tm">{L("链上服务数", "services in chain")}</FT>
    </FigFrame>
  );
};

/* ---------------- sc2 · three implementations ---------------- */
FIGN["sc2-stack"] = function ({ idx }) {
  const L = useL();
  const cols = [
    { t: "Netflix", tone: "warn", note: L("退役/维护", "retired"), items: ["Eureka", "Ribbon✗", "Hystrix✗", "Zuul✗"] },
    { t: L("官方 Official", "Official"), tone: "ok", note: L("默认", "default"), items: ["—", "LoadBalancer", "Resilience4j", "Gateway"] },
    { t: "Alibaba", tone: "a", note: L("流行", "popular"), items: ["Nacos", "—", "Sentinel", "—"] },
  ];
  const rows = [L("发现", "discovery"), L("负载", "load-bal"), L("熔断", "resilience"), L("网关", "gateway")];
  return (
    <FigFrame idx={idx} h={228} cap={L("同一件事有三套实现:Netflix 大多退役、官方是今天的默认、Alibaba 在中文社区流行;而 Boot ↔ Cloud ↔ Alibaba 的版本必须对齐,否则启动就炸。", "One job, three implementations: Netflix mostly retired, the official set today's default, Alibaba popular in China — and Boot ↔ Cloud ↔ Alibaba versions must align or it will not start.")}>
      {rows.map((r, i) => <FT key={i} x={70} y={58 + i * 34} anchor="end" cls="tk">{r}</FT>)}
      {cols.map((c, ci) => {
        const x = 92 + ci * 190;
        return (
          <g key={ci}>
            <text x={x + 78} y={26} textAnchor="middle" style={{ font: "700 12px var(--f-mono)", fill: FTONE[c.tone] }}>{c.t}</text>
            <FT x={x + 78} y={39} cls="tn">{c.note}</FT>
            {c.items.map((it, ri) => (
              <FBox key={ri} x={x} y={46 + ri * 34} w={156} h={26} label={it} tone={it === "—" ? "n" : it.endsWith("✗") ? "warn" : c.tone} />
            ))}
          </g>
        );
      })}
    </FigFrame>
  );
};

/* ---------------- sc3 · granularity U-curve ---------------- */
FIGN["sc3-split"] = function ({ idx }) {
  const L = useL();
  const base = 44, top = 22, h0 = 150, wid = 590;
  const cost = (k) => 40 / k + (k - 1) * 2.2;
  const pts = [];
  for (let k = 1; k <= 20; k++) pts.push([k, cost(k)]);
  const maxC = Math.max(...pts.map((p) => p[1]));
  const px = (k) => base + ((k - 1) / 19) * wid;
  const py = (c) => top + h0 - (c / maxC) * h0;
  const nStar = 4;
  return (
    <FigFrame idx={idx} h={214} cap={L("总成本 = 协调成本(∝1/N)+ 网络与一致性成本(∝N)。太粗是伪微服务,太细是分布式单体,最优在中间——位置由业务耦合决定,不由「越小越好」决定。", "Total cost = coordination (∝1/N) + network & consistency (∝N). Too coarse is a pseudo-service, too fine a distributed monolith, the optimum in between — set by business coupling, not 'smaller is better'.")}>
      <line x1={base} y1={top + h0} x2={base + wid} y2={top + h0} stroke="var(--hairline-strong)" />
      <path d={pts.map((p, i) => `${i ? "L" : "M"}${px(p[0]).toFixed(1)},${py(p[1]).toFixed(1)}`).join(" ")} fill="none" stroke="var(--primary)" strokeWidth="2.2" />
      <line x1={px(nStar)} y1={top} x2={px(nStar)} y2={top + h0} stroke="var(--accent)" strokeDasharray="4 3" />
      <circle cx={px(nStar)} cy={py(cost(nStar))} r="4" fill="var(--accent)" />
      <FT x={px(nStar)} y={py(cost(nStar)) - 9} cls="tk">{L("最优", "optimum")}</FT>
      <FT x={px(1) + 6} y={top + 14} anchor="start" cls="tn">{L("单体", "monolith")}</FT>
      <FT x={px(20) - 6} y={top + 14} anchor="end" cls="tn">{L("分布式单体", "distributed monolith")}</FT>
      <FT x={base + wid / 2} y={top + h0 + 22} cls="tm">{L("服务数 N →", "services N →")}</FT>
    </FigFrame>
  );
};

/* ---------------- sc4 · heartbeat & eviction ---------------- */
FIGN["sc4-heartbeat"] = function ({ idx }) {
  const L = useL();
  const y = 70, x0 = 50, x1 = 630;
  const beats = [0, 1, 2, 3].map((i) => x0 + 60 + i * 60);
  const evict = x0 + 60 + 6 * 60;
  return (
    <FigFrame idx={idx} h={190} cap={L("实例定期发心跳续租;连续漏几拍(超时)后注册中心才摘除。摘得太快会误杀打了个盹的健康实例,太慢又会把流量继续打给死实例——没有完美解。", "An instance renews its lease with heartbeats; the registry evicts only after several are missed (the timeout). Evict too fast and you kill a healthy instance that just napped; too slow and traffic keeps hitting a dead one — no perfect answer.")}>
      <line x1={x0} y1={y} x2={x1} y2={y} stroke="var(--hairline-strong)" />
      {beats.map((bx, i) => (
        <g key={i}>
          <line x1={bx} y1={y} x2={bx} y2={y - 26} stroke="var(--primary)" strokeWidth="2" />
          <circle cx={bx} cy={y - 26} r="3.5" fill="var(--primary)" />
        </g>
      ))}
      <FT x={beats[1]} y={y - 34} cls="tn">{L("心跳", "heartbeat")}</FT>
      <rect x={beats[3] + 8} y={y - 12} width={evict - beats[3] - 8} height={24} fill="color-mix(in srgb, #d98a1f 20%, transparent)" stroke="#d98a1f" strokeDasharray="3 3" />
      <FT x={(beats[3] + evict) / 2} y={y - 18} cls="tn">{L("漏拍…超时窗口", "missed… timeout")}</FT>
      <line x1={evict} y1={y - 30} x2={evict} y2={y + 12} stroke="#c0453f" strokeWidth="2" />
      <FT x={evict + 6} y={y - 20} anchor="start" cls="tk">{L("摘除", "evict")}</FT>
      <FT x={evict + 6} y={y + 26} anchor="start" cls="tn">{L("Eureka 默认 ≈90s", "Eureka default ≈90s")}</FT>
    </FigFrame>
  );
};

/* ---------------- sc5 · self-preservation ---------------- */
FIGN["sc5-preserve"] = function ({ idx }) {
  const L = useL();
  const base = 50, top = 24, h0 = 140, wid = 560;
  const thr = 0.85;
  const py = (r) => top + h0 - r * h0;
  return (
    <FigFrame idx={idx} h={210} cap={L("当续租比例跌破 ~85%,Eureka 认为「更可能是网络分区,而非大批实例真死了」,于是触发自我保护、停止摘除、保住整张表——这是它 AP 立场(可用优先于一致)的具体形态。", "When the renewal ratio drops below ~85%, Eureka assumes 'a partition, not mass death', engages self-preservation, stops evicting and keeps the whole table — the concrete shape of its AP stance (availability over consistency).")}>
      <line x1={base} y1={top} x2={base} y2={top + h0} stroke="var(--hairline-strong)" />
      <line x1={base} y1={top + h0} x2={base + wid} y2={top + h0} stroke="var(--hairline-strong)" />
      <rect x={base} y={py(thr)} width={wid} height={top + h0 - py(thr)} fill="color-mix(in srgb, var(--accent) 12%, transparent)" />
      <line x1={base} y1={py(thr)} x2={base + wid} y2={py(thr)} stroke="var(--accent)" strokeWidth="1.6" strokeDasharray="5 3" />
      <FT x={base + wid} y={py(thr) - 6} anchor="end" cls="tk">{L("阈值 85%", "threshold 85%")}</FT>
      <FT x={base + wid / 2} y={py(thr) + 24} cls="tm">{L("↓ 低于此线:自我保护触发,停止摘除", "↓ below this line: self-preservation, stop evicting")}</FT>
      <FT x={base + 8} y={py(0.95)} anchor="start" cls="tn">{L("正常摘除区", "normal eviction zone")}</FT>
      <FT x={base - 8} y={py(0.85)} anchor="end" cls="tn">85%</FT>
      <FT x={base - 8} y={top + h0} anchor="end" cls="tn">0</FT>
      <FT x={base - 8} y={top + 6} anchor="end" cls="tn">100%</FT>
      <FT x={base + wid / 2} y={top + h0 + 22} cls="tm">{L("心跳续租比例", "heartbeat renewal ratio")}</FT>
    </FigFrame>
  );
};

/* ---------------- sc6 · CP vs AP under partition ---------------- */
FIGN["sc6-cap"] = function ({ idx }) {
  const L = useL();
  const panel = (x, title, tone, majTxt, minTxt) => (
    <g>
      <text x={x + 130} y={24} textAnchor="middle" style={{ font: "700 12px var(--f-mono)", fill: FTONE[tone] }}>{title}</text>
      <FBox x={x} y={40} w={120} h={54} label={L("多数派", "majority")} sub={majTxt} tone="ok" />
      <FBox x={x + 140} y={40} w={120} h={54} label={L("少数派", "minority")} sub={minTxt} tone={tone === "ok" ? "warn" : "a"} />
      <line x1={x + 128} y1={34} x2={x + 128} y2={100} stroke="#c0453f" strokeWidth="2" strokeDasharray="4 3" />
      <FT x={x + 128} y={110} cls="tn">{L("网络分区", "partition")}</FT>
    </g>
  );
  return (
    <FigFrame idx={idx} h={200} cap={L("分区之下:CP(Raft)只让多数派写、少数派拒写以保一致——适合配置;AP(Distro)两边都继续读写、但可能分裂——适合服务发现。CAP 是你替业务做的取舍。", "Under partition: CP (Raft) lets only the majority write and the minority reject to stay consistent — right for config; AP (Distro) keeps both sides serving but may diverge — right for discovery. CAP is a trade you make for the business.")}>
      {panel(40, L("CP · Raft", "CP · Raft"), "ok", L("可读写", "read+write"), L("拒绝写", "reject write"))}
      {panel(360, L("AP · Distro", "AP · Distro"), "a", L("读写", "read+write"), L("仍读写", "still serves"))}
    </FigFrame>
  );
};

/* ---------------- sc7 · retry storm ---------------- */
FIGN["sc7-retry"] = function ({ idx }) {
  const L = useL();
  return (
    <FigFrame idx={idx} h={196} cap={L("下游过载变慢 → 调用方超时重试 → 请求量被放大 2~3 倍 → 下游被自己的调用方彻底压垮。这就是重试风暴:一次抖动被放大成一次雪崩。安全的重试必须配退避、抖动和熔断。", "An overloaded downstream slows → callers time out and retry → the request rate is amplified 2–3× → the downstream is crushed by its own callers. The retry storm: a hiccup amplified into an avalanche. Safe retry needs backoff, jitter and a breaker.")}>
      <FBox x={40} y={70} w={110} h={48} label={L("调用方", "caller")} tone="p" />
      <FArrow x1={150} y1={84} x2={250} y2={78} c="var(--primary)" />
      <FArrow x1={150} y1={94} x2={250} y2={92} c="#d98a1f" dash />
      <FArrow x1={150} y1={104} x2={250} y2={106} c="#c0453f" dash />
      <FT x={200} y={64} cls="tn">{L("原始 + 重试×2", "original + 2 retries")}</FT>
      <FBox x={255} y={64} w={90} h={60} label="3×" sub={L("放大", "amplified")} tone="warn" />
      <FArrow x1={345} y1={94} x2={455} y2={94} c="#c0453f" wdt={2} />
      <FBox x={460} y={62} w={160} h={64} label={L("下游", "downstream")} sub={L("利用率 >100% 崩溃", ">100% util, collapse")} tone="bad" />
    </FigFrame>
  );
};

/* ---------------- sc8 · round-robin vs least-conn ---------------- */
FIGN["sc8-lb"] = function ({ idx }) {
  const L = useL();
  const row = (y, title, arrowsEqual) => (
    <g>
      <FT x={40} y={y + 4} anchor="start" cls="tk">{title}</FT>
      <FBox x={150} y={y - 18} w={70} h={36} label="LB" tone="p" />
      {[0, 1, 2].map((i) => {
        const slow = i === 2;
        const ty = y - 40 + i * 40;
        const w = arrowsEqual ? 2 : (slow ? 1 : 2.4);
        return <g key={i}>
          <FArrow x1={220} y1={y} x2={430} y2={ty + 14} c={slow && arrowsEqual ? "#c0453f" : "var(--muted)"} wdt={w} />
          <FBox x={434} y={ty} w={120} h={28} label={slow ? L("慢实例 🐢", "slow 🐢") : L("实例", "instance")} tone={slow && arrowsEqual ? "bad" : slow ? "warn" : "ok"} />
        </g>;
      })}
    </g>
  );
  return (
    <FigFrame idx={idx} h={266} cap={L("轮询给快慢不一的实例分配等量流量,那台慢实例先过载、把 P99 尾延迟拉爆;最少连接/响应时间加权按能力分流,尾延迟塌下来。客户端负载均衡的价值在于它知道每个实例多忙。", "Round-robin gives equal traffic to unequal instances — the slow one overloads and blows up the P99 tail; least-connections / response-time weighting routes by capacity and the tail collapses. Client-side LB knows how busy each instance is.")}>
      {row(58, L("轮询", "round-robin"), true)}
      <line x1={40} y1={132} x2={640} y2={132} stroke="var(--hairline)" strokeDasharray="3 3" />
      {row(196, L("最少连接", "least-conn"), false)}
    </FigFrame>
  );
};

/* ---------------- sc9 · circuit breaker state machine ---------------- */
FIGN["sc9-breaker"] = function ({ idx }) {
  const L = useL();
  const st = [["#2e9e6b", L("关闭", "CLOSED"), 130], ["#c0453f", L("打开", "OPEN"), 340], ["#d98a1f", L("半开", "HALF-OPEN"), 550]];
  const cy = 78, r = 44;
  return (
    <FigFrame idx={idx} h={196} cap={L("熔断器三态:关闭时放行并统计失败率;失败率超阈值→打开,快速失败、走降级,不再把线程堵在超时上;超时后→半开,放几个探针,成功则关闭、失败则重新打开。它把级联故障关在下游边界内。", "The breaker's three states: closed passes and counts failures; over the threshold → open, fail fast to the fallback instead of blocking threads on timeouts; after a wait → half-open, probe, closing on success or reopening on failure. It holds a cascade at the downstream boundary.")}>
      {st.map(([c, label, cx], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={r} fill={`color-mix(in srgb, ${c} 20%, transparent)`} stroke={c} strokeWidth="2.4" />
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" style={{ font: "700 12px var(--f-mono)", fill: c }}>{label}</text>
        </g>
      ))}
      <FArrow x1={178} y1={58} x2={292} y2={58} c="#c0453f" />
      <FT x={235} y={44} cls="tn">{L("失败率超阈值", "fail ≥ thresh")}</FT>
      <FArrow x1={388} y1={78} x2={502} y2={78} c="#d98a1f" />
      <FT x={445} y={66} cls="tn">{L("超时后探活", "after wait")}</FT>
      <path d="M540 118 Q335 176 145 120" fill="none" stroke="#2e9e6b" strokeWidth="1.4" strokeDasharray="4 3" />
      <FT x={340} y={150} cls="tn">{L("探针成功 → 关闭", "probe ok → close")}</FT>
    </FigFrame>
  );
};

window.__SC_FIG_1 = FIGN;
