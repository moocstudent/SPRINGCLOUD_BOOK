/* =========================================================
   i18n — Chinese / English switching
   ---------------------------------------------------------
   UI            : dictionary of interface strings { key: {zh, en} }
   LangContext   : current language ("zh" | "en")
   useLangState(): App-level state hook (persists to localStorage)
   useLang()     : read current language inside any component
   useT()        : returns t(key) -> localized UI string
   pick(lang,obj): localize a content object { zh, en } (or a plain string)
   ========================================================= */

const LANG_KEY = "sc_book_lang";

const LangContext = React.createContext("zh");

function useLangState() {
  const [lang, setLangRaw] = React.useState(() => {
    try { return localStorage.getItem(LANG_KEY) || "zh"; } catch (e) { return "zh"; }
  });
  React.useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-Hans" : "en";
    document.documentElement.setAttribute("data-lang", lang);
  }, [lang]);
  const setLang = (l) => {
    try { localStorage.setItem(LANG_KEY, l); } catch (e) {}
    setLangRaw(l);
  };
  const toggle = () => setLang(lang === "zh" ? "en" : "zh");
  return [lang, setLang, toggle];
}

function useLang() { return React.useContext(LangContext); }

function useT() {
  const lang = React.useContext(LangContext);
  return (key) => {
    const e = UI[key];
    if (e === undefined) return key;
    if (typeof e === "object") return e[lang] !== undefined ? e[lang] : e.zh;
    return e;
  };
}

// Localize a { zh, en } object; a bare string is returned as-is.
function pick(lang, obj) {
  if (obj == null) return "";
  if (typeof obj === "string") return obj;
  return obj[lang] !== undefined ? obj[lang] : (obj.zh !== undefined ? obj.zh : obj.en);
}
// The "other" language for a content object (used for the sub-title lines).
function other(lang, obj) { return pick(lang === "zh" ? "en" : "zh", obj); }

// "{n} 章" -> fmt("{n} 章", {n: 3})
function fmt(str, map) {
  return String(str).replace(/\{(\w+)\}/g, (_, k) => (map[k] !== undefined ? map[k] : `{${k}}`));
}

const UI = {
  /* nav */
  nav_home:    { zh: "首页", en: "Home" },
  nav_about:   { zh: "关于", en: "About" },
  nav_modules: { zh: "模块", en: "Modules" },
  lang_title:  { zh: "切换语言", en: "Switch language" },
  theme_title: { zh: "切换主题", en: "Toggle theme" },

  /* hero */
  hero_badge:  { zh: "Spring Cloud 微服务 · 中英双语 · 从一个单体到一片跨机房的集群", en: "Spring Cloud microservices · bilingual · from one monolith to a cluster across regions" },
  hero_l1:     { zh: "先把一个分布式场景跑一遍,", en: "First run the distributed scenario," },
  hero_l2a:    { zh: "再讲清它为什么", en: "then explain why it" },
  hero_l2b:    { zh: "非这样不可。", en: "has to be this way." },
  hero_sub:    {
    zh: "把单体拆成微服务,你换来的不是自由,是一堆新问题:服务在哪台机器上、找不到怎么办、下游挂了会不会把上游一起拖垮、配置怎么不重启就改、一次下单跨三个库怎么保证不出错、请求慢了到底慢在哪一跳、流量翻十倍能不能自动扩容、机房断电能不能切到另一座城市。本课程用 Spring Cloud 全家桶把这些问题逐个拆开:注册发现、OpenFeign、负载均衡、Resilience4j / Sentinel、Gateway、配置中心、Stream、Seata、链路追踪,一直到容器化、Kubernetes 弹性伸缩和异地多活。共 {M} 个模块、{C} 章,每章开头是一个可交互的治理台,结尾是 Java / 配置 / 部署 三个视角的真实代码——所有数字现算,所有代码照着能落地。",
    en: "Splitting a monolith into microservices does not buy you freedom; it buys you a fresh set of problems: which machine a service is on, what happens when it cannot be found, whether a dead downstream drags its callers down with it, how to change config without a restart, how one checkout that spans three databases stays correct, which hop a slow request actually spent its time in, whether a tenfold traffic spike scales itself out, and whether a data-centre outage can fail over to another city. This course takes those problems apart one by one with the Spring Cloud stack — discovery, OpenFeign, load balancing, Resilience4j / Sentinel, Gateway, config server, Stream, Seata, distributed tracing — all the way to containers, Kubernetes autoscaling and multi-region active-active. {M} modules, {C} chapters — each opening with an interactive governance bench and closing with real code from three angles: Java, configuration and deployment. Every number is computed live; every listing is meant to ship.",
  },
  cta_start:   { zh: "从第一章开始 →", en: "Start chapter 1 →" },
  cta_howto:   { zh: "如何使用", en: "How it works" },
  cta_roadmap: { zh: "查看路线图", en: "See the roadmap" },

  meta_modules:  { zh: "模块", en: "Modules" },
  meta_chapters: { zh: "章", en: "Chapters" },
  meta_demos:    { zh: "治理台", en: "Benches" },
  meta_hours:    { zh: "小时", en: "Hours" },

  your_progress: { zh: "你的进度", en: "Your progress" },
  synced:        { zh: "本地保存 · 无需登录", en: "Saved locally · no login" },

  /* sections */
  sec01:       { zh: "学习路线图", en: "Learning roadmap" },
  sec01_aside: { zh: "从一个单体走到一片跨机房的集群", en: "From one monolith to a cluster spanning regions" },
  sec02:       { zh: "课程模块", en: "Course modules" },
  sec02_aside: { zh: "点击进入任意模块", en: "Click any module to enter" },
  sec03:       { zh: "学习方法", en: "The method" },
  sec03_aside: { zh: "先跑一遍场景,再读解释,最后自己写一遍", en: "Run the scenario, read why, then write it yourself" },

  rm_notstarted: { zh: "未开始", en: "Not started" },
  rm_done:       { zh: "已完成", en: "Done" },

  hours_unit:    { zh: "小时", en: "h" },
  modules_count: { zh: "章", en: "chapters" },
  done_word:     { zh: "完成", en: "done" },
  enter_word:    { zh: "进入 →", en: "Enter →" },

  phil1_zh: { zh: "先跑一遍场景", en: "Run the scenario" },
  phil1_b:  {
    zh: "每一章开头是一个可交互治理台:把一条请求扇出到十个服务,看整体可用率怎么从 99.9% 掉到 99%;把一个下游打挂,看熔断器从关到开再到半开,看它怎么把雪崩挡在门外;给一个服务加压,看 HPA 按 CPU 把副本从 3 扩到 12,再看冷启动的滞后怎么造成短暂的超时;打开异地双活,看复制延迟怎么变成一次「读不到自己刚写的」;把负载均衡从轮询换成最少连接,看 P99 尾延迟怎么塌下来。分布式系统的直觉不是背文档背出来的,是被自己调出来的曲线打服的。",
    en: "Every chapter opens with an interactive governance bench: fan one request out to ten services and watch composite availability fall from 99.9% to 99%; kill a downstream and watch the circuit breaker move closed → open → half-open, keeping the avalanche outside the door; load a service and watch the HPA scale replicas from 3 to 12 on CPU, then watch cold-start lag turn into a burst of timeouts; switch on active-active across regions and watch replication lag become a 'cannot read my own write'; swap load balancing from round-robin to least-connections and watch the P99 tail collapse. Intuition about distributed systems is not memorised from docs — it is beaten into you by curves you moved yourself.",
  },
  phil2_zh: { zh: "再读解释", en: "Read the explanation" },
  phil2_b:  {
    zh: "治理台背后是机制:为什么服务越多整体可用率越低、注册中心为什么要在 CP 和 AP 之间选边、Eureka 的自我保护到底在保护谁、客户端负载均衡为什么比反向代理更懂拓扑、熔断的三个状态各自在等什么、网关的令牌桶怎么把突发流量削平、配置刷新为什么会有一段「新旧混跑」的危险窗口、Saga 的补偿为什么不等于回滚、HPA 为什么需要稳定窗口才不抖动、异地多活为什么绕不开 RPO 和冲突。「解释」把每个设计选择的代价和适用边界讲清楚。",
    en: "Behind each bench sits a mechanism: why more services means lower composite availability, why a registry must take sides between CP and AP, whom Eureka's self-preservation actually protects, why client-side load balancing understands topology better than a reverse proxy, what each of the breaker's three states is waiting for, how the gateway's token bucket flattens a burst, why a config refresh has a dangerous window where old and new run side by side, why a Saga's compensation is not a rollback, why the HPA needs a stabilisation window to stop flapping, and why multi-region active-active cannot escape RPO and conflicts. The explanation gives every design choice its price and its boundary.",
  },
  phil3_zh: { zh: "最后自己写一遍", en: "Then write it yourself" },
  phil3_b:  {
    zh: "每章结尾是同一件事的三个视角:Java 是带注解的服务代码(@EnableFeignClients、@CircuitBreaker、Gateway 的过滤器、Seata 的 @GlobalTransactional),配置是 application.yml / bootstrap.yml / Nacos 里那几行真正起作用的键,部署是 Dockerfile、docker-compose 或 Kubernetes 的 Deployment 与 HPA。代码都是可读长度的完整片段,不是伪代码,关键的注解、依赖和常量都是真的——照着就能在自己的机器或集群上跑起来。练习会把你赶到真环境里:起两个实例看负载均衡、拔掉一个下游看熔断、用 kubectl 手动扩容再看自动扩容。",
    en: "Every chapter closes with the same thing from three angles: Java is the annotated service code (@EnableFeignClients, @CircuitBreaker, a Gateway filter, Seata's @GlobalTransactional); configuration is the handful of keys in application.yml / bootstrap.yml / Nacos that actually take effect; deployment is a Dockerfile, a docker-compose file or a Kubernetes Deployment and HPA. The listings are complete, readable fragments rather than pseudocode — every annotation, dependency and constant that matters is real, so you can run it on your own machine or cluster. The exercises push you into a real environment: bring up two instances to watch load balancing, pull a downstream to watch the breaker trip, scale by hand with kubectl and then watch it scale itself.",
  },

  footer_tag:  { zh: "nodes & calls · Spring Cloud 微服务 · 2026", en: "nodes & calls · Spring Cloud microservices · 2026" },
  footer_sync: { zh: "进度本地保存", en: "progress saved locally" },

  /* module page */
  bc_home:    { zh: "首页", en: "Home" },
  bc_modules: { zh: "模块", en: "Modules" },
  module_word:{ zh: "模块", en: "Module" },
  of_word:    { zh: "共", en: "of" },
  m_meta_chapters: { zh: "章数", en: "Chapters" },
  m_meta_hours:    { zh: "预计小时", en: "Est. hours" },
  m_meta_level:    { zh: "难度", en: "Level" },
  m_meta_progress: { zh: "进度", en: "Progress" },
  chapter_list: { zh: "本模块章节", en: "Chapters in this module" },
  click_enter:  { zh: "点击任意章节进入", en: "Click a chapter to enter" },
  no_prereq:    { zh: "无先修", en: "No prereq" },
  prereq_n:     { zh: "{n} 项先修", en: "{n} prereq" },
  not_found_m:  { zh: "未找到该模块。", en: "Module not found." },

  diff_1: { zh: "入门", en: "Intro" },
  diff_2: { zh: "进阶", en: "Core" },
  diff_3: { zh: "挑战", en: "Advanced" },

  /* chapter page */
  ch_sec_intro:   { zh: "本章导读", en: "Overview" },
  ch_sec_obj:     { zh: "学习目标", en: "Objectives" },
  ch_sec_outline: { zh: "内容大纲", en: "Outline" },
  ch_sec_viz:     { zh: "治理台 · 可交互模拟", en: "The governance bench · live model" },
  ch_sec_notes:   { zh: "解释 · 核心讲义", en: "The explanation · core notes" },
  ch_sec_code:    { zh: "代码 · Java / 配置 / 部署", en: "Code · Java / config / deploy" },
  viz_hint:     { zh: "改动参数,亲眼看可用率、延迟、副本数、复制延迟和成本如何联动;这里的每一个数字都是现算的,大胆试。", en: "Change the parameters and watch availability, latency, replica count, replication lag and cost move together; every number here is computed live — experiment freely." },
  code_hint:    { zh: "切换标签看同一件事的三个视角:Java 服务代码、application.yml 配置、Dockerfile / Kubernetes 部署;点右上角复制。代码为可读而写,去掉了无关样板,但注解、依赖与关键常量都是真的。", en: "Switch tabs for three angles on the same thing: the Java service code, the application.yml configuration, and the Dockerfile / Kubernetes deployment; copy from the corner button. The listings are written to be read — unrelated boilerplate is trimmed — but every annotation, dependency and constant that matters is real." },
  key_badge:    { zh: "重点", en: "Key" },
  code_badge:   { zh: "动手", en: "Hands-on" },
  copy_btn:     { zh: "复制", en: "Copy" },
  copied_btn:   { zh: "已复制", en: "Copied" },
  langs_word:   { zh: "代码", en: "Code" },
  loading_notes:{ zh: "正在加载讲义……", en: "Loading notes…" },
  notes_soon:   { zh: "本章深度讲义正在编写中。以上目标与大纲即为本章脉络,先把上面的治理台玩透。", en: "The deep-dive notes for this chapter are being written. Use the objectives and outline above as your map — and play with the bench first." },
  back_to:      { zh: "返回", en: "Back to" },
  est_word:     { zh: "预计", en: "Est." },
  level_word:   { zh: "难度", en: "Level" },
  props_word:   { zh: "关键概念", en: "Key concepts" },
  mark_done_btn:{ zh: "标记为已完成", en: "Mark as complete" },
  marked_done:  { zh: "已完成", en: "Completed" },
  not_found_c:  { zh: "未找到该章节。", en: "Chapter not found." },

  /* about */
  about_kicker: { zh: "关于本站", en: "About" },
  about_q:      { zh: "为什么写这门课?", en: "Why this course?" },
  about_sub:    { zh: "把微服务讲成「治理台 + 解释 + 代码」,而不是一张画满方框和箭头的架构图。", en: "Teach microservices as a bench, an explanation and code — not as an architecture diagram full of boxes and arrows." },
  about_h1: { zh: "这是什么", en: "What this is" },
  about_p1: {
    zh: "一门 Spring Cloud 微服务的自学课程,共 {M} 个模块、{C} 章,面向要把单体拆开、或者已经被一堆服务淹没的后端工程师。第一个模块讲全景:什么时候不该上微服务、Spring Cloud 全家桶(Netflix / Alibaba / 官方三套)怎么选、按什么边界拆服务。然后是服务注册与发现——注册中心的心跳与摘除、Eureka 的自我保护与 AP、Nacos 的 CP/AP 切换。中段是通信与弹性:OpenFeign 声明式调用、客户端负载均衡、以及熔断、限流、降级、隔离这一整套把故障关在局部的手段;接着是网关与配置中心——Spring Cloud Gateway 的路由与过滤器、网关鉴权与限流、配置的动态刷新。之后是消息、事务与一致性:事件驱动与 Spring Cloud Stream、分布式事务(2PC / TCC / Saga 与 Seata)、幂等与最终一致性。再往上是可观测性:链路追踪、指标监控、日志聚合。最后两个模块正面回答那三个最难的运维问题——不同服务部署到不同服务器、Kubernetes 弹性伸缩与自动扩容、异地多活与跨机房数据复制——并以安全、混沌工程和一个电商系统的综合实战收口。",
    en: "A self-study course on Spring Cloud microservices — {M} modules, {C} chapters — for backend engineers about to split a monolith, or already drowning in one they split too far. The first module is the landscape: when not to go microservices, how to choose across the Spring Cloud stack (Netflix, Alibaba and the official set), and where to cut the seams. Then service registry and discovery — heartbeats and eviction, Eureka's self-preservation and its AP nature, Nacos switching between CP and AP. The middle is communication and resilience: declarative calls with OpenFeign, client-side load balancing, and the whole toolkit that keeps a failure local — circuit breaking, rate limiting, fallback and bulkheads; then the gateway and config server — Spring Cloud Gateway's routes and filters, gateway auth and rate limiting, dynamic config refresh. After that, messaging, transactions and consistency: event-driven design with Spring Cloud Stream, distributed transactions (2PC, TCC, Saga and Seata), idempotency and eventual consistency. Then observability: distributed tracing, metrics and log aggregation. The last two modules answer head-on the three hardest operational questions — placing different services on different servers, elastic autoscaling on Kubernetes, and multi-region active-active with cross-DC replication — and close with security, chaos engineering and an end-to-end e-commerce capstone.",
  },
  about_p1b: { zh: "全部内容中英双语,代码为 Java / YAML 配置 / 部署清单(Dockerfile、docker-compose、Kubernetes),支持浅色/深色主题,进度保存在你自己的浏览器里,无需注册。", en: "Everything is bilingual (Chinese/English); code is Java, YAML configuration and deployment manifests (Dockerfile, docker-compose, Kubernetes). Light and dark themes, progress kept in your own browser, no signup." },
  about_h2: { zh: "「治理台与解释」是什么意思", en: "What 'the governance bench & the explanation' means" },
  about_p2: {
    zh: "微服务的材料通常走两个极端:要么是官方文档和一堆注解的堆砌(准确,但在你需要一个直觉的时候毫无帮助),要么是「五分钟搭一个 Spring Cloud」(搭起来了,然后在第一次下游超时、第一次注册中心分区、第一次流量高峰时全线崩溃)。本站每章拆成三块:「治理台」是可交互模拟器,可用率、尾延迟、熔断状态、复制延迟、副本数、扩容成本全部在你的浏览器里现算,改一个参数就看到后果;「解释」讲清机制、代价和边界;「代码」给出 Java、配置和部署三个视角,让你能立刻在自己的机器或集群上跑一遍。",
    en: "Material on microservices runs to two extremes: the official docs and a pile of annotations (accurate, and no help at all when what you need is an intuition), or 'a Spring Cloud stack in five minutes' (stood up, then comprehensively down the first time a downstream times out, the first time the registry partitions, the first time traffic peaks). Every chapter here splits into three. The governance bench is a live model — availability, tail latency, breaker state, replication lag, replica count and scaling cost, all computed in your browser — where one changed parameter shows the consequence. The explanation covers the mechanism, its price and its boundary. The code gives three angles — Java, configuration and deployment — so you can run it on your own machine or cluster today.",
  },
  about_h3: { zh: "组件是手段,场景才是目的", en: "Components are means; the scenarios are the point" },
  about_p3: {
    zh: "很多教程把 Spring Cloud 讲成一份组件清单:Eureka 是什么、Feign 怎么用、Gateway 怎么配。但没有人为了用 Eureka 而用 Eureka——你用它,是因为服务会挂、会漂移、会扩缩,你需要在运行时找到它们。本书把顺序倒过来:先给你一个真实场景——一次会拖垮全链路的下游超时、一次让人半夜爬起来的注册中心分区、一次大促前的自动扩容、一次机房级故障的异地切换——再让你看清是哪个组件、哪个参数、哪个权衡在决定成败。学完你记住的不是「Resilience4j 有几个注解」,而是「什么时候该熔断、阈值定多少、半开放几个探针」。",
    en: "Many tutorials teach Spring Cloud as a parts list: what Eureka is, how to use Feign, how to configure Gateway. But nobody uses Eureka for its own sake — you use it because services die, drift and scale, and you must find them at runtime. This book inverts the order: it hands you a real scenario first — a downstream timeout that drags the whole chain down, a registry partition that gets someone out of bed at 3 a.m., an autoscale before a sale, a region-level failover — and then shows you exactly which component, which parameter and which trade-off decides the outcome. What you leave with is not 'how many annotations Resilience4j has' but 'when to trip a breaker, where to set the threshold, and how many probes to allow on half-open'.",
  },
  about_h4: { zh: "如何使用", en: "How to use it" },
  about_p4: {
    zh: "按路线图学:全景与拆分 → 注册与发现 → 通信/负载/弹性 → 网关与配置 → 消息/事务/一致性 → 可观测性 → 部署/伸缩/多机房 → 安全与实战。如果你已经在维护一套微服务、只想解决具体问题,可以直奔模块 VII(部署、弹性伸缩、异地多活)和模块 III(熔断限流)——但请至少先读完 CM3(弹性)和 RD1(注册中心原理),因为「下游挂了怎么办」和「服务在哪」这两件事,是后面所有场景的地基。每章的练习都要求你离开本站动手:起两个实例、拔一个下游、配一次 HPA、模拟一次跨机房延迟。技术栈以 Spring Boot 3 / Spring Cloud 2023(Leyton)与 Spring Cloud Alibaba 为主,但讲的是不随版本变的道理。",
    en: "Follow the roadmap: landscape and decomposition → registry and discovery → communication/load/resilience → gateway and config → messaging/transactions/consistency → observability → deployment/scaling/multi-region → security and capstone. If you already run microservices and just want a specific problem solved, jump straight to module VII (deployment, elastic scaling, active-active) and module III (breaking and limiting) — but read CM3 (resilience) and RD1 (how a registry works) first, because 'what happens when a downstream dies' and 'where is the service' are the foundation under every later scenario. Every chapter's exercises send you away from this site: bring up two instances, pull a downstream, configure an HPA, simulate cross-region latency. The stack is Spring Boot 3 / Spring Cloud 2023 (Leyton) and Spring Cloud Alibaba, but what it teaches is the part that does not change with the version.",
  },
};

window.LangContext = LangContext;
window.useLangState = useLangState;
window.useLang = useLang;
window.useT = useT;
window.pick = pick;
window.other = other;
window.fmt = fmt;
window.UI = UI;
