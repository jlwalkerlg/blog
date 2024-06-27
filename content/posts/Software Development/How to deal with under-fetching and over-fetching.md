---
title: How to deal with under-fetching and over-fetching
date: 2024-06-24T12:30:00+01:00
categories:
- Software Development
tags:
- software-architecture
---

It's typical when working with SPAs to run into issues with under-fetching and over-fetching, because the backend API doesn't return data specifically tailored for the client. As such, the client either receives more data from the API than it needs, or not enough, in which case it has to make additional requests and round-trips in order to get all the required data.

This can lead to performance and bandwidth issues, especially on mobile devices where bandwidth is limited.

There are 2 common ways to deal with these issues.

## GraphQL

GraphQL is a protocol that acts as a query language whereby the client can request the exact data it needs.

The backend exposes a schema, which the client can query dynamically. The response depends on which query is sent by the client.

## The BFF pattern

With [the BFF pattern](Why%20use%20the%20BFF%20pattern.md), the responses from the backend are tailored to the exact needs of the client.

Therefore if you have multiple clients, you also need multiple BFFs.

If you only have a single client and you own the API that it uses, then that API should essentially be a BFF which just returns view models as responses, where each view model contains all the data necessary for each screen, but no more. This means you'd likely have (at least) one GET endpoint per screen, just as you would in a server-rendered application.
