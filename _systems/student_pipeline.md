---
title: "Enrollment & Claims Processing"
techs: ["AWS Lambda", "S3", "CloudFront", "Python", "TypeScript", "Glue"]
impact: "Automated enrollment and claims processing for 1M+ users, handling millions in claims monthly."
priority: 1
category: infrastructure
---
This system was designed to **streamline insurance enrollment and claims processing** for a large-scale provider. Built entirely on **AWS serverless architecture**, it integrates multiple components:

- **Admin & User Portals**: A TypeScript-based web platform for both admin and customer interactions.
- **Data Pipeline**: A robust, Python-based pipeline using **AWS Glue** for ETL processes.
- **Scalability**: Handles **millions of claims per month**, leveraging **multi-AZ failover** and **disaster recovery**.
- **Security & Compliance**: Integrated **CloudTrail, SonarQube, and Snyk** to meet strict security requirements.

The result? **Massive efficiency improvements, reducing manual processing times and ensuring scalability for future growth.**
