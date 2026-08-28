## 一件事,三套实现

「Spring Cloud」不是一个你 `import` 进来的框架,它是**一组抽象**——像 `DiscoveryClient`、`ReactiveLoadBalancer`、`CircuitBreaker` 这样的接口——背后跟着好几套互相竞争的实现。这正是第一天让人懵的原因:同一件事,有来自三个时代的三个答案。

- **Netflix OSS**——Eureka、Ribbon、Hystrix、Zuul。2015 年前后让 Spring Cloud 成名的那套,由 Netflix 捐出。
- **官方 Spring 那套**——Spring Cloud LoadBalancer、Spring Cloud Circuit Breaker(基于 Resilience4j)、Spring Cloud Gateway、Spring Cloud Config。现在由 Spring 团队自己造、自己维护。
- **Spring Cloud Alibaba**——Nacos、Sentinel、Seata、Dubbo。一套自洽的技术栈,在中文社区几乎是事实上的默认。

## 谁死了、谁是默认、谁在中文社区流行

现状要讲得直白,因为在一个已死的组件上开新项目,是一个真实且常见的错误。Netflix 的大部分组件**已经从 Spring Cloud 里移除**:Ribbon、Hystrix、Zuul 1、Archaius 在 2019 年进入维护,在 2020.0(Ilford)这趟列车里被移出平台。唯一的幸存者是 **Eureka**,至今仍在维护,仍是一个不错的注册中心。Netflix 其余每一样,官方都有替代,Alibaba 也有一个对应物:

| 功能位 | Netflix(遗留) | 官方 Spring | Alibaba | 今天的推荐 |
| --- | --- | --- | --- | --- |
| 服务发现 | Eureka | (Consul、Zookeeper) | Nacos | Nacos 或 Eureka |
| 负载均衡 | Ribbon ✝ | Spring Cloud LoadBalancer | (用 SCLB) | Spring Cloud LoadBalancer |
| 弹性 / 熔断 | Hystrix ✝ | Resilience4j | Sentinel | Resilience4j 或 Sentinel |
| API 网关 | Zuul 1 ✝ | Spring Cloud Gateway | (用 SCG) | Spring Cloud Gateway |
| 配置中心 | Archaius ✝ | Spring Cloud Config | Nacos Config | Nacos Config 或 SC Config |

(✝ = 已从 Spring Cloud 移除,别在它上面开新项目。)今天一个新项目诚实的默认是:**Spring Cloud LoadBalancer + Resilience4j + Spring Cloud Gateway**,服务发现用 Eureka 或 Nacos。而在国内,**Nacos + Sentinel** 常见到近乎标准配置,因为 Nacos 把发现和配置合进了同一个服务端,Sentinel 还自带一个好用的控制台。

@fig sc2-stack

## 版本地狱:Boot ↔ Cloud ↔ Alibaba 必须对齐

这就是吃掉新手第一个下午的坑。Spring Cloud **不**像 Spring Boot 那样编版本号。它以**版本列车(release train)**的形式发布,用伦敦地铁站命名、按年份编号——2023.0.x 叫「Leyton」。每趟列车只支持特定的**一段 Spring Boot 版本范围**,而 Spring Cloud Alibaba 又有**它自己**的号,映射到某一趟列车和某一条 Boot 线。三者必须一致:

| Spring Boot | Spring Cloud 版本列车 | Spring Cloud Alibaba |
| --- | --- | --- |
| 3.2.x | 2023.0.x(Leyton) | 2023.0.x.x |
| 3.1.x | 2022.0.x(Kilburn) | 2022.0.x.x |
| 2.7.x | 2021.0.x(Jubilee) | 2021.0.x.x |

对不上时,报错很少是清清楚楚的一句「版本不匹配」。因为一个针对某个 Boot API 编译出来的 Cloud 组件,被装到了另一个 Boot 旁边,你得到的是一个**原因莫名其妙的启动崩溃**——一个 `NoSuchMethodError`、一个 `NoClassDefFoundError`,或者自动配置深处一个 Bean 创建失败,指向一个你从没听过的类。Boot 2 → 3 这一跳更糟,因为那一版还把 `javax.*` 搬到了 `jakarta.*`,并要求 Java 17。当有人说「能编译但起不来」,第一个要查的就是版本没对齐。

## 用 dependencyManagement / BOM 锁死版本

这些版本你不用一个 starter 一个 starter 地手挑。每趟版本列车都会发布一个 **BOM(物料清单)**——一个 POM,为列车里的每个模块声明一套一致的、经过测试的版本。你把它 `import` 进 `<dependencyManagement>`,然后声明 starter 时**不写版本号**,BOM 会给它们全部补上互相匹配的版本:

```xml
<properties>
  <spring-cloud.version>2023.0.3</spring-cloud.version>
  <spring-cloud-alibaba.version>2023.0.1.3</spring-cloud-alibaba.version>
</properties>

<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-dependencies</artifactId>
      <version>${spring-cloud.version}</version>
      <type>pom</type><scope>import</scope>
    </dependency>
    <dependency>
      <groupId>com.alibaba.cloud</groupId>
      <artifactId>spring-cloud-alibaba-dependencies</artifactId>
      <version>${spring-cloud-alibaba.version}</version>
      <type>pom</type><scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
```

再把 Spring Boot 自己设成 `<parent>`,三层就都在一个地方钉死了。加上 `spring-cloud-starter-loadbalancer` 或 `spring-cloud-starter-alibaba-nacos-discovery`,**不**写 `<version>`,它就能直接跑起来。**在上面的治理台里把 Boot 固定到 3.2,看哪几趟列车亮绿灯**——那一行绿色,正是这份 BOM 编码的组合。把 Boot 切到 3.1,2023.0 那趟就变红;那抹红,就是你本来会在启动时撞上的 `NoSuchMethodError`。要内化的规则是:**先定 Boot 版本,让兼容表去挑列车,再让 BOM 去挑下面每一个制品的版本。** 永远不要在单个 Spring Cloud starter 上写 `<version>`——你一写,就给版本错配开了门。

## 练习

1. 用 Spring Initializr 建一个 Boot 3.2 的项目,加上 Nacos 服务发现 starter。读生成的 `pom.xml`,找出被 import 的那些 BOM,确认你的 starter 上没有显式版本号。
2. 故意搞坏它:保持 Boot 3.2 不变,强行把 `spring-cloud-dependencies` 设成某个 2022.0.x 版本,跑一下,记下异常的确切类名和消息。然后恢复对齐,确认它能正常启动。
3. 到 Spring Cloud 官网找到当前列车支持的 Boot 版本范围;到 Spring Cloud Alibaba 仓库找到它的版本映射表。写下你今天开新项目会用的那组确切的 Boot / Cloud / Alibaba 三元组。
4. 在治理台里给每个功能位选一个组件。举一个你会选 Alibaba(Nacos/Sentinel)而不选官方那套的理由,再举一个你会选官方那套而不选 Alibaba 的理由。
