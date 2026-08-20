---
name: website-rebuilder
description: Rebuild a visible web page as a new, self-contained React and TypeScript application by using browser observation and visual comparison. Use when the user asks to clone, copy, recreate, or reproduce a web page or a small set of pages.
---

# Website Rebuilder

Build a new application from what the browser shows. Record values from the
rendered page. Write all of the code yourself.

The result must be editable code. It must not put the source page in a frame.
It must not use a picture of the source page as the page.

## Observation boundary

Read these values from a browser that you control:

- Visible text
- Element position and size
- Computed visual values, such as color, font, spacing, radius, and shadow
- Results of visible interaction
- Screenshots

Do not read or copy these:

- Original markup, class names, or stylesheet rules
- Original script files, bundles, or source maps
- Private service responses, tokens, cookies, or private user data

Record values. Write new code. Do not paste original code.

## Safety rules

- Rebuild only content that the user has the right to reproduce.
- Open only the routes that the user supplies. Do not crawl the site.
- Do not get around a login, CAPTCHA, paywall, or other access control.
- Do not sign in, accept terms, send a form, buy, or upload.
- You can close or refuse a cookie dialog, a promotion, or a modal.
- Do not put tracking, advertising, or payment code in the result.
- Give all server behavior a local implementation.

## Decisions

Use these defaults. Ask only when a missing answer changes the result.

| Decision | Default |
| --- | --- |
| Source | A public URL, an MHTML file, screenshots, or a recording |
| Output directory | A new or empty directory |
| Framework | Next.js, or Vite when the user asks for it |
| Styling | CSS modules, or the method that the user asks for |
| Routes | Only the supplied page |
| Widths | 375, 768, 1280, and 1920 px |
| States | The initial view, and each visible menu and dialog |

### Ask about assets one time

Assets change the legal risk and the visual result. Ask the user to select one
of these options:

- `Supplied`: the user gives you the asset files.
- `Downloaded`: you download the public assets of the observed routes. The user
  confirms the right to reproduce them.
- `Placeholder`: you draw simple blocks with HTML and CSS.

Use `Placeholder` when the user gives no answer. Record the selected option in
the report.

## Workflow

### 1. Prepare the output

1. Confirm that the output directory is new or empty. Stop if it holds files.
2. Confirm that Node.js, a package manager, and a browser are available.
3. Create the application. See [Implementation guide](references/implementation-guide.md).

### 2. Observe the source

Read [Observation protocol](references/observation-protocol.md).

Make a matrix of route, width, and state. Each cell needs source evidence. Mark
a cell `N/A` when the state cannot occur at that width.

Do not start to build before the matrix is complete.

### 3. Plan the build

List the routes, sections, components, content data, visual tokens, responsive
rules, interaction states, and assets.

Keep repeated content in typed data. Use semantic components.

### 4. Build in this order

1. Application shell and routes
2. Section order
3. Layout and main dimensions
4. Text and assets
5. Responsive rules
6. Type and color
7. Spacing, borders, shadows, and image crops
8. Interaction states
9. Motion that changes meaning
10. Accessibility

Run the build after each stage. Correct all errors before you continue.

### 5. Compare and correct

Read [Validation protocol](references/validation-protocol.md).

Capture the result in the same state as the source. Correct the largest
difference first. Continue until the result meets the targets, or until the
correction limit stops the work.

### 6. Report

Fill in the [reconstruction report](assets/reconstruction-report.md).

Do not say that the result is exact. State what you tested.

## Final status

Use `Successful` when all of these conditions are true:

- The application builds and starts without an error.
- Each matrix cell meets the targets in the validation protocol.
- The page holds the observed text and the selected assets.
- The responsive rules and the interaction states work.
- The running application sends no request to another host.
- All remaining differences are in the report.

Use `Blocked` when an external condition stops the work. Use `Incomplete` when
the correction limit stops the work. Do not call either one complete.

## References

| Task | File |
| --- | --- |
| Capture evidence | [Observation protocol](references/observation-protocol.md) |
| Write the application | [Implementation guide](references/implementation-guide.md) |
| Compare and finish | [Validation protocol](references/validation-protocol.md) |
| Write the result | [Reconstruction report](assets/reconstruction-report.md) |
