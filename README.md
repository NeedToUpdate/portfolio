# artnikitin.dev

Personal portfolio and blog. Next.js App Router, MDX with interactive components, deployed to AWS Lambda behind CloudFront.

## Running it

```bash
npm run dev          # local development at localhost:3000
npm run deploy:dev   # build and deploy to dev.artnikitin.dev (basic auth)
npm run deploy:prod  # build and deploy to artnikitin.dev
```

CI does the same: merging to `dev` deploys the dev environment, merging to `main` deploys prod.

## Architecture

- **Next.js 16, App Router, `output: standalone`.** The build produces a self-contained Node server.
- **Lambda + Lambda Web Adapter.** The standalone server runs unmodified inside a Lambda function.
- **CloudFront.** Default origin is the Lambda function URL. `/_next/static/*` and `/images/*` come from S3.
- **ISR cache in S3.** `lib/isr-cache-handler.js` stores the cache under `_cache/` in the assets bucket.
- **Basic auth on dev.** `proxy.ts` enforces it when `BASIC_AUTH_USERNAME` and `BASIC_AUTH_PASSWORD` are set. Prod sets neither.

## Content

Everything renders from files in `content/`. No CMS.

| Directory           | What it is                                               | Format                 |
| ------------------- | -------------------------------------------------------- | ---------------------- |
| `content/work/`     | Professional case studies                                | Markdown + frontmatter |
| `content/insights/` | Insights                                                 | MDX + frontmatter      |
| `content/projects/` | Personal projects, split by `era` (`pre-ai` / `post-ai`) | Markdown + frontmatter |

## Deploy prerequisites

One-time setup per environment:

1. An ACM certificate in `us-east-1` for the domain.
2. GitHub Actions secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `PROD_CERTIFICATE_ARN`, `DEV_CERTIFICATE_ARN`, `DEV_BASIC_AUTH_USERNAME`, `DEV_BASIC_AUTH_PASSWORD`.
3. After the first deploy, point a DNS CNAME at the CloudFront domain from the stack outputs.

For local deploys, put the same variables in a `.env` file at the repo root.
