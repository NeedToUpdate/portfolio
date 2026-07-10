---
title: "Data Warehousing & Infrastructure Build"
techs: ["aws", "python", "redshift", "serverless", "splunk"]
impact: "Gave a major insurer control over its data landscape across 150+ daily extracts and 5 external companies."
priority: 1
category: data
role: "Spearheaded architecture and multi-year delivery"
diagram: "/images/data-warehouse-architecture.svg"
diagramAlt: "Source files flow through data ingestion, a landing zone, ETL systems, a layered data lake, metadata monitoring, reporting, and user outputs."
context:
  - term: "Client"
    value: "Major insurance client"
  - term: "Scale"
    value: "150+ daily extracts, 5 external companies"
  - term: "Environment"
    value: "Enterprise data platform"
  - term: "Outcome"
    value: "360-degree data view"
---

## The problem

A major insurer depended on more than 150 daily data extracts across five external companies. The data arrived in different formats, mainly CSV, with some JSONL, TXT, and Excel files.

The company had no central warehouse and no governed data model. Data lived in disconnected extracts, vendor handoffs, and local reporting processes. It could take months before data became usable for broad analysis.

That meant the organization did not really control its own data. Teams could not rely on a shared view of customers, partners, products, and operations. Many decisions happened without trusted data because the data foundation did not exist.

## The stakes

This was not a reporting cleanup. It was an enterprise data-control problem.

Many teams depended on the same fragmented data landscape. Without a central governed platform, the business could not build consistent analytics, inspect quality at scale, or make broad data-driven decisions.

The insurer also needed evidence that the platform was complete and reliable. A third-party quality and completeness audit later reviewed the platform and passed it.

## The constraints

The platform had to ingest more than 150 daily extracts from five external companies. It had to support CSV, JSONL, TXT, and Excel inputs. It also had to protect internal insurance data with encryption in transit and at rest.

There was no existing warehouse to migrate from. The team had to build the platform piece by piece while the business continued operating.

The rules were complex, specific to the business, and changed often. A no-code ETL tool would not have handled the level of control the company needed.

## The solution

I spearheaded the architecture and multi-year delivery of an AWS-based data warehouse and ingestion platform. The platform used S3, Glue, Lambda, Redshift, and custom orchestration to move data from external extracts into governed warehouse layers.

The design introduced a clear flow: ingest files, land them safely, process them through custom ETL, quarantine bad records, and publish trusted data for reporting and analysis.

The warehouse followed layered data zones: raw, bronze, silver, and gold. Each layer had a purpose. Raw preserved incoming data. Bronze standardized it. Silver applied business logic. Gold exposed trusted datasets to reporting, internal teams, clients, and partners.

Splunk received logs for alerting and monitoring. A metadata and health system tracked the platform's operating state. Data governance owned validation rules, so quality controls could evolve with the business.

## Decision points

| Decision | Options | Why this path |
| --- | --- | --- |
| Platform approach | Keep local extracts or build a central warehouse | A central warehouse gave the insurer control over its own data landscape. |
| ETL strategy | Use no-code tooling or custom ETL | The rules were complex, specific, and changed often. Custom ETL gave the team the control the business needed. |
| Data quality | Let bad data flow downstream or quarantine it | Quarantine protected reporting while giving the team a controlled repair path. |
| Delivery model | Big-bang platform launch or incremental delivery | A multi-year, piece-by-piece rollout let the business gain value while the platform expanded. |

## Rollout

The platform did not replace an existing warehouse. It created a new enterprise data foundation.

Delivery happened over years through agile, incremental releases. I oversaw the program as it grew piece by piece: more source coverage, stronger validation, more governed data products, and more operational controls.

The data solutions department accepted data quality. A third-party review later audited the platform for quality and completeness and passed it.

## The result

The insurer gained a 360-degree view of its data landscape across more than 150 daily extracts and five external companies.

The platform gave the business one place to ingest, validate, monitor, and publish trusted data. It also gave internal teams a foundation for data-driven decisions that did not exist before.

The company gained control over its own data instead of depending on disconnected extracts and manual reporting paths.

## What this proves

This project shows that I can lead enterprise-scale data-platform work across architecture, governance, delivery, and operations over a long horizon.

The work required more than building ETL. It required shaping a multi-year platform plan, coordinating data governance, designing quality controls, and delivering usable pieces over time without waiting for a single waterfall launch.
