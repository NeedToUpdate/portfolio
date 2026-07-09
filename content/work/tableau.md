---
title: "Tableau Integration"
techs: ["tableau", "aws", "redshift", "python", "ec2"]
impact: "Tableau, fully automated as infrastructure as code. Business teams get real-time analytics on demand."
priority: 5
category: reporting
role: "Designed and automated the environment"
context:
  - term: "Client"
    value: "Large insurer"
  - term: "Scope"
    value: "Tableau on AWS, as code"
  - term: "Warehouse"
    value: "Redshift, direct connection"
---

## The problem

Tableau deployments are usually manual, undocumented, and tied to whoever happened to set them up. This one was no different, and it was becoming a maintenance risk.

## The solution

We wrote the entire environment as infrastructure as code. One Serverless Framework file deploys everything: EC2 behind a load balancer, a private VPC, role-based access controls, and a direct connection to the Redshift warehouse. The whole setup is version controlled and can be redeployed from scratch.

## The result

Business teams get real-time access to the data they need without filing a report request. IT gets an environment it can actually maintain.
