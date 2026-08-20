---
name: website-rebuilder
description: Rebuild a visible website as a new, self-contained TypeScript application by using clean-room browser observation and visual comparison. Use when the user asks to clone, copy, recreate, or reproduce a web page or small website.
---

# Website Rebuilder

Create a new application from visible page behavior. Do not use source code from
the original application. Use only public behavior, rendered content, and
material that the user provides.

The result must be an editable application. It must not show the source website
in an iframe. It must not use a full-page screenshot as the implementation.

Clean-room observation permits visible pixel inspection and read-only
measurements of rendered output. It does not permit reuse of original markup,
style declarations, scripts, bundles, or service data.

## Output

Create:

- A self-contained React and TypeScript application
- Next.js or Vite, as requested
- Local application code
- Local asset files that the user supplies
- Responsive layouts
- Important visible interactions
- A short reconstruction report

The result must build and run without the source website.

## Safety and access rules

- Rebuild only content that the user has permission to reproduce.
- Observe only exact public routes that the user supplies.
- Do not bypass a login, CAPTCHA, paywall, rate limit, or access control.
- Do not request or use credentials, cookies, tokens, or authenticated sessions.
- Do not copy original markup, style declarations, scripts, bundles, source maps,
  hidden endpoints, service responses, or private data.
- Do not query source DOM nodes, element boxes, accessibility trees, computed
  styles, page scripts, cache files, or network data.
- Do not add trackers, advertising scripts, analytics, or payment code.
- Implement all server behavior with deterministic local state or local data.
- Do not make a source-side change. Do not submit a form or change consent.

## Required inputs

Get these values before implementation:

| Input | Default |
| --- | --- |
| Source | Required public URL, MHTML file, screenshots, or screen recording |
| Output directory | Required new or empty directory |
| Framework | Next.js unless the user requests Vite |
| Styling | CSS modules unless the user requests another local method |
| Routes | One page unless the user lists more routes |
| Important states | Initial page plus visible menus and responsive states |

Ask one short question only when a missing value changes the implementation.
Otherwise, use the defaults and continue.

## Core workflow

### 1. Prepare an isolated output

1. Confirm that the output path is new or empty.
2. If it contains files, stop and ask for a new path. Do not overwrite it.
3. Confirm that Node.js and one package manager are available.
4. Confirm that an interactive browser is available.
5. Create a new React and TypeScript application.
6. Use the current official project creation method.
7. Add only required dependencies.

Do not inspect or inherit application code, configuration, components, styles,
or libraries from another implementation.

### 2. Create an observation plan

Read [Observation protocol](references/observation-protocol.md).

Define:

- Routes in scope
- Viewports in scope
- Visible interaction states
- Content that can change by session or time
- Asset files that the user supplies and permits
- Evidence files to capture

Create a route × viewport × state matrix. Every applicable matrix cell must
have source evidence and result evidence. Mark a cell `N/A` with a reason when
the state cannot exist at that width. An open and closed mobile menu are
separate states.

Use these standard widths unless the source requires other widths:

- 375 px
- 768 px
- 1280 px
- 1920 px

### 3. Observe the source

Use an interactive browser.

For each route and viewport:

1. Open the source.
2. Wait for visible content, images, and fonts.
3. Stop if an overlay prevents observation. Ask the user for evidence with the
   overlay already resolved.
4. Capture the initial viewport.
5. Capture the full page.
6. Record section order and major measurements.
7. Record visible text and repeated content.
8. Record colors, type, spacing, borders, shadows, and image crops.
9. Test important menus, tabs, accordions, hover states, and focus states.
10. Record responsive changes.

Do not accept terms, change consent, sign in, submit forms, make a purchase,
upload data, or trigger a source-side change.

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
4. Text and user-supplied assets
5. Responsive layout
6. Typography and color
7. Spacing, borders, shadows, and image crops
8. Interaction states
9. Meaningful motion
10. Accessibility details

Build after each major stage. Fix build errors before the next stage.

### 6. Keep the result independent

- Use only asset files that the user supplies with confirmed reproduction rights.
- Remove unused scaffold asset files.
- Store user-supplied images, icons, fonts, and data in the new application.
- If an asset is missing, omit it or create an HTML and CSS placeholder. Do not
  add a substitute asset file.
- Replace unavailable server data with clear local data or local mock behavior.
- Replace all forms with local non-submitting behavior.
- Remove source tracking parameters from links.
- Do not depend on the source DOM, scripts, stylesheets, runtime endpoints, or
  any external network resource.

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

- Final status: `Successful`, `Blocked`, or `Incomplete`
- Output path
- Framework and styling system
- Routes implemented
- Viewports and states tested
- Build and runtime test results
- Offline runtime test result
- User-supplied assets, omitted assets, and HTML or CSS placeholders
- Important remaining differences
- Access or evidence limitations

Do not say that the result is exact. State what the evidence proves.

## Completion criteria

Set the result status to `Successful` only when:

- The application builds without an error.
- The application starts without an error.
- Main content exists at all required widths.
- Section order matches.
- Numeric validation targets pass.
- Main-view medium differences are resolved.
- Important text and user-supplied assets are present.
- Required responsive changes work.
- Required interaction states work.
- The running application makes no external network request.
- Remaining differences are listed.

Use `Blocked` when an external requirement prevents work. Use `Incomplete` when
the correction limit ends with unresolved differences. Do not describe either
status as complete.

## References

Read only the required reference:

| Task | Reference |
| --- | --- |
| Capture source evidence without source-code reuse | [Observation protocol](references/observation-protocol.md) |
| Structure the new application and local assets | [Implementation guide](references/implementation-guide.md) |
| Compare, correct, and decide when to finish | [Validation protocol](references/validation-protocol.md) |
| Write the final result | [Reconstruction report](assets/reconstruction-report.md) |
