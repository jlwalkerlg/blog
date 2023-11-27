---
title: "Should You Abstract Away EF Core?"
date: "2023-11-27T11:10:00Z"
categories:
  - Software Development
tags:
  - software architecture
  - domain driven design
  - the clean architecture
  - cqrs
  - vertical slice architecture
---

The Clean Architecture (and others) call for the application layer to be free of external dependencies, to be persistence agnostic, and to interact with external services only through interfaces.

As such, typically we use the repository pattern in our application layer to access the database rather than going through EF Core directly. This makes our application layer more testable and more focused on use case logic, rather than the details of EF Core.

However, it's often argued that this abstraction is unnecessary because EF Core is itself alreaady an abstraction on top of the database, and so still provides the pluggable architecture encouraged by The Clean Architecture, at least when it comes to switching between different SQL databases.

As such, many developers prefer to depend on EF Core directly in the application layer, and inject a `DbContext` into their command handlers. This gives them more flexibility in working with the database and leads to less indirection, which can often speed up development. This is especially true of queries (as opposed to commands), because repositories can easily become bloated with query methods used only in one use case.

But there's a bigger reason to abstract away EF Core when following DDD principles: repositories help to enforce the rules that each aggregate must be loaded in its entirety.

Without this abstraction, it's possible with EF Core to only partially load an aggregate, and therefore access entities that are internal to an aggregate without going through the aggregate root.

This breaks one of the major rules of DDD, since aggregates act as transactional boundaries that are used to protect the business invariants related to that aggregate. To do so, they must always be loaded as a whole.

As such, depending directly on the `DbContext` within the application layer is discouraged.

If we're following CQRS, we might choose to use the `DbContext` directly on the query side, where there are no domain operations, but not on the command side.

This is possible, and doesn't violate DDD principles, but if the query handlers live in the same assembly as the command handlers, there's nothing to stop a developer from misusing the `DbContext` on the command side.

An alternative is to write a thin abstraction over the `DbContext`, and use that in the application layer instead. On the command side, this abstraction would only expose the aggregate roots for querying (and creating/deleting), without exposing the non-root entities. This still gives use the flexibility to take advantage of working directly with EF Core in our command handlers, without opening our domain model up too much.

```csharp
public interface IUnitOfWork
{
  IQueryable<Subscription> Subscriptions { get; }
  Task SaveChangesAsync(CancellationToken cancellationtoken = default);
}
```

The implementation in the infrastructure layer would ensure that any non-root entities are eager-loaded with their aggregate roots.

```csharp
internal class EfUnitOfWork : IUnitOfWork
{
  private readonly AppDbContext _context;

  public EfUnitOfWork(AppDbContext context)
  {
    _context = context;
  }

  public IQueryable<Subscription> Subscriptions => _context.Subscriptions.Include(s => s.Periods);

  public async Task SaveChangesAsync(CancellationToken cancellationtoken = default)
  {
    await _context.SaveChangesAsync(cancellationToken);
  }
}
```

If we're following CQRS, the read side can have a different interface that lets it query any entity in the domain model, root or non-root, without allowing it to make any changes to the domain model.

```csharp
public interface IQueries
{
  IQueryable<Subscription> Subscriptions { get; }
  IQueryable<SubscriptionPeriod> SubscriptionPeriods { get; }
}
```

```csharp
internal class EfQueries : IQueries
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

The advantage of this approach is that we reduce the number of thin abstractions between the application layer and the infrastructure layer, which reduces indirection and often improves development speed. On the query side, it also allows us to project database query results directly to response models, without having to define a bunch of database query result models, passing them up to the application layer, and then finally mapping them to a response model.

The disadvantages of getting rid of these abstractions are that the our use cases become harder to test and it also means we can't easily swap EF Core for something else, if necessary.

But it's extremely rare that we'd want to swap EF Core anyway; it's already an abstraction over SQL databases, so the only reason we'd realistically choose something else is we were to migrate to a SQL database that it doesn't support, or if we migrate to a non-SQL database. The former is unlikely to be a problem because it does support most SQL database vendors, and the latter would likely require far more changes than just writing new implementations of the repositories anyway.

As for testing, EF Core does provide a suitable in-memory implementation suitable for tests. Moreover, we can take this approach only on the query side, where there's less logic that actually needs testing, and stick with the repository pattern on the command side.
