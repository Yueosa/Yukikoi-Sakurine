/* Runs in <head> before first paint: flags JS support and always starts from the top. */
document.documentElement.classList.add('js');

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
history.replaceState(null, '', location.pathname + location.search);
scrollTo(0, 0);

addEventListener('pageshow', () => {
  requestAnimationFrame(() => requestAnimationFrame(() => scrollTo({ top: 0, left: 0, behavior: 'instant' })));
}, { once: true });
