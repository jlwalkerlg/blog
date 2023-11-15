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

When publishing messages to a message broker, it's important to recognise that this publishing falls outside the scope of any database transaction you might have started as part of your business logic. As such, if publishing the message fails, or the database transaction fails to commit, your application can end up in an inconsistent state.

For example, when an order is placed in an e-commerce application, the relevant command handler might first update the database and then publish an event to the message broker to notify other micro-services. In this case, if the message broker is down, or the message fails to publish for whatever reason, the order will be placed but the message will be lost, downstream systems won't be notified, and so the micro-service responsible for payment processing won't take payment for the order.

1. Start database transaction
1. Update domain model in database
1. Commit database transaction
1. ~~Publish event~~

![Failure while publishing an event after updating/inserting the database. Credit: https://dzone.com/articles/implementing-the-outbox-pattern.](https://miro.medium.com/max/2495/0*5KrUy7ivGHtws5gQ)

Alternatively, depending on the order of events, the message might be successfully published, and thus payment might eventually be taken from the customer, but the database transaction might subsequently fail and so the order might never actually get placed.

1. Start database transaction
1. Update domain model in database
1. Publish event
1. ~~Commit the database transaction~~

The bottom line is that publishing the message and committing the database transaction can't be done atomically. Even two-phase commit doesn't guarantee atomicity, not to mention the burden of implementing it.

## The Solution

The solution is to save the message(s) in the database as part of the same transaction, and have a background worker poll the database "outbox" for unpublished messages in some background thread/process, publishing them one at a time. After each message is published, the background worker should mark them as such in the database, or simply remove them from the outbox. This guarantees that database writes and messages are saved together, atomically, in the same transaction. If the message broker is down, or some other transient failure prevents the messages from being published, they are not lost, but are stored safely in the database until the transient failure is fixed and they can be published again, or at worst, some manual recovery process can diagnose and fix the issue.

1. Start database transaction
1. Update domain model in database
1. Store message(s) in the database (e.g. in an "outbox" table)
1. Commit database transaction
1. Poll database outbox for unpublished messages and publish
1. Mark published messages as published

![Two separate transactions using the outbox pattern. Credit: https://dzone.com/articles/implementing-the-outbox-pattern.](https://miro.medium.com/max/3141/0*Mf2rS-hSbnK47u7M)

## Idempotency

What happens if the background worker successfully publishes the message but fails to mark it as published in the database? The next time the background worker polls the database, the message would appear unpublished, and so the worker would publish it again.

As such, the outbox pattern is designed to guarantee at-least-once delivery. Therefore, it is important to design your consumers such that they are idempotent. That is, it is important to write them such that they can safely handle the same message more than once.

For example, a consumer that handles `OrderConfirmed` events might check if the relevant order in the database has already been confirmed (e.g. via a boolean flag) and only execute the appropriate business logic if not.

## Resources

- [The Outbox Pattern – Kamil Grzybek](http://www.kamilgrzybek.com/design/the-outbox-pattern/)
- [Six Little Lines of Fail – Jimmy Bogard](https://youtu.be/VvUdvte1V3s)
- [Reliably Save State & Publish Events (Outbox Pattern) – CodeOpinion](https://youtu.be/u8fOnxAxKHk)
- [Handling Duplicate Messages (Idempotent Consumers) – CodeOpinion](https://youtu.be/xeBY8fCWfvU)
