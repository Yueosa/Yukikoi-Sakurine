/* Opening hand-over: the CSS exit animation decides when; this resolves as it begins. */
(() => {
  const { root, reducedMotion } = YK;
  const FALLBACK_MS = 6000;

  function start() {
    const prelude = document.querySelector('[data-prelude]');

    return new Promise((resolve) => {
      let entered = false;
      let leaving = false;
      let timer = 0;

      const enter = () => {
        if (entered) return;
        entered = true;
        clearTimeout(timer);
        root.classList.remove('is-intro');
        root.classList.add('has-entered');
        resolve();
      };

      if (!prelude || reducedMotion.matches) {
        prelude?.remove();
        enter();
        return;
      }

      const findExit = () => (prelude.getAnimations?.() ?? [])
        .find((animation) => animation.animationName?.startsWith('prelude-exit'));

      const leave = () => {
        if (leaving) return;
        leaving = true;
        prelude.classList.add('is-leaving');
        enter();
        const exit = findExit();
        if (exit) exit.finished.then(() => prelude.remove(), () => {});
        else prelude.remove();
      };

      const skip = () => {
        if (leaving) return;
        prelude.classList.add('is-skipped');
        leave();
      };

      prelude.addEventListener('click', skip);
      addEventListener('keydown', skip, { once: true });
      root.classList.add('is-intro');

      // Timing comes from the CSS animation itself; the fixed fallback only covers missing CSS.
      timer = setTimeout(leave, FALLBACK_MS);
      const exit = findExit();
      exit?.ready.then(() => {
        clearTimeout(timer);
        timer = setTimeout(leave, Math.max(0, exit.effect.getTiming().delay - exit.currentTime));
      }, () => {});
    });
  }

  YK.prelude = { start };
})();
