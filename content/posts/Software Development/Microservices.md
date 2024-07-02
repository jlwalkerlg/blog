---
title: Microservices
date: 2024-07-02T09:53:00+01:00
categories:
- Software Development
tags:
- microservices
---

## Introduction

Microservices are small autonomous services that work together, modelled around a business (sub)domain.

Like bounded contexts of DDD, they are a way to break down a large business domain into a number of smaller autonomous subdomains that work together.

They difference is that microservices are by definition independently deployable, whereas bounded contexts by themselves don't impose any rules around deployment.

This principle of independently deployable services makes microservices more autonomous, which is really the main idea around microservices.

Making microservices autonomous means that

* the teams building them are also more autonomous and therefore more productive, since they don't have to coordinate deployments or new features, and have fewer merge conflicts since they're working with separate code bases
* the system as a whole is more robust and available, because failures to one service don't necessarily impact other services
* each microservice can be built with whichever technology stack is most suitable for its functionality.

Deploying each microservice as a separate host also means that

* each microservice can be scaled independently
* the system as a whole is more robust and available, because failures to one host don't necessarily impact other hosts.

Microservices are modelled around business subdomains (bounded contexts) because it makes them more cohesive with the business functionality. This makes their APIs more stable because it increases the likelihood that the only have a single reason to change: a change in the business rules pertaining to that subdomain. On the contrary, if a subdomain's functionality is spread across multiple microservices, then any change within that subdomain's business rules will require changes to many different microservices, requiring coordination between different teams and therefore making them less autonomous.

As such, there is often a 1-to-1 relationship between microservices and bounded contexts, but a single bounded context might also be split into multiple microservices to take advantage of some other benefit of microservices, like independent scalability of different functionality within the same subdomain. However, a single microservice should never correspond to multiple bounded contexts.

Modelling microservices around business subdomains also means that

* each team becomes an expert in their microservice's subdomain, which therefore increases each team's understanding of a particular business aspect and in turn leads to better software
* the system and the teams building it are more closely aligned with the business itself (Conway's Law).

Like bounded contexts, for microservices to be isolated, autonomous, and decoupled from other microservices, they should own their own data; if a microservice needs data from another, it should keep its own cached copy of the data it needs and use asynchronous communication (a message bus) to synchronise that data. As such, microservices imply eventual consistency, which both the business and the end user must fully embrace.

## Principles of microservices

Sam Newman defines 8 principles of microservices.

### Modelled around a business domain

As described above, this makes

* their APIs more stable
* each team become domain experts in their subdomain
* the system and the teams building it more closely aligned with the business itself (Conway's Law).

### Culture of automation

Because there are now more things to deploy, the effort required to do so manually is much greater.

As such, automating things as much as possible saves a lot of time and effort, and makes things (deployments) less error prone.

### Hide implementation details

This decouples the microservices and therefore makes them more autonomous.

### Decentralise all the things

Decision making, architectural design concepts, and technology choices should all be made per microservice. This allows each team to make the most appropriate choice for their microservice's domain and functionality.

### Deploy independently

As described above, this

* makes each team more autonomous
* allows each microservice to be scaled independently
* makes the system as a whole more robust to failures.

### Consumer first

Microservices are built to service their consumers, and should be built with their consumers in mind, such that they're actually useful.

### Isolate failure

Decouple microservices as much as possible to make the system as a whole is more robust and available, such that failures to one particular microservice don't cascade to other microservices.

### Highly observable

Since workflows are now distributed among different machines and are often asynchronous, logging and traceability of requests across multiple microservices becomes extra important for debugging and monitoring.

This typically means associating each request with a unique correlation ID, which gets passed along between each microservice, allowing a single workflow to be traced through the whole system.

Centralising logs and other metrics also helps monitoring the system as a whole, as opposed to monitoring each service independently.

## Migrating to microservices from a monolith

First, define the microservices that you'd like to move towards by modelling them around bounded contexts.

Then, start to map out and piece apart the different modules within the monolith, which may involve some refactoring to make the modules more apparent.

Next, choose one module to tackle first. This should be something relatively simple to migrate but still beneficial such that it gives a "quick win" and gets the ball rolling. It also means we have something in production that we can use to learn from and prove the suitability of our cloud infrastructure.

As such, choose a module that is relatively isolated from the other modules and has relatively low coupling to tackle first.

Then, keep extracting different modules out of the monolith until you achieve the desired microservices architecture.

### Strangler fig pattern

The strangler fig pattern is a technique for extracting modules out of a monolith and into their own microservices.

1. Put a HTTP proxy in front of all incoming requests to the monolith
1. Identify an existing module within the monolith that you want to move into a microservice
1. Rebuild the module as a microservice
1. Divert the relevant requests from the HTTP proxy to the new microservice instead of to the monolith
1. Remove the module from the monolith

This pattern allows the monolith to be decomposed into microservices module-by-module, rather than all at once. As such, if project funding is pulled before the full migration is complete, there is still some value in that the monolith has been reduced in size. This is opposed to a "big bang" migration, where if project funding is pulled mid-way through the migration, the time and effort spent thus far is lost.

### Branch by abstraction

The branch by abstraction pattern is similar to the strangler fig pattern but uses code-level interfaces and dependency inversion rather than a HTTP proxy.

1. Identify an existing module within the monolith that you want to move into a microservice
1. Put an interface in front of the module and use dependency inversion to decouple other modules from it
1. Rebuild the module as a microservice
1. Swap the implementation of the interface (using a feature flag) for a new implementation that calls the new microservice
1. Remove the module from the monolith

Like the strangler fig pattern, the branch by abstraction pattern also allows the monolith the be migrated to microservices module-by-module.

Further, it allows your new interface implementation to call both the existing module (in the monolith) and the new microservice at the same time. This can be useful to compare results and make sure the microservice is functioning the same as the existing module before completing the migration. However, this only works for idempotent requests, so is especially useful for queries.
