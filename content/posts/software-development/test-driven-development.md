---
title: "Test Driven Development"
date: "2024-02-12T18:48:04Z"
categories:
  - Software Development
tags:
  - unit-testing
  - tdd
---

## What's the point of automated testing?

The point in automated testing is to have a way to quickly and easily catch regression errors while developing, and to ensure your code is still working before deploying.

This gives developers the confidence to refactor existing code, which in turn results in more well-designed software.

It also gives developers more confidence in adding new features without breaking existing functionality, thereby increasing development speed.

## What's the point of TDD?

The above points are true of automated testing whether the tests are written before _or after_ the product code.

So, what's the benefit of writing the tests first?

- It confirms that our tests are actually working because we see them first go red before going green. Never trust a test you haven't seen fail!
- It helps us think about the acceptance criteria and how we actually want the feature to work rather than trying to figure it out as we go
- It makes sure we don't write more code than is necessary to satisfy the acceptance criteria (and therefore the tests)
- It forces us to actually write the tests (at all) and ensures that those tests cover all the edge cases. By testing last, we make it easy to forget about testing some of the edge cases we thought about while writing the production code
- It ensures we write the production code with testability (and therefore modularity) in mind. By testing last, we could end up writing production code that is difficult to test
- It provides a faster feedback cycle while developing

## The TDD process

Kent Beck writes about the TDD process in his post on [Canon TDD](https://tidyfirst.substack.com/p/canon-tdd), where he summarises the process as follows:

1. Write a list of the test scenarios you want to cover
1. Turn exactly one item on the list into an actual, concrete, runnable test
1. Change the code to make the test (& all previous tests) pass (adding items to the list as you discover them)
1. Optionally refactor to improve the implementation design
1. Until the list is empty, go back to #2

When choosing the next item from the list to turn into a runnable test, choose the most simple one, such that we slowly build the production code one step at a time without jumping the gun and over-engineering the solution.

It's also important to remember that a lot of the design happens during the refactoring step, because it's at this point that the code is already working and you have a full view of the solution, which therefore gives you a better idea of how to design it (which patterns to apply, etc). If you try to come up with a design without knowing the solution, you can end up over-engineering it.

## Outside-in vs inside-out

Is it better to start with tests against the outside of the application (e.g., the web API) and slowly work inwards towards test that are more narrow in scope (e.g., against a single class/module), or work the other way around (inside-out).

Actually, it's better to stay on the outside as much as possible and test against the same API that's used by the end user (e.g., the web API). If you're building an HTTP API, then that means testing the HTTP requests and responses; if you're building a library, then it means testing against the library's public surface area.

Anything else limits our ability to refactor by coupling the tests to the implementation details, and also provides less guarantees that our software is working from the end user's perspective, which is the whole point of automated testing.

For example, if we decide to test input validation by writing tests directly against some validator class, we're locking ourselves in to using that validator class such that we can't later choose to refactor our code and do validation a different way. Futher, we're not even ensuring that the validator class is actually being used -- it might not even be wired up properly in the dependency injection container.

Instead, we should test input validation by hitting the external API, where the input is actually provided. This way, we can change how input validation works as much as we want, and our tests will still work, because this way they don't care about _how_ it works, only that it does.

We should only drop down to testing the inner workings of our applications in order to help us develop some complicated logic or module (if necessary). Even then, such tests can (and maybe should) be deleted afterwards so that they don't block our ability to refactor later.

## Unit tests vs integration tests

Unit tests can be defined as tests that run in isolation from other tests, and can therefore run in parallel without affecting each other.

Integration tests can be defined as those that aren't isolated from other tests and therefore can't run in parallel without affecting each other. (Usually this is because they access a shared resource such as a database.)

It's important to note the unit tests can run against the external API, just like integration tests. (For example, `.NET Core` provides a `WebApplicationFactory` that allows us to spin an in-memory web application suitable for unit testing.) The difference between them is not necessarily how they invoke the sut, it's that unit tests substitute real system components with fake implementations to allow them to run in parallel with affcting each other, whereas integration tests don't.

As such, integration tests provide the strongest guarantees that your software is working as expected from the end user's perspective, because they run against real system components.

However, this makes integration tests slower than unit tests, and so developers don't get the rapid feedback necessary to allow for efficient TDD cycles. (Deployment pipelines are also much slower if those pipelines execute the integration tests.)

Therefore, integration tests alone aren't ideal for TDD, or to cover all the edge cases of complex business logic.

Instead, we need to find the right balance between unit tests that run fast but provide less confidence in the system as a whole and integration tests that run slow but provide _more_ confidence in the system as a whole.

The right balance depends on the specifics of each project and how complex the business logic is.

For simple CRUD APIs without much business logic, there probably isn't much business logic that needs covering with tests, and most of the logic is probably just reading from and writing to the database. As such it's probably better in such cases to have a higher percentage of integration tests than in enterprise applications.

For enterprise applications, there's usually a lot of complex business logic to test, and testing each edge case or scenario with integration tests would be impractical because they're too slow. As such, in these cases unit tests should be preferred to cover most of the business logic, and integration tests should be used more sparingly to verify the application's integration with external dependencies.

Remember that the main purpose of integration tests is to verify that the application integrates correctly with external dependencies (e.g., a database), whereas the main purpose of unit tests to verify that the business logic works correctly. If there's no external dependencies involved in a particular test case, then there's no reason to use an integration test -- it would be better just to use a unit test because they're faster.

One suggestion is to write one integration test that covers the most complex/important happy path per feature (and/or hits the most external dependencies), and write unit tests that cover all the other scenarios and edge cases of each feature.

We might also use integration tests for scenarios that can't be unit tested, for example if the outputs and side effects of the sut are only visible to some external system (e.g., the database).

## End-to-end tests

If integration tests provide more confidence in the system as a whole because they involve real system components, then what about end-to-end tests, which invoke the sut exactly as an end user would (e.g., through the UI)?

End-to-end tests are the best in terms of confirming the system works as expected from the end user's perspective. However, they're too difficult to write and too slow to build a practical test suite around.

Furthermore, testing through the UI is very brittle because the UI changes so often for reasons that don't need to be tested (UI changes rather than logic changes).

As such, try to integration test at a level at which it's easier to write tests, and against a stable API, such as a web API (rather than the UI that uses it).

## When and how to mock

To mock a dependency is to swap out a real implementation (such as a SQL database) for a fake one (such as an in-memory database). This is not to be confused with a [particular type of test double](https://blog.cleancoder.com/uncle-bob/2014/05/14/TheLittleMocker.html), called a mock.

But what should we mock in unit tests, and what should we mock in integration tests?

In both integration tests and unit tests, we should always mock out volatile dependencies that we don't control. For example, third-party APIs should always be mocked out because they're volatile (e.g., they could be temporarily unavailable) and usually can't be easily controlled (e.g., to reset/initialise between each test), and therefore make our tests unreliable and prone to failure, even when our own code is working correctly.

In unit tests, we should also mock any dependency that we do own but can't isolate per test, like a database or a file system.

However, in integration tests, we shouldn't mock out these dependencies because the whole point in integration tests is to include such components. Instead, we should just run our integration tests one-by-one and make sure to reset any external dependencies to a clean state _before_ each test (not after, since the tear down could fail to run or might not even be called).

In any case, any test doubles that we introduce should be pushed as far as possible to the edges of our system, so that we test as much of our own logic as possible. This requires that we write our own gateways through which we interact with external dependencies, such that we can easily mock them out.

We should never mock code that we own because by doing so we couple our tests to the implementation details of our system (white box testing) rather than its external API (black box testing), and therefore limit our ability to refactor its internals. Remember that code can be written in many different ways, and tests should allow for that without breaking. Hence, they should not enforce _how_ the code works, only the observable outcomes.

## Mocks vs spies/stubs

When substituting external dependencies for test doubles, we can choose to replace them with mocks, or any other type of test double. So which ones should we choose?

Mocks are usually configured dynamically using some kind of mocking library. The problem with this is that such libraries usually have a significant learning curve and the code is usually very ugly and bloats our test cases with complicated arrange/assert steps.

Further, because they're configured dynamically in each test case, any change to the interface that we're mocking requires that we update all the places that we've configured a corresponding mock.

Instead, we can write our own custom test doubles such as spies and stubs to replace external dependencies. These are easy to write, easy to configure, have more explicit assertions, are more easily reusable, and easier to update if the implemented interface changes, because we just have to update it in one place -- the test double class itself.

## Setting up tests via the front door vs the back door

An example of setting up a test through the back door would be by directly inserting records into the database. On the other hand, setting up a test through the front door would involve invoking the sut itself via its external API in order to put it into the desired state (for example, by sending a POST request to a HTTP API, then sending a GET request to verify the results).

We should set up our tests through the front door as much as possible rather than through the back door, because going through the back door means the tests have intimate knowledge of how the system is implemented and therefore couples our tests to its implementation details.

## Refactoring our tests

We should aim to keep our tests as clean as possible. This means we should refactor them to reduce duplication by extracting common arrange and assert logic.

For example, we might extract common arrange steps into a constructor, a private method, or a base class, and we might use the builder pattern to fluidly and cleanly create domain objects with have sensible defaults that don't break happy paths but can be easily overridden if required for testing other scenarios.

We might also extract command assertions into reusable functions, or extensions methods in `.NET`.

Each test should only include the details that are relevant to that particular test. For example, if its important that a user has a valid name, but the exact name we choose doesn't matter, then the exact name we choose shouldn't be visible in the test, otherwise it will seem like it's important. Instead, we should extract the creation of the user into an abstraction that configures the user with a valid name, and only explicitly configure the properties of the user that are actually relevant to the test.

## Naming test methods

The name of each test method should be a concise sentence that describes exactly what behaviour is being tested by the test. If a test fails, it should be possible to know immediately exactly what behaviour is broken and why it broke, just by looking at the name of the test, without digging into the details of what the test does.

The behaviour under test must therefore be narrow enough in scope such that it can be described by a single sentence (the test's name). This helps to decide how much to test, since a sentence can only be so descriptive, which therefore helps to keep each test focused on a small piece of behaviour.

A good convention is to start each test method with the word "should". For example:

```csharp
public class CustomerLookupTest : TestCase
{
  ShouldFindCustomerById()
  {
    ...
  }

  ShouldFailForDuplicateCustomers()
  {
    ...
  }
  ...
}
```

[agiledox](http://agiledox.sourceforge.net/) would then print out something like this:

```text
CustomerLookup
- should find customer by id
- should fail for duplicate customers
- ...
```

## What to assert

Each test should assert just enough to ensure that the behaviour under test is working, as described by its name.

Prefer more tests to cover additional behaviours rather than writing more asserts within the same test.

Use the test's name as guidance on what to assert.

## Deleting irrelevant tests

It's perfectly acceptable to delete tests that have broken because they're testing behaviour that's no longer relevant (due to changing requirements).

Any new behaviour should already be covered by tests, as per TDD.

## Extending the API for testing

Don't extend the public API of the sut or expose its internals (thus breaking encapsulation) just write tests against it, otherwise you're coupling your tests to the implementation details. Instead, just test the existing public API via whatever observable outputs and/or side effects it produces.

Likewise, don't make a project's internals visible to the test suite -- just test the sut project's public surface area.

## Testing anti-patterns

Testing anti-patterns:

- [Extending the API for testing](#extending-the-api-for-testing)
- Duplicating the sut's implementation into tests
- Code pollution (e.g., adding code to the production code solely for testing purposes, or adding boolean flags like `isTestEnvironment` -- instead, use dependency inversion and swap the implementations at run time in the tests)
- Non-deterministic tests (e.g., using the system clock directly)

## Summary

- Test through the external API as much as possible
- Write at least one integration per feature to cover the most complex/important happy path, and write unit tests to cover all other scenarios and edge cases
- Use descriptive names for your test methods that describe the specific behaviour being tested, and use those names to help you decide what to assert
- Refactor your tests to keep them clean, and only include the details that are relevant to the particular behaviour that's under test
- Prefer custom-written stubs and spies over mocking libraries, and only use test doubles at the edges of your system
- Delete irrelevant tests

## Resources

- [Martin Thwaites talk on TDD](https://youtu.be/prLRI3VEVq4?si=bf_EAYLlb1wc75e9)
- [Vladimir Khorikov course on Pluralsight](https://www.pluralsight.com/courses/pragmatic-unit-testing)
- [Kent Beck post on Canon TDD](https://tidyfirst.substack.com/p/canon-tdd)
- [Dan North post on BDD](https://dannorth.net/introducing-bdd/)
- [Andrzej Nowik post on unit testing](https://www.linkedin.com/pulse/unit-tests-from-waste-asset-andrzej-nowik/)
