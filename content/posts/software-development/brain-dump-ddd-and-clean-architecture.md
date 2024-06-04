---
title: "Brain Dump: DDD and Clean Architecture"
date: "2023-11-11T14:02:00Z"
categories:
  - Software Development
tags:
  - domain-driven-design
  - software-architecture
  - the-clean-architecture
ShowToc: true
---

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

The point of the unit of work pattern is to track all changes to the domain model _in memory_, and commit them all in a single database transaction.

Since change tracking happens in memory, there's no need for add/remove operations to be asynchronous.

As such, they should be synchronous, like so.

```csharp
public interface IUnitOfWork
{
    void Add(IAggregateRoot entity);
    void Remove(IAggregateRoot entity);
}
```

Only the read operations need to be asynchronous, since these will most likely load domain entities from the database.

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
