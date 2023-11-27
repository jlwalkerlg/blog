---
title: "CQRS"
date: "2023-11-27T09:43:35Z"
categories:
  - Software Development
tags:
  - software architecture
  - cqrs
  - domain driven design
---

Typically we have a single domain model that serves both reads and writes.

But we have very different priorities for these two operations.

On the write side (the command side), we want to follow DDD principles and load our aggregates in full, use value objects, and possibly encapsulate some internal entities behind the aggregate root.

On the read side (the query side), we don't care so much about the business logic; we just want to read the data as efficiently as possible and project it into view models that are tailored as much as possible to the needs of the client. This might involve querying across multiple aggregates and projecting the data into a single view model or DTO.

Using the domain model for queries of this nature is inefficient and can warp the design of the domain model.

As such, CQRS (command query separation principle) suggests that we simply create a separate model for queries, and bypass the domain model on the read side altogether.

This is acceptable because there are no side effects with queries, and as such no core business rules to enforce and so no _need_ for the domain model.

Because there's no domain model, there's also no obligation to use the same ORM as the command side. We're free to use a different ORM, a micro-ORM, raw SQL queries, or database views, and we can even make this decision per query.

With this, we also get an increase in query performance, in addition to the benefits already mentioned.

It also opens up the opportunity for further architectural patterns, like event sourcing, or having a separate database schema optimised for queries.
