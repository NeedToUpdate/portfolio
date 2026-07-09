---
title: "Enterprise Payment Integration"
techs: ["aws", "python", "serverless", "legacy"]
impact: "Replaced a crash-prone payment pipeline with one that runs at 99.99% uptime."
priority: 3
category: payments
role: "Led design and delivery"
context:
  - term: "Client"
    value: "Insurance provider"
  - term: "Scope"
    value: "Multi-system claim payment batches"
  - term: "Integration"
    value: "Banking system"
---

## The problem

Batched claim payments arrived from different systems, each with its own rules: some sent delta files, some sent full files, each on its own schedule. The pipeline stitching them together crashed monthly, with outage costs running into the millions.

## The solution

A Python Glue job normalizes every source into one format. That triggers a serverless Glue workflow that checks for duplicates, holidays, and correctness before anything reaches the banking system. Once the bank returns a receipt, an automatic reconciliation compares the input, the intermediate output, and the receipt, and surfaces the result as a report.

## The result

The pipeline runs at 99.99% uptime, with every payment traceable from source file to bank receipt.
