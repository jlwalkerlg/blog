---
title: Why use the BFF pattern?
date: 2024-06-23T20:19:00+01:00
categories:
- Software Development
tags:
- software-architecture
---

Different frontend apps often have very different requirements. For example, the functionality available to a mobile app user is often very different to the functionality available to a desktop web UI user; the mobile app will typically display less data on the screen than a desktop web UI, and may provide functionality only available to mobile devices, such as the ability to scan barcodes and do price comparisons in store.

In the backend for frontend (BFF) pattern, you create a separate backend API for each frontend, where each backend is tailored to the specific requirements of the client, rather than having a single backend that serves them all.

For example, if you have a desktop web UI and a mobile app, you'd have 2 backend APIs -- one for each app. If the requirements of the Android app were different from those of the iOS app, you'd have 3 backends -- one for the desktop web UI, one for Android, and one for iOS.

This allows each backend to return only the data needed by each frontend, and only expose the required functionality.

In this model, the backend is basically an extension of the frontend, and each app is made up of a backend-frontend pair.

You might choose to use the BFF pattern

* to avoid under-fetching and over-fetching on the frontend. When you have a single backend servicing many different frontends, these issues are common, because each frontend requires a different amount of data. With the BFF pattern, each backend returns the exact data needed by the frontend for each screen.
* to reduce the surface area and responsibilities of each API and therefore make them cleaner and easier to maintain. This is a version of the single responsibility principle.
* to decouple each app by avoiding sharing a single unified code base on the backend across each app. This allows each app to develop and be developed independently by separate teams.

You might choose not to use the BFF pattern

* if your frontend clients are not so different in their requirements, such that the benefits are minimal and are outweighed by the overhead required to maintain many different backends.
