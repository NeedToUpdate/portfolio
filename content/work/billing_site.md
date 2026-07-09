---
title: "Billing & Payment Processing System"
techs: ["aws", "typescript", "python", "serverless"]
impact: "Moved billing updates out of the call center and into the hands of the customer."
priority: 3
category: payments
role: "Built end to end, on a short timeline"
context:
  - term: "Client"
    value: "Major insurance provider"
  - term: "Compliance"
    value: "PCI, via Moneris"
---

## The problem

Every billing update went through the call center. A member changing a card meant a phone call to a support agent, and this project landed with almost no lead time to build anything elaborate.

## The solution

A minimal, fast-turnaround site. Members log in with their insurance information, which loads a secure Moneris iframe, so billing details never touch our servers. Moneris stores the payment method and fires an event carrying the member's payment ID to the TPA that processes billing on the insurer's side. An enrollment database refreshes continuously, so a member's record is current the moment they log in.

## The result

Billing updates moved out of the call center and into a self-service form the member controls. Support volume dropped with it.
