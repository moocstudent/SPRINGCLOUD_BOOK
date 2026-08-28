# Spring Cloud 微服务 · nodes & calls

A bilingual (中文 / English) self-study course on **Java Spring Cloud microservices** — from splitting a monolith to running a cluster active-active across regions. Every chapter opens with an **interactive governance bench** (治理台) where every number is computed live, then explains the mechanism, and closes with the **same job from three angles: Java, configuration (YAML), and a deploy manifest** (Dockerfile / docker-compose / Kubernetes).

一门中英双语的 Spring Cloud 微服务自学课程。每章先在「治理台」上把一个真实的分布式场景跑一遍(可用率、尾延迟、熔断状态、复制延迟、副本数全部现算),再读「解释」讲清机制与代价,最后看 Java / 配置 / 部署 三个视角的真实代码。

## 为什么这样组织 / Why this shape

组件是手段,场景才是目的。本书先给你一个真实场景——一次拖垮全链路的下游超时、一次让人半夜爬起来的注册中心分区、一次大促前的自动扩容、一次机房级故障的异地切换——再让你看清是哪个组件、哪个参数、哪个权衡在决定成败。

Components are a means; the scenarios are the point. The book hands you a real scenario first — a downstream timeout that drags the whole chain down, a registry partition at 3 a.m., an autoscale before a sale, a region-level failover — then shows exactly which component, parameter and trade-off decides the outcome.

## 课程结构 / Curriculum — 8 modules / 24 chapters

| # | 模块 / Module | 覆盖 / Covers |
|---|---|---|
| I | 微服务与 Spring Cloud 全景 | 分布式税、组件选型(Netflix/官方/Alibaba)、版本对齐、DDD 拆分 |
| II | 服务注册与发现 | 心跳与摘除、Eureka 自我保护与 AP、Nacos 的 CP/AP 切换 |
| III | 通信、负载与弹性 | OpenFeign、客户端负载均衡、熔断/限流/降级/隔离(Resilience4j / Sentinel) |
| IV | 网关与配置中心 | Spring Cloud Gateway、网关鉴权与限流、配置动态刷新 |
| V | 消息、事务与一致性 | Spring Cloud Stream、分布式事务(2PC/TCC/Saga/Seata)、幂等与发件箱 |
| VI | 可观测性 | 链路追踪(Micrometer/Zipkin)、指标与 SLO、日志聚合 |
| VII | 部署、弹性伸缩与多机房 | 服务放置与爆炸半径、Kubernetes HPA 自动扩容、异地多活与跨机房复制 |
| VIII | 安全、韧性与实战 | OAuth2/JWT/mTLS、混沌工程、端到端电商实战 + 成熟度自评 |

Module VII answers the three hardest operational questions head-on: **deploying different services on different servers**, **elastic autoscaling**, and **multi-region active-active with cross-DC replication**.

## 本地运行 / Run locally

```bash
python -m http.server 5830 --directory .
# then open http://localhost:5830
```

No build step. It is a dependency-free React 18 + Babel-standalone SPA; chapter content is fetched from `content/<id>.<lang>.md` on demand.

## 技术栈 / Stack of the examples

Spring Boot 3 · Spring Cloud 2023 (Leyton) · Spring Cloud Alibaba · Nacos · Resilience4j / Sentinel · Spring Cloud Gateway · Seata · Micrometer Tracing + Zipkin · Docker · Kubernetes.

进度与语言/主题偏好保存在你自己的浏览器里,无需注册。Progress and language/theme preferences are saved in your own browser — no signup.
