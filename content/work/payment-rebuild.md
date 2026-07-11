---
title: "Enterprise Payment Integration"
date: "2025-01-01"
techs: ["aws", "python", "serverless", "legacy"]
impact: "Stabilized a high-risk claims payment workflow that had been failing monthly and costing millions in outage impact."
priority: 5
category: payments
role: "Led architecture, controls, and delivery"
diagram: "/images/enterprise-payment-integration.svg"
diagramAlt: "Multiple payment sources flow through normalization, payment controls, bank processing, receipt handling, and reconciliation."
context:
  - term: "Client"
    value: "Large insurer"
  - term: "Scope"
    value: "Multi-system claim payment batches"
  - term: "Integration"
    value: "Banking system"
  - term: "Reliability"
    value: "99.99% uptime"
---

## The problem

Claim payment batches arrived from multiple legacy systems. Each source had its own rules, format, and timing. Some sent full files. Others sent delta files.

The existing payment pipeline could break on a small format issue, a mistimed file, or an unexpected source-system change. It crashed monthly. Outage impact ran into the millions.

The business needed a payment process that could tolerate imperfect inputs without losing control over the money flow.

## The stakes

Payment failures affected members and the insurer.

When claim payments failed, members could receive benefits late or not receive them at all. When billing-side payment flows failed, the insurer could miss charges and lose income.

The workflow also had banking and compliance pressure. Payments needed duplicate checks, holiday handling, retry behavior, and proof that the amount sent matched the amount received.

## The constraints

The work had to connect legacy systems, payment batch formats, and a banking system. The inputs included the same kinds of file problems seen elsewhere: CSV, text, Excel, JSONL, timing issues, and inconsistent structure.

The process needed idempotency. The system had to know when it had already seen a payment and prevent duplicate sends.

The data also needed encryption in transit and at rest. A payment workflow cannot rely on informal repair after something reaches the bank.

## The solution

I led the architecture and delivery of a payment workflow that normalized every source before money moved.

A Python Glue job converts each source into a standard internal format. The normalization layer accepts file variation and gave the team a place to add handling for new failure cases as they appeared.

The normalized output triggers a serverless Glue workflow. That workflow checks duplicates, holidays, and correctness before anything reaches the banking system. Duplicate protection uses composite payment keys and payment data such as date, recipient, and amount.

If the bank is closed for a holiday, the workflow pauses and resumes the next business day. Retry behavior protects the workflow from common file and timing issues without sending the same payment twice.

After the bank processes the file, it returns a receipt. The reconciliation step compares the source input, the intermediate output, and the bank receipt. The result surfaces as a report.

## Decision points

| Decision | Options | Why this path |
| --- | --- | --- |
| Normalize first | Process each source directly or standardize inputs | Normalization absorbed format issues before the payment workflow ran. |
| Duplicate control | Trust source systems or calculate payment identity | Composite keys reduced duplicate-payment risk across inconsistent source files. |
| Holiday handling | Fail the run or pause for the next business day | Pausing protected the workflow without forcing manual rebuilds. |
| Reconciliation | Trust the bank receipt or compare every stage | Comparing input, intermediate output, and receipt proved that money sent matched money processed. |

## Rollout

The new workflow ran beside the old payment process before cutover. That parallel run gave the business a way to compare outputs before trusting the new path.

Bank receipts came back as text files. The team used them to validate the reconciliation report and confirm that the bank processed what the workflow sent.

The business signed off before the new workflow became the primary payment path.

## The result

The payment workflow now runs at 99.99% uptime.

The previous process failed monthly. The new process gives the insurer a controlled payment path with same-day end-of-day reconciliation.

Every payment can be traced from source file to normalized output to bank receipt.

## What this proves

This project shows that I can stabilize a high-risk financial workflow without hiding complexity behind manual support.

The work required architecture, controls, payment traceability, retry design, and business signoff. It turned a fragile monthly failure point into an auditable payment process.
