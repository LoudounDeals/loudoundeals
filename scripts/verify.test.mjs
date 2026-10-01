import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, mkdtemp, mkdir, writeFile, copyFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {listingFingerprint, verifyOffer, revalidateOffers, hasEvidence} from './verify.mjs';
const source = JSON.parse(await readFile('data/deals.json', 'utf8'));
const deal = {...structuredClone(source.deals[0]), lastChecked: '2026-09-24'};
const details = 'Monday Cheese Pizza $9.99. Mondays only. Limit two pizzas. Mention coupon. Cannot combine offers.';
const rule = {listingFingerprint: listingFingerprint(deal), evidence: [details]};

test('offer details revalidate without a whole-page baseline despite unrelated page changes', () => {
  const d = structuredClone(deal), report = {checked: [], review: []};
  revalidateOffers([d], 'New footer and unrelated menu prices. ' + details, '2026-10-01', report, {[d.id]: rule});
  assert.equal(d.lastChecked, '2026-10-01');
  assert.deepEqual(report.checked, [d.id]);
  assert.deepEqual(report.review, []);
});

test('changed price, day, restriction or missing offer preserves the previous date', () => {
  for (const text of [details.replace('$9.99', '$19.99') + ' Other pizza $9.99.', details.replace('Mondays only', 'Tuesdays only'), details.replace('Limit two pizzas', 'Limit one pizza'), details.replace('Cannot combine offers', 'Delivery only'), 'Unrelated offer $9.99']) {
    const d = structuredClone(deal), report = {checked: [], review: []};
    revalidateOffers([d], text, '2026-10-01', report, {[d.id]: rule});
    assert.equal(d.lastChecked, '2026-09-24');
    assert.deepEqual(report.checked, []);
    assert.equal(report.review[0].id, d.id);
  }
});

test('missing, empty or outdated verification rules do not refresh dates', () => {
  assert(verifyOffer(deal, details));
  assert(verifyOffer(deal, details, {...rule, evidence: []}));
  assert(verifyOffer(deal, details, {...rule, evidence: ['']}));
  assert(verifyOffer({...deal, price: 12}, details, rule));
  assert(verifyOffer({...deal, days: [2]}, details, rule));
  assert(verifyOffer({...deal, terms: 'Delivery only'}, details, rule));
  assert.equal(verifyOffer({...deal, lastChecked: '2026-10-01'}, details, rule), null);
});

test('numeric boundaries and harmless formatting changes are handled', () => {
  assert(!hasEvidence('$19.99', '$9.99'));
  assert(!hasEvidence('$9.990', '$9.99'));
  assert(!hasEvidence('110', '10'));
  assert(!hasEvidence('$9.99', '$9'));
  assert(hasEvidence('MONDAY\n  – FRIDAY', 'Monday - Friday'));
});

test('withdrawn, expired and needs-review listings are not automatically reactivated', () => {
  for (const d of [{...deal, status: 'withdrawn'}, {...deal, status: 'needs-review'}, {...deal, validThrough: '2026-09-30'}]) {
    const report = {checked: [], review: []};
    revalidateOffers([d], details, '2026-10-01', report, {[d.id]: rule});
    assert.equal(d.lastChecked, '2026-09-24');
    assert.deepEqual(report.checked, []);
  }
});

test('updater saves verified dates and timestamp; failed/unsupported fetches preserve freshness', async () => {
  const root = await mkdtemp(join(tmpdir(), 'loudoundeals-verification-'));
  try {
    await mkdir(join(root, 'scripts'));
    await mkdir(join(root, 'data'));
    for (const file of ['update.mjs', 'model.mjs', 'verify.mjs']) await copyFile(new URL(file, import.meta.url), join(root, 'scripts', file));
    await writeFile(join(root, 'data', 'verification.json'), JSON.stringify({[deal.id]: rule}));
    const original = {updatedAt: '2026-09-24T00:00:00Z', deals: [deal]};
    const body = '<html>' + 'Unrelated restaurant information. '.repeat(10) + details.replace('$9.99', '&#36;9.99') + '</html>';
    for (const scenario of ['valid', 'changed', 'http', 'pdf', 'blocked', 'network']) {
      await writeFile(join(root, 'data', 'deals.json'), JSON.stringify(original));
      const mock = join(root, 'mock.mjs');
      const options = scenario === 'http' ? {status: 403, headers: {'Content-Type': 'text/html'}} : {headers: {'Content-Type': scenario === 'pdf' ? 'application/pdf' : 'text/html'}};
      const html = scenario === 'changed' ? body.replace('Limit two pizzas', 'Limit one pizza') : scenario === 'blocked' ? 'Access denied' : body;
      await writeFile(mock, scenario === 'network' ? 'globalThis.fetch = async () => { throw Error("Network unavailable"); };' : `globalThis.fetch = async () => new Response(${JSON.stringify(html)}, ${JSON.stringify(options)});`);
      const result = spawnSync(process.execPath, ['--import', pathToFileURL(mock).href, 'scripts/update.mjs'], {cwd: root, env: {...process.env, BRAVE_SEARCH_API_KEY: '', NODE_OPTIONS: ''}, encoding: 'utf8'});
      assert.equal(result.status, ['valid', 'changed'].includes(scenario) ? 0 : 1, result.stderr);
      const saved = JSON.parse(await readFile(join(root, 'data', 'deals.json'), 'utf8'));
      const report = JSON.parse(await readFile(join(root, 'reports', 'latest.json'), 'utf8'));
      if (scenario === 'valid') {
        assert.notEqual(saved.deals[0].lastChecked, deal.lastChecked);
        assert.notEqual(saved.updatedAt, original.updatedAt);
        assert.deepEqual(report.checked, [deal.id]);
      } else {
        assert.deepEqual(saved, original);
        assert.equal(report.checked.length, 0);
        assert(report.review.length + report.failures.length > 0);
      }
    }
  } finally { await rm(root, {recursive: true, force: true}); }
});
