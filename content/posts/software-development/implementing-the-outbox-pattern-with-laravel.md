---
title: "Implementing the Outbox Pattern With Laravel"
date: "2021-07-13T10:10:00Z"
categories:
  - Software Development
tags:
  - event driven architecture
  - software architecture
  - messaging
  - microservices
---

_Source code available on GitHub at https://github.com/jlwalkerlg/laravel-outbox-pattern-demo_

Laravel's event system makes it simple to implement [the outbox pattern]({{% siteurl "/posts/software-development/the-outbox-pattern/" %}}) and deal with failures in processing side effects.

A common scenario when registering a new user in a web application is sending them a confirmation or a welcome message via email.

In Laravel, events are a great way to decouple side effects, such as sending a confirmation email, from the workflow that actually triggers them, such as the registration process.

In Laravel, a naïve implementation might look like the following.

```php
// app/Http/Controllers/RegisterUserController.php

class RegisterUserController extends Controller
{
    public function __invoke(RegisterUserRequest $request)
    {
        $user = new User($request->validated());
        $user->save();
        event(new UserRegisteredEvent($user));

        return response()->json($user, 201);
    }
}
```

```php
// app/Listeners/SendUserRegisteredConfirmationEmailListener.php

class SendUserRegisteredConfirmationEmailListener
{
    public function handle(UserRegisteredEvent $event)
    {
        Mail::to($event->user->email)
            ->send(new UserRegisteredConfirmationEmail($event->user));
    }
}
```

```php
// app/Providers/EventServiceProvider.php

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        UserRegisteredEvent::class => [
            SendUserRegisteredConfirmationEmailListener::class,
        ],
    ];
}
```

The problem here is that, if an exception is throw in send the confirmation email, a new user will have been inserted into the database but the email will never be sent. Other scenarios might have more severe consequences, such as failing to collect payment or dispatch a product after a user places an order.

Ideally, we’d like both operations — inserting a new user into the database and sending the email — to be atomic, so that they either both succeed, or both fail. However, since the database and the email service run in different processes, they can’t share a transaction and we can’t guarantee atomicity, even if go through the trouble of implementing two-phase commits.

What we can do, however, is insert the event into the database along with the user in a single database transaction, and dispatch the event in a background process. This way, if the email fails to send for whatever reason, at least the event is not lost and can be retried later either manually or through some automatic retry mechanism.

Thankfully, Laravel makes it easy to queue events so they are saved to the database first before the relevant event listeners process them in the background.

First, make sure that the `QUEUE_CONNECTION` environment variable is set to database.

```
# .env

...
QUEUE_CONNECTION=database
...
```

Next, ensure that any event listeners whose work should be queued implement the `Illuminate\Contracts\Queue\ShouldQueue` interface. Note that any listeners not implementing this interface will still receive the event for processing immediately.

```php
use Illuminate\Contracts\Queue\ShouldQueue;

class SendUserRegisteredConfirmationEmailListener implements ShouldQueue
{
    public function handle(UserRegisteredEvent $event)
    {
        Mail::to($event->user->email)
            ->send(new UserRegisteredConfirmationEmail($event->user));
    }
}
```

Finally, wrap any operations that should be atomic in a database transaction.

```php
class RegisterUserController extends Controller
{
    public function __invoke(RegisterUserRequest $request)
    {
        DB::beginTransaction();

        $user = new User($request->validated());
        $user->save();
        event(new UserRegisteredEvent($user));

        DB::commit();

        return response()->json($user, 201);
    }
}
```

With this, the `UserRegisteredEvent` event is queued before it is dispatched to `SendUserRegisteredConfirmationEmailListener` and so if an exception is throw in sending the email, it is still saved in the database and can be retried later.

If the database transaction fails to commit, neither will the user be inserted into the database nor the event — the two actions are atomic, as we wanted.
