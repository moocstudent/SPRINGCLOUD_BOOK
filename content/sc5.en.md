## The AP stance

CAP says that when the network partitions, a distributed store must give up either consistency or availability; it cannot keep both. Eureka makes its choice loudly and permanently: **availability**. It would rather hand you a registry that might be stale than one that refuses to answer. Every design decision inside Eureka follows from that single commitment — and the most famous, most misunderstood of them is *self-preservation*.

## Self-preservation: trigger, behaviour, rationale

Eureka's server counts heartbeats. With N instances each renewing every 30 seconds, it *expects* 2N renewals per minute. It sets a threshold at **85%** of that expected number (`renewal-percent-threshold: 0.85`). If the renewals actually received in the last minute fall below the threshold, Eureka concludes that something is wrong on a scale that individual eviction cannot be the right response to, and it flips into self-preservation mode. The behaviour is blunt: **it stops evicting anything.** Every lease, expired or not, is kept, and the whole table freezes until renewals climb back above the line.

The rationale is the interesting part, and it is sound. Ask which is more likely:

| Observation | Naive reading | Eureka's reading |
|---|---|---|
| 40% of heartbeats vanish in 60 s | 40% of instances died | The network to Eureka partitioned |
| Correct response | Evict them all | Keep them all, wait for recovery |

Mass simultaneous death is rare; a partition is common. And in a partition the instances are probably still alive and still serving each other — only the path *to Eureka* broke. If Eureka reacted by evicting them all, it would wipe a registry full of healthy instances at the exact moment callers most need it, turning a network blip into a total outage. Self-preservation refuses to do that. The governance bench simulates exactly this partition and lets you toggle the feature, watching it choose between keeping stale entries and unleashing a mass false-eviction storm.

@fig sc5-preserve

## The test-environment confusion

The same feature that saves production confuses everyone in dev. You kill a service by hand, refresh the dashboard, and it still shows **UP** — often for minutes, sometimes under a red banner warning that instances are not being evicted. Nothing is broken. In a two-instance test setup, killing one drops renewals by 50%, far past the 85% threshold, so Eureka enters self-preservation and stubbornly keeps the corpse. The fix in a non-production environment is simply to turn it off:

```yaml
eureka:
  server:
    enable-self-preservation: false   # dev only — never in prod
  client:
    register-with-eureka: false        # a server that does not register with itself
    fetch-registry: false
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

Note `register-with-eureka` and `fetch-registry`: a standalone Eureka *server* sets both false so it does not try to register with or pull from itself; every ordinary *service* leaves them true (the default).

## Peer replication for HA

One Eureka is itself a single point of failure, so production runs a cluster. Eureka nodes replicate by **each being a client of the others**: you list peers in `defaultZone`, and every registration or heartbeat one node receives is forwarded to its peers. The replication is asynchronous and best-effort — consistent with the AP stance — so peers can briefly disagree, but each holds a full copy and any one can serve the whole registry alone. Two nodes point their `defaultZone` at each other; three form a ring.

## Client caching and zone-aware routing

Callers reinforce the whole scheme. Each client fetches the registry every 30 seconds and caches it, so even if every Eureka node is unreachable, calls keep flowing against the cached list — the client-side survival you met last chapter. On top of that, Eureka is **zone-aware**: tag instances with a zone (an AWS availability zone, a rack, a room) via `metadata-map.zone`, and clients prefer instances in their own zone. That cuts cross-zone latency and egress cost, and keeps traffic local precisely when the link between zones is the thing that broke.

## Exercises

1. Run two service instances against one Eureka. Kill one and watch the dashboard: does it evict, or does the self-preservation banner appear? Explain the outcome from the 85% math.
2. Set `enable-self-preservation: false`, repeat, and confirm the dead instance is evicted within roughly 90 seconds.
3. Stand up two Eureka servers with each `defaultZone` pointed at the other. Register a service against one and confirm it appears in the other's dashboard, then kill one server and check the service is still discoverable.
4. Add `eureka.instance.metadata-map.zone` to two clients in different zones plus a caller set to prefer its own zone; confirm from the logs which instance it picks.
