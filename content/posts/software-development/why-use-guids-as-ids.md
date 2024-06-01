---
title: "Why use GUIDs as IDs?"
date: "2024-05-30T15:44:43+01:00"
categories:
  - Software Development
tags:
  - domain driven design
---

It's common practice for developers to use integers as entity IDs, where the integers are primary keys within a database that get generated and auto-incremented on insert. As such, entities have no ID when they're first created until they've been saved to the database and the last inserted ID is subsequently attached to the entity.

Another option is to use GUIDs (or UUIDs) as entity IDs, which can be generated from within the application before any changes are written to the database. That way, each entity has an ID from the moment it's created, even before it's persisted to a database.

You might choose to do this so that

- you don't have nullable ID properties in your domain model, which then require null checks whenever you access the entity's ID.
- you can use the ID _before_ the entity is saved to the database, for example to pass it to another entity as an identity reference (foreign key), or to implement [the outbox pattern]({{% siteurl "/posts/software-development/the-outbox-pattern" %}}).
- you don't need a database at all -- you can use some other storage mechanism to persist the domain model, and for unit tests you can run your code completely in memory.
