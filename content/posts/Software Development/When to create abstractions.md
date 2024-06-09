---
title: When to create abstractions
date: 2024-06-09T07:58:00+01:00
categories:
- Software Development
---

Are abstractions a form of premature optimisation?

You should only create abstractions as and when needed. This might be in order to

* aid testing
* swap implementations
* reuse code
* separate concerns.

Introducing abstractions before any of these become a problem is *premature optimisation* and is just adding indirection without any *actual* value (only *potential* value).

Of course, if you know ahead of time that you’ll need to swap implementations, then it’s not premature to create the necessary abstractions up front.

TDD *may* dictate that you create some abstractions right from the start, but it also might not -- only introduce abstractions as necessary.

So what about the open-closed principle? Shouldn’t you always create abstractions to keep your modules open for modification?

The open-closed principle is only valuable where you *know* you’ll need to keep the module open for modification — otherwise, it’s premature optimisation.
