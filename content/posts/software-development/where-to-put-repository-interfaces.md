---
title: "Where to Put Repository Interfaces"
date: "2023-11-27T10:36:42Z"
categories:
  - Software Development
tags:
  - software architecture
  - domain driven design
  - the clean architecture
---

There's often a lot of debate around whether repositories should go in the application layer or in the domain layer.

A good argument for putting them in the domain layer is that this way the domain layer defines how the domain model can be loaded and persisted to and from storage.

But the truth is that interfaces should be defined by the client that actually uses them. This is true of all interfaces in software development, not just repositories in DDD or The Clean Architecture.

As such, if the domain layer needs to access the database (e.g., in a domain service), it will define an interface to do so.

But as per the interface segregation principle, this interface shouldn't contain any more methods than are needed by the client, i.e., the domain layer; the application layer should define any interfaces _it_ needs to access the database separately.

Therefore, both the domain layer and the application layer are likely to contain their own repository interfaces, both of which should be implemented by the infrastructure layer.

If the application layer needs to use an interface defined in the domain layer, it can just use this interface itself; there's no need to copy the interface into the application layer.
