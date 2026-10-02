# LoudounDeals · Scott Brand System v1.0

The first application uses Hearth: warm Canvas, charcoal Ink, olive Ground, clay Field, vermilion Signal, and stone Quiet. `src/brand.css` maps these roles onto the existing layout. Field is reserved for future artwork; every role need not appear on every page.

URL-selected variations are documented in [the template guide](TEMPLATES.md). `modern` and `modern-list` retain Hearth. `ocean` and `ocean-list` use the guide's Tidal palette: sandy Canvas, deep Ink, teal Ground, sea-glass Field, cobalt Signal, and mist Quiet. Card and list variants share the same content, typography, and interaction framework. The ocean character comes from these approved color relationships; Field remains reserved for future artwork. Tidal's documented contrast pairs apply to the unchanged token values; complete browser accessibility review remains required.

Modernist structure carries the layout. Systems appears in location labels and result counts. Studio is restrained because visitors need to scan deals quickly. Signal marks the introduction and source links; prices remain Ink.

Progressive Depth: the introduction explains the directory, filters answer the immediate need, cards expose terms and sources, and “How we check deals” offers optional detail. Evergreen guidance replaces the hard-coded featured pizza offer so it cannot drift independently of listing data.

Fonts are self-hosted: Plus Jakarta Sans 600/700, Inter 400/500/600, and JetBrains Mono 400/500. Download URLs and hashes are in `src/fonts/sources.json`; original OFL 1.1 notices accompany the files and are copied to `dist/fonts/`. There are no third-party font requests at runtime. The supplied Google Fonts endpoint returned TTF assets; they are used unchanged with swap/fallback behavior. A later optimization may acquire official WOFF2 equivalents.

The palette retains separate muted-text and control-border values. Controls and standalone offer/map links have minimum 44 px height. Narrow screens use one column. Focus, reduced motion, and forced colors have explicit treatments.

Run `npm test` and `npm run build`. Before release, check real font rendering, keyboard use, narrow-screen layout, URL filter persistence, empty-state recovery, and disclosure behavior. This pass does not change deal records, filter logic, verification, or publication workflows.
