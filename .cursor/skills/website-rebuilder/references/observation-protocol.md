# Observation Protocol

Use this protocol before implementation. Its purpose is to record visible
behavior without reuse of original application code.

## Observation boundary

You can record:

- Rendered text
- Visible element order
- Pixel positions and sizes
- Visible colors, type, spacing, and effects
- Visible interaction behavior
- URLs shown in visible links
- User-provided MHTML, screenshots, and recordings

Do not inspect, collect, or reuse:

- Original HTML or serialized DOM
- Original CSS or individual style declarations
- Original JavaScript
- Original TypeScript
- Bundles and manifests
- Source maps
- Private service responses
- Authentication tokens
- Session cookies
- Hidden user data
- Browser cache files
- Network payloads
- Tracking or advertising code

Use observations to write new code.

Take measurements only from screenshots or rendered pixel buffers. Do not query
DOM nodes, element boxes, accessibility trees, computed styles, page scripts,
cache files, or network data.

## Evidence directory

Keep observation files outside the application and repository:

```text
reconstruction-evidence/
  source/
  result/
  states/
  notes/
```

Use stable file names:

```text
home-375-initial.png
home-768-menu-open.png
home-1280-full.png
home-1920-initial.png
```

Record the date, source URL, viewport size, route, scroll position, and state
for each item.

Never commit source evidence. Commit only new application code and derived notes
that contain no private content, credentials, or original implementation data.

## Route scope

Create an explicit route list.

For each route, record:

- Route name
- URL or local source
- Initial state
- Required alternate states
- Shared shell elements
- Route-specific sections

Observe only the exact routes that the user supplies. Do not crawl, enumerate,
or discover other domain routes.

## Source procedures

### Public URL

1. Open only the exact public route.
2. Do not sign in or supply credentials.
3. Do not accept terms or change consent.
4. Do not submit forms or trigger a source-side change.
5. If an overlay blocks observation, stop and request user-provided evidence.

### MHTML

1. Use only an archive that the user supplies.
2. Open it in an isolated browser profile.
3. Disable outbound network access.
4. Do not inspect, search, parse, or extract archive markup, styles, scripts,
   metadata, or embedded files.
5. Observe only the rendered pixels and visible interaction state.
6. If the archive needs external access to render, stop and request screenshots.

### Screenshots

For each screenshot, require:

- Route
- Viewport width and height
- Browser zoom
- Scroll position
- Visible state

Do not infer responsive behavior from one width. Request missing widths.

### Screen recording

Use a recording to observe state changes and motion. Require still screenshots
for exact geometry, color, and type comparison.

Do not infer an unseen state. Mark it as unavailable.

## Viewport capture

Use these standard widths:

- 375 px
- 768 px
- 1280 px
- 1920 px

Use these fixed settings unless the user supplies different evidence:

- Viewport height: 900 px
- Device pixel ratio: 1
- Browser zoom: 100 percent
- Color scheme: light
- Reduced motion: no preference
- Locale: record the source locale
- Time zone: record the source time zone
- Browser and version: use the same value for source and result

For each width:

1. Apply all fixed browser settings.
2. Open a clean source state.
3. Wait for document load.
4. Wait for visible fonts and images.
5. Wait for short entrance motion.
6. Stop if a dialog blocks the required state.
7. Return to scroll position zero.
8. Capture the initial viewport.
9. Capture the full page.
10. Record layout changes from the prior width.

If the page has endless content, stop at the end of the requested content.
Record that the source has an endless region.

## Page inventory

Record the page from top to bottom:

| Field | Example |
| --- | --- |
| Observer section label | `hero` |
| Visible purpose | Main campaign |
| Width behavior | Full width |
| Height behavior | 620 px desktop, content height mobile |
| Layout | Two columns, then one column |
| Main content | Heading, body, two links, image |
| Background | Dark color |
| Special behavior | Image crops from center |

Also record:

- Header height and behavior
- Main content maximum width
- Grid column counts
- Repeated card sizes
- Major horizontal and vertical gaps
- Footer structure
- Fixed and sticky elements
- Scroll containers

## Visual token inventory

Create a small token set from repeated observations:

- Background colors
- Text colors
- Accent colors
- Border colors
- Font families
- Font weights
- Heading sizes
- Body sizes
- Line heights
- Spacing steps
- Border radii
- Shadow styles
- Content widths

Use pixel measurements and visible color samples as evidence. Convert them into
a coherent new token system. Do not inspect or copy the original stylesheet.

## Asset inventory

For each visible asset, record:

- Purpose
- Display size
- Crop behavior
- Format
- Permission state
- Local target file name

Use only asset files that the user supplies with confirmed reproduction rights.
Do not discover, download, or extract assets from the source page, archive,
browser cache, network traffic, or session.

When an asset is not available:

1. Ask the user for the asset.
2. Omit it or use a clear HTML and CSS placeholder.
3. Record the difference.

Do not use a full-page source screenshot as the page implementation.

## Interaction inventory

Test only visible and important behavior:

- Main navigation
- Mobile navigation
- Dropdown menus
- Tabs
- Accordions
- Carousels
- Hover states
- Keyboard focus
- Dialog open and close
- Form field states
- Meaningful motion

For each state, record:

- Trigger
- Initial state
- Result state
- Changed elements
- Duration when visible
- Keyboard behavior
- Outside-click or Escape behavior

Do not reproduce real account, payment, tracking, or data-submission behavior.
Use local state or a local mock.

## Dynamic content

Mark content that can change:

- User-specific content
- Location-specific content
- Time-specific content
- Experiment variants
- Live inventory
- Rotating campaigns

Use the observed state as the reconstruction target. Do not combine content from
different source states.

If the live page changes during observation, use user-provided MHTML, screenshots,
or a recording as the fixed source.

## Observation exit criteria

Implementation can start when:

- Every route has an initial screenshot.
- Every route × width × state matrix cell has evidence.
- Section order is known.
- Major dimensions are known.
- Text and asset inventories are sufficient.
- Important interaction states are recorded.
- Dynamic or unavailable content is marked.
- The agent can describe the page without guessing.
