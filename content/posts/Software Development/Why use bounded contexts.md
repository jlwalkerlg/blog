---
title: Why use bounded contexts?
date: 2024-07-02T12:31:00+01:00
categories:
- Software Development
tags:
- domain-driven-design
---

Bounded contexts are a DDD pattern wherein the business domain is decomposed into multiple subdomains, around which the code explicitly partitioned.

Each bounded context has its own domain model and fully owns its own data, which means they also have their own databases (or database schemas), separate from other bounded contexts.

You might choose to use bounded contexts in order to

* break down a large problem space (the business domain) into multiple smaller problems (subdomains) that are easier to solve independently
* have more concise domain models within each subdomain that more accurately reflect the business they're modelling
* organise the software development team around different bounded contexts, such that the team structure more closely aligns with the business and each team becomes a domain expert in one aspect of the business.

You might choose not to use bounded contexts if

* the business domain is not sufficiently complex to warrant the overhead, in particular eventual consistency and code duplication.
