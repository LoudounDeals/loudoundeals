# LoudounDeals.com

A dependency-free static meal-deal directory. The public site consists only of HTML, CSS, JavaScript and JSON in `dist/`. No runtime database, API server, or visitor tracking.

## Local development

Requires Node 24. Run `npm run build`, `npm test`, then `npm run dev`. Open http://127.0.0.1:4173. Edit presentation in `src/`, approved records in `data/deals.json`. Build embeds offers for no-JavaScript browsing and generates public `dist/deals.json` without internal evidence fields. Today is calculated in America/New_York; it means scheduled today, not open right now. Share filters by copying the current URL.

## Daily updates

The daily job checks existing deals and performs a basic search for new leads. New deals still require human review before publication. “Cron” means a scheduled job: GitHub Actions is scheduled to run at 10:17 UTC daily (6:17 a.m. Eastern during daylight saving time / 5:17 a.m. in winter). GitHub starts a temporary computer to run the updater; the public web host does not run these scripts.

Each daily run:

1. Downloads the repository and runs `npm run update` to visit the restaurant source pages already attached to our deals.
2. Checks whether the expected offer text is still present and the page matches a previously approved copy. When both checks pass, it refreshes the deal's “website checked” date.
3. Flags changed pages, missing evidence, PDFs, and failed requests for review, preserving existing deal details rather than guessing new prices or terms.
4. Looks for potential new deals using the discovery methods below and saves findings in `reports/latest.json`.
5. If the updater succeeds, runs tests, rebuilds the static site, and commits any data changes. A successful daily workflow triggers the GitHub Pages deployment.

The workflow retains the review report as a GitHub Actions artifact for 30 days, including when the update fails if a report was generated. **There is no automatic reviewer processing this report.** If no HTML sources can be successfully processed, the updater fails and the daily workflow does not publish an update. The script does not execute remote instructions or markup.

Brave Search provides a programmable web search so the updater can discover restaurants and offers beyond the websites we already know. It is optional: the updater calls it only when the `BRAVE_SEARCH_API_KEY` GitHub Actions secret is configured. Without that secret, existing-source checks and same-website link discovery still run. The public website does not depend on Brave, and another search provider could replace it. Keep the key in GitHub Actions secrets, never in public JSON or committed files.

The Brave search currently makes one query per run, requesting up to 20 results:

> Loudoun County Ashburn Leesburg Sterling restaurant meal deals specials

Separately, on known restaurant pages, the updater looks for links whose URL paths contain `special`, `happy-hour`, `promotion`, `kids-eat`, or `deal`, ignoring letter case. These links must stay on the same restaurant website (the same origin), and already-listed source URLs are skipped. The links are saved as leads for review.

**Discovery is currently basic.** It does not systematically search every Loudoun town, restaurant, weekday, or deal category. Search results are saved as leads; the updater does not automatically verify their location, extract prices and restrictions, or publish them.

After manually reviewing full source terms, run `node scripts/update.mjs --approve-baselines` to approve current source fingerprints. This flag approves all successfully fetched HTML sources and is for an operator only. Subsequent identical pages with matching evidence refresh check dates. Changed pages remain review items; the updater never invents prices or silently changes terms. Listings older than 14 days display a recheck label. Explicit expired or withdrawn offers are excluded. Add reviewed new deals to JSON and run tests/build before publishing.

The Pages workflow deploys after a successful daily update, on pushes to `main`, or when manually dispatched. The explicit daily-workflow completion trigger is needed because commits made with `GITHUB_TOKEN` do not trigger another push workflow.

## Hosting and domain

Production repository: https://github.com/LoudounDeals/loudoundeals. The production address is https://loudoundeals.github.io/loudoundeals/. In repository Settings → Pages, select **GitHub Actions** as the build and deployment source. The deployment workflow publishes only `dist/`. Relative asset URLs support the repository subpath without a separate build configuration.

No custom domain or `CNAME` file is configured; existing DNS remains unchanged. The earlier Sites preview is separate and is not updated by GitHub deployments. Local Sites metadata is excluded from Git.

The site also works on any static HTTP host. Serve `.mjs` as JavaScript (`text/javascript` or `application/javascript`). HTML should revalidate; use short cache lifetimes for unversioned CSS/JS/JSON where the host allows cache configuration. Node 24 is needed only for builds and source checks, not on the public server.

## Content

Initial offers were researched on restaurant websites September 24, 2026. A website check is not restaurant confirmation. Conditional free offers and percentage discounts are excluded from numeric budget filtering. Prices exclude tax and tip.
