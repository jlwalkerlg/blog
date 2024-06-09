---
title: Vertical Slice Architecture vs The Clean Architecture
date: 2024-06-09T08:31:00+01:00
categories:
- Software Development
tags:
- the-clean-architecture
- vertical-slice-architecture
---

Some of the problems with The Clean Architecture are

* low cohesion between closely-related code. Each use case is often split across multiple projects/directories that represent the different layers of The Clean Architecture, making it a pain to work with. This is not strictly necessary with The Clean Architecture, and you *can* collapse all projects into one and group by feature, as in Vertical Slice Architecture, but it's prescriptive nature seems to encourage physical separation as well as just logical separation of layers.
* premature optimisation in the form of unnecessary abstractions and indirection. Rather than allowing you to decide per use case where and when to create abstractions, it prescribes them out of the gate, even if [the benefits of creating abstractions](When%20to%20create%20abstractions.md) are not so apparent. For example, many frameworks these days support testing as a priority and offer in-memory implementations so that you can run your unit tests without spinning up a real web server or database.

In response, Vertical Slice Architecture prioritises cohesion over coupling and encourages you to

* group by feature. All related code for each specific use case should be group into a single feature folder, such that it's easy to find and work with without jumping between many different folders.
* [only create abstractions when they become necessary](When%20to%20create%20abstractions.md).

In summary, ***organise your code vertically first, and then horizontally within each vertical slice as necessary**.*
