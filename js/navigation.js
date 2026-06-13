/**
 * Panel switching driven by the nav labels and the prev/next arrows.
 *
 * Panels are ordered left→center→right. A switch holds briefly, slides the current
 * panel out, then swaps and replays the incoming panel's entrance stagger (.intro).
 */
window.YK = window.YK || {};

window.YK.initNavigation = () => {
  const bg = document.getElementById('bg');
  const navBtns = document.querySelectorAll('.nav-btn');
  const arrowPrev = document.getElementById('arrowPrev');
  const arrowNext = document.getElementById('arrowNext');

  const ORDER = ['asYouSeeMe', 'prologue', 'wander'];
  const BG_SHIFT = { asYouSeeMe: 'right', prologue: 'none', wander: 'left' };

  const EASE_EXIT = 'cubic-bezier(0.95, 0.05, 0.795, 0.035)';
  const EASE_ENTER = 'cubic-bezier(0.1, 0.9, 0.2, 1)';
  const HOLD = 110;
  const EXIT = 220;
  const ENTER = 460;

  let current = 'prologue';
  let transitioning = false;

  const panel = (name) => document.getElementById('panel-' + name);

  const updateArrows = () => {
    const idx = ORDER.indexOf(current);
    arrowPrev.classList.toggle('disabled', idx <= 0);
    arrowNext.classList.toggle('disabled', idx >= ORDER.length - 1);
  };

  const switchPanel = (next) => {
    if (next === current || transitioning) return;
    transitioning = true;

    const fromPanel = panel(current);
    const toPanel = panel(next);
    const forward = ORDER.indexOf(next) > ORDER.indexOf(current);
    const exitClass = forward ? 'exit-left' : 'exit-right';
    const navDir = forward ? 'from-right' : 'from-left';

    toPanel.classList.remove('intro');
    toPanel.style.transition = 'none';
    toPanel.style.opacity = '0';

    setTimeout(() => {
      fromPanel.classList.add(exitClass);
      fromPanel.style.transition = `opacity ${EXIT}ms ${EASE_EXIT}, transform ${EXIT}ms ${EASE_EXIT}`;
      fromPanel.style.opacity = '0';
      bg.setAttribute('data-shift', BG_SHIFT[next]);

      setTimeout(() => {
        fromPanel.classList.remove('active', exitClass, 'intro');
        fromPanel.style.opacity = '';
        fromPanel.style.transition = '';

        void toPanel.offsetWidth; // reflow so the fade + child stagger restart
        toPanel.style.transition = `opacity ${ENTER}ms ${EASE_ENTER}`;
        toPanel.style.opacity = '';
        toPanel.classList.add('active', 'intro');

        navBtns.forEach((btn) => {
          if (btn.dataset.panel !== next) return btn.classList.remove('active');
          btn.classList.add(navDir);
          void btn.offsetWidth;
          btn.classList.add('active');
          btn.classList.remove('from-left', 'from-right');
        });

        current = next;
        updateArrows();
        setTimeout(() => {
          toPanel.style.transition = '';
          transitioning = false;
        }, ENTER);
      }, EXIT);
    }, HOLD);
  };

  navBtns.forEach((btn) => btn.addEventListener('click', () => switchPanel(btn.dataset.panel)));

  const step = (delta) => {
    const idx = ORDER.indexOf(current) + delta;
    if (idx >= 0 && idx < ORDER.length) switchPanel(ORDER[idx]);
  };
  arrowPrev.addEventListener('click', () => step(-1));
  arrowNext.addEventListener('click', () => step(1));
  updateArrows();
};
