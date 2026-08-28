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
