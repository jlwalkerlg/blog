---
title: "Why Use the Repository Pattern?"
date: "2024-05-27T20:49:11+01:00"
categories:
  - Software Development
tags:
  - software architecture
  - the clean architecture
---

You might choose to use the repository pattern in your application, rather than working with an ORM directly, in order to

- enforce the design constraint of loading and persisting aggregates in full. If developers are allowed to load and persist entities without having to go through the corresponding aggregate roots, they can easily ignore the business rules and therefore break the domain invariants. With the repository pattern, your repository interfaces can be designed to only allow developers to load and persist aggregate roots, and the implementation should then load all other objects that make up the corresponding aggregates along with them.
- to decouple your application code from the ORM, such that you can swap it out for another ORM or data access implementation in the future. Depending on the maturity, reliability, and stability of your ORM, this might not be an issue.
- to decouple your application code from the ORM, such that you can swap it out for in-memory test doubles in unit tests. If your ORM supports an in-memory implementation suitable for unit tests, this might not be an issue.
- to keep your application logic clean by extracting out the ORM logic. This might be more or less of an issue depending on how clean it is to work with your particular ORM.

The main reason not to use the repository pattern is because of the indirection that it introduces, and the extra code you have to write to make it work.

If you're using CQRS, it's common to use the repository pattern on the command side, where business rules and domain invariants are a concern and are protected by domain aggregates, but then skip the repositories and work more directly with the database on the query side where read performance is the primary concern.
