---
title: "Tableau Integration"
date: "2025-01-01"
techs: ["tableau", "aws", "redshift", "python", "ec2"]
impact: "Created a governed BI platform so business teams could access warehouse data directly."
priority: 8
category: reporting
role: "Led platform design and automation"
diagram: "/images/tableau-integration.svg"
diagramAlt: "Business users access Tableau through governed identity controls inside a private AWS environment connected to Redshift and managed as infrastructure as code."
context:
  - term: "Client"
    value: "Large insurer"
  - term: "Scope"
    value: "Tableau on AWS"
  - term: "Warehouse"
    value: "Direct Redshift connection"
  - term: "Availability"
    value: "99.9% target"
---

## The problem

The insurer had no shared BI platform for business users.

Teams that needed analytics depended on report requests, manual extracts, or one-off access paths. That slowed decisions and created a support burden for data and engineering teams.

The business needed governed access to warehouse data without turning every new dashboard into a custom delivery project.

## The stakes

The platform served teams across the company, not one department.

That raised the bar for access control, network isolation, uptime, and support. The platform needed to give business users direct analytics access while keeping warehouse data behind enterprise controls.

The work also needed a maintainable ownership model. Engineering had to operate the environment after launch without relying on undocumented setup steps.

## The constraints

The environment had to run in AWS, connect directly to Redshift, and fit the company's infrastructure-as-code model.

Access control had to tie into the company's identity system. Network design had to keep the Tableau environment segmented from public infrastructure and protect the warehouse connection with AWS controls.

The platform also needed a practical update and administration path. Tableau Server still needed patching, backups, access support, and controlled changes.

## The solution

I led the design and automation of a private Tableau platform on AWS.

The environment runs behind a load balancer in a private network. Tableau connects directly to Redshift through controlled AWS permissions and security groups. Users authenticate through the company's identity model before reaching dashboards.

The deployment lives in version control as infrastructure as code. A Serverless Framework deployment defines the core environment, including compute, networking, access controls, and the warehouse connection.

The design also accounted for operations. Engineering could patch the server, manage access, restore from backups, and redeploy the environment from code.

## Decision points

| Decision | Options | Why this path |
| --- | --- | --- |
| Hosting model | Buy a hosted BI layer or run Tableau inside AWS | Private AWS hosting fit the network, identity, and warehouse-control requirements. |
| Data access | Export reports or connect Tableau to Redshift | Direct warehouse access reduced report-request work and gave teams current data. |
| Access model | Local Tableau users or company identity | Company identity gave the business a governed access path. |
| Deployment model | Manual server setup or infrastructure as code | IaC made the environment repeatable and gave engineering a maintainable support model. |

## Rollout

The rollout paired technical delivery with business adoption.

Engineering launched the environment, connected it to warehouse data, and worked with business teams on dashboard use and access patterns. That gave teams a governed way to answer their own questions instead of filing every request through IT.

Engineering kept ownership of the platform after launch.

## The result

Business teams gained direct access to warehouse-backed analytics.

Engineering gained a maintainable Tableau environment with repeatable deployment, controlled access, and a clear support path.

The work turned BI from a missing capability into an operated enterprise platform.

## What this proves

This project shows that I can create a business-facing data platform without weakening enterprise controls.

The work required architecture, access governance, infrastructure automation, business adoption, and long-term operations planning.
