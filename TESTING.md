# Test coverage and release checks

Run `npm test` before committing code changes. Tests use fixed inputs and mocked downloads rather than live restaurant pages, so a menu change or network outage does not destabilize the suite.

## QA regression coverage

`scripts/qa-regression.test.mjs` records the October 2, 2026 QA findings as executable acceptance tests. All seven original pending regression tests now run as blocking tests. Search normalization/address matching, overlapping categories, inclusive Ashburn selection, unchanged-day timer behavior and tag validation are implemented. If a product decision changes, revise its expected behavior and rationale explicitly rather than deleting the regression.

| Finding | Automated coverage | Follow-up when implementing |
| --- | --- | --- |
| 1: search spelling variants | Blocking: accents, curly/straight/omitted apostrophes | Include mixed case and URL-supplied queries; keep display text unchanged |
| 2: overlapping categories | Blocking: food/promotion overlap, combo meals, combined day filter, unique results | All records have explicit categories; retain primary category for source-evidence compatibility. New published records must include validated tags. |
| 3: Ashburn neighborhoods | Blocking: inclusive Ashburn and precise neighborhood filters | Confirm the proposed geographic behavior; verify existing URL values |
| 4: query whitespace | Blocking: surrounding/repeated whitespace and blank query | Check pasted text and form/URL parity |
| 5: timer/focus | Blocking: unchanged-day ticks do not replace result elements | Add clock-controlled Eastern midnight, expiration, DST, tab-resume and real DOM focus tests; the current VM harness detects replacement, not screen-reader behavior |
| 6: listing evidence | Existing verification tests cover changed/missing evidence, stale rules, and failed fetches without advancing freshness | Manually review each questioned offer; automated extraction cannot certify restaurant accuracy |
| 7: address search | Blocking: street/ZIP searches combined with day and town | Include location notes if stored separately |
| 8: Maps queries | Passing: Unicode and punctuation remain encoded query data | Manually confirm destination; add clean-address/location-note fixtures when those fields are introduced |
| 9: validation | Blocking: malformed records and invalid/empty tag arrays rejected; existing production build tests exercise packaging | Keep tag validation at the build and updater boundaries |
| 10: sharing/search metadata | Planned with metadata implementation | Check built canonical and absolute image URLs, escaping, social metadata, and structured-data agreement with visible verified listings |

Existing suites also cover budget eligibility, Eastern dates, expiration/status exclusions, template selection, shared URLs/reset, compact favicon palettes, safe rendering, source verification and outbound-request security. Keep these contracts passing through data/schema changes.

## Browser release checklist

Record the release, browsers, widths, checks and unresolved limitations. Run the shared functional path on every supported template; perform detailed visual and accessibility checks on Local and Local Ocean, plus any template whose component layout changed.

- At 320 and 390 CSS px and desktop width, check overflow, long names/terms, empty results, filters and primary actions. Include a real phone and 200% text resizing.
- Test search variants, overlapping categories, combined filters, reset and bookmarked URLs. Verify displayed counts match cards, without relying on a permanently fixed live offer count.
- Navigate by keyboard through filters, Maps and View offer links. Keep focus visible and intact through timer ticks; test the recovery path if a focused offer expires.
- Use a screen reader to check labels, result changes, empty-state recovery and external-link context. DOM and VM tests do not establish this coverage.
- Check Firefox, Safari and Chromium, including Local's SVG mask, hero crops, focus, forced colors and reduced motion. Verify primary-action contrast in normal, hover and pressed states.
- Check section anchors, source links and Maps destinations. Keep external-link security attributes intact.
- After metadata changes, inspect a real shared-link preview and validate structured data. Do not associate generated decorative photos with an actual restaurant or imply guaranteed enhanced search results.
- For source changes, review price, days/hours, quantities and restrictions together; record evidence and preserve dates when verification fails. A blocked download does not prove an offer has ended.

The automated tests do not certify current restaurant offers, screen-reader behavior, Maps destinations or social previews. Those manual checks remain required.

[Project README](README.md) · [Security and source review](SECURITY.md)
