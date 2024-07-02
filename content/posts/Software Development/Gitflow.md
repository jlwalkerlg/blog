---
title: Gitflow
date: 2024-07-02T18:09:00+01:00
categories:
- Software Development
tags:
- devops
---

Gitflow is a git branching strategy used to coordinate the release of new features and bug fixes.

The develop branch serves as an integration branch for all features.

When a developer starts work on a new feature, they branch off of the develop branch to create a feature branch, named after the feature they're working on.

When work on the new feature is complete, and if the feature is planned as part of the next release, the feature branch is merged back into develop. If the feature is not planned as part of the next release, it should be kept separate to but up to date with the develop branch, until its ready to be merged in.

When all the features planned as part of the next release have been merged into develop, a new release branch is created by branching off of develop. At this point, no new features are merged into the release branch; only bug fixes are merged in. Any features planned as part of the next release can now be merged into develop, which should also be kept up to date with the release branch, since it might receive some additional commits for bug fixes.

The release branch is tested in a UAT environment to ensure it's ready for production. If not, bugs are fixed on separate, short-lived branches and merged back in.

When the release branch is ready to go to production, it's merged into the master branched and tagged with a release version number, before being deployed to production. It's also merged back into develop, since it might have had some big fixes in the meantime.

If a bug is found in production, a hotfix branch is created by branching directly off of the master branch, applying the fix, merging it back into master, tagging it with an updated version number, and deploying. In the meantime, the CI/CD pipeline should be able to rollback to the previous production release, while the hotfix is being applied (if necessary).

![Pasted image 20240702181929.png](..\..\Pasted%20image%2020240702181929.png)
