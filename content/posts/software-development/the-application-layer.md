---
title: "The Application Layer"
date: "2020-08-31T17:32:00Z"
categories:
  - Software Development
tags:
  - domain driven design
  - software architecture
  - the clean architecture
---

Take a look at the standard diagram of [The Clean Architecture](http://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html), and you'll notice a layer labelled "Application Business Rules", wherein the "Use Cases" are defined. Uncle Bob describes this layer as the one which contains "application specific business rules", and whose purpose is to "orchestrate the flow of data to and from the entities, and direct those entities to use their _enterprise wide_ business rules to achieve the goals of the use case".

But what does this mean exactly, and why do we need such a layer? For example, many developers often neglect this layer and call directly into the core domain layer from their controllers. What's wrong with this approach, and how is a separate layer for use cases any different? Furthermore, how is this "application layer" different from the "application services layer" of domain-driven design, or the inner hexagon of Hexagonal Architecture, where the "core application" lives? Also, what's the difference between application services and domain services?

## Use Cases vs Controllers

The only difference between use cases and controllers is that _controllers are coupled to the delivery mechanism (e.g. the web), whereas use cases are not_.

Apart from this, use cases and controllers really serve the same purpose: they accept user input; call into the domain model in order to actually implement a particular use case; and return a response to the user. Both use cases and controllers can also use dependency inversion to decouple themselves from all infrastructure, such as repositories.

However, controllers are usually integrated with the framework's internal wiring, and in turn with the particular request/response format of the web: HTTP. They will usually extend some base controller provided by the framework; have some way of retrieving user input from the query string or the request body; and return a HTTP response particular to the web, possible containing HTML or JSON.

On the other hand, the application layer deals works with simple data structures, such as DTOs, that are not tied to any delivery mechanism, or any particular framework. By pulling the orchestration logic out of the controllers, we gain the following benefits.

First, we make the use case logic easier to test in isolation, without having to deal with the base controller or any other aspect of the framework.

Second, the code becomes easier to reason about because it has fewer responsibilities. Use cases no longer have to deal with extracting data from HTTP requests, or returning HTTP responses.

Third, by decoupling the logic from the delivery mechanism, the use cases can be re-used with any delivery mechanism and any framework, such as a console or desktop application. That is, the application can potentially be driven by any client. This is also one of the main goals of Hexagon Architecture.

Note that the use cases are not totally oblivious of the client; part of their purpose is to deal with user input, and return user output. However, this input/output is normalised into some standard format that is not specific to a particular delivery mechanism.

## Hexagonal Architecture

The application layer in The Clean Architecture is the same layer in which the ports are defined in Hexagonal Architecture. That is, the inside of the hexagon.

The main difference is that Hexagonal Architecture doesn't actually define _layers_ — only an _inside_ and an _outside_ (of the hexagon). In other words, it says nothing about how to structure the inside of the hexagon. It only states that the core application should be decoupled from infrastructure by placing ports (interfaces) between them.

On the other hand, The Clean Architecture goes slightly further in suggesting that the inner hexagon should be made up of 2 layers: the application layer, and the domain layer. The application layer defines the ports for communication with infrastructure, and actually implements the use cases by deferring to the domain layer, which is designed with DDD in mind.

![The Clean Architecture hexagon](/images/the-clean-architecture-hexagon.png)

## Application Business Rules vs Enterprise Business Rules

In The Clean Architecture nomenclature, the core domain layer implements the so-called "enterprise business rules". As in DDD, it consists of entities, value objects, and domain services, which hold the domain knowledge and encode the associated logic that is central to the business.

On the other hand, the so-called "application business rules" are more peripheral in that they specify how the application uses those core (enterprise) business rules in order to make it an application. _They provide a facade that exposes the domain model to external clients_, and define what this particular application can be used to do with the core domain model. That is, they define the use cases of the application.

## Application Services vs Domain Services

Application services are the use cases and interfaces of the application layer in The Clean Architecture, or the ports of Hexagonal Architecture. They define the application's interface such that external clients know what use cases the application consists of, and what infrastructure is required of it.

For example, in domain-driven design, there may be an `IOrderService` with methods for placing an order, cancelling an order, or adding a new item to the order. In The Clean Architecture and Hexagonal Architecture, this would be broken down into separate interfaces for each use case, such as an `IPlaceOrderUseCase`, an `ICancelOrderUseCase`, and an `IAddOrderItemUseCase`.

On the other hand, domain services are not specific to any particular use case or application; they are central to the domain model, and encode some core business logic that doesn't conceptually belong to any particular aggregate root. From [Eric Evans' DDD example project](http://dddsample.sourceforge.net/characterization.html), domain services "encapsulate domain concepts that just are not naturally modelled as things", and "are expressed in terms of the ubiquitous language and the domain types".

Unlike an application service, domain services don't typically communicate with the outside world, handle user input/output, or implement the use cases of the application. Instead, they are used by the application layer just like an entity or a value object to enact the business rules and keep the core business logic where it belongs: in the domain.
