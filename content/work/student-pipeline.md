---
title: "Million-Student Enrollment Processing Pipeline"
date: "2023-12-01"
techs: ["aws", "typescript", "python", "serverless", "splunk"]
keywords: ["student pipeline", "enrollment processing", "student data pipeline", "SFTP integration", "reconciliation workflow"]
impact: "Rebuilt the student enrollment pipeline to remove a week-long manual delay for 1M+ students."
priority: 6
category: infrastructure
role: "Led architecture and delivery"
diagram: "/images/enrollment-processing-system.svg"
diagramAlt: "Monthly SFTP enrollment files flow through state reconciliation, controlled manual changes, nightly delta generation, TPA delivery, and monitoring."
context:
  - term: "Client"
    value: "Insurance provider"
  - term: "Scale"
    value: "1M+ students per cycle"
  - term: "Cadence"
    value: "Monthly enrollment files"
  - term: "Integration"
    value: "SFTP to TPA"
---

## The problem

Student enrollment files arrived over SFTP as a mix of full and delta CSVs. The files drove insurance enrollment and coverage changes for more than a million students per cycle.

The manual process took about a week. The team loaded student files, reconciled changes, adjusted text files, and prepared updates for the TPA. During that period, enrollment changes waited.

That delay created real business risk. Late or incorrect coverage changes could block members from enrollment or prevent claims.

## The stakes

The work affected insurance access for a large student population.

The business needed faster processing, but speed alone was not enough. The process also needed proof that the right student records changed and that the TPA received the correct delta.

The team also needed a support path. Bad files, wrong delimiters, and unexpected formats could not turn every monthly cycle into a manual investigation.

## The constraints

The source files did not arrive in one clean format. Some files represented a full population. Others represented only changes. Some files had data-quality issues.

The target system needed a delta file, one line per student, sent to the TPA. The process also needed to support manual corrections when the business had a valid exception.

The operating requirement was simple: process enrollment changes as soon as possible, with enough transparency for the business and support teams to trust the result.

## The solution

I led the architecture and delivery of an enrollment-processing workflow that rebuilt current state from each monthly file cycle, then calculated the actual changes.

An AWS Glue job picks up the full and delta files from SFTP and reconciles them against a database. That stored state gave the team a baseline for comparing new files against known enrollment and coverage records.

The workflow separates student-record changes from coverage changes, then prepares a change report. A nightly job turns approved changes into a TPA delta file with one line per student.

An admin portal sits on top of the database so the team can make controlled manual changes when the business needs them. Monitoring and Splunk alerts make failed runs visible instead of leaving support teams to find issues after the fact.

## Decision points

| Decision | Options | Why this path |
| --- | --- | --- |
| State management | Treat each file as final or reconcile against stored state | Stored state let the team combine full and delta inputs and calculate the real change set. |
| Output model | Send full files or send only deltas | Delta output matched the TPA requirement and reduced the chance of duplicate updates. |
| Manual changes | Keep file edits outside the system or add an admin path | The admin portal gave the business a controlled way to handle exceptions without hand-editing text files. |
| Run visibility | Rely on manual checking or alert on run status | Monitoring gave support teams a faster way to spot file, format, and processing issues. |

## Rollout

The team compared automated outputs with manual outputs during rollout. That gave the business confidence that the new delta file matched what the old process would have produced.

Business users signed off before the workflow became the standard path to the TPA.

## The result

The week-long manual enrollment delay is gone.

Enrollment changes for more than a million students now process through an automated workflow. Normal runs complete within about an hour. Manual reconciliation issues became very rare once the process settled.

The business gained a traceable path from source file to student state to TPA delta.

## What this proves

This project shows that I can turn brittle reconciliation work into a controlled student enrollment pipeline for 1M+ people.

The work required judgment around state, exceptions, business signoff, and operational support. The result changed how enrollment work ran every cycle.
