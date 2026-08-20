# Implementation Guide

Write new code from the observation set.

## Framework

Use Next.js for file-based routes, server rendering, or route metadata. Use Vite
for one client-rendered page or a small static application.

Use React and TypeScript. Use the current official method to create the project.

## Preflight

1. Resolve the output path.
2. Stop if the path holds files. Do not delete or write over them.
3. Run `node --version` and the version command of the package manager.
4. Confirm that the Node.js version agrees with the framework requirement.
5. Confirm that the package registry answers.

Use `npm` unless the user asks for a different package manager.

For Vite:

```bash
npm create vite@latest <output-directory> -- --template react-ts
```

For Next.js, first run `npx create-next-app@latest --help`. Then run the command
with an explicit flag for every prompt that the help text lists, including the
language, the router, the source directory, the linter, the styling method, and
the import alias. Add the flag that accepts the remaining defaults. The command
must not open a prompt. A prompt stops a non-interactive shell.

Then prepare the application:

```bash
cd <output-directory>
npm install
npm run build
```

Serve the production build on `127.0.0.1` and keep the process running. Wait
until the local URL answers. Read the process output if it does not answer.

Use the production build for every comparison. A development server adds an
overlay that changes the picture.

If the project creation fails, correct one problem, and try one more time. Stop
and report the blocker if the second try fails.

## Structure

A small result can use this shape:

```text
src/
  components/
  data/
  app/
  styles/
public/
  assets/
```

Keep the page structure, the content data, the visual tokens, the interaction
state, and the assets apart. Do not add an abstraction that has one use.

## Routes

Serve one requested page at `/`. Do not copy the path of the source URL. Add a
path only when the user asks for more than one page.

For each route, define the page component, the shared header, the shared footer,
and the route content. Build each shared part one time.

Set the document title, the language, the description, and the favicon from the
observation.

## Components

Prefer a small set of semantic components, such as `SiteHeader`, `PrimaryNav`,
`HeroSection`, `CardGrid`, `Accordion`, and `SiteFooter`.

Use `header`, `nav`, `main`, `section`, `article`, and `footer`. Use a button for
an action. Use a link for navigation.

Do not make one component for each wrapper element.

## Content data

Keep repeated content in typed data:

```ts
type Card = {
  title: string;
  description: string;
  image: string;
  href: string;
};
```

Render each repeated group from an array.

## Tokens

Write a small token set from the measured values:

```css
:root {
  --color-bg: #ffffff;
  --color-text: #111111;
  --space-2: 0.5rem;
  --space-4: 1rem;
  --radius-card: 0.75rem;
  --content-max: 80rem;
}
```

Use a token for each repeated color, space, radius, and shadow.

For each font, use the first method in this list that the asset option permits:

1. Store a font file that the user supplies.
2. Store the public font file of the observed route, under the `Downloaded`
   option.
3. Use a system font stack when the observed font is a system font.
4. Use the closest available font. Record the substitution.

Do not load a font from another host at runtime. That breaks the offline test.

## Layout

Use flexbox for a row or a column. Use grid for repeated items and for a
two-dimensional area. Use normal flow for the sections.

Use sticky or fixed position only where you observed it. Use absolute position
for an overlay, a decorative layer, or observed fixed geometry.

Use a content maximum width and side padding. Do not give each element a
measured pixel position.

## Responsive rules

Start with the smallest layout. Add a breakpoint at each measured change point.
A change point is a change of column count, navigation mode, visibility,
alignment, spacing, type scale, image crop, or order.

Test the widths between the breakpoints. The layout must stay usable there.

## Assets

Apply the option from the decision table in `SKILL.md`:

- `Supplied`: put the user files in `public/assets`.
- `Downloaded`: download the public image, icon, and font files of the observed
  routes into `public/assets`. Keep the original aspect ratio.
- `Placeholder`: draw a block with HTML and CSS at the measured box size. Use a
  neutral fill or the average color. Give it the same alternative text.

Remove the unused images, icons, and fonts of the scaffold.

Give each image a correct display size and useful alternative text. Do not load
a file from another host in the result. Do not put a large file in a data URL.

A link can point to another host. A link loads nothing before a user selects it.

Record each placeholder and each substitution in the report.

## Interaction

Hold each visible state in local application state. Examples are an open menu, a
selected tab, an open accordion, a carousel position, and a field message.

Add the keyboard behavior: focus order, activation with Enter or Space, close
with Escape, and focus return after a dialog closes.

Do not connect an account, a checkout, a payment, or a private data service.
Do not send a form. Show a local message instead.

If the evidence does not show a required state, mark that cell as blocked and
ask for evidence. Do not invent the behavior.

## Motion

Add motion only where it changes meaning or page character. Use a CSS transition
for a small state change. Use CSS keyframes for simple repeated motion. Use a
motion library only where the behavior needs one.

Obey the reduced-motion preference. Do not delay access to content.

## Accessibility

Give the result these properties:

- One `h1`, and a heading order with no missing level
- Landmark elements for the header, the navigation, the main area, and the footer
- Alternative text for each image, and an empty value for a decorative image
- A visible focus indicator on each control
- `aria-expanded` and `aria-controls` on each control that opens a panel
- A focus trap, a scroll lock, and Escape support in a full-screen menu or dialog
- Text contrast of at least 4.5 to 1, and 3 to 1 for large text
- A keyboard path to every interactive element

## Do not create false fidelity

Do not:

- Put the source page in a frame
- Cover the page with a picture of the source
- Replace text with a picture
- Draw the full page on a canvas
- Load a script, a style, a font, an image, or data from another host at runtime
- Hide a difference outside the tested viewport

## Build gates

After each stage, run the type check, run the production build, read the
warnings and the errors, and correct the errors.

A successful build does not prove fidelity. Continue with the visual comparison.
