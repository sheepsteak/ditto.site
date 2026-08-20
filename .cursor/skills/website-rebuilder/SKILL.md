---
name: website-rebuilder
description: Rebuild a visible web page as a new, self-contained React and TypeScript application by using browser measurement and visual comparison. Use when the user asks to clone, copy, recreate, or reproduce a web page or a small set of pages.
---

# Website Rebuilder

Build a new application from what the browser shows. Measure the rendered page.
Write all of the code yourself.

The result must be editable code. It must not put the source page in a frame.
It must not use a picture of the source page as the page.

## Observation boundary

Query the live page for rendered values. Use `getBoundingClientRect` for
geometry, `getComputedStyle` for visual values, and `textContent` for text. Read
`currentSrc`, `srcset`, and the computed `background-image` to find asset URLs.

Do not copy these into your application:

- Original markup structure, class names, or stylesheet rules
- Original script code, bundles, or source maps
- Private service responses, tokens, cookies, or private user data

Measure values. Write new code. Do not paste original code.

## Tools

Drive the browser with Playwright. Install it if it is absent:

```bash
npm install --no-save playwright
npx playwright install chromium
```

Any equivalent driver is acceptable. It must set the viewport, the device pixel
ratio, the color scheme, and the motion preference, and it must evaluate
JavaScript in the page.

Stop with `Blocked` when no driver is available and the user supplies no
screenshots.

## Safety rules

- Rebuild only content that the user has the right to reproduce.
- Open only the routes that the user supplies. Do not crawl the site.
- Do not get around a login, CAPTCHA, paywall, or other access control.
- Do not sign in, accept terms, send a form, buy, or upload.
- You can close or refuse a cookie dialog, a promotion, or a modal.
- Do not rebuild a consent banner. It belongs to the source operator.
- Do not put tracking, advertising, or payment code in the result.
- Give all server behavior a local implementation.

## Decisions

Use these defaults. Ask only when a missing answer changes the result.

| Decision | Default |
| --- | --- |
| Source | A public URL, an MHTML file, or screenshots |
| Output directory | A new or empty directory |
| Framework | Next.js with the App Router, or Vite when the user asks |
| Styling | CSS modules, or the method that the user asks for |
| Routes | Only the supplied page, served at `/` |
| Widths | 375, 768, 1280, and 1920 px |
| States | The initial view, plus each menu, dialog, and sticky state |

A consent banner is out of scope. Record it, then dismiss it.

### Ask about assets one time

Assets change the legal risk and the visual result. Ask the user to select one
option, and continue with the default if no answer arrives:

- `Supplied`: the user gives you the asset files.
- `Downloaded`: you download the public images, icons, and fonts of the observed
  routes. The user confirms the right to reproduce them.
- `Placeholder`: you draw simple blocks with HTML and CSS. This is the default.

Record the selected option in the report. A placeholder is an accepted
difference, not a defect.

## Workflow

### 1. Prepare the output

1. Confirm that the output directory is new or empty. Stop if it holds files.
2. Confirm that Node.js, a package manager, and a browser driver are available.
3. Create the empty application. See
   [Implementation guide](references/implementation-guide.md).

### 2. Observe the source

Read [Observation protocol](references/observation-protocol.md).

Make a matrix of route, width, and state. Each cell needs source evidence. Mark
a cell `N/A` when the state cannot occur at that width.

Do not write page code before the matrix is complete.

### 3. Plan the build

List the routes, sections, components, content data, visual tokens, responsive
rules, interaction states, assets, and document metadata.

Keep repeated content in typed data. Use semantic components.

### 4. Build in this order

1. Document metadata and application shell
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

Compare the production build, not the development server. Correct the largest
difference first. Continue until the result meets the targets, or until the
correction limit stops the work.

### 6. Report

Copy [the report template](assets/reconstruction-report.md) into the output
directory and fill it in. Do not edit the template in place.

Do not say that the result is exact. State what you tested.

## Final status

The validation protocol holds the complete stop conditions. In summary:

- `Successful`: every gate and target passes, and each remaining difference is
  recorded.
- `Blocked`: an external condition stops the work.
- `Incomplete`: the correction limit stops the work.

Do not call a blocked result or an incomplete result complete.

## References

| Task | File |
| --- | --- |
| Capture evidence | [Observation protocol](references/observation-protocol.md) |
| Write the application | [Implementation guide](references/implementation-guide.md) |
| Compare and finish | [Validation protocol](references/validation-protocol.md) |
| Write the result | [Reconstruction report](assets/reconstruction-report.md) |
