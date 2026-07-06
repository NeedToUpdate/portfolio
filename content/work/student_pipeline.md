---
title: "Enrollment Processing System"
techs: ["aws", "typescript", "python", "serverless", "splunk"]
impact: "Eliminated a week-long manual blackout period for 1M+ student enrollments."
priority: 1
category: infrastructure
---

Enrolling over a million students into insurance coverage required a week-long blackout period every cycle. The process was manual, the system was effectively down, and errors were common.

We built a Python ETL pipeline connecting the data broker directly to the insurance providers. Enrollment now runs automatically. The blackout period still exists. Now it's used for quality assurance.
