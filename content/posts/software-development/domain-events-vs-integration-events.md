---
title: "Domain Events vs Integration Events"
date: "2023-11-12T10:14:00Z"
categories:
  - Software Development
tags:
  - domain driven design
  - event driven architecture
  - software architecture
  - the clean architecture
---

Though domain events and integration events both events, their purposes are in fact very different.

## Domain events

The primary purpose of domain events is to decouple side effects from the main business logic.

For example, if a customer should receive an email after they place an order, then the domain layer can raise a domain event which the application layer handles by sending the email.

The important thing about domain events is that they’re raised by the domain layer, so they only make sense within the particular bounded context in which they were raised. Furthermore, they use the domain language specific to that bounded context and contain the domain objects of that bounded context.

Because they only make sense within a particular bounded context, they never leave that bounded context. In fact, domain events are usually processed in memory by the application layer within the same request as the main business logic; they don’t get published to an out-of-process message bus or the like.

As such, there isn’t always a need for domain events; they introduce indirection that is not always necessary. Instead, the application service (use case) can just perform the side effect there and then, before committing the unit of work. However, moving this side effect logic into a domain event handler can be worthwhile if, for example, there are multiple side effects to the same domain operation; if the same domain event is raised by more than one use case; or if the side effect is truly tangential to the domain operation such that it seems cleaner to move the logic elsewhere. In both cases, it’s the application layer that actually executes the side effect.

# Integration events

The primary purpose of integration events is to inform other applications or bounded contexts that an event occured within this application.

Contrary to domain events, integration events are raised by the application layer to communicate with other applications through an inter-process message bus. As such, they don’t use the domain objects specific to the bounded context in which they are raised, because those domain objects do not necessarily have the same meaning in other bounded contexts.

# Side effects and the outbox pattern

Since integration events are specifically for communicating with other applications, it’s a misuse of integration events for an application to handle its own integration events.

Nevertheless, it’s not uncommon to see developers doing this. The primary reason is usually so that they can use the outbox pattern to perform side effects reliably. For example, if they want to send an email to a user after they place an order, they’ll publish an OrderPlaced integration event using the outbox pattern and handle it within the same application to send an email.

What’s needed here, however, is a domain event. Domain events are designed to be handled within the same application. But if domain events aren’t supposed to leave their bounded context or be published to a message bus, how can we use them with the outbox pattern?

First, the outbox pattern is designed to reliably publish integration events to a message bus. Since this is not what we want, we can’t use the outbox pattern. But we can use a similar concept.

What we really want to do is perform some task, or background job, within the same application. Using a similar idea to the outbox pattern, the application layer can handle the domain event by creating one or more background jobs and storing them in the database using the unit of work. Then, a background service can run periodically and execute these jobs by dispatching them to different handlers within the same application.

As an implementation detail, a message bus might be used to dispatch the background jobs to handlers within the same application, but the messages should be scoped to this application (for example, by using naming conventions in the routing keys or in the queue names).

# How to publish domain events

So if domain events are raised by the domain layer, how are they dispatched to handlers in the application layer?

The most common approach when using EF Core seems to be to override the SaveChangesAsync method in the DbContext, and use MediatR to dispatch the events before the changes are saved.

```csharp
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
```

The events are exposed as read-only collections by the domain entities so that they can be published.

```csharp
public abstract class Entity
{
    private readonly List<IDomainEvent> _events = new();

    public IReadOnlyCollection<IDomainEvent> Events => _events;

    protected void Raise(IDomainEvent evt)
    {
        _events.Add(evt);
    }
}
```

This works well but leaks responsibility: domain events should be dispatched by the application layer, not the infrastructure layer.

A different approach would be to proxy the unit of work in the application layer, and dispatch the events in the proxy. The proxy could even be transparent to the use case handlers if it is registered as a proxy in the DI container.

```csharp
internal class UnitOfWorkProxy : IUnitOfWork
{
    public async Task Commit(CancellationToken cancellationToken = default)
    {
        var events = _proxy.GetDomainEvents();

        foreach (var evt in events)
        {
            await _publisher.Publish(new DomainEventNotification(ev));
        }

        await _proxy.Commit(cancellationToken);
    }
}
```

For this to work, the GetDomainEvents method would have to be added to the IUnitOfWork interace, like so.

```csharp
public interface IUnitOfWork
{
    IEnumerable<IDomainEvent> GetDomainEvents();
}
```

This approach also works, and doesn’t leak responsibility like the first approach, but introduces some extra complexity and indirection that might not be warranted.

In the end, the best approach is a matter of personal preference: the first is simpler but less coherent in terms of responsibility, while the second is more complex but also more coherent in those terms.
