# LoudounDeals.com

A dependency-free static meal-deal directory. The public site consists only of HTML, CSS, JavaScript and JSON in `dist/`. No runtime database, API server, or visitor tracking.

## Find what you need

Start with the task you want to do. This README covers everyday work; linked guides provide detail.

| Task | Read |
| --- | --- |
| Run or edit the site | [Local development](#local-development) |
| Understand tests and security coverage | [Tests and security](#tests-and-security), then [the security guide](SECURITY.md) |
| Add an offer or review an update | [Daily updates](#daily-updates) and [Content](#content) |
| Publish or configure hosting | [Hosting and domain](#hosting-and-domain) |
| Select or add a UI template | [URL-selected templates](TEMPLATES.md) |
| Understand the brand application | [Brand notes](BRAND.md) |

Documentation follows progressive depth: this README gives practical starting points, and linked guides explain the details. Explain unfamiliar terms, keep instructions direct and label planned work clearly.

## Local development

Requires Node 24. Run `npm run build`, `npm test`, then `npm run dev`. Open http://127.0.0.1:4173. Edit presentation in `src/`, approved records in `data/deals.json`. Build embeds offers for no-JavaScript browsing and generates public `dist/deals.json` without internal evidence fields. Today is calculated in America/New_York; it means scheduled today, not open right now. Share filters by copying the current URL.

## Tests and security

From this project directory, run:

```sh
npm test
```

Tests use Node's built-in test runner. A passing run means the implemented checks passed; browser behavior and production hosting still need separate checks. The deployment workflow runs this command before building the site.

| Test file | What it checks |
| --- | --- |
| [Deal tests](scripts/test.mjs) | Record validation, filters, expiration and Eastern dates |
| [Offer verification tests](scripts/verify.test.mjs) | Matching evidence refreshes dates; changed offers, missing evidence and failed requests preserve previous freshness dates |
| [Security tests](scripts/security.test.mjs) | Unsafe source URL schemes, map URL manipulation, malicious text in generated HTML, embedded JSON escaping and exclusion of internal evidence from a clean build |
| [Template tests](scripts/templates.test.mjs) | Allowed and hostile URL values, internal navigation, external links and later-added links |
| [Outbound request tests](scripts/outbound.test.mjs) | Approved hosts, public IP destinations, DNS changes, redirects, TLS settings, download limits, timeouts and safe errors |

Our target is the applicable Level 1 requirements in OWASP ASVS 5.0.0, a standard for checking application security, plus selected Level 2 protections for updater requests. Coverage is still in progress. [The security guide](SECURITY.md) explains the scope, tested protections and remaining work. Its [request safety section](SECURITY.md#updater-request-safety) describes the download limits; [the ASVS evidence](SECURITY.md#asvs-evidence-for-this-pass) maps tested cases to specific requirements.

The project's direction is a no-cookie policy. The application contains no cookie-setting code; production responses and external services still need verification. Review future analytics, embeds and integrations against that goal. URL-selected templates are implemented without browser storage. Use `?ui=modern` to opt in; see [template instructions](TEMPLATES.md).

## Daily updates

The daily job checks existing deals and performs a basic search for new leads. New deals still require human review before publication. “Cron” means a scheduled job: GitHub Actions is scheduled to run at 10:17 UTC daily (6:17 a.m. Eastern during daylight saving time / 5:17 a.m. in winter). GitHub starts a temporary computer to run the updater; the public web host does not run these scripts.

Each daily run:

1. Downloads the repository and runs `npm run update` to visit the restaurant source pages already attached to our deals.
2. Revalidates each active, unexpired offer against reviewed offer-specific excerpts in `data/verification.json`, covering the item, price, schedule and published restrictions. Matching offers get today's Eastern “website checked” date, even when unrelated parts of the restaurant page change. The site's overall update timestamp advances when at least one offer passes.
3. Flags missing or changed offer details, missing verification rules, PDFs, and failed requests for review, preserving the previous dates and deal details rather than guessing new prices or terms. Needs-review, expired and withdrawn listings are never automatically reactivated.
4. Looks for potential new deals using the discovery methods below and saves findings in `reports/latest.json`.
5. If the updater succeeds, runs tests, rebuilds the static site, and commits any data changes. A successful daily workflow triggers the GitHub Pages deployment.

The workflow retains the review report as a GitHub Actions artifact for 30 days, including when the update fails if a report was generated. **There is no automatic reviewer processing this report.** If no HTML sources can be successfully processed, the updater fails and the daily workflow does not publish an update. The script does not execute remote instructions or markup.

Brave Search provides a programmable web search so the updater can discover restaurants and offers beyond the websites we already know. It is optional: the updater calls it only when the `BRAVE_SEARCH_API_KEY` GitHub Actions secret is configured. Without that secret, existing-source checks and same-website link discovery still run. The public website does not depend on Brave, and another search provider could replace it. Keep the key in GitHub Actions secrets, never in public JSON or committed files.

The Brave search currently makes one query per run, requesting up to 20 results:

> Loudoun County Ashburn Leesburg Sterling restaurant meal deals specials

Separately, on known restaurant pages, the updater looks for links whose URL paths contain `special`, `happy-hour`, `promotion`, `kids-eat`, or `deal`, ignoring letter case. These links must stay on the same restaurant website (the same origin), and already-listed source URLs are skipped. The links are saved as leads for review.

**Discovery is currently basic.** It does not systematically search every Loudoun town, restaurant, weekday, or deal category. Search results are saved as leads; the updater does not automatically verify their location, extract prices and restrictions, or publish them.

Whole-page baselines and `--approve-baselines` are no longer used. Offer-specific checks were reviewed against accessible restaurant pages on October 1, 2026. Sources that could not be confirmed still require review; their dates do not advance just because the job ran. Text matching checks the reviewed excerpts, not the meaning of arbitrary new text elsewhere on a page; this is website evidence, not restaurant confirmation. A changed excerpt conservatively requires review even if the restaurant only rewrote the wording.

To add or revise an offer, review the full source terms, then add exact source excerpts to its `data/verification.json` entry. Include the item and price together, its applicable days/hours, quantities and restrictions; a generic heading or price alone is insufficient. Set `reviewedAt` and `listingFingerprint` using the exported `listingFingerprint(deal)` function in `scripts/verify.mjs`. This fingerprint describes our listing, not the remote page: changes to our price, schedule, source or terms invalidate the old rules until reviewed again. Do not regenerate fingerprints in the daily workflow. Internal rules are not included in the public site. Listings older than 14 days display a recheck label. Explicit expired or withdrawn offers are excluded. Run tests/build before publishing reviewed changes.

The Pages workflow deploys after a successful daily update, on pushes to `main`, or when manually dispatched. The explicit daily-workflow completion trigger is needed because commits made with `GITHUB_TOKEN` do not trigger another push workflow.

Restaurant downloads require an exact hostname in [the approved source list](data/source-hosts.json). New hosts require review; discovered links are saved as leads and never added automatically. Redirects are rejected, so a moved page needs its final source URL and verification rules reviewed. Failed requests preserve that source's previous freshness dates. Follow [the source review procedure](SECURITY.md#reviewing-a-new-or-moved-source) before changing the list.

## Hosting and domain

Production repository: https://github.com/LoudounDeals/loudoundeals. The production address is https://loudoundeals.github.io/loudoundeals/. In repository Settings → Pages, select **GitHub Actions** as the build and deployment source. The deployment workflow publishes only `dist/`. Relative asset URLs support the repository subpath without a separate build configuration.

No custom domain or `CNAME` file is configured; existing DNS remains unchanged. The earlier Sites preview is separate and is not updated by GitHub deployments. Local Sites metadata is excluded from Git.

The site also works on any static HTTP host. Serve `.mjs` as JavaScript (`text/javascript` or `application/javascript`). HTML should revalidate; use short cache lifetimes for unversioned CSS/JS/JSON where the host allows cache configuration. Node 24 is needed only for builds and source checks, not on the public server.

## Content

Initial offers were researched on restaurant websites September 24, 2026. A website check is not restaurant confirmation. Conditional free offers and percentage discounts are excluded from numeric budget filtering. Prices exclude tax and tip.
