---
title: "Tableau Integration"
techs: ["tableau", "aws", "redshift", "python", "ec2"]
impact: "Tableau, fully automated as infrastructure as code. Business teams get real-time analytics on demand."
priority: 5
category: reporting
---

Tableau deployments are usually manual, undocumented, and tied to whoever set them up.

We wrote the entire environment as infrastructure as code. One Serverless Framework file deploys everything: EC2 behind a load balancer, private VPC, role-based access controls, and a direct connection to the Redshift data warehouse. The whole setup is version controlled and can be redeployed from scratch. Business teams get real-time access to the data they need without filing a report request. IT gets an environment they can actually maintain.
