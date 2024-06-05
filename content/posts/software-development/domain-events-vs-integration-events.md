---
title: Domain Events vs Integration Events
date: 2023-11-12T10:14:00Z
categories:
- Software Development
tags:
- domain-driven-design
- event-driven-architecture
- software-architecture
- the-clean-architecture
---

Though domain events and integration events both events, their purposes are in fact very different.

## Domain events

The primary purpose of domain events is to decouple side effects from the main business logic.

For example, if a customer should receive an email after they place an order, then the domain layer can raise a domain event which the application layer can handle by actually sending the email.

The important thing about domain events is that they're raised by the domain layer, so they only make sense within the bounded context in which they were raised. Furthermore, they use the domain language and domain objects of that bounded context.

Because they only make sense within a particular bounded context, they never leave it. In fact, domain events are usually processed in memory by the application layer within the same request as the main business logic; they don't get published to an out-of-process message bus to be sent downstream.

As such, there isn't always a need for domain events; they introduce indirection that isn't always appropriate. Instead, the application layer can just execute the side effect after executing the main business logic.

However, moving side effect logic into a domain event handler can be worthwhile if:

1. there are multiple side effects to the same domain operation
1. the same domain event is raised in more than one place
1. the side effect is truly tangential to the main business logic such that it's cleaner to move it somewhere else.

In any case, it's the application layer that actually executes the side effect.

# Integration events

The primary purpose of integration events is to inform other applications or bounded contexts that an event has occured within *this* application.

Contrary to domain events, integration events are raised by the application layer to communicate with other applications through an inter-process message bus. As such, they don't use the domain objects specific to the bounded context in which they are raised, because those domain objects do not necessarily have the same meaning in other bounded contexts.

# Side effects and the outbox pattern

Since integration events are intended for communicating with other applications, it's a misuse of them for an application to handle its own integration events.

Nevertheless, it's not uncommon to see developers doing this. The primary reason is usually so that they can use the outbox pattern to perform side effects reliably. For example, if they want to send an email to a user after they place an order, they'll publish an `OrderPlaced` integration event using the outbox pattern and handle it within the same application to send an email.

What's needed here, however, is a domain event. Domain events are designed to be handled within the same application.

But if domain events aren't supposed to leave their bounded context or be published to a message bus, how can we use them with the outbox pattern?

First, the outbox pattern is designed to reliably publish *integration events* to a *message bus*. Since this isn't what we want, we can't use the outbox pattern. But we *can* use a similar concept.

What we really want to do is perform some background work within the same application. Similar to the outbox pattern, we can have the application layer handle the domain event by creating one or more background jobs and storing them in the database using the unit of work. Then, a background service can periodically execute these jobs by dispatching them to handlers within the same application.

As an implementation detail, a message bus *could* be used to facilitate all or part of this process, but the messages should be scoped to the publishing application (for example, via routing keys and queue names).

# How to publish domain events

So if domain events are raised by the domain layer, how are they dispatched to handlers in the application layer?

A common approach when using EF Core is to be to override the `SaveChangesAsync` method on the `DbContext`, and use `MediatR` to dispatch the events before the changes are saved.

````csharp
internal class AppDbContext : DbContext
{
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var events = ChangeTracker.Entries<Entity>()
            .SelectMany(e => e.Events);

        foreach (var evt in events)
        {
            await _publisher.Publish(new DomainEventNotification(ev));
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
````

The events are exposed by domain entities as read-only collections.

````csharp
public abstract class Entity
{
    private readonly List<IDomainEvent> _events = new();

    public IReadOnlyCollection<IDomainEvent> Events => _events;

    protected void Raise(IDomainEvent evt)
    {
        _events.Add(evt);
    }
}
````

This works well but leaks responsibility: domain events should really be dispatched by the application layer, not the infrastructure layer.

A different approach would be to proxy the unit of work in the application layer, and dispatch the events in the proxy. The proxy could even be transparent to the use case handlers if registered appropriately in the DI container.

````csharp
public interface IUnitOfWork
{
    IEnumerable<IDomainEvent> GetDomainEvents();
    Task Commit(CancellationToken cancellationToken = default)
}
````

````csharp
internal class UnitOfWorkProxy : IUnitOfWork
{
    private readonly IUnitOfWork _proxied;

    public UnitOfWorkProxy(IUnitOfWork proxied)
    {
        _proxied = proxied;
    }

    public IEnumerable<IDomainEvent> GetDomainEvents()
    {
        return _proxied.GetDomainEvents();
    }

    public async Task Commit(CancellationToken cancellationToken = default)
    {
        var events = GetDomainEvents();

        foreach (var evt in events)
        {
            await _publisher.Publish(new DomainEventNotification(ev));
        }

        await _proxied.Commit(cancellationToken);
    }
}
````

````csharp
internal class EfCoreUnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;

    public EfCoreUnitOfWork(AppDbContext context)
    {
        _context = context;
    }

    public IEnumerable<IDomainEvent> GetDomainEvents()
    {
        return ChangeTracker.Entries<Entity>()
            .SelectMany(e => e.Events);
    }

    public async Task Commit(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}
````

This approach also works, and doesn't leak responsibility like the first approach does, but introduces some extra complexity and indirection that might not be warranted.

In the end, the best approach is a matter of personal preference: the first is simpler but leaks responsibility; the second approach is more complex but doesn't leak responsibility.
