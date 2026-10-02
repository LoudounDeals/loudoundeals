# URL-selected templates

After deployment, use `https://loudoundeals.com/?ui=modern` to preview the compact modern layout. Use `?ui=modern-list` for a more distinct comparison with full-width offer rows. Share a template URL with anyone who wants to try it. Remove `ui` or use `?ui=default` to select Local.

For local testing, run `npm run build` and `npm run dev`, then open `http://127.0.0.1:4173/?ui=modern-list` or `http://127.0.0.1:4173/?ui=modern`. Local changes appear after rebuilding and reloading the browser; they do not change the public site.

| Value | Presentation |
| --- | --- |
| Missing or `default` | Local (Hearth), the default |
| `local` / `local-ocean` | Local discovery pin, Hearth / Tidal palette |
| `ticket` / `ticket-ocean` | LD ticket identity, Hearth / Tidal palette |
| `table` / `table-ocean` | Shared table identity, Hearth / Tidal palette |
| `modern` | Compact introduction and two-column deal cards; one column on narrow screens |
| `modern-list` | Full-width offer rows with a separate price column; stacked on smaller screens |
| `ocean` | Tidal palette: sandy Canvas, teal Ground, sea-glass Field and cobalt Signal; card layout |
| `ocean-list` | Ocean colors with full-width offer rows |
| Unknown or repeated | Local (Hearth) |

There are six logo templates plus the four earlier options. Local is the fallback for missing, unknown, or repeated values; `default` is an alias for Local. The three Ocean clones preserve the corresponding logo and layout while changing only the palette. See the [vision boards](docs/brand/README.md). The former `list` name is now `modern-list`; `?ui=list` falls back to the production layout.

All layouts use the LoudounDeals application of Scott's Brand System v1.0, with self-hosted fonts. Modern variants use Hearth; Ocean variants use the approved Tidal palette. See [brand notes](BRAND.md).

## Brand framework

Each template follows Progressive Depth: the introduction connects visitors to the directory, filters and offers answer the immediate need, visible terms explain the limits, and source links plus “How we check deals” provide further detail. Essential restrictions remain visible in every layout.

The list templates change the arrangement while retaining the established type roles, selected palette, flat surfaces, 8 px card corners, and spacing in multiples of 4 px. Prices remain Ink. Quiet separates the price column; Signal remains reserved for the introduction and useful links. The optional introductory callout is omitted to bring the offers closer to the filters.

Automated tests check selection and navigation behavior. Visual release checks still need to cover keyboard focus, 320 px reflow, 200% text resizing, forced colors, reduced motion, and unavailable fonts. Passing tests does not establish accessibility compliance.

### Browser verification — October 2, 2026

| Check | Result |
| --- | --- |
| List layout at desktop width | Loads with the established brand typography and colors |
| List and modern at a 320 px viewport | No horizontal document overflow; list offers stack with terms and source links visible |
| Search with no matches, then Reset filters | Empty-state guidance appears; reset restores results and retains the list selection and an unrelated query parameter (tested before the rename to `modern-list`) |
| Keyboard navigation from Search | Reaches Reset filters, then the first map link; Reset has a visible focus outline |
| Home link | Carries the selected template |
| Ocean and Ocean list at a 320 px viewport | No horizontal document overflow; Ocean list retains its selection and unrelated query parameters through search and reset |
| Remaining release checks | Full keyboard traversal, 200% text resizing, forced colors, reduced motion, unavailable fonts, and screen-reader review remain outstanding |

## How selection works

The address is the only source of selection. No cookies, localStorage, or sessionStorage are read or written. A new visit without `ui` uses the default. Filtering and resetting filters keep the selection and unrelated query parameters. Share the current URL to share the layout and filters together.

Same-origin navigation links receive the selected template value while retaining their own query parameters and fragments. Fragment-only links, downloads, restaurant links, maps and the external survey remain unchanged. The site currently has one page; future subpages must include the template script and styles to apply the selection. Links inserted later are handled on activation.

The small head script selects the layout before styles render. With JavaScript disabled, the production layout and static listings remain available.

## Add another template

1. Define a fixed name in the allowlist in [templates.js](src/templates.js) and the filter URL handling in [app.mjs](src/app.mjs).
2. Add styles scoped to `html[data-ui="name"]` in [templates.css](src/templates.css). Reuse brand tokens and keep all offer details and controls accessible.
3. Extend [template tests](scripts/templates.test.mjs), run `npm test` and `npm run build`, then check keyboard operation, narrow-screen reflow and enlarged text in a browser.
4. Document its name and behavior here before publishing.

Values never become file paths, imported modules, HTML or CSS. This controls presentation only: anyone can use it, and it must never gate private data or privileged actions. The existing [security coverage](SECURITY.md) still applies. The no-cookie policy remains a project goal; this selector alone does not verify hosting responses or external services.

[Back to the README](README.md)
