---
title: "Error Handling in DDD"
date: "2023-11-16T16:27:53Z"
draft: false
categories:
  - Software Development
tags:
  - domain driven design
  - software architecture
  - the clean architecture
---

Keeping business logic in the domain layer while maintaining a good user experience can be challenging. That's because good user experience requires helpful error messages, but the most helpful error messages are contextual -- they take into account the user's intent and tell them why they can't do exactly what they tried to do.

In fact, the best user experience is one in which the user can't even perform an action if the action is going to be invalid. The user interface should hide any buttons that when pressed will obviously result in an error. This isn't always possible, though; the user interface can't know if an email address is already taken, so the backend has to handle that validation. In any case, the user interface is untrusted and so the back end has to run its own validations anyway.

The problem is that as we push our business logic down into the domain layer, we lose sight of the user's original context. With [task-based interfaces]({{% siteurl "/posts/software-development/cqrs/#task-based-user-interfaces" %}}), the user's request at least carries the user's intent, but this is handled by the application layer rather than the domain layer, so isn't available to domain-level business rules. Furthermore, it's impossible for the domain layer itself to map error messages back to specific fields in the user's request, and consequently to specific form fields in the user interface.

## Approach 1: pull the business logic up into the application layer

The first approach is to have the application layer implement the business rules/validations itself. This way, we have full sight of the user's request, and therefore the user's intent, so we can provide as much contextual information as possible in our error messages and and also map them back to specific fields in the user's request.

```csharp

```

The problem with this approach is that it leaks domain knowledge into the application layer, fragments the business logic, and leads to business logic duplication because the domain layer should still enforce the business rules itself anyway.

## Approach 2: run validations in the domain layer from the application layer

The next best thing is to keep the business logic in the domain layer but have the application layer ask the domain layer if it can perform an operation before it actually tries to do so. The domain layer returns an error message if the operation is invalid, which the application layer passes back to the user interface.

```csharp

```

If the application layer skips the validation checks, the domain layer still enforces the rules itself and throws an exception if they're broken.

```csharp

```

The problem with this approach is that we're back to where we started: the domain layer is generating the error messages rather than the application layer, so they're not as contextual as they could be. In order for the error messages to be as contextual as possible, we need to generate the error messages in the application layer.

## Approach 3: return error codes from the domain layer

Instead of returning an error message, the domain layer can return a unique error code instead, and let the application layer decide how it wants to display that error to the user.

```csharp

```

The problem with this approach is that there's no way for the domain layer to pass any complementary data back to the application layer with the error code that would help to present a helpful error message.

## Approach 4: return error objects from the domain layer

Instead of returning strings, the domain layer can instead return error objects that include all necessary details about the error to the application layer so that it can generate a helpful error message. Since these objects are strongly-typed, there's no need for them to contain error codes unless they're useful to the client (e.g., the user interface).

The domain layer can also provide an error message that can serve as a default if the application layer doesn't need to translate the error into something more contextual.

```csharp

```

The problem with this approach is that it still duplicates some code between the application layer and the domain layer.

## Approach 5: return error objects from domain operations themselves

Instead of exposing separate methods from the domain layer to check if an operation is valid, the domain layer can just return those error objects from the actual domain operation methods.

```csharp

```

The problem with this approach is that the domain layer can't return anything besides the error object. If it needs to pass something back to the application layer, it would have to use an `out` parameter.

## Approach 6: return Result objects or throw exceptions from the domain layer

Instead of returning an error object, the domain layer can return a result object, which contains either the data in the case of success or an error in the case of a failure.

```csharp

```

The problem with this approach is that it forces each layer to handle the result object, leading to a lot of `if` statements.

## Approach 7: throwing exceptions

Instead of returning a result object containing the error in the result of a failure, the domain layer can just throw specific exceptions in the case of an error.

```csharp

```

The problem with this approach is that if the application layer wants to translate the exception into a contextual error message, it has to use a `try/catch` block, which makes your code messy.

The advantage is that the exceptions can bubble up to the top without having to be handled in every layer, as the result objects do.
