---
title: "Automated Reporting Suite"
techs: ["aws", "python", "redshift", "serverless", "glue"]
impact: "Replaced a month-long manual reporting process with on-demand, auditable reports."
priority: 6
category: reporting
role: "Led design; built the pipeline"
context:
  - term: "Client"
    value: "Regulated financial institution"
  - term: "Sources"
    value: "5 systems, 5 formats"
  - term: "Domain"
    value: "Financial close reporting"
---

## The problem

Finance received reports from five different systems in five different formats: CSV, line-delimited text, plain text, Excel, and JSONL. Turning that into one usable report took a person a month, with no audit trail if a number looked wrong.

## The solution

A Glue pipeline validates and normalizes all five formats into Parquet in S3. Validation rules live in CSV files the business can read themselves, not buried in code. Transformation logic is config as code: each transform is a real function, referenced by name in a JSON config, so anyone can open exactly the step that ran.

Files that fail validation go to quarantine instead of blocking the run. That triggers an alert and opens a side channel for an ad-hoc fix. Every run's workflow and metadata write back to Redshift, so the pipeline reports on its own performance.

## The result

Reporting moved from a month of manual work to on-demand and auditable. Finance can trace any number back to the rule that produced it.
