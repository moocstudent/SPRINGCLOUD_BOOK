/* =========================================================
   viz.jsx — interactive benches ("治理台") + shared prelude
   ---------------------------------------------------------
   Dependency-free. Each chapter sets `viz: "<name>"` in
   data.jsx; the chapter page renders <Viz name={...} />.
   Every bench computes its numbers live — real availability
   products, real queueing, real bin-packing. No canned art.
   This file: the shared helpers + Module I–II (sc1–sc6),
   exported as window.__SC_VIZ_1. Module III–IV live in
   viz2.jsx, V–VI in viz3.jsx, VII–VIII + the registry +
   <Viz> in viz4.jsx; index.html loads them in that order.
   ========================================================= */

/* ---------------- shared math helpers ---------------- */
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const nf = (n, d = 2) => {
  if (!isFinite(n)) return "∞";
  const r = Math.abs(n) >= 1000 ? Math.round(n) : Math.round(n * 10 ** d) / 10 ** d;
  return r.toLocaleString("en-US", { maximumFractionDigits: d });
};
const pct = (x) => `${Math.round(x * 100)}%`;
const pct1 = (x) => `${nf(x * 100, 1)}%`;
const pct2 = (x) => `${nf(x * 100, 2)}%`;
const pct3 = (x) => `${nf(x * 100, 3)}%`;
const big = (n) => {
  if (Math.abs(n) >= 1e9) return `${nf(n / 1e9, 2)}G`;
  if (Math.abs(n) >= 1e6) return `${nf(n / 1e6, 2)}M`;
  if (Math.abs(n) >= 1e3) return `${nf(n / 1e3, 1)}K`;
  return nf(n, 0);
};
// number of "nines": 0.999 -> 3
const nines = (a) => (a >= 1 ? 9 : Math.max(0, -Math.log10(1 - a)));
// minutes of downtime per year for an availability fraction
const downMin = (a) => Math.max(0, (1 - a) * 525600);
// Deterministic PRNG so every run is reproducible across renders.
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}
function gauss(r) {
  const u = Math.max(1e-9, r()), v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* ---------------- shared controls ---------------- */
function Slider({ label, min, max, step, value, onChange, unit, fmt }) {
  return (
    <label>
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step || 1} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))} />
      <span className="val">{fmt ? fmt(value) : value}{unit || ""}</span>
    </label>
  );
}
function Choice({ label, value, onChange, options }) {
  return (
    <label>
      <span>{label}</span>
      <select className="sc-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => {
          const v = typeof o === "object" ? o.v : o;
          const l = typeof o === "object" ? o.l : o;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    </label>
  );
}
function Seg({ value, onChange, options }) {
  return (
    <div className="sc-seg">
      {options.map((o) => (
        <button key={o.v} className={value === o.v ? "on" : ""} onClick={() => onChange(o.v)}>{o.l}</button>
      ))}
    </div>
  );
}
function Toggle({ label, value, onChange }) {
  return (
    <label style={{ cursor: "pointer" }} onClick={() => onChange(!value)}>
      <span>{label}</span>
      <span className={`sc-pill click ${value ? "on" : ""}`} style={{ justifySelf: "start" }}>{value ? "ON" : "OFF"}</span>
    </label>
  );
}
function Kpi({ label, value, unit, hint, tone, sel, onClick }) {
  return (
    <div className={`sc-kpi ${tone || ""} ${sel ? "sel" : ""}`} onClick={onClick}>
      <div className="k-label">{label}</div>
      <div className="k-val">{value}{unit ? <span className="k-unit">{unit}</span> : null}</div>
      {hint ? <div className="k-hint">{hint}</div> : null}
    </div>
  );
}
function Bar({ label, value, max, tone, valText }) {
  const w = clamp((value / (max || 1)) * 100, 0, 100);
  return (
    <div className="sc-bar-row">
      <span>{label}</span>
      <div className="b-track"><div className={`b-fill ${tone || ""}`} style={{ width: `${w}%` }} /></div>
      <span className="b-val">{valText !== undefined ? valText : nf(value, 1)}</span>
    </div>
  );
}
function VizHead({ idx, title }) {
  return <div className="viz-title"><span className="viz-title-idx">{idx}</span><span>{title}</span></div>;
}
function Note({ mark, children, tone }) {
  return <div className={`sc-step ${tone || ""}`}><span className="sn">{mark}</span><div>{children}</div></div>;
}
function Label({ children }) { return <span className="sc-label">{children}</span>; }

// site language → inline bilingual label helper
function useL() {
  const lang = useLang();
  return (zh, en) => (lang === "zh" ? zh : en);
}

/* ---------------- shared viz primitives ---------------- */
// A tiny SVG line plot: data = [{x,y}], marks an index, optional target line.
function MiniPlot({ data, w = 300, h = 110, stroke = "var(--primary)", markIndex, yMax, yMin, pad = 8, fmtY }) {
  if (!data || !data.length) return null;
  const xs = data.map((d) => d.x), ys = data.map((d) => d.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const lo = yMin !== undefined ? yMin : Math.min(...ys, 0);
  const hi = yMax !== undefined ? yMax : Math.max(...ys) * 1.08 || 1;
  const px = (x) => pad + ((x - x0) / (x1 - x0 || 1)) * (w - 2 * pad);
  const py = (y) => h - pad - ((y - lo) / (hi - lo || 1)) * (h - 2 * pad);
  const path = data.map((d, i) => `${i ? "L" : "M"}${px(d.x).toFixed(1)},${py(d.y).toFixed(1)}`).join(" ");
  const mk = markIndex != null ? data[clamp(markIndex, 0, data.length - 1)] : null;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: "block" }}>
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="var(--hairline-strong)" strokeWidth="1" />
      <path d={path} fill="none" stroke={stroke} strokeWidth="2" />
      {mk && <line x1={px(mk.x)} y1={pad} x2={px(mk.x)} y2={h - pad} stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="3 3" />}
      {mk && <circle cx={px(mk.x)} cy={py(mk.y)} r="3.5" fill="var(--accent)" />}
    </svg>
  );
}

// A row of small server/instance boxes with a live/dead/degraded state.
function Boxes({ items, onClick }) {
  const C = { live: "var(--primary)", ok: "#2e9e6b", dead: "#c0453f", warn: "#d98a1f", idle: "var(--muted)" };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
      {items.map((it, i) => (
        <div key={i} onClick={onClick ? () => onClick(i) : undefined}
          title={it.title || ""}
          style={{
            minWidth: 30, padding: "5px 7px", textAlign: "center", cursor: onClick ? "pointer" : "default",
            font: "600 11px var(--f-mono)", borderRadius: 4, color: "#fff",
            background: `color-mix(in srgb, ${C[it.state] || C.idle} 82%, transparent)`,
            border: `1px solid color-mix(in srgb, ${C[it.state] || C.idle} 60%, var(--bg))`,
          }}>{it.label}</div>
      ))}
    </div>
  );
}

/* =========================================================
   sc1 · taxLab — the distributed availability tax
   ========================================================= */
function TaxViz() {
  const L = useL();
  const [n, setN] = React.useState(10);
  const [p, setP] = React.useState(0.999);
  const [retry, setRetry] = React.useState(false);
  const [breaker, setBreaker] = React.useState(false);

  const raw = Math.pow(p, n);                       // chain of n independent services
  const pEff = retry ? 1 - Math.pow(1 - p, 2) : p;  // one retry on transient, independent failure
  const chain = Math.pow(pEff, n);
  const fallbackCov = 0.6;                           // breaker+fallback gracefully handles 60% of failures
  const resilient = breaker ? 1 - (1 - chain) * (1 - fallbackCov) : chain;

  const plot = [];
  for (let k = 1; k <= 15; k++) plot.push({ x: k, y: Math.pow(p, k) });

  return (
    <div>
      <VizHead idx="FD1" title={L("分布式税:把一个单体拆成一条调用链,可用率怎么掉", "The distributed tax: split a monolith into a chain and watch availability fall")} />
      <div className="viz-ctrl">
        <Slider label={L("链上服务数 N", "Services in chain N")} min={1} max={15} value={n} onChange={setN} />
        <Slider label={L("单服务可用率", "Per-service availability")} min={0.99} max={0.9999} step={0.0001} value={p} onChange={setP} fmt={(v) => pct2(v)} />
        <Toggle label={L("加一次重试", "Add one retry")} value={retry} onChange={setRetry} />
        <Toggle label={L("加熔断 + 降级", "Add breaker + fallback")} value={breaker} onChange={setBreaker} />
      </div>

      <div className="sc-kpi-grid">
        <Kpi label={L("单体可用率", "Monolith availability")} value={pct2(p)} tone="ok" hint={L("一个进程,一个故障域", "one process, one fault domain")} />
        <Kpi label={L("裸调用链", "Bare chain")} value={pct2(raw)} tone="warn" hint={L(`${n} 个服务串起来`, `${n} services in series`)} />
        <Kpi label={L("加韧性后", "With resilience")} value={pct2(resilient)} tone={resilient >= p ? "ok" : "acc"} hint={retry || breaker ? L("重试/熔断补回来", "clawed back by retry/breaker") : L("还没加韧性", "no resilience yet")} />
        <Kpi label={L("每年宕机", "Downtime / year")} value={big(downMin(resilient))} unit={L(" 分钟", " min")} tone={downMin(resilient) > downMin(p) ? "warn" : "ok"} />
      </div>

      <div style={{ marginTop: 10 }}>
        <Bar label={L("单体", "Monolith")} value={p} max={1} tone="ok" valText={pct2(p)} />
        <Bar label={L("裸调用链", "Bare chain")} value={raw} max={1} tone="warn" valText={pct2(raw)} />
        <Bar label={L("加韧性", "With resilience")} value={resilient} max={1} tone="acc" valText={pct2(resilient)} />
      </div>

      <div style={{ marginTop: 10 }}>
        <div className="sc-cap">{L("可用率 = 单服务可用率 的 N 次方(虚线为当前 N)", "availability = per-service^N (dashed line = current N)")}</div>
        <MiniPlot data={plot} markIndex={n - 1} yMin={Math.min(0.85, Math.pow(p, 15))} yMax={1} />
      </div>

      <Note mark="→" tone={raw < p - 0.005 ? "bad" : "on"}>
        {raw < p - 0.005
          ? L(`你什么坏事都没做,可用率却从 ${pct2(p)} 掉到了 ${pct2(raw)}——这就是分布式税。要拿回来,后面二十章的韧性手段一个都不能少。`,
              `You did nothing wrong, yet availability fell from ${pct2(p)} to ${pct2(raw)} — the distributed tax. To win it back, none of the next twenty chapters' resilience is optional.`)
          : L("服务少、可用率高时,税还不明显;把 N 拉大或把单服务可用率调低,曲线立刻掉下去。", "With few, highly-available services the tax is mild; raise N or lower per-service availability and the curve drops at once.")}
      </Note>
    </div>
  );
}

/* =========================================================
   sc2 · stackLab — version alignment + component picker
   ========================================================= */
const BOOTS = [
  { v: "2.7.x", cloud: "2021.0.x", alibaba: "2021.0.6.x", note: { zh: "Spring Boot 2 末代,JDK 8/11", en: "last Boot 2, JDK 8/11" } },
  { v: "3.0.x", cloud: "2022.0.x", alibaba: "2022.0.0.0", note: { zh: "Boot 3 起步,需 JDK 17", en: "Boot 3 begins, JDK 17" } },
  { v: "3.1.x", cloud: "2022.0.x", alibaba: "2022.0.0.x", note: { zh: "同属 Kilburn 线", en: "same Kilburn line" } },
  { v: "3.2.x", cloud: "2023.0.x", alibaba: "2023.0.1.x", note: { zh: "Leyton,当前主流", en: "Leyton, today's mainstream" } },
  { v: "3.3.x", cloud: "2023.0.x / 2024.0.x", alibaba: "2023.0.3.x", note: { zh: "过渡期,两条 Cloud 线都可", en: "transition, either Cloud line" } },
  { v: "3.4.x", cloud: "2024.0.x", alibaba: "2023.0.3.x", note: { zh: "Moorgate,最新", en: "Moorgate, newest" } },
];
const SLOTS = [
  { key: "discovery", zh: "服务发现", en: "Discovery", opts: [
    { v: "Eureka", status: "legacy", note: { zh: "Netflix,维护模式,老项目仍在用", en: "Netflix, maintenance, still in legacy apps" } },
    { v: "Nacos", status: "popular", note: { zh: "Alibaba,注册+配置二合一,中文社区默认", en: "Alibaba, registry+config, China default" } },
    { v: "Consul", status: "ok", note: { zh: "HashiCorp,多语言、带 KV", en: "HashiCorp, polyglot, has KV" } },
  ] },
  { key: "lb", zh: "负载均衡", en: "Load balancing", opts: [
    { v: "Ribbon", status: "dead", note: { zh: "已退役,别再用", en: "retired, do not use" } },
    { v: "Spring Cloud LoadBalancer", status: "default", note: { zh: "官方默认,取代 Ribbon", en: "official default, replaces Ribbon" } },
  ] },
  { key: "breaker", zh: "熔断限流", en: "Resilience", opts: [
    { v: "Hystrix", status: "dead", note: { zh: "已退役", en: "retired" } },
    { v: "Resilience4j", status: "default", note: { zh: "官方推荐,轻量、函数式", en: "official pick, lightweight" } },
    { v: "Sentinel", status: "popular", note: { zh: "Alibaba,带控制台,流控强", en: "Alibaba, dashboard, strong flow-control" } },
  ] },
  { key: "gateway", zh: "网关", en: "Gateway", opts: [
    { v: "Zuul", status: "dead", note: { zh: "已退役", en: "retired" } },
    { v: "Spring Cloud Gateway", status: "default", note: { zh: "官方默认,响应式高吞吐", en: "official default, reactive" } },
  ] },
  { key: "config", zh: "配置中心", en: "Config", opts: [
    { v: "Spring Cloud Config", status: "ok", note: { zh: "官方,Git 后端", en: "official, Git backend" } },
    { v: "Nacos Config", status: "popular", note: { zh: "与 Nacos 发现共用一套", en: "shares Nacos with discovery" } },
  ] },
];
const STATUS_TONE = { dead: "warn", legacy: "", ok: "", default: "ok", popular: "acc" };
const STATUS_WORD = { dead: { zh: "已退役", en: "dead" }, legacy: { zh: "维护", en: "legacy" }, ok: { zh: "可选", en: "ok" }, default: { zh: "默认", en: "default" }, popular: { zh: "流行", en: "popular" } };

function StackViz() {
  const L = useL();
  const lang = useLang();
  const [bi, setBi] = React.useState(3); // Boot 3.2 mainstream
  const [sel, setSel] = React.useState({ discovery: "Nacos", lb: "Spring Cloud LoadBalancer", breaker: "Resilience4j", gateway: "Spring Cloud Gateway", config: "Nacos Config" });
  const boot = BOOTS[bi];
  const deadPicks = SLOTS.filter((s) => {
    const o = s.opts.find((o) => o.v === sel[s.key]);
    return o && o.status === "dead";
  });

  return (
    <div>
      <VizHead idx="FD2" title={L("版本对齐 + 组件选型:选定 Boot,看什么能一起跑", "Version alignment + picker: fix Boot, see what runs together")} />
      <div className="viz-ctrl">
        <Slider label={L("Spring Boot 版本", "Spring Boot version")} min={0} max={BOOTS.length - 1} value={bi} onChange={(v) => setBi(Math.round(v))} fmt={(v) => BOOTS[Math.round(v)].v} />
      </div>

      <div className="sc-kpi-grid">
        <Kpi label="Spring Boot" value={boot.v} tone="acc" />
        <Kpi label="Spring Cloud" value={boot.cloud} tone="ok" hint={pick(lang, boot.note)} />
        <Kpi label="Cloud Alibaba" value={boot.alibaba} tone="ok" />
        <Kpi label={L("能启动?", "Will start?")} value={deadPicks.length ? L("有退役组件", "dead component") : L("对齐 ✓", "aligned ✓")} tone={deadPicks.length ? "warn" : "ok"} />
      </div>

      <div style={{ marginTop: 8 }} className="sc-cap">{L("为每个功能位选一个组件:", "Pick a component for each slot:")}</div>
      <div style={{ display: "grid", gap: 6, marginTop: 4 }}>
        {SLOTS.map((s) => {
          const cur = s.opts.find((o) => o.v === sel[s.key]);
          return (
            <div key={s.key} style={{ display: "grid", gridTemplateColumns: "88px 1fr", gap: 8, alignItems: "start" }}>
              <div style={{ font: "600 12px var(--f-sans)", color: "var(--muted)", paddingTop: 5 }}>{lang === "zh" ? s.zh : s.en}</div>
              <div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {s.opts.map((o) => (
                    <button key={o.v} onClick={() => setSel({ ...sel, [s.key]: o.v })}
                      className={`sc-pill mini click ${sel[s.key] === o.v ? "on" : ""}`}
                      style={{ borderColor: o.status === "dead" ? "#c0453f" : undefined }}>
                      {o.v} · {pick(lang, STATUS_WORD[o.status])}
                    </button>
                  ))}
                </div>
                {cur && <div className="sc-cap" style={{ marginTop: 2 }}>{pick(lang, cur.note)}</div>}
              </div>
            </div>
          );
        })}
      </div>

      <Note mark="!" tone={deadPicks.length ? "bad" : "on"}>
        {deadPicks.length
          ? L(`你选了已退役的组件:${deadPicks.map((s) => sel[s.key]).join("、")}。它们在 Spring Boot 3 上要么不兼容、要么早已停更——换成默认或流行的那一个。`,
              `You picked retired components: ${deadPicks.map((s) => sel[s.key]).join(", ")}. On Spring Boot 3 they are incompatible or long unmaintained — switch to the default or popular one.`)
          : L("三条主线(Boot / Cloud / Alibaba)版本对齐,组件也都在维护中——这套能启动。版本对不齐是新手第一天最常见的启动失败原因。", "The three lines (Boot / Cloud / Alibaba) align and every component is maintained — this will start. A version mismatch is the most common day-one startup failure.")}
      </Note>
    </div>
  );
}

/* =========================================================
   sc3 · splitLab — decomposition granularity U-curve
   ========================================================= */
function SplitViz() {
  const L = useL();
  const [n, setN] = React.useState(3);
  const F = 24;                 // fixed domain size (features / capabilities)
  const a = 1.0;               // per-boundary network + consistency cost weight
  const b = 40;                // monolith coordination / deploy-contention weight
  // total cost across granularity
  const cost = (k) => b / k + a * (k - 1) * 2.2;
  const nStar = Math.max(1, Math.round(Math.sqrt(b / (a * 2.2))));
  const crossCalls = (k) => Math.round(F * (1 - 1 / k));            // interactions crossing a boundary
  const touched = (k) => Math.min(k, Math.max(1, Math.round(0.28 * k) + 1)); // services touched per change
  const deployIndep = (k) => 1 - 1 / k;                             // independent-deploy benefit

  const plot = [];
  for (let k = 1; k <= 20; k++) plot.push({ x: k, y: cost(k) });
  const tooFine = n > nStar + 3;
  const tooCoarse = n < Math.max(2, nStar - 3);

  return (
    <div>
      <VizHead idx="FD3" title={L("拆分粒度:太粗是伪微服务,太细是分布式单体", "Granularity: too coarse is a pseudo-service, too fine is a distributed monolith")} />
      <div className="viz-ctrl">
        <Slider label={L("拆成几个服务", "Split into N services")} min={1} max={20} value={n} onChange={setN} />
      </div>

      <div className="sc-kpi-grid">
        <Kpi label={L("跨服务调用/次业务", "Cross-service calls / op")} value={crossCalls(n)} tone={crossCalls(n) > 16 ? "warn" : ""} hint={L("越细,一次操作越啰嗦", "finer = chattier")} />
        <Kpi label={L("一次改动波及", "Services touched / change")} value={touched(n)} unit={L(" 个", "")} tone={touched(n) > 4 ? "warn" : "ok"} />
        <Kpi label={L("独立部署收益", "Deploy independence")} value={pct(deployIndep(n))} tone="acc" />
        <Kpi label={L("总成本", "Total cost")} value={nf(cost(n), 0)} tone={n === nStar ? "ok" : (tooFine || tooCoarse ? "warn" : "")} hint={n === nStar ? L("接近最优", "near optimum") : ""} />
      </div>

      <div style={{ marginTop: 10 }}>
        <div className="sc-cap">{L(`总成本 = 协调成本(∝1/N)+ 网络与一致性成本(∝N);最优约在 N≈${nStar}`, `total = coordination (∝1/N) + network & consistency (∝N); optimum near N≈${nStar}`)}</div>
        <MiniPlot data={plot} markIndex={n - 1} yMin={0} />
      </div>

      <Note mark="→" tone={tooFine || tooCoarse ? "bad" : "on"}>
        {tooCoarse
          ? L("拆得太粗:你得到的还是一个单体,只是每次内部交互都多绕了一段网络。合并回去,或者再切细一点。", "Too coarse: still a monolith, just with a network hop on every internal interaction. Merge back, or cut a little finer.")
          : tooFine
          ? L("拆得太细:每次下单要发一大堆远程调用,还拖着一个跨多个服务的分布式事务——这就是分布式单体,微服务最贵的失败方式。", "Too fine: one checkout fires a pile of remote calls dragging a distributed transaction across many services — the distributed monolith, the most expensive way to fail at microservices.")
          : L(`N≈${nStar} 附近成本最低。注意:最优点由业务耦合决定,不由「越小越好」这句口号决定。`, `Cost is lowest near N≈${nStar}. The optimum is set by business coupling, not by the slogan 'smaller is better'.`)}
      </Note>
    </div>
  );
}

/* =========================================================
   sc4 · registryLab — heartbeat detection vs false eviction
   ========================================================= */
function RegistryViz() {
  const L = useL();
  const [interval, setInterval_] = React.useState(30);   // Eureka default 30s
  const [mult, setMult] = React.useState(3);             // eviction after mult missed
  const [loss, setLoss] = React.useState(0.05);          // network loss / jitter
  const [rps, setRps] = React.useState(200);             // traffic to the service

  const detect = mult * interval + interval / 2;         // worst-case detection latency (s)
  const falseEvict = Math.pow(loss, mult);               // miss `mult` heartbeats in a row by loss
  // requests sent to a dead instance before it is evicted (1 of, say, 4 instances)
  const deadWindow = Math.round(detect * rps * 0.25);

  return (
    <div>
      <VizHead idx="RD1" title={L("摘除时延 vs 误摘除:注册中心永恒的两难", "Eviction latency vs false eviction: the registry's eternal dilemma")} />
      <div className="viz-ctrl">
        <Slider label={L("心跳间隔", "Heartbeat interval")} min={1} max={30} value={interval} onChange={setInterval_} unit="s" />
        <Slider label={L("超时倍数(漏几次摘除)", "Timeout multiple (misses to evict)")} min={2} max={6} value={mult} onChange={setMult} unit="×" />
        <Slider label={L("网络丢包/抖动", "Network loss / jitter")} min={0} max={0.3} step={0.01} value={loss} onChange={setLoss} fmt={pct} />
        <Slider label={L("该服务流量", "Traffic to service")} min={20} max={1000} step={20} value={rps} onChange={setRps} unit=" rps" />
      </div>

      <div className="sc-kpi-grid">
        <Kpi label={L("故障检测时延", "Detection latency")} value={nf(detect, 0)} unit="s" tone={detect > 60 ? "warn" : "ok"} hint={detect > 60 ? L("死实例长期在册", "dead stays listed") : ""} />
        <Kpi label={L("误摘除率", "False-eviction rate")} value={pct3(falseEvict)} tone={falseEvict > 0.01 ? "warn" : "ok"} hint={falseEvict > 0.01 ? L("健康实例被误杀", "healthy killed") : ""} />
        <Kpi label={L("打到死实例的请求", "Requests to dead node")} value={big(deadWindow)} tone={deadWindow > 3000 ? "warn" : ""} hint={L("检测出来之前", "before detection")} />
        <Kpi label={L("Eureka 默认", "Eureka default")} value={interval === 30 && mult === 3 ? L("正是此处", "you are here") : "30s ×3"} tone="acc" hint={L("≈90s 才摘除", "≈90s to evict")} />
      </div>

      <div style={{ marginTop: 10 }}>
        <Bar label={L("检测快(想小)", "Fast detect (want low)")} value={detect} max={210} tone={detect > 60 ? "warn" : "ok"} valText={`${nf(detect, 0)}s`} />
        <Bar label={L("误摘除少(想小)", "Few false-evicts (want low)")} value={falseEvict} max={0.3} tone={falseEvict > 0.01 ? "warn" : "ok"} valText={pct3(falseEvict)} />
      </div>

      <Note mark="↔">
        {L("把超时调小:检测变快,但丢包/GC 更容易凑够连续漏拍,误摘除率跟着涨。把超时调大:误摘除几乎没了,但死实例会在册上多留很久,这段时间流量照样往它打。没有完美解——Eureka 默认的 ≈90 秒摘除,就是它在这条轴上选的位置。",
            "Shrink the timeout: detection speeds up, but loss/GC more easily strings together enough missed beats and false eviction rises. Grow it: false eviction nearly vanishes, but a dead instance lingers on the list and keeps taking traffic. No perfect answer — Eureka's default ≈90 s eviction is simply where it chose to sit on this axis.")}
      </Note>
    </div>
  );
}

/* =========================================================
   sc5 · eurekaLab — self-preservation under partition
   ========================================================= */
function EurekaViz() {
  const L = useL();
  const [total, setTotal] = React.useState(20);
  const [silent, setSilent] = React.useState(0.5);   // fraction whose heartbeats vanish
  const [preserve, setPreserve] = React.useState(true);
  const [reallyDead, setReallyDead] = React.useState(false); // are the silent ones actually dead, or just partitioned?

  const threshold = 0.85;                 // renewal ratio that triggers self-preservation
  const renewRatio = 1 - silent;
  const tripped = preserve && renewRatio < threshold;   // self-preservation engaged
  const nSilent = Math.round(total * silent);
  // if preservation holds the table, silent instances stay registered
  const evicted = tripped ? 0 : nSilent;
  // truth: if reallyDead, silent instances are gone; else they are alive but unreachable-to-server
  const retainedHealthy = reallyDead ? 0 : nSilent; // healthy-but-silent that we WANT to keep
  const goodPreserved = tripped ? retainedHealthy : 0;      // healthy kept only if preserved
  const badKept = tripped && reallyDead ? nSilent : 0;      // dead kept (calls will fail, breaker handles)
  const wronglyEvicted = !tripped && !reallyDead ? nSilent : 0; // healthy evicted = the storm

  const items = [];
  for (let i = 0; i < total; i++) {
    const isSilent = i < nSilent;
    let state = "live";
    if (isSilent) {
      if (evicted && i < evicted) state = reallyDead ? "dead" : "dead"; // removed from registry
      else state = reallyDead ? "warn" : "ok"; // kept: dead(warn=stale) or healthy(ok)
    }
    items.push({ label: isSilent ? (evicted ? "✕" : (reallyDead ? "?" : "✓")) : "●", state });
  }

  return (
    <div>
      <VizHead idx="RD2" title={L("自我保护:一次网络分区里,它到底在保护谁", "Self-preservation: in a partition, whom does it protect")} />
      <div className="viz-ctrl">
        <Slider label={L("实例总数", "Total instances")} min={6} max={40} value={total} onChange={setTotal} />
        <Slider label={L("心跳消失的比例", "Fraction gone silent")} min={0} max={0.9} step={0.05} value={silent} onChange={setSilent} fmt={pct} />
        <Toggle label={L("开启自我保护", "Self-preservation")} value={preserve} onChange={setPreserve} />
        <Toggle label={L("这些实例是真的死了(否则=网络分区)", "Silent ones truly dead (else = partition)")} value={reallyDead} onChange={setReallyDead} />
      </div>

      <div className="sc-kpi-grid">
        <Kpi label={L("续租比例", "Renewal ratio")} value={pct(renewRatio)} tone={renewRatio < threshold ? "warn" : "ok"} hint={L("阈值 85%", "threshold 85%")} />
        <Kpi label={L("自我保护", "Self-preservation")} value={tripped ? L("已触发", "ENGAGED") : L("未触发", "off")} tone={tripped ? "acc" : ""} />
        <Kpi label={L("被摘除实例", "Instances evicted")} value={evicted} tone={wronglyEvicted ? "warn" : ""} hint={wronglyEvicted ? L("全是健康的!", "all healthy!") : ""} />
        <Kpi label={L("结局", "Outcome")}
          value={wronglyEvicted ? L("摘除风暴", "eviction storm") : (badKept ? L("留了死实例", "stale kept") : L("健康被保住", "healthy kept"))}
          tone={wronglyEvicted ? "warn" : (badKept ? "" : "ok")} />
      </div>

      <div style={{ marginTop: 8 }}>
        <div className="sc-cap">{L("● 在册健康 · ✓ 保住的(健康但静默) · ? 保住的(实际已死) · ✕ 被摘除", "● healthy · ✓ kept (healthy but silent) · ? kept (actually dead) · ✕ evicted")}</div>
        <Boxes items={items} />
      </div>

      <Note mark="→" tone={wronglyEvicted ? "bad" : "on"}>
        {wronglyEvicted
          ? L("灾难:一次网络分区让一半实例对服务端「静默」,而你关掉了自我保护——注册中心把它们全摘了,可它们明明活着。这就是自我保护要防的「摘除风暴」:网络断了,不该把整张表清空。",
              "Disaster: a partition made half the instances 'silent' to the server, and with self-preservation off the registry evicted them all — though they are alive. This is the eviction storm self-preservation exists to prevent: a broken network should not wipe the table.")
          : tripped && reallyDead
          ? L("自我保护也有代价:这些实例是真死了,但它保守地把它们留在册上,于是有些调用会打到死实例——不过这正是上一模块的熔断该兜住的。Eureka 选择「宁可留错,不可错杀」。",
              "Self-preservation has a cost too: these instances really are dead, yet it conservatively keeps them listed, so some calls hit dead nodes — which is exactly what the previous module's breaker should catch. Eureka chooses 'keep by mistake over kill by mistake'.")
          : L("自我保护把健康但暂时联系不上的实例保住了,系统平稳穿过分区。这是 Eureka 的 AP 立场:可用优先于一致。", "Self-preservation kept the healthy-but-unreachable instances and the system rode through the partition. This is Eureka's AP stance: availability before consistency.")}
      </Note>
    </div>
  );
}

/* =========================================================
   sc6 · nacosLab — CP vs AP under partition
   ========================================================= */
function NacosViz() {
  const L = useL();
  const [nodes, setNodes] = React.useState(5);
  const [minority, setMinority] = React.useState(2);
  const [mode, setMode] = React.useState("AP");
  const maj = nodes - minority;
  const hasQuorum = maj > nodes / 2;

  // AP (Distro): both sides read AND write; consistency can diverge.
  // CP (Raft):   only the quorum side writes; minority rejects writes (stays consistent).
  const ap = { readAvail: 1, writeAvail: 1, consistent: false };
  const cp = { readAvail: 1, writeAvail: hasQuorum ? 1 : 0, consistent: true, minorityWrite: false };
  const cur = mode === "AP" ? ap : cp;
  const minorityWrite = mode === "AP" ? true : false;

  return (
    <div>
      <VizHead idx="RD3" title={L("Nacos:分区之下,亲手在 CP 与 AP 之间切一次", "Nacos: under partition, switch between CP and AP by hand")} />
      <div className="viz-ctrl">
        <Slider label={L("集群节点数", "Cluster nodes")} min={3} max={7} step={2} value={nodes} onChange={(v) => { const nn = Math.round(v); setNodes(nn); setMinority(Math.min(minority, nn - 1)); }} />
        <Slider label={L("少数派节点数", "Minority nodes")} min={1} max={nodes - 1} value={minority} onChange={(v) => setMinority(Math.round(v))} />
        <label><span>{L("一致性模式", "Consistency mode")}</span><Seg value={mode} onChange={setMode} options={[{ v: "AP", l: "AP · Distro" }, { v: "CP", l: "CP · Raft" }]} /></label>
      </div>

      <div className="sc-kpi-grid">
        <Kpi label={L("多数派 / 少数派", "Majority / minority")} value={`${maj} / ${minority}`} tone="acc" hint={hasQuorum ? L("多数派有法定人数", "majority has quorum") : L("无法定人数", "no quorum")} />
        <Kpi label={L("读可用", "Read available")} value={pct(cur.readAvail)} tone="ok" />
        <Kpi label={L("少数派可写?", "Minority writable?")} value={minorityWrite ? L("能写", "yes") : L("拒绝", "no")} tone={minorityWrite ? "warn" : "ok"} hint={minorityWrite ? L("可能分裂", "may diverge") : L("拒绝以保一致", "reject to stay consistent")} />
        <Kpi label={L("一致性", "Consistency")} value={cur.consistent ? L("保证", "guaranteed") : L("可能不一致", "may diverge")} tone={cur.consistent ? "ok" : "warn"} />
      </div>

      <div style={{ marginTop: 8 }}>
        <div className="sc-cap">{L("多数派", "Majority")}</div>
        <Boxes items={Array.from({ length: maj }, () => ({ label: "N", state: "ok" }))} />
        <div className="sc-cap" style={{ marginTop: 6 }}>{L("少数派(被分区隔开)", "Minority (cut off by the partition)")}</div>
        <Boxes items={Array.from({ length: minority }, () => ({ label: "N", state: minorityWrite ? "warn" : "dead" }))} />
      </div>

      <Note mark="→" tone={mode === "AP" ? "" : "on"}>
        {mode === "AP"
          ? L("AP(Distro):两边都继续读写,谁都不停——代价是分区愈合后两边可能已经改了同一条数据、需要合并。适合服务发现:读到一个稍旧的实例列表不致命。",
              "AP (Distro): both sides keep reading and writing, nobody stops — at the cost that after the partition heals both may have changed the same data and need merging. Right for discovery: a slightly stale instance list is not fatal.")
          : L("CP(Raft):只有多数派能写,少数派拒绝写入以避免分裂——牺牲了少数派的写可用性,换来「所有人读到同一份」。适合配置:一半实例读到新开关、一半读到旧开关才是灾难。",
              "CP (Raft): only the majority writes, the minority rejects writes to avoid split-brain — sacrificing minority write availability for 'everyone reads the same'. Right for config: half the instances on the new switch and half on the old is the disaster.")}
      </Note>
    </div>
  );
}

/* ---------------- export Module I–II benches ---------------- */
window.__SC_VIZ_1 = {
  taxLab: TaxViz,
  stackLab: StackViz,
  splitLab: SplitViz,
  registryLab: RegistryViz,
  eurekaLab: EurekaViz,
  nacosLab: NacosViz,
};
