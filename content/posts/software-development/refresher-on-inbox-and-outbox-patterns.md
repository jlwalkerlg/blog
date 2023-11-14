---
title: "Refresher on Inbox and Outbox Patterns"
date: "2021-10-06T13:40:00Z"
categories:
  - Software Development
tags:
  - event driven architecture
  - software architecture
  - messaging
  - microservices
---

## The Outbox Pattern

Purpose: avoid the need for distributed transactions when a single workflow involves both in-process and out-of-process transactions.

For example, a request to a web application might trigger some changes to the database, as well as send an email. If the database was updated but the email failed to send, or if the email sent but the database changes failed to commit, then there’s an inconsistency.

With the outbox pattern, you write integration messages to the same database you write your business data to, using the same transaction. These messages then get processed by a background worker, which publishes them to a message broker. The message broker then dispatches them to any interested consumers, which can perform the necessary work.

If the database transaction fails, neither the message nor the changes to the business data will be saved, and so there’s no inconsistency.

If there are any failures around publishing or consuming the messages, there can be retry policies in places and as a last resort somewhere to store failed messages that can be manually audited. In any case, the message is not lost.

## The Inbox Pattern

Purpose: handle incoming messages from a message bus idempotently.

Message buses might send the same message more than once if they didn’t receive an acknowledgement that the message was received, or if the message was sent to the bus more than once. Therefore we need to make sure that our consumers that update our business data are idempotent.

To do so, we need to keep track of which messages we’ve already handled, such that when we update our business data upon consuming a message, we also record the message as having being handled successfully within the same transaction.

There are 2 approaches for doing this.

The first approach is for the message handlers to consume the messages directly from the message bus, update any business data and save the message to the inbox in the same transaction, then send an acknowledgement to the bus that the message was handled successfully. If the acknowledgement fails, the bus will send the message again, so before handling it we first check if it already exists in the database and only process it if it doesn’t.

The second approach is to have a single consumer/worker consuming messages from the bus, immediately saving them to the inbox and sending an acknowledgement to the bus when each message has been captured. Then, a background worker processes each new message in the inbox and dispatches them to the appropriate handlers. The handlers update the business data and mark the message as having been handled in the same transaction.

The first approach has the advantage that the message bus is responsible for dispatching each message to the appropriate handler, and so we therefore off-load this work and leverage the scalability of a production-grade messaging bus without having to write our own dispatching system. However, in order to accomodate multiple consumers to many different messages, we have to set up the bus to use topics and subscriptions, which is usually more expensive.

With the second approach, we only need a single queue to send and receive messages.
