---
title: Why reference aggregates by identity?
date: 2024-05-30T16:32:58+01:00
categories:
- Software Development
tags:
- domain-driven-design
---

There are two choices for referencing aggregates from other aggregates within a domain model: reference by object, or reference by identity.

Referencing by object means that each entity contains direct object references to related entities in other aggregates. For example, an `Order` entity might have a `Products` property that contains a list of `Product` entities.

Referencing by identity means that each entity contains only the identifiers of related entities in other aggregates. For example, an `Order` entity might have a `Products` property that contains a list of identifiers for related `Product` entities.

You might choose to at least reference *non-root* entities in other aggregates by identity in order to

* enforce the design constraint that aggregate roots are responsible for protecting the domain invariants within each aggregate. If other aggregates are allowed to access entities in other aggregates without going through the aggregate root, then the aggregate root isn't entirely responsible for protecting the domain invariants within that aggregate.

You might also choose to reference aggregate *roots* by identity in order to

* avoid loading more aggregates than necessary (or even the entire object model) into memory whenever you need to load a particular aggregate. You can also avoid this using lazy loading, but doing so means that
  * you can't always trust related aggregates to be loaded and therefore must litter your code with null checks
  * you have to create different repository methods for loading aggregates with and without each related aggregate, or else use the ORM directly without the repository pattern
* encourage the idea the aggregates are distinct, transactional boundaries.

{{\< note >}}It's fine for entities to reference other entities within the same aggregate by object, since all interactions with the aggregate from the outside still have to go through the aggregate root, which is ultimately responsible for protecting the aggregate's domain invariants.{{\< /note >}}
