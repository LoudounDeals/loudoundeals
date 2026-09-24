# LoudounDeals.com

A dependency-free static meal-deal directory. The public site consists only of HTML, CSS, JavaScript and JSON in `dist/`. No runtime database, API server, or visitor tracking.

## Local development

Requires Node 24. Run `npm run build`, `npm test`, then `npm run dev`. Open http://127.0.0.1:4173. Edit presentation in `src/`, approved records in `data/deals.json`. Build embeds offers for no-JavaScript browsing and generates public `dist/deals.json` without internal evidence fields. Today is calculated in America/New_York; it means scheduled today, not open right now. Share filters by copying the current URL.

## Daily updates

`npm run update` checks known restaurant HTML pages, queues changed evidence and same-origin specials links in `reports/latest.json`, and preserves prior data on fetch failures. PDF sources require review. Optional `BRAVE_SEARCH_API_KEY` enables broader web discovery. Search candidates never publish automatically. The script does not execute remote instructions or markup.

After manually reviewing full source terms, run `node scripts/update.mjs --approve-baselines` to approve current source fingerprints. This flag approves all successfully fetched HTML sources and is for an operator only. Subsequent identical pages with matching evidence refresh check dates. Changed pages remain review items; the updater never invents prices or silently changes terms. Listings older than 14 days display a recheck label. Explicit expired or withdrawn offers are excluded. Add reviewed new deals to JSON and run tests/build before publishing.

The GitHub Actions workflow runs at 10:17 UTC daily (6:17 a.m. EDT / 5:17 a.m. EST), checks sources, validates data, rebuilds, commits changes, and retains a review report. The Pages workflow deploys after a successful daily update, on pushes to `main`, or when manually dispatched. The explicit daily-workflow completion trigger is needed because commits made with `GITHUB_TOKEN` do not trigger another push workflow. No service keys belong in public JSON.

## Hosting and domain

Production repository: https://github.com/LoudounDeals/loudoundeals. The production address is https://loudoundeals.github.io/loudoundeals/. In repository Settings → Pages, select **GitHub Actions** as the build and deployment source. The deployment workflow publishes only `dist/`. Relative asset URLs support the repository subpath without a separate build configuration.

No custom domain or `CNAME` file is configured; existing DNS remains unchanged. The earlier Sites preview is separate and is not updated by GitHub deployments. Local Sites metadata is excluded from Git.

The site also works on any static HTTP host. Serve `.mjs` as JavaScript (`text/javascript` or `application/javascript`). HTML should revalidate; use short cache lifetimes for unversioned CSS/JS/JSON where the host allows cache configuration. Node 24 is needed only for builds and source checks, not on the public server.

## Content

Initial offers were researched on restaurant websites September 24, 2026. A website check is not restaurant confirmation. Conditional free offers and percentage discounts are excluded from numeric budget filtering. Prices exclude tax and tip.
