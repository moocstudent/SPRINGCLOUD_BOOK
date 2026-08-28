/* =========================================================
   viz3.jsx — benches for Module V–VI (sc13–sc18)
   ---------------------------------------------------------
   Uses the shared helpers declared in viz.jsx (same global
   lexical scope). Exported as window.__SC_VIZ_3.
   ========================================================= */

/* =========================================================
   sc13 · streamLab — partitions, consumers, lag
   ========================================================= */
function StreamViz() {
  const L = useL();
  const [produce, setProduce] = React.useState(1200);   // msg/s produced
  const [parts, setParts] = React.useState(4);          // topic partitions
  const [cons, setCons] = React.useState(6);            // consumers in the group
  const perCons = 250;                                  // each consumer processes msg/s

  const effective = Math.min(cons, parts);              // consumers beyond partitions sit idle
  const idle = Math.max(0, cons - parts);
  const capacity = effective * perCons;
  const lagGrowing = produce > capacity;
  const lagRate = Math.max(0, produce - capacity);      // msg/s piling up

  // partition → consumer assignment
  const assign = Array.from({ length: parts }, (_, i) => (i % cons));

  return (
    <div>
      <VizHead idx="TX1" title={L("Spring Cloud Stream:分区数怎么给消费并行度封顶", "Spring Cloud Stream: how partitions cap consumer parallelism")} />
      <div className="viz-ctrl">
        <Slider label={L("生产速率", "Produce rate")} min={200} max={3000} step={100} value={produce} onChange={setProduce} unit=" msg/s" />
        <Slider label={L("分区数", "Partitions")} min={1} max={12} value={parts} onChange={setParts} />
        <Slider label={L("消费者数", "Consumers")} min={1} max={12} value={cons} onChange={setCons} />
      </div>

      <div className="sc-kpi-grid" style={{ marginTop: 12 }}>
        <Kpi label={L("有效消费者", "Effective consumers")} value={effective} tone={idle ? "warn" : "ok"} hint={idle ? L(`${idle} 台空转`, `${idle} idle`) : L("全部在干活", "all working")} />
        <Kpi label={L("消费能力", "Consume capacity")} value={big(capacity)} unit=" msg/s" tone={lagGrowing ? "warn" : "ok"} />
        <Kpi label={L("积压增长", "Lag growth")} value={lagGrowing ? `+${big(lagRate)}` : "0"} unit=" msg/s" tone={lagGrowing ? "warn" : "ok"} />
        <Kpi label={L("状态", "Status")} value={lagGrowing ? L("追不上", "falling behind") : L("跟得上", "keeping up")} tone={lagGrowing ? "warn" : "ok"} />
      </div>

      <div style={{ marginTop: 8 }}>
        <div className="sc-cap">{L("每个分区分给一个消费者;消费者比分区多,多出来的空转", "each partition goes to one consumer; consumers beyond partitions sit idle")}</div>
        <Boxes items={Array.from({ length: parts }, (_, i) => ({ label: `P${i}→C${assign[i]}`, state: "ok" }))} />
        {idle > 0 && <Boxes items={Array.from({ length: idle }, (_, i) => ({ label: `C${parts + i} 💤`, state: "idle" }))} />}
      </div>

      <Note mark="→" tone={lagGrowing ? "bad" : "on"}>
        {idle > 0
          ? L(`你有 ${cons} 个消费者,但只有 ${parts} 个分区——多出的 ${idle} 个消费者拿不到分区,纯粹空转。分区数是并行度的硬上限:想提高消费能力,先加分区,再加消费者。`,
              `You have ${cons} consumers but only ${parts} partitions — the extra ${idle} get no partition and sit idle. Partition count is the hard ceiling on parallelism: to raise throughput, add partitions first, then consumers.`)
          : lagGrowing
          ? L(`生产 ${big(produce)} 超过了消费能力 ${big(capacity)},积压以每秒 ${big(lagRate)} 条的速度堆积。加分区+消费者提升消费能力,否则延迟会越拖越长。`,
              `Production ${big(produce)} exceeds the consume capacity ${big(capacity)}, and lag piles up at ${big(lagRate)}/s. Add partitions and consumers to raise capacity, or latency grows without bound.`)
          : L("消费跟得上生产,没有积压。注意消费者增减会触发一次重平衡:分区重新分配,期间短暂暂停消费。", "Consumers keep up, no lag. Note that adding or removing a consumer triggers a rebalance: partitions are reassigned and consumption briefly pauses.")}
      </Note>
    </div>
  );
}

/* =========================================================
   sc14 · sagaLab — 2PC vs TCC vs Saga
   ========================================================= */
const TX_MODES = [
  { v: "2pc", zh: "2PC/XA", en: "2PC/XA" },
  { v: "tcc", zh: "TCC", en: "TCC" },
  { v: "saga", zh: "Saga", en: "Saga" },
];
function SagaViz() {
  const L = useL();
  const [mode, setMode] = React.useState("saga");
  const [failAt, setFailAt] = React.useState(3);     // 0 = no failure; else step index (1-based)
  const steps = [L("订单", "Order"), L("库存", "Inventory"), L("支付", "Payment")];
  const stepMs = 60;                                  // each local step
  const fails = failAt > 0 && failAt <= steps.length;

  // lock duration (ms the resource is locked)
  let lock, window_, comps, blocking, consistency;
  if (mode === "2pc") {
    lock = stepMs * steps.length * 2;                 // locked through prepare + commit of ALL
    window_ = 0;                                      // strongly consistent, no visible window
    comps = 0; blocking = true; consistency = L("强一致", "strong");
  } else if (mode === "tcc") {
    lock = stepMs;                                    // short reserve, then confirm
    window_ = stepMs * 2;
    comps = fails ? failAt - 1 : 0;
    blocking = false; consistency = L("最终一致", "eventual");
  } else { // saga
    lock = stepMs;                                    // one local txn at a time
    window_ = fails ? stepMs * failAt : stepMs * steps.length; // committed-but-not-final
    comps = fails ? failAt - 1 : 0;
    blocking = false; consistency = L("最终一致", "eventual");
  }
  const outcome = fails ? (comps > 0 ? L(`补偿 ${comps} 步`, `compensate ${comps}`) : L("直接失败", "fail")) : L("全部提交", "all commit");

  return (
    <div>
      <VizHead idx="TX2" title={L("分布式事务:锁得久,还是补偿难", "Distributed transactions: long locks, or hard compensation")} />
      <div className="viz-ctrl">
        <label><span>{L("事务模式", "Mode")}</span><Seg value={mode} onChange={setMode} options={TX_MODES.map((m) => ({ v: m.v, l: L(m.zh, m.en) }))} /></label>
        <Slider label={L("在第几步失败(0=不失败)", "Fail at step (0=none)")} min={0} max={3} value={failAt} onChange={setFailAt} />
      </div>

      <div className="sc-kpi-grid" style={{ marginTop: 12 }}>
        <Kpi label={L("锁定时长", "Lock duration")} value={lock} unit="ms" tone={lock > 200 ? "warn" : "ok"} hint={mode === "2pc" ? L("全程持锁", "held throughout") : L("单步短锁", "short per-step")} />
        <Kpi label={L("不一致窗口", "Inconsistency window")} value={window_} unit="ms" tone={window_ > 0 ? "acc" : "ok"} />
        <Kpi label={L("补偿操作", "Compensations")} value={comps} tone={comps > 0 ? "warn" : "ok"} />
        <Kpi label={L("一致性", "Consistency")} value={consistency} tone={mode === "2pc" ? "ok" : "acc"} hint={blocking ? L("阻塞", "blocking") : L("非阻塞", "non-blocking")} />
      </div>

      <div style={{ marginTop: 8 }}>
        <div className="sc-cap">{mode === "2pc" ? L("2PC:所有参与者被锁到最后一起提交", "2PC: all participants locked until they commit together") : L("每步一个本地事务;失败则反向补偿已提交的步骤", "one local txn per step; on failure, compensate committed steps in reverse")}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
          {steps.map((s, i) => {
            const done = !fails || i < failAt - 1;
            const isFail = fails && i === failAt - 1;
            const compensated = fails && i < failAt - 1 && mode !== "2pc";
            const st = isFail ? "dead" : compensated ? "warn" : done ? "ok" : "idle";
            return <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Boxes items={[{ label: s + (isFail ? " ✗" : compensated ? " ↩" : done ? " ✓" : ""), state: st }]} />
              {i < steps.length - 1 && <span style={{ color: "var(--muted)" }}>→</span>}
            </div>;
          })}
        </div>
      </div>

      <Note mark="→">
        {mode === "2pc"
          ? L(`2PC 用强一致换来了阻塞:三个参与者从准备到提交全程持锁 ${lock}ms,任何一个慢或挂,所有人一起卡住。没有不一致窗口(要么全成要么全败),但可用性押在了协调者身上。`,
              `2PC buys strong consistency with blocking: three participants hold locks for the full ${lock}ms from prepare to commit, and any one being slow or dead jams them all. No inconsistency window (all-or-nothing), but availability is staked on the coordinator.`)
          : fails
          ? L(`Saga/TCC:前 ${failAt - 1} 步已经各自提交,第 ${failAt} 步失败,于是反向补偿那 ${comps} 步。注意补偿不是回滚——库存已经扣了,补偿是「再加回去」,而在补偿完成前有一段 ${window_}ms 的可观测不一致窗口。换来的是短锁、非阻塞。`,
              `Saga/TCC: the first ${failAt - 1} steps each already committed, step ${failAt} fails, so compensate those ${comps} steps in reverse. Note compensation is not rollback — inventory was decremented and the compensation 'adds it back', with a ${window_}ms observable inconsistency window until it finishes. In exchange: short locks, non-blocking.`)
          : L("全部步骤提交成功。Saga 用一串带补偿的本地事务换来了短锁和高可用,代价是最终一致而非强一致——分布式世界里,这两者你只能选一个。", "Every step committed. Saga trades a chain of compensable local transactions for short locks and high availability, at the price of eventual rather than strong consistency — in a distributed world you pick one.")}
      </Note>
    </div>
  );
}

/* =========================================================
   sc15 · idempotentLab — dedup + outbox
   ========================================================= */
function IdempotentViz() {
  const L = useL();
  const [msgs, setMsgs] = React.useState(1000);
  const [dups, setDups] = React.useState(1.4);       // avg deliveries per message (at-least-once)
  const [idem, setIdem] = React.useState(false);
  const [crash, setCrash] = React.useState(0.15);    // crash between DB commit and message send
  const [outbox, setOutbox] = React.useState(false);

  const deliveries = Math.round(msgs * dups);
  const executions = idem ? msgs : deliveries;         // without idempotency, every delivery runs
  const doubleCharges = idem ? 0 : deliveries - msgs;  // extra executions
  const lostEvents = outbox ? 0 : Math.round(msgs * crash); // dual-write loses events on crash
  const correct = doubleCharges === 0 && lostEvents === 0;

  return (
    <div>
      <VizHead idx="TX3" title={L("至少一次投递:幂等挡重复,发件箱挡丢失", "At-least-once: idempotency stops duplicates, the outbox stops loss")} />
      <div className="viz-ctrl">
        <Slider label={L("逻辑消息数", "Logical messages")} min={100} max={5000} step={100} value={msgs} onChange={setMsgs} />
        <Slider label={L("平均投递次数", "Avg deliveries each")} min={1} max={3} step={0.1} value={dups} onChange={setDups} unit="×" />
        <Slider label={L("崩溃率(写库与发消息之间)", "Crash rate (between DB & send)")} min={0} max={0.4} step={0.05} value={crash} onChange={setCrash} fmt={pct} />
        <Toggle label={L("幂等消费(唯一ID去重)", "Idempotent consume (dedup by id)")} value={idem} onChange={setIdem} />
        <Toggle label={L("发件箱模式(outbox)", "Outbox pattern")} value={outbox} onChange={setOutbox} />
      </div>

      <div className="sc-kpi-grid" style={{ marginTop: 12 }}>
        <Kpi label={L("实际投递", "Deliveries")} value={big(deliveries)} tone="acc" hint={L("至少一次 → 有重复", "at-least-once → repeats")} />
        <Kpi label={L("业务被执行", "Executions")} value={big(executions)} tone={executions > msgs ? "warn" : "ok"} />
        <Kpi label={L("重复扣款", "Double charges")} value={big(doubleCharges)} tone={doubleCharges > 0 ? "warn" : "ok"} hint={doubleCharges > 0 ? L("每一笔都是投诉", "each is a complaint") : ""} />
        <Kpi label={L("丢失事件", "Lost events")} value={big(lostEvents)} tone={lostEvents > 0 ? "warn" : "ok"} />
      </div>

      <div style={{ marginTop: 10 }}>
        <Bar label={L("逻辑消息(应执行次数)", "Logical (should run)")} value={msgs} max={deliveries} tone="ok" valText={big(msgs)} />
        <Bar label={L("实际执行", "Actually run")} value={executions} max={deliveries} tone={executions > msgs ? "warn" : "ok"} valText={big(executions)} />
        <Bar label={L("因崩溃丢失的事件", "Events lost to crash")} value={lostEvents} max={deliveries} tone="warn" valText={big(lostEvents)} />
      </div>

      <Note mark="→" tone={correct ? "on" : "bad"}>
        {correct
          ? L("幂等 + 发件箱都开着:重复投递被唯一 ID 去重,业务只执行 msgs 次;发件箱把「写库」和「发消息」放进同一个本地事务,崩溃也不会丢事件。这才是分布式消息能上生产的样子。", "Idempotency and the outbox are both on: redelivery is deduped by unique id so the business runs exactly msgs times, and the outbox writes 'update DB' and 'send message' in one local transaction so a crash loses no event. This is what production-ready distributed messaging looks like.")
          : doubleCharges > 0 && lostEvents > 0
          ? L(`两个洞同时漏:没有幂等,${big(deliveries)} 次投递全部执行,多扣了 ${big(doubleCharges)} 笔;没有发件箱,崩溃又丢了 ${big(lostEvents)} 个事件。至少一次投递意味着重复是常态——幂等和发件箱都不是可选项。`,
              `Both holes leak: without idempotency all ${big(deliveries)} deliveries run and ${big(doubleCharges)} extra charges happen; without the outbox a crash also loses ${big(lostEvents)} events. At-least-once means duplicates are the norm — neither idempotency nor the outbox is optional.`)
          : doubleCharges > 0
          ? L(`没有幂等:同一条消息被投递多次就执行多次,多出 ${big(doubleCharges)} 次重复扣款。给每条消息一个唯一业务 ID、处理前先查去重表即可根治。`,
              `Without idempotency: a message delivered multiple times runs multiple times — ${big(doubleCharges)} double charges. Cure it with a unique business id and a dedup check before processing.`)
          : L(`没有发件箱:在「写完库」和「发出消息」之间崩溃,就丢了 ${big(lostEvents)} 个事件。把待发消息和业务数据写进同一个本地事务(发件箱),再由单独的进程可靠投递。`,
              `Without the outbox: a crash between 'DB committed' and 'message sent' lost ${big(lostEvents)} events. Write the outgoing message and the business data in one local transaction (the outbox), and let a separate relay deliver it reliably.`)}
      </Note>
    </div>
  );
}

/* =========================================================
   sc16 · traceLab — the span waterfall
   ========================================================= */
const TRACE_SVCS = [
  { v: "order", zh: "订单", en: "order" },
  { v: "inventory", zh: "库存", en: "inventory" },
  { v: "payment", zh: "支付", en: "payment" },
  { v: "bank", zh: "银行接口", en: "bank API" },
];
function TraceViz() {
  const L = useL();
  const [slow, setSlow] = React.useState("payment");
  const [extra, setExtra] = React.useState(700);
  const [sample, setSample] = React.useState(0.1);

  const add = (k) => (slow === k ? extra : 0);
  // build spans (start, dur) along the critical path
  const gwStart = 0;
  const orderStart = 8, orderSelf = 12;
  const invStart = orderStart + 6, invDur = 40 + add("inventory");
  const payStart = invStart + invDur + 6, paySelf = 20 + add("payment");
  const bankStart = payStart + 8, bankDur = 90 + add("bank");
  const payDur = paySelf + 8 + bankDur;
  const orderDur = orderSelf + (invStart - orderStart) + invDur + 6 + payDur + 8;
  const total = 8 + orderDur + 10;
  const spans = [
    { name: L("网关", "gateway"), start: gwStart, dur: total, depth: 0, key: "gw" },
    { name: L("订单", "order"), start: orderStart, dur: orderDur, depth: 1, key: "order" },
    { name: L("库存", "inventory"), start: invStart, dur: invDur, depth: 2, key: "inventory" },
    { name: L("支付", "payment"), start: payStart, dur: payDur, depth: 2, key: "payment" },
    { name: L("银行接口", "bank API"), start: bankStart, dur: bankDur, depth: 3, key: "bank" },
  ];
  const slowest = spans.filter((s) => s.depth > 0).reduce((a, b) => (b.dur > a.dur ? b : a));
  const W = 320, rowH = 20;

  return (
    <div>
      <VizHead idx="OB1" title={L("链路追踪:一张瀑布图一眼定位那根最长的条", "Tracing: one waterfall pins the longest bar at a glance")} />
      <div className="viz-ctrl">
        <label><span>{L("哪个服务变慢", "Which service is slow")}</span><Seg value={slow} onChange={setSlow} options={TRACE_SVCS.map((s) => ({ v: s.v, l: L(s.zh, s.en) }))} /></label>
        <Slider label={L("额外延迟", "Extra latency")} min={0} max={1500} step={50} value={extra} onChange={setExtra} unit="ms" />
        <Slider label={L("采样率", "Sampling rate")} min={0.01} max={1} step={0.01} value={sample} onChange={setSample} fmt={pct} />
      </div>

      <div className="sc-kpi-grid" style={{ marginTop: 12 }}>
        <Kpi label={L("总耗时", "Total latency")} value={big(total)} unit="ms" tone={total > 400 ? "warn" : "ok"} />
        <Kpi label={L("最慢的一跳", "Slowest span")} value={slowest.name} tone="warn" hint={`${big(slowest.dur)}ms`} />
        <Kpi label={L("占总时长", "Share of total")} value={pct(slowest.dur / total)} tone="acc" />
        <Kpi label={L("采样开销", "Sampled")} value={pct(sample)} tone={sample > 0.5 ? "warn" : "ok"} hint={L("越高越贵越全", "higher = costlier, fuller")} />
      </div>

      <div style={{ marginTop: 8 }}>
        <div className="sc-cap">{L("瀑布图:每根条是一个 span,横坐标是时间", "waterfall: each bar is a span, x is time")}</div>
        <svg viewBox={`0 0 ${W} ${spans.length * rowH + 8}`} width="100%" style={{ display: "block" }}>
          {spans.map((s, i) => {
            const x = 4 + (s.start / total) * (W - 60);
            const w = Math.max(2, (s.dur / total) * (W - 60));
            const isSlow = s.key === slow && s.depth > 0;
            return (
              <g key={i}>
                <rect x={x} y={i * rowH + 4} width={w} height={rowH - 6} rx={2}
                  fill={isSlow ? "#c0453f" : (s.depth === 0 ? "var(--muted)" : "var(--primary)")}
                  opacity={s.depth === 0 ? 0.35 : 0.9} />
                <text x={x + 3} y={i * rowH + 4 + rowH / 2} dominantBaseline="middle" style={{ font: "600 9px var(--f-mono)", fill: w > 60 ? "#fff" : "var(--fg)" }}>{s.name} {big(s.dur)}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <Note mark="→">
        {L(`用户说「下单慢」。瀑布图立刻告诉你:总共 ${big(total)}ms,其中「${slowest.name}」这一跳占了 ${pct(slowest.dur / total)}——不用猜、不用逐台看日志。TraceId 通过 HTTP 头在每个服务间传递,把散落的 span 编成同一条 trace。采样率 ${pct(sample)}:调高看得更全但更贵,生产上常按 1%~10% 采样并对错误请求全采。`,
            `The user says 'checkout is slow'. The waterfall tells you at once: ${big(total)}ms total, and the '${slowest.name}' hop took ${pct(slowest.dur / total)} of it — no guessing, no log-by-log hunting. The TraceId rides HTTP headers between services, stitching scattered spans into one trace. Sampling at ${pct(sample)}: higher sees more but costs more; production often samples 1–10% and captures all errors.`)}
      </Note>
    </div>
  );
}

/* =========================================================
   sc17 · sloLab — P99 vs the average
   ========================================================= */
function SloViz() {
  const L = useL();
  const [rate, setRate] = React.useState(700);
  const [capacity, setCapacity] = React.useState(1000);
  const [tailFrac, setTailFrac] = React.useState(0.02);
  const [slo, setSlo] = React.useState(300);
  const fast = 20, tail = 1200;
  // queueing pressure: as rate → capacity, more requests spill into the slow tail
  const util = clamp(rate / capacity, 0, 0.999);
  const effTail = clamp(tailFrac + util * util * 0.15, 0, 0.7);
  const avg = (1 - effTail) * fast + effTail * tail + 40 * util / (1 - util + 0.001) * 0.02;
  const p99 = effTail >= 0.01 ? tail * (0.7 + util) : fast * 3;
  const p999 = tail * (1 + util);
  const overSlo = effTail * (tail > slo ? 1 : 0) + (fast > slo ? (1 - effTail) : 0);
  const compliance = 1 - overSlo;

  // histogram buckets
  const buckets = [10, 20, 50, 100, 300, 700, 1200, 2000];
  const hist = buckets.map((b, i) => {
    if (b <= fast * 2) return (1 - effTail) * (i === 1 ? 0.8 : 0.1);
    if (b >= tail * 0.8) return effTail * (i >= buckets.length - 2 ? 0.5 : 0.2);
    return effTail * 0.1 + util * 0.03;
  });
  const hmax = Math.max(...hist);

  return (
    <div>
      <VizHead idx="OB2" title={L("SLO:为什么盯平均值会让你瞎掉", "SLO: why watching the average blinds you")} />
      <div className="viz-ctrl">
        <Slider label={L("请求速率", "Request rate")} min={100} max={999} step={20} value={rate} onChange={(v) => setRate(Math.min(v, capacity - 1))} unit=" rps" />
        <Slider label={L("单实例容量", "Capacity")} min={400} max={1500} step={50} value={capacity} onChange={setCapacity} unit=" rps" />
        <Slider label={L("慢请求基础比例", "Base tail fraction")} min={0} max={0.1} step={0.005} value={tailFrac} onChange={setTailFrac} fmt={pct1} />
        <Slider label={L("SLO 目标", "SLO target")} min={100} max={800} step={50} value={slo} onChange={setSlo} unit="ms" />
      </div>

      <div className="sc-kpi-grid" style={{ marginTop: 12 }}>
        <Kpi label={L("平均延迟", "Average")} value={big(avg)} unit="ms" tone="ok" hint={L("看起来很健康", "looks healthy")} />
        <Kpi label="P99" value={big(p99)} unit="ms" tone={p99 > slo ? "warn" : "ok"} hint={L("用户真实感受", "what users feel")} />
        <Kpi label="P99.9" value={big(p999)} unit="ms" tone={p999 > slo ? "warn" : "ok"} />
        <Kpi label={L("SLO 达标率", "SLO compliance")} value={pct2(compliance)} tone={compliance < 0.99 ? "warn" : "ok"} hint={L(`快于 ${slo}ms`, `faster than ${slo}ms`)} />
      </div>

      <div style={{ marginTop: 8 }}>
        <div className="sc-cap">{L("延迟分布(长尾);平均落在左边,P99 在右边的尾巴里", "latency distribution (long tail); the average sits left, P99 lives in the right tail")}</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 70, marginTop: 4 }}>
          {buckets.map((b, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ height: `${(hist[i] / hmax) * 56}px`, background: b > slo ? "#c0453f" : "var(--primary)", opacity: 0.85, borderRadius: "2px 2px 0 0" }} />
              <div style={{ font: "500 8px var(--f-mono)", color: "var(--muted)", marginTop: 2 }}>{b}</div>
            </div>
          ))}
        </div>
      </div>

      <Note mark="→" tone={p99 > slo ? "bad" : "on"}>
        {L(`平均延迟 ${big(avg)}ms 看起来非常健康,但 P99 是 ${big(p99)}ms——${p99 > slo ? `已经越过了 ${slo}ms 的 SLO,那 1% 的用户体验糟透了。` : "还在 SLO 之内。"}把请求速率往容量线上拉:平均值几乎纹丝不动,P99 却随排队迅速爆表。真正决定用户体验的是尾延迟,不是平均值。SLO + 错误预算把「可靠性」变成一个能量化、能花的预算。`,
            `The average of ${big(avg)}ms looks very healthy, but P99 is ${big(p99)}ms — ${p99 > slo ? `already past the ${slo}ms SLO, and those 1% of users have a terrible time.` : "still within the SLO."} Push the rate toward capacity: the average barely moves while P99 blows out with queueing. Tail latency, not the average, decides user experience. SLOs plus error budgets turn 'reliability' into a quantity you can measure and spend.`)}
      </Note>
    </div>
  );
}

/* =========================================================
   sc18 · logLab — traceId correlation + sampling cost
   ========================================================= */
const LOG_LINES = [
  { svc: "gateway", tid: "a1", msg: { zh: "收到 POST /checkout", en: "POST /checkout received" } },
  { svc: "order", tid: "b2", msg: { zh: "创建订单 #5001", en: "create order #5001" } },
  { svc: "gateway", tid: "a1", msg: { zh: "鉴权通过 user=42", en: "auth ok user=42" } },
  { svc: "inventory", tid: "c3", msg: { zh: "扣减库存 SKU=9", en: "decrement stock SKU=9" } },
  { svc: "order", tid: "a1", msg: { zh: "创建订单 #5002", en: "create order #5002" } },
  { svc: "payment", tid: "b2", msg: { zh: "支付超时,重试", en: "payment timeout, retry" } },
  { svc: "inventory", tid: "a1", msg: { zh: "扣减库存 SKU=7", en: "decrement stock SKU=7" } },
  { svc: "payment", tid: "a1", msg: { zh: "调用银行接口耗时 812ms", en: "bank API took 812ms" } },
  { svc: "order", tid: "c3", msg: { zh: "创建订单 #5003", en: "create order #5003" } },
  { svc: "payment", tid: "a1", msg: { zh: "支付成功 order #5002 → 但慢", en: "paid order #5002 → but slow" } },
];
function LogViz() {
  const L = useL();
  const lang = useLang();
  const [correlate, setCorrelate] = React.useState(false);
  const [sample, setSample] = React.useState(0.1);
  const target = "a1";
  const services = 5;
  const perReqLines = 6;
  const dailyReq = 20e6;
  const gbPerDay = dailyReq * sample * perReqLines * 400 / 1e9; // ~400 bytes/line
  const captured = 1 - Math.pow(1 - sample, 1); // prob a given incident request is sampled

  const shown = correlate ? LOG_LINES.filter((l) => l.tid === target) : LOG_LINES;

  return (
    <div>
      <VizHead idx="OB3" title={L("日志聚合:用 TraceId 把八份日志串成一个故事", "Log aggregation: stitching eight logs into one story by TraceId")} />
      <div className="viz-ctrl">
        <Toggle label={L("按 TraceId 关联(只看这一次请求)", "Correlate by TraceId (one request)")} value={correlate} onChange={setCorrelate} />
        <Slider label={L("采样率", "Sampling rate")} min={0.01} max={1} step={0.01} value={sample} onChange={setSample} fmt={pct} />
      </div>

      <div className="sc-kpi-grid" style={{ marginTop: 12 }}>
        <Kpi label={L("跨服务", "Across services")} value={services} tone="acc" hint={L("日志散落在这么多机器", "logs scattered here")} />
        <Kpi label={L("日志量/天", "Log volume/day")} value={nf(gbPerDay, 0)} unit=" GB" tone={gbPerDay > 400 ? "warn" : "ok"} />
        <Kpi label={L("事故被采样到", "Incident captured")} value={pct(captured)} tone={captured < 0.2 ? "warn" : "ok"} hint={L("采样率决定", "set by sampling")} />
        <Kpi label={L("关联", "Correlation")} value={correlate ? L("开", "on") : L("关", "off")} tone={correlate ? "ok" : "warn"} />
      </div>

      <div style={{ marginTop: 8 }}>
        <div className="sc-cap">{correlate ? L(`只显示 TraceId=${target} 的日志,按序拼成一条完整故事`, `showing only TraceId=${target}, one ordered story`) : L("全系统日志混在一起——同一次请求的行被别的请求隔开", "the whole system's logs mixed — one request's lines separated by others")}</div>
        <div style={{ marginTop: 4, border: "1px solid var(--hairline-strong)", borderRadius: 6, overflow: "hidden" }}>
          {shown.map((l, i) => (
            <div key={i} style={{ display: "flex", gap: 8, padding: "4px 8px", font: "500 11px var(--f-mono)", borderTop: i ? "1px solid var(--hairline)" : "none", background: l.tid === target ? "color-mix(in srgb, var(--primary) 10%, transparent)" : "transparent" }}>
              <span style={{ color: l.tid === target ? "var(--primary)" : "var(--muted)", minWidth: 24 }}>{l.tid}</span>
              <span style={{ color: "var(--accent)", minWidth: 68 }}>{l.svc}</span>
              <span>{pick(lang, l.msg)}</span>
            </div>
          ))}
        </div>
      </div>

      <Note mark="→">
        {correlate
          ? L("按 TraceId 一过滤,这次慢请求在网关、订单、库存、支付里打的所有日志就按时间排好了——你立刻看到是「调用银行接口耗时 812ms」拖慢了整条链。前提是每条日志都带上了同一个 TraceId(和链路追踪共用)。", "Filter by TraceId and this slow request's lines across gateway, order, inventory and payment line up in time — you see at once that 'bank API took 812ms' dragged the chain. The precondition is that every log carries the same TraceId (shared with tracing).")
          : L("没有关联,你只能对着一堆交错的日志逐行猜:同一次请求的行被别的请求的行隔开了。打开关联试试。另外,采样率决定了成本和「出事时查不查得到」的取舍——全量存不起,采太低又可能没采到那次事故。", "Without correlation you squint at interleaved lines and guess: one request's lines are separated by others'. Turn correlation on. Also, the sampling rate trades cost against 'findable when it matters' — you cannot store everything, and sampling too low may miss the very incident you need.")}
      </Note>
    </div>
  );
}

/* =========================================================
   sc25 · mqLab — Kafka vs RabbitMQ chooser
   ========================================================= */
function MqViz() {
  const L = useL();
  const [tput, setTput] = React.useState(30000);   // target msg/s
  const [replay, setReplay] = React.useState(false);
  const [routing, setRouting] = React.useState(false);
  const [order, setOrder] = React.useState(false);
  const rabbitCeil = 60000;                          // model ceiling for a classic queue

  const meetsRabbit = tput <= rabbitCeil;
  // requirement axes: each contributes to a broker's fit and names a winner
  const axes = [
    { key: "tput", label: L("吞吐量", "throughput"), active: true,
      kd: tput > rabbitCeil ? 26 : tput > rabbitCeil * 0.4 ? 8 : 2,
      rd: tput > rabbitCeil ? -22 : tput > rabbitCeil * 0.4 ? 0 : 6,
      k: L("极高 · 随分区扩展", "very high · scales w/ partitions"),
      r: meetsRabbit ? L("够用", "adequate") : L("触顶", "ceiling hit"),
      win: tput > rabbitCeil ? "k" : "tie" },
    { key: "replay", label: L("消息回放", "replay"), active: replay,
      kd: replay ? 18 : 0, rd: replay ? -24 : 0,
      k: L("按 offset 重读", "rewind by offset"), r: L("确认即删,默认不支持", "acked = gone"), win: "k" },
    { key: "routing", label: L("复杂路由", "complex routing"), active: routing,
      kd: routing ? -14 : 0, rd: routing ? 24 : 0,
      k: L("主题 + key,消费端过滤", "topic + key, filter in consumer"), r: L("交换机 direct/topic/fanout", "exchanges direct/topic/fanout"), win: "r" },
    { key: "order", label: L("严格顺序", "strict order"), active: order,
      kd: order ? 14 : 0, rd: order ? -8 : 0,
      k: L("分区内有序", "ordered per partition"), r: L("队列内有序,竞争易乱", "per-queue, competing reorders"), win: "k" },
  ];
  const descAxes = [
    { label: L("投递模型", "delivery"), k: L("拉 + 提交 offset", "pull + commit offset"), r: L("推 + 逐条 ack", "push + per-msg ack") },
    { label: L("消费者扩展", "consumer scaling"), k: L("≤ 分区数", "≤ partitions"), r: L("单队列自由竞争", "free on one queue") },
    { label: L("典型延迟", "latency"), k: L("毫秒级(批量)", "ms (batched)"), r: L("更低(逐条推)", "lower (per-msg)") },
  ];

  let k = 50, r = 50;
  axes.forEach((a) => { k += a.kd; r += a.rd; });
  k = clamp(k, 3, 100); r = clamp(r, 3, 100);
  const rec = k > r + 6 ? "kafka" : r > k + 6 ? "rabbit" : "either";
  const decider = axes.filter((a) => a.active && (a.kd || a.rd)).sort((a, b) => Math.abs(b.kd - b.rd) - Math.abs(a.kd - a.rd))[0];

  const Cell = ({ text, winner }) => (
    <div style={{ flex: 1, padding: "5px 8px", font: "500 10.5px var(--f-mono)", borderRadius: 4,
      background: winner ? "color-mix(in srgb, #2e9e6b 16%, transparent)" : "transparent",
      color: winner ? "var(--ink)" : "var(--muted)", border: winner ? "1px solid color-mix(in srgb,#2e9e6b 45%,transparent)" : "1px solid transparent" }}>
      {winner ? "✓ " : ""}{text}
    </div>
  );

  return (
    <div>
      <VizHead idx="TX4" title={L("Kafka vs RabbitMQ:按工作负载选中间件", "Kafka vs RabbitMQ: choose the broker by workload")} />
      <div className="viz-ctrl">
        <Slider label={L("吞吐目标", "Throughput target")} min={1000} max={500000} step={1000} value={tput} onChange={setTput} fmt={(v) => big(v) + "/s"} />
        <Toggle label={L("需要消息回放/重放", "Need replay")} value={replay} onChange={setReplay} />
        <Toggle label={L("需要复杂路由", "Need complex routing")} value={routing} onChange={setRouting} />
        <Toggle label={L("需要严格顺序", "Need strict ordering")} value={order} onChange={setOrder} />
      </div>

      <div className="sc-kpi-grid" style={{ marginTop: 12 }}>
        <Kpi label={L("Kafka 契合度", "Kafka fit")} value={nf(k, 0)} unit="%" tone={k >= r ? "ok" : ""} />
        <Kpi label={L("RabbitMQ 契合度", "RabbitMQ fit")} value={nf(r, 0)} unit="%" tone={r > k ? "ok" : ""} />
        <Kpi label={L("推荐", "Recommendation")} value={rec === "kafka" ? "Kafka" : rec === "rabbit" ? "RabbitMQ" : L("两者皆可", "either")} tone="acc" />
        <Kpi label={L("决定性因素", "Deciding factor")} value={decider ? decider.label : (tput > rabbitCeil ? L("吞吐量", "throughput") : L("需求相近", "close call"))} tone="warn" />
      </div>

      <div style={{ marginTop: 10 }}>
        <Bar label="Kafka" value={k} max={100} tone={k >= r ? "ok" : "mut"} valText={nf(k, 0) + "%"} />
        <Bar label="RabbitMQ" value={r} max={100} tone={r > k ? "ok" : "mut"} valText={nf(r, 0) + "%"} />
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ display: "flex", gap: 6, padding: "0 8px 3px", font: "600 10px var(--f-mono)", color: "var(--muted)" }}>
          <div style={{ width: 92 }} /><div style={{ flex: 1 }}>Kafka</div><div style={{ flex: 1 }}>RabbitMQ</div>
        </div>
        {axes.map((a) => (
          <div key={a.key} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3,
            padding: a.active ? "2px 0 2px 4px" : "2px 0", borderLeft: a.active ? "2px solid var(--accent)" : "2px solid transparent" }}>
            <div style={{ width: 88, font: `${a.active ? 700 : 500} 10.5px var(--f-mono)`, color: a.active ? "var(--ink)" : "var(--muted)" }}>{a.label}{a.active ? " ●" : ""}</div>
            <Cell text={a.k} winner={a.active && a.win === "k"} />
            <Cell text={a.r} winner={a.active && a.win === "r"} />
          </div>
        ))}
        {descAxes.map((a, i) => (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
            <div style={{ width: 88, font: "500 10.5px var(--f-mono)", color: "var(--muted)" }}>{a.label}</div>
            <Cell text={a.k} /><Cell text={a.r} />
          </div>
        ))}
      </div>

      <Note mark="→" tone="on">
        {rec === "kafka"
          ? L(`按你勾的要求,Kafka 更合适——${decider ? "决定性因素是「" + decider.label + "」。" : "主要是吞吐。"}Kafka 的分区日志天生适合高吞吐事件流、事件溯源和可重放的场景;代价是路由只有主题+key、消费并行度被分区数封顶。`,
              `For the requirements you ticked, Kafka fits better — ${decider ? "the deciding factor is '" + decider.label + "'. " : "mainly throughput. "}Kafka's partitioned log is built for high-throughput event streams, event sourcing and replayable workloads; the price is routing limited to topic+key and consumer parallelism capped by partitions.`)
          : rec === "rabbit"
          ? L(`按你勾的要求,RabbitMQ 更合适——${decider ? "决定性因素是「" + decider.label + "」。" : ""}RabbitMQ 的交换机-队列模型天生适合复杂路由、任务分发和需要逐条确认的场景;代价是吞吐上限更低、且确认后的消息默认无法重放。`,
              `For the requirements you ticked, RabbitMQ fits better — ${decider ? "the deciding factor is '" + decider.label + "'. " : ""}RabbitMQ's exchange-queue model is built for complex routing, task distribution and per-message acking; the price is a lower throughput ceiling and no replay of acked messages by default.`)
          : L("你的要求两者都能满足,契合度接近——这时可以先按团队熟悉度选,反正 Spring Cloud Stream 的 binder 让你以后换中间件只改配置、不改代码。真正逼你选边的,是「要回放」「要复杂路由」「吞吐触顶」这几个硬需求。", "Both brokers meet your requirements and the fit is close — pick by team familiarity, since Spring Cloud Stream's binder lets you switch later by config, not code. What actually forces the choice is a hard requirement: replay, complex routing, or a throughput ceiling.")}
      </Note>
    </div>
  );
}

/* ---------------- export Module V–VI benches ---------------- */
window.__SC_VIZ_3 = {
  streamLab: StreamViz,
  sagaLab: SagaViz,
  idempotentLab: IdempotentViz,
  traceLab: TraceViz,
  sloLab: SloViz,
  logLab: LogViz,
  mqLab: MqViz,
};
