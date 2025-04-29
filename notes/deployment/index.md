# Deployment Process

## Scope
The CI/CD pipeline and deployment process used to build and publish the portfolio website.

## Key Artifacts
- `.github/workflows/build.yml` - Main deployment workflow
- `.github/workflows/main.yml` - Test workflow
- `next.config.js` - Next.js build configuration
- `package.json` - Build scripts and dependencies

## Observations
The portfolio uses GitHub Actions for CI/CD and deploys a static export to Amazon S3:

1. **Testing Process**
   - GitHub Actions automatically run tests on every push to main branch
   - Jest is used as the testing framework
   - Tests are executed before any deployment

2. **Build Process**
   - Next.js static export generates pure HTML/CSS/JS files
   - `npm run export` command triggers the next build process
   - Output is generated in the `/out` directory
   - Build is configured with `output: "export"` in next.config.js

3. **Deployment Strategy**
   - After successful tests and build, files are deployed to AWS S3
   - The S3 bucket "portfoliosites3" hosts the static files
   - AWS credentials are securely stored in GitHub secrets
   - Recursive copy ensures all files are properly transferred

4. **Infrastructure**
   - Static hosting on Amazon S3 suggests a CDN-based approach
   - No server-side processing is required after deployment
   - Configured for maximum performance and minimal maintenance

This approach is well-suited for a portfolio website, providing reliability, performance, and cost-effectiveness through purely static hosting.

## Links
- [Next.js Architecture](../architecture/index.md)
- [Content Processing](../content/content-processing.md)