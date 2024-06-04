---
title: "Topics and Subscriptions vs Queues"
date: "2021-10-06T13:52:00Z"
categories:
  - Software Development
tags:
  - event-driven-architecture
  - software-architecture
  - messaging
  - microservices
---

Each queue sends each message it contains to a single consumer. So, if you have multiple consumers interested in the same message, only one of them will receive it (unless you have some manual dispatching mechanism in place).

Each topic, however, sends each message it contains to every subscription that is subscribed to it. A subscription is a virtual queue. Therefore, any given message in the topic will first be sent to every subscription subscribed to the topic, and from there will be sent by each subscription to just one consumer listening to that subscription.

If you have messages that each need to be delivered to multiple consumers, you therefore have 2 potential approaches.

The first is to send each message to a separate topic, and for any given message, create a subscription for all interested consumers of that message.

The second is to send and receive all messages to the same queue, and have some manual mechanism in place that consumes each message from the queue and dispatches them to each interested consumer.
