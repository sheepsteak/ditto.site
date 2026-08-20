# Observation Protocol

Record the rendered page before you write code. Obey the observation boundary
and the safety rules in `SKILL.md`.

## Method

Measure with the browser that you control. Read the rendered values directly.
Direct reading is more accurate than an estimate from a picture.

Record for each observed element:

- Visible text
- Position and size
- Color, font family, font size, font weight, and line height
- Spacing, border, radius, and shadow
- Image display size and crop behavior

Take a screenshot of each matrix cell as well. The screenshot is the evidence
for the report and for the later comparison.

Write your own code from these values. Do not copy the original markup, class
names, or stylesheet rules.

## Evidence

Keep evidence outside the application:

```text
reconstruction-evidence/
  source/
  result/
  notes/
```

Use a stable name for each file:

```text
home-375-initial.png
home-375-menu-open.png
home-1280-full.png
```

Record the date, route, width, height, scroll position, and state for each file.

Do not commit source evidence. Commit only your new code and notes that hold no
private content and no original code.

## Source procedures

### Public URL

1. Open only the exact route that the user supplies.
2. Close or refuse a cookie dialog, a promotion, or a modal.
3. Do not sign in, accept terms, send a form, buy, or upload.
4. Stop and ask for supplied evidence if the overlay stays after you refuse it,
   or if the only control accepts terms.

### MHTML

1. Use only an archive that the user supplies.
2. Open it in a separate browser profile with no outbound network access.
3. Observe the rendered page. Do not read the archive text or its embedded code.
4. Stop and ask for screenshots if the archive needs the network to render.

### Screenshots

Each screenshot needs a route, a width, a height, a zoom value, a scroll
position, and a state. Ask for a missing width. Do not calculate responsive
behavior from one width.

### Screen recording

Use a recording for state changes and motion. Ask for still screenshots for
geometry, color, and type. Mark an unseen state as unavailable.

## Browser settings

Use the same settings for the source and for the result:

- Viewport height: 900 px
- Device pixel ratio: 1
- Zoom: 100 percent
- Color scheme: light
- Motion preference: no preference
- Browser and version: one value for both pages

Record the locale and the time zone of the source.

## Capture procedure

For each width in the decision table:

1. Apply the browser settings.
2. Open the route.
3. Wait for the text, the images, and the fonts.
4. Close a blocking dialog.
5. Scroll to the top.
6. Capture the initial view and the full page.
7. Measure the sections and the repeated items.
8. Record what changed from the previous width.

Stop at the end of the requested content when the page loads more content
without a limit. Record that the page has an endless region.

## Page inventory

Record the page from the top to the bottom. For each section, record:

| Field | Example |
| --- | --- |
| Section name | Hero |
| Purpose | Main campaign |
| Width | Full width |
| Height | 620 px at 1280 px, content height at 375 px |
| Layout | Two columns, then one column |
| Content | Heading, text, two links, one image |
| Background | Dark color |

Also record the header height, the content maximum width, the grid columns, the
repeated item size, the main gaps, the footer structure, the fixed elements, and
the scroll containers.

## Token inventory

Collect the repeated values into a small set:

- Colors for background, text, accent, and border
- Font families, weights, sizes, and line heights
- Spacing steps
- Radii and shadows
- Content widths

Record the font family that the browser resolved, not only the requested name.
Record a font substitution when the source font file is not available to you.

## Asset inventory

Record the purpose, the display size, the crop behavior, and the format of each
visible asset.

Then apply the asset option from the decision table:

- `Supplied`: list the files that you need from the user.
- `Downloaded`: list the public files of the observed routes to download.
- `Placeholder`: record the box size and the average color for each block.

Do not use a picture of the source page as the page.

## Interaction inventory

Record only the visible behavior that the page needs:

- Main navigation and mobile navigation
- Menus, tabs, accordions, and carousels
- Hover and keyboard focus
- Dialog open and close
- Form field states

For each state, record the trigger, the start state, the end state, the elements
that changed, the approximate duration, the keyboard behavior, and the close
behavior.

Do not operate a real account, a payment, or a data submission.

## Dynamic content

Mark content that can change:

- Content for one user, one place, or one time
- Test variants
- Live stock or price
- Rotating campaigns

Use one observed state as the target. Do not mix two states. Ask for an MHTML
file or screenshots when the live page changes during the observation.

## Exit criteria

Start the build when all of these conditions are true:

- Each matrix cell holds evidence, or holds `N/A` with a reason.
- The section order is known.
- The main dimensions are known.
- The text inventory and the asset inventory are complete.
- The required interaction states are recorded.
- Dynamic content is marked.
- You can describe the page without a guess.
