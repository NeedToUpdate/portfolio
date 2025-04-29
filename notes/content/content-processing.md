# Content Processing

## Scope
How the portfolio loads, processes, and renders Markdown content from files.

## Key Artifacts
- `pages/index.tsx` - Main content loading via getStaticProps
- `gray-matter` - Library for parsing frontmatter
- `react-markdown` - Library for rendering Markdown as React components
- `remark-gfm` - Plugin for GitHub Flavored Markdown support

## Observations
The portfolio uses a static site generation approach to process Markdown content:

1. **Content Loading** - In the getStaticProps function within pages/index.tsx, the application:
   - Reads directories (_projects, _systems) to discover all content files
   - Loads each file's content using the Node.js filesystem API
   - Parses frontmatter and content using gray-matter

2. **Data Processing** - The application:
   - Converts Markdown files into structured TypeScript objects matching defined interfaces
   - Sorts content items by priority or other criteria
   - Passes processed data as props to the page component

3. **Content Rendering** - Content is displayed through:
   - ReactMarkdown component for rendering body content
   - TypeScript interfaces ensuring consistent content structure
   - Custom components like SystemDropdown and ProjectBlurb for specific content types

4. **Static Generation** - The content processing happens at build time, resulting in:
   - Fast loading times as content is pre-rendered
   - No need for client-side data fetching
   - Ability to host as static files on any CDN

This JAMstack approach combines the performance benefits of static site generation with the content flexibility of Markdown, making it easy to update and maintain the portfolio's content.

## Links
- [Content Management](./index.md)
- [Next.js Architecture](../architecture/index.md)
- [Data Modeling](../data-modeling/index.md)