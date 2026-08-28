## The monolith's three real pains — and three false ones

Be honest about which pain is yours. A monolith's three *real* pains are all organisational. **One release train:** forty engineers merge into one deployable, so the riskiest change sets everyone's pace and a bad commit blocks the queue. **Coupled scaling:** one endpoint is CPU-hungry, but you scale the whole process, buying RAM you don't need to get the CPU you do. **One stack for everyone:** the team that wants a different language can't have it, because it all links into one artifact.

These are about *teams and delivery*, not slow code. The three *false* pains: "the codebase is too big" — bigness isn't the problem, tangle is. "Monoliths don't scale" — a stateless monolith behind a load balancer scales horizontally to enormous traffic. "Microservices are faster" — almost always *slower* per request, because you replaced in-process calls with network calls. The whole trade in one sentence: **nearly every benefit of microservices is organisational, and nearly every cost is technical — a bill you pay every day in production.**

## The distributed tax: a bill in availability, latency and complexity

Three line items. **Availability:** a method call now crosses a network that can drop, delay or partition, so the more services a request touches, the more ways it fails (math below). **Latency that stacks:** every hop adds serialization, a round trip and a queue wait; five sequential 5 ms hops is 25 ms of overhead before any real work, and the *tail* stacks worse than the average — one slow hop drags the whole request's p99. **Operational complexity:** to claw back the reliability the monolith gave you for free, you now run discovery, load balancing, circuit breakers, tracing, a config server and a broker. Twenty chapters ahead exist only to pay down this item.

One upside hides here — **smaller fault domains.** A monolith's memory leak takes everything down; split well, a bug in Recommendations shouldn't kill Checkout. But that is *conditional*: if Checkout hard-depends on Recommendations in series, the blast radius is the whole chain again — smaller fault domains are earned with the bulkheads and breakers of Module III.

## Composite availability: what is 0.999 to the tenth

Model a request as a chain of N services in series, each independently up 99.9% of the time. It succeeds only if *all* N are up, so composite availability is 0.999 to the Nth:

| Services in chain (each 99.9%) | Composite availability | Annual downtime |
| --- | --- | --- |
| 1 | 99.90% | ~8.8 hours |
| 3 | 99.70% | ~26 hours |
| 5 | 99.50% | ~44 hours |
| 10 | 99.00% | ~3.7 days |
| 20 | 98.02% | ~7.2 days |

At N = 10 you land on 0.999 to the 10th ≈ 99.0%: no bugs written, yet availability fell tenfold and annual downtime went from nine hours to nearly four days. **In the bench above, drag N to 10 and watch the composite curve sink**, then flip the retry and breaker toggles and watch it climb back — a fallback turns a *hard* dependency into a *soft* one, dropping that service from the success calculation. The model is pessimistic on purpose (independent failures, a hard serial chain, every service critical); real systems soften it with caches, async calls and fallbacks — the work of the rest of this book. 99.0% is not your fate; it is your *starting line*.

@fig sc1-tax

```java
// Monolith: an in-process call — it never times out, drops, or partitions.
BigDecimal price = pricingService.quote(cart);

// Microservice: the identical line is now a network call —
// it can time out, return 503, or hang until the caller's threads are gone.
BigDecimal price = pricingClient.quote(cart);   // OpenFeign, over HTTP
```

## When to stay in the monolith

Three signals say *not yet*:

1. **A tiny team.** Eight engineers and fifteen services means no one owns a service end to end, and the payoff — independent teams shipping independently — doesn't exist. You pay the whole tax with no one to collect the reward. Aim for roughly a team per service.
2. **Unclear or volatile boundaries.** If the business still changes weekly you don't know where the seams are, and a wrong seam is this book's most expensive fix: moving a responsibility across a boundary is a cross-repo, cross-team, cross-deploy refactor, not a rename.
3. **Tight data coupling.** If two chunks constantly read and write each other's data in one transaction, splitting them makes every such operation a distributed transaction — a `@Transactional` you understand traded for a Saga you debug at 3 a.m.

The mature default is a **modular monolith** first: enforce module boundaries *in code* (separate packages, no cross-module table access), prove where the seams are, and extract a service only when a module needs independent deployment, independent scaling, or a different team's ownership. Microservices should be an extraction you *earn*, not your starting shape.

## Exercises

1. Take one real request you know and count its downstream hops. Assume each dependency is 99.9% available, compute the composite, then find the hop whose failure hurts most and describe how a fallback changes the number.
2. Spin up two Spring Boot services locally, have A call B over HTTP, then kill B. Measure what A's callers experience with no timeout, then with a 500 ms read timeout — note how long a thread stays stuck each way.
3. For your current system, write down which "don't split" signals apply. If you'd split anyway, name the team that would own each proposed service.
4. In the bench, set every service to 99.95% and find the N at which composite availability first drops below 99.9%. Explain why "just one more service" is never free.
