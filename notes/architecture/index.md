# Next.js Architecture

## Scope
The overall application architecture based on the Next.js framework with TypeScript.

## Key Artifacts
- `pages/index.tsx` - Main landing page of the portfolio
- `pages/_app.tsx` - Custom App component for global configuration
- `pages/_document.tsx` - Custom Document component for HTML document structure
- `next.config.js` - Next.js configuration file

## Observations
The portfolio follows a simple Next.js architecture with a focus on a single-page experience. Notable architectural aspects include:

1. **Minimal Routing** - The application appears to be primarily a single-page portfolio with all content accessible from the main page, rather than using complex routing
2. **Static Site Generation** - Based on the dependencies and structure, the site likely uses Next.js's static generation capabilities for optimal performance
3. **Custom Document and App Components** - Customized _document.tsx and _app.tsx files for global configuration and HTML structure
4. **TypeScript Integration** - Full TypeScript support throughout the application

The minimal page structure suggests a focus on simplicity and performance. The absence of complex routing indicates that the portfolio likely displays different content sections through component state changes rather than actual route changes.

## Links
- [Content Management](../content/index.md)
- [UI Components](../ui/index.md)
- [Styling Approach](../styling/index.md)