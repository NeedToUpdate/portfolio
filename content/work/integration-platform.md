---
title: "Unified Cloud Architecture"
date: "2025-12-01"
techs: ["azure", "typescript", "iac", "containers"]
keywords: ["integration platform", "cloud integration platform", "cloud architecture", "infrastructure as code", "build vs buy"]
impact: "Turned an expensive SaaS purchase into board approval for an eight-person in-house cloud integration platform build."
priority: 3
category: infrastructure
role: "Built the target architecture and board case"
diagram: "/images/unified-cloud-architecture.svg"
diagramAlt: "A reusable Azure delivery platform combines a shared communication layer and cloud-native compute with infrastructure as code, security, logging, monitoring, and compliance standards."
context:
  - term: "Client"
    value: "Enterprise client"
  - term: "Scope"
    value: "Integration layer, enterprise-wide"
  - term: "Decision"
    value: "Build vs buy"
  - term: "Outcome"
    value: "Eight-person build approved"
---

## The problem

The business was ready to buy a SaaS product to patch a gap in the integration layer. The purchase would have added another vendor, another contract, and another disconnected system.

The annual cost sat in the six-to-seven-figure range. The larger issue was architectural. The company did not need another isolated product. It needed its own integration platform: a repeatable way to build and operate cloud-native services.

## The stakes

The board needed to decide whether to fund another vendor dependency or invest in internal delivery capacity.

Buying the SaaS product would have solved one narrow problem. Building a shared cloud architecture would let the company solve that problem and reuse the same pattern across future work: one communication layer, one security model, one logging and monitoring approach, and one release path.

That made the case bigger than one integration project. It became a decision about whether the company wanted to own its development capability.

## The constraints

The architecture had to be understandable at board level and credible to engineering. It had to fit the company's Azure direction and avoid a bespoke stack that only a few specialists could maintain.

The team also needed a simple hiring and delivery model. TypeScript gave the company one language across frontend, backend, and middleware work. Containerized services allowed the same compute model to run custom systems, internal apps, and middleware services.

The design had to include security, logging, monitoring, auditing, compliance, and infrastructure as code from the start. Those could not become one-off decisions per application.

## The solution

I proposed a shared cloud integration platform instead of a bolt-on SaaS purchase.

The model used a shared communication layer, cloud-native compute for services and applications, and infrastructure as code for repeatable deployment. The services shared the same operating layers: security, logging, monitoring, auditing, compliance, and enterprise standards.

This architecture let the company build the first integration need and reuse the same foundation for later work. It also gave the board a clearer investment story: fund a team and platform pattern once, then use that capability across many business problems.

## Decision points

| Decision | Options | Why this path |
| --- | --- | --- |
| Build vs buy | Buy a SaaS product or fund an internal build | The SaaS product solved one problem at high recurring cost. The internal build created a reusable delivery capability. |
| Language strategy | Split skills by layer or standardize on TypeScript | TypeScript reduced hiring complexity and let frontend, backend, and middleware work share a common skill base. |
| Compute model | Treat every app separately or define one cloud pattern | A shared compute pattern made security, logging, monitoring, and operations consistent. |
| Delivery model | Launch a large platform first or build in slices | The company could start with a few services, prove value, and expand the platform through real projects. |

## Rollout

I drove the approval work before the build started. The case translated the engineering direction into a board-level decision: fund an eight-person in-house team instead of buying the SaaS product.

The first slice focused on a few services that quickly became useful across multiple projects. That mattered because the platform did not have to wait for a large launch before showing value.

The company handled team structure and staffing after approval. The architecture gave that team a clear operating model to build against.

## The result

The board approved an eight-person in-house build instead of the SaaS purchase.

That decision redirected spend from a single vendor product into internal cloud-native delivery capacity. The investment let the company solve the original integration problem and expand into other areas that needed better uptime, monitoring, service management, and platform standards.

The outcome was not just approval for a project. It was approval for an operating direction.

## What this proves

This project shows that I can turn enterprise technical pain into a board-level investment decision.

The work required more than designing a cloud architecture. It required explaining why a reusable delivery platform was a better business decision than another disconnected product, then giving leadership a practical path to fund it.
