---
title: "What's the difference between business rules and input validation?"
date: "2024-05-30T14:49:50+01:00"
categories:
  - Software Development
tags:
  - domain driven design
---

Input validation ensures that the inputs to the application from the external world are sound, and that the data is formatted correctly. These validation rules are obvious and universal -- they're not specific to any one business. For example, validating that a percentage value is between 0 and 100, or that an email field has a particular pattern, is not business-specific; these rules are universal, and are applicable in any domain.

Business rules, on the other hand, are specific to the business and the domain. They're not obvious or universal like input validation rules. For example, one business rule might be that a customer can't purchase more items for a particular product than the number of items in stock. This is not necessarily obvious, as some business might prefer to sell stock they don't yet have and just fulfil the demand for more stock after those orders have been placed.

Input validation belongs in the application layer; business rules are enforced by the domain layer.
