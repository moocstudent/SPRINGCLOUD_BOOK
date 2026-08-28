## An interface that is secretly a network call

OpenFeign lets you declare a remote HTTP call as a Java interface. You annotate it with `@FeignClient`, describe each endpoint with the same Spring MVC annotations you already put on a controller, and Feign generates a proxy that serialises the request, picks an instance through the load balancer, sends it, and deserialises the response.

```java
@FeignClient(name = "inventory")
public interface InventoryClient {

    @GetMapping("/api/stock/{sku}")
    StockLevel getStock(@PathVariable("sku") String sku);

    @PostMapping("/api/reserve")
    ReserveResult reserve(@RequestBody ReserveCommand cmd);
}
```

Calling `inventoryClient.getStock("A-91")` reads exactly like a local method call. That is the point, and it is also the trap. A local method returns in nanoseconds or throws; it never simply *sits there*. This call crosses a TCP connection, a load balancer, a network, another JVM's thread pool and a database — and every one of those can be slow instead of fast, or absent instead of present. The syntax hides a truth the CPU cannot: this line can block for thirty seconds.

## The two timeouts you must set by hand

Feign's underlying HTTP client will, if you say nothing, wait far longer than any user's patience. You must set two separate ceilings, and they guard different failures.

| Timeout | Guards | Fires when | Sane starting value |
|---|---|---|---|
| `connectTimeout` | Establishing the TCP connection | Instance is dead, host unreachable, network down | 500–1000 ms |
| `readTimeout` | Waiting for the response after connecting | Downstream accepted the request but is slow — GC, lock contention, slow query | 800–2000 ms |

```yaml
spring:
  cloud:
    openfeign:
      client:
        config:
          default:            # applies to every client
            connectTimeout: 1000
            readTimeout: 2000
          inventory:          # per-client override, by @FeignClient name
            connectTimeout: 500
            readTimeout: 800
```

Leave `readTimeout` at its generous default and here is the failure mode. Your service runs on Tomcat with 200 worker threads. The inventory service degrades and now answers in 8 seconds instead of 40 ms. Each request now pins a Tomcat thread for 8 seconds. At 100 requests per second, all 200 threads are occupied within two seconds, the accept queue fills, and your service stops answering *everything* — including the healthy endpoints that never touch inventory. One slow dependency has exhausted your thread pool and taken you down with it. A tight `readTimeout` converts that slow bleed into fast, countable failures you can actually respond to.

## The retry storm

Now the subtler danger. OpenFeign ships with `Retryer.NEVER_RETRY`, but the moment you drop in a `Retryer.Default` bean — as countless tutorials tell you to — you get up to five attempts per call, and the load balancer can add its own retry across instances on top. Retries feel like resilience. Against a *struggling* downstream they are the opposite.

@fig sc7-retry

Consider a two-hop chain, edge to orders to inventory, each hop retrying up to 3 times. One original request can become 3 × 3 = 9 requests at inventory. While inventory is healthy this is invisible. When inventory is already overloaded and starting to time out, every timeout triggers a retry, so 1,000 real requests per second arrive as up to 9,000. The extra load makes it slower, more calls time out, which triggers more retries — a positive feedback loop that turns a recoverable hiccup into a downstream that cannot get back up because its own callers will not stop hitting it. This is a retry storm, and it is how a five-second blip becomes a thirty-minute outage.

## Safe retry: backoff, jitter, idempotency, breaker

Retry is not wrong; unconditional retry is. Four rules make it safe.

- **Only retry idempotent calls.** A `GET` is safe. A naked `POST` that charges a card or ships an order must not be blindly retried — retry it and you double-charge. Design the write to be idempotent (an idempotency key) before you retry it.
- **Cap attempts low and back off exponentially.** Two attempts, not five. Wait 100 ms, then 400 ms — give the downstream room to breathe instead of hammering it.
- **Add jitter.** Without a random component, every failed caller retries at the same instant and the herd re-arrives in synchronised waves. Jitter smears them out.
- **Put a circuit breaker in front.** When the downstream is clearly down, the breaker (Chapter sc9) stops the retries entirely — there is no point retrying a corpse.

In the bench, inject latency into the downstream, turn retries on, and watch the request count at the downstream multiply while its success rate falls — then add backoff and a breaker and watch the storm subside.

## Exercises

1. Add `connectTimeout` and `readTimeout` to a `@FeignClient` in one of your services, then point it at a socket that accepts connections but never replies (`nc -l`); confirm which timeout fires.
2. In the bench, set the downstream latency just above the `readTimeout` and record the caller's thread-pool occupancy with retries off, then on. Note where the pool saturates.
3. Compute the worst-case amplification for one of your real call chains: multiply the max attempts at each hop. Is any downstream facing a double-digit multiplier?
4. Take one non-idempotent `POST` in your system and write down what a blind retry would do. Then sketch the idempotency key that would make a retry safe.
