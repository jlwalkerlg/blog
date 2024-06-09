---
title: Command Query Segregation Principle
date: 2020-08-30T19:26:00Z
categories:
- Software Development
tags:
- software-architecture
- cqrs
- domain-driven-design
---

*CQRS is an architectural pattern whereby the system is separated according to two distinct responsibilities: reads/queries, and writes/commands. The basis for doing so is to recognise that it is impossible to effectively accommodate the needs of both responsibilities with the same unified model. By employing the single responsibility principle and separating them, we gain many benefits in terms of simplicity, performance, and scalability.*

![CQRS](..\..\Attachments\cqrs.png)

## Origins

CQRS finds its origins in the command-query separation (CQS) principle of Bertrand Meyer, which suggests that a method should either produce some side effect, like a state mutation, or return some data — but not both. The reason for doing so is simplicity and readability: it becomes much easier to see at a glance what the intent of the method is. If the return type is void, then the method produces some side effect; otherwise, it returns data and is pure (free of side effects). This is essentially a low-level application of the single responsibility principle, and makes the code much easier to reason about. Like always, there are exceptional cases where this separation is either infeasible or not worth the trouble, such as in the case of popping an item from a stack, or an I/O operation that needs to be atomic. For the most part though, it's a good rule to follow. An example can be seen below.

````csharp
public interface IBookService
{
    void SaveBook(Book book);
    List<Book> GetAllBooks();
}
````

CQRS was originally thought to be nothing more than an extension of this principle to the level of architecture. However, it turns out that in making this extension we gain many opportunities that are not possible with CQS alone, and so the two are now recognised as different patterns. Nevertheless, they both involve the same fundamental idea and as such provide our code with the same benefit: simplicity.

With CQRS, each request entering our application is either a command that mutates data, or a query that only returns data to the client. This encourages a simpler mental model of our application based around the idea of use cases, and so makes our application as a whole easier to understand.

The examples below, taken from [Greg Young's notes on CQRS](https://cqrs.files.wordpress.com/2010/11/cqrs_documents.pdf), show a command, a query, and their respective handlers.

````csharp
public class DeactivateInventoryItemCommand
{
    public Guid Id { get; }
    public string Comment { get; }

    public DeactivateInventoryItemCommand(Guid id, string comment)
    {
        Id = id;
        Comment = comment;
    }
}

public class DeactivateInventoryItemHandler : ICommandHandler<DeactivateInventoryItemCommand, Result>
{
    public Result Handle(DeactivateInventoryItemCommand command)
    {
        // ...
    }
}
````

````csharp
public class GetBooksQuery : IQuery
{
    public Guid CategoryId { get; }
    public int Page { get; }
    public int PerPage { get; }

    public GetBooksQuery(Guid? categoryId, int page, int perPage)
    {
        CategoryId = categoryId;
        Page = page;
        PerPage = perPage;
    }
}

public class GetBooksHandler : IQueryHandler<GetBooksQuery, List<BookDto>>
{
    public List<BookDto> Handle(GetBooksQuery query)
    {
        // ...
    }
}
````

It is important to note that it is impossible, or not recommended, for command handlers to return void, as in CQS; they should in most cases return to the client or calling function at least an acknowledgement that the command has been processed, and whether or not it was successful. In the case of a failure, it should likely also return some explanation of what went wrong — an error message and/or validation error messages. It is also acceptable for a command handler to return any metadata that may be needed by the client, for example the ID of a newly-created resource. However, besides metadata, a command shouldn't return any real application state for the client to display, since this is the role of the query side.

## Cross-Cutting Concerns with The Decorator Pattern

One benefit we gain by representing the commands and queries of our application explicitly, as first-class objects, is that we are able to introduce a common interface for the handling of all use cases. This further allows us to make use of the decorator pattern for cross-cutting concerns such as logging, implementing database retries, and caching.

While not intrinsic to CQRS, it does follow naturally from the explicit representation of commands and queries as first-class objects, and is one example of the simplicity we gain by applying CQRS to a code base.

````csharp
public class LoggerDecorator<TRequest, TResponse>
    : ICommandHandler<TRequest, TResponse>
    : IQueryHandler<TRequest, TResponse>
{
    private readonly ILogger logger;

    public LoggerDecorator(ILogger logger)
    {
        this.logger = logger;
    }

    public TResponse Handle(TRequest request)
    {
        var json = JsonConvert.SerializeObject(request);
        logger.Log(json);

        return handler.Handle(request);
    }
}
````

## Task-Based User Interfaces

Commands and queries are sent to the application from external systems, and so any user-facing client must necessarily have an interface which allows the user to send them. Since commands are defined with behaviour-driven, domain-centric semantics, these clients must necessarily present a behaviour-driven interface to the user. Such user interfaces are said to be task-based, and are essential to CQRS/DDD applications.

I have previously written about [task-based user interfaces here](https://walkerjordan.com/task-based-user-interfaces/). The important thing to note here is that instead of sending DTOs representing the underlying data of the domain model, the client instead sends commands to the server telling it to perform some task. These commands are essentially serialisable methods calls, which contain the data required to perform each task and are defined with the ubiquitous, behaviour-oriented language of the domain. As such, they are essential to domain-driven design, and to CQRS.

## Separating the Domain Model

With the application exposing a behaviour-oriented interface, the use cases are now represented explicitly as commands with domain-centric semantics. However, using the same domain model for both reads and writes entails at least two major problems.

First, the domain model becomes unnecessarily over-complicated in order to support flexible querying of the underlying data. Specifically, repositories often become convoluted with a myriad of methods and optional parameters meant for filtering and searching. The domain objects themselves have to accommodate mapping their internal state to DTOs, and so it becomes all-too-easy to produce a sub-optimal domain model, given that we are trying to handle two different responsibilities with a single model.

Second, and more glaringly, queries can't be properly optimised because they are operating on a domain model, rather than a data model, and are thus dealing with the problem of impedance mismatch. The domain model has to be queried first, and then mapped to DTOs appropriate for the clients. This introduces inefficiencies for a number of reasons. First, repositories will typically load whole aggregates, which contain more data than is required from that particular aggregate. Second, to pull data from separate aggregates, they will have to perform multiple round-trips to the database, rather than joining the data together with a single query. Third, it is common in DDD to use an object-relational mapper (ORM), which in turn often produce poorly-optimised SQL, may cause the developer to have to deal with lazy/eager loading, may require some filtering/sorting to be done in memory if the ORM doesn't provide the necessary capabilities, and in some cases can introduce the N+1 problem. Essentially, the result is over-complicated code and inefficient reads.

The fundamental reason for these problems is that the two sides in fact have very different responsibilities. The responsibilities of the command side include a behaviour-oriented, domain-centric object model; transactions; and data consistency. The responsibilities of the query side include efficient querying of the underlying data; flexible searching and sorting capabilities; and loading no more data than is required by the client.

To alleviate these problems, the CQRS principle thus suggests that we recognise these two very different responsibilities, apply the single responsibility principle, and allow each side to focus only on its particular requirements.

## The Query Model

As mentioned above, the problems with the query side stem from the problem of impedance mismatch: the queries are operating on a domain-centric object model and then mapping it to a data model consisting of DTOs. The solution, then, is actually for the query side to completely bypass the domain model altogether and read data directly from the database.

By doing so, we are able to avoid dealing with domain-centric repositories and instead write hand-crafted, properly optimised SQL queries; use efficient, database-specific features; and load only the data required by the clients.

The query model thus becomes a "Thin Read Layer" that sits on top of the database, providing the exact data required by the client for a particular screen.

![CQRS query side diagram](..\..\Attachments\cqrs-query-side.png)

Note that, unlike with the command side, there are no data mutations on the query side of the architecture, no opportunities to violate domain invariants, and therefore no need for such aggressive encapsulation of the domain model.

Besides simplicity and performance, this segregation of the command and query sides provides an additional benefit: scalability. Since most applications are far more read-intensive than write-intensive, it is useful to be able to scale the read side independently of the write side, and by separating it from the command side, we make it easier to do so. For example, we can put a caching layer in front of the query handlers, or use separate application servers for reads and scale them up as needed.

We could, if necessary, go even further by using a separate database structure for reads and writes — one that is more appropriate for the requirements of each side. For reads, this may include a denormalised structure whose columns map directly to the DTOs required by clients, or even a non-relational database. We can then scale these database servers up as needed, independent of the command side, which will typically use a relational database in 3rd normal form, in order to better support consistency, transactions, and data integrity.

Note, however, that this separation at the database level adds a significant overhead of complexity, because the read database has to be kept in sync with the write database, and developers will thus have to deal with eventual consistency. However, such a separation is not usually required for most applications, since the benefits of applying CQRS to everything except the database are still plenty. Further there are existing solutions that can be used for similar purposes and don't require a custom implementation, including elastic search; indexed SQL Server views; and automatic database replication, wherein the master database is used for writes, and the replicas, which can be easily and independently scaled up or down, only for reads.

## The Command Model

After applying CQRS, the command side remains largely the same as before, focusing on behavioural, domain-centric semantics. The difference, however, is that the code intended only to support flexible querying of the underlying data has been ripped out, leaving a much cleaner and less convoluted code base.

![CQRS command side diagram](..\..\Attachments\cqrs-command-side.png)

## Summary

Using a single unified model for both reads and writes leads to a host of problems, and two in particular. First, the domain model becomes convoluted with code only there to support flexible querying of the underlying data, over-complicating the code base. Second, and most noticeably, queries are inefficient because they are dealing with the impedance mismatch problem, and because ORMs don't support the very particular queries needed by each application. The command-query responsibility segregation principle suggests that we apply therefore separate the system into a command side and a query side, allowing each to be tailored the their particular needs. Furthermore, with the extension of CQS to the level of architecture, the representation of commands/queries as explicit, first-class objects, and the task-based interface imposed by CQRS, the code and the application itself become simpler and easier to understand.

## Resources

* [Pluralsight course on CQRS by Vladimir Khorikov](https://app.pluralsight.com/library/courses/cqrs-in-practice/)
* [CQRS documents by Greg Young](https://cqrs.files.wordpress.com/2010/11/cqrs_documents.pdf)
