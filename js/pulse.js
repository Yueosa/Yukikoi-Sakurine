/* Pulse poster: a procedurally generated ECG segment travelling along its own path. */
(() => {
  const { random, randomInt, pick, reducedMotion } = YK;

  const WIDTH = 782;
  const BASELINE = 260;
  const MAX_ATTEMPTS = 12;
  // Repeated entries weight the pick.
  const P_WAVES = ['upright', 'upright', 'upright', 'inverted', 'absent'];
  const QRS_SHAPES = ['normal', 'normal', 'wide', 'rsr', 'low-voltage', 'notched-r'];
  const T_WAVES = ['upright', 'upright', 'inverted', 'biphasic'];
  const State = Object.freeze({ PREPARING: 'preparing', PLAYING: 'playing', FINISHED: 'finished' });

  function tracePath() {
    const parts = [`M0 ${BASELINE}`];
    let x = 0;
    const flat = (to) => {
      x = Math.round(to);
      parts.push(`H${x}`);
    };
    const line = (dx, y) => {
      x += Math.round(dx);
      parts.push(`L${x} ${Math.round(y)}`);
    };

    const beat = (start, scale) => {
      const step = (min, max) => randomInt(min, max) * (scale < .9 ? .64 : 1);
      flat(start);

      const p = pick(P_WAVES);
      if (p !== 'absent') {
        const height = randomInt(7, 18) * scale * (p === 'inverted' ? -1 : 1);
        line(step(11, 19), BASELINE - height);
        line(step(12, 21), BASELINE);
      }
      flat(x + step(35, 86));

      const qrs = pick(QRS_SHAPES);
      const voltage = qrs === 'low-voltage' ? random(.3, .48) : 1;
      const r = randomInt(125, 225) * scale * voltage;
      const s = randomInt(90, 195) * scale * voltage;
      const q = randomInt(9, 23) * scale * voltage;
      if (qrs === 'rsr') {
        line(step(8, 14), BASELINE + q);
        line(step(10, 17), BASELINE - r * .48);
        line(step(10, 17), BASELINE + s * .38);
        line(step(10, 17), BASELINE - r);
        line(step(13, 20), BASELINE + s);
        line(step(15, 24), BASELINE - randomInt(12, 30) * scale);
      } else if (qrs === 'notched-r') {
        line(step(9, 15), BASELINE + q);
        line(step(12, 18), BASELINE - r * .76);
        line(step(7, 12), BASELINE - r * .56);
        line(step(8, 13), BASELINE - r);
        line(step(15, 23), BASELINE + s);
        line(step(16, 25), BASELINE - randomInt(12, 28) * scale);
      } else {
        const width = qrs === 'wide' ? random(1.55, 2) : 1;
        line(step(9, 16) * width, BASELINE + q);
        line(step(13, 21) * width, BASELINE - r);
        line(step(16, 25) * width, BASELINE + s);
        line(step(16, 26) * width, BASELINE - randomInt(12, 32) * scale * voltage);
      }
      line(step(12, 24), BASELINE);
      flat(x + step(24, 62));

      const t = pick(T_WAVES);
      const tHeight = randomInt(21, 55) * scale * voltage;
      if (t === 'biphasic') {
        line(step(20, 36), BASELINE - tHeight);
        line(step(15, 28), BASELINE + tHeight * .55);
        line(step(18, 34), BASELINE);
      } else {
        line(step(28, 55), BASELINE + tHeight * (t === 'inverted' ? 1 : -1));
        line(step(30, 60), BASELINE);
      }
    };

    if (Math.random() < .34) {
      beat(randomInt(55, 105), random(.62, .82));
      beat(Math.max(x + randomInt(45, 80), randomInt(410, 470)), random(.62, .88));
    } else {
      beat(randomInt(95, 245), random(.82, 1.08));
    }
    if (x > WIDTH) return null;
    if (x < WIDTH) flat(WIDTH);
    return parts.join(' ');
  }

  function generatePath() {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const path = tracePath();
      if (path) return path;
    }
    return `M0 ${BASELINE} H${WIDTH}`;
  }

  function init() {
    const poster = document.querySelector('[data-pulse]');
    const signal = poster?.querySelector('[data-pulse-signal]');
    if (!signal) return;

    if (reducedMotion.matches) {
      signal.setAttribute('d', generatePath());
      return;
    }

    const setState = (state) => {
      poster.dataset.state = state;
    };

    // The path only changes while the signal is invisible, so a new shape never pops in.
    const prepare = () => {
      setState(State.PREPARING);
      const segment = random(.16, .27);
      signal.setAttribute('d', generatePath());
      signal.style.setProperty('--signal-segment', `${segment.toFixed(3)}px`);
      signal.style.setProperty('--signal-gap', `${(1 - segment).toFixed(3)}px`);
      signal.style.setProperty('--signal-duration', `${randomInt(5000, 6200)}ms`);
      requestAnimationFrame(() => requestAnimationFrame(() => setState(State.PLAYING)));
    };

    signal.addEventListener('animationend', (event) => {
      if (event.animationName !== 'signal-travel' || poster.dataset.state !== State.PLAYING) return;
      setState(State.FINISHED);
      setTimeout(prepare, randomInt(60, 320));
    });

    new IntersectionObserver(([entry]) => {
      poster.classList.toggle('is-paused', !entry.isIntersecting);
    }).observe(poster);

    prepare();
  }

  YK.pulse = { init };
})();
