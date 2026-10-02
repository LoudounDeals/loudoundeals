/* URL-only presentation selection. Load in the head before styles. */
(() => {
  const allowed = new Set(['default', 'modern', 'modern-list', 'ocean', 'ocean-list','local','ticket','table','local-ocean','ticket-ocean','table-ocean']);
  function selection(url) {
    const values = url.searchParams.getAll('ui');
    return values.length === 1 && allowed.has(values[0]) ? (values[0] === 'default' ? 'local' : values[0]) : 'local';
  }
  const current = new URL(location.href);
  const selected = selection(current);
  document.documentElement.dataset.ui = selected;
  const identity = selected.replace('-ocean', '');
  document.documentElement.dataset.identity = ['local', 'ticket', 'table'].includes(identity) ? identity : 'legacy';
  // Fixed small-size drawings, with thick features that survive a 16px browser tab.
  const ground = selected.includes('ocean') ? '#356567' : '#62684a';
  const signal = selected.includes('ocean') ? '#2456c7' : '#b43b1b';
  const ink = selected.includes('ocean') ? '#202e32' : '#282a26';
  const canvas = selected.includes('ocean') ? '#f2f1e9' : '#f5f1e8';
  const faviconPaths = {
    local: '<path fill="'+ground+'" fill-rule="evenodd" d="M14 2a12 12 0 0 1 12 12c0 7-12 16-12 16S2 21 2 14A12 12 0 0 1 14 2Zm0 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z"/><path fill="'+signal+'" d="M23 26h8v4h-8z"/>',
    ticket: '<path fill="'+ground+'" d="M4 5h24a4 4 0 0 1 4 4v3a4 4 0 0 0 0 8v3a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4v-3a4 4 0 0 0 0-8V9a4 4 0 0 1 4-4Z"/><path fill="'+canvas+'" d="M7 10h4v10h5v3H7zm12 0h2c10 0 10 13 0 13h-2v-4h2c4 0 4-5 0-5h-2z"/>',
    table: '<path fill="'+ground+'" d="M5 11h22a11 11 0 0 1-22 0Z"/><path fill="'+ink+'" d="M0 12h4v9H0zm28 0h4v9h-4z"/><path fill="'+signal+'" d="M11 4h10v4H11z"/>'
  };
  const favicon = document.querySelector('link[rel="icon"]');
  if (favicon && faviconPaths[identity]) favicon.setAttribute('href', 'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">'+faviconPaths[identity]+'</svg>'));
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.setAttribute('content', selected.includes('ocean') ? '#F2F1E9' : '#F5F1E8');
  function preserveLinks() {
    if (selected === 'default') return;
    for (const anchor of document.querySelectorAll('a[href]')) {
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || anchor.hasAttribute('download')) continue;
      let destination;
      try { destination = new URL(href, document.baseURI); } catch { continue; }
      if (!['http:', 'https:'].includes(destination.protocol) || destination.origin !== current.origin) continue;
      destination.searchParams.set('ui', selected);
      anchor.setAttribute('href', destination.href);
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    preserveLinks();

  });
  // Also covers links inserted by future page components, including keyboard activation.
  document.addEventListener('click', preserveLinks, true);
  document.addEventListener('auxclick', preserveLinks, true);
})();
