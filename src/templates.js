/* URL-only presentation selection. Load in the head before styles. */
(() => {
  const allowed = new Set(['default', 'modern', 'modern-list', 'ocean', 'ocean-list']);
  function selection(url) {
    const values = url.searchParams.getAll('ui');
    return values.length === 1 && allowed.has(values[0]) ? values[0] : 'default';
  }
  const current = new URL(location.href);
  const selected = selection(current);
  document.documentElement.dataset.ui = selected;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.setAttribute('content', selected.startsWith('ocean') ? '#F2F1E9' : '#F5F1E8');
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
  document.addEventListener('DOMContentLoaded', preserveLinks);
  // Also covers links inserted by future page components, including keyboard activation.
  document.addEventListener('click', preserveLinks, true);
  document.addEventListener('auxclick', preserveLinks, true);
})();
