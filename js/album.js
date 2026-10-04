/* Fragments room: hidden entrances, the slide from the left, and history for album + viewer. */
(() => {
  const { root, pad } = YK;
  const Layer = Object.freeze({ ALBUM: 'album', VIEWER: 'viewer' });
  const HASH = '#fragments';

  const currentLayer = () => history.state?.layer;

  const readItem = (card) => {
    const image = card.querySelector('img');
    return {
      kind: card.dataset.kind,
      src: card.getAttribute('href'),
      thumb: image.getAttribute('src'),
      width: Number(image.getAttribute('width')),
      height: Number(image.getAttribute('height')),
      title: card.querySelector('.media-card__title').textContent,
      tag: card.querySelector('.media-card__tag').textContent,
    };
  };

  function init() {
    const album = document.querySelector('[data-album]');
    const page = document.querySelector('[data-page]');
    if (!album || !page) return;
    const grid = album.querySelector('[data-album-grid]');
    const closeButton = album.querySelector('[data-album-close]');
    const cards = [...grid.querySelectorAll('[data-kind]')];
    const items = cards.map(readItem);
    const viewer = YK.viewer;
    let trigger = null;

    const films = items.filter((item) => item.kind === 'film').length;
    album.querySelector('[data-album-count]').textContent = `${pad(items.length - films)} PHOTOS · ${pad(films)} FILMS`;

    const isOpen = () => root.classList.contains('is-album-open');

    const open = ({ push = true } = {}) => {
      if (isOpen()) return;
      trigger = document.activeElement;
      grid.hidden = false;
      album.inert = false;
      page.inert = true;
      root.classList.add('is-album-open');
      if (push) history.pushState({ layer: Layer.ALBUM }, '', HASH);
      closeButton.focus({ preventScroll: true });
    };

    const close = ({ fromHistory = false } = {}) => {
      if (!isOpen()) return;
      root.classList.remove('is-album-open');
      album.inert = true;
      page.inert = false;
      trigger?.focus({ preventScroll: true });
      trigger = null;
      if (!fromHistory && currentLayer() === Layer.ALBUM) history.back();
    };

    viewer?.init({
      onChange: (index) => history.replaceState({ layer: Layer.VIEWER, index }, ''),
      onClose: () => {
        if (currentLayer() === Layer.VIEWER) history.back();
      },
    });

    document.querySelectorAll('[data-album-open]').forEach((button) => {
      button.addEventListener('click', () => open());
    });
    closeButton.addEventListener('click', () => close());

    grid.addEventListener('click', (event) => {
      const card = event.target.closest('[data-kind]');
      if (!card || !viewer || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const index = cards.indexOf(card);
      history.pushState({ layer: Layer.VIEWER, index }, '');
      viewer.open(items, index);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen() && !viewer?.isOpen()) close();
    });

    addEventListener('popstate', (event) => {
      const state = event.state;
      if (state?.layer === Layer.VIEWER) {
        open({ push: false });
        viewer?.open(items, state.index);
        return;
      }
      viewer?.close();
      if (state?.layer === Layer.ALBUM) open({ push: false });
      else close({ fromHistory: true });
    });
  }

  YK.album = { init };
})();
