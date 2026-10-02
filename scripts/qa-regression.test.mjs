import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {validate, filterDeals, googleMapsUrl} from './model.mjs';

// Fixed fixtures keep these contracts independent of changing restaurant offers.
const source = JSON.parse(await readFile('data/deals.json', 'utf8'));
const offer = (overrides = {}) => ({...structuredClone(source.deals[0]),
  id: 'qa-offer', restaurant: 'Nick’s Señor Café', title: 'Burger & fries',
  town: 'Brambleton', address: '42395 Ryan Road, Ashburn, VA 20148',
  days: [1, 5], category: 'happy', categories: ['happy', 'burger'],
  terms: 'Dine-in only.', ...overrides});
const ids = (deals, state) => filterDeals(deals, state).map(d => d.id);
const pending = {todo: 'Known QA issue; enable as a blocking regression with the corresponding fix'};

test('QA 1: accents and apostrophe variants return identical matches', pending, () => {
  const deals = [offer()];
  for (const query of ["Nick's Senor Cafe", 'Nick’s Señor Café', 'Nicks Senor Cafe']) {
    assert.deepEqual(ids(deals, {query}), ['qa-offer'], query);
  }
});

test('QA 4: surrounding and repeated query whitespace is ignored', pending, () => {
  for (const query of ['  Burger  ', 'Burger   & fries', '   ']) {
    assert.deepEqual(ids([offer()], {query}), ['qa-offer'], query);
  }
});

test('QA 7: visible addresses and ZIP codes participate in combined searches', pending, () => {
  const deals = [offer(), offer({id: 'other', town: 'Leesburg', days: [2]})];
  for (const query of ['Ryan Road', '20148']) {
    assert.deepEqual(ids(deals, {query, town: 'Brambleton', day: 5}), ['qa-offer']);
  }
});

test('QA 2: food and promotion tags overlap without duplicate results', pending, () => {
  const deals = [offer(), offer({id: 'combo', category: 'family', categories: ['family', 'wings']})];
  assert.deepEqual(ids(deals, {kind: 'happy'}), ['qa-offer']);
  assert.deepEqual(ids(deals, {kind: 'burger'}), ['qa-offer']);
  assert.deepEqual(ids(deals, {kind: 'wings'}), ['combo']);
  assert.deepEqual(ids(deals, {kind: 'burger', day: 2}), []);
  assert.equal(new Set(ids(deals, {kind: 'all'})).size, 2);
});

test('QA 3: Ashburn includes its neighborhoods while narrow selections stay precise', pending, () => {
  const deals = ['Ashburn', 'Brambleton', 'Broadlands', 'Leesburg'].map((town, i) => offer({id: 'place-' + i, town}));
  assert.deepEqual(ids(deals, {town: 'Ashburn'}), ['place-0', 'place-1', 'place-2']);
  assert.deepEqual(ids(deals, {town: 'Brambleton'}), ['place-1']);
  assert.deepEqual(ids(deals, {town: 'Broadlands'}), ['place-2']);
});

test('QA 5: an unchanged-day timer tick does not replace result elements', pending, async () => {
  const app = (await readFile('src/app.mjs', 'utf8')).replace(/^import[^;]+;/, '');
  let writes = 0, tick;
  const elements = Object.fromEntries(['day', 'town', 'kind', 'query'].map(name => [name, {
    value: {day: 'today', town: 'all', kind: 'all', query: ''}[name],
    tagName: name === 'query' ? 'INPUT' : 'SELECT', selectedIndex: 0, options: [{}]
  }]));
  const nodes = {
    'deal-data': {textContent: JSON.stringify({updatedAt: '2026-10-02T12:00:00Z', deals: []})},
    filters: {elements, addEventListener() {}},
    results: {set innerHTML(value) { writes++; }}
  };
  runInNewContext(app, {
    URLSearchParams, location: {search: '', pathname: '/', hash: ''},
    document: {getElementById(id) { return nodes[id] ??= {addEventListener() {}}; }},
    history: {replaceState() {}}, filterDeals: () => [], activeDeals: () => [],
    easternDate: () => '2026-10-02', setInterval(fn) { tick = fn; }
  });
  const initialWrites = writes;
  assert.equal(typeof tick, 'function');
  tick(); tick();
  assert.equal(writes, initialWrites, 'Replacing innerHTML removes focused result nodes');
});

test('QA 9 follow-up: multi-category records reject invalid tags', pending, () => {
  for (const categories of [[], ['unknown'], 'burger']) {
    assert.throws(() => validate({...source, deals: [offer({categories})]}));
  }
});

test('dataset validation rejects malformed records before publication', () => {
  for (const overrides of [{address: ''}, {town: 'Unknown'}, {price: -1},
    {days: [7]}, {lastChecked: 'not-a-date'}, {sourceUrl: 'http://example.com'},
    {status: 'unknown'}]) {
    assert.throws(() => validate({...source, deals: [offer(overrides)]}));
  }
});

test('map URLs preserve Unicode and encode address punctuation as query data', () => {
  const deal = offer({restaurant: 'Señor Ramon & Café', address: '22455 Davis Drive, Sterling, VA (inside Crooked Run Brewing)'});
  const url = new URL(googleMapsUrl(deal));
  assert.equal(url.origin, 'https://www.google.com');
  assert.equal(url.searchParams.get('api'), '1');
  assert.equal(url.searchParams.get('query'), `${deal.restaurant}, ${deal.address}`);
  assert.equal([...url.searchParams].length, 2);
});
