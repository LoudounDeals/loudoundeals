import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import {approvedUrl, isPublicAddress, requestText} from './outbound.mjs';

const allowedHosts = ['restaurant.example'];
const publicDNS = async () => [{address: '93.184.216.34', family: 4}];
function transport({status = 200, headers = {}, chunks = ['Hello'], stall = false, error = false, interrupted = false} = {}) {
  const calls = [];
  let response, req;
  const request = (url, options, callback) => {
    calls.push({url, options});
    req = new EventEmitter();
    req.destroyed = false;
    req.destroy = () => { req.destroyed = true; };
    req.end = () => queueMicrotask(() => {
      if (error) { req.emit('error', Error('sensitive provider detail')); return; }
      response = new PassThrough();
      response.statusCode = status;
      response.headers = headers;
      response.complete = !interrupted;
      callback(response);
      for (const chunk of chunks) { if (!response.destroyed) response.write(Buffer.from(chunk)); }
      if (interrupted) response.destroy();
      else if (!stall && !response.destroyed) response.end();
    });
    return req;
  };
  return {request, calls, response: () => response, req: () => req};
}
const options = extra => ({allowedHosts, lookup: publicDNS, ...extra});

test('outbound URL policy rejects credentials, ports, fragments and hostname bypasses before DNS', () => {
  for (const url of [
    'http://restaurant.example', 'file:///etc/passwd', 'https://user:secret@restaurant.example',
    'https://restaurant.example:8443', 'https://restaurant.example/#fragment',
    'https://restaurant.example.evil', 'https://restaurant.example@evil.example',
    'https://restaurant.example.', 'https://localhost', 'https://127.1',
    'https://2130706433', 'https://0x7f000001', 'https://[::1]',
  ]) assert.throws(() => requestText(url, options({lookup: () => assert.fail('DNS must not run')})), url);
  assert.equal(approvedUrl('https://RESTAURANT.example:443/menu?q=1', allowedHosts).hostname, 'restaurant.example');
});

test('IP policy blocks private, loopback, link-local, metadata, special-use and IPv4-mapped IPv6 destinations', () => {
  for (const address of [
    '0.0.0.0', '10.1.2.3', '100.64.0.1', '127.0.0.1', '169.254.169.254',
    '172.16.0.1', '172.31.255.255', '192.168.1.1', '192.0.0.1', '192.0.2.1',
    '192.88.99.1', '198.18.0.1', '198.51.100.1', '203.0.113.1', '224.0.0.1', '255.255.255.255',
    '::', '::1', '::ffff:127.0.0.1', '::ffff:10.0.0.1', 'fc00::1', 'fd00::1', 'fe80::1', 'ff02::1',
    '64:ff9b::a00:1', '2001::1', '2001:db8::1', '2002:7f00:1::', '3fff::1', 'not-an-ip',
  ]) assert.equal(isPublicAddress(address), false, address);
  for (const address of ['93.184.216.34', '8.8.8.8', '2606:4700:4700::1111']) assert.equal(isPublicAddress(address), true, address);
});

test('all DNS answers must be public and well-formed; rejected answers never start a request', async () => {
  for (const addresses of [
    [], [{address: '10.0.0.1', family: 4}],
    [{address: '93.184.216.34', family: 4}, {address: '::1', family: 6}],
    [{address: '2606:4700:4700::1111', family: 6}, {address: '192.168.0.1', family: 4}],
    [{address: '8.8.8.8', family: 6}],
  ]) {
    await assert.rejects(requestText('https://restaurant.example', options({lookup: async () => addresses, request: () => assert.fail('Unsafe request started')})), /not a public IP/);
  }
});

test('validated DNS answer is pinned while TLS retains the original hostname', async () => {
  let lookups = 0;
  const mock = transport({headers: {'content-type': 'text/html'}, chunks: ['<p>', 'Café', '</p>']});
  const result = await requestText('https://restaurant.example/menu', options({...mock, lookup: async () => {
    lookups++;
    return [{address: lookups === 1 ? '93.184.216.34' : '127.0.0.1', family: 4}];
  }}));
  const call = mock.calls[0];
  assert.equal(call.url.hostname, 'restaurant.example');
  assert.equal(call.options.rejectUnauthorized, true);
  assert.equal(call.options.minVersion, 'TLSv1.2');
  assert.equal(call.options.agent, false);
  assert.equal(call.options.headers['Accept-Encoding'], 'identity');
  call.options.lookup('restaurant.example', {}, (err, address, family) => {
    assert.equal(err, null); assert.equal(address, '93.184.216.34'); assert.equal(family, 4);
  });
  call.options.lookup('restaurant.example', {all: true}, (err, records) => {
    assert.equal(err, null); assert.deepEqual(records, [{address: '93.184.216.34', family: 4}]);
  });
  assert.equal(lookups, 1);
  assert.equal(result.text, '<p>Café</p>');
  assert.equal(result.contentType, 'text/html');
});

test('approved IPv6 literals are checked without DNS and private literals are blocked', async () => {
  const mock = transport();
  const lookup = () => assert.fail('IP literals must not resolve DNS');
  await requestText('https://[2606:4700:4700::1111]/', {allowedHosts: ['[2606:4700:4700::1111]'], lookup, request: mock.request});
  assert.equal(mock.calls[0].options.family, 6);
  await assert.rejects(requestText('https://[::1]/', {allowedHosts: ['[::1]'], lookup, request: () => assert.fail('Private address requested')}), /not a public IP/);
});

test('redirects never initiate another request or forward authentication headers', async () => {
  for (const location of ['https://127.0.0.1/admin', 'https://restaurant.example/next', 'https://evil.example']) {
    const mock = transport({status: 302, headers: {location}});
    await assert.rejects(requestText('https://restaurant.example/', options({request: mock.request, headers: {'X-Subscription-Token': 'SECRET_SENTINEL'}})), /redirects require manual review/);
    assert.equal(mock.calls.length, 1);
    assert(mock.response().destroyed);
    assert(mock.req().destroyed);
  }
});

test('byte limits reject oversized declared and streamed bodies and cancel downloads', async () => {
  for (const config of [
    {headers: {'content-length': '11'}, chunks: []},
    {headers: {'content-length': 'garbage'}, chunks: []},
    {chunks: ['12345', '678901']},
    {headers: {'content-length': '1'}, chunks: ['12345678901']},
    {chunks: ['éééééé']},
  ]) {
    const mock = transport(config);
    await assert.rejects(requestText('https://restaurant.example', options({request: mock.request, maxBytes: 10})), /byte limit/);
    assert(mock.response().destroyed);
    assert(mock.req().destroyed);
  }
  const exact = transport({chunks: ['12345', '67890']});
  assert.equal((await requestText('https://restaurant.example', options({request: exact.request, maxBytes: 10}))).text, '1234567890');
});

test('deadline covers DNS resolution and prevents a late DNS result from opening a connection', async () => {
  let finishDNS;
  await assert.rejects(requestText('https://restaurant.example', options({timeoutMs: 20, lookup: () => new Promise(resolve => {finishDNS = resolve;}), request: () => assert.fail('Late request started')})), /timed out/);
  finishDNS([{address: '8.8.8.8', family: 4}]);
  await new Promise(resolve => setImmediate(resolve));
});

test('deadline cancels a stalled response, including after partial data', async () => {
  const mock = transport({stall: true, chunks: ['partial']});
  await assert.rejects(requestText('https://restaurant.example', options({request: mock.request, timeoutMs: 20})), /timed out/);
  assert(mock.req().destroyed);
  assert(mock.response().destroyed);
});

test('deadline cancels a connection that never returns response headers', async () => {
  const req = new EventEmitter();
  req.destroyed = false;
  req.end = () => {};
  req.destroy = () => {req.destroyed = true;};
  await assert.rejects(requestText('https://restaurant.example', options({request: () => req, timeoutMs: 20})), /timed out/);
  assert(req.destroyed);
});

test('connection, truncated-body, compression and HTTP failures return safe errors', async () => {
  for (const [config, expected] of [
    [{error: true}, /connection failed/], [{interrupted: true}, /interrupted/],
    [{headers: {'content-encoding': 'gzip'}}, /Compressed/], [{status: 403}, /HTTP 403/],
  ]) {
    const mock = transport(config);
    await assert.rejects(requestText('https://restaurant.example', options({request: mock.request})), error => {
      assert.match(error.message, expected);
      assert(!error.message.includes('sensitive provider detail'));
      return true;
    });
  }
  await assert.rejects(requestText('https://restaurant.example', options({lookup: async () => {throw Error('SECRET_SENTINEL');}})), /DNS or connection setup failed/);
});
