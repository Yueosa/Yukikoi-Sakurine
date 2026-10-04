/* Header reading progress: rAF-throttled scroll handling over cached measurements. */
(() => {
  const { root, pad } = YK;
  const CURSOR = .36;

  function init() {
    const button = document.querySelector('[data-progress]');
    if (!button) return;
    const fill = button.querySelector('[data-progress-fill]');
    const label = button.querySelector('[data-progress-label]');
    const value = button.querySelector('[data-progress-value]');
    const sections = [...document.querySelectorAll('[data-progress-section]')];

    let maxScroll = 0;
    let viewport = 0;
    let marks = [];
    let frame = 0;

    const render = () => {
      frame = 0;
      const y = scrollY;
      const ratio = maxScroll > 0 ? Math.min(1, Math.max(0, y / maxScroll)) : 0;
      let current = marks[0];
      if (ratio >= .999) {
        current = marks.at(-1);
      } else {
        for (const mark of marks) if (mark.top <= y + viewport * CURSOR) current = mark;
      }

      fill.style.setProperty('--progress', ratio.toFixed(4));
      const percent = `${pad(Math.round(ratio * 100))}%`;
      if (value.textContent !== percent) value.textContent = percent;
      if (current && label.textContent !== current.name) label.textContent = current.name;
    };

    const measure = () => {
      viewport = innerHeight;
      maxScroll = root.scrollHeight - viewport;
      marks = sections.map((section) => ({
        name: section.dataset.progressSection,
        top: section.getBoundingClientRect().top + scrollY,
      }));
      render();
    };

    addEventListener('scroll', () => {
      frame ||= requestAnimationFrame(render);
    }, { passive: true });
    addEventListener('resize', measure);
    new ResizeObserver(measure).observe(document.body);

    button.addEventListener('click', () => {
      history.replaceState(null, '', location.pathname + location.search);
      scrollTo({ top: 0 });
    });
  }

  YK.progress = { init };
})();
