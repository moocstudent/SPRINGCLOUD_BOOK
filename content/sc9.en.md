## How one slow downstream takes down everything

Start with the failure this chapter exists to prevent. Your service handles requests on a pool of 200 threads, and a downstream you call normally answers in 50 ms — so each thread finishes 20 calls a second and the pool sustains 4,000 a second.

The downstream degrades — a bad deploy, a lock, a slow query — and now takes 5 seconds per call. Each thread now finishes 0.2 calls a second. At 1,000 incoming requests a second, all 200 threads are stuck waiting inside 200 ms, the accept queue fills, and your service starts refusing *every* request — including the ones that never needed the sick downstream. You did not run out of CPU or memory; you ran out of *threads*, all parked on one dependency. Then whoever calls *you* sees *you* time out, their threads pile up, and the failure climbs the call graph one layer at a time. That is an avalanche; the four patterns in this chapter stop it at a boundary.

## The circuit breaker's three states

The circuit breaker is a fuse for calls. It wraps a downstream, watches the outcomes, and has three states.

@fig sc9-breaker

- **Closed** — normal. Calls pass through, and the breaker records each outcome in a sliding window (say the last 100 calls). If the failure rate crosses a threshold — 50% over a minimum sample — it trips to **open**. Resilience4j also counts a call slower than a set duration as a "slow call", so it can trip on slowness before those calls even fail.
- **Open** — tripped. Every call fails *immediately* with `CallNotPermittedException`; nothing reaches the downstream. That is the point: the caller stops parking threads on a dependency that is clearly down and spends the wait recovering. It stays open for a fixed `wait-duration-in-open-state`, say 10 seconds.
- **Half-open** — probing. After the wait, the breaker admits a small fixed number of trial calls (say 5). If they mostly succeed, it closes and normal traffic resumes; if they still fail, it opens again — recovering with no human involved, and without slamming full traffic onto a still-fragile downstream.

```java
@CircuitBreaker(name = "inventory", fallbackMethod = "stockFallback")
public StockLevel getStock(String sku) {
    return inventoryClient.getStock(sku);
}

// same parameters as the guarded method, plus the Throwable
private StockLevel stockFallback(String sku, Throwable t) {
    return StockLevel.unknown(sku);   // a safe default, not an exception
}
```

The thresholds are not decoration — they *are* the behaviour:

```yaml
resilience4j:
  circuitbreaker:
    instances:
      inventory:
        sliding-window-type: COUNT_BASED
        sliding-window-size: 100
        minimum-number-of-calls: 20          # don't trip on the first 2 failures
        failure-rate-threshold: 50           # % failed -> open
        slow-call-duration-threshold: 2s
        slow-call-rate-threshold: 80         # % slower than 2s -> open
        wait-duration-in-open-state: 10s
        permitted-number-of-calls-in-half-open-state: 5
```

Set `minimum-number-of-calls` too low and a two-request blip trips the breaker; set `failure-rate-threshold` too high and it never trips when it should. In the bench you drive these directly: overload the downstream, watch the breaker snap open past the threshold, then watch the half-open probes heal it once the downstream recovers.

## The other three: limit, fall back, isolate

A breaker reacts *after* failures accumulate; three siblings cover the other angles.

| Pattern | Protects against | Mechanism | The trap |
|---|---|---|---|
| Circuit breaker | A downstream that is down or slow | Trip open, fail fast, probe back | Mis-tuned thresholds trip too early or never |
| Rate limiter | More traffic than your capacity | Reject over-budget calls at the door (429) | Set below real capacity and you shed good load |
| Fallback | A failed or tripped call needing an answer | Return a safe default | Falling back to a *wrong* answer is worse than an error |
| Bulkhead | One dependency exhausting all threads | Separate pool/semaphore per downstream | Too many small pools waste capacity |

**Rate limiting** shifts the decision to the front door: over capacity, reject fast with a 429 instead of accepting work you cannot finish. **Fallback** answers a failed call with a safe default — cached data, an empty list — but never a plausible lie; a fake "payment succeeded" is far worse than an honest error. **Bulkheads** give each downstream its own thread pool or semaphore, so the avalanche above cannot happen: exhausting the pool for the sick service leaves the healthy services' pools untouched.

## Resilience4j or Sentinel

Both do all four patterns; they differ in operating model.

- **Resilience4j** — a light Java library, configured per instance in code or YAML, driven by annotations, wired into Micrometer. It is the default behind the Spring Cloud Circuit Breaker abstraction after Hystrix's retirement; config is largely static per deploy.
- **Sentinel** (Alibaba) — a runtime with a dashboard, dynamic rules pushed live from Nacos, hotspot-parameter limiting and system-adaptive load protection. Heavier to run, but you retune thresholds without a redeploy — reach for it when operators must change limits live across a big fleet.

## Exercises

1. In the bench, push the downstream failure rate just above and just below `failure-rate-threshold` and confirm the breaker trips in one case and not the other.
2. Annotate a real call with `@CircuitBreaker` and a `fallbackMethod`; force failures and verify the fallback runs and returns a *safe* value, not a misleading one.
3. Give two downstreams separate Resilience4j bulkheads, then saturate one and show that calls to the other still succeed.
4. For one real dependency, write down its `failure-rate-threshold`, `wait-duration-in-open-state` and half-open probe count, and justify each number against that dependency's real recovery time.
