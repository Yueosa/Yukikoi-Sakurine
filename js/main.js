/* Wires the modules; each runs in isolation so one failure never keeps the page hidden. */
(() => {
  const { root } = YK;

  const run = (name, task) => {
    try {
      return task();
    } catch (error) {
      console.error(`[yukikoi] ${name}`, error);
      return undefined;
    }
  };

  run('title', () => {
    const title = document.querySelector('title');
    const home = title.textContent;
    const { away } = title.dataset;
    if (!away) return;
    const update = () => {
      document.title = document.hidden ? away : home;
    };
    document.addEventListener('visibilitychange', update);
    update();
  });
  run('progress', () => YK.progress.init());
  run('reveal', () => YK.reveal.init());
  run('album', () => YK.album.init());

  const entered = run('prelude', () => YK.prelude.start());
  if (!entered) {
    root.classList.remove('is-intro');
    root.classList.add('has-entered');
  }
  Promise.resolve(entered).then(() => run('pulse', () => YK.pulse.init()));
})();
