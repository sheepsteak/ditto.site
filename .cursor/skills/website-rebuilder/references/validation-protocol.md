# Validation Protocol

Compare the source and the result in the same condition. Use the same route,
width, height, zoom, scroll position, state, browser, locale, time zone, color
scheme, and motion preference.

Measure both pages with the same method. See the method in the observation
protocol.

Test each cell of the route, width, and state matrix. Mark a cell `N/A` with a
reason when the state cannot occur at that width.

## Order

1. Runtime and build
2. Content
3. Structure
4. Geometry
5. Responsive behavior
6. Type and color
7. Interaction
8. Motion
9. Accessibility

Do not correct a shadow while the structure is wrong.

## 1. Runtime and build

Confirm that the dependencies install, the type check passes, the production
build passes, the server starts, each route answers, and the console shows no
blocking error.

Then run the offline test:

1. Block outbound network access when the environment permits it.
2. Load each route again.
3. Record each failed request.
4. Fail this gate if a script, a style, a font, an image, a media file, a data
   file, or a service call comes from another host.
5. Permit a link to another host. A link loads nothing before a user selects it.

Record each command and its result.

## 2. Content

Compare the headings, the body text, the labels, the item count, the list order,
and the footer content.

Mark each item as `Match`, `Local behavior`, `Missing`, or `Out of scope`. Do not
invent source content.

## 3. Structure

Compare the section order, the header and navigation position, the content
width, the grid structure, the footer position, the fixed regions, and the full
page height.

## 4. Geometry

Compare the position, the size, the spacing, the alignment, the image crop, the
radius, and the overflow of each important element.

Use these targets unless the user sets a stricter target:

- The section order is exact.
- The visible text is exact, except for marked dynamic content.
- Each important element is within 8 px, or within 1 percent of the viewport
  width, whichever value is larger.
- The full page height is within 2 percent, after you remove marked dynamic
  regions.
- No required content is cut off.
- The page has no horizontal overflow.

## 5. Responsive behavior

At each width, compare the header mode, the navigation mode, the column counts,
the hidden content, the text wrapping, the element order, the side padding, the
image crop, and the fixed elements.

Also test the widths between the standard widths. The layout must not break
there.

## 6. Type and color

Compare the font family, size, weight, line height, and letter spacing. Compare
the text color, the background, the border, the radius, the shadow, and the
opacity.

Put the screenshots side by side. Use an image difference view when you have
one. A difference view shows where the pixels differ, but it does not give the
cause. Find the cause before you change the code.

When a tool gives a changed-pixel ratio, use 5 percent as the target. Remove the
dynamic regions, the motion frames, and the text edges first. Do not use this
ratio as the only test.

## 7. Interaction

For each required state:

1. Reset both pages.
2. Use the same input method.
3. Start the state.
4. Capture both pages.
5. Compare the elements that changed.
6. Test the close behavior and the keyboard behavior.

Use local behavior for each form and each private action. Mark a cell as blocked
when the evidence does not show the state.

## 8. Motion

Compare the start condition, the end state, the direction, the approximate
duration, the repeat behavior, and the reduced-motion behavior. Exact frame
timing is not necessary.

## Difference table

Keep this table during the work:

| Route | Width | State | Difference | Severity | Cause | Status |
| --- | ---: | --- | --- | --- | --- | --- |
| Home | 375 | Initial | The header is too tall | High | Mobile padding | Open |

Severity:

- `Blocking`: the page does not build, start, or show the required content.
- `High`: a wrong section, a wrong main layout, a missing selected asset, or a
  broken interaction.
- `Medium`: a visible difference of spacing, type, color, or responsive rule.
- `Low`: a small difference with little visual effect.

Correct each blocking and high difference. Correct each medium difference in the
main view. Record each low difference.

## Correction loop

1. Select one cause that explains one or more differences.
2. Change the smallest related part of the code.
3. Run the build.
4. Return both pages to the same state.
5. Capture the evidence again.
6. Update the difference table.

Do not make an unrelated change in the same loop. Correct the shared responsive
rule when one fix breaks another width.

Use six loops at most for one route. Stop earlier when two loops in sequence
correct no blocking, high, or medium difference.

## Stop conditions

Stop with `Successful` when all of these conditions are true:

- Each build gate and each runtime gate passes.
- No blocking difference and no high difference remains.
- No medium difference remains in the main view.
- Each applicable matrix cell meets the targets.
- The offline test passes.
- Each remaining difference is in the report.

Stop with `Blocked` when one of these conditions occurs:

- No permitted method shows the source.
- A required asset is not available under the selected asset option.
- A required behavior needs a private service.
- The user must select between two different source states.
- Required evidence for a route, a width, or a state is missing.
- The project creation fails after one more try.
- The server does not start after you correct the first error.

Stop with `Incomplete` when the evidence is sufficient, but the correction limit
stops the work. Report the measured values and the remaining differences. Ask
the user for a decision.

Do not call a blocked result or an incomplete result complete.
