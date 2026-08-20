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
with explicit flags for TypeScript, the router, the source directory, the linter,
and the styling method. Do not accept an interactive default that disagrees with
the request.

Then prepare and start the application:

```bash
cd <output-directory>
npm install
npm run build
```

Start the development command on `127.0.0.1`. Keep the process running. Wait
until the local URL answers. Read the process output if it does not answer.

If the project creation fails, correct one problem, and try one more time. Stop
and report the blocker if the second try fails.

## Structure

A small result can use this shape:

```text
src/
  components/
  data/
  app/ or pages/
  styles/
public/
  assets/
```

Keep the page structure, the content data, the visual tokens, the interaction
state, and the assets apart. Do not add an abstraction that has one use.

## Routes

For each requested route, define the path, the page component, the shared
header, the shared footer, and the route content. Build each shared part one
time. Do not add a route that the user did not request.

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

Write a small token set from the observed values:

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

For each font, use one of these methods, in this order:

1. Use a font file that the user supplies. Store it in the application.
2. Use a system font stack when the observed font is a system font.
3. Use the closest available font and record the substitution.

Do not load a font from another host at runtime. That breaks the offline test.

## Layout

Use flexbox for a row or a column. Use grid for repeated items and for a
two-dimensional area. Use normal flow for the sections.

Use sticky or fixed position only where you observed it. Use absolute position
for an overlay, a decorative layer, or observed fixed geometry.

Use a content maximum width and side padding. Do not give each element a
measured pixel position.

## Responsive rules

Start with the smallest layout. Add a breakpoint only where the observation
shows a change of column count, navigation mode, visibility, alignment, spacing,
type scale, image crop, or order.

Test the widths between the breakpoints. The layout must stay usable there.

## Assets

Apply the option from the decision table in `SKILL.md`:

- `Supplied`: put the user files in `public/assets`.
- `Downloaded`: download the public files of the observed routes into
  `public/assets`. Keep the original aspect ratio.
- `Placeholder`: draw a block with HTML and CSS at the observed box size. Use a
  neutral fill or the average color.

Remove the unused images, icons, and fonts of the scaffold.

Give each image a correct display size and useful alternative text. Do not link
to another host in the result. Do not put a large file in a data URL.

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

## Do not create false fidelity

Do not:

- Put the source page in a frame
- Cover the page with a picture of the source
- Replace text with a picture
- Draw the full page on a canvas
- Load a script, a style, a font, or data from another host at runtime
- Hide a difference outside the tested viewport

## Build gates

After each stage, run the type check, run the production build, read the
warnings and the errors, and correct the errors.

A successful build does not prove fidelity. Continue with the visual comparison.
