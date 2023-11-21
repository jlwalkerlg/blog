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

## Use domain services for business logic across multiple aggregates

Aggregates are isolated chunks of the domain model that are loaded and persisted as a whole, and are responsible for enforcing business rules related to that aggregate alone, such that its invariants are not broken.

But invariably there are business rules that span across multiple aggregates, such that no one single aggregate can enforce the relevant business rules alone.

One option is to pull this logic out of the domain model and into the application layer, but this drains the domain model of its responsibility and fragments the core business logic such that it is scattered between the domain layer and the application layer. All core business logic related to the domain model should be in the domain layer.

It's possible to put this logic into a method on one of the involved aggregate roots, but often it doesn't naturally fit on any one aggregate.

Instead, it's usually better to introduce a domain service to hold this logic and coordinate between the involved aggregates.

## Put repositories in the domain layer

Domain services often need to query across multiple aggregates in the domain model by definition. For example, a business rule might state that each user can only follow up to 100 artists, while another business rule might state that each user's email has to be unique.

This means either that all the relevant aggregates needed to enforce these business rules have to be loaded into memory up front by the application layer and then passed into the domain service, or the domain service has to have direct access to the domain model through a repository.

Loading all the relevant aggregates up front is impractical not only in terms of performance, but also in terms of code organisation, depending on how many collections of aggregate have to be joined together in-memory. Queries across multiple aggregates are often better done by a database.

As such, it's better to give domain services access to the domain model through repositories, which means that repositories must be part of the domain layer.

This makes sense because repositories are defined in terms of the domain model, i.e., they accept domain objects as arguments and return domain objects as return values, just as domain services do.

This is what truly distinguishes them from other services that also reach out to external processes: repositories are concerned wholly with the domain model, and the fact that they reach out to an external process is merely an artifact of practicality — it is necessary for the domain model to be persisted to a database without loading the whole thing into memory on each request. This is not true of other services that interact with external processes, because the only external process that is entirely focused on the domain model is the database, and therefore repositories so should be the only external services in the domain layer.

```csharp
public class FollowerService
{
    private readonly IFollowerRepository _followerRepository;

    public FollowerService(IFollowerRepository followerRepository)
    {
        _followerRepository = followerRepository;
    }

    public async Task FollowArtist(User user, Artist artist)
    {
        if (await _followerRepository.IsAlreadyFollowing(user, artist))
        {
            throw new Exception("The user is following this artist");
        }

        if (await _followerRepository.CountFollowing(user) is 100)
        {
            throw new Exception("The user is already following the maximum of 100 artists");
        }

        var follower = Follower.Create(user, artist);
        await _followerRepository.Add(follower);
    }
}
```

Another benefit of defining the repositories in the domain layer is that it means that the domain layer defines how the domain aggregates can be accessed, i.e., what operations can be done against the domain model as a whole. As such, the application layer has to conform to the constraints of the domain layer, further pushing the core business rules down into the domain layer, which is what we want. This is similar to how an aggregate root controls access to its internal entities, but is effective across the domain model rather than a single aggregate.

## Use value objects for strong-typed entity IDs

Using value objects instead of primitive types like GUIDs for entity IDs helps to avoid common bugs like those demonstrated below.

### Bug #1: Passing IDs in the wrong order.

```csharp
var user = repository.GetUser(tenantId, userId);

interface IUserRepository
{
    User GetUser(string userId, string tenantId);
}
```

### Bug #2: Comparing against the wrong ID.

```csharp
var usersInTenancy = users.Where(u => u.Id == tenantId);
```

If we use strongly-typed value objects instead of primitive types, these problems go away.

The below demonstrates how a UserId value object might look. The private constructor and the public static factory function that generates a GUID internally is not necessary but makes generating a new UserId pleasant from the client perspective.

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

Further to the above, we can also use value objects for other values besides an entity's ID. This has the same benefits as described above, but also helps encapsulate any business rules and/or validation rules related to those values.

For example, we might consider that a user's name must be no more than 50 characters in length. In truth this doesn't sound like a business rule so much as an arbitrary validation rule, maybe for storage purposes. As such, it probably shouldn't be in the domain model anyway, but for the sake of argument, assume there's a good business-related reason for it, and so it's part of the domain model.

We can create a value object to represent a user's name like so.

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

In addition to the benefits described above, this also helps to reduce duplication in case there are multiple places in the code where a user's name must be validated.

## Use static factory methods to create entities

This is largely an aesthetic choice, but it does also have some potential benefits.

### Benefit #1: Side effects.

Consider that on creation of a new entity we want to perform some side effect, like raising a domain event. We could do this in the constructor, but it seems dirty and contrary to the purpose of the constructor, which is to initialise the properties of the object. Furthermore, the constructor could be used by deserialisers and the like, and in these cases we wouldn't want to create the same side effects.

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

### Benefit #2: Returning something other than the new object.

Constructors can only return the newly-created object, so we wouldn't be able to return anything else, such as a Result or a UserCreatedEvent. With static factory methods, we can do so.

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

### Benefit #3: Accepting services as arguments.

If the object's intial values are calculated by some service class, either the client would have to pre-calculate those values and pass them into the constructor, or pass the service itself into the constructor, like so.

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

However, this feels a little dirty because constructors are meant primarily to initialise the object's values. It would be cleaner to calculate values outside of the constructor and pass them in, for example by using a static factory method.

### Benefit #4: Async methods.

Following on from the above, constructors can't be async, so if the method on the service that calculates the value is async, we'd either have to force it to be synchronous, or use a static factory method instead, like so.

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

### Benefit #5: Calculating values to pass to a base class.

If the object we're creating extends a base class that accepts some calculated value a constructor argument, we need to calculate that value before we call the base class' constructor. If we use a static factory method to create the object, we can do the calculation in there. Otherwise, we'd have to create a new method for calculating the value and call that in the call to base(), which is not ideal. Further, if there are two such calculated values where the second depends on the first, we'd have to call two methods to calculate them, and the first value would get calculated twice. This is demonstrated below.

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
        return 1; // pretend it's more complicated than this...
    }

    private static int GetCalc2()
    {
        return GetCalc1() + 1; // pretend it's more complicated than this...
    }

    public static User Create(UserName name)
    {
        var user = new (UserId.Create(), name);
        user.Raise(new UserCreatedEvent(user.Id));
        return user;
    }
}
```

## Put all classes related to a use case in the same static class [optional]

When organising application use-cases by feature, instead of separating the command, handler, validator, and response model into separate files, it's sometimes nice to keep them in the same file.

To do this neatly, we can use a static class like so.

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

## Name the application layer project, `UseCases`

`UseCases` clearly expresses the idea of the layer and avoid the generic, meaningless name, `Application` or `App`.

## The application layer

The application layer serves basically the same purpose as controllers in a web framework, but is made independent of delivery mechanism by a thin abstraction. That is, it exposes the domain layer and its core business operations to the user via different use cases.

The application layer shouldn't hold any core business logic; this should be in the domain layer. In fact, the domain layer should guard against this where possible, for example by using the internal keyword.

The concerns of the application layer include loading and persisting the domain model, emitting side effects via integration events, authorisation, input validation, etc. In some cases, it might execute multiple domain operations in one use case. For example, it might create a playlist and add song to that playlist in one use case so that the user can do this in one step, but this still consists of two domain operations.

## Design the domain model before the database model

[According to Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/05/15/NODB.html), "if you get the database involved early, then it will warp your design." As such, he recommends designing the domain model and the use cases of the application first, then "you'll be able to construct a data model that fits nicely into a database."

## Use domain entities as arguments even if you only really need to pass the ID

Some methods might only need the ID of an entity to work, and so it is common to do the following.

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

```csharp
public interface IUnitOfWork
{
    void Add<TEntity>(TEntity entity) where TEntity : Entity;
    void Remove<TEntity>(TEntity entity) where TEntity : Entity;
}
```

Only the read operations need to be asynchronous, since these will most likely load domain entities from the database.
