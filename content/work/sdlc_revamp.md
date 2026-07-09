---
title: "SDLC & Deployment Automation"
techs: ["azure", "azure-pipelines", "azure-functions", "azure-b2c", "capacitor"]
impact: "Cut deployment time from a week to four hours, bug to production."
priority: 7
category: infrastructure
role: "Led the modernization"
context:
  - term: "Client"
    value: "Home-services and energy provider"
  - term: "Scope"
    value: "Web and mobile platform"
---

## The problem

A small internal team had built and maintained the platform with no branching strategy and manual deployments. There was no clear path from a reported bug to a fix in production.

## The solution

We automated the deployment pipeline on Azure Pipelines and introduced a structured branching strategy, so the team had a repeatable process instead of tribal knowledge. On the product side, we rebuilt the frontend mobile-first and packaged it as a native app with Capacitor, so the web and mobile experience share a single codebase.

## The result

Time from bug identification to fix in production dropped from a week to four hours.
