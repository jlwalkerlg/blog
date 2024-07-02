---
title: Why use DDD?
date: 2024-07-02T12:43:00+01:00
categories:
- Software Development
tags:
- domain-driven-design
---

DDD is a software philosophy and methodology that focuses on aligning the software with the business domain and accurately modelling its concepts and behaviours using the business own terminology and language.

It is suitable for intrinsically complex business domains and is an attempt to reduce the accidental complexity of software that is often added on top of such domains when the software doesn't accurate model the business.

It uses patterns such as bounded contexts and aggregates to break down the complex business domain into smaller chunks that are easier to model piece-by-piece.

It also relies heavily on OOP principles such as encapsulation to reduce software complexity.

You might choose to use DDD in order to

* reduce accidental (technical) complexity within intrinsically complex business domains.

You might choose not to use DDD

* if the intrinsic complexity of the business domain you're modelling isn't sufficient to warrant it. For example, if the complexity of the system lies in the technical challenges (such as real-time data ingestion services) rather than the business processes themselves, then DDD won't have as much value.
