## One job, three implementations

"Spring Cloud" is not a framework you `import`; it is a **set of abstractions** — interfaces like `DiscoveryClient`, `ReactiveLoadBalancer`, `CircuitBreaker` — with several competing implementations behind them. That is why day one is confusing: for every job there are three answers from three eras.

- **Netflix OSS** — Eureka, Ribbon, Hystrix, Zuul. The set that made Spring Cloud famous around 2015, donated by Netflix.
- **The official Spring set** — Spring Cloud LoadBalancer, Spring Cloud Circuit Breaker (Resilience4j), Spring Cloud Gateway, Spring Cloud Config. What the Spring team now builds and maintains itself.
- **Spring Cloud Alibaba** — Nacos, Sentinel, Seata, Dubbo. A coherent stack that is the de-facto default in the Chinese community.

## What is dead, what is the default, what is popular in China

Be blunt about status, because starting a new project on a dead component is a common mistake. Most of Netflix is **gone from Spring Cloud**: Ribbon, Hystrix, Zuul 1 and Archaius went into maintenance in 2019 and were removed in the 2020.0 (Ilford) train. The survivor is **Eureka**, still maintained and still a fine registry. Everything else has an official replacement and an Alibaba alternative:

| Slot | Netflix (legacy) | Official Spring | Alibaba | Recommended today |
| --- | --- | --- | --- | --- |
| Service discovery | Eureka | (Consul, Zookeeper) | Nacos | Nacos, or Eureka |
| Load balancing | Ribbon ✝ | Spring Cloud LoadBalancer | (uses SCLB) | Spring Cloud LoadBalancer |
| Resilience / breaking | Hystrix ✝ | Resilience4j | Sentinel | Resilience4j or Sentinel |
| API gateway | Zuul 1 ✝ | Spring Cloud Gateway | (uses SCG) | Spring Cloud Gateway |
| Configuration | Archaius ✝ | Spring Cloud Config | Nacos Config | Nacos Config or SC Config |

(✝ = removed from Spring Cloud; do not start a new project on it.) The honest greenfield default is **Spring Cloud LoadBalancer + Resilience4j + Spring Cloud Gateway**, with Eureka or Nacos for discovery. In China, **Nacos + Sentinel** is effectively the standard, because Nacos folds discovery and config into one server and Sentinel ships a friendly dashboard.

@fig sc2-stack

## Version hell: Boot ↔ Cloud ↔ Alibaba must line up

Here is the trap that eats a beginner's first afternoon. Spring Cloud is **not** versioned like Spring Boot. It ships as a *release train* named after a London tube station and numbered by year — 2023.0.x is "Leyton". Each train supports a specific **range of Spring Boot versions**, and Spring Cloud Alibaba has *its own* number mapping to a train and Boot line. All three must agree:

| Spring Boot | Spring Cloud train | Spring Cloud Alibaba |
| --- | --- | --- |
| 3.2.x | 2023.0.x (Leyton) | 2023.0.x.x |
| 3.1.x | 2022.0.x (Kilburn) | 2022.0.x.x |
| 2.7.x | 2021.0.x (Jubilee) | 2021.0.x.x |

Get it wrong and the failure is rarely a clear "version mismatch". A Cloud component compiled against one Boot API, loaded next to a different Boot, gives a **startup crash with a confusing cause** — a `NoSuchMethodError`, a `NoClassDefFoundError`, or a bean-creation failure deep in auto-configuration, naming a class you have never heard of. The Boot 2 → 3 jump is worse: it also moved `javax.*` to `jakarta.*` and requires Java 17. When someone says "it compiles but won't start", check version alignment first.

## Locking versions with dependencyManagement / BOM

You do not pick these versions by hand, starter by starter. Each release train publishes a **BOM** (Bill of Materials) — a POM declaring one consistent, tested version for every module in the train. You import it into `<dependencyManagement>`, then declare starters **without a version**, and the BOM supplies matching versions for all of them:

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

With Spring Boot as the `<parent>`, all three layers are pinned in one place; add `spring-cloud-starter-loadbalancer` or `spring-cloud-starter-alibaba-nacos-discovery` with **no** `<version>` and it works. **In the bench above, fix Boot to 3.2 and watch which trains light green** — that green row is what this BOM encodes; switch to Boot 3.1 and the 2023.0 train turns red, the `NoSuchMethodError` you would meet at startup. The rule: **pick the Boot version first, let the table pick the train, let the BOM pick every artifact version below.** Never put a `<version>` on an individual Spring Cloud starter — that is the door the mismatch walks through.

## Exercises

1. Create a Spring Initializr project on Boot 3.2 with the Nacos discovery starter. Read the generated `pom.xml`, find the imported BOM(s), and confirm your starter carries no explicit version.
2. Deliberately break it: force `spring-cloud-dependencies` to a 2022.0.x version while keeping Boot 3.2, run it, and record the exact exception class and message. Then restore alignment and confirm it starts.
3. On the official Spring Cloud site find the supported Boot range for the current train; on the Spring Cloud Alibaba repo find its version-mapping table. Write down the exact Boot/Cloud/Alibaba triple you would use today.
4. In the bench, choose a component for each slot. Justify one choice where you'd take Alibaba (Nacos/Sentinel) over the official set, and one where you'd take the official set instead.
