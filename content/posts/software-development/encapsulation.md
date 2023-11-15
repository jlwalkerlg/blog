---
title: "Encapsulation"
date: "2020-08-22T17:30:00Z"
categories:
  - Software Development
tags:
  - domain driven design
  - object oriented programming
---

Encapsulation is one of the four pillars of object-oriented programming, along with abstraction, inheritance and polymorphism. The idea is to restrict access to an object’s internal state through the use of access modifiers, and only allow access through public-facing methods. By doing so, we are able to enforce certain rules as to how the state of our objects can be manipulated, while also keeping our code DRY.

Assume we are writing an application for managing university students, as well as their enrolled courses, grades, and so on. We may model this with a Student class and a list of `Course` objects.

```csharp
public class Student
{
    public List<Course> Courses { get; set; } = new();
}
```

To enrol a student in a course, we would add the relevant course to the student’s list of courses.

```csharp
student.Courses.Add(course);
```

Now let’s imagine we have a requirement which states that students must not enrol in more than 5 courses. Further, each course is worth a certain number of credits, and each student is only allowed up to 40 credits from their enrolled courses.

In DDD, these rules are known as **invariants**. The business (in this case a university) has rules regarding a student’s enrolments, and so we should enforce these in our code.

Before enrolling the student in a course, we therefore need to perform the necessary checks.

```csharp
if (student.Courses.Count >= 5)
{
    throw new Exception("Too many courses!");
}

if (student.Courses.Sum(x => x.Credits) > 40)
{
    throw new Exception("Too many credits!");
}

student.Courses.Add(course);
```

While this works, the problem is that the logic required to enrol a student in a course is separate from the data it acts upon, and so the internal state of `Student` is necessarily public. As such, there is no way to guarantee that all operations on the `Student` leave the data in a consistent and valid state: it’s relatively easy for a developer to forget to enforce these checks when developing a new feature, for example, thereby introducing a bug elsewhere in the application by violating the `Student`‘s invariants. Good programming is about reducing the surface area for bugs to occur, and so we should want to make it hard or impossible to make such mistakes.

We can do so by hiding the `Student`‘s internal state and moving the logic into the `Student` class itself.

```csharp
public class Student
{
    private List<Course> courses = new();
    public IReadOnlyList<Course> Courses => courses.ToList();

    public void Enrol(Course course)
    {
        if (courses.Count >= 5)
        {
            throw new Exception("Too many courses!");
        }

        if (courses.Sum(x => x.Credits) > 40)
        {
            throw new Exception("Too many credits!");
        }

        courses.Add(course);
    }
}
```

_This is the essence of encapsulation: bundling data and operations together_. Notice how by doing so we have made it all but impossible, from outside of the `Student` class, to mistakenly enrol a student in more courses than are allowed.

Furthermore, we have made the code DRY by wrapping all of this logic behind a simple interface in the form of the public `Enrol` method call.

```csharp
student.Enrol(course);
```

That is, the `Student` provides a nice abstraction by exposing behaviour rather than mere state. This not only makes calling code cleaner, but also means that if the business rules change so that students can now enrol in up to 6 courses, there is only one place in the application we would need to update in order to enforce this new requirement.

All-in-all, encapsulation helps to keep code DRY, more robust, and helps adhere to the single responsibility principle by maintaining appropriate levels of abstraction.
