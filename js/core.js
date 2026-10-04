/* Shared namespace and helpers for the deferred modules. */
window.YK = (() => {
  const random = (min, max) => min + Math.random() * (max - min);

  return {
    root: document.documentElement,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)'),
    random,
    randomInt: (min, max) => Math.round(random(min, max)),
    pick: (items) => items[Math.floor(Math.random() * items.length)],
    pad: (value) => String(value).padStart(2, '0'),
  };
})();
