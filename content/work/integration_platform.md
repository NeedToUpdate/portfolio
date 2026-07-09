---
title: "Unified Cloud Architecture"
techs: ["azure", "microservices", "iac"]
impact: "Built the case from the engineering team to the board. They approved an eight-person in-house build."
priority: 8
category: infrastructure
role: "Proposed the architecture; built the board case"
context:
  - term: "Client"
    value: "Enterprise client"
  - term: "Scope"
    value: "Integration layer, enterprise-wide"
  - term: "Decision"
    value: "Build vs buy"
---

## The problem

The business was ready to buy a SaaS product to patch a gap in the integration layer. That would have added another vendor, another contract, and another system that didn't talk to anything else.

## The solution

I proposed something larger: one compute architecture instead of a bolt-on product. One language across the stack, containerized, cloud-native, and deployed entirely through infrastructure as code. Every service built the same way means observability, security, and operations all run from a single layer instead of one per vendor.

## The result

I built the case and took it to the board myself. They approved an eight-person in-house build instead of the SaaS purchase.
