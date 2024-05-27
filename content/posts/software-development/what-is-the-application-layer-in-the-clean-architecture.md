---
title: "What Is The Application Layer in The Clean Architecture?"
date: "2024-05-27T09:38:26+01:00"
categories:
  - Software Development
tags:
  - software architecture
  - the clean architecture
---

The application layer _is_ your application. That is, it doesn't matter whether your application is invoked via an API, a CLI, a Razor page, an RPC endpoint: the functionality stays the same. If you have an existing API and you decide to also expose the application and its functionality as a CLI, then your application is still the same application as before, except now there's just another way to access it. The application itself is oblivious as to how it's accessed, and how it's accessed doesn't affect its design or shape its use cases.

The application exposes different ports through which you can send it some input and make it do something. These inputs are necessarily taken from you by the delivery mechanism you used to access the application, and provided to the application in the format it expects. If you use a CLI, then your input is read from the console as a string, and the individual bits of data that make up the request get extracted out of the string and passed to the application in the format it defines. The data might get passed to the application as separate arguments to a method call, or packed into a request model DTO and passed to the application that way. It's up to the application to define how it wants to be invoked.

If you're only ever likely to have 1 delivery mechanism, then it might be worth considering whether its really worth separating the delivery mechanism from your application, because of the indirection it introduces. Besides being able to deliver your application via different mechanisms, you might also consider doing this in order to

- keep your application logic cleaner and more readable. This might be more or less of an issue depending on how easy your framework of choice makes it to extract data out of the delivery mechanism.
- make it easier to test your application logic. This can also be more or less of an issue depending on how easy it is to run your tests through the delivery mechanism, as opposed to driving your application with your tests directly.
