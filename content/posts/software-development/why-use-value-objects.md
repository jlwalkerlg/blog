---
title: "Why use value objects?"
date: "2024-06-02T05:40:22+01:00"
categories:
  - Software Development
tags:
  - domain-driven-design
---

A value object is an immutable object that encapsulates one or more primitive data types and represents a single value. Unlike entities, value objects have no conceptual identity. Instead, the equality of a value object is based on the value that it represents; two value objects of the same type are equal if they hold the same data.

You might choose to use value objects in order to

- encapsulate and re-use business rules, especially business rules related only to the encapsulated values (e.g., that a username can't be less than 3 characters long)
- encapsulate and re-use behaviours related to the encapsulated values
- use type safety to avoid mixing up different primitive values, for example by

  - comparing the wrong values

    ```csharp
    interface IUserRepository
    {
        User GetUser(string userId, string tenantId);
    }

    var user = _userRepository.GetUser(tenantId, userId);
    ```

  - passing values as arguments in the wrong order.

    ```csharp
    var usersInTenancy = users.Where(user => user.Id == tenantId);
    ```

  It's especially common to use value objects to encapsulate entity identifiers for this reason.

  ```csharp
  public record UserId(string Value);
  ```
