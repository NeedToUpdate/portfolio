---
title: "Data Warehousing & Infrastructure Rebuild"
techs: ["aws", "python", "redshift", "serverless", "splunk"]
impact: "Cut data delivery from a month to a day across 150+ daily extracts and 5 external companies."
priority: 2
category: data
role: "Led architecture and delivery"
context:
  - term: "Client"
    value: "Large insurer"
  - term: "Scale"
    value: "150+ daily extracts, 5 external companies"
  - term: "Environment"
    value: "IFRS 17 audit requirements"
---

## The problem

A large insurer ran more than 150 daily data extracts across five external companies, with no central warehouse, no governance, and a month-long lag before data was usable.

## The solution

We rebuilt the infrastructure from the ground up: custom ETL on AWS Redshift, full IFRS 17 audit logging, and validation rules the business controls themselves instead of filing a ticket to change. Bad data gets quarantined automatically instead of corrupting a report downstream.

## The result

Data that took a month to deliver now arrives in a day, across all 150+ extracts and all five companies.
