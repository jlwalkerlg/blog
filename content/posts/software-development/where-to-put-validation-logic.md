---
title: "Where to Put Validation Logic"
date: "2023-11-11T16:35:00Z"
categories:
  - Software Development
tags:
  - domain driven design
  - software architecture
  - the clean architecture
---

The first thing to recognise is that user-friendly validation messages are a concern purely of good user experience.

In fact, the best user experience is one in which the user can’t even perform an action if it’s going to fail. The button to perform such an action should be disabled or hidden, if possible.

But it’s not always possible to know whether or not a user action will be invalid. For example, when a user registers, it’s not possible to know from the UI whether or not the email they’ve entered is already registered.

As such, some errors must be raised on the back end, especially those that are central to the business logic, which should be raised or at least validated by the domain layer.

The problem is that as we move further away from the UI and closer to the domain later, we lose sight of the user’s original context. This is especially true of validation errors that relate to a particular form field in the UI, as it becomes harder to map the error messages back to those individual fields.

One approach is to pull all those validation checks up into the application layer, even if has to call into the domain layer to actually run validation logic. That way, the application layer still has most of the user’s context and can map those error messages to the fields in the request. However, this fragments the domain’s business/validation logic across the application layer, and may in some cases not even be feasible if that validation logic is buried deep in the domain layer where it’s inaccessible to the application layer. Furthermore, this approach leads to a lot of duplication, because the domain layer will often still want to run those validations itself to protect its business invariants.

Another approach is to just let the domain layer run all of those validations itself and throw some kind of DomainValidationException with a user-friendly error message that gets displayed in the UI. But again, much of the user’s contextual information is often lost by this point, so the error messages are often not that helpful, and can’t easily be mapped to specific form fields in the UI.

The best approach seems to be somewhere in between. The domain layer throws exceptions with user-friendly error messages where possible in response to failed validation, and the UI displays those messages on the screen. This provides a decent baseline where the user at least gets some helpful information about what went wrong. Then, where those validation messages are particularly unhelpful thanks to a lack of context, or there’s a strong preference to map those error messages to specific fields in the UI, the application layer can call into the domain to run the validation logic and generate its own validation messages in the case of an error. For simple input validation, like checking if an email field is a valid email address, it can even run the validation logic without calling into the domain layer at all.
