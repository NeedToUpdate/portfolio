# Data Modeling

## Scope
The type definitions and data structures that model the portfolio content.

## Key Artifacts
- `components/utils/types.ts` - Core type definitions
- `components/utils/skills.ts` - Skill definitions
- `components/utils/categories.ts` - Category definitions
- `components/utils/functions.ts` - Utility functions

## Observations
The portfolio uses a well-structured TypeScript type system to model different content types:

1. **Projects** - Represented by the `IProject` interface:
   - Basic metadata (title, description)
   - Visual assets (thumbnail, additional images)
   - Technology stack
   - URL and priority for sorting

2. **Skills** - Represented by the `ISkill` interface:
   - Technology type
   - Display name
   - Experience in years

3. **Systems** - Represented by the `ISystem` interface:
   - Basic metadata (title, description)
   - Technology stack
   - Impact statement
   - Full body content
   - Category classification

4. **Additional Helper Types**:
   - `IProjectLink` - Links projects to their slug/URL
   - `ISystemLink` - Links systems to their slug/URL and content
   - `ISystemBlurb` - Simplified system description for previews

This type system ensures consistent content structure throughout the application and provides strong typing for TypeScript development. The categorization of systems into "reporting," "infrastructure," "data," and "payments" suggests a professional portfolio focused on enterprise/business systems development.

## Links
- [Content Management](../content/index.md)
- [UI Components](../ui/index.md)