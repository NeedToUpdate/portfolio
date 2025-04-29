# Styling Approach

## Scope
The visual styling system for the portfolio website using Tailwind CSS with custom extensions.

## Key Artifacts
- `styles/globals.css` - Global CSS styles
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration for processing CSS

## Observations
The portfolio uses Tailwind CSS as its primary styling solution with significant customization:

1. **Custom Color Scheme** - A space-themed color palette with three main color sets:
   - `plasma`: Cyan/teal colors (#D1FDFF, #01ECF7, #081D1E)
   - `star`: Yellow highlights (#FEFEEF, #F9FF57, #30310D)
   - `nebula`: Purple accents (#F5E4FE, #A104F8, #190A21)

2. **Custom Fonts** - Two primary font families:
   - Montserrat - Likely used for headings
   - Lato - Likely used for body text

3. **Advanced Effects** - Custom Tailwind plugins for special visual effects:
   - Text shadows with various intensities
   - Side glow effects for elements
   - Shine effects with directional lighting
   - Custom animation utilities including fade-in animations

4. **Animation System** - Custom animation utilities with configurable delays

The styling approach combines utility-first CSS (Tailwind's core philosophy) with custom extensions that support the space/cosmic theme of the portfolio. The configuration suggests a focus on subtle animations and glow effects that likely create a modern, professional appearance with distinctive visual flair.

## Links
- [UI Components](../ui/index.md)
- [Content Management](../content/index.md)