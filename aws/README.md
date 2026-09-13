# TreeO2 — AWS Infrastructure

Reference for the Cloud/DevOps stream's work on the TreeO2 AWS environment: what exists, what the team built, and the decisions made along the way.

**Region:** `ap-southeast-2`
**Shared IAM user:** `treeo2-platform-dev` - the only AWS identity the team has. Only the Cloud Leads hold credentials; no per-contributor access.
**Scripts:** [`scripts/`](./scripts/), applied and logged in [`scripts/APPLIED.md`](./scripts/APPLIED.md)
**Scripting conventions:** [`docs/aws-scripting-guide.md`](./docs/aws-scripting-guide.md)

---

## Pre-Existing vs Built

| Resource | Status | Notes |
|---|---|---|
| EB environment (`treeo2-platform-api-test`) | Pre-existing (Product owner) | *fill in after CLD03 confirms config* |
| EB environment (`treeo2-platform-api-prod`) | Pre-existing (Product owner) | |
| RDS instance | Pre-existing (Product owner) | Reachable via PIA VPN + static IP, whitelisted on the RDS security group. PostGIS status: *pending CLD03* |
| S3 - frontend hosting (`treeo2-platform-admin-test`/`-prod`) | Pre-existing (Product owner) | Separate from the reports bucket below |
| S3 - reports/uploads bucket | Built (team) | *fill in after CLD06* |
| SQS - reports queue + DLQ | Built (team) | *fill in after CLD07* |
| Security groups | Pre-existing (Product owner), unverified | *fill in after CLD03* |
| CloudWatch alarms | Built (team) | *fill in after CLD09* |
| CI/CD pipeline | Built (team), on GitHub | *fill in after CLD08* |

---

## Security Groups

*To be filled in from CLD03 - the actual EB → RDS security group chain, and whether it matches expectations.*


## EB Environment

*To be filled in from CLD03/CLD04 — confirmed ASG config (expected: min=1, max=1, ALB attached), environment variables, deploy process.*


## S3 + SQS

**Key convention (reports and uploads):**
```
reports/{projectId}/{reportId}.pdf
uploads/geopackage/{projectId}/{uploadId}.gpkg
```

**SQS message shape** (full payload, not an ID alone, so the worker doesn't need to query the DB mid-job):
```json
{ "reportId": "...", "projectId": "...", "type": "...", "format": "..." }
```

**Report worker design** (agreed with API/Database, not built yet):
- API/Database owns report generation, given a report request, produce the file
- Cloud's worker owns the plumbing: picks the job off SQS, calls the report function, uploads the result to S3, and writes status plus the S3 link **straight to the DB** through the existing Prisma schema. No callback endpoint on the API side.

**Why the worker isn't built yet:** reports rank below auth migration and multi-tenancy in the product owner's priority order, and with one sprint left, API/Database confirmed report generation itself isn't happening this trimester either. The bucket and queue are provisioned so the work is ready to pick up, but `s3.ts`, `sqs.ts`, and the consumer worker are deferred, not written.

*Fill in actual bucket/queue names and config after CLD06/CLD07 apply.*


## CI/CD Pipeline

*To be filled in from CLD08 - pipeline trigger, build steps, secrets used (names only, never values).*


## CloudWatch

*To be filled in from CLD09 - log retention, alarms created, and the thresholds used (sourced from CLD05's real endpoint response times).*

## Architecture

*Diagram goes here - request → EB → RDS, with S3/SQS shown as provisioned but not yet wired into application code.*

---

## Why Scripting, Not Terraform

At this scale, one VPC, a couple of security groups, one RDS instance, one EB environment, a bucket, and a queue, a full IaC tool adds more overhead than it saves. Terraform also needs a proper shared state backend to be safe with more than one contributor, which the team doesn't have. With one shared AWS credential, two people's local state disagreeing about what's real would be a worse version of the exact problem the review process already solves. Plain, reviewable bash scripts match the team's existing bash/CLI baseline and are enough for a project this size.

## Why This README, Not Terraform State

This file plus [`APPLIED.md`](./scripts/APPLIED.md) is the actual source of truth for what's running in AWS. A merged script is approved and safe to run, it doesn't mean it's been run. Keep this file current as each script gets applied, not as a write-up saved for the end.