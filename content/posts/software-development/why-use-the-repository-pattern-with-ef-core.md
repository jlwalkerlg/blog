---
title: Why use the repository pattern with EF Core?
date: 2024-06-02T06:52:43+01:00
categories:
- Software Development
tags:
- the-clean-architecture
---

It's often argued that since EF Core is itself already an implementation of the repository pattern (and the unit of work pattern) and supports multiple databases, including an in-memory database suitable for testing, that abstracting away EF Core from your application is redundant and unnecessary.

Let's analyse the [reasons to use the repository pattern](why-use-the-repository-pattern.md) one by one, and evaluate them in the context of using EF Core.

* Enforcing the design constraint that aggregates should be loaded and persisted in full. This is a valid reason to use the repository pattern, even with EF Core, because without any abstraction, developers have full control over the `DbContext`, which means they can query and persist any domain entities whether they're aggregate roots or not, and can choose not to use `Include` to load aggregates in full.
* Swapping out the ORM for another data access implementation in the future. For most projects, this is highly unlikely, given the ubiquitousness, level of support, and level of active development surrounding EF Core, as well as the number of databases it supports natively.
* Swapping out the ORM for test doubles in unit tests. Since EF Core supports an in-memory database suitable for unit tests, this might not be an issue.
* Keeping your application logic clean. This really depends on the use case and the specific queries it requires. In most cases, this is unlikely to be an issue, since EF Core uses the fluent `LINQ` method syntax, and more complex queries can perhaps be extracted into extension methods for the `DbContext`.

The main reason to abstract away EF Core, then, is to enforce the design constraint that aggregates should be loaded and persisted in full.

If using CQRS, we *could* opt to only use the repository pattern on the command side, where aggregates are needed to protect domain invariants, and use the `DbContext` directly on the read side, where flexibility and read performance are the priorities. However, if your query handlers and your command handlers live in the same application layer, than this requires that the `DbContext` also lives in the application layer alongside the command handlers, which means developers can misuse the `DbContext` on the command side.

Instead, it's possible to define a thin abstraction over the `DbContext` in the application layer with which you can enforce this design constraint while still using EF Core functionality directly in your application layer. This abstraction would only expose the aggregate roots for querying and persisting.

````csharp
public interface IUnitOfWork
{
    void Add(IAggregateRoot entity);
    void Remove(IAggregateRoot entity);
    IQueryable<Subscription> Subscriptions { get; }
    Task SaveChangesAsync(CancellationToken cancellationtoken = default);
}
````

Here, `IAggregateRoot` is a marker interface defined in the domain layer, and `Subscription` is an aggregate root which implements `IAggregateRoot`.

The implementation of `IUnitOfWork` in the infrastructure layer would ensure that any non-root entities are necessarily eager-loaded with their aggregate roots.

````csharp
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
````

Using CQRS, the read side can use a different abstraction that exposes all domain objects for querying.

````csharp
public interface IQueries
{
    IQueryable<Subscription> Subscriptions { get; }
    IQueryable<SubscriptionPeriod> SubscriptionPeriods { get; }
}
````

````csharp
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
````

These abstractions do introduce *some* level of indirection, but to much a lesser extent than the repository pattern does. Furthermore, they alleviate the primary reason to use the repository pattern with EF Core while avoiding the disadvantages of using the repository pattern by

* reducing indirection
* giving us the flexibility and functionality we get when working with EF Core more directly.
