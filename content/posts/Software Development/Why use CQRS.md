---
title: CQRS
date: 2024-06-24T14:43:00+01:00
categories:
- Software Development
tags:
- software-architecture
- cqrs
---

CQRS is a design pattern where you have separate models for reads and writes.

On the write side, you typically have an encapsulated, object-oriented domain model with aggregates and value objects that is optimised for protecting domain invariants.

On the read side, you have a simple data model that is optimised for querying and performing joins across multiple aggregates, and projecting the results to view model or API responses.

Using the domain model on the read side and projecting it into view models can be cumbersome, inefficient, and warp its design to support queries. Since no updates are performed during a read, no business rules can be broken and so we don't need the domain model.

Since there's also no business logic on the read side, integration tests provide more benefits than unit tests, and so there's no need for the repository pattern either. As such, we typically use whichever method of data loading is most performant, and this might even vary per query (although, you might still [choose to create abstractions](When%20to%20create%20abstractions.md) for the queries if beneficial).

In summary, CQRS is essentially a separation of concerns between reads and writes, which simplifies the model used on each side.

You might choose to use CQRS

* to simplify your code base and in particular your domain model and your data model by separating those concerns
* to optimise query performance
* to avoid warping the domain model, which can happen when it has to cater for both reads and writes
* to open the door to further architectural patterns like event sourcing.

You might choose not to use CQRS

* if you have a CRUD-heavy app with simple query requirements where your views are mostly simple projections off of the domain model.
