---
title: "Task-Based User Interfaces"
date: "2020-06-11T16:14:00Z"
categories:
  - Software Development
tags:
  - cqrs
  - domain driven design
---

Task-based user interfaces are essential for domain-driven design and [CQRS]({{% siteurl "/posts/software-development/cqrs/" %}}). Instead of presenting an interface consisting of data-oriented forms that allow the user to directly manipulate the data underlying the domain model in a nearly one-to-one correspondence with the database, as is typical with CRUD-based systems, task-based interfaces instead break each operation on the domain model down into separate tasks, and as such present a more behaviour-oriented, understandable interface to users.

## CRUD-based Interfaces

With a CRUD-based interface, communication between the client and application server works as follows. The user navigates to a screen to edit an inventory item, for example. The client subsequently requests a DTO from the application server representing the current state of the inventory item. The application loads the required domain objects from the database, maps them to a DTO, and sends it back to the client, which displays it on screen for the user to interact with. The user edits the customer data directly in some form, then click a button to save the inventory item and the client in turn sends the DTO back to the server, where the application maps the DTO back to domain objects and stores them in the database.

_The problem with this approach is that it is **impossible** to employ domain-driven design, because the architecture is entirely focused on the data_. All operations revolve around CRUD, and so the server must expose a data-oriented API. Consequently, the application must of necessity have the same interface. Likewise, the domain objects themselves must support generic, data-oriented CRUD operations on their state, and as such the whole domain model becomes anaemic and devoid of behaviour.

In fact, there can be very little, if any, business logic anywhere in the system, since besides input validation, the application is mostly concerned with mapping back-and-forth between DTOs and domain objects. Essentially, the application is just a glorified spreadsheet. Because the application is focused on the underlying data of the domain model, the only verbs which exist in the system are those of CRUD; there are no behaviour-driven semantics to be found. As such, any existing business rules exist mostly in the heads of the users using the system, who have to remember the steps/workflow required of them in order to implement some given business-related task.

For example, the graphic below shows a CRUD-based interface for deactivating an inventory item, wherein the user is presented with all the data that makes up the given inventory item. To deactivate it, they must manually change the "Status" to the appropriate option, remembering to provide a "Deactivation Comment."

![Inventory Item CRUD interface](/images/inventory-item-crud-interface.png)

This makes for a poor and confusing user experience. Firstly, far more data presented is than is needed for this use case, and so the interface is unnecessarily over-complicated. Secondly, the user must remember, or figure out, the steps required in order to achieve what they are trying to do — remembering to provide a comment when switching the status to "Deactivated", but not otherwise. Thirdly, the same screen is used for multiple tasks, including deactivating an item, increasing its stock, updating its name and description, and so on. As such, the intent of the user is completely lost.

Furthermore, the code required to support these interfaces often ends up convoluted and over-complicated, as it is not uncommon for the DTOs sent between client and server to carry arbitrarily large amounts of data. Any business rules regarding this data must be applied via validation logic, which is complicated by the fact that the DTO carries all possible state for the domain object in question. Certain data, however, may not be allowed when certain other pieces of data are present on the DTO, whereas other data may be required only in such circumstances, but optional in others. Essentially, too many business rules must be applied to the same generic DTO, and so the business rules, disguised as input validation logic, are convoluted and hard to understand. An example of this can be seen below, taken from a [Pluralsight course on CQRS](https://app.pluralsight.com/library/courses/cqrs-in-practice/) by [Vladimir Khorikov](https://enterprisecraftsmanship.com/), consisting of a student-management system.

```cs
[HttpPut("{id}")]
public IActionResult Update(long id, [FromBody] StudentDto dto)
{
    Student student = _studentRepository.GetById(id);
    if (student == null)
        return Error($"No student found for Id {id}");

    student.Name = dto.Name;
    student.Email = dto.Email;

    Enrollment firstEnrollment = student.FirstEnrollment;
    Enrollment secondEnrollment = student.SecondEnrollment;

    if (HasEnrollmentChanged(dto.Course1, dto.Course1Grade, firstEnrollment))
    {
        if (string.IsNullOrWhiteSpace(dto.Course1)) // Student disenrolls
        {
            if (string.IsNullOrWhiteSpace(dto.Course1DisenrollmentComment))
                return Error("Disenrollment comment is required");

            Enrollment enrollment = firstEnrollment;
            student.RemoveEnrollment(enrollment);
            student.AddDisenrollmentComment(enrollment, dto.Course1DisenrollmentComment);
        }

        if (string.IsNullOrWhiteSpace(dto.Course1Grade))
            return Error("Grade is required");

        Course course = _courseRepository.GetByName(dto.Course1);

        if (firstEnrollment == null)
        {
            // Student enrolls
            student.Enroll(course, Enum.Parse<Grade>(dto.Course1Grade));
        }
        else
        {
            // Student transfers
            firstEnrollment.Update(course, Enum.Parse<Grade>(dto.Course1Grade));
        }
    }

    if (HasEnrollmentChanged(dto.Course2, dto.Course2Grade, secondEnrollment))
    {
        if (string.IsNullOrWhiteSpace(dto.Course2)) // Student disenrolls
        {
            if (string.IsNullOrWhiteSpace(dto.Course2DisenrollmentComment))
                return Error("Disenrollment comment is required");

            Enrollment enrollment = secondEnrollment;
            student.RemoveEnrollment(enrollment);
            student.AddDisenrollmentComment(enrollment, dto.Course2DisenrollmentComment);
        }

        if (string.IsNullOrWhiteSpace(dto.Course2Grade))
            return Error("Grade is required");

        Course course = _courseRepository.GetByName(dto.Course2);

        if (secondEnrollment == null)
        {
            // Student enrolls
            student.Enroll(course, Enum.Parse<Grade>(dto.Course2Grade));
        }
        else
        {
            // Student transfers
            secondEnrollment.Update(course, Enum.Parse<Grade>(dto.Course2Grade));
        }
    }

    _unitOfWork.Commit();

    return Ok();
}
```

## Task-Based User Interfaces

In contrast, a task-based user interface focuses more on behaviour by breaking down the data-oriented interface into smaller tasks that operate upon the data, guide the users through the tasks they wish to accomplish, and so more successfully capture the intent of the users using the system. Client-server communication thus takes on more behaviour-driven semantics, and works as follows.

As before, the user navigates to a screen to edit the customer, the client requests a DTO from the application, and displays it on the screen. However, instead of the user being presented with an interface to directly manipulate the DTO, they are shown a screen that presents them with the options for accomplishing any business-related tasks they might want to perform for the given customer.

![Deactivate Inventory Item task-based interaface](/images/deactivate-inventory-item-task-based-interface.png)

To accomplish these tasks, instead of sending the new, modified state of the customer as a DTO to the application server, _the client sends commands telling the application to **do something**_, such as "complete a sale", "approve a purchase order", or "submit a loan application". The commands contain the data required to accomplish these tasks, and can be thought of as _**serialisable method calls** on the domain_, which describe the intent of the user far better than generic data-oriented operations.

The user no longer has to build a sold mental model of the underlying data in order to understand how to use the system, since the interface guides them through each task. The application exposes a behaviour-driven API to support the user interface, and the rest of the application uses the ubiquitous language of the domain experts, better describing the intent of each operation. The domain model becomes rich with meaning, as opposed to anaemic and devoid of behaviour. Each command is narrow in scope, and so the supporting code is more focused and less convoluted.

Note that some commands may indeed be typical CRUD operations, such as updating a user's personal information. However, it is important to be careful to ensure that the user intent is not lost, and if there are any behavioural business rules associated with such actions, they are captured by the semantics of the command.

## References

- [CQRS documents by Greg Young](https://cqrs.files.wordpress.com/2010/11/cqrs_documents.pdf)
- [Pluralsight course on CQRS by Vladimir Khorikov](https://app.pluralsight.com/library/courses/cqrs-in-practice/)
