/* One-time reveal for [data-reveal] blocks; items entering together are staggered. */
(() => {
  const { root, reducedMotion } = YK;
  const STAGGER_MS = 80;

  function init() {
    const targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length || reducedMotion.matches || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      let order = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.style.setProperty('--reveal-delay', `${order * STAGGER_MS}ms`);
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
        order += 1;
      }
    }, { rootMargin: '0px 0px -8% 0px' });

    root.classList.add('has-reveal');
    targets.forEach((target) => observer.observe(target));
  }

  YK.reveal = { init };
})();
