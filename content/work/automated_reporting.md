---
title: "Automated Financial Reporting Suite"
techs: ["aws", "python", "redshift", "serverless", "glue"]
impact: "Reduced month-close IFRS 17 reporting from a manual month-long process to an auditable run that completes in under 15 minutes."
priority: 4
category: reporting
role: "Led planning, architecture, delivery, and handoff"
diagram: "/images/automated-financial-reporting.svg"
context:
  - term: "Client"
    value: "Large Canadian insurer"
  - term: "Sources"
    value: "5 systems, 5 formats"
  - term: "Domain"
    value: "IFRS 17 month close"
  - term: "Run time"
    value: "Under 15 minutes"
---

## The problem

Finance analysts at a large Canadian insurer had to produce monthly IFRS 17 reporting from five source systems. Each system sent data in a different format: CSV, line-delimited text, plain text, Excel, and JSONL.

The process consumed a full month of team effort. By the time the team finished one reporting cycle, the next cycle was already starting. When a number looked wrong, the team had no clean audit path back to the rule, source file, or transformation that produced it. The fix became manual: side-loaded data, new Excel workbooks, and long reconciliation meetings with more than fifteen people in the room.

The hardest part was not moving files. The hard part was turning business-owned finance rules into something the system could run and the governance team could still read.

## The stakes

The output fed month-close posting for IFRS 17 reporting. Finance analysts used the result, then sent it to an IFRS 17 third party.

That made traceability a business requirement. If a number changed, finance needed to explain where it came from. Governance needed to see which rule ran. The delivery team needed a clear path from the reported number back to the source, rule, and transformation.

The process also carried C-SOX-style control expectations. The system needed evidence, repeatability, and a clear support path.

## The constraints

The inputs came from five systems with five file formats. The pipeline had to run on a timed schedule. A failed file could not block every other source, because daily misses could still be repaired before month-close posting.

The validation rules had to work for governance and finance, not just the technical team. The transformation layer had to stay readable after handoff. The plan also had to fit the existing warehouse and reporting environment.

## The solution

I led a team that designed and delivered a Glue-based reporting pipeline. It validates and normalizes every source into Parquet in S3. The workflow cleans up intermediate files, applies the required transformations, and produces the month-close output finance needs.

Validation rules live in CSV files. The files list human-readable rule names that map directly to the functions running against each column. Governance and finance could review the rules in a format they understood, while the technical implementation stayed controlled and traceable.

Transformation logic follows the same idea. A JSON config references real Python functions by name. The team can inspect the config, open the referenced function, and see exactly what a step does. That made the requirements inspectable from both sides: finance could read the rule names, and the delivery team could verify the behavior that executed them.

Files that fail validation go to quarantine instead of blocking the full run. The workflow alerts the team and opens a controlled repair path. Every run writes workflow metadata back to the warehouse, so the pipeline reports on its own performance.

## Decision points

| Decision | Options | Why this path |
| --- | --- | --- |
| Validation rules | Hide rules in code or expose them in CSV | Governance already worked in Excel. CSV gave them a readable control surface without moving the true logic out of controlled implementation. |
| Transform design | Write one-off scripts or reference functions from config | Function references made the process easier to inspect, change, and hand off. |
| Failure handling | Fail the full run or quarantine bad files | Quarantine let clean sources continue while the team repaired bad inputs before month close. |
| Audit trail | Log failures only or record every run | Full run metadata gave finance and support a path from output back to source and rule. |

## Rollout

The new pipeline ran beside the manual process for a month. Finance used reusable Excel workbooks and pivot tables to reconcile the new output against the existing process.

That parallel run mattered. It gave finance confidence in the numbers before the manual workflow went away. It also exposed the support cases the runbook needed to cover after launch.

The technical team supported the system after release. Governance and finance shared ownership of the business rules.

## The result

The reporting run now completes in under 15 minutes. Finance no longer spends the full month assembling and reconciling the output by hand.

When a number needs review, the team can trace it through the source data, the validation rule, the transform, and the run metadata. Manual reconciliation issues became very rare.

The final output supports month-close posting and flows to the IFRS 17 team and third party.

## What this proves

This project was not only a data pipeline. It required planning the operating model around IFRS 17, insurance finance, governance review, and month-close support.

I led discovery, architecture, delivery planning, stakeholder workshops, production support, and handoff over eight months. The result gave finance a process they could run, governance a process they could review, and the technical team a system they could maintain.
