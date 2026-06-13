/**
 * Bootstrap: render the page from config, wire up audio gating, then start the
 * loader, navigation and carousels.
 */
(() => {
  const { data, render, initLoader, initNavigation, initCarousel } = window.YK;

  render(data);
  initNavigation();
  initCarousel();

  // Background music only unlocks at the reveal moment; clicks during loading are
  // ignored, and if autoplay is blocked the next user gesture starts playback.
  const bgm = document.getElementById('bgm');
  let unlocked = false;
  let playing = false;
  const startMusic = () => {
    if (playing || !unlocked) return;
    bgm.volume = 0.5;
    bgm.play().then(() => {
      playing = true;
      document.removeEventListener('click', startMusic);
      document.removeEventListener('keydown', startMusic);
    }).catch(() => {});
  };
  document.addEventListener('click', startMusic);
  document.addEventListener('keydown', startMusic);

  initLoader({
    bgm,
    onReveal() {
      document.body.classList.add('loaded');
      document.getElementById('panel-prologue').classList.add('intro');
      unlocked = true;
      startMusic();
    },
  });
})();
