---
title: "Should You Abstract Away EF Core"
date: "2023-11-27T11:10:00Z"
categories:
  - Software Development
tags:
  - software architecture
  - domain driven design
  - the clean architecture
---

The Clean Architecture (and others) call for the application layer to be free of external dependencies, to be persistence agnostic, and to interact with external services through the abstraction of interfaces.

As such, typically we use the repository pattern to hide EF Core behind interfaces. This makes our application layer more testable and more focused on the use case logic, rather than EF Core logic.

However, it's often argued that this is unnecessary because EF Core is itself an abstraction on top of the database, so still provides the pluggable architecture encouraged by The Clean Architecture, at least between different SQL databases. As such, many developers prefer to use their app's `DbContext` directly in their command handlers within the application layer, because it gives them more flexibility and less indirection when pulling data from the database, and therefore speeds up development.

But there's a bigger reason to abstract away EF Core when following DDD principles: repositories help to enforce that each aggregate has to be loaded as a whole.

Without this abstraction, it's possible with EF Core to only partially load an aggregate, or load an entity internal to an aggregate without loading its aggregate root.

This breaks one of the major rules of DDD, which is that aggregates act as transactional boundaries and are used to protect the invariants related to that aggregate.

As such, depending directly on the `DbContext` within the application layer is discouraged.

If we're following CQRS, we might choose to use the `DbContext` directly on the query side, where there are no domain operations, but not on the command side.

This is possible, and not a violation of DDD, but if the command handlers and the query handlers live in the same assembly, there's nothing preventing a developer from misusing the `DbContext` on the command side.

An alternative is to have a thin abstraction over the `DbContext`, defined by the application layer, which gives it the flexibility to use EF Core only with the _aggregate roots_.

```csharp
public interface IUnitOfWork
{
  IQueryable<Subscription> Subscriptions { get; }
  Task SaveChangesAsync(CancellationToken cancellationtoken = default);
}
```

The implementation in the infrastructure layer would ensure that any entities internal to each aggregate are loaded with the aggregate roots.

```csharp
internal class EfUnitOfWork
{
  private readonly AppDbContext _context;

  public EfUnitOfWork(AppDbContext context)
  {
    _context = context;
  }

  public IQueryable<Subscription> Subscriptions => _context.Subscriptions.Include(s => s.Periods);
}
```

If we're following CQRS, the read side can have a different interface that lets it query any entity defined on the `DbContext` without allowing it to make state changes.

```csharp
public interface IQueries
{
  IQueryable<Subscription> Subscriptions { get; }
  IQueryable<SubscriptionPeriod> SubscriptionPeriods { get; }
}
```

```csharp
internal class EfQueries
{
  private readonly AppDbContext _context;

  public EfUnitOfWork(AppDbContext context)
  {
    _context = context;
  }

  public IQueryable<Subscription> Subscriptions => _context.Subscriptions.AsNoTracking();
  public IQueryable<SubscriptionPeriod> SubscriptionPeriods => _context.SubscriptionPeriods.AsNoTracking();
}
```

This way, we can take advantage of EF Core directly within our application layer while encouraging DDD principles.

The advantage of this approach is we reduce the number of thin abstractions between the application layer and the infrastructure layer and the indirection within each use case. As such, we improve development speed and can project query results directly to response models without the extra mapping step required to pass query results from the infrastructure layer up to the application layer, before mapping them to a response model.

The disadvantages include poorer testability and a less pluggable architecture results from fewer abstractions.

However, EF Core does provide an in-memory implementation suitable for tests. We can also choose to only take this approach on the query side, where there's less logic that needs testing, and stick to the repository pattern on the command side.

As for being able to plug in different implementations of the database operations, EF Core is already an abstraction over most SQL databases, so the only real reason to replace it would be a shift towards a non-SQL database, but this is usually extremely unlikely and would probably require more changes than just replacing the database implementation anyway.
