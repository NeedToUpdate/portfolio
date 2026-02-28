---
title: "Data Warehousing & Infrastructure Rebuild"
techs: ["aws", "python", "redshift", "serverless", "splunk"]
impact: "Cut data delivery from a month to a day across 150+ daily extracts and 5 external companies."
priority: 2
category: data
---

A large insurer was running 150+ daily data extracts across 5 external companies with no central warehouse, no governance, and a one-month lag on data delivery.

We rebuilt the infrastructure from the ground up. Custom ETL on AWS Redshift, full IFRS17 audit logging, dynamic validation rules that business users control themselves, and automated quarantine for bad data. Data that took a month to deliver now arrives in a day.
