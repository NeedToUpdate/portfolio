# Content Management

## Scope
Managing and organizing portfolio content through Markdown files for projects and systems work.

## Key Artifacts
- `_projects/*.md` - Markdown files for individual portfolio projects (11 projects)
- `_systems/*.md` - Markdown files for professional systems work (7 systems)
- `_content/systems.md` - Additional content about systems

## Observations
The portfolio uses a file-based content management approach with Markdown files. This allows for:

1. **Separation of Content and Presentation** - Content is stored in Markdown files separate from the UI components that render them
2. **Easy Content Updates** - New projects or systems can be added by simply creating new Markdown files
3. **Structured Metadata** - Files likely use frontmatter for metadata like title, date, tags, etc.

The portfolio displays two main categories of work:
- **Projects**: Smaller, self-contained work (breadboardcpu, classroomgame, coffee_maker, etc.)
- **Systems**: Larger professional systems work (automated_reporting, billing_site, data_warehouse, etc.)

This structure suggests a JAMstack approach, where static content is pre-rendered during the build process but displayed dynamically in the UI.

## Links
- [UI Components](../ui/index.md)
- [Next.js Architecture](../architecture/index.md)