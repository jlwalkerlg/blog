---
title: "Why Use MediatR?"
date: "2024-02-07T21:03:35Z"
categories:
  - Software Development
tags:
  - software architecture
  - the clean architecture
---

Why should I use MediatR to process web requests?

> _Because it's an out-of-the-box implementation of the command dispatcher pattern that helps you to extract logic out of your controllers._

And why should I extract logic out of my controllers?

> _Because it allows your controllers to focus on HTTP requests/responses, and untangles your logic from those concerns._

That sounds a lot like the single responsibility principle.

> _It is!_

Ok, keep going...

> _Well, by untying your core application logic from any particular delivery mechanism, it allows the application to be driven any delivery mechanism._

What's a delivery mechanism?

> _It's the mechanism by which the application receives input and returns output. On the web, that mechanism consists of HTTP requests/responses._

And which other delivery mechanisms might I want to drive my application with?

> _The console, a desktop GUI, a test suite..._

A test suite also counts as a delivery mechanism?

> _Of course!_

And by decoupling my core application logic from any particular delivery mechanism, I imagine that I can more easily unit test my core application logic by driving the application with unit tests.

> _Exactly!_

Ok, ok. But couldn't I achieve the same decoupling by just calling application services directly from my controllers without using the command dispatcher pattern?

> _Yes._

So why do I need the command dispatcher pattern?

> _You don't, but it does provide some benefits that you don't get by just calling services directly._

Like what?

> _Well, it allows you to more easily implement cross-cutting behaviours using the chain of responsibility pattern._

Like authorisation and exception handling?

> _Exactly._

And is the chain of responsibility pattern kind of like middleware?

> _Kind of._

So why don't I just use the middleware functionality provided by my web framework?

> _Because that middleware will only run when the web is the delivery mechanism._

So it won't run and therefore won't be tested when my tests drive the application.

> _Exactly!_

So the middleware provided by my web framework is redundant/useless?

> _No, you can use it for cross-cutting concerns related specifically to the web._

Ah, I see. So is there any other reason to use the command dispatcher pattern?

> _Well, it also encourages us to represent our application's use-cases explicitly as strongly-types classes, which is more expressive and makes our application more clearly scream its architecture._

Good point.

> _It also encourages us to have one handler per command, rather than one handler per many commands._

Another application of the single responsibility principle.

> _Exactly!!_

Ok, ok. So are there any downsides to using MediatR or the command dispatcher pattern?

> _Well, it does introduce some indirection in that your command handlers aren't being called explicitly from your controllers. But I think the damage is minimal, and the pros heavily outweigh the cons._

Yep, me too. Where do I sign up?
