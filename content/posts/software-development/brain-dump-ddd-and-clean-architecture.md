---
title: "Brain Dump: DDD and Clean Architecture"
date: "2023-11-11T14:02:00Z"
categories:
  - Software Development
tags:
  - domain driven design
  - software architecture
  - the clean architecture
ShowToc: true
---

## Use domain services for business logic spanning multiple aggregates

Aggregates are self-contained, consistency boundaries that are enforce the business rules related only to themselves.

But invariably there are business rules that span across multiple aggregates, such that no single aggregate can enforce the relevant business rules alone.

One option to deal with this kind of business logic is to pull it out of the domain model and into the application layer. However, this drains the domain model of its responsibility and fragments the core business logic. All core business logic related to the domain model should stay in the domain layer.

It's possible to put this kind of logic into a method on one of the involved aggregate roots, but often it doesn't naturally fit there.

Instead, it's usually better to introduce a domain service to encapsulate this logic and coordinate between the involved aggregates.

Domain services can use interfaces to access external services, such as a repository. For example, a domain service might want to check if a user email is unique. In this case, it can define an `IUserRepository` with a `UserExistsWithEmail` method.

## Use value objects for strong-typed entity IDs

Using value objects instead of primitive types like GUIDs for entity IDs helps to avoid common bugs like those demonstrated below.

Bug #1: Passing IDs in the wrong order.

```csharp
var user = repository.GetUser(tenantId, userId);

interface IUserRepository
{
    User GetUser(string userId, string tenantId);
}
```

Bug #2: Comparing the wrong IDs.

```csharp
var usersInTenancy = users.Where(u => u.Id == tenantId);
```

If we use strongly-typed value objects instead of primitive types, these problems go away.

The below demonstrates how a `UserId` value object might look. The private constructor and the public static factory function that generates a GUID internally is not necessary but makes generating a new `UserId` pleasant from the client perspective.

```csharp
public record UserId
{
    private UserId(Guid value)
    {
        Value = value;
    }

    public Guid Value { get; }

    public static UserId Create()
    {
        return new(Guid.NewGuid());
    }
}
```

## Use value objects to avoid primitive obsession

Further to the above, we can also use value objects for other values besides an entity's ID. This has the same benefits as described above, but also helps encapsulate any business rules related to those values.

For example, we might have a business rule that requires a user's name to be no more than 50 characters in length. In this case, we can create a value object to represent a user's name like so.

```csharp
public record UserName
{
    private UserName(string value)
    {
        Value = value;
    }

    public string Value { get; }

    public static UserName Create(string value)
    {
        if (value.Length > 50)
        {
            throw new Exception("User name must not be greater than 50 characters in length");
        }

        return new(value);
    }
}
```

In addition to the benefits described above, this also helps to reduce duplication in case there are multiple places where a user's name is validated.

## Use static factory methods to create entities

Besides the aesthetic preference, static factory methods do have benefits.

Benefit #1: Side effects.

Consider that on creation of a new entity we want to perform some side effect, like raising a domain event. We could do this in the constructor, but that feels dirty. Furthermore, the constructor could be used by deserialisers, and in these cases we wouldn't want the same side effects to occur.

Instead, using static factory methods allows us to put any potential side effects in there instead of in the constructor, like so.

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
        var user = new (UserId.Create(), name);
        user.Raise(new UserCreatedEvent(user.Id));
        return user;
    }
}
```

Benefit #2: Returning something other than the new object.

Constructors can only return the newly-created object, so we wouldn't be able to return anything else, such as a `Result` or a `UserCreatedEvent`. With static factory methods, we _can_ do this.

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
            return Result.Error("That name is not allowed");
        }

        var user = new (UserId.Create(), name);
        return Result.Ok(user);
    }
}
```

Benefit #3: Accepting services as arguments.

If the object's intial values are calculated using some service class, the client would have to either pre-calculate those values and pass them into the constructor, or pass the service itself into the constructor, like so.

```csharp
public class User : Entity<UserId>
{
    private User(UserId id, UserName name, IClock clock) : base(id)
    {
        Name = name;
        CreatedAt = clock.UtcNow;
    }

    public UserName Name { get; }
    public DateTimeOffset CreatedAt { get; }

    public static Result<User> Create(UserName name)
    {
        if (name.Value is "admin")
        {
            return Result.Error("That name is not allowed");
        }

        var user = new (UserId.Create(), name);
        return Result.Ok(user);
    }
}
```

However, this feels dirtier than pre-calculating the values in a static factory method and having the constructor simply initialise the object's internal properties and fields using the values it's passed as arguments.

Benefit #4: Async methods.

Following on from the above, constructors can't be `async`, so if the method on the service that calculates the value _is_ `async`, we'd either have to force it to be synchronous, or use a static factory method instead, like so.

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
        return new (UserId.Create(), name, createdAt);
    }
}
```

Benefit #5: Calculating values to pass to a base class.

If the object we're creating extends a base class that accepts some calculated value a constructor argument, we need to calculate that value before we call the base class' constructor.

If we use a static factory method to create the object, we can do the calculation in there. Otherwise, we'd have to create a new method for calculating the value and call that in the call to `base`, which clutters the object.

Further, if there are two such calculated values where the second depends on the first, we'd have to call two methods to calculate them, and the first value would get calculated twice. This is demonstrated below.

```csharp
public class User : Entity<UserId>
{
    private User(UserId id, UserName name) : base(id, GetCalc1(), GetCalc2())
    {
        Name = name;
    }

    public UserName Name { get; }

    private static int GetCalc1()
    {
        return 1;
    }

    private static int GetCalc2()
    {
        return GetCalc1() + 1;
    }

    public static User Create(UserName name)
    {
        var user = new (UserId.Create(), name);
        user.Raise(new UserCreatedEvent(user.Id));
        return user;
    }
}
```

## Business logic vs validation logic

Validation logic is obvious and not specific to the domain or business. For example, it's obvious that a quantity should not be less than 0. This is the same for any business and any domain.

On the other hand, it's not necessarily obvious that the quantity of a particular product purchased must be less than the quantity on hand in an e-commerce domain. That's a business rule, since it's specific to the business.

## Put all classes related to a use case in the same static class [optional]

When organising application use-cases by feature, instead of separating the command, handler, validator, and response model into separate files, it's sometimes nice to keep them in the same file.

To do this neatly, we can use a static class, like so.

```csharp
public static class CreateUser
{
    public record Command(string Name) : IRequest;

    public class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(c => c.Name).NotEmpty();
        }
    }

    public class Handler : IRequestHandler<Command>
    {
        public Task Handle(Command request, CancellationToken cancellationToken)
        {
            // logic
            return Task.CompletedTask;
        }
    }
}
```

## Folder structure: domain layer

```
  Menus/
  ├─Entities/
  │ └─MenuItem.cs
  ├─ValueObjects/
  │ ├─MenuId.cs
  │ └─MenuItemId.cs
  ├─IMenuRepository.cs
  └─Menu.cs
```

## Design the domain model before the database model

[According to Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/05/15/NODB.html), "if you get the database involved early, then it will warp your design."

As such, he recommends designing the domain model and the use cases of the application first, then "you'll be able to construct a data model that fits nicely into a database."

## Use domain entities as arguments even if you only really need to pass the ID

Some domain operations might only need an entity's ID, like so.

```csharp
user.AcceptInvitation(invitation.Id);
```

However, this marginally leaks implementation details and doesn't express the domain language as strongly as the following.

```csharp
user.AcceptInvitation(invitation);
```

# Use sychronous add/remove methods on the unit of work

The point of the unit of work pattern is to track all changes to the domain model in memory, and commit them all in a single database transaction.

Since change tracking happens in memory, there's no need for add/remove operations to be asynchronous.

As such, they should be synchronous, like so.

```csharp
public interface IUnitOfWork
{
    void Add<T>(T entity) where T : IAggregateRoot;
    void Remove<T>(T entity) where T : IAggregateRoot;
}
```

Only the read operations need to be asynchronous, since these will most likely load domain entities from the database.
