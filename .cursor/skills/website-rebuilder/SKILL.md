---
name: website-rebuilder
description: Rebuild a visible website as a self-contained TypeScript application by using clean-room browser observation and visual comparison. Use when the user asks to clone, copy, recreate, or reproduce a web page or small website. Do not use this skill for a Git repository clone.
---

# Website Rebuilder

Create a new application from visible page behavior. Do not use source code from
the original application. Use only public behavior, rendered content, permitted
assets, and material that the user provides.

The result must be an editable application. It must not show the source website
in an iframe. It must not use a full-page screenshot as the implementation.

## Output

Create:

- A self-contained React and TypeScript application
- Next.js or Vite, as requested
- Local application code
- Local permitted assets
- Responsive layouts
- Important visible interactions
- A short reconstruction report

The result must build and run without the source website.

## Safety and access rules

- Rebuild only content that the user has permission to reproduce.
- Observe only content available through the permitted user session.
- Do not bypass a login, CAPTCHA, paywall, rate limit, or access control.
- Do not copy original scripts, source maps, hidden endpoints, or private data.
- Do not copy large blocks of original CSS or JavaScript.
- Do not add trackers, advertising scripts, analytics, or payment code.
- Use a local mock for unsafe or unavailable server behavior.

## Required inputs

Get these values before implementation:

| Input | Default |
| --- | --- |
| Source | Required URL, MHTML file, screenshots, or screen recording |
| Output directory | Required or create a clear new directory |
| Framework | Next.js unless the user requests Vite |
| Styling | Follow the target repository or use CSS modules |
| Routes | One page unless the user lists more routes |
| Important states | Initial page plus visible menus and responsive states |

Ask one short question only when a missing value changes the implementation.
Otherwise, use the defaults and continue.

## Core workflow

### 1. Inspect the target repository

If an application already exists:

1. Read its `package.json`.
2. Identify its framework, styling system, package manager, and route structure.
3. Keep its conventions.
4. Do not replace unrelated code.

If no application exists, create a new React and TypeScript application. Use
the current official project creation method. Add only required dependencies.

### 2. Create an observation plan

Read [Observation protocol](references/observation-protocol.md).

Define:

- Routes in scope
- Viewports in scope
- Visible interaction states
- Content that can change by session or time
- Assets that the user permits
- Evidence files to capture

Use these standard widths unless the source requires other widths:

- 375 px
- 768 px
- 1280 px
- 1920 px

### 3. Observe the source

Use an interactive browser when available.

For each route and viewport:

1. Open the source.
2. Wait for visible content, images, and fonts.
3. Close permitted consent or promotional dialogs.
4. Capture the initial viewport.
5. Capture the full page.
6. Record section order and major measurements.
7. Record visible text and repeated content.
8. Record colors, type, spacing, borders, shadows, and image crops.
9. Test important menus, tabs, accordions, hover states, and focus states.
10. Record responsive changes.

Do not start implementation before the observation set is sufficient.

If the live page is unstable or inaccessible, ask for MHTML, screenshots, or a
screen recording. Do not claim close fidelity without comparable evidence.

### 4. Make the implementation plan

Create:

- Page shell
- Route map
- Section list
- Component list
- Content model
- Design tokens
- Responsive rules
- Interaction state model
- Asset plan

Prefer semantic components. Keep repeated content in data structures. Do not
create one component for every small visual element.

### 5. Build from large structure to small detail

Use this order:

1. Application shell and routes
2. Page section order
3. Major layout and dimensions
4. Text and permitted assets
5. Responsive layout
6. Typography and color
7. Spacing, borders, shadows, and image crops
8. Interaction states
9. Meaningful motion
10. Accessibility details

Build after each major stage. Fix build errors before the next stage.

### 6. Keep the result independent

- Store permitted images, icons, fonts, and data in the new application.
- Replace unavailable server data with clear local data or safe mock behavior.
- Replace forms that submit data with local non-submitting behavior unless the
  user supplies a safe target.
- Remove source tracking parameters from links.
- Do not depend on the source DOM, scripts, stylesheets, or runtime endpoints.

### 7. Validate and improve

Read [Validation protocol](references/validation-protocol.md).

For each required viewport and state:

1. Build and start the new application.
2. Capture the same state as the source.
3. Compare structure before detail.
4. Record each important difference.
5. Fix the highest-impact cause.
6. Build and compare again.

Continue until all completion criteria pass or a source limitation prevents
further work.

### 8. Finish

Use [Reconstruction report](assets/reconstruction-report.md).

Report:

- Output path
- Framework and styling system
- Routes implemented
- Viewports and states tested
- Build and runtime test results
- Assets that are local, replaced, or missing
- Important remaining differences
- Access or evidence limitations

Do not say that the result is exact. State what the evidence proves.

## Completion criteria

Finish only when:

- The application builds without an error.
- The application starts without an error.
- Main content exists at all required widths.
- Section order matches.
- Major geometry matches.
- Important text and permitted assets are present.
- Required responsive changes work.
- Required interaction states work.
- No source website is required at runtime.
- Remaining differences are listed.

## References

Read only the required reference:

| Task | Reference |
| --- | --- |
| Capture source evidence without source-code reuse | [Observation protocol](references/observation-protocol.md) |
| Structure the new application and local assets | [Implementation guide](references/implementation-guide.md) |
| Compare, correct, and decide when to finish | [Validation protocol](references/validation-protocol.md) |
| Write the final result | [Reconstruction report](assets/reconstruction-report.md) |
