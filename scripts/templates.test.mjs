import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const script = await readFile('src/templates.js', 'utf8');
function page(search, hrefs = []) {
  const events = {};
  const links = hrefs.map(href => ({href, getAttribute() { return this.href; }, hasAttribute() { return false; }, setAttribute(key, value) { this[key] = value; }}));
  const themeColor = {setAttribute(key, value) { this[key] = value; }};
  const document = {documentElement: {dataset: {}}, baseURI: 'https://example.com/deals/', querySelector: () => themeColor, querySelectorAll: () => links, addEventListener: (event, fn) => { events[event] = fn; }};
  runInNewContext(script, {URL, location: {href: document.baseURI + search}, document});
  return {document, links, events, themeColor};
}
test('only one exact allowlisted template value selects a layout', () => {
  for (const value of ['', '?ui=default', '?ui=unknown', '?ui=Modern', '?ui=modern&ui=default', '?ui=modern&ui=modern', '?ui=%3Cscript%3Ealert(1)%3C/script%3E', '?ui=__proto__']) {
    assert.equal(page(value).document.documentElement.dataset.ui, 'local', value);
  }
  assert.equal(page('?ui=modern').document.documentElement.dataset.ui, 'modern');
  assert.equal(page('?ui=modern-list').document.documentElement.dataset.ui, 'modern-list');
  assert.equal(page('?ui=list').document.documentElement.dataset.ui, 'local');
  for (const name of ['ocean', 'ocean-list', 'local-ocean', 'ticket-ocean', 'table-ocean']) {
    const result = page('?ui=' + name, ['./?day=all#deals']);
    assert.equal(result.document.documentElement.dataset.ui, name);
    assert.equal(result.themeColor.content, '#F2F1E9');
    result.events.DOMContentLoaded();
    assert.equal(new URL(result.links[0].href).searchParams.get('ui'), name);
  }
});
test('internal navigation keeps the selection, destination parameters and fragments', () => {
  const {links, events} = page('?ui=modern', ['./about.html?town=Ashburn#details', '/deals/?ui=unknown&query=pizza', 'https://example.com/deals/next']);
  events.DOMContentLoaded();
  assert.equal(links[0].href, 'https://example.com/deals/about.html?town=Ashburn&ui=modern#details');
  assert.equal(links[1].href, 'https://example.com/deals/?ui=modern&query=pizza');
  assert.equal(new URL(links[2].href).searchParams.get('ui'), 'modern');
  links.push({href: './new', getAttribute() { return this.href; }, hasAttribute() { return false; }, setAttribute(key, value) { this[key] = value; }});
  events.click();
  assert.equal(links[3].href, 'https://example.com/deals/new?ui=modern');
  events.auxclick();
  assert.equal(new URL(links[0].href).searchParams.getAll('ui').length, 1);
});
test('list template persists through internal navigation', () => {
  const {links, events} = page('?ui=modern-list', ['./?day=all#deals', 'https://restaurant.example/']);
  events.DOMContentLoaded();
  assert.equal(links[0].href, 'https://example.com/deals/?day=all&ui=modern-list#deals');
  assert.equal(links[1].href, 'https://restaurant.example/');
});
test('external, fragment, download and executable links are untouched', () => {
  const hrefs = ['#deals', 'https://restaurant.example/?offer=1', '//other.example/path', 'mailto:hello@example.com', 'javascript:alert(1)', 'data:text/plain,test'];
  const {links, events} = page('?ui=modern', hrefs);
  links.push({href: './deals.json', getAttribute() { return this.href; }, hasAttribute: () => true});
  events.DOMContentLoaded();
  assert.deepEqual(links.map(link => link.href), [...hrefs, './deals.json']);
  const baseline = page('?ui=invalid', ['./about']);
  baseline.events.DOMContentLoaded();
  assert.equal(new URL(baseline.links[0].href).searchParams.get('ui'), 'local');
});

test('filter rendering and reset preserve selection, unrelated parameters and fragment', async () => {
  const app = (await readFile('src/app.mjs', 'utf8')).replace(/^import[^;]+;/, '');
  for (const [search, expected] of [...['default', 'modern', 'modern-list', 'ocean', 'ocean-list', 'local', 'ticket', 'table', 'local-ocean', 'ticket-ocean', 'table-ocean'].map(name => [`?ui=${name}&campaign=friend&day=all`, name]), ['?ui=list&campaign=friend', null], ['?ui=modern&ui=modern&campaign=friend', null], ['?ui=%3Cscript%3E&campaign=friend', null]]) {
    const callbacks = {};
    const elements = Object.fromEntries(['day', 'town', 'kind', 'query'].map(name => [name, {value: {day: 'today', town: 'all', kind: 'all', query: ''}[name], tagName: name === 'query' ? 'INPUT' : 'SELECT', selectedIndex: 0, options: [{}]}]));
    const form = {elements, addEventListener() {}, reset() { for (const name of Object.keys(elements)) elements[name].value = {day: 'today', town: 'all', kind: 'all', query: ''}[name]; }};
    const nodes = {'deal-data': {textContent: JSON.stringify({updatedAt: '2026-10-02T12:00:00Z', deals: []})}, filters: form};
    const location = {search, pathname: '/deals/', hash: '#deals'};
    const context = {URLSearchParams, location, document: {getElementById(id) { return nodes[id] ??= {addEventListener(event, fn) { callbacks[id] = fn; }}; }}, history: {replaceState(state, title, value) { const url = new URL(value, 'https://example.com'); location.search = url.search; location.hash = url.hash; }}, filterDeals: () => [], activeDeals: () => [], easternDate: () => '2026-10-02', setInterval() {}};
    runInNewContext(app, context);
    for (const action of [() => {}, () => callbacks.reset()]) {
      action();
      const url = new URL(location.pathname + location.search + location.hash, 'https://example.com');
      assert.equal(url.searchParams.get('ui'), expected);
      assert.equal(url.searchParams.get('campaign'), 'friend');
      assert.equal(url.hash, '#deals');
    }
  }
});

test('all three Hearth identities select and survive home navigation', () => {
 for (const name of ['local','ticket','table']) {
 const result=page('?ui='+name,['./']);
 assert.equal(result.document.documentElement.dataset.ui,name);
 assert.equal(result.themeColor.content,'#F5F1E8');
 result.events.DOMContentLoaded();
 assert.equal(new URL(result.links[0].href).searchParams.get('ui'),name);
 }
});
