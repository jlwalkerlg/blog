---
title: "The Outbox Pattern"
date: "2021-06-08T15:21:00Z"
categories:
  - Software Development
tags:
  - event driven architecture
  - software architecture
  - messaging
  - microservices
---

## The Problem

When publishing messages to a message broker, it’s important to recognise that this publishing falls outside the scope of any database transaction you might have started as part of your business logic. As such, if publishing the message fails, or the database transaction fails to commit, your application can end up in an inconsistent state.

For example, when an order is placed in an e-commerce application, the relevant command handler might first update the database and then publish an event to the message broker to notify other micro-services. In this case, if the message broker is down, or the message fails to publish for whatever reason, the order will be placed but the message will be lost, downstream systems won’t be notified, and so the micro-service responsible for payment processing won’t take payment for the order.

1. Start database transaction
1. Update domain model in database
1. Commit database transaction
1. ~~Publish event~~

TODO
