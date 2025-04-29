# UI Components

## Scope
The UI layer of the portfolio website consisting of reusable React components for presenting content and creating interactive experiences.

## Key Artifacts
- `components/customHead.tsx` - Custom document head component
- `components/dynamicBackground.tsx` - Dynamic background effects
- `components/gradientBackground.tsx` - Gradient background effects
- `components/particleBackground.tsx` - Particle animation background
- `components/typedText.tsx` - Animated typing text effect
- `components/projectBlurb.tsx` - Project summary display
- `components/systemDropdown.tsx` - System dropdown component
- `components/systemSectionMain.tsx` - Main section for system display
- `components/basic/` - Basic UI building blocks

## Observations
The UI components are built with TypeScript and React, following a modular design pattern. The components can be categorized into:

1. **Background Effects** - Multiple background options (particle, gradient, dynamic) for visual interest
2. **Content Display** - Components for rendering projects and systems content
3. **Interactive Elements** - Animated components like typedText and various icons
4. **Structural Components** - Basic layout and structural elements

The components use a combination of CSS, Tailwind utility classes, and occasionally animations with react-spring for dynamic effects.

## Links
- [Content Management](../content/index.md)
- [Styling Approach](../styling/index.md)