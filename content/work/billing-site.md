---
title: "Billing & Payment Processing System"
date: "2024-08-01"
techs: ["aws", "typescript", "python", "serverless"]
impact: "Delivered a self-service billing update flow for a 50k-member insurance program in three weeks, moving routine card changes out of the call center."
priority: 7
category: payments
role: "Led delivery under a three-week deadline"
diagram: "/images/billing-payment-processing.svg"
diagramAlt: "A member uses a self-service billing site, validates against enrollment data, enters payment details inside Moneris, and sends a payment reference to the TPA billing system. Support remains as a fallback path."
context:
  - term: "Client"
    value: "Large Canadian insurer"
  - term: "Scale"
    value: "50k-member program"
  - term: "Compliance"
    value: "PCI, via Moneris"
  - term: "Timeline"
    value: "3 weeks to production"
---

## The problem

Every billing update went through the call center. A member changing a card had to call a support agent, wait for the request to be handled, and depend on a back-office process to move the update into the billing system.

The requirement arrived late, with three weeks from requirements to production. That deadline ruled out a broad member portal or a large billing rebuild. The system needed to solve one high-friction workflow without creating a new payment-handling risk.

## The stakes

The insurer needed to move payment updates out of support without exposing card data to the application. Members needed a direct path to update billing details.

The payment step still needed a clean PCI boundary. The application could identify the member and coordinate the update, while Moneris handled card entry.

## The constraints

The three-week timeline forced a narrow design. The experience had to be small enough to release quickly, clear enough to test, and controlled enough to pass PCI review.

The system also depended on current enrollment data. If a member logged in with stale eligibility information, the billing update could route to the wrong place or fail after the member entered payment details.

The downstream billing process lived with a TPA. The new system had to deliver the payment identifier and member context to that TPA without slowing the member down.

## The solution

I led delivery of a focused self-service billing site built for the deadline. Members authenticate with insurance-specific information, including member identifiers and date of birth. The site checks a continuously refreshed enrollment database before it opens the payment step.

The payment step loads a Moneris iframe. Card details stay inside Moneris and never touch the application servers. Moneris stores the payment method and returns the payment identifier needed for downstream billing.

That identifier starts an event-based workflow. The workflow packages the member context and payment reference, then sends the update to the TPA that handles billing for the insurer.

## Decision points

| Decision | Options | Why this path |
| --- | --- | --- |
| Scope | Build a full portal or a narrow billing update flow | The deadline was three weeks. A narrow flow solved the immediate support burden without opening a larger product scope. |
| Payment handling | Process card data directly or use Moneris iframe | Moneris kept card data inside the PCI provider boundary and out of the application. |
| Member validation | Allow broad account creation or verify insurance-specific details | Insurance-specific identity checks reduced account risk and matched the available member data. |
| Downstream handoff | Batch updates later or trigger an event workflow | The event workflow delivered the payment reference to the TPA near instantly. |

## Rollout

The system moved through dev, QA, and production in the three-week window using the existing infrastructure-as-code release process.

PCI and security review focused on the payment boundary. The application handled member lookup and workflow coordination. Moneris handled card entry and storage.

Support could confirm successful updates in the TPA portal after the workflow completed.

## The result

Billing updates moved out of the call center and into a self-service flow the member controls.

For eligible members, the update happens near instantly. Moneris stores the payment method, and the workflow sends the payment reference to the TPA.

The call center no longer had to be the primary path for routine card updates.

## What this proves

This project shows the value of choosing the narrowest responsible system under a hard deadline.

I led a delivery path that balanced speed, member experience, downstream billing integration, PCI review, and production release discipline. The result removed the call center from routine billing updates and gave members a direct path to manage their own payment details within three weeks of the requirement landing.
