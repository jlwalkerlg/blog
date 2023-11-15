---
title: "Best Practices for Exceptions"
date: "2021-10-03T08:18:00Z"
Categories:
  - Software Development
---

Consider the following:

```csharp
try
{
    await DoSomethingAsync(cancellationToken);
}
catch (Exception ex)
{
    logger.LogError(ex, "Something went wrong.");
}
```

In some cases the exception thrown is completely expected, such as an `OperationCancelledException`. In this case, it's not really an error, and so logging it as such only clutters and obscures your logs. This can be solved by ignoring the exceptions you expect to be thrown in certain circumstances:

```csharp
try
{
    await DoSomethingAsync(cancellationToken);
}
catch (Exception ex) when (ex is not OperationCancelledException)
{
    logger.LogError(ex, "Something went wrong.");
}
```

In other cases, you might attempt to recover from any exception, including unexpected ones:

```csharp
try
{
    var user = await GetUserById(id);
    return user;
}
catch (Exception ex)
{
    return null;
}
```

In this case, the exception might be something unexpected that really needs to be caught and logged further up the call stack as it might signify something wrong with the database. This can be solved by specifying which exceptions you can recover from, and letting the rest bubble up:

```csharp
try
{
    var user = await GetUserById(id);
    return user;
}
catch (UserNotFoundException ex)
{
    return null;
}
```

The bottom line is that we should always try to be as specific as possible when catching exceptions. If you expect an exception to be thrown **_and_** you can recover from it, catch it. Otherwise, let it bubble up the call stack, perhaps to some global exception handler, and be logged there.
