---
title: "Tableau Integration & Automated Reporting"
techs: ["Tableau", "AWS EC2", "Python", "Redshift"]
impact: "Enabled real-time self-serve analytics, cutting reporting time from 1 month to minutes."
priority: 5
category: reporting
---
A **self-service reporting and analytics system** using **Tableau**, designed to integrate seamlessly with the **enterprise data warehouse**. Key components:

- **Tableau Deployment**: Hosted on **AWS EC2 behind a load balancer** in a **private VPC**.
- **Automated Data Pipeline**: Connected **directly to Redshift**, allowing real-time data access.
- **Enterprise-Grade Security**: Restricted access via **IAM roles and strict VPC policies**.

With this setup, business teams could **generate reports instantly** instead of waiting weeks for manual data processing.
