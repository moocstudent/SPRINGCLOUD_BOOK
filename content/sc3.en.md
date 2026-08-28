## Two wrong cuts: the coarse pseudo-service and the fine distributed monolith

Decomposition is the most expensive decision in microservices because it is the hardest to reverse. There are two ways to get it wrong, and they fail in opposite directions.

**Too coarse.** You split the monolith into two or three big services that still share data and still change together. You now pay network latency and deployment coordination and gained none of the independence — a **pseudo-service**. You did the hard work and got a slower monolith.

**Too fine.** You chase "small is beautiful" into nano-services: one per table, one per entity. Now a single checkout fans out to a dozen synchronous calls (**chatty**), and — far worse — a rule that must hold atomically, reserve stock *and* charge the card, is split across services, so you need a **distributed transaction** on the everyday path. You traded one `@Transactional` for a Saga.

## Bounded contexts: one service owns one domain

The right seam comes from Domain-Driven Design: cut along **bounded contexts**, not tables. A bounded context is a boundary inside which each term has exactly one meaning. "Customer" in Sales (a lead with a pipeline stage) is not "Customer" in Billing (an account with a payment method) is not "Customer" in Support (a ticket history). Where the *meaning of the language changes*, there is a seam.

Contrast cutting by table. A `UserService` owning the user table and an `OrderService` owning the order table turn one order screen — user + orders + addresses — into a cross-network fan-out: a single SQL `JOIN` becomes three RPCs. Bounded contexts avoid this because a context owns *all* the data it needs to answer its own questions; it is cohesive by construction. Align services with **business capabilities** — Catalog, Ordering, Inventory, Payment, Shipping — each a context that owns its data and exposes only behaviour.

## Each service owns its data — no shared database

This is the rule that makes the rest work, and the one teams break most often: **a service's tables are private.** No other service reads or writes them directly — only through the owner's API or its events.

@fig sc3-split

Why so strict? A shared schema is the **tightest coupling that exists.** The moment two services `SELECT` from the same table, you cannot change its shape without a synchronised, multi-service deployment — and "deploy independently", the reason you split, is dead. A shared database gives you the monolith's coupling *plus* the network's cost. So cross-service data is fetched by asking the owner, or kept as a local read-model updated by the owner's events, and consistency becomes **eventual** (Module V).

```yaml
# order-service — its own schema, reachable by no one else
spring:
  datasource:
    url: jdbc:postgresql://db-order:5432/order_db     # NOT the inventory schema
# inventory-service — a physically separate database
spring:
  datasource:
    url: jdbc:postgresql://db-inv:5432/inventory_db
```

If two of your services point their `datasource` at the same schema, you do not have two services.

## The U-curve of granularity, and the coupling test

Plot total cost against granularity and you get a **U**. The left arm is high (too coarse: can't scale or deploy parts independently, large blast radius). The right arm is high (too fine: cross-service calls, distributed transactions, more infrastructure and cognitive load per feature). The bottom — the optimum — is set by **your domain's actual coupling**, not by "smaller is better." **Drag the granularity slider in the bench and watch cross-service calls and distributed-transaction reach climb steeply on the fine side** while the change-blast-radius shrinks; the crossover is your minimum.

How do you know a boundary is wrong? Use the **coupling test** — the symptoms of a *distributed monolith*:

| Symptom you observe | What it means | Action |
| --- | --- | --- |
| Two services are always released together | Their reasons to change are the same | Merge them |
| One business operation traces through many services | One capability was split up | Redraw the seam around it |
| Services share a table or schema | They share one source of truth | Give ownership to one; expose an API |
| A feature routinely edits two services at once | High cohesion cut in half | Move the seam |

The principle underneath is the oldest in software: **high cohesion inside a service, loose coupling across the boundary.** If a proposed boundary slices through a cluster of things that change together, it is in the wrong place — those services were **one service you pried apart.** Merge them, and split where the coupling is actually low. The knife is cheap to swing and brutal to un-swing, so swing it where the domain is already thin.

## Exercises

1. Take a feature you shipped recently and list every service (or module) its change touched. If it touched three, propose a single boundary that would have made it touch one.
2. Event-storm one domain you know: write every domain event as "SomethingHappened", cluster them, and draw candidate bounded contexts around the clusters. Mark any term (e.g. "order") that means two different things in two clusters.
3. Find a shared table between two services (or invent a plausible one). Design the API call or event that would let one service own it and the other stop reading it directly.
4. In the bench, push granularity to the fine extreme and record the distributed-transaction count; then find the granularity that minimises total cost and explain which domain fact pins the optimum there.
