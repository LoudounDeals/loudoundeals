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
    // Derive the browser icon from the selected vector mark and exact palette.
    if (!document.getElementById) return;
    const mark = document.querySelector('.mark-' + selected.replace('-ocean', ''));
    if (!mark) return;
    const icon = mark.cloneNode(true);
    const palette = getComputedStyle(document.documentElement);
    for (const path of icon.querySelectorAll('path')) {
      path.setAttribute('fill', path.getAttribute('fill').replace(/var\((--[a-z]+)\)/g, (_, token) => palette.getPropertyValue(token).trim()));
    }
    icon.removeAttribute('class');
    icon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    document.querySelector('link[rel="icon"]').setAttribute('href', 'data:image/svg+xml,' + encodeURIComponent(icon.outerHTML));
  });
  // Also covers links inserted by future page components, including keyboard activation.
  document.addEventListener('click', preserveLinks, true);
  document.addEventListener('auxclick', preserveLinks, true);
})();
