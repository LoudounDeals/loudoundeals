# LoudounDeals · Scott Brand System v1.0

The default Local application uses Hearth: warm Canvas, charcoal Ink, olive Ground, clay Field, vermilion Signal, and stone Quiet. `src/brand.css` defines the foundation; `src/themes.css` applies the vision-board components. Local and Table use Field behind their overhead meal photography; every role need not appear on every page.

URL-selected variations are documented in [the template guide](TEMPLATES.md). Local, Ticket, and Table have complete header, hero, filter, card, footer, and favicon treatments; each has a matching Ocean clone using the guide's Tidal palette: sandy Canvas, deep Ink, teal Ground, sea-glass Field, cobalt Signal, and mist Quiet. Earlier `modern`, `modern-list`, `ocean`, and `ocean-list` layouts remain available. All versions share content, typography, and filter behavior. Complete accessibility review remains required.

Modernist structure carries the layout. Systems appears in location labels and result counts. Studio is restrained because visitors need to scan deals quickly. Signal marks the introduction and source links; prices remain Ink.

Progressive Depth: the hero explains the directory and links to the filters, filters answer the immediate need, cards expose terms and sources, and “How we check deals” offers optional detail. The six vision-board themes omit the repeated introductory explainer. Food photography is decorative illustrative artwork, not a named restaurant's meal or an advertised deal; no deal data appears on it.

Fonts are self-hosted: Plus Jakarta Sans 600/700, Inter 400/500/600, and JetBrains Mono 400/500. Download URLs and hashes are in `src/fonts/sources.json`; original OFL 1.1 notices accompany the files and are copied to `dist/fonts/`. There are no third-party font requests at runtime. The supplied Google Fonts endpoint returned TTF assets; they are used unchanged with swap/fallback behavior. A later optimization may acquire official WOFF2 equivalents.

The palette retains separate muted-text and control-border values. Controls and standalone offer/map links have minimum 44 px height. Narrow screens use one column. Focus, reduced motion, and forced colors have explicit treatments.

Run `npm test` and `npm run build`. Before release, check real font rendering, keyboard use, narrow-screen layout, URL filter persistence, empty-state recovery, and disclosure behavior. This pass does not change deal records, filter logic, verification, or publication workflows.

## Logo identities and vision boards

Local is the default, including absent, invalid, repeated, and `ui=default` selections. Ticket and Table are alternatives. Their Ocean clones change only the palette, preserving geometry, layout, typography, and behavior. Header symbols are inline SVG with live name text.

Local combines its horizontal pin wordmark and existing pin favicon with Table's photographic meal hero and Field framing. Its offer cards use Quiet surfaces, a Canvas price band, Ground town labels, and a Signal View offer button with white text, stronger type, and a minimum 44 px target. Field rules connect the hero, filters, cards, and footer. Ticket combines its LD mark, burger photograph, Quiet filter band, two-column ticket cards with notched edges, and a restrained footer rule. Table combines its stacked wordmark, a meal framed by Field geometry, three-column Quiet cards, and a Field footer rule. All cards put prices first and retain restrictions and source links. Mobile layouts use one column; meaningful controls remain at least 44 px tall.

The header links target existing sections: Deals, Find a meal, and How we check. The footer repeats the selected symbol. Favicons use separate compact 32-unit SVG drawings with thick features rather than shrinking the header marks; Local is also the static no-JavaScript favicon. Food JPEGs are self-hosted and their [asset provenance](docs/brand/hero-assets.md) is recorded.

See the [three vision boards and treatment guidance](docs/brand/README.md), including full-size images and provenance. [Template URLs](TEMPLATES.md) list all six options. The boards are concept references; exact brand tokens and the implemented vector geometry govern website rendering.

The vision-board gallery includes both Hearth originals and three Ocean editions, with paired images for each logo direction. Ocean uses the approved Tidal palette and all-white reversed treatments on teal.

[Back to the README](README.md)

Every template, including the earlier card and list layouts, uses Signal-filled View offer links with white semibold labels, minimum 44 px targets, and darker hover and pressed states. Hearth uses rust; Ocean uses cobalt.
