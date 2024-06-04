---
title: "Optimistic Concurrency With EF Core"
date: "2022-02-23T20:02:00Z"
categories:
  - Software Development
tags:
  - ef-core
---

## Problem

Imagine a scenario within e-commerce where an order can be either accepted by an admin or cancelled by the user who submitted the order. If the order has already been accepted, it can't be cancelled; if it has already been cancelled, it can't be accepted.

If user tries to cancel the order at the same time as the admin tries to accept it, there should be some mechanism that prevents them from doing so.

Our Order entity might look like the following.

```csharp
public class Order
{
    public int Id { get; set; }
    public string Status { get; set; } = "Ordered";

    public void Accept()
    {
        if (Status is "Cancelled")
        {
            throw new Exception("Can't accept an order that's already been cancelled.");
        }

        Status = "Accepted";
    }

    public void Cancel()
    {
        if (Status is "Accepted")
        {
            throw new Exception("Can't cancel an order that's already been accepted.");
        }

        Status = "Cancelled";
    }
}
```

Now consider the following scenario where the user tries to cancel the order at the same time as the admin tries to accept it.

```csharp
using var adminContext = new OrderingDbContext();
var orderToAccept = await adminContext.Orders!.FirstAsync();

using var customerContext = new OrderingDbContext();
var orderToCancel = await customerContext.Orders!.FirstAsync();

orderToAccept.Accept();
await adminContext.SaveChangesAsync();

orderToCancel.Cancel();
await customerContext.SaveChangesAsync();
```

1. Admin loads the order from the database.
1. User loads the order from the database.
1. Admin accepts the order and saves the changes to the database.
1. User cancel the order and saves the changes to the database.

Since the user had already loaded the order into memory before the admin saved their changes to the database, the status of the order for the user was still "Ordered", and so they were able to cancel it without issue, even though the admin's changes were eventually saved to the database before the user's were.

## Solution

EF Core allows us to use concurrency tokens to handle these kind of concurrency issues.

A concurrency token is a property on your entity. When EF Core updates an entity in the database that has a concurrency token configured, it ensures the UPDATE SQL statement only updates the row where both the primary key and the concurrency token match the values that the entity had when it was read from the database. That way, if the concurrency token has changed in the meantime, no rows will be updated, and EF Core will throw a `Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException`.

If we want to guard against concurrency issues on every update to an entity (i.e. the entity can only be updated by one user at a time), then a simple way to enforce this is to use a property that is automatically updated on every write as the concurrency token.

EF Core makes this simple. First, let's update our `Order` model to include a `RowVersion` property that will be updated automatically.

```csharp
public class Order
{
    public int Id { get; set; }
    public string Status { get; set; } = "Ordered";
    public byte[]? RowVersion { get; set; }

    public void Accept()
    {
        if (Status is "Cancelled")
        {
            throw new Exception("Can't accept an order that's already been cancelled.");
        }

        Status = "Accepted";
    }

    public void Cancel()
    {
        if (Status is "Accepted")
        {
            throw new Exception("Can't cancel an order that's already been accepted.");
        }

        Status = "Cancelled";
    }
}
```

Next, lets configure the property to be automatically updated on each write, and also let EF Core know to treat it as a concurrency token.

```csharp
public class OrderingDbContext : DbContext
{
    public DbSet<Order>? Orders { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        var connectionString = new SqlConnectionStringBuilder
        {
            DataSource = "localhost",
            InitialCatalog = "Ordering",
            UserID = "sa",
            Password = "password",
        }.ConnectionString;

        optionsBuilder.UseSqlServer(connectionString);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Order>()
            .Property(o => o.RowVersion)
            .IsRowVersion();
    }
}
```

The `.IsRowVersion()` method is short-hand for `.ValueGeneratedOnAddOrUpdate()`, which ensures the property is automatically incremented on each write, and `.IsConcurrencyToken()`, which tells EF Core to treat it as a concurrency token.

Now, when the user writes their changes to the database when trying to cancel the order in step 4, EF Core generates the following SQL statement.

```sql
UPDATE [Orders] SET [Status] = @p0
WHERE [Id] = @p1 AND [RowVersion] = @p2;
```

Since the `RowVersion` changed when the admin accepted the order, there are no records in the database with the expected Id and `RowVersion`, and so the number of affected rows is 0. EF Core recognises this and throw a `Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException` with the message "The database operation was expected to affect 1 row(s), but actually affected 0 row(s); data may have been modified or deleted since entities were loaded."

For comparison, the SQL statement before configuring the concurrency token looked like the following.

```sql
UPDATE [Orders] SET [Status] = @p0
WHERE [Id] = @p1;
```
