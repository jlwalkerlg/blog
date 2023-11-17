---
title: "Error Handling in DDD 2"
date: "2023-11-16T17:48:32Z"
draft: false
categories:
  - Software Development
tags:
  - domain driven design
  - software architecture
  - the clean architecture
---

## Where should we raise errors? (ui, controllers, application layer, domain layer)

- domain layer should at least contain the business logic to enforce the business rules
- exceptions can be made for simple crud-related validations, such as validating that an email is a valid email, since it's usually easier to map them back to specific fields in the request if the application layer handles them
- but for core business rules, the domain layer should be the the one to actually implement that logic
- nevertheless, the application layer may want to handle any errors related to core business logic so that it can generate contextual error messages for the user, and/or map any error messages back to specific fields on the request
- how can the domain layer contain the business logic to enforce the business rules while the application layer actually translates the errors into responses?

## How should we raise errors? (exceptions vs result object)

1. throw exceptions
1. try execute pattern (return Result objects)
1. can execute pattern (return error objects)

### Throw exceptions

Throw exception from the domain layer

```csharp
Subscription subscription = _subscriptionService.Subscribe(user, product);
```

Pros:

- Can be left to bubble up without requiring an `if` statement in every layer

Cons:

- Performance
- Handling them rather than letting them bubble up requires messy `try/catch` blocks

### Try execute pattern

<!-- TODO: in a separate post, show how this would work elegantly for a web request -->

Return `Result` objects from the domain layer

```csharp
Result<Subscription> result = _subscriptionService.Subscribe(user, product);

if (!result)
{
    // handle error
}
```

Pros:

- More performant than using exceptions
- More elegant to handle them in case of errors using `if` statements than handling exceptions with `try/catch` blocks if not letting them bubble up
- Extracting all potential errors into a static class makes your code very expressive

Cons:

- Every layer has to handle the `Result` objects explicitly (they don't bubble up like exceptions)

### Can execute pattern

Return error objects from separate `Can___` methods in the domain layer, otherwise fall back to exceptions.

```csharp
var error = _subscriptionService.CanExecute(user, product);

if (error is not null)
{
    // handle error
}

Subscription subscription = _subscriptionService.Subscribe(user, product);
```

Pros:

- More performant than using exceptions
- More elegant to handle them in case of errors using `if` statements than handling exceptions with `try/catch` blocks if not letting them bubble up
- Extracting all potential errors into a static class makes your code very expressive

Cons:

- Every layer has to handle the `Error` objects explicitly (they don't bubble up like exceptions)
- Code is duplicated because the domain layer still has to enforce the business rules and therefore run the same checks

## How not to raise errors

1. Pull business logic up into application layer
1. Return error messages from domain layer (can execute pattern) -- can't include context from application layer
1. Return error codes from domain layer (can execute pattern) -- can't include complementary values to generate the error messages
1. Return error messages/codes/objects from domain layer (try execute pattern) -- can't return an actual value
