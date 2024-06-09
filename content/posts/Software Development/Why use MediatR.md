---
title: Why use MediatR?
date: 2024-05-31T12:10:36+01:00
categories:
- Software Development
tags:
- the-clean-architecture
---

MediatR is an out of the box command dispatcher library that's often used to separate the application layer from the delivery mechanism. For example, it's common for controllers in a web API to send requests to the application through MediatR.

You might choose to use MediatR because

* it encourages you to [decouple your core application logic from the delivery mechanism](What%20is%20the%20application%20layer.md) (e.g., your web controllers).
* it encourages you to represent all the requests and responses in your application as explicit data types (e.g., classes), making your app's functionality more visible and explicit
* it encourages you to have one handler per request, rather than different service classes each handling multiple use cases — the single responsibility pattern
* it allows you to use the chain of responsibility pattern via pipeline behaviours (middleware) for cross-cutting concerns.

You might choose not to use MediatR because

* it introduces indirection
* the routing of requests to the corresponding handlers is opaque and less explicit than simple method calls.
