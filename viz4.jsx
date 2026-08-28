/* =========================================================
   viz4.jsx — benches for Module VII–VIII (sc19–sc24)
   + the VIZ registry and <Viz>.
   ---------------------------------------------------------
   Uses the shared helpers declared in viz.jsx. This is the
   last viz file index.html loads, so it assembles VIZ from
   window.__SC_VIZ_1/2/3 plus the benches defined here.
   ========================================================= */

/* =========================================================
   sc19 · placementLab — service placement & blast radius
   ========================================================= */
function PlacementViz() {
  const L = useL();
  const [machines, setMachines] = React.useState(3);
  const [antiAffinity, setAntiAffinity] = React.useState(true);
  const [coLocate, setCoLocate] = React.useState(false); // force order+payment together
  const [killed, setKilled] = React.useState(0);         // which machine is down

  const svcs = [
    { key: "gw", name: L("网关", "gateway"), reps: 2, crit: true },
    { key: "order", name: L("订单", "order"), reps: 2, crit: true },
    { key: "inv", name: L("库存", "inventory"), reps: 2, crit: true },
    { key: "pay", name: L("支付", "payment"), reps: 2, crit: true },
  ];
  // place replicas on machines
  const place = {}; // key -> [machineIndex,...]
  svcs.forEach((s, si) => {
    place[s.key] = [];
    for (let r = 0; r < s.reps; r++) {
      let m;
      if (coLocate && (s.key === "order" || s.key === "pay")) m = 0;         // pile onto machine 0
      else if (antiAffinity) m = (si + r) % machines;                        // spread
      else m = (si) % machines;                                              // all replicas of a svc together
      place[s.key].push(m);
    }
  });
  // after killing machine `killed`, which services still have ≥1 replica?
  const survive = {}; svcs.forEach((s) => { survive[s.key] = place[s.key].some((m) => m !== killed); });
  const checkoutUp = svcs.every((s) => survive[s.key]);
  const dead = svcs.filter((s) => !survive[s.key]);

  return (
    <div>
      <VizHead idx="OP1" title={L("把不同服务部署到不同机器:一台宕机,死几个服务", "Different services on different servers: kill one machine, lose which services")} />
      <div className="viz-ctrl">
        <Slider label={L("机器数", "Machines")} min={2} max={5} value={machines} onChange={(v) => { setMachines(v); if (killed >= v) setKilled(0); }} />
        <Toggle label={L("反亲和:同服务副本分散", "Anti-affinity: spread replicas")} value={antiAffinity} onChange={setAntiAffinity} />
        <Toggle label={L("把订单+支付塞到同一台(省机器)", "Co-locate order+payment (save machines)")} value={coLocate} onChange={setCoLocate} />
        <Slider label={L("宕掉哪台机器", "Kill which machine")} min={0} max={machines - 1} value={killed} onChange={(v) => setKilled(Math.round(v))} fmt={(v) => `#${Math.round(v)}`} />
      </div>

      <div className="sc-kpi-grid" style={{ marginTop: 12 }}>
        <Kpi label={L("宕机机器", "Machine killed")} value={`#${killed}`} tone="warn" />
        <Kpi label={L("受影响服务", "Services hit")} value={dead.length ? dead.map((s) => s.name).join(",") : L("无", "none")} tone={dead.some((s) => s.crit) ? "warn" : "ok"} />
        <Kpi label={L("下单链路", "Checkout chain")} value={checkoutUp ? L("存活 ✓", "alive ✓") : L("中断 ✗", "broken ✗")} tone={checkoutUp ? "ok" : "warn"} />
        <Kpi label={L("爆炸半径", "Blast radius")} value={pct(dead.length / svcs.length)} tone={dead.length / svcs.length > 0.25 ? "warn" : "ok"} />
      </div>

      <div style={{ marginTop: 8 }}>
        <div className="sc-cap">{L("每台机器上跑的服务副本(✗ 的机器已宕机)", "service replicas per machine (✗ machine is down)")}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
          {Array.from({ length: machines }, (_, m) => {
            const onHere = [];
            svcs.forEach((s) => place[s.key].forEach((mm) => { if (mm === m) onHere.push(s); }));
            const down = m === killed;
            return (
              <div key={m} style={{ flex: "1 1 90px", minWidth: 90, border: `1.5px solid ${down ? "#c0453f" : "var(--hairline-strong)"}`, borderRadius: 8, padding: 8, opacity: down ? 0.55 : 1, background: down ? "color-mix(in srgb, #c0453f 8%, transparent)" : "transparent" }}>
                <div style={{ font: "600 11px var(--f-mono)", color: down ? "#c0453f" : "var(--muted)", marginBottom: 6 }}>{down ? `✗ machine-${m}` : `machine-${m}`}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {onHere.map((s, i) => (
                    <span key={i} style={{ font: "600 10px var(--f-mono)", padding: "3px 5px", borderRadius: 4, color: "#fff", background: down ? "var(--muted)" : "var(--primary)", opacity: down ? 0.7 : 0.9 }}>{s.name}</span>
                  ))}
                  {onHere.length === 0 && <span style={{ color: "var(--muted)", fontSize: 10 }}>—</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Note mark="→" tone={!checkoutUp ? "bad" : "on"}>
        {!checkoutUp
          ? L(`宕掉 machine-${killed},下单链路断了——因为 ${dead.map((s) => s.name).join("、")} 在这台机器上的副本被一锅端了。${coLocate ? "你为了省机器把订单和支付放在了一起,这台机器就成了单点。" : "把副本用反亲和分散到不同机器,单台故障就只会吃掉系统的一小块。"}`,
              `Killing machine-${killed} broke the checkout chain — ${dead.map((s) => s.name).join(", ")} lost all their replicas on it. ${coLocate ? "Co-locating order and payment to save a machine made that machine a single point of failure." : "Spread replicas across machines with anti-affinity so a single failure eats only a slice."}`)
          : L("即使宕掉一台机器,每个关键服务在别的机器上都还有存活副本,下单链路照常运转——这就是反亲和的价值:让任何单点故障都只吃掉系统的一小块。放置(哪个服务上哪台机器)不是琐事,是容灾设计。", "Even with a machine down, every critical service still has a live replica elsewhere and checkout runs — this is the value of anti-affinity: a single failure eats only a slice. Placement (which service on which machine) is not trivia, it is disaster-recovery design.")}
      </Note>
    </div>
  );
}

/* =========================================================
   sc20 · autoscaleLab — Kubernetes HPA elastic scaling
   ========================================================= */
function AutoscaleViz() {
  const L = useL();
  const [target, setTarget] = React.useState(200);      // rps per replica
  const [coldStart, setColdStart] = React.useState(30); // s until a new replica is ready
  const [stabilize, setStabilize] = React.useState(false);
  const [maxR, setMaxR] = React.useState(14);
  const minR = 3;

  const sim = React.useMemo(() => {
    const steps = 60, dt = 4;         // 240 s window
    let ready = minR; let pending = [];
    let lastDesired = minR, flaps = 0, cost = 0, timeouts = 0, cooldownUntil = -1;
    const traf = [], cap = [], reps = [];
    for (let i = 0; i < steps; i++) {
      const t = i * dt;
      const load = 300 + 2200 * Math.exp(-Math.pow((t - 120) / 45, 2)); // a traffic wave
      pending = pending.filter((p) => { if (p.readyAt <= t) { ready++; return false; } return true; });
      const capacity = ready * target;
      let desired = clamp(Math.ceil(load / target), minR, maxR);
      if (stabilize) {
        if (desired < ready) { if (t < cooldownUntil) desired = ready; else cooldownUntil = t + 60; }
        else if (desired > ready) cooldownUntil = t + 60;
      }
      const inflight = pending.length;
      if (desired > ready + inflight) { const add = desired - ready - inflight; for (let k = 0; k < add; k++) pending.push({ readyAt: t + coldStart }); }
      if (desired < ready) ready = desired;
      if (desired !== lastDesired) { flaps++; lastDesired = desired; }
      if (load > capacity) timeouts += (load - capacity) * dt;
      cost += (ready + pending.length) * dt;
      traf.push({ x: i, y: load }); cap.push({ x: i, y: capacity }); reps.push({ x: i, y: ready });
    }
    return { traf, cap, reps, flaps, cost, timeouts, peakRep: Math.max(...reps.map((r) => r.y)) };
  }, [target, coldStart, stabilize, maxR]);

  const yMax = Math.max(...sim.traf.map((d) => d.y), ...sim.cap.map((d) => d.y)) * 1.1;

  return (
    <div>
      <VizHead idx="OP2" title={L("HPA 弹性伸缩:副本追流量,但冷启动会漏一段超时", "HPA autoscaling: replicas chase traffic, but cold start leaks a timeout gap")} />
      <div className="viz-ctrl">
        <Slider label={L("每副本目标 rps", "Target rps/replica")} min={100} max={400} step={20} value={target} onChange={setTarget} />
        <Slider label={L("冷启动时间", "Cold-start time")} min={0} max={60} step={5} value={coldStart} onChange={setColdStart} unit="s" />
        <Slider label={L("最大副本数", "Max replicas")} min={6} max={20} value={maxR} onChange={setMaxR} />
        <Toggle label={L("稳定窗口(防抖动)", "Stabilisation window (anti-flap)")} value={stabilize} onChange={setStabilize} />
      </div>

      <div className="sc-kpi-grid" style={{ marginTop: 12 }}>
        <Kpi label={L("峰值副本", "Peak replicas")} value={sim.peakRep} tone="acc" hint={`min ${minR} · max ${maxR}`} />
        <Kpi label={L("扩容滞后超时", "Timeouts in scale-up gap")} value={big(sim.timeouts)} tone={sim.timeouts > 20000 ? "warn" : (sim.timeouts > 0 ? "acc" : "ok")} hint={L("冷启动漏的请求", "leaked while cold-starting")} />
        <Kpi label={L("伸缩抖动次数", "Scaling changes")} value={sim.flaps} tone={sim.flaps > 12 ? "warn" : "ok"} hint={stabilize ? L("稳定窗口已压制", "damped by window") : L("无窗口→抖动", "no window → flaps")} />
        <Kpi label={L("成本(副本·秒)", "Cost (replica·s)")} value={big(sim.cost)} tone="ok" />
      </div>

      <div style={{ marginTop: 8 }}>
        <div className="sc-cap">{L("流量(灰)对比处理能力(蓝);能力落在流量下方的地方就是超时", "load (grey) vs serving capacity (blue); where capacity dips below load, requests time out")}</div>
        <div style={{ position: "relative" }}>
          <MiniPlot data={sim.traf} stroke="var(--muted)" yMin={0} yMax={yMax} h={96} />
          <div style={{ marginTop: -96 }}><MiniPlot data={sim.cap} stroke="var(--primary)" yMin={0} yMax={yMax} h={96} /></div>
        </div>
        <div className="sc-cap" style={{ marginTop: 6 }}>{L("副本数随时间", "replica count over time")}</div>
        <MiniPlot data={sim.reps} stroke="var(--accent)" yMin={0} yMax={maxR + 1} h={64} />
      </div>

      <Note mark="→" tone={sim.timeouts > 20000 || sim.flaps > 12 ? "bad" : "on"}>
        {coldStart >= 25 && sim.timeouts > 15000
          ? L(`冷启动 ${coldStart}s 是问题所在:HPA 早就决定扩容了,但新副本要 ${coldStart} 秒才能接流量,这段空档里流量已经超过了现有能力——曲线上蓝线掉到灰线下面的那块,全是超时。扩容不是瞬时的。用更小的镜像、就绪探针、预留副本或 CRaC/原生镜像来缩短它。`,
              `Cold start of ${coldStart}s is the problem: the HPA decided to scale long ago, but a new replica needs ${coldStart}s to take traffic, and in that gap load already exceeds current capacity — the area where the blue line dips under the grey is all timeouts. Scaling is not instant. Shrink it with smaller images, readiness probes, warm replicas, or CRaC / native image.`)
          : sim.flaps > 12 && !stabilize
          ? L(`副本数抖了 ${sim.flaps} 次:流量在阈值附近波动时,没有稳定窗口的 HPA 会疯狂地一会扩一会缩,反而更不稳。打开稳定窗口,缩容会等一段时间确认再动。`,
              `The replica count changed ${sim.flaps} times: with traffic hovering near the threshold and no stabilisation window, the HPA thrashes up and down. Turn on the stabilisation window so scale-down waits to confirm before acting.`)
          : L("弹性伸缩把副本数贴着流量走,峰值扩上去、峰后缩回来,你只为需要的容量付费。但记住三个坑:冷启动让扩容有滞后、没有稳定窗口会抖动、留多少余量是成本与延迟的取舍。调大冷启动或关掉稳定窗口,亲眼看它们发作。", "Elastic scaling keeps replicas close to traffic — up at the peak, back down after — so you pay only for needed capacity. But remember three traps: cold start makes scaling lag, no stabilisation window causes flapping, and headroom trades cost against latency. Crank up cold start or turn off the window to watch them bite.")}
      </Note>
    </div>
  );
}

/* =========================================================
   sc21 · multiDCLab — active-active & cross-DC replication
   ========================================================= */
function MultiDCViz() {
  const L = useL();
  const [mode, setMode] = React.useState("async");   // async | sync
  const [lag, setLag] = React.useState(60);          // inter-DC one-way ms
  const [activeActive, setActiveActive] = React.useState(true);
  const [failed, setFailed] = React.useState(false); // DC-A outage

  const localWrite = 5;                               // local DB write ms
  const writeLatency = mode === "sync" ? localWrite + lag * 2 : localWrite; // sync waits for the far ack
  const replLag = mode === "sync" ? 0 : lag;          // async: B is behind by ~lag
  // read-your-write: a read routed to the OTHER dc within the lag window is stale
  const staleReadRisk = mode === "sync" ? 0 : clamp(lag / 200, 0, 0.6) * (activeActive ? 1 : 0.4);
  const conflictRisk = activeActive && mode === "async" ? clamp(lag / 150, 0, 0.5) : 0;
  // failover
  const rpo = failed ? (mode === "sync" ? 0 : Math.round(lag * 8)) : 0; // async loses in-flight writes
  const rto = failed ? (activeActive ? 5 : 45) : 0;   // active-active already serving elsewhere

  return (
    <div>
      <VizHead idx="OP3" title={L("异地多活:复制延迟、写冲突、以及机房级故障切换", "Active-active: replication lag, write conflict, and region-level failover")} />
      <div className="viz-ctrl">
        <label><span>{L("复制模式", "Replication")}</span><Seg value={mode} onChange={setMode} options={[{ v: "async", l: L("异步", "async") }, { v: "sync", l: L("同步", "sync") }]} /></label>
        <Slider label={L("机房间单向延迟", "Inter-DC latency")} min={5} max={150} step={5} value={lag} onChange={setLag} unit="ms" />
        <Toggle label={L("双活(两地都可写)", "Active-active (both write)")} value={activeActive} onChange={setActiveActive} />
        <Toggle label={L("模拟机房 A 整体故障", "Fail data-centre A")} value={failed} onChange={setFailed} />
      </div>

      <div className="sc-kpi-grid" style={{ marginTop: 12 }}>
        <Kpi label={L("写延迟", "Write latency")} value={big(writeLatency)} unit="ms" tone={writeLatency > 100 ? "warn" : "ok"} hint={mode === "sync" ? L("要等对端确认", "waits for far ack") : L("本地即返回", "returns locally")} />
        <Kpi label={L("复制延迟", "Replication lag")} value={replLag === 0 ? "0" : `~${big(replLag)}`} unit="ms" tone={replLag > 0 ? "acc" : "ok"} />
        <Kpi label={L("读到旧数据风险", "Stale-read risk")} value={pct(staleReadRisk)} tone={staleReadRisk > 0.2 ? "warn" : "ok"} hint={staleReadRisk > 0 ? L("读不到自己刚写的", "can't read own write") : ""} />
        <Kpi label={L("写冲突风险", "Write-conflict risk")} value={pct(conflictRisk)} tone={conflictRisk > 0.1 ? "warn" : "ok"} />
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "center", marginTop: 6 }}>
          {[["A", failed], ["B", false]].map(([dc, down], idx) => (
            <React.Fragment key={dc}>
              <div style={{ flex: "0 0 110px", textAlign: "center", border: `1.5px solid ${down ? "#c0453f" : "var(--primary)"}`, borderRadius: 8, padding: "10px 8px", opacity: down ? 0.5 : 1, background: down ? "color-mix(in srgb,#c0453f 8%,transparent)" : "color-mix(in srgb,var(--primary) 6%,transparent)" }}>
                <div style={{ font: "700 13px var(--f-mono)" }}>{down ? `✗ DC-${dc}` : `DC-${dc}`}</div>
                <div style={{ font: "500 10px var(--f-mono)", color: "var(--muted)", marginTop: 3 }}>{down ? L("已故障", "down") : (activeActive || dc === "A" ? L("读+写", "read+write") : L("只读备", "read replica"))}</div>
              </div>
              {idx === 0 && <div style={{ textAlign: "center", color: "var(--muted)", font: "500 10px var(--f-mono)" }}>{mode === "sync" ? "⇄ sync" : "→ async"}<br />{replLag === 0 ? "0ms" : `~${big(replLag)}ms`}</div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {failed && (
        <div className="sc-kpi-grid" style={{ marginTop: 10 }}>
          <Kpi label="RPO" value={rpo === 0 ? L("0(不丢)", "0 (no loss)") : `~${big(rpo)}`} unit={rpo ? L(" 条", " writes") : ""} tone={rpo > 0 ? "warn" : "ok"} hint={L("切换时丢的数据", "data lost on failover")} />
          <Kpi label="RTO" value={rto} unit="s" tone={rto > 30 ? "warn" : "ok"} hint={L("恢复服务用时", "time to recover")} />
          <Kpi label={L("切换后", "After failover")} value={L("DC-B 接管", "DC-B takes over")} tone="ok" />
          <Kpi label={L("多活优势", "Active-active win")} value={activeActive ? L("RTO 极短", "tiny RTO") : L("要拉起备用", "must promote")} tone={activeActive ? "ok" : "acc"} />
        </div>
      )}

      <Note mark="→" tone={failed && rpo > 0 ? "bad" : "on"}>
        {failed
          ? L(`机房 A 整体故障,流量切到 B。${mode === "sync" ? "同步复制下 RPO=0,一条数据都不丢——代价是刚才每次写都多等了一个跨机房往返。" : `异步复制下,还没来得及复制到 B 的那约 ${big(rpo)} 条写入丢了(RPO>0)——这就是快与不丢之间的取舍。`}${activeActive ? "因为是双活,B 本来就在服务,RTO 极短。" : "因为 B 只是只读备,还要先把它提升为主库,RTO 更长。"}`,
              `DC-A failed wholesale, traffic shifts to B. ${mode === "sync" ? "With synchronous replication RPO=0, not one write lost — at the cost that every write just paid an extra cross-DC round trip." : `With async, the ~${big(rpo)} writes not yet replicated to B are lost (RPO>0) — the trade between fast and lossless.`} ${activeActive ? "Because it is active-active, B was already serving, so RTO is tiny." : "Because B was a read replica, it must first be promoted, so RTO is longer."}`)
          : mode === "async" && staleReadRisk > 0.1
          ? L(`异步复制:写延迟低(本地即返回),但 B 落后约 ${big(replLag)}ms。如果用户写在 A、随后的读被路由到 B,他就可能读不到自己刚写的——「读己之写」在异地多活里要专门处理(粘连会话到同机房,或读主)。${conflictRisk > 0 ? "而双活下两地同时写同一条记录会冲突,最后写入者胜会丢数据。" : ""}`,
              `Async: low write latency (returns locally), but B lags ~${big(replLag)}ms. If a user writes in A and a following read routes to B, they may not see their own write — read-your-write needs explicit handling in active-active (sticky sessions to a DC, or read-from-primary). ${conflictRisk > 0 ? "And under active-active, both sites writing one record conflict, and last-write-wins loses data." : ""}`)
          : L("同步复制把 RPO 压到 0(不丢数据),代价是每次写都要等一个跨机房往返,写延迟涨上去。异步反过来:写得快,但故障切换时会丢一小段还没复制过去的数据。异地多活绕不开 RPO 和 RTO 这两个数字。", "Synchronous replication drives RPO to 0 (no data loss) at the cost of a cross-DC round trip on every write. Async is the reverse: fast writes, but a failover loses a slice not yet replicated. Multi-region cannot escape the two numbers RPO and RTO.")}
      </Note>
    </div>
  );
}

/* =========================================================
   sc22 · authLab — JWT / mTLS / zero-trust cost
   ========================================================= */
function AuthViz() {
  const L = useL();
  const [gwValidate, setGwValidate] = React.useState(true);
  const [expired, setExpired] = React.useState(false);
  const [mtls, setMtls] = React.useState(false);
  const [hops, setHops] = React.useState(4);

  const jwtVerify = 0.4;                 // ms per verify
  const handshake = 8;                   // ms per mTLS handshake (amortised)
  const perHopValidate = 0.4;            // each service re-verifies the JWT locally
  const overhead = (gwValidate ? jwtVerify : 0) + hops * perHopValidate + (mtls ? hops * handshake : 0);
  const blocked = expired && gwValidate;
  const lateralRisk = !mtls;             // without mTLS, a breached service can call others freely
  const perimeterOnly = gwValidate && !mtls;

  const chain = [L("网关", "gateway"), ...Array.from({ length: hops }, (_, i) => `svc-${i + 1}`)];

  return (
    <div>
      <VizHead idx="HA1" title={L("安全:身份逐跳传递,以及零信任的每跳成本", "Security: identity hop by hop, and the per-hop cost of zero trust")} />
      <div className="viz-ctrl">
        <Toggle label={L("网关校验 JWT", "Gateway validates JWT")} value={gwValidate} onChange={setGwValidate} />
        <Toggle label={L("令牌已过期", "Token expired")} value={expired} onChange={setExpired} />
        <Toggle label={L("服务间 mTLS(零信任)", "Service-to-service mTLS (zero trust)")} value={mtls} onChange={setMtls} />
        <Slider label={L("调用跳数", "Hops")} min={2} max={6} value={hops} onChange={setHops} />
      </div>

      <div className="sc-kpi-grid" style={{ marginTop: 12 }}>
        <Kpi label={L("鉴权开销/请求", "Auth overhead/req")} value={nf(overhead, 1)} unit="ms" tone={overhead > 30 ? "warn" : "ok"} />
        <Kpi label={L("请求结果", "Request outcome")} value={blocked ? L("网关拦截", "blocked at gw") : L("放行", "allowed")} tone={blocked ? "warn" : "ok"} />
        <Kpi label={L("安全模型", "Security model")} value={mtls ? L("零信任", "zero trust") : (gwValidate ? L("只守边界", "perimeter") : L("裸奔", "open"))} tone={mtls ? "ok" : (gwValidate ? "acc" : "warn")} />
        <Kpi label={L("横向移动风险", "Lateral-move risk")} value={lateralRisk ? L("高", "high") : L("低", "low")} tone={lateralRisk ? "warn" : "ok"} hint={lateralRisk ? L("破一个=进内网", "breach one = inside") : L("每跳都要证明", "prove each hop")} />
      </div>

      <div style={{ marginTop: 8 }}>
        <div className="sc-cap">{L("一次请求的鉴权链路", "the auth path of one request")}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
          {chain.map((c, i) => (
            <React.Fragment key={i}>
              <span style={{ font: "600 10px var(--f-mono)", padding: "4px 6px", borderRadius: 4, color: "#fff", background: blocked && i === 0 ? "#c0453f" : "var(--primary)", opacity: 0.9 }}>
                {c}{i === 0 && gwValidate ? " 🔑" : ""}{i > 0 && mtls ? " 🔒" : ""}
              </span>
              {i < chain.length - 1 && <span style={{ color: blocked ? "#c0453f" : "var(--muted)" }}>{blocked ? "✗" : "→"}</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <Note mark="→" tone={(!gwValidate || lateralRisk) ? "bad" : "on"}>
        {blocked
          ? L("令牌过期,网关一校验就拦下了——身份在门口验一次,后端不必信任来路不明的请求。JWT 自包含、验签快(不查库),代价是过期前难以即时吊销;需要即时吊销就用不透明令牌换取一次认证中心查询。", "The token is expired and the gateway blocked it — validate identity once at the door and backends need not trust unvetted requests. A JWT is self-contained and fast to verify (no lookup), at the cost of being hard to revoke before expiry; if you need instant revocation, an opaque token trades a lookup per call for it.")
          : !gwValidate
          ? L("网关不校验:未经认证的请求直接进了内网。这是最危险的配置——内网不是可信网。", "The gateway does not validate: unauthenticated requests walk straight into the internal network. This is the most dangerous setting — the internal network is not a trusted network.")
          : mtls
          ? L(`零信任:每一跳都用 mTLS 互相验明正身,默认谁都不信。代价是每请求多花约 ${nf(overhead, 1)}ms(${hops} 次握手+验签),换来的是即使某个服务被攻破,攻击者也无法在内网里随便横着调别的服务。`,
              `Zero trust: every hop uses mTLS to prove identity both ways, trusting no one by default. The cost is ~${nf(overhead, 1)}ms per request (${hops} handshakes + verifies), and the gain is that even if one service is breached the attacker cannot freely call others across the internal network.`)
          : L("只守边界:网关验了身份,但服务之间互相无条件信任。够用,但一旦某个服务被攻破,攻击者就能在内网里横向移动。要挡住横向移动,就得上服务间 mTLS(零信任),代价是每跳的握手开销。", "Perimeter only: the gateway validated identity, but services trust each other unconditionally. Fine until one service is breached, after which the attacker moves laterally. To stop lateral movement, add service-to-service mTLS (zero trust), at the cost of a handshake per hop.")}
      </Note>
    </div>
  );
}

/* =========================================================
   sc23 · chaosLab — failure injection & blast radius
   ========================================================= */
const CHAOS_TARGETS = [
  { v: "inventory", zh: "库存", en: "inventory" },
  { v: "payment", zh: "支付", en: "payment" },
  { v: "bank", zh: "银行接口", en: "bank API" },
];
function ChaosViz() {
  const L = useL();
  const [tgt, setTgt] = React.useState("payment");
  const [fault, setFault] = React.useState("latency"); // latency | error | kill
  const [resilient, setResilient] = React.useState(false);

  // dependency graph: checkout → order → {inventory, payment→bank}
  const nodes = {
    checkout: { name: L("下单", "checkout"), deps: ["order"] },
    order: { name: L("订单", "order"), deps: ["inventory", "payment"] },
    inventory: { name: L("库存", "inventory"), deps: [] },
    payment: { name: L("支付", "payment"), deps: ["bank"] },
    bank: { name: L("银行接口", "bank API"), deps: [] },
  };
  // propagate failure: a node fails if the injected target, OR (no resilience AND a dep failed)
  const failedSet = {};
  const evalNode = (k) => {
    if (failedSet[k] !== undefined) return failedSet[k];
    let f = (k === tgt);
    if (fault === "latency" && k === tgt) f = !resilient ? true : false; // latency only cascades w/o timeout
    for (const d of nodes[k].deps) { if (evalNode(d) && !resilient) f = true; }
    failedSet[k] = f; return f;
  };
  Object.keys(nodes).forEach(evalNode);
  const checkoutOk = !failedSet.checkout;
  const affected = Object.keys(nodes).filter((k) => failedSet[k]);
  const steadyOk = checkoutOk;

  return (
    <div>
      <VizHead idx="HA2" title={L("混沌工程:注入故障,验证韧性是真的还是配置里的摆设", "Chaos engineering: inject failure, verify resilience is real, not decorative")} />
      <div className="viz-ctrl">
        <label><span>{L("注入目标", "Inject into")}</span><Seg value={tgt} onChange={setTgt} options={CHAOS_TARGETS.map((s) => ({ v: s.v, l: L(s.zh, s.en) }))} /></label>
        <label><span>{L("故障类型", "Fault")}</span><Seg value={fault} onChange={setFault} options={[{ v: "latency", l: L("延迟", "latency") }, { v: "error", l: L("报错", "error") }, { v: "kill", l: L("杀实例", "kill") }]} /></label>
        <Toggle label={L("启用韧性(熔断+超时+隔离)", "Resilience (breaker+timeout+bulkhead)")} value={resilient} onChange={setResilient} />
      </div>

      <div className="sc-kpi-grid" style={{ marginTop: 12 }}>
        <Kpi label={L("注入", "Injected")} value={L(CHAOS_TARGETS.find((s) => s.v === tgt).zh, CHAOS_TARGETS.find((s) => s.v === tgt).en)} tone="warn" />
        <Kpi label={L("受影响服务", "Services affected")} value={affected.length} tone={affected.length > 2 ? "warn" : "acc"} />
        <Kpi label={L("稳态假设", "Steady state")} value={steadyOk ? L("守住 ✓", "holds ✓") : L("被打破 ✗", "broken ✗")} tone={steadyOk ? "ok" : "warn"} hint={L("下单成功率>99%", "checkout > 99%")} />
        <Kpi label={L("爆炸半径", "Blast radius")} value={pct(affected.length / 5)} tone={affected.length / 5 > 0.4 ? "warn" : "ok"} />
      </div>

      <div style={{ marginTop: 8 }}>
        <div className="sc-cap">{L("依赖图:红=故障,灰=受牵连", "dependency graph: red = faulted, grey = dragged down")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
          <ChaosRow k="checkout" nodes={nodes} failedSet={failedSet} />
          <div style={{ paddingLeft: 20 }}><ChaosRow k="order" nodes={nodes} failedSet={failedSet} /></div>
          <div style={{ paddingLeft: 40, display: "flex", gap: 6 }}>
            <ChaosRow k="inventory" nodes={nodes} failedSet={failedSet} />
            <ChaosRow k="payment" nodes={nodes} failedSet={failedSet} />
          </div>
          <div style={{ paddingLeft: 60 }}><ChaosRow k="bank" nodes={nodes} failedSet={failedSet} /></div>
        </div>
      </div>

      <Note mark="→" tone={!steadyOk ? "bad" : "on"}>
        {!steadyOk
          ? L(`注入的故障从「${L(CHAOS_TARGETS.find((s) => s.v === tgt).zh, CHAOS_TARGETS.find((s) => s.v === tgt).en)}」一路向上级联,拖垮了 ${affected.length} 个服务,连下单都挂了——因为没开韧性,故障沿着依赖链自由传播。打开韧性(熔断/超时/隔离),看它把爆炸半径关回一个服务。`,
              `The injected fault cascaded up from '${L(CHAOS_TARGETS.find((s) => s.v === tgt).zh, CHAOS_TARGETS.find((s) => s.v === tgt).en)}', dragging down ${affected.length} services including checkout — because resilience is off and the fault propagates freely along the dependency chain. Turn resilience on to watch it snap the blast radius back to one service.`)
          : L("韧性生效了:故障被熔断/超时/隔离关在了注入点附近,依赖它的上游降级但没被拖垮,下单成功率守住了稳态假设。这正是混沌工程要证明的——你配的容错不是配置文件里的一行摆设,它在真故障下真的起作用。没验证过的容错,就该假设它是坏的。", "Resilience held: the fault was contained near the injection point by breaking/timeout/bulkhead, upstream degraded but was not dragged down, and checkout kept the steady-state hypothesis. This is exactly what chaos engineering proves — your fault-tolerance is not a decorative config line, it actually works under real failure. Fault-tolerance you have not verified should be assumed broken.")}
      </Note>
    </div>
  );
}
function ChaosRow({ k, nodes, failedSet }) {
  const f = failedSet[k];
  return (
    <span style={{ font: "600 11px var(--f-mono)", padding: "5px 9px", borderRadius: 6, color: "#fff", display: "inline-block", width: "fit-content", background: f ? (k === "checkout" ? "#c0453f" : "var(--muted)") : "var(--primary)", opacity: f ? 0.92 : 0.9, border: f ? "1px solid #c0453f" : "none" }}>
      {nodes[k].name} {f ? "✗" : "✓"}
    </span>
  );
}

/* =========================================================
   sc24 · capstoneLab — end-to-end system + maturity radar
   ========================================================= */
const MATURITY_AXES = [
  { zh: "拆分与边界", en: "Boundaries" },
  { zh: "注册发现", en: "Discovery" },
  { zh: "弹性容错", en: "Resilience" },
  { zh: "网关与配置", en: "Gateway/Config" },
  { zh: "事务一致性", en: "Consistency" },
  { zh: "可观测性", en: "Observability" },
  { zh: "部署与伸缩", en: "Deploy/Scale" },
  { zh: "安全与容灾", en: "Security/DR" },
];
const ASSESS_KEY = "sc_book_assess";
function CapstoneViz() {
  const L = useL();
  const [load, setLoad] = React.useState(1.0);        // ×normal
  const [inject, setInject] = React.useState("none"); // none | downstream | dc
  const [scores, setScores] = React.useState(() => {
    try { const s = JSON.parse(localStorage.getItem(ASSESS_KEY)); if (Array.isArray(s) && s.length === 8) return s; } catch (e) {}
    return [2, 2, 1, 2, 1, 1, 1, 1];
  });
  const setScore = (i, v) => setScores((p) => { const n = [...p]; n[i] = v; try { localStorage.setItem(ASSESS_KEY, JSON.stringify(n)); } catch (e) {} return n; });

  // end-to-end health responds to load + fault
  const base = 0.999;
  const loadPenalty = load > 1 ? (load - 1) * 0.04 : 0;
  const faultPenalty = inject === "downstream" ? 0.008 : inject === "dc" ? 0.02 : 0;
  const success = clamp(base - loadPenalty - faultPenalty, 0.8, 1);
  const p99 = 120 * (1 + Math.max(0, load - 1) * 1.5) + (inject === "downstream" ? 60 : 0) + (inject === "dc" ? 90 : 0);
  const stages = [L("网关", "gateway"), L("订单", "order"), L("库存", "inventory"), L("支付", "payment"), L("事件", "events")];

  // maturity radar geometry
  const R = 62, cx = 80, cy = 80, N = 8;
  const pt = (i, r) => { const a = -Math.PI / 2 + i * 2 * Math.PI / N; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  const poly = scores.map((s, i) => pt(i, (s / 4) * R).join(",")).join(" ");
  const avg = scores.reduce((a, b) => a + b, 0) / 8;

  return (
    <div>
      <VizHead idx="HA3" title={L("综合实战:一条下单请求走完全场 + 微服务成熟度自评", "Capstone: one checkout through the whole system + a maturity self-assessment")} />
      <div className="viz-ctrl">
        <Slider label={L("负载(×日常)", "Load (×normal)")} min={0.5} max={5} step={0.5} value={load} onChange={setLoad} unit="×" />
        <label><span>{L("注入故障", "Inject fault")}</span><Seg value={inject} onChange={setInject} options={[{ v: "none", l: L("无", "none") }, { v: "downstream", l: L("下游挂", "downstream") }, { v: "dc", l: L("机房故障", "DC outage") }]} /></label>
      </div>

      <div style={{ marginTop: 8 }}>
        <div className="sc-cap">{L("一条下单请求的旅程", "the journey of one checkout")}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
          {stages.map((s, i) => (
            <React.Fragment key={i}>
              <span style={{ font: "600 10px var(--f-mono)", padding: "4px 7px", borderRadius: 4, color: "#fff", background: "var(--primary)", opacity: 0.9 }}>{s}</span>
              {i < stages.length - 1 && <span style={{ color: "var(--muted)" }}>→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="sc-kpi-grid" style={{ marginTop: 10 }}>
        <Kpi label={L("下单成功率", "Checkout success")} value={pct2(success)} tone={success < 0.99 ? "warn" : "ok"} />
        <Kpi label="P99" value={big(p99)} unit="ms" tone={p99 > 300 ? "warn" : "ok"} />
        <Kpi label={L("系统响应", "System responds")} value={inject === "none" ? L("平稳", "steady") : L("降级但存活", "degraded, alive")} tone={inject === "none" ? "ok" : "acc"} />
        <Kpi label={L("成熟度均分", "Maturity avg")} value={nf(avg, 1)} unit="/4" tone={avg >= 2.5 ? "ok" : "acc"} />
      </div>

      <div style={{ display: "flex", gap: 14, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
        <svg viewBox="0 0 160 172" width="180" style={{ flex: "0 0 auto" }}>
          {[0.25, 0.5, 0.75, 1].map((f, i) => (
            <polygon key={i} points={Array.from({ length: N }, (_, k) => pt(k, f * R).join(",")).join(" ")} fill="none" stroke="var(--hairline-strong)" strokeWidth="0.7" />
          ))}
          {Array.from({ length: N }, (_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--hairline)" strokeWidth="0.6" />; })}
          <polygon points={poly} fill="color-mix(in srgb, var(--primary) 26%, transparent)" stroke="var(--primary)" strokeWidth="1.6" />
          {MATURITY_AXES.map((a, i) => { const [x, y] = pt(i, R + 8); return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" style={{ font: "600 6.5px var(--f-mono)", fill: "var(--muted)" }}>{L(a.zh, a.en)}</text>; })}
        </svg>
        <div style={{ flex: "1 1 200px", minWidth: 200 }}>
          <div className="sc-cap">{L("给你自己的团队打分(0=没做 · 4=做到位)", "score your own team (0=none · 4=solid)")}</div>
          {MATURITY_AXES.map((a, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "84px 1fr 18px", gap: 6, alignItems: "center", margin: "3px 0" }}>
              <span style={{ font: "600 10px var(--f-mono)", color: "var(--muted)" }}>{L(a.zh, a.en)}</span>
              <input type="range" min={0} max={4} value={scores[i]} onChange={(e) => setScore(i, parseInt(e.target.value))} />
              <span style={{ font: "600 11px var(--f-mono)", textAlign: "right" }}>{scores[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <Note mark="→">
        {L("这条链路把整本书接了起来:网关鉴权限流 → 订单 → OpenFeign 调库存(带熔断)→ Seata 分布式事务 → 发出事件被异步消费,全程被链路追踪贯穿、经注册中心发现、由配置中心统一配置、容器化后在 K8s 上弹性伸缩、并跨机房多活。加压或注入故障,看它作为一个整体降级而不是崩溃。右边的雷达是八个模块的自评——分最低的那一格,就是你下一步该补的地方。", "This chain ties the whole book together: gateway auth+rate-limit → order → OpenFeign to inventory (with a breaker) → Seata distributed transaction → an event consumed asynchronously, all threaded by tracing, discovered via the registry, configured centrally, containerised and autoscaled on Kubernetes, and active-active across regions. Load it or inject a fault and watch it degrade rather than collapse as a whole. The radar is a self-assessment across the eight modules — your lowest spoke is what to shore up next.")}
      </Note>
    </div>
  );
}

/* =========================================================
   sc27 · meshLab — service mesh: library vs sidecar
   ========================================================= */
function MeshViz() {
  const L = useL();
  const [services, setServices] = React.useState(40);
  const [hops, setHops] = React.useState(4);
  // who owns each concern: false = Spring Cloud library, true = the mesh sidecar
  const [owner, setOwner] = React.useState({ mtls: true, retry: false, breaking: false, lb: false, canary: true, tracing: false });
  const flip = (k) => setOwner((o) => ({ ...o, [k]: !o[k] }));

  const CONCERNS = [
    { key: "mtls", label: L("mTLS 加密", "mTLS"), lib: L("逐服务手配 TLS/JWT", "manual TLS per service"), mesh: L("自动双向 TLS", "automatic mTLS") },
    { key: "retry", label: L("重试/超时", "retry/timeout"), lib: "Resilience4j @Retry", mesh: "VirtualService retries" },
    { key: "breaking", label: L("熔断", "breaking"), lib: "@CircuitBreaker", mesh: "outlierDetection" },
    { key: "lb", label: L("负载均衡", "load balancing"), lib: "Spring Cloud LB", mesh: L("Envoy 负载均衡", "Envoy LB") },
    { key: "canary", label: L("灰度/流量切分", "canary/split"), lib: L("网关权重(仅边缘)", "gateway weight (edge)"), mesh: L("服务间权重", "service-to-service") },
    { key: "tracing", label: L("链路追踪", "tracing"), lib: L("Micrometer 埋点", "Micrometer instrument"), mesh: L("Envoy 自动 span", "Envoy auto spans") },
  ];

  const sidecarHop = 0.35;                          // ms per sidecar traversal
  const latencyTax = hops * 2 * sidecarHop;         // every hop crosses 2 sidecars
  const baseLatency = hops * 2;                      // ms of app + network work
  const taxPct = latencyTax / baseLatency;
  const fleetRam = services * 100;                  // MB, ~100MB per Envoy sidecar
  const offloaded = CONCERNS.filter((c) => owner[c.key]).length;
  const inApp = CONCERNS.length - offloaded;
  const verdict = offloaded === 0 ? L("白交税", "paying, gaining nothing")
    : offloaded >= 5 ? L("薄应用·多语言统一", "thin app · polyglot")
      : L("库与网格混合", "library + mesh mix");

  const Cell = ({ text, own }) => (
    <div style={{ flex: 1, padding: "5px 8px", font: "500 10.5px var(--f-mono)", borderRadius: 4, cursor: "default",
      background: own ? "color-mix(in srgb, #2e9e6b 16%, transparent)" : "transparent",
      color: own ? "var(--ink)" : "var(--muted)", border: own ? "1px solid color-mix(in srgb,#2e9e6b 45%,transparent)" : "1px solid transparent" }}>
      {own ? "✓ " : ""}{text}
    </div>
  );

  return (
    <div>
      <VizHead idx="OP4" title={L("服务网格:哪些治理下沉到 sidecar,代价是什么", "Service mesh: which governance moves to the sidecar, and at what cost")} />
      <div className="viz-ctrl">
        <Slider label={L("服务数(集群)", "Services (fleet)")} min={5} max={120} value={services} onChange={setServices} />
        <Slider label={L("每请求跳数", "Hops per request")} min={1} max={6} value={hops} onChange={setHops} />
      </div>

      <div className="sc-kpi-grid" style={{ marginTop: 12 }}>
        <Kpi label={L("每请求延迟税", "Latency tax/req")} value={"+" + nf(latencyTax, 1)} unit="ms" tone={taxPct > 0.25 ? "warn" : "acc"} hint={L(`基线的 ${pct(taxPct)}`, `${pct(taxPct)} of baseline`)} />
        <Kpi label={L("边车内存开销", "Sidecar RAM")} value={nf(fleetRam / 1024, 1)} unit=" GB" tone={fleetRam > 4096 ? "warn" : "ok"} hint={L(`${services} 个 Envoy`, `${services} Envoys`)} />
        <Kpi label={L("下沉到网格", "Offloaded to mesh")} value={`${offloaded}/6`} tone={offloaded === 0 ? "warn" : "acc"} hint={L(`${inApp} 项仍在库里`, `${inApp} still in libs`)} />
        <Kpi label={L("结论", "Verdict")} value={verdict} tone={offloaded === 0 ? "warn" : offloaded >= 5 ? "ok" : ""} />
      </div>

      <div style={{ marginTop: 10 }}>
        <div className="sc-cap">{L("单次请求延迟:应用+网络 vs sidecar 税", "per-request latency: app+network vs sidecar tax")}</div>
        <Bar label={L("应用 + 网络", "app + network")} value={baseLatency} max={baseLatency + latencyTax} tone="ok" valText={nf(baseLatency, 1) + "ms"} />
        <Bar label={L("+ sidecar 税", "+ sidecar tax")} value={latencyTax} max={baseLatency + latencyTax} tone={taxPct > 0.25 ? "warn" : "acc"} valText={"+" + nf(latencyTax, 1) + "ms"} />
      </div>

      <div style={{ marginTop: 10 }}>
        <div className="sc-cap">{L("点击切换每个关注点由「库」还是「网格」来做（绿=当前归属）", "click to assign each concern to 'library' or 'mesh' (green = current owner)")}</div>
        <div style={{ display: "flex", gap: 6, padding: "0 8px 3px", font: "600 10px var(--f-mono)", color: "var(--muted)" }}>
          <div style={{ width: 92 }} /><div style={{ flex: 1 }}>{L("Spring Cloud 库", "Spring Cloud lib")}</div><div style={{ flex: 1 }}>{L("服务网格", "service mesh")}</div>
        </div>
        {CONCERNS.map((c) => (
          <div key={c.key} onClick={() => flip(c.key)} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3, cursor: "pointer" }}>
            <div style={{ width: 88, font: "600 10.5px var(--f-mono)", color: "var(--ink)" }}>{c.label}</div>
            <Cell text={c.lib} own={!owner[c.key]} />
            <Cell text={c.mesh} own={owner[c.key]} />
          </div>
        ))}
      </div>

      <Note mark="→" tone={offloaded === 0 ? "bad" : "on"}>
        {offloaded === 0
          ? L(`你把每个关注点都留在了 Spring Cloud 库里,却还跑着网格——于是白交延迟税(+${nf(latencyTax, 1)}ms/请求)和 ${nf(fleetRam / 1024, 1)}GB 边车内存,一分好处没拿到。要么把 mTLS、重试、灰度这些下沉给网格,要么干脆别上网格。`,
              `You left every concern in the Spring Cloud libraries yet still run a mesh — so you pay the latency tax (+${nf(latencyTax, 1)}ms/req) and ${nf(fleetRam / 1024, 1)}GB of sidecar RAM for nothing. Either offload mTLS, retries and canary to the mesh, or do not run a mesh at all.`)
          : L(`网格把 ${offloaded} 项横切关注点从代码里搬到了 sidecar:它们对 Go/Node/Python 服务同样生效,升级不用改代码。代价是每请求 +${nf(latencyTax, 1)}ms(基线的 ${pct(taxPct)})和 ${nf(fleetRam / 1024, 1)}GB 边车内存。最关键的一条:同一件事只能选一个归属——如果重试既在 @Retry 又在网格里,重试次数会相乘、放大成风暴;mTLS 两边都做则纯属浪费。`,
              `The mesh moved ${offloaded} cross-cutting concerns out of code into the sidecar: they work identically for Go/Node/Python services and upgrade without code changes. The cost is +${nf(latencyTax, 1)}ms per request (${pct(taxPct)} of baseline) and ${nf(fleetRam / 1024, 1)}GB of sidecar RAM. The crucial rule: pick ONE owner per concern — if retries live in both @Retry and the mesh, the attempt counts multiply into a storm, and doing mTLS in both is pure waste.`)}
      </Note>
    </div>
  );
}

/* =========================================================
   Registry + <Viz>
   ========================================================= */
const VIZ = {
  ...(window.__SC_VIZ_1 || {}),
  ...(window.__SC_VIZ_2 || {}),
  ...(window.__SC_VIZ_3 || {}),
  placementLab: PlacementViz,
  autoscaleLab: AutoscaleViz,
  multiDCLab: MultiDCViz,
  authLab: AuthViz,
  chaosLab: ChaosViz,
  capstoneLab: CapstoneViz,
  meshLab: MeshViz,
};

const Viz = ({ name }) => {
  const C = VIZ[name];
  if (!C) return null;
  return <div className="sc-viz"><C /></div>;
};

window.VIZ = VIZ;
window.Viz = Viz;
