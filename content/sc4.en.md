## Why addresses cannot be hard-coded

In a monolith, one method finds another through a reference the JVM already holds. Split them into services and "which host and port is the order service on right now" becomes a runtime question with a moving answer. Instances restart on every deploy, multiply when you scale out for a sale, vanish on a crash, and drift to new IPs as Kubernetes reschedules pods. Hard-code `10.2.4.11:8080` in a config file and you have signed up to redeploy every caller each time that changes — which is daily. A registry exists to answer this question at runtime instead.

## Heartbeat, lease, TTL

The mechanism is a three-beat loop. **Register**: on startup an instance POSTs its address and metadata to the registry, which adds it to the list as UP. **Renew**: the instance then sends a heartbeat on a fixed interval, each one extending a *lease* — a promise, "I am still alive, keep me for another TTL seconds." **Discover**: callers pull the current list and route to it. Miss enough heartbeats and the lease expires; the registry evicts the entry and stops handing it out.

The lease's TTL is the whole game. It is the registry's answer to a question it can never answer perfectly: *is a silent instance dead, or merely quiet?* An instance can go silent for reasons that have nothing to do with health — a 4-second stop-the-world GC pause, a dropped heartbeat packet, a momentary network hiccup between it and the registry. The registry cannot tell those apart from a real crash. All it sees is the absence of a heartbeat.

## The dilemma: fast detection versus false kills

That leaves you tuning one dial with a different failure mode at each end.

@fig sc4-heartbeat

**Evict too fast** and a healthy instance that merely paused for a GC gets kicked out; callers lose capacity they still had, and the instance re-registers seconds later in a flap that churns every client's routing table. **Evict too slowly** and a genuinely dead instance stays in the list, so the load balancer keeps sending it traffic and every one of those requests times out until the lease finally lapses.

| Setting | Detection speed | Risk under jitter |
|---|---|---|
| Short TTL (aggressive) | Fast — dead instances leave quickly | High — healthy instances wrongly evicted on a hiccup |
| Long TTL (lenient) | Slow — dead instances linger | Low — survives GC pauses and blips |

There is no correct value, only a position on this axis chosen for your environment. The load-bearing relationship is this: **detection latency is bounded below by the TTL.** You cannot notice a death faster than the timeout you set to declare it. Shrink the TTL to detect faster and you slide rightward into false-eviction territory; the governance bench lets you drag the heartbeat interval, the timeout multiple and a jitter rate, and watch the detection time fall as the false-eviction rate climbs.

## Where Eureka sits on the axis

Concrete numbers make the trade real. Eureka's defaults: a heartbeat every **30 seconds**, and a lease that expires after **90 seconds** without one — three missed beats.

```yaml
eureka:
  instance:
    lease-renewal-interval-in-seconds: 30    # heartbeat every 30s
    lease-expiration-duration-in-seconds: 90 # evict after 3 missed beats
```

So a crashed instance can linger up to 90 seconds before its lease lapses, and because Eureka's eviction task only sweeps every 60 seconds, the real worst case is closer to 90 + 60 ≈ 150 seconds. That is a deliberately *lenient* position: Eureka would rather tolerate a dead instance for a minute-plus than risk evicting live ones. Nacos, which the next chapters reach, sits far more aggressively — a 5-second heartbeat, unhealthy at 15, removed at 30.

## Client-side caching

One more mechanism turns the registry from a single point of failure into a mere convenience. Callers do not query the registry on every request; they **pull the list periodically and cache it locally** (Eureka clients refetch every 30 seconds by default). So if the registry itself goes down, callers keep routing against their last-known-good list and traffic flows uninterrupted. A registry outage degrades *freshness* — you stop learning about new or departed instances — but it does not stop calls. This is the payoff of the AP choice the next chapter unpacks: a slightly stale list you can still read beats a perfectly consistent one you cannot.

## Exercises

1. Stand up a Eureka server and one client. Read `/eureka/apps` on the server and find your instance's `leaseInfo` — note the `renewalIntervalInSecs` and `durationInSecs`.
2. Kill the client with `kill -9` and time it with a stopwatch: how many seconds until it disappears from the dashboard? Compare against the 90 s + eviction-sweep math.
3. Set `lease-renewal-interval-in-seconds: 5` and `lease-expiration-duration-in-seconds: 15`, repeat, and confirm detection is faster — then argue what you gave up.
4. Stop the Eureka *server* while a caller loops requests to the client through discovery. Confirm the calls keep succeeding from cache, then explain to a teammate why.
