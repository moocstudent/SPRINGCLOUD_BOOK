## Two tools in one process

Nacos is the near-default in the Chinese Spring Cloud world, and its first advantage over Eureka is scope: it is a **registry and a configuration centre in the same server**. One cluster answers both "where is the order service" and "what is its current database URL and feature-flag set" — and, crucially, it pushes config changes to running instances without a restart. Merging the two is convenient, but it forces a question Eureka never had to ask, because discovery and config want *opposite* consistency guarantees. Nacos's real lesson is how it answers that.

## Namespace, group, dataId

First, organisation. A real company runs hundreds of services across several environments, and Nacos separates them on three axes:

| Level | Isolates | Example |
|---|---|---|
| Namespace | Environments | `dev`, `test`, `prod` (each a separate UUID) |
| Group | Business lines / clusters | `ORDER_GROUP`, `PAY_GROUP` |
| DataId | A single config file | `order-service-prod.yaml` |

The namespace is the load-bearing one: a prod client pointed at the `prod` namespace physically cannot see or read `dev` config, which is what stops a test change from ever reaching a production instance. Get this wrong and environments leak into each other.

## Distro and Raft: two consistencies

Now the core. Nacos carries **two consistency protocols at once** and routes data to one or the other by type.

- **Distro (AP)** handles *ephemeral* instances — ordinary services that heartbeat. It is a gossip-style replication protocol with no leader: each node owns a slice of the registrations and syncs it to the others. Under a partition every node keeps serving reads and accepting registrations.
- **Raft (CP)** handles *persistent* instances and *all configuration*. It is a leader-based quorum protocol: a write must be acknowledged by a majority of nodes before it commits. Lose the majority and writes stop.

@fig sc6-cap

| | Distro (AP) | Raft (CP) |
|---|---|---|
| Used for | Ephemeral instances (discovery) | Persistent instances + config |
| A write needs | Any node (async replicate) | Majority quorum |
| On partition | Every side stays writable, may diverge | Minority rejects writes |
| Instance lifecycle | ~5 s heartbeat, unhealthy at 15 s, removed at 30 s | Survives node restart |

## Why discovery wants AP and config wants CP

This is the whole point of the chapter, and it is not arbitrary. **Discovery tolerates staleness.** If your instance list is a few seconds behind reality, you might call an instance that just left — caught by a retry or a circuit breaker — or miss a brand-new one for a moment. Survivable. What you cannot survive is the *registry itself* going silent during a partition and freezing every caller, so discovery picks availability.

**Config tolerates no divergence.** Push a new database connection string or flip a feature flag, and if config were served by an AP protocol, half your fleet could read the new value and half the old. Now half your instances write to the new database and half to the old; half enforce the new business rule and half do not. That is not stale, it is *split* — corrupt data and behaviour that no dashboard will explain. Better that a minority partition refuses the new config than that the fleet silently diverges, so config picks consistency.

## Under partition, by hand

The governance bench splits a Nacos cluster into a majority and a minority side and lets you switch a datum between AP and CP.

- **AP (Distro):** both sides keep serving discovery and accepting registrations. Their views drift apart during the split and re-converge by gossip once the link heals. Nobody is refused; some reads are stale.
- **CP (Raft):** the majority side keeps its leader and accepts config writes; the minority side cannot form a quorum, so it rejects writes and serves only the last committed value. No split-brain, but the minority has lost write availability.

You choose the protocol per registration with one flag:

```yaml
spring:
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848
        namespace: prod          # environment isolation
        group: ORDER_GROUP
        ephemeral: true          # true -> Distro/AP (default); false -> Raft/CP
```

Flip `ephemeral: false` and that service registers through Raft as a persistent, CP instance — right for a fixed piece of infrastructure, wrong for an autoscaling stateless pod.

## Exercises

1. Start a single Nacos, create `dev` and `prod` namespaces, and register the same service into each. Confirm a client bound to `prod` cannot see the `dev` instance.
2. Register one service with `ephemeral: true` and another with `ephemeral: false`; kill both and watch which disappears on its heartbeat timeout and which persists.
3. Put a `feature.enabled` value in a Nacos config, wire it with `@RefreshScope`, and change it in the console — confirm the running app picks it up with no restart.
4. Run a 3-node Nacos cluster, stop 2 nodes to break quorum, and try to publish a config change. Observe the write being rejected, then explain why that is *correct* for config but wrong for discovery.
