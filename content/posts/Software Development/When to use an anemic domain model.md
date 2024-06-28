---
title: When to use an anemic domain model
date: 2024-06-28T10:30:00+01:00
categories:
- Software Development
tags:
- domain-driven-design
---

An anemic domain model is a model wherein the objects are simple data types with no behaviour in them except for getters and setters, as opposed to a rich domain model wherein the objects combine data and process together through encapsulation, as per OOP.

As such, if you're doing OOP, you don't really have a choice of whether or not you use an anemic domain model: rather, it's either forced upon you via a lack of behaviour in the domain, or it's not.
