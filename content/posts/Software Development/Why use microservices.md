---
title: Why use microservices?
date: 2024-07-02T13:09:00
categories:
- Software Development
tags:
- domain-driven-design
- microservices
---

Microservices are small autonomous services that work together, modelled around a business (sub)domain.

In a microservices architecture, the software is split into multiple microservices that are each responsible for a unit of business functionality and that work together to form the system as a whole.

Each microservice is autonomous, meaning that it can be developed and deployed independent of other microservices, even though the system as a whole isn't fully operational without all of the microservices working together.

You might choose to use microservices

* to break down a complicated system into multiple smaller systems that are easier to understand and develop in isolation. This is analogous to the way that bounded contexts break down complex business domains into multiple subdomains and model each subdomain in isolation.
* to organise a large software team naturally around concrete business domains, increasing cohesion within each team and making them domain experts in their particular subdomain, therefore increasing understanding of the business and leading to better software
* to give each team more autonomy by giving them each an isolated slice of the system to work on. This increases their productivity since they have fewer merge conflicts and also increases deployment velocity because less coordination is required between teams for each deployment.
* to make the system as a whole more robust to failures and therefore more available, since failures in one microservices don't cascade to others and bring the whole system down
* to allow the functionality pertaining to different aspects of the business to use a technology stack that is optimised to its needs
* to allow the functionality pertaining to different aspects of the business to be scaled independently

You might choose not to use microservices

* if you have a relatively small business domain that is not sufficiently complex to warrant breaking it down into smaller parts
* if you have a relatively small development team that wouldn't gain much in terms of productivity by breaking it down into smaller teams organised around separate microservices.
