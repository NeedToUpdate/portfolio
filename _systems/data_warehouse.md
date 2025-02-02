---
title: "Data Warehousing & Infrastructure Rebuild"
techs: ["aws", "python", "redshift", "serverless", "splunk"]
impact: "Built an enterprise data warehouse handling 150+ daily data extracts, cutting data delivery time from 1 month to 1 day."
priority: 2
category: data
---

A major **enterprise data warehouse rebuild**, designed to **streamline ingestion, transformation, and reporting** for a very large insurance client. The system included:

- **Data Ingestion**: Integrated with 5 external companies, processing 150+ daily data extracts.
- **ETL Pipeline**: A custom AWS Glue-based ETL process with full compliance auditing and logging for IFRS17 reporting.
- **Validation Engine**: A flexible validation system that allowed business users to modify data rules dynamically.
- **SQL-Based ETL Engine**: Optimized for AWS Redshift, allowing rapid data mart generation.
- **Data Quarantine & Automated Fixes**: Implemented a quarantine process for bad data, enabling automated correction workflows.
- **Data Quality & Governance**: Established a quality and validation framework, integrated stale data detection, and implemented enhanced PII protection.
- **Faster Insights**: Reduced data request time from weeks to a day.

This system transformed the company’s ability to deliver data on-demand, drastically improving efficiency, transparency, and allowed data-driven decisions.
