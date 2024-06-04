---
title: "The Clean Architecture"
date: "2020-08-31T11:04:00Z"
categories:
  - Software Development
tags:
  - software-architecture
  - the-clean-architecture
---

The Clean Architecture is one of many architectures that aim to isolate the domain model, and make the code base more modular, more decoupled, and therefore more testable. It takes ideas from Ports and Adapters Architecture (Hexagonal Architecture), The Onion Architecture, and Domain-Driven Design, and as such shares many commonalities with them.

![The Clean Architecture diagram](https://blog.cleancoder.com/uncle-bob/images/2012-08-13-the-clean-architecture/CleanArchitecture.jpg)

## Layers and The Dependency Rule

The Clean Architecture recommends a layered approach similar to The Onion Architecture, where each wraps around the next like the concentric circles of an onion. At the very core is the domain model, with all the bells and whistles of DDD. Next, is the application layer, which consists of services that implement the use cases of the application using the domain layer. Further outwards are the interface adapters, which implement the services defined by the application layer with the help of external infrastructure services, which make up the outermost layer.

The Clean Architecture therefore describes 4 layers, though the most important point about these layers is not the number, but **the dependency rule**: all dependencies point inwards. This means that code in the domain core can't reference code in the application layer, and code in the application layer can't reference code in the interface adapters layer.

The reasons for this rule come down to the single responsibility principle, the open/closed principle, and testability. By separating the core domain model and the application use cases from all infrastructural concerns, it is easier to understand the logic driving the system and enforcing the business rules. By placing interfaces between the core application and the infrastructure services it requires, they can be more easily swapped out for different implementations without having to worry about updating the core application logic. This includes, by the way, test doubles, and so the core application logic and the business rules can be tested without the framework, without the database, and without any infrastructure at all.

While swapping some implementations like domain repositories or even the framework itself may be difficult in ether case, it is at least possible if the dependency rule is applied properly without a complete rewrite of the core application. In any case, even if these concerns are unlikely to ever be swapped out, the dependency rule still re-enforces the single responsibility principle, and prevents domain logic leaking into external infrastructure.

## The Domain Model

The core domain model resides in the very center of the onion, in the layer labelled "Enterprise Business Rules". These are the same business rules on which domain-driven design places its focus on, and advocates we build our systems around. Although the diagram above, and [the original blog post from Uncle Bob describing The Clean Architecture](http://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html), only specify "Entities", this term is in fact used as a catch-all term that includes all the domain entities, value objects, and domain services of DDD.

This layer is fully isolated from the outside world. It uses the ubiquitous language of the domain experts, and is doesn't communicate with any infrastructure at all.

## The Application Layer

The application layer is labelled on the above diagram as "Application Business Rules", and it is in this layer that the application exposes its interface to the outside world as defined by its use cases. These use cases are how the outside world interacts with the application; _they specify what the application does_. For example, there may be a use case for purchasing an order, viewing order history, or cancelling an order item.

In order to implement these use cases, this layer defers any business logic to the core domain model, where it belongs. If it needs to reach out to any infrastructure dependencies, such as the database, or an email notification system, it will define the implementation-agnostic interfaces it requires and the real implementations will be injected at run-time by dependency injection. As such, this layer is coupled to the domain core, but decoupled from infrastructure.

Each use case is implemented by a particular class called an `Interactor`. These specify what dependencies they need in their constructor; accept user input as a simple, technology-agnostic data structure like a DTO; load the domain objects required to implement the use case from one or more repositories; call the domain model to actually carry out the logic for the business rules; save the changes back to the repositories; and return some result to the user, again as a simple data structure.

Besides decoupling and modularity, another advantage of defining the application in terms of its use cases and treating them as first-class `Interactor` objects is that the file structure [screams the application's intent](http://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html); instead of being hidden by the structure of the framework, the purpose of the application is clear from the file structure alone.

Notice that this layer does handle user input/output, but it is not tied to a particular delivery mechanism, like the web. That is, it doesn't read input from a HTTP request, or return an HTML view or a JSON response. Instead, its inputs and outputs are simple, normalised data structures that can be sent and received from any delivery mechanism, whether the client be a web browser, a console application, a desktop application, or most importantly, a test suite!

To see how this layer and its use case `Interactor` objects compare with DDD application services, the ports of Hexagonal Architecture, and domain services, [refer to this blog post]({{< ref "/posts/software-development/the-application-layer.md" >}}).

## Interface Adapters

This layer surrounds the application layer and has two purposes.

Firstly, it the application from a particular delivery mechanism. In a web context, this layer will contain the controllers that accept input from a HTTP request, normalise them into DTOs, pass them to the core application, and present the response as HTML, XML, JSON, or some other format appropriate for the web. In the Hexagonal Architecture, this is the left side of the hexagon, or the "primary actors".

Secondly, it provides the infrastructure services required by the core application by implementing the specified interfaces. For example, repositories belong to this layer. These are the "secondary actors" of Hexagonal Architecture, on the right side of the hexagon. The application uses them in its implementation of the use cases, but does not couple to them, thanks to dependency inversion.

Note that this layer is actually coupled to what appears to be a fourth layer in the above diagram, where the database, the web, and other external interfaces live. For example, web controllers will typically extend a base controller provided by the framework, and repositories will typically know the details of a particular database vendor. As such, the above diagram and the inclusion of a fourth layer is actually misleading, because it suggests that the adapters in this layer must somehow adapt the infrastructure interfaces to the application interfaces without knowing the details of both of them, which is impossible and not the adapter pattern. Therefore, there are really only 3 layers in The Clean Architecture — at least where the dependency rule is concerned.

## The Web Request-Response Cycle

It is instructive at this point to see how a typical web request will play out, and how the application will implement a particular use case. And what better way to demonstrate this than with a todo app!?

Below is an example of a typical web controller, which extends the base controller provided by the framework (in this case ASP.NET Core), and accepts its dependencies via the constructor. These dependencies are injected at run-time by the framework. The controller packs the input from the incoming HTTP request into a simple DTO, passes it to the appropriate `Interactor`, then passes the application response to a `Presenter` to turn it into a format appropriate for the web.

```csharp
public class TodoController : ControllerBase
{
    private readonly ICompleteTodoUseCase interactor;
    private readonly ICompleteTodoPresenter presenter;

    public TodoController(
        ICompleteTodoUseCase interactor,
        ICompleteTodoPresenter presenter)
    {
        this.interactor = interactor;
        this.presenter = presenter;
    }

    [HttpPost("/todos/{id}/complete")]
    public async Task<IActionResult> CompleteTodo(Guid id)
    {
        var command = new CompleteTodoCommand(id);
        var result = await interactor.Handle(command);

        return presenter.Present(result);
    }
}
```

Note that the controller _could_ format the response itself, and the dependency rule would not have been violated. However, by passing it to the presenter, it obeys the single responsibility principle, and so keeps the code more modular. Alternatively, the `Interactor` could pass the response to the `Presenter` itself, and the `Controller` could in turn ask the `Presenter` for the result before returning it, for the same result.

After the `Controller` has passed control to the `Interactor` in the application layer, the `Interactor` loads the appropriate domain entity from the appropriate repository, saves the changes, and returns a simple `Result` object. This object is meant simply as a acknowledgement of whether or not the request was successful, and may contain an error in the case of a failure. In this case then, only metadata about the status of the request is returned, since this particular application follows [CQRS]({{< ref "/posts/software-development/cqrs.md" >}}) principles, but it is equally acceptable to return data from the `Interactor`, so long as the data is a simple data structure and is not tied to a particular delivery mechanism.

```csharp
public class CompleteTodoCommand
{
    public CompleteTodoCommand(Guid id)
    {
        Id = id;
    }

    public Guid Id { get; }
}

public class CompleteTodoInteractor : ICompleteTodoUseCase
{
    private readonly IUnitOfWork unitOfWork;
    private readonly ITodoRepository todoRepository;

    public CompleteTodoInteractor(IUnitOfWork unitOfWork)
    {
        this.unitOfWork = unitOfWork;
        todoRepository = unitOfWork.TodoRepository;
    }

    public async Task<Result> Handle(CompleteTodoCommand command)
    {
        var todo = await todoRepository.GetById(command.Id);

        if (todo == null)
            return Result.Fail(new TodoNotFoundError(command.Id));

        if (todo.IsComplete)
            return Result.Fail(new TodoAlreadyCompleteError());

        todo.MarkComplete();
        await unitOfWork.Commit();

        return Result.Ok();
    }
}
```

The other actors here include the Todo entity, `IUnitOfWork`, and `ITodoRepository`.

The Todo object itself is a DDD Entity defined in the core domain layer, and uses the ubiquitous language of the domain experts (do such people actually exist for todo apps?). It does not depend on any infrastructure and as such is easier to understand and to unit test.

The `IUnitOfWork` and `ITodoRepository` are both interfaces defined in the application layer, yet implemented in the interface adapters layer, and are both tied to a particular infrastructure technology — in this case Entity Framework Core. Their implementation is not important for this demonstration, so there is no need to show the code (it's trivial anyway); what's important is that the adapt the interface of a specific technology — EF Core — to the interface required by the application, and as such allow for dependency inversion, which in turn facilitates the open/closed principle and the single responsibility principle.

This architecture can be summed up with the following diagram, with the slight exception that the use cases returns the output model (`Result` in this case) rather than passing it to the `Presenter`, which the `Controller` does instead.

![The Clean Architecture components](https://i.stack.imgur.com/K44FQ.jpg)

## Best Practices

### Vertical Slicing

One question that might arise is whether it is okay to share `Interactor` objects between different use cases, either by calling one from the other or using multiple inside of a single controller method.

This anti-pattern should be avoided because it couples the use cases together, and causes friction when one use case needs to evolve or change in some way, without the other use case needing to. If all your use cases cross-reference each other like spaghetti, changing one use cases could inadvertently cause other use cases to break.

If there is any true duplication between use cases, the better way to deal with this is by extracting the duplication to a separate application service, which both `Interactor` objects can reference.

### Validation

A common question that arises is where to put validation logic. Validation is fairly blanket term open to different interpretations, but there are two main types of validation we can distinguish.

The first is validation of input directly from the user, for example to check a string is not too long or too short, or that a number is non-negative. Such validation is an application-level concern, since it deals with user input. Further, it should not be tied to a particular delivery mechanism, since the same validation rules should be applied no matter which client is driving the system. As such, input validation belongs to the application layer. If validation here fails, the application will return error messages for the user, to let them know what was wrong with their request.

The second type of validation is that which enforces the business rules, for example whether a student is allowed to register for a particular course. Since these are the core business rules, they belong to the core domain. If validation fails here, the domain core will typically throw an exception, since most validation should be caught by the application layer, and the domain will mostly expect the arguments passed to it are valid. If there are business rules here that can't be checked by the application layer, as with the aforementioned rule about student enrolment, the application could first ask the domain to check the operation is valid before going ahead with it, and returning an error message if not.

Note that there may indeed be some duplication when validating in both the application layer and the domain layer; for example, if a string must be a particular length, it needs to be checked both at the user input level in the application layer, and at the business rules level in the domain layer. In most cases this duplication is minimal and does not impose major maintenance issues. However, it is also possible for the application to ask the domain layer to validate some given parameter(s) if it needs to return a helpful response to the user without throwing exceptions and without leaking domain logic into the application.

### External Libraries

The dependency rule suggests that the inner-most layers of the onion is completely isolated, and does not rely on external libraries. However, this mostly applies to out-of-process calls, i.e. I/O operations. This should certainly be avoided, since they limit testability and confuse the responsibility of the core application. However, helper libraries for things like validation are totally acceptable, though it is wise to isolate them wherever possible, so that if their API changes, the amount of code that has to be changed is minimal.

## Resources

- [Screaming Architecture blog post by Uncle Bob](http://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html)
- [Clean Architecture blog post by Uncle Bob](http://blog.cleancoder.com/uncle-bob/2011/11/22/Clean-Architecture.html)
- [The Clean Architecture blog post by Uncle Bob](http://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

{{< youtube o_TH-Y78tt4 >}}
