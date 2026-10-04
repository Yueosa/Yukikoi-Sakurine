/* Media viewer on a modal <dialog>: the cached thumbnail first, the full image once decoded. */
(() => {
  const { pad } = YK;
  const RELEASE_DELAY_MS = 400;

  let dialog;
  let stage;
  let indexLabel;
  let caption;
  let hooks = {};
  let items = [];
  let current = -1;
  let returnFocus = null;

  const fit = (element, item) => {
    element.width = item.width;
    element.height = item.height;
    element.style.setProperty('--ratio', (item.width / item.height).toFixed(4));
    return element;
  };

  function stopVideo() {
    stage.querySelector('video')?.pause();
  }

  function release() {
    const video = stage.querySelector('video');
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    stage.replaceChildren();
  }

  function renderPhoto(item, index) {
    const full = fit(new Image(), item);
    full.alt = item.title;
    full.decoding = 'async';
    full.src = item.src;
    if (full.complete && full.naturalWidth) {
      stage.append(full);
      return;
    }

    const preview = fit(new Image(), item);
    preview.alt = item.title;
    preview.src = item.thumb;
    stage.append(preview);
    full.decode().then(() => {
      if (current === index) preview.replaceWith(full);
    }, () => {});
  }

  function renderFilm(item) {
    const video = fit(document.createElement('video'), item);
    video.src = item.src;
    video.poster = item.thumb;
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    stage.append(video);
    video.play().catch(() => {});
  }

  function show(index) {
    current = (index + items.length) % items.length;
    const item = items[current];
    release();
    if (item.kind === 'film') renderFilm(item);
    else renderPhoto(item, current);
    indexLabel.textContent = `FRAGMENT / ${pad(current + 1)}`;
    caption.textContent = `${item.tag} · ${item.title}`;

    const next = items[(current + 1) % items.length];
    if (next.kind === 'photo') new Image().src = next.src;
  }

  function step(delta) {
    show(current + delta);
    hooks.onChange?.(current);
  }

  function open(list, index) {
    items = list;
    if (!dialog.open) returnFocus = document.activeElement;
    show(index);
    if (!dialog.open) dialog.showModal();
  }

  function close() {
    if (dialog.open) dialog.close();
  }

  function init(options = {}) {
    dialog = document.querySelector('[data-viewer]');
    if (!dialog) return;
    stage = dialog.querySelector('[data-viewer-stage]');
    indexLabel = dialog.querySelector('[data-viewer-index]');
    caption = dialog.querySelector('[data-viewer-caption]');
    hooks = options;

    dialog.querySelector('[data-viewer-close]').addEventListener('click', close);
    dialog.querySelectorAll('[data-viewer-step]').forEach((button) => {
      button.addEventListener('click', () => step(Number(button.dataset.viewerStep)));
    });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog || event.target === stage) close();
    });
    dialog.addEventListener('keydown', (event) => {
      if (event.target instanceof HTMLMediaElement) return;
      if (event.key === 'ArrowLeft') step(-1);
      else if (event.key === 'ArrowRight') step(1);
    });
    dialog.addEventListener('close', () => {
      stopVideo();
      current = -1;
      setTimeout(() => {
        if (!dialog.open) release();
      }, RELEASE_DELAY_MS);
      returnFocus?.focus({ preventScroll: true });
      returnFocus = null;
      hooks.onClose?.();
    });
  }

  YK.viewer = {
    init,
    open,
    close,
    isOpen: () => Boolean(dialog?.open),
  };
})();
