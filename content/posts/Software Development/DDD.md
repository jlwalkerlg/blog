---
title: DDD
date: 2024-06-26T16:05:00+01:00
categories:
- Software Development
tags:
- domain-driven-design
---

In any software development project, there is both intrinsic complexity and accidental complexity.

Intrinsic complexity is inherent in the problem we are solving. That is, it's intrinsic to the business domain that we're trying to model with software.

Accidental complexity is the technical complexity that we as developers add on top of the intrinsic complexity in our software implementation.

DDD is suitable for projects with high business complexity (as opposed to only technical complexity); it is an attempt at reducing accidental complexity within intrinsically complex domains by more closely aligning the software with the business model, concepts, and language. It is a software design philosophy that emphasises understanding the business domain itself before distilling those concepts into a concise model, and then encoding that model into software using OOP.

As such, the key to the success of DDD is to properly and deeply understand the business domain first, and then to accurately model its concepts within the software. This requires close collaboration between developers and domain experts.

The domain model is selective about which business concepts it encapsulates, and shouldn't include every single concept of the business -- only the concepts that are relevant to the particular business problems that the software is designed to solve.

## Building blocks

### Ubiquitous language

A ubiquitous language is a vocabulary that is used by the domain experts and adopted by the software developers and everyone else on the project. This shared language makes communication easier and enhances understanding of the domain.

The ubiquitous language is also used within the code, such that the domain concepts are more explicit within the code and the software is easier to understand within the context of the domain.

A ubiquitous language is ubiquitous in that it's used by everyone involved in the project, from domain experts to developers. However, it's not used ubiquitously across every subdomain within the business. Instead, each subdomain typically has its own specialised language, which only applies within the context of that subdomain.

For example, a retail business might have a catalogue department, a warehousing department, a sales department, a payment processing department, etc. Each of these departments are different subdomains within the business, and likely used different terms to refer to the same underlying concepts. The payment processing department might refer to a "transaction", while the sales department refer to an "order". The catalogue and warehousing departments might both have the concept of "product", but have very different views of what a "product" is, what data it consists of and how it functions.

As such, there are many "ubiquitous" languages within any domain, each bounded by a particular context.

### Bounded contexts

A bounded context is simply an explicit, artificial boundary in the code around a particular subdomain.

They're simply a way of breaking down a large problem (the entire business domain or problem space) into a number of smaller problems (subdomains) *within the code*.

Ideally, each bounded context aligns perfectly with the subdomains of the business. As such, the key to defining bounded contexts is really to define the different subdomains within the business.

However, if the business reorganises itself into different subdomains, any existing bounded contexts built around the previous subdomains will become out of sync. That is, bounded contexts are not the subdomains themselves -- they are the implementations of the subdomains as distinct software artifacts.

In practice, bounded contexts can be implemented in a number of ways, as long as it's easy for a develop to know which context they're in. For example, they might be defined as different folders, projects, repositories, or database schema.

Since each bounded context uses the ubiquitous language of its corresponding subdomain, the domain concepts and the domain model within that bounded context only make sense inside it, and are not shared with other bounded contexts.

As such, each bounded context defines its own model and owns its own data (i.e., it has its own database or database schema). If a bounded context needs data from another bounded context for some operation, it shouldn’t reach out to the other context on the fly; instead, it should keep its own copy of any data that it needs. In other words, while each piece of data in the system is owned primarily by one particular bounded context, any other bounded contexts that need access to that data should keep a cached version of it.

This means that the cached data in some bounded contexts will at some point be momentarily stale, before it’s refreshed. This can seem like a problem, but it’s important to recognise that the end user is always working with potentially stale data anyway — the data they see on screen is a cached copy of the data in the database, which might have already changed since the page was loaded. If a product price changes before the customer completes their purchase but after they’ve landed on the checkout screen, then they’ll be looking at stale data and might be unexpectedly charged with the new price.

For example, customer information such as name and address will likely be owned a customer management bounded context, because it’s here where the data will be modified. However, shipping might need access to this data too. As such, it should keep its own copy of each customer’s address, rather than calling into the customer management context each time it needs it.

Asynchronous communication is preferred to synchronise data between different bounded contexts. This implies eventual consistency, which both the business and the end user must fully embrace.

### Entities

Entities are objects that represent nouns in the domain model and have an identity. Their identity is what defines them as separate from other entities of the same type. That is, two entities may at any point in time contain the same data, but they're still distinct entities because of their different identities. Furthermore, the same entity can change its state over time, but it remains the same distinct entity because its identity remains the same.

For example, in an e-commerce application, the entities might include an `Order` and a `Product`.

### Value objects

Value objects are also objects that represent nouns in the domain model. However, they don't have distinct identities and are instead defined by their data.

For example, a `Money` object might be defined by it's `Amount` and `Currency` properties; two `Money` objects with the same properties are therefore equal, because they represent the same value.

The purpose of value objects is to represent values within the domain model more explicitly and to imbue those values with domain concepts and with greater semantics than primitive values would.

Unlike primitive values, as objects they can also have functionality built in and can therefore be used to enforce business rules via encapsulation.

### Aggregates

Aggregates are groupings of entities and value objects within the domain model. They help the break the domain model down into small subgroups and therefore make it easier to understand.

Each aggregate defines a consistency boundary and is responsible for maintaining its own invariants and enforcing its own business rules. As such, aggregates must always be loaded in full.

Each aggregate has one entity that is defined as the aggregate root. This entity controls all access to the aggregate, such that all operation must go through it. This design constraint makes it easier to maintain all the invariants related to that aggregate by providing a unified interface to all operations on it.

In general, aggregates should be small because

* large aggregates can lead to performance issues, since they must always be loaded in full, and therefore every update to an aggregate, even just to a single property, requires loading a lot of data unnecessarily
* large aggregates lead to a complicates web of inter-related objects with no clear boundaries between them; decomposing the domain model into smaller groups simplifies the model and makes it easier to understand.

To choose aggregates, Vaughn Vernon recommends following the following steps.

1. Start with the smallest possible aggregates where each aggregate consists only the aggregate root and any value objects, but no other entities.
1. Encapsulate any entities together into the same aggregate if they must be updated together and those updates must be *immediately consistent*. For example, in a scrum project management domain, if marking a `Task` as completed necessarily means that the corresponding `BacklogItem` must also be *immediately* marked as completed (given that all other related tasks have also been completed), then the `Task` and the `BacklogItem` should become part of the same aggregate.
1. If updates to two different entities are independent or can be eventually consistent, then they should be separate aggregates and any synchronisation should be facilitated by domain events.

### Domain services

Domain services are stateless services that contain business logic. They are used to enforce business rules that span across multiple aggregates and don't naturally belong to any particular aggregate.

## How to model the domain correctly

The key to properly modelling the domain within the code is to understand the domain itself as deeply as possible, and to let the ubiquitous language guide the actual coding constructs (classes, interfaces, etc) and behaviours that you capture in the software.

You should also think first about the *behaviours* within the domain model rather than thinking immediately about the data; think about business capabilities and how the domain concepts interact with each other at a high level, and only then think at a lower level about the data that you'll need to capture in order to facilitate those behaviours.

Additionally, you should consider the UI and its actual use cases when modelling the domain; you don't want to model every operation in the business, but only those processes that the application is actually being built for. Bear in mind that the domain model is a means to an end, where the end goal is a useful and functional application, rather than the domain model itself.

## Resources

* https://youtu.be/W2OobtTQo9Y?si=GJ_2rEKUi_O3otFs
* https://youtu.be/\_zWMjMUHinc?si=O7X11u1hJsnfPv5O
* https://youtu.be/pMuiVlnGqjk?si=wS8wLDJ1gANpj-wc
