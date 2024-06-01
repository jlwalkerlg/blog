---
title: "Why use the repository pattern?"
date: "2024-05-27T20:49:11+01:00"
categories:
  - Software Development
tags:
  - software architecture
  - the clean architecture
summary: The repository pattern is a design pattern where all database operations within the application layer are abstracted behind interfaces, rather than working with the data access layer or an ORM directly.
---

{{< note >}}The repositories described here are not part of the domain model. They live in the application layer and are used to persist and load the domain model to and from the database.{{< /note >}}

The repository pattern is a design pattern where all database operations within the application layer are abstracted behind interfaces, rather than working with the data access layer or ORM directly. Typically, you'll have a repository per entity or aggregate root (if following DDD). For example, if you have an `Order` aggregate, you'll typically have an `IOrderRepository` with methods like `GetOrderById` and `AddOrder`.

You might choose to use the repository pattern in order to

- enforce the design constraint that aggregates should be loaded and persisted in full. If developers are allowed to load and persist entities without having to go through the corresponding aggregate roots, they can easily ignore the business rules and therefore break the domain invariants. With the repository pattern, your repositories can be designed such that they necessarily load and persist aggregates in full.
- decouple your application code from the ORM, such that you can swap it out for another ORM or data access implementation in the future. This may or may not be an issue depending on the maturity, reliability, and stability of your ORM, and the likelihood of you swapping it out for something else.
- decouple your application code from the ORM, such that you can swap it out for in-memory test doubles in unit tests. If your ORM supports an in-memory implementation suitable for unit tests, this may not be an issue.
- keep your application logic clean by separating it from the ORM logic. This may or may not be an issue depending on how clean it is to work with your particular ORM.

You might choose not to use the repository pattern

- because of the indirection that it introduces
- because you lose the flexibility and functionality you get in your application layer when working with the ORM directly.

If you're using CQRS, it's common to use the repository pattern on the command side, where business rules and domain invariants are a concern and should be protected by domain aggregates, but then skip the repositories and work more directly with the database on the query side where read performance is the primary concern.
