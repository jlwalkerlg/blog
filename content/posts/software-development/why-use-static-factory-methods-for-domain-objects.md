---
title: "Why use static factory methods for domain objects?"
date: "2024-06-02T06:24:50+01:00"
categories:
  - Software Development
tags:
  - domain-driven-design
---

The most obvious way to instantiate a new domain object is to call its constructor. However, many developers prefer to make the constructor private and instead use a public static factory method.

You might choose to do this in order to

- execute side effects, like raising a domain event.

  ```csharp
  public class User : Entity<UserId>
  {
      private User(UserId id, UserName name) : base(id)
      {
          Name = name;
      }

      public UserName Name { get; }

      public static User Create(UserName name)
      {
          var user = new(UserId.Create(), name);
          user.Raise(new UserCreatedEvent(user.Id));
          return user;
      }
  }
  ```

  This could be done in the constructor, but it might not feel right. Furthermore, the constructor could be called by deserialisers or the ORM when loading it from the database, in which case you wouldn't want to raise the same events.

- return a value other than the new object, such as a `Result` class

  ```csharp
  public class User : Entity<UserId>
  {
      private User(UserId id, UserName name) : base(id)
      {
          Name = name;
      }

      public UserName Name { get; }

      public static Result<User> Create(UserName name)
      {
          if (name.Value is "admin")
          {
              return Result.Error("That name is forbidden");
          }

          var user = new(UserId.Create(), name);
          return Result.Ok(user);
      }
  }
  ```

- accept services as arguments.

  ```csharp
  public class User : Entity<UserId>
  {
      private User(UserId id, UserName name, DateTimeOffset createdAt) : base(id)
      {
          Name = name;
          CreatedAt = createdAt;
      }

      public UserName Name { get; }
      public DateTimeOffset CreatedAt { get; }

      public static User Create(UserName name, IClock clock)
      {
          var createdAt = clock.GetCurrentUtcTime();
          return new(UserId.Create(), name, createdAt);
      }
  }
  ```

  This could be done by injecting the services into the constructor, but it might not feel right.

- use async code

  ```csharp
  public class User : Entity<UserId>
  {
      private User(UserId id, UserName name, DateTimeOffset createdAt) : base(id)
      {
          Name = name;
          CreatedAt = createdAt;
      }

      public UserName Name { get; }
      public DateTimeOffset CreatedAt { get; }

      public static async Task<User> Create(UserName name, IClock clock)
      {
          var createdAt = await clock.GetCurrentUtcTime();
          return new(UserId.Create(), name, createdAt);
      }
  }
  ```

- calculate values to pass to a base constructor

  ```csharp
  public class User : Entity<UserId>
  {
      private User(UserId id, UserName name, string value1, string value2) : base(id, value1, value2)
      {
          Name = name;
      }

      public UserName Name { get; }

      public static User Create(UserName name)
      {
          var value1 = Hash.Create(name.Value);
          var value2 = value1.GetMethod();
          var user = new(UserId.Create(), name, value1, value2);
          return user;
      }
  }
  ```
