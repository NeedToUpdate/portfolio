---
title: "Enrollment Processing System"
techs: ["aws", "typescript", "python", "serverless", "splunk"]
impact: "Automated enrollment and claims processing for 1M+ users."
priority: 1
category: infrastructure
---

Two major insurance companies needed an integration to create a fully automated enrolment and claims processing system to handle over 1 million students. The entire system was built **serverless on AWS**, leveraging:

- **Admin & User Portals**: A TypeScript-based frontend for both admin and customer interactions.
- **Data Pipeline**: A Python-driven ETL process using AWS Glue.
- **High Availability**: Designed with multi-AZ failover, disaster recovery, and auto-scaling.
- **Security & Compliance**: Integrated CloudTrail, SonarQube, and Snyk for enterprise security.

The result was a fully automated, scalable solution that streamlined claims processing and drastically reduced manual workload. This increased customer satisfaction and massively reduced resource costs.
