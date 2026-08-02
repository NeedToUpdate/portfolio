---
title: "Customer Billing Portal Rebuild"
date: "2026-06-01"
techs: ["nextjs", "azure", "typescript", "legacy"]
keywords:
  [
    "billing portal rebuild",
    "legacy modernization",
    "platform cost reduction",
    "salesforce experience cloud migration",
    "in-house engineering",
  ]
impact: "Rebuilt a per-login licensed billing portal in-house in three months. Platform cost fell more than 90%."
priority: 1
category: payments
role: "Led engineering, architecture, and delivery"
diagram: "/images/billing-portal-rebuild.svg"
diagramAlt: "A customer uses a containerized Next.js portal on Azure App Service with billing and service sections. A thin owned integration layer connects it to the unchanged legacy CRM and billing system. A dashed boundary marks end-to-end tracing flowing into App Insights."
context:
  - term: "Client"
    value: "Large Canadian home services company"
  - term: "Scale"
    value: "250K monthly active users"
  - term: "Timeline"
    value: "3 months to production"
  - term: "Cost"
    value: "Platform spend down 90%+"
comments:
  - question: "How do you migrate 250,000 users without them noticing?"
    answer: "Run both systems at once and make observability the center of the plan. Feature flags moved customers over in percentage steps, and every step had a monitoring gate: if the dashboards were not green, nobody else moved."
  - question: "What did AI actually change about how your team builds software?"
    answer: "AI wrote most of the code, so the real work became human review. We sat down with the devs for hours and read every line like a book, because with AI-generated code there are lines nobody has actually seen before. Writing code is now the cheap part. Knowing what to build, and reading what was built, is the skill."
  - question: "When do you pay off tech debt, and when do you default on it?"
    answer: "Stop looking at the system as code and look at it as a product. Our portal was three languages and thousands of uncommented lines, but the product underneath was simple: pay your bills, see your invoices. The code and the product are two sides of the same coin."
---

## The problem

A large Canadian home services company ran its customer billing portal on Salesforce Experience Cloud. An external consulting firm built it, handed it over, and moved on. No developers remained who knew the system. Documentation was thin. Nobody could explain the system's behavior, so everyone treated it as a requirement.

The platform charged per login, so the bill tracked usage and ran to six figures a year. Even small changes required specialist Salesforce developers, and improvements moved slowly or not at all.

Customers felt it. Updating the credit card behind a pre-authorized payment took 16 clicks and forced customers to cancel the plan and re-enroll. Poor error handling and vague user messaging turned small problems into support calls.

## The stakes

Nearly a million customers depended on the portal for their billing. Any change put payments at risk. Leaving the system alone guaranteed the cost.

The licensing bill grew with the business. Every new customer login added platform spend. The company paid enterprise rates for a portal it could not safely change and did not control.

Leadership had wanted off the platform for years. What was missing was a team that could land the exit without breaking billing for the customer base.

## The constraints

The CRM and the billing system stayed. Both ran the wider business and were not moving. The new portal had to work with them, not around them.

The old portal's behavior was the only specification, and it was unreliable. Edge cases lived in work-item backlogs and old incident reports rather than documentation. The team had to rediscover what the billing experience actually did before rebuilding it.

The scope was contested. Stakeholders weighed patching the legacy routes, deferring the migration, and redefining what billing should include. Holding a clear direction through that debate took steady communication while the team kept building.

Business as usual did not pause. The same people delivered two scheduled production releases and daily support while the rebuild ran.

## The solution

I led the engineering team: onshore and offshore developers and QA. Product ran beside us with its own analysts and product owner. Neither side reported to the other. We worked hand in hand and pushed back on each other, and the product got better every time we did.

The rebuild started with requirements, not code. Nobody accepted "this is how it always worked" as a specification. Product and engineering revalidated every flow before anyone wrote code. QA dug through the old system's behavior and found 87 edge cases that became test scenarios.

The delivery took four months. The external firm had taken nine to reach the state we replaced.

The new portal runs on Next.js with a thin orchestration layer behind it. We created small, reusable services to sit in front of the legacy CRM and billing system. The portal never touches the legacy systems directly, and other teams now use the same services.

AI tools accelerated the implementation. Human review controlled it. The team reserved at least four hours every week for code review and spent more time reviewing code than writing it.

Observability shipped with the design. Every request carries a trace from the browser down to the legacy systems. Every failure mode has its own error code. Traces and logs flow through OpenTelemetry into dashboards and alerts, so the team sees which system failed before a support ticket exists.

## Rollout

The rollout ran the old and new portals at the same time. Customers moved to the new experience gradually. Feature flags controlled who saw it, traffic ramped up in percentage steps, and a beta program ran ahead of each increase. Monitoring gates had to stay green before more customers came over, and at any point the team could route customers back to the old portal.

The preparation showed in the numbers. QA built 428 test cases before launch. An external vendor ran a penetration test and found zero vulnerabilities.

The scale of the migration made the outcome notable. A portal serving 250,000 monthly active users moved to an entirely new platform, and only 14 customers ever saw an error. Each of those 14 surfaced on a dashboard with an error code and a full trace, so the team diagnosed every one without asking a single customer what happened. The release needed no emergency hotfix, no rerelease, and caused no major incident.

## The result

The migration reached the full customer base. The portal serves 250,000 active customers a month.

The team did not rebuild the old portal one to one. It rebuilt the experience, added features the old portal never had, and deleted legacy logic nobody needed. Changing a credit card on your account takes 7 clicks instead of 16, without cancelling and re-enrolling. THe customers now saw a more comprehensive view of their account. A whole class of underlying errors disappeared with the old platform.

Platform cost fell by more than 90%. The per-login bill ended with the old portal.

The company now owns the system. The team that built it monitors it and ships changes without specialist licensing or vendor dependency.

## What this proves

The business had needed to leave its portal platform for years. The case predated me. My job was to make it real: hold a clear direction through contested scope debates, lead engineering in step with product through a three-month build, and land the change on the full customer base without an incident.

It also shows how I run delivery in the AI era. Implementation moved fast because AI tools carried the typing while the team spent its judgment on requirements and review. The speed came from ownership and review discipline, not shortcuts.
