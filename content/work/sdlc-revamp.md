---
title: "SDLC & Deployment Automation"
date: "2025-09-01"
techs: ["azure", "azure-pipelines", "iac", "powershell"]
keywords: ["SDLC", "deployment automation", "release management", "CI/CD pipeline", "DevOps"]
impact: "Modernized the SDLC to cut deployment time from a week to four hours, bug to production."
priority: 2
category: infrastructure
role: "Led release-process modernization"
diagram: "/images/sdlc-deployment-automation.svg"
diagramAlt: "A release branch builds once, then promotes the same artifact through SIT, UAT, preproduction, and production, with application support managing later environments."
context:
  - term: "Client"
    value: "Home-services and energy provider"
  - term: "Scope"
    value: "Customer web platform"
  - term: "Scale"
    value: "1M-customer website"
  - term: "Release"
    value: "Build once, promote upward"
---

## The problem

A small internal team maintained a customer web platform with no clear release path. Deployments relied on manual scripts, copy-paste steps, file uploads, and tribal knowledge.

There was no consistent branching strategy. Multiple projects could collide. A bug fix could take a week to reach production because the team had to navigate manual deployment work before the change could ship.

## The stakes

This was a million-customer website. Slow deployment blocked everything: bug fixes, configuration changes, small enhancements, and urgent production repairs.

Manual deployment also created business risk. The wrong files could move. Configuration variables could drift. A release could contain the wrong code.

The business needed a release process the team could trust.

## The constraints

The platform already existed. The team needed a repeatable release process without stopping delivery for a large rewrite.

The process had to support simultaneous projects. It also had to separate development-team work from app-support-managed environment promotion.

Azure Pipelines fit company policy, so the solution had to work inside that toolchain.

## The solution

I led the SDLC and release-process modernization around Azure Pipelines and a structured branching model.

The team released from a release branch. The pipeline built the artifact once, tagged it with a build ID, and promoted that same artifact through the environments. The tag linked the deployed build to the release ticket and the user stories included in the release.

That changed the process from manual movement of files to a traceable release path. Development managed feature work and release preparation. App support managed the later environment promotion path into production.

After production release, the release branch merged back into main so the source of truth matched what went live.

## Decision points

| Decision | Options | Why this path |
| --- | --- | --- |
| Branching model | Let teams deploy from active branches or release from a controlled branch | Release branches let multiple projects move at once without blocking each other. |
| Build strategy | Build separately per environment or build once | Building once made the promoted artifact traceable across SIT, UAT, preprod, and prod. |
| Tooling | Create custom deployment tooling or use Azure Pipelines | Azure Pipelines matched company policy and gave the team a supported release path. |
| Ownership | Let developers push every environment or split responsibilities | Developers owned development flow. App support owned controlled promotion into production. |

## Rollout

The team adopted the branching model quickly because it matched how they already thought about feature work and releases.

I supported the change with documentation and a deployment process diagram. The diagram made the handoff clear: development team ownership on the left, app-support-managed promotion on the right.

Production releases included post-production validation. The release artifact carried a build ID, ticket reference, container or package identifier, environment, and linked stories.

## The result

Time from bug identification to production dropped from a week to four hours.

The team moved to roughly two releases per month. Defects stayed very low. Rollback became a one-click option, though the team never had to use it.

Developers owned the process after handoff. The release path no longer depended on manual file movement or one person's memory.

## What this proves

This project shows that delivery speed comes from process design, not tooling alone.

I changed the operating model around branching, artifacts, environment promotion, release evidence, and production validation. The result gave the team a repeatable path from reported bug to production fix.
