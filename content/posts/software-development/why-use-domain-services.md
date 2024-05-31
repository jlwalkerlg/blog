---
title: "Why use domain services?"
date: "2024-05-31T12:27:29+01:00"
categories:
  - Software Development
tags:
  - domain driven design
---

_TLDR: use domain services to enforce business rules that span across multiple aggregates._

In DDD, aggregates are self-contained consistency boundaries that enforce the business rules related only to themselves.

However, in almost every domain there will necessarily be business rules that span across multiple aggregates, and as separate, isolated entities, none of the involved aggregates can enforce the business rules themselves.

In these cases, you would use a domain service.

Domain services live in the domain layer and are typically implemented as classes in object-oriented languages. They might use interfaces to access external services and often, for example, use domain repositories in order query, load and persist domain aggregates.

For example, an `IssueManager` domain service might use an `IIssueRepository` to check how many issues are currently assigned to a user before assigning another. If too many are assigned, the domain service might throw an exception to enforce the business rule.
