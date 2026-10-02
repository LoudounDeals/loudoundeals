import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, mkdtemp, copyFile, cp, readdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {validate, googleMapsUrl} from './model.mjs';

const source = JSON.parse(await readFile('data/deals.json', 'utf8'));

test('source links reject executable, insecure and malformed URLs', () => {
  for (const sourceUrl of ['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'http://example.com', '//example.com', 'not a URL']) {
    const data = structuredClone(source);
    data.deals[0].sourceUrl = sourceUrl;
    assert.throws(() => validate(data), sourceUrl);
  }
});

test('map parameters cannot change the destination or inject new parameters', () => {
  const deal = {restaurant: '" onclick="alert(1)&query=evil#fragment', address: '<script>alert(1)</script>'};
  const url = new URL(googleMapsUrl(deal));
  assert.equal(url.origin, 'https://www.google.com');
  assert.equal(url.pathname, '/maps/search/');
  assert.equal(url.hash, '');
  assert.deepEqual([...url.searchParams.keys()], ['api', 'query']);
  assert.equal(url.searchParams.get('query'), `${deal.restaurant}, ${deal.address}`);
});

test('production build escapes hostile text and attributes, protects embedded JSON and excludes internal evidence', async () => {
  const root = await mkdtemp(join(tmpdir(), 'loudoundeals-security-'));
  try {
    for (const dir of ['src', 'scripts', 'data']) await mkdir(join(root, dir));
    for (const file of ['build.mjs', 'model.mjs']) await copyFile(new URL(file, import.meta.url), join(root, 'scripts', file));
    for (const file of ['index.html', 'app.mjs', 'style.css', 'brand.css', 'fonts.css', 'templates.js', 'templates.css', 'fonts']) await cp(new URL('../src/' + file, import.meta.url), join(root, 'src', file), {recursive: true});
    const data = structuredClone(source);
    data.deals = [data.deals[0]];
    const deal = data.deals[0];
    delete deal.validThrough;
    deal.status = 'active';
    const payload = '</script><img src=x onerror="alert(1)">';
    for (const key of ['restaurant', 'address', 'title', 'priceLabel', 'timeLabel', 'terms']) deal[key] = payload;
    deal.sourceUrl = 'https://example.com/?x=" onmouseover="alert(1)&y=<script>';
    deal.evidence = 'INTERNAL_EVIDENCE_SENTINEL';
    await writeFile(join(root, 'data', 'deals.json'), JSON.stringify(data));
    await writeFile(join(root, 'data', 'verification.json'), 'PRIVATE_RULES_SENTINEL');
    await writeFile(join(root, '.env'), 'SECRET_SENTINEL');
    const result = spawnSync(process.execPath, ['scripts/build.mjs'], {cwd: root, env: {...process.env, FEATURE_THEME_SWITCHER: '', NODE_OPTIONS: ''}, encoding: 'utf8'});
    assert.equal(result.status, 0, result.stderr);
    const html = await readFile(join(root, 'dist', 'index.html'), 'utf8');
    assert(!html.includes(payload));
    assert(html.includes('&lt;/script&gt;&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'));
    assert(html.includes('href="https://example.com/?x=&quot; onmouseover=&quot;alert(1)&amp;y=&lt;script&gt;"'));
    const embedded = html.match(/<script id="deal-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
    assert(!embedded.includes('<'));
    assert.equal(JSON.parse(embedded).deals[0].title, payload);
    for (const link of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) assert(link[0].includes('rel="noopener noreferrer"'));
    const publicData = await readFile(join(root, 'dist', 'deals.json'), 'utf8');
    assert(!publicData.includes('INTERNAL_EVIDENCE_SENTINEL'));
    assert(!html.includes('INTERNAL_EVIDENCE_SENTINEL'));
    assert.deepEqual((await readdir(join(root, 'dist'))).sort(), ['app.mjs', 'brand.css', 'deals.json', 'fonts', 'fonts.css', 'index.html', 'model.mjs', 'style.css', 'templates.css', 'templates.js']);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
