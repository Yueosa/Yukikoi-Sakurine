(() => {
  const bg = document.getElementById('bg');
  const panels = document.querySelectorAll('.panel');
  const navBtns = document.querySelectorAll('.nav-btn');
  const bgm = document.getElementById('bgm');

  // Panel order for direction logic: left=0, center=1, right=2
  const ORDER = { asYouSeeMe: 0, prologue: 1, beginUs: 2 };
  const BG_SHIFT = { asYouSeeMe: 'right', prologue: 'none', beginUs: 'left' };

  let current = 'prologue';
  let transitioning = false;

  function getPanel(name) {
    return document.getElementById('panel-' + name);
  }

  function switchPanel(next) {
    if (next === current || transitioning) return;
    transitioning = true;

    const fromPanel = getPanel(current);
    const toPanel = getPanel(next);
    const fromOrder = ORDER[current];
    const toOrder = ORDER[next];

    // Determine exit/enter directions
    const exitClass = toOrder > fromOrder ? 'exit-left' : 'exit-right';
    const enterClass = toOrder > fromOrder ? 'enter-right' : 'enter-left';

    // 1. Set enter panel initial position (off-screen direction), hidden
    toPanel.classList.add(enterClass);
    toPanel.style.transition = 'none';
    toPanel.style.opacity = '0';

    // 2. Fade out current panel
    fromPanel.classList.add(exitClass);
    fromPanel.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    fromPanel.style.opacity = '0';

    // 3. Shift background
    bg.setAttribute('data-shift', BG_SHIFT[next]);

    // 4. After exit, swap active and fade in new panel
    setTimeout(() => {
      fromPanel.classList.remove('active', exitClass);
      fromPanel.style.opacity = '';
      fromPanel.style.transition = '';

      // Force reflow so transition fires
      void toPanel.offsetWidth;

      toPanel.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      toPanel.style.opacity = '';
      toPanel.classList.add('active');
      toPanel.classList.remove(enterClass);

      // Update nav
      navBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.panel === next);
      });

      current = next;

      // Trigger BeginUs stagger if switching to it
      if (next === 'beginUs') triggerBeginUsStagger();

      setTimeout(() => {
        toPanel.style.transition = '';
        transitioning = false;
      }, 400);
    }, 300);
  }

  function triggerBeginUsStagger() {
    const cards = document.querySelectorAll('.site-card');
    cards.forEach(c => {
      c.classList.remove('visible');
      void c.offsetWidth;
    });
    cards.forEach((card, i) => {
      setTimeout(() => card.classList.add('visible'), i * 80);
    });
  }

  // Nav click handlers
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
  });

  // Background music: play on first user interaction
  let musicStarted = false;
  function startMusic() {
    if (musicStarted) return;
    musicStarted = true;
    bgm.volume = 0.5;
    bgm.play().catch(() => {});
    document.removeEventListener('click', startMusic);
    document.removeEventListener('keydown', startMusic);
  }
  document.addEventListener('click', startMusic);
  document.addEventListener('keydown', startMusic);
})();
