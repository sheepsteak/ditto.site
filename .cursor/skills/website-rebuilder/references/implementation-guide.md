# Implementation Guide

Write new application code from the observation set.

## Choose the application shape

Use the user's required framework.

Use Next.js when the result needs:

- File-based application routes
- Server rendering
- Route metadata
- Built-in image handling

Use Vite when the result needs:

- One client-rendered page
- A small static application
- Simple local preview and build commands

Use React and TypeScript. Use the current official project creation method.
Install current dependency versions when a new dependency is required.

If a target repository already exists, keep its framework and package manager.

## Keep the directory clear

A small result can use this shape:

```text
src/
  components/
  data/
  pages/ or app/
  styles/
public/
  assets/
```

Separate:

- Page structure
- Repeated content
- Visual tokens
- Interaction state
- Local assets

Do not add abstraction that has no repeated use.

## Build a route map

For each requested route, define:

- Route path
- Page component
- Shared header
- Shared footer
- Route data
- Route-specific sections

Build shared shell components once. Keep route-specific content out of shared
components.

Do not invent routes that the user did not request.

## Build semantic components

Prefer components such as:

- `SiteHeader`
- `PrimaryNav`
- `HeroSection`
- `CardGrid`
- `ProductCard`
- `PromoBanner`
- `Accordion`
- `SiteFooter`

Use semantic HTML:

- `header`
- `nav`
- `main`
- `section`
- `article`
- `footer`
- Real buttons for actions
- Real links for navigation

Do not create hundreds of components that each contain one wrapper.

## Use content data

Keep repeated visible content in typed data:

```ts
type Card = {
  title: string;
  description: string;
  image: string;
  href: string;
};
```

Render repeated items from arrays. Keep visible text easy to inspect and update.

Do not put private source data in the new application.

## Create design tokens

Create a small new token system:

```css
:root {
  --color-bg: #ffffff;
  --color-text: #111111;
  --color-muted: #6b6b6b;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --radius-card: 0.75rem;
  --content-max: 80rem;
}
```

Use observed values to select tokens. Do not paste the original stylesheet.

Use tokens for repeated colors, spacing, type, radii, and shadows.

## Rebuild layout

Use normal layout systems:

- Flexbox for one-dimensional groups
- Grid for repeated cards and two-dimensional regions
- Normal document flow for page sections
- Sticky position only when observed
- Fixed position only when observed

Avoid large groups of absolute positions. Use absolute position for overlays,
decorative layers, and observed fixed geometry.

Use content maximum widths and side padding. Do not set every element to a
measured pixel position.

## Rebuild responsive behavior

Start with the small layout. Add a breakpoint only when evidence shows a layout
change.

For each breakpoint, define the changed behavior:

- Column count
- Navigation mode
- Visibility
- Alignment
- Spacing
- Type scale
- Image crop
- Order

Do not add many breakpoints that have no visible purpose.

Test widths between observed breakpoints. The layout must remain usable there.

## Handle assets

Put permitted assets in `public/assets` or the existing asset directory.

Use:

- Clear file names
- Correct image dimensions
- Correct aspect ratio
- Local font files when permitted
- Useful alternative text

Do not use remote hotlinks in the final result. Do not use data URLs for large
assets.

When the exact asset is unavailable, use a local substitute only with user
approval. Record the difference.

## Rebuild interaction

Use local application state for visible behavior.

Examples:

- Open and close a menu
- Select a tab
- Expand an accordion
- Move a local carousel
- Show field validation

Include keyboard behavior:

- Tab focus
- Enter or Space activation
- Escape close when observed
- Focus return after a dialog closes

Do not connect account, checkout, payment, tracking, or private data services.

## Rebuild motion

Add motion only when it changes visible meaning or page character.

Use:

- CSS transitions for hover and small state changes
- CSS keyframes for simple repeated motion
- A small motion library only when the project already uses it or the behavior
  requires it

Respect reduced-motion preferences.

Do not delay content access only to copy a decorative animation.

## Prevent false fidelity

Do not:

- Embed the source page
- Cover the page with a source screenshot
- Replace text with an image
- Use a canvas as the full implementation
- Load source scripts at runtime
- Load source stylesheets at runtime
- Call private source services
- Hide mismatches outside the tested viewport

The application must remain editable and understandable.

## Build gates

After each major stage:

1. Run type checks when defined.
2. Run the production build.
3. Read all warnings and errors.
4. Fix errors before visual work continues.

Do not treat a successful build as proof of fidelity. Continue with visual and
behavior validation.
