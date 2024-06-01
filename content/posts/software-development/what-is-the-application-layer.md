---
title: "What is the application layer?"
date: "2024-05-27T09:38:26+01:00"
categories:
  - Software Development
tags:
  - the clean architecture
---

The application layer _is_ your application. That is, it doesn't matter whether your application is invoked via a web controller, a CLI command, a Razor page, or an RPC endpoint: the functionality stays the same. If you have an existing API and you decide to also expose the application and its functionality as a CLI, then your application is still the same application as before, except now there's just another way to access it. The application itself is oblivious as to how it's accessed, and how it's accessed doesn't affect its design or shape its use cases.

The application exposes different ports through which you can send it some input and make it do something. These inputs are necessarily extracted from the request by whichever delivery mechanism was used to access the application, and provided to the application in the format it expects. If you use a CLI, input is read from the console as a string, and the individual bits of data that make up the request get extracted out of the string and passed to the application in the format it defines. The data might get passed to the application as separate arguments to a method call, or packed into a request model DTO and passed to the application that way -- it's up to the application to define how it wants to be invoked.

If you're only ever likely to have one delivery mechanism, then it might be worth considering whether it's really worth separating your application from it.

You might choose to separate your application from the delivery mechanism in order to

- deliver your application via different mechanisms
- keep your application logic cleaner and more readable. This might be more or less of an issue depending on how easy your framework of choice makes it to extract data out of the delivery mechanism.
- make it easier to test your application logic. This can also be more or less of an issue depending on how easy it is to run your tests through the delivery mechanism, as opposed to driving your application with your tests directly.

You might choose not to separate your application from the delivery mechanism because of

- the extra layer of indirection it introduces.
