# Validation Protocol

Use the same route, viewport, scroll position, and state for each source and
result comparison.

## Validation order

Use this order:

1. Runtime and build
2. Content
3. Page structure
4. Major geometry
5. Responsive behavior
6. Typography and color
7. Detail
8. Interaction
9. Motion
10. Accessibility

Do not correct small shadows while the page structure is wrong.

## 1. Runtime and build

Confirm:

- Dependency installation succeeds.
- Type checks succeed when defined.
- Production build succeeds.
- Local server starts.
- Requested routes return content.
- Browser console has no blocking error.
- No source website resource is required at runtime.

Record each command and its result.

## 2. Content comparison

Check:

- Heading text
- Body text
- Button and link labels
- Visible card count
- Image purpose
- Icon purpose
- List order
- Footer content

Mark content as:

- Match
- Intentional local substitute
- Missing
- Out of scope

Do not invent source content to fill a missing area.

## 3. Structure comparison

Compare:

- Section order
- Header placement
- Navigation placement
- Main content width
- Grid and column structure
- Footer placement
- Fixed and sticky regions
- Page length

Correct structure before local spacing.

## 4. Geometry comparison

For important elements, compare:

- X and Y position
- Width and height
- Margin
- Padding
- Gap
- Alignment
- Image crop
- Border radius
- Overflow

Use direct measurements when browser tools permit. Use screenshot guides when
direct measurements are not available.

## 5. Responsive comparison

At 375, 768, 1280, and 1920 px, check:

- Header mode
- Navigation mode
- Section columns
- Card columns
- Hidden and visible content
- Text wrapping
- Element order
- Side padding
- Image crop
- Fixed element position

Also drag or test between standard widths. The page must not break between
recorded states.

## 6. Visual comparison

Check:

- Font family
- Font size
- Font weight
- Line height
- Letter spacing
- Text color
- Background color
- Border
- Radius
- Shadow
- Gradient
- Opacity

Use side-by-side screenshots first. Use an image difference view when available.

An image difference view can show where pixels differ. It cannot explain the
cause. Inspect the page before you edit code.

## 7. Interaction comparison

For each required state:

1. Reset both pages.
2. Use the same input method.
3. Trigger the state.
4. Capture the result.
5. Compare changed elements.
6. Test close or reset behavior.
7. Test keyboard behavior.

Check:

- Menu
- Tab
- Accordion
- Carousel
- Dialog
- Hover
- Focus
- Form state

Use local safe behavior for forms and private actions.

## 8. Motion comparison

Check only meaningful motion:

- Start condition
- End state
- Direction
- Approximate duration
- Repeated or one-time behavior
- Reduced-motion behavior

Exact frame timing is not required unless the user requests it.

## Difference table

Keep a table during work:

| Route | Width | State | Difference | Severity | Probable cause | Status |
| --- | ---: | --- | --- | --- | --- | --- |
| Home | 375 | Initial | Header is too tall | High | Mobile padding | Open |

Severity:

- **Blocking**: page cannot build, start, or show required content.
- **High**: wrong section, major layout, missing key asset, or broken interaction.
- **Medium**: visible spacing, type, color, or responsive difference.
- **Low**: small detail with little visual impact.

Fix all blocking and high differences. Fix medium differences that affect the
main view. Record unresolved low differences.

## Correction loop

For each loop:

1. Select one cause that explains one or more important differences.
2. Change the smallest related code area.
3. Run the build.
4. Return to the same source and result state.
5. Capture new evidence.
6. Update the difference table.

Do not make unrelated visual changes in one loop.

If one fix improves one width but breaks another width, correct the shared
responsive rule. Do not add a narrow one-off rule without evidence.

## Stop conditions

Stop as successful when:

- All build and runtime gates pass.
- No blocking difference remains.
- No high difference remains.
- Required widths and states have evidence.
- The result does not depend on the source.
- Remaining differences are documented.

Stop as blocked when:

- The source cannot be observed through a permitted method.
- A required asset is unavailable and no approved substitute exists.
- Required behavior needs a private service.
- The user must choose between materially different states.
- Browser comparison is required but no browser evidence is available.

Do not report a blocked result as complete.
