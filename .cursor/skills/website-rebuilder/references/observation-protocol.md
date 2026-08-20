# Observation Protocol

Measure the rendered page before you write page code. Obey the observation
boundary and the safety rules in `SKILL.md`.

## Measurement scope

Measure at two levels. Do not measure every element.

Measure each of these in full:

- The header and the primary navigation
- Each section root
- The hero content
- One instance of each repeated item, such as one card
- The footer
- Each element that a difference report names later

Record for each measured element:

- Visible text
- Position and size from `getBoundingClientRect`
- Color, font family, font size, font weight, and line height
- Padding, margin, gap, border, radius, and shadow
- Image display size and `object-fit` behavior

Record the whole page structure at section level only. Add detail later when the
comparison finds a difference.

## Document metadata

Record the document title, the language attribute, the description, and the
favicon. The new application must reproduce them.

## Evidence

Keep evidence outside the git repository, for example in a temporary directory.
Never commit source evidence.

Use a stable name for each file:

```text
home-375-initial.png
home-375-menu-open.png
home-1280-full.png
```

Record the date, route, width, height, scroll position, and state for each file.

## Source procedures

### Public URL

1. Open only the exact route that the user supplies.
2. Capture the first view, including any consent banner.
3. Close or refuse the banner, the promotion, or the modal.
4. Do not sign in, accept terms, send a form, buy, or upload.
5. Confirm that the overlay is gone. Measure the largest fixed element before
   and after, as a percentage of the viewport area.
6. Stop and ask for supplied evidence when the overlay stays, or when the only
   control accepts terms.

A consent dialog is frequently inside a cross-origin iframe. Search the main
document and every frame. One observed page held its control in one of 59
frames, so a search of the main document alone finds nothing.

Match a control that refuses or closes, such as `Reject`, `Decline`, `Only
necessary`, or `Close`. Never select a control that accepts or agrees.

Clear cookies and storage before each width. A dismissed banner otherwise hides
itself at every later width and makes the matrix inconsistent.

### MHTML

1. Use only an archive that the user supplies.
2. Open it in a separate browser profile with no outbound network access.
3. Measure the rendered page. Do not read the archive text.
4. Stop and ask for screenshots when the archive needs the network to render.

### Screenshots

Use screenshots when no driver can open the source. Each screenshot needs a
route, a width, a height, a zoom value, a scroll position, and a state.

Measure from the image. Record the measurements as estimated. The validation
protocol gives estimated measurements a wider tolerance.

Ask for a missing width. Do not calculate responsive behavior from one width.

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

1. Apply the browser settings and clear the browser state.
2. Open the route.
3. Wait for the text, the images, and the fonts.
4. Capture the first view, then dismiss a blocking dialog.
5. Scroll to the top.
6. Capture the initial view and the full page.
7. Measure the sections and the repeated items.
8. Capture each menu, dialog, and sticky state.
9. Record what changed from the previous width.

Stop at the end of the requested content when the page loads more content
without a limit. Record that the page has an endless region.

## Breakpoints

The four standard widths show that a layout changed. They do not give the exact
breakpoint. When a layout changes between two widths, narrow the range by
halving it until the change point is within 8 px. Record that value.

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
repeated item size, the main gaps, the footer structure, the sticky elements,
and the scroll containers.

## Token inventory

Collect the repeated values into a small set:

- Colors for background, text, accent, and border
- Font families, weights, sizes, and line heights
- Spacing steps
- Radii and shadows
- Content widths

Record the font family that the browser resolved, not only the first name in the
list.

## Asset inventory

Record the purpose, the display size, the crop behavior, and the format of each
visible asset. Read the URL from `currentSrc`, from `srcset`, or from the
computed `background-image`.

Then apply the asset option from the decision table:

- `Supplied`: list the files that you need from the user.
- `Downloaded`: list the public image, icon, and font files to download.
- `Placeholder`: record the box size and the average color of each block.

Do not use a picture of the source page as the page.

## Interaction inventory

Record only the visible behavior that the page needs:

- Main navigation and mobile navigation
- Menus, tabs, accordions, and carousels
- Hover and keyboard focus
- Dialog open and close
- Form field states
- Sticky or changed header after scroll

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

Start the page code when all of these conditions are true:

- Each matrix cell holds evidence, or holds `N/A` with a reason.
- The section order and the main dimensions are known.
- The document metadata is recorded.
- The text inventory and the asset inventory are complete.
- The required interaction states are recorded.
- Dynamic content is marked.
- You can describe the page without a guess.
