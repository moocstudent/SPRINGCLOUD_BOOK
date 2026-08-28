## Load balancing that lives inside the caller

Put a reverse proxy — an Nginx, an ELB — in front of your instances and every request makes an extra hop through a box that knows nothing about your services except a health-check ping. Spring Cloud does it differently: the load balancer lives *inside the caller*. The client pulls the list of live instances from the registry (Chapter sc4) and, for each call, picks one itself. Ribbon did this first and is retired; Spring Cloud LoadBalancer is the supported implementation on Boot 3.

Why is inside better? Because the caller has information the proxy cannot have. It knows the full instance set the instant the registry updates. It knows how many requests *it* currently has in flight to each instance. It saves a network hop. The cost is that every client language needs its own load-balancer implementation and they can drift — a real tax in a polyglot shop, a non-issue in an all-Spring one.

## Why round-robin betrays you

The default strategy is round-robin: hand each call to the next instance in turn. It is correct and fair when every instance is identical. Instances are rarely identical. One runs on a smaller node, one is mid-GC, one is a fresh pod still warming its JIT, one is quietly failing. Round-robin keeps sending the slow one its exact 1/N share regardless — and those requests queue behind its slowness, time out, and drag your tail latency up while the average barely moves.

@fig sc8-lb

Put numbers on it. Ten instances, nine answering in 25 ms, one degraded to 500 ms. Round-robin sends 10% of traffic to the bad node. The **average** latency is (9 × 25 + 500) / 10 ≈ 73 ms — you would sign that off in a review. But 10% of your users wait 500 ms, so your **P99 is 500 ms**, a twenty-fold miss. The average told you everything was fine while one request in ten fell off a cliff. This is why you judge a load balancer by its tail, never its mean.

## Four strategies

| Strategy | How it picks | Needs to know | Best when | Where it hurts |
|---|---|---|---|---|
| Round-robin | Next instance in turn | Nothing | Instances truly identical | Sends full share to the slowest node |
| Random | Uniform random pick | Nothing | Large fleet, no coordination | Same tail problem, no memory |
| Least-connections | Fewest in-flight requests | Live in-flight count per instance | Heterogeneous speeds, variable cost | Can herd onto a just-recovered node |
| Response-time weighted | Weight ∝ 1 / recent latency | A latency EWMA per instance | Mixed hardware, tail-sensitive | Slow to react; a cold node with no samples looks fast |

Least-connections is the pragmatic default when instances vary: a slow node accumulates in-flight requests, its count climbs, and the balancer naturally stops sending it new ones — it routes *around* slowness without being told which node is slow. Response-time weighting is sharper but needs latency tracking and can be fooled by a cold instance that simply has no samples yet.

Spring Cloud LoadBalancer ships round-robin (default) and random out of the box, plus health-check filtering and a `weight`-based supplier. Least-connections and response-time weighting are not built in — you implement `ReactorServiceInstanceLoadBalancer` and wire it per client:

```java
@Configuration
@LoadBalancerClient(name = "inventory", configuration = InventoryLbConfig.class)
public class AppConfig { }

class InventoryLbConfig {
    @Bean
    ReactorLoadBalancer<ServiceInstance> lb(Environment env,
            LoadBalancerClientFactory factory) {
        String name = env.getProperty(LoadBalancerClientFactory.PROPERTY_NAME);
        // built-in Random shown; swap for your least-connections implementation
        return new RandomLoadBalancer(
            factory.getLazyProvider(name, ServiceInstanceListSupplier.class), name);
    }
}
```

## P99, not the average

The lesson generalises past load balancing: in any system with fan-out, the mean is the most comforting and least useful number you can look at. A request that touches five services inherits the *slowest* of the five at each step, so tail latencies compound. Raise the request rate on the bench and watch it directly — the average holds flat while P99 climbs, because saturation shows up in the tail long before it moves the mean. Leave one degraded instance in the pool, switch the strategy from round-robin to least-connections, and watch P99 fall back toward the healthy baseline while the average hardly flinches.

## Exercises

1. In the bench, set one of five instances to 10× the others' latency and read off average and P99 under round-robin; then switch to least-connections and compare both numbers.
2. Instrument a real Feign client with Micrometer `@Timed` and graph the P50, P95 and P99 of one downstream call. Which one moved last time that downstream had a bad node?
3. Enable Spring Cloud LoadBalancer health-check filtering and describe how it differs from a load-balancing *strategy* — what does each one protect against?
4. Sketch (in words or code) a least-connections `ReactorServiceInstanceLoadBalancer`: what state must it keep, and where does that state get updated as calls start and finish?
