---
title: "Manually Cancelling Async Delays in .NET Core"
date: "2021-10-05T20:27:00Z"
categories:
  - Software Development
---

`Task.Delay(TimeSpan duration, CancellationToken cancellationToken)` allows you to asynchronously wait for a certain duration before continuing. Sometimes, however, we want to manually cancel the delay before the duration is up. For example, if we're using the outbox pattern for distributed messaging processing, we might poll the database with a delay between each read, but if we know a new message has been added to the database, we want to cancel the delay and process it immediately.

A nice way of doing this is to use `SemaphoreSlim`. We initialise an instance with an initial count of 0. To simulate the delay, we wait to enter the semaphore for the specified duration, so that once the duration is up we continue processing whether or not we successfully entered. If we never release the semaphore, this effectively acts the same as Task.Delay() and we always wait for the full duration.

When we want to cancel the delay, we simply release the semaphore so that the thread waiting to enter it can do so immediately, and in doing so decrease the semaphore's `CurrentCount` property back to 0, so that the next time we try to enter it, we're blocked until the count is increased by another call to release the semaphore.

Note that the semaphore might be released more times than it is entered, and so the current count might increase above 1. This would nullify the delay since the semaphore could be entered immediately the next time it is awaited. To prevent this, we limit the count to 1 and sink any `SemaphoreFullException` thrown when we release the semaphore.

Full code to demonstrate is below.

```csharp
public class Program
{
    private static readonly CancellableDelayer awaiter = new();

    public static async Task Main(string[] args)
    {
        var cancellationTokenSource = new CancellationTokenSource();

        System.Console.WriteLine("Press enter to manually cancel the delay.");
        System.Console.WriteLine("Press any other key to stop the program.");
        System.Console.WriteLine();

        var task = Loop(cancellationTokenSource.Token);

        var key = System.Console.ReadKey();
        while (key.Key == ConsoleKey.Enter)
        {
            awaiter.Wake();
            key = System.Console.ReadKey();
        }

        try
        {
            cancellationTokenSource.Cancel();
            await task;
        }
        catch (OperationCanceledException)
        {
        }
    }

    private static async Task Loop(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            await awaiter.Delay(TimeSpan.FromSeconds(5), cancellationToken);
        }
    }
}

public class CancellableDelayer : IDisposable
{
    private readonly SemaphoreSlim semaphore = new(0, 1);

    public async Task Delay(TimeSpan duration, CancellationToken cancellationToken)
    {
        System.Console.WriteLine($"Waiting for {duration.TotalSeconds} seconds.");

        var entered = await semaphore.WaitAsync(duration, cancellationToken);

        if (entered)
        {
            System.Console.WriteLine("Delay was manually cancelled.");
        }
        else
        {
            System.Console.WriteLine("Delayed for full duration.");
        }
    }

    public void Wake()
    {
        try
        {
            semaphore.Release();
        }
        catch (SemaphoreFullException)
        {
        }
    }

    public void Dispose()
    {
        semaphore.Dispose();
    }
}
```
