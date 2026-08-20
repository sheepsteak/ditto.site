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

## Preflight

Before scaffold work:

1. Resolve the output path.
2. Confirm that the path is new or empty.
3. Stop if the path contains files. Do not delete or overwrite them.
4. Run `node --version` and the selected package manager version command.
5. Confirm that the installed Node.js version meets the current framework
   requirement.
6. Confirm that the package registry is available.

Use `npm` unless the user requests another package manager.

For Vite, use:

```bash
npm create vite@latest <output-directory> -- --template react-ts
```

For Next.js:

1. Run `npx create-next-app@latest --help`.
2. Select explicit non-interactive flags for TypeScript, the application router,
   a source directory, linting, and the selected styling method.
3. Run the command with `<output-directory>`.

Do not accept an interactive default that conflicts with the request.

After either scaffold command:

```bash
cd <output-directory>
npm install
npm run build
```

Then start the defined development command on `127.0.0.1`. Keep the process
running. Wait until its local URL returns a successful response. Stop and read
the process output if readiness does not occur.

If scaffold creation fails:

1. Read the first error.
2. Correct one environment or command problem.
3. Retry once.
4. Stop and report the blocker if the retry fails.

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

Use visible measurements to select tokens. Write every declaration independently.

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

Put only user-supplied asset files with confirmed reproduction rights in
`public/assets`.
Remove unused scaffold images, icons, and fonts.

Use:

- Clear file names
- Correct image dimensions
- Correct aspect ratio
- Local font files that the user supplies and permits
- Useful alternative text

Do not discover or download source assets. Do not use remote hotlinks in the
final result. Do not use data URLs for large assets.

When an asset is unavailable, omit it or create an HTML and CSS placeholder.
Do not add a substitute asset file. Record the difference.

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

If a required state is not visible in the supplied evidence, do not invent it.
Mark it as blocked and request evidence.

Do not connect account, checkout, payment, tracking, or private data services.

## Rebuild motion

Add motion only when it changes visible meaning or page character.

Use:

- CSS transitions for hover and small state changes
- CSS keyframes for simple repeated motion
- A small current motion library only when the behavior requires it

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
- Make any external network request at runtime
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
