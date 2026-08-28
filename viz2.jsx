/* =========================================================
   viz2.jsx — benches for Module III–IV (sc7–sc12)
   ---------------------------------------------------------
   Uses the shared helpers declared in viz.jsx (same global
   lexical scope — do NOT redeclare them here).
   Exported as window.__SC_VIZ_2.
   ========================================================= */

/* =========================================================
   sc7 · feignLab — the retry storm
   ========================================================= */
function FeignViz() {
  const L = useL();
  const [incoming, setIncoming] = React.useState(900);   // rps arriving at the caller
  const [capacity, setCapacity] = React.useState(1000);  // rps the downstream can serve
  const [retries, setRetries] = React.useState(2);
  const [safe, setSafe] = React.useState(false);         // backoff + jitter + breaker

  // naive retry: every attempt that fails is retried `retries` times.
  // amplification collapses the downstream once offered load passes capacity.
  let offered = incoming;
  if (!safe) offered = incoming * (1 + retries);          // worst case: retry everything
  else offered = incoming * (1 + retries * 0.15);         // breaker+backoff cap the storm
  const util = offered / capacity;
  const failRate = util <= 1 ? 0.01 : clamp((util - 1) / util, 0, 0.98);
  const p99 = util < 1 ? 40 / (1 - util) : (safe ? 800 : 8000); // queueing blow-up
  const collapsed = util > 1 && !safe;

  return (
    <div>
      <VizHead idx="CM1" title={L("重试风暴:好心的重试怎么把下游压垮", "The retry storm: how well-meaning retries crush a downstream")} />
      <div className="viz-ctrl">
        <Slider label={L("进入流量", "Incoming load")} min={100} max={2000} step={50} value={incoming} onChange={setIncoming} unit=" rps" />
        <Slider label={L("下游容量", "Downstream capacity")} min={200} max={2000} step={50} value={capacity} onChange={setCapacity} unit=" rps" />
        <Slider label={L("重试次数", "Retries")} min={0} max={3} value={retries} onChange={setRetries} unit="×" />
        <Toggle label={L("安全重试:退避+抖动+熔断", "Safe retry: backoff+jitter+breaker")} value={safe} onChange={setSafe} />
      </div>

      <div className="sc-kpi-grid" style={{ marginTop: 12 }}>
        <Kpi label={L("实际打到下游", "Load hitting downstream")} value={big(offered)} unit=" rps" tone={util > 1 ? "warn" : "ok"} hint={retries > 0 && !safe ? L(`放大了 ${nf(offered / incoming, 1)}×`, `amplified ${nf(offered / incoming, 1)}×`) : ""} />
        <Kpi label={L("下游利用率", "Downstream utilisation")} value={pct(util)} tone={util > 1 ? "warn" : (util > 0.8 ? "acc" : "ok")} />
        <Kpi label={L("失败率", "Failure rate")} value={pct1(failRate)} tone={failRate > 0.05 ? "warn" : "ok"} />
        <Kpi label="P99" value={p99 >= 8000 ? "∞" : big(p99)} unit="ms" tone={p99 > 500 ? "warn" : "ok"} />
      </div>

      <div style={{ marginTop: 10 }}>
        <Bar label={L("进入流量", "Incoming")} value={incoming} max={capacity * 3} tone="ok" valText={`${big(incoming)}`} />
        <Bar label={L("放大后打到下游", "Amplified to downstream")} value={offered} max={capacity * 3} tone={util > 1 ? "warn" : "acc"} valText={`${big(offered)}`} />
        <Bar label={L("下游容量线", "Capacity line")} value={capacity} max={capacity * 3} tone="mut" valText={`${big(capacity)}`} />
      </div>

      <Note mark="→" tone={collapsed ? "bad" : "on"}>
        {collapsed
          ? L(`下游只能扛 ${big(capacity)} rps,但重试把 ${big(incoming)} 放大成了 ${big(offered)}——利用率 ${pct(util)},它正在被自己的调用方压垮。这就是重试风暴:一次抖动被放大成一次雪崩。打开「安全重试」看它怎么被摁住。`,
              `The downstream handles ${big(capacity)} rps, but retries amplified ${big(incoming)} into ${big(offered)} — utilisation ${pct(util)}, and it is being crushed by its own callers. This is the retry storm: one hiccup amplified into an avalanche. Turn on 'safe retry' to see it contained.`)
          : safe
          ? L("安全重试:熔断在下游吃力时快速失败、退避+抖动拉开重试间隔,放大被摁住,下游守住了容量线。重试本身没错,错的是没有配套的退避和熔断。", "Safe retry: the breaker fails fast when the downstream struggles and backoff+jitter spread the attempts out, so amplification is contained and the downstream holds its capacity line. Retry is not the problem — retry without backoff and a breaker is.")
          : L("现在利用率还在容量线以内。把进入流量调到接近容量、再把重试拉到 2——看放大怎么把利用率推过 100%。", "Utilisation is still within the capacity line. Push incoming near capacity and set retries to 2 — watch amplification shove utilisation past 100%.")}
      </Note>
    </div>
  );
}

/* =========================================================
   sc8 · lbLab — load-balancing strategies & P99
   ========================================================= */
const LB_STRATS = [
  { v: "rr", zh: "轮询", en: "round-robin" },
  { v: "rand", zh: "随机", en: "random" },
  { v: "leastconn", zh: "最少连接", en: "least-conn" },
  { v: "weighted", zh: "响应时间加权", en: "response-time" },
];
function LbViz() {
  const L = useL();
  const [n, setN] = React.useState(4);
  const [slow, setSlow] = React.useState(1);        // how many instances run at half speed
  const [strat, setStrat] = React.useState("rr");
  const [load, setLoad] = React.useState(600);      // total rps

  // per-instance service rate μ (rps). Fast = 250, slow = 110.
  const mu = [];
  for (let i = 0; i < n; i++) mu.push(i < slow ? 110 : 250);
  const totalMu = mu.reduce((a, b) => a + b, 0);
  // assign arrival λ_i by strategy
  const lam = new Array(n).fill(0);
  if (strat === "rr" || strat === "rand") { for (let i = 0; i < n; i++) lam[i] = load / n; }
  else if (strat === "leastconn" || strat === "weighted") { for (let i = 0; i < n; i++) lam[i] = load * mu[i] / totalMu; } // route ∝ capacity
  // M/M/1 mean latency per instance (ms); overloaded → very large
  const lat = mu.map((m, i) => (lam[i] < m ? 1000 / (m - lam[i]) : 100000));
  const busiest = Math.max(...lat.filter((x) => x < 100000), 0);
  const p99 = Math.max(...lat) >= 100000 ? Infinity : Math.max(...lat) * 2.5; // tail ≈ dominated by slowest served
  const p50 = lat.reduce((a, b, i) => a + Math.min(b, 5000) * (lam[i] / load), 0);
  const overloaded = lat.some((x) => x >= 100000);

  return (
    <div>
      <VizHead idx="CM2" title={L("负载均衡:轮询在实例快慢不一时怎么爆掉尾延迟", "Load balancing: how round-robin blows up the tail on uneven instances")} />
      <div className="viz-ctrl">
        <Slider label={L("实例数", "Instances")} min={2} max={8} value={n} onChange={(v) => { setN(v); if (slow > v) setSlow(v); }} />
        <Slider label={L("慢实例数(半速)", "Slow instances (half speed)")} min={0} max={n} value={slow} onChange={setSlow} />
        <Slider label={L("总流量", "Total load")} min={100} max={1400} step={20} value={load} onChange={setLoad} unit=" rps" />
        <label><span>{L("负载均衡策略", "LB strategy")}</span><Seg value={strat} onChange={setStrat} options={LB_STRATS.map((s) => ({ v: s.v, l: L(s.zh, s.en) }))} /></label>
      </div>

      <div className="sc-kpi-grid" style={{ marginTop: 12 }}>
        <Kpi label="P50" value={overloaded && (strat === "rr" || strat === "rand") ? "—" : big(p50)} unit="ms" tone="ok" />
        <Kpi label="P99" value={isFinite(p99) ? big(p99) : "∞"} unit="ms" tone={!isFinite(p99) || p99 > 400 ? "warn" : "ok"} hint={L("用户感受到的是这个", "this is what users feel")} />
        <Kpi label={L("最忙实例", "Busiest instance")} value={overloaded ? L("过载", "overloaded") : `${nf(Math.max(...lat.map((x, i) => lam[i] / mu[i])) * 100, 0)}%`} tone={overloaded ? "warn" : "acc"} />
        <Kpi label={L("策略", "Strategy")} value={L(LB_STRATS.find((s) => s.v === strat).zh, LB_STRATS.find((s) => s.v === strat).en)} tone="acc" />
      </div>

      <div style={{ marginTop: 10 }}>
        <div className="sc-cap">{L("每个实例的利用率(慢实例=半速);轮询给它等量流量,它先过载", "per-instance utilisation (slow = half speed); round-robin gives it equal traffic and it overloads first")}</div>
        {mu.map((m, i) => (
          <Bar key={i} label={`${i < slow ? "🐢" : "⚡"} inst-${i + 1}`} value={Math.min(lam[i] / m, 1.2)} max={1.2} tone={lam[i] >= m ? "warn" : (lam[i] / m > 0.85 ? "acc" : "ok")} valText={lam[i] >= m ? L("过载", "over") : pct(lam[i] / m)} />
        ))}
      </div>

      <Note mark="→" tone={overloaded && (strat === "rr" || strat === "rand") ? "bad" : "on"}>
        {overloaded && (strat === "rr" || strat === "rand")
          ? L("轮询/随机平等地对待不平等的实例:那台半速的机器分到了等量流量,先过载,它的排队延迟把整体 P99 拉爆——注意 P50 可能看起来还行。换成最少连接或响应时间加权,流量按能力分配,尾延迟立刻回来。", "Round-robin/random treat unequal instances equally: the half-speed machine gets equal traffic, overloads first, and its queueing latency blows up the P99 — while P50 may still look fine. Switch to least-connections or response-time weighting: traffic follows capacity and the tail comes back.")
          : strat === "leastconn" || strat === "weighted"
          ? L("按能力分配流量:慢实例少接一点,没有谁被压过载,P99 稳住。客户端负载均衡的价值就在这里——它知道每个实例多忙,前面架一台轮询的反向代理做不到。", "Traffic follows capacity: the slow instance takes less, nobody is overloaded, P99 holds. This is the value of client-side load balancing — it knows how busy each instance is, which a round-robin reverse proxy out front cannot.")
          : L("加大流量或增加慢实例,把某台推过 100% 利用率,再在四种策略间切换,对比 P99。", "Raise the load or add slow instances to push one past 100% utilisation, then switch among the four strategies and compare P99.")}
      </Note>
    </div>
  );
}

/* =========================================================
   sc9 · breakerLab — the circuit breaker state machine
   ========================================================= */
function BreakerViz() {
  const L = useL();
  const [health, setHealth] = React.useState("failing"); // healthy | failing | recovering
  const [failRate, setFailRate] = React.useState(0.7);   // downstream failure rate when "failing"
  const [rate, setRate] = React.useState(400);           // caller rps
  const [breaker, setBreaker] = React.useState(true);

  const threshold = 0.5;   // trip when failure rate ≥ 50%
  const pool = 50;         // caller thread pool
  const timeout = 2.0;     // s, a hung downstream call
  const normal = 0.05;     // s, a healthy call
  const f = health === "healthy" ? 0.02 : health === "recovering" ? 0.25 : failRate;

  // breaker state
  let state = "CLOSED";
  if (breaker) {
    if (health === "recovering") state = "HALF_OPEN";
    else if (f >= threshold) state = "OPEN";
    else state = "CLOSED";
  }

  // caller concurrency (Little's law). OPEN → failed calls return instantly via fallback.
  const avgLat = state === "OPEN"
    ? f * 0.003 + (1 - f) * normal
    : f * timeout + (1 - f) * normal;
  const need = rate * avgLat;              // threads needed
  const used = Math.min(pool, need);
  const saturated = need > pool;
  const callerAvail = saturated ? pool / need : (state === "OPEN" ? 1 : 1 - Math.max(0, f - 0.02) * (breaker ? 0 : 1));
  const cascade = saturated && !(state === "OPEN");
  const S = { CLOSED: { c: "#2e9e6b", z: L("关闭", "CLOSED") }, OPEN: { c: "#c0453f", z: L("打开", "OPEN") }, HALF_OPEN: { c: "#d98a1f", z: L("半开", "HALF-OPEN") } };

  return (
    <div>
      <VizHead idx="CM3" title={L("熔断器:三态机怎么把级联故障挡在门外", "The circuit breaker: how the three-state machine holds off a cascade")} />
      <div className="viz-ctrl">
        <label><span>{L("下游状态", "Downstream")}</span><Seg value={health} onChange={setHealth} options={[{ v: "healthy", l: L("健康", "healthy") }, { v: "failing", l: L("故障", "failing") }, { v: "recovering", l: L("恢复中", "recovering") }]} /></label>
        <Slider label={L("故障时失败率", "Failure rate when failing")} min={0.1} max={0.98} step={0.02} value={failRate} onChange={setFailRate} fmt={pct} />
        <Slider label={L("调用方流量", "Caller load")} min={50} max={1000} step={25} value={rate} onChange={setRate} unit=" rps" />
        <Toggle label={L("启用熔断器", "Circuit breaker")} value={breaker} onChange={setBreaker} />
      </div>

      {/* state machine */}
      <div style={{ marginTop: 8 }}>
        <svg viewBox="0 0 320 96" width="100%" style={{ maxWidth: 360, display: "block", margin: "0 auto" }}>
          {[["CLOSED", 42], ["OPEN", 160], ["HALF_OPEN", 278]].map(([st, cx]) => (
            <g key={st}>
              <circle cx={cx} cy={40} r={30} fill={state === st ? S[st].c : "var(--surface-2)"} stroke={S[st].c} strokeWidth={state === st ? 3 : 1.5} opacity={state === st ? 1 : 0.55} />
              <text x={cx} y={44} textAnchor="middle" style={{ font: "600 11px var(--f-mono)", fill: state === st ? "#fff" : "var(--muted)" }}>{S[st].z}</text>
            </g>
          ))}
          <path d="M72 30 Q101 12 130 30" fill="none" stroke="var(--muted)" strokeWidth="1.2" markerEnd="url(#ar)" />
          <text x={101} y={12} textAnchor="middle" style={{ font: "500 8px var(--f-mono)", fill: "var(--muted)" }}>{L("失败率超阈值", "fail ≥ thresh")}</text>
          <path d="M190 52 Q219 74 248 52" fill="none" stroke="var(--muted)" strokeWidth="1.2" markerEnd="url(#ar)" />
          <text x={219} y={88} textAnchor="middle" style={{ font: "500 8px var(--f-mono)", fill: "var(--muted)" }}>{L("超时后探活", "after wait")}</text>
          <path d="M256 22 Q180 -8 60 20" fill="none" stroke="var(--muted)" strokeWidth="1.2" markerEnd="url(#ar)" strokeDasharray="3 3" />
          <text x={160} y={8} textAnchor="middle" style={{ font: "500 8px var(--f-mono)", fill: "var(--muted)" }}>{L("探针成功→关闭", "probe ok → close")}</text>
          <defs><marker id="ar" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="var(--muted)" /></marker></defs>
        </svg>
      </div>

      <div className="sc-kpi-grid" style={{ marginTop: 10 }}>
        <Kpi label={L("熔断器状态", "Breaker state")} value={breaker ? S[state].z : L("未启用", "disabled")} tone={state === "OPEN" ? "warn" : (state === "HALF_OPEN" ? "acc" : "ok")} />
        <Kpi label={L("占用线程", "Threads in use")} value={`${nf(used, 0)}/${pool}`} tone={saturated ? "warn" : "ok"} hint={saturated ? L("线程池耗尽", "pool exhausted") : ""} />
        <Kpi label={L("调用方可用率", "Caller availability")} value={pct1(callerAvail)} tone={callerAvail < 0.9 ? "warn" : "ok"} />
        <Kpi label={L("结局", "Outcome")} value={cascade ? L("级联雪崩", "cascade") : (state === "OPEN" ? L("快速失败+降级", "fail-fast+fallback") : L("正常", "normal"))} tone={cascade ? "warn" : "ok"} />
      </div>

      <Note mark="→" tone={cascade ? "bad" : "on"}>
        {cascade
          ? L(`下游在失败,而熔断器关着(或被禁用):每个调用都卡在 ${timeout}s 超时上,${nf(rate, 0)} rps × 超时 需要 ${nf(need, 0)} 个线程,远超线程池 ${pool}——线程耗尽,调用方自己也开始拒绝服务,故障向上级联。这就是雪崩。`,
              `The downstream is failing and the breaker is closed (or disabled): every call hangs on the ${timeout}s timeout, ${nf(rate, 0)} rps × timeout needs ${nf(need, 0)} threads, far past the pool of ${pool} — threads exhaust, the caller starts refusing service too, and the fault cascades upward. This is the avalanche.`)
          : state === "OPEN"
          ? L("熔断器打开:它检测到失败率超阈值,现在快速失败、直接走降级,不再把线程堵在超时上。调用方几乎不占线程、可用率保住了——故障被关在了下游的边界里。", "The breaker is open: it saw the failure rate cross the threshold and now fails fast to the fallback instead of blocking threads on timeouts. The caller barely uses threads and stays available — the fault is held at the downstream's boundary.")
          : state === "HALF_OPEN"
          ? L("半开:熔断器放几个探针请求过去试探下游是否恢复。成功就回到关闭、恢复正常流量;失败就重新打开。这是它自动恢复的方式。", "Half-open: the breaker lets a few probe requests through to test whether the downstream recovered. Success returns it to closed and normal traffic; failure reopens it. This is how it recovers by itself.")
          : L("下游健康,熔断器关闭,一切正常放行。把下游切到「故障」,看熔断器跳开、把调用方从雪崩里救出来;再禁用熔断器对比。", "The downstream is healthy, the breaker is closed, everything passes. Switch the downstream to 'failing' to watch the breaker trip and save the caller from an avalanche; then disable the breaker to compare.")}
      </Note>
    </div>
  );
}

/* =========================================================
   sc10 · gatewayLab — routing predicates & canary weight
   ========================================================= */
function GatewayViz() {
  const L = useL();
  const [weight, setWeight] = React.useState(10);     // % to v2 (canary)
  const [v2err, setV2err] = React.useState(0.4);      // v2 is broken
  const [betaHeader, setBetaHeader] = React.useState(true); // header predicate forces beta users to v2
  const N = 1000;
  const betaShare = betaHeader ? 0.05 : 0;            // 5% of requests carry the beta header
  const toV2frac = betaShare + (1 - betaShare) * (weight / 100);
  const toV2 = Math.round(N * toV2frac);
  const toV1 = N - toV2;
  const v1err = 0.005;
  const overallErr = toV2frac * v2err + (1 - toV2frac) * v1err;
  const blast = toV2frac;

  return (
    <div>
      <VizHead idx="GW1" title={L("网关:断言决定去哪、权重控制金丝雀的爆炸半径", "Gateway: predicates route, weight bounds the canary's blast radius")} />
      <div className="viz-ctrl">
        <Slider label={L("金丝雀权重 → v2", "Canary weight → v2")} min={0} max={100} step={5} value={weight} onChange={setWeight} unit="%" />
        <Slider label={L("v2 故障率(新版本有 bug)", "v2 error rate (new version buggy)")} min={0} max={0.8} step={0.05} value={v2err} onChange={setV2err} fmt={pct} />
        <Toggle label={L("Header 断言:beta 用户强制走 v2", "Header predicate: beta users → v2")} value={betaHeader} onChange={setBetaHeader} />
      </div>

      <div className="sc-kpi-grid" style={{ marginTop: 12 }}>
        <Kpi label={L("路由到 v1(稳定)", "Routed to v1 (stable)")} value={pct(toV1 / N)} tone="ok" hint={`${toV1}/${N}`} />
        <Kpi label={L("路由到 v2(金丝雀)", "Routed to v2 (canary)")} value={pct(toV2 / N)} tone="acc" hint={`${toV2}/${N}`} />
        <Kpi label={L("整体错误率", "Overall error rate")} value={pct2(overallErr)} tone={overallErr > 0.05 ? "warn" : "ok"} />
        <Kpi label={L("爆炸半径", "Blast radius")} value={pct(blast)} tone={blast > 0.3 ? "warn" : "ok"} hint={L("v2 出事影响的用户", "users hit if v2 breaks")} />
      </div>

      <div style={{ marginTop: 10 }}>
        <div className="sc-cap">{L("1000 个请求经断言与权重分流", "1000 requests split by predicates and weight")}</div>
        <Bar label={L("→ v1 稳定版", "→ v1 stable")} value={toV1} max={N} tone="ok" valText={`${toV1}`} />
        <Bar label={L("→ v2 金丝雀", "→ v2 canary")} value={toV2} max={N} tone="acc" valText={`${toV2}`} />
        <Bar label={L("失败的请求", "failed requests")} value={Math.round(overallErr * N)} max={N} tone="warn" valText={`${Math.round(overallErr * N)}`} />
      </div>

      <Note mark="→">
        {weight >= 100
          ? L(`你把 100% 流量切到了有 ${pct(v2err)} 故障率的 v2——整体错误率 ${pct2(overallErr)},全量用户受影响。金丝雀的意义正是不要这样发版。`,
              `You sent 100% of traffic to a v2 with a ${pct(v2err)} error rate — overall error ${pct2(overallErr)}, every user affected. The whole point of a canary is to not ship like this.`)
          : L(`权重把 v2 的曝光控制在 ${pct(toV2 / N)}:即使 v2 有 ${pct(v2err)} 的故障率,整体错误率也只有 ${pct2(overallErr)}——爆炸半径被网关权重关小了。盯着监控没问题再加权,出问题一键回切。Header 断言则让指定用户(beta)无视权重直达 v2。`,
              `The weight keeps v2's exposure at ${pct(toV2 / N)}: even with a ${pct(v2err)} error rate on v2, overall error is only ${pct2(overallErr)} — the gateway weight shrinks the blast radius. Ramp up when the dashboards are clean, roll back with one switch if not. The header predicate meanwhile sends chosen (beta) users straight to v2 regardless of weight.`)}
      </Note>
    </div>
  );
}

/* =========================================================
   sc11 · rateLab — token bucket at the gateway
   ========================================================= */
function RateViz() {
  const L = useL();
  const [refill, setRefill] = React.useState(500);    // tokens/s = sustained rate
  const [capacity, setCapacity] = React.useState(500); // bucket size = tolerated burst
  const [base, setBase] = React.useState(300);
  const [spike, setSpike] = React.useState(6);         // burst multiplier
  const backend = 600;                                 // backend can serve this

  // simulate 40 steps of 0.1s; a spike hits in the middle
  const steps = 40, dt = 0.1;
  let tokens = capacity;
  const inSeries = [], okSeries = [], rejSeries = [];
  for (let i = 0; i < steps; i++) {
    const spiking = i >= 12 && i < 24;
    const arrivals = (spiking ? base * spike : base) * dt;
    tokens = Math.min(capacity, tokens + refill * dt);
    const admit = Math.min(arrivals, tokens);
    tokens -= admit;
    inSeries.push({ x: i, y: arrivals / dt });
    okSeries.push({ x: i, y: admit / dt });
    rejSeries.push({ x: i, y: (arrivals - admit) / dt });
  }
  const peakIn = Math.max(...inSeries.map((d) => d.y));
  const peakAdmit = Math.max(...okSeries.map((d) => d.y));
  const totalRej = rejSeries.reduce((a, d) => a + d.y * dt, 0);
  const backendSafe = peakAdmit <= backend;

  return (
    <div>
      <VizHead idx="GW2" title={L("令牌桶:把十倍突发削成后端扛得住的稳定速率", "Token bucket: shaving a tenfold burst into a rate the backend survives")} />
      <div className="viz-ctrl">
        <Slider label={L("令牌速率(持续速率)", "Refill rate (sustained)")} min={100} max={1000} step={50} value={refill} onChange={setRefill} unit="/s" />
        <Slider label={L("桶容量(可容忍突发)", "Bucket capacity (burst)")} min={50} max={1500} step={50} value={capacity} onChange={setCapacity} />
        <Slider label={L("基础流量", "Base load")} min={100} max={600} step={20} value={base} onChange={setBase} unit=" rps" />
        <Slider label={L("突发倍数", "Spike multiplier")} min={1} max={12} value={spike} onChange={setSpike} unit="×" />
      </div>

      <div className="sc-kpi-grid" style={{ marginTop: 12 }}>
        <Kpi label={L("突发峰值", "Burst peak")} value={big(peakIn)} unit=" rps" tone="warn" />
        <Kpi label={L("放行峰值→后端", "Admitted peak → backend")} value={big(peakAdmit)} unit=" rps" tone={backendSafe ? "ok" : "warn"} />
        <Kpi label={L("被限流(429)", "Throttled (429)")} value={big(totalRej)} unit={L(" 个", "")} tone={totalRej > 0 ? "acc" : "ok"} />
        <Kpi label={L("后端扛得住?", "Backend survives?")} value={backendSafe ? L("是 ✓", "yes ✓") : L("过载!", "overload!")} tone={backendSafe ? "ok" : "warn"} hint={L(`容量 ${backend} rps`, `cap ${backend} rps`)} />
      </div>

      <div style={{ marginTop: 10 }}>
        <div className="sc-cap">{L("进入流量(灰)对比放行到后端(蓝);中段是突发", "incoming (grey) vs admitted to backend (blue); the middle is the burst")}</div>
        <div style={{ position: "relative" }}>
          <MiniPlot data={inSeries} stroke="var(--muted)" yMin={0} yMax={peakIn * 1.1} h={90} />
          <div style={{ marginTop: -90 }}><MiniPlot data={okSeries} stroke="var(--primary)" yMin={0} yMax={peakIn * 1.1} h={90} /></div>
        </div>
      </div>

      <Note mark="→" tone={backendSafe ? "on" : "bad"}>
        {backendSafe
          ? L(`桶按 ${refill}/s 放令牌,容量 ${capacity} 允许一小段突发。${spike}× 的尖峰打进来,后端只感受到被削平的稳定速率,多出来的 ${big(totalRej)} 个请求变成 429 被挡在门外——而不是涌进去把数据库压垮。快速拒绝好过慢慢拖死。`,
              `The bucket refills at ${refill}/s and its capacity of ${capacity} allows a short burst. A ${spike}× spike arrives, the backend feels only the shaved steady rate, and the extra ${big(totalRej)} requests become 429s held at the door — instead of flooding in and crushing the database. Fast rejection beats slow death.`)
          : L(`放行峰值 ${big(peakAdmit)} rps 仍超过后端容量 ${backend}:要么把令牌速率调低、要么把桶容量调小(容量越大,允许的突发越大)。令牌桶的两个旋钮就是「持续速率」和「突发大小」。`,
              `The admitted peak ${big(peakAdmit)} rps still exceeds the backend's ${backend}: lower the refill rate or shrink the bucket (a bigger bucket allows a bigger burst). The token bucket's two knobs are exactly 'sustained rate' and 'burst size'.`)}
      </Note>
    </div>
  );
}

/* =========================================================
   sc12 · configLab — refresh propagation window
   ========================================================= */
function ConfigViz() {
  const L = useL();
  const [n, setN] = React.useState(20);
  const [propRate, setPropRate] = React.useState(6);   // instances flipping per second
  const [canary, setCanary] = React.useState(false);
  const [t, setT] = React.useState(1.5);               // scrub time (s)

  // rollout: instances flip over time. Canary flips 1 first, waits, then the rest.
  const canaryHold = 2.0;
  const flippedAt = (i) => {
    if (!canary) return i / propRate;
    if (i === 0) return 0;                              // canary instance first
    return canaryHold + (i - 1) / propRate;             // rest after a hold
  };
  const times = Array.from({ length: n }, (_, i) => flippedAt(i));
  const totalWindow = Math.max(...times);
  const updated = times.filter((tt) => tt <= t).length;
  const mixed = updated > 0 && updated < n;
  // two services must agree; mismatched requests ∝ fraction on new × fraction on old
  const fNew = updated / n, fOld = 1 - fNew;
  const mismatch = mixed ? Math.round(2 * fNew * fOld * 100) : 0; // % of cross-service calls that see a mix

  const items = Array.from({ length: n }, (_, i) => ({ label: times[i] <= t ? "v2" : "v1", state: times[i] <= t ? "ok" : "idle" }));

  return (
    <div>
      <VizHead idx="GW3" title={L("配置刷新不是原子的:那段「新旧混跑」的危险窗口", "A config refresh is not atomic: the dangerous 'mixed old and new' window")} />
      <div className="viz-ctrl">
        <Slider label={L("实例数", "Instances")} min={4} max={40} value={n} onChange={setN} />
        <Slider label={L("传播速度", "Propagation")} min={1} max={20} value={propRate} onChange={setPropRate} unit="/s" />
        <Slider label={L("时间轴(拖动看推进)", "Timeline (scrub)")} min={0} max={Math.max(6, totalWindow)} step={0.1} value={t} onChange={setT} unit="s" />
        <Toggle label={L("先金丝雀 1 台再全量", "Canary one first, then the rest")} value={canary} onChange={setCanary} />
      </div>

      <div className="sc-kpi-grid" style={{ marginTop: 12 }}>
        <Kpi label={L("已更新实例", "Instances updated")} value={`${updated}/${n}`} tone={mixed ? "acc" : "ok"} />
        <Kpi label={L("完成用时", "Full rollout time")} value={nf(totalWindow, 1)} unit="s" tone="ok" />
        <Kpi label={L("当前是否混跑", "Mixed state now?")} value={mixed ? L("是", "yes") : L("否", "no")} tone={mixed ? "warn" : "ok"} />
        <Kpi label={L("不一致请求", "Inconsistent calls")} value={mixed ? `~${mismatch}%` : "0%"} tone={mismatch > 20 ? "warn" : "ok"} hint={L("两服务须一致时", "when two must agree")} />
      </div>

      <div style={{ marginTop: 8 }}>
        <div className="sc-cap">{L("v1=旧配置 · v2=新配置(拖时间轴看它一台台翻)", "v1=old config · v2=new (scrub the timeline to watch instances flip)")}</div>
        <Boxes items={items} />
      </div>

      <Note mark="→" tone={mixed && mismatch > 20 && !canary ? "bad" : "on"}>
        {mixed
          ? L(`此刻 ${updated} 台用新配置、${n - updated} 台还用旧的。如果这个配置控制的是两个服务必须一致的行为(协议版本、特性开关),那么这段窗口里约 ${mismatch}% 的跨服务调用会撞上「一边新一边旧」。${canary ? "金丝雀模式先翻 1 台观察,把风险窗口和爆炸半径都压小了。" : "打开金丝雀,先翻 1 台验证再全量,能把这个风险关小。"}`,
              `Right now ${updated} instances run the new config and ${n - updated} still run the old. If this config controls behaviour two services must agree on (a protocol version, a feature flag), then during this window about ${mismatch}% of cross-service calls hit 'one new, one old'. ${canary ? "Canary mode flips one first to observe, shrinking both the risk window and the blast radius." : "Turn on canary to flip one and verify before the rest — it shrinks this risk."}`)
          : updated === n
          ? L("全部实例已切到新配置,窗口关闭,系统重新一致。但记住:在到达这一刻之前,一定存在过一段混跑窗口——配置不是原子生效的。", "All instances are on the new config, the window is closed, the system is consistent again. But remember: before this moment there was always a mixed window — config does not apply atomically.")
          : L("把时间轴往右拖,看新配置一台台生效。中途一定会经过「一半新一半旧」的状态。", "Drag the timeline right to watch the new config take effect instance by instance. It must pass through a 'half new, half old' state on the way.")}
      </Note>
    </div>
  );
}

/* =========================================================
   sc26 · rpcLab — gRPC vs REST chooser
   ========================================================= */
function RpcViz() {
  const L = useL();
  const [fields, setFields] = React.useState(12);   // fields in the message
  const [rate, setRate] = React.useState(5000);     // calls/s
  const [rtt, setRtt] = React.useState(3);          // network RTT ms
  const [browser, setBrowser] = React.useState(false);
  const [streaming, setStreaming] = React.useState(false);
  const [publicApi, setPublicApi] = React.useState(false);

  // payload models (rough but honest): JSON is text+keys, Protobuf is tag+varint
  const jsonBytes = Math.round(fields * 22 + 40);
  const protoBytes = Math.round(fields * 5 + 6);
  const saved = 1 - protoBytes / jsonBytes;
  const jsonBW = rate * jsonBytes;                  // bytes/s on the wire
  const protoBW = rate * protoBytes;
  // per-call latency: gRPC = HTTP/2 + binary parse; REST = HTTP/1.1 + JSON parse
  const restLat = rtt + 0.6 + jsonBytes * 0.0022;
  const grpcLat = rtt + 0.25 + protoBytes * 0.0008;

  // efficiency magnitude (chatty internal load with big messages favours gRPC)
  const eff = clamp((rate * fields) / (12000 * 20), 0, 1);
  const deltas = [];
  let g = 50, r = 50;
  { const d = Math.round(eff * 24); g += d; r -= Math.round(eff * 10); deltas.push({ k: L("报文/吞吐效率", "payload/throughput"), v: d, side: "g" }); }
  if (streaming) { g += 22; r -= 14; deltas.push({ k: L("流式", "streaming"), v: 22, side: "g" }); }
  if (browser) { r += 26; g -= 18; deltas.push({ k: L("浏览器客户端", "browser clients"), v: 26, side: "r" }); }
  if (publicApi) { r += 16; g -= 10; deltas.push({ k: L("对外/生态", "public/ecosystem"), v: 16, side: "r" }); }
  g = clamp(g, 3, 100); r = clamp(r, 3, 100);
  const rec = g > r + 6 ? "grpc" : r > g + 6 ? "rest" : "either";
  const decider = deltas.sort((a, b) => b.v - a.v)[0];

  const heavy = eff > 0.4;
  const axes = [
    { label: L("序列化/报文", "serialization"), g: L("Protobuf 二进制", "Protobuf binary"), r: L("JSON 文本", "JSON text"), win: "g", active: heavy },
    { label: L("传输", "transport"), g: L("HTTP/2 多路复用", "HTTP/2 multiplexed"), r: L("HTTP/1.1 常用", "HTTP/1.1 typical"), win: "g", active: heavy },
    { label: L("契约", "contract"), g: L(".proto 强类型代码生成", ".proto typed codegen"), r: L("OpenAPI/手写,松散", "OpenAPI/hand, loose"), win: "g", active: false },
    { label: L("流式", "streaming"), g: L("四种流原生", "4 streaming modes"), r: L("请求-响应(需 SSE/WS)", "req-resp (SSE/WS)"), win: "g", active: streaming },
    { label: L("浏览器/客户端", "browser"), g: L("需 grpc-web 代理", "needs grpc-web proxy"), r: L("任何客户端直连", "any client, direct"), win: "r", active: browser },
    { label: L("可调试/缓存", "debug/cache"), g: L("二进制,需工具", "binary, tooling"), r: L("curl 可读 + HTTP 缓存", "curl-readable + HTTP cache"), win: "r", active: publicApi },
  ];
  const Cell = ({ text, winner }) => (
    <div style={{ flex: 1, padding: "5px 8px", font: "500 10.5px var(--f-mono)", borderRadius: 4,
      background: winner ? "color-mix(in srgb, #2e9e6b 16%, transparent)" : "transparent",
      color: winner ? "var(--ink)" : "var(--muted)", border: winner ? "1px solid color-mix(in srgb,#2e9e6b 45%,transparent)" : "1px solid transparent" }}>
      {winner ? "✓ " : ""}{text}
    </div>
  );

  return (
    <div>
      <VizHead idx="CM4" title={L("gRPC vs REST:报文、传输,和该在哪一层用哪个", "gRPC vs REST: payload, transport, and which one at which layer")} />
      <div className="viz-ctrl">
        <Slider label={L("消息字段数", "Fields in message")} min={3} max={50} value={fields} onChange={setFields} />
        <Slider label={L("调用频率", "Call rate")} min={100} max={50000} step={100} value={rate} onChange={setRate} fmt={(v) => big(v) + "/s"} />
        <Slider label={L("网络往返", "Network RTT")} min={1} max={100} value={rtt} onChange={setRtt} unit="ms" />
        <Toggle label={L("需要浏览器直连", "Need browser clients")} value={browser} onChange={setBrowser} />
        <Toggle label={L("需要流式", "Need streaming")} value={streaming} onChange={setStreaming} />
        <Toggle label={L("对外公开 API", "Public-facing API")} value={publicApi} onChange={setPublicApi} />
      </div>

      <div className="sc-kpi-grid" style={{ marginTop: 12 }}>
        <Kpi label={L("REST/JSON 报文", "REST/JSON payload")} value={big(jsonBytes)} unit="B" tone="" />
        <Kpi label={L("gRPC/Protobuf 报文", "gRPC/Protobuf payload")} value={big(protoBytes)} unit="B" tone="ok" hint={L(`省 ${pct(saved)} 带宽`, `${pct(saved)} smaller`)} />
        <Kpi label={L("推荐", "Recommendation")} value={rec === "grpc" ? "gRPC" : rec === "rest" ? "REST" : L("两者皆可", "either")} tone="acc" />
        <Kpi label={L("决定性因素", "Deciding factor")} value={decider ? decider.k : L("需求相近", "close call")} tone="warn" />
      </div>

      <div style={{ marginTop: 10 }}>
        <div className="sc-cap">{L("线上带宽(字节/秒):同一批调用,JSON vs Protobuf", "wire bandwidth (bytes/s): same calls, JSON vs Protobuf")}</div>
        <Bar label={L("REST/JSON", "REST/JSON")} value={jsonBW} max={jsonBW} tone="warn" valText={big(jsonBW) + "/s"} />
        <Bar label={L("gRPC/Protobuf", "gRPC/Protobuf")} value={protoBW} max={jsonBW} tone="ok" valText={big(protoBW) + "/s"} />
        <div className="sc-cap" style={{ marginTop: 4 }}>{L(`单次延迟估算:REST ~${nf(restLat, 1)}ms · gRPC ~${nf(grpcLat, 1)}ms`, `per-call latency est: REST ~${nf(restLat, 1)}ms · gRPC ~${nf(grpcLat, 1)}ms`)}</div>
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ display: "flex", gap: 6, padding: "0 8px 3px", font: "600 10px var(--f-mono)", color: "var(--muted)" }}>
          <div style={{ width: 92 }} /><div style={{ flex: 1 }}>gRPC</div><div style={{ flex: 1 }}>REST</div>
        </div>
        {axes.map((a, i) => (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3,
            padding: a.active ? "2px 0 2px 4px" : "2px 0", borderLeft: a.active ? "2px solid var(--accent)" : "2px solid transparent" }}>
            <div style={{ width: 88, font: `${a.active ? 700 : 500} 10.5px var(--f-mono)`, color: a.active ? "var(--ink)" : "var(--muted)" }}>{a.label}{a.active ? " ●" : ""}</div>
            <Cell text={a.g} winner={a.active && a.win === "g"} />
            <Cell text={a.r} winner={a.active && a.win === "r"} />
          </div>
        ))}
      </div>

      <Note mark="→" tone="on">
        {rec === "grpc"
          ? L(`按你的场景,gRPC 更合适${decider ? "——决定性因素是「" + decider.k + "」。" : "。"}它的 Protobuf 二进制报文只有 JSON 的约 ${pct(1 - saved)}(省 ${pct(saved)} 带宽),HTTP/2 多路复用又压低了延迟——服务之间高频内部调用正是它的主场。代价:curl 读不了、浏览器要 grpc-web 代理、没有 HTTP 缓存。`,
              `For your scenario, gRPC fits better${decider ? " — the deciding factor is '" + decider.k + "'. " : ". "}Its Protobuf binary payload is about ${pct(1 - saved)} the size of JSON (${pct(saved)} less bandwidth) and HTTP/2 multiplexing cuts latency — chatty internal service-to-service traffic is its home ground. The price: not curl-readable, a grpc-web proxy for browsers, no HTTP caching.`)
          : rec === "rest"
          ? L(`按你的场景,REST 更合适${decider ? "——决定性因素是「" + decider.k + "」。" : "。"}JSON 人可读、任何客户端(包括浏览器)都能直连、能走 HTTP 缓存,系统边缘对外就该用它。报文更大、延迟略高,但在对外/低频场景里这点开销不重要。`,
              `For your scenario, REST fits better${decider ? " — the deciding factor is '" + decider.k + "'. " : ". "}JSON is human-readable, any client (browsers included) connects directly, and it caches over HTTP — at the edge, facing the outside world, this is what to use. The payload is bigger and latency slightly higher, but at external/low-frequency scale that overhead does not matter.`)
          : L("两者都够用。经验法则是分层:服务之间(内部、高频、强契约)用 gRPC,系统边缘对外(浏览器、第三方、要缓存)用 REST——很多系统两者都有,由 API 网关在边缘把外部 REST 翻译成内部 gRPC。", "Both work. The rule of thumb is to layer them: gRPC between services (internal, high-frequency, strong contracts), REST at the edge (browsers, third parties, caching) — many systems run both, with the API gateway translating external REST into internal gRPC.")}
      </Note>
    </div>
  );
}

/* =========================================================
   sc28 · versionLab — API versioning: break, or evolve
   ========================================================= */
function VersionViz() {
  const L = useL();
  const [consumers, setConsumers] = React.useState(20);
  const [change, setChange] = React.useState("breaking");   // additive | breaking
  const [strategy, setStrategy] = React.useState("uri");    // inplace | uri | header | media
  const [weeks, setWeeks] = React.useState(8);

  const additive = change === "additive";
  const inPlace = strategy === "inplace";
  const broken = additive ? 0 : (inPlace ? consumers : 0);
  const versions = additive ? 1 : (inPlace ? 1 : 2);
  const maint = additive ? 0 : (inPlace ? 0 : weeks);
  const disaster = broken > 0;
  const verdict = additive ? L("无需新版本", "no version needed")
    : inPlace ? L("全员破坏", "everyone breaks")
      : L(`并行 ${weeks} 周`, `${weeks} wks in parallel`);

  const STRATS = [
    { key: "inplace", label: L("就地改 (无版本)", "in-place (no version)"), ex: "PUT /orders", note: L("直接改 v1;破坏性改动=打断所有调用方", "change v1 directly; a breaking change breaks everyone") },
    { key: "uri", label: L("URI 路径", "URI path"), ex: "GET /v2/orders", note: L("最直观、易在网关路由、可缓存", "visible, easy to route at the gateway, cacheable") },
    { key: "header", label: L("请求头", "header"), ex: "X-API-Version: 2", note: L("URL 干净,但缓存/调试不友好", "clean URL, but cache/debug unfriendly") },
    { key: "media", label: L("媒体类型", "media type"), ex: "Accept: …vnd.shop.v2+json", note: L("内容协商,最纯粹也最难测", "content negotiation, purest, hardest to test") },
  ];

  return (
    <div>
      <VizHead idx="GW4" title={L("API 版本:一个改动打断多少调用方", "API versioning: how many callers a change breaks")} />
      <div className="viz-ctrl">
        <Slider label={L("调用方数量", "Callers")} min={3} max={50} value={consumers} onChange={setConsumers} />
        <label><span>{L("改动类型", "Change type")}</span><Seg value={change} onChange={setChange} options={[{ v: "additive", l: L("向后兼容(加法)", "additive") }, { v: "breaking", l: L("破坏性", "breaking") }]} /></label>
        <Slider label={L("调用方迁移周期", "Migration window")} min={1} max={26} value={weeks} onChange={setWeeks} unit={L(" 周", " wks")} />
      </div>

      <div className="sc-kpi-grid" style={{ marginTop: 12 }}>
        <Kpi label={L("被打断的调用方", "Callers broken")} value={broken} unit={L(" 个", "")} tone={broken > 0 ? "warn" : "ok"} hint={broken > 0 ? L("发布即断", "break on deploy") : L("零打断", "zero broken")} />
        <Kpi label={L("并行维护的版本", "Versions in parallel")} value={versions} tone={versions > 1 ? "acc" : "ok"} />
        <Kpi label={L("双版本维护", "Dual maintenance")} value={maint} unit={L(" 周", " wks")} tone={maint > 12 ? "warn" : maint > 0 ? "acc" : "ok"} />
        <Kpi label={L("结论", "Verdict")} value={verdict} tone={disaster ? "warn" : additive ? "ok" : "acc"} />
      </div>

      <div style={{ marginTop: 10 }}>
        <Bar label={L("安全的调用方", "callers safe")} value={consumers - broken} max={consumers} tone="ok" valText={`${consumers - broken}`} />
        <Bar label={L("被打断的调用方", "callers broken")} value={broken} max={consumers} tone="warn" valText={`${broken}`} />
      </div>

      <div style={{ marginTop: 10 }}>
        <div className="sc-cap">{L("版本放哪(点击选择;破坏性改动时才需要)", "where the version goes (click to pick; only needed for a breaking change)")}</div>
        {STRATS.map((s) => {
          const on = strategy === s.key;
          const bad = s.key === "inplace" && !additive;
          return (
            <div key={s.key} onClick={() => setStrategy(s.key)} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, cursor: "pointer",
              padding: "5px 8px", borderRadius: 6,
              background: on ? (bad ? "color-mix(in srgb,#c0453f 12%,transparent)" : "color-mix(in srgb,var(--primary) 10%,transparent)") : "transparent",
              border: on ? `1px solid ${bad ? "#c0453f" : "var(--primary)"}` : "1px solid var(--hairline)" }}>
              <span style={{ width: 120, font: "600 11px var(--f-mono)", color: on ? "var(--ink)" : "var(--muted)" }}>{on ? "● " : ""}{s.label}</span>
              <code style={{ font: "600 10.5px var(--f-mono)", color: "var(--accent)", minWidth: 150 }}>{s.ex}</code>
              <span style={{ font: "500 10px var(--f-mono)", color: "var(--muted)", flex: 1 }}>{s.note}</span>
            </div>
          );
        })}
      </div>

      <Note mark="→" tone={disaster ? "bad" : "on"}>
        {additive
          ? L("这是最好的结果:向后兼容的加法改动不需要新版本。只加可选字段、绝不删字段或改语义,调用方用宽容的读取器忽略不认识的字段——你一个版本都不用额外维护。先穷尽这条路,再考虑加版本。", "This is the best outcome: a backward-compatible additive change needs no new version. Only add optional fields, never remove or change a meaning, and callers with a tolerant reader ignore what they do not recognise — you maintain no extra version at all. Exhaust this path before reaching for a version.")
          : inPlace
          ? L(`破坏性改动却就地改 v1:所有还没迁移的调用方在你发布的那一刻全断了(这里 ${consumers} 个)。这正是版本管理要防的事故。给这个改动一个新版本,让 v1 与 v2 并行,谁也不打断。`,
              `A breaking change made in place: every caller that has not migrated breaks the instant you deploy (${consumers} here). This is exactly the incident versioning exists to prevent. Give the change a new version and run v1 and v2 in parallel so nobody breaks.`)
          : L(`破坏性改动 + 版本并行:老调用方继续走 v1、不受影响,新调用方走 v2。代价是你要同时维护两个版本约 ${weeks} 周,直到调用方都迁移完。用 Deprecation / Sunset 响应头告诉他们截止日期,迁移完就退役 v1——${strategy === "uri" ? "URI 版本最容易在网关直接按路径路由。" : strategy === "header" ? "请求头版本 URL 干净,但记得让缓存对版本头敏感。" : "媒体类型版本最纯粹,但要接受更高的测试与调试成本。"}`,
              `A breaking change with parallel versions: old callers stay on v1 untouched, new callers use v2. The cost is maintaining two versions for about ${weeks} weeks until callers migrate. Tell them the deadline with Deprecation / Sunset response headers and retire v1 once migration is done — ${strategy === "uri" ? "URI versions are the easiest to route by path at the gateway." : strategy === "header" ? "header versions keep the URL clean, but make caches vary on the version header." : "media-type versions are the purest, at a higher testing and debugging cost."}`)}
      </Note>
    </div>
  );
}

/* ---------------- export Module III–IV benches ---------------- */
window.__SC_VIZ_2 = {
  feignLab: FeignViz,
  lbLab: LbViz,
  breakerLab: BreakerViz,
  gatewayLab: GatewayViz,
  rateLab: RateViz,
  configLab: ConfigViz,
  rpcLab: RpcViz,
  versionLab: VersionViz,
};
