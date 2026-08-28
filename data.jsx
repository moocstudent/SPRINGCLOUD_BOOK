/* =========================================================
   Curriculum data — 8 modules / 24 chapters
   ---------------------------------------------------------
   Metadata only (bilingual). The teaching content ("解释")
   for each chapter lives in content/<id>.<lang>.md and is
   fetched on demand by the chapter page. `viz` names an
   interactive bench ("治理台") from viz.jsx / viz2.jsx /
   viz3.jsx / viz4.jsx; the code listings live in code.jsx /
   code2.jsx (looked up by chapter id). `props` lists the key
   concepts the chapter leans on.
   ========================================================= */

const MODULES = [
  {
    id: "m1", arch: "m1-arch", code: "FD", accent: "primary", level: 1,
    zh: "微服务与 Spring Cloud 全景", en: "Microservices & the Spring Cloud Landscape",
    tagline: { zh: "微服务不是把代码拆小,是把一个进程内的方法调用换成一个会失败、会延迟、会掉线的网络调用。", en: "Microservices is not chopping code small; it is trading an in-process method call for a network call that fails, delays and drops." },
    description: {
      zh: "在写第一行 @EnableDiscoveryClient 之前,先想清楚一件事:微服务几乎所有的好处都是组织层面的(团队能各自部署、各自扩容、各自选型),而几乎所有的代价都是技术层面的,而且这笔账要你天天还。这个模块把这笔账摊开。第一章用一个能自己算的模型说明「分布式税」:一个 99.9% 的单体拆成十个各自 99.9% 的服务串起来,整体可用率掉到 99%——你没有让系统更可靠,你让它更脆弱了,除非你把后面二十章的韧性手段都补上。第二章讲选型:Spring Cloud 有三套并存的实现——正在退役的 Netflix、活跃的 Alibaba、以及官方的 LoadBalancer/Gateway/Resilience4j,外加一个所有人都踩过的坑:Spring Boot、Spring Cloud、Spring Cloud Alibaba 三者的版本必须对齐,对不齐启动就炸。第三章讲拆分:按业务能力和 DDD 限界上下文切,而不是按数据库表切,因为切错边界的代价不是重构一个类,是每一次改动都要跨三个团队、三个服务、一个分布式事务。",
      en: "Before the first line of @EnableDiscoveryClient, be clear about one thing: almost every benefit of microservices is organisational (teams deploy, scale and choose their stack independently), and almost every cost is technical — a bill you pay every day. This module lays that bill out. Chapter one uses a model you can compute to show the 'distributed tax': a 99.9% monolith split into ten 99.9% services in a chain drops to 99% composite availability — you did not make the system more reliable, you made it more fragile, unless you add back every resilience technique in the next twenty chapters. Chapter two is selection: Spring Cloud ships three coexisting implementations — the retiring Netflix set, the active Alibaba set, and the official LoadBalancer/Gateway/Resilience4j — plus the trap everyone hits, that Spring Boot, Spring Cloud and Spring Cloud Alibaba versions must line up or the app will not even start. Chapter three is decomposition: cut along business capabilities and DDD bounded contexts, not database tables, because a wrong seam does not cost you a refactored class — it costs you three teams, three services and a distributed transaction on every change.",
    },
  },
  {
    id: "m2", arch: "m2-arch", code: "RD", accent: "accent", level: 1,
    zh: "服务注册与发现", en: "Service Registry & Discovery",
    tagline: { zh: "服务的地址每天都在变——扩容、重启、漂移。注册中心就是那本必须永远新鲜、又永远追不上真相的电话簿。", en: "A service's address changes daily — scale, restart, drift. The registry is the phone book that must stay fresh and can never quite catch the truth." },
    description: {
      zh: "在单体里,一个方法在哪里从来不是问题——它就在同一个 JVM 里。一旦拆开,「订单服务在哪台机器的哪个端口」就变成一个必须在运行时、反复回答、而且答案随时会变的问题:实例会因为发布而重启、因为扩容而增加、因为宕机而消失、因为 K8s 调度而漂移。注册中心用一份带心跳的实例清单来回答这个问题,而它面对的核心难题只有一个:当一个实例三秒没发心跳,它是真的挂了,还是只是网络抖了一下、GC 停顿了一下?这个模块把三种答案讲透。第一章讲原理:心跳、TTL、健康检查、以及「摘除太快会误杀、摘除太慢会把流量打到死实例上」这对永恒的矛盾。第二章讲 Eureka:它选择了 AP——宁可保留一些过时的实例,也不在网络分区时把整张表清空,「自我保护」正是这个选择的具体形态。第三章讲 Nacos:它能在 CP(Raft,强一致,适合配置)和 AP(Distro,高可用,适合服务发现)之间切换,让你亲眼看清 CAP 不是一句口号,是一个你必须替业务做的取舍。",
      en: "In a monolith, where a method lives is never a question — it is in the same JVM. Split things apart and 'which host and port is the order service on' becomes a question you must answer at runtime, repeatedly, with an answer that keeps changing: instances restart on deploy, multiply on scale-out, vanish on crash, and drift as Kubernetes reschedules them. A registry answers this with a heartbeat-backed list of instances, and it faces exactly one hard problem: when an instance misses a heartbeat for three seconds, is it really dead, or did the network hiccup, or the GC pause? This module works through all three answers. Chapter one is the mechanism: heartbeats, TTL, health checks, and the eternal tension that evicting too fast kills healthy instances while evicting too slowly sends traffic to dead ones. Chapter two is Eureka, which chose AP — it would rather keep some stale entries than wipe the table during a partition, and 'self-preservation' is the concrete shape of that choice. Chapter three is Nacos, which switches between CP (Raft, strong consistency, right for config) and AP (Distro, high availability, right for discovery), letting you see that CAP is not a slogan but a trade you must make on the business's behalf.",
    },
  },
  {
    id: "m3", arch: "m3-arch", code: "CM", accent: "primary", level: 2,
    zh: "通信、负载与弹性", en: "Communication, Load Balancing & Resilience",
    tagline: { zh: "一次远程调用有三种结局:成功、失败、以及最危险的那种——很久很久以后才失败。", en: "A remote call has three outcomes: success, failure, and the dangerous one — failure after a very long wait." },
    description: {
      zh: "这是把微服务从「能跑」变成「敢上线」的模块。第一章讲 OpenFeign:用一个接口加几个注解就能发起远程调用,读起来像本地方法——但这份优雅藏着一个陷阱,本地方法不会超时,远程调用会,而 Feign 默认的重试会在下游正吃力时把负载再翻一倍,把一次抖动放大成一次雪崩。第二章讲负载均衡:为什么放在客户端(Spring Cloud LoadBalancer)而不是前面架一台 Nginx——因为客户端知道有几个实例、每个多忙,而当实例性能不均时,轮询会固执地把等量流量打给那个最慢的节点,尾延迟随之爆炸,最少连接和基于响应时间的策略才救得回来。第三章是整个模块的收口,也是运维半夜被叫醒的高发地:熔断、限流、降级、隔离。熔断器有关、开、半开三个状态,它做的事只有一件——当下游明显不行时,快速失败,不要再排队,把线程和内存留给还能救的请求。这一章让你亲手把熔断器打开又合上,看它怎么把一场级联故障挡在一个服务的边界里。",
      en: "This is the module that turns microservices from 'runs' into 'safe to ship'. Chapter one is OpenFeign: an interface and a few annotations make a remote call read like a local method — but that elegance hides a trap, because a local method never times out and a remote call does, and Feign's default retry doubles the load on a struggling downstream, amplifying one hiccup into an avalanche. Chapter two is load balancing: why it lives on the client (Spring Cloud LoadBalancer) rather than behind a Nginx out front — because the client knows how many instances exist and how busy each is, and when instances are uneven, round-robin stubbornly sends equal traffic to the slowest node and the tail latency explodes, while least-connections and response-time strategies recover it. Chapter three closes the module and is where on-call gets woken up: circuit breaking, rate limiting, fallback and bulkheads. The breaker has three states — closed, open, half-open — and does exactly one thing: when a downstream is clearly failing, fail fast, stop queueing, and keep threads and memory for the requests that can still be served. Here you open and close the breaker by hand and watch it hold a cascading failure at one service's boundary.",
    },
  },
  {
    id: "m4", arch: "m4-arch", code: "GW", accent: "accent", level: 2,
    zh: "网关与配置中心", en: "Gateway & Configuration",
    tagline: { zh: "一百个服务不该有一百个入口、一百份配置。网关收拢入口,配置中心收拢真相。", en: "A hundred services should not have a hundred front doors or a hundred config files. The gateway centralises entry; the config server centralises truth." },
    description: {
      zh: "前三个模块讲的是服务之间怎么互相调用,这个模块讲的是外部世界怎么进来、以及整个系统的「开关」放在哪。第一章讲 Spring Cloud Gateway:所有外部流量的唯一入口,基于断言(路径、请求头、权重)把请求路由到后端,并在过滤器链里统一做那些不该散落在每个服务里的事——鉴权、限流、灰度、改写。权重路由这一节让你亲手做一次金丝雀发布:把 10% 的流量切到新版本,出问题立刻切回。第二章讲网关上的安全与限流:JWT 在网关一次校验、令牌桶在网关削峰,让后端服务专心做业务;你会看到令牌桶怎么把一个瞬时的十倍突发平滑成后端扛得住的稳定速率,以及超出的请求怎么变成 429 而不是把数据库压垮。第三章讲配置中心:把散落在几十个服务里的配置集中管理,并且——这是关键——不重启就能改。但动态刷新有它自己的暗礁:当你把一个开关推给三十个实例时,它们不是同时生效的,中间有一小段「一半新、一半旧」的窗口,而很多线上诡异行为就诞生在这几秒里。",
      en: "The first three modules covered how services call each other; this one covers how the outside world gets in, and where the system's switches live. Chapter one is Spring Cloud Gateway: the single front door for all external traffic, routing requests to backends by predicates (path, header, weight) and doing in one filter chain the things that should not be scattered across every service — auth, rate limiting, canary, rewriting. The weighted-route section has you run a canary by hand: send 10% of traffic to a new version, roll back instantly on trouble. Chapter two is security and rate limiting at the gateway: validate a JWT once at the edge, shave peaks with a token bucket, and let backends focus on business logic; you will watch a token bucket smooth a tenfold instantaneous burst into a steady rate the backend can survive, and watch the overflow become 429s instead of a crushed database. Chapter three is the config server: centralise configuration scattered across dozens of services and — the point — change it without a restart. But dynamic refresh has its own reef: when you push a switch to thirty instances they do not flip at the same instant, there is a brief 'half new, half old' window, and a surprising amount of weird production behaviour is born in those few seconds.",
    },
  },
  {
    id: "m5", arch: "m5-arch", code: "TX", accent: "primary", level: 3,
    zh: "消息、事务与一致性", en: "Messaging, Transactions & Consistency",
    tagline: { zh: "单体里一个 @Transactional 就搞定的事,拆开之后变成分布式系统里最难的一道题。", en: "What one @Transactional handled in the monolith becomes the hardest question in distributed systems once you split it." },
    description: {
      zh: "这是本书理论密度最高的模块,因为它触碰的是分布式系统的硬核:当数据分散在多个服务、多个数据库里,你怎么保证一次业务操作要么全成、要么全败?第一章先给出一条避开正面冲突的路——事件驱动:服务之间不再同步地互相等待,而是通过 Spring Cloud Stream 发消息、订阅消息,把强耦合的同步调用换成松耦合的异步事件,顺带解决削峰和解耦;你会看到分区数怎么决定消费并行度、消费积压怎么在流量高峰时堆起来、重平衡时又会发生什么。第二章正面硬刚分布式事务:从两阶段提交(2PC)的同步阻塞,到 TCC 的 Try-Confirm-Cancel,到 Saga 的一串带补偿的本地事务,再到 Seata 把这几种模式都封装好的 AT/TCC/Saga/XA——核心洞见是,分布式世界里没有免费的强一致,你只能在「锁得久」和「补偿难」之间选。第三章讲落地这一切都绕不开的两块基石:幂等(同一条消息重复投递,业务不能重复执行)和最终一致性(用本地消息表/发件箱模式,保证「改了数据库」和「发了消息」这两件事不会一个成一个败)。",
      en: "This is the most theory-dense module in the book, because it touches the hard core of distributed systems: when data is spread across several services and databases, how do you make one business operation either fully succeed or fully fail? Chapter one offers a route around the head-on fight — event-driven design: services stop waiting on each other synchronously and instead publish and subscribe through Spring Cloud Stream, trading tightly coupled synchronous calls for loosely coupled asynchronous events, and getting peak-shaving and decoupling for free; you will see how partition count sets consumer parallelism, how lag piles up at peak, and what happens during a rebalance. Chapter two takes distributed transactions head-on: from the synchronous blocking of two-phase commit (2PC), to TCC's Try-Confirm-Cancel, to a Saga's chain of local transactions with compensations, to Seata packaging all of these as AT/TCC/Saga/XA — the core insight being that there is no free strong consistency in a distributed world, you only choose between 'locks held long' and 'compensation is hard'. Chapter three covers the two foundations none of this ships without: idempotency (a redelivered message must not run the business twice) and eventual consistency (the local-message-table / outbox pattern, so that 'wrote the database' and 'sent the message' cannot succeed one without the other).",
    },
  },
  {
    id: "m6", arch: "m6-arch", code: "OB", accent: "accent", level: 2,
    zh: "可观测性", en: "Observability",
    tagline: { zh: "单体报错你看一份日志就够了。请求跨了八个服务之后,「哪里慢了」本身就成了一个需要工具才能回答的问题。", en: "In a monolith one log tells you enough. After a request crosses eight services, 'where did it get slow' becomes a question you need tooling to answer." },
    description: {
      zh: "微服务把一次请求切成了跨越多个进程、多台机器的旅程,而这直接摧毁了单体时代最朴素的排障手段:看日志、打断点、读堆栈。当用户投诉「下单很慢」,慢在网关、订单、库存、支付还是那次数据库查询?没有可观测性,这个问题无法回答,你只能靠猜。这个模块给你三只眼睛。第一章讲链路追踪:用 Micrometer Tracing 给每条请求打上一个贯穿全链路的 traceId,把它在每个服务停留的时间画成一张瀑布图,一眼看出那一跳把 800 毫秒花在了哪里——你会亲手在治理台上看这张瀑布图怎么把「慢」定位到具体某一段 span。第二章讲指标:用 Actuator + Micrometer 暴露、用 Prometheus 采集、用 Grafana 展示,并讲清一个反直觉但致命的事实——平均延迟是骗人的,真正决定用户体验的是 P99,而当你把请求量放大,平均值纹丝不动、P99 却已经爆了。第三章讲日志聚合:把散落在几十个实例里的日志用 traceId 串成一条完整故事,以及采样率怎么在「存得起」和「查得到」之间做取舍。",
      en: "Microservices slice one request into a journey across several processes and machines, and that directly destroys the monolith era's simplest debugging tools: read the log, set a breakpoint, walk the stack. When a user complains 'checkout is slow', is it slow in the gateway, order, inventory, payment, or that one database query? Without observability the question cannot be answered — you are guessing. This module gives you three eyes. Chapter one is distributed tracing: with Micrometer Tracing, stamp every request with a traceId that runs through the whole chain, draw the time it spent at each service as a waterfall, and see at a glance which hop burned 800 ms — you will watch that waterfall pin 'slow' to one concrete span on the bench. Chapter two is metrics: expose with Actuator + Micrometer, scrape with Prometheus, show with Grafana, and confront a counter-intuitive, deadly fact — the average latency lies, what actually decides user experience is P99, and as you turn up the request rate the average holds steady while the P99 has already blown out. Chapter three is log aggregation: stitch logs scattered across dozens of instances into one story by traceId, and how the sampling rate trades 'affordable to store' against 'findable when you need it'.",
    },
  },
  {
    id: "m7", arch: "m7-arch", code: "OP", accent: "primary", level: 3,
    zh: "部署、弹性伸缩与多机房", en: "Deployment, Elastic Scaling & Multi-Region",
    tagline: { zh: "架构图上服务是一个个方框;在生产里,它们是跑在具体机器上、会因为一台机器宕机而一起消失的进程。", en: "On the diagram, services are boxes; in production they are processes on specific machines that vanish together when one machine dies." },
    description: {
      zh: "这是正面回答三个最难运维问题的模块,也是很多人做微服务真正的痛点所在。第一章讲部署拓扑——不同的服务该部署到不同的服务器:怎么把一堆服务装箱到一批机器上(资源装箱),什么该放一起、什么必须隔离(亲和与反亲和),以及一个残酷的问题——当一台服务器宕机,恰好死在它上面的是哪几个服务、会不会因为你把订单和支付放在了同一台机器上而让整个下单链路一起消失(爆炸半径)。第二章讲弹性伸缩与自动扩容:大促流量来了,Kubernetes 的 HPA 怎么根据 CPU 或每秒请求数把副本从 3 自动扩到 12,以及三个真实世界的坑——冷启动滞后(新副本要几十秒才就绪,这段时间请求照样超时)、抖动(没有稳定窗口,副本数会在流量边界上疯狂上下横跳)、以及成本与延迟的永恒拉锯(留多少余量)。第三章讲异地多活与跨机房数据复制:两个甚至三个机房怎么同时对外服务、数据怎么在机房之间复制、复制延迟怎么变成一次「读不到自己刚写的数据」、两地同时写同一条记录冲突了怎么办、以及机房级故障切换时你能接受丢多少数据(RPO)、能容忍多久不可用(RTO)。",
      en: "This is the module that answers the three hardest operational questions head-on, and where a lot of real microservices pain actually lives. Chapter one is deployment topology — putting different services on different servers: how to bin-pack a pile of services onto a fleet of machines (resource packing), what belongs together and what must be isolated (affinity and anti-affinity), and a brutal question — when one server dies, exactly which services die with it, and did co-locating order and payment on the same machine just make the whole checkout chain disappear at once (blast radius). Chapter two is elastic scaling and autoscaling: when the sale traffic arrives, how Kubernetes' HPA scales replicas from 3 to 12 on CPU or requests-per-second, and three real-world traps — cold-start lag (a new replica takes tens of seconds to be ready, and requests time out meanwhile), flapping (without a stabilisation window the replica count thrashes up and down at a traffic boundary), and the eternal tug-of-war between cost and latency (how much headroom to keep). Chapter three is multi-region active-active and cross-DC replication: how two or even three data centres serve at once, how data replicates between them, how replication lag becomes a 'cannot read my own write', what to do when both sites write the same record and conflict, and how much data you can lose (RPO) and how long you can be down (RTO) during a region-level failover.",
    },
  },
  {
    id: "m8", arch: "m8-arch", code: "HA", accent: "accent", level: 3,
    zh: "安全、韧性与实战", en: "Security, Resilience & Capstone",
    tagline: { zh: "系统的强度不等于晴天时的强度,等于故障、攻击、和你从没想过的组合同时发生时,它还剩多少。", en: "A system's strength is not what it has on a sunny day; it is what remains when failure, attack and combinations you never imagined all arrive at once." },
    description: {
      zh: "最后一个模块把前面所有的机制放进对抗环境里检验,再用一个完整的例子把它们串起来。第一章讲微服务安全:单体只有一道城墙,微服务是一座城里几十栋楼,你不能假设进了城门就都是好人——OAuth2 与 JWT 怎么在网关发令牌、在服务间传递身份,mTLS 怎么让服务之间互相验明正身,以及「零信任」在实践里到底意味着每次调用都要付出多少校验成本。第二章讲混沌工程:高可用不是靠祈祷得来的,是靠主动往系统里注入故障、并验证它扛得住得来的——随机杀实例、给依赖注入延迟和错误,看前面学的熔断、超时、重试、隔离是不是真的把爆炸半径关住了,还是只是配置文件里的一行摆设。第三章是综合实战:一个电商微服务系统,把注册发现、网关、负载均衡、熔断、消息、事务、追踪、弹性伸缩、异地多活全部接起来,让一条下单请求在里面完整地走一遍;你可以往里面加压、注入故障,看整个系统作为一个整体怎么响应。模块最后附一份微服务成熟度自评,把这本书的每一条主线变成一个你可以给自己团队打分的问题。",
      en: "The last module tests every mechanism so far in an adversarial environment, then ties them together in one complete example. Chapter one is microservice security: a monolith has one city wall, microservices are dozens of buildings inside a city, and you cannot assume everyone past the gate is friendly — how OAuth2 and JWT issue a token at the gateway and carry identity between services, how mTLS lets services prove who they are to each other, and what 'zero trust' actually costs in per-call validation in practice. Chapter two is chaos engineering: high availability is not prayed into existence, it is earned by deliberately injecting failure and verifying the system survives — killing instances at random, injecting latency and errors into dependencies, and seeing whether the breaking, timeouts, retries and bulkheads you learned really hold the blast radius, or are just a decorative line in a config file. Chapter three is the capstone: an e-commerce microservice system wiring together discovery, gateway, load balancing, breaking, messaging, transactions, tracing, elastic scaling and active-active, letting one checkout request run the whole course; you can load it, inject failures and watch the system respond as a whole. The module closes with a microservice maturity self-assessment that turns every thread of this book into a question you can score your own team against.",
    },
  },
];

const CHAPTERS = [
  /* ============ M1 · FD 全景与拆分 ============ */
  {
    id: "sc1", code: "FD1", moduleId: "m1", difficulty: 1, hours: 4, prereq: [], viz: "taxLab",
    props: ["分布式税", "组合可用率", "故障域", "延迟叠加", "何时不该微服务"],
    title: { zh: "从单体到微服务:你到底买到了什么", en: "Monolith to Microservices: What You Actually Bought" },
    summary: {
      zh: "微服务是一个被过度推销的架构。它真实的好处是组织性的:三个团队可以各自发布、各自扩容、用各自的技术栈,不必再挤在同一个发布火车上。但它的代价是物理性的,而且很多人直到上线才发现——一个进程内绝不会失败的方法调用,拆成远程调用后会超时、会丢包、会在网络分区时彻底消失。本章用一个你能亲手调的模型把这笔账算给你看:把一个可用率 99.9% 的单体,拆成一条要串行调用 N 个服务的链路,每个服务各自 99.9%,整体可用率是 0.999 的 N 次方——N=10 时掉到 99%,也就是说你什么坏事都没做,可用率却掉了十倍。治理台让你拖动服务数量、每个服务的可用率、以及是否加上重试与熔断,看着那条组合可用率曲线往下掉、再被韧性手段拉回来。学完这一章,你不会更爱微服务,但你会知道它索要的是什么,以及什么时候答案应该是「别拆」。",
      en: "Microservices is an over-sold architecture. Its real benefit is organisational: three teams ship, scale and choose their stack independently, no longer crammed onto one release train. But its cost is physical, and many people only discover it in production — an in-process call that never fails becomes a remote call that times out, drops packets and vanishes entirely during a partition. This chapter computes that bill with a model you can move by hand: take a 99.9% monolith, split it into a chain that calls N services in series, each 99.9%, and the composite availability is 0.999 to the Nth — at N=10 it falls to 99%, meaning you did nothing wrong and lost a factor of ten in availability. The bench lets you drag the service count, each service's availability, and whether retries and a breaker are added, watching the composite curve fall and then be pulled back by resilience. You will not love microservices more after this chapter, but you will know what they demand, and when the answer should be 'do not split'.",
    },
    objectives: [
      { zh: "分清微服务的组织性收益与技术性代价", en: "Separate the organisational benefits of microservices from the technical costs" },
      { zh: "用组合可用率公式估算一条调用链的可用率", en: "Estimate a call chain's availability with the composite-availability formula" },
      { zh: "解释为什么服务越多、整体越脆弱", en: "Explain why more services make the whole more fragile" },
      { zh: "说出三个「不该拆微服务」的信号", en: "Name three signals that you should not split into microservices" },
    ],
    outline: [
      { zh: "单体的三个真实痛点,和三个假痛点", en: "The monolith's three real pains, and three false ones" },
      { zh: "分布式税:可用率、延迟、复杂度的账单", en: "The distributed tax: a bill in availability, latency and complexity" },
      { zh: "组合可用率:0.999 的十次方是多少", en: "Composite availability: what is 0.999 to the tenth" },
      { zh: "什么时候该留在单体里", en: "When to stay in the monolith" },
    ],
  },
  {
    id: "sc2", code: "FD2", moduleId: "m1", difficulty: 1, hours: 5, prereq: ["sc1"], viz: "stackLab",
    props: ["Netflix / Alibaba / 官方", "版本对齐", "Spring Cloud BOM", "组件选型", "技术栈演进"],
    title: { zh: "Spring Cloud 全家桶:三套实现与版本地狱", en: "The Spring Cloud Stack: Three Implementations & Version Hell" },
    summary: {
      zh: "「Spring Cloud」不是一个框架,是一组规范加上几套互相竞争的实现,而这正是新手第一天就会撞上的混乱。同一件事——服务发现、负载均衡、熔断、网关——每一样都有 Netflix 的老实现(Eureka/Ribbon/Hystrix/Zuul,大多已进入维护或退役)、Spring 官方的新实现(LoadBalancer/Resilience4j/Gateway)、以及 Alibaba 的一套(Nacos/Sentinel/Seata/Dubbo)。本章帮你在这三套之间做出有依据的选择:哪些已经死了不要再用、哪些是今天的默认、哪些在中文社区因为 Nacos 和 Sentinel 而特别流行。然后是那个让无数人启动失败、报错还看不懂的坑——版本对齐:Spring Boot、Spring Cloud、Spring Cloud Alibaba 三者的版本必须严格匹配(比如 Boot 3.2 ↔ Cloud 2023.0 ↔ Alibaba 2023.0.x),对不上,轻则某个自动配置不生效,重则应用直接起不来。治理台给你一个可交互的版本兼容矩阵和组件选型器:选定一个 Boot 版本,看哪些 Cloud/Alibaba 版本亮绿灯,以及每个功能位该填哪个组件。",
      en: "'Spring Cloud' is not a framework; it is a set of specifications plus several competing implementations, and that is the chaos a newcomer hits on day one. The same job — discovery, load balancing, breaking, gateway — each has Netflix's old set (Eureka/Ribbon/Hystrix/Zuul, mostly in maintenance or retired), Spring's official new set (LoadBalancer/Resilience4j/Gateway), and Alibaba's set (Nacos/Sentinel/Seata/Dubbo). This chapter helps you choose among the three with reasons: what is dead and should not be used, what is today's default, and what is especially popular in the Chinese community thanks to Nacos and Sentinel. Then the trap that makes countless people fail to start with an unreadable error — version alignment: Spring Boot, Spring Cloud and Spring Cloud Alibaba versions must match strictly (say Boot 3.2 ↔ Cloud 2023.0 ↔ Alibaba 2023.0.x), and a mismatch either silently disables an auto-configuration or refuses to boot at all. The bench gives you an interactive compatibility matrix and a component picker: fix a Boot version and see which Cloud/Alibaba versions light green, and which component fills each functional slot.",
    },
    objectives: [
      { zh: "分清 Netflix、官方、Alibaba 三套组件的现状", en: "Distinguish the current status of the Netflix, official and Alibaba component sets" },
      { zh: "为每个功能位(发现/负载/熔断/网关)选出今天的默认组件", en: "Pick today's default component for each slot (discovery/LB/breaking/gateway)" },
      { zh: "用 BOM 对齐 Boot / Cloud / Alibaba 三者版本", en: "Align Boot / Cloud / Alibaba versions with the BOM" },
      { zh: "读懂一个由版本不匹配引起的启动错误", en: "Read a startup error caused by a version mismatch" },
    ],
    outline: [
      { zh: "一件事,三套实现:发现、负载、熔断、网关", en: "One job, three implementations: discovery, LB, breaking, gateway" },
      { zh: "谁死了、谁是默认、谁在中文社区流行", en: "What is dead, what is default, what is popular in China" },
      { zh: "版本地狱:Boot ↔ Cloud ↔ Alibaba 的对齐表", en: "Version hell: the Boot ↔ Cloud ↔ Alibaba alignment table" },
      { zh: "用 dependencyManagement / BOM 锁死版本", en: "Locking versions with dependencyManagement / BOM" },
    ],
  },
  {
    id: "sc3", code: "FD3", moduleId: "m1", difficulty: 2, hours: 6, prereq: ["sc1"], viz: "splitLab",
    props: ["领域驱动设计", "限界上下文", "服务粒度", "高内聚低耦合", "分布式单体"],
    title: { zh: "服务拆分:按业务边界,而不是按数据表", en: "Decomposition: Cut Along Business Seams, Not Tables" },
    summary: {
      zh: "拆分是微服务里最贵的一个决定,因为它最难改。拆得太粗,你得到的还是一个单体,只是多了网络延迟;拆得太细,你得到的是「分布式单体」——每一个业务操作都要跨好几个服务,一次下单要发十几个远程调用,还拖着一个谁都不敢碰的分布式事务。本章给你一把有原则的刀:按业务能力和领域驱动设计的限界上下文来切,让每个服务拥有自己的数据、对外只暴露行为、内部高内聚。关键的判据是耦合——如果两个「服务」总是必须一起改、一起发布、共享一张表,那它们本来就是一个服务,你只是硬把它们劈开了。治理台把这件事量化:拖动拆分粒度,看跨服务调用数、分布式事务的牵连范围、和单次改动波及的服务数怎么随粒度变化,你会看到一条清晰的 U 形曲线——太粗和太细都糟,最优点在中间,而它的位置由你的业务耦合决定,不由「微服务越小越好」这句口号决定。",
      en: "Decomposition is the most expensive decision in microservices because it is the hardest to change. Cut too coarse and you still have a monolith, just with added network latency; cut too fine and you get a 'distributed monolith' — every business operation spans several services, one checkout fires a dozen remote calls, dragging a distributed transaction nobody dares touch. This chapter hands you a principled knife: cut along business capabilities and the bounded contexts of domain-driven design, so each service owns its data, exposes only behaviour, and is cohesive inside. The key test is coupling — if two 'services' always change together, deploy together and share a table, they were one service and you merely pried them apart. The bench quantifies this: drag the granularity and watch cross-service calls, the reach of distributed transactions, and the number of services touched by one change move with it — you will see a clear U-curve where too coarse and too fine are both bad, the optimum sits in the middle, and its position is set by your business coupling, not by the slogan 'smaller is better'.",
    },
    objectives: [
      { zh: "用限界上下文而不是数据表来划分服务", en: "Draw service boundaries with bounded contexts, not database tables" },
      { zh: "识别「分布式单体」的症状", en: "Recognise the symptoms of a distributed monolith" },
      { zh: "用耦合度判断两个服务是否该合并", en: "Use coupling to judge whether two services should merge" },
      { zh: "解释服务粒度的 U 形成本曲线", en: "Explain the U-shaped cost curve of service granularity" },
    ],
    outline: [
      { zh: "两种拆错:太粗的伪微服务与太细的分布式单体", en: "Two wrong cuts: the coarse pseudo-service and the fine distributed monolith" },
      { zh: "限界上下文:一个服务拥有一块领域", en: "Bounded contexts: one service owns one domain" },
      { zh: "每个服务拥有自己的数据,不共享库", en: "Each service owns its data — no shared database" },
      { zh: "粒度的 U 形曲线:最优点在哪", en: "The U-curve of granularity: where the optimum sits" },
    ],
  },

  /* ============ M2 · RD 服务注册与发现 ============ */
  {
    id: "sc4", code: "RD1", moduleId: "m2", difficulty: 2, hours: 5, prereq: ["sc1"], viz: "registryLab",
    props: ["心跳", "租约与 TTL", "健康检查", "摘除时延", "误摘除"],
    title: { zh: "注册中心原理:一本追不上真相的电话簿", en: "How a Registry Works: A Phone Book Chasing the Truth" },
    summary: {
      zh: "注册中心要解决的问题一句话说得清:服务实例的地址一直在变,调用方需要在运行时找到当前活着的实例。做法也简单:每个实例启动时向注册中心登记,之后定期发心跳续租,注册中心据此维护一份实例清单,调用方来查。难的是那个中间地带——当一个实例连续几秒没发心跳,它是真死了,还是网络抖了一下、Full GC 停顿了一下、或者只是心跳包在路上堵了?摘得太快,你会把一个只是打了个盹的健康实例踢出去,造成不必要的失败;摘得太慢,你会继续把流量打给一个已经死了的实例,每一个打过去的请求都超时。本章讲清心跳、租约、TTL、主动健康检查这几个机制,以及它们背后的时间参数怎么共同决定「故障检测有多快」和「误摘除有多频繁」这对此消彼长的指标。治理台让你调心跳间隔、超时倍数、网络抖动率,看着故障检测时延和误摘除率一个降另一个升,亲手体会这里没有完美解、只有权衡。",
      en: "What a registry solves is one sentence: service addresses keep changing, and callers must find the currently live instances at runtime. The mechanism is simple too: each instance registers on startup, then renews its lease with periodic heartbeats, the registry keeps a list from that, and callers query it. The hard part is the middle ground — when an instance misses heartbeats for a few seconds, is it truly dead, or did the network hiccup, a Full GC pause, or a heartbeat packet get stuck in traffic? Evict too fast and you kick out a healthy instance that merely napped, causing needless failures; evict too slowly and you keep sending traffic to a dead instance, timing out every request. This chapter works through heartbeats, leases, TTL and active health checks, and how their timing parameters jointly set 'how fast failures are detected' against 'how often healthy instances are wrongly evicted'. The bench lets you tune the heartbeat interval, the timeout multiple and the network jitter rate, watching detection time fall as false-eviction rises — feeling by hand that there is no perfect answer here, only a trade.",
    },
    objectives: [
      { zh: "描述注册、续租、发现的完整生命周期", en: "Describe the full register / renew / discover lifecycle" },
      { zh: "解释心跳间隔与超时如何决定摘除时延", en: "Explain how heartbeat interval and timeout set eviction latency" },
      { zh: "权衡快速检测与误摘除之间的矛盾", en: "Trade off fast detection against false eviction" },
      { zh: "区分客户端心跳与服务端主动健康检查", en: "Distinguish client heartbeats from server-side active health checks" },
    ],
    outline: [
      { zh: "为什么服务地址不能写死在配置里", en: "Why service addresses cannot be hard-coded in config" },
      { zh: "心跳、租约、TTL:实例怎么证明自己还活着", en: "Heartbeat, lease, TTL: how an instance proves it is alive" },
      { zh: "摘除时延:检测快 vs 误杀少", en: "Eviction latency: fast detection vs few false kills" },
      { zh: "客户端缓存:注册中心挂了还能不能调用", en: "Client-side caching: can you still call when the registry is down" },
    ],
  },
  {
    id: "sc5", code: "RD2", moduleId: "m2", difficulty: 2, hours: 5, prereq: ["sc4"], viz: "eurekaLab",
    props: ["Eureka", "AP 取向", "自我保护", "Peer 复制", "客户端缓存"],
    title: { zh: "Eureka 实战:自我保护到底在保护谁", en: "Eureka in Practice: Whom Does Self-Preservation Protect" },
    summary: {
      zh: "Eureka 是 Spring Cloud 世界里最经典的注册中心,而它最出名、也最被误解的特性,叫「自我保护」。要理解它,先要理解 Eureka 的立场:在 CAP 里它坚定地选 AP——宁可给你一份可能过时的实例清单,也不在网络出问题时把清单清空。自我保护正是这个立场的具体形态:当 Eureka 发现短时间内大量实例的心跳都不见了,它不认为「这些实例全挂了」,而认为「更可能是我自己和这些实例之间的网络断了」,于是它停止摘除任何实例,保住整张表,等网络恢复。这个设计在真实的网络分区里能救命,但也会让你在测试环境里困惑——为什么我明明关掉了服务,Eureka 还显示它在线?本章讲清自我保护的触发阈值(默认 85% 的续租比例)、Peer 之间怎么互相复制注册信息、以及客户端本地缓存怎么让「注册中心短暂不可用」不等于「整个系统瘫痪」。治理台模拟一次网络分区,让你打开和关掉自我保护,看它怎么在「保留过时实例」和「大规模误摘除风暴」之间做选择。",
      en: "Eureka is the most classic registry in the Spring Cloud world, and its most famous and most misunderstood feature is 'self-preservation'. To understand it, understand Eureka's stance: in CAP it firmly chooses AP — it would rather hand you a possibly stale instance list than wipe the list when the network misbehaves. Self-preservation is the concrete shape of that stance: when Eureka sees many instances' heartbeats disappear in a short window, it does not conclude 'those instances all died' but 'more likely the network between me and them broke', so it stops evicting anything, keeps the whole table, and waits for the network to recover. This design saves lives in a real partition but also confuses you in a test environment — why does Eureka still show a service online after I shut it down? This chapter works through the trigger threshold (a default 85% renewal ratio), how peers replicate registrations to each other, and how client-side caching makes 'the registry is briefly unavailable' not mean 'the whole system is down'. The bench simulates a partition and lets you toggle self-preservation, watching it choose between keeping stale instances and a mass false-eviction storm.",
    },
    objectives: [
      { zh: "解释 Eureka 为什么是 AP 而非 CP", en: "Explain why Eureka is AP rather than CP" },
      { zh: "说清自我保护的触发条件与后果", en: "State the trigger and consequences of self-preservation" },
      { zh: "描述 Eureka Peer 之间的注册信息复制", en: "Describe registration replication between Eureka peers" },
      { zh: "解释客户端缓存如何提升整体可用性", en: "Explain how client-side caching raises overall availability" },
    ],
    outline: [
      { zh: "Eureka 的 AP 立场:可用优先于一致", en: "Eureka's AP stance: availability before consistency" },
      { zh: "自我保护:阈值、行为、以及它救过谁", en: "Self-preservation: threshold, behaviour, and whom it has saved" },
      { zh: "Peer 复制:多个 Eureka 怎么组集群", en: "Peer replication: how several Eurekas form a cluster" },
      { zh: "客户端缓存与区域感知路由", en: "Client caching and zone-aware routing" },
    ],
  },
  {
    id: "sc6", code: "RD3", moduleId: "m2", difficulty: 2, hours: 6, prereq: ["sc4"], viz: "nacosLab",
    props: ["Nacos", "CP / AP 切换", "Raft vs Distro", "命名空间与分组", "配置+发现二合一"],
    title: { zh: "Nacos:在 CP 和 AP 之间亲手切一次", en: "Nacos: Switch Between CP and AP by Hand" },
    summary: {
      zh: "Nacos 在中文社区几乎成了默认的注册与配置中心,它比 Eureka 多了两个关键能力,而这一章就围绕它们展开。第一,它把注册中心和配置中心合二为一,用命名空间(隔离环境:开发/测试/生产)和分组(隔离业务)把成百上千个服务和配置项组织起来。第二,也是最能加深你对分布式理解的一点——它能在一致性模型之间切换:临时实例走 AP 模式(Distro 协议,靠 gossip 传播,高可用,某个 Nacos 节点挂了照样能读写),持久实例和配置走 CP 模式(Raft 协议,强一致,要多数节点存活才能写)。为什么服务发现适合 AP、配置适合 CP?因为发现要的是「尽量别断」,读到一个稍微过时的实例列表不致命;而配置要的是「所有人读到同一份」,一半实例读到新开关、一半读到旧开关才是灾难。治理台模拟一次 Nacos 集群的网络分区,让你在 AP 和 CP 之间切换,亲眼看 AP 模式下少数派仍能服务(但可能读到旧数据)、CP 模式下少数派拒绝写入(但保证不分裂)。",
      en: "Nacos has become the near-default registry and config centre in the Chinese community, and it adds two key abilities over Eureka that this chapter is built around. First, it merges the registry and config centre into one, organising hundreds of services and config items with namespaces (isolating environments: dev/test/prod) and groups (isolating business lines). Second, and the part that most deepens your grasp of distributed systems — it can switch consistency models: ephemeral instances run AP (the Distro protocol, spread by gossip, highly available, still readable and writable when a Nacos node dies), while persistent instances and config run CP (the Raft protocol, strongly consistent, writable only with a majority alive). Why is discovery suited to AP and config to CP? Because discovery wants 'try not to break' — reading a slightly stale instance list is not fatal — while config wants 'everyone reads the same' — half the instances on the new switch and half on the old is the disaster. The bench simulates a partition of a Nacos cluster and lets you switch AP and CP, watching the minority still serve under AP (possibly stale) and refuse writes under CP (but never split-brain).",
    },
    objectives: [
      { zh: "用命名空间与分组组织服务和配置", en: "Organise services and config with namespaces and groups" },
      { zh: "解释临时实例(AP)与持久实例(CP)的区别", en: "Explain ephemeral (AP) versus persistent (CP) instances" },
      { zh: "说明为什么发现选 AP、配置选 CP", en: "State why discovery chooses AP and config chooses CP" },
      { zh: "在网络分区下预测 AP 与 CP 各自的行为", en: "Predict AP and CP behaviour under a network partition" },
    ],
    outline: [
      { zh: "Nacos = 注册中心 + 配置中心", en: "Nacos = registry + config centre" },
      { zh: "命名空间/分组/DataId:多环境多业务的组织", en: "Namespace/group/DataId: organising many envs and lines" },
      { zh: "Distro(AP)与 Raft(CP):两种一致性", en: "Distro (AP) and Raft (CP): two consistencies" },
      { zh: "分区时会发生什么:亲手切一次", en: "What happens under partition: switch it yourself" },
    ],
  },

  /* ============ M3 · CM 通信、负载与弹性 ============ */
  {
    id: "sc7", code: "CM1", moduleId: "m3", difficulty: 2, hours: 5, prereq: ["sc4"], viz: "feignLab",
    props: ["OpenFeign", "声明式调用", "连接/读取超时", "重试与退避", "重试风暴"],
    title: { zh: "OpenFeign:让远程调用像本地方法(的危险)", en: "OpenFeign: Making Remote Calls Look Local (and the Danger)" },
    summary: {
      zh: "OpenFeign 的卖点是优雅:定义一个接口,加上 @FeignClient 和几个 Spring MVC 注解,你就能像调用本地方法一样发起 HTTP 远程调用,Feign 在背后帮你处理序列化、负载均衡、和服务发现。这份优雅让代码好读,但也埋了一个认知陷阱——本地方法调用要么立即返回、要么抛异常,它不会「卡住」;而远程调用会卡住,会因为下游慢而慢,会因为下游挂而超时。如果你不显式设置 connectTimeout 和 readTimeout,一次下游变慢就可能让上游的线程池被慢调用占满,进而整条链路一起卡死。更隐蔽的是重试:Feign 可以配置失败重试,听起来很稳,但当下游正因为过载而变慢时,重试会把请求量再翻一倍、三倍,把它彻底压垮——这就是「重试风暴」,一个把小故障放大成大故障的经典反模式。本章讲清 Feign 的超时、重试、退避怎么配,以及为什么重试必须搭配退避、抖动和熔断才安全。治理台让你给下游注入延迟,打开重试,看请求量怎么被放大、下游怎么被自己人压垮。",
      en: "OpenFeign's selling point is elegance: define an interface, add @FeignClient and a few Spring MVC annotations, and you make an HTTP remote call as if it were a local method, with Feign handling serialisation, load balancing and discovery behind the scenes. That elegance makes code readable but plants a cognitive trap — a local call either returns immediately or throws, it does not 'hang'; a remote call hangs, slows when the downstream slows, and times out when the downstream dies. If you do not set connectTimeout and readTimeout explicitly, one slow downstream can fill the caller's thread pool with slow calls and jam the whole chain. Subtler still is retry: Feign can retry on failure, which sounds safe, but when the downstream is slow precisely because it is overloaded, retries double and triple the request rate and finish it off — this is the 'retry storm', a classic anti-pattern that amplifies a small fault into a large one. This chapter works through Feign's timeouts, retries and backoff, and why retry is only safe with backoff, jitter and a breaker. The bench lets you inject latency into a downstream, turn on retries, and watch the request rate amplify until the downstream is crushed by its own callers.",
    },
    objectives: [
      { zh: "用 @FeignClient 定义一个声明式远程调用", en: "Define a declarative remote call with @FeignClient" },
      { zh: "正确设置连接超时与读取超时", en: "Set connect and read timeouts correctly" },
      { zh: "解释重试风暴怎么把过载放大", en: "Explain how a retry storm amplifies overload" },
      { zh: "用退避、抖动、熔断让重试变安全", en: "Make retries safe with backoff, jitter and a breaker" },
    ],
    outline: [
      { zh: "声明式调用:一个接口就是一个客户端", en: "Declarative calls: an interface is a client" },
      { zh: "两个超时:connectTimeout 与 readTimeout", en: "Two timeouts: connectTimeout and readTimeout" },
      { zh: "重试风暴:好心的重试怎么压垮下游", en: "The retry storm: how well-meaning retries crush a downstream" },
      { zh: "安全重试:退避 + 抖动 + 幂等 + 熔断", en: "Safe retry: backoff + jitter + idempotency + breaker" },
    ],
  },
  {
    id: "sc8", code: "CM2", moduleId: "m3", difficulty: 2, hours: 5, prereq: ["sc7"], viz: "lbLab",
    props: ["Spring Cloud LoadBalancer", "轮询/随机/最少连接", "响应时间加权", "尾延迟 P99", "实例异构"],
    title: { zh: "客户端负载均衡:轮询为什么会害了你", en: "Client-Side Load Balancing: Why Round-Robin Betrays You" },
    summary: {
      zh: "负载均衡听起来是个已解决的问题——不就是轮流把请求发给每个实例吗?但「轮流」恰恰是最容易出事的策略,而这一章要讲清为什么。Spring Cloud 把负载均衡放在客户端(Spring Cloud LoadBalancer 取代了退役的 Ribbon),这本身就是个重要选择:客户端从注册中心拿到实例清单,自己决定这次调哪个,因此它知道有几个实例、理论上也能知道每个多忙——这是前面架一台 Nginx 做不到的。问题出在实例并不总是一样快:有的机器配置低、有的正在 GC、有的背着别的重活。这时候轮询会固执地给那个最慢的实例分配等量的请求,而这些请求会排队、会超时,把整体的 P99 尾延迟拉爆——注意,平均延迟可能看起来还行,但用户感受到的是 P99。最少连接、基于响应时间加权这些策略之所以存在,就是为了不再平等对待不平等的实例。治理台给你几个快慢不一的实例,让你在轮询、随机、最少连接、响应时间加权之间切换,看 P99 尾延迟怎么随策略塌下来或者爆上去。",
      en: "Load balancing sounds like a solved problem — just send requests to each instance in turn? But 'in turn' is exactly the strategy most likely to hurt you, and this chapter explains why. Spring Cloud puts load balancing on the client (Spring Cloud LoadBalancer replaced the retired Ribbon), which is itself an important choice: the client gets the instance list from the registry and decides which to call, so it knows how many instances exist and in principle how busy each is — something a Nginx out front cannot do. The problem is that instances are not equally fast: one machine is weaker, one is in GC, one carries other heavy work. Round-robin then stubbornly assigns equal requests to the slowest instance, and those requests queue, time out, and blow up the P99 tail — note the average may still look fine while the user feels the P99. Least-connections and response-time-weighted strategies exist precisely to stop treating unequal instances equally. The bench gives you instances of differing speed and lets you switch between round-robin, random, least-connections and response-time weighting, watching the P99 tail collapse or explode with the strategy.",
    },
    objectives: [
      { zh: "解释客户端负载均衡相对反向代理的优势", en: "Explain the advantage of client-side LB over a reverse proxy" },
      { zh: "说清轮询在实例异构时为什么失效", en: "State why round-robin fails when instances are heterogeneous" },
      { zh: "对比轮询、随机、最少连接、响应时间加权", en: "Compare round-robin, random, least-connections, response-time weighting" },
      { zh: "用 P99 而非平均值评价负载均衡效果", en: "Judge load balancing by P99, not the average" },
    ],
    outline: [
      { zh: "为什么负载均衡在客户端而不是前面", en: "Why load balancing lives on the client, not out front" },
      { zh: "轮询的陷阱:平等对待不平等的实例", en: "The round-robin trap: equal traffic to unequal instances" },
      { zh: "四种策略与各自的适用场景", en: "Four strategies and where each fits" },
      { zh: "P99 尾延迟:平均值骗人", en: "The P99 tail: the average lies" },
    ],
  },
  {
    id: "sc9", code: "CM3", moduleId: "m3", difficulty: 3, hours: 7, prereq: ["sc7"], viz: "breakerLab",
    props: ["Resilience4j / Sentinel", "熔断三态", "限流", "降级 fallback", "舱壁隔离"],
    title: { zh: "熔断、限流、降级、隔离:把故障关在局部", en: "Breaking, Limiting, Fallback, Bulkheads: Keep Failure Local" },
    summary: {
      zh: "这是本模块、可能也是整本书最重要的一章,因为它讲的是微服务能否上线的底线:当一个服务出问题时,怎么不让它把整个系统一起拖垮。核心机制是熔断器,它有三个状态,像一个真实的保险丝:平时是「关闭」(正常放行请求并统计失败率);当失败率超过阈值,它「打开」(直接快速失败,不再把请求发给明显不行的下游,把宝贵的线程和内存留给还能救的请求);过一段时间它进入「半开」(放几个探针请求过去试探,成功就恢复关闭,失败就继续打开)。为什么这至关重要?因为没有熔断,一个变慢的下游会让上游的线程一个个卡在等待上,直到线程池耗尽,然后上游也开始拒绝服务,故障就这样一层层往上级联,最后整个系统雪崩。熔断之外,还有三件配套的事:限流(在入口就挡住超过容量的请求)、降级(下游不可用时返回一个兜底结果而不是报错)、舱壁隔离(给不同的下游分配独立的线程池,让一个下游的故障淹不到别的)。本章用 Resilience4j 和 Sentinel 讲清这四件事,治理台让你亲手把下游打挂、看熔断器跳开、再看它半开探活恢复。",
      en: "This is the most important chapter in the module and perhaps the book, because it is the bar for whether microservices can ship: when one service fails, how do you stop it from dragging the whole system down. The core mechanism is the circuit breaker, with three states like a real fuse: normally 'closed' (passing requests and counting the failure rate); when the failure rate crosses a threshold it 'opens' (failing fast, no longer sending requests to a clearly broken downstream, keeping precious threads and memory for requests that can still be served); after a while it goes 'half-open' (letting a few probe requests through — recover to closed on success, stay open on failure). Why does this matter so much? Because without a breaker, a slowing downstream leaves the caller's threads stuck waiting one by one until the pool is exhausted, then the caller starts refusing service too, and the fault cascades upward layer by layer until the whole system avalanches. Beyond breaking there are three companions: rate limiting (reject over-capacity requests at the door), fallback (return a safe default instead of an error when a downstream is down), and bulkheads (give each downstream its own thread pool so one's failure cannot drown the others). This chapter works through all four with Resilience4j and Sentinel; the bench lets you kill a downstream by hand, watch the breaker trip, and watch it probe back to health on half-open.",
    },
    objectives: [
      { zh: "画出并解释熔断器的关闭/打开/半开三态", en: "Draw and explain the breaker's closed/open/half-open states" },
      { zh: "说清没有熔断时故障如何级联成雪崩", en: "State how failure cascades into an avalanche without a breaker" },
      { zh: "区分熔断、限流、降级、隔离四件事", en: "Distinguish breaking, limiting, fallback and bulkheads" },
      { zh: "为一个下游调用配置合理的熔断阈值", en: "Configure sensible breaker thresholds for a downstream call" },
    ],
    outline: [
      { zh: "雪崩:一个慢下游怎么拖垮全链路", en: "The avalanche: how one slow downstream drags the chain down" },
      { zh: "熔断器三态机:关、开、半开", en: "The three-state breaker: closed, open, half-open" },
      { zh: "限流与降级:入口挡住、出口兜底", en: "Limiting and fallback: reject at the door, cushion at the exit" },
      { zh: "舱壁隔离:别让一个下游淹了所有线程", en: "Bulkheads: do not let one downstream drown every thread" },
    ],
  },
  {
    id: "sc26", code: "CM4", moduleId: "m3", difficulty: 2, hours: 5, prereq: ["sc7"], viz: "rpcLab",
    props: ["Protobuf vs JSON", "HTTP/2 多路复用", "强类型契约", "四种流式", "对内 vs 对外"],
    title: { zh: "gRPC 还是 REST:服务之间用什么说话", en: "gRPC or REST: How Services Talk to Each Other" },
    summary: {
      zh: "CM1 里你用 OpenFeign 调服务,那本质是基于 HTTP、用 JSON 传输的 REST——微服务的默认选择,而且理由很充分:它通用、人可读、浏览器和 curl 都能用、还能走 HTTP 缓存。但它不是唯一选择,而且对于服务之间频繁的内部调用,它也不总是最优的。gRPC 是主要的替代方案:它用 Protobuf(一种由 .proto 模式定义的紧凑二进制格式)序列化消息、跑在 HTTP/2 上(多路复用、没有队头阻塞、长连接复用)、从模式生成强类型的客户端和服务端桩、并原生支持四种流式(一元、客户端流、服务端流、双向流)。结果是更小的报文、更低的延迟、更强的契约——代价是 curl 读不了的二进制、浏览器要额外的 grpc-web 代理、以及失去 HTTP 缓存。一条经验法则是「对内 vs 对外」:服务之间用 gRPC,系统边缘对外用 REST。本章把两者逐条摆开,治理台按你的消息字段数、调用频率和网络往返,现算出 JSON 与 Protobuf 的报文大小、带宽差异,并根据你的要求(是否要浏览器、要流式、对外还是对内)给出推荐。",
      en: "In CM1 you called services with OpenFeign, which is essentially REST over HTTP with JSON bodies — the microservice default, and for good reason: it is universal, human-readable, works from a browser or curl, and caches over HTTP. But it is not the only option, and for chatty internal service-to-service traffic it is not always the best. gRPC is the main alternative: it serializes messages with Protobuf (a compact binary format defined by a .proto schema), rides HTTP/2 (multiplexed, no head-of-line blocking, persistent connections), generates typed client and server stubs from the schema, and natively supports four kinds of streaming (unary, client-, server-, and bidirectional). The result is smaller payloads, lower latency and stronger contracts — at the cost of binary you cannot read with curl, an extra grpc-web proxy for browsers, and losing HTTP caching. A rule of thumb is internal-vs-external: gRPC between your services, REST at the edge. This chapter lays the two out side by side, and the bench computes the JSON-vs-Protobuf payload and bandwidth for your message and recommends a side from your requirements (browser clients, streaming, public vs internal).",
    },
    objectives: [
      { zh: "解释 gRPC(Protobuf+HTTP/2)与 REST(JSON+HTTP)在报文、传输、契约上的区别", en: "Explain how gRPC (Protobuf+HTTP/2) and REST (JSON+HTTP) differ in payload, transport and contract" },
      { zh: "估算同一条消息在 JSON 与 Protobuf 下的字节数差异", en: "Estimate the byte-size difference of one message in JSON versus Protobuf" },
      { zh: "说清 gRPC 的四种流式与 REST 的请求-响应模型", en: "State gRPC's four streaming modes versus REST's request-response model" },
      { zh: "按对内/对外、浏览器、流式、吞吐选出 gRPC 或 REST", en: "Choose gRPC or REST from internal/external, browser, streaming and throughput needs" },
    ],
    outline: [
      { zh: "两种报文:JSON 文本 vs Protobuf 二进制", en: "Two payloads: JSON text vs Protobuf binary" },
      { zh: "两种传输:HTTP/1.1 vs HTTP/2 多路复用", en: "Two transports: HTTP/1.1 vs HTTP/2 multiplexing" },
      { zh: "契约与流式:.proto 代码生成、双向流", en: "Contract and streaming: .proto codegen, bidirectional streams" },
      { zh: "对内选 gRPC,对外选 REST,以及为什么", en: "gRPC inside, REST at the edge — and why" },
    ],
  },
  {
    id: "sc32", code: "CM5", moduleId: "m3", difficulty: 3, hours: 5, prereq: ["sc9"], viz: "breakerTuneLab",
    props: ["failureRateThreshold", "滑动窗口与最小调用数", "waitDuration 与半开探针", "慢调用阈值", "误跳闸 vs 无保护"],
    title: { zh: "熔断器调参:在误跳闸和没保护之间找那个点", en: "Tuning the Circuit Breaker: Between False Trips and No Protection" },
    summary: {
      zh: "CM3 讲清了熔断器是什么、三个状态怎么把雪崩挡住。但那一章回避了一个真正让人头疼的问题:那些数字到底填多少?熔断器的默认值几乎从不适合你的场景,而调错了,它比没有还糟。调得太灵敏——阈值定得太低、窗口太小、最小调用数太少——它会在下游只是抖了一下的正常噪声里误跳闸,把好好的流量拒掉,你亲手制造了一次故障。调得太迟钝——阈值定到 90%——它几乎永远不跳,雪崩照样发生,那这个熔断器只是配置文件里的一行摆设。真正的功夫在中间:让它对真实故障快速跳闸,又对瞬时噪声视而不见。这需要理解几个参数怎么相互作用:failureRateThreshold(多高的失败率算故障)、slidingWindowSize 和 minimumNumberOfCalls(在多少次调用上统计——太少就会被统计噪声骗到)、waitDurationInOpenState(开路后等多久再探)、以及半开时放几个探针(太少一个坏探针就把它重新打开、造成抖动)。还有一个容易漏的:慢调用也是失败——一个不报错但每次都要 5 秒的下游照样会耗尽你的线程,所以要配 slowCallRateThreshold。本章把这些参数一个个拆开,讲清每个调错的后果。治理台用真实的二项分布,让你看熔断器对下游失败率的「跳闸概率曲线」怎么随参数变陡变缓,以及误跳闸风险和故障保护怎么此消彼长。",
      en: "CM3 made clear what a circuit breaker is and how its three states hold off a cascade. But that chapter dodged the question that actually causes headaches: what do you set the numbers to? A breaker's defaults are almost never right for your situation, and set wrong, it is worse than none. Too sensitive — threshold too low, window too small, minimum calls too few — and it false-trips on the ordinary noise of a downstream that merely hiccuped, rejecting good traffic and manufacturing an outage with your own hands. Too lax — threshold at 90% — and it almost never trips, the cascade happens anyway, and the breaker is just a decorative line in a config file. The real craft is in the middle: trip fast on real failure yet stay blind to transient noise. That needs understanding how a few parameters interact: failureRateThreshold (how high a failure rate counts as failing), slidingWindowSize and minimumNumberOfCalls (over how many calls you measure — too few and statistical noise fools you), waitDurationInOpenState (how long to stay open before probing), and how many probes you permit in half-open (too few and one bad probe reopens it, causing flapping). And one people miss: slow calls are failures too — a downstream that never errors but takes 5 seconds each time still exhausts your threads, so you configure slowCallRateThreshold. This chapter takes the parameters apart one by one and states the consequence of getting each wrong. The bench uses a real binomial distribution to show how the breaker's trip-probability curve against the downstream failure rate steepens or flattens with your parameters, and how false-trip risk and failure protection trade against each other.",
    },
    objectives: [
      { zh: "解释调得太灵敏(误跳闸)和太迟钝(无保护)各自的后果", en: "Explain the consequences of too-sensitive (false trips) and too-lax (no protection)" },
      { zh: "用阈值、窗口、最小调用数控制熔断的灵敏度", en: "Control breaker sensitivity with threshold, window and minimum calls" },
      { zh: "用等待时间与半开探针数避免抖动", en: "Avoid flapping with wait duration and half-open probe count" },
      { zh: "把慢调用也当作失败来配置(slowCallRateThreshold)", en: "Configure slow calls as failures too (slowCallRateThreshold)" },
    ],
    outline: [
      { zh: "调不好比没有还糟:两个极端", en: "Worse than none: the two extremes" },
      { zh: "灵敏度:阈值、窗口、最小调用数", en: "Sensitivity: threshold, window, minimum calls" },
      { zh: "恢复:等待时间与半开探针,别抖动", en: "Recovery: wait duration and half-open probes, don't flap" },
      { zh: "慢调用也是失败:slowCallRateThreshold", en: "Slow calls are failures too: slowCallRateThreshold" },
    ],
  },

  /* ============ M4 · GW 网关与配置中心 ============ */
  {
    id: "sc10", code: "GW1", moduleId: "m4", difficulty: 2, hours: 5, prereq: ["sc4"], viz: "gatewayLab",
    props: ["Spring Cloud Gateway", "断言 Predicate", "过滤器 Filter", "权重路由", "金丝雀发布"],
    title: { zh: "Spring Cloud Gateway:一百个服务的唯一入口", en: "Spring Cloud Gateway: One Front Door for a Hundred Services" },
    summary: {
      zh: "当你有几十上百个服务,你不会把它们几十上百个地址直接暴露给前端和外部——那样鉴权、限流、跨域、监控这些横切的事就得在每个服务里各写一遍,而且改一次要发一百次版。API 网关解决的就是这个:所有外部流量的唯一入口。Spring Cloud Gateway 是当前官方推荐的网关(取代了退役的 Zuul),它建立在响应式(Reactor / Netty)之上,吞吐更高。它的模型由两部分组成:断言(Predicate)决定一个请求要不要走这条路由——可以按路径、请求头、方法、时间、甚至权重来匹配;过滤器(Filter)决定请求在转发前后要被怎么处理——加删请求头、限流、鉴权、重写路径、记录日志。本章重点讲一个特别实用的能力:权重路由。把同一个服务的新旧两个版本按 90/10 配权重,你就实现了金丝雀发布——先让 10% 的真实流量试新版本,盯着监控,没问题再逐步加大,出问题一键切回。治理台让你调整路由断言和权重,把一串请求灌进去,看它们分别落到哪个后端、金丝雀比例怎么控制爆炸半径。",
      en: "When you have dozens or hundreds of services, you do not expose their dozens or hundreds of addresses to the frontend and the outside world — cross-cutting concerns like auth, rate limiting, CORS and monitoring would then be rewritten in every service, and one change would mean a hundred releases. An API gateway solves this: the single front door for all external traffic. Spring Cloud Gateway is the officially recommended gateway today (replacing the retired Zuul), built on a reactive stack (Reactor / Netty) for higher throughput. Its model has two parts: predicates decide whether a request takes a route — matching by path, header, method, time, even weight; filters decide how a request is processed before and after forwarding — add or drop headers, rate-limit, authenticate, rewrite the path, log. This chapter focuses on one especially useful ability: weighted routing. Give the old and new versions of a service 90/10 weights and you have a canary release — let 10% of real traffic try the new version, watch the dashboards, ramp up if fine, roll back with one switch if not. The bench lets you adjust route predicates and weights, pour a stream of requests in, and watch which backend each lands on and how the canary ratio bounds the blast radius.",
    },
    objectives: [
      { zh: "解释 API 网关收拢了哪些横切关注点", en: "Explain which cross-cutting concerns an API gateway centralises" },
      { zh: "用断言按路径/请求头/权重匹配路由", en: "Match routes by path/header/weight with predicates" },
      { zh: "用过滤器链处理请求的前置与后置逻辑", en: "Use the filter chain for pre- and post-processing" },
      { zh: "用权重路由做一次金丝雀发布", en: "Run a canary release with weighted routing" },
    ],
    outline: [
      { zh: "为什么需要一个统一入口", en: "Why you need a single entry point" },
      { zh: "断言:这个请求走不走这条路由", en: "Predicates: does this request take this route" },
      { zh: "过滤器链:转发前后做的事", en: "The filter chain: what happens before and after forwarding" },
      { zh: "权重路由与金丝雀发布", en: "Weighted routing and canary release" },
    ],
  },
  {
    id: "sc11", code: "GW2", moduleId: "m4", difficulty: 2, hours: 6, prereq: ["sc10"], viz: "rateLab",
    props: ["网关鉴权", "JWT 校验", "令牌桶限流", "Redis 限流器", "429 与削峰"],
    title: { zh: "网关上的鉴权与限流:在门口把关", en: "Auth & Rate Limiting at the Gateway: Guarding the Door" },
    summary: {
      zh: "网关是唯一入口,那它自然就是做安全和流控最合适的地方——在门口一次做完,后端服务就能专心做业务。本章讲两件事。第一是鉴权:让 JWT 在网关处一次性校验,验签、查过期、解出用户身份,然后把身份透传给后端;这样后端不必各自实现一遍鉴权,也不必信任来路不明的请求。这里的关键权衡是:每次请求都在网关验一次签要花 CPU,而如果为了省这点开销去缓存或跳过校验,又会打开安全的口子。第二是限流,这是网关最能救命的能力之一。用令牌桶算法:系统按固定速率往桶里放令牌,每个请求消耗一个令牌,桶空了就拒绝(返回 429)。这样做的妙处是它既能限制平均速率,又允许一定的突发(桶的容量就是能容忍的突发大小)。当一个瞬时的十倍流量高峰打来时,令牌桶把它削平成后端能扛住的稳定速率,多出来的请求变成 429 被挡在门外,而不是涌进去把数据库压垮。治理台让你调令牌速率和桶容量,灌入带突发的流量,看通过、被限、和后端负载三条线怎么联动。",
      en: "If the gateway is the single entry point, it is naturally the right place to do security and flow control — do it once at the door and backends can focus on business logic. This chapter covers two things. First, authentication: validate a JWT once at the gateway — verify the signature, check expiry, extract the user identity — then pass that identity to the backends; this way backends need not each re-implement auth or trust unvetted requests. The key trade-off: verifying a signature per request costs CPU at the gateway, and caching or skipping validation to save that cost reopens a security hole. Second, rate limiting, one of the gateway's most life-saving abilities. Use the token-bucket algorithm: the system drops tokens into a bucket at a fixed rate, each request consumes one, and an empty bucket means rejection (a 429). The beauty is that it both caps the average rate and allows some burst (the bucket capacity is the burst it tolerates). When an instantaneous tenfold spike arrives, the token bucket shaves it into a steady rate the backend can survive, and the overflow becomes 429s held at the door instead of flooding in and crushing the database. The bench lets you tune the token rate and bucket size, pour in bursty traffic, and watch admitted, throttled and backend-load move together.",
    },
    objectives: [
      { zh: "在网关处集中做 JWT 校验并透传身份", en: "Validate JWTs centrally at the gateway and pass identity through" },
      { zh: "解释令牌桶如何同时限速与容纳突发", en: "Explain how a token bucket caps rate yet tolerates burst" },
      { zh: "用桶容量控制可容忍的突发大小", en: "Control tolerable burst with bucket capacity" },
      { zh: "说清限流为什么应该返回 429 而不是排队", en: "State why rate limiting should return 429 rather than queue" },
    ],
    outline: [
      { zh: "在门口鉴权:JWT 一次校验、身份透传", en: "Auth at the door: validate the JWT once, pass identity on" },
      { zh: "令牌桶:限速与突发的统一", en: "The token bucket: rate cap and burst in one" },
      { zh: "削峰:把十倍突发变成稳定速率", en: "Peak-shaving: turning a tenfold burst into a steady rate" },
      { zh: "429 vs 排队:快速拒绝好过慢慢拖死", en: "429 vs queueing: fast rejection beats slow death" },
    ],
  },
  {
    id: "sc12", code: "GW3", moduleId: "m4", difficulty: 2, hours: 5, prereq: ["sc6"], viz: "configLab",
    props: ["配置中心", "动态刷新", "Spring Cloud Bus", "@RefreshScope", "灰度发布配置"],
    title: { zh: "配置中心:不重启就改,但小心那几秒", en: "Config Server: Change Without Restart — Mind Those Seconds" },
    summary: {
      zh: "几十个服务、每个又有开发/测试/生产三套环境,如果配置还散落在各自的 application.yml 里,那么改一个数据库密码、调一个限流阈值、开一个功能开关,都意味着改文件、重新打包、重新部署——慢且危险。配置中心(Spring Cloud Config 或 Nacos Config)把这些配置集中管理,并带来一个关键能力:动态刷新——改一个值,正在运行的服务不重启就能生效。实现上,配置变更通过 Spring Cloud Bus(常用消息中间件广播)通知到所有实例,标了 @RefreshScope 的 Bean 会被重建以读取新值。但这份便利有它的暗礁,也是本章要你警惕的:当你把一个开关推给三十个实例时,它们不是在同一纳秒同时生效的——消息传播、Bean 重建都要时间,于是存在一小段「一部分实例已经用新配置、一部分还在用旧配置」的窗口。如果这个开关控制的是两个服务必须一致的行为(比如一个协议版本、一个特性标志),那么这几秒的不一致就可能制造出线上诡异现象。治理台模拟把配置推送给一组实例,让你看刷新怎么一台台生效、那段「新旧混跑」的窗口有多长、以及怎么用灰度和版本化把风险关小。",
      en: "Dozens of services, each with dev/test/prod environments — if configuration still lives in each service's own application.yml, then changing a database password, tuning a rate limit or flipping a feature toggle all mean editing a file, repackaging and redeploying — slow and risky. A config server (Spring Cloud Config or Nacos Config) centralises this and brings one key ability: dynamic refresh — change a value and running services pick it up without a restart. Under the hood, a change is broadcast to all instances via Spring Cloud Bus (usually over a message broker), and beans marked @RefreshScope are rebuilt to read the new value. But this convenience has a reef, and it is what this chapter warns you about: when you push a switch to thirty instances they do not take effect at the same nanosecond — message propagation and bean rebuilds take time, so there is a brief window where some instances run the new config and some the old. If that switch controls behaviour two services must agree on (a protocol version, a feature flag), those few seconds of inconsistency can create bizarre production symptoms. The bench simulates pushing config to a set of instances, letting you watch the refresh take effect one at a time, how long the 'mixed old and new' window lasts, and how canary and versioning shrink the risk.",
    },
    objectives: [
      { zh: "解释集中配置相比分散配置的收益", en: "Explain the benefit of centralised over scattered configuration" },
      { zh: "用 @RefreshScope 与 Bus 实现不重启刷新", en: "Achieve restart-free refresh with @RefreshScope and Bus" },
      { zh: "识别配置刷新中的「新旧混跑」危险窗口", en: "Identify the 'mixed old and new' danger window during a refresh" },
      { zh: "用灰度与版本化降低配置变更风险", en: "Reduce config-change risk with canary and versioning" },
    ],
    outline: [
      { zh: "散落的配置:改一个值要发一百次版", en: "Scattered config: one value, a hundred releases" },
      { zh: "动态刷新:@RefreshScope 与 Spring Cloud Bus", en: "Dynamic refresh: @RefreshScope and Spring Cloud Bus" },
      { zh: "危险窗口:配置不是原子生效的", en: "The danger window: config does not apply atomically" },
      { zh: "配置的灰度、回滚与版本化", en: "Canarying, rolling back and versioning config" },
    ],
  },
  {
    id: "sc28", code: "GW4", moduleId: "m4", difficulty: 2, hours: 5, prereq: ["sc10"], viz: "versionLab",
    props: ["向后兼容", "URI/Header/媒体类型版本", "扩展-收缩", "弃用与退场", "网关路由版本"],
    title: { zh: "API 版本管理:不打断调用方地演进接口", en: "API Versioning: Evolving an Interface Without Breaking Its Callers" },
    summary: {
      zh: "微服务最大的好处是每个服务能独立发布——但这也带来一个尖锐的问题:当你改了订单服务的接口,那些还没跟着改的调用方怎么办?在单体里你可以一次性把所有调用点改完;在微服务里你做不到,调用方各有各的发布节奏,你无法原子地同时升级所有人。API 版本管理就是应对之道,而它的第一课往往被跳过:大多数改动其实根本不需要新版本。只要你只做「加法」(新增字段、新增可选参数)、并让调用方用「宽容的读取器」忽略不认识的字段,老调用方就毫发无损——这叫向后兼容的演进,是最省事的正解。只有当你必须做破坏性改动(删字段、改语义、改类型)时,才需要真正的版本,并且要让 v1 和 v2 并行运行,直到调用方都迁移完。版本放哪也有讲究:URI 路径(/v2/orders,最直观、最好在网关路由、可缓存)、请求头(URL 干净但对缓存和调试不友好)、还是媒体类型(Accept: application/vnd.shop.v2+json,最纯粹也最难测)。本章讲清三件事:什么时候不需要版本;版本该放在哪一层;以及怎么用弃用和退场(Deprecation / Sunset 头 + 扩展-收缩迁移)把老版本体面地退役。治理台让你选改动类型和版本策略,现算出会打断多少调用方、要并行维护几个版本、维护多久。",
      en: "The great benefit of microservices is that each service deploys independently — but that raises a sharp question: when you change the order service's API, what happens to the callers that have not changed with it? In a monolith you edit every call site at once; in microservices you cannot — callers deploy on their own schedules and you cannot atomically upgrade all of them. API versioning is the answer, and its first lesson is usually skipped: most changes need no new version at all. As long as you make only additive changes (new fields, new optional parameters) and callers use a tolerant reader that ignores fields it does not recognise, old callers are untouched — this is backward-compatible evolution, the cheapest correct answer. Only when you must make a breaking change (remove a field, change a meaning, change a type) do you need a real version, and then you run v1 and v2 in parallel until callers have migrated. Where the version goes matters too: the URI path (/v2/orders — most visible, easiest to route at the gateway, cacheable), a header (clean URL but unfriendly to caching and debugging), or the media type (Accept: application/vnd.shop.v2+json — purest, hardest to test). This chapter covers three things: when you do not need a version; which layer the version belongs in; and how to retire an old version gracefully with deprecation and sunset (Deprecation / Sunset headers plus expand-contract migration). The bench lets you choose the change type and versioning strategy and computes how many callers break, how many versions you must maintain in parallel, and for how long.",
    },
    objectives: [
      { zh: "区分向后兼容(加法)与破坏性改动,并优先选前者", en: "Distinguish backward-compatible (additive) from breaking changes, and prefer the former" },
      { zh: "对比 URI、请求头、媒体类型三种版本放置方式的取舍", en: "Compare the trade-offs of URI, header and media-type versioning" },
      { zh: "用扩展-收缩(并行变更)在不打断调用方的情况下做破坏性演进", en: "Use expand-contract (parallel change) to evolve without breaking callers" },
      { zh: "用弃用与退场(Deprecation/Sunset)把旧版本退役", en: "Retire an old version with deprecation and sunset" },
    ],
    outline: [
      { zh: "为什么要版本:调用方无法被你原子升级", en: "Why version: you cannot atomically upgrade the callers" },
      { zh: "先别急着加版本:向后兼容的演进", en: "Before you version: backward-compatible evolution" },
      { zh: "版本放哪:URI / 请求头 / 媒体类型", en: "Where the version goes: URI / header / media type" },
      { zh: "并行运行与退场:弃用、日落、迁移", en: "Running in parallel and sunsetting: deprecate, sunset, migrate" },
    ],
  },
  {
    id: "sc29", code: "GW5", moduleId: "m4", difficulty: 3, hours: 6, prereq: ["sc11"], viz: "dlimitLab",
    props: ["全局限流", "共享计数器 Redis", "固定/滑动窗口", "令牌桶 + Lua 原子性", "本地+全局混合"],
    title: { zh: "分布式限流:让一群网关共享一个额度", en: "Distributed Rate Limiting: One Quota Shared Across a Fleet" },
    summary: {
      zh: "GW2 里你在一个网关上用令牌桶做了限流。但生产里网关不止一个——为了高可用和吞吐,你会跑十个、二十个网关副本。于是一个尖锐的问题冒出来:这十个网关,怎么共享同一个「每秒一千次」的额度?最常见的错误是:在每个网关上都配 replenishRate: 1000,以为这就是全局限流——结果十个网关各放一千,全局放进去一万,限流形同虚设。这是分布式限流的核心难题:本地的桶不会自动相加成一个全局的桶。反过来,如果你把额度平均分成每台 1/N,又会被负载不均坑到:某台热的网关先把自己那份用光、开始拒绝,而全局其实还远没到上限,于是你误伤了合法流量。正解是把计数搬到一个共享存储(通常是 Redis):每个请求都去 Redis 上对同一个计数器做「检查并扣减」,于是无论多少个网关,全局额度都是准的。Spring Cloud Gateway 的 RequestRateLimiter 正是这么做的——它用 Redis 加一段 Lua 脚本保证「检查+扣减」是原子的(否则两个网关同时看到还剩一个令牌、都放行,就超额了)。代价也随之而来:每个请求多一次 Redis 往返,Redis 成了热点和单点。本章讲清 N 倍问题、共享计数器与原子性、固定窗口/滑动窗口/令牌桶三种算法的取舍,以及用「本地预检 + 全局精算」的混合方案给 Redis 减负。治理台让你在本地桶和共享 Redis 之间切换,看全局额度怎么从「超十倍」或「被倾斜误伤」变成精确。",
      en: "In GW2 you rate-limited at a single gateway with a token bucket. But in production the gateway is not one process — for availability and throughput you run ten or twenty gateway replicas. That raises a sharp question: how do these ten gateways share one quota of 'a thousand requests per second'? The most common mistake is to configure replenishRate: 1000 on each gateway, thinking that is the global limit — and then ten gateways each admit a thousand, ten thousand get through, and the limit is a fiction. This is the core problem of distributed rate limiting: local buckets do not add up into one global bucket. Conversely, if you split the quota evenly into 1/N per instance, uneven load bites you: a hot gateway exhausts its share and starts rejecting while the global rate is nowhere near the limit, so you throttle legitimate traffic. The fix is to move the counting into a shared store (usually Redis): every request does a 'check and decrement' against one counter in Redis, so no matter how many gateways there are, the global quota is exact. Spring Cloud Gateway's RequestRateLimiter does exactly this — it uses Redis plus a Lua script to make 'check + decrement' atomic (otherwise two gateways both see one token left and both admit, overshooting the limit). The cost follows: an extra Redis round-trip per request, and Redis becomes a hotspot and a single point. This chapter covers the N× problem, the shared counter and atomicity, the trade-offs of fixed-window / sliding-window / token-bucket algorithms, and the local-plus-global hybrid that eases the load on Redis. The bench lets you switch between local buckets and a shared Redis and watch the global quota go from 'ten times over' or 'wrongly throttled by skew' to exact.",
    },
    objectives: [
      { zh: "解释「本地桶不相加」的 N 倍超额问题", en: "Explain the N× overshoot from local buckets that do not add up" },
      { zh: "用共享计数器(Redis)对整个网关集群做全局限流", en: "Enforce one global limit across a gateway fleet with a shared counter (Redis)" },
      { zh: "说清「检查并扣减」为什么必须原子(Lua 脚本)", en: "State why check-and-decrement must be atomic (a Lua script)" },
      { zh: "对比固定窗口、滑动窗口、令牌桶,并权衡 Redis 往返的代价", en: "Compare fixed-window, sliding-window and token-bucket, and weigh the Redis round-trip cost" },
    ],
    outline: [
      { zh: "单机限流不够:N 倍问题", en: "One instance is not enough: the N× problem" },
      { zh: "共享计数器与原子性(Redis + Lua)", en: "A shared counter and atomicity (Redis + Lua)" },
      { zh: "三种算法:固定窗口、滑动窗口、令牌桶", en: "Three algorithms: fixed window, sliding window, token bucket" },
      { zh: "代价:Redis 往返、热点、本地+全局混合", en: "The cost: Redis round-trip, hotspot, local+global hybrid" },
    ],
  },
  {
    id: "sc31", code: "GW6", moduleId: "m4", difficulty: 2, hours: 5, prereq: ["sc12"], viz: "driftLab",
    props: ["配置漂移", "声明式 GitOps", "配置指纹/审计", "自动纠偏 selfHeal", "不可变基础设施"],
    title: { zh: "配置漂移检测:让运行的和声明的不再各走各的", en: "Config Drift Detection: Keeping Running State True to Declared State" },
    summary: {
      zh: "GW3 讲了配置怎么在集群里刷新,以及那段「新旧混跑」的窗口。但那是一次刷新的瞬时问题;这一章讲的是一个更慢、更阴险的问题——配置漂移:随着时间推移,实例实际跑着的配置,悄悄地和你在 Git 里声明的配置分了家。来源很多:半夜出事,有人 SSH 上去直接改了个值救火,救完忘了同步回仓库;某次刷新只推到了一半的实例;prod 打了个补丁但 staging 没打,于是 staging 再也复现不了 prod 的 bug。漂移的可怕之处在于它是无声的:一切看起来正常,直到某台实例因为一个谁也不记得改过的配置而行为诡异,或者你照着 Git 部署了一份「一样的」环境却跑出完全不同的结果。检测漂移的办法是把「声明的状态」当作唯一真相:让每个实例暴露自己有效配置的指纹(Actuator),定期审计、和 Git 里的期望值对比,任何不一致就是漂移。更进一步是 GitOps:一个控制器持续把运行状态往声明状态上纠,发现漂移就自动回退(Argo CD 的 selfHeal),让漂移根本无法长期存在;而不可变基础设施则从源头上禁止运行时修改。本章讲清漂移的来源、声明态与运行态的差距、指纹审计的检测、以及 GitOps 与不可变的纠偏。治理台让你调漂移压力和检测方式,看漂移的实例数、发现时延、和由此引发的配置事故怎么变化。",
      en: "GW3 covered how config refreshes across a fleet and the 'mixed old and new' window. But that is a transient, single-refresh problem; this chapter is about a slower, more insidious one — config drift: over time, the configuration an instance is actually running quietly diverges from what you declared in Git. The sources are many: an incident at 3 a.m. where someone SSHes in and edits a value to fix it, then forgets to sync the change back to the repo; a refresh that only reached half the instances; a patch applied to prod but not to staging, so staging can no longer reproduce prod's bug. What makes drift dangerous is that it is silent: everything looks fine until one instance behaves strangely because of a setting nobody remembers changing, or you deploy an 'identical' environment from Git and get completely different behaviour. The way to detect drift is to treat the declared state as the single source of truth: have each instance expose a fingerprint of its effective config (Actuator), audit periodically, and compare against the expected value in Git — any mismatch is drift. Further still is GitOps: a controller continuously reconciles running state toward declared state and auto-reverts drift the moment it appears (Argo CD's selfHeal), so drift cannot persist; immutable infrastructure prevents runtime changes at the source. This chapter covers the sources of drift, the gap between declared and running state, fingerprint-based detection, and reconciliation with GitOps and immutability. The bench lets you tune the drift pressure and the detection method and watch how the number of drifted instances, the time to detect, and the resulting config incidents change.",
    },
    objectives: [
      { zh: "说出配置漂移的三个常见来源", en: "Name three common sources of config drift" },
      { zh: "区分「声明的状态」与「运行的状态」", en: "Distinguish declared state from running state" },
      { zh: "用配置指纹与定期审计检测漂移", en: "Detect drift with config fingerprints and periodic audits" },
      { zh: "用 GitOps 自动纠偏或不可变基础设施防止漂移", en: "Prevent drift with GitOps auto-reconciliation or immutable infrastructure" },
    ],
    outline: [
      { zh: "配置会漂移:手改、漏刷、环境分家", en: "Config drifts: hand-edits, missed refreshes, environment divergence" },
      { zh: "声明态 vs 运行态:那道无声的缝", en: "Declared vs running state: the silent gap" },
      { zh: "检测:配置指纹与定期审计", en: "Detection: config fingerprints and periodic audits" },
      { zh: "纠偏:GitOps 自动回退 · 不可变基础设施", en: "Reconciliation: GitOps auto-revert · immutable infrastructure" },
    ],
  },

  /* ============ M5 · TX 消息、事务与一致性 ============ */
  {
    id: "sc13", code: "TX1", moduleId: "m5", difficulty: 2, hours: 6, prereq: ["sc3"], viz: "streamLab",
    props: ["事件驱动", "Spring Cloud Stream", "Kafka / RabbitMQ", "分区与消费组", "消费积压"],
    title: { zh: "事件驱动与 Spring Cloud Stream:别再互相等待", en: "Event-Driven & Spring Cloud Stream: Stop Waiting on Each Other" },
    summary: {
      zh: "同步调用有一个隐藏的成本:耦合。当订单服务同步调用库存、积分、通知三个服务时,它必须等它们全部返回才能响应用户,任何一个慢了、挂了,都会连累这次下单。事件驱动换一个思路:订单服务只管把「订单已创建」这个事件发出去,谁关心谁自己订阅——库存去扣减、积分去累加、通知去发送,彼此不知道对方存在,订单服务也不必等它们。这样带来三个好处:解耦(加一个新的下游只需新增一个订阅者,不必改订单服务)、削峰(高峰期消息在队列里排队,消费者按自己的节奏处理,而不是把压力直接透传到数据库)、和韧性(某个消费者挂了,消息还在队列里等它回来)。Spring Cloud Stream 用统一的编程模型(Supplier/Function/Consumer 加 binder)屏蔽了底层是 Kafka 还是 RabbitMQ 的差异。本章也讲清事件驱动的代价:分区数决定了消费的并行度(分区不够,加再多消费者也没用),消费跟不上生产就会积压,消费者增减会触发重平衡。治理台让你调生产速率、分区数、消费者数,看消费积压怎么堆起来又怎么被消化。",
      en: "Synchronous calls carry a hidden cost: coupling. When the order service synchronously calls inventory, points and notification, it must wait for all three to return before responding to the user, and any one being slow or dead drags the checkout down with it. Event-driven design flips this: the order service only publishes an 'order created' event, and whoever cares subscribes — inventory decrements, points accrue, notification sends, none aware of the others, and the order service waits for none of them. Three benefits follow: decoupling (a new downstream is just a new subscriber, no change to the order service), peak-shaving (at peak, messages queue and consumers work at their own pace instead of passing the pressure straight to the database), and resilience (if a consumer dies, the message waits in the queue for its return). Spring Cloud Stream hides whether the substrate is Kafka or RabbitMQ behind one programming model (Supplier/Function/Consumer plus a binder). This chapter is also honest about the cost: partition count sets consumer parallelism (too few partitions and extra consumers do nothing), consumption falling behind production creates lag, and adding or removing consumers triggers a rebalance. The bench lets you tune production rate, partitions and consumers, watching lag pile up and drain.",
    },
    objectives: [
      { zh: "对比同步调用与事件驱动的耦合度", en: "Contrast the coupling of synchronous calls and event-driven design" },
      { zh: "用 Stream 的 Function 模型收发消息", en: "Send and receive with Stream's functional model" },
      { zh: "解释分区数如何限制消费并行度", en: "Explain how partition count limits consumer parallelism" },
      { zh: "诊断消费积压并说明重平衡的影响", en: "Diagnose consumer lag and explain the impact of a rebalance" },
    ],
    outline: [
      { zh: "同步的代价:一个慢下游拖累一次下单", en: "The cost of synchronous: one slow downstream drags a checkout" },
      { zh: "事件驱动:发出去,谁关心谁订阅", en: "Event-driven: publish it, whoever cares subscribes" },
      { zh: "Stream 的统一模型:Kafka 还是 RabbitMQ 一样写", en: "Stream's unified model: Kafka or RabbitMQ, same code" },
      { zh: "分区、消费组、积压与重平衡", en: "Partitions, consumer groups, lag and rebalancing" },
    ],
  },
  {
    id: "sc14", code: "TX2", moduleId: "m5", difficulty: 3, hours: 8, prereq: ["sc13"], viz: "sagaLab",
    props: ["分布式事务", "2PC / XA", "TCC", "Saga 与补偿", "Seata"],
    title: { zh: "分布式事务:没有免费的强一致", en: "Distributed Transactions: No Free Strong Consistency" },
    summary: {
      zh: "在单体里,一次跨三张表的下单,一个 @Transactional 就保证了要么全成、要么全败。拆成订单、库存、支付三个服务、三个数据库之后,这个保证消失了——你没有一个能横跨三个数据库的事务。这一章就讲怎么把它找回来,以及找回来要付出的代价。第一种是两阶段提交(2PC / XA):一个协调者先问所有参与者「准备好了吗」,都说好才让大家一起提交。它能保证强一致,但代价是所有参与者要在整个过程里持有锁、等待协调者,任何一个慢或挂,所有人一起卡住——它把可用性押给了一致性。第二种是 TCC(Try-Confirm-Cancel):把每个操作拆成预留、确认、取消三步,业务侵入大,但锁的时间短。第三种是 Saga:把一个大事务拆成一串本地事务,每一步都配一个「补偿」操作,中间失败了就反向依次补偿——注意补偿不是回滚,钱已经扣了,补偿是「再退回去」,而这中间存在一段能被观察到的不一致。Seata 把 AT(自动补偿,最省心)、TCC、Saga、XA 四种模式都封装好。核心洞见贯穿全章:分布式世界里,强一致、低延迟、高可用不可兼得,你只能替业务选。治理台模拟一次三服务事务,在中途注入失败,让你对比 2PC 的锁等待和 Saga 的补偿链,看成功率、锁时长、补偿成本怎么随模式变化。",
      en: "In a monolith, one checkout across three tables is made all-or-nothing by a single @Transactional. Split into order, inventory and payment — three services, three databases — and that guarantee is gone; you have no transaction that spans three databases. This chapter is about getting it back, and what getting it back costs. The first way is two-phase commit (2PC / XA): a coordinator first asks every participant 'are you ready', and only if all say yes does everyone commit. It gives strong consistency, but at the cost of every participant holding locks and waiting on the coordinator throughout, so any one being slow or dead jams them all — it stakes availability on consistency. The second is TCC (Try-Confirm-Cancel): split each operation into reserve, confirm, cancel — heavy on the business code but short on lock time. The third is Saga: break one big transaction into a chain of local transactions, each with a 'compensation', and on a mid-chain failure compensate backward in turn — note a compensation is not a rollback, the money is already deducted and the compensation 'pays it back', with an observable window of inconsistency in between. Seata packages all four — AT (automatic compensation, the least effort), TCC, Saga and XA. One insight runs through the chapter: in a distributed world you cannot have strong consistency, low latency and high availability together — you choose on the business's behalf. The bench simulates a three-service transaction, injects a mid-way failure, and lets you compare 2PC's lock-wait with Saga's compensation chain, watching success rate, lock duration and compensation cost change with the mode.",
    },
    objectives: [
      { zh: "解释为什么 @Transactional 跨不了多个数据库", en: "Explain why @Transactional cannot span multiple databases" },
      { zh: "对比 2PC、TCC、Saga 的一致性与代价", en: "Contrast 2PC, TCC and Saga on consistency and cost" },
      { zh: "说清补偿(compensation)为什么不等于回滚", en: "State why compensation is not the same as rollback" },
      { zh: "为一个业务场景选择合适的 Seata 模式", en: "Choose the right Seata mode for a business scenario" },
    ],
    outline: [
      { zh: "消失的保证:跨库的原子性没有了", en: "The vanished guarantee: cross-database atomicity is gone" },
      { zh: "2PC/XA:强一致,但把可用性押上去", en: "2PC/XA: strong consistency, availability staked" },
      { zh: "TCC 与 Saga:短锁 vs 补偿链", en: "TCC and Saga: short locks vs a compensation chain" },
      { zh: "Seata 的四种模式:AT/TCC/Saga/XA", en: "Seata's four modes: AT/TCC/Saga/XA" },
    ],
  },
  {
    id: "sc15", code: "TX3", moduleId: "m5", difficulty: 3, hours: 6, prereq: ["sc14"], viz: "idempotentLab",
    props: ["幂等", "最终一致性", "本地消息表 / 发件箱", "去重", "at-least-once"],
    title: { zh: "幂等与最终一致性:消息一定会重复", en: "Idempotency & Eventual Consistency: Messages Will Repeat" },
    summary: {
      zh: "分布式系统里有一条几乎无法回避的现实:消息中间件为了不丢消息,采用的是「至少一次」投递——也就是说,同一条消息可能被投递不止一次。网络抖动导致的确认丢失、消费者处理完还没提交偏移量就重启,都会让一条已经处理过的消息再来一遍。如果你的消费逻辑不是幂等的,后果可能很严重:一条「扣款」消息被消费两次,用户就被扣了两次钱。所以幂等不是一个可选的优化,是分布式消息的生存前提。本章讲清怎么做幂等:给每条消息一个唯一的业务 ID,处理前先查这个 ID 有没有处理过(用数据库唯一键、或 Redis 去重),处理过就直接跳过。第二个主题是最终一致性里最实用的一个模式——本地消息表 / 发件箱(Outbox):它解决的是一个很微妙但很致命的问题——「更新数据库」和「发送消息」是两个操作,如果先更库再发消息,发消息失败了就丢事件;如果先发消息再更库,更库失败了就发了假事件。发件箱模式把「要发的消息」和业务数据写在同一个本地事务里(所以要么都成、要么都败),再由一个单独的进程去可靠地投递这些消息。治理台模拟重复投递和崩溃,让你打开/关闭幂等和发件箱,看重复扣款和丢失事件怎么发生、又怎么被根治。",
      en: "Distributed systems have a fact you almost cannot dodge: to avoid losing messages, brokers deliver 'at least once' — the same message may be delivered more than once. A lost acknowledgement from a network hiccup, or a consumer restarting after processing but before committing its offset, both make an already-handled message arrive again. If your consumption is not idempotent, the consequences can be severe: a 'deduct payment' message consumed twice charges the user twice. So idempotency is not an optional optimisation, it is the precondition for surviving distributed messaging. This chapter works through how to be idempotent: give each message a unique business ID, check before processing whether that ID has been handled (a database unique key, or Redis dedup), and skip if so. The second topic is the most practical eventual-consistency pattern — the local message table / outbox: it solves a subtle, deadly problem — 'update the database' and 'send the message' are two operations, and updating first then sending loses the event if the send fails, while sending first then updating emits a false event if the update fails. The outbox writes the 'message to send' and the business data in one local transaction (so both commit or neither), and a separate process reliably delivers those messages. The bench simulates redelivery and crashes, letting you toggle idempotency and the outbox and watch double-charges and lost events happen, then be cured.",
    },
    objectives: [
      { zh: "解释为什么消息投递是「至少一次」", en: "Explain why message delivery is 'at least once'" },
      { zh: "用唯一业务 ID + 去重实现幂等消费", en: "Achieve idempotent consumption with a unique business ID + dedup" },
      { zh: "说清「更新库」与「发消息」的双写问题", en: "State the dual-write problem of 'update DB' and 'send message'" },
      { zh: "用发件箱模式保证事件不丢不假", en: "Use the outbox pattern so events are neither lost nor false" },
    ],
    outline: [
      { zh: "至少一次:重复投递是常态不是意外", en: "At least once: redelivery is normal, not an accident" },
      { zh: "幂等:唯一 ID + 去重表", en: "Idempotency: a unique ID + a dedup table" },
      { zh: "双写问题:更库和发消息不是一个事务", en: "The dual-write problem: DB update and send are not one transaction" },
      { zh: "发件箱模式:让事件和数据同生共死", en: "The outbox pattern: event and data live and die together" },
    ],
  },
  {
    id: "sc25", code: "TX4", moduleId: "m5", difficulty: 2, hours: 6, prereq: ["sc13"], viz: "mqLab",
    props: ["Kafka 分区日志", "RabbitMQ 交换机路由", "消息回放", "推 vs 拉与确认", "选型"],
    title: { zh: "Kafka 还是 RabbitMQ:两种消息中间件的取舍", en: "Kafka or RabbitMQ: Choosing Between Two Brokers" },
    summary: {
      zh: "上一章的 Spring Cloud Stream 用统一的编程模型屏蔽了底层是 Kafka 还是 RabbitMQ——换一个 binder,代码一行不改。但「代码一样」不代表「行为一样」:这两个中间件的内核是两种完全不同的东西,选错了,轻则性能上不去,重则你要的能力它根本不提供。Kafka 本质是一个分布式的分区提交日志:消息按分区顺序追加、按保留期留存,消费者用 offset 自己拉、能倒回去重放,吞吐随分区水平扩展、但消费并行度被分区数封顶——它天生适合高吞吐的事件流、事件溯源、日志聚合。RabbitMQ 本质是一个智能 broker:生产者把消息发给交换机(exchange),交换机按 direct/topic/fanout 规则路由到队列,消费者被推送、逐条 ack,竞争消费者可以在一个队列上自由扩展、但消息一旦被确认就删除、默认无法重放——它天生适合复杂路由、任务分发、请求-应答、以及需要逐条确认的场景。本章把这两套模型逐条摆开,治理台让你输入工作负载的要求(吞吐、是否要回放、路由是否复杂、是否要严格顺序),现算出各自的契合度和那个决定性的取舍。",
      en: "The previous chapter's Spring Cloud Stream hid whether the substrate is Kafka or RabbitMQ behind one programming model — swap the binder and not a line of code changes. But 'same code' does not mean 'same behaviour': these two brokers are built on completely different cores, and choosing wrong either caps your throughput or fails to provide a capability you needed. Kafka is essentially a distributed, partitioned commit log: messages are appended in order per partition and kept for a retention period, consumers pull by offset and can rewind to replay, throughput scales horizontally with partitions but consumer parallelism is capped by the partition count — it is built for high-throughput event streams, event sourcing and log aggregation. RabbitMQ is essentially a smart broker: producers publish to an exchange, which routes to queues by direct/topic/fanout rules, consumers are pushed messages and ack each one, competing consumers scale freely on a single queue but a message is deleted once acked and by default cannot be replayed — it is built for complex routing, task distribution, request-reply and anything needing per-message acknowledgement. This chapter lays the two models out side by side, and the bench takes your workload's requirements (throughput, replay, routing complexity, strict ordering) and computes each broker's fit and the deciding trade-off.",
    },
    objectives: [
      { zh: "解释 Kafka 的分区日志模型与 RabbitMQ 的交换机-队列模型的根本区别", en: "Explain the fundamental difference between Kafka's partitioned log and RabbitMQ's exchange-queue model" },
      { zh: "说清消息回放、投递方式(拉/推)、确认与顺序保证在两者中如何不同", en: "State how replay, delivery (pull/push), acking and ordering differ between the two" },
      { zh: "根据吞吐、路由、回放、顺序的要求选出合适的中间件", en: "Choose the right broker from throughput, routing, replay and ordering requirements" },
      { zh: "理解为什么 Stream 的 binder 让「换中间件」很便宜,但选型仍很重要", en: "Understand why Stream's binder makes 'switching brokers' cheap, yet the choice still matters" },
    ],
    outline: [
      { zh: "两种内核:分区日志 vs 智能 broker", en: "Two cores: a partitioned log vs a smart broker" },
      { zh: "回放、顺序、确认:同一个词,两种含义", en: "Replay, ordering, acking: one word, two meanings" },
      { zh: "路由:Kafka 的 key vs RabbitMQ 的交换机", en: "Routing: Kafka's key vs RabbitMQ's exchanges" },
      { zh: "按工作负载选型;以及 Stream 让你晚点再决定", en: "Choosing by workload; and how Stream lets you decide later" },
    ],
  },

  /* ============ M6 · OB 可观测性 ============ */
  {
    id: "sc16", code: "OB1", moduleId: "m6", difficulty: 2, hours: 5, prereq: ["sc7"], viz: "traceLab",
    props: ["链路追踪", "TraceId / SpanId", "Micrometer Tracing", "Zipkin", "上下文传播"],
    title: { zh: "分布式链路追踪:一条请求走过八个服务", en: "Distributed Tracing: One Request Through Eight Services" },
    summary: {
      zh: "用户说「下单很慢」,而这次下单在后台其实是一次跨越网关、订单、库存、优惠、支付、通知……七八个服务的旅程,慢在哪一跳?在单体里你看一份日志就知道,在微服务里,这条信息散落在七八台机器的七八份日志里,谁也拼不起来。链路追踪就是把它们重新拼起来的技术。它的核心概念很简单:每一条进入系统的请求被分配一个全局唯一的 TraceId,这个请求每经过一个服务、每做一次远程调用,就生成一个 Span(记录这一段的开始时间、结束时间、属于哪个服务),而 TraceId 通过 HTTP 头在服务之间一路传递下去。把同一个 TraceId 的所有 Span 按时间画出来,就是一张瀑布图——你一眼就能看到这次请求总共花了 900 毫秒,其中 800 毫秒卡在支付服务调用银行接口那一段。Spring Boot 3 用 Micrometer Tracing(取代了 Sleuth)自动完成打标和传播,后端常接 Zipkin 或 Tempo 来存储和展示。本章讲清 Trace/Span 的模型、上下文怎么跨进程传播、以及采样率的取舍。治理台给你一次多服务调用,把它渲染成可交互的瀑布图,让你一眼定位那根最长的条。",
      en: "A user says 'checkout is slow', and that checkout is really a journey across the gateway, order, inventory, promotion, payment, notification — seven or eight services. Slow in which hop? In a monolith one log tells you; in microservices that information is scattered across seven or eight machines' logs and nobody can reassemble it. Distributed tracing is the technique that reassembles it. Its core idea is simple: every request entering the system gets a globally unique TraceId, and each time the request passes through a service or makes a remote call it creates a Span (recording that segment's start, end and owning service), while the TraceId is carried between services in HTTP headers. Draw all the Spans of one TraceId along a timeline and you get a waterfall — you see at a glance that this request took 900 ms total, 800 of them stuck in the payment service's call to the bank. Spring Boot 3 uses Micrometer Tracing (which replaced Sleuth) to stamp and propagate automatically, with Zipkin or Tempo behind it for storage and display. This chapter works through the Trace/Span model, how context propagates across processes, and the trade of the sampling rate. The bench gives you one multi-service call rendered as an interactive waterfall, so you can pin the longest bar instantly.",
    },
    objectives: [
      { zh: "解释 TraceId 与 Span 的关系", en: "Explain the relationship between TraceId and Span" },
      { zh: "描述追踪上下文如何跨进程传播", en: "Describe how trace context propagates across processes" },
      { zh: "从一张瀑布图定位最慢的一跳", en: "Pin the slowest hop from a waterfall chart" },
      { zh: "解释采样率在成本与可见性之间的取舍", en: "Explain the sampling-rate trade between cost and visibility" },
    ],
    outline: [
      { zh: "散落在八份日志里的一次请求", en: "One request scattered across eight logs" },
      { zh: "TraceId 与 Span:把碎片重新编号", en: "TraceId and Span: renumbering the fragments" },
      { zh: "瀑布图:一眼看出慢在哪", en: "The waterfall: see the slowness at a glance" },
      { zh: "Micrometer Tracing + Zipkin,与采样", en: "Micrometer Tracing + Zipkin, and sampling" },
    ],
  },
  {
    id: "sc17", code: "OB2", moduleId: "m6", difficulty: 2, hours: 5, prereq: ["sc16"], viz: "sloLab",
    props: ["RED 指标", "Actuator / Micrometer", "Prometheus / Grafana", "P99 vs 平均", "SLO 与错误预算"],
    title: { zh: "指标与 SLO:平均值是骗人的", en: "Metrics & SLO: The Average Lies" },
    summary: {
      zh: "链路追踪回答「这一次为什么慢」,指标回答「整体健康不健康、趋势往哪走」。这一章讲清怎么给微服务装上仪表盘,以及一个能救你也能害你的统计常识。装仪表盘的技术栈很成熟:Spring Boot Actuator 暴露端点,Micrometer 作为门面采集指标,Prometheus 定期来抓,Grafana 画图。该采集什么?一个好用的框架是 RED:Rate(每秒请求数)、Errors(错误率)、Duration(延迟分布)。真正的重点在 Duration 的读法。很多团队盯着「平均延迟」,而平均延迟是最会骗人的指标——假设 99% 的请求都是 20 毫秒,1% 的请求因为触发了慢查询是 2 秒,平均值只有 40 毫秒,看起来非常健康,但那 1% 的用户体验糟透了,而当你的请求量放大十倍,平均值可能纹丝不动、P99 却已经爆表。所以真正决定用户体验的是尾延迟 P95、P99、P999。本章还讲 SLO(服务等级目标,比如「99% 的请求快于 300 毫秒」)和错误预算——它把「可靠性」从一个含糊的追求变成一个可以量化、可以花的预算。治理台生成一条带长尾的延迟分布,让你调请求量,看平均值和 P99 怎么分道扬镳。",
      en: "Tracing answers 'why was this one slow'; metrics answer 'is the whole thing healthy, and where is the trend going'. This chapter works through instrumenting microservices, and a piece of statistical common sense that can save you or sink you. The instrumentation stack is mature: Spring Boot Actuator exposes endpoints, Micrometer is the collection facade, Prometheus scrapes periodically, Grafana draws. What to collect? A handy frame is RED: Rate (requests per second), Errors (error rate), Duration (latency distribution). The real point is how to read Duration. Many teams watch the 'average latency', and the average is the most deceptive metric there is — suppose 99% of requests take 20 ms and 1% hit a slow query at 2 s, the average is just 40 ms and looks very healthy, yet those 1% of users have a terrible experience, and as your rate grows tenfold the average may hold steady while the P99 has already blown out. So what actually decides user experience is the tail: P95, P99, P999. This chapter also covers SLOs (service-level objectives, e.g. '99% of requests faster than 300 ms') and error budgets — which turn 'reliability' from a vague aspiration into a quantity you can measure and spend. The bench generates a long-tailed latency distribution and lets you turn up the rate to watch the average and the P99 part ways.",
    },
    objectives: [
      { zh: "用 RED 框架决定采集哪些指标", en: "Use the RED frame to decide which metrics to collect" },
      { zh: "解释为什么 P99 比平均值更能反映体验", en: "Explain why P99 reflects experience better than the average" },
      { zh: "搭建 Actuator → Prometheus → Grafana 链路", en: "Wire the Actuator → Prometheus → Grafana pipeline" },
      { zh: "用 SLO 与错误预算量化可靠性", en: "Quantify reliability with SLOs and error budgets" },
    ],
    outline: [
      { zh: "RED:速率、错误、延迟", en: "RED: rate, errors, duration" },
      { zh: "Actuator + Micrometer + Prometheus + Grafana", en: "Actuator + Micrometer + Prometheus + Grafana" },
      { zh: "为什么盯平均值会让你瞎掉", en: "Why watching the average blinds you" },
      { zh: "SLO 与错误预算:把可靠性变成预算", en: "SLOs and error budgets: reliability as a budget" },
    ],
  },
  {
    id: "sc18", code: "OB3", moduleId: "m6", difficulty: 2, hours: 5, prereq: ["sc16"], viz: "logLab",
    props: ["日志聚合", "结构化日志", "TraceId 关联", "ELK / Loki", "采样与成本"],
    title: { zh: "日志聚合:把八份日志串成一个故事", en: "Log Aggregation: Stitching Eight Logs Into One Story" },
    summary: {
      zh: "指标告诉你「有问题」,追踪告诉你「慢在哪个服务」,而当你要弄清「这个服务内部到底发生了什么」时,你还是得回到日志。问题在于,微服务的日志散落在几十个实例、几十个容器里,而且容器还会被销毁重建,日志随之消失。所以微服务的日志必须做两件单体不需要做的事:集中和关联。集中,是把所有实例的日志收集到一个统一的地方(ELK:Elasticsearch+Logstash+Kibana,或更轻的 Loki),这样你在一个界面里就能搜索全系统的日志,而不必逐台机器 SSH 上去 tail。关联,是这一章的关键:给每一条日志都打上它所属请求的 TraceId(和上一章的链路追踪共用同一个 ID),这样当你从追踪里发现某个 TraceId 慢了,你可以用这个 ID 一键捞出这次请求在所有服务里打的所有日志,按时间排好,拼成一个完整的故事。本章还讲结构化日志(用 JSON 而不是纯文本,便于机器检索)和一个绕不开的现实——日志是要花钱存的,全量存不起,于是采样率成了「存得起」和「出事时查得到」之间的取舍。治理台模拟多服务日志流,让你按 TraceId 过滤,看关联怎么把碎片拼成一条时间线。",
      en: "Metrics tell you 'something is wrong', tracing tells you 'slow in which service', and when you need to know 'what actually happened inside that service' you still go back to logs. The trouble is that microservice logs are scattered across dozens of instances and containers, and containers get destroyed and recreated, taking their logs with them. So microservice logging must do two things a monolith need not: centralise and correlate. Centralise means collecting every instance's logs into one place (ELK: Elasticsearch+Logstash+Kibana, or the lighter Loki), so you search the whole system's logs in one UI instead of SSHing into each machine to tail. Correlate is the key of this chapter: stamp every log line with the TraceId of the request it belongs to (the same ID as the previous chapter's tracing), so when tracing shows a TraceId was slow, you pull every log that request wrote across every service with that one ID, ordered by time, into one complete story. This chapter also covers structured logging (JSON rather than plain text, for machine search) and an unavoidable reality — logs cost money to store, you cannot keep everything, so the sampling rate becomes a trade between 'affordable' and 'findable when it matters'. The bench simulates a multi-service log stream and lets you filter by TraceId, watching correlation assemble fragments into one timeline.",
    },
    objectives: [
      { zh: "解释为什么容器化让本地日志不可靠", en: "Explain why containerisation makes local logs unreliable" },
      { zh: "用 TraceId 把跨服务日志关联成一条时间线", en: "Correlate cross-service logs into a timeline with TraceId" },
      { zh: "说明结构化日志相比纯文本的优势", en: "State the advantage of structured logs over plain text" },
      { zh: "权衡日志采样率的成本与可查性", en: "Trade off the cost and searchability of the log sampling rate" },
    ],
    outline: [
      { zh: "容器一销毁,本地日志就没了", en: "Destroy a container and its local logs are gone" },
      { zh: "集中:ELK / Loki 把日志收到一处", en: "Centralise: ELK / Loki collect logs in one place" },
      { zh: "关联:TraceId 把碎片串成故事", en: "Correlate: TraceId stitches fragments into a story" },
      { zh: "结构化日志与采样的成本账", en: "Structured logging and the cost of sampling" },
    ],
  },
  {
    id: "sc30", code: "OB4", moduleId: "m6", difficulty: 3, hours: 5, prereq: ["sc16"], viz: "sampleLab",
    props: ["头部采样", "尾部采样", "sampled 位传播", "OTel Collector", "成本 vs 可见性"],
    title: { zh: "链路追踪采样:省钱,又不漏掉出事的那条", en: "Trace Sampling: Save Money Without Missing the One That Broke" },
    summary: {
      zh: "OB1 里你给每条请求打了 traceId、画出了瀑布图。但在生产的量级上,一个真相摆在面前:你不可能把每条请求的每个 span 都存下来——一秒一百万请求、每条十几个 span,存储、网络、导出开销都是天文数字。所以你必须采样:只留一部分 trace。问题是留哪部分。最简单的是头部采样:在请求进来的第一跳(网关)就掷一次骰子,决定这条 trace 要不要采,并把这个决定通过 traceparent 的 sampled 位传给下游所有服务——于是一条 trace 要么全采、要么全不采(一致性),简单又便宜。但它有个致命弱点:你在还不知道结果的时候就决定了,所以在 1% 采样率下,那条报错的、或者慢了 3 秒的关键 trace,有 99% 的概率被你丢掉。尾部采样反过来:先把一条 trace 的所有 span 都缓存起来,等它跑完、知道了结果,再决定留不留——于是你可以「错误全留、慢的全留、正常的只留 1%」,永远不会漏掉出事的那条。代价是你得有一个收集器把所有 span 都缓冲住直到 trace 完成,基础设施重得多,而且同一条 trace 的所有 span 必须落到同一个收集器。本章讲清为什么要采样、头部与尾部两种采样的机制与一致性要求、以及成本、可见性、基础设施之间的三角取舍。治理台让你在头部和尾部之间切换,看你到底捕获了多少出事的 trace、又花了多少存储。",
      en: "In OB1 you stamped every request with a traceId and drew the waterfall. But at production scale a hard fact appears: you cannot store every span of every request — a million requests a second, a dozen spans each, and the storage, network and export costs are astronomical. So you must sample: keep only some traces. The question is which. The simplest is head-based sampling: at the first hop (the gateway) you roll a die to decide whether this trace is sampled, and propagate that decision to every downstream service through the sampled bit of traceparent — so a trace is all-sampled or none (consistency), simple and cheap. But it has a fatal weakness: you decide before you know the outcome, so at a 1% rate the one trace that errored, or was 3 seconds slow, has a 99% chance of being dropped. Tail-based sampling inverts this: buffer all of a trace's spans first, wait until it completes and the outcome is known, and only then decide — so you can 'keep every error, keep every slow one, keep 1% of the rest' and never miss the one that broke. The cost is that you need a collector holding all spans until the trace completes, much heavier infrastructure, and all spans of a trace must reach the same collector. This chapter covers why you sample, the mechanism and consistency requirement of head and tail sampling, and the triangle of cost, visibility and infrastructure. The bench lets you switch between head and tail and watch how many of the incidents you actually captured, and how much storage it cost.",
    },
    objectives: [
      { zh: "解释为什么大规模下必须对 trace 采样", en: "Explain why traces must be sampled at scale" },
      { zh: "说清头部采样的机制、sampled 位传播与一致性", en: "State the mechanism of head sampling, sampled-bit propagation and consistency" },
      { zh: "说清尾部采样如何保证不漏掉出错/慢的 trace", en: "State how tail sampling never misses an errored or slow trace" },
      { zh: "在成本、可见性、基础设施之间权衡采样策略", en: "Trade sampling strategy across cost, visibility and infrastructure" },
    ],
    outline: [
      { zh: "为什么要采样:每条都存存不起", en: "Why sample: keeping everything is unaffordable" },
      { zh: "头部采样:在起点决定并传播 sampled 位", en: "Head sampling: decide at the head, propagate the sampled bit" },
      { zh: "尾部采样:等 trace 完成再决定,留住错误", en: "Tail sampling: decide after completion, keep the errors" },
      { zh: "取舍:成本、可见性、收集器缓冲", en: "Trade-offs: cost, visibility, collector buffering" },
    ],
  },

  /* ============ M7 · OP 部署、弹性伸缩与多机房 ============ */
  {
    id: "sc19", code: "OP1", moduleId: "m7", difficulty: 3, hours: 7, prereq: ["sc1"], viz: "placementLab",
    props: ["容器化", "服务放置", "资源装箱", "亲和/反亲和", "爆炸半径"],
    title: { zh: "把不同的服务部署到不同的服务器", en: "Placing Different Services on Different Servers" },
    summary: {
      zh: "架构图上,每个服务都是一个干净的方框;但在生产里,这些方框必须落到具体的物理或虚拟机器上运行,而「哪个服务放哪台机器」这个看似琐碎的运维决定,直接决定了你的系统在一台机器宕机时会损失什么。本章正面回答用户最关心的问题之一:不同的服务怎么部署到不同的服务器上,以及怎么放才对。第一件事是容器化——用 Docker 把每个服务连同它的运行环境打包成不可变的镜像,这样「在我机器上能跑」不再是借口,同一个镜像在任何机器上跑法都一样。第二件事是放置(placement):你有一堆服务(每个要一定的 CPU 和内存)和一批机器(每台有固定的资源上限),怎么把服务装箱进机器,既装得下、又不浪费——这本质是一个装箱问题。第三件事,也是最关键的一课——爆炸半径:如果你为了省机器,把订单服务和支付服务的所有副本都塞在同一台机器上,那么这台机器一宕机,整条下单链路就全断了。反亲和(anti-affinity)规则的意义,就是强制把同一个服务的多个副本、或者互相依赖的关键服务,分散到不同的机器、不同的机架、甚至不同的可用区,让任何单点故障都只吃掉系统的一小块。治理台让你把服务拖放到机器上、设置反亲和、然后随机宕掉一台机器,看哪些服务跟着一起死。",
      en: "On the diagram, each service is a clean box; in production those boxes must land on specific physical or virtual machines, and the seemingly trivial operational decision of 'which service on which machine' directly determines what you lose when one machine dies. This chapter answers head-on one of the questions the user cares about most: how to deploy different services on different servers, and how to place them well. The first thing is containerisation — Docker packages each service with its runtime into an immutable image, so 'works on my machine' is no longer an excuse and the same image runs identically anywhere. The second is placement: you have a pile of services (each needing some CPU and memory) and a fleet of machines (each with a fixed resource ceiling), and you must pack the services into the machines so they fit without waste — essentially a bin-packing problem. The third, and the crucial lesson — the blast radius: if, to save machines, you cram every replica of the order service and the payment service onto one machine, then when that machine dies the whole checkout chain goes with it. The point of anti-affinity rules is to force a service's replicas, or mutually dependent critical services, to spread across different machines, racks, even availability zones, so any single failure eats only a small slice of the system. The bench lets you drag services onto machines, set anti-affinity, then kill a random machine and watch which services die with it.",
    },
    objectives: [
      { zh: "用 Docker 把服务打包成不可变镜像", en: "Package a service as an immutable image with Docker" },
      { zh: "把服务按资源装箱到一批机器上", en: "Bin-pack services onto a fleet by resource" },
      { zh: "用亲和/反亲和规则控制服务放置", en: "Control placement with affinity/anti-affinity rules" },
      { zh: "评估一台机器宕机的爆炸半径", en: "Assess the blast radius of one machine failing" },
    ],
    outline: [
      { zh: "容器化:让「我机器上能跑」不再是借口", en: "Containerisation: killing 'works on my machine'" },
      { zh: "放置是装箱:服务装进机器", en: "Placement is bin-packing: services into machines" },
      { zh: "反亲和:别把鸡蛋放一个篮子", en: "Anti-affinity: not all eggs in one basket" },
      { zh: "爆炸半径:宕一台机,死几个服务", en: "Blast radius: kill a machine, lose which services" },
    ],
  },
  {
    id: "sc20", code: "OP2", moduleId: "m7", difficulty: 3, hours: 7, prereq: ["sc19"], viz: "autoscaleLab",
    props: ["Kubernetes HPA", "弹性伸缩", "冷启动滞后", "抖动与稳定窗口", "成本 vs 延迟"],
    title: { zh: "弹性伸缩与自动扩容:大促流量来了", en: "Elastic Scaling & Autoscaling: The Sale Traffic Arrives" },
    summary: {
      zh: "微服务真正诱人的一个能力是弹性:平时用三个副本扛住日常流量,大促时自动扩到十几个副本扛住十倍洪峰,峰过了再自动缩回去——你只为你真正需要的容量付费。这一章讲清这件事怎么在 Kubernetes 上实现,以及三个几乎所有人第一次都会栽的坑。实现的核心是 HPA(Horizontal Pod Autoscaler):你给它一个目标(比如「每个副本的 CPU 保持在 60%」或「每个副本每秒处理 100 个请求」),它持续观察实际指标,高了就加副本、低了就减副本,自动把系统维持在目标附近。坑一是冷启动滞后:HPA 决定扩容到新副本真正能接流量之间,有一段几十秒的空档(JVM 启动、预热、就绪探针),而在这段空档里,已有的副本还在被过载的流量冲击,超时照样发生——扩容不是瞬时的。坑二是抖动:如果没有稳定窗口,当流量恰好在阈值附近波动时,HPA 会疯狂地一会儿扩一会儿缩,副本数上蹿下跳,反而更不稳定。坑三是永恒的成本与延迟拉锯:留的余量越大,延迟越稳,但花的钱越多——你要替业务定这个平衡点。治理台给你一条会起伏的流量曲线,让你调 HPA 的目标值、冷启动时间、稳定窗口,看副本数怎么追流量、超时怎么在扩容滞后时冒出来、账单怎么随余量变化。",
      en: "One genuinely alluring ability of microservices is elasticity: run three replicas for everyday traffic, autoscale to a dozen for a tenfold flood during a sale, then scale back down when the peak passes — you pay only for the capacity you actually need. This chapter works through how that happens on Kubernetes, and three traps almost everyone falls into the first time. The core is the HPA (Horizontal Pod Autoscaler): give it a target (say 'keep each replica's CPU at 60%' or 'each replica handles 100 requests per second'), and it continuously watches the actual metric, adding replicas when high and removing them when low, holding the system near the target. Trap one is cold-start lag: between the HPA deciding to scale and a new replica actually taking traffic there is a gap of tens of seconds (JVM start, warm-up, readiness probe), and during that gap the existing replicas are still hit by overloaded traffic and timeouts still happen — scaling is not instant. Trap two is flapping: without a stabilisation window, when traffic hovers near the threshold the HPA scales up and down frantically and the replica count thrashes, making things less stable, not more. Trap three is the eternal cost-versus-latency tug-of-war: more headroom means steadier latency but a bigger bill — you set that balance for the business. The bench gives you an undulating traffic curve and lets you tune the HPA target, cold-start time and stabilisation window, watching replicas chase traffic, timeouts appear during scale-up lag, and the bill move with the headroom.",
    },
    objectives: [
      { zh: "用 HPA 按 CPU 或 RPS 自动伸缩副本", en: "Autoscale replicas by CPU or RPS with the HPA" },
      { zh: "解释冷启动滞后为什么让扩容不是瞬时的", en: "Explain why cold-start lag makes scaling non-instant" },
      { zh: "用稳定窗口消除副本数抖动", en: "Eliminate replica flapping with a stabilisation window" },
      { zh: "在成本与延迟之间为业务选择余量", en: "Choose headroom between cost and latency for the business" },
    ],
    outline: [
      { zh: "弹性的承诺:只为需要的容量付费", en: "The promise of elasticity: pay only for needed capacity" },
      { zh: "HPA:给个目标,它替你加减副本", en: "The HPA: give a target, it adds and removes replicas" },
      { zh: "冷启动滞后:扩容不是瞬时的", en: "Cold-start lag: scaling is not instant" },
      { zh: "抖动与稳定窗口;成本与延迟的平衡", en: "Flapping and stabilisation; the cost–latency balance" },
    ],
  },
  {
    id: "sc21", code: "OP3", moduleId: "m7", difficulty: 3, hours: 8, prereq: ["sc19"], viz: "multiDCLab",
    props: ["异地多活", "跨机房数据复制", "复制延迟", "冲突与 LWW", "RPO / RTO"],
    title: { zh: "异地多活与跨机房数据复制", en: "Multi-Region Active-Active & Cross-DC Replication" },
    summary: {
      zh: "把所有服务放在一个机房,简单,但那台机房一旦断电、断网、着火,你的整个系统就一起消失。异地多活是应对之道:在两个甚至三个地理上分开的机房同时部署、同时对外服务,任何一个机房整体挂掉,流量都能切到别的机房继续。听起来完美,但它引入了分布式系统里最硬的一块骨头——跨机房的数据一致性,而这一章就把这块骨头啃开。第一个绕不开的现实是复制延迟:数据在机房 A 写入后,要通过网络复制到机房 B,而两地相隔上千公里,光速就决定了这个复制至少要几十毫秒;在这段时间里,如果用户的读请求恰好被路由到了还没收到复制的机房 B,他就会「读不到自己刚写的数据」。第二个难题是冲突:如果两个机房被允许同时写(真正的多活),那么当两地几乎同时修改同一条记录时,该听谁的?最后写入者胜(LWW)简单但会丢数据,更严谨的方案要用版本向量或业务层合并。第三组概念是衡量容灾能力的黄金指标:RPO(故障时最多能接受丢多少数据)和 RTO(最多能容忍多久不可用)——它们决定了你该选同步复制(不丢数据但慢)还是异步复制(快但可能丢一点)。治理台模拟两地机房,让你调复制延迟、切换读写模式、注入一次机房级故障,亲眼看「读不到自己刚写的」、看冲突发生、看 RPO/RTO 怎么随策略变化。",
      en: "Putting all services in one data centre is simple, but the day that centre loses power, network or catches fire, your whole system vanishes with it. Multi-region active-active is the answer: deploy and serve from two or even three geographically separate data centres at once, so if any one fails wholesale, traffic shifts to the others and continues. It sounds perfect, but it introduces the hardest bone in distributed systems — cross-DC data consistency — and this chapter cracks that bone open. The first unavoidable reality is replication lag: after data is written in DC A it must replicate over the network to DC B, and with the sites a thousand kilometres apart the speed of light alone makes that at least tens of milliseconds; during that window, if a user's read is routed to DC B which has not yet received the replica, they 'cannot read their own write'. The second problem is conflict: if both DCs are allowed to write at once (true active-active), then when the two sites modify the same record almost simultaneously, who wins? Last-write-wins (LWW) is simple but loses data; stricter schemes need version vectors or business-level merges. The third set of concepts is the gold standard for measuring disaster recovery: RPO (at most how much data you can lose on failure) and RTO (at most how long you can be down) — they decide whether you choose synchronous replication (loses nothing but slow) or asynchronous (fast but may lose a little). The bench simulates two DCs and lets you tune replication lag, switch read/write modes, and inject a DC-level failure, watching 'cannot read my own write', watching conflicts happen, and watching RPO/RTO change with the strategy.",
    },
    objectives: [
      { zh: "解释异地多活相比单机房的容灾优势", en: "Explain the DR advantage of active-active over a single DC" },
      { zh: "说清复制延迟怎么造成「读不到自己刚写的」", en: "State how replication lag causes 'cannot read my own write'" },
      { zh: "分析多活写冲突与 LWW 的丢数据风险", en: "Analyse active-active write conflicts and the data-loss risk of LWW" },
      { zh: "用 RPO/RTO 在同步与异步复制间选择", en: "Choose between sync and async replication with RPO/RTO" },
    ],
    outline: [
      { zh: "一个机房的风险:全押在一处", en: "The single-DC risk: everything staked in one place" },
      { zh: "复制延迟:光速决定的几十毫秒", en: "Replication lag: tens of ms the speed of light sets" },
      { zh: "写冲突:两地同时改同一条记录", en: "Write conflict: both sites change one record at once" },
      { zh: "RPO 与 RTO:同步还是异步复制", en: "RPO and RTO: synchronous or asynchronous replication" },
    ],
  },
  {
    id: "sc27", code: "OP4", moduleId: "m7", difficulty: 3, hours: 6, prereq: ["sc9", "sc22"], viz: "meshLab",
    props: ["Sidecar 边车", "Istio / Envoy", "数据平面 / 控制平面", "mTLS 与流量管理", "网格 vs 库"],
    title: { zh: "服务网格:把治理下沉到基础设施", en: "Service Mesh: Pushing Governance Into the Infrastructure" },
    summary: {
      zh: "到目前为止,服务治理的能力——熔断、重试、超时、负载均衡、mTLS、链路追踪——都住在你的应用代码里,靠 Resilience4j、Spring Cloud LoadBalancer、Micrometer 这些库实现。这有一个隐藏前提:每个服务都得是 JVM、都得引这些库、都得同步升级它们。一旦你的系统里混进了 Go、Node、Python,这个前提就破了。服务网格(Istio、Linkerd)提出另一种做法:在每个服务的 Pod 旁注入一个 sidecar 代理(通常是 Envoy),让所有进出流量都先过这个代理,于是熔断、重试、mTLS、灰度发布、遥测全部由代理在基础设施层完成,与你的语言和框架无关。控制平面(如 Istiod)统一给成百上千个 sidecar 下发配置。好处是应用代码变薄、多语言团队获得统一治理、安全和流量策略集中管控。代价有两个:延迟税——每一跳现在要多穿过两个 sidecar;以及运维复杂度——你多了一个数据平面(每个 Pod 一个代理)和一个控制平面要部署、升级、排障。本章讲清 sidecar 模型和数据/控制平面,并正面回答那个绕不开的问题:同一件事,该由 Spring Cloud 的库做,还是由网格做?治理台让你把每个横切关注点在「库」和「网格」之间分配,现算出延迟税、边车内存开销、以及那个最危险的坑——两边都做会让重试翻倍、mTLS 白费。",
      en: "So far, the capabilities of service governance — breaking, retries, timeouts, load balancing, mTLS, tracing — have lived in your application code, implemented by libraries like Resilience4j, Spring Cloud LoadBalancer and Micrometer. That carries a hidden assumption: every service is a JVM, pulls in these libraries, and upgrades them in lockstep. The moment Go, Node or Python join your system, the assumption breaks. A service mesh (Istio, Linkerd) offers another way: inject a sidecar proxy (usually Envoy) beside each service's pod so all traffic in and out passes through it, and then breaking, retries, mTLS, canary releases and telemetry are all done by the proxy at the infrastructure layer, independent of your language and framework. A control plane (such as Istiod) pushes configuration uniformly to hundreds or thousands of sidecars. The upside is thinner application code, uniform governance across polyglot teams, and centrally managed security and traffic policy. The cost is twofold: a latency tax — every hop now crosses two extra sidecars — and operational complexity, because you now have a data plane (a proxy per pod) and a control plane to deploy, upgrade and debug. This chapter works through the sidecar model and the data/control planes, and answers head-on the unavoidable question: should a given concern be handled by a Spring Cloud library or by the mesh? The bench lets you assign each cross-cutting concern between 'library' and 'mesh', computing the latency tax, the sidecar memory overhead, and the most dangerous trap — doing both, which doubles your retries and wastes your mTLS.",
    },
    objectives: [
      { zh: "解释 sidecar 代理模型与数据平面/控制平面的分工", en: "Explain the sidecar proxy model and the split between data plane and control plane" },
      { zh: "说清哪些横切关注点(mTLS/重试/熔断/负载/灰度/遥测)能下沉到网格", en: "State which cross-cutting concerns (mTLS/retry/breaking/LB/canary/telemetry) can move to the mesh" },
      { zh: "评估 sidecar 带来的延迟税与集群资源开销", en: "Assess the latency tax and cluster resource overhead sidecars add" },
      { zh: "决定同一件事该由 Spring Cloud 库还是网格来做——而不是两个都做", en: "Decide whether a concern is owned by a Spring Cloud library or the mesh — not both" },
    ],
    outline: [
      { zh: "把横切关注点搬出代码:sidecar 模型", en: "Moving cross-cutting concerns out of code: the sidecar model" },
      { zh: "数据平面(Envoy 边车)与控制平面(Istiod)", en: "Data plane (Envoy sidecars) and control plane (Istiod)" },
      { zh: "网格 vs Spring Cloud:谁来管,别重复", en: "Mesh vs Spring Cloud: who owns it, and do not duplicate" },
      { zh: "代价:延迟税、资源与运维复杂度", en: "The cost: latency tax, resources and operational complexity" },
    ],
  },

  /* ============ M8 · HA 安全、韧性与实战 ============ */
  {
    id: "sc22", code: "HA1", moduleId: "m8", difficulty: 3, hours: 6, prereq: ["sc10"], viz: "authLab",
    props: ["OAuth2 / OIDC", "JWT", "网关鉴权", "mTLS", "零信任"],
    title: { zh: "微服务安全:进了城门不等于是自己人", en: "Microservice Security: Past the Gate Is Not a Friend" },
    summary: {
      zh: "单体只有一道城墙,墙内是可信的;微服务是一座城里几十栋楼,如果你假设「只要进了城门,楼与楼之间就可以互相无条件信任」,那么攻击者只要攻破任意一个服务,就能在你的内网里横着走。这一章讲怎么在这样的架构里建立安全。核心是身份的传递:用户在网关处用 OAuth2 / OIDC 登录,拿到一个 JWT(一个带签名、装着用户身份和权限、有过期时间的令牌);之后这个 JWT 在服务之间一路传递,每个服务都能自己验签、确认「这个请求代表谁、能干什么」,而不必回头去问认证中心。这里有一个反复出现的权衡:JWT 是自包含的,验签快、不用查库,但也因此难以即时吊销(令牌没过期前一直有效);相对地,不透明令牌每次都要问认证中心,能即时吊销但更慢。更进一步是零信任:不但外部请求要鉴权,服务与服务之间的每一次调用也要用 mTLS(双向 TLS)互相验明正身,默认谁都不信,每一跳都要证明自己——代价是每次调用都要付出握手和校验的开销。本章讲清这些机制和它们的成本。治理台模拟一次带令牌的多跳调用,让你打开/关闭网关校验、令牌过期、mTLS,看鉴权开销和安全性怎么此消彼长。",
      en: "A monolith has one city wall and everything inside is trusted; microservices are dozens of buildings inside a city, and if you assume 'once past the gate, buildings trust each other unconditionally', then an attacker who breaks any one service can walk freely across your internal network. This chapter is about establishing security in such an architecture. The core is carrying identity: the user logs in at the gateway with OAuth2 / OIDC and receives a JWT (a signed token carrying the user's identity and permissions, with an expiry); that JWT is then passed between services, and each service verifies the signature itself to confirm 'who this request represents and what it may do' without going back to ask the auth server. A recurring trade lives here: a JWT is self-contained, fast to verify with no database lookup, but therefore hard to revoke instantly (valid until it expires); an opaque token, by contrast, asks the auth server each time, revocable instantly but slower. Further still is zero trust: not only external requests are authenticated, but every service-to-service call uses mTLS (mutual TLS) to prove identity both ways — trust no one by default, prove yourself on every hop — at the cost of a handshake and validation per call. This chapter works through these mechanisms and their costs. The bench simulates a multi-hop call with a token and lets you toggle gateway validation, token expiry and mTLS, watching auth overhead and security trade against each other.",
    },
    objectives: [
      { zh: "用 OAuth2/OIDC 在网关签发身份令牌", en: "Issue an identity token at the gateway with OAuth2/OIDC" },
      { zh: "解释 JWT 与不透明令牌的吊销权衡", en: "Explain the revocation trade of JWT vs opaque tokens" },
      { zh: "用 mTLS 实现服务间的双向认证", en: "Achieve mutual service-to-service auth with mTLS" },
      { zh: "说清零信任在每次调用上的成本", en: "State the per-call cost of zero trust" },
    ],
    outline: [
      { zh: "内网不是可信网:横向移动的风险", en: "The internal network is not trusted: lateral movement" },
      { zh: "OAuth2 + JWT:在网关签发、逐跳传递", en: "OAuth2 + JWT: issue at the gateway, pass hop by hop" },
      { zh: "JWT vs 不透明令牌:吊销的代价", en: "JWT vs opaque tokens: the cost of revocation" },
      { zh: "mTLS 与零信任:每一跳都要证明自己", en: "mTLS and zero trust: prove yourself on every hop" },
    ],
  },
  {
    id: "sc23", code: "HA2", moduleId: "m8", difficulty: 3, hours: 6, prereq: ["sc9"], viz: "chaosLab",
    props: ["混沌工程", "故障注入", "稳态假设", "爆炸半径验证", "演练"],
    title: { zh: "混沌工程:主动把系统弄坏来验证它扛得住", en: "Chaos Engineering: Break It on Purpose to Prove It Holds" },
    summary: {
      zh: "你在前面学了熔断、超时、重试、隔离、多副本、异地多活——但你怎么知道它们真的有用?配置文件里写了 `circuitBreaker.enabled: true` 不等于熔断真的会在故障时跳开,可能阈值配错了、可能被别的配置覆盖了、可能那个 fallback 方法本身有 bug。混沌工程的信念很直接:一个容错机制,如果你从没在真实故障下验证过它,那就应该假设它是坏的。所以与其等真实故障在半夜三点找上门,不如主动在可控的时间、可控的范围内,往系统里注入故障——随机杀死一个实例、给某个下游调用注入 500 毫秒延迟或 30% 错误率、切断两个服务之间的网络——然后验证系统的关键指标(稳态假设,比如「下单成功率仍高于 99%」)是否还守得住。守住了,你对系统的信心是有依据的;没守住,你在一次演习里、而不是在一次真实事故里,发现了那个没配对的熔断器。本章讲清混沌工程的方法:定义稳态、控制爆炸半径(先在小范围试)、注入故障、观察、修复。治理台给你一张服务依赖图,让你注入各种故障,看它怎么沿着调用链扩散,以及前面学的韧性手段有没有把它挡在局部。",
      en: "You have learned breaking, timeouts, retries, bulkheads, replicas and active-active — but how do you know they actually work? `circuitBreaker.enabled: true` in a config file does not mean the breaker really trips on failure; the threshold might be wrong, it might be overridden, the fallback method might itself have a bug. The creed of chaos engineering is blunt: a fault-tolerance mechanism you have never verified under real failure should be assumed broken. So rather than wait for real failure to find you at 3 a.m., you deliberately inject failure at a controlled time and scope — kill a random instance, inject 500 ms of latency or a 30% error rate into a downstream call, sever the network between two services — and then verify whether the system's key metric (the steady-state hypothesis, e.g. 'checkout success stays above 99%') still holds. If it holds, your confidence is earned; if not, you found the miswired breaker in a drill instead of an incident. This chapter works through the method: define steady state, bound the blast radius (start small), inject, observe, fix. The bench gives you a service dependency graph and lets you inject various failures, watching them spread along the call chain and whether the resilience you learned holds them local.",
    },
    objectives: [
      { zh: "解释为什么未经验证的容错应假设为坏的", en: "Explain why unverified fault-tolerance should be assumed broken" },
      { zh: "为一个服务定义可度量的稳态假设", en: "Define a measurable steady-state hypothesis for a service" },
      { zh: "在受控范围内注入故障并观察扩散", en: "Inject failure within a bounded scope and observe spread" },
      { zh: "用混沌实验验证熔断/隔离是否真的生效", en: "Use chaos experiments to verify breaking/bulkheads truly work" },
    ],
    outline: [
      { zh: "配了不等于有用:未验证的容错是幻觉", en: "Configured is not working: unverified tolerance is an illusion" },
      { zh: "稳态假设:先说清「正常」长什么样", en: "The steady-state hypothesis: define 'normal' first" },
      { zh: "控制爆炸半径:先小范围演练", en: "Bound the blast radius: drill small first" },
      { zh: "注入、观察、修复:把事故变成演习", en: "Inject, observe, fix: turn incidents into drills" },
    ],
  },
  {
    id: "sc24", code: "HA3", moduleId: "m8", difficulty: 3, hours: 8, prereq: ["sc9", "sc19", "sc21"], viz: "capstoneLab",
    props: ["综合实战", "电商微服务", "端到端链路", "成熟度自评", "架构权衡"],
    title: { zh: "综合实战:一个电商微服务系统", en: "Capstone: An E-Commerce Microservice System" },
    summary: {
      zh: "最后一章把整本书学过的东西接成一个能运转的整体。想象一个电商系统:用户的一次下单请求先到网关(鉴权、限流),经过路由进入订单服务;订单服务通过 OpenFeign 调用库存服务(扣减库存,带熔断保护)、发起一个跨库存和支付的分布式事务(Seata),同时发出「订单已创建」事件(Spring Cloud Stream),由积分、通知等服务异步消费;整条链路被链路追踪贯穿,每一跳的耗时都可见;所有服务通过注册中心相互发现、通过配置中心统一配置;它们被容器化后部署在 Kubernetes 上,按流量弹性伸缩,并在两个机房异地多活。这一章不引入新组件,而是让你看清这些组件怎么协同、以及它们之间的权衡怎么相互牵制——比如更强的一致性(2PC)会拖累弹性伸缩的收益,更激进的自动扩容会放大冷启动的超时。治理台是一个综合仪表盘,把这条端到端链路可视化,让你往里加压、注入故障、切换机房,看整个系统作为一个有机整体怎么响应。章末附一份微服务成熟度自评:把这本书的八个模块变成八个维度、几十个问题,让你给自己的团队打个分,看清下一步该补哪里。",
      en: "The final chapter wires everything the book taught into one working whole. Picture an e-commerce system: a user's checkout first hits the gateway (auth, rate limiting), routes into the order service; the order service calls the inventory service over OpenFeign (decrement stock, protected by a breaker), starts a distributed transaction across inventory and payment (Seata), and emits an 'order created' event (Spring Cloud Stream) consumed asynchronously by points, notification and others; the whole chain is threaded by distributed tracing so every hop's time is visible; all services discover each other through the registry and share configuration through the config server; containerised, they run on Kubernetes, autoscale with traffic, and run active-active across two data centres. This chapter introduces no new component; it shows how they cooperate and how their trade-offs constrain each other — stronger consistency (2PC) eats into the gains of elastic scaling, more aggressive autoscaling amplifies cold-start timeouts. The bench is a composite dashboard visualising this end-to-end chain, letting you load it, inject failures and switch data centres, watching the whole system respond as one organism. The chapter closes with a microservice maturity self-assessment: it turns the book's eight modules into eight dimensions and dozens of questions so you can score your own team and see what to shore up next.",
    },
    objectives: [
      { zh: "把一条下单请求在全套组件里走通", en: "Run one checkout request through the full component set" },
      { zh: "解释各组件之间的相互牵制与权衡", en: "Explain how the components constrain and trade off against each other" },
      { zh: "识别端到端链路中的单点与瓶颈", en: "Identify single points and bottlenecks in the end-to-end chain" },
      { zh: "用成熟度自评给自己的团队定位", en: "Locate your own team with the maturity self-assessment" },
    ],
    outline: [
      { zh: "一条下单请求的完整旅程", en: "The full journey of one checkout request" },
      { zh: "组件如何协同:发现、网关、事务、追踪、伸缩", en: "How components cooperate: discovery, gateway, transaction, tracing, scaling" },
      { zh: "权衡的相互牵制:一致性 vs 弹性 vs 成本", en: "Trade-offs constrain each other: consistency vs elasticity vs cost" },
      { zh: "微服务成熟度自评:八个维度打分", en: "Microservice maturity self-assessment: scoring eight dimensions" },
    ],
  },
];

// Derived totals used by the home page hero.
const DEMO_COUNT = CHAPTERS.filter((c) => c.viz).length;      // interactive benches
const TOTAL_HOURS = CHAPTERS.reduce((s, c) => s + (c.hours || 0), 0);

window.MODULES = MODULES;
window.CHAPTERS = CHAPTERS;
window.DEMO_COUNT = DEMO_COUNT;
window.TOTAL_HOURS = TOTAL_HOURS;
