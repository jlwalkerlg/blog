---
title: Why use the API gateway pattern?
date: 2024-06-23T20:19:00+01:00
categories:
- Software Development
tags:
- software-architecture
---

When a frontend app needs data from many different microservices

* it can become bloated because it needs to do data aggregation, error handling, and service location across many different service
* it can harm performance because it often needs to send many different requests per screen
* it can use more bandwidth because of the number of requests being sent and issues with under-fetching and over-fetching. This is particularly problematic on mobile.
* each microservice needs to implement cross-cutting concerns like authorisation, SSL termination, and caching itself.

With the API gateway pattern, the frontend calls a single API which takes care of locating and calling all the necessary microservices, then aggregating the data into a response format suitable for the frontend.

The API gateway can also take some responsibilities away from the backend microservices, such as

* authentication and authorisation
* SSL termination
* response caching
* rate limiting and throttling
* IP whitelisting.

The API gateway is basically a facade that provides a simplified interface to different microservice APIs.

You might choose to use the API gateway pattern

* to simplify the frontend by moving the responsibility of data aggregation and service location out into the API gateway. This is an application of the separation of concerns.
* to avoid under-fetching and over-fetching, since the API gateway can be made to return only the exact data needed by the frontend for each screen. If you have more than one frontend, you can even have a separate API gateway per frontend -- [the BFF pattern](Why%20use%20the%20BFF%20pattern.md).
* to implement cross-cutting concerns on the backend in one central location, rather than separately in each microservice.

You might choose not to use the API gateway pattern

* if your frontend doesn't aggregate data across enough microservices to warrant an API gateway.
