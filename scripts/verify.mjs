import {createHash} from 'node:crypto';
export function normalize(text) {
  return text.normalize('NFKC').toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
}

// Approval belongs to a listing, so edited terms cannot reuse old checks.
export function listingFingerprint(deal) {
  const fields = ['restaurant', 'address', 'town', 'title', 'price', 'priceLabel', 'category', 'days', 'start', 'end', 'timeLabel', 'terms', 'sourceUrl', 'validThrough'];
  return createHash('sha256').update(JSON.stringify(fields.map(key => deal[key] ?? null))).digest('hex');
}

function escape(text) { return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

export function hasEvidence(text, fragment) {
  // Numeric boundaries prevent $9.99 matching $9.990 or 10 matching 110.
  const value = normalize(fragment);
  return value.length > 0 && new RegExp(`(?<![\\p{L}\\p{N}])${escape(value)}(?![\\p{L}\\p{N}]|\\.\\d)`, 'u').test(normalize(text));
}

export function verifyOffer(deal, text, rule) {
  if (!rule || rule.listingFingerprint !== listingFingerprint(deal)) {
    return 'Offer verification rules need review for this listing; freshness unchanged.';
  }
  if (!Array.isArray(rule.evidence) || !rule.evidence.length || rule.evidence.some(s => typeof s !== 'string' || !s.trim())) {
    return 'Missing reviewed offer evidence; freshness unchanged.';
  }
  if (!rule.evidence.every(fragment => hasEvidence(text, fragment))) {
    return 'Expected offer details missing or changed; review source before editing.';
  }
  return null;
}

export function revalidateOffers(records, text, date, report, rules) {
  for (const deal of records) {
    if (deal.status !== 'active' || (deal.validThrough && deal.validThrough < date)) continue;
    const reason = verifyOffer(deal, text, rules[deal.id]);
    if (reason) report.review.push({id: deal.id, url: deal.sourceUrl, reason});
    else { deal.lastChecked = date; report.checked.push(deal.id); }
  }
}
