import https from 'node:https';
import dns from 'node:dns/promises';
import {BlockList, isIP} from 'node:net';

// Conservative policy: exclude special-use IPv4 ranges; accept ordinary IPv6
// global unicast only, excluding protocol assignments and documentation ranges.
const blocked = new BlockList();
for (const [address, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10],
  ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12],
  ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.88.99.0', 24],
  ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24],
  ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
]) blocked.addSubnet(address, prefix, 'ipv4');
const globalV6 = new BlockList();
globalV6.addSubnet('2000::', 3, 'ipv6');
for (const [address, prefix] of [
  ['2001::', 23], ['2001:db8::', 32], ['2002::', 16], ['3fff::', 20],
]) blocked.addSubnet(address, prefix, 'ipv6');

export function isPublicAddress(address) {
  const family = isIP(address);
  if (family === 4) return !blocked.check(address, 'ipv4');
  return family === 6 && globalV6.check(address, 'ipv6') && !blocked.check(address, 'ipv6');
}

export function approvedUrl(value, allowedHosts) {
  let url;
  try { url = new URL(value); } catch { throw Error('Invalid outbound URL'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) {
    throw Error('Outbound URL requires HTTPS on port 443 without credentials or a fragment');
  }
  if (!allowedHosts.includes(url.hostname)) throw Error('Outbound hostname is not approved');
  return url;
}

// Inject DNS and the HTTPS transport only in tests. In production the TLS host
// remains the URL hostname; custom lookup pins the checked address to prevent
// a second DNS answer from selecting an internal destination. No pooled socket,
// redirect handling, proxy, cookie jar, or decompression is used.
export function requestText(value, {
  allowedHosts, headers = {}, maxBytes = 3_000_000, timeoutMs = 20_000,
  lookup = (...args) => dns.lookup(...args),
  request = (...args) => https.request(...args),
} = {}) {
  const url = approvedUrl(value, allowedHosts ?? []);
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0 || !Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw Error('Invalid outbound limits');
  }
  return new Promise((resolve, reject) => {
    let settled = false, req, response;
    const fail = message => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(Error(message));
      response?.destroy();
      req?.destroy();
    };
    // One deadline includes DNS, TLS connection, response headers and all bytes.
    const timer = setTimeout(() => fail('Outbound request timed out'), timeoutMs);
    (async () => {
      const hostname = url.hostname.replace(/^\[|\]$/g, '');
      const literalFamily = isIP(hostname);
      const addresses = literalFamily ? [{address: hostname, family: literalFamily}] : await lookup(hostname, {all: true, verbatim: true});
      if (settled) return;
      if (!addresses.length || addresses.some(({address, family}) => !isPublicAddress(address) || isIP(address) !== family)) {
        fail('Outbound destination is not a public IP address');
        return;
      }
      const pinned = addresses[0];
      req = request(url, {
        method: 'GET', agent: false, family: pinned.family,
        rejectUnauthorized: true, minVersion: 'TLSv1.2', maxHeaderSize: 16_384,
        headers: {...headers, 'Accept-Encoding': 'identity'},
        lookup: (_host, options, callback) => {
          if (options.all) callback(null, [pinned]);
          else callback(null, pinned.address, pinned.family);
        },
      }, incoming => {
        response = incoming;
        if (settled) { incoming.destroy(); return; }
        incoming.on('error', () => fail('Outbound response failed'));
        incoming.on('aborted', () => fail('Outbound response was interrupted'));
        const status = incoming.statusCode;
        if (status >= 300 && status < 400) { fail('Outbound redirects require manual review'); return; }
        if (!(status >= 200 && status < 300)) { fail('Outbound HTTP ' + status); return; }
        const encoding = incoming.headers['content-encoding'];
        if (encoding && encoding.toLowerCase() !== 'identity') { fail('Compressed outbound responses are not supported'); return; }
        const length = incoming.headers['content-length'];
        if (length !== undefined && (!/^\d+$/.test(length) || Number(length) > maxBytes)) { fail('Outbound response exceeds byte limit'); return; }
        const chunks = [];
        let bytes = 0;
        incoming.on('data', chunk => {
          if (settled) return;
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          bytes += buffer.length;
          if (bytes > maxBytes) { fail('Outbound response exceeds byte limit'); return; }
          chunks.push(buffer);
        });
        incoming.on('end', () => {
          if (settled) return;
          if (!incoming.complete) { fail('Outbound response was interrupted'); return; }
          settled = true;
          clearTimeout(timer);
          resolve({text: Buffer.concat(chunks, bytes).toString('utf8'), contentType: incoming.headers['content-type'] ?? ''});
        });
        incoming.on('close', () => { if (!settled) fail('Outbound response was interrupted'); });
      });
      req.on('error', () => fail('Outbound connection failed'));
      req.end();
    })().catch(() => fail('Outbound DNS or connection setup failed'));
  });
}
