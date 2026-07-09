---
title: "Enrollment Processing System"
techs: ["aws", "typescript", "python", "serverless", "splunk"]
impact: "Eliminated a week-long manual blackout period for 1M+ student enrollments."
priority: 1
category: infrastructure
role: "Lead engineer, end to end"
context:
  - term: "Client"
    value: "Insurance provider"
  - term: "Scale"
    value: "1M+ students per cycle"
  - term: "Integration"
    value: "Data broker to TPA"
---

## The problem

Student enrollment files arrived on SFTP as a mix of full and delta CSVs, feeding coverage for more than a million students. Turning that into accurate changes for the TPA meant a week-long manual blackout every cycle: no enrollment changes could process while the team reconciled everything by hand.

## The solution

A Glue job picks up every file and reconciles it against a database to detect what actually changed, both user records and coverage. A second nightly Glue job builds a change report and converts it into a delta file, one line per student, and sends it to the TPA. Every run is monitorable, with alerting on failure.

## The result

The week-long blackout is gone. More than a million students' enrollment changes process automatically instead of by hand.
